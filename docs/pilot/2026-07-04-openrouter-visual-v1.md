# OpenRouter 視覚化パイロット — Phase B（2026-07-04）

> **Intent**: ⑥ Visual V1 実証  
> **model**: `openai/gpt-4.1-nano`  
> **cost**: ~$0.00005（227 tokens）

---

## 入力（サニタイズ済み）

- system: Mermaid only, English role labels
- user: 6-role serial protocol diagram request

---

## 生出力

```
flowchart LR
    CIO["CIO (Opus4.8)"]
    DeepSeek["DeepSeek"]
    Composer["作曲者"]
    Kimi["Kimi"]
    Visual["ビジュアル (V1 gpt-4.1-nano)"]
    CIO --> DeepSeek
    DeepSeek --> Composer
    Composer --> Kimi
    Kimi --> CIO
    CIO -->|図解用| Visual
```

---

## CIO 検証

| 項目 | 結果 |
|------|------|
| Mermaid 構文 | OK（flowchart LR 有効） |
| ラベル英語固定 | **NG** — `Composer` が「作曲者」に和訳 |
| 秘密 | OK |
| プロトコル順序 | OK（CIO→DeepSeek→Composer→Kimi→CIO） |
| Architect ノード | 未含有（許容 — 追補役のため任意） |

---

## 対策（runbook 反映済み）

1. system prompt に **「Keep role labels in English: CIO, Architect, Composer, …」** を明記（`cio-visual-diagram-openrouter.md`）
2. V1 NG 時は **差異継承 manifest** で和訳禁止を再送
3. 正式資料は V3 + CIO 手修正または doc-lane

---

## 判定

**Phase B: 条件付き GO** — MCP 経路有効。ラベル検証は CIO 必須とする。
