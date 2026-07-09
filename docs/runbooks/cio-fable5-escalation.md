# CIO — Claude Fable 5 L4 切り札エスカレーション

> **上位**: `AGENTS.md` §1-2-3-6 / `docs/plans/2026-07-04-ai-team-six-roles-spec.md`  
> **非置換**: §1-2-3-4-B（Opus 4.8 ハイブリッド）・§50-3-11

---

## 1. 位置づけ

**Claude Fable 5** は **L4 切り札**。通常は **Opus 4.8 デフォルト**の CIO が統合する。Fable は **稀**・**短時間**・**突破後即 4.8 復帰**。

---

## 2. 起動トリガ（いずれか 1 つ以上）

**前提（2026-07-09 Grok L2b 追補）**: Fable の前に **Grok C（検証ループ）を 1 回**試行済み、または Grok 不適用（仕様横断・局所バグ以外）。**CIO Opus 4.8** が同一論点で **2 回**統合判断後も矛盾が残ること。

| # | 条件 | 例 |
|---|------|-----|
| T1 | Composer ↔ DeepSeek **3 回以上**デッドロック | verify 連続 NG + §50-3-8 再監査でも方針不一致 |
| T2 | git-history-mcp + kintone-schema-mcp **複合** | 横断 spec で CIO+DeepSeek が突破不能 |
| T3 | §47-A / §57 級 | 憲法横断・AGENTS 改定の整合ブロック |
| T4 | **Grok L2b(C) 1 回後**も突破不能 | `cio:grok-execution-guard --record-fail` 後の横断矛盾 |

**禁止**: ルーチン実装・軽量相談・コスト節約目的の Fable 起動。**lint 赤のみ** → `docs/runbooks/cio-grok-execution-loop.md`（Grok C）を優先。

---

## 3. 型継承テンプレ（Fable 起動時に CIO が必ず付与）

```
【Fable L4 型継承】
- 判断権限: 本タスクの <ブロック名> のみ。deploy/GO/憲法改定は不可。
- 入力: <要約3行> + DeepSeek 突合3行 + 関連 SPEC パス
- 出力形式: (1) 突破仮説1つ (2) 次手順3行 (3) リスク1行
- 復帰: 出力受領後 CIO(Opus4.8) が統合。Fable 単独で Diff/save 禁止。
```

---

## 4. 手順

1. CIO — トリガ該当を 1 行宣言 + 🎖️ `Fable5=L4起動`
2. Fable — 型継承テンプレに従い **1 問または 1 設計回答**
3. CIO — **同一ターン**で Opus 4.8 に復帰、🎖️ `Fable5=L4使用済→4.8復帰`
4. 必要なら DeepSeek 再突合 → Composer または Grok L2b(B) へ（deploy は CIO）

---

## 5. コスト・安全

- **§41 一問**: トークン巨大化見込み時は浜田確認
- **§50-3-5**: 秘密・トークン・実レコード ID を Fable 入力に含めない
- **Self-Heal 上限**: 既存 `cio:composer:escalation-guard` と併用 — Fable は **Self-Heal 3 回後**の CEO 報告前の **追加オプション**（代替ではない）

---

## 6. 宣言例

```
[🎖️ 本セッション割当] CIO=Opus4.8 | Fable5=L4起動(T1 deadlock) | Composer=待機 | DeepSeek=突合済 | Kimi=未使用 | Visual=未使用
```

復帰後:

```
[🎖️ 本セッション割当] CIO=Opus4.8(Fable5→4.8復帰) | Architect=未使用 | Composer=Subagent予定 | ...
```
