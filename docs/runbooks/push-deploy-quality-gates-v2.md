# Push / Deploy 品質ゲート v2 — 正本

> **正本日**: 2026-06-21 JST — AI チーム運用改善 B（浜田 GO）  
> **Lifecycle 上位**: `docs/runbooks/session-lifecycle-v2.md` §4.3 WORK  
> **関連**: `kintone-project-close-gate.md`（CLOSED 前）/ `kintone-ci-push-deploy-guard.md`（GHA）

---

## 1. なぜ v2 か

736 版管理実装で **commit 後・push 時** に初めて `lint:customize` NG が判明し、amend してから push する手戻りが発生した。

| ID | 失敗 | 原因 |
|----|------|------|
| **F-B1** | push ブロック | bundle 後 `desktop.js` の ESLint 未実行（commit 前習慣なし） |
| **F-B2** | deploy 後 calc 不一致 | calc-gate はあったが **build → lint** 順序が push ゲートに無い |
| **F-B3** | ゲート分散 | pre-push / preflight / calc-gate / close-gate が doc 分散 |
| **F-B4** | kintone-apps garble | deploy 記録後 **`sync:kintone-apps-build` 未実行** → rev 重複マーカー・fileKey 不一致（2026-07-04） |

**教訓（736）**: `jikkou-yosan-build-desktop.mjs` が layout + calc-core を連結するため、**ソース側で同名関数を export すると bundle 重複** → ESLint `no-redeclare`。対策は **共通関数を layout 側に 1 定義**（実装済）。

---

## 2. 3 段ゲート（責務分離）

```
commit 前（軽量） → push 前（標準） → deploy 前（app 固有）
```

| 段 | コマンド | 内容 | タイミング |
|----|----------|------|------------|
| **commit** | `npm run cio:pre-commit-check` | `lint:customize` のみ | **git commit 前**（WORK 内） |
| **push** | `npm run cio:pre-push-check` | constitution-handoff + lint | **git push 前**（hook 同等） |
| **deploy** | `npm run cio:deploy-gate -- 736` | app manifest 参照 | **`cio:preflight` → `deploy` の間** |

```mermaid
flowchart LR
  C[customize 編集] --> B[build/bundle]
  B --> G1[cio:pre-commit-check]
  G1 --> CM[git commit]
  CM --> G2[cio:pre-push-check / hook]
  G2 --> PS[git push]
  PS --> PF[cio:preflight:app]
  PF --> G3[cio:deploy-gate app]
  G3 --> DP[deploy:app]
```

---

## 3. コマンド一覧

| 目的 | コマンド |
|------|----------|
| commit 前 | `npm run cio:pre-commit-check` |
| push 前（手動） | `npm run cio:pre-push-check` |
| deploy 前 | `npm run cio:deploy-gate -- <appId>` |
| 汎用 | `npm run cio:quality-gate -- --commit\|--push\|--deploy <app>` |
| pre-push hook | `scripts/git-hook-pre-push.mjs` → 内部で `--push` |

**ESLint NG 時**: `logs/eslint-customize-report.json` + 標準エラーに **file:line — message** を表示。

---

## 4. app manifest

正本: `data/cio-app-quality-gates.json`

| appId | deployGate | 備考 |
|-------|------------|------|
| **736** | `jikkou-yosan:deploy-gate` | build + **ux-gate** + ui/js sync + calc-gate + rowkey-gate + lint |
| **687** | `workdays-deploy-gate.mjs 687` | UI verify + calc |
| **688** | `workdays-deploy-gate.mjs 688` | 同上 |
| **その他** | 未定義 | preflight + deploy guard のみ（エラーにならない） |

manifest 追加手順:

1. `data/cio-app-quality-gates.json` に app 節追加
2. 必要なら `scripts/<lane>-deploy-gate.mjs` 作成
3. `deploy:<app>` が gate を呼ぶよう `package.json` 更新

---

## 5. deploy 標準手順（WORK 内）

```bash
# 1. 編集 → build/bundle
npm run jikkou-yosan:build-desktop   # 736 の例

# 2. commit 前
npm run cio:pre-commit-check

# 3. commit
git add … && git commit -m "…"

# 4. push 前（hook が無い環境）
npm run cio:pre-push-check

# 5. deploy
npm run cio:preflight:736 -- --note "…"
npm run cio:deploy-gate -- 736
npm run deploy:736

# 6. deploy 後（R1 / 2026-07-04 浜田 GO — garble 再発防止）
npm run sync:kintone-apps-build -- <appId> --strict
npm run verify:kintone-apps-live-build-sync -- <appId> --strict
# 複数 app なら --all --strict（時間がかかる場合は当該 app のみ）
```

**736 `deploy:736`**: 内包で `jikkou-yosan:deploy-gate` を実行（二重 build 防止のため deploy-gate 1 本化）。

**R1（2026-07-04 GO）**: customize **deploy 成功直後**に §6 の手順 6 を **同一セッション**で実行。full CLOSE 前に `kintone-apps.md` / `data/cio-live-builds.json` を commit に含める。

---

## 6. pre-push hook（R60）

- 実体: `scripts/git-hook-pre-push.mjs`
- インストール: `npm run hooks:install`（`.git/hooks/pre-push` → 上記）
- 内容: `cio:quality-gate --push` 同等

**緊急 bypass**（チャットに理由 1 行）:

| 変数 | 効果 |
|------|------|
| `CIO_ALLOW_PUSH_WITHOUT_LINT=1` | lint スキップ |
| `CIO_ALLOW_PUSH_WITH_CONSTITUTION_FAIL=1` | constitution-handoff スキップ |

---

## 7. CLOSED / セッション締め

| 場面 | ゲート |
|------|--------|
| プロジェクト CLOSED | `verify:kintone-project-close-gate` |
| セッション full CLOSE | `verify:session-close-git-warn` + `cio:session:close-git` + **当日 customize deploy ありなら R1（§5 手順 6）済み確認** |

---

## 8. レビュー記録（2026-06-21）

| レビュア | 判定 | 反映 |
|----------|------|------|
| DeepSeek | GO（条件付） | commit/push/deploy 責務分離、736 根本原因追記、eslint 詳細表示 |

---

## 9. 改定ルール

- app 追加: manifest → deploy-gate スクリプト → package.json
- hook 変更: `git-hook-pre-push.mjs` + `windows-governance-ops.md` 追随
