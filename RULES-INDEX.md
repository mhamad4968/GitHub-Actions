# RULES-INDEX.md — AGENTS.md 逆引き索引

> 目的: AGENTS.md §1〜§44 を「いつ / どんな状況で参照するか」で素早く引けるようにする。
> 更新ルール: AGENTS.md にルールを追加・改訂したら本ファイルも同時に更新する（§43 WORKFLOW.md Phase 5 で記録）。

---

## 🚀 タスク開始時に必ず参照

| ルール | 役割 |
|---|---|
| §0 | **RULES-INDEX 即答カード参照**（索引駆動の起点 / 「まず索引→該当 § を読む」を強制） |
| （Cursor）**`cio-operating-loop.mdc`** | **CIO 運用の一本線**（2026-05-02）— 正シェルは **`~/kintone-ai-lab`（WSL）**／朝は **`docs/reports/<JST日付>-morning-prep.md`** → **`desktop-ai-emergency-read-pack/09-READ-07.txt`**（浜田 CEO のお願い）→ 追徴なら **`npm run cio:quick-health`**／切替手順は **`constitution-handoff-gate.mdc`** + `NEW-SESSION-STARTER`「貼付単独で完走」／Read pack + `SESSION-READ-LADDER.md`／Desktop 更新後は **`npm run desktop:sync-and-verify`** を優先 |
| （Cursor）**`mcp-server-use-triggers.mdc`** | **MCP サーバ選択（1 行トリガー）**（2026-05-02 / CIO×DeepSeek・Kimi・OpenRouter 相談反映）— GitHub・kintone 本番/開発/スペース・fetch・Tavily/DDG・Playwright・RAG・CVE/ニュース・markdownify・memory・sequential-thinking・OpenRouter（**`model` 必須**）。**descriptor 必読**は **`mcp-tool-discipline.mdc`** |
| §1 / §1-2 / §1-2-2 / §1-2-3 / §1-2-3-1 / §1-2-3-2 / §1-2-3-3 / §1-2-4 | 役割定義 + **最適モデル原則 / Opus 4.7 デフォルト枠**（§1-2 / 2026-04-26 R-3 改定 = 「Opus 統一」を「最適モデル」に転換 / 浜田指示「絶対にこのモデルを使うというこだわりはしない」/ 別モデルへの常時切替・レビュー用サブエージェント禁止は維持 / 例外は §1-2）+ **API 制限到達時の自動フォールバック禁止**（§1-2-2 / N-3 / N-4 で 4 択 A-D 提示の枠組み + §1-2-2-1 Cursor IDE 必須設定 = Q1 で 4 → 8 項目 + Browser Protection ON + MCP Tools Protection ON + Monthly Limit $1000 / TSB-019 連動）+ **Opus 内モデル使い分け**（§1-2-3 / N-5 / 既定 Extra High / Max Thinking は §47-A 100% 証明・設計判断・複雑バグ修正のみ）+ **AI 自己宣言義務**（§1-2-3-1 / P5-5 / タスク冒頭で `[§1-2-3 ティア判定: Extra High/Max Thinking]` を 1 行明示 = 形骸化対策 / F-13 教訓）+ **AI 自律モデル選択原則**（§1-2-3-2 / R-3 / 3 段階 L1 Composer 2 / L2 Extra High / L3 Max Thinking / 1 秒判定フロー / 不可逆操作は L3 強制 / silent fallback と区別 = ティア宣言で証跡 / F-14 対策 = Max Thinking 59.4% → 20-30% 想定）+ **CIO によるモデル最終判断**（§1-2-3-3 / 2026-04-29 / 浜田 CIO が明示したティアは §1-2-3-2 に優先 / 未指定時は §1-2-3-1/2）+ **クレジット予算管理 改定**（§1-2-4 / P5-5 / 月予算 $200+$1000 引上げ / 3 系統 (Total/API/On-Demand) / 70-80-85-95% 4 段階自発警告 / Spending スクショ抽出 / 朝報 §0 統合 / TSB-018/TSB-021 連動）|
| §51 / §51-3 / §51-6 / §51-6-2 | **並列禁止 + セッション分割推奨 + AI 自律セッション切り命令権**（§51-3 並列禁止 / §51-6 提案レベル + **遵守事項 5** = 2026-04-29 切替直後 **`session:clock:set` 必須** + **`session:clock:web` URL をチャットに転記し浜田にブラウザで開くよう促す** / **§51-6-2 命令権** = 2026-04-26 R-4 / 浜田 10:30「セッションを切ることは重要 / 命令指示権限を与える」/ 6 つの自律発動条件 (4h / 200 tool call / 重作業完了直後 / コスト 2x / Tier B 直前 / API 100%) / 浜田却下時は §47-D で逆却下 / 引き継ぎを checkpoint-latest.md へ追記義務 / **次チャット初手で遵守事項 5**）|
| §51-6-2 運用 | **`npm run session:clock:set`**（切替毎・必須）／**`npm run session:clock:clear`**（終了時・`開始:` を未設定）／**`npm run session:clock:web`**（バックグラウンド・URL を浜田へ・止めるは Ctrl+C）／**`npm run session:clock:health`**（壁時計・hooks・crontab・watch pid ワンショット）／**`npm run verify:session-clock-health`**（`session:bootstrap` 内包・厳格）／`SESSION-SPLIT-REMINDER.md`／§**16-1** 個人端末のローカル前準備（`AGENTS.md`）|
| §50-3 / **§50-3-2a** / **§50-3-8** / **§50-3-9** / **§50-3-10** | **CTO運用規定**（コスト・自律・安全 / PlanB / **航海図 vs §51** / **CEO 差し替え** / **§50-3-2a MDD 語彙＝航海図＋SPEC/md 正本**（一次定義）/ 安価MCP 3回or5分 / サニタイズ / 憲法適合＋コマンド併記 / §41 相談 / **§50-3-8 盲点・DeepSeek 着手前＋突合メモ** / **§50-3-9 kintone MCP 失敗時の REST 自律迂回**（構造エラー再試行禁止・通信1回・`tmp-kintone-*` 掃除）/ **§50-3-10 `.cursorrules` 鏡像** / 2026-04-29–30）／**仕様確認分業（🎖️表の下位）**: `.cursor/rules/deepseek-cursor-spec-division.mdc`（知恵袋→CIO 突合・2026-05-01）|
| §52 / §52-3 / §52-8 / §52-8-1 / §52-9 | **RACI Tier A/B 自律レベル**（§52-3 6 問自己診断）+ **§52-8 高リスク shell 暴走防止**（Q1 / TSB-019 連動 / rm -rf・git push --force・npm install (新規)・chmod -R・sudo・.env 編集 等は事前報告 → 浜田 GO 待ち）+ **§52-8-1 物理 block 層**（P5-1/R1 / TSB-019 構造的根本対策 / `~/.cursor/hooks/dangerous-shell-blocker.sh` で OS レベル deny / 三層防御確立）+ **§52-9 Tier A 範囲ミス発見時の自律修正権**（2026-04-26 R-5 / 浜田「ミスや発見があれば即座にこちらに確認しないで進めてよい」/ §52-4 Conservative Default の能動的反対側補完 / Tier A のみ即修正可 / Tier B / §52-8 / §57 / scope 外 / Cursor IDE 設定変更 は適用外 / 完了報告 + logs/autonomy-decisions/auto-fix-*.md 事後トレース義務）|
| §39 | 発言前の日時確認（絶対遵守）|
| §34 | 人間尊重プロトコル |
| §42 | セッション冒頭の過去ログ確認義務 |
| §42-2 | **Continuity Assurance (継続性保証 / ファイル直読方式 / 2026-04-24 制定)** = 浜田 21:24「明日 19:00 開戦時 1% の不安ゼロ」/ 唱和案はレビューで却下（自己循環・同一ファミリー内相互検閲の馴れ合いリスク・§47-B-2）→ ファイル直読方式 (AGENTS.md 全文 Read + SHA256 ハッシュ比較 + BREAKING ラベルフィルタ + RAG Tier S 自動クエリ + Tier マーカー) で代替 |
| §55 | **異常時セーフモード (R13 / 2026-04-24)** = 浜田 #2 GO / 判断材料欠損時は Tier A 縮小・副作用は Tier B / 読取・診断は継続 / §42-2-7 AGENTS Read 失敗は即発動 / 解除は浜田明示 or health-check 手動完走 + 朝報整合（cron のみ不可） |
| §56 / **§56-1a** | **責任の所在 RACI** + **開発=AI・確認=浜田（憲法級・変更禁止）**（R14 / 2026-04-25 + 2026-04-26 浜田宣言） |
| §43 | WORKFLOW.md 遵守義務（Phase 0-5）|
| §44 | 夕反省サイクル（手動トリガー）|

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
| §38 | ツール・依存関係の自律保守 |

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
| `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` | 引き継ぎ後の **全棚卸し**（経緯・法律相当・ルール・npm 機能・MCP・**必須機械検証**・チャット報告様式）／**フェーズ 1c**＝部署予実本題時の Read 正本 |
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
| `docs/troubleshooting.md` **TSB-029** | **`user-markdownify`** — `@iflow-mcp/markdownify-mcp` の **`preinstall.js` 欠落 publish バグ**で stdio 即死。対策: **`npm install -g --ignore-scripts @0.0.2`** ＋ **`node …/dist/index.js` 直起動**＋`UV_PATH`（詳細は本文） |
| `.cursor/rules/constitution-handoff-gate.mdc` | **alwaysApply** — §35-1 / §56-1a / TSB-024 / §1-2-3-1 を毎ターン想起（Cursor 全チャット） |
| `.cursor/rules/cio-discipline-always.mdc` | **alwaysApply: true** — §35-7＋**674 deploy 機械ゲート**（`cio:preflight:674` → `deploy:674`・45 分・`SKIP_CIO_DEPLOY_GUARD` 緊急脱出）＋HANDOFF 先読み（`AGENTS.md` **v23.33**） |
| `.cursor/rules/autonomous-with-mandatory-asks.mdc` | **alwaysApply** — **自律実行してよいが**、日取り矛盾・GO 境界・曖昧仕様など **聞くべきことは着手前に聞く**（浜田指示） |
| `.cursor/rules/creation-timing-ask.mdc` | **alwaysApply** — **作成着手前**に浜田へ **「今すぐ作成／後日」** と **配置スペース（ID または名）** を §41 で確認。未決なら `kintone-add-app` の `space` 省略で進めない（浜田指示 2026-04-28） |
| `.cursor/rules/session-handoff.mdc` | 人間 5 行＋AI の `handoff-log` 追記手順。**自律復元**の追記あり |
| `.cursor/rules/session-read-ladder-two-phase.mdc` | **alwaysApply** — セッション復元の **二段階**（**A 事前準備**＝ルールのみ五段／**B 本題確認**＝仕様小出し）。**第0手**で `SESSION-READ-LADDER.md` を **Read 通読**。正本は `chat-sessions/SESSION-READ-LADDER.md`。**当面の目安**: 事前準備 **約1h**／本題 **約3h**（同ファイル「当面の時間目安」） |
| `.cursor/rules/mcp-tool-discipline.mdc` | **alwaysApply** — `call_mcp_tool` 前の **descriptor 必読**・`mcp_auth` 順序・curl/gh と MCP の優先（自律ミス低減） |

---

## 関連

- `AGENTS.md` — ルール本文（憲法）
- `WORKFLOW.md` — タスク作業 OS（Phase 0-5）
- `kintone-apps.md` — kintone 仕様の正本
- `docs/troubleshooting.md` — 失敗事例 TSB-XXX
