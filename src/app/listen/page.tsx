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
  img: string;
  mt: string;
  md: string;
  qn: string;
  qt: string;
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
  const [query, setQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => setTweets(d))
      .catch(() => {});
  }, []);

  // URLパラメータ ?part=N で初期パート指定（N: 1-4）
  useEffect(() => {
    const p = parseInt(
      new URLSearchParams(window.location.search).get("part") || "1",
      10,
    );
    if (p >= 1 && p <= 4 && p - 1 !== part) setPart(p - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePart = (i: number) => {
    setPart(i);
    setPos(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    const url = new URL(window.location.href);
    url.searchParams.set("part", String(i + 1));
    window.history.replaceState(null, "", url.toString());
  };

  const realTime = BASE + OFFSETS[part] + pos;

  // 再生位置まで（+未来5分）のツイートを累積表示
  const visible = useMemo(
    () =>
      tweets
        .filter((t) => t.t <= realTime + 300)
        .sort((a, b) => a.t - b.t),
    [tweets, realTime],
  );

  // 検索（入力中は全ツイートから）
  const filtered = useMemo(() => {
    if (!query.trim()) return visible;
    const q = query.trim().toLowerCase();
    return tweets
      .filter(
        (t) =>
          t.tx.toLowerCase().includes(q) ||
          t.nm.toLowerCase().includes(q) ||
          t.sn.toLowerCase().includes(q) ||
          t.qn.toLowerCase().includes(q),
      )
      .sort((a, b) => a.t - b.t);
  }, [tweets, query, visible]);

  // ツイートの時刻へジャンプ（該当Partを自動選択してシーク）
  const jumpTo = (t: number) => {
    const pi = PARTS.findIndex(
      (p, i) => t >= BASE + OFFSETS[i] && t < BASE + OFFSETS[i] + p.dur,
    );
    if (pi < 0) return;
    setPart(pi);
    const target = t - (BASE + OFFSETS[pi]);
    setPos(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      audioRef.current.play().catch(() => {});
    }
  };

  // 新しいツイートが出たら下へ自動スクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (el && !query) el.scrollTop = el.scrollHeight;
  }, [filtered.length, query]);

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
            onClick={() => changePart(i)}
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
          onSeeked={(e) => setPos(e.currentTarget.currentTime)}
          className="w-full"
        />
        <div className="mt-2 text-xs text-zinc-500">
          🕐 再生位置の実時刻:{" "}
          <span className="font-bold text-amber-400">{fmt(realTime)}</span>
          （ここまでのツイート {visible.length} 件）
        </div>
      </div>

      {/* 検索 */}
      <div className="mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 ツイートを検索（テキスト・名前・@ID）… クリックでその時刻にジャンプ"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500/60"
        />
      </div>

      {/* ツイートタイムライン */}
      <div className="mt-4">
        <div className="mb-2 text-xs font-bold text-zinc-500">
          {query ? `🔍 検索結果 ${filtered.length} 件` : "📡 同時刻のツイート"}
        </div>
        <div
          ref={scrollRef}
          className="h-[480px] space-y-2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
        >
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-600">
              {query ? "検索結果がありません…" : "この時間帯のツイートはありません…"}
            </div>
          ) : (
            filtered.map((t, i) => (
              <div
                key={`${t.t}-${t.sn}-${i}`}
                onClick={() => jumpTo(t.t)}
                className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-amber-500/40"
                title="クリックでこの時刻にジャンプ"
              >
                <div className="flex items-start gap-2">
                  {t.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.img}
                      alt=""
                      className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-zinc-800"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="font-bold text-zinc-300">
                        {t.nm || t.sn}
                      </span>
                      <span className="text-zinc-600">@{t.sn}</span>
                      <span className="font-mono">{fmt(t.t)}</span>
                      {(t.lk > 0 || t.rt > 0) && (
                        <span className="ml-auto text-zinc-600">
                          ♥ {t.lk}・RT {t.rt}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                      {t.tx}
                    </p>

                    {/* 引用ツイート */}
                    {t.qn && (
                      <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-400">
                        <span className="font-bold text-zinc-500">@{t.qn}</span>
                        : {t.qt}
                      </div>
                    )}

                    {/* 画像 */}
                    {t.mt === "photo" && t.md && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.md}
                        alt=""
                        loading="lazy"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(t.md, "_blank");
                        }}
                        className="mt-2 max-h-52 cursor-zoom-in rounded-lg border border-zinc-800"
                      />
                    )}
                    {/* 動画 */}
                    {t.mt === "video" && t.md && (
                      <video
                        src={t.md}
                        controls
                        preload="none"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 max-h-52 rounded-lg border border-zinc-800"
                      />
                    )}
                    {/* GIF */}
                    {t.mt === "animated_gif" && t.md && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.md}
                        alt=""
                        loading="lazy"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(t.md, "_blank");
                        }}
                        className="mt-2 max-h-52 cursor-zoom-in rounded-lg border border-zinc-800"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
