import { readFileSync, existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
