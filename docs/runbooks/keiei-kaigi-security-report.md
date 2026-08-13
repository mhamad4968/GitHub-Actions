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

## §0.1 依頼タイミング（2026-07-04 追補）

| 項目 | 内容 |
|------|------|
| **頻度** | **月次 1 本**（経営会議に提出する情報セキュリティレポート） |
| **依頼の起点** | **経営会議の日程**に合わせ、浜田が **作成依頼**（**毎月固定日は設けない**） |
| **浜田の入力** | §1 **注意喚起に載せる話題**（タイトル・キーワード・URL/PDF 等） |
| **AI チームの成果** | §1 周知の全文起稿 + **図解・グラフ**（必要に応じて）+ §2・事例は **枠のみ** |

**注意喚起ネタ（判断材料）は別レーン（2026-08-10 合意）**:  
レポート依頼の **前**に、浜田が話題を決めるための一覧は  
`docs/runbooks/keiei-kaigi-neta-from-security-next.md`（保存先 `C:\tmp\資料作成\ネタ保存用\`）。  
依頼例「経営会議〇月のネタを作って」。**ネタ作成と本レポート作成を混ぜない**。

**下書きパック（2026-08-13）**: `npm run cio:keiei:draft-pack`。下書きはあってよい。周知ネタは **浜田が考えて渡す**（出ないときだけ相談）。仕上げは浜田。自動化率は見ない。完了済み月次本体は再着手しない。正本 `docs/runbooks/cio-ops-frame-audit-pack-v1.md`。

**専用 ChatGPT MCP**: **見送り**（月次 doc-lane + ⑥ OpenRouter で足りる — `docs/plans/2026-07-04-ai-team-six-roles-spec.md`）。

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

**R-KEIEI-01**: 浜田が `C:\tmp\資料作成\` に新 DOCX を置いたら AI は **必ず registry を更新**（id / meetingMonth / reportMonth / features / recommendedAsBase）。

```powershell
# 確認
npm run verify:doc-lane-keiei-kaigi
```

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
2. `npm run cio:tool:route -- --intent "経営会議 セキュリティレポート 図解" --log`（intent: **doc-lane** / 図のみ **visual-diagram**）
3. verify 3 本（keiei-kaigi / governance / word-phase2）
4. 前月 DOCX → `*_backup.docx` コピー → 当月用に編集
5. **§1** — 浜田ネタ（注意喚起話題）中心に起稿（**DeepSeek §50-3-8 必須**）
6. **§2 + 事例表** — 枠のみ（プレースホルダ）
7. **図解・グラフ**（必要時）:
   | 種別 | 経路 |
   |------|------|
   | 統計グラフ・表 | Word MCP（`add_chart` / `add_table`）— Phase2 |
   | フロー図・構成図 | **⑥ Visual** — `user-openrouter` V1→V2（`docs/runbooks/cio-visual-diagram-openrouter.md`）→ CIO 構文・ラベル検証 → `add_picture` |
   | 代替 | Figma `generate_diagram`（OpenRouter 2 回 NG 時） |
8. read-back（`get_document_text`）
9. Kimi 精査（80 行超 or 公式引用多い場合）→ CIO 1 行要約
10. 報告末尾:

```
【浜田確認】C:\tmp\資料作成\<path> を Word で開いてください。
§1 周知を確認し、§2 検知件数・社外事例 2 件を入力後、OK なら 1 行で返信。
```

11. 浜田 OK → `cio:task-complete-seal -- --lane doc-lane --scope "経営会議セキュリティ YYYYMM 浜田 OK"`

---

## §6. builder（python）との関係（R-DOC-14）

| 優先 | 方式 | 条件 |
|------|------|------|
| **1** | **前月 DOCX copy + MCP**（R7） | 通常の月次 — 浜田が §1 ネタ提示 |
| **2** | `doc-lane:security-report` | JSON に §1/§2/事例 **全文** + `detection_confirmed: true` |

builder は **一括 prefill 専用**。R7 通常運用では **使わない**（§2・事例は Word で浜田入力）。

プレースホルダ JSON: `scripts/data/monthly-security-report-TEMPLATE.json`

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
| 2026-07-04 | §0.1 依頼タイミング（会議スケジュール連動・固定日なし）・§5 図解/⑥ Visual 手順追補 |
