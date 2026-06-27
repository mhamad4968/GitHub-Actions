# MCP 活用（§50 系）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: MCP 選択・想起儀式・CTO 規定  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 要約

このジャンルに属する § は、下記本文どおり `AGENTS.md` から抽出したものです。解釈の最終正本は `AGENTS.md` の同一 § です。

---

## 第14章 MCP 活用（2026-04-23 制定 / MCP 強化戦略 v1.0 / 死蔵 14/16 MCP 解消）

### §50 MCP 想起儀式（タスク開始時 30 秒チェック）

**背景**: 2026-04-23 MCP 強化戦略 段階 1 監査で、過去 30 日の MCP 使用は kintone (38 回) + playwright (2 回) の 2 件のみ = 14/16 (87.5%) が死蔵状態と判明。AI（私）が「Cursor 標準ツールでとりあえず動く」を選んで MCP を使わない構造的バイアスがあったため、本ルールで強制的に想起トリガーを仕込む。

**儀式**: タスク開始時の最初の 30 秒で、以下のシーン → MCP 対応表を頭の中で 1 回スキャンする義務（実際に使うかは§47/§48 で判断）:

| シーン | 該当 MCP | 備考 |
|---|---|---|
| 重要設計判断 / 不具合調査初動 / リファクタ前 | **rag** | §20 で既に義務化済（強化）|
| URL 取得・ HTTP API 叩く | fetch | Cursor 標準 WebFetch で十分なら不要 |
| Web 検索（公式 docs / 仕様確認）| **duckduckgo-search** | **`tavily` は 2026-05-06 削除済**（`docs/mcp-status.md`） |
| アクセシビリティ検査 | accessibility-scanner | UI 改修時必須 |
| ブラウザ自動操作 / E2E テスト | playwright | customize 動作確認時 |
| CVE 脆弱性確認 | cve-search | 月次 + 依存追加時 |
| サイバーセキュリティニュース | cyber-news | 週次セキュリティ巡回時 |
| PowerPoint 自動生成 | office-powerpoint | Win 起動必要 / **doc-lane 自律資料**（`docs/runbooks/doc-lane-autonomous-governance.md`） |
| GitHub Issue/PR 操作 | github（Win）／**`gh`（WSL 第一選択）** | WSL では **`gh`** を優先（浜田合意 2026-05-06） |
| 段階的思考（複雑判断分解）| sequential-thinking | 大型設計判断時 |
| セッション横断記憶 | memory | 確定決定事項保存時 |
| ファイル操作 | filesystem | **原則使わない**（Cursor 標準で代替）|
| kintone レコード CRUD | **kintone** (公式) | 通常運用で最頻使用 |
| kintone アプリ作成 / フォーム編集 | **kintone-dev** (自作) | PC 台帳 4/23-26 で実戦投入予定 |
| kintone スペース管理 / アプリ配置 | **kintone-space** (自作) | スペース 21 配置時 |

### §50 違反時
- タスク開始時に 30 秒チェックを 1 回もしなかったセッションが §44 夕反省で 3 回以上検出されたら、§47-B ルール疲労ガード再評価対象（本ルール自体の見直し）

### §50 例外（チェック不要 = 暗黙適用済）
- 1-2 行の文言修正・コメント追加・既知パターン踏襲
- 浜田から「○○ MCP で」と明示的に MCP 指定があった場合
- §46 朝ルーチン Phase 0-4 中（cron 自動実行で MCP 不要）

### §50 関連
- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md`
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md`
- 戦略書: `docs/plans/2026-04-23-mcp-strategy-v1.md`
- MCP 状態管理台帳: `docs/mcp-status.md`（D12）
- §47-B ルール疲労ガード（本ルールの併記義務 = 現在 AGENTS.md ルール件数想定 約 50 + 本提案で +1 / 過去 24h 違反想定 = MCP 関連は §20 RAG で複数 / **ルール疲労リスク = 中**だが効果範囲が広いため採用）

### §50-2 死蔵 MCP 根絶ルール（2026-04-23 制定 / 浜田 21:33 指示 / TSB-015 教訓）

**背景**: 2026-04-23 TSB-015 で google-search MCP が「過去 30 日 0 回使用 + Google bot 検知で実用度 0」状態と判明。浜田指示「使ってない理由は？入れてるなら使え。他に有用なものがあれば入れ替えて削除がいいのでは？」 = **死蔵 MCP は入れ替えるか削除するべき** = 単に「動く」だけでなく「使われている」を判断軸に。

#### 月次判定 (S14 月次セキュリティ巡回 + 月次 MCP 健康診断 = 月初 5/1 から)

各 MCP について以下を判定し、`docs/mcp-status.md` に記録:

| 判定 | 条件 | アクション |
|---|---|---|
| ✅ active 利用中 | 過去 30 日 1 回以上使用 + 実用度あり | 維持 |
| 🟡 死蔵候補 | 過去 30 日 0 回 + 代替手段あり (Cursor 標準ツール / 他 MCP) | 次月まで観察 / 浜田レビュー時に判断 |
| 🟠 死蔵確定 | 過去 60 日 0 回 + 実用度評価で実用度低 | **入替候補**を 1-3 件比較表で提示 / 浜田判断 |
| ❌ 削除確定 | 過去 90 日 0 回 + 入替候補も不採用 + 構造的に解消困難 | mcp.json から削除 (バックアップ + commit) |

#### 入替判断のテンプレ (TSB-015 で実証 / 4 軸比較表)

| 軸 | 重要度 |
|---|---|
| API key 要否 | ★★★ (key 取得手間 + 課金リスク) |
| 無料枠 | ★★★ (浜田用途で月 N 回想定) |
| bot 検知耐性 / 実用度 | ★★★★ (結果が常に空なら無価値) |
| 結果品質 | ★★ (相対評価 / 用途次第) |
| 導入工数 | ★★ (Cursor 再起動 1 回含む) |
| 既存資産活用 | ★★ (uvx / npx 既存設定再利用 = TSB-013 v2 教訓) |

#### 違反 (死蔵 MCP を放置)

- 月次健康診断時に「死蔵候補 N 件 / 60 日経過 / 検討待ち」が連続 3 ヶ月続いたら §47-B ルール疲労ガード相当の重大インシデント (= 本ルール自体が機能してない証拠)
- 浜田から「使ってないなら削除」と指摘されたら即座に死蔵判定 → 入替/削除 proposal 化

#### 実例 (2026-04-23 TSB-015)
- google-search: 過去 30 日 0 回 + Google bot 検知で結果常空 → A 案 (duckduckgo-search / API key 不要) で即入替 / Cursor 再起動 → 実 call で 3 件有用結果取得実証 (commit `942848e` `0fd7477`)

#### §50-2 関連
- TSB-015: `docs/troubleshooting.md`
- mcp-status.md 月次更新: `docs/mcp-status.md` (D12)
- S14 月次セキュリティ巡回 (5/1 開始): `scripts/monthly-security-rounds.mjs` (S14 proposal / 4/24 朝 cron 適用予定)
- 「Cursor 標準ツール vs MCP の使い分け」→ **§50-3** および §50 で運用（Cursor セッション内なら標準ツール許容 / cron / 他 AI 用途は MCP 設計に従う）

### §50-3 CTO運用規定（外部推理 MCP・コスト最適化）（2026-04-29 制定 / 浜田合意）

**目的**: チャット上の Opus（本体）のトークンと課金を抑えつつ開発速度を上げ、**コスト削減・自律稼働・安全性**を両立する。外部 MCP（例: Kimi / DeepSeek / OpenRouter）を **計画・可視化・検収**つきで使う。本条は **§50 想起儀式**・**§1-2-3 最適モデル原則**を補完する。**矛盾する場合は §1-2・§35-1・§56-1a を優先**する。

**課金の見える化（§1-2-4 との関係）**: Cursor（Opus 等）と外部 MCP の **課金・メーターは別レーン**になり得る。本条の透明性は **チャット上の航海図・手順・ティア宣言・検収コマンド併記**で最大化し、**金額の一次ソースは §1-2-4（クレジット予算管理）と各サービスのダッシュボード**を正とする。

#### §50-3-1 プランB（MCP 未接続・切断時）の閾値

- MCP が当該セッションから **呼べない・切断されている**と判断した場合、次を **プランB**（**ブラウザ版 Kimi 等で実行できるプロンプトをチャットに生成して提示**し、浜田の手を止めない）の候補とする:
  - **トークン見込みの数え方**: **「次の自分の返答（1 回の出力）のみ」**を対象とする。**タスク全体の総量は用いない**（予測が難しく、Opus の高単価出力をピンポイントで避けるため）。
  - **目安**: その 1 回の出力が **おおよそ 1,000 トークンを超える**見込み、または日本語で **約 1,500〜2,000 文字**を超えチャット画面を埋め尽くす分量になりそうなとき（**いずれか早い側**で PlanB を検討してよい）。
  - **複数ファイルにまたがる大規模修正**
- **緊急かつ軽微**で **低コストのまま即時に終わる**ものは、Opus（または §1-2-3-2 に従う L1）で続行してよい。
- 上記 **閾値に迷う場合は推測で長文出力しない** — **§41 一問**で浜田に即確認する。

#### §50-3-2 実行計画（パイプライン）の可視化

- **新規タスクの着手 1 ターン目**に、**どの MCP（または Cursor 標準ツール）をどの順序で使うか**を、**箇条書きまたは短い表**でチャットに必ず示す（**隠し思考のみ**としない）。浜田が **進行状況を一目で追える**ことを最優先とする（**航海図**）。
- **§51 との関係**: 本条のパイプラインは **航海図（計画の列挙）** に限る。実際のツール呼び出し・Shell・編集は **従来どおり §51（1 ターン 1 ツール call / 1 Shell 1 コマンド）** に従い、**一歩ずつ**実行する（計画を口実にした **複数ツールの同時発火** は禁止）。
- **§50-3-9 との接続**: kintone 系 MCP を航海図の **手段(第1)** とするタスクでは、**同一ターンの航海図**に **手段(第2) = REST**（`scripts/` 内の検証済み Node パターンの応用、または `scripts/tmp-kintone-*.mjs` による一発実行）を**併記**する（失敗時の自律迂回・掃除の正本は **§50-3-9**）。

#### §50-3-2a Markdown 駆動開発（MDD）の語彙と憲法上の位置づけ（2026-05-04 CIO 追補）

本リポおよび Cursor IDE 運用で **MDD（Markdown 駆動開発）** と称する場合、次の **三点セット** を指す。**Cursor `.cursorrules` の「C. Markdown 駆動（MDD）と SPEC 正本」**と **本条 §50-3-2** を **同一義務**として読み替えてよい（IDE 側は短文化、憲法本文は本条が一次定義）。

1. **着手 1 ターン目の航海図**: **Goal / Constraints / Acceptance criteria** をチャットに明示する（**§50-3-2** の「パイプライン可視化」と一体。ツール列挙だけにせず、**完了条件**まで書く）。
2. **SPEC 正本の明示と md での進捗追跡**: ルート `docs/SPEC.md` は置かない。**当タスク領域の `SPEC.md`**（例: `templates/yojitsu-budget-lite/SPEC.md`）、`kintone-apps.md`、アプリ専用の `docs/**/*.md` のいずれかを **チャットで 1 行指定**し、合意・進捗は **その Markdown を更新**してコード非精読でも追える状態を保つ。
3. **領域別の詳細**: 部署予実については **`templates/yojitsu-budget-lite/SPEC.md` §10.5・§11**（Markdown を正とする方針・決定直後の文書反映）を正とする。**リポ全体のドキュメントツリーを一発 scaffold する専用 npm** は未整備の間、**手動追随**に加え **`npm run rag:mirror:canonical-docs`** 等の既存自動化で正本ミラーを保つ。**ツリー自動構築の拡張設計**は `templates/yojitsu-budget-lite/docs/yojitsu-feature-backlog.md` の **B-MDFLOW**（状態はバックログで管理）。

#### §50-3-3 浜田（CEO）による航海図の差し替え

- パイプライン提示後でも、浜田は **CEO として最終決定権**を持つ。チャットで **「ステップ N を Opus で」「この MCP は使わない」**等と指示した場合、AI は **§41・§47-D・§47-E と矛盾しない範囲で**従い、**更新後の短い航海図を同ターンで再掲示**してから次の **1 歩**（§51）に進む。

#### §50-3-4 安価 MCP 試行のループ上限

- **格安ルート**（DeepSeek 等の外部 MCP）による試行錯誤は、**回数で最大 3 回**、または **経過時間で累計 5 分以内**の **いずれか早く到達した時点**を上限とする。
- 上限超過後も未解決なら、**自律的に Opus に切替**（§1-2-3 に従い Extra High / Max Thinking を選択）し、**最短距離で収束**させる。

#### §50-3-5 MCP 送信用データのサニタイズ（一方向・現実運用）

- **一方向サニタイズをデフォルト**とする: API キー・トークン・社内ドメイン等の **明白なパターン**は、**浜田の事前許可なく**機械的に伏せ字・プレースホルダへ置換してから MCP に送る。
- **複雑な可逆復元を憲法要件にしない**。マッピングの二重管理による漏えいリスクを避けるため、復元が必要な原文の扱いは **ローカル（浜田手元・リポ内で MCP に送らない作業領域）のみ**で完結させ、**MCP 側ログへの機密残置を最小化**する。
- **二段判断**: 明らかな機密は自動マスクする。**グレー**でデバッグに効く細部は **生データではなく要約のみ**を MCP に渡す。本条は **§18 セキュリティ**と矛盾しない範囲で適用する。

#### §50-3-6 MCP 成果物の憲法検収と証跡

- 外部 MCP の出力を取り込む前に、**該当する lint / verify / §9 チェックリスト** 等で憲法・品質に適合することを確認する。
- チャットで **「憲法適合済み」**と書く場合は、**実際に実行した検収コマンド名**（例: `npm run lint`、`npm run verify:constitution-handoff`）を **同一ターンで併記**する（**ラベルのみ**禁止）。

#### §50-3-7 解釈競合時の相談（CEO / CIO）

- **本条と他条文の読み合わせで判断に迷う場合**（**CIO 相当の統括判断が要る場合を含む**）、AI は **推測のまま進めず**、**§41 一問**で浜田に相談する（運用上 **CEO = 最終決定**、**CIO 相当の相談も同一チャネル（本条・§41）**で受ける）。

#### §50-3-8 盲点・セカンドオピニオン（DeepSeek）の固定運用（2026-04-29 制定 / 浜田合意）

**目的**: Opus（本体）単独では見落としがちな **論理の穴** を、外部推理（格安 MCP）で最小コストで塞ぎ、**手戻り（追加課金）**を未然に防ぐ。

**着手前ルーチン（義務）**: 次のいずれかに着手する **直前**、AI は **自律的に** DeepSeek MCP（**DeepSeek-V3** を正とする）へ **盲点抽出** を依頼せよ。
- **対象**: **予実管理**、**計算ロジック**、または **複雑な kintone カスタマイズ**。
- **依頼内容**: 次の **3 点に限定**した列挙と、各点に対する **短い対策**を求めること（長文化しない）。
  - **(a) 型の整合性**: フィールド型・データ型の不一致リスク。
  - **(b) SPEC 乖離**: 仕様（SPEC）と現在の実データ・実装の矛盾。
  - **(c) 差異ロジックの継承**: 前回の計算式や予実差異の考え方を正しく引き継いでいるか。

**突合メモの義務化**: DeepSeek の回答を受けたら、**CIO（本体 = Opus セッション上の統括 AI）** は直ちにリポジトリ内の **正本**（当該タスクの `SPEC.md` 相当、フィールド定義書相当）と突合し、**約 3 行の「突合メモ」**を同一チャットに記録せよ（**ラベルのみ**禁止。各行は「確認済み / 要修正 / 未確認」のいずれかが読み取れること）。

**適用上の接続**: 本条の MCP 呼び出しは **§50-3-4（試行上限）**・**§50-3-5（サニタイズ）**・**§51（1 ターン 1 ツール call）**に従う。MCP が未到達の場合は **§50-3-1 プラン B**（ブラウザ版等のプロンプト提示）で同等の 3 点質問を満たす。**user-kintone** 等の kintone 系 MCP が **構造エラー**を返した場合の **再試行禁止・REST 移行・一時スクリプト掃除**は **§50-3-9** に従う。

**補足（2026-05-04 / 軽微タスクでの省略と証跡）**: **予実・計算ロジック・複雑 kintone customize を触らない**説明-only の変更（例: 副次リポの `README.md` 追記・誤字修正・サンプル CSV 配置のみ）では、DeepSeek 1 問を **省略してよい**。その場合は同一チャットに **`§50-3-8 スキップ理由:`** を付けた **理由 1 行を必須**とする（省略したのに行が無い＝本条未遵守）。**`kintone-ai-lab` 内の `AGENTS.md`・`NEW-SESSION-STARTER.md`・憲法ゲート `.mdc`** の編集は **本条の省略対象外**（別途 §57・§50-3-8 フル手順）。

#### §50-3-9 kintone MCP の自律的フォールバック原則（2026-04-30 制定 / 浜田合意）

**再試行の制限（§50-3-4 を補足）**:
- kintone 系 MCP が **構造的な不一致**（スキーマエラー、戻り値の不一致等）を返した場合、**同一 MCP による再試行は即座に禁止**する。
- **通信エラー**（503 / タイムアウト等）に限り、**1 回のみ**再試行を認める。**その再試行後も失敗**（連続失敗）した場合は、直ちに本条の **代替手段**へ移行せよ。

**代替手段（REST 手順）への即時移行**:
- 構造的エラーまたは連続失敗が発生した場合、AI は **検知したターンの先頭**で **「MCP エラーにより REST 手順へ移行」**と明記し、以下のいずれかでタスクを完遂せよ。
  - **(a) 既存パターンの応用**: `scripts/` 内の検証済み Node.js パターン（`preview/app.json` 等）を、現在のタスク用に改修して実行する。
  - **(b) 一時スクリプトの生成**: `scripts/tmp-kintone-*.mjs` を作成し実行する。これらは **タスク完了時に削除**するか、再利用価値がある場合は **正規のファイル名**（`ops-*.mjs` 等）に昇格させ、リポジトリを整理せよ。
  - **証跡**: `scripts/tmp-kintone-*.mjs` を作成した場合は、**同一ターンのチャット**または **`chat-sessions/handoff-log.md` 末尾追記**に、**ファイル名**と **削除／昇格の最終結果**を 1 行で残す（掃除の形骸化防止）。

**目的**: CEO（浜田）の認知負荷を最小化し、道具の故障を理由に作業を止めない **「止まらない自律開発」**を維持する。**期待値の言語化**: 「今夜中」等の曖昧な期限表現に依存せず、**当該タスク単位で本条に従い完遂**し、一時成果物は **完了時に掃除または昇格**する。

#### §50-3-10 Cursor 正本との鏡像（完全覚醒・MCP 可視化）（2026-04-30 制定 / 浜田合意）

**目的**: `AGENTS.md` を常に開かない前提でも、Cursor が毎セッション注入する **`.cursorrules`** に **CIO 体制の最高位補足**（自律型 CTO「完全覚醒」プロトコル・**MCP 使用ターンの `[実行経路: MCP …]` と完了報告での MCP 結果記載**・スターター強制 Read）が載ることを憲法側から **鏡像として承認**する。

- **正本の優先**: 本条と **`.cursorrules` の 🔱 完全覚醒節**が食い違う場合は **`AGENTS.md` 本文を優先**し、`.cursorrules` を追随修正する（逆は禁止）。
- **30 行超コードの主出力（2026-05-21 方式B 整合）**: **長文ドラフトは Kimi（MCP）**。**コード diff の主筆は Composer 2.5 Subagent**（§1-2-3-4）。MCP 未到達・失敗時は **§50-3-1 / §50-3-4** に従い **CIO（Opus 本体）が続行してよい**（「原則」の例外を濫用しない）。
- **検索語の定義**: kintone クエリの **`like` は英数字の単語境界**等、**ブラウザ内部分一致と同一ではない**。受け入れ条件に **「どの層（REST query / クライアント絞り込み）で一致させるか」**を明記する（`.cursorrules` 完全覚醒 C 参照）。

#### §50-3-11 4AI 開発プロトコル（方式B・機械ゲート・2026-05-21 制定 / CEO 浜田）

**背景**: 固定4AI体制（§1-2-3-4）とタスクA/B/C インターロックを **憲法条文**として運用に接続する。スクリプトだけに閉じず、**着手順序**を CEO・AI 共通の絶対手順とする。**§50-3-8 の意味は本条で縮小しない**（本条は機械化の追加層）。

**上位条文との関係（デグレード禁止）**: 本条は **§35-1 / §56-1a / §41 / §51 / §1-2-2 / §52** を **置換・削除しない**。**矛盾時は番号の小さい章・既存 CEO 合意条文を優先**し、本条は **手順の追加**に限定する。

**固定4AI（要約）**:

| # | 役割 | 担当 |
|---|------|------|
| ① | CIO | **Opus 4.7 ベース / 必要時 Opus 4.8**（§1-2-3-4-B） |
| ② | コード実務 | **Composer 2.5**（Subagent・diff のみ） |
| ③ | 長文レビュー | **Kimi** |
| ④ | 知恵袋 | **DeepSeek** |

**4AI連携プロトコル（横のつながり・§1-2-3-4-A と同一）**:

1. **【CIO（Opus 4.7）】** が方針を決定し、セッション割当（毎ターン4行）を宣言する。
2. 何かを作る前、直ちに **【知恵袋（DeepSeek）】** が起動し、盲点3点（§50-3-8）を突合・監査する。
3. 監査を通った仕様に基づき、**【コード実務（Composer 2.5）】** が安全に実装・Diffを打つ。
4. 成果物を **【Kimi】** が精査（レビュー）し、最終結果を **【CIO】** が浜田へ1行要約して報告する。

**開発時の絶対3ステップ**（`customize/**`・仕様書・`deploy:*` に触れる **前**・上記 2〜3 の機械化）:

1. **DeepSeek 1 問** — 盲点・反例・仕様乖離（§50-3-8 一次。省略時は `§50-3-8 スキップ理由:` **具体1行**）
2. **突合 3 行** — CIO が `SPEC.md` 等正本と照合しチャットに記録（`[役割: CIO セカンドオピニオン / §50-3-8 突合]` 推奨）
3. **機械スタンプ** — `npm run cio:guard:5038 -- --stamp --text "…"` または `--skip "理由"`（45分有効・`logs/cio-four-ai-governance/5038-stamp.json`）

**第4ステップ — Composer MCP 監査（eslint-mcp / repo-tree・2026-05-29 CEO 追補・§50-3-8 非置換）**:

上記 **1〜3 完了後**、**コード実務（Composer 2.5）** が Diff を **保存する直前または直後**（同一ターン）に:

1. **eslint-mcp** — 変更ファイルの lint。**Warning 0** 必須
2. **repo-tree** — 影響ディレクトリの構造可視化
3. **CIO へ 1 行証明** — `MCP監査: eslint=0 warnings / repo-tree=OK / 対象=…`
4. **機械スタンプ** — `npm run cio:guard:composer-mcp-audit -- --stamp --text "…"`（45分有効・`composer-mcp-audit-stamp.json`）

正本: `.cursor/rules/composer-mcp-audit-gate.mdc`。スキップ: `--skip "具体理由1行"`（README 誤字のみ等）。

**第5層 — 3重コンテキスト強制解体（2026-05-30 CEO 追補・§50-3-11 非置換）**:

1. **15 ターン / 40k 壁** — `npm run cio:session:turn-guard -- --check --strict`（超過かつ export 未完了 → **exit 1**）
2. **荷造り** — `npm run cio:session:export-handoff` → `docs/handoff/latest-session-bridge.json`
3. **New Chat import** — `npm run verify:session-handoff-integrity -- --import` → exit 0
4. **週末連動** — `npm run cio:weekend:autonomous-audit` が bridge をロードし監査詳細をマージ

正本: `.cursor/rules/cio-context-dissolution-interlock.mdc` / `docs/runbooks/cio-weekend-autonomous-audit.md`

**第6層 — 超自律化（方針1〜3・2026-05-30 CEO 追補・§50-3-11 非置換）**:

1. **方針1 — 自律エスカレーション**: `eslint-mcp` / verify が **連続2回** exit 1 → Composer **ロック** → **DeepSeek** §50-3-8 強制（`npm run cio:composer:escalation-guard -- --prompt-deepseek`）→ Self-Heal **最大3回** → 失敗時 **CIO(Opus 4.8)** ハブで CEO 報告
2. **方針2 — SPEC 自動スコアリング**: `npm run cio:task:score-spec` — 難易度(5) × Token(低/中/高) × Impact(5) → `docs/handoff/spec-task-scores.json` + SPEC 優先順位節を自動更新 → 次セッション割当の入力ソース
3. **方針3 — Handoff ビジュアルマップ**: `npm run verify:session-handoff-integrity -- --import` 成功直後に **【4AI引っ越し完了マッピング表】**（gitHead / SPEC進捗% / MCP稼働 / repo-tree lite）をチャット最先頭へ

正本: `.cursor/rules/cio-composer-escalation-interlock.mdc` / `scripts/lib/cio-handoff-visual-map.mjs` / `scripts/cio-task-score-spec.mjs`

**第7層 — 環境自律化（改善案1〜3・2026-05-30 CEO 追補・§50-3-11 非置換）**:

1. **改善案1 — 環境変数セルフ監査**: `npm run verify:cio-env-integrity` — `.env` / `mcp.json` env / `customize/**` 参照キーを検査。不足時 **exit 1** + `【警告】環境変数に不足があります。〇〇…未配備`
2. **改善案2 — 死に文週末パージ**: 週末 `cio:weekend:autonomous-audit` + **Kimi 精査職分** — 3階層索引外の死に文を `docs/archive/dead-lines/` へ安全退避（`npm run cio:dead-lines-purge -- --apply`）
3. **改善案3 — 3択エラーチケット**: Self-Heal **3回**上限 → `npm run cio:error:generate-ticket` → `docs/issues/bug-latest.md`（ログ・3アプローチ・§50-3-8仮説・**CEO 3択**）→ チャット1行待機

正本: `.cursor/rules/cio-env-integrity-gate.mdc` / `.cursor/rules/cio-error-ticket-gate.mdc` / `data/cio-env-manifest.json`

**第8層 — 極限自律防衛（拡張案1〜3・2026-05-30 CEO 追補・§50-3-11 非置換）**:

1. **拡張案1 — 3択自動承認**: CEO 1行「選択肢Nで実行」→ `npm run cio:error:apply-ticket-choice -- --choice N` — チケット内 `CIO-EXEC-CHOICE-N` / Diff 適用 → verify 群再駆動
2. **拡張案2 — Self-Healing Env**: `npm run cio:env:self-healing` — `docs/secure/.env.enc` + `CIO_ENV_MASTER_KEY` で不足キー自動復元 → `verify:cio-env-integrity` exit 0
3. **拡張案3 — デッドコード週末パージ**: 週末監査 + Kimi×Composer — 未参照 export を `docs/archive/dead-codes/` 退避 — `[WEEKEND-DEAD-CODE-PURGE]` コミット

正本: `.cursor/rules/cio-error-ticket-apply-gate.mdc` / `.cursor/rules/cio-env-self-healing-gate.mdc` / `docs/secure/README.md`

**第9層 — 最終完結自律防衛（拡張案1〜3・2026-05-30 CEO 追補・§50-3-11 非置換・環境改善フェーズ一旦完了）**:

1. **拡張案1 — 週末救済ロールバック**: `npm run cio:rollback:weekend-actions` — verify NG 時に `[WEEKEND-*]` コミットを解析・revert → 金曜 baseline 安全圏へ自動退避 + 1行安全報告 + lock
2. **拡張案2 — SPEC 論理 Linter**: `npm run verify:cio-spec-logic` — DeepSeek 職分の静的解析 — 矛盾検知で exit 1 + 赤字 `【仕様矛盾】` — 実装着手ロック
3. **拡張案3 — デバッグ知恵ストック**: `cio:session:export-handoff` データ抽出 — Kimi 職分 — エラー/解決手順を `docs/knowledge/debug-tips.md` へ 4要素（前提/手順/禁止/exit）自動追記

正本: `.cursor/rules/cio-weekend-rollback-gate.mdc` / `.cursor/rules/cio-spec-logic-gate.mdc` / `.cursor/rules/cio-debug-tips-stock-gate.mdc` / `data/cio-weekend-rollback-baseline.json`

**第10層 — 憲法ジャンル細分化最適化（2026-05-30 CEO 最終命・§50-3-11 非置換・環境改善大団円）**:

1. **AI-KERNEL 4要素カーネル** — `docs/constitution/19〜22-*-kernel.md`（統制・コスト防衛・週末パトロール・エラーハンドリング）
2. **機械検証**: `npm run verify:constitution-genre-kernels`
3. **Desktop 00〜27**: `session-starter:sync-desktop` + `verify:desktop-ai-emergency-sync` — 方式B Opus 4.8ハイブリッド・第9層エッセンス100%反映

正本: `docs/constitution/README.md` / `chat-sessions/desktop-ai-emergency-read-pack/08-INDEX.txt`

**第11層 — 土日環境改善3大自律インフラ（2026-05-30 CEO 超厳命・§50-3-11 非置換）**:

1. **タスク① — kintone フィールド Linter**: `npm run verify:kintone-fields` — `data/kintone-field-registry.json` + `customize/**` 抽出突合 — 未登録 high → **exit 1**（本番 PUT ロック）
2. **タスク② — Kimi コミット 4要素**: `git-hooks/prepare-commit-msg` → `scripts/cio-commit-msg-kimi-draft.mjs`（`npm run cio:commit-msg:kimi-draft`）— 憲法 diff に **前提/手順/禁止/exit** + `Reviewed-by: kimi` 追記 — 週末 JST 自動バイパス
3. **タスク③ — Handoff 荷造り漏れ**: `npm run verify:session-handoff-integrity -- --validate-export` — bridge / checkpoint / SPEC / gitHead **DeepSeek 職分**クロスチェック — NG → 解体ロック

正本: `.cursor/rules/cio-kintone-fields-gate.mdc` / `cio-commit-msg-kimi-gate.mdc` / `cio-handoff-export-validate-gate.mdc` / `data/kintone-field-registry.json`

**第12層 — 2大新規MCP＋ライブ Linter / 先祖返り防衛（2026-06-14 CEO 超厳命・§50-3-11 非置換）**:

1. **kintone-schema-mcp** — 実 kintone form / views / settings を REST 取得 — `mcp/kintone-schema-mcp/index.mjs` — 第11層 `verify:kintone-fields` と **実スキーマ突合**
2. **git-history-mcp** — Git ログから憲法改定層・4要素コミットを検索 — `mcp/git-history-mcp/index.mjs` — `cio:session:close-git` / handoff と連動
3. **拡張案1**: `npm run verify:kintone-live-schema` — customize/** × 実機 preview form — **Warning 0** 必須 — deploy 前段（`cio-deploy-preflight-guard`）にも連鎖
4. **拡張案2**: `npm run verify:git-history-alignment` — 過去 governance 世代スキャン — New Chat import 時 **`--handoff` 自動連鎖**
5. **配備**: `npm run apply-layer12-mcp` → `npm run mcp:sync-cursor-windows`
6. **機械検証**: `verify:cio-weekend-layer12-infra` / `verify:cio-weekend-layer12-ext-infra` / `verify:cio-mcp-layer12-probe`

正本: `docs/mcp-status.md` §活性化 — 第12層 / `data/git-history-guard-manifest.json` / `.cursor/rules/cio-kintone-live-schema-gate.mdc` / `.cursor/rules/cio-git-history-alignment-gate.mdc`

**第13層 — MCP×CLI 単一窓・定例ヘルス（2026-06-14 CEO 追補・§50-3-11 非置換）**:

1. **単一窓**: kintone-schema-mcp ↔ `verify:kintone-live-schema` / git-history-mcp ↔ `verify:git-history-alignment` — **同一正本・矛盾禁止**
2. **extended probe**: `npm run cio:mcp:env:extended` — 第12層 MCP initialize を **末尾連鎖**
3. **handoff / deploy 連鎖**: import → `--handoff` 自動 / deploy preflight → `--app` live-schema 自動
4. **月次**: `cio:periodic:monthly` — `--portfolio` live-schema 内包
5. **ゾンビ**: `git-history-mcp … 6月以降` — `verify:mode-b-zombie-docs` 検知

正本: `AGENTS.md` 第13層 / `.cursor/rules/mcp-tool-discipline.mdc` / `docs/runbooks/cio-periodic-ops-schedule.md`

**担当定義の極限明文化**: **`AGENTS.md` §1-2-3-4-A**（完全マトリクス）・`mode-b-canonical.mdc`（用語単一窓）・Desktop **`18-重要確認.txt`**（浜田視認用）。

**タスクA — Composer silent fallback 禁止（§1-2-2 強化）**:

- 検知: `Switched to Composer` + 正規表現 `Composer\s*2(?:\.5)?`
- コマンド: `npm run cio:guard:composer-interlock`（`verify:cio-mcp-registry` に内包）
- 違反時: **exit 1** + 「【警告】方式B違反：CIO（Claude Opus 4.7）の指揮、および残るメンバー（Kimi・DeepSeek）の検証を経ない単独保存・deployは憲法違反です」
- **CEO 承認の Composer Subagent** は `[🎖️ 本セッション割当]` の `Composer=Subagent…` で §1-2-2 対象外と区別

**タスクB — §50-3-8 証跡ゲート**: `git commit`（staged に spec-touch）・`deploy:*` 前に証跡必須。Hook: `.cursor/hooks/cio-four-ai-interlock.mjs`。

**タスクC — ゾンビ文書**: `npm run verify:mode-b-zombie-docs` / `cio:prune:mode-b-zombie-docs -- --apply`。

**階層索引**: `docs/constitution/00-rule-hierarchy.md`（第1憲法 / 第2機械 / 第3 runbook）。用語単一窓: `.cursor/rules/mode-b-canonical.mdc`。

**緊急**: `SKIP_CIO_MODE_B_INTERLOCK=1`（浜田 GO + チャット理由1行）。

#### §50-3 関連

- §1-2-3-4（4AI方式B・CIOセッション特例）/ §1-2-4（クレジット予算）/ §18 / §41 / **§50-3-8** / **§50-3-9** / **§50-3-10** / **§50-3-11**（4AI開発プロトコル・機械ゲート）

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| §↔ジャンル | `data/constitution-section-genre-map.json` |
| Cursor 常時 | `.cursor/rules/cio-constitution.mdc` |
| 手順 | `WORKFLOW.md` |

