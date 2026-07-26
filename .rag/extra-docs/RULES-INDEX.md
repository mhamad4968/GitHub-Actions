# RULES-INDEX.md — AGENTS.md 逆引き索引

> 目的: AGENTS.md §1〜§44 を「いつ / どんな状況で参照するか」で素早く引けるようにする。
> 更新ルール: AGENTS.md にルールを追加・改訂したら本ファイルも同時に更新する（§43 WORKFLOW.md Phase 5 で記録）。
>
> **3階層（2026-05-21）**: **[`docs/constitution/00-rule-hierarchy.md`](docs/constitution/00-rule-hierarchy.md)** — 第1憲法 / 第2機械検証 / 第3 runbook。  
> **方式B 用語の単一窓**: **`.cursor/rules/mode-b-canonical.mdc`**（4AI定義・先頭4行テンプレ）。
>
> **ジャンル別読本（2026-07-11 lifecycle-v2）**: 長文回避用の分割版は **`docs/constitution/README.md`**（**17 ジャンル + 階層 + 4AI + 4 AI-KERNEL + META 25–28**）。索引で § を特定 → 該当ジャンル `.md` を Read → 必要時のみ `AGENTS.md` 正本。**3 入口機械正本**: [`data/cio-rule-entry-points.json`](data/cio-rule-entry-points.json) · **Desktop 早見**: `28-CONSTITUTION-GENRE-MAP.txt`。

> 更新: **2026-07-02** — §38-1 npm セキュリティ更新自律境界（浜田 GO）を AGENTS / WORKFLOW / backlog に反映

> **ルール最適化（2026-07-11）**: `.mdc` 発見 3 入口 — [`docs/runbooks/cio-rules-discovery-map.md`](docs/runbooks/cio-rules-discovery-map.md) · [`data/cio-rule-entry-points.json`](data/cio-rule-entry-points.json)（E1/E2/E3 · mandatory_reads）· 15 ジャンル [`data/cursor-rules-topic-index.json`](data/cursor-rules-topic-index.json) · 一括 verify `npm run verify:rules-optimization`。**AGENTS.md フロー図の `preflight-checklist.mdc alwaysApply` 表記は陳腐** — 正本 `.cursor/rules/preflight-checklist.mdc`（`alwaysApply: false` + globs）。

---

| 階層 | 代表ファイル | いつ |
|------|--------------|------|
| **第1 憲法** | `AGENTS.md` §1-2-3-4 §50-3-8 §50-3-11 / `part-A` 🎖️ / `mode-b-canonical.mdc` | 毎ターン・役割・報告 |
| **第2 機械** | `cio-four-ai-governance.mjs` / `cio:guard:*` / `verify:mode-b-zombie-docs` / `verify:mcp-four-ai-alignment` / `verify:mode-b-turn-head-canonical` / `verify:rule-hierarchy-prune` | commit・deploy・CI |
| **第3 runbook** | `docs/runbooks/cio-four-ai-governance.md` / `deepseek-pre-edit-gate.md` | コマンド手順 |
| **第3 runbook（A/B/C/D v2）** | [`session-lifecycle-v2.md`](docs/runbooks/session-lifecycle-v2.md) / [`push-deploy-quality-gates-v2.md`](docs/runbooks/push-deploy-quality-gates-v2.md) / [`checkpoint-handoff-template-v2.md`](docs/runbooks/checkpoint-handoff-template-v2.md) / [`ai-team-tool-routing-v2.md`](docs/runbooks/ai-team-tool-routing-v2.md) | WAKE→CLOSE / commit・push・deploy-gate / handoff テンプレ / MCP ルーティング |

> **RULES-INDEX 追記順（2026-06-21）**: 憲法 kernel は **19 → 20 → 23** の順で解釈。本表の A/B/C/D runbook 行は **索引追加のみ**で kernel 19/20/23 の本文を置換しない。

---

<!-- RULES-INDEX:CURSOR-RULES-AUTO:BEGIN -->

## Cursor ルール逆引き（自動生成・編集禁止）

**更新**: `npm run rules:sync-mdc-index`（2026-07-26 JST）

| トピック | ファイル | description（frontmatter） |
|----------|----------|---------------------------|
| 毎ターン・四行 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) | >- |
| 毎ターン・四行 | [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) | 方式B・固定4AI — 用語・四行テンプレ・役割の単一窓（AI読み込み最適化・2026-05-29） |
| 毎ターン・四行 | [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) | AGENTS.md §1-2-3-1 §35-7 §50-3-11 — 毎ターン先頭4行（正テンプレは mode-b-canonical.mdc）＋§1e |
| 毎ターン・四行 | [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) | AGENTS.md §35-1 §56-1a（TSB-024）— 違反＝失敗・CIO体制2者ダブルチェックの定義正本（常時想起） |
| 毎ターン・四行 | [`constitution-brief-card.mdc`](.cursor/rules/constitution-brief-card.mdc) | AGENTS.md §0 §3 §50 — 憲法薄型カード＋CIO三角＋MCP先出し（網羅版は Read） |
| 毎ターン・四行 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) | §35-7 規律先行＋各 customize deploy 前スタンプ（条件付きではなく機械＋常時想起） |
| 毎ターン・四行 | [`cio-18-zero-tolerance.mdc`](.cursor/rules/cio-18-zero-tolerance.mdc) | 18-重要確認 遵守ゼロ容認 — 毎ターン turn-start・編集前 strict gate・報告前 verify（2026-05-30 CEO命令） |
| 毎ターン・四行 | [`cio-report-min-format.mdc`](.cursor/rules/cio-report-min-format.mdc) | 論点9 — §1 先頭4行のリポ／PR 向け機械検証（B スコープ）とチャット先頭ブロックの正本参照 |
| 毎ターン・四行 | [`mode-b-mdc-canonical-linter.mdc`](.cursor/rules/mode-b-mdc-canonical-linter.mdc) | 方式B — .mdc 正本参照 + AI-KERNEL 4要素 Linter（2026-05-29 永久ロック） |
| セッション WAKE | [`autonomous-cold-start.mdc`](.cursor/rules/autonomous-cold-start.mdc) | Session Lifecycle v2 — L0 cold-start（正本 runbook へ集約） |
| セッション WAKE | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) | §35-1 / §56-1a / TSB-024 / §1-2-3-1（TSB-024 ゲート・`globs` 全リポ注入。常時 YAML true は cio-constitution.mdc のみ。網羅条文は AGENTS.md / c |
| セッション WAKE | [`session-read-ladder-two-phase.mdc`](.cursor/rules/session-read-ladder-two-phase.mdc) | セッション復元は二段階（事前準備A→本題確認B）＋ラダー正本を Read で取り込む（glob・常時想起は憲法カード等に委譲） |
| セッション WAKE | [`auto-read-by-topic.mdc`](.cursor/rules/auto-read-by-topic.mdc) | 確認ログ+マルチAI・CIOレポート毎ターン+§41一問+Read義務+役割分担（alwaysApply） |
| セッション CLOSE | [`session-boundary-close-gate.mdc`](.cursor/rules/session-boundary-close-gate.mdc) | 区切り語 → CLOSE 二段（partial / full）— Session Lifecycle v2 §6 |
| セッション CLOSE | [`session-close-execute-first.mdc`](.cursor/rules/session-close-execute-first.mdc) | 締め・チェック依頼 — 返答より先に実行（R23/R26 浜田 GO 2026-06-13） |
| セッション CLOSE | [`cio-session-close-git-gate.mdc`](.cursor/rules/cio-session-close-git-gate.mdc) | セッション締め B1/B4 — 先祖返り回避付き commit+push 必須（GO 待ち禁止） |
| セッション CLOSE | [`cio-deploy-ledger-gate.mdc`](.cursor/rules/cio-deploy-ledger-gate.mdc) | R21 — deploy 台帳整合（registry ↔ repo ↔ kintone-apps）— セッション締め必須 |
| handoff・bridge | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) | セッション切替時の引き継ぎ（人間5行テンプレ＋AIが handoff-log へ必ず追記して漏れ防止） |
| handoff・bridge | [`cio-handoff-export-validate-gate.mdc`](.cursor/rules/cio-handoff-export-validate-gate.mdc) | 第11層 — 15ターン export 荷造り漏れゲート（--validate-export） |
| handoff・bridge | [`cio-operating-loop.mdc`](.cursor/rules/cio-operating-loop.mdc) | CIO 運用の一本線（正シェル・朝ブリーフィング・軽検査・Desktop 同期の判断） |
| handoff・bridge | [`cio-context-dissolution-interlock.mdc`](.cursor/rules/cio-context-dissolution-interlock.mdc) | 3重インターロック型コンテキスト強制解体（15ターン・40k・Diffループ・export-handoff） |
| 案件クローズ | [`cio-project-closure-gate.mdc`](.cursor/rules/cio-project-closure-gate.mdc) | プロジェクト v1 完了・checkpoint/handoff 認識同期 — 浜田↔AI 事故防止（TSB-038 / R19） |
| Git履歴・先祖返り | [`cio-git-history-alignment-gate.mdc`](.cursor/rules/cio-git-history-alignment-gate.mdc) | 第12層拡張案2 — Git 履歴デグレード防止（verify:git-history-alignment） |
| kintone 実装 | [`kintone.mdc`](.cursor/rules/kintone.mdc) | kintone 周辺・ニュース収集・LLM 連係の補足（重要度判定・フィールド等） |
| kintone 実装 | [`kintone-javascript.mdc`](.cursor/rules/kintone-javascript.mdc) | kintone の JS カスタマイズ・API 連係（フィールド・保存先・レート制限・uploader・コマンド） |
| kintone 実装 | [`kintone-schema-trust.mdc`](.cursor/rules/kintone-schema-trust.mdc) | フィールド正本の優先順位・kintone.events.on 前の確認（迷子防止） |
| kintone 実装 | [`kintone-destructive-rest-guard.mdc`](.cursor/rules/kintone-destructive-rest-guard.mdc) | kintone REST の DELETE・全件入替・本番アプリ破壊級の前に dry-run＋CEO GO（2026-05-06 浜田承認） |
| kintone 実装 | [`cio-kintone-fields-gate.mdc`](.cursor/rules/cio-kintone-fields-gate.mdc) | 第11層 — kintone フィールドコード Linter（verify:kintone-fields） |
| kintone 実装 | [`cio-kintone-live-schema-gate.mdc`](.cursor/rules/cio-kintone-live-schema-gate.mdc) | 第12層拡張案1 — kintone 実機ライブスキーマ Linter（verify:kintone-live-schema） |
| customize deploy | [`constitutional-focus-kintone-customize.mdc`](.cursor/rules/constitutional-focus-kintone-customize.mdc) | AGENTS.md §35-7 §50-3-8 §52 — customize 編集・本番 deploy 時の追加想起（glob） |
| customize deploy | [`cio-composer-escalation-interlock.mdc`](.cursor/rules/cio-composer-escalation-interlock.mdc) | 方針1 — Composer verify 連続失敗時の DeepSeek 自律エスカレーション §50-3-11 第6層 |
| customize deploy | [`composer-mcp-audit-gate.mdc`](.cursor/rules/composer-mcp-audit-gate.mdc) | 方式B — Composer 2.5 必須 MCP 監査（eslint-mcp / repo-tree）§50-3-11 第4ステップ |
| customize deploy | [`preflight-checklist.mdc`](.cursor/rules/preflight-checklist.mdc) | deploy 前 preflight — 正本 cio-discipline-always + push-deploy-quality-gates-v2 |
| customize deploy | [`jikkou-yosan-v2-ui-chrome.mdc`](.cursor/rules/jikkou-yosan-v2-ui-chrome.mdc) | Ver.02 App756 UI クロム不変条件（overflow×sticky / th display / SPEC同一ターン） |
| MCP・ツール | [`mcp-server-use-triggers.mdc`](.cursor/rules/mcp-server-use-triggers.mdc) | MCP §50 — 先出し義務・1行トリガー表（descriptor は mcp-tool-discipline） |
| MCP・ツール | [`mcp-tool-discipline.mdc`](.cursor/rules/mcp-tool-discipline.mdc) | MCP descriptor 必読・認証順序・curl 優先度 + アイドル時間の有効活用（メンテ枠） |
| MCP・ツール | [`mcp-frontend-shadcn-chrome.mdc`](.cursor/rules/mcp-frontend-shadcn-chrome.mdc) | Shadcn UI MCP を必ず参照・Chrome DevTools MCP で事実確認・不明時は関連 MCP で先に調査（mcp.json 同期手順付き） |
| MCP・ツール | [`ai-agent-tools-constitution.mdc`](.cursor/rules/ai-agent-tools-constitution.mdc) | AIエージェント活用憲法（Rules for Tools）— 多AI協議・DDG/context7·Playwright·docs正本・禁止事項（2026-07-11 rules-opt）6 施行） |
| MCP・ツール | [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) | Cursor 内蔵 GenerateImage と assets/images/（画像 MCP 見送り・2026-05-21） |
| 4AI・DeepSeek | [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) | CIO×知恵袋の仕様確認分業（🎖️表の下位・予実など） |
| 4AI・DeepSeek | [`deepseek-pre-edit-gate.mdc`](.cursor/rules/deepseek-pre-edit-gate.mdc) | U4 — customize/SPEC/本番PUT の編集前に DeepSeek 1 問必須（CEO 2026-05-17） |
| 4AI・DeepSeek | [`cio-spec-logic-gate.mdc`](.cursor/rules/cio-spec-logic-gate.mdc) | 第9層 — SPEC.md 日本語論理矛盾 Linter §50-3-11 |
| doc-lane | [`doc-lane-gate.mdc`](.cursor/rules/doc-lane-gate.mdc) | R-DOC-01〜11 — doc-lane 自律資料作成（PPTX/DOCX/経営会議）— kintone deploy 混在禁止 |
| doc-lane | [`evening-reflection-scope.mdc`](.cursor/rules/evening-reflection-scope.mdc) | 夕反省（26）のスコープ — 失敗とミス削減のみ。未来の作業は当日に聞く。 |
| 環境・障害 | [`cio-env-integrity-gate.mdc`](.cursor/rules/cio-env-integrity-gate.mdc) | 改善案1 — 環境変数・MCP 秘密鍵セルフ監査 §50-3-11 第7層 |
| 環境・障害 | [`cio-env-self-healing-gate.mdc`](.cursor/rules/cio-env-self-healing-gate.mdc) | 第8層 — Self-Healing Env 暗号化復元 §50-3-11 |
| 環境・障害 | [`cio-weekend-rollback-gate.mdc`](.cursor/rules/cio-weekend-rollback-gate.mdc) | 第9層 — 週末自律修正自動ロールバック §50-3-11 |
| 環境・障害 | [`cio-error-ticket-gate.mdc`](.cursor/rules/cio-error-ticket-gate.mdc) | 改善案3 — 3択提案付き自律エラーチケット §50-3-11 第7層 |
| 環境・障害 | [`cio-error-ticket-apply-gate.mdc`](.cursor/rules/cio-error-ticket-apply-gate.mdc) | 第8層 — CEO 3択チケット自動承認・再駆動 §50-3-11 |
| 環境・障害 | [`cio-debug-tips-stock-gate.mdc`](.cursor/rules/cio-debug-tips-stock-gate.mdc) | 第9層 — 15ターン解体デバッグ知恵自動ストック §50-3-11 |
| セキュリティ | [`snyk-security.mdc`](.cursor/rules/snyk-security.mdc) | Snyk で生成・変更コードをスキャンする（Secure at Inception 相当） |
| セキュリティ | [`security-news-response.mdc`](.cursor/rules/security-news-response.mdc) | セキュリティニュースの説明・要約・整理を依頼されたときの出力形式と CVE 時の調査 |
| セキュリティ | [`security-training-materials.mdc`](.cursor/rules/security-training-materials.mdc) | 情報セキュリティ勉強会資料 — Word正本・12p PPT・連絡先禁止（R-SEC-01 / R-DOC-01） |
| CI・GitHub | [`constitutional-focus-github-workflows.mdc`](.cursor/rules/constitutional-focus-github-workflows.mdc) | AGENTS.md §18 §52-8 §35-1 — GitHub Actions / workflow 変更時の追加想起（glob） |
| CI・GitHub | [`cio-commit-msg-kimi-gate.mdc`](.cursor/rules/cio-commit-msg-kimi-gate.mdc) | 第11層 — Kimi コミット 4要素ブロック（prepare-commit-msg） |
| ドメイン特化・その他 | [`constitutional-focus-yojitsu.mdc`](.cursor/rules/constitutional-focus-yojitsu.mdc) | AGENTS.md §50-3-8 §41 §2 — 部署予実（yojitsu）テンプレ・SPEC 変更時の追加想起（glob） |
| ドメイン特化・その他 | [`modern-web-official-docs.mdc`](.cursor/rules/modern-web-official-docs.mdc) | Next.js・React・Tailwind・TypeScript・Supabase・Prisma・Firebase・OpenAI・LangChain・Lucide・Notion API のコード生成・設計時に、公式ドキュメント索引へ誘導す |
| ドメイン特化・その他 | [`next-session-jbis-followups.mdc`](.cursor/rules/next-session-jbis-followups.mdc) | 595・経理FAQまわりの次回フォロー（ユーザー依頼で次回に生かす提案） |
| ドメイン特化・その他 | [`file-copy-exact-path.mdc`](.cursor/rules/file-copy-exact-path.mdc) | ユーザーが指定したフォルダへファイルをコピーするときはその直下に置く |
| ドメイン特化・その他 | [`autonomous-with-mandatory-asks.mdc`](.cursor/rules/autonomous-with-mandatory-asks.mdc) | 開発は自律実行するが、確認が必要なら着手前に浜田へ聞く（浜田指示） |
| ドメイン特化・その他 | [`creation-timing-ask.mdc`](.cursor/rules/creation-timing-ask.mdc) | アプリ新規作成前に「今すぐ／後日」と配置先スペースを浜田へ確認。未決なら作成に着手しない（浜田指示 2026-04-28） |
| ドメイン特化・その他 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) | 恒久方針の永続化 — 正本は .rag/extra-docs/persist-policies.md |
| ドメイン特化・その他 | [`spec-round-ai-agreement.mdc`](.cursor/rules/spec-round-ai-agreement.mdc) | 仕様ラウンド無条件合意・依頼者リスト4見出し（#R-SPEC-01/#R-REQ-01） |
| ドメイン特化・その他 | [`constitution.mdc`](.cursor/rules/constitution.mdc) | 網羅統合版 — 憲法・索引・WORKFLOW・全mdc・予実・plans・chat・handoff・docs全（plans除く重複）・security-next・yojitsu README等（再生成=本スクリプト）。Cursor 常時枠の |
| （未分類） | [`ui-acceptance-smoke.mdc`](.cursor/rules/ui-acceptance-smoke.mdc) | UI変更の受け入れ条件と最小スモークを先に固定する |

索引: [`.cursor/rules/README.md`](.cursor/rules/README.md) / [`data/cursor-rules-topic-index.json`](data/cursor-rules-topic-index.json)

<!-- RULES-INDEX:CURSOR-RULES-AUTO:END -->

<!-- RULES-INDEX:SECTION-MDC-AUTO:BEGIN -->

## § ↔ .mdc 双方向索引（自動生成・編集禁止）

**更新**: `npm run rules:sync-section-mdc`（2026-07-11 JST）
**正本**: `AGENTS.md` § 解釈 / 機械: `data/rules-index-section-mdc-map.json`

### § → .mdc（抜粋）

| § | .mdc |
|---|------|
| §0 | [`constitution-brief-card.mdc`](.cursor/rules/constitution-brief-card.mdc) · [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) |
| §1 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`cio-report-min-format.mdc`](.cursor/rules/cio-report-min-format.mdc) · [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §1-2-2 | [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §1-2-3 | [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) |
| §1-2-3-1 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §1-2-3-3 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §1-2-3-4 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §1-2-3-4-A | [`cio-commit-msg-kimi-gate.mdc`](.cursor/rules/cio-commit-msg-kimi-gate.mdc) · [`cio-composer-escalation-interlock.mdc`](.cursor/rules/cio-composer-escalation-interlock.mdc) · [`cio-context-dissolution-interlock.mdc`](.cursor/rules/cio-context-dissolution-interlock.mdc) · [`cio-debug-tips-stock-gate.mdc`](.cursor/rules/cio-debug-tips-stock-gate.mdc) · [`cio-env-integrity-gate.mdc`](.cursor/rules/cio-env-integrity-gate.mdc) · [`cio-env-self-healing-gate.mdc`](.cursor/rules/cio-env-self-healing-gate.mdc) · [`cio-error-ticket-apply-gate.mdc`](.cursor/rules/cio-error-ticket-apply-gate.mdc) · [`cio-error-ticket-gate.mdc`](.cursor/rules/cio-error-ticket-gate.mdc) · [`cio-handoff-export-validate-gate.mdc`](.cursor/rules/cio-handoff-export-validate-gate.mdc) · [`cio-kintone-fields-gate.mdc`](.cursor/rules/cio-kintone-fields-gate.mdc) · [`cio-spec-logic-gate.mdc`](.cursor/rules/cio-spec-logic-gate.mdc) · [`cio-weekend-rollback-gate.mdc`](.cursor/rules/cio-weekend-rollback-gate.mdc) · [`composer-mcp-audit-gate.mdc`](.cursor/rules/composer-mcp-audit-gate.mdc) · [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`mcp-tool-discipline.mdc`](.cursor/rules/mcp-tool-discipline.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §1-2-3-4-C | [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) |
| §1-2-3-6 | [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §1-2-4 | [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §10 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) |
| §11 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`kintone-javascript.mdc`](.cursor/rules/kintone-javascript.mdc) |
| §13 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) |
| §15 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) |
| §16 | [`windows-cross-platform.mdc`](.cursor/rules/windows-cross-platform.mdc) |
| §16-1 | [`windows-cross-platform.mdc`](.cursor/rules/windows-cross-platform.mdc) |
| §18 | [`constitutional-focus-github-workflows.mdc`](.cursor/rules/constitutional-focus-github-workflows.mdc) |
| §2 | [`constitutional-focus-yojitsu.mdc`](.cursor/rules/constitutional-focus-yojitsu.mdc) |
| §26 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) |
| §3 | [`constitution-brief-card.mdc`](.cursor/rules/constitution-brief-card.mdc) |
| §30 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) |
| §31 | [`persist-policies.mdc`](.cursor/rules/persist-policies.mdc) |
| §34 | [`preflight-checklist.mdc`](.cursor/rules/preflight-checklist.mdc) |
| §35 | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §35-1 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`constitutional-focus-github-workflows.mdc`](.cursor/rules/constitutional-focus-github-workflows.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §35-6 | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) |
| §35-7 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`constitutional-focus-kintone-customize.mdc`](.cursor/rules/constitutional-focus-kintone-customize.mdc) · [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §36 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) |
| §37-1 | [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) |
| §38 | [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) |
| §41 | [`auto-read-by-topic.mdc`](.cursor/rules/auto-read-by-topic.mdc) · [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`constitutional-focus-yojitsu.mdc`](.cursor/rules/constitutional-focus-yojitsu.mdc) · [`creation-timing-ask.mdc`](.cursor/rules/creation-timing-ask.mdc) · [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §47-D | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §5 | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) |
| §50 | [`constitution-brief-card.mdc`](.cursor/rules/constitution-brief-card.mdc) · [`mcp-server-use-triggers.mdc`](.cursor/rules/mcp-server-use-triggers.mdc) |
| §50-3 | [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §50-3-10 | [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) |
| §50-3-11 | [`cio-commit-msg-kimi-gate.mdc`](.cursor/rules/cio-commit-msg-kimi-gate.mdc) · [`cio-composer-escalation-interlock.mdc`](.cursor/rules/cio-composer-escalation-interlock.mdc) · [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`cio-context-dissolution-interlock.mdc`](.cursor/rules/cio-context-dissolution-interlock.mdc) · [`cio-debug-tips-stock-gate.mdc`](.cursor/rules/cio-debug-tips-stock-gate.mdc) · [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`cio-env-integrity-gate.mdc`](.cursor/rules/cio-env-integrity-gate.mdc) · [`cio-env-self-healing-gate.mdc`](.cursor/rules/cio-env-self-healing-gate.mdc) · [`cio-error-ticket-apply-gate.mdc`](.cursor/rules/cio-error-ticket-apply-gate.mdc) · [`cio-error-ticket-gate.mdc`](.cursor/rules/cio-error-ticket-gate.mdc) · [`cio-handoff-export-validate-gate.mdc`](.cursor/rules/cio-handoff-export-validate-gate.mdc) · [`cio-kintone-fields-gate.mdc`](.cursor/rules/cio-kintone-fields-gate.mdc) · [`cio-kintone-live-schema-gate.mdc`](.cursor/rules/cio-kintone-live-schema-gate.mdc) · [`cio-spec-logic-gate.mdc`](.cursor/rules/cio-spec-logic-gate.mdc) · [`cio-weekend-rollback-gate.mdc`](.cursor/rules/cio-weekend-rollback-gate.mdc) · [`composer-mcp-audit-gate.mdc`](.cursor/rules/composer-mcp-audit-gate.mdc) · [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`every-turn-rules-confirm.mdc`](.cursor/rules/every-turn-rules-confirm.mdc) · [`mcp-tool-discipline.mdc`](.cursor/rules/mcp-tool-discipline.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §50-3-2 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) |
| §50-3-3 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §50-3-7 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §50-3-8 | [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) · [`cio-env-integrity-gate.mdc`](.cursor/rules/cio-env-integrity-gate.mdc) · [`cio-error-ticket-gate.mdc`](.cursor/rules/cio-error-ticket-gate.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`constitutional-focus-kintone-customize.mdc`](.cursor/rules/constitutional-focus-kintone-customize.mdc) · [`constitutional-focus-yojitsu.mdc`](.cursor/rules/constitutional-focus-yojitsu.mdc) · [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) · [`deepseek-pre-edit-gate.mdc`](.cursor/rules/deepseek-pre-edit-gate.mdc) · [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) |
| §50-3-9 | [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) |
| §51 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §51-6 | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §51-6-2 | [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §52 | [`constitutional-focus-kintone-customize.mdc`](.cursor/rules/constitutional-focus-kintone-customize.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §52-4 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §52-8 | [`constitutional-focus-github-workflows.mdc`](.cursor/rules/constitutional-focus-github-workflows.mdc) · [`kintone-destructive-rest-guard.mdc`](.cursor/rules/kintone-destructive-rest-guard.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §52-9 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §56-1 | [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) · [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) · [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) · [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §56-1a | [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) |
| §57 | [`session-handoff.mdc`](.cursor/rules/session-handoff.mdc) |
| §57-10 | [`mcp-server-use-triggers.mdc`](.cursor/rules/mcp-server-use-triggers.mdc) |
| §57-5 | [`mcp-tool-discipline.mdc`](.cursor/rules/mcp-tool-discipline.mdc) |
| §6 | [`mode-b-canonical.mdc`](.cursor/rules/mode-b-canonical.mdc) · [`session-boundary-close-gate.mdc`](.cursor/rules/session-boundary-close-gate.mdc) |
| §9 | [`kintone-javascript.mdc`](.cursor/rules/kintone-javascript.mdc) |

### .mdc → §（抜粋）

| .mdc | § |
|------|---|
| [`ai-agent-tools-constitution.mdc`](.cursor/rules/ai-agent-tools-constitution.mdc) | §(RULES-INDEX行) |
| [`auto-read-by-topic.mdc`](.cursor/rules/auto-read-by-topic.mdc) | §41 |
| [`autonomous-cold-start.mdc`](.cursor/rules/autonomous-cold-start.mdc) | §(RULES-INDEX行) |
| [`autonomous-with-mandatory-asks.mdc`](.cursor/rules/autonomous-with-mandatory-asks.mdc) | §(RULES-INDEX行) |
| [`cio-18-zero-tolerance.mdc`](.cursor/rules/cio-18-zero-tolerance.mdc) | §(RULES-INDEX行) |
| [`cio-commit-msg-kimi-gate.mdc`](.cursor/rules/cio-commit-msg-kimi-gate.mdc) | §(RULES-INDEX行) · §1-2-3-4-A · §50-3-11 |
| [`cio-composer-escalation-interlock.mdc`](.cursor/rules/cio-composer-escalation-interlock.mdc) | §1-2-3-4-A · §50-3-11 |
| [`cio-constitution.mdc`](.cursor/rules/cio-constitution.mdc) | §(RULES-INDEX行) · §1 · §1-2-3-1 · §1-2-3-4 · §35-1 · §36 · §50-3-11 · §56-1 |
| [`cio-context-dissolution-interlock.mdc`](.cursor/rules/cio-context-dissolution-interlock.mdc) | §(RULES-INDEX行) · §1-2-3-4-A · §50-3-11 |
| [`cio-debug-tips-stock-gate.mdc`](.cursor/rules/cio-debug-tips-stock-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`cio-deploy-ledger-gate.mdc`](.cursor/rules/cio-deploy-ledger-gate.mdc) | §(RULES-INDEX行) |
| [`cio-discipline-always.mdc`](.cursor/rules/cio-discipline-always.mdc) | §10 · §11 · §35-7 · §36 · §50-3-11 · §50-3-2 · §50-3-8 |
| [`cio-env-integrity-gate.mdc`](.cursor/rules/cio-env-integrity-gate.mdc) | §1-2-3-4-A · §50-3-11 · §50-3-8 |
| [`cio-env-self-healing-gate.mdc`](.cursor/rules/cio-env-self-healing-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`cio-error-ticket-apply-gate.mdc`](.cursor/rules/cio-error-ticket-apply-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`cio-error-ticket-gate.mdc`](.cursor/rules/cio-error-ticket-gate.mdc) | §1-2-3-4-A · §50-3-11 · §50-3-8 |
| [`cio-git-history-alignment-gate.mdc`](.cursor/rules/cio-git-history-alignment-gate.mdc) | §(RULES-INDEX行) |
| [`cio-handoff-export-validate-gate.mdc`](.cursor/rules/cio-handoff-export-validate-gate.mdc) | §(RULES-INDEX行) · §1-2-3-4-A · §50-3-11 |
| [`cio-kintone-fields-gate.mdc`](.cursor/rules/cio-kintone-fields-gate.mdc) | §(RULES-INDEX行) · §1-2-3-4-A · §50-3-11 |
| [`cio-kintone-live-schema-gate.mdc`](.cursor/rules/cio-kintone-live-schema-gate.mdc) | §(RULES-INDEX行) · §50-3-11 |
| [`cio-operating-loop.mdc`](.cursor/rules/cio-operating-loop.mdc) | §(RULES-INDEX行) |
| [`cio-project-closure-gate.mdc`](.cursor/rules/cio-project-closure-gate.mdc) | §(RULES-INDEX行) |
| [`cio-report-min-format.mdc`](.cursor/rules/cio-report-min-format.mdc) | §1 |
| [`cio-session-close-git-gate.mdc`](.cursor/rules/cio-session-close-git-gate.mdc) | §(RULES-INDEX行) |
| [`cio-spec-logic-gate.mdc`](.cursor/rules/cio-spec-logic-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`cio-weekend-rollback-gate.mdc`](.cursor/rules/cio-weekend-rollback-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`composer-mcp-audit-gate.mdc`](.cursor/rules/composer-mcp-audit-gate.mdc) | §1-2-3-4-A · §50-3-11 |
| [`constitution-brief-card.mdc`](.cursor/rules/constitution-brief-card.mdc) | §(RULES-INDEX行) · §0 · §3 · §50 |
| [`constitution-enforcement-core.mdc`](.cursor/rules/constitution-enforcement-core.mdc) | §(RULES-INDEX行) · §35-1 · §38 · §41 · §56-1 · §56-1a |
| [`constitution-handoff-gate.mdc`](.cursor/rules/constitution-handoff-gate.mdc) | §(RULES-INDEX行) · §1-2-3-1 · §10 · §11 · §35 · §35-1 · §35-6 · §35-7 · §41 · §5 · §50-3-2 · §50-3-8 · §51-6 · §51-6-2 · §56-1 |
| [`constitution.mdc`](.cursor/rules/constitution.mdc) | §(RULES-INDEX行) |
| [`constitutional-focus-github-workflows.mdc`](.cursor/rules/constitutional-focus-github-workflows.mdc) | §18 · §35-1 · §52-8 |
| [`constitutional-focus-kintone-customize.mdc`](.cursor/rules/constitutional-focus-kintone-customize.mdc) | §35-7 · §50-3-8 · §52 |
| [`constitutional-focus-yojitsu.mdc`](.cursor/rules/constitutional-focus-yojitsu.mdc) | §2 · §41 · §50-3-8 |
| [`creation-timing-ask.mdc`](.cursor/rules/creation-timing-ask.mdc) | §(RULES-INDEX行) · §41 |
| [`cursor-generate-image-assets.mdc`](.cursor/rules/cursor-generate-image-assets.mdc) | §(RULES-INDEX行) · §0 · §1-2-2 · §1-2-3-4-A · §1-2-3-4-C · §1-2-4 · §41 · §50-3-11 |
| [`deepseek-cursor-spec-division.mdc`](.cursor/rules/deepseek-cursor-spec-division.mdc) | §(RULES-INDEX行) · §0 · §1-2-2 · §1-2-3-4-A · §1-2-4 · §50-3 · §50-3-10 · §50-3-11 · §50-3-2 · §50-3-8 · §50-3-9 |
| [`deepseek-pre-edit-gate.mdc`](.cursor/rules/deepseek-pre-edit-gate.mdc) | §(RULES-INDEX行) · §50-3-8 |
| [`doc-lane-gate.mdc`](.cursor/rules/doc-lane-gate.mdc) | §(RULES-INDEX行) |
| [`evening-reflection-scope.mdc`](.cursor/rules/evening-reflection-scope.mdc) | §(RULES-INDEX行) |

<!-- RULES-INDEX:SECTION-MDC-AUTO:END -->


<!-- RULES-INDEX:SECTION-GENRE-AUTO:BEGIN -->

## § ↔ ジャンル読本 双方向索引（自動生成・編集禁止）

**更新**: `npm run rules:sync-section-genre`（2026-07-11 JST）
**正本**: `AGENTS.md` § 解釈 / 機械: `data/constitution-section-genre-map.json`
**カタログ**: `data/constitution-genre-catalog.json`

> 本節は **索引専用**。矛盾時は **AGENTS.md** が正。手動表「ジャンル読本 早見」はフォールバック。

### § → ジャンル（抜粋）

| § | ジャンル読本 |
|---|-------------|
| §0 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`27-constitution-navigation-charter.md`](docs/constitution/27-constitution-navigation-charter.md) |
| §1 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) |
| §1-2 | [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-1 | [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-2 | [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-2-1 | [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-1 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-2 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-3 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-4 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-4-A | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-4-B | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-4-C | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-3-6 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-2-4 | [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) |
| §1-N | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) |
| §10 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11-2 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11-3 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11-4 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11-5 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §11-6 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §12 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §13 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §14 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §15 | [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) |
| §16 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §16-1 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §17 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §17-2 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §17-3 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §18 | [`04-environment-security.md`](docs/constitution/04-environment-security.md) |
| §19 | [`05-knowledge-rag.md`](docs/constitution/05-knowledge-rag.md) |
| §2 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) · [`26-formalization-lifecycle-charter.md`](docs/constitution/26-formalization-lifecycle-charter.md) |
| §20 | [`05-knowledge-rag.md`](docs/constitution/05-knowledge-rag.md) |
| §21 | [`05-knowledge-rag.md`](docs/constitution/05-knowledge-rag.md) |
| §22 | [`06-mcp-disaster-recovery.md`](docs/constitution/06-mcp-disaster-recovery.md) |
| §23 | [`06-mcp-disaster-recovery.md`](docs/constitution/06-mcp-disaster-recovery.md) |
| §24 | [`06-mcp-disaster-recovery.md`](docs/constitution/06-mcp-disaster-recovery.md) |
| §25 | [`06-mcp-disaster-recovery.md`](docs/constitution/06-mcp-disaster-recovery.md) |
| §26 | [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) |
| §27 | [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) |
| §28 | [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) |
| §29 | [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) |
| §3 | [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) |
| §30 | [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) |
| §31 | [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) |
| §32 | [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) |
| §33 | [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) |
| §33-A | [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) |
| §33-B | [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) |
| §34 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §34-1 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §34-3 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §35 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §35-1 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §35-5 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |
| §35-6 | [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) |

_他 107 件は `data/constitution-section-genre-map.json` を参照_

### ジャンル → §（抜粋）

| ジャンル | § |
|----------|---|
| [`00-rule-hierarchy.md`](docs/constitution/00-rule-hierarchy.md) | §(階層) |
| [`01-fundamentals.md`](docs/constitution/01-fundamentals.md) | §0 · §1 · §1-2-3 · §1-2-3-1 · §1-2-3-2 · §1-2-3-3 · §1-2-3-4 · §1-2-3-4-A … |
| [`02-kintone-development.md`](docs/constitution/02-kintone-development.md) | §4 · §5 · §5-5 · §6 · §7 · §8 |
| [`03-quality-engineering.md`](docs/constitution/03-quality-engineering.md) | §10 · §11 · §11-2 · §11-3 · §11-4 · §11-5 · §11-6 · §12 … |
| [`04-environment-security.md`](docs/constitution/04-environment-security.md) | §16 · §16-1 · §17 · §17-2 · §17-3 · §18 |
| [`05-knowledge-rag.md`](docs/constitution/05-knowledge-rag.md) | §19 · §20 · §21 |
| [`06-mcp-disaster-recovery.md`](docs/constitution/06-mcp-disaster-recovery.md) | §22 · §23 · §24 · §25 |
| [`07-frontend-web-quality.md`](docs/constitution/07-frontend-web-quality.md) | §26 · §27 · §28 · §29 · §30 |
| [`08-deliverables-architecture.md`](docs/constitution/08-deliverables-architecture.md) | §31 · §32 · §33 · §33-A · §33-B |
| [`09-human-autonomy-reporting.md`](docs/constitution/09-human-autonomy-reporting.md) | §34 · §34-1 · §34-3 · §35 · §35-1 · §35-5 · §35-6 · §35-7 … |
| [`10-session-operations.md`](docs/constitution/10-session-operations.md) | §42 · §42-2 · §42-2-1 · §42-2-2 · §42-2-3 · §42-2-4 · §42-2-5 · §42-2-6 … |
| [`11-professional-judgment.md`](docs/constitution/11-professional-judgment.md) | §47 · §47-3 · §47-8 · §47-9 · §47-A · §47-B · §47-C · §47-D … |
| [`12-mcp-usage.md`](docs/constitution/12-mcp-usage.md) | §50 · §50-2 · §50-3 · §50-3-1 · §50-3-10 · §50-3-11 · §50-3-2 · §50-3-3 … |
| [`13-parallel-session.md`](docs/constitution/13-parallel-session.md) | §51 · §51-2 · §51-3 · §51-4 · §51-5 · §51-6 · §51-6-2 |
| [`14-self-governance-safemode.md`](docs/constitution/14-self-governance-safemode.md) | §55 · §55-1 · §55-2 · §55-3 · §55-4 · §55-5 · §55-6 · §55-7 |
| [`15-raci-responsibility.md`](docs/constitution/15-raci-responsibility.md) | §52 · §52-1 · §52-2 · §52-3 · §52-4 · §52-5 · §52-6 · §52-7 … |
| [`16-amendment-process.md`](docs/constitution/16-amendment-process.md) | §57 · §57-1 · §57-10 · §57-2 · §57-3 · §57-4 · §57-5 · §57-6 … |
| [`17-four-ai-mode-b.md`](docs/constitution/17-four-ai-mode-b.md) | §1-2 · §1-2-1 · §1-2-2 · §1-2-2-1 · §1-2-3 · §1-2-3-1 · §1-2-3-2 · §1-2-3-3 … |
| [`25-constitution-no-replacement-charter.md`](docs/constitution/25-constitution-no-replacement-charter.md) | §57 |
| [`26-formalization-lifecycle-charter.md`](docs/constitution/26-formalization-lifecycle-charter.md) | §2 · §57 |
| [`27-constitution-navigation-charter.md`](docs/constitution/27-constitution-navigation-charter.md) | §0 |
| [`28-ceo-go-phases-charter.md`](docs/constitution/28-ceo-go-phases-charter.md) | §50-3-8 · §51 · §57 |

<!-- RULES-INDEX:SECTION-GENRE-AUTO:END -->

## ジャンル読本 早見（§ → ファイル）

| § の目安 | 読本（`docs/constitution/`） |
|----------|------------------------------|
| 体系図・レーン | [00-preamble.md](docs/constitution/00-preamble.md) |
| §0〜§3・モデル | [01-fundamentals.md](docs/constitution/01-fundamentals.md) |
| §4〜§8 | [02-kintone-development.md](docs/constitution/02-kintone-development.md) |
| §9〜§15 | [03-quality-engineering.md](docs/constitution/03-quality-engineering.md) |
| §16〜§18 | [04-environment-security.md](docs/constitution/04-environment-security.md) |
| §19〜§21・RAG | [05-knowledge-rag.md](docs/constitution/05-knowledge-rag.md) |
| §22〜§25 | [06-mcp-disaster-recovery.md](docs/constitution/06-mcp-disaster-recovery.md) |
| §26〜§30 | [07-frontend-web-quality.md](docs/constitution/07-frontend-web-quality.md) |
| §31〜§33 | [08-deliverables-architecture.md](docs/constitution/08-deliverables-architecture.md) |
| §34〜§41 | [09-human-autonomy-reporting.md](docs/constitution/09-human-autonomy-reporting.md) |
| §42〜§46 | [10-session-operations.md](docs/constitution/10-session-operations.md) |
| §47〜§49 | [11-professional-judgment.md](docs/constitution/11-professional-judgment.md) |
| §50 系 | [12-mcp-usage.md](docs/constitution/12-mcp-usage.md) |
| §51 系 | [13-parallel-session.md](docs/constitution/13-parallel-session.md) |
| §55・第18〜19章 | [14-self-governance-safemode.md](docs/constitution/14-self-governance-safemode.md) |
| §52・§56・Tier | [15-raci-responsibility.md](docs/constitution/15-raci-responsibility.md) |
| §57 | [16-amendment-process.md](docs/constitution/16-amendment-process.md) |
| （階層） | [00-rule-hierarchy.md](docs/constitution/00-rule-hierarchy.md) |
| §1-2-3-4・§50-3-11 | [17-four-ai-mode-b.md](docs/constitution/17-four-ai-mode-b.md) |
| 4AI 役割別ナビ | [18-ai-team-read-map.md](docs/constitution/18-ai-team-read-map.md) |
| 統制・2名チェック（AI-KERNEL） | [19-governance-four-ai-kernel.md](docs/constitution/19-governance-four-ai-kernel.md) |
| 15ターン・荷造り（AI-KERNEL） | [20-cost-token-defense-kernel.md](docs/constitution/20-cost-token-defense-kernel.md) |
| 週末監査（AI-KERNEL） | [21-autonomous-patrol-kernel.md](docs/constitution/21-autonomous-patrol-kernel.md) |
| エスカレ・3択（AI-KERNEL） | [22-error-handling-kernel.md](docs/constitution/22-error-handling-kernel.md) |
| 完了・認識同期（AI-KERNEL） | [23-project-closure-recognition-kernel.md](docs/constitution/23-project-closure-recognition-kernel.md) |
| 憲法非置換（META） | [25-constitution-no-replacement-charter.md](docs/constitution/25-constitution-no-replacement-charter.md) |
| ゲート寿命 L1–L5（META） | [26-formalization-lifecycle-charter.md](docs/constitution/26-formalization-lifecycle-charter.md) |
| 4層ナビ · 3入口（META） | [27-constitution-navigation-charter.md](docs/constitution/27-constitution-navigation-charter.md) · [`data/cio-rule-entry-points.json`](data/cio-rule-entry-points.json) |
| CEO GO G0–G3（META） | [28-ceo-go-phases-charter.md](docs/constitution/28-ceo-go-phases-charter.md) |
| Desktop 早見（28番） | `chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt` |

検証: `npm run constitution:verify-coverage` / `npm run verify:constitution-genre-kernels` / `npm run verify:cio-four-ai-governance`

---

## 🚀 タスク開始時に必ず参照

| ルール | 役割 |
|---|---|
| §0 | **RULES-INDEX 即答カード参照**（索引駆動の起点 / 「まず索引→該当 § を読む」を強制） |
| （Cursor）**`cio-operating-loop.mdc`** | **CIO 運用の一本線**（2026-05-02 / **2026-05-07: glob 化**）— **`chat-sessions/**` と `docs/reports/**` を編集・閲覧するターンで想起。正シェルは **`~/kintone-ai-lab`（WSL）**／朝は **`docs/reports/<JST日付>-morning-prep.md`**（無ければ先に **`npm run morning:ensure`**）→ **`desktop-ai-emergency-read-pack/09-READ-07.txt`** → 追徴なら **`npm run cio:quick-health`**（朝報検証同梱）／切替は **`constitution-handoff-gate.mdc`** + `NEW-SESSION-STARTER`「貼付単独で完走」／Read pack + `SESSION-READ-LADDER.md`／Desktop 後は **`npm run desktop:sync-and-verify`** |
| **`verify-ci-rule-integrity.mjs`** | **`alwaysApply: true` は最大 10 件**＋**`cio-constitution.mdc` が必ず常時 true**（2026-05-09 CIO 統合）。超過は CI **exit 2**。新規 `.mdc` は既定 **`alwaysApply: false` + `globs`**。 |
| （Cursor）**`mode-b-canonical.mdc`** | **方式B・4AI用語・先頭4行テンプレの単一窓**（2026-05-21）— 他 mdc はコピーせず参照 |
| （Cursor）**`cio-constitution.mdc`** | **CIO 統合憲法（唯一の `alwaysApply: true` 核・2026-05-09）** — デスクトップ正本・Multi-Agent 役割・§1 四行・§M-2・三重 hooks へのポインタ |
| （Cursor）**`constitution-brief-card.mdc`** | **薄型想起（glob 注入）**（2026-05-06）— CIO 三角・**MCP/スクリプト先出し**／網羅版 `constitution.mdc` は **必要時 Read**（常時枠は `cio-constitution.mdc` に集約） |
| （Cursor）**`constitution-enforcement-core.mdc`** | **違反＝失敗・ダブルチェック定義**（2026-05-06 / **glob 注入**）— **本体 CIO ＋ DeepSeek または Kimi** を第 2 者とする。**1 人チェック禁止**。**検証の 2 者**（完了宣言）・**仕様の言い切り**（未決→確定と言い換え禁止）。末尾に CEO 指示の全文を保持 |
| （Cursor）**`every-turn-rules-confirm.mdc`** | **毎ターン先頭** — **`[§1-2-3 ティア判定]`** → **`【適用憲法】` 1 行** → **`[🎖️]`** → **`[ルール確認]`**／**§1c**（該当時 **`[仕様状態:]`**・**`[検証2者:]`**）／**§1d**（先頭ブロック欠落の自己回復）／**行動前チェック**（編集・deploy 直前の § リスト＋方針） |
| （Cursor）**`kintone-destructive-rest-guard.mdc`** | **kintone DELETE・破壊級 REST**（2026-05-06 浜田承認）— **dry-run→チャット貼付→「この一覧で削除 GO」→`--apply`**。**`alwaysApply: false` + `globs`**。手順 **`docs/kintone-destructive-operations.md`** |
| （Cursor）**`constitutional-focus-kintone-customize.mdc`** | **glob: `customize/**`** — §35-7 §50-3-8 §52・`kintone-apps.md` の追加想起（**alwaysApply: false**） |
| （Cursor）**`constitutional-focus-yojitsu.mdc`** | **glob: `templates/yojitsu-budget-lite/**`** — §50-3-8 §41 §2 の追加想起（**alwaysApply: false**） |
| （Cursor）**`constitutional-focus-github-workflows.mdc`** | **glob: `.github/workflows/**`** — §18 §52-8 §35-1 の追加想起（**alwaysApply: false**） |
| （Cursor）**`mcp-server-use-triggers.mdc`** | **MCP サーバ選択（1 行トリガー）**＋**標準ツールだけで足りる前提禁止**（2026-05-02 / 2026-05-06）— GitHub・kintone 本番/開発/スペース・fetch・Tavily/DDG・Playwright・**shadcn-ui**・**chrome-devtools**・RAG・CVE/ニュース・markdownify・memory・sequential-thinking・OpenRouter（**`model` 必須**）。**descriptor 必読**は **`mcp-tool-discipline.mdc`**／**`MCPスキップ: 未接続` 貼付1行**は **`npm run mcp:chat-stamp`** または **sessionStart hook の `additional_context`**。**2026-07-26**: RAG 憲法 aide 試行 `docs/runbooks/rag-constitution-aide-trial.md`（`npm run rag:ingest:constitution-aide-trial`） |
| （Cursor）**`mcp-frontend-shadcn-chrome.mdc`** | **glob: `customize/**`・`*.tsx`・`*.jsx`**（2026-05-07）— **Shadcn UI MCP 優先**／**Chrome DevTools MCP** で FE 事実確認／**`mcp:sync-cursor-windows`**。チェックシートは **`SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 の 4a** |
| §1 / §1-2 / §1-2-2 / §1-2-3 / §1-2-3-1 / §1-2-3-2 / §1-2-3-3 / §1-2-4 | 役割定義 + **最適モデル原則 / Opus 4.7 デフォルト枠**（§1-2 / 2026-04-26 R-3 改定 = 「Opus 統一」を「最適モデル」に転換 / 浜田指示「絶対にこのモデルを使うというこだわりはしない」/ 別モデルへの常時切替・レビュー用サブエージェント禁止は維持 / 例外は §1-2）+ **API 制限到達時の自動フォールバック禁止**（§1-2-2 / N-3 / N-4 で 4 択 A-D 提示の枠組み + §1-2-2-1 Cursor IDE 必須設定 = Q1 で 4 → 8 項目 + Browser Protection ON + MCP Tools Protection ON + Monthly Limit $1000 / TSB-019 連動）+ **Opus 内モデル使い分け**（§1-2-3 / N-5 / 既定 Extra High / Max Thinking は §47-A 100% 証明・設計判断・複雑バグ修正のみ）+ **AI 自己宣言義務**（§1-2-3-1 / P5-5 / タスク冒頭で `[§1-2-3 ティア判定: Extra High/Max Thinking]` を 1 行明示 = 形骸化対策 / F-13 教訓）+ **AI 自律モデル選択原則**（§1-2-3-2 / R-3 / 3 段階 L1 Composer 2 / L2 Extra High / L3 Max Thinking / 1 秒判定フロー / 不可逆操作は L3 強制 / silent fallback と区別 = ティア宣言で証跡 / F-14 対策 = Max Thinking 59.4% → 20-30% 想定）+ **CIO によるモデル最終判断**（§1-2-3-3 / 2026-04-29 / 浜田 CIO が明示したティアは §1-2-3-2 に優先 / 未指定時は §1-2-3-1/2）+ **クレジット予算管理 改定**（§1-2-4 / P5-5 / 月予算 $200+$1000 引上げ / 3 系統 (Total/API/On-Demand) / 70-80-85-95% 4 段階自発警告 / Spending スクショ抽出 / 朝報 §0 統合 / TSB-018/TSB-021 連動）|
| §51 / §51-3 / §51-6 / §51-6-2 | **並列禁止 + セッション分割推奨 + AI 自律セッション切り命令権**（§51-3 並列禁止 / §51-6 提案レベル + **遵守事項 5** = 2026-04-29 切替直後 **`session:clock:set` 必須** + **`session:clock:web` URL をチャットに転記し浜田にブラウザで開くよう促す** / **§51-6-2 命令権** = 2026-04-26 R-4 / 浜田 10:30「セッションを切ることは重要 / 命令指示権限を与える」/ 6 つの自律発動条件 (4h / 200 tool call / 重作業完了直後 / コスト 2x / Tier B 直前 / API 100%) / 浜田却下時は §47-D で逆却下 / 引き継ぎを checkpoint-latest.md へ追記義務 / **次チャット初手で遵守事項 5**）|
| §51-6-2 運用 | **`npm run session:clock:set`**（切替毎・必須）／**`npm run session:clock:clear`**（終了時・`開始:` を未設定）／**`npm run session:clock:web`**（バックグラウンド・URL を浜田へ・止めるは Ctrl+C）／**`npm run session:clock:health`**（壁時計・hooks・crontab・watch pid ワンショット）／**`npm run verify:session-clock-health`**（`session:bootstrap` 内包・厳格）／`SESSION-SPLIT-REMINDER.md`／§**16-1** 個人端末のローカル前準備（`AGENTS.md`）|
| §1-2-3-4 | **4AI方式B・CIOセッション特例**（2026-05-21 / 2026-05-29 ハイブリッド）— Opus4.7ベース/必要時4.8 / Composer2.5 Subagent diffのみ / Kimi長文 / DeepSeek §50-3-8 / `mode-b-canonical.mdc` |
| §50-3 / **§50-3-2a** / **§50-3-8** / **§50-3-9** / **§50-3-10** / **§50-3-11** | **CTO運用規定** + **§50-3-11 4AI開発プロトコル**（DeepSeek1問→突合3行→`cio:guard:5038` / Composer interlock / ゾンビ検査 / `00-rule-hierarchy.md`）／**仕様分業**: `deepseek-cursor-spec-division.mdc` |
| §52 / §52-3 / §52-8 / §52-8-1 / §52-9 | **RACI Tier A/B 自律レベル**（§52-3 6 問自己診断）+ **§52-8 高リスク shell 暴走防止**（Q1 / TSB-019 連動 / rm -rf・git push --force・npm install (新規)・chmod -R・sudo・.env 編集 等は事前報告 → 浜田 GO 待ち）+ **§52-8-1 物理 block 層**（P5-1/R1 / TSB-019 構造的根本対策 / `~/.cursor/hooks/dangerous-shell-blocker.sh` で OS レベル deny / 三層防御確立）+ **§52-9 Tier A 範囲ミス発見時の自律修正権**（2026-04-26 R-5 / 浜田「ミスや発見があれば即座にこちらに確認しないで進めてよい」/ §52-4 Conservative Default の能動的反対側補完 / Tier A のみ即修正可 / Tier B / §52-8 / §57 / scope 外 / Cursor IDE 設定変更 は適用外 / 完了報告 + logs/autonomy-decisions/auto-fix-*.md 事後トレース義務）|
| §39 | 発言前の日時確認（絶対遵守）|
| §34 | 人間尊重プロトコル |
| §42 | セッション冒頭の過去ログ確認義務 |
| §42-2 | **Continuity Assurance (継続性保証 / ファイル直読方式 / 2026-04-24 制定)** = 浜田 21:24「明日 19:00 開戦時 1% の不安ゼロ」/ 唱和案はレビューで却下（自己循環・同一ファミリー内相互検閲の馴れ合いリスク・§47-B-2）→ ファイル直読方式 (AGENTS.md 全文 Read + SHA256 ハッシュ比較 + BREAKING ラベルフィルタ + RAG Tier S 自動クエリ + Tier マーカー) で代替 |
| §55 | **異常時セーフモード (R13 / 2026-04-24)** = 浜田 #2 GO / 判断材料欠損時は Tier A 縮小・副作用は Tier B / 読取・診断は継続 / §42-2-7 AGENTS Read 失敗は即発動 / 解除は浜田明示 or health-check 手動完走 + 朝報整合（cron のみ不可） |
| §56 / **§56-1a** | **責任の所在 RACI** + **開発=AI・確認=浜田（憲法級・変更禁止）**（R14 / 2026-04-25 + 2026-04-26 浜田宣言） |
| §43 | WORKFLOW.md 遵守義務（Phase 0-5）|
| §44 | 夕反省サイクル（手動トリガー）— **`evening-reflect.mjs` 雛形 §1-N** を**毎夜浜田と必ず議論**（憲法運用: CIO 二人体制・§1c・MCP・検証・ルール実態）→ 結論を §2/§4 に 1 行以上 |

## 📋 セッション報告（チャット貼付・自己点検）

| 文書 | 役割 |
|---|---|
| **`docs/session-report-checklist.md`** | **報告用チェックリスト（詳細）** — **報告時は □ 本文をチャットに貼付**（CEO 目視）／**CEO 報告ゲート**（ティア・【適用憲法】・`[🎖️ 本セッション割当]`）／**順守根拠**／**§P A1**（誰とダブルチェック・結果・`ダブルチェック要約:` 常時）／**AI 側検証 2 者**／§M **機械フッタ**（hooks） |
| Desktop **`19-SESSION-REPORT-CHECKLIST.txt`** | 上記の短縮版（`chat-sessions/desktop-ai-emergency-read-pack/` 正本・**`npm run session-starter:sync-desktop`** で同期） |
| **`.cursor/hooks.json`** + **`report-checksheet-*.mjs`** + **`report-pipeline-audit.mjs`** | **報告ターン厳格化（2026-05-08 CEO 命令）** — 欠落・**V1 のみ**・**V2 四キー矛盾**は **`stop` 自動フォロー**＋パイプライン `FAILED_*`（`npm run report:pipeline-status`）。正本 **`every-turn-rules-confirm.mdc` §1e**／`docs/session-report-checklist.md` §M |
| **§1f / §P A3** | **複数回自己見直し（CEO 命令）** — 送信・報告確定・push 直前に **最低 2 回**（事実→形式）。**Tier B・不可逆・報告・憲法／hooks 改定**は **3 回目**（CEO 検収視点）必須。**`every-turn-rules-confirm.mdc` §1f**／**`docs/session-report-checklist.md` §P A3** |
| **§1e-4 / `report-checksheet-pending.mjs`** | **報告前自動判定** — `session-clock.mjs check` ＋ `report:pipeline-status`。**NG** 時は **チェックシート通読** または **Desktop `AI緊急用` 全ファイル Read**（**推奨: 両方**）。`logs/report-precheck.log` |
| **`npm run cio:chat-report-selfcheck`** | **hooks 未経路の二重化（2026-05-09）** — 下書きを `--stdin` / `--file` で渡し **禁止語** 等。任意 **`--strict-head`**／**`--require-v2`**／**`--require-ceo-block`**／**`--require-a1`**。正本 `scripts/cio-chat-report-selfcheck.mjs` |
| **`npm run cio:report-verify-response`** | **報告・締め・GO 前の一発ゲート** — 上記の **`--require-ceo-block` `--strict-head` `--require-v2` `--require-a1`** を既定で実行（送信前に **exit 0** 必須）。`CEO-MINIMUM-ABSOLUTE-BASELINE.txt` 追記の **hooks 起動経路限定**＋**CLI 二重化**と整合 |
| **`npm run cio:selfcheck:test`** | **Run 承認 UI 回避用** — `cio-chat-report-selfcheck` の回帰を **パイプなし 1 コマンド**で実行（`terminalAllowlist` の先頭プレフィックス問題を避ける）。`every-turn-rules-confirm.mdc`（Agent シェルと Run）参照 |
| **CEO 命令（2026-05-08・hooks 本番）** | **`hooks.json`／`report-checksheet-*`／`report-pipeline-*` の変更と every-turn の hooks 連動 § 本番改定**は **`main` 反映前**に **DeepSeek と Kimi の双方**へ同一短問 → **回答をチャットに各要約** → **本体 CIO 突合「問題なし」**。**抜けゼロは断言せず監視継続**。**追補**: 条件付きGO解消（範囲・遡及・相違点／盲点・障害後補完・停滞時CEO裁定・分担責任）— `every-turn-rules-confirm.mdc` **CEO 追補節** |
| **§37-1（`AGENTS.md`）** | **報告ターン末・機械フッタ V2 の正典キー** — `SECOND_REVIEWER` / `SPEC_TOUCHED` / `DESTRUCTIVE_OPS` / `DRY_RUN_TO_APPLY_GAP`（スペル固定・7 行全体の順序は **every-turn-rules-confirm.mdc §1e-2**） |
| **`git-hooks/commit-msg`** + **`cio-commit-msg-second-reviewer.mjs`** | **論点11** — `SPEC_TOUCHED: yes` 行がある、または正本 **SPEC 2 パス**がステージに含まれるコミットでは、message に **`Reviewed-by: deepseek｜kimi｜openrouter`** 必須（`AGENTS.md` §37-1） |

## 📚 文脈獲得・調査

| ルール | 役割 |
|---|---|
| §1 | 役割定義（§1-2 = **最適モデル原則 / Opus 4.7 デフォルト枠** R-3 改定 / §1-2-2 = API 制限到達時の自動フォールバック禁止 + §1-2-2-1 Cursor IDE 必須設定 / §1-2-3 = Opus 内 Max Thinking vs Extra High 使い分け + §1-2-3-1 AI 自己宣言義務 + **§1-2-3-2 AI 自律モデル選択原則 (3 段階 L1 Composer 2 / L2 Extra High / L3 Max Thinking)** + **§1-2-3-3 CIO モデル最終判断** / §1-2-4 = クレジット予算管理 月 $200+$1000 + 3 系統 70-80-85-95% 警告）|
| §2 | 正本主義（kintone-apps.md が単一の真実）|
| §3 | 索引駆動 |
| §19 | 知識の鮮度管理 |
| §20 | RAG 検索の義務化 |
| §33 | 外部知見の検証 / 事前調査義務 |

## 🛠️ 実装中

| ルール | 役割 |
|---|---|
| §4 | フィールドコードの整合性 |
| §5 | 非同期制御 |
| §6 | 一括処理の最適化 |
| §12 | イベントバインド確認 |
| §13 | ネイティブ／標準優先（正攻法の原則）|
| §14 | 2 回失敗で戦略転換 |
| §15 | コードの完成度基準 |
| §16 | WSL/Windows の使い分け |
| §16-1 | **浜田個人開発端末（摩擦最小化）**（2026-04-27 / 個人 PC・個人 WSL 上のローカル専用前準備＝crontab・NVM・通知診断等は浜田事前許可なしで可 / Tier B・本番 kintone・§52-8・§57 等は従来どおり）|
| §35 | 自律型エンジニアリング（**§35-1 開発=AI／確認=浜田・変更禁止** = §56-1a と同義。**§35-6** 削除ゲート・**§35-7** チャット上 CIO の規律先行・2026-05-05） |
| §36 | デュアルラン（キー移行の安全策）|
| §38 | ツール・依存関係の自律保守（**§38-1** npm セキュリティ自律境界 — 2026-07-02） |

## ✅ 検証

| ルール | 役割 |
|---|---|
| §7 | エラーの可視化 |
| §9 | 完了時チェックリスト |
| §10 | 自己レビュー（3 点）|
| §11 | 修復後の検証義務 |
| §11-6 | 他系統 AI（MCP 等）への査読依頼・二次意見（浜田最終検収の補助・代替ではない）|
| §26 | 視覚的自己検診 |
| §27 | ユニバーサル・デザインの義務化（アクセシビリティ）|
| §28 | パフォーマンスの基準値 |
| §29 | レスポンシブ設計の義務 |
| §30 | WEB 品質診断の実行タイミング |

## 📦 デプロイ・納品

| ルール | 役割 |
|---|---|
| §8 | デプロイ指示の 3 点セット |
| §31 | 成果物納品プロトコル |
| §37 | 簡潔報告プロトコル |

## 📝 ドキュメント

| ルール | 役割 |
|---|---|
| §21 | 知見のフィードバック（学習サイクル）|
| §32 | 図解義務化（Visual Documentation）|
| §25 | 経理FAQポータル変更時の受け渡し |

## 🔒 セキュリティ・MCP 保全

| ルール | 役割 |
|---|---|
| §17 | MCP 設定変更の安全手順 |
| §18 | セキュリティ |
| §22 | MCP 設定の保全 |
| §23 | MCP 消失時の復旧プロトコル |
| §24 | MCP 変更時の義務 |

## 💬 コミュニケーション

| ルール | 役割 |
|---|---|
| §41 | 一問一答ルール |

---

## 🔍 全 §N チェックリスト（audit-rules.mjs 用）

本セクションは未参照ルールが残らないよう全番号を 1 度ずつ参照する。

§1 / §1-2 / §1-2-1 / §1-2-2 / §1-2-2-1 / §1-2-3 / §1-2-3-1 / §1-2-3-2 / §1-2-3-3 / §1-2-4 / §2 / §3 / §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §11-2 / §11-3 / §11-4 / §11-5 / §11-6 / §12 / §13 / §14 / §15 / §16 / §16-1 / §17 / §17-2 / §17-3 / §18 / §19 / §20 / §21 / §22 / §23 / §24 / §25 / §26 / §27 / §28 / §29 / §30 / §31 / §32 / §33 / §34 / §35 / §35-6 / §35-7 / §36 / §37 / §38 / §39 / §41 / §42 / §43 / §44 / §45 / §46 / §47 / §47-A / §47-B-2 / §47-C / §47-D / §47-E / §48 / §49 / §50 / §50-2 / §50-3 / §50-3-2a / §50-3-8 / §50-3-9 / §50-3-10 / §51 / §51-2 / §51-3 / §51-4 / §51-5 / §51-6 / session:clock:health / §52 / §52-1 / §52-2 / §52-3 / §52-4 / §52-5 / §52-6 / §52-7 / §52-8 / §52-8-1 / §54 / §54-1 / §54-2 / §54-3 / §54-4 / §54-5 / §55 / §55-1 / §55-2 / §55-3 / §55-4 / §55-5 / §55-6 / §55-7 / §56 / §56-1 / §56-1a / §56-2 / §56-3 / §56-4 / §57 / §57-1 / §57-2 / §57-3 / §57-4 / §57-5 / §57-6 / §57-7 / §57-8 / §57-9 / §57-10

（§40 は欠番。旧 §53 族・第17章第二意見は 2026-04-25 [BREAKING] v22 で撤去）

---

## 🧠 思考の三本柱 + タスク管理（2026-04-22 追加 / 改善案 #10 / 朝 cron 未参照警告解消）

| ルール | 役割 |
|---|---|
| §45 | タスク完遂義務 — 「やることを済ませてから次へ」（最重要 / 全タスク絶対上位）|
| §46 | 朝ルーチン絶対優先義務（最重要 / 最上位 / 全ルールの上位 / Phase 0-4 自動 cron）|
| §47 | Professional Critique — 健全な批判と修正（最重要 / 鵜呑み禁止 / 思考の三本柱 1）|
| §48 | Best Options — 複数案の提示（最重要 / メリット・デメリット併記 / 思考の三本柱 2）|
| §49 | Proactive Insight — 先回りの気遣い（最重要 / 「気づいていたが言わなかった」最大の罪 / 思考の三本柱 3）|

---

## 🔧 MCP 活用 + 並列禁止（2026-04-23 追加 / R1-R7 ルール改善 / 本日 TSB-013/014/015 反省）

| ルール | 役割 |
|---|---|
| §50 | MCP 想起儀式（タスク開始時 30 秒チェック / 16 シーン × MCP 対応表 / R24 早期適用）|
| §50-2 | 死蔵 MCP 根絶ルール（過去 30/60/90 日 0 回判定 → 入替/削除 / TSB-015 教訓）|
| §50-3 / **§50-3-2a** / **§50-3-8** / **§50-3-9** / **§50-3-10** | **CTO運用規定**（航海図・**§50-3-2a MDD 一次定義**・PlanB・§51 分離・CEO 差し替え・検収証跡・**§50-3-8 DeepSeek 盲点＋突合メモ**・**§50-3-9 kintone MCP→REST 迂回**・**§50-3-10 鏡像** / 2026-04-29–30）|
| §51 | **並列処理禁止 / 1 タスク 1 操作原則**（最重要 / 浜田 22:05 指示 / 第15章 / Phase W batch 反省）|
| §11-5 | 修復系の段階的検証 3 段階フレームワーク（直接実 call / 手動 script / cron 実 / TSB-013 v1+v2 教訓）|
| §11-6 | 他系統 AI（MCP）への査読依頼（浜田最終検収の補助・§56-1a 不変）|
| §17-2 | mcp.json 編集の最小差分手順（TSB-015 ensure_ascii 副作用教訓 / 二重 backup + diff 取得）|
| §17-3 | mcp.json command の絶対 path 標準化（TSB-013 v2 教訓 / cron PATH 依存回避）|
| §47-A | 「100% 証明」要求受領時の 30 ステップ深掘り（Phase W テンプレ化 / コード基盤 5 + cron 7 + MCP 7 + データ 6 + ルール 5）|
| §47-B-2 | 段階的批判の容認 / 1 段階完璧主義の禁止（Phase V → Phase W 反省 / 信頼度ラベル 1 段階上限 🟡 90%）|
| §47-C | **浜田認識不足判断の AI 否定権限**（2026-04-23 制定 / R8 / Phase F-7/F-8 reverse 教訓 / §47-3 例外条項 / 認識不足検知時 2 回目強く再確認 + 「リスク承知」明示要求 / 沈黙・「やめよう」→ 即停止）|
| §47-D | **矛盾指示の却下義務**（2026-04-25 制定 / B-7 / 浜田 10:57「矛盾があるので却下しますでいいよ。叱ってほしい」/ 短時間内の矛盾指示は AI が毅然と却下 / 折衷・部分着手禁止 / `logs/autonomy-decisions/` に却下記録）|
| §47-E | **憲法違反指示の即却下義務**（2026-04-25 制定 / L-2 / 浜田 11:12「ルール = 憲法なので、私がルールと違う場合も同様に却下してほしい」/ 浜田自身が憲法違反指示を出した場合も AI が即座に却下 / 改定意図明示時のみ §57 改定議論へ / TSB-017 受け / §51-3 と双子条文）|
| §51-2 | **浜田からの複数指示受領時の AI 対応** (2026-04-23 制定 / R9 / 浜田 22:14 指示「2 つ指示混乱エラー反省」/ 1 メッセージ 2 つ以上 → 1 つ目だけ実施 → 「次の○○ 進めますか？」確認 / AI 側からも複数依頼禁止 / §41 と双方向補完)|
| §51-3 | **並列セッション検知時の AI 動作**（2026-04-25 制定 / L-2 / 浜田 11:12「並列セッションの疑いがあれば即座に他セッションを強制的に終了するように」/ TSB-017 受け / 段階 1: `scripts/session-lock.mjs` manual lock + 自衛 abort（実装済 L-1）/ 段階 2: `ps aux` ベース強制 kill（L-6 future plan / 浜田 GO 必須 / **設計確定 M-series 2026-04-25 11:28: A-2 三重防御 + B-1 本リポのみ + C-2 段階 3 連携 / 実装順序 ABC**）/ 段階 3: **実装済 K-3**（`file-watcher.mjs` + `agents-md-changes.jsonl` + S16 稼働確認 + smoke 第 7 検査）/ §47-E と双子条文 = 物理 + 規範の両輪）|
| §51-4 | **並列セッション疑いの 4 軸機械判定**（2026-04-26 P4 制定 / TSB-017 + P3 観察知見の規範化 / 4 軸 = ① watcher_pid 不一致 +5 / ② 過密編集 +2 / ③ session-lock 不在 +3 / ④ 不審バックアップ +4 / 閾値 = 0-2 静穏 / 3-4 注意 / 5-6 警報 / 7+ 確定 / 実装 `scripts/parallel-session-detector.mjs` / npm run audit:parallel / smoke 第 8 検査 / 朝報 §5-5 統合）|
| §51-5 | **並列セッション疑い時のログ保全**（2026-04-26 P4 制定 / 警報以上 (5+ 点) で `logs/parallel-suspicion/<JST 時刻>-score<N>.json` に snapshot / 後日浜田が判断/復旧/段階 2 force kill 候補追加に使用 / false positive は `--ignore-suspicion=<reason>` で `false-positive.jsonl` に履歴化）|
| §51-6 | **セッション分割推奨**（2026-04-26 P5-5 制定 / S4 / コンテキスト累積によるトークン浪費抑制 / 朝 06-10 / 昼 12:30-17 / 夜 19-22 で chat session 区切り推奨 / 同セッション 4h or 200 tool call 超で AI 提案 / PC 台帳 deploy など不可逆操作直前は必ず新セッション / §51-3 並列禁止と補完 = 時間軸分割は推奨 / F-13 教訓 = 連続 6h 稼働で API 12 日完全枯渇 / **2026-04-29 遵守事項 5** = 切替直後 **`session:clock:set` 必須** + **`session:clock:web` で URL を浜田にブラウザ開示**）|

---

## 🤖 自律レベル制 + 自己統治（2026-04-24 追加 / R10 / R12–R14 / 浜田指示「基本は自律 / リスクは夜の反省会で承諾」）

| ルール | 役割 |
|---|---|
| §52 | **自律レベル 2 段階制** (R10 / 第16章 / Tier A 自律実行型 + Tier B 承認待ちキュー型 / §52-3 自己診断 6 問 / Q6 scope check = scope creep 構造的禁止) |
| §52-1 | Tier A (自律実行型 / 即実行) — 副作用ゼロ→単独 / 副作用あり→§52-3 を満たす場合のみ即実行 |
| §52-2 | Tier B (承認待ちキュー型) — 不確実・昇格条件・高リスク → 夜の §44 で浜田承諾 → 翌朝 cron |
| §52-3 | AI 自己診断 6 問 (Q1 不可逆 / Q2 副作用 / Q3 ロールバック / Q4 過去 TSB / Q5 浜田明示 / Q6 scope check) |
| §52-4 | 迷ったら昇格原則 (Conservative Default) |
| §52-5 | 判断ログ (`logs/autonomy-decisions.log` / JSON Lines) |
| §52-6 | 例外規定 (緊急時 Tier A 強制実行 / `emergency:true`) |
| §52-7 | 旧運用慣行の置換 (PC 台帳 Day1+2 の毎回 GO → R10 再設計の経緯) |
| §54 | **自己統治能力 (Self-Governance / R12 / 第18章)** = §54-1 セマンティックバージョニング + §54-2 Negative Log + §54-4 Snapshot + §54-5 週次自己批判（外部レビューは任意） |
| §54-1 | BREAKING/FEAT/FIX + 3 問判定 + prefix 統合 |
| §54-2 | Negative Log（棄却案・メイン AI 記録・§54-2-1 馴れ合い防止） |
| §54-3 | [DEPRECATED] Operation Frequency Management（短命ルールの教訓） |
| §54-4 | Mandatory Pre-Op Snapshot |
| §54-5 | Weekly Self-Critique（週次自己批判 / 外部 AI 月次審査は撤去・任意外部のみ §54-5-2） |
| §55 | **異常時セーフモード** (R13) |
| §55-1 — §55-7 | 目的・トリガー・手続・制限・解除・可用性との関係・制定メモ |
| §56-1 / §56-1a / §56-2 — §56-4 | RACI 読み方・**開発=AI・確認=浜田（変更禁止）**・標準表・エスカレーション・§52 との関係 |

---

## 📜 憲法改定プロセス（2026-04-26 追加 / R15 / 第21章 / 浜田「§57 案 1」朝ブリーフィング）

| ルール | 役割 |
|---|---|
| §57 | **改定プロセス (R15 / 第21章 / 2026-04-26 / N-2)** = 「§54-1 = ラベル / §57 = 手順」役割分担 / §47-E から `§57 改定プロセスに移行します` 参照の破断リンクを実体化 / 提起→起案→ラベル決定→適用→検証→周知→記録の 7 段階 |
| §57-1 | 改定提起（浜田明示 or AI が §47-A/§47-D/§47-E/§54-2 で提起 / 改定意図無は §47-E 即却下）|
| §57-2 | 起案・レビュー（diff + 影響範囲 + §54-1 ラベル候補 + ロールバック手順）|
| §57-3 | ラベル決定（§54-1 3 質問判定フローチャートに接続）|
| §57-4 | 適用（並列禁止 / ファイル編集順序: AGENTS → RULES-INDEX → WORKFLOW → scripts → chat-sessions → Desktop AI緊急用）|
| §57-5 | 検証（audit-rules / audit-tsb / verify-breaking / audit-xref / health-check / smoke-test 全通過 / `.session-state/agents-md-hash.txt` 更新）／**`npm run verify:agent-env`**（Tier A・Desktop 同期なし＝憲法＋必読ゲート＋上記 4 audit 連鎖＋**`verify:rag-mirror-canonical`**＋`smoke:quiet`／`.cursor/rules/mcp-tool-discipline.mdc` アイドル枠）|
| §57-6 | 周知（付則 changelog 1 行追記 / 重大改定は NEW-SESSION-STARTER + CURSOR-トラブル対応メモ + 浜田 Desktop AI緊急用 同期）|
| §57-7 | §57 自身の改定（[BREAKING] 必須 / §47-E/§54-1/§51/§52 と矛盾なし確認 / 浜田明示 GO 必須）|
| §57-8 | 記録様式（`logs/autonomy-decisions/rule-amendment-YYYY-MM-DD-HHMM.md`）|
| §57-9 | §47-E/§47-D/§51/§51-3/§54-2 との接続（憲法違反却下→§57-1 / 矛盾即却下 / 並列禁止厳守 / 棄却案は graveyard）|
| §57-10 | **I案 — インフラ運用**（2026-05-02）— RAG 副本文ミラー（`npm run rag:mirror:canonical-docs` / `verify:rag-mirror-canonical`）／GitHub `main` branch protection（`docs/github-branch-protection.md`）／`post-commit` の Node 化＋`npm run hooks:install`／多モデル合意は CIO が優先順位確定（§50-3-8 整合）|

---

## 💳 Cursor Ultra クレジット予算管理（2026-04-26 追加 / O-series / 浜田「甲：フル実装」承認）

| ルール | 役割 |
|---|---|
| §1-2-2 | API 制限到達時の自動フォールバック禁止（N-3 + N-4 で 4 択 A-D 提示）|
| §1-2-2-1 | Cursor IDE 必須設定（4 → 8 項目 / Q1 拡張 / TSB-019 連動）— A 課金: On-Demand=Fixed + Cap $130（緊急時 $300）/ B Models: Opus 4.7 1M Extra High + Max Thinking のみ ON（add で追加）/ C Agents: Auto-Run = Run Everything + **Browser Protection ON + MCP Tools Protection ON ⭐** / D Cloud Agents: 不使用 N/A |
| §52-8 | **高リスク shell 暴走防止**（Q1 / TSB-019 連動）— rm -rf / git push --force / npm install (新規) / chmod -R / sudo / .env 編集 等は事前報告 → 浜田 GO 待ち必須 / 読取系・既知 npm スクリプト・git 安全コマンドは例外 |
| §52-8-1 | **物理 block 層**（P5-1 / R1 / TSB-019 構造的根本対策 / 2026-04-26 制定）— `~/.cursor/hooks/dangerous-shell-blocker.sh` で OS レベル deny / 三層防御（AI 自己制約 + IDE ゲート + 物理 block）/ Hooks 自身の改ざん防止も含む / 設計 `docs/cursor-hooks-design.md` |
| §1-2-3 | Opus 内モデル使い分け（既定 Extra High / Max Thinking は §47-A 100% 証明・設計判断・複雑バグ修正・TSB 真因究明・憲法改定起案のみ / Extra High は lint・refactor・既知パターン deploy・commit message・RAG 同期・朝報整形に推奨 / コスト 1/3-1/5）|
| §1-2-3-1 | **AI 自己宣言義務**（2026-04-26 P5-5 制定 / Max Thinking 形骸化対策 / タスク冒頭で `[§1-2-3 ティア判定: Extra High/Max Thinking]` を 1 行明示 + 根拠 1 行 / Max Thinking で実行中に気付いたらルーチン作業なら自発的に「Extra High に切替を」と通知 / 朝のブリーフィング §0 でその日のタスクに [Tier] ラベル付与 / Max Thinking 比率 30% 超で警告 / F-13 = API 12 日完全枯渇の主因対策）|
| §1-2-3-2 | **AI 自律モデル選択原則**（R-3 / L1 Composer 2 / L2 Extra High / L3 Max Thinking / 不可逆は L3 / silent fallback との区別）|
| §1-2-3-3 | **CIO によるモデル最終判断**（2026-04-29 / 浜田 CIO がチャット欄・ティアを明示した場合は §1-2-3-2 に優先 / 未指定時は §1-2-3-1・2 / §35-1 開発=AI・確認=浜田は不変）|
| §1-2-4 | クレジット予算管理（**P5-5 改定**: 月予算 L1 $200 + L2 **$1000 引上げ** = Worst $1200/¥186,000 / 節約後見込 $430-500/¥66,000-78,000 / 3 系統 (Total/API/On-Demand) / 1 日 1 回 30 秒で `npm run credit:set <pct>` + Spending スクショ送付 (4 値抽出) / 70-80-85-95-100% 5 段階自発警告 / API 系統 100% 単独到達 = §1-2-2 連動 / 線形回帰で枯渇日予測 / 朝報 §0 に常時 3 系統表示 / TSB-018/TSB-021 連動）|

**実装ファイル**:
- `scripts/credit-budget.mjs` (set / status / reset)
- `data/credit-usage.json` (当月日次履歴)
- `data/credit-usage-history.jsonl` (月次集計永続化)
- `scripts/daily-morning-prep.mjs §0a` (朝報統合)

**npm scripts**: `credit:set` / `credit:status` / `credit:reset`

---

## セッション切替・文脈復元（2026-04-26 / 浜田「セッションが変わっても分かるように」）

| 正本 | 役割 |
|---|---|
| `chat-sessions/checkpoint-latest.md` §「セッション切替後の自律復元」 | 新チャット初手の **索引・日付整合**（**-1** 貼付＝スターター全文。**v3.27+** 詳細手順の正本は `NEW-SESSION-STARTER.md` **「■ 貼付単独で完走」**／**貼付推奨**は verify 最終行 → **-0** … → **0** …）／**日終わり** sync→verify／**項番 5**＝本題別（**5A 部署予実** vs **5B 新・PC台帳**）で無関係 Read をしない |
| `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` | 引き継ぎ後の **全棚卸し**（経緯・法律相当・ルール・npm 機能・MCP・**必須機械検証**・チャット報告様式）／**フェーズ 1c**＝部署予実本題時の Read 正本／**フェーズ 7**＝`session:bootstrap` 後・棚卸し報告の **唯一の認められる体裁**（**§1 先頭4行＝ティア・適用憲法・🎖️・ルール確認 を最上段に必置**＋**1〜8・4a 欠落禁止**・浜田 CEO 厳守） |
| `chat-sessions/SESSION-READ-LADDER.md` | **`session:bootstrap` 後**の **A.共通五段階**（着手前・**ルール理解のみ**）→ **B.プロジェクト確認**（仕様の小出し・§41・GO）。**Read→完了報告テンプレ→次**。`checkpoint`・本チェックリストと併用 |
| `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0〜** | 新・PC台帳 ver.1 の **正本**（浜田認識・コア vs SKYSEA・フィールド・ボタン）。**実装・ラベル・674 customize を変える前に Read**（手順書のみで代替しない）。**画面ラベル**は `scripts/data/pc-ledger-v1-ui-display-labels.json`／検証は `npm run pc-ledger:verify-labels-spec`／引き継ぎは `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b** |
| `npm run pc-ledger:verify-labels-spec` | 短文表示ラベル JSON + §4.2.2 マトリクス指紋 + 拡張 JSON を機械突合（セッション切替後のブレ止め） |
| `docs/plans/2026-04-26-pc-ledger-label-spec-changelog.md` | 表示ラベル周りの **追加 vs 変更**（コミット別・全フィールド対照表） |
| `chat-sessions/NEW-SESSION-STARTER.md` **v3.8+** | kintone MCP `kintone-add-app` と **プレビュー先行**／`/k/<id>/` が空に見える件の要約。**v3.33+**: 憲法 **§50-3-9**（kintone MCP 構造エラー時は REST へ即移行・`tmp-kintone-*` 掃除）＋航海図 **手段(第2)**。**v3.27+**: 冒頭 **「■ 貼付単独で完走」**＝項番 **-1〜0（機械）**と **-0→bootstrap→@ Read** の **唯一の詳細正本**（他ドキュは追随のみ）。**AI は全文貼付ターンで必ず本ファイルを Read 通読**（チャット要約で代替しない） |
| `templates/yojitsu-budget-lite/SPEC.md` ほか同配下 `docs/*.md` | **部署予実**の仕様正本（セッション切替後は **項番 5A**／`SESSION-BOOTSTRAP` **フェーズ 1c**） |
| `docs/plans/2026-04-26-pc-ledger-day4-action.md` **「AI 引継ぎ: kintone-add-app 直後に…」** | **新・PC台帳**の **詳細**（REST 確認手順・`thread` 不可・`revision-snapshot`） |
| `docs/troubleshooting.md` **TSB-023** | 「公開してない？」**先確認せず浜田へ聞かない**で済むようにした教訓（索引用 1 行 + 本文） |
| `docs/troubleshooting.md` **TSB-024** | 憲法級アンチパターン（**デプロイ・適用・push を人に押し付けない**／禁句リスト／`npm run verify:constitution-handoff` ＋ **`npm run verify:mandatory-read-gate`**（必読ファイル構造）＋ **`npm run verify:session-clock-health`**（壁時計 hooks / crontab node）＋ **`SESSION-CLOCK.md` / `session:clock:set`**（§51-6-2 時間軸）で機械監視） |
| `docs/troubleshooting.md` **TSB-031** | **Desktop 日報を Git 未収容で削除**した事案。**正本は `chat-sessions/`＋コミット**／Desktop は **sync の控え**／詳細は **`AGENTS.md` §35-6**（verify が本条見出しを監視） |
| `docs/troubleshooting.md` **TSB-032** | **`constitution-gates` が `constitution.mdc` 欠落で赤** — **verify はファイル必須だが `.gitignore` でリポ非追跡**。対策: **workflow / ローカルで `npm run rules:regenerate-constitution`（Node・Windows 可）または `npm run rules:regenerate-constitution:bash`（WSL）を verify 前に実行**（本文・目次表・TSB 新設閾値と連動） |
| `docs/troubleshooting.md` **TSB-033** | **Cloud「再開可能」≠ 未完放置** — **`cio:cloud-handoff end` の partial/blocked は `--note` 必須**／合意シールは **プッシュ前 `verify`** ＋ **CI `cio:consensus-seal:verify-ci`**／`cio-consensus-seal.json` **既定 gitignore**（ゲート PR のみ `git add -f`）。詳細は **`chat-sessions/README.md`** |
| `docs/troubleshooting.md` **TSB-034** | **Windows `health-check` の MCP 偽陰性** — CLI では **skip 降格**（`HEALTH_CHECK_STRICT_WIN=1` で厳格）／**rag `env.DB_PATH`**／**`permissions.json` の `terminalAllowlist`**／**`npm ci`（S9）**。詳細 **TSB-034 本文** |
| `docs/troubleshooting.md` **TSB-029** | **`user-markdownify`** — `@iflow-mcp/markdownify-mcp` の **`preinstall.js` 欠落 publish バグ**で stdio 即死。対策: **`npm install -g --ignore-scripts @0.0.2`** ＋ **`node …/dist/index.js` 直起動**＋`UV_PATH`（詳細は本文） |
| `.cursor/rules/constitution-handoff-gate.mdc` | **`alwaysApply: false` + `globs`** — §35-1 / §56-1a / TSB-024 / §1-2-3-1 を想起（**常時 true 枠は `cio-constitution.mdc` のみ**） |
| `.cursor/rules/cio-discipline-always.mdc` | **`alwaysApply: false` + `globs`** — §35-7＋**customize deploy 機械ゲート**（594/595/626/627/629/671/674/677/678/679・`cio:preflight:<app>` → `deploy:<app>`・45 分・任意 **`--with-git-diff-line`**・`SKIP_CIO_DEPLOY_GUARD` 緊急脱出）＋HANDOFF 先読み（`AGENTS.md` **v23.34**） |
| `.cursor/rules/autonomous-with-mandatory-asks.mdc` | **`alwaysApply: false`**（glob なし・必要ターンで `@` または Read）— **自律実行してよいが**、日取り矛盾・GO 境界・曖昧仕様など **聞くべきことは着手前に聞く**（浜田指示） |
| `.cursor/rules/creation-timing-ask.mdc` | **`alwaysApply: false`**（glob なし・必要ターンで `@` または Read）— **作成着手前**に浜田へ **「今すぐ作成／後日」** と **配置スペース（ID または名）** を §41 で確認。未決なら `kintone-add-app` の `space` 省略で進めない（浜田指示 2026-04-28） |
| `.cursor/rules/session-handoff.mdc` | 人間 5 行＋AI の `handoff-log` 追記手順。**自律復元**の追記あり。**ハンドオフ深さ既定 L2**（リポ/CI/bootstrap/憲法 verify/kintone 反映/Tier B 近傍に触れたターンは標準ブロック）。**第 2 者ダブルチェック**は `constitution-enforcement-core.mdc` 正本 |
| `.cursor/rules/session-read-ladder-two-phase.mdc` | **glob: `chat-sessions/**`**（2026-05-07）— セッション復元の **二段階**（**A 事前準備**／**B 本題確認**）。**第0手**で `SESSION-READ-LADDER.md` を **Read 通読**。正本は `chat-sessions/SESSION-READ-LADDER.md` |
| `.cursor/rules/mcp-tool-discipline.mdc` | **`alwaysApply: false`**（glob なし・必要ターンで Read）— `call_mcp_tool` 前の **descriptor 必読**・`mcp_auth` 順序・curl/gh と MCP の優先（自律ミス低減） |

---

## 関連

- `AGENTS.md` — ルール本文（憲法）
- `WORKFLOW.md` — タスク作業 OS（Phase 0-5）
- `kintone-apps.md` — kintone 仕様の正本
- `docs/troubleshooting.md` — 失敗事例 TSB-XXX
