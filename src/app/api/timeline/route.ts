import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET(request: Request) {
  // ?archive=YYYY-MM-DD が指定されたら、アーカイブ済みの過去イベント用データを返す
  const archive = new URL(request.url).searchParams.get("archive");
  const safe = archive && /^\d{4}-\d{2}-\d{2}$/.test(archive) ? archive : null;
  const p = safe
    ? path.join(process.cwd(), "public", "archive", safe, "timeline.json")
    : path.join(process.cwd(), "public", "data", "timeline.json");
  if (!existsSync(p)) {
    return NextResponse.json([]);
  }
  const data = readFileSync(p, "utf-8");
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // データは固定なので1日キャッシュ（ブラウザ+CDN）
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
