import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダウンロード",
  description:
    "マニアスプレッダーのサンサンサンデー2026の放送録音・ツイートデータのアーカイブです。前回「野獣の日スペシャル」（2026年8月10日開催）の全記録を、いつでも聞き直せます。",
};

const FILES = [
  {
    file: "part1.m4a",
    title: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル（本放送 Part1）",
    size: "281MB",
    desc: "本放送 Part1",
  },
  {
    file: "part2.m4a",
    title: "…野獣の日スペシャル Part2",
    size: "731MB",
    desc: "Part2",
  },
  {
    file: "part3.m4a",
    title: "…野獣の日スペシャル Part3",
    size: "171MB",
    desc: "Part3",
  },
  {
    file: "part4.m4a",
    title: "…野獣の日スペシャル Part4",
    size: "9.8MB",
    desc: "Part4（エンディング）",
  },
  {
    file: "sunsun.csv",
    title: "ツイートデータ（#マニアスプレッダーのサンサンサンデー）",
    size: "11MB",
    desc: "ハッシュタグツイート7,726件のCSV",
  },
];

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black text-zinc-100">ダウンロード</h1>
      <p className="mt-2 text-sm text-zinc-400">
        前回「野獣の日スペシャル」（2026年8月10日 19:00〜8月11日 22:48・全514曲）の放送録音とツイートデータのアーカイブです。今回のエロウィンSPの録音は、放送終了後にここへ追加します。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="/listen?part=1"
          className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-amber-400"
        >
          ▶ ライブ再生はこちら
        </a>
        <a
          href="/timetable"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60"
        >
          番組表
        </a>
      </div>

      <div className="mt-8 space-y-3">
        {FILES.map((f) => (
          <div
            key={f.file}
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-amber-500/50"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-zinc-100">
                {f.title}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {f.desc}・{f.size}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {f.file.endsWith(".m4a") && (
                <a
                  href={`/listen?part=${FILES.indexOf(f) + 1}`}
                  className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
                >
                  ▶ サイト内再生
                </a>
              )}
              <a
                href={`/api/download?file=${f.file}`}
                className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-amber-400"
              >
                ⬇ ダウンロード
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-zinc-600">
        ※ 録音はすべて前回「マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル」のアーカイブです。
      </p>
    </main>
  );
}
