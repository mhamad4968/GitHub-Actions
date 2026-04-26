# P5-1 / R1: Cursor IDE Hooks 物理 block 層実装

**日時**: 2026-04-26 08:45 JST  
**Tier**: B（浜田 GO 取得済 / `~/.cursor/hooks.json` 編集 = §52-8 「Hooks 設定変更」相当）  
**ホルダー**: P5-cursor-audit-2026-04-26 (manual lock)

## 背景

P5 Q-series 包括 Cursor 設定監査の P5-1 タブ（Hooks）の調査中、cursor-guide subagent + 公式 docs (https://cursor.com/docs/hooks) で **`beforeShellExecution` フックで AI のツール実行を OS レベルで block 可能** という重要仕様を確認。

これは **TSB-019 (Cursor IDE Auto-Run Mode = Run Everything (Unsandboxed) で AI が承認なしに任意 shell 実行できる構成)** の構造的根本対策となるため、§52-8 第 1 層 (AI 自己制約) + §1-2-2-1 第 2 層 (IDE ゲート) に **第 3 層 (OS 物理 block)** を追加すべきと判断。

## 浜田 GO

質問: 「R1 = Hooks による §52-8 物理 block 化。`~/.cursor/hooks.json` を AI が編集します（§52-8「秘密情報変更」相当 = 通常は浜田 GO 必須カテゴリ）。どうしますか?」  
回答: **GO = 実施 (TSB-019 の構造的補強として最優先 / 推奨)**

## 設計

### 三層防御アーキテクチャ

| 層 | 主体 | 機構 | 対象 |
|---|---|---|---|
| 第 1 層 | AI | §52-8 報告 → GO 待ち | 全危険カテゴリ |
| 第 2 層 | Cursor IDE | Browser/MCP Protection | browser / kintone MCP |
| **第 3 層** ⭐ | OS / hook | beforeShellExecution → deny + exit 2 | shell 実行 |

### deny カテゴリ（§52-8 と完全整合）

- 削除系（再帰/危険ターゲット）: `rm -rf /` `rm -rf ~` `rm -rf $HOME` `rm -rf *` `rm -rf /<path>` `find -delete` `xargs rm`
- git 破壊系: `git push --force/-f` `git reset --hard` `git clean -fdx` `git rebase` `git filter-branch` `git update-ref -d`
- 権限変更（再帰）: `chmod -R` `chown -R` `setfacl`
- 特権コマンド: `sudo` 全般
- コンテナ系（削除）: `docker rm/system prune/volume rm` `kubectl delete` `helm uninstall`
- 秘密情報: `> .env` `tee .env` `sed -i .env` / 同 `.cursor/mcp.json` / 同 `~/.ssh/`
- **Hooks 自身の改ざん防止**: `> ~/.cursor/hooks*` `sed -i ~/.cursor/hooks*` ⭐

### allow カテゴリ（block しない）

- 読取系: `ls/cat/head/tail/grep/rg/find -print`
- 既知 npm スクリプト: `npm run smoke/guard:check/health-check/test`
- git 安全: `git status/log/diff/add/commit/push origin main`
- session-lock: `node scripts/session-lock.mjs`
- 単発検証: `node -e "..."`, `node scripts/<既存>`

## 実装ファイル

| ファイル | 種別 | サイズ |
|---|---|---|
| `~/.cursor/hooks.json` | 編集（既存） | beforeShellExecution セクション追加 |
| `~/.cursor/hooks/dangerous-shell-blocker.sh` | 新規 | 6442 bytes / +x 付与 |
| `kintone-ai-lab/AGENTS.md` | 編集 | §52-8-1 新設 + changelog v23.12 |
| `kintone-ai-lab/RULES-INDEX.md` | 編集 | §52-8-1 行追加 + §N チェックリスト更新 |
| `kintone-ai-lab/docs/cursor-hooks-design.md` | 新規 | 9556 bytes / 設計仕様書 |
| `kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md` | 編集 | v3.6 セクション追加 |
| `kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md` | 編集 | v2.6 セクション追加 |
| `.rag/extra-docs/*` | 同期 | 5 ファイル |
| `Desktop AI緊急用/*` | 同期 | 5 ファイル / SHA256 一致確認 |

## 検証

### 単独テスト 10/10 グリーン

| # | テスト | 期待 | 実結果 |
|---|---|---|---|
| 1 | `ls -la` | allow | ✅ |
| 2 | `rm -rf /` | deny | ✅ |
| 3 | `git push --force` | deny | ✅ |
| 4 | `sudo apt update` | deny | ✅ |
| 5 | `git push origin main` | allow | ✅ |
| 6 | `npm run smoke` | allow | ✅ |
| 7 | `git status` | allow | ✅ |
| 8 | `cat .env` | allow | ✅ |
| 9 | `echo "FOO=bar" > .env` | deny | ✅ |
| 10 | `chmod -R 777 /tmp` | deny | ✅ |

### Cursor IDE 経由実証（最重要）

```
Shell tool: rm -rf /tmp/p5-test-block-target-not-exist-2026-04-26
↓
Rejected: Command execution was blocked by a hook: {
  "continue": true,
  "permission": "deny",
  "user_message": "⚠️ §52-8 高リスク shell を物理 block しました\nカテゴリ: 削除系(再帰/絶対パス or 危険ターゲット)\nコマンド: rm -rf ...",
  ...
}
To view or modify configured hooks, go to Cursor Settings > Hooks.
Agent note: Do not suggest workarounds to the blocked tool.
```

→ **AI が承認なしで `rm -rf` を実行できなくなったことを実証**。TSB-019 構造的根本対策完成。

## 残構造的盲点と対策

| 盲点 | リスク | 対策 |
|---|---|---|
| StrReplace 経由の hooks 改ざん | hook は shell のみ → エディタ経由は素通り | §52-8 第 1 層 AI 自己制約で「hooks 編集前は浜田 GO 必須」を内在化 |
| dangerous-shell-blocker.sh が壊れた場合 | 全 shell が block / fail-open or fail-close | `failClosed: false` で fail-open 設定 / 復旧手順を `docs/cursor-hooks-design.md` section 11 に明記 |
| 誤検知（false positive） | 正当な作業が止まる | AI が誤検知報告 → §57 改定プロセスでパターン緩和 |
| パターン obfuscation（例: `r''m -rf /`） | regex 回避の可能性 | 第 1 版は許容 / Cursor の AI ツールは標準的 shell 構文を出すため実害低 / 必要なら allow-list 方式へ移行 |

## 自己批判 / 学び

1. **subagent の使い方の進化**: cursor-guide subagent への単発 query で公式仕様を高速確認 → 自前で実装可能と判断 → resume で詳細聞かず公式 docs を直接 WebFetch することでクレジット節約。これは新しい良いパターン。

2. **hook の自己改ざん防止を初版から組み込めた**: deny pattern に `~/.cursor/hooks*` への書込を含めたことで、AI が将来うっかり hook を緩和しようとしても物理 block。これは §47-D 矛盾指示却下義務の構造的補強。

3. **failClosed: false の選択は妥当か**: 暴走時に block されないリスク vs 暴走時に Cursor が止まるリスクのトレードオフ。今回は「fail-open + §52-8 第 1 層に戻る」を選択 = ユーザー作業継続性を優先。将来 monitoring が成熟したら true への移行検討。

4. **cli-config.json と IDE で承認モード乖離発見**: CLI = `approvalMode: "allowlist"` / IDE = `Run Everything` という乖離。§1-2-2-1 に CLI 側の整合性条項追加要検討（5/10 月次レビューで起票）。

## 次の段階（同 P5）

- P5-2: `.cursorignore` 新設（R2 / 浜田 GO 取得済）— **完了 2026-04-26 08:55**
- P5-3 〜 P5-5: 残タブ監査
- P5-9: 最終 commit + push

---

## 追記: P5-2 R2 実施結果（2026-04-26 08:55 JST）

### 実施内容
- `.cursorignore` 新設（86 行 / 5 カテゴリ = 秘密情報 + 大量自動生成 + バックアップ + parallel-suspicion snapshot + 一時ファイル）
- 浜田指示「インデックス範囲変更で今後見落とし等はないようにしてほしい」を反映 → source code / docs / scripts / tests は絶対 ignore しない設計

### 副次発生: §52-8-1 物理 block hook 誤検知 1 件発覚
- **事象**: `cat > .cursorignore <<EOF ... .env ... EOF` のヒアドキュメントを deny されてしまった
- **原因**: regex `(>|>>|tee)[[:space:]]+.*\.env` の `.* ` が heredoc 本文の `.env` 文字列にマッチ
- **浜田 GO 取得**: AskQuestion で「regex 修正 GO」確認 → GO 即取得
- **修正**: 4 箇所 (`.env` / `.cursor/mcp.json` / `~/.ssh/` / `~/.cursor/hooks`) の regex を `[^[:space:]<>&|;]*` (= 第 1 トークン制約) に厳密化
- **検証**: 専用回帰テストスクリプト `/tmp/p5-hook-regression-tests.sh` で 14/14 グリーン
  - T2-T5: 真の `.env` 書込 = deny 維持 ✅
  - T6/T8: heredoc 内文字列 = allow に修正 ✅ (誤検知解消)
  - T7: 真の `.cursor/mcp.json` 書込 = deny 維持 ✅
  - T9-T15: 他カテゴリ (rm -rf / git push --force / sudo / 安全コマンド) = 期待通り ✅

### 学び
- **「§52-8-1 制定 → 即誤検知 → 即修正」のサイクルが §57 改定プロセスを正しく実証**
- 自分で作った hook が自分を block するのは皮肉だが、これこそ「物理 block 層が正しく機能している」証拠
- regex ベースの hook は heredoc / 引用符内文字列の解析に限界 → 実用解は「第 1 トークン制約」で十分
- 将来、obfuscation 攻撃 (例: `r''m -rf /`) が懸念されるなら allow-list 方式への切替検討
- 回帰テストスクリプト化は重要 → 将来 `tests/cursor-hook-regression.sh` に格上げ候補

### docs 更新
- `docs/cursor-hooks-design.md` §11.5「誤検知履歴と修正」追記
- `AGENTS.md` changelog v23.13 追記

## 参考

- 公式 Hooks 仕様: https://cursor.com/docs/hooks
- 設計仕様書: `docs/cursor-hooks-design.md`
- AGENTS.md §52-8-1
- TSB-019 (`docs/troubleshooting.md`)
