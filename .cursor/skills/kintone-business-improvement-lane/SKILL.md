---
name: kintone-business-improvement-lane
description: >-
  業務改善提案 ver.02 専用レーン（Space 57 開発 / Space 5 本番）。
  仕様・案B1・設定マスタ・compare-83・朝ゲート・実装OK seal を一括参照。
---

# 業務改善提案 ver.02 レーン

## レーン分離

| レーン | スペース | 触らない |
|--------|----------|----------|
| **業務改善** | 57（開発）/ 5（8/1本番） | 共有メール21・Apple ID 21 等 |

## 着手ゲート（必須順）

```bash
npm run cio:morning:pre-implement -- --project business-improvement
```

**浜田「実装OK」サイン後**:

```bash
npm run cio:implementation-ok-seal -- --project business-improvement-ver02 --scope "案B1"
```

## 正本

| 用途 | パス |
|------|------|
| 仕様 | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` |
| 実装手順 | `docs/plans/2026-05-28-business-improvement-implementation-handbook.md` |
| チェックリスト | `docs/plans/2026-05-23-business-improvement-proposal-spec-checklist.md` |
| フィールド | `docs/plans/2026-05-24-business-improvement-proposal-01-fields-hamada-review.md` |
| 設定マスタ Excel | `scripts/data/business-improvement-settings-master-template.xlsx` |
| 83 突合 | `npm run business-improvement:compare-83` |

## 浜田確定（2026-06-06 — 変更禁止）

| 項目 | 値 |
|------|-----|
| Excel 30行 | **確定版**として取込 |
| 本社部長評価 | **あり** — E列 LoginID |
| 人事部長 | **`jinji`**（新④共通フィールド） |
| Space 57 | アクセス確認済み |
| 旧83/84 | **データ移行なし** |

## 案B1（第1フェーズ）

1. fields JSON（新①②③④）
2. create-app スクリプト（shared-mail 695/696 パターン）
3. 新④ → 30行 + jinji + 評価20段階
4. 新② スケルトン
5. 新① WF骨格
6. 新③ 空シェル
7. App ID 記録

**customize（JS）は別フェーズ**（6/9〜）

## RAG 検索

```bash
npm run rag:sync-business-improvement
```

マニフェスト: `data/rag-business-improvement-manifest.json`

## 7/1 デモ後スモーク

```bash
npm run smoke:bi-demo -- --dry-run
```
