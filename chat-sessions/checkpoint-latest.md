# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

<!-- 部分GOスコープ（D2）例: **触らない** — 688 の猛暑日以外 / 677–679 / SKYSEA 7月 -->

**最終更新**: 2026-07-11 20:30 JST — **688 WBGT 完了**（rev85）· セッション締め

**Git**: **（close-git 後に同期）** — push 済を想定

### 観測期間（2026-07-11 浜田指示 · 正式クローズは今日しない）

> **CEO**: クローズ判断は **今日やるべきではない**。**少なくとも2週間様子見** → **≈2026-07-25 頃**に再確認を依頼。

| 観測対象 | 期間 | 再確認タイミング |
|----------|------|------------------|
| 憲法 Round-3 + 夜4論点 | 運用観測 | **2026-07-25 頃** |
| rules-opt §18 完了宣言 | ACK **保留**（観測後） | 同上 |
| turn-start △2 形骸化 | 2週データ蓄積 | **≈2026-07-25** |
| H9 registry 最終判定 | 配線済 | **2026-07-25** |

**今日やらないこと**: 正式クローズ宣言 · rules-opt §18 ACK

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-07-11 完了（688 WBGT 部分 GO）

| 項目 | BUILD/rev | 検収 |
|------|-----------|------|
| WBGT 読込・脚注 | `2026-07-11-688-wbgt-reload-fix` rev84 | 浜田 OK |
| 未保存ダイアログ過剰 | `2026-07-11-688-dirty-banner-fix` rev85 | 浜田 OK |
| 依頼効率化 v0.1 | `cio:request:compose` · Desktop 36 | push 済 |

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
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**  
**日終わり** `cio:session:close-git` / Desktop sync / `SESSION-CLOCK.md`  
**Desktop LITE**: **`34-handoff-log-LITE.txt`** / **`35-checkpoint-latest-LITE.txt`** のみ（24/25 .md は AI 同期専用）

## 2026-07-10（BUILD/rev · 浜田目視 OK）

| 項目 | BUILD/rev |
|------|-----------|
| **688 稼働日数** | `2026-07-10-688-wbgt-heat-warn` **rev82**（→ 7/11 に reload-fix / dirty-fix で更新） |
| **736 PH1c** | `2026-07-10-736-ph1c-reorder-hide-singleton` **rev182** |
