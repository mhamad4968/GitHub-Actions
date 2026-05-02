#!/usr/bin/env python3
import json
import base64
import sys
from pathlib import Path
from urllib.request import Request, urlopen

repo = Path(__file__).resolve().parents[1]
env = {}
for line in (repo / ".env").read_text(encoding="utf-8").splitlines():
    s = line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k, _, v = s.partition("=")
    env[k.strip()] = v.strip().strip('"').strip("'")

base = env["KINTONE_BASE_URL"].rstrip("/").removesuffix("/k")
user = env["KINTONE_USERNAME"]
pw = env["KINTONE_PASSWORD"]
tok = base64.b64encode(f"{user}:{pw}".encode()).decode()
h = {"X-Cybozu-Authorization": tok}
if env.get("KINTONE_BASIC_AUTH_USERNAME"):
    bu, bp = env["KINTONE_BASIC_AUTH_USERNAME"], env["KINTONE_BASIC_AUTH_PASSWORD"]
    h["Authorization"] = "Basic " + base64.b64encode(f"{bu}:{bp}".encode()).decode()

url = f"{base}/k/v1/records.json?app=677&query=limit%201&totalCount=true"
req = Request(url, headers={k: v for k, v in h.items() if k != "Content-Type"})
with urlopen(req, timeout=60) as resp:
    j = json.loads(resp.read().decode())
print("677 totalCount:", j.get("totalCount"))
