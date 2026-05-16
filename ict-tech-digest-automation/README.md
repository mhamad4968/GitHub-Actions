# 最新ICT情報掲示板 — 自動収集

情シス向け IT 技術情報を RSS から収集し、**Gemini** で厳選・要約して kintone 正本アプリ（**685**）へ登録します。

## セットアップ

```bash
cd ict-tech-digest-automation
cp .env.example .env
# .env を編集（KINTONE_DOMAIN, KINTONE_APP_ID=685, トークン, GEMINI_API_KEY）
npm ci
```

## 手動実行

```bash
npm run collect
# またはリポルートから
npm run ict-digest:collect
```

## 仕様

- 1日最大 **5件**（`published_at` = JST 当日）
- URL は **全期間で一意**
- 実行スケジュール: **10:00 / 20:00 JST**（GitHub Actions）

正本: `docs/plans/2026-05-16-ict-tech-digest-spec.md`
