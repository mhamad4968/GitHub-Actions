# Claude Code (ターミナル CLI) 専用 最小儀式

> **重要 (2026-04-26 v2.0 thin 化)**: 本ファイルは **Claude Code (ターミナル CLI) 専用** に thin 化されました。
> **Cursor Composer / Cursor Agents は本ファイルを読まず、`AGENTS.md` を正本として参照します。**
> 旧版 (480 行 / 全文) は git 履歴 (`git log --follow CLAUDE.md` → commit `df02ab6` 以前) で復元可能です。
> 完全な運用ルール・儀式・テンプレ・Health Check 手順は **`AGENTS.md`** および **`RULES-INDEX.md`** が正本です。

## 1. Cursor 利用時 (浜田の現用環境)

**何もしなくてよい。** Cursor Composer は本ファイルを参照しない。代わりに次を読む:

- **`AGENTS.md`** … プロジェクト憲法 (全運用ルール / §1〜§57)
- **`RULES-INDEX.md`** … セクション索引・1 行ルール
- **`chat-sessions/NEW-SESSION-STARTER.md`** … 新セッション復元手順

## 2. Claude Code (ターミナル CLI) で起動した場合

Claude Code は **本ファイル + `AGENTS.md`** を両方読む可能性がある。本ファイルは **Claude Code 固有の儀式** だけを提供する:

### 2-1. Implementation Starter (コピペ用)

```text
アプリ ID [ID] の実装をします。まず npm run app:types -- [ID] と
npm run app:fields -- [ID] --markdown を実行して最新の定義を把握し、
kintone-apps.md に変更履歴を追記してから、[実装内容] に着手してください。
```

### 2-2. Schema Retrieval Priority (Strict)

1. **Types** … `types/kintone-{appId}.d.ts` を最優先で参照 (生成物)
2. **Docs** … `kintone-apps.md` (履歴テーブルは末尾が新しい)
3. **Live** … `npm run app:fields -- <appId>` / `npm run app:types -- <appId>`

**CRITICAL**: フィールドコードを推測しない。アプリ ID 不明なら必ずユーザーに確認。

### 2-3. 行末コード保持原則 (TSB-018 教訓 / 2026-04-20 制定)

既存ファイル編集時は **元の行末コード (CRLF / LF) を保持** する。
CRLF ファイルに LF 挿入で混在すると、git diff が「全行変更」扱いになる
(2026-04-19 customize/627/desktop.js +2958/-768 事例)。

### 2-4. 黄金のサイクル (4 ステップ)

1. **Health Check** (`app:fields` / `app:types` で実フォーム突合)
2. **Plan of Action** (制約・トレードオフ先出し / 必要なら公式 URL)
3. **エビデンス** (実行ログ + レコード操作時は JSON before/after)
4. **黄金 3 ステップ報告** (一行サマリー → ビフォー/アフター → 次のアクション)

**詳細**: `AGENTS.md §3-2 (Plan of Action)` / `§3-3 (黄金 3 ステップ報告)` / `§4 (Health Check)`

## 3. 関連ファイル索引

| ファイル | 用途 |
|---|---|
| `AGENTS.md` | **プロジェクト憲法 (正本)** |
| `RULES-INDEX.md` | セクション索引 |
| `kintone-apps.md` | アプリ間依存関係マップ + 履歴 (追記のみ) |
| `chat-sessions/NEW-SESSION-STARTER.md` | 新セッション復元手順 |
| `chat-sessions/CURSOR-トラブル対応メモ.md` | 緊急時手順 |
| `docs/claude-code-terminal-setup.md` | Claude Code 導入 |
| `docs/claude-github-index.md` | GitHub Actions 連携 |
| `docs/agent-restore-checkpoint.md` | チェックポイント運用 |
| `.cursor/rules/kintone-javascript.mdc` | 画面 JS ルール |
| `.cursor/rules/kintone-schema-trust.mdc` | フィールド信頼ルール |

## 4. 削減根拠 (2026-04-26 P5-5 / S2)

- **背景**: F-13 (API token 16.7M を 12 日で 100% 枯渇 → Composer 2 fallback 連発)
- **対策**: 本ファイルが semantic search で引かれた際の token 消費 (~13K → ~1.5K = 88% 削減)
- **追加措置**: `.cursorignore` に本ファイルを追加 (Cursor index から除外)
- **規約整合**: 旧版 line 176 の自己保護条項「統合後に箇条書きで復元できる粒度を維持」に準拠
  (= 主要内容は AGENTS.md に統合済 → thin 化は規約内)
- **将来の Claude Code 復帰**: git 履歴から旧版を取り出し、必要部分だけ再 import 可能
