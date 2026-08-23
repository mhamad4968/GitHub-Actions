#!/usr/bin/env python3
"""
683 ダッシュ用 Claude API 中継（自宅 PC・標準ライブラリのみ）。

  python scripts/user683_claude_relay.py

環境変数:
  ANTHROPIC_API_KEY (必須)
  ANTHROPIC_MODEL (既定 claude-opus-4-7)
  USER683_RELAY_PORT (既定 17884)
  USER683_CORS_ORIGIN (既定はブラウザ Origin を返す。固定したい場合は https://....cybozu.com 等)
  USER683_CLAUDE_TIMEOUT_MS (既定 120000)
"""
from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

RELAY_BUILD = "2026-06-01-user683-claude-relay-week-nonempty"
MAX_BODY = 2 * 1024 * 1024
PROMPT_DAY = (
    "以下は社内ユーザサポートの1日分の対応メモです。"
    "日本語で1〜2行・合計120字以内で要約してください。余計な前置きは不要。\n\n"
)
PROMPT_WEEK = (
    "以下は社内ユーザサポートの週次対応メモの抜粋です。"
    "当社の会計年度は**4月末が期末・5月が期首**（必要ならその週が会計年度のどの位置かに触れてよい。コーパスに無い「21日締め」等の変形会計月は捏造しない）。"
    "週内に**年末年始・ゴールデンウィーク・秋分の日前後の連休（いわゆるシルバーウィーク）**など稼働日が少ない期間が含まれる場合は、件数・負荷の変動をその文脈で読むこと。"
    "コーパス行頭の**[特別対応・…]**は土日祝に実際に対応した内容（本来は不要だが特別に行った対応）である。平日業務と同列に書かず、該当があれば要約の1点で区別して触れよ。件数0の土日祝は特別扱いしない。"
    "日本語で、箇条書き3点以内・合計200字以内で要約してください。コーパスに無い数値は書かないこと。"
    "**対応件数やメモが1日・少数件でも、コーパスに書かれた内容は必ず1行以上で要約すること。空欄で返さないこと。**"
    "余計な前置きは不要。\n\n"
)
PROMPT_MONTH = (
    "【前月の月次要約】と【当月の対応メモ抜粋】が続きます。"
    "当社の会計年度は**4月末が期末・5月が期首**（必要ならその暦月が会計年度上どの位置かに一言触れてよい。コーパスに無い変形会計カレンダーは捏造しない）。"
    "当月のコーパスに**年末年始・ゴールデンウィーク・秋分の日前後の連休（シルバーウィーク）**など大型休暇が含まれる場合は、稼働日減による件数・相談量の変動をコーパスに根拠がある範囲で言及すること（根拠が無いときは断定しない）。"
    "コーパス行頭の**[特別対応・…]**は土日祝に実際に対応した内容（本来は不要だが特別に行った対応）である。平日と同列の通常業務として書くな。"
    "日本語で次の形式で出力してください（全体420字程度・必ず完結した文で終える）:\n"
    "【先月対比】1〜2文。必ず「先月の…に対し、当月は…」の対比形。件数・相談内容・負荷の変化を書く（コーパス/前月要約に無い数値は書かない）。\n"
    "【当月の要点】箇条書き3点以内\n"
    "【特別対応（土日祝）】1〜3文で具体例（例: 土曜に…）。該当が無ければ「特別対応なし」。コーパスに無い内容は書かない。\n"
    "前月要約が空または「要約キャッシュなし」のときは、先頭行を「【先月対比】前月要約なし（初月または未取得）」とし、その後【当月の要点】【特別対応（土日祝）】を書くこと。余計な前置きは不要。\n\n"
)



def month_corpus_for_llm(month: Any) -> str:
    corpus = ""
    prev_key = ""
    prev_summary = ""
    cur_key = "当月"
    if isinstance(month, dict):
        corpus = str(month.get("corpus") or "")
        prev_key = str(month.get("prevYmKey") or "").strip()
        prev_summary = str(month.get("prevMonthSummary") or "").strip()
        ck = str(month.get("currentYmKey") or "").strip()
        if ck:
            cur_key = ck
    pyk = prev_key or "前月"
    prev_block = prev_summary if prev_summary else "（要約キャッシュなし・初回または未取得）"
    return (
        f"【前月の月次要約（{pyk}）】\n{prev_block}\n\n"
        f"【当月（{cur_key}）の対応メモ抜粋】\n{corpus.strip()}"
    )


def env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "")
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def _allow_origin(req: BaseHTTPRequestHandler) -> str:
    """kintone 等からの fetch 用。既定はリクエスト Origin を返す（loca.lt 前段で * だけが通らないことがある）。"""
    req_origin = (req.headers.get("Origin") or "").strip()
    configured = (os.environ.get("USER683_CORS_ORIGIN") or "").strip()
    if configured and configured != "*":
        return configured
    if req_origin:
        o = req_origin
        if o.startswith("https://") or o.startswith("http://localhost") or o.startswith("http://127.0.0.1"):
            return o
    return "*"


def cors_only_headers(req: BaseHTTPRequestHandler) -> dict[str, str]:
    allow = _allow_origin(req)
    h: dict[str, str] = {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Accept-Language, X-Requested-With",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Expose-Headers": "X-Relay-Build",
    }
    if allow != "*":
        h["Vary"] = "Origin"
    return h


def json_response_headers(req: BaseHTTPRequestHandler) -> dict[str, str]:
    return {
        "Content-Type": "application/json; charset=utf-8",
        "X-Relay-Build": RELAY_BUILD,
        **cors_only_headers(req),
    }


def claude_summarize(kind: str, corpus: str) -> str:
    text = (corpus or "").strip()
    if not text:
        return ""
    api_key = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
    if not api_key:
        return "（Claude API キー未設定: ANTHROPIC_API_KEY）"
    model = (os.environ.get("ANTHROPIC_MODEL") or "claude-opus-4-7").strip()
    if kind == "day":
        prompt = PROMPT_DAY + text
        max_tokens = 220
    elif kind == "month":
        prompt = PROMPT_MONTH + text
        max_tokens = 1024
    else:
        prompt = PROMPT_WEEK + text
        max_tokens = 320
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    timeout_s = max(5, env_int("USER683_CLAUDE_TIMEOUT_MS", 120000) // 1000)
    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=timeout_s) as res:
            raw = res.read().decode("utf-8")
    except HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:400]
        return f"（Claude HTTP {e.code}: {err_body}）"
    except URLError as e:
        return f"（Claude 接続エラー: {e.reason}）"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return raw.strip()[:500]
    blocks = data.get("content")
    if not isinstance(blocks, list):
        return ""
    parts: list[str] = []
    for block in blocks:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(str(block.get("text") or ""))
    return "".join(parts).strip()


class Handler(BaseHTTPRequestHandler):
    server_version = "user683-claude-relay/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[user683-claude-relay] " + (fmt % args) + "\n")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        for k, v in cors_only_headers(self).items():
            self.send_header(k, v)
        self.end_headers()

    def do_POST(self) -> None:
        if self.path != "/user683/summarize":
            self.send_response(404)
            for k, v in json_response_headers(self).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(b'{"error":"not_found"}')
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length > MAX_BODY:
            self.send_response(413)
            for k, v in json_response_headers(self).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(b'{"error":"body_too_large"}')
            return
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self.send_response(400)
            for k, v in json_response_headers(self).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(b'{"error":"json"}')
            return

        action = str(payload.get("action") or "week").strip()
        out: dict[str, Any] = {"build": RELAY_BUILD}
        if action == "month":
            month = payload.get("month")
            combined = month_corpus_for_llm(month) if isinstance(month, dict) else month_corpus_for_llm(None)
            out["monthSummary"] = claude_summarize("month", combined)
        else:
            days_in = payload.get("days")
            day_summaries: dict[str, str] = {}
            if isinstance(days_in, list):
                for item in days_in:
                    if not isinstance(item, dict):
                        continue
                    day = item.get("day")
                    corpus = str(item.get("corpus") or "")
                    if day is None:
                        continue
                    if not corpus.strip():
                        continue
                    day_summaries[str(day)] = claude_summarize("day", corpus)
            week_corpus = ""
            week = payload.get("week")
            if isinstance(week, dict):
                week_corpus = str(week.get("corpus") or "")
            out["daySummaries"] = day_summaries
            out["weekSummary"] = claude_summarize("week", week_corpus)

        body = json.dumps(out, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        for k, v in json_response_headers(self).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


def main() -> None:
    port = env_int("USER683_RELAY_PORT", 17884)
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    model = (os.environ.get("ANTHROPIC_MODEL") or "claude-opus-4-7").strip()
    print(
        f"[user683-claude-relay] RELAY_BUILD={RELAY_BUILD} "
        f"http://0.0.0.0:{port} POST /user683/summarize model={model}",
        flush=True,
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
