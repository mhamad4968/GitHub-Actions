# 第20読本 — コスト・Fastトークン防衛（15ターン解体・荷造り）AI-KERNEL

**正本（非置換）**: `AGENTS.md` §1-2-3 / §1-2-3-4-B / §51 / §42  
**関連**: `13-parallel-session.md` / `10-session-operations.md`

---

## 前提条件

- 通常 **Opus 4.7**、重ターンのみ **Opus 4.8**（§1-2-3-4-B）。L3=4.8深検証
- 同一チャット **15ターン超** または **40kトークン自認** → 強制解体
- Token Bloat 禁止: Diff最小・全文Read回避
- verify 自律ループ **最大3回** → exit 1 停止

## 実行手順

1. 15ターン到達: 応答末尾で New Chat 強制申告
2. `npm run cio:session:export-handoff` — bridge JSON + debug-tips 追記 + temp purge
3. New Chat 第1手: `npm run verify:session-handoff-integrity -- --import`（ビジュアルマップ）
4. 同一ファイル3回連続Diff: `cio:session:turn-guard -- --record-diff` が exit 1
5. コスト巨大化見込み: §41 一問で浜田に区切り確認

## 禁止事項

- ティア宣言省略（§1-2-3-1 違反）
- 15ターン超の同一チャット継続
- 4.8 をルーチン全ターンに常用（Fast節約違反）
- export-handoff なしの New Chat 化
- 引っ越し知恵の手動消去（`docs/knowledge/debug-tips.md` 自動ストックを正）

## 判定コード

| コマンド | 合格 |
|----------|------|
| `cio:session:export-handoff` | exit 0 + bridge 書込 |
| `verify:session-handoff-integrity -- --import` | exit 0 |
| `verify:cio-session-dissolution` | exit 0 |
| `cio:session:turn-guard` | 3連続Diffで exit 1 |
