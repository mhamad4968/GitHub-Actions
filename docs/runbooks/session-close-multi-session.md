# 1 日複数セッションの締め（C3 / 2026-05-31 承認）

**制定**: 2026-05-31（浜田 GO）

## 問題

午前に `SESSION-CLOSE-REPORT-YYYY-MM-DD.txt` を書いたあと、夕方に作業が続くと **締め正本・handoff・checkpoint がずれる**。

## ルール

| ファイル | 1 日 2 回目以降の更新 |
|----------|------------------------|
| **`SESSION-CLOSE-REPORT-YYYY-MM-DD.txt`** | **最終締めターンで上書き**（§4 夜追記で足すのではなく、**その日の最終版 1 本**に統一） |
| **`handoff-log.md`** | **末尾に 1 ブロック追加**のみ（朝ブロックは残す） |
| **`checkpoint-latest.md`** | **先頭に「夜・最終締め」表を追加**（古い表は下へ） |
| **`docs/reports/YYYY-MM-DD-evening-reflection.md`** | **その日 1 本**（夕方 1 回作成・更新） |

## AI 手順（最終締め）

1. 当日の作業を **SESSION-CLOSE-REPORT に反映**（上書き or §4 統合後に冗長 § を削除して 1 本化）
2. handoff **末尾 1 ブロック** / checkpoint **先頭 1 表**
3. 夕反省（26）作成 → `verify:evening-reflection-scope`
4. **先祖返りガード + 締め一括** — `npm run cio:session:close-git -- --execute --auto-stage --message "…"`（**preflight** + R19 + B1/B4 + **R44 checkpoint Git 同期** + desktop sync 内包）
5. `verify:session-handoff-integrity -- --validate-export`（close-git 内で export 直後に実行）

**D-CLOSE-PS-01（2026-08-05）**: `checkpoint-latest.md` 等の日本語正本は **PowerShell Set-Content / Out-File 禁止**（UTF-8 破壊）。編集は Node `fs.writeFileSync(..., 'utf8')` または cio:* のみ。

**S-CLOSE-ONEPASS-01（2026-08-05）**: close-git 途中 NG のとき **`cio:checkpoint:git-heal` や手書き `**Git**:` を挟まない**。原因1件を直してから close-git を再実行。

## R44 checkpoint Git 針（#R-R44-CLOSE-01 · 2026-07-14 · **2026-07-20 抜本**）

1. **復旧は SKIP 経路** — `CIO_POST_COMMIT_CHECKPOINT_SYNC=1` + tip 親 stamp（amend / normalize 禁止）
2. **force-push 禁止**
3. **normalize / sync が NF なら** `git fetch` → `git reset --hard origin/main` → SKIP sync 1 回
4. **#S-CHKPT-PARENT-01** — `Git === origin^1` は sync subject 不問で許容（1 世代ラグ）
5. **自動 heal** — post-commit は回帰 NG 時に常時 follow-up · cold-start Phase 6b · `npm run cio:checkpoint:git-heal -- --commit --push`
6. **テスト** — `npm run test:checkpoint-git-heal`（5 シナリオ）

## R44 復旧コピペ（#D-R44-RECOVERY-01）

D-CHKPT / orphan Git / close-git NF のとき（**手動 `**Git**:` 行編集禁止**）:

**推奨（2026-07-20）**:

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:checkpoint:git-heal -- --commit --push
npm run verify:session-close-git-warn
```

**従来（ハードリセットが必要なとき）**:

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
git fetch origin
git reset --hard origin/main
$env:CIO_POST_COMMIT_CHECKPOINT_SYNC='1'
# tip 現在値を stamp（commit 後に tip^1 = R44 off-by-one）
node --input-type=module -e "import { updateCheckpointGitHead, gitOriginMainShort } from './scripts/lib/cio-checkpoint-git-sync.mjs'; const h=gitOriginMainShort(process.cwd()); console.log(h, updateCheckpointGitHead(process.cwd(),{hash:h,suffix:'push 済'}));"
git add chat-sessions/checkpoint-latest.md
git commit -m "chore(checkpoint): sync Git line after close"
git push origin HEAD
Remove-Item Env:CIO_POST_COMMIT_CHECKPOINT_SYNC -ErrorAction SilentlyContinue
npm run cio:session:export-handoff
npm run verify:session-close-git-warn
```

bridge が dirty なら続けて `git add docs/handoff/latest-session-bridge.json` → commit `chore(handoff): align bridge gitHead` → push → **もう一度** 上記 SKIP sync（最終 tip を chore(checkpoint) に）

## 関連

- B4: `verify:session-close-git-warn`（未 push も NG）
- C1/C2: `18-重要確認.txt` — LITE のみ・sync 前 Notepad 警告
- #S-R44-SKIP-01 / #S-POSTCOMMIT-ORPHAN-01 / **#S-CHKPT-PARENT-01**: `cio-session-close-git.mjs` / `cio-checkpoint-git-postcommit-sync.mjs` / `cio-checkpoint-git-heal.mjs`
- 回帰テスト: `npm run test:checkpoint-git-heal`
