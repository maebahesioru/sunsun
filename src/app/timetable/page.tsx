import { existsSync, readFileSync, statSync } from "fs";
import path from "path";
import NowPlaying, { type ScheduleItem } from "@/components/NowPlaying";
import SongList, { type SongListItem } from "@/components/SongList";

export const dynamic = "force-dynamic";

type Song = {
  id: number;
  user: string;
  display_name: string;
  song_id: string;
  title: string;
  duration_sec: number;
  url: string;
  source: string;
};

type EventData = {
  event: {
    name: string;
    date: string;
    place: string;
    request_period: string;
    hash_tags: string[];
  };
  songs: Song[];
  total_songs: number;
  total_sec: number;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result.map((v) => v.replace(/\r$/, ""));
}

function parsePlaylistCsv(csv: string): Song[] {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => {
    const c = parseCsvLine(line);
    return {
      id: Number(c[0]) || 0,
      user: c[3] ?? "",
      display_name: c[2] ?? "",
      song_id: "",
      title: c[1] ?? "",
      duration_sec: Number(c[4]) || 0,
      url: c[5] ?? "",
      source: c[6] ?? "",
    };
  });
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotal(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}時間${m}分`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

// 放送開始時刻（19時ちょうど開始の場合）
const START_DATE = new Date("2026-08-09T19:00:00+09:00");

export default function TimetablePage() {
  const dataDir = path.join(process.cwd(), "public", "data");
  const playlistPath = path.join(dataDir, "playlist.csv");

  const eventRaw = readFileSync(path.join(dataDir, "songs.json"), "utf-8");
  const data: EventData = JSON.parse(eventRaw);

  let order: Song[] = [];
  let decidedAt: string | null = null;
  if (existsSync(playlistPath)) {
    const csv = readFileSync(playlistPath, "utf-8");
    order = parsePlaylistCsv(csv);
    if (order.length > 0) {
      decidedAt = new Date(statSync(playlistPath).mtime).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }

  const decided = order.length > 0;
  const playedSec = order.reduce((acc, s) => acc + (s.duration_sec || 0), 0);

  // タイムテーブル: 19時ちょうど開始として各曲の開始予定時刻を計算
  let cumulative = 0;
  const schedule: ScheduleItem[] = order.map((song, idx) => {
    const startMs = START_DATE.getTime() + cumulative * 1000;
    cumulative += song.duration_sec || 0;
    return { idx, startMs, durationSec: song.duration_sec || 0 };
  });
  const endAt = new Date(START_DATE.getTime() + playedSec * 1000);

  // 検索・表示用のリストアイテムを組み立てる
  const listItems: SongListItem[] = order.map((song, idx) => ({
    idx,
    number: idx + 1,
    title: song.title,
    display_name: song.source === "DM" ? "匿名" : song.display_name || song.user,
    user: song.user,
    source: song.source,
    start_label: `▶ ${formatTime(new Date(schedule[idx].startMs))}`,
    duration_label: formatDuration(song.duration_sec),
    url: song.url,
  }));

  return (
    <main id="timetable-top" className="mx-auto max-w-5xl px-4 py-10">
      <NowPlaying schedule={schedule} />
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-amber-400">完全ランダム再生順</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">🎲 番組表</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          リクエストされた曲の中から、実際に流す再生順を完全ランダムに決定しました。
          この順番が放送で使われる本番の番組表です。
        </p>
      </div>

      {/* 統計カード */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "収録曲数", value: `${data.total_songs}曲` },
          { label: "総再生時間", value: formatTotal(data.total_sec) },
          { label: "開始予定", value: "8/9（日）19:00:00" },
          { label: "終了予定", value: "8/10（月）19:00:00" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <div className="text-sm font-black text-amber-400">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 決定状態 */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            decided ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {decided ? "✅ 決定済み" : "⏳ 未決定"}
        </span>
        {decidedAt && <span className="text-xs text-zinc-500">決定日時: {decidedAt}</span>}
      </div>

      {/* 曲リスト（検索対応） */}
      {!decided ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
          まだ再生順が決定されていません。
        </div>
      ) : (
        <SongList songs={listItems} />
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
        この順番が実際に放送で流れる再生順です。放送時、運営の都合により曲が飛ばされる場合があります。
      </p>
    </main>
  );
}
