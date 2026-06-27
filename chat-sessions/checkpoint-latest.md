# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-27 JST — **doc-lane 締め（R-DOC-12〜16 GO）+ Desktop sync**

### 本日アクティブ（doc-lane — 2026-06-27）

| 項目 | 内容 |
|------|------|
| **レーン** | doc-lane — R-DOC-01〜11 + Phase1 PPTX / Phase2 Word infra |
| **経営会議** | R7 確定（§1 AI / §2・事例 枠）— 6月版 DOCX を次回 base 推奨 |
| **未完了** | Phase2 Word **パイロット 1 本 + 浜田目視 OK**（R-DOC-16） |
| **テンプレ** | `C:\tmp\資料作成\` 5月版・6月版 — registry 更新済 |

### 前セッション BUILD（JRE — 2026-06-26）

| 項目 | 内容 |
|------|------|
| **744** | BUILD=`2026-06-26-jre-cloud-account-db-block-v1` rev **5** — DB ブロック・**99 件移行済** |
| **745** | BUILD=`2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13` rev **18** — CRUD/595/集計/出力 + 検索 AND + 部署支店表示 |
| **浜田** | **検索・退職運用 OK**（目視調整フェーズ継続可） |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

| レーン | 状態 | クローズ日 | 正本 |
|--------|------|------------|------|
| **業務改善提案 ver.02**（697–713） | closed-v1 | 2026-06-13 | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **社内 Wi-Fi SSID**（718/719） | closed-v1 | 2026-06-14 | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| **JR iPad 台帳**（720/721） | closed-v1 | 2026-06-15 | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **VPN アカウント**（733/734） | closed-v1 | 2026-06-17 | `docs/reports/2026-06-17-vpn-account-completion.md` |
| **トータルネットワーク**（737/738） | closed-v1 | 2026-06-21 | `docs/reports/2026-06-21-total-network-completion.md` |
| **複合機管理台帳**（741/742） | closed-v1 | 2026-06-22 | `docs/reports/2026-06-22-mfp-ledger-completion.md` |

**業務改善のみ継続可**（浜田 2026-06-20 / R-BI GO 2026-06-25）: **軽微 UX** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **触らない** |
| **予実管理 保留** | **677/678/679** — **触らない** |
| **SKYSEA 保留** | **2026-07 頃**計画検討 |
| **736 担当説明 保留** | Step2-3 待ち（customize dirty あり・別レーン） |

**次の1手**: 浜田 **項番 -0** — **doc-lane** 経営会議パイロット / JRE 745 残 UX / 736 Step2-3。**688 / 677–679 / SKYSEA** — 触らない  
**Git**: *(本締め push 後更新)* — main=origin/main  
**dirty（別レーン・意図的未 commit）**: 736 / bi-guide / yojitsu SPEC 等 — 次セッション **項番 -0** 指示まで触らない  
**JRE 仕様**: `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md` §7.6  
**npm**: `jre-cloud:bundle-dash` → `deploy:745`（前に `cio:preflight:745`）  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`  
**736 本番**: BUILD=`2026-06-26-736-ux-sticky-print-badges-v1` rev **134**（作業ツリー dirty・未コミット）  
**MCP**: **現状凍結**  
**CLOSE 順（R-SESS-01）**: export-handoff → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync` → `session:clock:clear` → `cio:session:close-git`  
**bootstrap（R-SESS-02/04）**: Desktop `＃重要確認事項.txt` sync 自動復元  

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** `session-boundary-close-gate.mdc` | **履歴** `chat-sessions/checkpoints/checkpoint-archive-2026-06-25.md`
