# 新規システム導入ヒアリング記録 — kintone 仕様書（SPEC）

> **起票**: 2026-06-10  
> **状態**: **実装完了** — **目視 OK**（浜田 2026-06-10）  
> **Space**: [Space 48](https://jbis-kintone.cybozu.com/k/#/space/48) / thread **52**  
> **正本ガイドライン**: `C:\tmp\新規システム導入・運用ガイドライン\新規システム導入・運用ガイドライン.docx`  
> **分析**: `docs/plans/tmp-new-system-intro-guideline-structure.json`

---

## §0. 確定事項（相談 2026-06-10）

| # | 項目 | 決定 |
|---|------|------|
| Q1 | チェック項目 | **A** — ガイドラインから共同設計（ヒアリング記録型） |
| Q2 | 709 との関係 | **別アプリ** — 709=セキュリティ、本件=ヒアリング記録 |
| Q3 | 一覧 | ヒアリング日・記録者・申請者・サービス名・ツール名・利用部署 |
| Q4 | 印刷 | **A4 2 枚** — ブラウザ print → PDF（稟議添付） |
| Q5 | 権限 | **推進室のみ** CRUD（kintone アプリ権限は浜田側で設定） |
| Q6 | 初回 | **0 件** / **実装 GO** |

**除外**: 稟議・会社承認（別システム）、「ヒアリング実施 □」（本シート＝ヒアリングそのもの）

---

## §1. アプリ構成

| 役割 | appId | customize | deploy |
|------|-------|-----------|--------|
| DB（正本） | **710** | `customize/new-system-intro-db/desktop.js` | `npm run deploy:710` |
| ダッシュ（日常 UI） | **711** | `customize/new-system-intro-dash/desktop.js` | `npm run deploy:711` |

**入口**: [711 ダッシュ](https://jbis-kintone.cybozu.com/k/711/)

**BUILD（本番）**:
- 710=`2026-06-10-new-system-intro-db-block-ui` rev **5**
- 711=`2026-06-10-new-system-intro-dash-print-a4-v2` rev **4**

---

## §2. 運用

推進室がヒアリングしながらモーダルを埋める → 保存 → **印刷 2 枚 PDF** → 稟議添付。

---

## §3. フィールド（710 正本）

### Block 1 — ヒアリング基本

| code | ラベル | 型 | 必須 |
|------|--------|-----|------|
| `hearing_date` | ヒアリング日 | DATE | ○ |
| `recorder` | 記録者 | TEXT | ○ |
| `applicant` | 申請者 | TEXT | ○ |
| `usage_dept` | 利用部署 | TEXT | ○ |
| `service_name` | サービス名 | TEXT | △（tool とどちらか） |
| `tool_name` | ツール名 | TEXT | △ |
| `intro_background` | 導入経緯 | MULTI | ○ |
| `issue_to_solve` | 解決したい課題 | MULTI | ○ |
| `func_requirements` | 必要な機能・要件 | MULTI | ○ |
| `budget_estimate` | 予算（概算） | TEXT | — |

### Block 2 — 導入要件 §4

| code | ラベル | 型 | 選択肢 |
|------|--------|-----|--------|
| `crit_dx` / `crit_dx_note` | DX・データ利活用 | DROP + MULTI | 該当 / 非該当 |
| `crit_productivity` / `crit_productivity_note` | 生産性向上 | DROP + MULTI | 該当 / 非該当 |
| `crit_cost` / `crit_cost_note` | コストダウン | DROP + MULTI | 該当 / 非該当 |

### Block 3 — 導入時確認 §6

| code | ラベル | 型 | 選択肢 |
|------|--------|-----|--------|
| `confirm_no_solo` | 独断導入でない | DROP | はい / いいえ |
| `confirm_joint` | 共同プロジェクト | DROP | はい / いいえ |
| `ops_owner` | 運用・アカウント管理担当 | TEXT | — |

---

## §4. 印刷 2 枚構成

| 枚 | 内容 |
|----|------|
| **1** | 表題「新規システム導入ヒアリング記録」・基本情報・導入経緯・課題・機能要件・予算 |
| **2** | 導入要件 §4（3 項目）・導入確認 §6（3 項目）・フッタ（記録者・日付） |

---

## §5. スクリプト

```bash
npm run new-system-intro:create-db
npm run new-system-intro:create-dash
npm run cio:preflight:710 -- --note "…"
npm run deploy:710
npm run cio:preflight:711 -- --note "…"
npm run deploy:711
```

状態ファイル: `scripts/data/new-system-intro-app-ids.json`
