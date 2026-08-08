"""募集ツイートの全リプをPlaywrightで収集（鍵垢含む）して新規を突合する。

使い方:
    python scripts/broadcast/_collect_replies_ui.py
"""
import asyncio
import json
import re
import sys

from playwright.async_api import async_playwright

COOKIE = r"C:\Users\maeba\Downloads\新規 テキスト ドキュメント (42).txt"
TWEET_URL = "https://x.com/maebahesioru2/status/2084263136144822429"
OUT = r"C:\Users\maeba\Desktop\spaces_tests\_replies_ui.json"


async def main():
    with open(COOKIE, encoding="utf-8") as f:
        raw = json.load(f)
    pw_cookies = []
    for c in raw:
        if not isinstance(c, dict) or not c.get("name"):
            continue
        pw_cookies.append({
            "name": c["name"], "value": c["value"],
            "domain": c.get("domain", "").lstrip("."),
            "path": c.get("path", "/"),
            "expires": int(c.get("expirationDate", 0) or 0) or -1,
            "secure": bool(c.get("secure", False)),
            "httpOnly": bool(c.get("httpOnly", False)),
        })
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 2000},
        )
        await ctx.add_cookies(pw_cookies)
        page = await ctx.new_page()
        await page.goto(TWEET_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(10000)
        # スクロールして全リプをロード
        prev_count = 0
        for i in range(40):
            await page.mouse.wheel(0, 1200)
            await page.wait_for_timeout(700)
            # リプ数を確認
            articles = await page.query_selector_all("article")
            if len(articles) == prev_count and i > 5:
                # 2回連続同じなら停止
                break
            prev_count = len(articles)
        print(f"article数: {prev_count}", flush=True)
        # 各リプからユーザー名とテキストとリンクを抽出
        data = await page.evaluate("""() => {
            const out = [];
            document.querySelectorAll('article').forEach(a => {
                const text = (a.innerText || '');
                // ユーザー名（@で始まる）
                const userMatch = text.match(/@([\\w]+)/);
                const links = Array.from(a.querySelectorAll('a[href]')).map(x => x.href)
                    .filter(h => h.includes('youtu') || h.includes('nico') || h.includes('t.co') || h.includes('mega') || h.includes('gigafile') || h.includes('spotify'));
                out.push({
                    user: userMatch ? userMatch[1] : '?',
                    text: text.slice(0, 200),
                    links: [...new Set(links)],
                    isProtected: text.includes('保護されたアカウント') || text.includes('protected')
                });
            });
            return out;
        }""")
        print(f"収集: {len(data)}リプ", flush=True)
        for d in data:
            if d["links"] or d["isProtected"]:
                print(f"  @{d['user']} {'[鍵垢]' if d['isProtected'] else ''}: {d['links']}", flush=True)
                print(f"    {d['text'][:80]}", flush=True)
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
