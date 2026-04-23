# 📜 自作 scripts TypeScript 化 (大規模 refactor / 6 月以降)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-06 中 (6/22 以降 / 5/22 メジャー更新一括レビュー後の安定期)  
**契機**: 浜田 2026-04-23 23:00 改善案 #11 承認 / 自作 scripts 品質向上長期戦略

---

## 🎯 目的

`scripts/*.mjs` 29 ファイル / 5985 行の自作スクリプトを TypeScript 化することで:
1. 型安全性向上 (引数 / 戻り値 / 内部状態の型保証)
2. IDE 補完強化 (Cursor / VSCode で開発体験改善)
3. リファクタ容易性 (型エラーで影響範囲一括特定)
4. 大型 script (300-600 行 × 7 件) の保守性向上

## 📋 現状 (4/23 時点)

- scripts/*.mjs 29 ファイル / 5985 行 / TODO 1 件のみ (品質良好)
- 大型 script 7 件: health-check (363) / space-health-report (600) / ops-guide (305) / daily-morning-prep (388) / evening-reflect (323) / skysea-recon (361) / space-health-push-space-body (466)
- 型なし = 引数ミスや戻り値の前提崩れが ランタイム まで発覚しない

## 🆕 段階導入 (6 ヶ月計画 / 急がない)

### Tier 1: 中核 cron スクリプト (6 月)
- daily-morning-prep.mjs (388 行)
- health-check.mjs (363 行)
- auto-heal.mjs
- evening-reflect.mjs (323 行)
- apply-approved-changes.mjs

### Tier 2: 健康診断 + 検証系 (7 月)
- check-node-modules.mjs (S9 適用後)
- check-mcp-dormancy.mjs (S12 適用後)
- check-proposals.mjs (S10 適用後)
- check-parallel-chats.mjs (S11 適用後)
- audit-rules.mjs / audit-rules-monthly.mjs (S15 適用後)

### Tier 3: kintone 連携 (8 月)
- space-health-report.mjs (600 行)
- space-health-push-space-body.mjs (466 行)
- ops-guide-kintone.mjs (305 行)
- skysea-recon.mjs (361 行)
- kintone-connection-test.js

### Tier 4: その他 (9 月)
- 残小型 script 約 15 件

## 🚦 移行手順 (1 script ずつ / §51 厳格)

各 script ごとに:
1. `.mjs` → `.ts` リネーム
2. import 文 + export 文の型ガード追加
3. 関数引数 + 戻り値の型注釈
4. 内部 state の interface 定義
5. `tsc --noEmit` で型チェック通過確認
6. `node --experimental-strip-types <name>.ts` で動作確認 (or tsx 経由)
7. cron 設定変更 (`node` → `tsx`) も同時 commit
8. 1-3 日観察期間後に次 script へ

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| TypeScript 化で cron 起動失敗 | 各 script 1-3 日観察 / 失敗時は git revert + .mjs 戻し |
| tsx / node --experimental-strip-types の起動オーバーヘッド | benchmark 実施 (5% 増程度なら許容) |
| 大型 script の型注釈で工数膨張 | Tier 順守 / 1 script あたり 30-60 分目安 |
| Tier 移行中に新規 .mjs 追加で混在 | ルール: 6 月以降の新規 script は最初から .ts |

## ✅ 完了判定 (Tier 別)

- [ ] Tier 1 (6 月): 中核 5 script TypeScript 化
- [ ] Tier 2 (7 月): 健康診断 5 script
- [ ] Tier 3 (8 月): kintone 連携 5 script
- [ ] Tier 4 (9 月): 残全 script
- [ ] 全完了後: AGENTS.md / RULES-INDEX に「scripts/ は TypeScript」明記

## 🔗 関連
- 改善案 #11 (浜田 23:00 承認)
- 戦略書 v1.1 (Phase F E5 自作 scripts 品質指標 = 29 files / 5985 行)
- npm scripts (`package.json`): node → tsx 切替必要
