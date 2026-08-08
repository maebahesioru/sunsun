"""DM全会話の全履歴をスキャンして楽曲URLを全部探す（徹底版）。

使い方:
    python scripts/broadcast/_scan_dm_full.py
"""
import asyncio
import json
import re
import sys

sys.path.insert(0, r"C:\Users\maeba\AppData\Local\Temp\twifork")

COOKIE = r"C:\Users\maeba\Downloads\新規 テキスト ドキュメント (36).txt"
OUT = r"C:\Users\maeba\Desktop\spaces_tests\_dm_scan_full.json"


async def main():
    with open(COOKIE, encoding="utf-8") as f:
        raw = json.load(f)
    cookies = {c["name"]: c["value"] for c in raw if isinstance(c, dict) and c.get("name")}

    import twikit
    client = twikit.Client(language="ja", impersonate="chrome124")
    client.set_cookies({"auth_token": cookies["auth_token"], "ct0": cookies["ct0"]})

    # 全会話をページングで取得
    all_convos = []
    cursor = None
    for page in range(10):
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
            print(f"inbox ERR: {str(e)[:120]}", flush=True)
            break

    print(f"総会話数: {len(all_convos)}", flush=True)

    # 各会話の全履歴を取得
    results = []
    for conv in all_convos:
        conv_id = conv.id
        all_msgs = []
        try:
            hist = await conv.get_history(max_id=None)
            msgs = list(hist)
            all_msgs.extend(msgs)
            # ページング
            guard = 0
            while getattr(hist, "next_cursor", None) and guard < 20:
                hist = await conv.get_history(max_id=hist.next_cursor)
                msgs = list(hist)
                all_msgs.extend(msgs)
                guard += 1
                await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  {conv_id}: hist ERR {str(e)[:80]}", flush=True)

        print(f"{conv_id}: {len(all_msgs)}メッセージ", flush=True)

        # 全メッセージからURLを抽出
        for m in all_msgs:
            text = getattr(m, "text", "") or ""
            if not text:
                continue
            urls = re.findall(r"https?://\S+", text)
            media_urls = [u for u in urls if any(k in u for k in ["youtu", "nico", "t.co", "x.com", "mega", "gigafile", "suno"])]
            if media_urls:
                results.append({
                    "conv_id": conv_id,
                    "msg_id": getattr(m, "id", "?"),
                    "created": str(getattr(m, "created_at", ""))[:30],
                    "text": text[:200],
                    "urls": media_urls,
                })
        await asyncio.sleep(0.3)

    print(f"\n=== 楽曲URLヒット: {len(results)}メッセージ ===", flush=True)
    for r in results:
        print(f"  {r['conv_id'][:35]}: {r['urls']}", flush=True)
        print(f"    text: {r['text'][:80]}", flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    print(f"保存: {OUT}", flush=True)

    await client.http.aclose()


if __name__ == "__main__":
    asyncio.run(main())
