import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ライブ再生",
  description:
    "マニアスプレッダーのサンサンサンデー エロウィンSP（2026年10月31日 18時〜）のライブ再生ページ。放送録音の公開は放送終了後になります。前回「野獣の日スペシャル」の録音はアーカイブページで再生できます。",
};

export default function ListenPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-amber-400">
          サンサンサンデー 2026 エロウィンSP
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-100">🎧 ライブ再生</h1>
      </div>

      <section className="mt-8 rounded-3xl border border-dashed border-amber-500/40 bg-amber-500/[0.04] px-6 py-12 text-center">
        <p className="text-xs font-bold tracking-widest text-amber-400">2026.10.31（土）18:00〜</p>
        <h2 className="mt-3 text-2xl font-black text-zinc-100">録音は放送終了後に公開します</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          スペースは録音機能をオンにして配信するため、終了後はこのページで
          <span className="font-bold text-zinc-200">放送録音のタイムシフト再生</span>
          ができます。再生すると、その同時刻に投稿されたツイートが流れてきます。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://forms.gle/GWPTiyECSvSa4ZMT9"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            匿名でリクエスト（Googleフォーム）
          </a>
          <a
            href="/archive/2026-08-10/listen"
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-400"
          >
            📚 前回の録音を聞く
          </a>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-bold text-zinc-200">前回（野獣の日スペシャル）のアーカイブ</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          2026年8月10日開催・全514曲／27時間48分の放送録音とツイートは、アーカイブページに分離しました。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/archive/2026-08-10/listen"
            className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
          >
            🎧 録音を再生
          </a>
          <a
            href="/archive/2026-08-10/timetable"
            className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
          >
            📋 番組表
          </a>
          <a
            href="/archive/2026-08-10/download"
            className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
          >
            ⬇ 音源・ツイートデータ
          </a>
        </div>
      </section>
    </main>
  );
}
