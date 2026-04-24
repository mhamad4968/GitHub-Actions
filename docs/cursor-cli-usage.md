# Cursor Agent CLI 利用ガイド

**制定**: 2026-04-25 (Sat) / E-1 タスク（CLI 試運転）の知見集約
**対象**: WSL Ubuntu 24.04 / Cursor Ultra プラン (m.hamad4968@gmail.com)
**正本ルール**: `AGENTS.md` §1-2-1（Cursor Agent CLI = Opus 4.7 1M Max Thinking）

---

## 1. インストールと基本確認

### 1.1 インストール（既実施 / 2026-04-25 06:05）

```bash
curl https://cursor.com/install -fsS | bash
```

→ `/home/mhamada202408224/.local/bin/agent` にシンボリックリンク作成
→ 実体: `~/.local/share/cursor-agent/versions/<日付>-<sha>/cursor-agent`

### 1.2 バージョン・認証確認

```bash
agent --version
# 出力例: 2026.04.17-787b533

agent about
# CLI Version / Model / Subscription Tier / OS / User Email を一覧表示

agent status
# 出力例: ✓ Logged in as m.hamad4968@gmail.com
```

### 1.3 ログイン（必要時のみ）

```bash
agent login
# ブラウザが開いて Cursor アカウントで認証
# NO_OPEN_BROWSER=1 で URL のみ表示
```

---

## 2. モデル設定（§1-2-1 遵守）

### 2.1 既定モデルは `composer-2-fast`（注意）

**素の `agent` コマンドは Cursor 独自 `composer-2-fast` で起動する**。Opus 4.7 を使うには以下のいずれか:

- A) 永続設定（推奨）: 対話モード起動 → `/model` → "Opus 4.7 1M Max Thinking" を選択 → 以降の起動でもデフォルト
- B) フラグ指定: `agent --model claude-opus-4-7-thinking-max ...`

### 2.2 設定ファイル（永続設定の正本）

```
~/.cursor/cli-config.json
```

主要キー:
```json
{
  "model": {
    "modelId": "claude-opus-4-7-thinking-max",
    "displayName": "Opus 4.7 1M Max Thinking"
  },
  "hasChangedDefaultModel": true,
  "selectedModel": { "modelId": "claude-opus-4-7-thinking-max" },
  "approvalMode": "allowlist",
  "permissions": { "allow": ["Shell(ls)"], "deny": [] }
}
```

`hasChangedDefaultModel: true` がなければ `composer-2-fast` 既定に戻ってしまうので、**変更後はこの true を確認**。

### 2.3 利用可能な Opus 4.7 派生モデル

```bash
agent --list-models 2>&1 | grep -i opus
```

主要 Opus 4.7:
- `claude-opus-4-7-thinking-max` — Opus 4.7 1M Max Thinking ★ 既定にすべき
- `claude-opus-4-7-thinking-xhigh` — Opus 4.7 1M Thinking
- `claude-opus-4-7-max` — Opus 4.7 1M Max（thinking なし）
- `claude-opus-4-7-xhigh` — Opus 4.7 1M（thinking なし）

→ §1-2 (Cursor 単一モデル固定) 観点では **常に "Max Thinking"** を選ぶ。

---

## 3. 非対話モード（スクリプト用）

### 3.1 基本パターン

```bash
cd /path/to/workspace
agent --print --mode=ask --trust --output-format text "プロンプト" 2>&1
```

| フラグ | 意味 |
|--------|------|
| `--print` / `-p` | 対話 UI なしで結果のみ stdout に出力 |
| `--mode=ask` | 読取専用（ファイル編集・Shell 実行ブロック） |
| `--mode=plan` | 計画モード（読取 + 計画提案 / 編集なし） |
| `--trust` | workspace 信頼を即承認（**--print と組合せ必須**） |
| `--output-format text\|json\|stream-json` | 出力形式 |
| `--workspace <path>` | workspace ディレクトリ明示（既定 = `cwd`） |
| `--model <name>` | モデル明示指定（永続設定をその場で上書き） |
| `--continue` | 直前のセッションから継続 |
| `--resume [chatId]` | 特定セッション再開（chatId 省略で picker） |

### 3.2 注意点（試運転で確認済）

- **未 trust workspace は --print でも拒否**: `--trust` フラグ必須（対話モードなら trust ダイアログで承認）
- **`/tmp` のような不審ディレクトリでは trust が効かない場合あり** → 業務 workspace 配下で実行する
- **応答時間**: 簡単な Q&A で 14〜20 秒（Opus Max Thinking はやや遅め）
- **コスト**: 各 call が Cursor Ultra クレジット消費 → スクリプト埋め込み時は call 回数に留意

### 3.3 セッション管理コマンド

```bash
agent ls           # セッション一覧から resume
agent resume       # 直前セッションを再開
agent create-chat  # 空セッション作成 → chatId を返す（スクリプト用）
agent --continue   # --print の場合は previous chat continue
```

セッションログの保存場所:
```
~/.cursor/chats/
```

---

## 4. MCP サーバー連携

### 4.1 確認

```bash
agent mcp list
```

出力例（2026-04-25 時点 / 全 16 個）:
```
github                : not loaded (needs approval)
cyber-news            : not loaded (needs approval)
office-powerpoint     : not loaded (needs approval)
filesystem            : not loaded (needs approval)
memory                : not loaded (needs approval)
fetch                 : not loaded (needs approval)
sequential-thinking   : not loaded (needs approval)
kintone               : not loaded (needs approval)
kintone-dev           : not loaded (needs approval)
kintone-space         : not loaded (needs approval)
tavily                : not loaded (needs approval)
playwright            : not loaded (needs approval)
cve-search            : not loaded (needs approval)
rag                   : not loaded (needs approval)
accessibility-scanner : not loaded (needs approval)
duckduckgo-search     : not loaded (needs approval)
```

### 4.2 MCP の有効化

```bash
agent mcp enable <identifier>          # 個別有効化
agent mcp disable <identifier>         # 無効化
agent mcp list-tools <identifier>      # ツール一覧
agent mcp login <identifier>           # OAuth 等の認証必要 MCP のログイン
```

または起動時:
```bash
agent --approve-mcps                   # 全 MCP を一括承認
```

### 4.3 IDE Cursor との関係

- IDE Cursor と CLI は同一の `~/.cursor/mcp.json` を参照
- 承認状態は別管理（CLI 側は cli-config.json 内）
- → IDE で承認済 MCP も CLI では再承認が必要

---

## 5. ワークスペース管理

### 5.1 worktree モード（実験用に隔離）

```bash
agent -w                    # 自動命名で worktree 作成
agent -w my-experiment      # 名前指定
agent --worktree-base main  # base ブランチ指定
```

worktree 場所: `~/.cursor/worktrees/<reponame>/<name>/`

→ 実験的なリファクタや破壊的変更を安全に試したい時に有用。

### 5.2 sandbox モード

```bash
agent --sandbox enabled    # 強制有効
agent --sandbox disabled   # 強制無効
```

cli-config.json の `sandbox.mode` で既定設定可能（現状は `disabled`）。

---

## 6. 安全機構

### 6.1 approvalMode（コマンド実行承認）

cli-config.json の `approvalMode`:
- `allowlist` (現状) - `permissions.allow` リストにあるコマンドのみ自動許可、それ以外は問合せ
- `default` - すべて問合せ
- `force` - 危険、--force / --yolo と同等

### 6.2 危険フラグ（使用注意）

| フラグ | 危険度 | 説明 |
|--------|--------|------|
| `-f` / `--force` | 🔴 高 | denylist 以外を全許可 |
| `--yolo` | 🔴 高 | --force のエイリアス |
| `--approve-mcps` | 🟠 中 | 全 MCP 自動承認 |
| `--trust` | 🟡 低 | workspace trust（--print のみ）|

§35 (10 分自走 / 30 分予算化) 観点で、本番ワークフローには `--force` / `--yolo` を **使わない**。

---

## 7. 用途別レシピ

### 7.1 ワンショット質問（read-only / 最小コスト）

```bash
cd ~/kintone-ai-lab
agent --print --mode=ask --trust "AGENTS.md §51 を要約して" 2>&1
```

### 7.2 計画立案のみ（編集なし）

```bash
cd ~/kintone-ai-lab
agent --print --mode=plan --trust "新しい機能 X を実装する計画を立てて" 2>&1
```

### 7.3 JSON 出力（スクリプト統合）

```bash
cd ~/kintone-ai-lab
agent --print --mode=ask --trust --output-format json "..." 2>&1 | jq '.text'
```

### 7.4 既存セッション継続

```bash
cd ~/kintone-ai-lab
agent --print --continue "追加の質問" 2>&1
```

---

## 8. 既知の落とし穴（試運転で確認）

1. **デフォルトモデル罠**: 素の `agent` は `composer-2-fast` で動く。Opus 4.7 を使いたいなら `cli-config.json` で永続化するか `--model` を毎回指定。
2. **trust ダイアログ**: 未 trust ディレクトリでは `--print` も拒否。`--trust` フラグ必須（または事前に対話モードで trust 承認）。
3. **MCP 二重承認**: IDE Cursor と CLI で承認状態が別管理。CLI 初回利用時に全 MCP 再承認が必要。
4. **遅延**: Opus Max Thinking は 14〜20 秒/call が標準。バッチ処理する場合は並列禁止 (§51) と call 回数に注意。
5. **trust と /tmp**: `/tmp` のような共有/不審ディレクトリでは `--trust` でも拒否されるケースあり（要検証）。

---

## 9. 関連ドキュメント

- [`AGENTS.md` §1-2 / §1-2-1](../AGENTS.md) — モデル前提（単一モデル固定）
- [`docs/cursor-official-references.md`](cursor-official-references.md) — Cursor 公式仕様まとめ
- [`docs/troubleshooting.md`](troubleshooting.md) — TSB 集（CLI 関連 TSB は 2026-04-25 時点なし）
- [`docs/checklists/3stage-fix-verification.md`](checklists/3stage-fix-verification.md) — §11-5 3 段階検証

---

## 10. 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-04-25 (Sat) | E-1 タスクで初版作成。試運転で実 call 1 回 + 設定確認 + MCP list 確認を実施 |
