import type { Metadata } from "next";
import ListenClient from "@/components/ListenClient";

export const metadata: Metadata = {
  title: "野獣の日スペシャル ライブ再生（アーカイブ）",
  description:
    "2026年8月10日開催「マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル」の放送録音アーカイブです。再生すると、その同時刻に投稿されたツイートが流れてきます。",
};

export default function ArchiveListenPage() {
  return (
    <ListenClient
      baseIso="2026-08-10T19:00:00+09:00"
      archive="2026-08-10"
      downloadHref="/archive/2026-08-10/download"
      timetableHref="/archive/2026-08-10/timetable"
    />
  );
}
