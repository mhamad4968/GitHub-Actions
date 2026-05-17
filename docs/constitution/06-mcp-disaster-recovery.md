# MCP 保全・災害復旧（§22〜§25）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: MCP 障害・バックアップ  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 要約

このジャンルに属する § は、下記本文どおり `AGENTS.md` から抽出したものです。解釈の最終正本は `AGENTS.md` の同一 § です。

---

## 第7章 MCP 保全・災害復旧

### §22 MCP 設定の保全
`~/.cursor/mcp.json` およびカスタム MCP サーバーのソースコードは以下の体制で保全する:

- **日次自動バックアップ**: cron で `scripts/backup-mcp.sh` を毎日実行（30世代保持）
- **手動バックアップ**: MCP 設定変更後に `bash scripts/backup-mcp.sh`
- **保存先**: `kintone-ai-lab/backups/mcp/<YYYYMMDD-HHMMSS>/`

### §23 MCP 消失時の復旧プロトコル
MCP ツールが消えた / 赤ランプが出た場合:

1. `bash scripts/check-mcp.sh quick` で状況確認
2. `bash scripts/restore-mcp.sh` でバックアップから復旧
3. Cursor 再起動
4. 詳細手順: `docs/mcp-disaster-recovery.md`

### §24 MCP 変更時の義務
- mcp.json を変更したら **必ず** `bash scripts/backup-mcp.sh` を実行
- カスタムサーバーのコードを変更したら同上
- JSON-RPC ハンドシェイクテストで動作確認してから Cursor を再起動

### §25 経理FAQポータル変更時の受け渡し（受け取り側が `git pull` だけでよい状態）
Windows 等の**受け取り側**が、未追跡ファイルやローカル専用パスに依存せず更新を取り込めるようにする:

1. **`scripts/faq-portal-full.html`** または **`scripts/faq-kintone-proxy/server.mjs`** を変更したら、**必ず** `npm run faq:pack-minimal`（`bash scripts/package-faq-only-1-and-2.sh` と同等）を実行し、**`scripts/faq-portal-ONLY-1-and-2.tar.gz` を更新して同一コミットに含める**。
2. 変更は **リモートへ push まで完了**させる（受け取り側は **`git pull`** のみでよいこと）。
3. 追跡ブランチは運用で合意したものを正とする（現状の受け渡し先: **`feature/calculate-tax`**）。
4. 詳細チェックリスト: **`scripts/DEVELOPER-FAQ-HANDOFF.txt`**。

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| Cursor 常時 | `.cursor/rules/cio-constitution.mdc` |
| 手順 | `WORKFLOW.md` |

