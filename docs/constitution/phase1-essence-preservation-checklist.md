# Phase 1 エッセンス継承チェックリスト（デグレード防止）

**日付**: 2026-05-21  
**目的**: ルール整理後も **CEO 合意の意味**が消えていないことを Opus・DeepSeek・Kimi で突合する。

## 必須継承（削除・弱体化禁止）

| ID | エッセンス | 正本 |
|----|-----------|------|
| E1 | 開発=AI・確認=浜田 | §35-1 / §56-1a |
| E2 | §41 一問一答 | AGENTS §41 |
| E3 | §50-3-8 盲点3点＋約3行突合 | §50-3-8 / §50-3-11 ステップ1-2 |
| E4 | 2者検証（DeepSeek/Kimi） | constitution-enforcement-core |
| E5 | 報告 V2 七行・§1e | every-turn-rules-confirm |
| E6 | §1-2-2 silent fallback 禁止 | §1-2-2 / cio:guard:composer-interlock |
| E7 | §51 並列禁止（書込並列） | AGENTS §51 |
| E8 | Tier B GO | §52 |
| E9 | 方式B 4AI（上乗せ） | §1-2-3-4 / mode-b-canonical |

## 整理で行ったこと（削除ではない）

- **統合**: 四行テンプレ → `mode-b-canonical.mdc`
- **憲法合流**: 機械ゲート → `AGENTS.md` §50-3-11
- **階層化**: `00-rule-hierarchy.md`
- **§1-2-3-2 の L1 Composer 2** は **一般セッション用として維持**（CIOセッションでは L1=Composer 2.5 Subagent と §1-2-3-4 で明示）

## トリプルチェック記録

| レビュア | 結果 | メモ |
|----------|------|------|
| Opus（CIO） | PASS | 上表 E1-E9 条文・スクリプト存在確認 |
| DeepSeek | PASS（要追補） | §35-1/§1-2-2/§51 の暗黙上書きリスク → §50-3-11 に「上位条文非置換」を追記済 |
| Kimi | PASS | 四行集約は参照先明記のため長文正本（AGENTS）と矛盾なし |
