import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "fs";
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
 * body.type === "playlist" の場合は番組表データ（songs.json + playlist.csv）を保存する。
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
    if (!body) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const dir = path.join(process.cwd(), "public", "data");
    mkdirSync(dir, { recursive: true });

    // 番組表データの同期（デプロイ不要で番組表を更新）
    if (body.type === "playlist") {
      if (typeof body.songs_json !== "object" || typeof body.playlist_csv !== "string") {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      const songsPath = path.join(dir, "songs.json");
      const csvPath = path.join(dir, "playlist.csv");
      writeFileSync(songsPath, JSON.stringify(body.songs_json, null, 1), "utf-8");
      writeFileSync(csvPath, body.playlist_csv, "utf-8");
      return NextResponse.json({ ok: true });
    }

    // 現在再生中の曲情報の同期
    if (typeof body.song_idx !== "number") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const p = path.join(dir, "now_playing.json");
    writeFileSync(p, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}

/**
 * 放送終了時に now_playing.json を削除する（「放送中」表示を消す）。
 * 認証: X-API-Key ヘッダー（環境変数 SYNC_TOKEN と一致必須）
 */
export async function DELETE() {
  const h = await headers();
  const token = h.get("x-api-key") || "";
  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const p = path.join(process.cwd(), "public", "data", "now_playing.json");
  if (existsSync(p)) {
    rmSync(p);
  }
  return NextResponse.json({ ok: true });
}
