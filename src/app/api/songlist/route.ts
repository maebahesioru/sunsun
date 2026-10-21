import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET(request: Request) {
  // ?archive=YYYY-MM-DD が指定されたら、アーカイブ済みの過去イベント用データを返す
  const archive = new URL(request.url).searchParams.get("archive");
  const safe = archive && /^\d{4}-\d{2}-\d{2}$/.test(archive) ? archive : null;
  const p = safe
    ? path.join(process.cwd(), "public", "archive", safe, "songlist.json")
    : path.join(process.cwd(), "public", "data", "songlist.json");
  if (!existsSync(p)) {
    return NextResponse.json([]);
  }
  const data = readFileSync(p, "utf-8");
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // データ更新があるためキャッシュなし（確実に最新を返す）
      "Cache-Control": "no-cache, no-store",
    },
  });
}
