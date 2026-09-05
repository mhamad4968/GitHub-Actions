# GitHub: コミットのチェックが pending のまま（Cursor / Mintlify）

**症状**: `main` の最新コミットで **GitHub Actions（kintone-customize-deploy）は成功**しているのに、コミット横のステータスが **黄色（pending）** のまま。

## 原因（2026-05-21 確認）

同一コミットに **外部 GitHub App** が登録した **check suite が `queued` のまま完了しない**ことがある。

| App | 状態 | 影響 |
|-----|------|------|
| **GitHub Actions** (`kintone-customize-deploy`) | success | 問題なし |
| **Cursor** | queued（check run 0 件） | 全体 pending の原因になり得る |
| **Mintlify** | queued（check run 0 件） | 同上 |

本リポジトリは **Mintlify 用 `docs.json` なし**・**Cursor 向け CI 定義なし**のため、これらの App が push ごとに suite だけ作って終わると **永続 pending** になる。

## 是正（浜田 CEO / リポ管理者）

1. GitHub → **mhamad4968/GitHub-Actions** → **Settings** → **Integrations** → **GitHub Apps**
2. **Cursor** … **Configure** → **Repository access** から **本リポジトリを外す**（または App を無効化）
3. **Mintlify** … 同上（本リポで docs 同期を使わない場合は外す）
4. コミット一覧を再読み込みし、pending が解消したか確認

**代替**: 各 App のダッシュボードで連携を完了し、queued が success / skipped になるまで待つ。

## リポジトリ側 CI（Actions）

- **憲法ゲート**: `constitution-gates` … ルール・read-pack 等の path 変更時のみ（`npm run verify:constitution-handoff` 相当）
- **kintone**: `kintone-customize-deploy` … `customize/**` 変更時。ESLint は常時。API 本番反映は **`KINTONE_PUSH_AUTO_DEPLOY=true`** かつ差分に対象 JS があるときのみ。
- **674 / 629 別名パス**（2026-05-21 以降）: `customize/new-pc-ledger-v1/desktop.js` → **674**、`customize/shucccho-seisan/desktop.js` → **629** を push 差分のデプロイ判定に含める。

## ローカル確認（Actions 失敗時）

```bash
bash scripts/regenerate-constitution-rule.sh
node scripts/verify-constitution-handoff.mjs
node scripts/verify-ci-rule-integrity.mjs
npm run lint:customize
```

## EOD（#O1 2026-09-05）

`npm run cio:eod:github` は **GitHub Actions の unresolved failure だけ**を NG にする。コミット横の黄色 pending（Cursor / Mintlify queued）は **Actions 失敗ではない**。是正は本ファイルの管理者操作。

## 変更履歴

- **2026-09-05**: EOD は Actions 失敗のみ NG。黄色 pending は本ファイルの管理者操作（#O1）
- **2026-05-21**: 初版（Cursor/Mintlify queued による pending、674/629 パス判定を workflow に追記）
