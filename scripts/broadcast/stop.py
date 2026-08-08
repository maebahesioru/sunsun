"""放送スクリプト（player.py）を停止する。

使い方:
    python scripts/broadcast/stop.py
"""
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PID_FILE = os.path.join(BASE, "player.pid")


def main():
    if not os.path.exists(PID_FILE):
        print("player.pid がありません（放送スクリプトは起動していない可能性）")
        return 0
    pid = int(open(PID_FILE).read().strip())
    try:
        subprocess.run(["taskkill", "/F", "/PID", str(pid)], check=False, timeout=20)
        print(f"放送スクリプト停止: pid={pid}")
    except Exception as e:
        print(f"停止エラー: {e}")
    try:
        os.remove(PID_FILE)
    except OSError:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
