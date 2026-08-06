# 運用改善 — 2026-08-06 夕反省 GO

> GO: `docs/approved-changes/2026-08-06-evening-reflection-hamada-go.md`  
> 憲法本文（AGENTS）は変更しない。

## 空 DROP_DOWN 初期化（A1 / S-KINTONE-EMPTY-DD-01）

kintone の `not in ("A","B")` は **空の DROP_DOWN を拾わない**ことがある。

| 禁止 | 正当 |
|------|------|
| `not in` だけで未設定を初期化 | スコープ query で取得 → **クライアントで空判定**して PUT |
| 空判定を脚本ごとに再発明 | `scripts/lib/kintone-empty-dropdown.mjs` を使う |

## 印刷（A2 / S-PRINT-ROOT-01）

新規・SKYSEA 系印刷は **専用 print-root DOM**＋他を `display:none`。

| 禁止 | 正当 |
|------|------|
| `@media print { body * { visibility:hidden } }`（新規） | `#…-print-root` のみ表示 |
| 目視前に印刷チェック省略 | 白紙ページが出ないことを自己確認してから依頼 |

既存の一覧パネル印刷（`LIST674`）が旧 `visibility:hidden` の場合は **次に触るとき** print-root へ移行（新規コードに広げない）。

## 所属マスタ（A3 / S-DEPT-MASTER-01）

所属セレクト／件数の正は **App 680（`sort_no`）**。レコードに出た所属集合だけから組み立てない。

## 対象スコープ固定（A4 / S-SCOPE-LINE-01）

SKYSEA／台帳系 setup・customize の先頭に例:

```text
SCOPE= account_type=個人 ; pc_status not in (保管,廃棄,取消)
```

実装前にチャットへ1行出し、変更時は同ターンで更新する。

## 目視依頼（A5 / O-ACCEPT-01）

admin 専用一覧の目視依頼前チェック:

1. 所属＝680全件＋件数
2. 空フィールド再初期化済み
3. 印刷1枚（白紙なし）
4. 行トグル／リスト表示が完成形

途中完成で目視依頼しない。

## checkpoint 完了裁定（A6 / D-CHKPT-DONE-01）

浜田が完了／不要と裁定した件は **同一ターン**で `**次の1手**:`／`GO待ち` から外す（案内規律 2026-07-28）。履歴ブロックへ移してよい。

## SKYSEA 境界（O-SKYSEA-01）

- **手動台帳（674）**＝運用可
- **実PC配信・GPO・SGメンバ追加**＝禁止継続

台帳 UX の反復と配信レーンを混ぜない。

## §50-3-8 短問（M-5038-QUERY）

customize／kintone query／印刷を触る短問の盲点に次を含める:

1. **空値クエリ**（空 DROP_DOWN と `not in`）
2. **印刷白紙**（visibility 陷阱）
3. **マスタ欠落**（680 未使用でセレクト欠ける）

正本追記: `.cursor/rules/deepseek-cursor-spec-division.mdc`
