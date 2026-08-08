"use client";

import { useEffect, useMemo, useState } from "react";

export type SongListItem = {
  idx: number; // 0-based（NowPlayingの強調表示と一致）
  number: number; // 1-based（表示用）
  title: string;
  display_name: string;
  user: string;
  source: string;
  duration_sec: number;
  start_label: string;
  duration_label: string;
  url: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

export default function SongList({
  songs,
  startDateMs,
}: {
  songs: SongListItem[];
  startDateMs: number;
}) {
  const [query, setQuery] = useState("");
  const [baseMs, setBaseMs] = useState<number | null>(null);

  // 実際の放送開始時刻を取得して自動追従（放送開始後は番組表の時刻が全部ずれる）
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || typeof data.song_idx !== "number" || !data.started_at) return;
        // 実際の開始時刻 = 現在曲の開始時刻 - そこまでの累積時間
        let cum = 0;
        for (let i = 0; i < data.song_idx && i < songs.length; i++) {
          cum += songs[i].duration_sec || 0;
        }
        const actualStart = new Date(data.started_at).getTime() - cum * 1000;
        if (!cancelled && !isNaN(actualStart)) setBaseMs(actualStart);
      } catch {
        /* 放送前や一時エラーは無視 */
      }
    };
    tick();
    const timer = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [songs]);

  const base = baseMs ?? startDateMs;

  // 基準時刻から各曲の実際の開始時刻を計算
  const timed = useMemo(() => {
    let cum = 0;
    return songs.map((s) => {
      const startMs = base + cum * 1000;
      cum += s.duration_sec || 0;
      return { ...s, start_label: `▶ ${formatTime(new Date(startMs))}` };
    });
  }, [songs, base]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return timed;
    return timed.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.display_name.toLowerCase().includes(q) ||
        s.user.toLowerCase().includes(q) ||
        s.number.toString().includes(q) ||
        s.number.toString().padStart(3, "0").includes(q)
    );
  }, [query, timed]);

  return (
    <div className="mt-6 space-y-2">
      {/* 検索ボックス */}
      <div className="sticky top-14 z-40 -mx-1 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-3 backdrop-blur">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 曲名・表示名・番号で検索…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            {query ? `${filtered.length} / ${songs.length} 曲` : `全${songs.length}曲`}
          </span>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded px-2 py-0.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              クリア ✕
            </button>
          )}
        </div>
      </div>

      {/* 曲リスト */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
          該当する曲が見つかりません
        </div>
      ) : (
        filtered.map((song) => (
          <div
            key={song.idx}
            id={`song-${song.idx}`}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-amber-500/50 hover:bg-zinc-900"
          >
            <div className="flex w-14 shrink-0 flex-col items-center">
              <span className="song-number text-xl font-black text-zinc-600 group-hover:text-amber-400">
                {String(song.number).padStart(3, "0")}
              </span>
              <span className="mt-0.5 text-[10px] text-zinc-600">曲目</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-zinc-100" title={song.title}>
                {song.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                {song.source === "DM" && song.display_name === "匿名" ? (
                  <span className="font-semibold text-purple-300">匿名</span>
                ) : (
                  <>
                    <span className="font-semibold text-zinc-300">
                      {song.display_name || song.user}
                    </span>
                    {song.user && (
                      <a
                        href={`https://x.com/${song.user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-sky-500/20 hover:text-sky-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{song.user}
                      </a>
                    )}
                  </>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    song.source === "DM"
                      ? "bg-purple-500/20 text-purple-300"
                      : song.source === "特殊"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-sky-500/20 text-sky-300"
                  }`}
                >
                  {song.source === "DM" ? "匿名DM" : song.source === "特殊" ? "特殊" : "リプライ"}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs font-bold text-amber-400">{song.start_label}</div>
              <div className="font-mono text-sm font-bold text-zinc-300">
                {song.duration_label}
              </div>
              {song.url && (
                <a
                  href={song.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-zinc-500 underline-offset-2 hover:text-amber-400 hover:underline"
                >
                  音源を開く ↗
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
