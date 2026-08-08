import fs from "fs";
import path from "path";
import Link from "next/link";

const rules = [
  "リクエストできる楽曲は、1人につき2曲までです。",
  "3曲以上リクエストした場合は、主催者側でその中から2曲をランダムに選びます。",
  "複数のアカウントを利用した追加リクエストはご遠慮ください。",
  "1曲の長さは原則として5分以内です。ただし、1分以内の超過であれば許容します。",
  "同じ楽曲が複数人からリクエストされた場合は、1回の再生にまとめます。",
  "再生順は、リクエストの受付順とは限りません。",
  "応募数、開催時間、技術上の都合などにより、受け付けた楽曲をすべて再生できない場合があります。",
];

const urlRules = [
  "YouTube、ニコニコ動画、SoundCloud、ギガファイル便など、主催者側で再生またはダウンロードできるURLであれば、基本的に受け付けます。",
  "ダウンロードできないものや、有料で購入する必要があるものは受け付けられません。",
  "楽曲名には、原則としてリンク先のタイトルまたは音源のファイル名を使用します。",
  "曲名の変更希望や、主催者へ伝えておきたいことがある場合は、リクエスト時に記載してください。",
  "ファイル共有サービスを利用する場合は、イベント終了までダウンロード期限が切れないように設定してください。",
  "ダウンロード用パスワードが設定されている場合は、必ずパスワードを併記してください。",
  "リンク切れやダウンロード失敗などにより音源を取得できない場合は、採用できません。",
];

const history = [
  {
    date: "第1回（2023年6月25日）",
    text: "「飛び降り動画ばかり流れてきて鬱になりそうなので急遽リクエスト枠を設けます！」というニコチンTVの突発的な思いつきにより開催された。",
  },
  {
    date: "第2回（2023年7月2日・9日）",
    text: "API制限の影響で前半と後半に分けて放送された。",
  },
  {
    date: "秋のハロウィンスペシャル（2023年10月29日・11月5日・6日）",
    text: "「BPOで審議入りしたため休止していた」というジョークを経て復活。リクエスト数が多く、複数日にまたがって放送された。",
  },
  {
    date: "年忘れマクドナルドオフ会in2023（2023年12月31日）",
    text: "大晦日の年越しスペシャルとして開催。",
  },
  {
    date: "野獣の日スペシャル（2024年8月10日・2025年8月10日）",
    text: "8月10日（野獣の日）の夜から翌朝にかけて行われるオールナイトの大規模放送。2025年の放送では200曲以上のリクエストが集まり、約11時間にも及ぶ長丁場となった。",
  },
];

export default function Home() {
  // JSON-LD用に総再生時間を取得
  let totalSec = 0;
  try {
    const songsJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "data", "songs.json"), "utf-8")
    );
    totalSec = songsJson.total_sec || 0;
  } catch {}

  const eventStart = new Date("2026-08-10T19:00:00+09:00");
  const eventEnd = new Date(eventStart.getTime() + totalSec * 1000);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: "マニアスプレッダーのサンサンサンデー2026 野獣の日スペシャル",
    startDate: eventStart.toISOString(),
    endDate: eventEnd.toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "VirtualLocation",
      url: "https://x.com/maebahesioru2",
      name: "@maebahesioru2のXスペース",
    },
    organizer: {
      "@type": "Person",
      name: "@maebahesioru2",
      url: "https://x.com/maebahesioru2",
    },
    performer: {
      "@type": "Person",
      name: "@okubahesioru",
      url: "https://x.com/okubahesioru",
    },
    description:
      "ヒカマー界隈の恒例イベント、音楽リクエストラジオ番組風配信。カオスな選曲とハプニング満載のオールナイトが今年も帰ってくる。",
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-amber-950/40 to-zinc-950 p-8 sm:p-12">
        <div className="absolute -right-10 -top-10 text-[10rem] opacity-10">🐗</div>
        <p className="text-sm font-semibold tracking-widest text-amber-400">2026.8.9 野獣の日 SPECIAL</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          マニアスプレッダーの
          <br />
          サンサンサンデー<span className="text-amber-400">2026</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          ヒカマー界隈の恒例イベント、音楽リクエストラジオ番組風配信。カオスな選曲とハプニング満載の
          オールナイトが今年も帰ってくる。リクエストはXのリプ欄かDMで受付中！
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/timetable"
            className="rounded-full bg-amber-500 px-6 py-2.5 font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            🎵 番組表を見る
          </Link>
          <a
            href="https://x.com/maebahesioru2"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-700 px-6 py-2.5 font-semibold text-zinc-200 transition hover:border-amber-500 hover:text-amber-400"
          >
            @maebahesioru2
          </a>
        </div>
      </section>

      {/* 開催情報 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📅</span> 開催情報
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "開催日時", value: "2026年8月10日（月）19時ちょうど開始予定", icon: "🕖" },
            { label: "開催場所", value: "@maebahesioru2のXスペース", icon: "📍" },
            { label: "リクエスト受付", value: "8月3日（月）22時 〜 8月10日（月）18時半", icon: "📨" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-2 text-xs font-semibold text-zinc-400">{item.label}</div>
              <div className="mt-1 text-sm font-bold leading-snug text-zinc-100">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm leading-relaxed text-zinc-300">
          <p>
            10日の<span className="font-bold text-zinc-100">8時から18時30分</span>までは、隼快_mania氏主催・
            開發学習堂による<span className="font-bold text-zinc-100">「前期ヒカマー認定試験」</span>が予定されています。
            そちらと併せての参加も可能です。
          </p>
        </div>
      </section>

      {/* 概要 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📻</span> 番組について
        </h2>
        <div className="mt-4 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm leading-relaxed text-zinc-300">
          <p>
            2023年6月25日に第1回が急遽開催されて以降、不定期に開催されているヒカマー界隈の恒例イベント。
            事前にX上でハッシュタグ
            <span className="mx-1 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">#マニアスプレッダーのサンサンサンデー</span>
            を用いてリスナーから楽曲や音声動画のリクエストを募り、プレイリスト化してスペースで順番に流していくという形式。
          </p>
          <p>前身は「OGWTIHIのオールナイトニッポン」。</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <h3 className="text-sm font-bold text-amber-400">🎲 カオスな選曲</h3>
            <ul className="mt-2 list-inside space-y-1.5 text-sm">
              <li>
                <span className="font-bold text-zinc-100">ヒカマニの音MAD</span> — 界隈の定番曲（「FIRE」「コネクト」「Big Brother☆」など）が流れると、タイムライン上で大合唱が起こる。
              </li>
              <li>
                <span className="font-bold text-zinc-100">VTuberの楽曲</span> — V叩きのリスナーがいるため、流れるとタイムラインが阿鼻叫喚の地獄絵図と化す。
              </li>
              <li>
                <span className="font-bold text-zinc-100">不謹慎・恐怖系音声</span> — 緊急地震速報、Jアラート、お経、ナシード、政治家の応援歌が唐突に流されるテロ行為が頻発。
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* リクエスト方法 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📨</span> リクエスト方法
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">通常</span>
              <h3 className="font-bold">リプライでリクエスト</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              受付開始時刻の22時に投稿される受付用ポストのリプライ欄に、リクエストしたい楽曲のURLを貼ってください。
              引用ポストやリポストなどで拡散していただけるとありがたいです！
            </p>
            <p className="mt-3 text-xs text-zinc-500">受付完了の合図: 主催者から「いいね」が付く</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-bold text-zinc-300">匿名</span>
              <h3 className="font-bold">DMでリクエスト</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              匿名でリクエストしたい場合は、@maebahesioru2のDMへ楽曲のURLを送ってください。放送上でリクエスト者名は公表されません。
            </p>
            <p className="mt-3 text-xs text-zinc-500">受付完了の合図: 主催者から「👍」が届く</p>
          </div>
        </div>
      </section>

      {/* ルール */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📏</span> リクエストに関するルール
        </h2>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ul className="space-y-2.5">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                <span className="mt-0.5 shrink-0 rounded bg-zinc-800 px-1.5 text-xs font-bold leading-5 text-amber-400">
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <h3 className="mt-6 font-bold text-zinc-200">🎧 音源URLについて</h3>
        <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ul className="space-y-2.5">
            {urlRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                <span className="mt-0.5 shrink-0 rounded bg-zinc-800 px-1.5 text-xs font-bold leading-5 text-amber-400">
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 参加について */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">👥</span> ヒカマー以外の方の参加について
        </h2>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm leading-relaxed text-zinc-300">
          <p>
            ヒカマーだけでなく、例のアレ民、非カマー、ツイ廃、ヒカマニ民、ヒカアノン、反ヒカマーの皆さんからの
            リクエストやご参加も大歓迎です！
          </p>
          <p className="mt-2">
            ただし、本イベントはヒカマー主体のイベントです。その点をご理解いただいたうえで、リクエストおよびご参加をお願いします。
          </p>
        </div>
      </section>

      {/* 放送について */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📡</span> 放送について
        </h2>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ul className="space-y-2.5 text-sm leading-relaxed text-zinc-300">
            <li>• 音楽の再生には、サブアカウントの@okubahesioruを使用します。</li>
            <li>• PythonおよびTwiforkを利用したスクリプトによって楽曲を再生します。</li>
            <li>• イベント運営上、スピーカーリクエストには対応しません。</li>
            <li>• 楽曲を再生するたびに、スペースのリプライ欄へ曲名、曲数カウント、リクエスト者名を投稿します。</li>
            <li>• リクエスト者名には、Xアカウントの表示名を使用します。DMの匿名リクエストは公表しません。</li>
            <li>• スペースは録音機能をオンにして放送するため、終了後の見逃し視聴も可能です。</li>
          </ul>
        </div>
      </section>

      {/* 放送回の歴史 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">📜</span> 主な放送回
        </h2>
        <div className="mt-4 space-y-3">
          {history.map((h, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-sm font-bold text-amber-400">{h.date}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ハッシュタグ */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-amber-400">#️⃣</span> ハッシュタグ
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {["#マニアスプレッダーのサンサンサンデー", "#マニアスプレッダーのサンサンサンデー2026野獣の日スペシャル"].map(
            (tag) => (
              <a
                key={tag}
                href={`https://x.com/search?q=${encodeURIComponent(tag)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-amber-300 transition hover:border-amber-500"
              >
                {tag}
              </a>
            )
          )}
        </div>
      </section>
    </main>
  );
}
