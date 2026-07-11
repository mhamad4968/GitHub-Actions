# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

<!-- 部分GOスコープ（D2）例: **触らない** — 688 の猛暑日以外 / 677–679 / SKYSEA 7月 -->

**最終更新**: 2026-07-12 JST — **新セッション WAKE** · checkpoint 凍結ゾーン修復

**Git**: **`d00a2fdc`** = `origin/main` — push 済

**次の1手**: 日常レーン継続 · `cio:request:compose` 試用 · **≈2026-07-25** 憲法クローズ可否の再確認（観測期間）

**GO待ち**: 憲法正式クローズ — 観測後（≈7/25）· 夕反省 F0 改善案 **2026-07-11 全承認・実施済**

**観測期間（≈7/25 再確認）**: 憲法 Round-3 · rules-opt §18 ACK · turn-start △2 · H9 registry — **今日やらない**: 正式クローズ宣言

| 観測対象 | 再確認 |
|----------|--------|
| 憲法 Round-3 + 夜4論点 | **2026-07-25 頃** |
| rules-opt §18 完了宣言 | 観測後 ACK |
| turn-start △2 形骸化 | 2週データ蓄積 |

**運用メモ**: 688 customize 修正後は実装GO後 `cio:preflight:688` → `deploy:688`（#R-688-DEPLOY-01）。**確認A（compose OK）≠ 実装GO** — G0 のみ調査（#R-GO-BOUNDARY-01 · `36-REQUEST-COMPOSE-INDEX.txt`）。

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md` · **クローズ正本**: `data/cio-project-closures.json`

**688 本番**: BUILD=`2026-07-11-688-dirty-banner-fix` rev **85**（WBGT reload rev84 含む）— 浜田目視 OK

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**。**触らない**: **688（WBGT以外） / 677–679 / SKYSEA 7月**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT 完了 · **それ以外触らない** |
| **677–679** | 触らない |
| **SKYSEA** | 8/1 再計画 · 7月着手禁止 |
| **736** | §9.6 凍結 · 7/7〜 AI 主導 §41 |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`  
**Desktop LITE**: 浜田メモ帳は **`34-handoff-log-LITE.txt`** / **`35-checkpoint-latest-LITE.txt`** のみ（24/25 .md は AI 同期専用）

## 2026-07-11 F0 改善（浜田全承認 · 実施済）

| ID | 内容 |
|----|------|
| #R-GO-BOUNDARY-01 | charter / 18-重要確認 / AGENTS — 確認A·G0·G2 分離 |
| #R-REQUEST-COMPOSE-02 | compose runbook/spec — OK後≠実装 |
| #D-GO-COMPOSE-MAP-01 | Desktop 36 段階対応表 |
| #S-COMPOSE-PHASE-01 | `--phase investigate\|implement` |
| #R-688-DEPLOY-01 | 実装GO後 · 688 deploy 必須 |

記録: `docs/approved-changes/2026-07-11-evening-f0-improvements-hamada-go.md`

## 2026-07-11 完了（688 WBGT 部分 GO）

| 項目 | BUILD/rev | 検収 |
|------|-----------|------|
| WBGT 読込・脚注 | `2026-07-11-688-wbgt-reload-fix` rev84 | 浜田 OK |
| 未保存ダイアログ過剰 | `2026-07-11-688-dirty-banner-fix` rev85 | 浜田 OK |
| 依頼効率化 v0.1 | `cio:request:compose` · Desktop 36 | push 済 |

## 2026-07-10（BUILD/rev · 浜田目視 OK）

| 項目 | BUILD/rev |
|------|-----------|
| **688 稼働日数** | `2026-07-10-688-wbgt-heat-warn` **rev82**（→ 7/11 に reload-fix / dirty-fix で更新） |
| **736 PH1c** | `2026-07-10-736-ph1c-reorder-hide-singleton` **rev182** |
| **698** | `2026-07-04-bi-employee-index-emp-filter` **rev19** |
| **700** | `2026-07-06-bi-apply-footer-reject-clear` **rev166** |
