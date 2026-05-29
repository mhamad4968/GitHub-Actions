# CIO セッション・モデル体制（方式 B）— Phase 1 正本

**日付**: 2026-05-21  
**決定**: CEO 浜田（Phase 0 合意 → Phase 1 実行）

## 確定事項

| 項目 | 内容 |
|------|------|
| CIO 本体 | Opus 4.7 ベース / 必要時 Opus 4.8（**§1-2-3-4-B** 2026-05-29 追補） |
| コード実装 | Composer 2.5（Subagent / diff のみ） |
| 知恵袋 | DeepSeek（§50-3-8） |
| 長文 | Kimi |
| 禁止の言い換え | CIO/DeepSeek 経由後のみ。Composer の単独 GO なし save/deploy 禁止 |
| 画像 MCP | **見送り**（Phase 3 調査・`mcp.json` 追記・体制表クリエイティブ行は削除） |
| 画像（許可） | Cursor 内蔵 GenerateImage → `assets/images/`（`.cursor/rules/cursor-generate-image-assets.mdc`） |

## 正本ファイル

- `chat-sessions/session-starter-parts/part-A-constitution-kernel.md`（🎖️ 表）
- `AGENTS.md` **§1-2-3-4**
- `.cursor/rules/deepseek-cursor-spec-division.mdc`
- `.cursor/rules/cursor-generate-image-assets.mdc`

## 検証（Phase 1 完了時）

```bash
npm run verify:cio-mcp-registry
npm run cio:mcp:env
npm run session-starter:sync-desktop
```
