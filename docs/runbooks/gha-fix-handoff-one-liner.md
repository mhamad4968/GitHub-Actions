# GHA / constitution-gates 是正後の handoff 1 行（#D-GHA-01）

**制定**: 2026-07-28（夕反省 F6 / 浜田 GO）  
**目的**: gates 失敗を直したあと、「まだ壊れている」通知や曖昧な印象を残さない。

## いつ

`constitution-gates` / `cursor-env-gates` / inventory 等の **Actions 失敗を是正した同一セッション**で、push 成功後すぐ。

## 何を書く（1 行で足りる）

```text
GHA是正: <失敗原因の短語> → <是正コミット短ハッシュ> （workflow=<name>）
```

例:

```text
GHA是正: inventory ACTIVE 68≠66 → abc1234 （workflow=constitution-gates）
```

## 手順

```bash
# 失敗原因と是正ハッシュを埋めて追記
npm run cio:handoff:gha-fix -- --cause "inventory ACTIVE 68≠66" --fix <hash> --workflow constitution-gates

# dry-run
npm run cio:handoff:gha-fix -- --dry-run --cause "…" --fix HEAD --workflow constitution-gates
```

続けて必要なら `npm run cio:session:export-handoff`。GitHub 通知の既読化は任意（`gh api --method PUT notifications`）。

## 書かないこと

- 明日の第1手・レーン宣言
- 長いログ全文の貼付
