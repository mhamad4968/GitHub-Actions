# AGENTS.md — 開発憲法（本リポジトリ）

AI エージェントおよび開発者は、タスク着手前に **本ファイル** と **`kintone-apps.md`** を読み、変更後は **アプリ正の更新**まで含めて完結させる。

---

## 1. 単一の情報源（SSOT）

| 対象 | 正本 |
|------|------|
| アプリ ID・URL・運用メモ | `kintone-apps.md` |
| Security NEXT 631 / 632 のフィールドコード | `security-next-automation/src/lib/field-codes.ts` ＋各 `docs/*-app-design.csv` |
| 収集・週次の仕様・環境変数 | `security-next-automation/README.md` |
| メンテの一連手順 | `docs/maintenance-template.md`（一気通貫メンテ・プレイブック） |

---

## 2. セキュリティと秘密情報

- API トークン・パスワードは **GitHub Secrets / Environment `kintone-collect` / ローカル `.env`** のみ。リポジトリにコミットしない。
- ログ・Issue・チャットにシークレットを出力しない。

---

## 3. kintone カスタマイズ（JavaScript）

- 既存パターンに合わせる: `customize/<アプリID>/desktop.js` と `npm run deploy:<ID>`（`package.json` の scripts 参照）。
- フィールドコードは **フォーム上の「フィールドコード」** を信頼し、ラベルで推測しない（`kintone-apps.md` と `app:fields` で裏取り）。

---

## 4. Security NEXT 自動化（631 / 632）

- **631**: RSS 収集 → `collect.ts`。日次 Actions: `.github/workflows/daily-collect.yml`。
- **632**: 週次 LLM 要約 → `analyze.ts`。`.github/workflows/main.yml` の `security-next-kintone`。
- ヘルスチェック（631・632 を既定含む）: `npm run report:space-health` および `.github/workflows/space-health-report.yml`。

本番 URL（ポータル）:

- <https://jbis-kintone.cybozu.com/k/631/>
- <https://jbis-kintone.cybozu.com/k/632/>

---

## 5. コード品質

- 依頼と無関係な広いリファクタはしない。
- `security-next-automation` を変更したら `npm run typecheck --prefix security-next-automation` を通す。
- ルートの `customize/` を変更したら `npm run lint:customize` を可能な範囲で実行。

---

## 6. Cursor ルール

- `.cursor/rules/kintone.mdc` / `kintone-javascript.mdc` などがある場合は内容に従う。
