# CI 状態の正本（cio-ci-truth）

**制定**: 2026-06-15（浜田 GO — 夕反省 R 一括）  
**正本データ**: `data/cio-ci-truth.json`

## 原則

1. **ローカル verify が緑でも GitHub が赤**のときは、main の憲法ゲート未通過として扱う。
2. **checkpoint-only の fix** は `constitution-gates.yml` の paths に `chat-sessions/checkpoint-latest.md` を含める（R-2026-06-15-A2）。
3. paths 外だけの修正で CI が走らない場合は、**意図的に paths 内ファイルを同梱 commit** するか `gh workflow run constitution-gates.yml` で再実行。

## セッション締め

```powershell
npm run verify:constitution-handoff
npm run verify:github-constitution-gates
npm run verify:session-close-git-warn
```

`verify:github-constitution-gates` は gh 無しなら **SKIP**（ローカル verify を正とする）。

## プロジェクト CLOSED 前

```powershell
npm run cio:project:close -- --verify
```

内訳は `data/cio-ci-truth.json` の `projectCloseChecks` を参照。

## pre-push

`git-hooks/pre-push` — `verify:constitution-handoff` NG 時は **push ブロック**。  
緊急のみ: `CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1 git push`

## 関連

- `docs/runbooks/kintone-project-close-gate.md`
- `docs/runbooks/lane-worktree-hygiene.md`
