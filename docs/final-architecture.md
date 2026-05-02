# Security NEXT 自動化 — 最終システム構成図

> **2026 年 4 月版 — Phase 1〜3 完遂**
>
> 本ドキュメントはプロジェクト全フェーズの成果物を俯瞰する最終アーキテクチャである。

---

## 1. システム全体構成

```mermaid
graph TB
    subgraph "外部データソース"
        RSS["Security NEXT RSS<br/>security-next.com/feed"]
        NVD["NVD CVE API<br/>(任意)"]
        GEMINI["Google Gemini API<br/>3層フォールバック"]
    end

    subgraph "GitHub Actions (CI/CD)"
        COLLECT["daily-collect.yml<br/>毎日 10:00/17:00 JST"]
        ANALYZE["main.yml → analyze<br/>毎週金曜 20:00 JST"]
    end

    subgraph "実行スクリプト"
        CTS["collect.ts<br/>ニュース収集"]
        ATS["analyze.ts<br/>週次要約"]
    end

    subgraph "kintone (SaaS)"
        APP631["App 631<br/>Security NEXT ニュース<br/>11フィールド"]
        APP632["App 632<br/>ニュース週次要約<br/>8フィールド"]
        SPACE48["Space 48<br/>システム推進室<br/>ダッシュボード"]
    end

    subgraph "通知"
        WEBHOOK["Slack/Teams Webhook"]
        EMAIL["メール通知"]
    end

    RSS --> COLLECT
    NVD --> COLLECT
    COLLECT --> CTS
    CTS -->|"閲覧+追加"| APP631
    CTS --> GEMINI

    ANALYZE --> ATS
    ATS -->|"閲覧"| APP631
    ATS -->|"追加+編集"| APP632
    ATS --> GEMINI

    CTS --> WEBHOOK
    CTS --> EMAIL
    ATS --> WEBHOOK
```

---

## 2. collect.ts 内部パイプライン

```mermaid
flowchart LR
    A[RSS取得] --> B[NVD取得<br/>任意]
    B --> C[マージ+ソート<br/>日付降順]
    C --> D[URL重複排除]
    D --> E[kintone既存<br/>フィルタ]
    E --> F[キーワード選別<br/>INCIDENT/EXCLUSION]
    F --> G[通常枠選出<br/>TOP_N=3件]
    G --> H{例外条件<br/>合致?}
    H -->|Yes| I[例外枠追加<br/>最大3件/日]
    H -->|No| J[通常枠のみ]
    I --> K[ハードリミット<br/>合計≤6件/日]
    J --> K
    K --> L[Gemini体裁<br/>3層フォールバック]
    L --> M[メタデータ付与<br/>§8準拠]
    M --> N[品質フラグ<br/>needs_review]
    N --> O[kintone POST<br/>App 631]
    O --> P[通知]
```

---

## 3. Gemini モデルフォールバック（§7）

```mermaid
flowchart TD
    ENV["env.GEMINI_MODEL<br/>(設定時のみ)"]
    L1A["gemini-flash-latest<br/>第1層: エイリアス"]
    L2A["gemini-2.5-flash<br/>第2層: 安定版"]
    L2B["gemini-2.5-flash-lite<br/>第2層: 安定版(軽量)"]
    L1B["gemini-pro-latest<br/>第1層: エイリアス(Pro)"]
    L3["gemini-3.1-flash-preview<br/>第3層: プレビュー"]
    FB["RSS材料フォールバック<br/>4見出し構造保証"]
    INS["見解のみ再試行<br/>formatDigestInsightOnly"]

    ENV -->|404| L1A
    L1A -->|404| L2A
    L2A -->|404| L2B
    L2B -->|404| L1B
    L1B -->|404| L3
    L3 -->|404| FB
    FB --> INS

    ENV -->|成功| OK["gemini=Y"]
    L1A -->|成功| OK
    L2A -->|成功| OK
    L2B -->|成功| OK
    L1B -->|成功| OK
    L3 -->|成功| OK
    INS -->|成功| OKI["gemini=I"]
    INS -->|失敗| OKN["gemini=N"]

    style ENV fill:#e3f2fd
    style FB fill:#fff3e0
    style OK fill:#e8f5e9
    style OKI fill:#fff8e1
    style OKN fill:#ffebee
```

---

## 4. 例外枠ダブルキー論理（§9）

```mermaid
flowchart TD
    START["キーワード合致候補"]
    NORMAL["通常枠: TOP_N=3件<br/>日付新しい順"]
    REMAIN["残り候補"]
    CHECK["例外条件判定<br/>6パターン AND条件"]
    QUERY["kintone照会<br/>当日exception数"]
    BUDGET["例外枠残<br/>= max(0, 3 - 当日数)"]
    PICK["例外枠選出<br/>≤ 残りバジェット"]
    CAP["ハードリミット確認<br/>通常+例外 ≤ 6"]
    RESULT["最終登録リスト"]

    START --> NORMAL
    START --> REMAIN
    REMAIN --> CHECK
    CHECK -->|合致| QUERY
    CHECK -->|非該当| SKIP["除外"]
    QUERY --> BUDGET
    BUDGET --> PICK
    NORMAL --> CAP
    PICK --> CAP
    CAP --> RESULT

    style NORMAL fill:#e8f5e9
    style PICK fill:#fff3e0
    style CAP fill:#ffebee
```

---

## 5. フォーム検証（§10・手動）

定期の `space-health-report` 自動化は **廃止**。フィールドの正は **`npm run app:fields`** と `field-codes.ts` の突合、および `kintone-apps.md` のアプリ台帳で担保する。

---

## 6. フェーズ別成果物マップ

```mermaid
mindmap
  root((Security NEXT<br/>自動化))
    Phase 1 — 632 信頼性
      analyze.ts Idempotency
      target_week upsert
      エビデンスフィールド
        internal_ref_news_count
        internal_ref_record_id_min/max
        internal_analysis_run_at
        internal_github_run_id
      summary_one_line
    Phase 2 — 631 説明責任
      メタデータ保存
        match_keywords_display
        internal_match_meta_json
        internal_source
        internal_gemini_mark
      例外枠ロジック
        SEVERITY_EXCEPTION_PATTERNS
        EXCEPTION_MAX_PER_DAY=3
        HARD_DAILY_TOTAL_MAX=6
        ダブルキー論理
      品質フラグ
        needs_review
        internal_severity_tier
        computeNeedsReview
    Phase 3 — 運用体系化
      AGENTS.md 4つの防衛線
        §7 AIモデル生存戦略
        §8 説明責任ルール
        §9 特権枠管理
        §10 ヘルスチェック完全性
      docs/runbook-security-next.md
        APIキー管理方針
        環境変数マッピング
        権限マトリクス
        エラー対応手順書
        成功定義
      統合テスト
        integration-defense-lines.ts
        43テスト全件合格
      kintone.mdc 同期
      Space 48 ダッシュボード統合
```

---

## 7. ファイル構成（Phase 1-3 成果物）

```
GitHub-Actions/
├── AGENTS.md                          ← 開発憲法（4つの防衛線）
├── kintone-apps.md                    ← アプリ正本カタログ
├── .cursor/rules/
│   ├── kintone.mdc                    ← 防衛線準拠の補足ルール
│   ├── kintone-javascript.mdc
│   └── snyk-security.mdc
├── .github/workflows/
│   ├── daily-collect.yml              ← 日次収集（10:00/17:00 JST）
│   └── main.yml                       ← 週次要約（金曜 20:00 JST）
├── scripts/
│   └── （各種メンテ・デプロイスクリプト）
├── docs/
│   ├── final-architecture.md          ← 本ファイル
│   ├── runbook-security-next.md       ← 運用ランブック（Phase 3）
│   ├── phase2-631-collect-improvements.md
│   └── maintenance-template.md
└── security-next-automation/
    ├── README.md
    ├── src/
    │   ├── collect.ts                 ← 日次収集（Phase 2 強化済み）
    │   ├── analyze.ts                 ← 週次要約（Phase 1 強化済み）
    │   ├── lib/
    │   │   ├── field-codes.ts         ← フィールドコード正本
    │   │   ├── format-news-gemini.ts  ← Gemini 3層フォールバック
    │   │   ├── collect-enrich.ts      ← 体裁+品質フラグ
    │   │   ├── collect-pipeline.ts    ← パイプラインログ
    │   │   └── ...
    │   └── __tests__/
    │       └── integration-defense-lines.ts  ← 43件の防衛線テスト
    └── docs/
        ├── security-next-news-app-design.csv
        └── security-next-weekly-report-app-design.csv
```

---

## 8. kintone アプリフィールド構成

### App 631 — Security NEXT ニュース（11 フィールド）

| # | フィールドコード | 型 | Phase | 用途 |
|---|---|---|---|---|
| 1 | `title` | SINGLE_LINE_TEXT | 初期 | 記事タイトル |
| 2 | `article_url` | SINGLE_LINE_TEXT | 初期 | 記事 URL（重複判定キー） |
| 3 | `published_date` | DATE | 初期 | RSS 公開日（JST） |
| 4 | `summary` | MULTI_LINE_TEXT | 初期 | 概要（1-2 文） |
| 5 | `digest` | MULTI_LINE_TEXT | 初期 | 要約（4 見出し構造） |
| 6 | `match_keywords_display` | SINGLE_LINE_TEXT | Phase 2 | マッチキーワード（表示用） |
| 7 | `internal_match_meta_json` | MULTI_LINE_TEXT | Phase 2 | マッチ詳細 JSON（監査用） |
| 8 | `internal_source` | SINGLE_LINE_TEXT | Phase 2 | rss / nvd |
| 9 | `internal_gemini_mark` | SINGLE_LINE_TEXT | Phase 2 | Y / I / N |
| 10 | `needs_review` | CHECK_BOX | Phase 2 | 品質フラグ |
| 11 | `internal_severity_tier` | SINGLE_LINE_TEXT | Phase 2 | normal / exception |

### App 632 — ニュース週次要約（8 フィールド）

| # | フィールドコード | 型 | Phase | 用途 |
|---|---|---|---|---|
| 1 | `target_week` | DATE | Phase 1 | 対象週の月曜日（Idempotency キー） |
| 2 | `weekly_trend` | RICH_TEXT | 初期 | 今週の傾向と対策（HTML） |
| 3 | `summary_one_line` | SINGLE_LINE_TEXT | Phase 1 | 1 行サマリー（通知・ポータル用） |
| 4 | `internal_ref_news_count` | NUMBER | Phase 1 | 参照した 631 レコード数 |
| 5 | `internal_ref_record_id_min` | NUMBER | Phase 1 | 参照レコード $id 最小値 |
| 6 | `internal_ref_record_id_max` | NUMBER | Phase 1 | 参照レコード $id 最大値 |
| 7 | `internal_analysis_run_at` | DATETIME | Phase 1 | 実行日時 |
| 8 | `internal_github_run_id` | SINGLE_LINE_TEXT | Phase 1 | GitHub Actions Run ID |

---

## 9. 4 つの防衛線（AGENTS.md §7-§10）

| # | 防衛線 | 守るもの | 主な仕組み |
|---|--------|---------|-----------|
| §7 | AI モデル生存戦略 | モデル信頼性 | 3 層フォールバック、廃止モデル禁止、404 自動切替 |
| §8 | 説明責任ルール | 監査性 | メタデータ必須保存、`needs_review` 複合条件、キーワード変更手続き |
| §9 | 特権枠管理 | 重大性ガードレール | 例外枠 3 件/日、ハード上限 6 件/日、ダブルキー論理 |
| §10 | ヘルスチェック完全性 | 総体整合性 | API 接続 + スキーマ検証、自己修復フロー、Space 48 同期 |

---

## 10. プロジェクト完了宣言

本プロジェクトは 2026 年 4 月 12 日をもって全 3 フェーズを完遂した。

| フェーズ | 完了コミット | 内容 |
|----------|------------|------|
| Phase 1 | `d376782` | 632 Idempotency・エビデンスフィールド・1 行サマリー |
| Phase 2 | `0cf6eb5` | 631 メタデータ・例外枠・品質フラグ |
| Phase 2+ | `17e7960` | ヘルスチェックにフィールド検証を追加 |
| Phase 3a | `5a4d57c` | AGENTS.md 4 つの防衛線 |
| Phase 3b | `9d3034e` | ランブック・統合テスト（43 件合格） |
| Close | 本コミット | 憲法ロック・最終アーキテクチャ |

以降の変更は AGENTS.md の改訂手続きに従うこと。
