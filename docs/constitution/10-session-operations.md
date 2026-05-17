# セチE��ョン運用 OS�E�§42〜§46�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: セチE��ョン刁E��・朝ルーチン  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§42〜§46: 過去ログ・WORKFLOW・夕反省�E朝ルーチン最上位、E

## ぁE��読む�E�チェチE��リスト！E

- セチE��ョン刁E��
- session:clock
- 朝イチE

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第12章 セチE��ョン運用 OS�E�E026-04-18 制宁E/ 最重要E��E

### §42 セチE��ョン冒頭の過去ログ確認義務！E026-04-18 制宁E/ 最重要E��E

ユーザーから「�E日 / 後で / 続きから」などの **継続性を前提とした依頼** を受けた場合、また�E **既存テーマに関係しそうな新しい依頼** を受けた場合、E*回答�E前に忁E��以下を確認すめE*。記�E喪失のような対応�E禁止、E

#### 忁E��確認頁E��（着手前�E�E
1. **進行中の計画ファイル**: `docs/plans/*.md`�E�特に直近日付�Eも�E�E�を `Glob` でリストし、E��連しそぁE��も�EめE`Read` する
2. **直近�Eレポ�EチE*: `docs/reports/*.md` の直迁E3 件
3. **kintone-apps.md の更新履歴**: 末尾の更新履歴チE�Eブルから直迁E5 行を確誁E
4. **過去の agent-transcripts**: `/home/mhamada202408224/.cursor/projects/home-mhamada202408224-kintone-ai-lab/agent-transcripts/<uuid>/<uuid>.jsonl` めE`Grep` で検索�E�キーワーチE 当該チE�Eマ�EアプリID・固有名詞！E
5. **troubleshooting.md**: 同テーマで過去に踏んだ落とし穴�E�ESB-XXX�E�E

#### 忁E��トリガー
- ユーザーが「�E日 / 後で / 次囁E/ 続きで / 続きから / 次は佁E/ 予宁E/ 何時から」と言ったタイミング
- ユーザーが「忘れた！E/ 覚えてる！E/ 前に話した」と言ったタイミング ↁE**即座に該当ログを検索**
- 新しいチE�Eマに見えても、既存アプリ�E�E94/595/626/627/628/667/668�E�に関連する場吁E
- ユーザーが固有名詞！EKYSEA、社冁E��スチE��名、人名など�E�を出した場吁EↁE忁E�� Grep する

#### 回答前の自己宣言
回答�E冒頭 1 行で **「過去ログ確誁E <確認した�E容>、E* を述べてから本題に入る。確認してぁE��ぁE��合�E本題に入る前に確認を実行する、E

#### AI 自身の儀式義務！E026-04-20 制宁E/ NEW-SESSION-STARTER 連動！E
**浜田ぁENEW-SESSION-STARTER 全斁E��貼った新チャチE��の第 1 ターン**では、`chat-sessions/NEW-SESSION-STARTER.md` めE**Read チE�Eルで全斁E��読**してから頁E�� -0・`session:bootstrap` に進む�E�チャチE��貼付�E要紁E��置き換えなぁE��`NEW-SESSION-STARTER.md`「■ 貼付単独で完走」手頁E2�E�、E

**新セチE��ョン開始時、AI は浜田が儀式テンプレを貼ってこなくても、�E発皁E��**:
1. `chat-sessions/checkpoint-latest.md` めERead
2. `chat-sessions/<最新日仁E.md` めERead
3. 朝ブリーフィング `docs/reports/<今日>-morning-prep.md` めERead�E�あれ�E�E�E
4. 「過去ログ確誁E <要紁E1-2 衁E」と宣言してから本題へ

こ�E 1、E を踏まずに本題に入った場合、E�42 違反として即訂正する、EEW-SESSION-STARTER.md を作っておきながら自刁E��踏まなぁE��ぁE�� 2026-04-19 セチE��ョンの矛盾を防ぐため、E

#### 違反時�Eリカバリー
ユーザーから「過去のめE��取りを確認して」と持E��されたら、E*即座に上訁E1-5 を�E部実衁E* し、結果を要紁E��てから次の発言に移る。「すみません、確認します」だけで済ませず、実際にチE�Eル実行する、E

#### §42-2 Continuity Assurance (継続性保証 / ファイル直読方弁E/ 2026-04-24 21:30 制宁E/ 浜田 21:24 持E��「�E日 19:00 開戦晁E1% の不安も残さなぁE��E

**背景**: 本日制定ルール褁E��件 (R10/§54/§55 筁E を新セチE��ョン AI が忘れたら全て無意味 ↁE「忘却 / 退行予防」が最優先課題。メイン AI 原案「唱咁E+ 同一セチE��ョン冁E��閲 + クリチE��カル重み付け」�E レビューで「唱咁E= 記�Eを記�Eで検証する自己循環 / 同一ファミリー冁E�E相互検閲 = 馴れ合ぁE��スク / §47-B-2 ルール疲労違反」が持E��され ↁE、E*ファイル直読方弁E(No-Recitation Read-First)**」へ転揁EↁE浜田 21:30 A 桁EGO、E

##### §42-2-1 起動時 AGENTS.md 全斁ERead (記�E経由しなぁE

新セチE��ョン起動時、E�42 忁E��確認頁E��E(1-5) と並行して以下を忁E��実衁E

1. **AGENTS.md 全斁ERead** (`Read /home/mhamada202408224/kintone-ai-lab/AGENTS.md` / 全衁E
   - 記�Eベ�Eスの「唱和」�E廁E�� (自己循環論理排除)
   - ファイル直読 = 偽記�E混入ゼロ
2. **RULES-INDEX.md 全斁ERead** (索引で構造把握 / Read コスト最小化)
3. **chat-sessions/checkpoint-latest.md Read** (現在地確誁E/ 既孁E§42 義務継承)

##### §42-2-2 SHA256 ハッシュ比輁E(前回セチE��ョン終亁E�� ↁE今回起動時)

- セチE��ョン終亁E�� (浜田が「終わって」と言った時 or §44 evening-reflect 征E に AI ぁE`sha256sum AGENTS.md > .session-state/agents-md-hash.txt` を記録
- 次回起動時に `sha256sum AGENTS.md` を実衁EↁE前回 hash と比輁E
- **一致** ↁEルール変更なぁEↁE即業務開始可 (浜田征E��ゼロ)
- **不一致** ↁEセチE��ョン間で AGENTS.md 変更あり ↁE§42-2-3 スチE��プへ
- **補宁E(K-3 / §51-3 段隁E3)**: バックグラウンドで `npm run watcher:start`�E�Escripts/file-watcher.mjs`�E�を常時稼働させると、AGENTS.md 筁E**憲況E5 ファイル** の working tree 上�E冁E��変化めE`fs.watch` + **SHA256** で検知し、`logs/file-watcher/agents-md-changes.jsonl` に追記する、E*起動かめE60 私E*はエチE��タ初期読込の誤警報抑制�E�Ein_grace: true` / stderr ベルなし）、以降�E **stderr + 端末ベル** で即時警告。post-commit hook�E�ESB-016�E�が拾ぁE�Eは **commit 征E*のみなので、E*commit 前�E並列編雁E*�E�ESB-017 型）�E死角を埋める、E

##### §42-2-3 BREAKING ラベルフィルタ (§54-1 連勁E

ハッシュ不一致時、セチE��ョン閁Ecommit ログを取征E
```bash
git log <前回 hash の commit>..HEAD --grep="\[BREAKING\]" --oneline
```

- BREAKING commit あり ↁE該当箁E��を強調チャチE��出劁EↁE浜田と AI が一緒に確誁E
- BREAKING commit なぁEↁE[FEAT/FIX] のみ ↁE概要�EみチャチE��出劁E(詳細は浜田判断)

##### §42-2-4 RAG 起動時自動クエリ (Tier S ルール 5 件抽出)

起動時に AI が�E動実衁E
```
npm run rag:query "Tier S クリチE��カル ルール"
```

ↁE結果として以丁E5 件 (or 設定数) が�E劁E
- §52-3 Q1 不可送E(Tier B 強制)
- §52-3 Q6 scope check
- §52-1 / §52-2 Tier A・B の墁E��
- §54-2-1 Negative Log / 馴れ合ぁE��止の精祁E
- §44 evening-reflect
- �E�補助クエリ推奨�E�`npm run rag:query "§55 セーフモーチE発勁E解除"`  EインチE��クス負荷許容晁E

##### §42-2-5 クリチE��カル・ルール Tier マ�Eカー (AGENTS.md 冁E��メンチE

主要ルール条斁E�E直前に以下�Eマ�Eカーをコメント追加:
```markdown
<!-- TIER:S - 起動時忁E�� / 違反 = チE�Eタ破壁Eor 信頼崩壁E-->
### §52-3 AI 自己診断 6 啁E
...
```

- Tier S (絶対遵宁E/ 起動時忁E��): §52-3 Q1 / Q6 / §54-2-1 / §44
- Tier A (忁E��推奨): §52 Tier A/B / §54-1 BREAKING / §54-3 廁E��経緯 / **§55 異常時セーフモーチE* / **§56 RACI**
- Tier B (時間あれば): そ�E仁E

##### §42-2-6 起動時の別モチE��査読に関する方釁E

- **§1-2** と同旨: 本リポジトリの通常作業は **Opus 4.7 のみ**。常時�E自動�E別モチE���E�セカンチEAI�E�査読は行わなぁE��コスト�E遁E��・§51 との整合�Eため�E�。起動時の判断材料は **§42-2-1 のファイル直読 + §42-2-2 ハッシュ + §42-2-4 RAG** に限定する、E
- 浜田が�E示して依頼した外部レビュー�E�別製品�E別セチE��ョン�E��E、その篁E��でのみ任意で実施、E

##### §42-2-7 セーフモード連動（起動時刁E��E/ §55 へ委譲�E�E

**本斁E*: **第19章 §55 異常時セーフモーチE*、E

起動時だけ�E最小�E岁E
- **AGENTS.md Read 失敁E* (権陁E/ ファイル消失) ↁE**§55 即時発勁E* (`entered_by:continuity` 推奨) + Tier B 寁E�� + 浜田通知 (§52-2 連勁E
- `.session-state/agents-md-hash.txt` 不在 (初回 / リカバリー征E ↁEハッシュ比輁E��キチE�E + 全斁ERead のみ + 「�E回扱ぁE���E力（§55 自動発動しなぁE��E
- **RAG MCP 不調** ↁE§42-2-4 スキチE�E + 「RAG 不調 / Tier S 抽出後日」�E力！E*RAG 単独では §55 発動しなぁE* / §55 の可用性原則�E�E

##### §42-2-8 浜田 21:24 、E% の不安ゼロ、E達�E基溁E

- 起動直征E30 秒以冁E��「ルール体系現状把握」完亁E
- ハッシュ一致 ↁE即業務開始可 (浜田征E��ゼロ)
- ハッシュ不一致 ↁEBREAKING フィルタで「変更箁E��」�Eみ即提示 (1 刁E��冁E
- 「AI が忘れた」状慁E= 物琁E��に発生不可 (ファイル直読 + ハッシュ検証)

##### §42-2-9 ファイル直読方式への持E��と解涁E

| 持E�� | 解涁E|
|---|---|
| 1. 唱咁E= 記�E依存�E己循環 | ✁E唱和�E廁E/ ファイル直読のみ |
| 2. 同一ファミリー冁E�E相互検閲 | ✁E起動時の別モチE��査読は行わなぁE/ ファイル直読で代替 |
| 3. ルール疲労ガード違叁E| ✁Eハッシュ比輁E��「変更時�Eみ確認、E= 軽量化 |
| 4. 4/25 起勁E15 刁E��ーチE| ✁E唱和廁E��で消失 / ハッシュ一致なら即開姁E|
| 5. 代替桁E(ファイル直読 + RAG) | ✁E全面採用 |

---

### §43 WORKFLOW.md 遵守義務！E026-04-18 制宁E/ 最重要E��E

すべてのタスクは **`WORKFLOW.md` の Phase 0 ↁEPhase 5** の頁E��進める。各 Phase の完亁E��に「Phase X 完亁E��言」を忁E��出してから次へ進むこと。Phase 飛�Eし�E禁止、E

#### 自動連動（毎朝 06:00�E�E
WSL cron ぁE`scripts/daily-morning-prep.mjs` を実行し、ブリーフィングめE`docs/reports/<日仁E-morning-prep.md` に生�Eする、EI は Phase 0 の最初にこ�Eファイルを読み、それを斁E��として宣言してから Phase 1 へ進む、E

#### 違反時�Eリカバリー
- Phase 飛�Eしを発見したら、即座に該彁EPhase へ戻り宣言から再開
- 同じ失敁E2 回で §14 を即発勁E
- 「忘れた？」と持E��されたら §42 を即発勁E

#### 関連
- 詳細手頁E `WORKFLOW.md`
- 朝ブリーフィング生�E: `scripts/daily-morning-prep.mjs`
- cron 登録: `bash scripts/install-morning-cron.sh`

---

### §44 夕反省サイクル�E�E026-04-18 制宁E/ 最重要E��E

ユーザーから、E*まとめて / 反省 / 振り返って / お疲めE/ 終わめE*」等�Eキーワードを受領したら、即座に以下を実行すめE

1. **`node scripts/evening-reflect.mjs`** を呼んで雛形を生戁E
2. 雛形の **§1-N�E�毎夜忁E��議題�E憲法運用レビュー�E�E* めE**浜田と忁E��議諁E*する�E�E*CIO 二人体制 / §1c 仕様�E検証ラベル / MCP 先�Eし�EMCPスキチE�E / 「直った」�E検証不足 / ルールと実�Eのズレ**�E�。飛�Eした日は **§44 未実施扱ぁE*。結論�E **§2 また�E §4 に 1 行以丁E* 残す
3. 雛形の §2-§5�E�今日めE��たこと / ぁE��くいったこと / 詰まったこと / 改喁E��案）を埋めめE
4. 改喁E��案�E ID 付き�E�ER1, #S1, #D1, #C1, #K1...�E�で表形弁E
5. ユーザーに提示し、応答を征E��

ユーザーから、E*#R1 承誁E/ #S1 却丁E/ #D1 修正して: …**」等�E応答を受けたら:

- **承誁E*: `docs/approved-changes/<明日の日仁E/<id>.proposal.json` に書き�Eす！Etatus=approved�E�E
- **却丁E*: `docs/approved-changes/rejected/<日仁E-<id>.proposal.json` に書き�EぁE
- **修正要汁E*: AI が修正して再提示 ↁE再承認を征E��

翌朝 06:00 cron ぁE`apply-approved-changes.mjs` で承認済みを実行し、結果を朝ブリーフィングの先頭に表示する、E

#### 自動実施可否のカチE��リ
- **R/S/D/C**: 自動実施可�E�E は customize コード�Eみ。deploy は除く！E
- **K (kintone API)**: 自動禁止。朝の AI が手頁E���Eのみ
- **deploy 系**�E�Enpm run deploy:*`�E�E 常に手動。proposal にしてはならなぁE

#### 関連
- スキャフォール: `scripts/evening-reflect.mjs`
- 実衁E `scripts/apply-approved-changes.mjs`
- 事前検証: `scripts/check-proposals.mjs`�E�E*proposal 作�E直征E+ 朁Ecron 実行直前に忁E��E*�E�E
- スキーチE `docs/approved-changes/README.md`

#### proposal 事前検証儀式！E026-04-22 制宁E/ 改喁E��E#11 / R9 + R13 半角�E全见E() 同型バグ再発防止 / 並行チャチE��による救済�E制度化！E

夕反省で承認された proposal めE`docs/approved-changes/<明日の日仁E/` に書き�Eした **直征E*、忁E��以下を実行すめE

```bash
node scripts/check-proposals.mjs --date=$(date -d tomorrow +%Y-%m-%d)
```

出力で **❁EぁE1 件でもあれ�E朁Ecron で同件数の失敗確宁E*。今�EぁE��に proposal を修正 ↁE再検証 ↁE❁Eゼロにしてから commit する。違反時�E�事前検証なしで proposal commit ↁE翌朝 cron で失敗）�E §47 違反扱ぁE��E*実侁E*: 2026-04-22 私が R13 で半见E() を使ぁEAGENTS.md 全见E�E�）と不一致を作る ↁE並衁ECursor チャチE��が�E然発見�E救済！E8d1765�E�E 本ルール導�Eで救済を仕絁E��化、E*朁Ecron 統合（段隁E2�E�E*: `scripts/apply-approved-changes.mjs` が実行直前に `check-proposals.mjs` を呼び、❌ があれ�E適用前に朝ブリーフィング先頭に ⚠ 表示する仕絁E��めE4/24 以降に追加予定、E

---

### §45 タスク完遂義勁E E「やることを済ませてから次へ、E2026-04-19 制宁E/ 最重要E

朝�EブリーフィングめE��話で **褁E��のタスクが見えた状態で新規タスクに進むのは禁止**、E
未完亁E��スクの完遂を忁E��先に行う。途中で打ち刁E��なぁE��中途半端で次に行かなぁE��E

#### 忁E��優先頁E��（高い頁E��処琁E��E

0. **🌅 朝ルーチン 5 Phase**�E�§46 / **全タスク絶対上佁E/ ユーザー新規依頼より丁E*/ 毎朝忁E��先に完遂�E�E
1. **🔴 至急修復系**�E�ユーザーが「�E急」「直して」「赤ぁE��「壊れてぁE��」と言ったもの ※ただぁE§46 が赤なめE§46 が�E�E�E
2. **⏰ 時刻持E��タスク**�E�朝ブリーフィング「⚡ 時刻持E��タスク」に該当するもの�E�E
3. **⚠ 朝ブリーフィングの未解決警呁E*�E��Eルススコア < 満点 の構�E要素、❌/⚠ 表示�E�E
4. **📋 進行中の `docs/plans/*.md` 未完亁E��ェチE��ボックス**
5. **�E 新規依頼**�E�ユーザーから今日もらった新タスク ※§46 が赤なら一言断って後回し！E
6. **🔮 翌日以降に紁E��済みのタスク**�E�EKYSEA など�E�E

#### 完遂判定！Eone の定義�E�E

タスクは以下�E **3 条件すべて** を満たした時のみ「完遂」と宣言できる:

- ✁E**A. 機�E動作確誁E*: 実際に動かしてエラーが消えぁE/ 期征E��が�EぁE
- ✁E**B. 副作用確誁E*: 変更した周辺�E��Eルススコア / 別の MCP / 別のスクリプト�E�が壊れてぁE��ぁE
- ✁E**C. 記録**: `kintone-apps.md` 末尾の更新履歴 また�E `docs/reports/` に 1 行記録

3 つのぁE�� 1 つでも欠けたら「未完亁E��とみなし、新タスクに進まなぁE��E

**任意推奨: tested-by メタチE�Eタ�E�E026-04-22 制宁E/ 改喁E��E#16 / ルール疲労ガード補強�E�E*: AGENTS.md / WORKFLOW.md / RULES-INDEX.md に **新ルールを制定すめEcommit** には、commit メチE��ージ末尾に `tested-by: <該当ルールを実適用した commit SHA>` を付与する（任愁E/ 本ルール制宁Ecommit 自身に対しては不要E��。実侁E 改喁E��E#11 の事前検証儀式！E21�E�を制定すめEcommit に対して、後日 R21 を踏んだ宁Ecommit ができためE`tested-by: 12abc34` を付ける、E*期征E��极E*: 制定したルールが「机上�E空論」で終わってぁE��ぁE��、後追ぁE��検証可能 / 「ルールを制定した本人が踏み忘れた」現象�E�E026-04-22 私�E §11-3 違反�E�を統計的に把握可能、E*段階導�E**: 段隁E1 = 任意運用�E�E/23 以降！E 段隁E2 = `scripts/audit-rules.mjs` で「制定征E30 日以冁E�� tested-by が付かなかったルール = 死蔵候補」を朝ブリーフィングに表示�E�E 月以降と連動）、E*判断**: 任意推奨に留め強制しなぁE��由 = 義務化すると「tested-by を付けるため�E不�E然 commit」を誘発するリスク。実用性は 1 ヶ月運用で評価して再判断、E

#### 違反時�Eリカバリー

ユーザーから「まずやることを済ませて」「中途半端」「次に行く前に」等を持E��されたら:

1. **即座に新タスクへの着手を停止**
2. 残ってぁE��優允E1、E を箁E��書きで列挙
3. 頁E��に牁E��ける（並列可だが、すべて完遂条件 ABC を満たしてから次へ�E�E

---

### §46 朝ルーチン絶対優先義務！E026-04-19 制宁E/ 最重要E/ 最上佁E/ 全ルールの上位！E

> **基本哲学�E�E026-04-19 ユーザー強ぁE��望により明文化！E*:
> 、E*健康じゃなぁE��ぁE��仕事ができなぁE*。だから、朝ブリーフィングと健康チェチE��は、ユーザーからの作�E依頼を含む**ぁE��なるタスクよりも優先すめE*。、E
>
> ── これは AI 自身の動作品質を保証する基盤であり、これを怠れ�E後続�Eすべてのタスク品質が落ちる。よって朝ルーチンは「サボっても良ぁE��提作業」ではなく「サボったら全業務が違反になる根幹」である、E

毎朝、AI が最初に行うのは **「朝ルーチン 5 Phase」を完遂すること**、E
SKYSEA / 新機�E開発 / **ユーザーから今この瞬間もらった新規依頼** / 緊急修復 など、E*ぁE��なるタスクよりも朝ルーチンが優先すめE*、E
朝ルーチンが赤�E�❌�E��E状態で他�Eタスクに進むのは**禁止**、E

#### 「ユーザー依頼より上位」�E絶対ルール�E�誤解防止のため明示�E�E

たとえ�E次のような状況でも、朝ルーチン未完なめE**依頼を一旦保留**して朝ルーチンを�Eに完遂する:

| 状況E| 正しい対忁E| 違反侁E|
|---|---|---|
| ユーザーが「SKYSEA 進めて」と依頼 / 朝ルーチン未宁E| 「健康チェチE��が未完�Eため先にそちらを完遂します（推宁EN 刁E��」と一言断り、E�46 ↁESKYSEA の頁E| ぁE��なめESKYSEA に着扁E|
| ユーザーが「新機�E A 作って」と依頼 / Phase 2 で MCP 異常 1 件 | Phase 3 で自動治癁EↁE失敗時は手動修復 ↁE緑になってから新機�E A | 「新機�E A 完亁E��たら直します」と後回ぁE|
| 朁E09:00 セチE��ョン開姁E/ cron は 06:00 に走っぁE/ でもブリーフィング未読 | まぁE`docs/reports/<日仁E-morning-prep.md` めERead ↁE5 Phase 完遂宣言 ↁE通常タスク | 読まずに会話開姁E|

**唯一の例夁E*: ユーザーが�E示皁E��「朝ルーチン後でぁE��ので XX を�EにめE��て」と発言した場合�Eみ §46 を後回しできる。ただしその場合も完遂は当日中に忁E��、E

#### 朝ルーチン 5 Phase�E�毎朝 06:00 cron で自動実衁E+ AI セチE��ョン開始時に確認！E

| Phase | 冁E�� | スクリプト | 結果 |
|---|---|---|---|
| 0 | 昨夜承認�Eの自動実施 | `apply-approved-changes.mjs` | proposal を頁E��適用 |
| 1 | 朝ブリーフィング生�E | `daily-morning-prep.mjs`�E�本体！E| `docs/reports/<日仁E-morning-prep.md` |
| 2 | **健康状況チェチE��** | `health-check.mjs` + `check-node-modules.mjs` | MCP 全件疎送E/ Node 整吁E/ cron / disk / mem / **node_modules 完�E性�E�Eritical bins 存在 + package.json devDeps と node_modules/<pkg>/package.json バ�Eジョン一致�E�E* |
| 3 | **自動治癁E* | `auto-heal.mjs` | 既知エラーパターンを�E動修復 |
| 4 | **バ�EジョンアチE�E対忁E* | `version-up.mjs` | patch=自勁E/ minor=proposal / major=proposal |

#### Phase 2-4 の自勁Evs 提案墁E��

- **Phase 3 自動可**: npx キャチE��ュクリア / `npm audit fix` (patch only) / `npm ci` / logs ローチE�Eション / ESLint --fix / **依存欠損検知時�E `npm ci` 再実行！Ehase 2 で `check-node-modules.mjs` ぁENG を返したら無条件で `npm ci` をリトライ / 改喁E��E#6 / 2026-04-22 制定！E*
- **Phase 4 提案行き�E�E カチE��リ�E�E*: minor update / major update / 新規パチE��ージ追加・削除
- **Phase 2-4 で異常検�E晁E*: 朝ブリーフィング先頭に **🚨 緊急** ヘッダーで表示し、AI は他タスクに進めなぁE��§45 優允E0 として扱ぁE��E

#### AI セチE��ョン開始時の忁E��宣言

```
✁EPhase 0 完亁E 昨夜承誁EN 件適用 / 失敁EM 件
✁EPhase 1 完亁E ブリーフィング読込�E��Eルススコア X/Y�E�E
✁EPhase 2 完亁E 健康チェチE���E�ECP 全 K 件疎送E/ 異常 N 件�E�E
✁EPhase 3 完亁E 自動治療（修復 N 件 / 殁EM 件�E�E
✁EPhase 4 完亁E バ�Eジョン�E�Eatch 自勁EN 件 / proposal 匁EM 件�E�E
ↁE通常タスクに進む
```

朝ルーチンが赤の状態で `ↁE通常タスクに進む` と宣言しためE**即違反**、E

#### 月次ルール健康診断�E�E026-04-22 制宁E/ 改喁E��E#15 / 5 朁E1 日以降�E毎月 1 日に実施�E�E

AGENTS.md のルール総量が肥大化すると **「ルール疲労、E*�E�§47-B 参�E / 制定したルールを�E刁E��踏み忘れる現象�E�リスクが高まる。これを月次でメタ診断する:

1. **雁E��E*: 過去 30 日間�E `chat-sessions/*.md` + `docs/reports/*.md` + `docs/troubleshooting.md` めEgrep し、各 §N の参�E回数 + 違反持E��件数めE`logs/rule-audit/<朁E.json` に蓁E��E
2. **TOP 5 提示**: 「最も参照・違反持E��されたルール」上佁E5 件を朝ブリーフィング先頭に表示
3. **統廁E��候裁E*: 過去 30 日 0 回参照かつ 0 件違反のルールを「統廁E��候補」として浜田に提示
4. **判断は浜田**: 統廁E��・廁E��・維持を浜田が判断 ↁEproposal 匁EↁEcron 適用

**段階導�E**: 段隁E1 = 本斁E��追記！E/23 朝以降！E 段隁E2 = `scripts/audit-rules.mjs` 拡張で雁E���E動化�E�E/1 朝までに実裁E��E 段隁E3 = 5/1 朝�E朝ブリーフィングに TOP 5 + 統廁E��候補表示開始、E*期征E��极E*: ルール過寁E��の歯止めE+ 浜田の認知負荷軽渁E+ 「使われてぁE��ぁE��ール」�E見える化、E

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

