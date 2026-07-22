# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-22 夜 JST — 夕反省 GO **全件実装済**（#R-NAME-01〜#R-CONST-01）。App756 LIVE BUILD=`2026-07-22-ver02-excel-name-lists` rev57。

**Git**: **`9e7674b1`** = `origin/main` — push 済

**本日状態（2026-07-22）**:
- App **756** LIVE BUILD=`2026-07-22-ver02-excel-name-lists` **rev57**（名称候補＝Excel 正本 JSON / verify:jikkou-name-lists-excel）
- 名称・規格 **列ずれ**パイロット付け替え済（`bv-elrkxqezuoe8m4x7`）
- 夕反省改善案 **GO＋実装済**: `docs/approved-changes/2026-07-22-evening-reflection-hamada-go.md`
- 正本リスト: `scripts/data/jikkou-yosan-v2-excel-name-lists.json`
- 735/736 **書込なし**

**継続メモ（次セッション -0）**:
1. ~~名称リスト Excel 突合~~ **済（#R-NAME-01/#S-NAME-01）** — 必要なら C/H 全件の再スキャン拡張
2. 仕様総点検（U1–U30 / D-* / Y1–Y11）残ギャップ（チェックリスト A 行）
3. 必要なら他 mig736 版にも名称列付け替え
4. **Excel と同じデータの完全移行**（壊れた関数は憶測データ可）

**GO待ち**: H9 / △2 最終判定は **2026-07-25 のみ**。

**次の1手**: 継続メモ **2–4**（仕様総点検・他 BV 名称列・Excel 完全移行）。

**観測期間**: ~~憲法 Round-3 · rules-opt §18~~ **CLOSED 2026-07-15**。**H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: **経営会議資料 2026年7月度 — 完了**（浜田 2026-07-15 確認）。正本 `C:\tmp\資料作成\【2026年7月度経営会議資料】2026年06月情報セキュリティレポート.docx`。**次月まで新規作成不要**。

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md` · **クローズ正本**: `data/cio-project-closures.json`

**688**: BUILD=`2026-07-13-688-heat-closed` rev90 — それ以外触らない  
**674**: rev262 — 目視 OK  
**699**: rev132 · **700**: rev170  
**736**: rev186 保持・**触らない**  
**756/757/758**: Ver.02 LIVE。リスト正本＝Excel。継続メモ 2–4  
**746/747**: Dash rev14 — 目視 OK（2026-07-18）

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | 継続メモ 2–4 |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`

<!-- archive: chat-sessions/checkpoints/checkpoint-archive-2026-07-22.md -->
