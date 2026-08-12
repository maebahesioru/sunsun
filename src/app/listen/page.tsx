"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PARTS = [
  { id: "part1", label: "Part1（野獣の日SP・本放送）", dur: 24774 },
  { id: "part2", label: "Part2", dur: 64444 },
  { id: "part3", label: "Part3", dur: 15037 },
  { id: "part4", label: "Part4（エンディング）", dur: 859 },
];
const OFFSETS = [0, 24774, 89218, 104255];
const BASE = new Date("2026-08-10T19:00:00+09:00").getTime() / 1000;

type Tweet = {
  t: number;
  sn: string;
  nm: string;
  tx: string;
  lk: number;
  rt: number;
};

function fmt(ts: number) {
  const d = new Date(ts * 1000);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export default function ListenPage() {
  const [part, setPart] = useState(0);
  const [pos, setPos] = useState(0);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/timeline.json")
      .then((r) => r.json())
      .then((d) => setTweets(d))
      .catch(() => {});
  }, []);

  const realTime = BASE + OFFSETS[part] + pos;
  const visible = useMemo(
    () =>
      tweets
        .filter((t) => Math.abs(t.t - realTime) <= 300)
        .sort((a, b) => a.t - b.t),
    [tweets, realTime],
  );

  // 新しいツイートが出たら下へ自動スクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black text-zinc-100">🎧 ライブ再生</h1>
      <p className="mt-2 text-sm text-zinc-400">
        放送録音を再生すると、その同時刻に投稿されたツイートが流れてきます。
      </p>

      {/* パート選択 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {PARTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setPart(i);
              setPos(0);
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              part === i
                ? "bg-amber-500 text-zinc-950"
                : "border border-zinc-700 text-zinc-300 hover:border-amber-500/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* プレイヤー */}
      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          src={`/api/download?file=${PARTS[part].id}.m4a&play=1`}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          className="w-full"
        />
        <div className="mt-2 text-xs text-zinc-500">
          🕐 再生位置の実時刻:{" "}
          <span className="font-bold text-amber-400">
            {fmt(realTime)}
          </span>
          （前後5分のツイート {visible.length} 件表示中）
        </div>
      </div>

      {/* ツイートタイムライン */}
      <div className="mt-4">
        <div className="mb-2 text-xs font-bold text-zinc-500">
          📡 同時刻のツイート
        </div>
        <div
          ref={scrollRef}
          className="h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
        >
          {visible.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-600">
              この時間帯のツイートはありません…
            </div>
          ) : (
            visible.map((t, i) => (
              <div
                key={`${t.t}-${t.sn}-${i}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
              >
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="font-mono">{fmt(t.t)}</span>
                  <span className="font-bold text-zinc-300">
                    {t.nm || t.sn}
                  </span>
                  <span className="text-zinc-600">@{t.sn}</span>
                  {(t.lk > 0 || t.rt > 0) && (
                    <span className="ml-auto text-zinc-600">
                      ♥ {t.lk}・RT {t.rt}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                  {t.tx}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
