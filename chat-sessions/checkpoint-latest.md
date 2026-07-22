# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-22 夜 JST — セッション締め。浜田承認待ち: 夕反省改善案。**継続作業（項番は当日 -0 で再確認）**は下記「継続メモ」。

**Git**: 締め commit+push 後に本行を heal。

**本日状態（2026-07-22）**:
- App **756** LIVE BUILD=`2026-07-22-ver02-name-col-align` **rev56**
- 名称3列の **列ずれ**パイロット是正済。**候補リストは Excel 未突合（仮シード）**
- 夕反省: `docs/reports/2026-07-22-evening-reflection.md`（承認待ち）
- 一報: `docs/reports/2026-07-22-SESSION-ONE-REPORT.md`

**継続メモ（浜田 2026-07-22 指示・当日 -0 で再確認）**:
1. 名称・規格1/2/3リストを Excel データマスタと総突合し同一化
2. 仕様総点検（U/D/Y）と残ギャップ修正
3. 必要なら他版の名称列付け替え
4. **Excel と同じデータの完全移行**（壊れた関数は憶測データ可）

**GO待ち**: H9 / △2 = **2026-07-25 のみ**。夕反省 #R/#S#D = **承認待ち**。

**736**: 触らない。**756/757/758**: Ver.02 LIVE。

## クローズ済み（9件）— `data/cio-project-closures.json`

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / NAS748–749 / ML750–751 / Kintoneアカウント752–753

## 保留

| 状態 | 内容 |
|------|------|
| **688 / 677–679** | 触らない |
| **SKYSEA** | 8/3 まで配信なし |
| **712** | deploy 禁止 |

## セッション切替

**WAKE** `npm run cio:session:cold-start` · Desktop `AI緊急用` 最新のみ

<!-- archive: chat-sessions/checkpoints/checkpoint-archive-2026-07-22.md -->

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
