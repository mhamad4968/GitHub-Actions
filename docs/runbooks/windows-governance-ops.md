# Windows 向け governance 操作（R48）

**制定**: 2026-06-17（浜田 GO — R48）  
**対象**: 浜田 PC（Windows 10/11）— **PowerShell が正本シェル**

---

## 原則

| 項目 | ルール |
|------|--------|
| チェーン | `; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }` — **`&&` は使わない** |
| 作業 dir | `cd C:\Users\mhamada202408224\kintone-ai-lab` を先頭に書く |
| hooks | 初回または pull 後: `npm run hooks:install` |

---

## セッション開始

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run session:bootstrap
```

---

## 台帳 v1 クローズ（R41 + R20）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run verify:kintone-project-close-gate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run verify:checkpoint-project-closure
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run cio:session:close-git -- --execute --auto-stage --message "[CLOSE] プロジェクト名 v1完成"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
gh run list --branch main --limit 5
```

`close-git` は push 後 **checkpoint `**Git**` 行を自動同期**（R44 · **#S-R44-SKIP-01**: `CIO_POST_COMMIT_CHECKPOINT_SYNC=1` 新規 commit · amend/normalize 禁止）。変更があれば `chore(checkpoint): sync Git line after close` を追加 push。復旧手順: `docs/runbooks/session-close-multi-session.md` R44 節。

---

## customize deploy + bundle（R43）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run vpn-account:bundle-dash
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run deploy:734
```

新規レーンは `{lane}:bundle-dash` が **sync → bundle → lint** を内包すること（テンプレ: `scripts/lib/kintone-bundle-dash-with-sync.mjs`）。

---

## git hooks 再インストール（R42）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run hooks:install
git push --dry-run origin HEAD
```

pre-push は `git rev-parse --show-toplevel` でリポ root を解決（`.git/hooks` からの相対パス事故を防止）。

**R60（2026-06-20 / B v2 2026-06-21）**: pre-push は `scripts/cio-quality-gate.mjs --push`（constitution-handoff + lint:customize）。commit 前は `npm run cio:pre-commit-check`。NG 時は push ブロック。緊急のみ `CIO_ALLOW_PUSH_WITHOUT_LINT=1 git push`。

正本: `docs/runbooks/push-deploy-quality-gates-v2.md`

---

## live-schema guard — Windows UV クラッシュ（R53 / TSB-039 / R736-01）

**症状**: `npm run verify:kintone-live-schema` が **OK 表示後**に Node が `UV_HANDLE_CLOSING` で落ちる（Windows 固有）。

**2026-07-06 GO (#D-WIN-SCHEMA-01)**: `cio-deploy-preflight-guard` が **stdout に OK 行があれば deploy 続行**（skip 不要な場合が多い）。

**手動回避（従来）**:

```powershell
$env:SKIP_CIO_LIVE_SCHEMA_GUARD = "1"
npm run deploy:715
Remove-Item Env:SKIP_CIO_LIVE_SCHEMA_GUARD
```

**条件**: 手動で live-schema が OK であることを確認済みであること。チャットに **skip 理由と appId** を残す（R15 証跡）。

---

## 緊急 push（constitution-handoff NG 時のみ）

```powershell
$env:CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL = "1"
git push origin HEAD
Remove-Item Env:CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL
```

---

## 関連

- [`cio-project-closure-governance.md`](cio-project-closure-governance.md)
- [`cio-ci-truth.md`](cio-ci-truth.md)
- [`kintone-ledger-v1-closure-checklist.md`](kintone-ledger-v1-closure-checklist.md)
- [`repo-workspace-lifecycle.md`](repo-workspace-lifecycle.md)
