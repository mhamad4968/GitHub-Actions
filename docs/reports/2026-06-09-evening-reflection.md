# 2026-06-09 — AI 失敗と憲法・ルール更新案

（明日の作業・案件・UAT 手順は対象外。機能の未実装リストも書かない。）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | 月列を 1〜12 月ループ順のまま表示し時系列が崩れた | v3 ソート |
| F2 | 年列を「追加した」と説明したが DOM 未実装のまま deploy | v5 |
| F3 | deploy 後も kintone-apps.md BUILD が古い | 手修正 |
| F4 | calc-core 変更後 calc-test が旧仕様 | **calc-gate 追加**（旧 calc-test は未更新） |
| F5 | 締め文書に案件・UAT・明日 TODO を混ぜた（CEO 指摘×2） | 本書き直し |

---

## 憲法・ルール更新案

### R1 — deploy 前「UI 主張と built JS の一致」ゲート

**提案**: `deploy:688`（必要なら他 app）直前に、意図した UI マーカー（例 `wd688-year-col`、表ヘッダ文言）が `customize/*/desktop.js` に存在するか grep。BUILD note とセットで preflight JSON に記録。

**防ぐ失敗**: F2  
**正本候補**: `scripts/cio-deploy-preflight-guard.mjs` 拡張、または `scripts/workdays-verify-built-ui.mjs`

---

### R2 — 表の月列ソートをルール＋テストで固定

**提案**: AGENTS または cio-discipline に「フィルタ後の時系列データは (year, month) 昇順で表示。ループ index ≠ 表示順」。`workdays-calc-test` または UI build 後 smoke に 1 アサート。

**防ぐ失敗**: F1  
**正本候補**: `AGENTS.md` 追記、`.cursor/rules/` lane メモ

---

### R3 — kintone-apps.md BUILD と live BUILD の機械同期

**提案**: `deploy-customization.js` 成功時、`data/cio-live-builds.json` から kintone-apps 該当行を更新するか、不一致で CI/ deploy fail。

**防ぐ失敗**: F3  
**正本候補**: `scripts/deploy-customization.js`、運用は既存 live-build-registry 流用

---

### R4 — 計算正本変更はテスト diff 必須

**提案**: `workdays-calc-core.mjs` 変更セッションでは `workdays-calc-test.mjs` の更新を同じ PR/コミット単位で必須。deploy:687/688 前に `npm run workdays:calc-test` を gate に。

**防ぐ失敗**: F4  
**正本候補**: `AGENTS.md` §35 系、package.json script チェーン

---

### R5 — セッション締めの出力区分（CEO 2026-06-09）

**提案**: checkpoint / SESSION-CLOSE / evening-reflection / Desktop LITE の標準構成を:

1. AI 失敗（事実）
2. 憲法・ルール・runbook 更新案（承認待ち）
3. ~~明日やること~~ ~~案件 UAT 手順~~ ~~機能 backlog~~ → **別ドキュメント**

HANDOFF-HUMAN も「失敗＋ルール案＋承認待ち」のみ先頭に書く。

**防ぐ失敗**: F5

---

### R6 — workdays deploy runbook（1 枚）

**提案**: `docs/runbooks/workdays-deploy-checklist.md` — build → syntax check → R1 grep → R4 calc-test → preflight → deploy → R3 BUILD 確認。688 表 UI 触ったセッションは必読。

**防ぐ失敗**: F1〜F4 共通（プロセス未文書化）

---

## 承認（CEO 2026-06-09）

**R1〜R6 全部 OK**（R1 は workdays 687/688 のみ / R5 は runbook 正本化）。

| ID | 実装 |
|----|------|
| R1 | `scripts/workdays-verify-built-ui.mjs` → `deploy:687` / `deploy:688` 直前 |
| R2 | `workdays-calc-gate.mjs` 月ソート assert + runbook §4 |
| R3 | `scripts/sync-kintone-apps-build.mjs` → deploy 成功後 |
| R4 | `scripts/workdays-calc-gate.mjs` → deploy 直前（旧 calc-test は別途 F4） |
| R5 | `docs/runbooks/session-close-reflection-scope.md` |
| R6 | `docs/runbooks/workdays-deploy-checklist.md` |

---

## あえて書かないもの

- 利用者 UAT の進め方・確認項目  
- 年列12月・下段カレンダー等の**機能**判断（利用者・浜田判断の別レーン）  
- 「明日 calc-test をやる」等の作業割当  

EOF