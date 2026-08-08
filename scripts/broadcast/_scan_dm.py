"""DM全会話の最新メッセージをスキャンして楽曲URLを探す。

使い方:
    python scripts/broadcast/_scan_dm.py
"""
import asyncio
import json
import re
import sys
import time

sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

COOKIE = r"C:\Users\maeba\Downloads\新規 テキスト ドキュメント (36).txt"
OUT = r"C:\Users\maeba\Desktop\spaces_tests\_dm_scan.json"


async def main():
    with open(COOKIE, encoding="utf-8") as f:
        raw = json.load(f)
    cookies = {c["name"]: c["value"] for c in raw if isinstance(c, dict) and c.get("name")}

    import twikit
    client = twikit.Client(language="ja", impersonate="chrome124")
    client.set_cookies({"auth_token": cookies["auth_token"], "ct0": cookies["ct0"]})

    all_convos = []
    cursor = None
    for page in range(5):  # 最大5ページ
        try:
            if cursor:
                inbox = await client.get_dm_inbox(cursor=cursor)
            else:
                inbox = await client.get_dm_inbox()
            results = inbox._Result__results
            all_convos.extend(results)
            print(f"ページ{page+1}: {len(results)}会話（累計{len(all_convos)}）", flush=True)
            if not inbox.next_cursor or inbox.empty():
                break
            cursor = inbox.next_cursor
            await asyncio.sleep(1)
        except Exception as e:
            print(f"ERR: {str(e)[:150]}", flush=True)
            break

    print(f"総会話数: {len(all_convos)}", flush=True)

    # 各会話の最新メッセージを取得
    hits = []
    for conv in all_convos:
        conv_id = conv.id
        try:
            history = await conv.get_history(max_id=None)
            msgs = list(history)
            if not msgs:
                continue
            # 最新3件のテキスト
            recent = []
            for m in msgs[:3]:
                text = getattr(m, "text", "") or ""
                created = getattr(m, "created_at", "") or ""
                recent.append({"text": text[:200], "created_at": str(created)[:30]})
            # 楽曲URLチェック
            all_text = " ".join(r["text"] for r in recent)
            urls = re.findall(r"https?://\S+", all_text)
            media_urls = [u for u in urls if any(k in u for k in ["youtu", "nico", "t.co", "x.com", "mega", "gigafile", "suno"])]
            if media_urls:
                hits.append({
                    "conv_id": conv_id,
                    "media_urls": media_urls,
                    "recent": recent,
                })
                print(f"🎵 {conv_id}: {media_urls[:3]}", flush=True)
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  {conv_id}: ERR {str(e)[:100]}", flush=True)

    print(f"\n=== 楽曲URLヒット: {len(hits)}会話 ===", flush=True)
    for h in hits:
        print(f"  {h['conv_id']}: {h['media_urls']}", flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(hits, f, ensure_ascii=False, indent=1)
    print(f"保存: {OUT}", flush=True)

    await client.http.aclose()


if __name__ == "__main__":
    asyncio.run(main())
