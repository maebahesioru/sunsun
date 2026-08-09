"""動作確認用：一時プレイリストを元に戻す。
使い方: python _test_gpt_restore.py
"""
import os
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
PLAYLIST = os.path.join(BASE, "..", "..", "public", "data", "playlist.csv")
STATE = os.path.join(BASE, "state.json")
BAK = os.path.join(BASE, "playlist.csv.bak")

# 1. プレイリスト復元
if os.path.exists(BAK):
    shutil.copy(BAK, PLAYLIST)
    os.remove(BAK)
    print("playlist.csv 復元完了")
else:
    print("バックアップなし（復元スキップ）")

# 2. state.json 削除
if os.path.exists(STATE):
    os.remove(STATE)
    print("state.json 削除")
