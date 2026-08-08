"""募集ツイートの全リプを再取得して、既存CSVのURLと突合して新規を特定する。

使い方:
    python scripts/broadcast/_check_new_replies.py
"""
import asyncio
import json
import re
import sys
import time
import urllib.request

BASE = r"C:\Users\maeba\Desktop\spaces_tests"
sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

TWEET_ID = "2084263136144822429"  # マニアスプレッダーのサンサンサンデー楽曲募集
COOKIE = r"C:\Users\maeba\Downloads\新規 テキスト ドキュメント (36).txt"
CSV_PATH = r"C:\Users\maeba\Desktop\sunsun\public\data\playlist.csv"


def expand_tco(url: str) -> str:
    """t.co を展開して最終URLを返す"""
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.geturl()
    except Exception:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=12) as r:
                return r.geturl()
        except Exception:
            return url


def extract_media_urls(text: str) -> list:
    """テキストからメディアURLを抽出する"""
    urls = re.findall(r"https?://\S+", text)
    return urls


async def main():
    # 既存CSVのURL一覧
    import csv
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    existing_urls = set()
    for r in rows[1:]:
        if len(r) > 5 and r[5]:
            existing_urls.add(r[5].strip())
    print(f"既存URL数: {len(existing_urls)}")

    # Cookie読み込み
    with open(COOKIE, encoding="utf-8") as f:
        raw = json.load(f)
    cookies = {c["name"]: c["value"] for c in raw if isinstance(c, dict) and c.get("name")}

    import twikit
    client = twikit.Client(language="ja", impersonate="chrome124")
    client.set_cookies({"auth_token": cookies["auth_token"], "ct0": cookies["ct0"]})

    # 募集ツイートの全リプ取得
    all_replies = []
    try:
        tweet = await client.get_tweet_by_id(TWEET_ID)
        replies = list(tweet.replies or [])
        all_replies.extend(replies)
        print(f"取得: {len(all_replies)}件（1ページ目）", flush=True)
        # もっとリプライを取得
        while tweet.has_more_replies and len(all_replies) < 500:
            try:
                replies = await client._get_more_replies(TWEET_ID, all_replies[-1].id)
                all_replies.extend(replies)
                print(f"取得: {len(all_replies)}件", flush=True)
                await asyncio.sleep(2)
            except Exception as e:
                print(f"more_replies ERR: {str(e)[:100]}", flush=True)
                break
    except Exception as e:
        print(f"TweetDetail ERR: {str(e)[:200]}", flush=True)

    print(f"総リプ数: {len(all_replies)}", flush=True)

    # 新規候補を抽出（URL付き・既存URLに無いもの）
    new_candidates = []
    for t in all_replies:
        text = t.text or ""
        urls = extract_media_urls(text)
        if not urls:
            continue
        author = getattr(t, "user", None)
        author_name = getattr(author, "screen_name", "?") if author else "?"
        tweet_id = t.id
        for u in urls:
            if "t.co" in u:
                expanded = expand_tco(u)
            else:
                expanded = u
            # 既存URLと比較
            if expanded in existing_urls:
                continue
            new_candidates.append({
                "tweet_id": tweet_id,
                "user": author_name,
                "text": text[:150],
                "url": expanded,
            })
            break  # 1ツイート1曲として扱う（複数URLは別途）

    print(f"\n=== 新規候補: {len(new_candidates)}件 ===", flush=True)
    for c in new_candidates:
        print(f"  @{c['user']} ({c['tweet_id']}): {c['text'][:60]}", flush=True)
        print(f"    URL: {c['url']}", flush=True)

    # 保存
    with open(f"{BASE}/_new_replies.json", "w", encoding="utf-8") as f:
        json.dump(new_candidates, f, ensure_ascii=False, indent=1)

    await client.http.aclose()
    print("\n保存: _new_replies.json", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
