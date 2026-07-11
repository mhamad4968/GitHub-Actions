# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

<!-- 部分GOスコープ（D2）例: **触らない** — 688 の猛暑日以外 / 677–679 / SKYSEA 7月 -->

**最終更新**: 2026-07-11 19:50 JST — **憲法 Round-3 完走** · Desktop **34/35** · **クローズ前残正本化**（下表）

**Git**: **`03647e25`** = `origin/main` — push 済

### クローズ前残（2026-07-11 夜 · 浜田判断「まだ早い」）

| 優先 | 項目 | 状態 | 次アクション |
|:----:|------|------|-------------|
| **1** | ルール最適化 §18 | verify OK · **ACK 未** | 浜田 1 行 ACK |
| **2** | push | commit `7e0567a5` 済 | `git push` |
| **3** | smoke:quiet | **§51-6-2**（4h超）で NG | **新チャット** → `session:clock:set` → bootstrap |
| **4** | H9 registry | 配線済 | **2026-07-25** CEO 判定 |
| **5** | turn-start △2 | 監視中 | **≈2026-07-25** データ判断 |
| **6** | MCP Tier B | SCR 済 | 浜田 Reload Window 後 |
| **7** | 依頼効率化ツール | 未着手 | 1–3 後に要否判断 |

**次の1手**: push → **新チャット** bootstrap → 浜田 ACK 2 行（憲法 + rules-opt §18）

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

**夜レーン（2026-07-11）**: 憲法4論点 + Round-3 **完了** · verify 憲法/rules OK · smoke:quiet=セッション時計のみ NG · **rules-opt §18=浜田 ACK 待ち** · **v3.3 §6 突合済**（`docs/plans/2026-07-11-ai-team-ops-optimization-spec-v33.md`）

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
