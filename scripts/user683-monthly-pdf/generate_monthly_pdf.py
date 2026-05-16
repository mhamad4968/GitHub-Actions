#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ユーザサポート月次 PDF（2 ページ＝両面1枚想定）— 正本仕様
docs/plans/2026-05-15-user683-monthly-pdf-layout-spec.md

  python generate_monthly_pdf.py --year 2026 --month 5 --out C:/tmp/user-support-2026-05.pdf
  python generate_monthly_pdf.py --demo --out C:/tmp/user683-monthly-demo.pdf
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote
from urllib.request import Request, urlopen

# --- ReportLab ---
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

REPO = Path(__file__).resolve().parents[2]
APP682 = 682
SUMMARY_APP = 683
FC_DATE = "record_date"
FC_DAY_TOTAL = "day_total"
FC_AM_TEXT = "am_correspondence"
FC_PM_TEXT = "pm_correspondence"
FC_YM = "user683_dash_ym"
FC_W1 = "user683_week_1"
FC_W2 = "user683_week_2"
FC_W3 = "user683_week_3"
FC_W4 = "user683_week_4"
FC_W5 = "user683_week_5"
FC_W6 = "user683_week_6"
FC_MONTH = "user683_month"
FC_WEEK_CODES = [FC_W1, FC_W2, FC_W3, FC_W4, FC_W5, FC_W6]

MONTH_HEAD_CHARS = 1200

# --- 提出物デザイン（kintone UI には寄せない）---
ACCENT = HexColor("#1e3a5f")
ACCENT_LIGHT = HexColor("#334e68")
MUTED = HexColor("#64748b")
PANEL_BG = HexColor("#f1f5f9")
PANEL_BORDER = HexColor("#cbd5e1")
INK = HexColor("#0f172a")
BAR_DAY = HexColor("#0d9488")
BAR_MONTH = HexColor("#4f46e5")


def xml_safe(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def load_env() -> Dict[str, str]:
    p = REPO / ".env"
    env: Dict[str, str] = {}
    if not p.exists():
        return env
    for line in p.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def register_jp_font() -> str:
    name = "HeiseiKakuGo-W5"
    try:
        pdfmetrics.registerFont(UnicodeCIDFont(name))
        return name
    except Exception:
        return "Helvetica"


def kintone_headers(env: Dict[str, str]) -> Dict[str, str]:
    user = env.get("KINTONE_USERNAME", "")
    pw = env.get("KINTONE_PASSWORD", "")
    tok = base64.b64encode(f"{user}:{pw}".encode()).decode()
    h: Dict[str, str] = {"X-Cybozu-Authorization": tok}
    if env.get("KINTONE_BASIC_AUTH_USERNAME"):
        bu, bp = env["KINTONE_BASIC_AUTH_USERNAME"], env.get("KINTONE_BASIC_AUTH_PASSWORD", "")
        h["Authorization"] = "Basic " + base64.b64encode(f"{bu}:{bp}".encode()).decode()
    return h


def kintone_base(env: Dict[str, str]) -> str:
    base = env["KINTONE_BASE_URL"].rstrip("/")
    if base.endswith("/k"):
        base = base[:-2]
    return base.rstrip("/")


def kintone_get_all_records(env: Dict[str, str], app: int, query: str, fields: List[str]) -> List[dict]:
    base = kintone_base(env)
    h = kintone_headers(env)
    all_recs: List[dict] = []
    offset = 0
    limit = 500
    for _ in range(80):
        qs = f"app={app}&query={quote(query)}&fields[0]={fields[0]}"
        for i, f in enumerate(fields[1:], start=1):
            qs += f"&fields[{i}]={quote(f)}"
        qs += f"&totalCount=true&limit={limit}&offset={offset}"
        url = f"{base}/k/v1/records.json?{qs}"
        req = Request(url, headers=h)
        with urlopen(req, timeout=120) as resp:
            j = json.loads(resp.read().decode())
        batch = j.get("records") or []
        all_recs.extend(batch)
        if len(batch) < limit:
            break
        offset += len(batch)
    return all_recs


def pad2(n: int) -> str:
    return str(n).zfill(2)


def calendar_days_in_month(year: int, month: int) -> int:
    if month == 12:
        return (date(year + 1, 1, 1) - date(year, 12, 1)).days
    return (date(year, month + 1, 1) - date(year, month, 1)).days


def record_date_ymd(rec: dict) -> str:
    c = rec.get(FC_DATE) or {}
    v = c.get("value")
    if v is None:
        return ""
    return str(v)[:10]


def to_num(cell: Optional[dict]) -> float:
    if not cell or cell.get("value") is None or str(cell.get("value")).strip() == "":
        return 0.0
    try:
        return float(cell["value"])
    except (TypeError, ValueError):
        return 0.0


def get_text(rec: dict, code: str) -> str:
    c = rec.get(code) or {}
    v = c.get("value")
    return "" if v is None else str(v)


def aggregate682_max_dt(records: List[dict]) -> Dict[str, Dict[str, Any]]:
    m: Dict[str, Dict[str, Any]] = {}
    for rec in records:
        ymd = record_date_ymd(rec)
        if not ymd:
            continue
        dt = to_num(rec.get(FC_DAY_TOTAL))
        am = get_text(rec, FC_AM_TEXT)
        pm = get_text(rec, FC_PM_TEXT)
        if ymd not in m:
            m[ymd] = {"dt": 0.0, "am": "", "pm": ""}
        m[ymd]["dt"] = max(m[ymd]["dt"], dt)
        if am:
            m[ymd]["am"] += ("\n" if m[ymd]["am"] else "") + am
        if pm:
            m[ymd]["pm"] += ("\n" if m[ymd]["pm"] else "") + pm
    return m


def month_query(year: int, month: int) -> str:
    dim = calendar_days_in_month(year, month)
    end = f"{year}-{pad2(month)}-{pad2(dim)}"
    start = f"{year}-{pad2(month)}-01"
    return f'{FC_DATE} >= "{start}" and {FC_DATE} <= "{end}" order by {FC_DATE} asc'


def ym_key(year: int, month: int) -> str:
    return f"{year}-{pad2(month)}"


def add_months(y: int, m: int, delta: int) -> Tuple[int, int]:
    m0 = m + delta
    while m0 <= 0:
        m0 += 12
        y -= 1
    while m0 > 12:
        m0 -= 12
        y += 1
    return y, m0


def sum_month_from_recs(records: List[dict]) -> float:
    byd = aggregate682_max_dt(records)
    return float(sum(v["dt"] for v in byd.values()))


def fetch_summary_record(env: Dict[str, str], year: int, month: int) -> Optional[dict]:
    key = ym_key(year, month)
    q = f'{FC_YM} = "{key}"'
    recs = kintone_get_all_records(env, SUMMARY_APP, q, [FC_YM, *FC_WEEK_CODES, FC_MONTH])
    return recs[0] if recs else None


def make_bar_drawing(
    labels: List[str],
    values: List[float],
    caption: str,
    width: float,
    height: float,
    bar_color: Any,
    jp_font: str,
) -> Drawing:
    d = Drawing(width, height)
    cap_y = height - 10
    d.add(
        String(
            width / 2,
            cap_y,
            caption,
            fontName=jp_font,
            fontSize=8.5,
            fillColor=ACCENT_LIGHT,
            textAnchor="middle",
        )
    )
    chart = VerticalBarChart()
    chart.x = 36
    chart.y = 22
    chart.height = height - 48
    chart.width = width - 44
    chart.data = [values]
    chart.categoryAxis.categoryNames = labels
    chart.bars[0].fillColor = bar_color
    chart.valueAxis.valueMin = 0
    vmax = max(values) if values else 0
    chart.valueAxis.valueMax = max(1.0, vmax * 1.12) if vmax else 1.0
    chart.valueAxis.visibleGrid = 1
    chart.valueAxis.gridStrokeColor = HexColor("#e2e8f0")
    chart.valueAxis.gridStrokeWidth = 0.35
    chart.categoryAxis.strokeColor = PANEL_BORDER
    chart.valueAxis.strokeColor = PANEL_BORDER
    chart.valueAxis.labels.fontName = "Helvetica"
    chart.valueAxis.labels.fontSize = 6
    chart.valueAxis.labels.fillColor = MUTED
    chart.categoryAxis.labels.fontName = "Helvetica"
    chart.categoryAxis.labels.fontSize = 5.5
    chart.categoryAxis.labels.fillColor = MUTED
    d.add(chart, "")
    return d


def title_hero_table(ym_ja: str, line_sub: str, jp: str, full_w: float) -> Table:
    """提出物用ヒーロー帯（白文字・濃色面）。"""
    inner = (
        f'<font color="white" size="20"><b>{xml_safe(ym_ja)}</b></font><br/>'
        f'<font color="white" size="10">{xml_safe(line_sub)}</font>'
    )
    st = ParagraphStyle(
        "hero",
        fontName=jp,
        leading=24,
        alignment=1,
        spaceAfter=0,
        spaceBefore=0,
    )
    p = Paragraph(inner, st)
    tbl = Table([[p]], colWidths=[full_w], rowHeights=[24 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tbl


def chart_panel(flow: Any, full_w: float, min_h: float = 58 * mm) -> Table:
    """図表をカード化（画面スクショ風の裸置きを避ける）。"""
    t = Table([[flow]], colWidths=[full_w], rowHeights=[min_h])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.75, PANEL_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return t


def text_card(title: str, body_flow: Any, jp: str, full_w: float) -> Table:
    """テキストブロックをカード化。"""
    ht = ParagraphStyle(
        "tcap",
        fontName=jp,
        fontSize=9.5,
        textColor=colors.white,
        leading=12,
        backColor=ACCENT_LIGHT,
        borderPadding=(6, 8, 6, 8),
        spaceAfter=4,
    )
    head = Paragraph(f"<b>{xml_safe(title)}</b>", ht)
    inner = Table([[head], [body_flow]], colWidths=[full_w - 16 * mm])
    inner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 1), (-1, -1), PANEL_BG),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                ("LEFTPADDING", (0, 1), (-1, -1), 10),
                ("RIGHTPADDING", (0, 1), (-1, -1), 10),
            ]
        )
    )
    outer = Table([[inner]], colWidths=[full_w])
    outer.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, PANEL_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return outer


def paragraph_fit(text: str, font: str, width: float, max_h: float, start: float = 9.0, floor: float = 7.0) -> Paragraph:
    """Shrink font until wrap height fits max_h (approx)."""
    t = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    fs = start
    while fs >= floor - 1e-6:
        st = ParagraphStyle(
            name="Fit",
            fontName=font,
            fontSize=fs,
            leading=round(fs * 1.45, 1),
            alignment=TA_LEFT,
            textColor=INK,
        )
        p = Paragraph(t.replace("\n", "<br/>"), st)
        _w, h = p.wrap(width, max_h + 1000)
        if h <= max_h + 0.5:
            return p
        fs -= 0.5
    st = ParagraphStyle(
        name="FitMin",
        fontName=font,
        fontSize=floor,
        leading=round(floor * 1.45, 1),
        alignment=TA_LEFT,
        textColor=INK,
    )
    return Paragraph(t.replace("\n", "<br/>")[:8000] + "…", st)


_WD_JA = "月火水木金土日"


def ymd_label_ja(year: int, month: int, day: int) -> str:
    wd = _WD_JA[date(year, month, day).weekday()]
    return f"{year}年{month}月{day}日（{wd}）"


def normalize_ws_line(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def first_non_empty_lines_deduped(am: str, pm: str, max_lines: int = 3) -> List[str]:
    seen: Dict[str, bool] = {}
    out: List[str] = []
    blob = ((am or "") + "\n" + (pm or "")).split("\n")
    for raw in blob:
        t = normalize_ws_line(raw)
        if len(t) < 2 or t in seen:
            continue
        seen[t] = True
        out.append(t)
        if len(out) >= max_lines:
            break
    return out


def correspondence_summary_line(o: Optional[Dict[str, Any]], max_chars: int) -> str:
    """裏面一覧用・非LLM（先頭非空行の重複除去）。"""
    if not o:
        return "特記なし"
    lines = first_non_empty_lines_deduped(str(o.get("am") or ""), str(o.get("pm") or ""), 3)
    if not lines:
        return "特記なし"
    s = " ／ ".join(lines)
    if len(s) > max_chars:
        return s[: max_chars - 1] + "…"
    return s


def build_case_list_table(
    year: int, month: int, by_day: Dict[str, Dict[str, Any]], jp: str, table_w: float
) -> Table:
    """2 枚目（裏面）のみ：暦月全日の対応サマリー一覧。1 ページに収めるため行高を割当て・長月は字を詰める。"""
    dim = calendar_days_in_month(year, month)
    date_w = 28 * mm
    summ_w = max(40 * mm, table_w - date_w)
    if dim >= 31:
        fs, max_chars = 5.5, 62
    elif dim >= 30:
        fs, max_chars = 6.0, 72
    else:
        fs, max_chars = 6.5, 88
    st_head = ParagraphStyle(
        "clh",
        fontName=jp,
        fontSize=min(7.5, fs + 1.5),
        leading=min(10, fs + 3),
        textColor=colors.white,
        alignment=TA_LEFT,
    )
    st_d = ParagraphStyle(
        "cld",
        fontName=jp,
        fontSize=fs,
        leading=fs + 1.5,
        textColor=INK,
        alignment=TA_LEFT,
    )
    st_s = ParagraphStyle(
        "cls",
        fontName=jp,
        fontSize=fs,
        leading=fs + 1.5,
        textColor=INK,
        alignment=TA_LEFT,
    )
    data: List[List[Any]] = [
        [
            Paragraph("<b>" + xml_safe("日付") + "</b>", st_head),
            Paragraph("<b>" + xml_safe("対応内容サマリー") + "</b>", st_head),
        ]
    ]
    for d in range(1, dim + 1):
        ymd = f"{year}-{pad2(month)}-{pad2(d)}"
        o = by_day.get(ymd)
        lab = ymd_label_ja(year, month, d)
        summ = correspondence_summary_line(o, max_chars)
        data.append(
            [
                Paragraph(xml_safe(lab), st_d),
                Paragraph(xml_safe(summ), st_s),
            ]
        )
    # 裏面1枚に収めるよう行高を均等割当（SimpleDocTemplate の余白とヒーロー帯を差し引いた概算）
    page_budget = 208 * mm
    nrows = dim + 1
    rh = page_budget / float(nrows)
    row_heights = [rh] * nrows
    t = Table(data, colWidths=[date_w, summ_w], rowHeights=row_heights, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, 0), 3),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
                ("TOPPADDING", (0, 1), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 1),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.25, PANEL_BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL_BG]),
            ]
        )
    )
    return t


def build_demo_data() -> Tuple[int, int, Dict[str, Dict[str, Any]], List[float], List[str], dict]:
    year, month = 2026, 5
    dim = calendar_days_in_month(year, month)
    by_day: Dict[str, Dict[str, Any]] = {}
    for d in range(1, dim + 1):
        ymd = f"{year}-{pad2(month)}-{pad2(d)}"
        v = 2 + (d % 5) + (1 if d % 7 == 0 else 0)
        by_day[ymd] = {"dt": float(v), "am": f"デモ問い合わせ{d}件目", "pm": ""}
    day_vals = [by_day[f"{year}-{pad2(month)}-{pad2(d)}"]["dt"] for d in range(1, dim + 1)]
    six_vals = [120.0, 132.0, 118.0, 140.0, 125.0, float(sum(day_vals))]
    six_labs = ["2025/12", "2026/01", "2026/02", "2026/03", "2026/04", "2026/05"]
    summary = {
        FC_W1: "第1週: デモ週次コメント。",
        FC_W2: "第2週: 問い合わせは平日に集中。",
        FC_W3: "第3週: 変更依頼が複数。",
        FC_W4: "第4週: 障害対応は少なめ。",
        FC_W5: "",
        FC_W6: "",
        FC_MONTH: (
            "1. 全体概況と主要トピックス\n"
            "今月はデモデータのため件数にばらつきがあります。\n\n"
            "2. お問い合わせ件数トップ3のカテゴリ\n"
            "（カテゴリフィールド未整備のため本文は暫定集計を参照）\n\n"
            "3. 今後注視すべきリスク・課題\n"
            "リスク: 繁忙期に向けたリソース平準化が課題です。"
        ),
    }
    return year, month, by_day, six_vals, six_labs, summary


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int, default=None)
    ap.add_argument("--month", type=int, default=None)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()

    jp = register_jp_font()
    full_w = A4[0] - 30 * mm

    if args.demo:
        year, month, by_day, six_vals, six_labs, summary = build_demo_data()
    else:
        env = load_env()
        if not env.get("KINTONE_BASE_URL") or not env.get("KINTONE_USERNAME"):
            print("Missing .env kintone keys. Use --demo or configure .env", file=sys.stderr)
            return 2
        today = date.today()
        year = int(args.year) if args.year is not None else today.year
        month = int(args.month) if args.month is not None else today.month
        q = month_query(year, month)
        fields = [FC_DATE, FC_DAY_TOTAL, FC_AM_TEXT, FC_PM_TEXT]
        recs = kintone_get_all_records(env, APP682, q, fields)
        by_day = aggregate682_max_dt(recs)
        six_labs: List[str] = []
        six_vals: List[float] = []
        for i in range(6):
            y, m = add_months(year, month, -(5 - i))
            six_labs.append(f"{y}/{pad2(m)}")
            qm = month_query(y, m)
            r2 = kintone_get_all_records(env, APP682, qm, [FC_DATE, FC_DAY_TOTAL])
            six_vals.append(sum_month_from_recs(r2))
        srec = fetch_summary_record(env, year, month)
        summary = {code: get_text(srec, code) if srec else "" for code in FC_WEEK_CODES}
        summary[FC_MONTH] = get_text(srec, FC_MONTH) if srec else ""

    dim = calendar_days_in_month(year, month)
    day_labels = [str(d) for d in range(1, dim + 1)]
    day_vals = [float(by_day.get(f"{year}-{pad2(month)}-{pad2(d)}", {}).get("dt") or 0) for d in range(1, dim + 1)]

    month_full = summary.get(FC_MONTH, "")
    head = month_full[:MONTH_HEAD_CHARS] + ("…" if len(month_full) > MONTH_HEAD_CHARS else "")
    week_parts: List[str] = []
    for idx, code in enumerate(FC_WEEK_CODES, start=1):
        txt = str(summary.get(code, "")).strip()
        if txt:
            week_parts.append(f"【第{idx}週】\n{txt}")
    week_blob = "\n\n".join(week_parts) if week_parts else "（週次要約なし）"

    # --- 1枚目: 図は用紙幅に近い「大きめ」縦積み → 月次要約 → 週次 ---
    chart_w = full_w - 18 * mm
    chart_h = 58 * mm
    for _ in range(10):
        if chart_h <= 36 * mm:
            break
        chart_h -= 2 * mm

    drawing_day = make_bar_drawing(
        day_labels, day_vals, "日別件数推移（当月中）", chart_w, chart_h, BAR_DAY, jp
    )
    drawing_mon = make_bar_drawing(
        six_labs, six_vals, "月別件数比較（過去6暦月）", chart_w, chart_h, BAR_MONTH, jp
    )

    card_h = chart_h + 14 * mm
    pw1 = chart_panel(drawing_day, full_w, card_h)
    pw2 = chart_panel(drawing_mon, full_w, card_h)
    chart_stack = KeepTogether([pw1, Spacer(1, 3 * mm), pw2])

    text_inner_w = full_w - 28 * mm
    max_text_h_month = 44 * mm
    max_text_h_week = 44 * mm
    month_flow = paragraph_fit(head, jp, text_inner_w, max_text_h_month, start=8.5, floor=7.0)
    week_flow = paragraph_fit(week_blob, jp, text_inner_w, max_text_h_week, start=8.5, floor=7.0)

    story: List[Any] = []
    ym_ja = f"{year}年{month}月度"
    story.append(
        title_hero_table(ym_ja, "ユーザー問い合わせ 日別案件サマリー · ビジュアル集計", jp, full_w)
    )
    story.append(Spacer(1, 4 * mm))
    story.append(chart_stack)
    story.append(Spacer(1, 4 * mm))
    story.append(
        KeepTogether(
            [
                text_card("月次要約", month_flow, jp, full_w),
                Spacer(1, 4 * mm),
                text_card("週次サマリー（第1週〜第6週・入力がある週のみ）", week_flow, jp, full_w),
            ]
        )
    )

    # --- 2枚目（裏面）: 対応案件一覧（サマリー）のみ・2ページで完結 ---
    story.append(PageBreak())
    story.append(title_hero_table(ym_ja, "ユーザー問い合わせ 対応案件一覧（サマリー）", jp, full_w))
    story.append(Spacer(1, 3 * mm))
    story.append(build_case_list_table(year, month, by_day, jp, full_w))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(args.out),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=16 * mm,
        bottomMargin=20 * mm,
        title="user-support-monthly",
    )
    doc.build(story)
    print("Wrote", args.out.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
