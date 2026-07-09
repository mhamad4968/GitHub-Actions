# CIO — Grok 4.5 L2b 自律実行ループ（B/C ハイブリッド）

> **上位**: `AGENTS.md` §1-2-3-6 / `docs/plans/2026-07-09-grok-l2b-hybrid-spec.md`  
> **非置換**: §35-1 / §50-3-8 / §51 / Composer 初回 Diff 規律 / ⑥ Visual OpenRouter

---

## 1. 位置づけ

**Grok 4.5** は **L2b 追補** — **Composer 2.5 の後段**で lint/test を緑にする自律ループ担当。

- **Cursor Subagent** として起動（`grok-4.5-fast-xhigh` 等、製品で利用可能な slug）
- **指揮権は CIO（Opus 4.8）** — Grok は実行契約の範囲内のみ
- **⑥ 視覚化・Fable L4 は置換しない**

---

## 2. モード B（デフォルト）

| 項目 | 内容 |
|------|------|
| 用途 | 調査・修正案テキスト・単発 Edit（CIO が都度検収） |
| 起動 | CIO が明示宣言 `Grok=L2b(B)` |
| 典型 | 初回 implement 同行、仕様曖昧、scripts の軽微調査 |

---

## 3. モード C（検証ループ限定）

**C 発動前チェック** — `npm run cio:grok:execution-guard -- --check-c-ready`（人間可読）または CIO 手動確認。

| # | 条件 |
|---|------|
| C1 | §50-3-8 実施済み（またはスキップ理由が非該当のみ） |
| C2 | Composer 初回 Diff 済み |
| C3 | `inScope` 1アプリ・パス列挙済み |
| C4 | deploy / push / kintone PUT **禁止**（契約に明記） |
| C5 | `doneWhen` が npm コマンドで exit 0 判定可能 |
| C6 | 実行契約をチャットに貼付 |
| C7 | 上限: 15 tool calls / 10 min / 同一エラー 3 回 |

### 手順

1. CIO — `【Grok 実行契約】` をテンプレから埋めてチャットに貼る
2. CIO — `npm run cio:grok:execution-guard -- --validate-diff`
3. CIO — `npm run cio:grok:execution-guard -- --stamp --mode C --goal "…" --done-when "npm run …" --in-scope "path"`
4. CIO — `npm run cio:grok:execution-guard -- --check-c-ready`（exit 0 必須）
5. CIO — Task Subagent **Grok 4.5** 起動（契約全文 + contractHash + エラーログ末尾）
6. Grok — in-scope のみ Edit / 許可 npm のみ Shell / 緑までループ（上限内）
7. CIO — diff 検収 → `npm run cio:grok:execution-guard -- --record-success`
8. **deploy / preflight / push** は **CIO が別途**（Grok 禁止）

### 停止・エスカレーション

| 状況 | 次手 |
|------|------|
| `doneWhen` 緑 | CIO 統合 → handoff 1 行 |
| 同一エラー 3 回 | `npm run cio:grok:execution-guard -- --record-fail` → CIO 再判断 |
| 仕様判断が要る | §41 一問（Grok 継続禁止） |
| 横断矛盾 | schema/history MCP → Opus 2回 → Fable T1/T2 |

### MCP 連携（read-only・2026-07-09 強化）

Grok Subagent が **単独で MCP を乱用しない**。CIO が契約に **Allowed MCP** を明記した場合のみ、次の **read-only** を許可:

| MCP | 用途 | 禁止 |
|-----|------|------|
| **eslint-mcp** | lint 客体検証・fix 候補の事実取得 | 憲法・hooks 変更 |
| **kintone-schema-mcp** | フィールド型・lookup 矛盾の照合 | レコード CRUD・deploy |
| **git-history-mcp** | 規律先祖返り・合意層の照合 | コミット・push |
| **repo-tree** | in-scope パス存在確認 | リポ外探索の拡大 |

**起動前**: `npm run cio:grok:execution-guard -- --validate-diff`（deploy/push/PUT パターンを diff から拒否）

---

## 4. 型継承テンプレ（Grok 起動時）

```
【Grok L2b 型継承】mode=C|B
- Goal: <1行>
- In-scope: <paths>
- Out-of-scope: SPEC意味変更 / deploy / push / 他アプリ / 憲法
- Done when: <npm cmd> exit 0
- Limits: 15 calls / 10min / same-error×3
- Output: (1) 原因1行 (2) 変更ファイル一覧 (3) 残リスク1行
- 復帰: CIO(Opus4.8) が検収。Grok 単独 save/deploy 禁止
```

---

## 5. 🎖️ 宣言例

```
[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=初回Diff済 | Grok=L2b(C) verify-loop | DeepSeek=§50-3-8済 | Fable5=未使用 | Visual=未使用
```

完了後:

```
[🎖️ 本セッション割当] CIO=Opus4.8 | Grok=L2b(C→完了) | Composer=— | …
```

---

## 6. コスト・安全

- **1タスク Grok C は原則 1 回**（再試行は CIO が契約を圧縮してから）
- **セッションあたり Grok C は 2 回上限**（3 回目は Fable 検討または浜田 §41）
- **§50-3-5**: API トークン・実レコード ID を Grok 入力に含めない
- **証跡**: `logs/cio-grok-execution/` に stamp JSON

---

## 7. 判定コマンド

| コマンド | 用途 |
|----------|------|
| `npm run cio:grok:execution-guard -- --check-c-ready` | C 発動前チェックリスト表示 |
| `npm run cio:grok:execution-guard -- --validate-diff` | working diff の deploy/push/PUT 拒否 |
| `npm run cio:grok:execution-guard -- --stamp --mode C …` | 契約スタンプ + contractHash |
| `npm run cio:grok:execution-guard -- --record-success` | 成功リセット |
| `npm run cio:grok:execution-guard -- --record-fail --reason "…"` | 失敗記録 |
| `npm run verify:cio-grok-execution-infra` | インフラ整合 |
