---
name: kintone-pre-implement-gate
description: >-
  kintone アプリ作成・customize デプロイ・データ移行前に必ず実行するゲート手順。
  cio:pre-implement-gate、compare-83、仕様チェックリスト、浜田 GO/実装OK を含む。
---

# kintone 実装前ゲート

## いつ使うか

- kintone **アプリ新規作成**の前
- **customize デプロイ**の前
- **レコード一括投入**の前
- 浜田から「実装OK」「GO」が出る前の **仕様再確認**依頼時

## 朝一括（推奨）

```bash
npm run cio:morning:pre-implement
npm run cio:morning:pre-implement -- --project business-improvement
```

## 標準ゲート（全プロジェクト）

```bash
npm run cio:pre-implement-gate -- --strict
npm run cio:tool:route -- --intent "<作業要約>" [--log]
npm run cio:guard:5038 --stamp
```

**D v2**: `docs/runbooks/ai-team-tool-routing-v2.md`

## 業務改善 ver.02 追加ゲート

```bash
npm run business-improvement:compare-83
```

チェックリスト: `docs/plans/2026-05-23-business-improvement-proposal-spec-checklist.md`  
正本: `docs/plans/2026-05-23-business-improvement-proposal-spec.md`

### 2026-06-06 浜田確定（再確認不要・実装時に遵守）

| 項目 | 確定値 |
|------|--------|
| 設定マスタ Excel | 確定版・30行取込可 |
| 本社部長評価 | **あり** — E列 LoginID が承認者 |
| 人事部長共通 | **`jinji`** |
| Space 57 | ログイン確認済み |
| 着手 | **浜田「実装OK」サイン後**（6/7 or 6/8） |

## 人間ゲート（機械では代替不可）

1. 仕様突合サマリを浜田に提示
2. **「実装OK」** の明示サインを得る
3. サイン後のみ `create-app` / `deploy` 実行

## デプロイ前（別スキル）

実装完了後は `kintone-deploy-lane` スキルを参照。
