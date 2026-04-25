# 📅 C-9 scripts/lib/ 共通関数抽出

**制定日**: 2026-04-25 (Sat) / J-シリーズ Tier C 登録
**実施予定日**: 2026-05-22 (Thu) メジャーレビュー時
**契機**: 2026-04-25 I-13 で着手検討したが regression リスクで cancel → 計画として温存

---

## 🎯 目的

`scripts/` 直下の audit / verify 系スクリプト群で重複実装されているユーティリティ関数を `scripts/lib/` 配下に共通化し、保守性 + 一貫性を向上させる。

---

## 📋 対象 (現時点で観察済の重複)

| 候補 | 重複している場所 | 想定モジュール名 |
|---|---|---|
| `extractMarkdownHeaders(text, level)` | `audit-tsb-confirmed.mjs` / `verify-breaking-deletions.mjs` / `audit-cross-references.mjs` | `lib/markdown-headers.mjs` |
| `gitLog / gitDiff` ラッパ (spawnSync) | `verify-breaking-deletions.mjs` / `health-check.mjs` (S15) | `lib/git-utils.mjs` |
| `naturalSort` | `audit-cross-references.mjs` (内部) / `audit-tsb-confirmed.mjs` (相当ロジック) | `lib/sort.mjs` |
| `readUtf8Safe(p)` (try/catch ラッパ) | 複数 | `lib/fs-safe.mjs` |
| markdown table parser | `audit-tsb-confirmed.mjs` (`extractTocRows`) | `lib/md-table.mjs` |

---

## ✅ 完了条件

1. `scripts/lib/` ディレクトリ新設 + 上記 5 モジュール作成
2. 既存スクリプトが lib を import するように改修
3. `npm run smoke` (= 6 検査) すべて ✅ pass を維持
4. 各 lib モジュールに最小ユニットテスト (`scripts/lib/__tests__/` または node:test ベース) を 1 件以上
5. AGENTS.md にコメント追加: 「§42-2-? scripts/lib/ 共通モジュール命名規約」

---

## ⚠️ リスク + 対策

- **リスク**: 既存 audit/verify が ✅ pass している現状を破壊する regression
- **対策 1**: 1 モジュールずつ抽出 + smoke-test を毎回回す
- **対策 2**: 各 lib モジュールにユニットテストを **先に書いてから** 抽出 (TDD 風)
- **対策 3**: post-commit hook (I-9) が即座に異常検知

---

## 📅 タイムライン (想定)

- **5/22 09:00-10:00**: lib/markdown-headers.mjs 抽出 + audit-tsb / verify-breaking / audit-xref が import するように改修 + smoke-test 全 pass 確認
- **5/22 10:00-10:30**: lib/git-utils.mjs 抽出 (verify-breaking + health-check S15)
- **5/22 10:30-11:00**: 残り 3 モジュール抽出
- **5/22 11:00**: 最終 smoke-test + commit + push

---

## 🔗 関連

- 起源: 2026-04-25 I-13 cancel (chat-sessions/2026-04-25.md / 10:48)
- 依存: なし (単独で完結する refactoring)
- 副作用: 単体テスト追加 = 開発体験向上 (ただし node_modules 増加なし / node:test 標準ライブラリで完結予定)
