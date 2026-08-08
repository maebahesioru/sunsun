import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/** 放送スクリプトとの同期トークン（環境変数 SYNC_TOKEN で設定） */
const SYNC_TOKEN = process.env.SYNC_TOKEN || "";

/**
 * 放送スクリプトが書き出す now_playing.json を返す。
 * 放送前/ファイル無しの場合は 404（クライアントは時刻計算にフォールバック）。
 */
export async function GET() {
  const p = path.join(process.cwd(), "public", "data", "now_playing.json");
  if (!existsSync(p)) {
    return NextResponse.json({ error: "not_playing" }, { status: 404 });
  }
  try {
    const raw = readFileSync(p, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "not_playing" }, { status: 404 });
  }
}

/**
 * ローカルの放送スクリプトから現在再生中の曲情報を受信して保存する。
 * 認証: X-API-Key ヘッダー（環境変数 SYNC_TOKEN と一致必須）
 */
export async function POST(request: Request) {
  const h = await headers();
  const token = h.get("x-api-key") || "";
  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body || typeof body.song_idx !== "number") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const dir = path.join(process.cwd(), "public", "data");
    mkdirSync(dir, { recursive: true });
    const p = path.join(dir, "now_playing.json");
    writeFileSync(p, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
