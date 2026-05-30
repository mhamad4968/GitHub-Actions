# 第22読本 — エラーハンドリング（自動エスカレーション・3択チケット）AI-KERNEL

**正本（非置換）**: `AGENTS.md` §1-2-3-4-B 10-14 / 第7〜8層  
**関連**: `06-mcp-disaster-recovery.md` / `docs/issues/bug-latest.md`

---

## 前提条件

- verify 連続2回 exit 1 → DeepSeek §50-3-8 強制 → Self-Heal 最大3回
- Self-Heal 3回上限 → `npm run cio:error:generate-ticket` → CEO 3択待機
- SPEC 矛盾 → `npm run verify:cio-spec-logic` exit 1 ロック
- チケット正本: `docs/issues/bug-latest.md`（`CIO-EXEC-CHOICE-N` ブロック）

## 実行手順

1. verify 失敗: `npm run cio:composer:escalation-guard`（エスカレーション記録）
2. 3回上限: `npm run cio:error:generate-ticket` → bug-latest.md
3. CEO「選択肢Nで実行」: `npm run cio:error:apply-ticket-choice -- --choice N`
4. 適用後: verify 群再駆動（apply-ticket-choice 内蔵）
5. SPEC 編集後: `npm run verify:cio-spec-logic`（矛盾時赤字 `【仕様矛盾】`）

## 禁止事項

- Self-Heal 4回目以降のゾンブループ
- チケット未生成のまま customize 再着手
- CEO 3択なしの自律 Diff 適用
- verify:cio-spec-logic NG のまま実装着手
- エスカレーション証跡なし commit（spec-touch 時）

## 判定コード

| コマンド | 合格 |
|----------|------|
| `cio:composer:escalation-guard` | 連続失敗時 exit 1 + 記録 |
| `cio:error:generate-ticket` | チケット生成 exit 0 |
| `cio:error:apply-ticket-choice -- --choice N` | Diff適用 + verify 再駆動 |
| `verify:cio-spec-logic` | exit 0 |
| `verify:cio-environment-infra` | exit 0 |
