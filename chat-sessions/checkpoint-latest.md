# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

<!-- 部分GOスコープ（D2）例: **触らない** — 688 の猛暑日以外 / 677–679 / SKYSEA 7月 -->

**最終更新**: 2026-07-11 20:00 JST — **依頼効率化 v0.1**（compose · Desktop 36）· 観測期間継続

**Git**: **`03647e25`** — **push 待ち**

### 観測期間（2026-07-11 浜田指示 · 正式クローズは今日しない）

> **CEO**: クローズ判断は **今日やるべきではない**。**少なくとも2週間様子見** → **≈2026-07-25 頃**に再確認を依頼。

| 観測対象 | 期間 | 再確認タイミング |
|----------|------|------------------|
| 憲法 Round-3 + 夜4論点 | 運用観測 | **2026-07-25 頃** |
| rules-opt §18 完了宣言 | ACK **保留**（観測後） | 同上 |
| turn-start △2 形骸化 | 2週データ蓄積 | **≈2026-07-25**（v3.3 B-1 予定と一致） |
| H9 registry 最終判定 | 配線済 | **2026-07-25**（scheduled） |

**今日やらないこと**: 正式クローズ宣言 · rules-opt §18 ACK · 依頼効率化ツール着手判断

**次の1手（運用のみ）**: push（未 push commit 2本）→ 日常レーン継続 · **2026-07-25 頃**に浜田から「クローズ可否」を再質問

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA 7月**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | 猛暑日（WBGT）のみ部分 GO · それ以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/1 再計画 · 7月着手禁止 |
| **736** | §9.6 凍結 · 7/7〜 AI 主導 §41 |
| **712** | 削除済 — deploy 禁止 |

**夜レーン（2026-07-11）**: 憲法4論点 + Round-3 **完了** · verify 憲法/rules OK · **正式クローズ=観測2週間後（≈7/25）** · v3.3 §6 突合済

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`  
**Desktop LITE**: 浜田メモ帳は **`34-handoff-log-LITE.txt`** / **`35-checkpoint-latest-LITE.txt`** のみ（24/25 .md は AI 同期専用）

## 2026-07-10（BUILD/rev · 浜田目視 OK）

| 項目 | BUILD/rev |
|------|-----------|
| **688 稼働日数** | `2026-07-10-688-wbgt-heat-warn` **rev82** |
| **736 PH1c** | `2026-07-10-736-ph1c-reorder-hide-singleton` **rev182** |
| **698** | `2026-07-04-bi-employee-index-emp-filter` **rev19** |
| **700** | `2026-07-06-bi-apply-footer-reject-clear` **rev166** |

## 2026-07-09

| 項目 | BUILD/rev |
|------|-----------|
| **674** | `2026-07-09-674-list-export-col-order` **rev260** |
| **699** | `2026-07-09-bi-guide-list-accordion-exclusive` **rev123** |
