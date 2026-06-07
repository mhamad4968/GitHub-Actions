# Security NEXT 掲示板 — 仕様正本

> **CEO GO**: 2026-06-07（浜田「設計OK」）  
> **Space**: [Space 48](https://jbis-kintone.cybozu.com/k/#/space/48) からリンク  
> **台帳**: `kintone-apps.md`  
> **コード正本**: `customize/security-next-news-board/` / `customize/security-next-weekly-board/`

---

## 0. 目的

[631](https://jbis-kintone.cybozu.com/k/631/)（Security NEXT ニュース DB）と [632](https://jbis-kintone.cybozu.com/k/632/)（週次要約 DB）を **浜田の運用・品質確認用**に残し、**システム部門**は Space 48 経由の **掲示板**だけで読みやすく閲覧する。

**686（ICT 掲示板）と同型**: レコードコピーなし・掲示板 JS が REST 読取。

---

## 1. アーキテクチャ

| 役割 | アプリ名 | ID | 利用者 |
|------|----------|-----|--------|
| ニュース正本（DB） | Security NEXT ニュース | **631** | 浜田・GHA collect |
| **ニュース掲示板** | Security NEXT ニュース掲示板 | **701** | システム部門（Space 48 入口） |
| 週次正本（DB） | ニュース週次要約 | **632** | 浜田・GHA analyze |
| **週次掲示板** | Security NEXT 週次掲示板 | **702** | システム部門（Space 48 入口） |

App ID 正本: `scripts/data/security-next-board-app-ids.json`

- collect / analyze / GHA **変更なし**
- 掲示板利用者は **631・632 のレコード閲覧権限**が必要（686→685 と同じ）

---

## 2. ニュース掲示板 — 脆弱性除外（表示のみ）

631 DB は触らない。**掲示板 JS でフィルタ**。

### 2.1 除外

| 条件 | 備考 |
|------|------|
| `internal_source === 'nvd'` | NIST NVD 自動取込 |
| タイトルに `CVE-YYYY-NNNN` | |
| タイトルに セキュリティアップデート / 脆弱性+修正系 | |
| `collect.ts` EXCLUSION 語（パッチ・アドバイザリ等） | インシデント語が無い場合 |

### 2.2 表示（インシデント優先）

| 条件 | 例 |
|------|-----|
| 漏洩・ランサム・不正アクセス・流出・侵害 等 | 事件報道 |
| インシデント語あり + 本文に CVE 言及 | **表示**（インシデント優先） |

**判定順**: ① NVD → 除外 → ② インシデント語 → **表示** → ③ パッチ/CVE パターン → 除外 → ④ それ以外 → 表示

---

## 3. 週次掲示板

- 632 を REST 読取（**フィルタなし** — 週次サマリー全体を表示）
- 最新週を上部、過去週は折りたたみ
- 表示: `target_week` / `summary_one_line` / `weekly_trend`（RICH_TEXT HTML）

---

## 4. Space 48 配置

スペース本文またはポータルに以下リンクを配置（浜田または AI が kintone 管理画面で実施）:

- Security NEXT ニュース掲示板 → `/k/701/`
- Security NEXT 週次掲示板 → `/k/702/`

（App ID は `scripts/data/security-next-board-app-ids.json` が正本）

---

## 5. deploy

```bash
npm run setup:security-next-board-apps
npm run cio:preflight:701 -- --note "…"
npm run deploy:701
npm run cio:preflight:702 -- --note "…"
npm run deploy:702
```
