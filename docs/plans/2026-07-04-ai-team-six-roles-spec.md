# 6役 AI 体制追補 — 正本（2026-07-04 CEO 浜田 GO）

> **地位**: `AGENTS.md` **§1-2-3-6** の散文正本。**§1-2-3-4 / §50-3-11 は非置換**（4AI 連携プロトコルは維持し、Architect・Visual を追補する）。  
> **DeepSeek §50-3-8**: 2026-07-04 着手前実施済（型継承テンプレ・SPEC ブリッジ・差異ロジック manifest を runbook に反映）。

---

## 1. 背景

方式 B の固定 4AI（CIO / Composer / Kimi / DeepSeek）は **維持**する。2026-07-04 に以下を **追補**する。

| 変更 | 内容 |
|------|------|
| ① CIO | **Opus 4.8 をデフォルト**（4.7 は軽量ターンのみ CIO 自律で可） |
| ② Architect | **Opus 4.8 Subagent 1-shot** — 重い spec / 横断設計のみ |
| ⑥ Visual | **OpenRouter（OpenAI 系）** — Mermaid/SVG/HTML 図解専用（コード diff 禁止） |
| L4 Fable | **Claude Fable 5** — 切り札（稀・即 4.8 復帰） |

---

## 2. 6役マトリクス

| # | 役割 | モデル | ◯ | ✕ |
|---|------|--------|---|---|
| ① | CIO | **Opus 4.8 デフォルト** / 軽量時 4.7 | 指揮・統合・GO 前統合 | 大量 Diff 直接実務 |
| ② | Architect | **Opus 4.8 Subagent**（稀） | 重 spec・横断設計 1-shot | 常時起動・deploy・Diff |
| ③ | コード | Composer 2.5 Subagent | Diff・実装 | §50-3-8 なし単独 save/deploy |
| ④ | 長文 | Kimi | 精査・kimi_review | Diff 適用・指揮 |
| ⑤ | 知恵袋 | DeepSeek | §50-3-8・盲点3点 | 指揮代行・コード編集 |
| ⑥ | 視覚化 | OpenRouter OpenAI 系（V1→V2） | Mermaid/SVG/HTML 図 | コード diff・憲法編集 |

**連携プロトコル（コア — 変更なし）**: ① → ⑤ → ③ → ④ → ① → CEO

**追補ルート**:

- **② Architect**: ① が重 spec と判断したとき **DeepSeek の後・Composer の前**に 1-shot（`docs/runbooks/cio-architect-mode.md`）
- **⑥ Visual**: ① が図解必要と判断したとき **直列**（Kimi/Composer と並列禁止）。詳細 `docs/runbooks/cio-visual-diagram-openrouter.md`

---

## 3. Fable 5（L4 切り札）

正本: `docs/runbooks/cio-fable5-escalation.md`

**起動トリガ（いずれか）**:

1. Composer ↔ DeepSeek **3 回以上**デッドロック
2. git-history-mcp / kintone-schema-mcp **複合**で CIO+DeepSeek が突破不能
3. §47-A / §57 級の憲法・横断整合

**復帰**: 突破後 **同一ターン内**に Opus 4.8 へ戻し、🎖️ に `Fable5=L4使用済→4.8復帰` を記載。

---

## 4. ⑥ 視覚化 — モデルティア（CIO 自律選択）

| Tier | model-id | 条件 |
|------|----------|------|
| **V1**（常に開始） | `openai/gpt-4.1-nano` または `openai/gpt-4.1-mini` | 通常図解 |
| **V2** | `openai/gpt-4.1` | V1 が Mermaid 構文 NG **1 回** |
| **V3** | `openai/gpt-4.1` | CEO 向け正式資料の図（① が L3 宣言） |
| Fallback | `openai/gpt-4o` | 4.1 系が 2 回連続失敗 |
| **Avoid** | o3 / gpt-5 系 | コスト過大 |

毎ターン 1 行: `[⑥ 視覚化: Vn model-id] 理由1行`

**入力**: §50-3-5 サニタイズ済み spec 抜粋のみ（トークン・秘密なし）。

**出力検証（CIO 必須）**: Mermaid 構文・**ラベル英語固定**（Composer 等を勝手に和訳しない）・秘密なし。

---

## 5. DeepSeek 盲点への対策（2026-07-04）

| 盲点 | 対策（runbook 化） |
|------|-------------------|
| (a) Opus/Fable 型継承 | `cio-fable5-escalation.md` の **型継承テンプレ**（入出力・判断権限） |
| (b) エージェント間 SPEC 乖離 | **共通出力スキーマ** — 図=⑥ / コード=③ / 監査=⑤（`cio-visual-diagram-openrouter.md` §出力） |
| (c) V1→V2 差異ロジック | **差異継承 manifest** — 再試行時に前回の描画ルールを user メッセージへ付与 |

---

## 6. 関連ファイル

| 種別 | パス |
|------|------|
| 憲法追補 | `AGENTS.md` §1-2-3-6 |
| AI-KERNEL | `.cursor/rules/mode-b-canonical.mdc` §6役追補 |
| Runbook | `docs/runbooks/cio-fable5-escalation.md` |
| Runbook | `docs/runbooks/cio-architect-mode.md` |
| Runbook | `docs/runbooks/cio-visual-diagram-openrouter.md` |
| ルーティング | `data/cio-ai-team-tool-routing.json` → intent `visual-diagram` |
| パイロット | `docs/pilot/2026-07-04-openrouter-visual-v1.md` |
| Matrix | `data/cio-mcp-four-ai-matrix.json` |

---

## 7. 検証

```bash
npm run verify:mcp-four-ai-alignment
npm run verify:cio-tool-routing-infra
npm run cio:tool:route -- --intent "Mermaid 6役フロー図"
```

---

## 8. Grok 4.5 L2b 追補（2026-07-09 · §1-2-3-6 非置換）

**⑥ Visual は維持**。Grok は **番号置換しない L2b 追補**。

| 項目 | 内容 |
|------|------|
| 正本 | `docs/plans/2026-07-09-grok-l2b-hybrid-spec.md` |
| Runbook | `docs/runbooks/cio-grok-execution-loop.md` |
| 運用 | **B デフォルト** / **C = Composer 後の verify ループのみ**（全条件 AND） |
| 機械 | `npm run cio:grok:execution-guard` |
| Fable 前段 | Grok C 1 回 or 不適用 → CIO 2 回統合 → Fable T1–T4 |

**連携**: `① → ⑤ → ③(初回) → npm → [L2b Grok C?] → ① → CEO` — Kimi/⑥ は従来どおり。

**Phase B パイロット**: 2026-07-04 — V1 `openai/gpt-4.1-nano` 成功（ラベル和訳要 CIO 修正 — 運用で防止）。
