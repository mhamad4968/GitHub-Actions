# 最新ICT情報掲示板 — 自動収集

情シス向け IT 技術情報を RSS から収集し、**Gemini** で厳選・要約して kintone 正本アプリ（**685**）へ登録します。

## セットアップ

```bash
cd ict-tech-digest-automation
cp .env.example .env   # 任意（リポルート ../.env も自動読込）
```

**必須環境変数**（`../.env` または package `.env`）:

| 変数 | 説明 |
|------|------|
| `KINTONE_DOMAIN` または `KINTONE_BASE_URL` | kintone ドメイン |
| `KINTONE_APP_ID` / `ICT_DIGEST_STORE_APP_ID` | **685** |
| `KINTONE_API_TOKEN_ICT_COLLECT` | **685 専用** API トークン（`KINTONE_API_TOKEN_COLLECT` は 631 用のため流用不可） |
| `GEMINI_API_KEY` | Gemini API |

## 手動実行

```bash
npm run collect
# リポルートから
npm run ict-digest:collect
npm run ict-digest:rss:verify    # RSS 取得検証
```

## 仕様

- 1日最大 **5件**（`published_at` = JST 当日）
- overview は **【事象】【影響】【推奨】** 3行（`overview-format.ts` で正規化）
- RSS: リトライ・HTML 検知・旧 URL エイリアス（`rss-fetch.ts`）
- 実行スケジュール: **10:00 / 20:00 JST**（GitHub Actions）

正本: `docs/plans/2026-05-16-ict-tech-digest-spec.md`
