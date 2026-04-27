# Cursor IDE Hooks 設計仕様（P5-1 / R1 / 2026-04-26 制定）

**目的**: TSB-019 (Cursor IDE Auto-Run Mode = Run Everything (Unsandboxed) で AI が承認なしに任意 shell を実行できる構成) の構造的根本対策。`~/.cursor/hooks.json` の `beforeShellExecution` フックで §52-8 高リスク shell を **AI 承認なしで物理 block** する。

**連動条文**:
- AGENTS.md §52-8「高リスク shell 暴走防止」（AI 自己制約層）
- AGENTS.md §1-2-2-1「Cursor IDE 必須設定」（IDE 設定層）
- docs/troubleshooting.md TSB-019（Auto-Run Mode bypass RACI）

---

## 1. 三層防御アーキテクチャ

| 層 | 主体 | 内容 | 対象 |
|---|---|---|---|
| 第 1 層: **AI 自己制約** | AI | §52-8 で「危険 shell は事前報告 → GO 待ち」を AI に内在化 | 全危険カテゴリ |
| 第 2 層: **IDE 承認ゲート** | Cursor IDE | §1-2-2-1 で `Browser Protection: ON` + `MCP Tools Protection: ON` | browser / kintone MCP |
| **第 3 層: 物理 block** ⭐ | OS / hook | **本仕様** = `~/.cursor/hooks/dangerous-shell-blocker.sh` で deny | shell 実行 |

**TSB-019 の教訓**: 第 1 層は AI が「うっかり忘れる」可能性があり、第 2 層は IDE 設定 (Auto-Run Mode = Run Everything) で構造的 bypass された経歴あり。**第 3 層 (本仕様) は AI が憲法違反を試みても物理的に止まる構造的不可逆性を提供**。

---

## 2. ファイル構成

```
~/.cursor/
├── hooks.json                                 # 設定 (sessionStart + beforeSubmitPrompt + beforeShellExecution)
└── hooks/
    ├── session-start-autopilot-delegate.sh   # sessionStart 先頭: CURSOR_PROJECT_DIR に autopilot があれば実行
    ├── preflight-reminder.sh                  # 既存 (sessionStart / beforeSubmitPrompt)
    └── dangerous-shell-blocker.sh             # 新規 (beforeShellExecution / R1)
```

`~/.cursor/hooks.json` は user-global スコープ = 全プロジェクトで有効。

**session-clock 自動化（2026-04-27）**: Cursor は **project と user の両方の `sessionStart` を実行してマージ**する。ワークスペースが親フォルダだけ開かれている等で **リポ内 `.cursor/hooks.json` の autopilot が走らない**場合でも、`session-start-autopilot-delegate.sh` が **`CURSOR_PROJECT_DIR` 配下に `.cursor/hooks/session-start-autopilot.mjs` があるときだけ**同スクリプトを起動し、`npm run session:clock:set` と `session:clock:watch` を実行する。ミラー: `artifacts/cursor-hooks/session-start-autopilot-delegate.sh`。

---

## 3. hooks.json 設定

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "command": "./hooks/session-start-autopilot-delegate.sh",
        "timeout": 25,
        "failClosed": false
      },
      {
        "command": "./hooks/preflight-reminder.sh",
        "timeout": 3,
        "failClosed": false
      }
    ],
    "beforeSubmitPrompt": [
      {
        "command": "./hooks/preflight-reminder.sh",
        "timeout": 3,
        "failClosed": false
      }
    ],
    "beforeShellExecution": [
      {
        "command": "./hooks/dangerous-shell-blocker.sh",
        "timeout": 5,
        "failClosed": false
      }
    ]
  }
}
```

**failClosed: false の理由**: hook 自体が壊れた場合に Cursor を止めない fail-open 設計。万一 dangerous-shell-blocker.sh が syntax error 等で死亡しても、ユーザー作業は止まらない（block も効かなくなるが、その時は §52-8 第 1 層 AI 自己制約に戻る）。

---

## 4. dangerous-shell-blocker.sh の deny カテゴリ

| カテゴリ | パターン例 | 理由 |
|---|---|---|
| 削除系 (再帰/危険ターゲット) | `rm -rf /` / `rm -rf ~` / `rm -rf $HOME` / `rm -rf *` / `rm -rf /any` | 復旧不可 |
| 削除系 (find/xargs) | `find ... -delete` / `find ... -exec rm` / `xargs rm` | 再帰削除と等価 |
| git 破壊系 | `git push --force` / `git push -f` / `git reset --hard` / `git clean -fdx` / `git rebase` / `git filter-branch` / `git update-ref -d` | 履歴喪失 |
| 権限変更 (再帰) | `chmod -R` / `chown -R` / `setfacl` | システム整合性 |
| 特権コマンド | `sudo ...` 全般 | 管理者権限昇格 |
| コンテナ系 (削除) | `docker rm` / `docker system prune` / `docker volume rm` / `kubectl delete` / `helm uninstall` | サービス停止 |
| 秘密情報 (.env) | `echo "..." > .env` / `cat ... > .env` / `tee .env` / `sed -i ... .env` | クレデンシャル変更 |
| 秘密情報 (mcp.json) | `> .cursor/mcp.json` / `sed -i .cursor/mcp.json` | kintone 認証情報変更 |
| SSH 鍵変更 | `> ~/.ssh/...` / `sed -i ~/.ssh/...` | SSH 認証変更 |
| Hooks 自身の改ざん防止 | `> ~/.cursor/hooks*` / `sed -i ~/.cursor/hooks*` | 物理 block 層自体の保護 |

---

## 5. 安全カテゴリ (allow / 例外)

以下は deny pattern に該当しないため **allow される**:

- 読取系: `ls`, `cat`, `head`, `tail`, `grep`, `rg`, `find ... -print`
- 既知 npm スクリプト: `npm run smoke`, `npm run guard:check`, `npm run health-check`, `npm test` 系
- git 安全: `git status`, `git log`, `git diff`, `git add`, `git commit`, `git push origin main` (force なし)
- session-lock: `node scripts/session-lock.mjs ...`
- 単発検証: `node -e "..."`, `node scripts/<既存スクリプト>`
- `npm install` (引数なし / lockfile から再構築) — block しないが §52-8 第 1 層で AI 報告推奨
- `cat .env` (読取のみ) — block しない

---

## 6. ログ出力

全判定が `/tmp/cursor-shell-blocker.log` に追記される（JST タイムスタンプ + 判定 + コマンド先頭部分）:

```
[2026-04-26 08:39:53 +0900] ALLOW cmd=git status
[2026-04-26 08:39:53 +0900] BLOCK category=秘密情報(.env 編集) cmd=echo "FOO=bar" > .env
[2026-04-26 08:40:30 +0900] ALLOW cmd=echo "P5-1 hook activation test"
```

朝報 §5-5 に統合する場合は将来課題 (P5-1 第 2 段階)。

---

## 7. block された時の AI/ユーザー体験

### Cursor IDE の表示
```
Rejected: Command execution was blocked by a hook: {
  "continue": true,
  "permission": "deny",
  "user_message": "⚠️ §52-8 高リスク shell を物理 block しました\nカテゴリ: ...\nコマンド: ...",
  "agent_message": "⛔ §52-8 BLOCK by hooks/dangerous-shell-blocker.sh\nCategory: ...\nReason: ...\nNext action:\n1. ⚠️ §52-8 高リスク shell 検知 / 実行前 GO 確認 を 浜田 に提示する\n2. 浜田が「GO」と明示するまで再実行しない\n3. もしフック側に誤検知があれば、AI は浜田に報告し ... のパターン緩和を提案する"
}
```

### AI 動作（§52-8 第 1 層 + 第 3 層連動）
1. block されたら、AI は `agent_message` を受信して **即座に浜田へ「§52-8 物理 block 検知」を報告**
2. 浜田が GO を明示するまで再実行しない
3. もし誤検知 (false positive) なら AI は浜田に報告 → パターン緩和を提案

---

## 8. 例外運用 (浜田 GO で実行する場合)

GO が出た場合の選択肢:

### 案 A (一時): hook を無効化せず別経路で実行
- `bash -c "rm -rf /tmp/safe-target"` ではなく、**スクリプトファイル化** して `npm run` で実行  
  例: `scripts/cleanup-tmp.mjs` を作成 → `npm run cleanup:tmp` で呼ぶ
- npm スクリプト経由は hook で allow されるが、コマンド自体は適切な category にチェックされる
- 注意: スクリプト内の `rm -rf` 等は hook の対象外（hook は **AI が直接 shell に出す command** のみ評価）

### 案 B (恒久例外): hook の deny pattern を緩和
- AGENTS.md §52-8 改定 → §57 改定プロセスを経てから dangerous-shell-blocker.sh のパターンを緩和
- 例: `git rebase` を許可カテゴリに移す等

### 案 C (緊急停止): hook 自体を一時無効化
- `~/.cursor/hooks.json` から `beforeShellExecution` セクションを削除（または空配列に）
- これは浜田が手動で行う（AI は §52-8 hooks 改ざん防止で block される）
- 復旧後は必ず再有効化

---

## 9. 自己改ざん防止

`dangerous-shell-blocker.sh` 自身が `~/.cursor/hooks` 配下への書込を deny pattern に含めているため、**AI が自分で hook を改ざんしようとしても block される** = 物理層の自己保全。

唯一の改ざん経路:
- **浜田の手動編集** (Cursor IDE の StrReplace ツール経由 / Notepad 等)
- **AI の StrReplace ツール経由** (= shell ではないため hook 対象外 / **これは構造的盲点だが、§52-8 第 1 層 AI 自己制約で「StrReplace で hooks を編集する前は浜田 GO 必須」を内在化済**)

---

## 10. 検証ログ (P5-1 / 2026-04-26 08:40 JST)

| # | テスト | 期待 | 実結果 |
|---|---|---|---|
| 1 | `ls -la` | allow | ✅ allow / exit 0 |
| 2 | `rm -rf /` | deny | ✅ deny / exit 2 + Cursor 側 Rejected |
| 3 | `git push --force origin main` | deny | ✅ deny / exit 2 |
| 4 | `sudo apt update` | deny | ✅ deny / exit 2 |
| 5 | `git push origin main` (force なし) | allow | ✅ allow / exit 0 |
| 6 | `npm run smoke` | allow | ✅ allow / exit 0 |
| 7 | `git status` | allow | ✅ allow / exit 0 |
| 8 | `cat .env` (読取) | allow | ✅ allow / exit 0 |
| 9 | `echo "FOO=bar" > .env` | deny | ✅ deny / exit 2 |
| 10 | `chmod -R 777 /tmp` | deny | ✅ deny / exit 2 |
| 11 | **本物テスト**: `rm -rf /tmp/p5-test-block-target-not-exist` を Shell ツールから実行 | Cursor IDE が Rejected を表示 | ✅ `Rejected: Command execution was blocked by a hook` 表示確認 |

10/10 + 1 実証 = **TSB-019 物理 block 層稼働確認**。

---

## 11.5 誤検知履歴と修正（2026-04-26 P5-2 制定）

### 事象
P5-2 で `.cursorignore` を heredoc 経由 (`cat > .cursorignore <<EOF ... EOF`) で作成しようとしたら、blocker.sh が「秘密情報(.env 編集)」として deny。

### 根本原因
当初 regex `(>|>>|tee)[[:space:]]+.*\.env([[:space:]]|$)` の `.* ` が **コマンド全体（heredoc 本文含む）** を対象にしていたため、heredoc 内の `.env` 文字列にマッチして誤検知。

### 修正内容（P5-2 / 浜田 GO 取得済）
4 箇所 (`.env` / `.cursor/mcp.json` / `~/.ssh/` / `~/.cursor/hooks`) の regex を以下のように厳密化:

| 種別 | 修正前 | 修正後 |
|---|---|---|
| `>` リダイレクト | `(>|>>|tee)[[:space:]]+.*\.env([[:space:]]|$)` | `(>|>>|tee)[[:space:]]+[^[:space:]<>&\|;]*\.env([[:space:]]|$)` |
| `sed -i` | `sed -i.*\.env` | `sed[[:space:]]+-i` AND `([[:space:]]|^)[^[:space:]<>&\|;]*\.env([[:space:]]|$)` |

`[^[:space:]<>&\|;]*` = 「空白・リダイレクト・パイプ・セミコロンを含まない第 1 トークン」のみ。これでリダイレクトターゲットの直後のファイル名のみ判定し、heredoc 本文内の `.env` 文字列は素通り。

### 回帰テスト 14/14 グリーン

| # | テスト | 期待 | 結果 |
|---|---|---|---|
| T2 | `echo FOO=bar > .env` | deny | ✅ |
| T3 | `echo XXX | tee .env` | deny | ✅ |
| T4 | `echo X > /home/foo/.env` | deny | ✅ |
| T5 | `sed -i s/old/new/g .env` (3 引数) | deny | ✅ |
| T6 | heredoc 内に `.env` 文字列 | allow | ✅ (誤検知解消) |
| T7 | `echo {} > .cursor/mcp.json` | deny | ✅ |
| T8 | heredoc 内に `.cursor/mcp.json` 文字列 | allow | ✅ (誤検知解消) |
| T9 | `rm -rf /` | deny | ✅ |
| T10 | `rm -rf /tmp/foo` | deny | ✅ |
| T11 | `ls -la` | allow | ✅ |
| T12 | `git status` | allow | ✅ |
| T13 | `npm run smoke` | allow | ✅ |
| T14 | `git push --force` | deny | ✅ |
| T15 | `sudo apt update` | deny | ✅ |

回帰テストスクリプト: `/tmp/p5-hook-regression-tests.sh` (P5-2 一時ファイル / 必要なら `tests/cursor-hook-regression.sh` に格上げ検討)

### 学び
- regex ベース hook の本質的限界 = bash 構文を完全解析しないとリダイレクトの「実体」と「文字列」を完全区別不可
- 第 1 トークン制約 (`[^[:space:]<>&\|;]*`) で実用的な精度は達成可能
- **追加の実務知見**: heredoc を含むコマンドは deny regex が heredoc 本文（単なる文字列）を拾って誤検知しうるため、判定前に heredoc 本文を strip する前処理が有効（TSB-022）。`<<EOF` / `<<-EOF` / `<<'EOF'` / `<<-"EOF"` / `<<\\EOF` 等を best-effort で扱う。
- 将来 obfuscation 攻撃が懸念されるなら allow-list 方式への切替検討（現状は `AI が良かれと思って` シナリオのみ対象なので deny-list で十分）

---

## 12. 復旧手順 (浜田用)


万が一、hook が壊れて Cursor が止まった場合:

```bash
# WSL ターミナル (Cursor IDE 外) で:
mv ~/.cursor/hooks.json ~/.cursor/hooks.json.broken
# Cursor を再起動 → hook なしで起動する
# 必要なら本ドキュメント section 3 の JSON をコピーして再構築
```

または `dangerous-shell-blocker.sh` を一時無効化:

```bash
mv ~/.cursor/hooks/dangerous-shell-blocker.sh ~/.cursor/hooks/dangerous-shell-blocker.sh.disabled
# hooks.json は無変更でも、command 不在で fail-open されるので block しなくなる
```
