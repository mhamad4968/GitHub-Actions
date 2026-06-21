# GitHub stale branch 断捨離（R65）

**制定**: 2026-06-21（浜田 GO）

## 対象

| 条件 | 処置 |
|------|------|
| PR が **CLOSED** かつ **merged でない** | 断捨離候補 |
| `main` より **90 日以上**更新なし | 断捨離候補 |
| `main` に必要な独自コミットあり | **先に archive tag** |

## 手順

```bash
# 1. 保全 tag（削除前必須）
git fetch origin
git tag archive/<branch>-<YYYYMMDD> origin/<branch> -m "Archive before branch delete"
git push origin archive/<branch>-<YYYYMMDD>

# 2. remote / local 削除
git push origin --delete <branch>
git branch -D <branch>   # ローカルがある場合
```

## 実績（2026-06-21）

| branch | tag | 備考 |
|--------|-----|------|
| `feature/calculate-tax` | `archive/feature-calculate-tax-20260329` | CLOSED PR #1（消費税8% + FAQ） |

## 禁止

- `main` の force push  
- archive tag なしの branch 削除（独自コミットがある場合）
