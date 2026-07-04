# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-04 JST — **夜セッション締め**（698/700 deploy · 736 Phase 0c/1 課題メモ · push **`2b59e4e`**）

### 本日アクティブ（BUILD/rev — 2026-07-04）

| 項目 | 内容 |
|------|------|
| **736 実行予算** | BUILD=`2026-07-04-736-row-menu-fixed-pop` **rev168** — Phase **0a–0c** GO · **Phase 1 予定** 7/11 マスタ検索 / 7/18 テキスト行 / 7/25 並び替え（課題メモ §9.2.2） |
| **698 社員ミラー** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — 在籍/退職/すべて pill（通常=在籍） |
| **700 提案申請** | BUILD=`2026-07-04-bi-proposal-late-eval-collapse` **rev146** — 支店長/本社＝合計・最終優先・評価項目折りたたみ（Q-UX-12）浜田目視 OK |
| **697 設定マスタ** | 本番 Excel — 30所属 upsert 済（人事発令反映） |
| **6役 AI 体制** | §1-2-3-6 GO — Opus 4.8 デフォルト / Architect / Visual 追補（`a294c70`） |
| **セキュリティ勉強会** | 2026 masters リポ正本（`a294c70`） |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **メーリングリスト750–751** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA 保留** | 触らない |
| **736 実行予算** | Phase **0c GO** rev168 · **〜7/11 様子見** · Phase 1 — **7/11** 🔍マスタ検索 / **7/18** テキスト行 / **7/25** 行並び替え（課題メモ `jikkou-yosan-spec.md` §9.2.2） |
| **nodemailer 9.x** | **保留**（浜田 2026-07-04 判断 — SMTP リスク回避） |

**次の1手**: **明日 午前** — 課題整理・完了案件クローズ。**午後** — SKYSEA クライアント配布（意見交換から）。**月曜** — 社内アプリレビュー（698/700 フィードバック）  
**Git**: **`5be23c9`** = `origin/main` — push 済
**Plan&Usage**: 前回 **18%**（2026-07-02）· Ultra リセット **7/15** · **3 日に 1 回**報告  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **クローズ正本**: `data/cio-project-closures.json` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**運用メモ**: 本番 Excel 編集は **`設定マスタ_本番`** シートのみ。人事発令反映を正とする。`C:\tmp\業務改善\` に最新 Excel ミラー配置。Desktop `＃重要確認事項.txt` **廃止済**（`18-重要確認.txt` 正本）。595 CSV 取込後は一覧 **「台帳へ一括反映」** を実行。  
**npm**: `business-improvement:build-prod-wf-settings-xlsx` / `validate-prod-settings-xlsx` / `restore-common-hr-jinji`  
**憲法**: **§38-1** npm セキュリティ自律更新（minor/patch 自動 · major 保留）  
**npm minor**: `@kintone/cli` 1.20.0 · eslint 10.6.0 · globals 17.7.0 — **applied 2026-07-04**  
**npm major 保留**: nodemailer 9.x（pending 1件）· xlsx  
**MCP**: Tier B 前に `cio:mcp:env` 推奨（前回 **6/6 OK**）  
**改善案 GO 済（2026-07-02 夜）**: R-ML-03, S-CLOSE-01, S-ML-05, R-595-03, D-CREDIT-01 — `docs/approved-changes/processed/2026-07-02/`  
**締め**: Desktop sync **2026-07-04** · session report **19-SESSION-ONE-REPORT-2026-07-04.md**

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **L2** bootstrap NG → NEW-SESSION-STARTER 6 部（1 回）| **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）
