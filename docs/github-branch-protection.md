# GitHub `main` ブランチ保護（手順メモ / §57-10）

**位置づけ**: リポジトリ設定は GitHub の **Admin** 権限が必要。本ファイルは **推奨チェックリスト** と **ワークフロー名の正本** を残す（API は組織ポリシーにより無効な場合あり）。

## 1. 設定場所

1. GitHub リポジトリ → **Settings** → **Branches** → **Branch protection rules** → **Add rule**（または既存 `main` を編集）
2. **Branch name pattern**: `main`

## 2. 推奨トグル（CIO×各モデル合意の出発点）

| 項目 | 推奨 | 備考 |
|------|------|------|
| Require a pull request before merging | 任意 | ソロ運用なら OFF でも可。複数人・AI並列時は ON + 1 approval を検討 |
| Require status checks to pass before merging | **ON（合意）** | 下記「必須チェック」に **実際に安定して緑になる名前だけ** を入れる |
| Require conversation resolution before merging | 任意 | PR 運用時 |
| Do not allow bypassing the above settings | 任意 | 管理者も守らせるなら ON（浜田判断） |
| Include administrators | 任意 | 緊急時は OFF のまま管理者バイパス可 |

## 3. 必須 status checks の選び方

GitHub のチェック名は **ワークフローの `name:` と job `id` の組み合わせ**で表示されることが多い。UI の検索ボックスに候補を打ち、**直近の `main` push で緑になった名前**をそのまま採用する（推測で大量追加しない）。

本リポ `.github/workflows/` の **`name:`（ワークフロー表示名）** の目安:

| ファイル | `name:`（目安） |
|----------|-----------------|
| `kintone-customize-deploy.yml` | `kintone-customize-deploy` |
| `daily-collect.yml` | `security-next-daily-collect` |
| `main.yml` | `security-next-kintone` |
| `ops-guide-kintone-publish.yml` | `ops-guide-kintone-publish` |
| `claude-code-action.yml` | `Claude Code` |

**運用メモ**:

- **paths 限定**のワークフロー（例: `customize/**` のみで発火）は、`main` の全 commit に付かない → **必須チェックに入れると PR が永遠にマージ不能**になり得る。入れる前に「対象パス外の commit でも必ず走るか」を確認する。
- まずは **`verify:agent-env` 相当の CI job** を 1 本 `pull_request` + `push` で `main` に常時付ける、のちに必須化する、が安全（CI 整備は別タスク可）。

## 4. §57 / 浜田 GO

- **例外ルール**（管理者バイパス・必須 check の一時解除）は **浜田裁定**。
- 本ドキュメントの改定は **§57-10** のインフラ類に含め、憲法本文との矛盾があれば §57-2 で起案し直す。

## 5. 管理者向け「最短 UI」手順（リポ `mhamad4968/GitHub-Actions`）

1. ブラウザで `https://github.com/mhamad4968/GitHub-Actions` を開く（**リポジトリの Settings**。Organization の org Settings ではない）。
2. **Settings** → 左サイドバー **Code and automation** 内の **Rules** → **Rulesets** を使う場合と、従来の **Branches**（**Branch protection rules**）を使う場合がある。**Rulesets** が表示されるなら新方式を推奨（GitHub の UI が優先）。
3. **Branch protection rules**（従来）の場合: **Add branch protection rule** → **Branch name pattern** に `main`。
4. **Require status checks to pass before merging** を ON → **Add checks** で検索。**直近に `main` で緑になったチェック名だけ**を追加（§3 の罠を再確認）。
5. **Require a pull request before merging** は運用に合わせて（ソロなら OFF 可）。
6. 画面下部 **Create** / **Save changes**。

**設定前の確認**: Actions タブで `main` の直近ワークフローが **paths 外の commit でも**期待どおり走っているかを見る。走らない job 名を必須にしない。

## 6. CLI / API（AI 端末に `gh` や `GITHUB_TOKEN` が無い場合）

このリポを触る **管理者の PC**（`gh` 導入済み or PAT 保持）で実行する。**Cursor サンドボックスにトークンを置かない**こと。

### 6.1 現状確認（読み取りのみ）

- [GitHub CLI](https://cli.github.com/) 導入後: `gh auth login` →  
  `gh api repos/mhamad4968/GitHub-Actions/branches/main/protection`
- `curl` の例（`GITHUB_TOKEN` は fine-grained でも classic でも、**Branches: write** 相当が必要な操作は [公式の権限表](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps) に従う）:

```bash
curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/mhamad4968/GitHub-Actions/branches/main/protection"
```

`404` なら **未設定**（この場合は §5 の UI で作成するのが確実）。

### 6.2 自動化（リポ同梱スクリプト）— **ベースラインのみ** API で適用可

**難しいのは「認証が無いこと」**であり、REST 自体は公開 API なので、**PAT または `gh auth login` さえあれば**ローカルから PUT できます。必須 status check を機械決めすると事故りやすいため、リポには次だけ同梱する:

- **`scripts/github-branch-protection-apply.mjs`**
  - 引数なし: **GET** して現状表示（dry-run）。
  - **`--baseline-apply`**: **必須チェック無し**の下限だけ PUT（`required_linear_history: true` / force-push・branch 削除禁止 / 他は null）。**マージ不能化を避ける**ため `required_status_checks` は付けない。
  - **`--gh-cli`**: `GITHUB_TOKEN` の代わりに **`gh api`** を使う（**`gh auth login` 済み**の端末向け）。

**npm scripts**:

| コマンド | 内容 |
|----------|------|
| `npm run github:branch-protection:status` | PAT（`GITHUB_TOKEN` または `GH_TOKEN`）で GET |
| `npm run github:branch-protection:status:gh` | `gh` 認証で GET |
| `npm run github:branch-protection:apply-baseline` | PAT で baseline PUT |
| `npm run github:branch-protection:apply-baseline:gh` | `gh` で baseline PUT |

**Windows: `gh` を winget で入れた直後**は PATH が効いていないことがある。**新しい PowerShell を開く**か、`"C:\Program Files\GitHub CLI\gh.exe" auth login` のようにフルパスで実行する。

**手順（管理者・1 回）**:

1. `winget install GitHub.cli`（未導入なら）→ 新しいターミナル。
2. `gh auth login`（ブラウザ or トークン貼付）— **対話 1 回**（AI 環境では代行不可）。
3. `npm run github:branch-protection:status:gh`（PowerShell で npm がブロックされる場合は **`npm.cmd run …`**、§6.2.1）で 404 または既存設定を確認。
4. `npm run github:branch-protection:apply-baseline:gh`（同様に `npm.cmd` 可）でベースライン適用。
5. **必須チェック**は §5 の UI で、**常に緑になる job 名だけ**を後から追加。

PAT のみ使う場合: GitHub → Settings → Developer settings → **Fine-grained token** 推奨。対象リポに **Administration: Read and write**（または classic の **repo** フル）を付与し、**ターミナルでだけ** `set GH_TOKEN=...`（PowerShell は `$env:GH_TOKEN="..."`）してから `npm run github:branch-protection:apply-baseline`。

### 6.2.1 Windows PowerShell で `npm` が「スクリプトの実行が無効」になる場合

`npm.ps1` が **ExecutionPolicy** に阻まれると出る。**いずれか一方**でよい。

1. **推奨（広めの回避）**: `npm.cmd` を明示する（ポリシー対象外）。  
   `cd` 先は **必ずリポジトリ**（例: `C:\Users\mhamada202408224\kintone-ai-lab`）。**`C:\WINDOWS\system32` では `git` / `npm run` は使わない**。

   ```powershell
   cd C:\Users\mhamada202408224\kintone-ai-lab
   git pull
   npm.cmd run github:branch-protection:status:gh
   npm.cmd run github:branch-protection:apply-baseline:gh
   ```

2. **CurrentUser のみ緩める**（管理者不要）:  
   `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`  
   のあと、通常どおり `npm run ...` 可。

**コマンド順**: 先に **`cd` → `git pull`**。system32 で `git pull` すると `not a git repository` になる。

### 6.3 将来: CI で `main` に常時付く check を 1 本足す

§3 のとおり、**`pull_request` + `push` branches: [main]** で `npm run verify:agent-env`（または `verify:all` のみ）を走らせる workflow を追加してから、その **job 名を Rules に必須化**するのが安全な順序。
