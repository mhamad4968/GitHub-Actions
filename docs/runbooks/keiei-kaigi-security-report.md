# 経営会議 — 情報セキュリティレポート 運用正本

> **制定**: 2026-06-27（浜田 GO — R7 役割分担確定）  
> **上位**: `docs/runbooks/doc-lane-autonomous-governance.md`（R-DOC-01〜11）  
> **月次手順**: `docs/runbooks/monthly-security-report.md`  
> **ひな形**: `templates/doc-lane/keiei-kaigi-security-report-structure.md`  
> **テンプレ台帳**: `templates/doc-lane/keiei-kaigi-docx-registry.json`

---

## §0. 対象

| 対象 | 対象外 |
|------|--------|
| 経営会議提出の **情報セキュリティレポート（Word DOCX）** | 予実・PC台帳・kintone 資料 |
| 月次 1 本（§1 周知 + §2 検知 + 社外事例） | 社外配布・ press 向け声明 |

レーン: **`[doc-lane] レーン開始 — DOCX / 経営会議セキュリティ YYYYMM`**（R-DOC-01）

---

## §1. 憲法・ゲート（必読）

| ルール | 内容 |
|--------|------|
| **R-DOC-01** | kintone deploy 混在禁止 |
| **R-DOC-04** | 正本 `C:\tmp\資料作成\` — DOCX **Git commit 禁止** |
| **R-DOC-07** | 浜田目視 OK まで「完成」にしない |
| **R-DOC-08** | **DeepSeek 必須**（公式セキュリティ資料） |
| **R-DOC-11** | 本 runbook — §1 AI 起稿 / §2・事例 枠のみ（R7） |

着手前:

```powershell
npm run verify:doc-lane-keiei-kaigi
npm run verify:doc-lane-governance
npm run verify:doc-lane-word-phase2
npm run health-check
```

---

## §2. ひな形（テンプレ DOCX）

### 2.1 正本の置き場

```
C:\tmp\資料作成\
  【YYYY年M月度経営会議資料】YYYY年MM月情報セキュリティレポート….docx  ← 前月分を次月テンプレに
```

**推奨ベース**: **直近の経営会議提出版**（2026-06-27 時点 → 6月版＝5月レポート、グラフ・IPA 表入り）

台帳: `templates/doc-lane/keiei-kaigi-docx-registry.json`

### 2.2 ファイル命名

| 要素 | 例 |
|------|-----|
| 経営会議月 | `【2026年7月度経営会議資料】` |
| レポート対象月 | `2026年06月情報セキュリティレポート` |
| 出力日 suffix | `20260710.docx`（任意） |

### 2.3 文書構造（固定枠）

詳細: `templates/doc-lane/keiei-kaigi-security-report-structure.md`

```
表紙（タイトル・会議日・システム推進室）
１. 周知事項          ← AI 起稿（浜田ネタ中心）
  ├ 注意喚起見出し
  ├ 本文・出典
  ├ チェックポイント表 or 箇条書き
  ├ （任意）グラフ・図解
  └ 対処フロー表（5×2 等）
２. 検知状況          ← AI は枠のみ
  ├ ウイルス感染
  ├ ネットワーク監視件数  （浜田入力）
  └ SKYSEA 件数           （浜田入力）
社外事例表（3×5）     ← AI は表枠のみ（浜田入力 2 件）
以上
```

---

## §3. 役割分担（R7 / R-DOC-11）

| セクション | AI チーム | 浜田 |
|------------|-----------|------|
| **§1 周知** | 提示 **話題・ネタ**を中心に全文・図解・チェックリスト | **話題を提示** → 目視 OK |
| **§2 検知** | 見出し・項目行のみ（プレースホルダ） | **件数入力** |
| **社外事例** | 表ヘッダ + 空行 2 件 | **2 件入力** |

**禁止（AI）**

- §2 件数の推測・前月コピー
- 社外事例の選定・本文作成

**プレースホルダ文言**

- `（浜田入力）` または空欄
- 事例行: `事例１` / `事例２` — 各列空欄

---

## §4. 浜田 → AI 依頼テンプレ

作成依頼時、最低限これだけで AI 着手可:

```
【経営会議セキュリティ】YYYY年M月度（レポート対象: MM月）
§1 話題: （タイトル・キーワード・URL/PDF）
§2・事例: 枠のみ（数値は後で入力）
テンプレ: 前月 DOCX（C:\tmp\資料作成\ にあり）
```

**§1 話題の例**

- 「IPA 10大脅威 2026 をベースに、ランサム・サプライチェーン・AI 悪用を強調」
- 「GW 明けフィッシング + ClickFix 再注意」
- 参照 URL・PDF パス

---

## §5. AI 標準手順

1. `[doc-lane]` 1 行宣言
2. verify 3 本（keiei-kaigi / governance / word-phase2）
3. 前月 DOCX → `*_backup.docx` コピー → 当月用に編集
4. **§1** — 浜田ネタ中心に起稿（DeepSeek レビュー）
5. **§2 + 事例表** — 枠のみ（プレースホルダ）
6. （任意）警視庁統計グラフ / figma 図 → `add_picture`
7. read-back（`get_document_text`）
8. 報告末尾:

```
【浜田確認】C:\tmp\資料作成\<path> を Word で開いてください。
§1 周知を確認し、§2 検知件数・社外事例 2 件を入力後、OK なら 1 行で返信。
```

9. 浜田 OK → `cio:task-complete-seal -- --lane doc-lane --scope "経営会議セキュリティ YYYYMM 浜田 OK"`

---

## §6. builder（python）との関係

| 方式 | 向き |
|------|------|
| **MCP + 手編集**（R7） | §1 ネタ都度変更 — **第一選択** |
| **`doc-lane:security-report`** | JSON 全文指定時の一括生成（§2 数値も JSON にある場合） |

R7 運用では builder の `section2` / `external_cases` は **プレースホルダ JSON**（`monthly-security-report-TEMPLATE.json`）を参照。浜田が数値を先に渡す場合のみ `detection_confirmed: true` で build。

---

## §7. 関連ファイル

| ファイル | 役割 |
|----------|------|
| `docs/runbooks/doc-lane-autonomous-governance.md` | R-DOC 全般 |
| `docs/runbooks/monthly-security-report.md` | builder・JSON |
| `docs/runbooks/doc-lane-docx-mcp.md` | Word MCP |
| `.cursor/skills/office-docx-doc-lane/SKILL.md` | AI Skill |
| `scripts/data/monthly-security-report-TEMPLATE.json` | JSON ひな形（R7） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-27 | 初版 — R7 確定・6月版テンプレ確認後 |
