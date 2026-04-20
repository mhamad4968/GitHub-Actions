# Claude Code 導入（ターミナルで直接開発する）

目的: **ターミナル上で Claude にコード修正・デバッグをさせる**ための導入・運用メモ。  
（本リポの正本: `kintone-ai-lab/CLAUDE.md` / `kintone-ai-lab/kintone-apps.md` / `RULES-INDEX.md`）

## 0. 公式（正本）

- Claude Code Docs: `https://docs.anthropic.com/en/docs/claude-code`
- CLI reference: `https://docs.anthropic.com/en/docs/claude-code/cli-usage`

## 1. インストール（WSL / Linux）

※ 公式手順は更新されるため、上の docs を正にする。

例（インストールスクリプト方式）:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

確認:

```bash
claude --version
claude doctor
```

## 2. プロジェクトでの使い方（kintone-ai-lab）

作業ディレクトリ:

```bash
cd /home/mhamada202408224/kintone-ai-lab
```

最低限の依頼テンプレ（手戻り防止）:

```text
アプリID[594]の desktop.js を修正したい。
まず npm run app:fields -- 594 --markdown と kintone-apps.md を突合し、フィールドコードは推測しないで。
想定される影響と、できない/懸念を先に箇条書きで出してから実装して。
```

## 3. MCP（公式ドキュメント連携）

この環境は `~/.cursor/mcp.json` に MCP が設定済み。

- **kintone**: kintone REST API / スキーマ取得（環境側スクリプト経由）
- **google-search / fetch**: 公式ドキュメントの参照・取得
- **filesystem**: `kintone-ai-lab` や `Documents/kintone-src` を読み書き

「仕様確認が必要なときは MCP を使って公式へ回帰する」は `kintone-ai-lab/CLAUDE.md` の方針に従う。

## 4. “固定の開発用システムプロンプト”（運用）

繰り返し使う方針は **チャットの暗記ではなくファイル**に残す（例: `RULES-INDEX.md` 1行、`.cursor/rules/*.mdc`）。

- フィールドコードは **`kintone-apps.md` を正**にして推測しない
- 仕様や制限が論点なら **公式ドキュメントへ回帰**
- まずテスト/手順（TDD 的に）を合意してから実装（ズレ防止）

