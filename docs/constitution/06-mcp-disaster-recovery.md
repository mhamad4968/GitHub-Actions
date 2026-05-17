# MCP 保�E・災害復旧�E�§22〜§25�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: MCP 障害・バックアチE�E  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§22〜§25: MCP バックアチE�E・復旧・変更義務�EFAQ 受け渡し、E

## ぁE��読む�E�チェチE��リスト！E

- MCP 赤
- restore-mcp
- バックアチE�E

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第7章 MCP 保�E・災害復旧

### §22 MCP 設定�E保�E
`~/.cursor/mcp.json` およびカスタム MCP サーバ�Eのソースコード�E以下�E体制で保�Eする:

- **日次自動バチE��アチE�E**: cron で `scripts/backup-mcp.sh` を毎日実行！E0世代保持�E�E
- **手動バックアチE�E**: MCP 設定変更後に `bash scripts/backup-mcp.sh`
- **保存�E**: `kintone-ai-lab/backups/mcp/<YYYYMMDD-HHMMSS>/`

### §23 MCP 消失時�E復旧プロトコル
MCP チE�Eルが消えぁE/ 赤ランプが出た場吁E

1. `bash scripts/check-mcp.sh quick` で状況確誁E
2. `bash scripts/restore-mcp.sh` でバックアチE�Eから復旧
3. Cursor 再起勁E
4. 詳細手頁E `docs/mcp-disaster-recovery.md`

### §24 MCP 変更時�E義勁E
- mcp.json を変更しためE**忁E��** `bash scripts/backup-mcp.sh` を実衁E
- カスタムサーバ�Eのコードを変更したら同丁E
- JSON-RPC ハンドシェイクチE��トで動作確認してから Cursor を�E起勁E

### §25 経理FAQポ�Eタル変更時�E受け渡し（受け取り�EぁE`git pull` だけでよい状態！E
Windows 等�E**受け取り側**が、未追跡ファイルめE��ーカル専用パスに依存せず更新を取り込めるようにする:

1. **`scripts/faq-portal-full.html`** また�E **`scripts/faq-kintone-proxy/server.mjs`** を変更したら、E*忁E��** `npm run faq:pack-minimal`�E�Ebash scripts/package-faq-only-1-and-2.sh` と同等）を実行し、E*`scripts/faq-portal-ONLY-1-and-2.tar.gz` を更新して同一コミットに含める**、E
2. 変更は **リモートへ push まで完亁E*させる（受け取り�Eは **`git pull`** のみでよいこと�E�、E
3. 追跡ブランチ�E運用で合意したも�Eを正とする�E�現状の受け渡し�E: **`feature/calculate-tax`**�E�、E
4. 詳細チェチE��リスチE **`scripts/DEVELOPER-FAQ-HANDOFF.txt`**、E

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

