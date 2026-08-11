import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /data/ 以下の静的ファイル（playlist.csv・songs.json等）をキャッシュさせない
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/data/")) {
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, max-age=0, must-revalidate"
    );
  }
  return response;
}

export const config = {
  matcher: "/data/:path*",
};
