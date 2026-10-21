import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "過去のイベント（アーカイブ）",
  description:
    "マニアスプレッダーのサンサンサンデーの過去イベント一覧。番組表・放送録音・音源とツイートデータをイベントごとにまとめて公開しています。",
};

const ARCHIVES = [
  {
    slug: "2026-08-10",
    name: "野獣の日スペシャル",
    dateLabel: "2026.8.10（月）19:00 → 8.11（火）22:48",
    songs: 514,
    totalLabel: "27時間48分",
    note: "8月10日（野獣の日）の夜から翌日にかけて行われたオールナイト放送。",
  },
];

export default function ArchiveIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-amber-400">ARCHIVE</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-100">📚 過去のイベント</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          終了したイベントの記録です。各イベントの番組表・放送録音・音源とツイートデータをまとめて公開しています。
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {ARCHIVES.map((a) => (
          <Link
            key={a.slug}
            href={`/archive/${a.slug}`}
            className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-amber-500/60"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-black text-zinc-100">{a.name}</h2>
              <span className="font-mono text-xs text-zinc-500">{a.dateLabel}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{a.note}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>🎵 全{a.songs}曲</span>
              <span>⏱ {a.totalLabel}</span>
              <span className="text-amber-400">アーカイブを見る →</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-zinc-600">
        現在開催中・開催予定のイベントは
        <Link href="/" className="mx-1 text-amber-400 underline decoration-amber-500/40">
          トップページ
        </Link>
        をご確認ください。
      </p>
    </main>
  );
}
