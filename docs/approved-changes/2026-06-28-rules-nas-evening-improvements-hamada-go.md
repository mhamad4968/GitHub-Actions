# 浜田 GO — 2026-06-28 夕反省改善案（NAS 台帳 — A + S/R/D 一括承認）

**承認日**: 2026-06-28  
**承認者**: 浜田（CEO）  
**契機**: NAS管理台帳 748/749 v1 完成セッション夕締め反省（F1–F8）

## 承認一覧 — 行動（§2）

| ID | 内容 | 状態 |
|----|------|------|
| A1 | migrate dry-run 必読・疑わしいとき POST しない | **GO** |
| A2 | §6.4 / Q14 実装前再読・プレースホルダ正確投入 | **GO** |
| A3 | 表記符号表を仕様確定時に先に書く | **GO** |
| A4 | preview 変更 → deploy → PATCH | **GO** |
| A5 | 最長文字列で列幅試算 | **GO** |
| A6 | BUILD マイルストーン 1 本・UI は rev のみ | **GO** |
| A7 | skip 時理由 1 行 + 代替確認 | **GO** |
| A8 | 夕反省 §2 行動 + §3 ルール/脚本 二層 | **GO** |

## 承認一覧 — ルール・脚本（§3）

| ID | 内容 | 状態 |
|----|------|------|
| S-NAS-01 | migrate apply 前 assert | **GO — 実装** |
| S-NAS-02 | PLACEHOLDER_ROWS + shape 検証 | **GO — 実装** |
| R-NAS-03 | 台帳 SPEC QA 表記符号（項目 7） | **GO — 実装** |
| D-NAS-04 | TSB-041 DROP_DOWN deploy 後 PUT | **GO — 実装** |
| R-NAS-05 | BUILD 命名 UI-only = rev のみ | **GO — 実装** |
| D-NAS-06 | TSB-039 NAS skip 証跡追記 | **GO — 実装** |
| R-NAS-07 | evening-reflection-scope 二層明記 | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| S-NAS-01 / S-NAS-02 | `scripts/lib/nas-ledger-kintone.mjs`, `scripts/nas-ledger-migrate-xlsx.mjs` |
| R-NAS-03 | `docs/runbooks/kintone-ledger-spec-qa-checklist.md` |
| D-NAS-04 | `docs/troubleshooting.md` TSB-041 |
| R-NAS-05 | `docs/knowledge/debug-tips.md`, `scripts/nas-ledger-bundle-dash.mjs` |
| D-NAS-06 | `docs/troubleshooting.md` TSB-039 関連 |
| R-NAS-07 | `docs/runbooks/evening-reflection-scope.md` |

## 関連

- `docs/reports/2026-06-28-evening-reflection.md`
