# 月次 情報セキュリティレポート runbook（R1/R3）

> **制定**: 2026-06-05（夕反省 **R1–R6 全 GO**）  
> **経営会議正本**: `docs/runbooks/keiei-kaigi-security-report.md`（R-DOC-11 / R7）

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

> **2026-06-27 運用確定（浜田）**: §1 は浜田提供ネタを中心に AI 起稿。§2・社外事例は **枠のみ AI**、数値・中身は **浜田入力**。  
> **2026-08-10**: 注意喚起の **ネタ一覧**（701/631→`C:\tmp\資料作成\ネタ保存用`）は **レポート本体と別レーン** — 正本 `docs/runbooks/keiei-kaigi-neta-from-security-next.md`。

## 役割分担（R7 — 2026-06-27 浜田確定）

| セクション | AI チーム | 浜田 |
|------------|-----------|------|
| **§1 周知事項** | 浜田が指定した **話題・ネタを中心**に本文・チェックポイント・図解案を起稿 | **話題・ネタを提示**（URL・PDF・キーワード可）→ 目視 OK |
| **§2 検知状況** | **見出し・項目枠のみ**（ウイルス / ネットワーク / SKYSEA の行） | **件数・数値を入力**（Word 直接 or JSON 更新後再 build） |
| **社外事例表** | **表ヘッダ + 空行 2 件分の枠**（列: № / 公開日 / 分類 / 概要 / 特徴） | **2 件の中身を入力** |

**AI が自律で書いてはいけないもの**

- §2 の検知件数（推測・前月コピー禁止）
- 社外事例の具体的内容（AI がネタを選んで埋めない）

**プレースホルダ例**（§2 / 事例表）:

```
・ネットワーク監視（疑わしい通信検知件数）：（浜田入力）
・ＰＣ端末監視（SKYSEA監視で疑わしい検知）：（浜田入力）
```

事例表は `事例１` / `事例２` 行を空欄または「（要入力）」で残す。

## 標準フロー（R7）

1. 浜田 → **§1 の話題**をチャットで提示
2. AI → `[doc-lane]` 宣言 → verify → **§1 本文 + 図解**を起稿（前月 DOCX をテンプレ copy）
3. AI → **§2 枠 + 事例表枠**のみ追加（数値・事例はプレースホルダ）
4. 浜田 → Word で **§2 数値・事例 2 件**を入力
5. 浜田 → 全体目視 OK → `cio:task-complete-seal`

---

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run doc-lane:security-report
# または
python scripts/build-monthly-security-report.py --config scripts/data/monthly-security-report-202605.json
```

## §0 着手前チェックリスト（R3 / R7）

| # | 確認項目 | 担当 |
|---|----------|------|
| 1 | **§1 周知の話題・ネタ** | **浜田提示** → AI 起稿 |
| 2 | **§2 検知件数** | **浜田入力**（AI は枠のみ） |
| 3 | **社外事例 2 件** | **浜田入力**（AI は表枠のみ） |
| 4 | テンプレ DOCX = **前月経営会議資料** | AI が copy |

**AI 着手に必要な入力（浜田）**: §1 の話題だけ。§2・事例の数値は **後から Word で入力**でよい。

**旧 R3 確認例**（浜田が JSON/build 前に数値を先に渡す場合のみ）: 「6月 SKYSEA 0・ネットワーク 0・事例2件で OK」→ `detection_confirmed: true` で build。

## 書式

- **`.text` 代入禁止** — `docx_template_format.set_paragraph_text` を使用（`docs/runbooks/docx-patch-windows.md`）
- 生成後 Word で目視。必要なら `python scripts/test_docx_template_format.py`

## 図解・グラフ（フェーズ2 — 2026-06-27）

1. **定型グラフ 5 枚** — builder が `_charts/*.png` を生成し DOCX 2×3 グリッドに挿入（自動）
2. **追加フロー図** — figma `generate_diagram` → `office-word` MCP `add_picture`
3. 正本: `docs/runbooks/doc-lane-docx-mcp.md` §3

着手前:

```powershell
npm run verify:doc-lane-word-phase2
npm run verify:doc-lane-governance
```

**DeepSeek 必須**（R-DOC-08 — 公式セキュリティ資料）。

## 新規月の追加

1. `npm run cio:tmp:ensure-workspaces`（`C:\tmp\資料作成` が無ければ作成）
2. 前月 DOCX を `C:\tmp\資料作成\` に配置
3. `scripts/data/monthly-security-report-YYYYMM.json` をコピー作成
4. `output_filename` / `section2` / `external_cases` を更新
5. `npm run doc-lane:security-report -- --config scripts/data/monthly-security-report-YYYYMM.json`

## 関連

- `scripts/monthly-security-rounds.mjs` — 月次巡回スケルトン（cve-search + DDG · spec v3.1 SCR-6）
- `docs/runbooks/keiei-kaigi-security-report.md` — **経営会議正本（R-DOC-11）**
- `docs/runbooks/doc-lane.md` — markdownify フォールバック（R6）
- `docs/runbooks/docx-patch-windows.md` — Word 共通ルール（R2/R5）
