# 新憲法要否 — 決定メモ（2026-07-11 夜）

**CEO 判断**: **新憲法ファイルは作らない**。

## 理由

| 層 | 正本 | 役割 |
|----|------|------|
| 第1 | `AGENTS.md` | § 意味の最終解釈 |
| 第1補 | `docs/constitution/*.md` | ジャンル別読本（薄いミラー） |
| 第2 | `verify:*` / `cio:guard:*` | 機械強制 |
| 第3 | `docs/runbooks/` | 手順 |

`constitution.mdc` 網羅版は **Read 必要時のみ**（alwaysApply:false）。  
CEO 向け 1 ページ Charter も **不要** — `00-rule-hierarchy.md` + 本メモで足りる。

## 禁止

- `AGENTS.md` を別ファイルに置換すること
- 新しい「最上位」mdc の追加（alwaysApply 2 本維持）

## 検証

`npm run verify:constitution-evening`
