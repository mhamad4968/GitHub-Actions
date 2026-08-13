# 運用枠・監査1枚・月次下書きパック（v1）

> **制定**: 2026-08-13（浜田 GO — AIチーム運用話し合い）  
> **性質**: リマインダと要約。**ゲートではない。** skip 可。項番 -0 が勝つ。

## 1. 枠

```bash
npm run cio:ops:frame
```

金曜 usage / 週次 env:enhance / 月次パックを印刷する。破っても失敗にしない。

## 2. 監査1枚

```bash
npm run cio:ops:audit-sheet
```

health / GHA / credit / GO待ち / 閉済を 1 枚に要約する。赤でも exit 0。verify を増やさない。

## 3. 月次下書きパック

```bash
npm run cio:keiei:draft-pack
npm run cio:keiei:draft-pack -- --month 2026-09
```

下書きはあってよい。周知ネタは浜田が渡す。出ないときだけ相談。AI から先にネタを並べない。仕上げは浜田。完了済み月次本体は再着手しない。

## 禁止

- cold-start / WAKE の必須ゲート化
- 日次の作業メニュー化
- 自動化率 KPI
