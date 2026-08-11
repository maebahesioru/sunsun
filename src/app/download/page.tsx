import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダウンロード",
  description:
    "マニアスプレッダーのサンサンサンデー2026の放送録音・ツイートデータをダウンロードできます。いつでも聞き直せるアーカイブです。",
};

const FILES = [
  {
    file: "part1.m4a",
    title: "マニアスプレッダーのサンサンサンデー2026 野獣の日SP",
    size: "281MB",
    desc: "本放送 Part1",
  },
  {
    file: "part2.m4a",
    title: "マニアスプレッダーのサンサンサンデー2026SP Part2",
    size: "731MB",
    desc: "Part2",
  },
  {
    file: "part3.m4a",
    title: "マニアスプレッダーのサンサンサンデー2026SP Part3",
    size: "171MB",
    desc: "Part3",
  },
  {
    file: "part4.m4a",
    title: "マニアスプレッダーのサンサンサンデー2026SP Part4",
    size: "9.8MB",
    desc: "Part4（エンディング）",
  },
  {
    file: "tweets.csv",
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
        サンサンサンデー2026の放送録音とツイートデータのアーカイブです。いつでも聞き直せます。
      </p>

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
            <a
              href={`/downloads/${f.file}`}
              download={f.title.includes("m4a") ? undefined : "tweets.csv"}
              className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-amber-400"
            >
              ⬇ ダウンロード
            </a>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-zinc-600">
        ※ 録音はすべて「マニアスプレッダーのサンサンサンデー2026」のアーカイブです。
      </p>
    </main>
  );
}
