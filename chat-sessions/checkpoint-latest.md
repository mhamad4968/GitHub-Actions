# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-25 JST — **683 6暦月棒欠落是正・浜田 OK・セッション締め**

### 本日アクティブ（BUILD/rev — 2026-06-25）

| 項目 | 内容 |
|------|------|
| **683** | BUILD=`2026-06-25-683-sixmo-chart-pagination-fix-v1` rev **85** — 6暦月棒 REST 100件打切り欠落是正（暦月別取得） |
| **699** | BUILD=`2026-06-25-bi-guide-login-aggregate-note-v3` rev **113** — 4ロール能力バナー・年次集計注記 |
| **698** | BUILD=`2026-06-25-bi-employee-sync595-banner-v1` rev **11** — 697 `sync595_meta` から一覧同期ステータス |
| **697** | `sync595_meta` 追加 — 595→698 同期結果を JSON 記録 |
| **浜田** | 698 一覧バナー **目視 OK** / **683 6暦月棒 目視 OK** |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

| レーン | 状態 | クローズ日 | 正本 |
|--------|------|------------|------|
| **業務改善提案 ver.02**（697–713） | closed-v1 | 2026-06-13 | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **社内 Wi-Fi SSID**（718/719） | closed-v1 | 2026-06-14 | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| **JR iPad 台帳**（720/721） | closed-v1 | 2026-06-15 | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **VPN アカウント**（733/734） | closed-v1 | 2026-06-17 | `docs/reports/2026-06-17-vpn-account-completion.md` |
| **トータルネットワーク**（737/738） | closed-v1 | 2026-06-21 | `docs/reports/2026-06-21-total-network-completion.md` |
| **複合機管理台帳**（741/742） | closed-v1 | 2026-06-22 | `docs/reports/2026-06-22-mfp-ledger-completion.md` |

**業務改善のみ継続可**（浜田 2026-06-20 / R-BI GO 2026-06-25）: **軽微 UX** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`（699/698 バナー等）。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **触らない** |
| **予実管理 保留** | **677/678/679** — **触らない** |
| **SKYSEA 保留** | **2026-07 頃**計画検討 |
| **736 担当説明 保留** | **2026-06-23 以降** — Step2-3 待ち |

**次の1手**: 736 Step2-3（差分サマリー印刷）または浜田指定。**688 / 677–679 / SKYSEA / 736担当説明** — 触らない  
**Git**: `288cfcf` — 683 6暦月棒 fix push 済（浜田 OK 2026-06-25）  
**683 検証**: `npm run 683:audit-six-month-chart -- --view-year 2026 --view-month 7`（REST 単月 vs 旧一括の差分確認）  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`  
**736 本番**: BUILD=`2026-06-24-736-diff-print-detail-v2c` rev **131**  
**698 本番**: BUILD=`2026-06-25-bi-employee-sync595-banner-v1` rev **11**  
**699 本番**: BUILD=`2026-06-25-bi-guide-login-aggregate-note-v3` rev **113**  
**MCP**: **現状凍結**  
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**ルール GO（2026-06-25）**: R-BI-01〜02 / R-SESS-01〜04 / R736-03改 — `docs/approved-changes/2026-06-25-rules-bi-sess-hamada-go.md` / 夕反省 `docs/reports/2026-06-25-evening-reflection.md`  
**CLOSE 順（R-SESS-01）**: export-handoff → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync` → `session:clock:clear` → `cio:session:close-git`  
**bootstrap（R-SESS-02/04）**: Desktop `＃重要確認事項.txt` を sync 自動復元 / bootstrap NG → L2 1回 → エスカレ・**本題禁止**  
**BI runbook（R-BI-01）**: `docs/runbooks/business-improvement-closed-v1-ux.md` — 677–682 新規 customize 必須 appType manifest+registry / 698/699 BUILD 日付・697 sync595 meta  
**manifest v2026-06-25**: fullCloseSteps に sync-desktop / clock-clear — `data/cio-handoff-template.json`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** `session-boundary-close-gate.mdc` | **履歴** `chat-sessions/checkpoints/checkpoint-archive-2026-06-21.md`

<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-21.md -->
