# 夕反省 — 2026-06-25

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田 GO 2026-06-25** — R-BI-01〜02 / R-SESS-01〜04 / R736-03改 / 4.2 **すべて反映済**

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

## 2. 改善案（ミス削減）— **承認済（2026-06-25 浜田 GO）**

| ID | 内容 | 種別 | 状態 |
|----|------|------|------|
| **R-BI-01** | 新規 customize 同一セッション台帳セット | runbook | **GO・反映済** |
| **R-BI-02** | sync595_meta 月次確認 | 運用 | **GO・反映済** |
| **R-SESS-01** | CLOSE 順序 sync-desktop 固定 | template / mdc | **GO・反映済** |
| **R-SESS-02** | Desktop CEO 正本 sync 自動復元 | sync + bootstrap | **GO・反映済** |
| **R-SESS-03** | 締め session:clock:clear 必須 | checklist | **GO・反映済** |
| **R-SESS-04** | bootstrap NG 本題禁止 | lifecycle v2 | **GO・反映済** |
| **R736-03改** | 本日アクティブ `###` 見出し | template §4 | **GO・反映済** |
| **R736-01** | Windows UV SKIP 手順 | TSB-039 | **既存 GO** |

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

1. **`.cursor/rules/session-close-execute-first.mdc`** — CLOSE 順序に sync-desktop / clock:clear 明記 → **反映済**
2. **`session-bootstrap-verify.mjs`** — Desktop CEO 不在時 sync 1回再実行 → **反映済**
3. **業務改善 closed-v1 例外レーン** — `docs/runbooks/business-improvement-closed-v1-ux.md` 新設 → **反映済**

### 4.3 承認不要（既存ルールで充足）

- B1/B4 commit+push — 本締めで実施
- R736-03 checkpoint 当日ブロック — 本日反映済
