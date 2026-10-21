import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "野獣の日スペシャル（2026.8.10）アーカイブ",
  description:
    "2026年8月10日開催「マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル」のアーカイブ。全514曲・27時間48分の番組表、放送録音のタイムシフト再生、音源とツイートデータのダウンロードを公開しています。",
};

const LINKS = [
  {
    href: "/archive/2026-08-10/timetable",
    title: "📋 番組表",
    desc: "514曲の再生順・開始時刻・リクエスト元",
  },
  {
    href: "/archive/2026-08-10/listen",
    title: "🎧 ライブ再生",
    desc: "録音4パート＋その時刻のツイート",
  },
  {
    href: "/archive/2026-08-10/download",
    title: "⬇ ダウンロード",
    desc: "音源（約1.2GB）・ツイートデータ",
  },
];

export default function ArchiveDetailPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-amber-400">
          過去のイベント（アーカイブ）
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-100">野獣の日スペシャル</h1>
        <p className="mt-2 font-mono text-sm text-zinc-400">
          2026.8.10（月）19:00 → 8.11（火）22:48
        </p>
        <p className="mt-1 text-xs text-zinc-500">@maebahesioru2 の X スペース</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "収録曲数", value: "514曲" },
          { label: "総再生時間", value: "27時間48分" },
          { label: "開始", value: "8/10 19:00" },
          { label: "終了", value: "8/11 22:48" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <div className="text-sm font-black text-amber-400">{c.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 transition hover:border-amber-500/60 hover:bg-zinc-900"
          >
            <div className="text-sm font-bold text-zinc-100">{l.title}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{l.desc}</div>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-bold text-zinc-200">この回について</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          8月10日（野獣の日）の夜から翌日にかけて行われたオールナイト放送です。リクエストはXのリプライとDMで受け付け、
          再生するたびにスペースのリプライ欄へ曲名・曲数カウント・リクエスト者名を投稿しました。
          放送中に投稿されたツイートは7,452件、うちハッシュタグ付きは7,726件分をデータとして保存しています。
        </p>
      </section>

      <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
        <Link href="/archive" className="text-amber-400 underline decoration-amber-500/40">
          過去のイベント一覧
        </Link>
        に戻る
      </p>
    </main>
  );
}
