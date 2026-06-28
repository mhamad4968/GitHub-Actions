# 夕反省 — 2026-06-28（NAS管理台帳 kintone 化）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md` — **AI 失敗** + **ミス削減**（行動変更 **および** ルール・手順・脚本・runbook）  
> **承認**: `docs/approved-changes/2026-06-28-rules-nas-evening-improvements-hamada-go.md`（A1–A8 / S/R/D **GO — 実装**）

---

## 1. 本日 AI が失敗したこと

| # | 私がやったこと（失敗） | 結果 |
|---|------------------------|------|
| F1 | Excel 移行で **列マッピングを確認せず live POST** | 22 件・列ずれ → 再移行 |
| F2 | 設備なし 3 行の **設置先を仕様誤読**（組織名同値で投入） | 浜田指摘 → 後追い PATCH |
| F3 | **`-` / `－` / `—`** を実装前に決めずバラバラ | 浜田指摘 **3 回** |
| F4 | kintone ドロップダウン変更後 **deploy 前に PUT** | CB_VA01 |
| F5 | 列幅を **試算せず** 2 回調整 | 浜田指摘 2 回 |
| F6 | UI 微修正のたび **BUILD 名を増やした** | 中間 BUILD 残存 → v1 統一 |
| F7 | schema verify crash 後 **skip 前提**で deploy | 代替確認が弱い |
| F8 | 改善案を **依頼・残タスク** にすり替え、**ルール改善層を落とした** | 夕反省目的の取り違え |

---

## 2. 改善 — 私が次から変えること（行動）— 承認済み

| ID | 失敗 | 私が次から変えること | 状態 |
|----|------|----------------------|------|
| **A1** | F1 | apply 前に dry-run 必読。23 件・先頭/末尾サンプル確認。**疑わしいとき POST しない** | **GO** |
| **A2** | F2 | §6.4 / Q14 を **実装前に再読**。プレースホルダを最初から正しく書く | **GO** |
| **A3** | F3 | 表記符号表を **仕様確定時** に書いてから実装する | **GO** |
| **A4** | F4 | preview 変更 → **deploy → PATCH** を最初から守る | **GO** |
| **A5** | F5 | 最長文字列で列幅を **CSS 前に試算** | **GO** |
| **A6** | F6 | BUILD はマイルストーン 1 本。**UI 調整は rev のみ** | **GO** |
| **A7** | F7 | skip 時は **理由 1 行 + 代替確認** をチャットに残す | **GO** |
| **A8** | F8 | 夕反省は **§2 行動 + §3 ルール/脚本** の二層。どちらか欠落しない | **GO** |

---

## 3. ルール・手順・脚本改善 — 承認済み・実装

| ID | 対応失敗 | 概要 | 正本 | 状態 |
|----|----------|------|------|------|
| **S-NAS-01** | F1 | migrate **apply 前 assert**（件数 23・組織名非空・列ずれ・サンプル） | `scripts/nas-ledger-migrate-xlsx.mjs` / `scripts/lib/nas-ledger-kintone.mjs` | **実装** |
| **S-NAS-02** | F2 | `PLACEHOLDER_ROWS` + migrate **設備なし shape 検証** | `scripts/lib/nas-ledger-kintone.mjs` | **実装** |
| **R-NAS-03** | F3 | GO 前チェック **表記符号** 必須（項目 7） | `docs/runbooks/kintone-ledger-spec-qa-checklist.md` | **実装** |
| **D-NAS-04** | F4 | **TSB-041** — DROP_DOWN 変更は preview deploy → live PUT | `docs/troubleshooting.md` | **実装** |
| **R-NAS-05** | F6 | BUILD 命名 — UI-only は BUILD 不変・rev のみ | `docs/knowledge/debug-tips.md` / `nas-ledger-bundle-dash.mjs` | **実装** |
| **D-NAS-06** | F7 | TSB-039 関連に NAS skip 証跡手順追記 | `docs/troubleshooting.md` TSB-039 | **実装** |
| **R-NAS-07** | F8 | 夕反省 **§2/§3 二層** を scope 明記 | `docs/runbooks/evening-reflection-scope.md` | **実装** |

---

## 4. 承認済み

**2026-06-28 浜田 GO — すべて承認・§3 実装完了**

- **行動**: A1–A8  
- **ルール・脚本**: S-NAS-01, S-NAS-02, R-NAS-03, D-NAS-04, R-NAS-05, D-NAS-06, R-NAS-07

---

## 5. メモ

- 最大の失敗は **F1（migrate live 検証不足）**。
- §3 は「次案件 runbook 新設」ではなく、**今日の失敗が再発しない脚本・TSB・チェックリスト** に限定する。
