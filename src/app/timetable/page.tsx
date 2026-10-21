import { existsSync, readFileSync, statSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import NowPlaying, { type ScheduleItem } from "@/components/NowPlaying";
import SongList, { type SongListItem } from "@/components/SongList";
import StatsCards from "@/components/StatsCards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "番組表",
  description:
    "マニアスプレッダーのサンサンサンデー エロウィンSP（2026年10月31日 18時〜）の番組表。今回の再生順はリクエスト締切後に決定します。前回「野獣の日スペシャル」の全曲番組表も掲載。",
};

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

function formatDateTime(date: Date): string {
  // 日付＋時刻（例: 8/11（月）19:04:32）
  const jst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const week = ["日", "月", "火", "水", "木", "金", "土"][jst.getDay()];
  return `${jst.getMonth() + 1}/${jst.getDate()}（${week}）${formatTime(date)}`;
}

// 今回（エロウィンSP）の放送開始時刻: 18時ちょうど開始
const CURRENT_START = new Date("2026-10-31T18:00:00+09:00");
// 前回（野獣の日スペシャル）の放送開始時刻: 19時ちょうど開始
const PAST_START = new Date("2026-08-10T19:00:00+09:00");

export default function TimetablePage() {
  const dataDir = path.join(process.cwd(), "public", "data");
  const playlistPath = path.join(dataDir, "playlist.csv");

  let data: EventData = { event: { name: "", date: "", place: "" }, total_songs: 0, total_sec: 0, songs: [] } as unknown as EventData;
  try {
    data = JSON.parse(readFileSync(path.join(dataDir, "songs.json"), "utf-8")) as EventData;
  } catch {
    // data が未投入でも番組表ページ自体は開けるようにする（未定表示にフォールバック）
  }

  // public/data の中身が前回イベント（野獣の日スペシャル）のものかどうか。
  // 今回のリクエストから番組表を作り直したら自動で「今回の番組表」表示に戻る。
  const isPastEvent = /野獣の日/.test(data?.event?.name ?? "");
  const baseStart = isPastEvent ? PAST_START : CURRENT_START;

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

  // タイムテーブル: 開始時刻を基準に各曲の開始予定時刻を計算
  let cumulative = 0;
  const schedule: ScheduleItem[] = order.map((song, idx) => {
    const startMs = baseStart.getTime() + cumulative * 1000;
    cumulative += song.duration_sec || 0;
    return { idx, startMs, durationSec: song.duration_sec || 0 };
  });
  const endAt = new Date(baseStart.getTime() + playedSec * 1000);

  // 検索・表示用のリストアイテムを組み立てる
  const listItems: SongListItem[] = order.map((song, idx) => ({
    idx,
    number: idx + 1,
    title: song.title,
    display_name: song.source === "DM" && song.display_name === "匿名" ? "匿名" : song.display_name || song.user,
    user: song.user,
    source: song.source,
    duration_sec: song.duration_sec || 0,
    start_label: `▶ ${formatTime(new Date(schedule[idx].startMs))}`,
    duration_label: formatDuration(song.duration_sec),
    url: song.url,
  }));

  const playlistName = isPastEvent
    ? "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル 番組表"
    : "マニアスプレッダーのサンサンサンデー エロウィンSP 番組表";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicPlaylist",
            name: playlistName,
            numTracks: order.length,
            track: order.map((s) => ({
              "@type": "MusicRecording",
              name: s.title,
              byArtist: {
                "@type": "Person",
                name: s.source === "DM" && s.display_name === "匿名" ? "匿名" : s.display_name || s.user,
              },
              duration: `PT${Math.round(s.duration_sec || 0)}S`,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "ホーム",
                item: "https://sunsunsunday.hikamers.app",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "番組表",
                item: "https://sunsunsunday.hikamers.app/timetable",
              },
            ],
          }),
        }}
      />
      <main id="timetable-top" className="mx-auto max-w-5xl px-4 py-10">
      {!isPastEvent && <NowPlaying schedule={schedule} />}
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-amber-400">サンサンサンデー 2026</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">📋 番組表</h1>
      </div>

      {isPastEvent ? (
        <>
          {/* 今回（エロウィンSP）: まだ番組表は無い */}
          <section className="mt-8 rounded-3xl border border-dashed border-amber-500/40 bg-amber-500/[0.04] px-6 py-10 text-center">
            <p className="text-xs font-bold tracking-widest text-amber-400">エロウィンSP（今回）</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">再生順は未定です</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              リクエスト受付は
              <span className="font-bold text-zinc-200"> 10月31日（土）17:00 </span>
              まで。締切後に抽選して再生順を決定し、このページで公開します。
              <br className="hidden sm:block" />
              応募方法・ルールの詳細はトップページをご確認ください。
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
                href="/"
                className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-400"
              >
                開催概要・ルールを見る
              </a>
            </div>
          </section>

          {/* 前回イベントの番組表（過去イベント欄） */}
          <section className="mt-16 border-t border-zinc-800 pt-10">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest text-zinc-500">過去のイベント</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">{data?.event?.name}</h2>
              <p className="mt-2 text-sm text-zinc-400">{data?.event?.date}</p>
              <p className="mt-1 text-xs text-zinc-500">{data?.event?.place}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "収録曲数", value: `${order.length}曲` },
                { label: "総再生時間", value: formatTotal(playedSec) },
                { label: "開始", value: formatDateTime(baseStart) },
                { label: "終了", value: formatDateTime(endAt) },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
                >
                  <div className="text-sm font-black text-amber-400">{c.value}</div>
                  <div className="mt-1 text-xs text-zinc-500">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href="/listen"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
              >
                🎧 この回の録音を再生
              </a>
              <a
                href="/download"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
              >
                ⬇ 音源・ツイートデータ
              </a>
              <a
                href="https://x.com/search?q=%23%E3%83%9E%E3%83%8B%E3%82%A2%E3%82%B9%E3%83%97%E3%83%AC%E3%83%83%E3%83%80%E3%83%BC%E3%81%AE%E3%82%B5%E3%83%B3%E3%82%B5%E3%83%B3%E3%82%B5%E3%83%B3%E3%83%87%E3%83%BC"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-300"
              >
                #️⃣ 当時のハッシュタグ
              </a>
            </div>

            <SongList songs={listItems} startDateMs={baseStart.getTime()} live={false} />

            <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
              時刻は開催予定時刻（{formatTime(baseStart)} 開始）を基準にした予定表です。
              実際の放送では開始遅延や曲のスキップが発生する場合があります。
            </p>
          </section>
        </>
      ) : (
        <>
          {/* 統計カード（放送開始後は実際の開始時刻に自動追従） */}
          <StatsCards
            totalSongs={decided ? order.length : data.total_songs}
            totalSec={decided ? playedSec : data.total_sec}
            startDateMs={baseStart.getTime()}
            durations={order.map((s) => s.duration_sec || 0)}
          />

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

          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-400">
            リクエストされた曲の中から、実際に流す再生順を完全ランダムに決定しました。
            この順番が放送で使われる本番の番組表です。
          </p>

          {/* 曲リスト（検索対応） */}
          {!decided ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
              まだ再生順が決定されていません。
            </div>
          ) : (
            <SongList songs={listItems} startDateMs={baseStart.getTime()} />
          )}

          <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
            この順番が実際に放送で流れる再生順です。放送時、運営の都合により曲が飛ばされる場合があります。
          </p>
        </>
      )}
      </main>
    </>
  );
}
