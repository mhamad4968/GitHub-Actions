# 夕反省 — 2026-06-28（NAS管理台帳 kintone 化）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md` — **AI 失敗** + **ミス削減**（行動変更 **および** ルール・手順・脚本・runbook）

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

## 2. 改善 — 私が次から変えること（行動）

| ID | 失敗 | 私が次から変えること | 承認 |
|----|------|----------------------|------|
| **A1** | F1 | apply 前に dry-run 必読。23 件・先頭/末尾サンプル確認。**疑わしいとき POST しない** | ☐ |
| **A2** | F2 | §6.4 / Q14 を **実装前に再読**。プレースホルダを最初から正しく書く | ☐ |
| **A3** | F3 | 表記符号表を **仕様確定時** に書いてから実装する | ☐ |
| **A4** | F4 | preview 変更 → **deploy → PATCH** を最初から守る | ☐ |
| **A5** | F5 | 最長文字列で列幅を **CSS 前に試算** | ☐ |
| **A6** | F6 | BUILD はマイルストーン 1 本。**UI 調整は rev のみ** | ☐ |
| **A7** | F7 | skip 時は **理由 1 行 + 代替確認** をチャットに残す | ☐ |
| **A8** | F8 | 夕反省は **§2 行動 + §3 ルール/脚本** の二層。どちらか欠落しない | ☐ |

---

## 3. ルール・手順・脚本改善（ミス削減 — 承認待ち）

**趣旨**: 本日の失敗から導いた **リポへの恒久変更案**。依頼機能・残タスク・次案件テンプレではない。

| ID | 対応失敗 | 概要 | 反映先（案） | 承認 |
|----|----------|------|--------------|------|
| **S-NAS-01** | F1 | `nas-ledger-migrate-xlsx.mjs` — **apply 前 assert**（件数 23・組織名非空・先頭/末尾サンプル）で exit 1 | `scripts/nas-ledger-migrate-xlsx.mjs` | ☐ |
| **S-NAS-02** | F2 | `PLACEHOLDER_ROWS` と migrate dry-run で **設備なし行 shape 検証**（状態=－、設置先=-） | `scripts/lib/nas-ledger-kintone.mjs` | ☐ |
| **R-NAS-03** | F3 | 台帳 GO 前チェック — **表記符号**（`-` / `－` / `—`）を Q&A 確定表に 1 行必須 | `docs/runbooks/kintone-ledger-spec-qa-checklist.md` または creation-timing ルール | ☐ |
| **D-NAS-04** | F4 | **TSB** — kintone DROP_DOWN 変更は **preview deploy → live PUT**（CB_VA01 回避） | `docs/troubleshooting.md` | ☐ |
| **R-NAS-05** | F6 | customize **BUILD 命名** — UI-only 変更は BUILD 不変・rev のみ（deploy ログに注意 1 行） | `docs/knowledge/debug-tips.md` または deploy 脚本コメント | ☐ |
| **D-NAS-06** | F7 | Windows **`verify-kintone-live-schema` UV crash** — skip 時の証跡 1 行 + 代替手順 | `docs/troubleshooting.md` | ☐ |
| **R-NAS-07** | F8 | **夕反省 §2/§3 二層**（行動 / ルール・脚本）を scope に 1 節追記 | `docs/runbooks/evening-reflection-scope.md` | ☐ |

---

## 4. 承認済み

（なし — 2026-06-28 時点）

---

## 5. メモ

- 最大の失敗は **F1（migrate live 検証不足）**。
- §3 は「次案件 runbook 新設」ではなく、**今日の失敗が再発しない脚本・TSB・チェックリスト** に限定する。
