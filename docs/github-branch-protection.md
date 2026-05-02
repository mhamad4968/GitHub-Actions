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
