# 共有メール — Excel 追記登録

**制定**: 2026-08-24（夕反省 #S1 GO）  
**対象 DB**: **695**（日常 UI は [696](https://jbis-kintone.cybozu.com/k/696/)）

## migrate と append の取り違え禁止

| npm | 用途 | 既存レコード |
|-----|------|--------------|
| `shared-mail:migrate:xlsx` | **初期一括**（legacy 1 から） | あり → 拒否（`--force` 以外） |
| `shared-mail:append:xlsx` | **追記**（max legacy 継続・重複 skip） | あっても可 |

## 手順

1. **必ず先に dry-run**（件数・No 帯・重複 skip を確認。パスワードはログに出ない）
2. 浜田 GO のあと `--apply`
3. 696 で再読込 → 目視

```powershell
npm run shared-mail:append:xlsx -- --dry-run --xlsx="C:\Users\...\file.xlsx"
npm run shared-mail:append:xlsx -- --apply --xlsx="C:\Users\...\file.xlsx"
```

## Excel 列

`利用種別` / `利用部署` / `表示名`（または `共有メールアドレス名`） / `メールアドレス` / `パスワード`  
任意: `メールアカウント`（空ならアドレスの @ 前）

利用部署は UI と同様 **自由記述可**（R68 正式名以外も可。依頼 Excel の表記を正とする）。
