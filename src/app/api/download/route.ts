import { NextRequest } from "next/server";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file") || "";
  const safe = path.basename(file); // パストラバーサル防止
  const p = path.join(process.cwd(), "public", "downloads", safe);
  if (!existsSync(p)) {
    return new Response("Not Found", { status: 404 });
  }
  const info = await stat(p);
  const ext = path.extname(safe).toLowerCase();
  const type = ext === ".m4a" ? "audio/mp4" : "text/csv; charset=utf-8";
  const stream = createReadStream(p);
  const web = Readable.toWeb(stream) as unknown as ReadableStream;
  return new Response(web, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${safe}"`,
    },
  });
}
