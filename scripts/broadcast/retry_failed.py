"""失敗曲をリトライする（YouTube/ニコニコはCookie・X動画はfxtwitter）。

使い方（管理者のみ）:
    python scripts/broadcast/retry_failed.py
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

from player import AUDIO_DIR, load_playlist, make_song_id, fetch_audio  # noqa: E402

YT_COOKIES = os.path.join(BASE, "yt_cookies.txt")
NICO_COOKIES = os.path.join(BASE, "nico_cookies.txt")

# X動画: 楽曲募集時のURLは「動画ID」でfxtwitterが404になるため、ツイートIDへ変換する
X_TWEET_MAP = {
    "2042679812339421184": "2042680222089383982",  # 架っさんまたやらかしてて今これ
    "2084640788865323009": "2084640862005497888",  # @1n5TaqIKJM22025の動画ツイート
    "2084268508905644032": "2084268525129244904",  # @okayujr717宛の動画（会話内）
}


def get_failed_songs():
    """prefetch_log.txt から失敗リストを抽出する"""
    failed = []
    log = os.path.join(BASE, "prefetch_log.txt")
    if not os.path.exists(log):
        return failed
    for line in open(log, encoding="utf-8"):
        if "FAIL" not in line:
            continue
        m = re.match(r"\[(\d+)/\d+\] FAIL: (.+?) :: yt-dlp failed: (\S+) ::", line)
        if m:
            failed.append({"idx": int(m.group(1)), "title": m.group(2), "url": m.group(3)})
    return failed


def download_x_video(url: str, dest_id: str) -> str:
    """X動画を fxtwitter API 経由で取得してWAVを返す（動画ID→ツイートID変換対応）"""
    status_id = url.rstrip("/").split("/")[-1]
    status_id = X_TWEET_MAP.get(status_id, status_id)
    api = f"https://api.fxtwitter.com/status/{status_id}"
    req = urllib.request.Request(api, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    media = (data.get("tweet") or {}).get("media") or {}
    videos = media.get("videos") or []
    if not videos:
        raise RuntimeError("fxtwitter: 動画なし")
    video_url = videos[0].get("url")
    if not video_url:
        raise RuntimeError("fxtwitter: 動画URLなし")
    mp4 = os.path.join(AUDIO_DIR, f"{dest_id}.mp4")
    subprocess.run(["curl", "-sL", "--max-time", "300", "-o", mp4, video_url], check=True, timeout=360)
    wav = os.path.join(AUDIO_DIR, f"{dest_id}.wav")
    r2 = subprocess.run(
        ["ffmpeg", "-y", "-i", mp4, "-ac", "1", "-ar", "48000", "-f", "wav", wav],
        capture_output=True, timeout=120,
    )
    if r2.returncode != 0 or not os.path.exists(wav):
        raise RuntimeError("ffmpeg failed")
    try:
        os.remove(mp4)
    except OSError:
        pass
    return wav


def main():
    songs_by_idx = {s["idx"]: s for s in load_playlist()}
    failed = get_failed_songs()
    if not failed:
        print("失敗リストがありません")
        return

    ok = 0
    still = []
    for f in failed:
        song = songs_by_idx.get(f["idx"])
        if not song:
            continue
        dest_id = make_song_id(song["url"]).replace(":", "_").replace("/", "_")
        wav = os.path.join(AUDIO_DIR, f"{dest_id}.wav")
        if os.path.exists(wav):
            print(f"[SKIP] {song['idx']}番: 既に取得済み {song['title'][:30]}")
            continue
        url = song["url"]
        try:
            if "x.com" in url or "twitter.com" in url:
                download_x_video(url, dest_id)
            elif "youtube.com" in url or "youtu.be" in url:
                fetch_audio(url, dest_id, cookies=YT_COOKIES)
            elif "nicovideo" in url:
                fetch_audio(url, dest_id, cookies=NICO_COOKIES)
            elif "suno.com" in url or "gigafile" in url or "mega.nz" in url:
                # 個別対応（API調査後に実装）
                still.append(f)
                continue
            else:
                fetch_audio(url, dest_id)
            ok += 1
            print(f"[OK] {song['idx']}番: {song['title'][:35]}", flush=True)
        except Exception as e:
            still.append(f)
            print(f"[FAIL] {song['idx']}番: {song['title'][:35]} :: {str(e)[:100]}", flush=True)
        time.sleep(1)

    print(f"\n=== リトライ完了: OK {ok} / 残り {len(still)} 曲 ===", flush=True)
    for f in still:
        print(f"  残: {f['idx']}番 {f['title'][:45]}", flush=True)


if __name__ == "__main__":
    main()
