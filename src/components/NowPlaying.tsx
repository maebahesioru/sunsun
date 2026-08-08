"use client";

import { useEffect, useRef, useState } from "react";

export type ScheduleItem = {
  idx: number;
  startMs: number;
  durationSec: number;
};

type Phase = "before" | "playing" | "after";

export default function NowPlaying({ schedule }: { schedule: ScheduleItem[] }) {
  const [state, setState] = useState<{ nowIdx: number | null; phase: Phase }>({
    nowIdx: null,
    phase: "before",
  });
  // 放送スクリプトが書き出す now_playing.json と同期する（スペース進行連動）
  const [remoteIdx, setRemoteIdx] = useState<number | null>(null);
  const scrolled = useRef(false);
  const remoteRef = useRef<number | null>(null);

  // 放送スクリプト同期: 3秒ごとに now_playing.json を fetch
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.song_idx === "number" && !cancelled) {
            setRemoteIdx(data.song_idx);
            remoteRef.current = data.song_idx;
          }
        }
      } catch {
        /* まだ放送が始まっていない or ファイルが無い */
      }
    };
    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (schedule.length === 0) return;

    const tick = () => {
      const now = Date.now();
      let nowIdx: number | null = null;
      let phase: Phase = "before";

      // 放送スクリプト同期が有効ならそちらを優先
      const remote = remoteRef.current;
      if (remote !== null && remote >= 0 && remote < schedule.length) {
        nowIdx = remote;
        phase = "playing";
      } else if (now < schedule[0].startMs) {
        phase = "before";
      } else if (
        now >=
        schedule[schedule.length - 1].startMs +
          schedule[schedule.length - 1].durationSec * 1000
      ) {
        phase = "after";
      } else {
        phase = "playing";
        for (const s of schedule) {
          if (now >= s.startMs && now < s.startMs + s.durationSec * 1000) {
            nowIdx = s.idx;
            break;
          }
        }
      }
      setState({ nowIdx, phase });

      // 初回ロード時のみ「現在の曲」までスクロール
      if (!scrolled.current) {
        scrolled.current = true;
        requestAnimationFrame(() => {
          let targetId: string;
          if (nowIdx !== null) {
            targetId = `song-${nowIdx}`;
          } else if (phase === "before") {
            targetId = "timetable-top";
          } else {
            targetId = `song-${schedule[schedule.length - 1].idx}`;
          }
          document.getElementById(targetId)?.scrollIntoView({
            behavior: "auto",
            block: "start",
          });
        });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [schedule]);

  // 現在の曲の強調表示
  useEffect(() => {
    document
      .querySelectorAll("[data-nowplaying]")
      .forEach((el) => el.removeAttribute("data-nowplaying"));
    if (state.nowIdx !== null) {
      document
        .getElementById(`song-${state.nowIdx}`)
        ?.setAttribute("data-nowplaying", "true");
    }
  }, [state.nowIdx]);

  if (schedule.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div
        className={`rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur ${
          state.phase === "playing"
            ? "animate-pulse bg-amber-500 text-zinc-950"
            : state.phase === "before"
              ? "bg-zinc-800/90 text-zinc-300"
              : "bg-zinc-800/90 text-zinc-500"
        }`}
      >
        {state.phase === "before" && "⏳ 開演前（19:00 開始予定）"}
        {state.phase === "playing" &&
          state.nowIdx !== null &&
          `▶ 放送中: ${String(state.nowIdx + 1).padStart(3, "0")}曲目`}
        {state.phase === "after" && "🏁 放送終了"}
      </div>
    </div>
  );
}
