# 第19読本 — 統制・役割（CIO・4AI・2名以上チェック）AI-KERNEL

**正本（非置換）**: `AGENTS.md` §35-1 / §56-1a / §1-2-3-4 / §50-3-11 / §50-3-8 / §1c  
**用語単一窓**: `.cursor/rules/mode-b-canonical.mdc`  
**関連**: `17-four-ai-mode-b.md` / `18-ai-team-read-map.md`

---

## 前提条件

- 方式B固定4AI: **CIO（Opus 4.7ベース / 必要時4.8）** / **Composer 2.5** / **Kimi** / **DeepSeek**
- 開発=AI・確認=浜田（§35-1 / §56-1a）。CEO検収は第2者の代替にならない
- 仕様意味に触れる編集は **本体＋第2者** が下限（§1c / §50-3-8）
- 毎ターン先頭4行 + 報告ターンは §M-2 V2 七行（`docs/session-report-checklist.md`）

## 実行手順

1. ターン先頭: `[§1-2-3 ティア判定]` → `【適用憲法】` → `[🎖️ 本セッション割当]` → `[ルール確認]`
2. customize/**・SPEC.md・deploy:* 前: DeepSeek 1問（§50-3-8）→ CIO 突合3行 → `npm run cio:guard:5038 -- --stamp`
3. 開発3ステップ: DeepSeek → 突合 → Composer Diff（GOなし save/deploy 禁止）
4. 報告前: `npm run cio:report-verify-response -- --file <下書き>` exit 0
5. 機械整合: `npm run verify:cio-four-ai-governance`
6. **Grok C（検証ループ）**: Composer 初回後のみ — `validate-diff` → `stamp --mode C` → `check-c-ready` exit 0 → Subagent Grok（**read-only MCP**: eslint-mcp / kintone-schema-mcp / git-history-mcp / repo-tree）
7. WORK 着手: `npm run cio:tool:route -- --intent "…"`（D v2）→ B v2 品質ゲート（`push-deploy-quality-gates-v2.md`）

## 禁止事項

- 本体単独完結（CIO単独で GO なし save/deploy/PUT）
- Composer Subagent の §50-3-8 なし単独保存
- **Grok** の deploy/push/kintone 書込・SPEC 意味変更・MCP 書込（read-only 以外）
- §1-2-2 silent fallback 継続（4択提示・即中断）
- 上位条文（§35-1 / §56-1a / §41 / §51 / §1-2-2 / §52）の削除・置換（§50-3-11）
- 「軽微」「minor」のみの §50-3-8 スキップ理由

## 判定コード

| コマンド / 条件 | 合格 |
|-----------------|------|
| `verify:cio-four-ai-governance` | exit 0 |
| `cio:pre-implement-gate` | customize 着手前表示 |
| `cio:report-verify-response` | 報告・締め・GO前 exit 0 |
| SECOND_REVIEWER | SPEC_TOUCHED:yes 時 deepseek\|kimi\|openrouter 必須 |
