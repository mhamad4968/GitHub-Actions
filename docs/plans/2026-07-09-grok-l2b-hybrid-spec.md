# Grok 4.5 L2b ハイブリッド体制 — 正本（2026-07-09 CEO 相談 GO）

> **地位**: `AGENTS.md` **§1-2-3-6** の追補（**§1-2-3-4 / §50-3-11 非置換**）。  
> **6役の ⑥ 視覚化（OpenRouter）は維持** — Grok は **L2b 追補役**（番号置換しない）。

---

## 1. 背景

- **CIO** は **Opus 4.8 デフォルト**（変更なし）
- **Fable 5** は **コスト異常の L4 切り札**（変更なし・稀起動）
- **Grok 4.5** は Composer 初回 Diff **後**の **検証ループ自律実行**に最適化（B/C ハイブリッド）

---

## 2. 役割マトリクス（追補）

| レイヤ | 役割 | モデル | 権限 | 禁止 |
|--------|------|--------|------|------|
| L0 | CIO | Opus 4.8 / 軽量 4.7 | 指揮・統合・deploy/push | 大量 Diff 直接 |
| L1 | 監査 | DeepSeek | §50-3-8 | コード編集・指揮 |
| L2a | 初回 Diff | Composer 2.5 Subagent | 初回実装・SPEC 編集 | §50-3-8 なし単独 save/deploy |
| **L2b** | **自律ループ** | **Grok 4.5 Subagent** | in-scope Edit・lint/test ループ | deploy/push/PUT・SPEC 意味変更・指揮 |
| L3 | 長文/図 | Kimi / ⑥ Visual | 精査・Mermaid（⑥正本） | Diff 適用 |
| L4 | 切り札 | Fable 5 | 1-shot 突破仮説 | Diff/save・常時起動 |

---

## 3. B / C ハイブリッド（確定運用）

| モード | 名称 | 条件 |
|--------|------|------|
| **B（デフォルト）** | 提案・単発 Edit | 初回 implement・仕様未確定・多アプリ |
| **C（検証ループ限定）** | verify 緑まで自律 | **§4 全条件**を満たすときのみ |

**C 発動の全条件（AND）**:

1. DeepSeek §50-3-8 **実施済み**
2. Composer **初回 Diff 済み**
3. 対象 **1アプリ・in-scope パス固定**
4. **破壊操作なし**（deploy / push / kintone PUT は CIO のみ）
5. **終了条件が機械的**（`doneWhen` npm が exit 0）
6. **実行契約**（`templates/grok-execution-contract.template.md`）を CIO がチャットに貼付済み
7. **上限**: ツール 15 回 / 10 分 / 同一エラー 3 回（いずれかで停止）

---

## 4. エスカレーション階段（Grok ↔ Fable）

```
CIO(Opus4.8)
  → DeepSeek(着手前)
  → Composer(初回Diff)
  → npm verify
       ↓ NG & C条件満たす
  → Grok L2b モードC（自律ループ・上限付き）
       ↓ 突破不能 or 仕様横断
  → CIO Opus4.8 再統合（同一論点2回まで）
       ↓ まだ deadlock & T1/T2/T3
  → Fable L4（1-shot）→ 同一ターン 4.8 復帰
```

**Fable 前の追加ゲート（2026-07-09）**:

- Grok C を **1回**試行済み、または Grok 不適用（横断・仕様）
- CIO Opus 4.8 が同一論点で **2回**統合判断後も矛盾残存

---

## 5. 関連ファイル

| 種別 | パス |
|------|------|
| Runbook | `docs/runbooks/cio-grok-execution-loop.md` |
| 契約テンプレ | `templates/grok-execution-contract.template.md` |
| 機械ゲート | `npm run cio:grok:execution-guard` |
| Fable 連携 | `docs/runbooks/cio-fable5-escalation.md` |
| Matrix | `data/cio-mcp-four-ai-matrix.json` → `roles.grok` |
| Routing | `data/cio-ai-team-tool-routing.json` → `grok-verify-loop` |

---

## 6. 検証

```bash
npm run verify:cio-grok-execution-infra
npm run verify:cio-four-ai-governance
npm run cio:tool:route -- --intent "lint 修正ループ Grok"
```

---

## 7. MCP 連携（read-only）

| MCP | Grok C での用途 | CIO 判断 |
|-----|-----------------|----------|
| eslint-mcp | lint 失敗の客体事実 | 常に許可可 |
| kintone-schema-mcp | フィールド型・lookup 照合 | customize 変更時 |
| git-history-mcp | 規律先祖返り疑い | 横断矛盾時 |
| repo-tree | in-scope パス確認 | パス不明時 |

**禁止**: kintone CRUD/deploy、github push、openrouter 図解（⑥ 担当）、deepseek/kimi への指揮権移譲。
