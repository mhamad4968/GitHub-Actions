# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-02 JST — **本日終了（夜間締め）** — 595/750-751 · 改善案5件 · §38-1 · Plan&Usage 18% · close-git 済

### 本日アクティブ（BUILD/rev — 2026-07-02）

| 項目 | 内容 |
|------|------|
| **595 社員マスタ** | BUILD=`2026-07-02-595-retire-clear-pc674-link` rev **114** — 退職時 674→保管 + 595 PC台帳サブテーブルクリア（backfill 7件・浜田 OK） |
| **750/751 メーリングリスト** | **Space 21 / thread 23 移設** — ACL: admin/system USER — 浜田目視 OK **2026-07-02** |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **メーリングリスト750–751** — **closed-v1**（750/751 Space21 移設のみ）。**触らない**: **688 / 677–679 / SKYSEA**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA 保留** | 触らない |
| **736 担当説明 保留** | Step2-3 待ち |
| **nodemailer 9.x** | V1 proposal 手動レビュー待ち |

**次の1手**: **次回セッション** — `cio:session:cold-start` → `session:bootstrap` → **Plan&Usage 1 行（§41 前）** → **浜田依頼待ち**（項番 -0）  
**Git**: **`1514773`** = `origin/main` — push 済
**夕反省**: `docs/reports/2026-07-02-evening-reflection.md`（§7 浜田 GO · 5 件実装済）  
**Plan&Usage**: **18%**（2026-07-02 記録）· Ultra リセット **7/15**（残 13 日）· **3 日に 1 回**報告 · stale なし · 次 nudge **~7/05**  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **クローズ正本**: `data/cio-project-closures.json` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**運用メモ**: 595 CSV 取込後は一覧 **「台帳へ一括反映」** を実行。595 退職 backfill: `npm run pc-ledger:backfill-595-clear-retired-pc-links:apply`。メーリングリスト移設: `npm run mailing-list:move-space21`（Space21 済なら skip）。Desktop `＃重要確認事項.txt` は **2026-06-30 廃止**（read-pack/18 正本は維持）。  
**改善案 GO 済（夜）**: R-ML-03, S-CLOSE-01, S-ML-05, R-595-03, D-CREDIT-01 — `docs/approved-changes/processed/2026-07-02/` · 正本 `2026-07-02-rules-evening-hamada-go.md`  
**憲法**: **§38-1** npm セキュリティ自律更新（minor/patch 自動 · major 保留）— `2026-07-02-rules-security-deps-autonomy-hamada-go.md`  
**npm minor**: `@kintone/cli` 1.20.0 · eslint 10.6.0 · globals 17.7.0 · qrcode 1.5.4 — major 保留: nodemailer 9.x · xlsx  
**MCP**: **6/6 OK** — Tier B upgrade **不要**（`cio:mcp:env`）  
**締め**: `SESSION-CLOSE-REPORT-20260702.txt` + 夕反省 **2026-07-02** + Desktop sync **2026-07-02 夜**

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **L2** bootstrap NG → NEW-SESSION-STARTER 6 部（1 回）| **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）
