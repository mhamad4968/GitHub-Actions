# Security NEXT 自動化 — 運用ランブック

> **正本**: 本ファイルは `AGENTS.md`（開発憲法）の下位ドキュメントである。矛盾がある場合は AGENTS.md が優先される。

---

## 1. API キー管理方針

### 1-1. Gemini API キー

| 項目 | 方針 |
|------|------|
| **保管場所** | GitHub Environment `kintone-collect` の Secret `GEMINI_API_KEY` |
| **ローカル** | `security-next-automation/.env` の `GEMINI_API_KEY=`（`.gitignore` 対象） |
| **有効範囲** | `collect.ts`（任意・体裁整形）、`analyze.ts`（必須・週次要約） |
| **未設定時の挙動** | collect: RSS 材料のみで 4 見出し構造を保証（`gemini=N`）。analyze: 実行失敗 |
| **モデル指定** | 環境変数 `GEMINI_MODEL`（Repository Variables 推奨）。空なら `GEMINI_MODEL_FALLBACKS` の先頭から順に試行 |
| **禁止モデル** | `gemini-2.0-flash`, `gemini-2.0-flash-lite`（2026-06 シャットダウン済み。AGENTS.md §7-3） |
| **ローテーション** | Google AI Studio でキーを再生成 → GitHub Secret と `.env` を即時更新。旧キーは無効化 |

### 1-2. kintone API トークン

| トークン Secret 名 | 用途 | 必要な kintone 権限 |
|---|---|---|
| `KINTONE_API_TOKEN_COLLECT` | `collect.ts` → App 631 | レコードの**閲覧** + **追加** |
| `KINTONE_API_TOKEN_ANALYZE` | `analyze.ts` → App 631 読み + App 632 書き | 631: **閲覧**、632: **閲覧** + **追加** + **編集** |
| `KINTONE_API_TOKEN` | 1 トークン運用のフォールバック | 上記すべて（631 閲覧+追加、632 閲覧+追加+編集） |

**解決優先順位**（`config.ts` の実装）:

```
collect: KINTONE_API_TOKEN_COLLECT → KINTONE_API_TOKEN
analyze: KINTONE_API_TOKEN_ANALYZE → KINTONE_API_TOKEN
```

### 1-3. その他のキー

| Secret / Variable | 用途 | 必須 |
|---|---|---|
| `KINTONE_DOMAIN` | `xxx.cybozu.com`（`https://` なし） | 必須 |
| `KINTONE_APP` (= `KINTONE_APP_ID`) | ニュースアプリ ID（631） | 必須 |
| `KINTONE_REPORT_APP_ID` | 週次要約アプリ ID（632） | analyze で必須 |
| `NVD_API_KEY` | NVD CVE 取得（`COLLECT_NVD_ENABLE=1` 時） | 任意 |
| `NOTIFY_WEBHOOK_URL` | 失敗時 Slack 通知 | 任意 |
| `NOTIFY_SUMMARY_WEBHOOK_URL` | 成功時サマリー Webhook | 任意 |
| `NOTIFY_EMAIL_TO` / `SMTP_*` | メール通知 | 任意 |

---

## 2. 環境変数マッピング

### 2-1. GitHub → ランタイムのマッピング

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Settings                                                │
│  ├── Environment: kintone-collect                               │
│  │   ├── Secrets                                                │
│  │   │   ├── KINTONE_DOMAIN          → env.KINTONE_DOMAIN       │
│  │   │   ├── KINTONE_APP             → env.KINTONE_APP_ID       │
│  │   │   ├── KINTONE_API_TOKEN_COLLECT → env.KINTONE_API_TOKEN  │
│  │   │   ├── KINTONE_API_TOKEN       → env.KINTONE_API_TOKEN    │
│  │   │   ├── GEMINI_API_KEY          → env.GEMINI_API_KEY       │
│  │   │   └── NOTIFY_*               → env.NOTIFY_*             │
│  │   └── (inherited from Repository Secrets)                    │
│  └── Repository Variables                                       │
│      ├── GEMINI_MODEL                → env.GEMINI_MODEL         │
│      └── COLLECT_MAX_NEW_PER_RUN     → env.COLLECT_MAX_NEW_PER_RUN │
└─────────────────────────────────────────────────────────────────┘
```

### 2-2. ローカル `.env` の対応

| `.env` キー | GitHub 上の対応 | 備考 |
|---|---|---|
| `KINTONE_DOMAIN` | Secret `KINTONE_DOMAIN` | |
| `KINTONE_APP_ID` | Secret `KINTONE_APP` | GitHub 側は `KINTONE_APP` |
| `KINTONE_REPORT_APP_ID` | Secret `KINTONE_REPORT_APP_ID` | analyze 用 |
| `KINTONE_API_TOKEN_COLLECT` | Secret `KINTONE_API_TOKEN_COLLECT` | |
| `GEMINI_API_KEY` | Secret `GEMINI_API_KEY` | |
| `GEMINI_MODEL` | Variable `GEMINI_MODEL` | 空なら FALLBACKS 先頭から |
| `COLLECT_SKIP_GEMINI_FORMAT` | （通常不要） | `1` で Gemini 抑止 |
| `COLLECT_FETCH_ARTICLE_BODY` | （通常不要） | `0` で記事本文取得を無効化 |
| `ANALYZE_EXISTING_WEEK_RECORD` | Variable | `update`(既定) / `skip` |

---

## 3. kintone アプリ権限マトリクス

### 3-1. App 631（Security NEXT ニュース — 収集）

| 操作 | collect.ts | analyze.ts | 管理者（手動） |
|------|:---:|:---:|:---:|
| **レコード閲覧** | **必須** (重複チェック) | **必須** (週次集約) | **必須** |
| **レコード追加** | **必須** | — | 任意 |
| **レコード編集** | — | — | 任意 |
| **レコード削除** | — | — | 任意 |
| **アプリ管理** | — | — | 任意 |
| **フォーム閲覧** | — | — | — |

### 3-2. App 632（ニュース週次要約 — 週次 LLM）

| 操作 | collect.ts | analyze.ts | 管理者（手動） |
|------|:---:|:---:|:---:|
| **レコード閲覧** | — | **必須** (Idempotency 確認) | **必須** |
| **レコード追加** | — | **必須** (新規週) | 任意 |
| **レコード編集** | — | **必須** (同一 target_week 更新) | 任意 |
| **レコード削除** | — | — | 任意 |
| **アプリ管理** | — | — | 任意 |
| **フォーム閲覧** | — | — | — |

### 3-3. 最小権限トークン構成（推奨）

```
Token A (KINTONE_API_TOKEN_COLLECT):
  └── App 631: 閲覧 + 追加

Token B (KINTONE_API_TOKEN_ANALYZE):
  ├── App 631: 閲覧
  └── App 632: 閲覧 + 追加 + 編集

Token C (KINTONE_API_TOKEN — 任意の補助用):
  ├── App 631: 閲覧
  └── App 632: 閲覧
```

---

## 4. エラー対応手順書

### 4-1. Gemini 404（モデル非存在）

**症状**: ログに `[Gemini体裁] model=xxx が利用不可（404 等）。次候補へ` が連続。全候補失敗で `gemini=N`。

**対処**:

1. [Gemini API モデル一覧](https://ai.google.dev/gemini-api/docs/models) で現在利用可能なモデル ID を確認
2. `format-news-gemini.ts` の `GEMINI_MODEL_FALLBACKS` を更新（3 層構成を維持: エイリアス → 安定版 → プレビュー版）
3. AGENTS.md §7-2 のモデル表を同時更新
4. `npm run typecheck --prefix security-next-automation` を通す
5. commit & push → 次回の定期実行で自動復旧

**緊急回避**: GitHub Variables の `GEMINI_MODEL` に利用可能な ID を設定（コード変更なしで先頭候補を差し替え）

### 4-2. Gemini 429（クォータ超過）

**症状**: ログに `[Gemini体裁] … 再試行` → 最終的に `gemini=I` or `gemini=N`

**対処**:

1. Google AI Studio でクォータ使用状況を確認
2. 一時的: `COLLECT_SKIP_GEMINI_FORMAT=1` を Variables に設定（RSS 材料のみで運用継続）
3. 恒久的: 課金プランへの移行、または `GEMINI_MODEL` をレートリミットが緩いモデルに変更

### 4-3. kintone 403（権限不足）

**症状**: `[status code: 403] Permission denied` でスクリプト中断

**対処**:

1. kintone 管理画面 → 対象アプリ → API トークン → 権限を確認
2. §3 の権限マトリクスと照合し、不足権限を付与
3. **注意**: Repository Secrets だけでなく **Environment `kintone-collect` の Secrets** に登録されているか確認（Environment 指定のジョブは Repository Secrets を参照できない場合がある）

### 4-4. kintone 520 / タイムアウト

**症状**: `ETIMEDOUT` または `status 520`

**対処**:

1. kintone のメンテナンス情報を確認: [cybozu.co.jp/status/](https://status.cybozu.co.jp/)
2. 一時的な場合: GitHub Actions を手動で Re-run
3. 継続する場合: `KINTONE_DOMAIN` が正しいか確認

### 4-5. フィールド欠落（手動確認）

**症状**: `collect` / `analyze` が kintone のフィールド不一致で失敗する、または設計と本番フォームがずれている。

**対処**（AGENTS.md §10-3 準拠）:

1. `field-codes.ts` で期待フィールドを確認
2. `npm run app:fields 631` / `632` で本番フォームを取得して突合する
3. kintone MCP `kintone-add-form-fields` で不足フィールドを追加
4. `kintone-deploy-app` でデプロイ
5. `kintone-get-app-deploy-status` で成功確認
6. `kintone-apps.md` に変更を反映してコミット

---

## 5. 成功定義

### 5-1. collect（日次ニュース収集）

| チェック項目 | 成功条件 |
|---|---|
| プロセス終了 | exit code = 0 |
| Pipeline ログ | `[Pipeline] Step: KintonePost, Added=N` (N >= 0) |
| kintone 書き込み | `登録完了。今回追加した件数: N` |
| メタデータ | 全レコードに `internal_source`, `internal_gemini_mark`, `internal_severity_tier` が非空 |
| 例外枠 | `ExceptionPick` ステップが出た場合、`Added <= 3` かつ合計 <= 6 |
| Webhook | `NOTIFY_SUMMARY_WEBHOOK_URL` 設定時、サマリーが送信された |

### 5-2. analyze（週次要約）

| チェック項目 | 成功条件 |
|---|---|
| プロセス終了 | exit code = 0 |
| kintone 書き込み | 632 に `target_week` = 当該月曜日のレコードが存在 |
| Idempotency | 同一 `target_week` で再実行しても重複レコードなし |
| エビデンス | `internal_ref_news_count`, `internal_ref_record_id_min/max`, `internal_analysis_run_at`, `internal_github_run_id` が非空 |

---

## 6. Gemini モデルフォールバック構成（正本: `format-news-gemini.ts`）

```
試行順:
  1. env.GEMINI_MODEL（設定時のみ先頭に挿入）
  2. gemini-flash-latest       ← 第1層: エイリアス
  3. gemini-2.5-flash           ← 第2層: 安定版
  4. gemini-2.5-flash-lite      ← 第2層: 安定版（軽量）
  5. gemini-pro-latest          ← 第1層: エイリアス（Pro）
  6. gemini-3.1-flash-preview   ← 第3層: プレビュー版

全候補が 404 → RSS 材料フォールバック（4見出し構造は保証）
全候補が 404 かつ Gemini キーあり → 「見解」のみ再試行（formatDigestInsightOnly）
```

---

## 付録: ワークフロースケジュール

| ワークフロー | cron (UTC) | JST | 頻度 |
|---|---|---|---|
| `daily-collect.yml` | `0 1 * * *`, `0 8 * * *` | 10:00, 17:00 | 毎日 2 回 |
| `main.yml` (analyze) | `0 11 * * 5` | 金曜 20:00 | 毎週 1 回 |
