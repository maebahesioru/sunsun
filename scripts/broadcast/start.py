"""放送スクリプト（_space_player.py）をデタッチプロセスとして起動するラッパー。

cron / 手動のどちらからでも使える。すでに起動中なら何もしない。
"""
import os
import subprocess
import sys
import time

BASE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(BASE, "player.py")
LOG = os.path.join(BASE, "player_log.txt")
PID_FILE = os.path.join(BASE, "player.pid")

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200


def is_running(pid: int) -> bool:
    try:
        r = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
            capture_output=True, text=True, timeout=15,
        )
        return str(pid) in r.stdout
    except Exception:
        return False


def main():
    if os.path.exists(PID_FILE):
        try:
            old = int(open(PID_FILE).read().strip())
            if is_running(old):
                print(f"すでに放送スクリプト実行中 (pid={old})")
                return 0
        except Exception:
            pass

    log = open(LOG, "w", encoding="utf-8")
    p = subprocess.Popen(
        [sys.executable, SCRIPT] + sys.argv[1:],  # スペースURLを渡す
        cwd=BASE,
        stdout=log,
        stderr=subprocess.STDOUT,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        close_fds=True,
    )
    with open(PID_FILE, "w") as f:
        f.write(str(p.pid))
    print(f"放送スクリプト起動: pid={p.pid}")
    print(f"ログ: {LOG}")
    time.sleep(2)
    if is_running(p.pid):
        print(f"生存確認OK (pid={p.pid})")
    else:
        print("⚠️ プロセスが即終了しました。ログを確認してください。")
        print(open(LOG, encoding="utf-8", errors="replace").read()[-2000:])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
