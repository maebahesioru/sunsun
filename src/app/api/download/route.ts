import { NextRequest } from "next/server";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file") || "";
  const play = req.nextUrl.searchParams.get("play") === "1";
  const safe = path.basename(file); // パストラバーサル防止
  const p = path.join(process.cwd(), "public", "downloads", safe);
  if (!existsSync(p)) {
    return new Response("Not Found", { status: 404 });
  }
  const info = await stat(p);
  const ext = path.extname(safe).toLowerCase();
  const type = ext === ".m4a" ? "audio/mp4" : "text/csv; charset=utf-8";

  // Range リクエスト対応（シーク再生用）
  const range = req.headers.get("range");
  if (range && /^bytes=/.test(range)) {
    const m = range.match(/bytes=(\d+)-(\d*)/);
    const start = m ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : Math.min(start + 4 * 1024 * 1024, info.size - 1);
    if (start >= info.size || start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }
    const stream = createReadStream(p, { start, end });
    const web = Readable.toWeb(stream) as unknown as ReadableStream;
    return new Response(web, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = createReadStream(p);
  const web = Readable.toWeb(stream) as unknown as ReadableStream;
  return new Response(web, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Content-Disposition": play
        ? "inline"
        : `attachment; filename="${safe}"`,
    },
  });
}
