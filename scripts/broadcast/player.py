"""
サンサンサンデー2026 自動放送スクリプト（@okubahesioru 用）

フロー:
1. maebahesioru2 のスペースを検出（引数 or live_video_stream_status）
2. リスナーとして参加 → スピーカーリクエスト送信
3. ホスト（maebahesioru2）の承認を待つ
4. 19:00:00 JST になったら playlist.csv の曲を順番に再生
5. 各曲の開始を now_playing.json に記録（サイトの強調表示・スクロールと同期）

使い方:
    python _space_player.py <space_id>
"""
import asyncio
import json
import os
import struct
import subprocess
import sys
import time
import wave
from datetime import datetime, timedelta, timezone
from fractions import Fraction

sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

COOKIE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies", "okubahesioru_cookie.txt")
PLAYLIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "data", "playlist.csv")
NOW_PLAYING = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "data", "now_playing.json")


def load_env_file():
    """.env.local を読み込む（本番サイト同期設定）"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


load_env_file()
AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio_cache")
JST = timezone(timedelta(hours=9))
START = datetime(2026, 8, 9, 19, 0, 0, tzinfo=JST)
MAEBA_ID = "1910278629000712192"

os.makedirs(AUDIO_DIR, exist_ok=True)

from aiortc.mediastreams import AudioFrame, AudioStreamTrack


def load_cookies(path):
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {c["name"]: c["value"] for c in raw if isinstance(c, dict) and c.get("name")}


def fetch_audio(url, dest_id, cookies=None):
    """URLから音声を取得してWAV（48kHz mono）を返す。cookies=はyt-dlpの--cookiesに渡す"""
    dest_id = dest_id.replace(":", "_").replace("/", "_")
    os.makedirs(AUDIO_DIR, exist_ok=True)
    wav = os.path.join(AUDIO_DIR, f"{dest_id}.wav")
    if os.path.exists(wav):
        return wav
    mp3 = os.path.join(AUDIO_DIR, f"{dest_id}.mp3")
    cmd = ["yt-dlp", "-x", "--audio-format", "mp3", "-o", mp3, "--no-warnings"]
    if cookies:
        cmd += ["--cookies", cookies]
    cmd += [url]
    r = subprocess.run(cmd, capture_output=True, timeout=300)
    if r.returncode != 0 or not os.path.exists(mp3):
        err = r.stderr.decode("utf-8", errors="replace") if r.stderr else ""
        raise RuntimeError(f"yt-dlp failed: {url} :: {err[:200]}")
    r = subprocess.run(
        ["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", "48000", "-f", "wav", wav],
        capture_output=True, timeout=120,
    )
    if r.returncode != 0 or not os.path.exists(wav):
        raise RuntimeError(f"ffmpeg failed: {url}")
    # 変換完了後、元のMP3は不要なので削除（ディスク節約）
    try:
        os.remove(mp3)
    except OSError:
        pass
    return wav


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, "state.json")


def save_state(song_idx: int, start_ts: float):
    """途中再開用の状態を保存する（クラッシュ・終了・シャットダウン対策）"""
    data = {"song_idx": song_idx, "started_at": start_ts, "updated_at": time.time()}
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, STATE_FILE)


def load_state():
    """途中再開用の状態を読み込む（無ければNone）"""
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def clear_state():
    """再生完了時に状態をクリアする"""
    try:
        os.remove(STATE_FILE)
    except OSError:
        pass


def extract_space_id(url_or_id: str) -> str:
    """スペースのURLまたはIDからスペースIDを抽出する"""
    url_or_id = url_or_id.strip()
    if url_or_id.startswith("http"):
        return url_or_id.rstrip("/").split("/")[-1]
    return url_or_id


class PlaylistTrack(AudioStreamTrack):
    """playlist.csv の曲を順番に流すトラック（曲間でnow_playing.json更新）。"""

    kind = "audio"

    def __init__(self, songs, on_song_change=None, start_idx=0):
        super().__init__()
        self.songs = songs
        self.on_song_change = on_song_change
        self._frames = None
        self._pos = 0
        self._pts = 0
        self._next_frame_at = None
        self._current = start_idx - 1  # 最初のrecv()でstart_idxになる（途中再開対応）
        self._prefetched = {}
        self._failed = []

    async def _load(self, idx):
        """曲idxのWAVフレームを準備（キャッシュ利用）"""
        if idx in self._prefetched:
            frames, n = self._prefetched.pop(idx)
            return frames, n
        song = self.songs[idx]
        url = song["url"]
        dest_id = song.get("song_id", "").replace(":", "_").replace("/", "_")
        try:
            wav = await asyncio.get_event_loop().run_in_executor(None, fetch_audio, url, dest_id)
            with wave.open(wav, "rb") as w:
                frames = w.readframes(w.getnframes())
                n = w.getnframes()
            return frames, n
        except Exception as e:
            print(f"[track] 取得失敗 idx={idx} {song['title'][:30]}: {str(e)[:100]}", flush=True)
            self._failed.append(idx)
            # 無音0.5秒でスキップ
            return bytes(48000), 24000

    async def _prefetch(self, idx):
        try:
            frames, n = await self._load(idx)
            self._prefetched[idx] = (frames, n)
            print(f"[track] プリフェッチ完了 idx={idx}", flush=True)
        except Exception as e:
            print(f"[track] プリフェッチ失敗 idx={idx}: {str(e)[:80]}", flush=True)

    async def recv(self):
        now = time.monotonic()
        if self._next_frame_at is None:
            self._next_frame_at = now
        delay = self._next_frame_at - now
        if delay > 0:
            await asyncio.sleep(delay)
        self._next_frame_at += 0.02

        if self._frames is None or self._pos >= len(self._frames):
            # 次の曲へ
            self._current += 1
            if self._current >= len(self.songs):
                # 全曲終了 → 無音継続
                frames = bytes(960 * 2)
                n = 960
            else:
                try:
                    frames, n = await self._load(self._current)
                except Exception:
                    frames, n = bytes(960 * 2), 960
                print(f"[track] ▶ {self._current+1}/{len(self.songs)}: {self.songs[self._current]['title'][:40]}", flush=True)
                if self.on_song_change:
                    try:
                        await self.on_song_change(self._current, self.songs[self._current])
                    except Exception as e:
                        print(f"[track] on_song_change err: {str(e)[:80]}", flush=True)
                # 次の曲をプリフェッチ
                if self._current + 1 < len(self.songs):
                    asyncio.get_event_loop().create_task(self._prefetch(self._current + 1))
            self._frames = frames
            self._pos = 0

        n = 960
        buf = bytearray(n * 2)
        frame_len = len(self._frames)
        for i in range(n):
            idx = self._pos * 2
            if idx + 1 >= frame_len:
                # 終端到達
                self._pos = len(self._frames) // 2
                break
            v = struct.unpack_from("<h", self._frames, idx)[0]
            struct.pack_into("<h", buf, i * 2, v)
            self._pos += 1
        f = AudioFrame(format="s16", layout="mono", samples=n)
        f.sample_rate = 48000
        f.pts = self._pts
        f.time_base = Fraction(1, 48000)
        self._pts += n
        f.planes[0].update(bytes(buf))
        return f


def parse_csv_line(line: str):
    result = []
    cur = ""
    in_quotes = False
    for ch in line:
        if in_quotes:
            if ch == '"':
                in_quotes = False
            else:
                cur += ch
        else:
            if ch == '"':
                in_quotes = True
            elif ch == ",":
                result.append(cur)
                cur = ""
            else:
                cur += ch
    result.append(cur)
    return [v.replace("\r", "") for v in result]


def make_song_id(url: str) -> str:
    """URLからキャッシュ用のIDを生成する"""
    import re
    if "youtube.com" in url or "youtu.be" in url:
        m = re.search(r"v=([\w-]{11})", url) or re.search(r"youtu\.be/([\w-]{11})", url)
        return "YT:" + (m.group(1) if m else url)
    if "nicovideo.jp" in url:
        m = re.search(r"sm\d+", url)
        return "NICO:" + (m.group(0) if m else url)
    if "mega.nz" in url:
        m = re.search(r"file/([^/?#]+)", url) or re.search(r"#!([^/?#]+)", url)
        return "MEGA:" + (m.group(1) if m else url)
    if "gigafile" in url:
        return "GIGA:" + url.rstrip("/").split("/")[-1]
    return "URL:" + url.replace("://", "_").replace("/", "_")[:60]


def load_playlist():
    songs = []
    with open(PLAYLIST, encoding="utf-8-sig") as f:
        lines = f.read().splitlines()
    for line in lines[1:]:
        if not line.strip():
            continue
        c = parse_csv_line(line)
        if len(c) >= 7 and c[0]:
            songs.append({
                "idx": int(c[0]),
                "title": c[1],
                "display_name": c[2],
                "user": c[3],
                "duration_sec": float(c[4]) if c[4] else 0,
                "url": c[5],
                "source": c[6],
                "song_id": make_song_id(c[5]),
            })
    return songs


async def sync_remote_now_playing(data: dict):
    """本番サイト（Coolify）に現在再生中の曲を同期する（失敗しても放送は継続）"""
    url = os.environ.get("SITE_SYNC_URL", "").strip()
    token = os.environ.get("SITE_SYNC_TOKEN", "").strip()
    if not url or not token:
        return
    try:
        import urllib.request

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-API-Key": token},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            res.read()
    except Exception as e:
        print(f"[sync] remote sync failed: {str(e)[:80]}", flush=True)


async def write_now_playing(idx: int, song: dict, start_ts: float):
    """サイト同期用の now_playing.json と再開用の state.json を書き出す"""
    data = {
        "song_idx": idx,
        "song_number": song["idx"],
        "title": song["title"],
        "started_at": datetime.fromtimestamp(start_ts, JST).isoformat(),
        "updated_at": datetime.now(JST).isoformat(),
        "total": None,
    }
    tmp = NOW_PLAYING + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, NOW_PLAYING)
    save_state(idx, start_ts)
    print(f"[sync] now_playing: {song['idx']}番 {song['title'][:30]}", flush=True)
    await sync_remote_now_playing(data)


async def detect_maeba_space(client):
    """maebahesioru2 のアクティブなスペースを探す（検索ベース）"""
    queries = ["サンサンサンデー", "マニアスプレッダー", "maebahesioru2", "野獣の日"]
    for q in queries:
        try:
            spaces = await client.spaces.search(q, filter="Live")
            for sp in spaces:
                host = getattr(sp, "host_user_id", None)
                if str(host) == MAEBA_ID:
                    print(f"[detect] 発見: {sp.id} ({sp.title})", flush=True)
                    return sp.id
                print(f"[detect] 候補: {sp.id} host={host} title={getattr(sp, 'title', '')[:40]}", flush=True)
        except Exception as e:
            print(f"[detect] search('{q}') err: {str(e)[:100]}", flush=True)
        await asyncio.sleep(1)
    return None


async def main():
    if len(sys.argv) < 2:
        print("使い方: python scripts/broadcast/player.py <スペースURL or ID>", flush=True)
        print("例: python scripts/broadcast/player.py https://x.com/i/spaces/1DXGydznBYWKM", flush=True)
        return
    space_id = extract_space_id(sys.argv[1])

    cookies = load_cookies(COOKIE_PATH)
    import twikit
    client = twikit.Client(language="ja", impersonate="chrome124")
    client.set_cookies({"auth_token": cookies["auth_token"], "ct0": cookies["ct0"]})
    uid = await client.user_id()
    print(f"[auth] okubahesioru uid={uid}", flush=True)

    print(f"[space] id={space_id}", flush=True)

    # 再開状態の確認（クラッシュ・終了・シャットダウン後の再開用）
    state = load_state()
    if state and state.get("song_idx") is not None:
        resume_idx = int(state["song_idx"])
        print(f"[resume] 途中から再開: {resume_idx + 1}曲目から", flush=True)
    else:
        resume_idx = 0
        print("[resume] 最初から開始", flush=True)

    # 2. リスナー参加 → スピーカーリクエスト
    try:
        joined = await client.spaces.join(space_id, as_speaker=False, should_auto_join=True)
        print(f"[join] {joined}", flush=True)
    except Exception as e:
        print(f"[join] ERR {str(e)[:120]}", flush=True)
        # join失敗でもrequest_to_speakは試す
    suuid = await client.spaces.request_to_speak(space_id)
    print(f"[request] suuid={suuid}", flush=True)

    # 3. 承認待ち（19:00までに承認される想定・最大2時間）
    print("[wait] ホストの承認待ち…", flush=True)
    guest = await client.spaces.wait_for_speaker(space_id, suuid, timeout=7200)
    print(f"[approved] session_state=4 承認されました", flush=True)

    # 4. 19:00まで待機（初回のみ。再開時はすぐ再生）
    now = datetime.now(JST)
    if resume_idx == 0 and now < START:
        wait_sec = (START - now).total_seconds()
        print(f"[wait] 19:00まで {wait_sec:.0f}秒待機", flush=True)
        await asyncio.sleep(wait_sec)

    # 5. 曲を再生（途中再開の場合は resume_idx から）
    songs = load_playlist()
    print(f"[play] {len(songs)}曲を再生開始（{resume_idx + 1}曲目から）", flush=True)

    track = PlaylistTrack(songs, on_song_change=write_now_playing, start_idx=resume_idx)
    session = await client.spaces.speak(
        space_id,
        session_uuid=suuid,
        audio_track=track,
    )
    print(f"[speak] publisher_id={session.publisher_id} ice={session.pc.iceConnectionState}", flush=True)

    # 残り時間分（＋余裕）再生し続ける
    total_sec = sum(s["duration_sec"] for s in songs[resume_idx:])
    print(f"[play] 残り再生時間 {total_sec:.0f}秒", flush=True)
    await asyncio.sleep(total_sec + 30)

    await session.close()
    clear_state()
    await client.http.aclose()
    print("[DONE] 放送終了", flush=True)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[ABORT] 中断", flush=True)
