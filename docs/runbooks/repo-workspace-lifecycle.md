# リポジトリ作業領域ライフサイクル

> **制定**: 2026-06-14（`C:\tmp` 棚卸しと同時）

## 正本

| 項目 | パス |
|------|------|
| 一時パス判定 | `scripts/lib/cio-session-close-temp-paths.mjs` |
| purge | `npm run cio:repo:purge-temp -- --apply` |
| Desktop 作業領域 | `C:\tmp\` — `docs/runbooks/c-tmp-workspace-lifecycle.md` |

## 2026-06-14 整理結果

| 区分 | 扱い |
|------|------|
| **正本（git 管理）** | `scripts/`、`docs/plans/*-spec.md`、`data/*-registry.json`、checkpoint アーカイブ |
| **削除済（一時）** | `data/csv-inspect.json`、`workdays-*-dump`、調査用 `scripts/tmp-*.mjs` 等 |
| **維持（gitignore・ローカル）** | `scripts/_update_roadmap_*.py`（doc-lane 正本・runbook 参照） |
| **維持（マスク構造 JSON）** | `docs/plans/tmp-*-structure.json`（パスワードなし・移行済 SPEC 参照） |

## 一時ファイル（purge 対象）

`cio:repo:purge-temp` が削除するもの:

- `data/csv-inspect.json`、`data/jma-monthly-counts.json`、`data/rain-*.txt`
- `data/workdays-*-dump.json`、`data/workdays-*-summary.txt`
- `data/tmp-*.{txt,json}`
- `docs/approved-changes/pending/*`（未 GO の提案 JSON）
- `scripts/tmp-*.mjs`（移行・調査完了後）
- `scripts/_tmp-*.mjs`（ad-hoc 作業）
- `logs/tmp-*.md`、`logs/_cio-draft-*.txt`、`logs/tmp-briefing-*.md`

## ad-hoc スクリプト

| 種別 | ルール |
|------|--------|
| `scripts/tmp-*.mjs` | 一度きり REST/調査。**完了後 purge** |
| `scripts/_tmp-*.mjs` | セッション ad-hoc。**完了後 purge** |
| `scripts/_*.py` | `.gitignore`。**doc-lane 再利用**は残す（`_update_roadmap_*`） |
| 正本 | `scripts/` に昇格 + npm + runbook |

## 定期

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:repo:purge-temp          # dry-run
npm run cio:repo:purge-temp -- --apply
git status -sb
```

セッション締め前: `cio:session:close-git` は一時 untracked を **自動スキップ**（`isSessionCloseTempPath`）。

## 関連

- `docs/runbooks/c-tmp-workspace-lifecycle.md`
- `docs/runbooks/doc-lane.md`
- `data/c-tmp-workspace-registry.json`
