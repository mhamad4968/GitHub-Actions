# 基本原則（§0〜§3・モデル・正本）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: タスク開始・モデル選択・正本の確認  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`---

## 30秒要約（Phase 2）

§0 索引駆動・§1 役割・§1-2 モデル/予算。毎タスク開始とティア宣言の根拠。

## いつ読む（チェックリスト）

- タスク開始
- モデル選択
- クレジット警告

## 条文本文（AGENTS 抽出・削除禁止）

> 以下は `AGENTS.md` からの抽出コピー。**省略・削除しない**。解釈疑義は `AGENTS.md` 正本。

## 第1章 基本原則

### §0 RULES-INDEX 即答カード参照

タスク着手時に、まず `RULES-INDEX.md` を開き「今この状況で参照すべき §N」を決める（索引駆動）。

- **目的**: ルールの全文探索（AGENTS.md の線形読書）を避け、**最短で正しい条文へ到達**する。
- **最低要件**: 不明点が出たら `RULES-INDEX.md` の該当行から `AGENTS.md` の該当 § へジャンプして本文を読む。
- **朝のブリーフィング連動**: 「朝報 §0（朝のブリーフィング）」の呼称としても使うが、**本条の中核は索引参照義務**である（朝報の具体フォーマットは `scripts/daily-morning-prep.mjs` 側に集約）。

### §1 役割
AI エージェントはビジネス・エンジニアリングの共同責任者として、意思決定の質と実行速度を最大化する。

### §1-2 モデル前提（最適モデル原則 / Opus 4.7 デフォルト枠）

**2026-04-26 改定 (P5-5 / 浜田指示「使うモデルは一番最適な方法で行ってほしい。絶対にこのモデルを使うというこだわりはしない。適時 AI 側で判断してほしい」)**

**旧 (2026-04-25)**: 「Opus 4.7 単一モデル / 他モデルへの切替禁止」
**新 (2026-04-26)**: 「**最適モデル原則** / Opus 4.7 はデフォルト枠 / **AI 自律でタスク種別に応じて選択**」

1. **既定モデル**: タスクの性質に応じて **AI が自律的に最適モデルを選択** (§1-2-3-2 / §1-2-3-1 自己宣言義務)。Opus 4.7 (Extra High) はデフォルト枠として Cursor IDE 設定で ON にしておく。
2. **AI 自律選択の範囲** (浜田事前承認 **不要**):
   - **Composer 2** … ルーチンタスク (lint 結果整形 / chat-sessions 更新 / commit message 起草 / RAG 同期確認 / 単純なファイル追記 等)
   - **Opus 4.7 Extra High** … 通常の実装・調査・設計 (= デフォルト枠)
   - **Opus 4.7 Max Thinking** … §47-A 100% 証明要求 / §57 憲法改定 / 真因究明 / 重大インシデント分析
3. **AI 自律選択の禁止** (§1-2-2 連動):
   - Cursor IDE 側の **silent fallback** (`Switched to Composer 2 after reaching API limit.`) は §1-2-2 で **禁止維持** = **AI が事前明示的に選ぶ Composer 2 と区別**
   - silent fallback 検知時は §1-2-2 の 4 択を必ず提示
4. **Task / サブエージェント**: 別モデル常時起動（レビュー専用サブエージェント等）は §51 と合わせて行わない。同一プロジェクト文脈は **AI 主導の単一ストリーム** で完結。
5. **例外（限定的）**: ① 浜田がチャットで明示した短時間の実験 ② Cursor IDE 設定で禁止モデルが ON になっていた場合の一時回避のみ。

**「こだわらない」の意味 (浜田 2026-04-26 指示)**:
- ❌ 「Opus 4.7 統一」を金科玉条にして、ルーチン作業まで Max Thinking で処理する (= F-13 / F-14 主因)
- ✅ 「最適性」を優先 = Composer 2 で十分なタスクは Composer 2、複雑判断のみ Max Thinking
- ✅ AI が **タスク冒頭で §1-2-3-1 ティア判定を宣言** することで、浜田が透明に確認できる

**§1-2-1 環境別の実モデル名（2026-04-25 追記）**

| 環境 | 設定場所 | 選択する実モデル名 | 備考 |
|---|---|---|---|
| Cursor IDE（Windows） | チャット欄のモデルピッカー / 設定 → Models | **Opus 4.7 1M Extra High** (デフォルト) + **Opus 4.7 1M Max Thinking** (重い設計用) + **Composer 2** (ルーチン用) | 他モデル（Sonnet / GPT / Gemini / Auto 等）は **OFF**。Composer 2 は §1-2-3-2 で AI 自律選択時のみ使用 (silent fallback とは区別) |
| Cursor Agent CLI（WSL） | `agent` 起動後 `/model` | **Opus 4.7 1M Max Thinking** | CLI 側に "Extra High" は無いため、最上段の "Max Thinking" を選ぶ。 |

**2026-04-26 改定 (P5-5)**: §1-2 の「最適モデル原則」を満たすため、Cursor IDE では **3 モデル (Extra High / Max Thinking / Composer 2)** を ON にしておく。AI が §1-2-3-2 に従って自律選択し、§1-2-3-1 で都度ティア判定を宣言する。CLI を使う場合は最新版へ更新してから `/model` を確認する：

```bash
curl https://cursor.com/install -fsS | bash
agent
```

**§1-2-2 API 制限到達時の自動フォールバック禁止（2026-04-26 制定 / 浜田 N-3 朝指示「Switched to Composer 2 after reaching API limit. を改善したい」）**

**背景**: 2026-04-26 朝、浜田が **Cursor IDE chat** で `Switched to Composer 2 after reaching API limit.` のメッセージを受領。これは Cursor IDE 側が Opus 4.7 のレート制限/クレジット枯渇に達した際、**ユーザーの GO なしに `composer-2` (Cursor 独自の安価フォールバック)** へ自動切替する挙動。§1-2 の「Sonnet/軽量モデル/他社モデルへ切り替えてタスクを進めない」を **構造的に違反する** ため、IDE 設定で恒久禁止する。

**禁止する Cursor IDE 設定（Windows / 設定 → Models）**:

| 設定 | 必須状態 | 理由 |
|---|---|---|
| `Auto` モデルピッカー | **OFF** | 「Auto」は実モデル名を隠して安価モデルを選ぶため §1-2 違反の温床 |
| `Auto-fallback to Composer/Sonnet on rate limit` 系 | **OFF** | `composer-2` への silent switch 元 |
| `Use Auto model when limits reached` 系 | **OFF** | 同上 |
| 有効モデル一覧 | **`Opus 4.7 1M Extra High` のみ ON** | 他モデル全 OFF → 強制的に Opus 単独 |
| `Background agents` モデル | **Opus 4.7 系に固定**（または無効化）| 別モデル常時起動禁止（§1-2-2 + §51）|

**API 制限到達時の正しい動作（§1-2-2 適用後）**:

1. Opus 4.7 のクレジット枯渇 → Cursor IDE は **エラー表示**（モデル切替なし）
2. 浜田が **明示的に「Sonnet で続けて」「Composer で続けて」と指示** したときのみ別モデル可（§1-2 例外規定 ①）
3. AI 側は `Switched to Composer/Sonnet/...` 等のメッセージを検知したら **即座にタスク中断**して浜田に「§1-2-2 違反検知。継続可否を確認します」と報告（§47-E 同等扱い）

**検知時の AI 動作（§47-E 連動 / 2026-04-26 N-4 で 4 択提示に強化）**:

- メッセージ `Switched to (Composer|Sonnet|GPT|Gemini|Auto) (\d+|.*)` を検知した時点で:
  1. 即座に **作業を中断**（Tier A 副作用は §52-3 で再判定 / Tier B 起票も保留）
  2. 浜田へ報告: `§1-2-2 違反検知 / Opus 4.7 クレジット枯渇の可能性。以下 4 択から選択してください`
  3. **必ず以下 4 択を提示**（4 択を省略・推測で進行することを禁止）:

| 択 | 内容 | 即時性 | 月コスト目安 | 推奨度 |
|---|---|---|---|---|
| **A** | **On-Demand 課金で Opus 継続**（事前に §1-2-2-1 の Cursor 設定が必要）| 即時 | 従量制 / 月キャップ $130 内 | ★★★（業務継続優先 / Ultra 既定パス）|
| **B** | **本日の作業を停止 → 次回課金日まで待つ**（次回課金日 = 浜田 Cursor アカウント請求日）| 翌請求日 | 0 | ★★（軽微作業 or 月末ギリギリ時）|
| **C** | **個人 Anthropic API key (BYOK) 投入で継続** | 即時 | Anthropic 直接料金（Cursor On-Demand より高い + ZDR 適用外）| ★（最終手段 / kintone 業務には ZDR 観点で非推奨）|
| **D** | **その他**（明示の別モデル一時利用 / プラン昇格 / `hi@cursor.com` 早期更新依頼）| 個別 | 個別 | 個別判断 |

  4. 浜田の選択を待つ間は **Tier A 副作用ゼロ**（読取・計画・診断のみ可）
  5. 選択結果を `logs/autonomy-decisions/model-fallback-YYYY-MM-DD-HHMM.md` に記録（AI 起案理由 + 4 択 + 浜田選択 + 後続アクション）

**§1-2-2-1 Cursor IDE 必須設定（2026-04-26 N-4 / Q1 で 4 → 7 項目に拡張 / 浜田のみ実施可 / TSB-018 + TSB-019 連動）**:

**A. 課金 (cursor.com/billing → Spending タブ)**:

| # | 設定 | 必須状態 | 備考 |
|---|---|---|---|
| 1 | **On-Demand mode** | **Fixed** | "Disabled" は緊急停止用 / "Unlimited" 禁止（暴走時損害大）|
| 2 | **Monthly Limit** | **平常時 $130 / 緊急時 $300 (Q1 浜田承認 / 5/14 で $130 に戻す)** | 5/14 リセット時に AI が朝報で reminder |

**B. Models (Settings → Models)**:

| # | 設定 | 必須状態 | TSB-018 関連 |
|---|---|---|---|
| 3 | **有効モデル一覧** | **Opus 4.7 1M Extra High + Opus 4.7 1M Max Thinking のみ ON / 他は全 OFF** | 標準 "Opus 4.7" は OFF（§1-2-3 2 段階明確化のため）/ Composer 系・GPT 系・Auto は OFF（silent fallback 完封）|
| 4 | **Add or search model** で追加 | Cursor は標準で `Opus 4.7 1M Extra High` `Opus 4.7 1M Max Thinking` を **add で明示追加** する必要がある（2026/03〜の UI 仕様変更）| 知らないと「リストに無い → 諦める」罠 |

**C. Agents (Settings → Agents → Auto-Run section / TSB-019 連動 / 2026-04-26 Q1 追加)**:

| # | 設定 | 必須状態 | TSB-019 関連 |
|---|---|---|---|
| 5 | **Auto-Run Mode** | **Run Everything (Unsandboxed)** （浜田判断 = 基本自律 / 都度承認はつらい）| 但し下 #6 #7 で危険カテゴリは個別ゲート |
| 6 | **Browser Protection** | **ON** | playwright 等の暴走防止 |
| 7 | **MCP Tools Protection** | **ON** ⭐ | **kintone 本番 API 暴走防止（§52 Tier B 実効性確保の核心）** |

**D. Cloud Agents**:

| # | 設定 | 必須状態 | 備考 |
|---|---|---|---|
| 8 | Background Agents (Cloud Agents) | **不使用 = N/A**（Cloud Agents タブで "Open a Git repository" と表示されていれば未使用 / 使用する場合は Opus 4.7 系に固定）| 使用開始時に §1-2-2-1 を即更新 |

**URL 注意 (Q1 追記)**: cursor.com/billing は **`/ja/`（日本語ロケール）パス未対応 → 404**。必ず英語 URL で開く（または cursor.com/dashboard 経由）。

**CLI 側（既存ガイド）との整合**:

- CLI 既定 `composer-2-fast` 罠は `docs/cursor-cli-usage.md §2.1`（既設）+ `~/.cursor/cli-config.json` の `hasChangedDefaultModel: true` で対応済。
- 本節は **IDE 側のフォールバック** を扱う（CLI 設定とは別ソース）。

**TSB-018 連動**: 本節の検知契機は TSB-018 (`docs/troubleshooting.md`) に記録。再発防止の構造化として §1-2-2 を制定 + N-4 で 4 択提示に強化。

**正パターン**:
- ✅ 「§1-2-2 検知: Composer 2 へ自動切替されました。A/B/C/D の 4 択をご提示します（表で）」
- ✅ 「Opus 4.7 のクレジット枯渇 → On-Demand 残額 $X / 残日数 Y 日 → A 推奨（§1-2-4 の予測ロジック）」

**反パターン（本節で禁止）**:
- ❌ Composer/Sonnet へ自動切替されたまま黙って続行（= §1-2 silent breach）
- ❌ 4 択を省略して「とりあえず継続しますね」と続ける（= 浜田選択権の剥奪）
- ❌ 「Auto モードに戻したほうが楽です」と提案する（= §1-2 を浜田の意思より下に置く）

### §1-2-3 Opus 内モデル使い分け（2026-04-26 制定 / N-5 / Ultra プラン枯渇傾向対策）

**背景**: 2026-04-26 浜田指示「Ultra プランで枯渇再発傾向 / 月 ¥20,000 追加可」を受け、§1-2 (Opus 単一モデル) の枠内で **「Max Thinking」と「Extra High」を使い分け** ることを正式化。Opus 4.6 / 4.7 の `thinking=ON` は token 消費が **3-5 倍**（output $25/1M tokens でレバレッジが効くため、節約効果が大きい）。

**原則**: 「Opus 系最高段を 1 本に固定」(§1-2) は維持しつつ、**Opus ファミリー内の 2 段階** で使い分ける。

| タスク種別 | 推奨モデル | 理由 |
|---|---|---|
| **Max Thinking 必須**（Opus 4.7 1M Max Thinking）| §47-A 100% 証明要求 / 設計判断（§48 Best Options 起案）/ 複雑バグ修正（§47-B-2 段階的批判）/ TSB 真因究明 / 憲法改定 §57 起案 / 重大インシデント分析 | 推論深度が結果品質を左右する |
| **Extra High 推奨**（Opus 4.7 1M Extra High / no-thinking）| lint / refactor / 既知パターン kintone deploy / commit message 起草 / RAG 同期 / chat-sessions 更新 / 朝報整形 / npm script 別名追加 / ファイルコピー検証 | thinking 不要 / コスト 1/3〜1/5 |

**運用ルール**:

1. **既定は Extra High**（CLI / IDE とも）。タスク開始時に AI が判定し、Max Thinking が必要なら「§1-2-3 で Max Thinking に切替えて再実行をお願いします」と浜田に明示要求
2. **Max Thinking 切替の証跡**: AI が要求した場合は理由を 1 行で添える（例: 「§57 改定 起案のため Max Thinking 必須」）
3. **Extra High でも品質低下が観察される場合**: §47-B-2 信頼度ラベル 🟡 90% 上限とし、Max Thinking 再実行を提案
4. **既存 §1-2 / §1-2-1 との整合**: IDE 「Opus 4.7 1M Extra High」 + CLI 「Opus 4.7 1M Max Thinking」 の両方を **有効モデル一覧で ON** にしておき、用途で切替（他モデルは引き続き OFF）

**§1-2-3-1 AI 自己宣言義務（2026-04-26 P5-5 追加 / Max Thinking 形骸化対策）**:

**背景**: 2026-04-26 P5-5 監査で「§1-2-3 制定後も全タスクが Max Thinking で処理されており、ルールが形骸化していた」ことが判明 (= F-13 / API token 12 日完全枯渇の主因)。本節を追加し、AI が **タスク冒頭で必ず使用モデル ティアを 1 行宣言** することを義務化する。

**必須**:

1. **タスク冒頭 (浜田の指示受領直後 / 「思考」内 もしくは応答開始時)** に **モデル ティア判定** を 1 行明示する
   - 例 1: `[§1-2-3 ティア判定: Extra High] 朝のブリーフィング読み上げ = ルーチン作業`
   - 例 2: `[§1-2-3 ティア判定: Max Thinking] kintone Day 4 deploy 実行 = §47-A 100% 証明要求`
   - 例 3: `[§1-2-3 ティア判定: Extra High → Max Thinking 要請] §57 改定起案のため切替を要請`

2. **判定の妥当性**: 表 (§1-2-3 上段) の「タスク種別」と一致する根拠を 1 行で添える

3. **Max Thinking で実行中 と気付いたら**:
   - ルーチン作業なら **「§1-2-3 違反検知。Extra High に切替えて再実行をお願いします」** と浜田に通知 (= 自発的な節約勧告)
   - 浜田から「Max Thinking のままで良い」と GO が出たら継続 (= §1-2 例外規定 ① 浜田明示指示)

**ティア判定の実例 (P5-5 観察値ベース)**:

| 浜田指示の典型 | 判定 | 理由 |
|---|---|---|
| 「朝のブリーフィングお願い」 | Extra High | 既知パターン定型作業 |
| 「健康診断して」 | Extra High | smoke-test / lint / npm run の集計 |
| 「PC 台帳 Day N 進めて」 | Max Thinking | §47-A 100% 証明要求 + 不可逆操作 |
| 「TSB-XXX 起票して」 | Max Thinking | 真因究明 / 設計判断 |
| 「§XX 改定起案して」 | Max Thinking | 憲法改定 §57 |
| 「commit & push して」 | Extra High | 既知の commit message 起草 |
| 「lint pass か確認して」 | Extra High | 結果整形のみ |
| 「並列セッション detector 結果確認」 | Extra High | 既知出力の解釈 |
| 「F-N 発見の対応案を考えて」 | Max Thinking | 設計判断 |
| 「.cursorignore に X を追加して」 | Extra High | 単一ファイル追記 |

**統合**: 朝のブリーフィング §0 でその日の予定タスクを列挙したとき、各々に [Extra High] / [Max Thinking] のラベルを付与し、Max Thinking 比率が 30% を超えるなら「本日は重い設計タスクが多いです。クレジット消費に注意」と自発警告 (§1-2-4 70% 連動)。

**反パターン**:
- ❌ 全てのタスクを Max Thinking で処理する（コスト過剰 / Ultra 月次クレジット枯渇の主因 / **F-13 観察済**）
- ❌ Extra High で複雑バグ修正を進めて「動くはず」宣言（§11-2 信頼度ラベル違反相当）
- ❌ ティア判定を **省略** して作業に入る（= 形骸化の温床 / §1-2-3-1 違反）

**§1-2-2 / §1-2-4 との関係**: §1-2-3 = 通常時のコスト最適化 / §1-2-2 = 枯渇検知時の選択 / §1-2-4 = 予算予測。三本柱で Ultra プラン内に収める。**§1-2-3-1 (自己宣言義務) は §1-2-3 の遵守徹底機構**。

**§1-2-3-2 AI 自律モデル選択原則（2026-04-26 P5-5 追加 / 浜田指示「最適モデル / こだわらない / 適時 AI 判断」)**:

**背景**: 2026-04-26 P5-5 監査で **F-14 (Max Thinking が API 消費の 59.4% / Extra High 40.8% / Composer 2 等 0.6%)** が判明。§1-2-3-1 (自己宣言義務) を制定したが、それだけでは **「Composer 2 を使えるはずのルーチンタスクも Max Thinking で処理する」傾向が残る** ため、本節で **Composer 2 を含む 3 段階自律選択** を正式化。浜田の指示「絶対にこのモデルを使うというこだわりはしない / 適時 AI 側で判断してほしい」を実装する。

**3 段階の自律選択基準** (AI が §1-2-3-1 のティア判定で 1 行宣言):

| ティア | 実モデル名 | 適用条件 (AI 判断基準) | 月コスト目安 |
|---|---|---|---|
| **L1: Composer 2** | composer-2 (Cursor 独自) | ① 既知の定型タスク (lint 結果整形 / RAG 同期確認 / chat-sessions 記録更新 / commit message 起草 / 単純ファイル追記 / 朝報整形 / npm script 別名追加) ② 浜田の指示が **2-3 文以下の短いタスク** ③ 創造的判断不要 | 最安 (~1/10) |
| **L2: Extra High** | claude-opus-4-7-thinking-xhigh | ① 通常の実装・調査・設計 ② kintone Day N の **Tier A 範囲** ③ §57 改定の文章編集 (起案ではない) ④ TSB 整形 | 中 (基準) |
| **L3: Max Thinking** | claude-opus-4-7-max-thinking | ① §47-A 100% 証明要求 ② §57 改定 **起案** ③ TSB 真因究明 ④ 重大インシデント分析 ⑤ kintone Day N の **Tier B / 不可逆操作前** ⑥ §48 Best Options 起案 ⑦ 複雑な抽象設計 | 高 (~1.5x) |

**判定フロー (AI 思考内 / 1 秒判定)**:

```
浜田の指示を受領
  ↓
1. 「単純な追記 / 整形 / 確認 / 既知定型」か？
   YES → L1 Composer 2  (例: 「commit して」「ログ確認」)
   NO ↓
2. 「Tier B / 100% 証明要求 / 真因究明 / 改定起案」か？
   YES → L3 Max Thinking (例: 「PC 台帳 Day 4 進めて」「TSB 起票」)
   NO ↓
3. デフォルト → L2 Extra High (例: 「実装お願い」「監査して」)
```

**自律判断の安全弁**:

1. **不可逆操作 (Tier B / kintone API write / git push --force / rm -rf) は L3 Max Thinking 強制** = 浜田の §47-A 100% 証明要求と整合
2. **判断に迷ったら L3 にフォールバック** ではなく **L2 (Extra High) にフォールバック** (= F-14 防止 / コスト過剰回避)
3. **Composer 2 → Extra High 昇格**: タスク途中で複雑性発覚 → 「§1-2-3-2 ティア昇格: L1 → L2」と宣言して継続
4. **silent fallback との区別 (§1-2-2 連動)**: Cursor IDE が裏で `Switched to Composer 2 after reaching API limit.` を出した場合は §1-2-2 で 4 択提示が必要。**AI が事前明示的に Composer 2 を選んだ場合は §1-2-2 対象外** = ティア宣言が両者を区別する証跡

**運用例 (2026-04-26 観察値ベース)**:

| 浜田指示 | 旧 (今朝まで) | 新 (本節適用後) |
|---|---|---|
| 「commit して push して」 | L3 Max Thinking | **L1 Composer 2** |
| 「smoke-test 結果を見せて」 | L3 Max Thinking | **L1 Composer 2** |
| 「.cursorignore に追記」 | L3 Max Thinking | **L1 Composer 2** |
| 「P5-5 監査の続き」 | L3 Max Thinking | **L2 Extra High** |
| 「PC 台帳 Day 4 deploy」 | L3 Max Thinking | **L3 Max Thinking** (維持) |
| 「§1-2-3 改定起案」 | L3 Max Thinking | **L3 Max Thinking** (維持) |

**期待効果**:

- **Max Thinking 比率 59.4% → 20-30% 想定** (= 重い設計タスク時のみ)
- **Composer 2 比率 0.6% → 30-40% 想定** (= ルーチンタスク全般)
- API token 消費 1/2 〜 1/3 (= F-13 / 12 日枯渇 → 30 日以上に延伸見込み)

**反パターン (本節で禁止)**:

- ❌ ルーチンタスクを L3 Max Thinking で処理する (= F-14 主因 / 「最適モデル原則」違反)
- ❌ 不可逆操作を L1 Composer 2 で処理する (= §47-A 違反)
- ❌ ティア宣言を省略して作業に入る (= §1-2-3-1 違反 / 浜田の透明性確認権剥奪)

**§1-2-2 との明確な区別**:
- 本節 (§1-2-3-2) = **AI が事前明示で Composer 2 等を選択** (= 健全な最適化)
- §1-2-2 = **Cursor IDE が silent fallback で勝手に切替** (= 浜田選択権剥奪 / 4 択提示必須)

ティア宣言で両者を区別する証跡を残すことで、§1-2-2 違反検知の精度も維持する。

**§1-2-3-3 CIO によるモデル最終判断（2026-04-29 制定 / 浜田 CIO 運用）**:

**背景**: 2026-04-29 浜田指示「**モデル選択は CIO で判断でよい**」を受け、§1-2-3-2（AI 自律モデル選択）と **衝突しない形**で **最終判断権**を明文化する。運用上の **CIO = 浜田**（チャット上の相談・GO も同一人物。§50-3-7 の CEO 最終決定と併せて読む）。

**規定**:

1. **AI の義務**: 引き続き §1-2-3-1 でティアを宣言し、§1-2-3-2 に基づき **推奨（L1/L2/L3 または Extra High / Max Thinking）と理由を提示**する。
2. **CIO（浜田）が当該タスクについてモデル・チャット欄のティアを明示した場合**、AI は **それに従う**。§1-2-3-2 の自律選択と矛盾する場合は **CIO 指示を優先**する（§1-2 例外規定 ① と整合）。
3. **CIO が未指定のとき**は §1-2-3-1 / §1-2-3-2 のとおり（AI が最適と判断したティアで進める）。
4. **§35-1 / §56-1a / TSB-024**（開発・コマンド・検証実行は AI、**仕様の最終判断・GO・画面の目視確認は浜田**）は **不変**（本条はモデル選択の帰属のみを追加する）。

### §1-2-4 クレジット予算管理（2026-04-26 制定 / N-6 / 朝ブリーフィング §0 統合）

**背景**: 2026-04-26 浜田指示「枯渇再発傾向 / 月 ¥20,000 追加可 / AI 側で管理してほしい」を受け、月次クレジット消費の **可視化 + 自発警告 + 超過予測** を構造化。Cursor は公開課金 API を提供していないため、**浜田が 1 日 1 回 30 秒で % を貼付 + AI が予測・記録** のハイブリッド運用とする。

**月次予算（2026-04-26 浜田承認 / P5-5 改定）**:

| 区分 | 金額 (USD) | 円換算 (¥155/$) | 用途 |
|---|---|---|---|
| Cursor Ultra 月額 | $200 | ¥31,000 | 通常運用 (L1) / 基本 API + Composer + Auto |
| On-Demand Monthly Limit (4/26 引上げ) | **$1000** | ¥155,000 | 月次クレジット枯渇後の業務継続 (L2) |
| **合算最大** | **$1200** | **¥186,000** | Worst case |
| **節約適用後 見込** | **$430-500** | **¥66,000-78,000** | S1-S5 節約パッケージ実施時 |

**4/26 P5-5 履歴**:
- 旧: On-Demand Spend Cap **$130** (≈ ¥20,000 / 浜田当初想定)
- 新: On-Demand Monthly Limit **$1000** (Worst ¥186,000 / 節約後 ¥66,000-78,000 想定)
- 引上げ理由: 4/15-4/26 (12 日) で On-Demand $235.94 既消費 = $300 旧上限を 4/29-5/3 突破見込み (= F-12)
- 制約: 引上げと並行で **S1-S5 節約パッケージ全実施** (CLAUDE.md 整理 / Extra High 既定徹底 / .cursorignore 強化 / session 区切り 等) を §1-2-3 / §51 に反映
- 5/15 リセット時に振り返り → 節約効果次第で次月 $500 戻す可能性

**毎日 1 回の貼付フロー（朝ブリーフィング §0 統合 / P5-5 強化）**:

1. **浜田の作業 (30 秒 / 旧プロセス)**:
   - cursor.com/billing or アカウント設定の "Usage" を開いて **「今月のクレジット消費 X%」** を 1 行コピー
   - AI に「今月 X%」とだけ伝える（または `npm run credit:set 65` で直接記録）

2. **浜田の作業 (60 秒 / 新プロセス / P5-5 追加)**:
   - 上記に加え **Cursor IDE Settings → Plan & Usage → Spending タブ** をスクショ送付
   - スクショ内 4 値 = (a) Total% (b) API% (c) On-Demand $X / $1000 (d) Monthly Limit を AI が抽出 → JSON 記録
   - これにより API token 単独枯渇 (= TSB-018 トリガ / F-13) を事前検知可能になる

3. AI が `data/credit-usage.json` に {date, total_pct, api_pct, on_demand_usd, monthly_limit_usd} を append
4. AI が予測ロジックで **「想定枯渇日 / 残日数 / 月末予測 (Total% / API% / On-Demand $)」** を 3 系統計算
5. 翌朝のブリーフィング §0 に 3 系統表示 (どれかが 70% 超なら警告)

**TSB-021 候補 (Day 5-6 起票予定)**: `scripts/credit-budget.mjs` に **`--input-on-demand <USD> --input-api <PCT>`** オプション追加 → 浜田スクショ抽出値を AI が自動投入 → 旧来の % 単一系統から 3 系統に拡張

**自発警告 閾値（P5-5 改定 / 3 系統対応）**:

3 系統 (Total% / API% / On-Demand $) のいずれかが閾値を超えたら警告発火。

| 消費率 | AI 動作 |
|---|---|
| **70%** | 朝報 §0 に「⚠️ 70% 到達 (系統名) / Max Thinking タスクは要選択」と表示。AI 側で §1-2-3 / §1-2-3-1 適用を強化（Max Thinking 要求時に「節約のため Extra High で代替可能か」と問い返し）|
| **80%** **(P5-5 新設)** | 朝報 §0 + AI 開口一番に **「80% 到達 (系統名 = ○○)。本日中の重い設計タスクをどうするかご判断を」**と提示。On-Demand $ なら「上限引上げ or 節約強化 or タスク繰延」の 3 択提示 |
| **85%** | 朝報 §0 + AI 開口一番に **「85% 到達 (系統名)。本日中に On-Demand 引上げ or タスク絞り込みのご判断を」**と提示 |
| **95%** | AI が **タスク開始前に必ず**「95% 超過 (系統名)、§1-2-2 4 択提示しますか? それとも軽微作業のみ続行しますか?」と確認。重い設計タスク・PC 台帳本番は要 GO |
| **100%** | §1-2-2 検知挙動と完全一体化（4 択提示 → 浜田選択待ち）|

**API 系統 100% 単独到達時の特例 (P5-5 / F-13 教訓)**:

- API 系統だけ 100% に達した場合 (= Total/On-Demand は余裕)、Cursor IDE は **Composer 2 fallback (TSB-018)** を発動する
- AI は § 1-2-2 検知挙動を発動 = 即座に作業中断 + 浜田に「§1-2-2 違反検知 / API 系統枯渇 = Composer 2 fallback 発生」と報告
- 浜田 GO 後、Extra High (API 不要) で継続するか、On-Demand 余裕で Max Thinking 継続するかの 2 択提示

**月次リセット**:

- 浜田 Cursor 課金日（例: 毎月 14 日 → 浜田が初回設定時に `npm run credit:reset -- --day=14` で記録）
- リセット日に AI が `data/credit-usage.json` の月次集計を `data/credit-usage-history.jsonl` に append → 当月分 reset

**タイムゾーン (P1 / 2026-04-26 / off-by-one バグ修正)**:

- **全ての日付計算は JST (UTC+9) 基準**。`scripts/credit-budget.mjs` の `todayJstIso()` / `nowJstIso()` / `dateToJstIsoDate()` を使用
- 旧実装 (UTC `toISOString()`) では JST 0:00-8:59 に記録すると前日扱いになる off-by-one バグがあった (実例: O-series 制定日 2026-04-26 07:16 JST の浜田報告が `2026-04-25` として記録された)
- 修正後: cursor.com/billing が表示する日付（JST 表記）と一致する。データ保存も `recorded_at` が `+09:00` 付き ISO 8601

**AI 管理範囲（§1-2-4 の役割分担）**:

| 項目 | AI | 浜田 |
|---|---|---|
| ルール維持・改訂 | ✅ | (§57 改定 GO のみ) |
| % 入力フォーム提供 (`npm run credit:set <pct>`)| ✅ | 入力 30 秒 / 1 日 1 回 |
| 予測計算・JSON 保存 | ✅ | - |
| 朝報 §0 表示 | ✅ | 朝チェック |
| 70/85/95% 自発警告 | ✅ | 判断 |
| Cursor 設定変更 (On-Demand / Spend Cap) | ❌ | ✅（月 1 回 + 必要時）|
| 支払い・プラン変更 | ❌ | ✅ |

**実装ファイル**:

- `scripts/credit-budget.mjs` — 入力・記録・予測ロジック (npm run credit:set / credit:status / credit:reset)
- `data/credit-usage.json` — 当月の日次 % 履歴
- `data/credit-usage-history.jsonl` — 月次集計の永続化
- `scripts/daily-morning-prep.mjs §0` — 朝報統合（残日数 / 想定枯渇日 / 警告レベル）

**§1-2-2 / §1-2-3 との関係**: §1-2-4 = **予算予測（事前防御）**、§1-2-2 = **枯渇検知時の選択（事後対応）**、§1-2-3 = **通常時のコスト最適化**。3 つで枯渇シーケンスを完全カバー。

### §2 正本主義
すべての設計判断・フィールド定義・運用ルールは **ファイルに記録されたものを正本** とする。チャットだけで完結させない。

### §3 索引駆動
作業着手前に `RULES-INDEX.md` を読み、該当するルールファイルへ辿る。索引の複製・長文マージはしない。

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

