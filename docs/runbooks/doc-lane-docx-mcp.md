# doc-lane — Word MCP 資料作成 runbook

> **制定**: 2026-06-27（フェーズ2）  
> **仕様正本**: `docs/plans/2026-06-27-doc-lane-phase2-word-spec.md`  
> **Skill**: `.cursor/skills/office-docx-doc-lane/SKILL.md`  
> **既存 DOCX パッチ**: `docs/runbooks/docx-patch-windows.md`（python-docx）  
> **月次セキュリティ**: `docs/runbooks/monthly-security-report.md`

---

## 1. いつ使うか

- **新規** Word 資料（見出し・表・画像）
- **経営会議セキュリティレポート**への **追加図解**（フロー図 PNG 等）
- MCP **`office-word`** で `add_picture` / `add_table` 等

### MCP 名称（Cursor UI と AI 内部）

| 見える場所 | 名称 |
|------------|------|
| **Cursor 設定 / mcp.json キー** | `office-word` ← 浜田さんが見るのはこちらで **正常** |
| **AI エージェントの MCP 呼び出し** | `user-office-word`（Cursor が内部付与） |
| **descriptor パス** | `mcps/user-office-word/tools/*.json` |

PowerPoint も同型（UI=`office-powerpoint` / 内部=`user-office-powerpoint`）。

**使わない**:

- 月次レポート **定型生成**（§1 本文・§2 数値・matplotlib グラフ 5 枚）→ **`npm run doc-lane:security-report`** を先に実行
- v5 マニュアル精密パッチ → `docx-patch-windows.md` + `cio:doc-lane-gate`
- 段落 `.text` 直接代入 → **禁止**（書式消失）

---

## 2. 着手前チェック（必須）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run verify:doc-lane-governance
npm run verify:doc-lane-word-phase2
npm run health-check
npm run cio:tool:route -- --intent "Word セキュリティレポート 図解 グラフ" --log
```

| 結果 | 対応 |
|------|------|
| verify NG | **作業中止** |
| health-check で office-word ⏭ | **Windows Cursor で再開** |
| セキュリティ公式資料 | **DeepSeek レビュー必須**（R-DOC-08） |

**作業フォルダ**:

```
C:\tmp\資料作成\
  YYYYMMDD_<件名>\
    <件名>.docx
    <件名>_backup.docx
    _charts\          ← builder 生成 PNG
    exports\          ← Figma PNG 等
```

---

## 3. 月次セキュリティレポート（経営会議）

### 3.1 役割分担（浜田確定 2026-06-27）

| 部分 | AI | 浜田 |
|------|-----|------|
| **§1 周知** | 提示ネタを中心に **全文・図解** | 話題を出す → 目視 OK |
| **§2 検知** | **枠のみ** | 数値入力 |
| **社外事例表** | **表枠のみ**（2 行空欄） | 2 件入力 |

§2・事例に **AI が数値や事例を推測して埋めない**。

### 3.2 浜田入力（§2・事例 — 任意タイミング）

Word 上で直接編集、または JSON 更新後に builder 再実行。

### 3.2 builder 実行（グラフ自動）

```powershell
npm run doc-lane:security-report -- --config scripts/data/monthly-security-report-YYYYMM.json
```

builder が自動生成するグラフ（`_charts/`）:

| ファイル | 内容 |
|----------|------|
| `chart-victim-scale.png` | 被害規模別 |
| `chart-business-impact.png` | 業務影響 |
| `chart-recovery-period.png` | 復旧期間 |
| `chart-backup-restore.png` | バックアップ復元 |
| `chart-recovery-cost.png` | 復旧費用（棒グラフ） |

DOCX 内 **2 列 × 3 行** グリッドに挿入済み。

### 3.3 MCP で追加図解（任意）

1. 複雑フロー → **figma** `generate_diagram` → `exports/*.png`
2. MCP:

```
add_picture(
  filename="C:\\tmp\\資料作成\\...\\output.docx",
  image_path="C:\\tmp\\資料作成\\...\\exports\\flow.png",
  width=5.5
)
```

3. 挿入位置を制御したい場合 → 先に `add_page_break` または `insert_header_near_text`

---

## 4. MCP ツール選択

| やりたいこと | ツール | 備考 |
|--------------|--------|------|
| 新規 DOCX | `create_document` | 新規パス。上書きしない |
| 見出し | `add_heading` | level 1–9 |
| 本文 | `add_paragraph` | style 指定可 |
| 表 | `add_table` | rows/cols + data |
| **画像・グラフ PNG** | **`add_picture`** | width インチ指定 |
| 目次 | `add_table_of_contents` | 新規資料向け |
| 改ページ | `add_page_break` | |
| 検索置換 | `search_and_replace` | 既存 doc |
| read-back | `get_document_text` / `get_document_outline` | **必須** |

**descriptor 必読**: `mcps/user-office-word/tools/*.json`

---

## 5. 画像サイズ目安（A4 本文）

| 用途 | width（インチ） |
|------|-----------------|
| 1 枚全幅 | 5.5–6.0 |
| 2 列グリッド内 | 2.4–2.8（builder 既定 2.55） |
| フロー図（横長） | 6.0、必要なら改ページ後 |

---

## 6. 禁止・注意

- 完成 DOCX の **Git commit**
- doc-lane 中の **kintone deploy**
- バックアップなし上書き
- read-back 失敗後の再保存
- builder 実行前の MCP 本文大量追記（テンプレ書式崩れ）

---

## 7. 完了

報告末尾:

```
【浜田確認】C:\tmp\資料作成\<path> を Word で開き、本文・表・グラフ・図解を目視してください。OK なら 1 行で返信。
```

浜田 OK 後:

```bash
npm run cio:task-complete-seal -- --lane doc-lane --scope "<件名> DOCX 浜田 OK"
```

---

## 8. トラブル

| 症状 | 対処 |
|------|------|
| 日本語フォント欠落（グラフ） | builder の `setup_japanese_font()` — MS Gothic / Yu Gothic |
| 画像が巨大 | `add_picture` の width を 5.5 以下に |
| 書式消失 | `.text` 代入を疑う → `docx_template_format` へ |
| MCP ⏭ | Windows Cursor 再起動、`health-check` 再実行 |
