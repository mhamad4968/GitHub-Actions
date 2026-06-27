# doc-lane 完了報告テンプレ（C4 / 2026-05-31 承認）

**制定**: 2026-05-31（浜田 GO）

## 固定 1 行（v5 目次・Word 編集後）

機械 verify（`verify_toc_completeness_v5.py` / `cio:doc-lane-gate`）が **OK** でも、報告末尾に必ず:

```
【浜田確認】Word 目次を 1 項目目視してください（例: Ｃ－２ p.22）。問題なければ 1 行で OK を返信。
```

## v5 目次確認済み（2026-05-31）

浜田 **目視 OK** — Ｃ－２／Ｃ－３ 含め問題なし。

## AI 手順

1. `npm run cio:doc-lane-gate -- --strict` → OK
2. `fix_toc_v5.py` / verify スクリプト実行（末尾で **`verify_v5_ch3_c5_references.py`** — 第３章 Ｃ－５/Ｃ－６ 誤参照 + **第８章 Ａ－３ 空欄**検出・P3）
3. 誤参照 NG 時: `python scripts\verify_v5_ch3_c5_references.py --apply`（Word 閉じてから。開いているときは `archive\*_ch3c5fix_*.docx` に代替保存）
4. **Ａ－３ 本文が空**のとき: `python scripts\patch_v5_a3_staff_summary.py`（`npm run doc-lane:patch-v5-a3`）→ 再 verify
5. チャット報告末尾に **上記固定 1 行**
6. 浜田 OK 後 → handoff に「目視 OK」1 行（任意）

## v5 第８章 Ａ－３（2026-06-01）

- **担当者向けまとめ**が見出しのみ空だったため `patch_v5_a3_staff_summary.py` で本文挿入（Ｃ－５ 生成AI / Ｃ－６ 問い合わせ 反映）
- 浜田 **目視 OK**

## PPTX（MCP / R-DOC-07）

1. `[doc-lane] レーン開始` 1 行（R-DOC-01）
2. `verify:doc-lane-governance` + `verify:doc-lane-pptx-phase1` → OK
3. `C:\tmp\資料作成\YYYYMMDD_<件名>\` に出力 + `*_backup.pptx`
4. MCP 作業 → `extract_slide_text` / `get_slide_info` read-back
5. チャット報告末尾に **固定 1 行**:

```
【浜田確認】PPTX を開いてレイアウト・図解・グラフを目視してください。問題なければ 1 行で OK を返信。
```

6. 浜田 OK 後 → `cio:task-complete-seal -- --lane doc-lane --scope "<件名> PPTX 浜田 OK"`

**パイロット OK**: `20260627_pilot-kintone-flow`（スライド幅 10 in・グラフ bounds 修正済み）

## DOCX — 月次セキュリティレポート（R-DOC-07 / R7）

1. `[doc-lane] レーン開始 — DOCX / 月次セキュリティ`
2. **浜田が §1 話題を提示** → AI が §1 起稿 + 図解
3. AI が **§2・事例表は枠のみ**（数値・事例はプレースホルダ — **AI が推測入力しない**）
4. 浜田が Word で §2 数値・事例 2 件を入力
5. read-back → チャット報告末尾:

```
【浜田確認】Word を開き、§1 周知を確認してください。§2 検知件数・社外事例 2 件を入力後、全体を目視してください。OK なら 1 行で返信。
```

8. 浜田 OK 後 → `cio:task-complete-seal -- --lane doc-lane --scope "<YYYYMM> セキュリティレポート 浜田 OK"`

## 関連

- `scripts/cio-doc-lane-gate.mjs`（OK 時にも同文を stdout）
- `C:\tmp\マニュアル\scripts\fix_toc_v5.py`
