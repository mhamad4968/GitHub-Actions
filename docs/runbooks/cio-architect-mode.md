# CIO — Architect モード（Opus 4.8 Subagent 1-shot）

> **上位**: `AGENTS.md` §1-2-3-6 / `docs/plans/2026-07-04-ai-team-six-roles-spec.md`  
> **役割番号**: ②（追補）。**常時起動しない**。

---

## 1. 目的

重い **spec 横断設計**・**複数レーン整合**・**80行超の設計のみ（実装前）** を **Opus 4.8 Subagent 1 回**で突破する。第二の常時 Opus 本体ではない。

---

## 2. 起動条件（CIO 自律 — いずれか）

| 条件 | 例 |
|------|-----|
| 新 spec が **3 レーン以上**触れる | kintone + GHA + 憲法 kernel 同時 |
| SPEC.md / plan が **200 行超**で着手前設計が必要 | 年度 runbook 横断 |
| DeepSeek §50-3-8 で **(b) SPEC 乖離**が高リスクと判定 | フィールド定義 × 複数 app |

**非該当**: 単一 app customize、軽量 doc 修正、図解のみ（→ ⑥ Visual）。

---

## 3. プロトコル位置

```
CIO(4.8) → DeepSeek(§50-3-8) → [Architect 1-shot] → Composer → Kimi → CIO
```

Architect は **DeepSeek 通過後**・**Composer 前**のみ。

---

## 4. Subagent 起動

- **model**: `claude-opus-4-8-thinking-high`（Task subagent または Cursor Agent 相当）
- **readonly**: 設計ターンは `true` 推奨（実装ターンは CIO が別途 Composer 割当）
- **出力**: `docs/plans/` または指定 SPEC への **設計節追記案**（CIO が統合・GO 前）

🎖️ 例: `Architect=Opus4.8 Subagent 1-shot(spec横断)実施済`

---

## 5. 禁止

- Architect 単独での **save / deploy / commit**
- Architect と Composer **並列**
- Architect による **憲法 AGENTS.md 直編**（§57 手順を別途）

---

## 6. SPEC ブリッジ（エージェント間形式）

Architect 出力は次の見出しを **固定**:

```markdown
## Architect 1-shot（YYYY-MM-DD）
### Goal / Constraints / Acceptance
### レーン別影響
### Composer への実装順序（番号リスト）
### リスク（1行）
```

Composer はこの節を **正本参照**として Diff する（独自解釈で書き換えない）。
