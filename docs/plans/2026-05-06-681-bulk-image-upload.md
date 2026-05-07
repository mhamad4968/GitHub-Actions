# 681 イラスト一括投入（計画メモ）

**状態**: **凍結（2026-05-06 CEO）** — kintone **681** アプリ運用終了・削除方針のため **実装しない**（計画メモのみ保持）。

## 目的

`gazou_1`〜`gazou_3` に、章ごとの PNG 等を **REST で一括**付与する。

## 技術方針（実装時）

1. `POST /k/v1/file.json`（multipart）で **fileKey** を取得（既存 `scripts/deploy-customization.js` と同型の FormData）。
2. `PUT /k/v1/record.json` で `gazou_N: { value: [{ fileKey }] }` を付与。
3. 章の対応は **CSV またはフォルダ命名規則**（例: `sort_no-midashi.png`）で固定する。

## 先行タスク

- **破壊系ゲート**（`docs/kintone-destructive-operations.md`）に沿った **dry-run** と **GO**。
