#!/usr/bin/env python3
"""
新曲を既存の再生順リストに「ランダムな位置」で挿入する（管理者専用）

重要: このスクリプトは「再シャッフルしない」。
既存の再生順（playlist.csv）は完全に維持し、songs.json に追加された
新曲だけをランダムな位置に挿入して番号を振り直す。

使い方（サーバー管理者のみ）:
    python scripts/add_songs.py
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


def load_env_file():
    """.env.local を読み込む（本番サイト同期設定）"""
    env_path = os.path.join(BASE_DIR, ".env.local")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


load_env_file()


def sync_playlist_to_site():
    """本番サイト（Coolify）に番組表データをアップロードする（デプロイ不要で反映）"""
    url = os.environ.get("SITE_SYNC_URL", "").strip()
    token = os.environ.get("SITE_SYNC_TOKEN", "").strip()
    if not url or not token:
        print("⚠️ SITE_SYNC_URL / SITE_SYNC_TOKEN 未設定のため本番同期スキップ")
        return
    try:
        import urllib.request

        songs = json.load(open(SONGS_JSON, encoding="utf-8"))
        csv_text = open(PLAYLIST_CSV, encoding="utf-8").read()
        payload = json.dumps(
            {"type": "playlist", "songs_json": songs, "playlist_csv": csv_text}
        ).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "X-API-Key": token},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            result = json.loads(res.read())
        if result.get("ok"):
            print("✅ 本番サイトに番組表を同期しました（デプロイ不要）")
        else:
            print("⚠️ 本番同期レスポンス異常:", str(result)[:100])
    except Exception as e:
        print(f"⚠️ 本番同期失敗: {str(e)[:100]}")

# 特別固定: 【淫ミュ】YAJU&U は9日→10日の日付跨ぎ位置に配置（新規が来ても維持）
# 再生開始から0:57の位置（開始 + 57秒）がちょうど0:00になるよう、開始を23:59:03に合わせる
MIDNIGHT_CROSS_URL = "https://www.youtube.com/watch?v=niKAylKNIEI"
MIDNIGHT_SEC = 5 * 3600 - 57  # 0:00の57秒前 = 開始から17,943秒（YAJU&Uの0:57が0:00に一致）

# 特別固定: Love Together（？？？・MEGA）は常に最後に配置（新規が来ても維持）
LAST_FIXED_URL = "https://mega.nz/file/1nUEHAYA"


def place_last_fixed(rows):
    """Love Together を常に最後に配置する（新規が来ても最後を維持）"""
    idx = None
    for i, r in enumerate(rows):
        if LAST_FIXED_URL in r[5]:
            idx = i
            break
    if idx is None:
        return rows
    song = rows.pop(idx)
    rows.append(song)
    return rows


def place_midnight_cross(rows):
    """YAJU&Uの開始時刻（前の曲の合計）が MIDNIGHT_SEC に最も近くなるよう配置する。

    挿入位置の探索に加えて、前後の曲の入れ替えも試して最適化する。
    """
    idx = None
    for i, r in enumerate(rows):
        if MIDNIGHT_CROSS_URL in r[5]:
            idx = i
            break
    if idx is None:
        return rows
    song = rows.pop(idx)

    # 基準: 挿入位置のみでの最適解
    best = -1
    best_dist = float("inf")
    cum = 0
    for i in range(len(rows) + 1):
        dist = abs(cum - MIDNIGHT_SEC)
        if dist < best_dist:
            best_dist = dist
            best = i
        if i < len(rows):
            cum += float(rows[i][4]) or 0

    # さらに「前の1曲」と「後の1曲」を入れ替えて最適化（挿入位置bestは固定）
    best_swap = None
    cum_before = []
    c = 0
    for r in rows:
        cum_before.append(c)
        c += float(r[4]) or 0
    for swap_i in range(len(rows)):
        if LAST_FIXED_URL in rows[swap_i][5]:
            continue  # 最後固定曲（Love Together）は入れ替えない
        for j in range(len(rows)):
            if swap_i == j:
                continue
            if LAST_FIXED_URL in rows[j][5]:
                continue  # 最後固定曲（Love Together）は入れ替えない
            dur_i = float(rows[swap_i][4]) or 0
            dur_j = float(rows[j][4]) or 0
            # 開始時刻（bestまでの合計）が変わるのは「前の曲を抜いて後ろの曲を入れる」場合のみ
            if swap_i < best and j >= best:
                new_start = cum_before[best] - dur_i + dur_j
            else:
                new_start = cum_before[best]
            dist = abs(new_start - MIDNIGHT_SEC)
            if dist < best_dist:
                best_dist = dist
                best_swap = (swap_i, j)

    if best_swap:
        a, b = best_swap
        rows[a], rows[b] = rows[b], rows[a]
    rows.insert(best, song)
    return rows


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


def main() -> int:
    if not os.path.exists(SONGS_JSON) or not os.path.exists(PLAYLIST_CSV):
        print("エラー: songs.json / playlist.csv が見つかりません", file=sys.stderr)
        return 1

    with open(SONGS_JSON, encoding="utf-8") as f:
        songs = json.load(f)["songs"]

    with open(PLAYLIST_CSV, encoding="utf-8-sig") as f:
        lines = f.read().splitlines()

    if not lines:
        print("エラー: playlist.csv が空です", file=sys.stderr)
        return 1

    header = lines[0]
    existing = []
    for line in lines[1:]:
        if line.strip():
            c = parse_csv_line(line)
            if len(c) >= 7 and c[0]:
                existing.append(c)

    existing_urls = {row[5] for row in existing}
    new_songs = [s for s in songs if s.get("url", "") not in existing_urls]

    if not new_songs:
        # 新曲が無くても最後固定曲（Love Together）と日付跨ぎ固定曲（YAJU&U）の位置は維持する
        existing = place_last_fixed(existing)
        existing = place_midnight_cross(existing)
        for i, row in enumerate(existing, 1):
            row[0] = i
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["再生順", "曲名", "表示名", "ユーザーID", "時間(秒)", "URL", "ソース"])
        for row in existing:
            writer.writerow(row)
        csv_text = "\ufeff" + buf.getvalue()
        with open(PLAYLIST_CSV, "w", encoding="utf-8") as f:
            f.write(csv_text)
        print("✅ 新曲はありません（日付跨ぎ固定曲の位置を維持しました）")
        sync_playlist_to_site()
        return 0

    random.seed()
    for s in new_songs:
        pos = random.randint(0, len(existing))
        row = [
            0,
            s.get("title", ""),
            s.get("display_name", ""),
            s.get("user", ""),
            s.get("duration_sec", 0),
            s.get("url", ""),
            s.get("source", ""),
        ]
        existing.insert(pos, row)
        print(f"  挿入: {row[1][:45]} → {pos + 1}番目")

    # 最後固定曲の位置を維持（Love Together）
    existing = place_last_fixed(existing)
    # 日付跨ぎ固定曲の位置を維持（YAJU&U）
    existing = place_midnight_cross(existing)

    for i, row in enumerate(existing, 1):
        row[0] = i

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["再生順", "曲名", "表示名", "ユーザーID", "時間(秒)", "URL", "ソース"])
    for row in existing:
        writer.writerow(row)

    csv_text = "\ufeff" + buf.getvalue()
    with open(PLAYLIST_CSV, "w", encoding="utf-8") as f:
        f.write(csv_text)

    total_sec = sum(float(row[4]) for row in existing)
    now = datetime.now(JST).strftime("%Y-%m-%d %H:%M:%S JST")
    print(f"✅ 新曲 {len(new_songs)} 曲をランダム位置に挿入しました")
    print(f"   曲数: {len(existing)}曲 / 総時間: {total_sec:.0f}秒")
    print(f"   実行日時: {now}")
    sync_playlist_to_site()
    return 0


if __name__ == "__main__":
    sys.exit(main())
