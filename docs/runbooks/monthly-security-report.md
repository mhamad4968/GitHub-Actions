# 月次 情報セキュリティレポート runbook（R1/R3）

> **制定**: 2026-06-05（夕反省 **R1–R6 全 GO**）

## 正本

| 項目 | パス |
|------|------|
| builder | `scripts/build-monthly-security-report.py` |
| 書式 lib | `scripts/lib/docx_template_format.py` |
| 月次 JSON | `scripts/data/monthly-security-report-YYYYMM.json` |
| 作業ディレクトリ | `C:\tmp\資料作成`（**都度作成** — `data/c-tmp-workspace-registry.json`） |
| テンプレ DOCX | `C:\tmp\資料作成\*YYYYMM11.docx`（前月分） |
| 出力 DOCX | `C:\tmp\資料作成\【YYYY年M月度経営会議資料】…docx` |

> **2026-06-14**: `資料作成` は棚卸しで削除済。月次作業前に `npm run cio:tmp:ensure-workspaces` または builder 実行（`work_dir` 自動 mkdir）。

## 実行

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run doc-lane:security-report
# または
python scripts/build-monthly-security-report.py --config scripts/data/monthly-security-report-202605.json
```

## §0 着手前チェックリスト（R3 — 浜田 1 行確認）

| # | 確認項目 | 未確定時 |
|---|----------|----------|
| 1 | **ネットワーク監視** 件数（§2） | JSON の `section2` を更新。`detection_confirmed: false` のまま禁止 |
| 2 | **SKYSEA 監視** 件数（§2） | 同上 |
| 3 | **社外事例** 2 件（表） | `external_cases` を差替え |
| 4 | テンプレ DOCX が **前月経営会議資料** と一致 | `template_glob` 確認 |

**浜田確認例**: 「5月 SKYSEA 0・ネットワーク 0・事例2件で OK」→ JSON で `detection_confirmed: true` にして build。

## 書式

- **`.text` 代入禁止** — `docx_template_format.set_paragraph_text` を使用（`docs/runbooks/docx-patch-windows.md`）
- 生成後 Word で目視。必要なら `python scripts/test_docx_template_format.py`

## 新規月の追加

1. `npm run cio:tmp:ensure-workspaces`（`C:\tmp\資料作成` が無ければ作成）
2. 前月 DOCX を `C:\tmp\資料作成\` に配置
3. `scripts/data/monthly-security-report-YYYYMM.json` をコピー作成
4. `output_filename` / `section2` / `external_cases` を更新
5. `npm run doc-lane:security-report -- --config scripts/data/monthly-security-report-YYYYMM.json`

## 関連

- `docs/runbooks/doc-lane.md` — markdownify フォールバック（R6）
- `docs/runbooks/docx-patch-windows.md` — Word 共通ルール（R2/R5）
