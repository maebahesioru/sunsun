"""動作確認用：一時プレイリスト（ダミー+GPT）に切り替え＋再開モード設定。
使い方: python _test_gpt_prep.py
"""
import csv
import io
import json
import os
import shutil
import time

BASE = os.path.dirname(os.path.abspath(__file__))
PLAYLIST = os.path.join(BASE, "..", "..", "public", "data", "playlist.csv")
STATE = os.path.join(BASE, "state.json")
BAK = os.path.join(BASE, "playlist.csv.bak")

# 1. バックアップ
shutil.copy(PLAYLIST, BAK)
print(f"バックアップ: {BAK}")

# 2. 一時プレイリスト（ダミー + GPT）
rows = [
    ["1", "ダミー（動作確認用）", "匿名", "DM", "0.5", "https://www.youtube.com/watch?v=DUMMY_TEST_000", "DM"],
    ["2", "GPT", "にじまに_mania", "nizimani_mania", "178.0", "https://www.youtube.com/watch?v=tPK24bDZrRc", "リプ"],
]
buf = io.StringIO()
writer = csv.writer(buf)
writer.writerow(["再生順", "曲名", "表示名", "ユーザーID", "時間(秒)", "URL", "ソース"])
for r in rows:
    writer.writerow(r)
with open(PLAYLIST, "w", encoding="utf-8") as f:
    f.write("\ufeff" + buf.getvalue())
print("一時プレイリスト作成: ダミー + GPT")

# 3. state.json（再開モード: song_idx=1 → 待機スキップ・GPTから再生）
state = {"song_idx": 1, "started_at": time.time(), "updated_at": time.time()}
with open(STATE, "w", encoding="utf-8") as f:
    json.dump(state, f, ensure_ascii=False, indent=1)
print("state.json: song_idx=1（待機スキップ）")
print("準備完了！ スペースURLで start.py を起動してください")
