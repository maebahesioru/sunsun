"""YouTubeのDRM/制限付き動画をWebAudio録音で取得する（最終手段）。

使い方:
    python scripts/broadcast/yt_capture.py <video_id> <録音秒数> <出力wav>
"""
import asyncio
import base64
import os
import subprocess
import sys

from playwright.async_api import async_playwright


async def capture(video_id: str, duration_sec: int, out_wav: str) -> str:
    """YouTube動画をWebAudio録音してWAVを返す"""
    tmp_dir = os.path.dirname(out_wav)
    os.makedirs(tmp_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--autoplay-policy=no-user-gesture-required"],
        )
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
        )
        page = await ctx.new_page()
        await page.goto(f"https://www.youtube.com/watch?v={video_id}", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)

        ok = await page.evaluate("""() => {
            try {
                const v = document.querySelector('video');
                if (!v) return 'no video';
                const ctx = new AudioContext();
                const src = ctx.createMediaElementSource(v);
                const dest = ctx.createMediaStreamDestination();
                src.connect(ctx.destination);
                src.connect(dest);
                window.__chunks = [];
                const recorder = new MediaRecorder(dest.stream);
                recorder.ondataavailable = async e => {
                    if (e.data.size > 0) {
                        const buf = await e.data.arrayBuffer();
                        window.__chunks.push(btoa(String.fromCharCode(...new Uint8Array(buf))));
                    }
                };
                window.__recorder = recorder;
                recorder.start(1000);
                v.muted = false;
                v.volume = 1.0;
                v.play().catch(() => {});
                return 'started';
            } catch (e) { return 'err: ' + e.message; }
        }""")
        if ok != "started":
            await browser.close()
            raise RuntimeError(f"録音開始失敗: {ok}")

        # 録音時間分待機（動画の長さ + バッファ）
        await asyncio.sleep(duration_sec + 5)

        # チャンクを回収
        chunks = await page.evaluate("() => window.__chunks")
        await browser.close()

    if not chunks:
        raise RuntimeError("録音データなし")

    # MediaRecorderのチャンクはストリームの一部（ヘッダーは最初のみ）なので
    # バイナリで連結して1つのwebmにする
    raw = b"".join(base64.b64decode(c) for c in chunks)
    joined_webm = os.path.join(tmp_dir, f"_joined_{video_id}.webm")
    with open(joined_webm, "wb") as f:
        f.write(raw)

    # WAV変換
    r2 = subprocess.run(
        ["ffmpeg", "-y", "-i", joined_webm, "-ac", "1", "-ar", "48000", "-f", "wav", out_wav],
        capture_output=True, timeout=300,
    )
    if r2.returncode != 0 or not os.path.exists(out_wav):
        raise RuntimeError(f"WAV変換失敗: {r2.stderr.decode('utf-8', errors='replace')[:200]}")

    try:
        os.remove(joined_webm)
    except OSError:
        pass
    return out_wav


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("使い方: python yt_capture.py <video_id> <録音秒数> <出力wav>")
        sys.exit(1)
    out = asyncio.run(capture(sys.argv[1], int(sys.argv[2]), sys.argv[3]))
    print(f"保存: {out}")
