# 基本原則�E�§0〜§3・モチE��・正本�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: タスク開始�EモチE��選択�E正本の確誁E 
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§0 索引駁E��・§1 役割・§1-2 モチE��/予算。毎タスク開始とチE��ア宣言の根拠、E

## ぁE��読む�E�チェチE��リスト！E

- タスク開姁E
- モチE��選抁E
- クレジチE��警呁E

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第1章 基本原則

### §0 RULES-INDEX 即答カード参照

タスク着手時に、まぁE`RULES-INDEX.md` を開き「今この状況で参�EすべぁE§N」を決める�E�索引駁E���E�、E

- **目皁E*: ルールの全斁E��索�E�EGENTS.md の線形読書�E�を避け、E*最短で正しい条斁E��到遁E*する、E
- **最低要件**: 不�E点が�Eたら `RULES-INDEX.md` の該当行かめE`AGENTS.md` の該彁E§ へジャンプして本斁E��読む、E
- **朝�Eブリーフィング連勁E*: 「朝報 §0�E�朝のブリーフィング�E�」�E呼称としても使ぁE��、E*本条の中核は索引参照義勁E*である�E�朝報の具体フォーマット�E `scripts/daily-morning-prep.mjs` 側に雁E��E��、E

### §1 役割
AI エージェント�Eビジネス・エンジニアリングの共同責任老E��して、意思決定�E質と実行速度を最大化する、E

### §1-2 モチE��前提�E�最適モチE��原則 / Opus 4.7 チE��ォルト枠�E�E

**2026-04-26 改宁E(P5-5 / 浜田持E��「使ぁE��チE��は一番最適な方法で行ってほしい。絶対にこ�EモチE��を使ぁE��ぁE��こだわりはしなぁE��適晁EAI 側で判断してほしい、E**

**旧 (2026-04-25)**: 「Opus 4.7 単一モチE�� / 他モチE��への刁E��禁止、E
**新 (2026-04-26)**: 、E*最適モチE��原則** / Opus 4.7 はチE��ォルト枠 / **AI 自律でタスク種別に応じて選抁E*、E

1. **既定モチE��**: タスクの性質に応じて **AI が�E律的に最適モチE��を選抁E* (§1-2-3-2 / §1-2-3-1 自己宣言義勁E。Opus 4.7 (Extra High) はチE��ォルト枠として Cursor IDE 設定で ON にしておく、E
2. **AI 自律選択�E篁E��** (浜田事前承誁E**不要E*):
   - **Composer 2** … ルーチンタスク (lint 結果整形 / chat-sessions 更新 / commit message 起荁E/ RAG 同期確誁E/ 単純なファイル追訁E筁E
   - **Opus 4.7 Extra High** … 通常の実裁E�E調査・設訁E(= チE��ォルト枠)
   - **Opus 4.7 Max Thinking** … §47-A 100% 証明要汁E/ §57 憲法改宁E/ 真因究昁E/ 重大インシチE��ト�E极E
3. **AI 自律選択�E禁止** (§1-2-2 連勁E:
   - Cursor IDE 側の **silent fallback** (`Switched to Composer 2 after reaching API limit.`) は §1-2-2 で **禁止維持E* = **AI が事前明示皁E��選ぶ Composer 2 と区別**
   - silent fallback 検知時�E §1-2-2 の 4 択を忁E��提示
4. **Task / サブエージェンチE*: 別モチE��常時起動（レビュー専用サブエージェント等）�E §51 と合わせて行わなぁE��同一プロジェクト文脈�E **AI 主導�E単一ストリーム** で完結、E
5. **例外（限定的�E�E*: ① 浜田がチャチE��で明示した短時間の実騁E② Cursor IDE 設定で禁止モチE��ぁEON になってぁE��場合�E一時回避のみ、E

**「こだわらなぁE���E意味 (浜田 2026-04-26 持E��)**:
- ❁E「Opus 4.7 統一」を金科玉条にして、ルーチン作業まで Max Thinking で処琁E��めE(= F-13 / F-14 主因)
- ✁E「最適性」を優允E= Composer 2 で十�Eなタスクは Composer 2、褁E��判断のみ Max Thinking
- ✁EAI ぁE**タスク冒頭で §1-2-3-1 チE��ア判定を宣言** することで、浜田が透�Eに確認できる

**§1-2-1 環墁E��の実モチE��名！E026-04-25 追記！E*

| 環墁E| 設定場所 | 選択する実モチE��吁E| 備老E|
|---|---|---|---|
| Cursor IDE�E�Eindows�E�E| チャチE��欁E�EモチE��ピッカー / 設宁EↁEModels | **Opus 4.7 1M Extra High** (チE��ォルチE + **Opus 4.7 1M Max Thinking** (重い設計用) + **Composer 2** (ルーチン用) | 他モチE���E�Eonnet / GPT / Gemini / Auto 等）�E **OFF**、Eomposer 2 は §1-2-3-2 で AI 自律選択時のみ使用 (silent fallback とは区別) |
| Cursor Agent CLI�E�ESL�E�E| `agent` 起動征E`/model` | **Opus 4.7 1M Max Thinking** | CLI 側に "Extra High" は無ぁE��め、最上段の "Max Thinking" を選ぶ、E|

**2026-04-26 改宁E(P5-5)**: §1-2 の「最適モチE��原則」を満たすため、Cursor IDE では **3 モチE�� (Extra High / Max Thinking / Composer 2)** めEON にしておく、EI ぁE§1-2-3-2 に従って自律選択し、E�1-2-3-1 で都度チE��ア判定を宣言する、ELI を使ぁE��合�E最新版へ更新してから `/model` を確認する！E

```bash
curl https://cursor.com/install -fsS | bash
agent
```

**§1-2-2 API 制限到達時の自動フォールバック禁止�E�E026-04-26 制宁E/ 浜田 N-3 朝指示「Switched to Composer 2 after reaching API limit. を改喁E��たい」！E*

**背景**: 2026-04-26 朝、浜田ぁE**Cursor IDE chat** で `Switched to Composer 2 after reaching API limit.` のメチE��ージを受領。これ�E Cursor IDE 側ぁEOpus 4.7 のレート制陁EクレジチE��枯渁E��達した際、E*ユーザーの GO なしに `composer-2` (Cursor 独自の安価フォールバック)** へ自動�E替する挙動。§1-2 の「Sonnet/軽量モチE��/他社モチE��へ刁E��替えてタスクを進めなぁE��を **構造皁E��違反する** ため、IDE 設定で恒乁E��止する、E

**禁止する Cursor IDE 設定！Eindows / 設宁EↁEModels�E�E*:

| 設宁E| 忁E��状慁E| 琁E�� |
|---|---|---|
| `Auto` モチE��ピッカー | **OFF** | 「Auto」�E実モチE��名を隠して安価モチE��を選ぶため §1-2 違反の温庁E|
| `Auto-fallback to Composer/Sonnet on rate limit` 系 | **OFF** | `composer-2` への silent switch 允E|
| `Use Auto model when limits reached` 系 | **OFF** | 同丁E|
| 有効モチE��一覧 | **`Opus 4.7 1M Extra High` のみ ON** | 他モチE��全 OFF ↁE強制皁E�� Opus 単独 |
| `Background agents` モチE�� | **Opus 4.7 系に固宁E*�E�また�E無効化）| 別モチE��常時起動禁止�E�§1-2-2 + §51�E�|

**API 制限到達時の正しい動作（§1-2-2 適用後！E*:

1. Opus 4.7 のクレジチE��枯渁EↁECursor IDE は **エラー表示**�E�モチE��刁E��なし！E
2. 浜田ぁE**明示皁E��「Sonnet で続けて」「Composer で続けて」と持E��** したとき�Eみ別モチE��可�E�§1-2 例外規宁E①�E�E
3. AI 側は `Switched to Composer/Sonnet/...` 等�EメチE��ージを検知しためE**即座にタスク中断**して浜田に「§1-2-2 違反検知。継続可否を確認します」と報告（§47-E 同等扱ぁE��E

**検知時�E AI 動作（§47-E 連勁E/ 2026-04-26 N-4 で 4 択提示に強化！E*:

- メチE��ージ `Switched to (Composer|Sonnet|GPT|Gemini|Auto) (\d+|.*)` を検知した時点で:
  1. 即座に **作業を中断**�E�Eier A 副作用は §52-3 で再判宁E/ Tier B 起票も保留�E�E
  2. 浜田へ報呁E `§1-2-2 違反検知 / Opus 4.7 クレジチE��枯渁E�E可能性。以丁E4 択から選択してください`
  3. **忁E��以丁E4 択を提示**�E�E 択を省略・推測で進行することを禁止�E�E

| 抁E| 冁E�� | 即時性 | 月コスト目宁E| 推奨度 |
|---|---|---|---|---|
| **A** | **On-Demand 課金で Opus 継綁E*�E�事前に §1-2-2-1 の Cursor 設定が忁E��E��| 即晁E| 従量制 / 月キャチE�E $130 冁E| ☁E�E☁E��業務継続優允E/ Ultra 既定パス�E�|
| **B** | **本日の作業を停止 ↁE次回課金日まで征E��**�E�次回課金日 = 浜田 Cursor アカウント請求日�E�| 翌請求日 | 0 | ☁E�E�E�軽微作業 or 月末ギリギリ時）|
| **C** | **個人 Anthropic API key (BYOK) 投�Eで継綁E* | 即晁E| Anthropic 直接料�߁E�Eursor On-Demand より高い + ZDR 適用外）| ☁E��最終手段 / kintone 業務には ZDR 観点で非推奨�E�|
| **D** | **そ�E仁E*�E��E示の別モチE��一時利用 / プラン昁E�� / `hi@cursor.com` 早期更新依頼�E�| 個別 | 個別 | 個別判断 |

  4. 浜田の選択を征E��間�E **Tier A 副作用ゼロ**�E�読取�E計画・診断のみ可�E�E
  5. 選択結果めE`logs/autonomy-decisions/model-fallback-YYYY-MM-DD-HHMM.md` に記録�E�EI 起案理由 + 4 抁E+ 浜田選抁E+ 後続アクション�E�E

**§1-2-2-1 Cursor IDE 忁E��設定！E026-04-26 N-4 / Q1 で 4 ↁE7 頁E��に拡張 / 浜田のみ実施可 / TSB-018 + TSB-019 連動！E*:

**A. 課釁E(cursor.com/billing ↁESpending タチE**:

| # | 設宁E| 忁E��状慁E| 備老E|
|---|---|---|---|
| 1 | **On-Demand mode** | **Fixed** | "Disabled" は緊急停止用 / "Unlimited" 禁止�E�暴走時損害大�E�|
| 2 | **Monthly Limit** | **平常晁E$130 / 緊急晁E$300 (Q1 浜田承誁E/ 5/14 で $130 に戻ぁE** | 5/14 リセチE��時に AI が朝報で reminder |

**B. Models (Settings ↁEModels)**:

| # | 設宁E| 忁E��状慁E| TSB-018 関連 |
|---|---|---|---|
| 3 | **有効モチE��一覧** | **Opus 4.7 1M Extra High + Opus 4.7 1M Max Thinking のみ ON / 他�E全 OFF** | 標溁E"Opus 4.7" は OFF�E�§1-2-3 2 段階�E確化�Eため�E�E Composer 系・GPT 系・Auto は OFF�E�Eilent fallback 完封E��|
| 4 | **Add or search model** で追加 | Cursor は標準で `Opus 4.7 1M Extra High` `Opus 4.7 1M Max Thinking` めE**add で明示追加** する忁E��がある�E�E026/03〜�E UI 仕様変更�E�| 知らなぁE��「リストに無ぁEↁE諦める」罠 |

**C. Agents (Settings ↁEAgents ↁEAuto-Run section / TSB-019 連勁E/ 2026-04-26 Q1 追加)**:

| # | 設宁E| 忁E��状慁E| TSB-019 関連 |
|---|---|---|---|
| 5 | **Auto-Run Mode** | **Run Everything (Unsandboxed)** �E�浜田判断 = 基本自征E/ 都度承認�Eつらい�E�| 佁E��丁E#6 #7 で危険カチE��リは個別ゲーチE|
| 6 | **Browser Protection** | **ON** | playwright 等�E暴走防止 |
| 7 | **MCP Tools Protection** | **ON** ⭁E| **kintone 本番 API 暴走防止�E�§52 Tier B 実効性確保�E核忁E��E* |

**D. Cloud Agents**:

| # | 設宁E| 忁E��状慁E| 備老E|
|---|---|---|---|
| 8 | Background Agents (Cloud Agents) | **不使用 = N/A**�E�Eloud Agents タブで "Open a Git repository" と表示されてぁE��ば未使用 / 使用する場合�E Opus 4.7 系に固定）| 使用開始時に §1-2-2-1 を即更新 |

**URL 注愁E(Q1 追訁E**: cursor.com/billing は **`/ja/`�E�日本語ロケール�E�パス未対忁EↁE404**。忁E��英誁EURL で開く�E�また�E cursor.com/dashboard 経由�E�、E

**CLI 側�E�既存ガイド）との整吁E*:

- CLI 既宁E`composer-2-fast` 罠は `docs/cursor-cli-usage.md §2.1`�E�既設�E�E `~/.cursor/cli-config.json` の `hasChangedDefaultModel: true` で対応済、E
- 本節は **IDE 側のフォールバック** を扱ぁE��ELI 設定とは別ソース�E�、E

**TSB-018 連勁E*: 本節の検知契機�E TSB-018 (`docs/troubleshooting.md`) に記録。�E発防止の構造化として §1-2-2 を制宁E+ N-4 で 4 択提示に強化、E

**正パターン**:
- ✁E「§1-2-2 検知: Composer 2 へ自動�E替されました、E/B/C/D の 4 択をご提示します（表で�E�、E
- ✁E「Opus 4.7 のクレジチE��枯渁EↁEOn-Demand 残顁E$X / 残日数 Y 日 ↁEA 推奨�E�§1-2-4 の予測ロジチE���E�、E

**反パターン�E�本節で禁止�E�E*:
- ❁EComposer/Sonnet へ自動�E替されたまま黙って続行！E §1-2 silent breach�E�E
- ❁E4 択を省略して「とりあえず継続します�E」と続ける！E 浜田選択権の剥奪�E�E
- ❁E「Auto モードに戻したほぁE��楽です」と提案する！E §1-2 を浜田の意思より下に置く！E

### §1-2-3 Opus 冁E��チE��使ぁE�Eけ！E026-04-26 制宁E/ N-5 / Ultra プラン枯渁E��向対策！E

**背景**: 2026-04-26 浜田持E��「Ultra プランで枯渁E�E発傾吁E/ 朁E¥20,000 追加可」を受け、E�1-2 (Opus 単一モチE��) の枠冁E�� **「Max Thinking」と「Extra High」を使ぁE�EぁE* ることを正式化。Opus 4.6 / 4.7 の `thinking=ON` は token 消費ぁE**3-5 倁E*�E�Eutput $25/1M tokens でレバレチE��が効くため、節紁E��果が大きい�E�、E

**原則**: 「Opus 系最高段めE1 本に固定、E§1-2) は維持しつつ、E*Opus ファミリー冁E�E 2 段隁E* で使ぁE�Eける、E

| タスク種別 | 推奨モチE�� | 琁E�� |
|---|---|---|
| **Max Thinking 忁E��E*�E�Epus 4.7 1M Max Thinking�E�| §47-A 100% 証明要汁E/ 設計判断�E�§48 Best Options 起案！E 褁E��バグ修正�E�§47-B-2 段階的批判�E�E TSB 真因究昁E/ 憲法改宁E§57 起桁E/ 重大インシチE��ト�E极E| 推論深度が結果品質を左右する |
| **Extra High 推奨**�E�Epus 4.7 1M Extra High / no-thinking�E�| lint / refactor / 既知パターン kintone deploy / commit message 起荁E/ RAG 同期 / chat-sessions 更新 / 朝報整形 / npm script 別名追加 / ファイルコピ�E検証 | thinking 不要E/ コスチE1/3、E/5 |

**運用ルール**:

1. **既定�E Extra High**�E�ELI / IDE とも）。タスク開始時に AI が判定し、Max Thinking が忁E��なら「§1-2-3 で Max Thinking に刁E��えて再実行をお願いします」と浜田に明示要汁E
2. **Max Thinking 刁E��の証跡**: AI が要求した場合�E琁E��めE1 行で添える�E�侁E 「§57 改宁E起案�Eため Max Thinking 忁E��」！E
3. **Extra High でも品質低下が観察される場吁E*: §47-B-2 信頼度ラベル 🟡 90% 上限とし、Max Thinking 再実行を提桁E
4. **既孁E§1-2 / §1-2-1 との整吁E*: IDE 「Opus 4.7 1M Extra High、E+ CLI 「Opus 4.7 1M Max Thinking、Eの両方めE**有効モチE��一覧で ON** にしておき、用途で刁E���E�他モチE��は引き続き OFF�E�E

**§1-2-3-1 AI 自己宣言義務！E026-04-26 P5-5 追加 / Max Thinking 形骸化対策！E*:

**背景**: 2026-04-26 P5-5 監査で「§1-2-3 制定後も全タスクぁEMax Thinking で処琁E��れており、ルールが形骸化してぁE��」ことが判昁E(= F-13 / API token 12 日完�E枯渁E�E主因)。本節を追加し、AI ぁE**タスク冒頭で忁E��使用モチE�� チE��アめE1 行宣言** することを義務化する、E

**忁E��E*:

1. **タスク冒頭 (浜田の持E��受領直征E/ 「思老E���E もしく�E応答開始時)** に **モチE�� チE��ア判宁E* めE1 行�E示する
   - 侁E1: `[§1-2-3 チE��ア判宁E Extra High] 朝�Eブリーフィング読み上げ = ルーチン作業`
   - 侁E2: `[§1-2-3 チE��ア判宁E Max Thinking] kintone Day 4 deploy 実衁E= §47-A 100% 証明要求`
   - 侁E3: `[§1-2-3 チE��ア判宁E Extra High ↁEMax Thinking 要請] §57 改定起案�Eため刁E��を要請`

2. **判定�E妥当性**: 表 (§1-2-3 上段) の「タスク種別」と一致する根拠めE1 行で添える

3. **Max Thinking で実行中 と気付いたら**:
   - ルーチン作業なめE**「§1-2-3 違反検知、Extra High に刁E��えて再実行をお願いします、E* と浜田に通知 (= 自発皁E��節紁E��呁E
   - 浜田から「Max Thinking のままで良ぁE��と GO が�Eたら継綁E(= §1-2 例外規宁E① 浜田明示持E��)

**チE��ア判定�E実侁E(P5-5 観察値ベ�Eス)**:

| 浜田持E��の典垁E| 判宁E| 琁E�� |
|---|---|---|
| 「朝のブリーフィングお願い、E| Extra High | 既知パターン定型作業 |
| 「健康診断して、E| Extra High | smoke-test / lint / npm run の雁E��E|
| 「PC 台帳 Day N 進めて、E| Max Thinking | §47-A 100% 証明要汁E+ 不可送E��佁E|
| 「TSB-XXX 起票して、E| Max Thinking | 真因究昁E/ 設計判断 |
| 「§XX 改定起案して、E| Max Thinking | 憲法改宁E§57 |
| 「commit & push して、E| Extra High | 既知の commit message 起荁E|
| 「lint pass か確認して、E| Extra High | 結果整形のみ |
| 「並列セチE��ョン detector 結果確認、E| Extra High | 既知出力�E解釁E|
| 「F-N 発見�E対応案を老E��て、E| Max Thinking | 設計判断 |
| 、Ecursorignore に X を追加して、E| Extra High | 単一ファイル追訁E|

**統吁E*: 朝�Eブリーフィング §0 でそ�E日の予定タスクを�E挙したとき、各、E�� [Extra High] / [Max Thinking] のラベルを付与し、Max Thinking 比率ぁE30% を趁E��るなら「本日は重い設計タスクが多いです。クレジチE��消費に注意」と自発警呁E(§1-2-4 70% 連勁E、E

**反パターン**:
- ❁E全てのタスクめEMax Thinking で処琁E��る（コスト過剰 / Ultra 月次クレジチE��枯渁E�E主因 / **F-13 観察渁E*�E�E
- ❁EExtra High で褁E��バグ修正を進めて「動く�Eず」宣言�E�§11-2 信頼度ラベル違反相当！E
- ❁EチE��ア判定を **省略** して作業に入る！E 形骸化�E温庁E/ §1-2-3-1 違反�E�E

**§1-2-2 / §1-2-4 との関俁E*: §1-2-3 = 通常時�Eコスト最適匁E/ §1-2-2 = 枯渁E��知時�E選抁E/ §1-2-4 = 予算予測。三本柱で Ultra プラン冁E��収める、E*§1-2-3-1 (自己宣言義勁E は §1-2-3 の遵守徹底機槁E*、E

**§1-2-3-2 AI 自律モチE��選択原剁E��E026-04-26 P5-5 追加 / 浜田持E��「最適モチE�� / こだわらなぁE/ 適晁EAI 判断、E**:

**背景**: 2026-04-26 P5-5 監査で **F-14 (Max Thinking ぁEAPI 消費の 59.4% / Extra High 40.8% / Composer 2 筁E0.6%)** が判明。§1-2-3-1 (自己宣言義勁E を制定したが、それだけでは **「Composer 2 を使えるはず�EルーチンタスクめEMax Thinking で処琁E��る」傾向が残る** ため、本節で **Composer 2 を含む 3 段階�E律選抁E* を正式化。浜田の持E��「絶対にこ�EモチE��を使ぁE��ぁE��こだわりはしなぁE/ 適晁EAI 側で判断してほしい」を実裁E��る、E

**3 段階�E自律選択基溁E* (AI ぁE§1-2-3-1 のチE��ア判定で 1 行宣言):

| チE��ア | 実モチE��吁E| 適用条件 (AI 判断基溁E | 月コスト目宁E|
|---|---|---|---|
| **L1: Composer 2** | composer-2 (Cursor 独自) | ① 既知の定型タスク (lint 結果整形 / RAG 同期確誁E/ chat-sessions 記録更新 / commit message 起荁E/ 単純ファイル追訁E/ 朝報整形 / npm script 別名追加) ② 浜田の持E��ぁE**2-3 斁E��下�E短ぁE��スク** ③ 創造皁E��断不要E| 最宁E(~1/10) |
| **L2: Extra High** | claude-opus-4-7-thinking-xhigh | ① 通常の実裁E�E調査・設訁E② kintone Day N の **Tier A 篁E��** ③ §57 改定�E斁E��編雁E(起案ではなぁE ④ TSB 整形 | 中 (基溁E |
| **L3: Max Thinking** | claude-opus-4-7-max-thinking | ① §47-A 100% 証明要汁E② §57 改宁E**起桁E* ③ TSB 真因究昁E④ 重大インシチE��ト�E极E⑤ kintone Day N の **Tier B / 不可送E��作前** ⑥ §48 Best Options 起桁E⑦ 褁E��な抽象設訁E| 髁E(~1.5x) |

**判定フロー (AI 思老E�E / 1 秒判宁E**:

```
浜田の持E��を受頁E
  ↁE
1. 「単純な追訁E/ 整形 / 確誁E/ 既知定型」か�E�E
   YES ↁEL1 Composer 2  (侁E 「commit して」「ログ確認、E
   NO ↁE
2. 「Tier B / 100% 証明要汁E/ 真因究昁E/ 改定起案」か�E�E
   YES ↁEL3 Max Thinking (侁E 「PC 台帳 Day 4 進めて」「TSB 起票、E
   NO ↁE
3. チE��ォルチEↁEL2 Extra High (侁E 「実裁E��願い」「監査して、E
```

**自律判断の安�E弁E*:

1. **不可送E��佁E(Tier B / kintone API write / git push --force / rm -rf) は L3 Max Thinking 強制** = 浜田の §47-A 100% 証明要求と整吁E
2. **判断に迷ったら L3 にフォールバック** ではなぁE**L2 (Extra High) にフォールバック** (= F-14 防止 / コスト過剰回避)
3. **Composer 2 ↁEExtra High 昁E��**: タスク途中で褁E��性発要EↁE「§1-2-3-2 チE��ア昁E��: L1 ↁEL2」と宣言して継綁E
4. **silent fallback との区別 (§1-2-2 連勁E**: Cursor IDE が裏で `Switched to Composer 2 after reaching API limit.` を�Eした場合�E §1-2-2 で 4 択提示が忁E��、E*AI が事前明示皁E�� Composer 2 を選んだ場合�E §1-2-2 対象夁E* = チE��ア宣言が両老E��区別する証跡

**運用侁E(2026-04-26 観察値ベ�Eス)**:

| 浜田持E�� | 旧 (今朝まで) | 新 (本節適用征E |
|---|---|---|
| 「commit して push して、E| L3 Max Thinking | **L1 Composer 2** |
| 「smoke-test 結果を見せて、E| L3 Max Thinking | **L1 Composer 2** |
| 、Ecursorignore に追記、E| L3 Max Thinking | **L1 Composer 2** |
| 「P5-5 監査の続き、E| L3 Max Thinking | **L2 Extra High** |
| 「PC 台帳 Day 4 deploy、E| L3 Max Thinking | **L3 Max Thinking** (維持E |
| 「§1-2-3 改定起案、E| L3 Max Thinking | **L3 Max Thinking** (維持E |

**期征E��极E*:

- **Max Thinking 比率 59.4% ↁE20-30% 想宁E* (= 重い設計タスク時�Eみ)
- **Composer 2 比率 0.6% ↁE30-40% 想宁E* (= ルーチンタスク全般)
- API token 消費 1/2 、E1/3 (= F-13 / 12 日枯渁EↁE30 日以上に延伸見込み)

**反パターン (本節で禁止)**:

- ❁EルーチンタスクめEL3 Max Thinking で処琁E��めE(= F-14 主因 / 「最適モチE��原則」違叁E
- ❁E不可送E��作を L1 Composer 2 で処琁E��めE(= §47-A 違反)
- ❁EチE��ア宣言を省略して作業に入めE(= §1-2-3-1 違反 / 浜田の透�E性確認権剥奪)

**§1-2-2 との明確な区別**:
- 本節 (§1-2-3-2) = **AI が事前明示で Composer 2 等を選抁E* (= 健全な最適匁E
- §1-2-2 = **Cursor IDE ぁEsilent fallback で勝手に刁E��** (= 浜田選択権剥奪 / 4 択提示忁E��E

チE��ア宣言で両老E��区別する証跡を残すことで、E�1-2-2 違反検知の精度も維持する、E

**§1-2-3-3 CIO によるモチE��最終判断�E�E026-04-29 制宁E/ 浜田 CIO 運用�E�E*:

**背景**: 2026-04-29 浜田持E��、E*モチE��選択�E CIO で判断でよい**」を受け、E�1-2-3-2�E�EI 自律モチE��選択）と **衝突しなぁE��**で **最終判断権**を�E斁E��する。運用上�E **CIO = 浜田**�E�チャチE��上�E相諁E�EGO も同一人物。§50-3-7 の CEO 最終決定と併せて読む�E�、E

**規宁E*:

1. **AI の義勁E*: 引き続き §1-2-3-1 でチE��アを宣言し、E�1-2-3-2 に基づぁE**推奨�E�E1/L2/L3 また�E Extra High / Max Thinking�E�と琁E��を提示**する、E
2. **CIO�E�浜田�E�が当該タスクにつぁE��モチE��・チャチE��欁E�EチE��アを�E示した場吁E*、AI は **それに従う**。§1-2-3-2 の自律選択と矛盾する場合�E **CIO 持E��を優允E*する�E�§1-2 例外規宁E① と整合）、E
3. **CIO が未持E���EとぁE*は §1-2-3-1 / §1-2-3-2 のとおり�E�EI が最適と判断したチE��アで進める�E�、E
4. **§35-1 / §56-1a / TSB-024**�E�開発・コマンド�E検証実行�E AI、E*仕様�E最終判断・GO・画面の目視確認�E浜田**�E��E **不夁E*�E�本条はモチE��選択�E帰属�Eみを追加する�E�、E

### §1-2-4 クレジチE��予算管琁E��E026-04-26 制宁E/ N-6 / 朝ブリーフィング §0 統合！E

**背景**: 2026-04-26 浜田持E��「枯渁E�E発傾吁E/ 朁E¥20,000 追加可 / AI 側で管琁E��てほしい」を受け、月次クレジチE��消費の **可視化 + 自発警呁E+ 趁E��予測** を構造化、Eursor は公開課釁EAPI を提供してぁE��ぁE��め、E*浜田ぁE1 日 1 囁E30 秒で % を貼仁E+ AI が予測・記録** のハイブリチE��運用とする、E

**月次予算！E026-04-26 浜田承誁E/ P5-5 改定！E*:

| 区刁E| 金顁E(USD) | 冁E��箁E(¥155/$) | 用送E|
|---|---|---|---|
| Cursor Ultra 月顁E| $200 | ¥31,000 | 通常運用 (L1) / 基本 API + Composer + Auto |
| On-Demand Monthly Limit (4/26 引上げ) | **$1000** | ¥155,000 | 月次クレジチE��枯渁E���E業務継綁E(L2) |
| **合算最大** | **$1200** | **¥186,000** | Worst case |
| **節紁E��用征E見込** | **$430-500** | **¥66,000-78,000** | S1-S5 節紁E��チE��ージ実施晁E|

**4/26 P5-5 履歴**:
- 旧: On-Demand Spend Cap **$130** (≁E¥20,000 / 浜田当�E想宁E
- 新: On-Demand Monthly Limit **$1000** (Worst ¥186,000 / 節紁E��E¥66,000-78,000 想宁E
- 引上げ琁E��: 4/15-4/26 (12 日) で On-Demand $235.94 既消費 = $300 旧上限めE4/29-5/3 突破見込み (= F-12)
- 制紁E 引上げと並行で **S1-S5 節紁E��チE��ージ全実施** (CLAUDE.md 整琁E/ Extra High 既定徹庁E/ .cursorignore 強匁E/ session 区刁E�� 筁E めE§1-2-3 / §51 に反映
- 5/15 リセチE��時に振り返り ↁE節紁E��果次第で次朁E$500 戻す可能性

**毎日 1 回�E貼付フロー�E�朝ブリーフィング §0 統吁E/ P5-5 強化！E*:

1. **浜田の作業 (30 私E/ 旧プロセス)**:
   - cursor.com/billing or アカウント設定�E "Usage" を開ぁE�� **「今月のクレジチE��消費 X%、E* めE1 行コピ�E
   - AI に「今月 X%」とだけ伝える（また�E `npm run credit:set 65` で直接記録�E�E

2. **浜田の作業 (60 私E/ 新プロセス / P5-5 追加)**:
   - 上記に加ぁE**Cursor IDE Settings ↁEPlan & Usage ↁESpending タチE* をスクショ送仁E
   - スクショ冁E4 値 = (a) Total% (b) API% (c) On-Demand $X / $1000 (d) Monthly Limit めEAI が抽出 ↁEJSON 記録
   - これにより API token 単独枯渁E(= TSB-018 トリガ / F-13) を事前検知可能になめE

3. AI ぁE`data/credit-usage.json` に {date, total_pct, api_pct, on_demand_usd, monthly_limit_usd} めEappend
4. AI が予測ロジチE��で **「想定枯渁E�� / 残日数 / 月末予測 (Total% / API% / On-Demand $)、E* めE3 系統計箁E
5. 翌朝のブリーフィング §0 に 3 系統表示 (どれかぁE70% 趁E��ら警呁E

**TSB-021 候裁E(Day 5-6 起票予宁E**: `scripts/credit-budget.mjs` に **`--input-on-demand <USD> --input-api <PCT>`** オプション追加 ↁE浜田スクショ抽出値めEAI が�E動投入 ↁE旧来の % 単一系統から 3 系統に拡張

**自発警呁E閾値�E�E5-5 改宁E/ 3 系統対応！E*:

3 系統 (Total% / API% / On-Demand $) のぁE��れかが閾値を趁E��たら警告発火、E

| 消費玁E| AI 動佁E|
|---|---|
| **70%** | 朝報 §0 に「⚠�E�E70% 到遁E(系統吁E / Max Thinking タスクは要E��択」と表示、EI 側で §1-2-3 / §1-2-3-1 適用を強化！Eax Thinking 要求時に「節紁E�Eため Extra High で代替可能か」と問い返し�E�|
| **80%** **(P5-5 新設)** | 朝報 §0 + AI 開口一番に **、E0% 到遁E(系統吁E= ○○)。本日中の重い設計タスクをどぁE��るかご判断を、E*と提示。On-Demand $ なら「上限引上げ or 節紁E��匁Eor タスク繰延」�E 3 択提示 |
| **85%** | 朝報 §0 + AI 開口一番に **、E5% 到遁E(系統吁E。本日中に On-Demand 引上げ or タスク絞り込みのご判断を、E*と提示 |
| **95%** | AI ぁE**タスク開始前に忁E��**、E5% 趁E�� (系統吁E、E�1-2-2 4 択提示しますか? それとも軽微作業のみ続行しますか?」と確認。重ぁE��計タスク・PC 台帳本番は要EGO |
| **100%** | §1-2-2 検知挙動と完�E一体化�E�E 択提示 ↁE浜田選択征E���E�|

**API 系統 100% 単独到達時の特侁E(P5-5 / F-13 教訁E**:

- API 系統だぁE100% に達した場吁E(= Total/On-Demand は余裁E、Cursor IDE は **Composer 2 fallback (TSB-018)** を発動すめE
- AI は § 1-2-2 検知挙動を発勁E= 即座に作業中断 + 浜田に「§1-2-2 違反検知 / API 系統枯渁E= Composer 2 fallback 発生」と報呁E
- 浜田 GO 後、Extra High (API 不要E で継続するか、On-Demand 余裕で Max Thinking 継続するかの 2 択提示

**月次リセチE��**:

- 浜田 Cursor 課金日�E�侁E 毎月 14 日 ↁE浜田が�E回設定時に `npm run credit:reset -- --day=14` で記録�E�E
- リセチE��日に AI ぁE`data/credit-usage.json` の月次雁E��を `data/credit-usage-history.jsonl` に append ↁE当月刁Ereset

**タイムゾーン (P1 / 2026-04-26 / off-by-one バグ修正)**:

- **全ての日付計算�E JST (UTC+9) 基溁E*。`scripts/credit-budget.mjs` の `todayJstIso()` / `nowJstIso()` / `dateToJstIsoDate()` を使用
- 旧実裁E(UTC `toISOString()`) では JST 0:00-8:59 に記録すると前日扱ぁE��なめEoff-by-one バグがあっぁE(実侁E O-series 制定日 2026-04-26 07:16 JST の浜田報告が `2026-04-25` として記録されぁE
- 修正征E cursor.com/billing が表示する日付！EST 表記）と一致する。データ保存も `recorded_at` ぁE`+09:00` 付き ISO 8601

**AI 管琁E��E���E�§1-2-4 の役割刁E���E�E*:

| 頁E�� | AI | 浜田 |
|---|---|---|
| ルール維持�E改訁E| ✁E| (§57 改宁EGO のみ) |
| % 入力フォーム提侁E(`npm run credit:set <pct>`)| ✁E| 入劁E30 私E/ 1 日 1 囁E|
| 予測計算�EJSON 保孁E| ✁E| - |
| 朝報 §0 表示 | ✁E| 朝チェチE�� |
| 70/85/95% 自発警呁E| ✁E| 判断 |
| Cursor 設定変更 (On-Demand / Spend Cap) | ❁E| ✁E��月 1 囁E+ 忁E��時�E�|
| 支払い・プラン変更 | ❁E| ✁E|

**実裁E��ァイル**:

- `scripts/credit-budget.mjs`  E入力�E記録・予測ロジチE�� (npm run credit:set / credit:status / credit:reset)
- `data/credit-usage.json`  E当月の日次 % 履歴
- `data/credit-usage-history.jsonl`  E月次雁E���E永続化
- `scripts/daily-morning-prep.mjs §0`  E朝報統合（残日数 / 想定枯渁E�� / 警告レベル�E�E

**§1-2-2 / §1-2-3 との関俁E*: §1-2-4 = **予算予測�E�事前防御�E�E*、E�1-2-2 = **枯渁E��知時�E選択（事後対応！E*、E�1-2-3 = **通常時�Eコスト最適匁E*、E つで枯渁E��ーケンスを完�Eカバ�E、E

### §2 正本主義
すべての設計判断・フィールド定義・運用ルールは **ファイルに記録されたものを正本** とする。チャチE��だけで完結させなぁE��E

### §3 索引駁E��
作業着手前に `RULES-INDEX.md` を読み、該当するルールファイルへ辿る。索引�E褁E��・長斁E�EージはしなぁE��E

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

