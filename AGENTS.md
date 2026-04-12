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

---

## 7. 631 収集ガードレール（重大度「例外枠」）

**「重大だから全部入れる」指示をそのままコードにしないこと。** RSS が荒れた日に kintone API 上限・通知・一覧がパンクするのを防ぐ。

| 枠 | 既定（変更するなら設計レビュー） |
|----|----------------------------------|
| 通常の 1 実行あたりの新規登録上限 | `COLLECT_MAX_NEW_PER_RUN`（未設定時 **3**） |
| **重大度例外枠**（例: ランサム＋国内等の条件に合致した記事のみ） | **1 日あたり最大 3 件**（カレンダー日 JST または UTC のいずれかを実装で固定し文書化） |
| 例外＋通常の合計 | 実装時は **日次ハード上限**（例: 合計 6 件/日）を検討し、コードコメントと `docs/` に残す |

フェーズ2の詳細設計: [`docs/phase2-631-collect-improvements.md`](docs/phase2-631-collect-improvements.md)

---

## 8. 632 週次（フェーズ1 実装済みの要点）

- **`target_week`（月曜の日付）**をキーに、既存レコードがあれば **更新**、なければ **追加**（環境変数 `ANALYZE_EXISTING_WEEK_RECORD=skip` で「既存ならスキップ」も可）。
- **表示用**: `summary_one_line`。**内部用**: `internal_ref_*`・`internal_analysis_run_at`・`internal_github_run_id`（一覧では非表示推奨）。
- 632 にフィールドを足したあと初めて新 `analyze` を本番実行すること。
