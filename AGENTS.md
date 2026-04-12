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
| Gemini モデル候補（正本） | `security-next-automation/src/lib/format-news-gemini.ts` の `GEMINI_MODEL_FALLBACKS` |
| 本憲法のルール解釈 | 本ファイルが最上位。矛盾がある場合は本ファイルが優先される |

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

## 7. 【防衛線 1】AI モデル生存戦略（モデル信頼性）

> **教訓**: 2026-04 に `gemini-2.0-flash` が 404 を返し、collect / analyze の全記事が Gemini 非通過になった。

### 7-1. 単一モデル依存の禁止

- **単一モデル ID への直接依存を禁止する。** `collect.ts` / `analyze.ts` を含む全 Gemini 呼び出しは、`format-news-gemini.ts` の `geminiModelCandidates()` を経由し、**3 層以上のフォールバック構成**で実行すること。
- 環境変数 `GEMINI_MODEL` は「追加の先頭候補」として扱い、**空でもフォールバック配列で動作する**設計を維持する。

### 7-2. フォールバック配列の構成ルール

`GEMINI_MODEL_FALLBACKS` は以下の 3 層を必ず含むこと:

| 層 | 役割 | 例 |
|----|------|-----|
| **第 1 層: エイリアス** | Google が背後モデルを自動更新。ID 変更による 404 を長期的に防ぐ | `gemini-flash-latest`, `gemini-pro-latest` |
| **第 2 層: 安定版** | 現行世代の固定 ID。エイリアスが一時的に不安定な場合のセーフティネット | `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| **第 3 層: プレビュー版** | 次世代の先行版。安定版がサンセットされた直後の橋渡し | `gemini-3.1-flash-preview` |

### 7-3. 廃止モデルの取り扱い

- **`gemini-2.0-flash` および `gemini-2.0-flash-lite` は使用禁止**（2026-06-01 完全シャットダウン済み）。
- 新モデルの追加・旧モデルの除去は、[Gemini API モデル一覧](https://ai.google.dev/gemini-api/docs/models) を確認し、`GEMINI_MODEL_FALLBACKS` と本セクションを **同時に** 更新すること。

### 7-4. 404 発生時の行動規定

1. ログに `[Gemini体裁] model=xxx が利用不可（404 等）。次候補へ` が出たら、**全候補が失敗するまで自動フォールバック**する（実装済み）。
2. **全候補失敗**（`gemini=N`）が 2 日連続で発生した場合: GitHub Actions のログを確認し、`GEMINI_MODEL_FALLBACKS` を [モデル一覧](https://ai.google.dev/gemini-api/docs/models) と照合して更新する。
3. RSS 材料フォールバック（`gemini=N`）でも **4 見出し構造は保証される**（`buildRssMaterialSummaryDigest`）。

---

## 8. 【防衛線 2】ニュース収集の「説明責任」ルール（監査性）

> **原則**: 631 に保存される全レコードは、**なぜその記事が選定されたか**を事後追跡できなければならない。

### 8-1. メタデータ保存の必須化

`collect.ts` が 631 にレコードを追加する際、以下のフィールドへの書き込みは**省略不可**:

| フィールドコード | 型 | 内容 | 省略時の扱い |
|---|---|---|---|
| `match_keywords_display` | 文字列（1行） | マッチした `INCIDENT_KEYWORDS` のカンマ区切り | 空文字（ログに警告） |
| `internal_match_meta_json` | 複数行テキスト | `{ matched, source, severity, gemini, needsReview }` の JSON | 空 JSON `{}` |
| `internal_source` | 文字列（1行） | `"rss"` または `"nvd"` | **必須**（不明なら `"unknown"`） |
| `internal_gemini_mark` | 文字列（1行） | `"Y"` / `"I"` / `"N"` | **必須** |
| `internal_severity_tier` | 文字列（1行） | `"normal"` / `"exception"` | `"normal"` |

### 8-2. 品質フラグ `needs_review` の条件定義

`needs_review`（チェックボックス「要レビュー」）は以下の **複合条件** で自動セットする。`gemini=N` **単独では立てない**（RSS フォールバックでも十分なケースを排除しない）:

```
needs_review = true  ←→  (gemini_mark ≠ "Y")
                          AND 以下のいずれか 1 つ以上:
                            ・digest の実テキストが 60 文字未満
                            ・digestContainsBannedBoilerplate() が非 null
                            ・タイトルに PII パターン（個人情報|氏名|住所|電話番号|メールアドレス）
```

**運用**: kintone の一覧ビューで `needs_review = 要レビュー` のフィルタを作成し、週次で管理者が目視確認する。

### 8-3. キーワード変更の手続き

`INCIDENT_KEYWORDS` / `EXCLUSION_KEYWORDS` / `SEVERITY_EXCEPTION_PATTERNS` を変更する場合:

1. `collect.ts` のコード修正
2. `.cursor/rules/kintone.mdc` のキーワード一覧を同期
3. 本ファイル §9 の例外パターン表を同期
4. `typecheck` を通す
5. **変更理由をコミットメッセージに明記**する（`fix(keywords): add "XXX" to INCIDENT_KEYWORDS for YYY`）

---

## 9. 【防衛線 3】重要ニュースの「特権枠」管理（重大性ガードレール）

> **「重大だから全部入れる」指示をそのままコードにしないこと。** RSS が荒れた日に kintone API 上限・通知・一覧がパンクするのを防ぐ。

### 9-1. 枠の定義（ハードコード・環境変数で上書き不可）

| 枠 | 上限 | 変更するなら |
|----|------|-------------|
| **通常枠**（1 実行あたり） | **3 件** (`TOP_N`) | 設計レビュー必須 |
| **例外枠**（1 暦日 JST あたり） | **3 件** (`EXCEPTION_MAX_PER_DAY`) | **本憲法の改訂が必要** |
| **日次ハード上限**（通常＋例外の合計） | **6 件** (`HARD_DAILY_TOTAL_MAX = TOP_N + EXCEPTION_MAX_PER_DAY`) | **本憲法の改訂が必要** |

### 9-2. 例外枠の発動条件（AND 条件グループの OR）

タイトル＋抜粋に対し、**各グループの全語を含む**場合に例外扱い:

| # | キーワード AND 条件 | 想定シナリオ |
|---|---------------------|-------------|
| 1 | `ランサム` AND `国内` | 国内企業のランサムウェア被害 |
| 2 | `ランサム` AND `被害` | ランサムウェア被害報道 |
| 3 | `ランサム` AND `攻撃` | ランサムウェア攻撃速報 |
| 4 | `不正アクセス` AND `流出` | 不正アクセスによる情報流出 |
| 5 | `不正アクセス` AND `漏洩` | 不正アクセスによる情報漏洩 |
| 6 | `ゼロデイ` AND `悪用` | ゼロデイ脆弱性の悪用確認 |

**パターンの追加は §8-3 のキーワード変更手続きに従うこと。** OR の羅列を増やしすぎないこと（誤検知 = 例外枠浪費）。

### 9-3. ダブルキー論理（二重安全弁）

```
1. 通常枠の候補を TOP_N 件選出
2. kintone を照会し、当日（JST）の exception レコード数を取得
3. 例外枠残 = max(0, EXCEPTION_MAX_PER_DAY − 当日 exception 数)
4. 通常枠に漏れた候補から例外条件合致分を 例外枠残 の範囲で追加
5. 合計が HARD_DAILY_TOTAL_MAX を超えたら例外側を切り詰め
```

このフローにより、**通常枠を消費せずに例外だけ膨らむ**ことも、**例外が通常枠を侵食する**ことも防ぐ。

---

## 10. 【防衛線 4】ヘルスチェックの「完全性」定義（総体整合性）

> **「API に接続できる」だけでは健全とみなさない。** フィールド定義が期待と一致して初めて「正常」。

### 10-1. ヘルスチェックの成功条件

`space-health-report.mjs` が「OK」を返すには、以下の **全て** を満たすこと:

| チェック項目 | 方法 | NG 時の扱い |
|---|---|---|
| **API 接続** | `app.json` または `records.json` フォールバック | `allOk = false` |
| **スキーマ検証**（フィールド完全性） | `form/fields.json` で `expectedFields` 全件の存在を確認 | `allOk = false`、欠落フィールド名をレポートに列挙 |

### 10-2. 期待フィールド定義（正本）

| アプリ | フィールド数 | 正本ファイル |
|--------|------------|-------------|
| **631**（ニュース） | **11 フィールド**: `title`, `article_url`, `published_date`, `summary`, `digest`, `match_keywords_display`, `internal_match_meta_json`, `internal_source`, `internal_gemini_mark`, `needs_review`, `internal_severity_tier` | `field-codes.ts` の `NEWS_FIELDS` |
| **632**（週次要約） | **8 フィールド**: `target_week`, `weekly_trend`, `summary_one_line`, `internal_ref_news_count`, `internal_ref_record_id_min`, `internal_ref_record_id_max`, `internal_analysis_run_at`, `internal_github_run_id` | `field-codes.ts` の `REPORT_FIELDS` |

### 10-3. フィールド欠落時の自己修復フロー

フィールド欠落を検知した場合、以下の優先順位で対応する:

```
1. [自動] space-health-report が「**欠落N件**: field_a, field_b」をレポートに出力
2. [自動] GitHub Actions ジョブが exit 1 で失敗（通知トリガー）
3. [AI提案] エージェントは kintone MCP の kintone-add-form-fields を使い、
   field-codes.ts の定義に基づいて不足フィールドを追加する修復案を提示する
4. [AI実行] 管理者の承認後（または自律実行指示があれば即時）:
   a. kintone-add-form-fields で追加
   b. kintone-deploy-app でデプロイ
   c. kintone-get-app-deploy-status で成功確認
   d. space-health-report を再実行して全件 OK を確認
5. [記録] 修復内容を kintone-apps.md に反映し、コミット
```

### 10-4. Space 48 ダッシュボードとの同期

- `space-health-report.mjs` の `DEFAULT_APPS` に含まれるアプリは、**Space 48 のダッシュボードテーブルにも必ず行を持つ**こと。
- アプリを追加・削除した場合は、`DEFAULT_APPS` と Space 48 ボディの **両方** を更新する。

---

## 11. 632 週次（フェーズ1 実装済みの要点）

- **`target_week`（月曜の日付）**をキーに、既存レコードがあれば **更新**、なければ **追加**（環境変数 `ANALYZE_EXISTING_WEEK_RECORD=skip` で「既存ならスキップ」も可）。
- **表示用**: `summary_one_line`。**内部用**: `internal_ref_*`・`internal_analysis_run_at`・`internal_github_run_id`（一覧では非表示推奨）。
- 632 にフィールドを足したあと初めて新 `analyze` を本番実行すること。

---

## 付録: 設計ドキュメントへのリンク

| ドキュメント | パス |
|---|---|
| Phase 2 設計（631 メタデータ・例外枠・品質フラグ） | [`docs/phase2-631-collect-improvements.md`](docs/phase2-631-collect-improvements.md) |
| メンテナンスプレイブック | [`docs/maintenance-template.md`](docs/maintenance-template.md) |
| 631 フィールド設計 CSV | [`security-next-automation/docs/security-next-news-app-design.csv`](security-next-automation/docs/security-next-news-app-design.csv) |
| 632 フィールド設計 CSV | [`security-next-automation/docs/security-next-weekly-report-app-design.csv`](security-next-automation/docs/security-next-weekly-report-app-design.csv) |
