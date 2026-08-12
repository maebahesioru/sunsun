import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const p = path.join(process.cwd(), "public", "data", "timeline.json");
  if (!existsSync(p)) {
    return NextResponse.json([]);
  }
  const data = readFileSync(p, "utf-8");
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
