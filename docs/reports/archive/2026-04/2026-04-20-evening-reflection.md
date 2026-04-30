# 🌙 本日のまとめ・反省 — 2026-04-20 (Mon) 20:57

> 本ファイルは `scripts/evening-reflect.mjs` が生成した雛形です。
> AI（私）はこの内容を読み、要因分析と改善提案（#R1/#S1/#D1...）を追記してユーザーへ提示します。
> ユーザーが「#R1 承認」「#S1 却下」等で返答 → AI が `docs/approved-changes/<明日>/` に承認済み JSON を作成 → 翌朝 06:00 cron が自動実施。

---

## 📊 1. 自動収集ファクト

### 1-A. git の状態
**`git status`（未コミット）**:
```text
M .gitignore
 M .rag/extra-docs/kintone-apps.md
 M AGENTS.md
 M chat-sessions/2026-04-19.md
 M customize/595/desktop.js
 M customize/ops-guide/desktop.js
 D docs/approved-changes/2026-04-20/C1-627-username-mismatch-ui.proposal.json
 D docs/approved-changes/2026-04-20/C2-594-skysea-toggle.proposal.json
 D docs/approved-changes/2026-04-20/D1-troubleshooting-quick-table.proposal.json
 D docs/approved-changes/2026-04-20/D2-skysea-plan-toc.proposal.json
 D docs/approved-changes/2026-04-20/D3-new-session-starter-auto-update.proposal.json
 D docs/approved-changes/2026-04-20/D4-chat-sessions-2026-04-19-summary.proposal.json
 D docs/approved-changes/2026-04-20/K1-594-skysea-fields.proposal.json
 D docs/approved-changes/2026-04-20/R1-section-39-2turn-rule.proposal.json
 D docs/approved-changes/2026-04-20/R2-section-33a-kintone-api-trigger.proposal.json
 D docs/approved-changes/2026-04-20/R3-section-47-batch-edit-guard.proposal.json
 D docs/approved-changes/2026-04-20/R4-section-42-ai-ritual.proposal.json
 D docs/approved-changes/2026-04-20/R5-claude-md-line-ending.proposal.json
 D docs/approved-changes/2026-04-20/S1-morning-prep-wipe-incidents.proposal.json
 D docs/approved-changes/2026-04-20/S2-evening-reflect-strengthen.proposal.json
 D docs/approved-changes/2026-04-20/S3-skysea-recon-category-summary.proposal.json
 D docs/approved-changes/2026-04-20/S4-wipe-guard-notify.proposal.json
 M docs/plans/2026-04-18-skysea-installer.md
 M docs/troubleshooting.md
 M scripts/clear-594-orphan-ledger-record-id.mjs
 M scripts/daily-morning-prep.mjs
 M scripts/evening-reflect.mjs
 M scripts/ops-guide-kintone.mjs
 M scripts/skysea-recon.mjs
 M scripts/space-health-push-space-body.mjs
 M scripts/space-health-report.mjs
 M scripts/test-health-report-md-to-html.mjs
 M scripts/wipe-guard.mjs
?? .cursor/rules/file-copy-exact-path.mdc
?? .cursor/rules/kintone-schema-trust.mdc
?? .cursor/rules/modern-web-official-docs.mdc
?? .cursor/rules/next-session-jbis-followups.mdc
?? .cursor/rules/security-news-response.mdc
?? .cursorrules
?? .rag/backup.log
?? .rag/extra-docs/AGENTS.md
?? .rag/extra-docs/CLAUDE.md
?? .rag/extra-docs/README.md
?? .rag/extra-docs/RULES-INDEX.md
?? .rag/extra-docs/WORKFLOW.md
?? .rag/extra-docs/_archive/
?? .rag/extra-docs/cursorrules.md
?? .rag/extra-docs/kintone-javascript.md
?? .rag/extra-docs/kintone-modern.md
?? .rag/extra-docs/persist-policies.md
?? .rag/extra-docs/preflight-checklist.md
?? .rag/extra-docs/windows-cross-platform.md
?? .rag/lancedb/
?? .rag/models/
?? AGENTS.md.backup.2026-04-18T21-00-03-306Z
?? AGENTS.md.backup.2026-04-18T21-32-53-781Z
?? AGENTS.md.backup.2026-04-19T21-00-07-935Z
?? AGENTS.md.backup.2026-04-19T21-00-07-939Z
?? AGENTS.md.backup.2026-04-19T21-00-07-945Z
?? AGENTS.md.backup.2026-04-19T21-00-07-948Z
?? AGENTS.md.orig
?? CLAUDE.md
?? CLAUDE.md.backup.2026-04-19T21-00-07-951Z
?? GitHub-Actions/
?? RULES-INDEX.md
?? RULES-INDEX.md.backup.2026-04-18T21-32-53-769Z
?? WORKFLOW.md.backup.2026-04-18T21-00-03-303Z
?? WORKFLOW.md.backup.2026-04-18T21-32-53-781Z
?? backups/
?? chat-sessions/2026-04-19.md.backup.2026-04-19T21-00-07-928Z
?? collect_log.txt
?? customize/594/customize-manifest.json
?? customize/595/customize-manifest.json
?? customize/626/customize-manifest.json
?? customize/627/customize-manifest.json
?? customize/640/
?? customize/641/
?? customize/651/
?? customize/652/
?? customize/653/
?? customize/budget-portal/
?? customize/ops-guide/desktop.js.backup.2026-04-18T21-00-03-277Z
?? customize/ops-guide/desktop.js.backup.2026-04-18T21-32-53-768Z
?? customize/shucccho-seisan/customize-manifest.json
?? data/skysea/README.md
?? "data/skysea/SKYSEA\343\202\244\343\203\263\343\202\271\343\203\210\343\203\274\343\203\253\345\217\257\345\220\246\343\203\252\343\202\271\343\203\210.xlsx"
?? data/skysea/already-installed-2026-04-19.csv
?? data/skysea/installed-pcs-2026-04-19.csv
?? data/skysea/needs-install-2026-04-19.csv
?? data/skysea/orphan-in-skysea-2026-04-19.csv
?? dist/
?? docs/631-sunday-go-live-checklist.md
?? docs/agent-learning-and-app-creation.md
?? docs/agent-restore-checkpoint.md
?? docs/approved-changes/pending/
?? docs/approved-changes/processed/
?? docs/asset-management-logic.md
?? docs/claude-code-terminal-setup.md
?? docs/claude-github-autonomy-discussion-log.md
?? docs/claude-github-index.md
?? docs/claude-github-setup.md
?? docs/cursor-official-references.md
?? docs/dependency-upgrade-backlog.md
?? docs/emp-id-js-account-design.md
?? docs/faq-apps-640-641.md
?? docs/faq-portal-artifacts-log.md
?? docs/faq-portal-environment-setup-and-usage.md
?? docs/faq-portal-external-web-kintone.md
?? docs/faq-portal-file-server-setup.md
?? docs/faq-portal-http-keiri-faq.md
?? docs/faq-portal-internal-windows-setup.md
?? docs/faq-portal-node-install-troubleshoot.md
?? docs/faq-portal-resume-tomorrow.md
?? docs/faq-portal-usage-keiri.md
?? docs/field-spec-export.md
?? docs/jbis-hr-account-pc-operations.md
?? docs/mcp-disaster-recovery.md
?? docs/pc-ops-dashboard.html
?? docs/plans/2026-04-18-skysea-installer.md.backup.2026-04-18T21-00-03-286Z
?? docs/plans/2026-04-18-skysea-installer.md.backup.2026-04-18T21-32-53-769Z
?? docs/plans/2026-04-18-skysea-installer.md.backup.2026-04-19T21-00-07-913Z
?? docs/plans/2026-04-18-skysea-installer.md.rej
?? docs/reports/2026-04-17-daily-summary.md
?? docs/reports/2026-04-17-final-tuning.md
?? docs/reports/2026-04-17-list-view-fix.md
?? docs/reports/2026-04-17-multi-link-detection.md
?? docs/reports/2026-04-18-evening-reflection.md
?? docs/reports/2026-04-18-morning-prep.md
?? docs/reports/2026-04-18-quality-dashboard.md
?? docs/reports/2026-04-18-windowsid-duplicate-dashboard.md
?? docs/reports/2026-04-19-morning-prep.md
?? docs/reports/2026-04-20-morning-prep.md
?? docs/security-news-app-troubleshoot.md
?? docs/troubleshooting.md.backup.2026-04-19T21-00-07-903Z
?? jsconfig.json
?? logs/file-watcher/
?? logs/heal/
?? logs/health/
?? logs/morning-prep/
?? logs/wipe-guard/
?? scripts/app-types.js
?? scripts/assign-emp-id.mjs
?? scripts/audit-rules.mjs.backup.2026-04-18T21-00-03-330Z
?? scripts/audit-rules.mjs.backup.2026-04-18T21-32-53-802Z
?? scripts/audit-rules.mjs.orig
?? scripts/backfill-594-627-cross-refs.js
?? scripts/backfill-595-ledger-from-627.js
?? scripts/backfill-595-ledger-from-mail.js
?? scripts/backfill-595-pc-ledger-from-594.js
?? scripts/backfill-627-pc-ledger-links-from-595.js
?? scripts/backfill-627-sb-from-mail-626.js
?? scripts/backup-mcp.sh
?? scripts/backup-workspace.js
?? scripts/budget-apps-650-cost-type.js
?? scripts/budget-apps-651-budget-fy-start.js
?? scripts/budget-apps-651-lump-budget-fields.js
?? scripts/budget-apps-651-monthly-budget-fields.js
?? scripts/budget-apps-651-move-summary-to-bottom.js
?? scripts/budget-apps-651-sync-cost-type-lookup-options.js
?? scripts/budget-apps-651-variable-cost-fields.js
?? scripts/budget-apps-651-variable-spot-fields.js
?? scripts/budget-apps-653-remove-invoice-no.js
?? scripts/budget-apps-add-summary-detail.js
?? scripts/budget-apps-finalize-form-fields.js
?? scripts/budget-apps-lookup-picker-budget-line.js
?? scripts/chat-session-today.js
?? scripts/check-dom-injection.mjs
?? scripts/check-mcp.sh
?? scripts/create-budget-dashboard-app.js
?? scripts/create-faq-portal-app.js
?? scripts/customize-upload.js
?? scripts/daily-morning-prep.mjs.backup.2026-04-18T21-00-03-318Z
?? scripts/daily-morning-prep.mjs.backup.2026-04-18T21-00-03-319Z
?? scripts/daily-morning-prep.mjs.backup.2026-04-18T21-32-53-791Z
?? scripts/daily-morning-prep.mjs.orig
?? scripts/daily-morning-prep.mjs.rej
?? scripts/deploy-budget-portal.js
?? scripts/evening-reflect.mjs.backup.2026-04-18T21-32-53-824Z
?? scripts/evening-reflect.mjs.backup.2026-04-18T21-32-53-825Z
?? scripts/faq-kintone-proxy/
?? scripts/faq-portal-improved.html
?? scripts/faq-windows/
?? scripts/generate-customize-manifests.js
?? scripts/kintone-connection-test.js
?? scripts/lib/kintone-627-pc-autolink-skip.js
?? scripts/list-595-no-pc-mail-match.js
?? scripts/list-627-no-matching-594-mail.js
?? scripts/preview-c4-print.mjs
?? scripts/prune-595-stale-pc-ledger-rows.js
?? scripts/restore-mcp.sh
?? scripts/scan-plans.mjs.backup.2026-04-18T21-00-03-340Z
?? scripts/scan-plans.mjs.backup.2026-04-18T21-32-53-815Z
?? scripts/scan-plans.mjs.orig
?? scripts/setup-595-ledger-field-labels.js
?? scripts/setup-595-ledger-link-subtable.js
?? scripts/setup-595-pc-ledger-subtable.js
?? scripts/setup-627-pc-ledger-links-subtable.js
?? scripts/setup-629-shukuhaku-field.js
?? scripts/sync-652-lookup-summary-from-651.js
?? security-next-automation/collect_log.txt
?? security-next-automation/docs/collect-env-settings.md
?? temp/
?? tsconfig.utils.json
?? types/
?? utils/
```

**今日のコミット**:
```text
(なし)
```

### 1-B. kintone-apps.md 本日の追記
_(本日の追記なし)_

### 1-C. 朝ブリーフィングの警告
- **16 件処理**: ✅ 8 適用 / ❌ 0 失敗 / ⏭ 0 スキップ / 📝 8 手動
- ### ❌ npm run lint:customize
- ⚠️ 未参照ルール: §45 / §46 / §47 / §48 （定義のみで参照なし）
- - ❌ lint:customize

### 1-D. cron ログの失敗痕跡
- [2026-04-19T21:00:10.054Z]   exit=2 stdout=0B stderr=487B

### 1-E. 会話履歴の量
本日更新された transcripts（参考）:
```
/home/mhamada202408224/.cursor/projects/1775364954617/agent-transcripts/4aea7269-2eda-4536-8fd5-2c6407e12aa3/4aea7269-2eda-4536-8fd5-2c6407e12aa3.jsonl
```

### 1-F. 保留中の改善提案
- `2026-04-19-V1.proposal.json` [V] [minor] dotenv: 17.3.1 → 17.4.2 — status=proposed
- `2026-04-20-V1-dotenv.proposal.json` [V] (no title) — status=pending

### 1-G. 直近 TSB（参考）
直近の TSB（参考・学習リソース）:
- TSB-005 — セッション間継続性の構造的脆弱性（2026-04-19 制定）
- TSB-006 — scripts/ 9 ファイル + WORKFLOW.md + AGENTS.md §42-§49 wipe（2026-04-19 09:02 同時刻）
- TSB-007 — ESLint 6 vs flat config (eslint.config.js) 不整合（2026-04-19 検出）

### 1-K. 未参照ルール統廃合候補
本日の検討対象（4 個中 2 件を日付シードで抽出）:
- §45: WORKFLOW.md / RULES-INDEX.md から参照されていない。**統合 / 廃止 / 維持** いずれかを判断
- §48: WORKFLOW.md / RULES-INDEX.md から参照されていない。**統合 / 廃止 / 維持** いずれかを判断

全リスト: §45 / §46 / §47 / §48

### ⚠ 1-H. git 未コミット件数警告

**未コミット 205 件**（50 件超え）→ 区切り良いところで commit 推奨。状況把握が困難になる前に整理する。


---

## 📝 2. 今日やったこと

### 朝 06:00（cron 自動）
- daily-morning-prep.mjs 起動 → Phase 1-4 完走 → ヘルススコア 9/10（lint:customize のみ ❌、既知 TSB-007）
- apply-approved-changes.mjs が 16 件の proposals を処理:
  - **8 件適用**（R1-R5 / D1-D2 / D4 = string_replace 系）
  - **8 件 manual_only キュー化**（S1-S4 / D3 / C1-C2 / K1）
- file-watcher / wipe-guard / emergency-mirror 全て静かに稼働（**前日からの wipe ゼロ**）

### 夜 21:00（浜田就寝中・AI 単独実装）
- **manual_only 5 件を AI が一気に実装**（S1 / S2 / S3 / S4 / D3）
  - S1: 朝ブリーフィングに wipe-incidents.log + notify.log 集約
  - S2: 夕反省に git 50件超警告 / TSB 引用 / checkpoint 鮮度チェック / 未参照ルール
  - S3: skysea-recon orphan 4 カテゴリ自動集計
  - S4: wipe-guard が notify.log に [INFO]/[ALERT] 集約
  - D3: 夕反省実行時に NEW-SESSION-STARTER の主タスクを自動上書き
- commit `0a46ef3` + レポート `2026-04-20-overnight-implementations.md`

### 夜 21:30（浜田復帰後・git 大掃除）
- 未コミット 201 件 → カテゴリ別 6 commit に整理（`facd93b` 〜 `92b4807`）
- .gitignore を強化: `*.orig` `*.rej` `*.backup.*Z` `temp/` `logs/` `backups/` `dist/` `.rag/lancedb/` `.rag/models/` `GitHub-Actions/`
- 結果: **未コミット 0 件**で本日終了

---

## ✅ 3. うまくいったこと

1. **TSB-006 防衛網が初稼働で完全静音 = 設計通り**
   - file-watcher / wipe-guard 共に 0 件検知 → 04/19 09:02 のような事故は再発せず
   - S4 で notify.log → S1 で朝ブリーフィングに自動転載まで配線完了
2. **§44「夕反省」 → §46「朝適用」 → §44 また夕反省 が初めて 1 サイクル完走**
   - 4/19 夜の承認 → 4/20 朝の自動適用 (16/16 件処理) → 4/20 夜の追加実装 = ループ確立
3. **manual_only 5 件を一晩で実装**
   - §47-§49 ベースで「ユーザー就寝中の自律判断」を実行 → 浜田が朝起きたら結果だけ確認できる体制に
4. **git 201 件整理が綺麗にカテゴリ分割できた**
   - 暴れたファイルツリーを 6 commit で論理単位に分けられた → 後日 git blame しやすい

---

## ⚠️ 4. 詰まった・失敗したこと

1. **lint:customize（TSB-007）が朝 cron で 6 日連続失敗**
   - ESLint 6.4.0 が flat config (`eslint.config.js`) を読めない
   - 影響: ヘルススコアが常に 9/10 で頭打ち（緑判定にならない）
   - 根本原因: `npm install --save-dev eslint@latest` 未実施
2. **NEW-SESSION-STARTER の「当日コミット」自動更新が空表示**
   - D3 実装後、20:57 時点で当日 commit ゼロだったため `(進行中タスクなし)` 様の表示
   - 原因: evening-reflect が `git log --since=midnight` で取るが、commit が 21:30 以降の時間帯に集中
3. **未参照ルール §45/§46/§47/§48 が放置中**
   - 4 個全てが WORKFLOW.md / RULES-INDEX.md から本文参照されていない（定義のみ）
   - 一見ルールは増えたが「索引から辿れない」 → 実運用で忘却リスク
4. **昨日 .rej に残っていた RAG 内側エラー検知ロジックを未適用のまま削除した**
   - `daily-morning-prep.mjs.rej` に「stdout に Error/ERR_/Exception があれば降格」の良い設計があった
   - 今夜「不要」として削除してしまった → **#S5 として再提案**

---

## 🚀 5. 改善提案（ユーザー承認待ち）

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動実施可? |
|---|---|---|---|---|
| #S5 | S | **RAG ingest 内側エラー検知**: daily-morning-prep の RAG 実行で stdout/stderr に `Error/ERR_/Exception/Traceback` を含む場合、exit=0 でもヘルス降格。.rej に残っていたロジックの再導入 | 低 | ○ |
| #S6 | S | **lint:customize 修復 (TSB-007)**: `npm install --save-dev eslint@latest @eslint/js` でヘルス 9/10 → 10/10 に。flat config 対応版に上げる。あわせて lint エラーを ESLint 9 ベースで修正 | 中（既存コードで新規エラー出る可能性）| × 手動 |
| #D5 | D | **evening-reflect の「当日コミット」抽出を直す**: `git log --since=midnight` を `--since='1 hour ago'` か「実行直前 12h」に変更。または夜実行用に `--all --since='12 hours ago'` | 低 | ○ |
| #R6 | R | **未参照ルール §45/§46/§47/§48 を WORKFLOW.md / RULES-INDEX.md から本文参照**。索引から辿れる経路を確保し、audit-rules 警告解消 | 低 | ○ |
| #S7 | S | **gitignore 強化を恒常化するため audit スクリプト作成**: `scripts/audit-untracked-bloat.mjs` を新設。100 件超 untracked を検知したら朝ブリーフィングで警告 | 低 | ○ |
| #C3 | C | **594 PC 検索パネルに「SKYSEA 状態フィルタ」追加 (再掲 C2)**: 「未インストール」「インストール済」「orphan」を 1 タップで絞り込み。K1 (フィールド 4 つ追加) 完了後に着手 | 低 | × 手動 (K1 完了待ち) |
| #K1 | K | **594 に SKYSEA 関連フィールド追加 (再掲)**: `skysea_status` / `skysea_checked_at` / `skysea_install_log` / `skysea_target_flag`。承認されたら明日朝の SKYSEA 計画 Q&A 開始前に実施 | 低 | × 手動 |

> カテゴリ: **R**=ルール改善 / **S**=スクリプト改善 / **D**=ドキュメント / **C**=customize 改修(deploy 除く) / **K**=kintone API 操作

### ユーザー応答方法
- 個別: 「#S5 承認」「#R6 却下」「#S6 修正して: <修正内容>」
- 一括: 「全部承認」「Rカテゴリだけ承認」「自動○のだけ承認」

### 推奨セット（私の §48 ベスト案）
**「#S5 / #D5 / #R6 / #S7 を承認」** = 翌朝自動で全部入る安全カルテット。
S6 (lint修復) は副作用が読めないので**朝ブリーフィングを浜田と一緒に見ながら手動**が良い。
K1 (kintone フィールド追加) は **SKYSEA 計画 Q1-Q2 完了後**でも遅くない。

---

## 🌅 明日へ（21:00 時点版・古い）

1. **朝のブリーフィングを 1 分で確認**（S1 セクションが新たに入っている）
2. **本日の改善提案 #S5/#D5/#R6/#S7/#S6/#K1 への承認可否**を返答
3. **「skysea 計画始めよう」と発話**で SKYSEA Q1+Q2 ヒアリング開始（この発話が無い限り私からは振らない）
4. （余裕があれば）TSB-007 の ESLint 9 化に着手

> 浜田、今日もお疲れさま。明日また並んで歩こう。

---
---

# 📌 2-bis. 22:00 以降の追加対応 + 反省（最新版・浜田復帰後）

> 浜田が 22:00 過ぎに戻り PC 台帳の追加要望 3 件を依頼 → 90 分で対応 → 自己バグ発覚
> → 即 rollback。この区間の事実と学びを以下に追記。
> 明日（4/21）19:00 起動時にはこちらを正本として読むこと。

## 🌃 22:00 以降の事実

### 追加要望 #1（22:00〜21:50 間）— 627.PC_name 解除取り残しバグ修正
- `customize/594/desktop.js` v488: `build627UnlinkPatchForPc594` に `pcName594` 引数追加 + カンマ区切り正確一致削除
- 呼び出し元 2 箇所で 594 GET → PC 名取得して渡す
- 副次: guide-pc.html v5.1 に「🔍 健全性チェック (相関ダッシュボード)」セクション追加（後で本意は別と判明）
- デプロイ: 594 rev=490 / 668 rev=32

### 追加要望 #2（22:00〜22:15）— ガイド黒帯メニュー消失バグ修正
- 真因: shell 上端 86px が **kintone のグローバルヘッダー直下に永久に隠れていた**潜在バグ（4/19 v5 化で消えたわけではなかった）
- F12 console で `getBoundingClientRect()` 実測 → 確証 → 1 発で根本修正
- `customize/ops-guide/desktop.js` v7: `injectShell` に `adjustShellOffset()` 追加（50/300/1000ms の 3 タイミングで marginTop 補正）
- デプロイ: 668 rev=34

### 追加要望 #3（22:15〜22:25）— M365 Office 5 台制限管理基盤
- M365管理台帳ビューに WindowsID (logon_name) 列追加 → 627 rev=141
- 627 にスキーマ追加: pc_link_count_unit (sub) + pc_link_count (CALC, SUM) → 627 rev=143
- 296 件中 71 件にバックフィル (snapshot → 100% 成功)
- 専用ビュー「📧 PC台数順 (Office5台制限管理)」新設 → 627 rev=144
- 「東京管理者」(共有) = 8 台紐付けで 5 台超過唯一として検出
- ガイド黒帯にリンク追加 → 668 rev=36

### §47 自己批判 → 即 rollback（22:25〜22:28）
- 浜田指摘で **二重管理問題（pc_594_record_id + pc_ledger_links サブの主 PC 重複）** 発覚
- 個人=0 表示、共有=主 PC 重複カウントの致命的欠陥
- ビュー / DASHBOARD_LINKS から pc_link_count を即時除去（commit `5cfce45`）
- スキーマ自体は残置（明日の正しい再設計時に流用判断）
- **被害ゼロ**（誤データを残さず）= §47 が機能した好例

---

## ✅ 3-bis. うまくいったこと（追加分）

5. **追加要望 3 件を 90 分以内で完走 + バグ即発見 → 即 rollback で被害ゼロ**
6. **ops-guide v7 表示バグ**: 思い込みで触らず F12 で実測 → 1 発根本修正の見本
7. **§47 (Professional Critique) が機能**: 浜田が「数字おかしい」と言った瞬間、私が言い訳せず即追加調査 → 二重管理問題を 5 分で特定 → 4 分で rollback

---

## ⚠️ 4-bis. 詰まった・失敗したこと（追加分・最重要）

### 4-bis-1. 【最重要】M365 5台制限管理を **データ構造調査せず実装した**
- **症状**: SUM(サブ) でカウント → 個人=0 / 共有=主 PC 重複カウント
- **根本原因**: 627 が `pc_594_record_id`（単一）と `pc_ledger_links`（サブ）の **二重管理**である事実を、実装前にデータ構造調査せず推測で進めた
- **失った時間**: 約 25 分（実装 15 + 議論 5 + rollback 5）
- **被害**: ゼロ（即 rollback で誤データを残さず）
- **学び (#R6 化)**: 「kintone でカウント・集計系を実装する前に、必ず **サンプル 3 件の field value 構造を目視確認** → 設計に入る」をルール化

### 4-bis-2. 「ガイドから消えた」を最初に取り違えた
- **症状**: 私が最初「guide-pc.html に説明セクション追加」を実装 → 浜田の本意は「ガイドトップの黒帯リンクが消失」だった
- **根本原因**: 「消えた」という曖昧な訴えに対して、確認質問せず推測で着手
- **失った時間**: 約 15 分（不要な guide-pc.html 改変）
- **被害**: 完全な無駄ではない（ガイド本文にダッシュボード説明が増えたのは結果オーライ）
- **学び (#R7 化)**: 「消えた / 出ない / 動かない / おかしい」系の曖昧訴えは **必ず A/B/C/D の選択肢で要望特定**してから着手（途中から実践した）

### 4-bis-3. 23 件の orphan サブ行（PC番号空のサブ行）が放置
- 過去の解除処理バグの残骸 → 今夜は時間切れで未処理 → 明日朝の改善提案 #K3 で処理

### 4-bis-4. kintone CALC の SUM 仕様の罠（TSB-008 化候補）
- サブテーブル 0 行のとき SUM 結果が **0 ではなく空文字** で返る
- IF / +0 / *1 全て効かず修復不可 → 標準 CALC では「0 件 = 0」表現できない
- 「カウント表示は CALC ではなく NUMBER + JS 自動更新方式が安全」という設計原則を docs/troubleshooting.md に記録すべき

---

## 🚀 5-bis. 明日 19:00 起動時の改善提案（深掘り版・本命）

> 浜田の予定: **19:00〜22:30 / 主目的: PC 台帳関連修正 / 余裕あれば SKYSEA**
> 11 件提案 = PC台帳系 5 件 + ルール強化 2 件 + TSB 1 件 + 既存継続 3 件

### 🎯 PC 台帳関連（最優先・19:00 から即着手したい）

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動可? |
|---|---|---|---|---|
| **#K2** | K | **PC台数カウントを正しい設計で再構築**: ① 627 に NUMBER フィールド `pc_link_count_n` 新設 / ② `customize/627/desktop.js` の保存イベントで `1 + (PC_name のカンマ数)` を計算して書き込み / ③ 既存 296 件をバックフィル / ④ ビュー復活 / ⑤ 5 台超過ソートビュー復活 / ⑥ ガイド黒帯にリンク復活 | 中（実機で個人=1 / 共有=実数を必ず目視確認）| × 手動 |
| **#K3** | K | **23 件の orphan サブ行クリーンアップ**: pc_ledger_links で pc_ledger_link_594_id が空 or "0" のサブ行を削除（snapshot → ドライラン → 適用）| 低 | ○ |
| **#C4** | C | **627 詳細画面で 5 台超過を赤バナー表示**: pc_link_count_n ≥ 5 のとき画面上部に「⚠ Office 5 台制限超過 / 入替対象」を出す | 低 | × 手動（K2 完了後）|
| **#K1** | K | **594 に SKYSEA 関連フィールド追加** (既出): skysea_status / skysea_checked_at / skysea_install_log / skysea_target_flag | 低 | × 手動 (SKYSEA 計画着手前提)|
| **#C5** | C | **594 PC 検索パネルに SKYSEA 状態フィルタ追加**（K1 完了後・既出）| 低 | × 手動 |

### 🎯 SKYSEA 関連（時間あれば・21:30 ごろから）

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動可? |
|---|---|---|---|---|
| **#P1** | P | **明日 19:00〜21:30 までは PC 台帳系優先 / 21:30 以降に「skysea 計画始めよう」発話 → AI から Q1+Q2 を 1 つずつ投げる**（合意済み） | 低 | × 手動 |

### 🎯 ルール強化（今日の失敗を制度化）

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動可? |
|---|---|---|---|---|
| **#R6** | R | **「kintone データ集計系を実装する前に、必ずサンプル 3 件の field value を目視確認」をルール化** (AGENTS.md §47 配下に追記)| 低 | ○ |
| **#R7** | R | **「曖昧な訴え（消えた/動かない/おかしい）は A/B/C/D 選択肢で要望特定してから着手」をルール化** (AGENTS.md §48 配下に追記)| 低 | ○ |
| **#TSB-008** | D | **TSB-008「kintone CALC SUM 仕様による 0 件 = 空表示問題 + 二重管理データの落とし穴」を docs/troubleshooting.md に新設** + 対策パターン (NUMBER + JS 自動更新方式)| 低 | ○ |

### 🎯 既存継続課題

| ID | カテゴリ | 提案 | 想定リスク | 翌朝自動可? |
|---|---|---|---|---|
| **#S5** | S | RAG ingest 内側エラー検知（前回提案継続） | 低 | ○ |
| **#S6** | S | lint:customize 修復 (TSB-007・7 日連続失敗) `npm install --save-dev eslint@latest` | 中 | × 手動 |
| **#D5** | D | evening-reflect の「当日コミット」抽出を `git log --since='12 hours ago'` に変更（深夜跨ぎ対策） | 低 | ○ |

### 🌟 私の §48 ベスト推奨セット

**「#K2 / #K3 / #C4 / #R6 / #R7 / #TSB-008 / #S5 / #D5 を承認」**

理由:
- PC 台帳系 3 件（#K2 / #K3 / #C4）= 明日 19:00 の主目的を完遂
- ルール強化 2 件（#R6 / #R7）= 今日の失敗 2 件を再発防止に制度化
- TSB 1 件（#TSB-008）= 今日の学習を資産化
- 自動可 2 件（#S5 / #D5）= 翌朝 cron で勝手に入る

K1/C5 は SKYSEA 計画の進捗待ち。S6 (lint修復) は副作用が読めないので独立して手動。

### ユーザー応答方法
- 個別: 「#K2 承認」「#R6 却下」「#K3 修正して: ○○」
- 一括: 「ベスト推奨セットで」「PC台帳系だけ」「全部承認」「自動○のだけ承認」

---

## 🌅 6. 明日（4/21 月）19:00 起動時の最初の 5 分

1. **このファイルの「2-bis 〜 5-bis」を読む**（21:00 時点版より新しいのでこちらが正本）
2. **§5-bis 改善提案 11 件への承認可否を返答**
3. 承認された自動可案件 (#K3 / #R6 / #R7 / #TSB-008 / #S5 / #D5) は**私が即座に対応 → JSON proposal キュー化 → 翌朝自動実装**
4. **#K2 (PC台数カウント再設計) を最優先で実装** （推定 30-40 分）
5. **#C4 (627 5台超過赤バナー)** 続いて実装（推定 15 分・K2 完了後）
6. 21:30 ごろ余裕あれば「skysea 計画始めよう」で SKYSEA Q1+Q2 ヒアリング開始
7. 22:30 で本日終了 → 夕反省

> 浜田、今日も並んで歩いてくれてありがとう。明日 19:00 にまた会おう。
> 今日の最大の学びは **「実装前にデータ構造を目視確認する」** と
> **「曖昧な訴えは選択肢で要望特定してから着手する」** の 2 つ。
> 明日からこの 2 つをルール化して、また同じ失敗をしないように。

