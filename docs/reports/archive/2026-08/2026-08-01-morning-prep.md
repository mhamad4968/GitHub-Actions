# 🌅 朝のブリーフィング — 2026-08-01 (Sat) 06:00

> 本ファイルは `scripts/daily-morning-prep.mjs` が毎朝 06:00（**WSL cron**）または **Windows 上の `npm run morning:ensure`** で自動生成しています。
> AI エージェントは WORKFLOW.md §Phase 0 に従い、最初にこのファイルを読みます。
> **MORNING_PREP_MODE: full** — 毎朝 cron / 手動フル生成。

---

## 📋 昨夜承認分の自動実施結果

_(承認済み案件なし)_

---

## 0a. 💳 Cursor Ultra クレジット予算（§1-2-4）

- 直近消費: 🟢 20% (2026-07-31) — OK / 通常運用継続
- 月予算: L1 $200 (Ultra) + L2 $1000 (On-Demand cap) = **$1200**
- 課金日: 毎月 15 日 / 次回リセット **2026-08-15** (残 **14** 日)
- 線形回帰予測 枯渇日: **2029-04-10** ✅ リセット日以降
- AI 助言: 通常運用継続 OK
- 履歴件数: 23 日分

> **3 日に 1 回**が妥当: Plan & Usage の Total% 1 行 or スクショ → CIO が `npm run credit:set <pct>` で記録

---

## 0b. §55 セーフモード・前日自律ログ

- §55: `safe-mode.json` なし（未発動または初回）

### 🤖 自律判断ログ（2026-07-31 / autonomy scan）

- **件数**: 0 行
- **emergency:true**: 0 件
- **§55 / safe_mode 関連（推定）**: 0 件
- **notes / 旧 second_opinion に skipped 系（推定）**: 0 件

---

## 1. 環境ヘルス（kintone API 疎通）

### ✅ npm run kintone:test

```text
[ok] app 595: 社員情報マスタ
[ok] app 670: 環境設定マスタ
[ok] app 671: M365管理マスタ
[ok] app 672: 新個人WindowsID採番マスタ
[ok] app 673: 新共有WindowsID採番マスタ
[ok] app 674: 新・PC台帳ver.1
[ok] app 714: ソフトウエア台帳DB
[ok] app 715: ソフトウエア管理台帳ver.1
[ok] app 716: 記憶媒体等台帳DB
[ok] app 717: 記憶媒体等管理台帳ver.1
[kintone:test] app 594 は既定でスキップ（移行時のみ INCLUDE_LEGACY_APP_594=1）
[kintone:test] PC台帳 + ソフトウェア台帳 + 記憶媒体等台帳スタック疎通 OK
```

## 2. 静的解析（ESLint）

### ✅ npm run lint:customize

```text
(出力なし)
```

## 3. セキュリティ（npm audit）

### ✅ npm audit

```text
found 0 vulnerabilities
```

## 4. 依存パッケージの最新性（npm outdated）

```text
Package  Current  Wanted  Latest  Location             Depended by
eslint    10.6.0  10.8.0  10.8.0  node_modules/eslint  kintone-ai-lab
```

## 5. ルール整合性（AGENTS.md ↔ RULES-INDEX.md / WORKFLOW.md）

### ルール整合性チェック

- AGENTS.md 定義: §0 / §1 / §2 / §3 / §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §12 / §13 / §14 / §15 / §16 / §17 / §18 / §19 / §20 / §21 / §22 / §23 / §24 / §25 / §26 / §27 / §28 / §29 / §30 / §31 / §32 / §33 / §34 / §35 / §36 / §37 / §38 / §39 / §41 / §42 / §43 / §44 / §45 / §46 / §47 / §48 / §49 / §50 / §51 / §52 / §54 / §55 / §56 / §57
- RULES-INDEX.md: 56 個の §N 参照
- WORKFLOW.md: 19 個の §N 参照

✅ 破断リンクなし（参照されている §N はすべて AGENTS.md に存在）

## 5-2. TSB confirmed フラグ整合性（F-2 5月目標 #2 監視）

### TSB confirmed flag audit (F-2 5月目標 #2 監視)

- ファイル: `docs\troubleshooting.md`
- 目次行数: 38
- 本文セクション数 (## TSB-): 38
- root_cause_confirmed = true: 37 件 (**97%** 名目 / 孤児除外 **100%**)
- root_cause_confirmed = false: 1 件（うち孤児明示 **1** / 要対応 **0**）

✅ 5 月目標 #2 (カバレッジ 100% / 実質 = 孤児を除く 100%) を達成（名目 97% / 実質 100%）
- 孤児確定 (調査打ち切り・目次維持): TSB-001

⚠️ 本文に ## 1 件の TSB セクションがあるが目次にない (drift)
  - TSB-042
ℹ️ 履歴参照 marker (date="履歴参照") として本文セクションなしは想定通り (2 件)
  - TSB-001
  - TSB-004

## 5-3. post-BREAKING 削除 復活検知（TSB-016 #20 = ゾンビ復活ガード）

### post-BREAKING 削除 復活検知 (TSB-016 #20 / I-1+I-3)

- 対象ファイル (5 件): `AGENTS.md` / `RULES-INDEX.md` / `WORKFLOW.md` / `CLAUDE.md` / `kintone-apps.md`
- 走査範囲: 直近 50 commit (実走査 50 件)
- [BREAKING] commit 検出: 0 件

| ファイル | BREAKING削除実施数 | 残存ゾンビ | 履歴上復活→修復済 |
|---|---:|---:|---:|
| `AGENTS.md` | 0 | ✅ 0 | 0 |
| `RULES-INDEX.md` | 0 | ✅ 0 | 0 |
| `WORKFLOW.md` | 0 | ✅ 0 | 0 |
| `CLAUDE.md` | 0 | ✅ 0 | 0 |
| `kintone-apps.md` | 0 | ✅ 0 | 0 |

✅ pass: 全対象ファイルに「ゾンビ復活した削除済章/節」は存在せず

## 5-4. AGENTS.md ↔ RULES-INDEX.md 相互参照 drift（索引漏れ + 死参照 検知）

### Cross-reference audit (AGENTS.md ↔ RULES-INDEX.md / I-11)

- AGENTS.md 定義済 §N: **168** 件
- AGENTS.md 全言及 §N: 197 件
- RULES-INDEX.md 言及 §N: **162** 件

✅ pass: AGENTS.md と RULES-INDEX.md の §N drift (warn) なし
  (info: sub-section 個別未列挙 35 件は親登録あり = 許容)

## 5-5. 憲法ファイル リアルタイム変更ログ（過去 24h / K-3 / agents-md-changes.jsonl）

**watcher プロセス状態**: ⚪ 不明 (`scripts/file-watcher.mjs`)
**朝報生成時刻**: 2026-08-01T06:00:13.860+09:00 (この時刻以降の編集は翌朝報で確認)

_ログなし（agents-md-changes.jsonl 未生成）。`npm run watcher:start` で K-3 監視を有効化。_

## 6. 未完了プラン抽出（docs/plans/*.md）

### 未完了タスク（docs/plans/）

> **119 件の未完了項目を 17 ファイルから検出**

#### 2026-04-18-skysea-installer.md

- L115: - [ ] PowerShell スクリプト雛形（突合 → 起動確認 → リモートインストール → 結果CSV） → **2026-04-25/26 持ち越し**
- L120: - [ ] 「📌 SKYSEA未導入」絞り込みを 674 で使う運用／UI を8月計画で確定する

#### 2026-04-21-new-pc-ledger-spec.md

- L739: - [ ] 他アプリからの 627/594/626/667 ルックアップ参照を grep で洗い出し
- L740: - [ ] 595/656/657 等が 627/594/626/667 を参照してないか確認
- L741: - [ ] kintone API で 627/594/626/667 を叩くスクリプト全件特定
- L742: - [ ] 削除直前に CSV 全件エクスポート → リポジトリ保存
- L743: - [ ] 削除直前の最後の JSON Snapshot 取得 (`data/snapshots/{627,594,626,667}-final-<date>.json`)
- L779: - [ ] 627 スキャン（個人 259 件に紐付くアカウント実態 / status / 重複紐付け確認）
- L780: - [ ] 廃棄 1 件の種別特定 → B-1/B-2 除外確定
- L781: - [ ] CSV マッピング表（594 + 627 + 595 → 新・PC台帳ver.1 の各フィールド）
- L782: - [ ] CSV 整形ロジック実装（PW 自動算出 / バリデーション 2 系統対応 / etc）
- L783: - [ ] CSV 出力 → 浜田レビュー → 浜田 import → 検証（件数一致 + 抜け漏れゼロ）
- ...他 7 件

#### 2026-04-25-pc-ledger-day3-action.md

- L59: - [ ] `logs/autonomy-decisions.log` に Tier 判断が残る（該当操作があれば）
- L105: - [ ] 新・PC台帳ver.1（Day 4 で作成予定）から 672/673 を呼ぶ採番ボタン UI 実装
- L106: - [ ] 初期データ投入: jbm0001〜jbmXXXX / sjbm0001〜sjbmXXXX（必要数を浜田と決定）
- L107: - [ ] 旧 626（1993 件）/ 旧 667（40 件）の凍結タイミング決定（5/13 月曜本番切替日）
- L108: - [ ] 旧 626/667 のリネーム + 権限変更（書込ロック）

#### 2026-04-26-pc-ledger-day4-action.md

- L83: - [ ] chat-sessions/2026-04-26.md 更新（任意・日次ログ）
- L363: - [ ] App 674 が本番に存在し、**仕様書 §4.2 と一致**（field-spec-diff.mjs で機械検証）。**2026-04-27 GO 後**は `674-go-post-deploy-674-*` で **当時の 35/35**。**2026-04-28**: 594 HW + 内部 GROUP で正本 **43 件** → Tier B 後 **43/43**。**
- L379: - [ ] テンプレ CSV 配布（B-1 移行用・**本番取込は 4/30-5/2**／手順は仕様書 **§7.4.6**・**§8.3**。**日程・着手順の絶対正本・前倒し禁止は §9（§9.0）**—チャットや手順書だけで日付をずらさない）
- L380: - [ ] 動作確認チェックリスト（仕様書 §10.1 / 17 項目）

#### 2026-05-28-business-improvement-implementation-handbook.md

- L248: - [ ] 新①〜⑤ 名称・スペース57配置
- L249: - [ ] 設定マスタ30行＋共通人事部長 `jinji`
- L250: - [ ] 評価項目20段階（新④内）
- L251: - [ ] 新② 595同期確認
- L255: - [ ] 申請/評価 **画面分離**・テーマ色（青/茶）
- L256: - [ ] 評価ドロップダウン（ルックアップ廃止）
- L257: - [ ] アコーディオン・Q58バッジ・Q-UX-01/02
- L258: - [ ] 2ペイン/縦積み切替（1280px）
- L259: - [ ] 差戻し・再申請・履歴サブテーブル
- L260: - [ ] プロセス作業者=設定マスタ参照（共通人事部長含む）
- ...他 8 件

#### 2026-06-02-apple-id-kintone-spec.md

- L349: - [ ] kintone レコード数 ≒ **1,146**
- L350: - [ ] 割当済行（氏名あり）≒ **251** 前後
- L351: - [ ] ダッシュで **採番・編集・廃止・削除** が動作
- L352: - [ ] 浜田 **目視 GO**

#### 2026-06-16-vpn-account-kintone-spec.md

- L372: - [ ] kintone レコード数 = **66**（+ 設定 1 件）
- L373: - [ ] ダッシュで **新規・編集・削除・印刷・集計** が動作
- L374: - [ ] 次 ID バナー = **`user080@kensetsutoso.fre`**
- L375: - [ ] 浜田 **目視 GO**

#### 2026-06-18-jikkou-yosan-field-dictionary-phase1.md

- L250: - [ ] **実装 GO**（AIチーム内突合後） — 2026-06-18

#### 2026-06-24-jikkou-yosan-diff-print-session-memo.md

- L38: - [ ] 印刷ボタン付近に **通常 / 差分付き** ラジオ
- L39: - [ ] `openTabPrint` / `buildPrintSummaryHtml` / `buildPrintDetailHtml` に差分 CSS クラス付与
- L40: - [ ] 既存 `diffResult` + `structuralRowKey` を印刷 HTML 生成時に再利用
- L41: - [ ] フッターに比較対象版（`diffBaseMeta`）
- L42: - [ ] **総括表印刷**から先行リリース → deploy:736
- L46: - [ ] 詳細表印刷にも差分反映
- L47: - [ ] 削除行ブロックの印刷制御（展開時のみ）
- L48: - [ ] 差分一覧パネル相当の簡易サマリー（任意）
- L52: - [ ] 色・レイアウト調整
- L53: - [ ] 差分付き印刷時の A4 改ページ確認

#### 2026-06-27-doc-lane-phase2-word-spec.md

- L42: - [ ] **パイロット 1 本 + 浜田目視 OK**（R-DOC-16 — infra 済・運用クローズ待ち）
- L43: - [ ] R-DOC-10 完全クローズ（パイロット OK 後）

#### 2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md

- L1636: - [ ] 5タブが存在し、役割が混在していない（工事基本情報は総括と別）。
- L1637: - [ ] 代表工事で基本情報から内訳、総括へ追跡できる。
- L1638: - [ ] 内訳を工種ブロックで確認できる。
- L1639: - [ ] 内訳で工種ブロックを追加でき、総括へ反映できる。
- L1640: - [ ] 施工・保安・給与手当の3区分を区別して集計できる。
- L1641: - [ ] 内訳予算が予実管理へ一意に供給される。
- L1642: - [ ] 税抜実績を手入力できる。
- L1643: - [ ] 実績が予算版ではなく工事に1回だけ所属する。
- L1644: - [ ] 実績登録時予算版を監査参照できる。
- L1645: - [ ] 実績、残予算、消化率を工種別・施工/保安別に表示できる（**給与手当は予実表の対象外**＝Y4/RY-10）。
- ...他 11 件

#### 2026-07-21-jikkou-yosan-ver02-additional-confirmation-email-draft.md

- L39: - [ ] 宛名・署名を浜田が追記
- L40: - [ ] 「昨日」が送信日と合わない場合は日付表現へ変更
- L41: - [ ] 既送メールへの返信形式か、新規メールかを選択
- L42: - [ ] P-21/P-22 は **浜田CONFIRMED（2026-07-21）で実装前提に採用済み**であることを認識（本メールは依頼者への念のための可否確認。「修正あり」回答時は§15.0で再協議）
- L43: - [ ] 「問題なし／修正あり」の明示回答を依頼しており、無回答を承認扱いしないことを確認
- L44: - [ ] 送信後、送信日時と回答待ちを正本 §20.4 に記録

#### 2026-07-21-jikkou-yosan-ver02-preimplementation-test-plan.md

- L211: - [ ] 本計画と物理フィールドカタログをAIチームが独立監査
- L212: - [ ] 正本との矛盾0件
- L213: - [ ] OPEN項目が初回対象外または依頼者確認対象として明示
- L214: - [ ] 実装範囲・非対象・7/23デモ範囲を浜田が確認
- L215: - [ ] P-35の初回リスク（意図的REST直実行の完全遮断は対象外）を本番移行前に再審査
- L216: - [ ] 浜田から明示的な実装GO

#### 2026-07-25-jikkou-requester-confirm-pack-pre-0727.md

- L47: - [ ] 追加しない（手入力のまま）
- L48: - [ ] 表記を変えて追加 → 正しい表記: _______________
- L59: - [ ] 明細用に別リストが必要 → 別リストの例: _______________
- L71: - [ ] 直したい → 内容: _______________
- L111: - [ ] （任意）`kg` を内訳候補に足すかの浜田一言確認

#### 2026-07-31-756-cost-mgmt-excel-table-structure-spec.md

- L155: - [ ] 材料費ブロック: 費目枠＋種別（塗料等）＋明細行が見える
- L156: - [ ] 工事管理者賃金: 出向→昼間／夜間が分かれる
- L157: - [ ] 建設機械オペレーター: 昼／夜および下位区分が分かれる
- L158: - [ ] 旅費交通費・交際費: コード表どおりの種別が出る／行挿入できる
- L159: - [ ] 月次灰色が合計で、明細だけ編集できる
- L160: - [ ] 原価累計・予算との差が自動で、手入力できない
- L161: - [ ] 備考が編集・保存できる
- L162: - [ ] 実行予算額が手入力できる（暫定）
- L163: - [ ] 既存工事のレガシー実績が壊れない（またはフォールバック表示）

#### 2026-08-09-rag-constitution-aide-trial-decision.md

- L21: - [ ] `npm run rag:aide-smoke` OK
- L22: - [ ] MCP 2 クエリ（曖昧＋Exact）の当たりメモ 1 行
- L23: - [ ] §5b 中間観測と矛盾がないか
- L24: - [ ] DeepSeek §50-3-8 1 問 → 突合 3 行

#### business-improvement-q36-go-request-draft.md

- L84: - [ ] **差戻し** — （修正指示を 1 行）

## 7. RAG 知識ベース更新

> ℹ️ **docs/ 全件 ingest**: Windows 既定でスキップ（WSL cron 06:00 がフル正本。手動フルは `MORNING_PREP_RAG_DOCS=1 npm run morning:ensure`）

> ℹ️ **Windows RAG ingest**: 既定は **ミラーのみ**（数秒）。DB 反映は WSL cron 06:00。午後に ingest する場合は `MORNING_PREP_RAG_INGEST=1 npm run morning:ensure`

> ℹ️ **constitution-aide**: 毎回 **sync-only**（`MORNING_PREP_RAG_AIDE=1` でフル）。月曜フル後は MCP で2クエリ目視。

### ✅ RAG ingest

```text
rag-mirror-canonical-docs: 既に一致（スキップ）
---
(Windows 既定: npx ingest スキップ。ミラーのみ。ingest は WSL cron 06:00 または MORNING_PREP_RAG_INGEST=1)
---
(Windows 既定: docs/ 全件 ingest はスキップ。WSL cron 06:00 または MORNING_PREP_RAG_DOCS=1)
---
[constitution-aide-trial] mirror docs/constitution/00-rule-hierarchy.md → .rag\extra-docs\constitution-aide-trial\00-rule-hierarchy.md
[constitution-aide-trial] mirror docs/constitution/05-knowledge-rag.md → .rag\extra-docs\constitution-aide-trial\05-knowledge-rag.md
[constitution-aide-trial] mirror docs/constitution/17-four-ai-mode-b.md → .rag\extra-docs\constitution-aide-trial\17-four-ai-mode-b.md
[constitution-aide-trial] mirror docs/constitution/18-ai-team-read-map.md → .rag\extra-docs\constitution-aide-trial\18-ai-team-read-map.md
[constitution-aide-trial] mirror docs/runbooks/evening-reflection-scope.md → .rag\extra-docs\constitution-aide-trial\evening-reflection-scope.md
[constitution-aide-trial] mirror docs/runbooks/requester-doc-review-one-at-a-time.md → .rag\extra-docs\constitution-aide-trial\requester-doc-review-one-at-a-time.md
```

---

# 🌅 §46 朝ルーチン Phase 2-4

> §46 により Phase 2-4 は SKYSEA 等のいかなるタスクよりも先に実行する。異常検出時はここで解消するまで他タスクへ進まない。

## 🩺 Phase 2: 健康状況チェック

**総合**: 正常 34 / 異常 0 / 警告 0 / スキップ 2
**健全性スコア**: 100%（判定対象 34 項目・スキップ 2 は別枠）

### MCP 疎通

| MCP | 結果 | 詳細 |
|---|---|---|
| github | ✅ | initialize 応答 OK |
| office-powerpoint | ✅ | initialize 応答 OK |
| office-word | ✅ | initialize 応答 OK |
| memory | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| sequential-thinking | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| kintone | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| kintone-dev | ✅ | initialize 応答 OK |
| kintone-space | ✅ | initialize 応答 OK |
| playwright | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| cve-search | ✅ | initialize 応答 OK |
| rag | ✅ | initialize 応答 OK |
| accessibility-scanner | ✅ | initialize 応答 OK |
| duckduckgo-search | ✅ | initialize 応答 OK |
| kimi | ✅ | initialize 応答 OK |
| deepseek | ✅ | initialize 応答 OK |
| openrouter | ✅ | initialize 応答 OK |
| markdownify | ✅ | initialize 応答 OK |
| chrome-devtools | ✅ | initialize 応答 OK |
| shadcn-ui | ✅ | initialize 応答 OK |
| figma | ⏭ | url-only MCP（stdio initialize 対象外・IDE 側で接続） |
| colors-fonts | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| repo-tree | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| eslint-mcp | ✅ | Windows STRICT: OK 6/6  SKIP=0  NG=0（cio-mcp-quickprobe 代替・IDE 外 CLI 偽陰性回避） |
| context7 | ⏭ | url-only MCP（stdio initialize 対象外・IDE 側で接続） |
| kintone-schema-mcp | ✅ | initialize 応答 OK |
| git-history-mcp | ✅ | initialize 応答 OK |

### システム

- Node（プローブ / Cursor または PATH）: `v24.14.1` (npm `11.11.0`) — ✅
  - which: `C:\Program Files\nodejs\node.exe`
- NVM v24 スタック（cron・MCP・朝 prep 正本）:
  - バイナリ存在: ✅ `v24.14.1`
  - 実行確認: ✅ `v24.14.1` (npm `11.12.1`)
  - WSL `nvm current`: ✅ `v24.14.1`
  - `.nvmrc` → bin: ✅ `/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin`
  - **NVM v24 整合**: ✅ 100%
- Disk (`~`): 236.8G used / 224G free on C: — ✅
  - npm cache: 2.1G / npx cache: 1.7G
- Memory: 11681/15894 MiB (73%) — ✅
- cron: ✅ morning:prep 登録済み

### 🛡 自己診断強化 (S9 + S12 wiring)

- **node_modules 完全性 (S9)**: ✅ node_modules 完全性 OK
- **MCP 死蔵検知 (S12)**: ✅ 監視対象 15/15 = 100% (11 exempt) (過去 7 日)
- **Git ahead/behind (S15)**: ✅ main = origin/main (完全同期)
- **憲法ファイル watcher (S16 / K-3)**: ✅ file-watcher.mjs 稼働中 (憲法 5 ファイル SHA256 監視)

### 🔎 rag MCP DB 内容チェック (TSB-012 再発防止)

- ✅ documentCount=277

## 🔧 Phase 3: 自動治療

**結果**: 修復 0/0 件 / ログローテ完了 / 失敗 0

| 操作 | 結果 |
|---|---|
| logs ローテ | ✅ `morning(2) health(1) heal(0)` |
| npm audit fix (patch only) | ✅ `npm audit fix --audit-level=moderate || true` |

## 📦 Phase 4: バージョンアップ対応

**検出**: patch 0 / minor 1 / major 0
**proposal 化**: 新規 0 / 重複スキップ 1

---

## 🛡 自動防衛網ログ（前日からの活動）

✅ **前日からの wipe 検知ゼロ**（防衛網は静かに稼働中）
---

## 8. kintone-apps.md 直近の更新履歴（末尾 5 行）

```text
| 2026-04-25 07:50 | **Day 3 / 採番マスタ 2 アプリ作成完了 (v2.1 仕様準拠)**: ① **新個人WindowsID採番マスタ (672)** = `^jbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` SINGLE_LINE_TEXT / `unique:true` / `required:true` / `minLength=maxLength=7` (jbm + 4 桁) / `status` DROP_DOWN [未使用/使用済/無効] default=未使用 / `note` MULTI_LINE_TEXT) / Space 21 / **5/13 旧 626 凍結後置換**。② **新共有WindowsID採番マスタ (673)** = `^sjbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` `minLength=maxLength=8` (sjbm + 4 桁) / status・note は App A と同構造) / Space 21 / **5/13 旧 667 凍結後置換**。**設計判断**: 既存移行 PC (5-6 桁) は採番マスタ経由せず新・PC台帳ver.1 に直接登録 + 緩いバリデーション (仕様書 §4.3.2) → 採番マスタは厳格 4 桁のみ受付 / `unique` + `minLength`/`maxLength` 一致で物理的二重発番防止。Day 3 は「器のみ」: payout 追跡フィールド (`assigned_to` / `assigned_at`) は Day 4 customize 設計時に追加検討。**MCP 工程**: kintone-add-app (each: revision 2) → kintone-add-form-fields (each: revision 3) → kintone-deploy-app → kintone-get-app-deploy-status (両方 SUCCESS) → kintone-get-form-fields で実フィールド突合 (3 カスタム + 標準 8 = 計 11 / 仕様完全一致)。**Day 4 以降の予定**: 採番ボタン UI 実装 (新・PC台帳ver.1 から呼出 / 最古「未使用」を pick → 「使用済」更新 + logon_name 引用) / 初期データ投入 (`jbm0001`〜 / `sjbm0001`〜) / 旧 626/667 凍結タイミング決定 (5/13 予定 / リネーム + 権限変更) |
| 2026-04-29 | **PC台帳 B-1 移行の時期・方法（正本）**: **個人・NAS・その他（B-1）**は **AI が整形式 CSV・マッピング主担当**（**4/28-29** は §9 表どおりの準備のみ・**前倒し禁止**・**§9.0**）。**本番 import は §9 の 4/30-5/2**（`docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§8.3**・**画面 CSV 一括**が既定）。下記 4/21 行「⑬」は当時要約—**B-2 は別行（同日）** |
| 2026-04-29 | **PC台帳 B-2（共有+JR）を本番後へ（浜田確定・文書初記録）**: **53 件は 5/13 本番運用開始以降**、旧 594／627 を確認しながら **1 件ずつ手登録**（一括 CSV 移行はしない）。**4/28-5/2 の大移行から B-2 を除外**。正本 `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§9**・**§13** 同日追記行。 |
| 2026-04-29 | **部署予実 2 アプリ作成（枠のみ・本番反映済み）**: **入力 677**・**ダッシュ 678**。Space **54** / thread **58**。`kintone-add-app` MCP は出力検証エラーのため **`POST /k/v1/preview/app.json`**（`name` + `space` + `thread`）→ **`POST /k/v1/preview/app/deploy.json`**（各 revision **2**）を手実行。フィールド・customize は未着手（`SPEC.md` §10.1）。 |
| 2026-04-21 21:40 | **新・PC台帳ver.1 仕様完全版確定 (Q&A 37 件 + α / 4 時間の徹底ヒアリング)**: 部署メンバー要望「PC 台帳とアカウント台帳が分かれてて使いづらい」を起点に、新規アプリ 3 個 (環境設定マスタ / M365管理マスタ / 新・PC台帳ver.1) を構築する全体仕様を浜田 × AI で徹底ヒアリング・確定。**設計方針**: 既存 594/627 は無傷のまま保険として残置 (1 か月後に廃止判断)・新規アプリ並行運用 → 5/11 月曜本番切替 + 旧アプリ書込ロック・段階移行で既存破壊ゼロ。**主要決定**: ① **アプリ名 = 新・PC台帳ver.1** (将来 ver.2 等にアップデート前提)、② **配置スペース = 21 (システム管理)** で既存全アプリと同居、③ **1 PC = 1 アカウント** の単純構造で「1 画面完結」、④ **共有アカウントは PC 単位重複登録** (1 共有 M365 を N PC で使う = N 行に重複)、⑤ **JR端末は OS ローカル + AD 不参加** で WindowsアカウントとM365アカウントのみ・他は不要、⑥ **M365 5 台ライセンス厳守** = M365管理マスタの usage_count + 自動払い出し/解放、⑦ **採番 = 新アプリ内自動採番** (種別別 MAX+1 / マスタなし)、⑧ **印刷レイアウト = 既存 627 からコピー** (個人用・共有用 2 種を種別で自動切替)、⑨ **検索 = カスタマイズ強化版** (検索バー + Enter 実行で部分検索 / PC名・所属・WindowsID・M365ID・利用者名対象)、⑩ **バリデーション** 個人=user_name 必須 / 共有・JR=shared_terminal_name 必須、⑪ **アクセス権限 = 浜田+担当者2名のみ** (既存と同じ運用継承)、⑫ **既存マスタ 626/667/595/656/657 は継続使用** (採番・社員引用・エラーログ・ダッシュボード集計対象切替)、⑬ **既存データ移行 = 浜田 CSV 作成 + 私レビュー** (`C:\\tmp\\new-pc-ledger\\` 経由)、⑭ **SKYSEA 計画は新アプリ移行完了後にリスケ** (5/15 再相談)、⑮ **PC買替 = 既存と同じ動作 + M365 引き継ぎ**、⑯ **5 台超過警告** = M365 マスタ枯渇 + 新規連番自動生成時に「Microsoft 管理画面で作成してください」alert 表示。**スケジュール**: 4/22(水) 19:00 着手 → 4/22-4/25 アプリ作成 + customize → 4/26 動作確認 → 4/27-4/28 浜田 CSV 準備 → **4/29-5/2 既存データ移行 (4 日間)** → 5/3-5/6 GW 連休 → 5/7-5/10 試運用 → **5/11(月) 本番運用開始** + 旧アプリ書込ロック + リネーム → 5/15(金) SKYSEA 再相談。**仕様書**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v1.0 (13 章・約 500 行・Q&A 確定一覧含む)。**今後の §47 改善**: 仕様詰め途中で「JR端末を共有から外す」「M365 マスタは新規」「サイボウズも新アプリで保持」など仕様が複数箇所変わった経緯あり → 仕様書 v0.1 段階での部分提示よりは **要件文書を一度全網羅で書き出してから AI に提示する** 方が議論ターン数を圧縮できる教訓を後で AGENTS.md 化検討 |
```

---

## 🚀 今日の推奨スタート手順

### ⚡ 時刻指定タスク（最優先）

- `2026-04-18-skysea-installer.md` L16: ## ⚡ 開始予定: 2026-04-19 07:00 JST
- `2026-04-18-skysea-installer.md` L18: > 朝 7 時から着手予定。`docs/reports/2026-04-19-morning-prep.md` の「⚡ 時刻指定タスク」セクションで本タスクが最優先表示される（#R3）。
- `2026-04-23-mcp-strategy-v1.md` L3: **起票**: 2026-04-23 (Thu) 02:35 JST
- `2026-04-26-pc-ledger-day4-action.md` L3: **作成**: 2026-04-26 (Sun) 09:00 JST
- `2026-04-26-Z3-reports-archive-design.md` L89: | **P1** | archive/ ディレクトリ作成 + .gitkeep + 設計書 (本ファイル) | 2026-04-26 09:21 JST | ✅ 完了 |
- `2026-04-26-Z3-reports-archive-design.md` L91: | **P3** | 2026-05-01 朝の初回 archive 自動実行 + 動作検証 + autonomy log 記録 | 2026-05-01 06:30 JST | ✅ 完了（手動 `--force` + archive commit `f67b112` + autonomy `60f5d46` 追記、`logs/autonomy-decisions/Z3-archive-2026-
- `2026-05-05-yojitsu-quick-guide-agenda.md` L3: - ⚡ **開始予定:** 2026-05-05（火）**8:00 JST から着手**。7:00〜8:00 は朝ブリーフィング・健康等のルーチン。それが終わり次第、本件に入る。
- `2026-05-16-ict-tech-digest-spec.md` L49: | **実行** | 1日2回 **10:00 / 20:00 JST**（GHA cron UTC 1:00 / 11:00） |
- `2026-05-16-ict-tech-digest-spec.md` L79: | **GHA** | `.github/workflows/ict-tech-digest-collect.yml`（`cron.yml` は作らない）10:00/20:00 JST・`workflow_dispatch` |
- `2026-05-16-ict-tech-digest-spec.md` L287: | 本日5件あるのに追加されない | 仕様どおりスキップ。翌日 10:00 まで待つか翌枠を待つ |

### 直近の計画ファイル（3 件）

- `docs\plans\2026-07-31-756-cost-mgmt-excel-table-structure-spec.md` （更新: 2026-07-31 13:19）
- `docs\plans\2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` （更新: 2026-07-31 13:18）
- `docs\plans\2026-07-21-jikkou-yosan-ver02-3app-field-catalog.md` （更新: 2026-07-30 08:28）

**AI への指示例**:
```
「2026-07-31-756-cost-mgmt-excel-table-structure-spec.md の続きを進めて」
```

---

## 🔍 ヘルススコア

**13 / 14 合格**

- ✅ apply-approved-changes
- ✅ kintone:test
- ✅ lint:customize
- ✅ npm audit
- ✅ audit-rules
- ✅ audit-tsb-confirmed
- ✅ verify-breaking-deletions
- ✅ audit-cross-references
- ❌ npm outdated
- ✅ scan-plans
- ✅ RAG ingest
- ✅ §46 Phase 2 health-check
- ✅ §46 Phase 3 auto-heal
- ✅ §46 Phase 4 version-up
