#!/usr/bin/env python3
"""
マニアスプレッダーのサンサンサンデー2026 番組表決定スクリプト（管理者専用）

サーバー上で実行すると、収録曲を完全ランダムにシャッフルして
public/data/playlist.csv に保存（永続化）します。

使い方（サーバー管理者のみ）:
    python scripts/decide_playlist.py

サイト訪問者からは書き換えられません。
"""
import csv
import io
import json
import os
import random
import sys
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONGS_JSON = os.path.join(BASE_DIR, "public", "data", "songs.json")
PLAYLIST_CSV = os.path.join(BASE_DIR, "public", "data", "playlist.csv")

JST = timezone(timedelta(hours=9))


def main() -> int:
    if not os.path.exists(SONGS_JSON):
        print(f"エラー: {SONGS_JSON} が見つかりません", file=sys.stderr)
        return 1

    with open(SONGS_JSON, encoding="utf-8") as f:
        data = json.load(f)

    songs = data.get("songs", [])
    if not songs:
        print("エラー: 収録曲がありません", file=sys.stderr)
        return 1

    # 完全ランダム（Fisher-Yates）
    order = songs[:]
    random.shuffle(order)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["再生順", "曲名", "表示名", "ユーザーID", "時間(秒)", "URL", "ソース"])
    for i, s in enumerate(order, 1):
        writer.writerow([
            i,
            s.get("title", ""),
            s.get("display_name", ""),
            s.get("user", ""),
            s.get("duration_sec", 0),
            s.get("url", ""),
            s.get("source", ""),
        ])

    csv_text = "\ufeff" + buf.getvalue()
    with open(PLAYLIST_CSV, "w", encoding="utf-8") as f:
        f.write(csv_text)

    total_sec = sum(s.get("duration_sec") or 0 for s in order)
    now = datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S JST")
    print(f"✅ 再生順を決定して保存しました: {PLAYLIST_CSV}")
    print(f"   曲数: {len(order)}曲 / 総時間: {total_sec:.0f}秒")
    print(f"   決定日時: {now}")
    print(f"   先頭3曲:")
    for s in order[:3]:
        print(f"     {s.get('title', '')[:50]} ({s.get('display_name', '')})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
