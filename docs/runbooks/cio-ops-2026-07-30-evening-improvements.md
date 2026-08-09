# 運用・規則改善 — 2026-07-30 夕反省（浜田全承認）

**GO**: `docs/approved-changes/2026-07-30-evening-reflection-hamada-go.md`  
**Cursor 規則**: `.cursor/rules/cio-ops-2026-07-30-evening-improvements.mdc`（`alwaysApply: false`）  
**憲法本文**: 変更なし

---

## 体制・運用

### O-1 — CI 緑 ≠ 十分（push 前ローカル parity）

- GitHub の success だけ見て「検査十分」としない。
- **push 前**（`cio:quality-gate --push`）に `npm run cio:pre-push-local-parity` を必須とする。
- 中身: `verify:ci-rule-integrity` + `cio:selfcheck:test` + `test:evening-improvements-2026-07-26` + `test:wake`  
  （**smoke 全量ではない**。smoke は別ゲート／障害時・大規模変更時。parity は「ローカルだけ赤／CI 緑」再発防止に足りると判断した最小束。）
- 緊急脱出: `SKIP_CIO_LOCAL_PARITY=1`（浜田承認下のみ・理由をチャット 1 行）。

### O-2 / R-ASK-01 — 依頼者確認は核 3〜4 問

正本: `docs/runbooks/requester-core-questions-template.md`

### O-3 — WAKE／bootstrap 失敗＝当日最初の障害

起動 NG（mandatory-read-gate・checkpoint minChars・bridge 等）は「後で直す」にしない。**本題前に切り分け・修復**する。

### O-4 — 仕様議論は正本 1＋未決 3

予算の正・集計単位・月金額などを混ぜて長くしない。対面前メモは **正本候補 1・未決最大 3**。

### O-5 — 完了済を GO 待ちに戻さない

checkpoint／案内規律どおり。夕反省の「失敗」と「成果・完了」を混同しない。

---

## ルール・憲法まわり（本文は触らない）

### C-1 — alwaysApply 新設

- 許可は **`cio-constitution.mdc` / `cio-18-zero-tolerance.mdc` のみ**（`verify-ci-rule-integrity`）。
- 新規で `alwaysApply: true` を付ける／許可リストを増やす場合は **同一 PR** で integrity 緑＋説明 **「なぜ憲法級か」1 行**（GO 必須）。

### C-2 / #CON-01 — Excel・計算式

画面ラベルだけでなく、**依頼者 Excel・表計算の見た目だけでも「手動／自動」を断定しない**。断定するときは **式セル／判定関数／commit を Read**。未読は「未確認」。  
（針・文言の正本は `docs/runbooks/evening-reflection-scope.md`。実 Excel ファイルの自動テストは対象外。）

### C-3 — ambient 依存の検査

`logs/*` の last-tier 等に検査結果を掛けすぎない。禁止語 smoke は ambient strict に縛られない（S-RPT-01）。  
**判定例**: テストは `process.env` や gitignore 状態ファイルの暗黙読取に依存させず、**明示引数／一時固定ファイル**で入力を再現可能にする。

### C-4 — 検査脚本と workflow paths

`cio-chat-report-selfcheck` 等を直したら、**constitution-gates の `paths` に含める**か、意図的に checkpoint 等でゲートを踏む。CI が将来遅い場合は `paths-ignore` を検討（ヒントのみ）。

### C-5 — 夕反省の層分け

改善案は **§2 行動 / §3 脚本** に加え、必要なら **§体制・運用・憲法** を §3 と分けて書く（本 runbook 層）。

---

## 行動（A1–A3）

| ID | 内容 |
|----|------|
| A1 | 計算・集計の話は式または入力セルを Read してから答える |
| A2 | GitHub 確認時はローカル parity（O-1）も回す |
| A3 | 依頼者確認は最初から核 3〜4 問 |
