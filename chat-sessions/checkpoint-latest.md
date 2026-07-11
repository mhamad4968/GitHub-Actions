# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

<!-- 部分GOスコープ（D2）例: **触らない** — 688 の猛暑日以外 / 677–679 / SKYSEA 7月 -->

**最終更新**: 2026-07-11 19:30 JST — **憲法 Round-3 完走**（R3-1〜10 · verify 全緑 · AIチーム全員 GO）· 次=依頼効率化ツール要否 · H9 判定=2026-07-25

**Git**: **commit/push 本ターン**

### 本日アクティブ（BUILD/rev — 2026-07-10）

| 項目 | 内容 |
|------|------|
| **688 稼働日数** | **WBGT 猛暑日参考** · BUILD=`2026-07-10-688-wbgt-heat-warn` **rev82** — **浜田目視 OK**（2026-07-10 · 東京WBGT CSV取込 · 画面反映 · 印刷3枚+過去5年猛暑日1枚） |
| **736 実行予算** | **PH1c** 行並び替え · BUILD=`2026-07-10-736-ph1c-reorder-hide-singleton` **rev182** — **浜田目視 OK**（2026-07-10 · ⋮メニュー表示・1行ゾーン非表示）· 移動操作は未実施 |
| | **PH1e** 仕様明細① `spec_category` · rev **175–177** |
| | **PH1f** 原価行 `cost_budget_category` · 区分別サマリー · rev **179** |
| **698 社員マスタ** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — **浜田目視 OK**（2026-07-10） |
| **700 提案申請** | BUILD=`2026-07-06-bi-apply-footer-reject-clear` **rev166** — **浜田目視 OK**（2026-07-10） |

### 前セッション（2026-07-09）

| 項目 | 内容 |
|------|------|
| **674 PC台帳** | BUILD=`2026-07-09-674-list-export-col-order` **rev260** |
| **699 ご利用ガイド** | BUILD=`2026-07-09-bi-guide-list-accordion-exclusive` **rev123** |

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA 7月**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | **猛暑日（WBGT）のみ部分 GO** — **implement + 浜田目視 OK**（2026-07-10）· それ以外は触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA** | **8/1–8/15 再計画** · **配信目標 9/15** — **7月着手禁止** |
| **736** | **§9.6 凍結** · **7/7〜 AI 主導 §41**（736 のみ） |
| **712** | 削除済 — deploy 禁止 |

**次の1手**: **依頼効率化ツール** 開発要否（憲法 4 論点完了 · `docs/plans/2026-07-11-constitution-evening-spec.md`）· MCP **governance profile** 維持 · kintone implement は別レーン

### 夜レーン必達（2026-07-11 浜田指示 · 忘れ禁止）

| 優先 | 内容 |
|:----:|------|
| **1** | 憲法改善 **4 論点すべて** 実装まで完走（議論のみ終了 **禁止**） | **完了 2026-07-11 夜** |
| **2** | `verify:constitution-handoff` + `verify:rules-optimization` + `smoke:quiet` exit 0 |
| **3** | commit/push · handoff · Desktop sync まで締め |
| **後** | 依頼効率化ツール要否（憲法 **完了後のみ**） |
**ルール最適化**: `npm run verify:rules-optimization` · discovery map `docs/runbooks/cio-rules-discovery-map.md` · **浜田 ACK** で spec §18 完了宣言
**736 7月**: `docs/runbooks/736-july-2026-schedule.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
