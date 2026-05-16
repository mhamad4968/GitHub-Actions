# Cloud Agent 用ハンドオフ（貼付テンプレ）

**使い方**: Cmd+E 等の長回しの **直前**に、チャットに貼るか `npm run cio:cloud-handoff -- start ...` で同等情報を残す。

1. **意図（1 行）**:
2. **完了定義（検収可能な形）**（例: `npm run smoke:quiet` green / PR #nnn / 画面スクショ観点）:
   - **MCP 健康（参考・2026-05-11）**: 日常は **Windows ネイティブ**で `Set-Location C:\Users\<you>\kintone-ai-lab; npm run cio:mcp:env` → **`SUMMARY: OK 6/6`**。WSL `/mnt/c/...` は **月次ベストエフォート**／kimi のみ落ちるときは **`CIO_MCP_PROBE_KIMI_TIMEOUT_MS`** とネットを見る（正本 `docs/mcp-status.md` §CIO）。
3. **触るパス（列挙）**:
4. **第2者（DeepSeek/Kimi）に確認した盲点（各 1 行・未実施なら理由）**:
5. **合意シール（機械検証）**: `npm run cio:consensus-seal -- seal ...` → 各 MCP 後に `add --who deepseek|kimi` → **プッシュ直前に PR 作者が** `npm run cio:consensus-seal -- verify`（または CEO 一行 `ceo --line` で完了条件を満たす）。CI は `cio:consensus-seal:verify-ci`（追跡 JSON がある PR のみ厳格）。
6. **中断時（放置禁止）**: 中断するターンで **必ず** `npm run cio:cloud-handoff -- end --status partial --note "次にやること（誰が・何を）"`（`partial`/`blocked` は **note 必須**／`done` は任意）。**誰が**: 通常は **CIO（本体）** が打鍵。**いつ**: セッション切れ・Cmd+E 終了・浜田の区切り指示の直前。

**禁止**: 「エディタを閉じても必ず完了」などの絶対表現。
