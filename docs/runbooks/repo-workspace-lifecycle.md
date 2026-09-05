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
- `logs/tmp-*`、`logs/_cio-draft-*`

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

## Documents（ユーザプロファイル）

| パス | 状態 |
|------|------|
| `Documents\kintone-src` | **削除済（2026-06-14）** — 正本はリポ `customize/` / `scripts/` |
| `Documents\kintone-app` | **削除済（2026-06-14）** — 移行前ワークスペース |
| `Documents\Claude` | **温存** — Claude Desktop 用（利用有無は浜田判断） |

## C:\ 重複 clone・残骸（2026-06-14 削除済）

| パス | 状態 |
|------|------|
| `C:\Users\mhamada202408224\kintone-ai-lab` | **正本** — git `main` の唯一の clone |
| `C:\kintone_dev` | **削除済** — 2026-04 旧作業場（649–654 時代・`.env` 含む） |
| `%USERPROFILE%\dev\kintone-ai-lab` | **削除済** — stale clone（`ca4ffd8`） |
| `C:\home\mhamada202408224` | **削除済** — WSL パス誤作成 stub |
| `C:\Claudeとの会話保存` | **削除済** — kintone 無関係の会話メモ（`Claudeとの会話メモ` とは別） |

## Desktop（2026-06-14 整理）

| パス | 状態 |
|------|------|
| `Desktop\AI緊急用` | **維持** — セッション bootstrap 正本（`session-starter:sync-desktop`） |
| `Desktop\kintone-app - ショートカット.lnk` | **削除済** — 削除済 `Documents\kintone-app` への死リンク |
| `Desktop\tmp - ショートカット.lnk` | **削除済** — 任意整理 |
| `Desktop\AI*.txt`（内省メモ等） | **削除済** — 任意整理 |

## 正本 registry（R34–R40）

| ファイル | 用途 |
|----------|------|
| `data/windows-canonical-paths.json` | Windows 正本 clone・禁止パス・Desktop 必須（R34） |
| `data/kintone-customize-path-registry.json` | semantic customize → appId（R37） |
| `data/c-tmp-workspace-registry.json` | `C:\tmp` 作業領域 |

## パス整理 GO の締め（R35）

浜田 GO で **ローカル削除・整理**した場合:

1. 本 runbook（または `c-tmp-workspace-registry.json`）を **同日更新**
2. **`git commit` + `push` 必須** — 記録なし削除禁止
3. Windows 端末: `npm run verify:windows-canonical-paths` + `npm run verify:desktop-dead-shortcuts`

## 四半期スキャン（R40）

**1・4・7・10 月**の月初（またはセッション最初）に実施:

```powershell
npm run verify:windows-canonical-paths
npm run verify:desktop-dead-shortcuts
# 目視: C:\ 直下・%USERPROFILE% に kintone-ai-lab 重複 clone がないか
```

## 関連

- `docs/runbooks/c-tmp-workspace-lifecycle.md`
- `docs/runbooks/doc-lane.md`
- `docs/runbooks/kintone-project-close-gate.md`（R36 CLOSED 前）
- `data/c-tmp-workspace-registry.json`
- `data/windows-canonical-paths.json`
- `data/kintone-customize-path-registry.json`
