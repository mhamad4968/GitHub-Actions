# -*- coding: utf-8 -*-
"""Copy approved security-training masters from C:\\tmp to docs/training/security/masters/."""
from __future__ import annotations

import json
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
DEFAULT_SRC = Path(r"C:\tmp\情報セキュリティ勉強会テキスト")
MASTERS = _REPO / "docs" / "training" / "security" / "masters"
NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


def _slide_sort_key(name: str) -> int:
    digits = "".join(ch for ch in name if ch.isdigit())
    return int(digits) if digits else 0


def extract_outline(pptx_path: Path) -> tuple[list[dict], int]:
    with zipfile.ZipFile(pptx_path) as zf:
        slide_names = sorted(
            [n for n in zf.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
            key=_slide_sort_key,
        )
        media_count = len([n for n in zf.namelist() if n.startswith("ppt/media/")])
        outline: list[dict] = []
        for i, sn in enumerate(slide_names, 1):
            root = ET.fromstring(zf.read(sn))
            texts = [
                el.text
                for el in root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t")
                if el.text
            ]
            joined = "".join(texts).replace("\u00a0", " ").strip()
            outline.append({"slide": i, "preview": joined[:240]})
        return outline, media_count


def main() -> int:
    src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src_dir.is_dir():
        print(f"[sync-masters] NG missing src: {src_dir}", file=sys.stderr)
        return 2

    MASTERS.mkdir(parents=True, exist_ok=True)

    pptx_candidates = [p for p in src_dir.glob("*.pptx") if p.is_file()]
    if not pptx_candidates:
        print("[sync-masters] NG no pptx in src root", file=sys.stderr)
        return 2
    pptx_src = max(pptx_candidates, key=lambda p: p.stat().st_mtime)

    dest_pptx = MASTERS / "2026-security-training-master.pptx"
    shutil.copy2(pptx_src, dest_pptx)

    meta: dict = {
        "year": 2026,
        "source_pptx": str(pptx_src),
        "dest_pptx": str(dest_pptx),
        "pptx_bytes": dest_pptx.stat().st_size,
        "approved_label": "2026年度 情報セキュリティ勉強会テキスト修正.pptx",
    }

    old_dir = src_dir / "OLD"
    word_candidates = sorted(old_dir.glob("*2026*.docx")) if old_dir.is_dir() else []
    if word_candidates:
        word_src = word_candidates[0]
        dest_docx = MASTERS / "2026-security-training-distribution.docx"
        shutil.copy2(word_src, dest_docx)
        meta["source_docx"] = str(word_src)
        meta["dest_docx"] = str(dest_docx)
        meta["docx_bytes"] = dest_docx.stat().st_size

    outline, media_count = extract_outline(dest_pptx)
    meta["slide_count"] = len(outline)
    meta["media_count"] = media_count

    meta_path = MASTERS / "2026-security-training-master.meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    outline_lines = [
        "# 2026 情報セキュリティ勉強会 — スライド概要（正本 PPTX から自動抽出）",
        "",
        f"- スライド数: {len(outline)}",
        f"- メディア: {media_count}",
        "- 正本: `masters/2026-security-training-master.pptx`",
        "",
    ]
    for row in outline:
        outline_lines.append(f"## S{row['slide']:02d}")
        outline_lines.append(row["preview"] or "（テキストなし）")
        outline_lines.append("")
    outline_path = MASTERS / "2026-security-training-master-outline.md"
    outline_path.write_text("\n".join(outline_lines), encoding="utf-8")

    print("[sync-masters] OK")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
