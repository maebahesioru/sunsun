"use client";

import { useEffect, useState } from "react";

function formatDate(date: Date): string {
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const week = ["日", "月", "火", "水", "木", "金", "土"][jst.getDay()];
  const time = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
  return `${jst.getMonth() + 1}/${jst.getDate()}（${week}）${time}`;
}

function formatTotal(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}時間${m}分`;
}

/**
 * 統計カード（収録曲数・総再生時間・開始予定・終了予定）
 * 放送開始後は実際の開始時刻に自動追従する
 */
export default function StatsCards({
  totalSongs,
  totalSec,
  startDateMs,
  durations,
}: {
  totalSongs: number;
  totalSec: number;
  startDateMs: number;
  durations: number[];
}) {
  const [baseMs, setBaseMs] = useState<number | null>(null);

  // 実際の放送開始時刻を取得（放送開始後に自動追従）
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || typeof data.song_idx !== "number" || !data.started_at) return;
        let cum = 0;
        for (let i = 0; i < data.song_idx && i < durations.length; i++) {
          cum += durations[i] || 0;
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
  }, [durations]);

  const base = baseMs ?? startDateMs;
  const end = new Date(base + totalSec * 1000);

  const cards = [
    { label: "収録曲数", value: `${totalSongs}曲` },
    { label: "総再生時間", value: formatTotal(totalSec) },
    { label: "開始予定", value: formatDate(new Date(base)) },
    { label: "終了予定", value: formatDate(end) },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
        >
          <div className="text-sm font-black text-amber-400">{s.value}</div>
          <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
