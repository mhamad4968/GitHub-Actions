# CIO 定期運用スケジュール（忘れ防止・正本）

**目的**: 678 先祖返り・ICT MSRC 404 対策後の **軽い習慣**を、浜田のカレンダーと CIO の定例作業に固定する。  
**詳細手順**: customize → `customize-deploy-recovery.md` / MCP → `docs/mcp-status.md`

---

## カレンダー登録用（浜田・Outlook 等にコピー）

| 頻度 | リマインダ名（例） | 担当 | やること（1行） |
|------|-------------------|------|-----------------|
| **毎月 第1営業日** | kintone customize BUILD 監査 | **CIO**（浜田は異常時のみ画面確認） | `npm run cio:periodic:monthly` |
| **四半期初月 第1営業日** | kintone スナップショット＋GHA secrets | **CIO** 実施 / **浜田** secrets ローテ承認 | `npm run cio:periodic:quarterly` ＋ GitHub Settings |
| **毎週金曜**（反省後） | MCP 利用状況更新 | **CIO** | `npm run mcp-status:refresh-usage`（`docs/mcp-status.md` 定例） |
| **customize 変更のたび** | preflight → deploy | **CIO** | `npm run cio:preflight:<app> -- --note "…"` → `npm run deploy:<app>` |
| **毎日** | ICT 掲示板収集 | **GHA 自動** | `ict-tech-digest-collect.yml`（手動不要） |

**四半期の目安（JST）**: 1月・4月・7月・10月 の第1営業日（会社カレンダーに合わせて前後可）。

**次回メモ欄**（手書き用）:

| 項目 | 次回予定日 | 実施日 | メモ |
|------|------------|--------|------|
| 月次 BUILD 監査 | | | |
| 四半期スナップショット | | | |
| GHA secrets ローテ | | | |
| MCP usage refresh（金曜） | | | |

---

## コマンド早見（CIO）

```bash
# 月次（portfolio 8アプリ: 627/668/677-679/682-683/686）
npm run cio:periodic:monthly
# 実体: cio:audit:portfolio:strict

# 四半期（予実・ユーザサポートのフィールド構成バックアップ）
npm run cio:periodic:quarterly
# 実体: cio:snapshot:portfolio → data/snapshots/*

# 週次（金曜・mcp-status 表の「過去30日」）
npm run mcp-status:refresh-usage
```

**監査 NG 時**: `docs/runbooks/customize-deploy-recovery.md` に従い復旧 → 再監査。

**ICT 収集失敗時**: Actions `ict-tech-digest-collect` ログ確認 → `KINTONE_API_TOKEN_ICT_COLLECT`（631 用と混同しない）。

---

## 担当の切り分け

| 作業 | CIO | 浜田（CEO） |
|------|-----|-------------|
| `cio:audit:portfolio:strict` | ✅ 定例実行 | 異常報告時のみ kintone 画面確認 |
| `cio:snapshot:portfolio` | ✅ 四半期 | — |
| GHA secrets ローテ | 手順・影響整理 | **Settings で値更新**（四半期） |
| customize deploy | ✅ GO 範囲で自律 | 仕様変更・本番判断は GO |
| ICT 日次収集 | GHA 監視 | 掲示板の目視は任意 |

---

## 関連 GHA（自動・カレンダー不要）

| workflow | 用途 |
|----------|------|
| `kintone-customize-deploy.yml` | push 時 customize デプロイ＋`cio:audit:portfolio:strict` |
| `ict-tech-digest-collect.yml` | 685 日次収集（最大5件） |
| `682-graph-monthly-refresh.yml` | 682 グラフ窓（毎月1日 UTC） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-16 | 初版（678/686 教訓後の定期運用・忘れ防止） |
