# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-21 JST — **B push/deploy 品質ゲート v2 反映** / 736 v2c **保留** / 次 **C checkpoint テンプレ**

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

| レーン | 状態 | クローズ日 | 正本 |
|--------|------|------------|------|
| **業務改善提案 ver.02**（697–713） | closed-v1 | 2026-06-13 | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **社内 Wi-Fi SSID**（718/719） | closed-v1 | 2026-06-14 | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| **JR iPad 台帳**（720/721） | closed-v1 | 2026-06-15 | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **VPN アカウント**（733/734） | closed-v1 | 2026-06-17 | `docs/reports/2026-06-17-vpn-account-completion.md` |

**業務改善のみ継続可**（浜田 2026-06-20）: **業務改善提案レーン**の軽微対応・完成条件外（FAQその他・本番6段WF・RAG・Wordマニュアル）。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **クローズではない**。再開は浜田相談時のみ。BUILD `2026-06-19-688-print-rounding-fix` rev **34** |
| **予実管理 保留** | 部署予実 **677/678/679** — **クローズではない**。来週 **運用等ヒアリング**後に再開。deploy・仕様変更・未コミット作業は **触らない**（浜田 2026-06-20） |
| **SKYSEA 保留** | 未導入 PC 自動インストール — **2026-04-21 以降長期保留**。**2026-07 頃**から本格 **計画検討**（浜田 2026-06-20）。正本 `docs/plans/2026-04-18-skysea-installer.md` |
| **736 担当説明 保留** | **2026-06-23（月）以降** — v2a/v2b 完了・v2c GO 待ち。正本 `docs/plans/2026-06-18-jikkou-yosan-spec.md` §9.5 |
| 本番 WF 6段階 | 無断分割禁止 — test_v3 WF 継続テストのみ |
| 評価スナップショット | 未設計確認前の本番投入禁止 |

**次の1手**: **AI チーム運用 C** — checkpoint・引き継ぎテンプレ統一（正本 `session-lifecycle-v2.md` 完了）。**736** v2c **未着手**（6/23 以降）。**677–679 / 688 / SKYSEA** — 触らない  
**Git**: B v2 品質ゲート コミット予定  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` — commit=`cio:pre-commit-check` / push=`cio:pre-push-check` / deploy=`cio:deploy-gate -- <app>`  
**736 本番**: BUILD=`2026-06-21-jikkou-yosan-versions-help-wording` rev **104**  
**688 本番**: BUILD=`2026-06-19-688-print-rounding-fix` rev **34** — **保留**  
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** `session-boundary-close-gate.mdc` | **履歴** `chat-sessions/checkpoints/checkpoint-archive-2026-06-21.md`

## 2026-06-17 JST — **595 emp_id / 715・717 利用者 UI / PCキッティング BOM**

| 項目 | 内容 |
|------|------|
| **595** | 627 連携削除 rev **92** / emp_id 自動付番 rev **93** — **浜田 OK** |
| **715** | emp_id ガード + 利用者チップ→社員検索 rev **13** — **浜田 OK** |
| **717** | 715 同型利用者絞り込み rev **8** — **浜田 OK** |
| **PCキッティング** | `kitting-run.ps1` + UTF-8 BOM 修復 + START.bat 更新 — キッティング PC コピー済 |
| **②インストール** | `（新）キッティングセット` USB 配置済 — **明日試験** |
| **Git** | working tree **dirty**（deploy 済み・未 push） |
| **夕反省** | `docs/reports/2026-06-17-evening-reflection.md` — **R49–R54 承認待ち** |

---




## 2026-06-17 JST — **VPNアカウント管理台帳 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 一覧・採番・集計（アコーディオン・34所属・0口表示）・印刷・検索クリア — **浜田目視 OK** |
| **BUILD** | 733=`2026-06-16-vpn-account-db-block-ui-mutations` rev **5** / 734=`2026-06-16-vpn-account-dash-license-all-depts` rev **12** |
| **正本** | `docs/reports/2026-06-17-vpn-account-completion.md` |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---





## 2026-06-15 JST — **JRシステム用 iPad 管理台帳 ver.1 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 一覧・2 系統採番・集計アコーディオン・A4 印刷・検索クリア — **浜田目視 OK** |
| **BUILD** | 720=`2026-06-15-jr-ipad-db-block-ui-mutations` rev **5** / 721=`2026-06-15-jr-ipad-dash-search-clear` rev **8** |
| **正本** | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **Excel** | **運用終了**（kintone のみ正本） |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---






<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-21.md -->
