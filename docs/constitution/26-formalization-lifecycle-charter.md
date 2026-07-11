# 形骸化ライフサイクル — チャーター（2026-07-11 · META）

**地位**: `AGENTS.md` **非置換** · ゲート寿命の憲法規約  
**正本データ**: `data/cio-formalization-registry.json`（現役ゲートのみ）  
**退行表**: `docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md` §2

## 前提条件

- 形骸化 = **ラベルだけ残り機械が効かない**状態
- ゲート本体（`cio:guard:*` / `verify:*`）は削除対象ではない

## 原則 L1–L5

| # | 内容 |
|---|------|
| L1 | registry に載せるのは **verify が probe する現役ゲートのみ** |
| L2 | 代替 gate が verify PASS → **registry 行は削除してよい** |
| L3 | 削除後の履歴は **spec retired 表 + git**（dormant ステータス廃止） |
| L4 | `reviewDate` 付き項目は期限後 **GREEN→削除 / RED→gate 昇格** |
| L5 | 残す行には **`gate` + `verifyProbe` 必須** |

## 二択のみ

1. **削除** — 代替が verify で生きている  
2. **残す** — verify probe + KPI で形骸化しない

## 禁止

- 「念のため」だけの registry 行を残すこと
- dormant ラベルで永久放置すること
- registry 行を削除して **代替 gate も verify から外す**こと

## 検証

```powershell
npm run verify:constitution-evening
npm run verify:team-ops-antihollow
```
