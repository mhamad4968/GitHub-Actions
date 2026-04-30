# 🌅 朝のブリーフィング — 2026-04-25 (Sat) 10:12

> 本ファイルは `scripts/daily-morning-prep.mjs` が毎朝 06:00（WSL cron）に自動生成しています。
> AI エージェントは WORKFLOW.md §Phase 0 に従い、最初にこのファイルを読みます。

---

## 📋 昨夜承認分の自動実施結果

_(承認済み案件なし)_

---

## 0b. §55 セーフモード・前日自律ログ

- §55: `safe-mode.json` なし（未発動または初回）

### 🤖 自律判断ログ（2026-04-24 / autonomy scan）

- **件数**: 20 行
- **emergency:true**: 1 件
- **§55 / safe_mode 関連（推定）**: 1 件
- **notes / 旧 second_opinion に skipped 系（推定）**: 8 件

---

## 1. 環境ヘルス（kintone API 疎通）

### ✅ npm run kintone:test

```text
[ok] app 594: PC管理台帳ver.2
[ok] app 595: 社員情報マスタ
[ok] app 626: アカウント採番アプリ
[ok] app 627: アカウント管理台帳
[kintone:test] PC台帳スタック疎通 OK
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
_すべて最新_
```

## 5. ルール整合性（AGENTS.md ↔ RULES-INDEX.md / WORKFLOW.md）

### ルール整合性チェック

- AGENTS.md 定義: §1 / §2 / §3 / §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §12 / §13 / §14 / §15 / §16 / §17 / §18 / §19 / §20 / §21 / §22 / §23 / §24 / §25 / §26 / §27 / §28 / §29 / §30 / §31 / §32 / §33 / §34 / §35 / §36 / §37 / §38 / §39 / §41 / §42 / §43 / §44 / §45 / §46 / §47 / §48 / §49 / §50 / §51 / §52 / §54 / §55 / §56
- RULES-INDEX.md: 54 個の §N 参照
- WORKFLOW.md: 18 個の §N 参照

✅ 破断リンクなし（参照されている §N はすべて AGENTS.md に存在）

## 5-2. TSB confirmed フラグ整合性（F-2 5月目標 #2 監視）

### TSB confirmed flag audit (F-2 5月目標 #2 監視)

- ファイル: `docs/troubleshooting.md`
- 目次行数: 17
- 本文セクション数 (## TSB-): 16
- root_cause_confirmed = true: 16 件 (**94%**)
- root_cause_confirmed = false: 1 件

✅ 5 月目標 #2 (カバレッジ 100% / 実質 = 孤児を除く 100%) を達成中 (94%)
- false 件名: TSB-001

ℹ️ 目次に 2 件あるが本文に該当セクションなし (履歴参照は info)
  - TSB-001
  - TSB-004

## 5-3. post-BREAKING 削除 復活検知（TSB-016 #20 = ゾンビ復活ガード）

### post-BREAKING 削除 復活検知 (TSB-016 #20 / I-1)

- 対象ファイル: `AGENTS.md`
- 走査範囲: 直近 50 commit (実走査 50 件)
- [BREAKING] commit 検出: 2 件

✅ pass: 現在の HEAD に「ゾンビ復活した削除済章/節」は存在せず

## 6. 未完了プラン抽出（docs/plans/*.md）

### 未完了タスク（docs/plans/）

> **44 件の未完了項目を 3 ファイルから検出**

#### 2026-04-18-skysea-installer.md

- L105: - [ ] PowerShell スクリプト雛形（突合 → 起動確認 → リモートインストール → 結果CSV） → **2026-04-25/26 持ち越し**
- L106: - [ ] kintone 594 にフィールド追加案： → **2026-04-25/26 持ち越し**
- L110: - [ ] 「📌 SKYSEA未導入」トグルを 594 検索パネルに追加する設計案（既存トグル群と同じ枠で） → **2026-04-25/26 持ち越し**

#### 2026-04-21-new-pc-ledger-spec.md

- L482: - [ ] 他アプリからの 627/594/626/667 ルックアップ参照を grep で洗い出し
- L483: - [ ] 595/656/657 等が 627/594/626/667 を参照してないか確認
- L484: - [ ] kintone API で 627/594/626/667 を叩くスクリプト全件特定
- L485: - [ ] 削除直前に CSV 全件エクスポート → リポジトリ保存
- L486: - [ ] 削除直前の最後の JSON Snapshot 取得 (`data/snapshots/{627,594,626,667}-final-<date>.json`)
- L520: - [ ] 627 スキャン（個人 259 件に紐付くアカウント実態 / status / 重複紐付け確認）
- L521: - [ ] 廃棄 1 件の種別特定 → B-1/B-2 除外確定
- L522: - [ ] CSV マッピング表（594 + 627 + 595 → 新・PC台帳ver.1 の各フィールド）
- L523: - [ ] CSV 整形ロジック実装（PW 自動算出 / バリデーション 2 系統対応 / etc）
- L524: - [ ] CSV 出力 → 浜田レビュー → 浜田 import → 検証（件数一致 + 抜け漏れゼロ）
- ...他 26 件

#### 2026-04-25-pc-ledger-day3-action.md

- L59: - [ ] `logs/autonomy-decisions.log` に Tier 判断が残る（該当操作があれば）
- L105: - [ ] 新・PC台帳ver.1（Day 4 で作成予定）から 672/673 を呼ぶ採番ボタン UI 実装
- L106: - [ ] 初期データ投入: jbm0001〜jbmXXXX / sjbm0001〜sjbmXXXX（必要数を浜田と決定）
- L107: - [ ] 旧 626（1993 件）/ 旧 667（40 件）の凍結タイミング決定（5/13 月曜本番切替日）
- L108: - [ ] 旧 626/667 のリネーム + 権限変更（書込ロック）

## 7. RAG 知識ベース更新

### ✅ RAG ingest

```text
[13/14] /home/mhamada202408224/kintone-ai-lab/.rag/extra-docs/preflight-checklist.md ... OK (13 chunks)
Parsed MD: /home/mhamada202408224/kintone-ai-lab/.rag/extra-docs/windows-cross-platform.md (1132 characters)
VectorStore: Deleted chunks for file "/home/mhamada202408224/kintone-ai-lab/.rag/extra-docs/windows-cross-platform.md"
VectorStore: Inserted 9 chunks
[14/14] /home/mhamada202408224/kintone-ai-lab/.rag/extra-docs/windows-cross-platform.md ... OK (9 chunks)

--- Ingest Summary ---
Succeeded: 14
Failed:    0
Total chunks: 1231
[98/99] /home/mhamada202408224/kintone-ai-lab/docs/security-news-app-troubleshoot.md ... OK (10 chunks)
Parsed MD: /home/mhamada202408224/kintone-ai-lab/docs/troubleshooting.md (41638 characters)
```

---

# 🌅 §46 朝ルーチン Phase 2-4

> §46 により Phase 2-4 は SKYSEA 等のいかなるタスクよりも先に実行する。異常検出時はここで解消するまで他タスクへ進まない。

## 🩺 Phase 2: 健康状況チェック

**総合**: 正常 21 / 異常 0 / 警告 0 / スキップ 3

### MCP 疎通

| MCP | 結果 | 詳細 |
|---|---|---|
| github | ⏭ | Windows-side / WSL から疎通不可 |
| cyber-news | ✅ | initialize 応答 OK |
| office-powerpoint | ⏭ | Windows-side / WSL から疎通不可 |
| filesystem | ✅ | initialize 応答 OK |
| memory | ✅ | initialize 応答 OK |
| fetch | ✅ | initialize 応答 OK |
| sequential-thinking | ✅ | initialize 応答 OK |
| kintone | ✅ | initialize 応答 OK |
| kintone-dev | ✅ | initialize 応答 OK |
| kintone-space | ✅ | initialize 応答 OK |
| tavily | ⏭ | disabled:true |
| playwright | ✅ | initialize 応答 OK |
| cve-search | ✅ | initialize 応答 OK |
| rag | ✅ | initialize 応答 OK |
| accessibility-scanner | ✅ | initialize 応答 OK |
| duckduckgo-search | ✅ | initialize 応答 OK |

### システム

- Node: `v24.14.1` (npm `11.12.1`) — ✅
  - which: `/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin/node`
  - NVM v24 present: ✅
- Disk (`~`): 2% 942G available on / — ✅
  - npm cache: 3.9G / npx cache: 2.0G
- Memory: 2947/7694 MiB (38%) — ✅
- cron: ✅ morning:prep 登録済み

### 🛡 自己診断強化 (S9 + S12 wiring)

- **node_modules 完全性 (S9)**: ✅ node_modules 完全性 OK
- **MCP 死蔵検知 (S12)**: ✅ 13/16 active (3 exempt) (過去 7 日)

### 🔎 rag MCP DB 内容チェック (TSB-012 再発防止)

- ✅ documentCount=120

## 🔧 Phase 3: 自動治療

**結果**: 修復 0/0 件 / ログローテ完了 / 失敗 0

| 操作 | 結果 |
|---|---|
| logs ローテ | ✅ `morning(0) health(0) heal(0)` |
| npm audit fix (patch only) | ✅ `npm audit fix --audit-level=moderate || true` |

## 📦 Phase 4: バージョンアップ対応

**検出**: patch 0 / minor 0 / major 0
**proposal 化**: 新規 0 / 重複スキップ 0

_Phase 3 の patch 対応のみで完結。新規 proposal なし。_

---

## 🛡 自動防衛網ログ（前日からの活動）

### file-watcher wipe-incidents.log（直近 10 行）

```text
{"time":"2026-04-24T12:58:16.038Z","file":"AGENTS.md","old_size":160253,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T12:58:18.476Z","file":"RULES-INDEX.md","old_size":12095,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T20:40:57.537Z","file":"RULES-INDEX.md","old_size":12298,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T20:41:11.065Z","file":"chat-sessions/checkpoint-latest.md","old_size":25279,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T20:43:28.134Z","file":"chat-sessions/checkpoint-latest.md","old_size":25223,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T20:43:29.586Z","file":"RULES-INDEX.md","old_size":9568,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T20:43:36.281Z","file":"chat-sessions/checkpoint-latest.md","old_size":25286,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-24T23:50:21.218Z","file":"docs/troubleshooting.md","old_size":60131,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-25T00:09:58.961Z","file":"docs/troubleshooting.md","old_size":60395,"new_size":0,"parent_pid":41914,"self_pid":41917}
{"time":"2026-04-25T01:12:05.168Z","file":"scripts/daily-morning-prep.mjs","old_size":17239,"new_size":0,"parent_pid":41914,"self_pid":41917}
```

---

## 8. kintone-apps.md 直近の更新履歴（末尾 5 行）

```text
| 2026-04-20 22:00 | **ops-guide v7 表示バグ修正 + M365ライセンス管理基盤構築 (途中で rollback)**: ① **shell 上端 86px が永久に kintone ヘッダー直下に隠れていた表示バグ** (4/19 以前から潜在) を修正。`customize/ops-guide/desktop.js` の `injectShell` に `adjustShellOffset()` を追加し、shell の `getBoundingClientRect().top` を実測 → kintone ヘッダー高さより上にあれば `marginTop` で物理的に押し下げる (50ms / 300ms / 1000ms の 3 タイミング)。これで「📌 主要メニュー」「📊 データ品質ダッシュボード」が確実に viewport 内に表示されるようになり、4/19 v5 化以降ずっと「ガイドから消えた」と言われていた WindowsID 重複ダッシュ等のリンクが復活。② **M365管理台帳ビュー (627 view=13459663)** に WindowsID (logon_name) を追加。③ M365 5台制限管理用に CALC `pc_link_count = SUM(pc_link_count_unit)` 方式で実装したが、**浜田指摘の §47** で 627 が `pc_594_record_id` (単一値) + `pc_ledger_links` (サブ) の **二重管理データ** であることが発覚。SUM(サブ) では主 PC が重複カウントされ、個人アカウントは 0 表示になる致命欠陥のため即時 rollback (commit `5cfce45`)。スキーマは残置・**正しい再設計 (#K2) は 4/21 夜間に実施**。デプロイ履歴: 627 revision 141-144 (途中 rollback) / 668 revision 32-36 |
| 2026-04-21 00:00 | **夜間自動実装 (4/20 夕反省 11 件全承認分・全部完遂)**: 浜田 22:30 の「全部承認 / 19:00 までに修正と報告」要請を受けて夜間自律実装。**実装完了 5 件**: ① **#K3 orphan 23 サブ行クリーンアップ** (`pc_ledger_link_594_id` が空 or "0" のサブ行を 23 レコード × 1 行 = 23 件削除 / snapshot `data/snapshots/627-2026-04-20T22-37-pre-K3.json` 取得済 / 100% 成功)。② **#K1 594 に SKYSEA 関連フィールド 4 つ追加** (DROPDOWN `skysea_status` [未確認/インストール済/未インストール/インストール対象外] / DATETIME `skysea_checked_at` / MULTI_LINE_TEXT `skysea_install_log` / CHECK_BOX `skysea_target_flag` [配信対象] / 594 rev=491)。③ **#K2 PC台数カウントを NUMBER+JS 方式で再構築** (4/20 22:00 CALC SUM 方式の rollback 後の正しい実装)。627 NUMBER フィールド `pc_link_count_n` (0-99台 単位「台」) 新設 + `customize/627/desktop.js` の `app.record.{create,edit}.submit` に `calcPcLinkCount` 関数追加 (PC_name のカンマ区切り正確分割で台数算出 / 二重管理問題回避) + 296 件バックフィル (snapshot `627-2026-04-20T22-40-pre-K2-backfill.json` / 100% 成功)。**最終分布: 1台=281件 / 2台=12件 / 3台=1件 / 4台=1件 / 7台=1件**。**確定 5 台超過は 1 件のみ → 「東京管理者」(共有・$id=810・**正しくは 7 台**・前回 8 は重複カウント)** が入替対象。④ **#C4 627 詳細画面で 5 台超過赤バナー** 実装。`pc_link_count_n >= 5` なら画面ヘッダーに「⚠ M365 Office 5 台インストール制限超過 / このアカウントには N 台の PC が紐付いています / 別 M365 アカウントを準備して入替必要」を赤グラデで表示。⑤ **ビュー復活 + 新設**: M365管理台帳 (id=13459663) に `pc_link_count_n` 列を `account_type` 後に追加 / **「⚠ Office5台超過アカウント」 (id=13459688) 新設** (filterCond=`pc_link_count_n >= 5`, NUMBER フィールドなのでフィルタ可) / 「📧 PC台数順 (M365 管理用)」 (id=13459689) 新設。⑥ ops-guide 黒帯に「⚠ Office5台超過アカウント」リンク追加 (668 rev=37)。**proposal JSON 5 件キュー化** (4/21 朝 06:00 cron で自動適用): #R6 (データ集計実装前の目視確認義務) / #R7 (曖昧訴え A/B/C/D 要望特定) / #TSB-008 (kintone CALC SUM 仕様の罠) / #D5a/D5b (evening-reflect の git log を 12h ウィンドウに変更)。**見送り 2 件**: #C5 (SKYSEA 状態フィルタ → SKYSEA データバックフィル後の Phase 2) / #S6 (lint:customize 修復 → 副作用懸念で浜田立ち会い手動)。**詳細レポート: `docs/reports/2026-04-21-overnight-implementations.md`**。デプロイ: 627 rev=149 / 594 rev=491 / 668 rev=37 |
| 2026-04-21 19:00 | **FAQポータル画像クリック拡大バグ修正 (Lightbox 化)**: 部署メンバーから「画像をドロップで貼り付けるとエラー」報告 → 状況確認したところ「貼り付け自体は成功するが、貼られた画像をクリックして拡大表示しようとすると `ERR_FILE_NOT_FOUND` + console に `Not allowed to load local resource: blob:http://...`」と判明。**根本原因**: `scripts/faq-portal-full.html` の 4 箇所で `window.open(this.src, '_blank')` で blob URL を新規タブ表示しようとしていたが、**Chrome 92+ のセキュリティ制限**で blob: URL の新タブ表示はブロックされる仕様。**修正**: 共通関数 `openImageLightbox(src, alt)` を新設 (黒オーバーレイ + 拡大画像 + Esc 閉じ + ⬇ ダウンロードボタン)。同一ページ内表示なので blob: でも http: でも安全に動作。4 箇所を全て置換。**安全配慮**: ① 浜田から「前回文字化け修正で大変だった」注意あり → エンコーディング (UTF-8 BOM なし) / 改行コード (LF) / 日本語コメント を確認、元ファイル (88319 byte) と修正版 (91507 byte=+3188 byte = 関数 67 行追加で妥当) を diff 取得して 75 行差分が意図通りであることを浜田と一緒に確認、② サーバ反映は **元 HTML を `.backup-2026-04-21-1900` にリネーム → 修正版上書き** の即ロールバック可能手順を提示。**動作確認**: 浜田がサーバ反映 → 「画像クリックで画像表示された」確認済。リポにも `scripts/faq-portal-full.html` として正本コピーを保存 (今後 Windows 側と同期管理)。今夜の §49 学び: 「`window.open(blob:...)` は Chrome 92+ でブロックされる → blob 表示は同一ページ Lightbox / dataURL 化 / 正規 URL のいずれかを使う」を恒常知識化 (TSB-009 候補) |
| 2026-04-25 07:50 | **Day 3 / 採番マスタ 2 アプリ作成完了 (v2.1 仕様準拠)**: ① **新個人WindowsID採番マスタ (672)** = `^jbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` SINGLE_LINE_TEXT / `unique:true` / `required:true` / `minLength=maxLength=7` (jbm + 4 桁) / `status` DROP_DOWN [未使用/使用済/無効] default=未使用 / `note` MULTI_LINE_TEXT) / Space 21 / **5/13 旧 626 凍結後置換**。② **新共有WindowsID採番マスタ (673)** = `^sjbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` `minLength=maxLength=8` (sjbm + 4 桁) / status・note は App A と同構造) / Space 21 / **5/13 旧 667 凍結後置換**。**設計判断**: 既存移行 PC (5-6 桁) は採番マスタ経由せず新・PC台帳ver.1 に直接登録 + 緩いバリデーション (仕様書 §4.3.2) → 採番マスタは厳格 4 桁のみ受付 / `unique` + `minLength`/`maxLength` 一致で物理的二重発番防止。Day 3 は「器のみ」: payout 追跡フィールド (`assigned_to` / `assigned_at`) は Day 4 customize 設計時に追加検討。**MCP 工程**: kintone-add-app (each: revision 2) → kintone-add-form-fields (each: revision 3) → kintone-deploy-app → kintone-get-app-deploy-status (両方 SUCCESS) → kintone-get-form-fields で実フィールド突合 (3 カスタム + 標準 8 = 計 11 / 仕様完全一致)。**Day 4 以降の予定**: 採番ボタン UI 実装 (新・PC台帳ver.1 から呼出 / 最古「未使用」を pick → 「使用済」更新 + logon_name 引用) / 初期データ投入 (`jbm0001`〜 / `sjbm0001`〜) / 旧 626/667 凍結タイミング決定 (5/13 予定 / リネーム + 権限変更) |
| 2026-04-21 21:40 | **新・PC台帳ver.1 仕様完全版確定 (Q&A 37 件 + α / 4 時間の徹底ヒアリング)**: 部署メンバー要望「PC 台帳とアカウント台帳が分かれてて使いづらい」を起点に、新規アプリ 3 個 (環境設定マスタ / M365管理マスタ / 新・PC台帳ver.1) を構築する全体仕様を浜田 × AI で徹底ヒアリング・確定。**設計方針**: 既存 594/627 は無傷のまま保険として残置 (1 か月後に廃止判断)・新規アプリ並行運用 → 5/11 月曜本番切替 + 旧アプリ書込ロック・段階移行で既存破壊ゼロ。**主要決定**: ① **アプリ名 = 新・PC台帳ver.1** (将来 ver.2 等にアップデート前提)、② **配置スペース = 21 (システム管理)** で既存全アプリと同居、③ **1 PC = 1 アカウント** の単純構造で「1 画面完結」、④ **共有アカウントは PC 単位重複登録** (1 共有 M365 を N PC で使う = N 行に重複)、⑤ **JR端末は OS ローカル + AD 不参加** で WindowsアカウントとM365アカウントのみ・他は不要、⑥ **M365 5 台ライセンス厳守** = M365管理マスタの usage_count + 自動払い出し/解放、⑦ **採番 = 新アプリ内自動採番** (種別別 MAX+1 / マスタなし)、⑧ **印刷レイアウト = 既存 627 からコピー** (個人用・共有用 2 種を種別で自動切替)、⑨ **検索 = カスタマイズ強化版** (検索バー + Enter 実行で部分検索 / PC名・所属・WindowsID・M365ID・利用者名対象)、⑩ **バリデーション** 個人=user_name 必須 / 共有・JR=shared_terminal_name 必須、⑪ **アクセス権限 = 浜田+担当者2名のみ** (既存と同じ運用継承)、⑫ **既存マスタ 626/667/595/656/657 は継続使用** (採番・社員引用・エラーログ・ダッシュボード集計対象切替)、⑬ **既存データ移行 = 浜田 CSV 作成 + 私レビュー** (`C:\\tmp\\new-pc-ledger\\` 経由)、⑭ **SKYSEA 計画は新アプリ移行完了後にリスケ** (5/15 再相談)、⑮ **PC買替 = 既存と同じ動作 + M365 引き継ぎ**、⑯ **5 台超過警告** = M365 マスタ枯渇 + 新規連番自動生成時に「Microsoft 管理画面で作成してください」alert 表示。**スケジュール**: 4/22(水) 19:00 着手 → 4/22-4/25 アプリ作成 + customize → 4/26 動作確認 → 4/27-4/28 浜田 CSV 準備 → **4/29-5/2 既存データ移行 (4 日間)** → 5/3-5/6 GW 連休 → 5/7-5/10 試運用 → **5/11(月) 本番運用開始** + 旧アプリ書込ロック + リネーム → 5/15(金) SKYSEA 再相談。**仕様書**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v1.0 (13 章・約 500 行・Q&A 確定一覧含む)。**今後の §47 改善**: 仕様詰め途中で「JR端末を共有から外す」「M365 マスタは新規」「サイボウズも新アプリで保持」など仕様が複数箇所変わった経緯あり → 仕様書 v0.1 段階での部分提示よりは **要件文書を一度全網羅で書き出してから AI に提示する** 方が議論ターン数を圧縮できる教訓を後で AGENTS.md 化検討 |
```

---

## 🚀 今日の推奨スタート手順

### ⚡ 時刻指定タスク（最優先）

- `2026-04-18-skysea-installer.md` L16: ## ⚡ 開始予定: 2026-04-19 07:00 JST
- `2026-04-18-skysea-installer.md` L18: > 朝 7 時から着手予定。`docs/reports/2026-04-19-morning-prep.md` の「⚡ 時刻指定タスク」セクションで本タスクが最優先表示される（#R3）。
- `2026-04-23-mcp-strategy-v1.md` L3: **起票**: 2026-04-23 (Thu) 02:35 JST
- `INDEX.md` L3: **最終更新**: 2026-04-25 (Sat) 09:25 JST / E-3 で初版 / H-3 で v2 設計書追加

### 直近の計画ファイル（3 件）

- `docs/plans/INDEX.md` （更新: 2026-04-25 00:25）
- `docs/plans/2026-04-25-pc-ledger-day3-action.md` （更新: 2026-04-24 22:51）
- `docs/plans/2026-04-25-raci-transparency.md` （更新: 2026-04-24 12:57）

**AI への指示例**:
```
「INDEX.md の続きを進めて」
```

---

## 🔍 ヘルススコア

**12 / 12 合格**

- ✅ apply-approved-changes
- ✅ kintone:test
- ✅ lint:customize
- ✅ npm audit
- ✅ audit-rules
- ✅ audit-tsb-confirmed
- ✅ verify-breaking-deletions
- ✅ scan-plans
- ✅ RAG ingest
- ✅ §46 Phase 2 health-check
- ✅ §46 Phase 3 auto-heal
- ✅ §46 Phase 4 version-up
