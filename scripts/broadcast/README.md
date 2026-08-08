# サンサンサンデー2026 自動放送システム

Xスペースで番組表（playlist.csv）の曲を自動再生し、サイトの番組表（/timetable）の
強調表示・スクロール・インジケーターをスペース進行に同期する。

## 構成

- `player.py` — 放送プレイヤー本体（スペース参加→スピーカーリクエスト→19時から再生）
- `start.py` — 放送プレイヤーをデタッチプロセスで起動（管理者のみ）
- `stop.py` — 放送プレイヤーを停止
- `prefetch.py` — 全曲のWAVを事前に取得（放送の安定化用）
- `cookies/okubahesioru_cookie.txt` — @okubahesioru のCookie（git管理外）
- `audio_cache/` — 曲の音声キャッシュ（git管理外）
- `state.json` — 途中再開用の状態（git管理外・自動生成）

## 使い方

### 事前準備: 全曲のWAVを取得しておく（任意・推奨）

```bash
# ⚠️ Mullvad等のVPNは「切断」してから実行（YouTubeのボット対策回避のため）
python scripts/broadcast/prefetch.py
```

### 放送開始

スペースのURLを渡して起動する:

```bash
python scripts/broadcast/start.py https://x.com/i/spaces/1DXGydznBYWKM
```

- リスナー参加 → スピーカーリクエスト送信
- ホスト（@maebahesioru2）が承認するのを待つ
- 19:00:00 JST になったら playlist.csv の曲を順番に再生
- 各曲の開始時に `public/data/now_playing.json` を更新 → サイトが同期

### 途中から再開（クラッシュ・終了・PCシャットダウン後）

```bash
python scripts/broadcast/start.py https://x.com/i/spaces/1DXGydznBYWKM
```

- `state.json` に「何曲目まで再生したか」が自動保存される
- 同じコマンドを再実行するだけで、**途中の曲から自動再開**する
- 曲の途中（秒単位）ではなく「その曲の頭から」再開される

### 放送停止

```bash
python scripts/broadcast/stop.py
```

### ログ

```bash
cat scripts/broadcast/player_log.txt
```

## 注意

- 再シャッフル禁止（決定済みの再生順を維持）。曲の追加は `scripts/add_songs.py` を使う
- 固定曲:
  - 97番 YAJU&U = 日付跨ぎ位置を自動維持
  - 366番 Love Together（？？？）= 最後の位置を自動維持
- 音声取得に失敗した曲は無音0.5秒でスキップされる
- 放送スクリプトはデタッチ起動のため、ターミナルを閉じても動き続ける
- YouTubeの音声取得は**VPN切断（自宅IP）**が必要（Mullvad接続中はボット対策にブロックされる）
- ニコニコ動画の曲はyt-dlpがログイン必要で失敗する場合がある（数曲のみ・失敗時は無音スキップ）
