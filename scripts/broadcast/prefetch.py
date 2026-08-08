"""playlist.csv の全曲を事前に WAV（48kHz mono）へ変換して audio_cache/ に保存する。

放送中に都度ダウンロードすると曲間が空くリスクがあるため、事前に全曲を
用意しておくためのスクリプト。既にキャッシュがある曲はスキップされる。

使い方（管理者のみ）:
    python scripts/broadcast/prefetch.py
"""
import os
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

from player import fetch_audio, load_playlist  # noqa: E402

AUDIO_DIR = os.path.join(BASE, "audio_cache")
os.makedirs(AUDIO_DIR, exist_ok=True)


def main():
    songs = load_playlist()
    total = len(songs)
    ok = 0
    skipped = 0
    failed = []
    t0 = time.time()

    print(f"全{total}曲の事前取得を開始（audio_cache/ へ保存）", flush=True)
    for i, song in enumerate(songs, 1):
        dest_id = song["song_id"].replace(":", "_").replace("/", "_")
        wav = os.path.join(AUDIO_DIR, f"{dest_id}.wav")
        if os.path.exists(wav):
            skipped += 1
            print(f"[{i}/{total}] スキップ（既存）: {song['title'][:35]}", flush=True)
            continue
        try:
            w = fetch_audio(song["url"], dest_id)
            ok += 1
            print(f"[{i}/{total}] OK ({time.time()-t0:.0f}s): {song['title'][:35]}", flush=True)
        except Exception as e:
            failed.append((song["idx"], song["title"], str(e)[:120]))
            print(f"[{i}/{total}] FAIL: {song['title'][:35]} :: {str(e)[:80]}", flush=True)
        time.sleep(1)  # YouTube等のレート制限対策

    print(f"\n=== 完了 ===", flush=True)
    print(f"OK: {ok} / スキップ: {skipped} / 失敗: {len(failed)} / 計: {total} / 所要: {time.time()-t0:.0f}秒", flush=True)
    if failed:
        print("失敗リスト（放送時は無音スキップになります）:", flush=True)
        for idx, title, err in failed:
            print(f"  {idx}番: {title[:45]} :: {err}", flush=True)


if __name__ == "__main__":
    main()
