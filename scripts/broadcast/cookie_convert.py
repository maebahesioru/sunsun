"""JSON形式のCookie（ブラウザ拡張のエクスポート）をNetscape cookies.txt形式に変換する。

使い方:
    python scripts/broadcast/cookie_convert.py <input.json> <output.txt>
"""
import json
import sys


def convert(json_path: str, out_path: str) -> int:
    with open(json_path, encoding="utf-8") as f:
        cookies = json.load(f)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# Netscape HTTP Cookie File\n")
        for c in cookies:
            if not isinstance(c, dict) or not c.get("name"):
                continue
            domain = c.get("domain", "")
            include_sub = "TRUE" if domain.startswith(".") else "FALSE"
            path = c.get("path", "/")
            secure = "TRUE" if c.get("secure", False) else "FALSE"
            expiry = str(int(c.get("expirationDate", c.get("expires", 0)) or 0))
            name = c.get("name", "")
            value = c.get("value", "")
            f.write(f"{domain}\t{include_sub}\t{path}\t{secure}\t{expiry}\t{name}\t{value}\n")
    print(f"変換完了: {len(cookies)} cookies → {out_path}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方: python cookie_convert.py <input.json> <output.txt>")
        sys.exit(1)
    sys.exit(convert(sys.argv[1], sys.argv[2]))
