# CIO — ⑥ 視覚化（OpenRouter / OpenAI 系）

> **上位**: `AGENTS.md` §1-2-3-6 / `docs/plans/2026-07-04-ai-team-six-roles-spec.md`  
> **MCP**: `user-openrouter` → `chat_completion`  
> **Phase B パイロット**: `docs/pilot/2026-07-04-openrouter-visual-v1.md`

---

## 1. 役割

**図解専用** — Mermaid / SVG 断片 / 説明用 HTML。**コード diff・憲法編集・deploy 禁止**。

CIO が **直列**で起動（Kimi / Composer と並列不可）。

---

## 2. モデルティア（CIO 自律 — 毎ターン 1 行宣言）

| Tier | model-id | 起動条件 |
|------|----------|----------|
| **V1** | `openai/gpt-4.1-nano` または `openai/gpt-4.1-mini` | **常にここから開始** |
| **V2** | `openai/gpt-4.1` | V1 出力が Mermaid 構文 NG **1 回** |
| **V3** | `openai/gpt-4.1` | CEO 向け正式 deliverable（CIO が L3 宣言） |
| Fallback | `openai/gpt-4o` | 4.1 系 **2 回連続**失敗 |
| **Avoid** | o3 / gpt-5 系 | コスト過大 — §41 なしでは使わない |

宣言形式: `[⑥ 視覚化: V1 openai/gpt-4.1-nano] 6役プロトコル図`

---

## 3. MCP 呼び出し

**必須**: スキーマ読了後 `chat_completion`

```json
{
  "model": "openai/gpt-4.1-nano",
  "temperature": 0.2,
  "max_tokens": 800,
  "messages": [
    {
      "role": "system",
      "content": "Output ONLY valid Mermaid flowchart syntax. No markdown fences. Keep role labels in English: CIO, Architect, Composer, Kimi, DeepSeek, Visual. No secrets."
    },
    {
      "role": "user",
      "content": "<§50-3-5 sanitized spec excerpt>"
    }
  ]
}
```

---

## 4. 差異ロジック継承 manifest（V1→V2）

V2 再試行時、user メッセージ末尾に付与:

```
【前回差異継承】
- 失敗理由: <syntax|label|direction>
- 固定ラベル: CIO, Architect, Composer, Kimi, DeepSeek, Visual（和訳禁止）
- 方向: flowchart LR
- 必須エッジ: CIO→DeepSeek→Composer→Kimi→CIO
```

---

## 5. CIO 検証チェックリスト

| # | 項目 |
|---|------|
| 1 | Mermaid がパース可能（``` フェンスなしで試験可） |
| 2 | ロール名 **英語固定**（2026-07-04 パイロット: Composer→「作曲者」和訳 NG） |
| 3 | 秘密・トークン・実 ID なし |
| 4 | 図のみ — コードブロックで実装を混ぜない |

不合格 → V2 へ（manifest 付き）。2 回 NG → CIO が自書 Mermaid（B-MDFLOW）または Figma `generate_diagram`。

---

## 6. doc-lane との境界

| 用途 | 経路 |
|------|------|
| PPTX/Word 公式資料 | `doc-lane` intent（office-powerpoint / office-word） |
| チャット内説明図・runbook 用 Mermaid | **⑥ Visual（本条）** |
| デザインシステム UI | Figma MCP |

---

## 7. npm

```bash
npm run cio:tool:route -- --intent "Mermaid 6役フロー図"
# 任意: npm run cio:visual-diagram:pilot -- --tier V1
```
