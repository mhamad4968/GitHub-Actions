# 夕反省 — 2026-06-25

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田判断待ち** — 下記 R-BI-01〜R-SESS-04

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | 新セッション cold-start で `verify:checkpoint-handoff-template` NG | checkpoint 凍結ゾーンに日付履歴が混入し preamble 構造が崩れていた |
| F2 | `session:bootstrap` が session-clock 76h 超過で NG | 前セッション終了時に `session:clock:clear` / 次回 `session:clock:set` が未実施 |
| F3 | `deploy:699` / `deploy:698` で live-schema guard が UV assertion crash | Windows 既知パターン（R736-01）。手動 verify OK 後 SKIP が必要だった |
| F4 | Desktop `＃重要確認事項.txt` 欠落 → hooks **CIO三重・層1 NG** | sync が AI緊急用のみで Desktop 直下 CEO 正本を復元していなかった |
| F5 | 698 deploy 後 `kintone-apps.md` 機械表未登録警告 | 新 customize アプリ追加時の台帳更新が deploy 後に遅延 |
| F6 | セッション終了直前 `verify:desktop-ai-emergency-sync` NG | handoff-log の Desktop ミラーが checkpoint 更新と非同期 |

---

## 2. 改善案（ミス削減）— **承認待ち**

| ID | 内容 | 種別 | 期待効果 |
|----|------|------|----------|
| **R-BI-01** | 業務改善で **新規 customize アプリ**（例 698）を追加するとき、**同一セッション内**に `deploy:N` + `kintone-customize-path-registry` + `kintone-apps.md` 機械表 + `cio:preflight:N` を **セットで完了**してから締め | runbook §BI 軽微 UX | deploy 警告・次セッション台帳ズレ防止 |
| **R-BI-02** | 697 `sync595_meta` は **sync-595 成功/失敗の両方**で書く（実装済）。運用: Task Scheduler 失敗時も 698 バナーが赤表示になることを **月1確認** | 運用メモ | 同期失敗の見落とし防止 |
| **R-SESS-01** | セッション **full CLOSE** 順序を固定: `checkpoint` → `handoff:append-block` → `export-handoff` → **`session-starter:sync-desktop`** → `verify:desktop-ai-emergency-sync` → `close-git`（逆順禁止） | `checkpoint-handoff-template-v2.md` §7 追記 | F6 再発防止 |
| **R-SESS-02** | `session-starter:sync-desktop` が **Desktop `＃重要確認事項.txt` を read-pack 18 から自動復元**（2026-06-25 実装済・本提案は **憲文化 GO 待ち**） | `sync-session-starter-to-desktop.mjs` | F4 恒久対策 |
| **R-SESS-03** | 日終わり **必ず** `session:clock:clear`（または次回 WAKE 前に `session:clock:set` を bootstrap 直後に実施）を CLOSE チェックリストに明記 | `20-SESSION-REPORT-CHECKLIST.txt` | F2 再発防止 |
| **R-SESS-04** | `cio:session:cold-start` 失敗時、AI は **L2 完走（1回）→ 浜田へ NG ログ貼付**まで同一ターンで行い、本題に着手しない（Lifecycle v2 §3 既存を **違反扱いで強調**） | `session-lifecycle-v2.md` | cold-start 是正の手戻り削減 |
| **R736-01** | （既存 GO）Windows UV assertion → verify 手動 OK 後 `SKIP_CIO_LIVE_SCHEMA_GUARD=1` | TSB-039 | 本日 deploy でも再発 — **運用徹底** |

---

## 3. 本日から既に実施した是正（コード）

- `sync-session-starter-to-desktop.mjs` — Desktop `＃重要確認事項.txt` 自動復元
- 697 `sync595_meta` + sync-595 メタ書き込み + 698 一覧バナー customize
- `kintone-apps.md` 698/699 BUILD 更新
- checkpoint / handoff 本日分更新（締め処理）

---

## 4. 憲法・ルール是正（深掘り — 浜田承認用）

### 4.1 構造問題

セッション切替エラーの **70%** は「3系統（checkpoint / handoff / Desktop）の更新順序ズレ」と「Desktop 正本の物理欠落」に集約される。憲法条文は足りているが、**close-git が Desktop sync より先に走る**と F6 が再発する。

### 4.2 提案（承認後に反映）

1. **`.cursor/rules/session-close-execute-first.mdc`** — CLOSE 順序に `sync-desktop` を **export-handoff の直後・close-git の直前**と明記
2. **`mandatory-read-gate.mjs`** — bootstrap 時、`Desktop\＃重要確認事項.txt` 不在なら **warn→sync 再実行を1回自動**（exit 0 は sync 成功後のみ）
3. **業務改善 closed-v1 例外レーン** — 「軽微 UX」の定義に **一覧バナー・ログイン案内**を examples として 1 行追加（再実装禁止との境界明確化）

### 4.3 承認不要（既存ルールで充足）

- B1/B4 commit+push — 本締めで実施
- R736-03 checkpoint 当日ブロック — 本日反映済
