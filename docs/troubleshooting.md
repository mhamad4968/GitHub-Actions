# TSB（Troubleshooting Bulletin）— 失敗事例と教訓集

> **目的**: 同じ失敗を二度と繰り返さないため、踏んだ落とし穴・原因・対策・教訓を **TSB-XXX 形式** で蓄積する。
> **連動**: AGENTS.md §21（知見のフィードバック）/ WORKFLOW.md Phase 5（記録）/ RULES-INDEX.md（随時メモ索引）。
> **更新ルール**: 障害・不具合を解決したら必ず追記。**既存 TSB は削除しない**（追記のみ）。RAG ingest で検索可能にする。

---

## 目次

| TSB ID | 日付 | テーマ | 影響範囲 |
|---|---|---|---|
| TSB-001 | 履歴上参照あり | fileKey 問題（詳細未記載・docs/asset-management-logic.md より参照）| 594 |
| TSB-004 | 履歴上参照あり | 文字化け修復ロジック（AGENTS.md §14 より参照）| 全般 |
| TSB-005 | 2026-04-19 | **セッション間継続性の構造的脆弱性** | 全プロジェクト |

> **注**: TSB-002, TSB-003 はファイル不在時の記載漏れ。発見次第追記。

---

## TSB-005 — セッション間継続性の構造的脆弱性（2026-04-19 制定）

### 事象

2026-04-19 朝、SKYSEA × kintone 594 突合作業中にチャットがポリシーブロックで途絶。新セッション開始後、AI は今朝の経緯を完全に喪失した状態で再起動。残骸の CSV ファイル 4 本から作業を推測するしかない状態に陥った。

さらに、復元アンカーであるはずの `chat-sessions/checkpoint-latest.md` が **2026-04-10 で 10 日間更新停止**しており、セッション復元プロトコル自体が機能していなかった。

### 根本原因

| # | 原因 | 詳細 |
|---|---|---|
| 1 | **セッション締めの儀式が AI と人間の意思に依存** | `CLAUDE.md` 「『忘れた』防止」節は「席を離れる前に一言だけ」運用。突発的な中断（ポリシーブロック・タイムアウト）に対応できない構造 |
| 2 | **チャット履歴の自動永続化なし** | Cursor / Claude はチャット全文を自動保存しない。`chat-sessions/<日付>.md` は人間または AI が手動で書く前提 |
| 3 | **checkpoint-latest.md の鮮度監視なし** | 10 日間放置されても朝ブリーフィングが警告しなかった |
| 4 | **agent-transcripts へのアクセスが不安定** | 複数のプロジェクト ID 配下に分散しており、新セッションから過去の自分の transcripts を見つけにくい |
| 5 | **RAG が `chat-sessions/` を ingest 対象外** | 過去会話を意味検索できない |

### 対策（Phase A 緊急止血 — 2026-04-19 実施）

1. `chat-sessions/2026-04-19.md` を作成し、本日の経緯と決定事項を全記録
2. `chat-sessions/checkpoint-latest.md` を 2026-04-19 現在地で更新（旧版は `chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md` に退避）
3. `kintone-apps.md` 末尾履歴に 1 行追記
4. `.rag/extra-docs/persist-policies.md` を正本同期（旧版は `.rag/extra-docs/_archive/` に退避）
5. 本ファイル `docs/troubleshooting.md` を新規作成

### 構造的予防（Phase B — 別セッションで提案予定）

| # | 提案 | 効果 |
|---|---|---|
| B-1 | `scripts/session-snapshot.mjs` 新規 | 任意タイミングでチャット要点を `chat-sessions/<日付>.md` に追記 |
| B-2 | `scripts/daily-morning-prep.mjs` に「checkpoint 7日以上古い時 🚨」ロジック | 放置を朝に必ず気付ける |
| B-3 | `chat-sessions/` を RAG ingest 対象に追加 | 過去会話を意味検索可能に（API トークン等の grep 除外を併設） |
| B-4 | 夕反省サイクル（§44）に「checkpoint 更新提案」を必須項目化 | 締め忘れの最終防衛線 |

### 憲法化（Phase C — 別セッションで提案予定）

- `AGENTS.md` §40（欠番埋め）または §50 として **「セッション継続性義務」** を新設
- §46（朝ルーチン）/ §47-§49（思考の三本柱）/ §45（タスク完遂）と並ぶ最上位原則として定着

### 教訓（Lessons Learned）

1. **「気をつける」では絶対に解決しない**。儀式の遵守が AI と人間の意思に依存している時点で、構造的脆弱性。
2. **復元アンカーの鮮度を機械的に監視する仕組み**が必要。10 日間気付かなかったのは朝ブリーフィングの責務範囲外だった。
3. **「気づいていたが言わなかった」は §49 違反**。今後は同種の脆弱性を発見したら即指摘する。
4. **2 階層索引（ホーム RULES-INDEX + リポ RULES-INDEX）**の存在を見落とすと §0「ルール索引参照義務」自体を踏まない結果になる。新セッションでは両方を確認する。
5. **派生コピー（`.rag/extra-docs/`）は正本と乖離しうる**。RAG ingest 前に同期チェックする運用が必要。

---

## TSB-006 — scripts/ 9 ファイル + WORKFLOW.md + AGENTS.md §42-§49 wipe（2026-04-19 09:02 同時刻）

### 事象

2026-04-19 09:02:00 ちょうどに、リポ内の以下が**全部 0 byte / 古い版に巻き戻った**。

| パス | 被害 | 行数（被害前 → 被害後）|
|---|---|---|
| `scripts/auto-heal.mjs` | 0 byte | ? → 0 |
| `scripts/health-check.mjs` | 0 byte | ? → 0 |
| `scripts/version-up.mjs` | 0 byte | ? → 0 |
| `scripts/apply-approved-changes.mjs` | 0 byte | ? → 0 |
| `scripts/daily-morning-prep.mjs` | 0 byte | ? → 0（バックアップから復元）|
| `scripts/evening-reflect.mjs` | 0 byte | ? → 0（バックアップから復元）|
| `scripts/audit-rules.mjs` | 0 byte | ? → 0 |
| `scripts/scan-plans.mjs` | 0 byte | ? → 0 |
| `scripts/skysea-recon.mjs` | 0 byte | 334 → 0（context から復元）|
| `scripts/install-morning-cron.sh` | 0 byte | ? → 0 |
| `scripts/debug-skysea-fields.mjs` | 0 byte | ? → 0 |
| `WORKFLOW.md` | 0 byte | 261 → 0（context から復元）|
| `AGENTS.md` | 古い版に巻き戻し | 669 → 444（v17 → v10 / §42-§49 全消失） |
| `docs/approved-changes/README.md` | 0 byte | ? → 0 |

### 根本原因（**特定済み・2026-04-19 浜田スクショ提供**）

**Cursor の "Request blocked by Anthropic" 時の編集ロールバック挙動**。

#### 確定した事実

- 浜田が当日のエラー画面スクショを 2 枚提供:
  - Request ID `a969dba9-3c47-4416-8b01-eb9a37b6f0e7`
  - Request ID `b62293ee-c6e5-4538-8ec0-22da096910c3`
- どちらも **"25 Files | Undo All | Review"** ボタン付きで「Request blocked by Anthropic」表示
- 浜田の発言: 「今の指示がポリシーに触れてしまったようです。言葉を少し柔らかくします」（リトライ時）
- 当日のファイル wipe 数（11 scripts + WORKFLOW.md + AGENTS.md §42-§49 の partial + approved-changes/README.md = ~14）と画面上の "25 Files" は**同一バッチ編集を指す**（残り 11 はおそらく軽微な編集や読み取りのみ）

#### 発生メカニズム

```
1. AI（前セッション）が 1 ターンで 25 ファイルの一括編集を実行しようとした
   ↓
2. プロンプト内容が Anthropic Usage Policy に抵触し、API 側でブロック
   ↓
3. Cursor は中断時の状態を扱えず、編集適用が中途半端で停止
   または "Undo All" 動作で 25 ファイルが不整合状態に
   （ファイル truncate 済み + 内容書込前で停止 = 0 byte 化）
   ↓
4. 浜田が「言葉を柔らかくします」でリトライしたが、damage は既に発生
   ↓
5. ファイルの mtime 09:02 = ロールバック / 中断完了時刻

これで「タイムスタンプ秒一致」+「複数ファイル同時 wipe」+「mtime 09:02 sharp」
が完全に説明つく。
```

#### 容疑から外れたもの

- ❌ OneDrive 同期 — サインインしてないから同期エンジン未起動（2026-04-19 確認）
- ❌ Cursor crash recovery — タイミングがセッション起動と一致するように見えたが、実際は edit blocking
- ❌ WSL fs cache 不具合 — 同上
- ❌ 拡張機能の初期化処理 — 同上

### 対策（実施済み・2026-04-19）

#### A. 即時止血
- 私（AI）の context から復元: `WORKFLOW.md` (261 行) / `AGENTS.md §42-§49` / `skysea-recon.mjs` (334 行)
- バックアップから復元: `daily-morning-prep.mjs` (11984 byte 06:32 版) / `evening-reflect.mjs` (9193 byte 06:32 版)
- 履歴仕様から再実装: `auto-heal.mjs` / `health-check.mjs` / `version-up.mjs` / `apply-approved-changes.mjs` / `audit-rules.mjs` / `scan-plans.mjs` / `install-morning-cron.sh` / `debug-skysea-fields.mjs`

#### B. リアルタイム監視
- `scripts/file-watcher.mjs` 新規 — Node の `fs.watch`（inotify ベース）で 23 重要ファイルを常時監視
- 0 byte 化検出時に 5 秒待って `~/.cursor-emergency-backup/` から自動復元
- WSL 起動時に自動起動（`@reboot scripts/watcher-watchdog.sh`）+ 5 分ごと watchdog で死活監視

#### C. 定期ヘルスチェック
- `scripts/wipe-guard.mjs` 新規 — 15 分ごと cron で実行
- 重要ファイルが空 / 欠落していたら `~/.cursor-emergency-backup/` または最新 `backups/<日付>/` から自動復元
- 全結果を `logs/wipe-guard/<日付>.log` に記録

#### D. 多層バックアップ
- `~/.cursor-emergency-backup/`（リポ外・別パス）に 30 ファイルをミラー（`scripts/emergency-mirror.mjs`）
- 4 時間ごと cron で自動更新（`17 */4 * * *`）
- 既存 `backups/<YYYY-MM-DD-HHMMSS>/`（`backup-workspace.js`）も継続
- git の untracked → staged 化（次の commit で永続保護）

#### E. 復元コマンド
- `npm run restore:wiped` — 手動復元（人間向け markdown レポート）
- `npm run restore:wiped:dry` — ドライラン
- `npm run guard:check` — wipe-guard 単発実行
- `npm run guard:mirror` — emergency-mirror 単発実行

### 教訓（追加）

6. **タイムスタンプ秒一致 = 同一プロセス**。複数ファイルが秒単位で同時刻 wipe されたら、必ず同一プロセス（cron / 同期 / Cursor 内部）の仕業。原因究明は「次にこれが起きた瞬間を捕まえる」継続監視が最強。
7. **ファイル編集中の中間状態 = 一瞬 0 byte**。エディタ保存は「truncate → 内容書き込み」の 2 ステップ。検知ロジックには **5 秒待ち**を入れて誤判定を防ぐ。
8. **「自動復元」と「自動上書き」は違う**。emergency-mirror は **src が 0 byte なら mirror しない** 安全装置を持つ（0 byte で上書きすると emergency-backup も死ぬ）。auto-heal も wipe 検知時は復元せず人間判断を要求（自分で誤判断して上書きしない）。
9. **AI のセッション context もバックアップ**。新セッションが始まる前に重要ファイルを Read しておくと、wipe された時に Write で復元できる。逆に「忙しいから読まずに進む」は危険。
10. **AI の 1 ターン編集は 10 ファイル以下が目安**（特にポリシー境界に触れそうな話題）。Anthropic Usage Policy ブロック時に Cursor の edit-application が中途半端に止まると、ターゲットファイル群が 0 byte 化する。バッチ編集を分割すれば爆発半径が小さくなる。
11. **"Request blocked by Anthropic" + "Undo All | Review" が出たら、Undo All を押す前に Review で内容確認**。即 `npm run guard:check` で被害確認（file-watcher が動いてれば既に自動復元しているはず）。
12. **エラー画面のスクショは命綱**。今回 浜田のスクショ（Request ID 付き）が真犯人特定の決定打になった。次回も同様のエラーが出たら **必ずスクショを撮って共有**。Request ID が分かれば Anthropic に問い合わせも可能。

### 関連ルール

- `AGENTS.md §42`（セッション冒頭の過去ログ確認義務）
- `AGENTS.md §47-§49`（思考の三本柱）
- `chat-sessions/2026-04-19.md`（本件の詳細経緯）
- `chat-sessions/NEW-SESSION-STARTER.md`（新セッション起動の儀式）
- `scripts/file-watcher.mjs` `scripts/wipe-guard.mjs` `scripts/emergency-mirror.mjs` `scripts/restore-wiped.mjs` `scripts/watcher-watchdog.sh`

---

## TSB-007 — ESLint 6 vs flat config (eslint.config.js) 不整合（2026-04-19 検出）

### 事象

`npm run lint:customize` 実行時に「ESLint couldn't find a configuration file」エラー。

```
ESLint: 6.4.0.
ESLint couldn't find a configuration file.
```

### 根本原因

- リポジトリには `eslint.config.js` (ESLint 8+ の flat config 形式) が存在
- しかし node_modules に入っている ESLint は **6.4.0**（古い）→ flat config 非対応
- ESLint 6 は `.eslintrc.*` 形式を期待

### 対策

`package.json` で ESLint 8 以降に upgrade が必要。

```bash
npm install --save-dev eslint@latest
# または
npm install --save-dev eslint@8
```

ただし本番 CI や customize/ コードへの影響を確認してから実施することを推奨。

### 影響

- `npm run lint:customize` が失敗（朝ブリーフィングで ❌ 表示）
- 本番動作には影響なし（lint は静的解析のみ）

### 関連

- `docs/dependency-upgrade-backlog.md` に記録予定（依存パッケージ更新案件として）

---

## TSB テンプレート（新規追加時にコピー）

```markdown
## TSB-NNN — タイトル（YYYY-MM-DD 制定）

### 事象
<何が起きたか / どこで気付いたか>

### 根本原因
| # | 原因 | 詳細 |
|---|---|---|
| 1 | ... | ... |

### 対策（実施済み）
1. ...
2. ...

### 予防（提案 / 別タスク）
| # | 提案 | 効果 |
|---|---|---|
| 1 | ... | ... |

### 教訓（Lessons Learned）
1. ...
2. ...

### 関連ルール
- ...
```

---

## メンテナンス

- 新規 TSB を追加したら **`RULES-INDEX.md` の随時メモ**に「日付 + TSB-NNN + 1行要約」を追記
- 月次で **RAG 再 ingest**: `npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/`
- **既存 TSB は削除しない**。古くなった内容は「**廃止**: 2026-XX-XX」と先頭にマークするのみ

---

## TSB-010 — 投稿後 URL.revokeObjectURL の dangling reference 問題（2026-04-22 制定）

### 症状
投稿成功 + 画面リロード後に、表示された画像をクリックして Lightbox を開こうとすると `ERR_FILE_NOT_FOUND` エラーが発生し画像が表示されない。

### 真因
投稿成功後に `self.reload().then(() => { Object.keys(_blobUrlMap).forEach(k => URL.revokeObjectURL(_blobUrlMap[k])); _blobUrlMap = {}; })` のような revoke 処理を実行していたが、reload で再描画された `<img src="blob:...">` がまだ DOM に残っているうちに blob URL が解放されてしまい、その後のクリック（`openImageLightbox(this.src, ...)`）で **解放済み blob URL を参照する dangling reference** エラーが発生する。

### 検出方法
ブラウザ DevTools の Console に以下が出る:
```
9cfa2534-35a7-42ec-a0cb-bf3f940f5287:1
GET blob:http://server:port/9cfa2534-... net::ERR_FILE_NOT_FOUND
openImageLightbox @ (index):397
(anonymous) @ (index):477
```
UUID が src にそのまま出ている = blob URL のリソース ID 部分が解放されている証拠。

### 修正
投稿後の `URL.revokeObjectURL` 一括実行を **廃止**。blob URL はページ閉じた時にブラウザが自動 GC で解放するため、メモリリークは 1 セッション内のみで実害なし。`_blobUrlMap` / `_blobNameMap` も持ち越しで OK（次の D&D で個別 set される / clear すると closure が古いキーを引けなくなる副作用もあった）。修正コミット: `e7b0a89`。

### 教訓（改善案 #3 §11-3 修正前 30 秒影響分析と連動）
4/21 Lightbox 修正時に `_blobUrlMap` を grep して revoke 箇所のライフサイクルを確認していれば発見できた。修正対象だけ見て影響範囲を追わない近視眼が原因。次回からは §11-3 に従って修正前 30 秒影響分析を実施する。

### 関連
- TSB-009: Chrome 92+ で window.open(blob:URL, '_blank') ブロック（2026-04-21 制定 / 同じ FAQ ポータルの問題）
- AGENTS.md §11-2 信頼度ラベル / §11-3 修正前 30 秒影響分析（2026-04-22 制定 / 改善案 #2 + #3）

---

## TSB-009 — Chrome 92+ で window.open(blob:URL, '_blank') がブロックされる（2026-04-21 制定）

### 症状
- HTML フォーム内で `<input type=file>` や drop でアップロードした画像 (blob: URL 化) を `window.open(blob:..., '_blank')` で別タブ表示しようとすると **`Not allowed to load local resource: blob:http://...`** エラー + ERR_FILE_NOT_FOUND。
- ドロップ・貼り付け自体は成功するが「クリックで拡大」だけが失敗する見え方。

### 発生事例（2026-04-21 19:00 / FAQ ポータル）
- `scripts/faq-portal-full.html` の 4 箇所で `window.open(this.src, '_blank')` を使用。Chrome 92+ で blob: URL の新規タブ表示はセキュリティ制限でブロック。

### 根本原因
**Chrome 92+ のセキュリティ制限**: blob: URL を新規タブで開く操作 (window.open / target=_blank) はブロックされる。CSP / Cross-Origin 関連でなく、純粋な URL スキーム制限。

### 解決パターン 3 択
1. ⭐ **同一ページ内 Lightbox 表示**: 黒オーバーレイ + 拡大画像で表示。blob: でも http: でも安全に動作。今回採用。
2. **dataURL 化**: 画像を Base64 dataURL に変換してから別タブ表示。大きい画像でメモリ消費。
3. **正規 URL 発行**: 画像を即サーバへアップロード → 戻ってきた URL を表示。実装重い・通信増える。

### 修正コード例（FAQ ポータル）
```javascript
// 修正前 (NG)
img.addEventListener('click', function () {
  if (this.src) window.open(this.src, '_blank');  // ← Chrome 92+ でブロック
});

// 修正後 (OK)
img.addEventListener('click', function () {
  openImageLightbox(this.src, this.alt);  // ← Lightbox で同一ページ内表示
});
```

### 教訓
- 動的に生成された blob URL を **新規タブで開く** 設計は将来も使えない
- **「拡大表示」は同一ページ内の Lightbox / モーダル方式** が将来安全
- セキュリティ制限は OS / ブラウザ更新で増える方向 → 「将来制限される可能性」を先回り設計するのが §49 の精神

---

## TSB-007 続編 — eslint v10 新規 recommended ルールの後始末（2026-04-21 追記）

### 状況
2026-04-21 に `npm install --save-dev eslint@latest` で v6.4.0 → v10.2.1 にアップグレード成功。TSB-007 の lint:customize 7 日連続失敗は解消。ただし v10 で recommended に入った 2 ルールが既存コードに 5 件ヒットしたため一時的に off にしている。

### 一時 off 中のルールと該当箇所
| ルール | 該当箇所 |
|---|---|
| `no-useless-assignment` | customize/594/desktop.js 1716 (pool) / 3484 (recs594) / 3485 (recs627) / customize/627/desktop.js 2625 (recs627) |
| `no-irregular-whitespace` | customize/594/desktop.js 2714 |

### TODO (後日対応)
- 5 箇所の実コードを修正（ロジック影響ゼロの代入除去 + 全角空白を半角に）
- eslint.config.js から off 行を削除して on に戻す
- 想定工数 15 分・優先度 中

---

## TSB-007 episode 3 — node_modules/eslint 消失で lint:customize 再失敗（2026-04-22 22:00 検出）

### 症状
4/22 夕方の健康診断で `npm run lint:customize` がまた失敗。原因特定に手間取った末、真因は `node_modules/eslint/` 自体の消失と判明。

### 真因（複数仮説の合成）
| # | 仮説 | 確度 |
|---|---|---|
| 1 | 9c6481c (4/22 18:23) で eslint v10 → v9.39.4 ダウングレード時、Cursor シェル node v20.18.2 が v9 の engine 要件を満たさず `npm install --save-dev eslint@latest` が **silent fail**。`package.json` だけ更新され `node_modules/eslint/` は不整合 or 撤去 | **本命（直接原因）** |
| 2 | `scripts/health-check.mjs` の `self_check` が `scripts/*.mjs` と `AGENTS.md` のみ検査し **`node_modules/` 完全性を検査しない設計穴** → 朝の cron で異常検知できず | **本命（検知盲点）** |
| 3 | Cursor 環境 / `npm prune` / 強制 GC | 低（直接証拠なし） |

### 修正（実施済み / 4/22 夜）
1. `npm ci`（or `npm install`）で再インストール → `node_modules/eslint v9.39.4` 復活確認
2. `npm run lint:customize` 通過確認

### 予防（提案 / 朝 cron で 4/23 自動適用予定）
| ID | 内容 | 効果 |
|---|---|---|
| R15 | AGENTS.md §46 Phase 2 表に `check-node-modules.mjs` 追加 | ルール明文化 |
| R16 | AGENTS.md §46 Phase 3 自動可リストに「依存欠損検知時の `npm ci` 再実行」追加 | auto-heal 拡張 |
| S9 | `scripts/check-node-modules.mjs` 新規（package.json deps と node_modules/<pkg>/package.json バージョン一致 + critical bins 存在検証 / `--json` 対応） | 検知の自動化 |

### 教訓（Lessons Learned / §11-3 修正前 30 秒影響分析と連動）
1. **パッケージ操作 = post-install 必須儀式化**: `npm install <pkg>` 後は必ず `node_modules/<pkg>/package.json` の `version` を確認する（5 秒で済む）
2. **engine 要件不一致時の silent fail**: npm は engine 要件 NG でも warning だけ出して成功風 exit する場合がある。**install 後の version 確認は 100% 必須**
3. **健康診断は「自分自身」も診ろ**: `health-check.mjs` の self_check が node_modules を見ていなかった = 診断ツールの盲点を診断する習慣（メタ診断）が不足

### 関連
- TSB-007（2026-04-19 制定 / 元祖）/ TSB-007 続編（2026-04-21）
- AGENTS.md §11-3 修正前 30 秒影響分析（改善案 #3 / 4/22 制定）
- proposal: docs/approved-changes/2026-04-23/{R15,R16,S9}-*.proposal.json

---

## TSB-011 — 並行 Cursor チャット騒動（2026-04-22 21:48 検出 / 改善案 #12 + #13）

### 症状
浜田が無自覚で Cursor の別窓に同じ「実装手順（22:00 締め目標）」テンプレを貼ったため、2 本の Cursor チャット（transcript `59936008` + `832a7a75`）が同じリポを並行で触る状況が発生。一方のチャット（私 / メイン）が proposal R12-R16 + S9 を作成 commit した直後、もう一方のチャット（並行）が浜田の「壊れてないか確認」要求に反応して **R13 proposal の半角→全角 () バグを発見・自律 fix（commit `68d1765`）**。

### 真因
1. **Cursor の UI に「同一リポを触っている他チャット数」表示がない** = 並行発生に気付く手段がない
2. 浜田が「儀式 v2」テンプレ + 「実装手順」テンプレを意図せず両方の窓に貼った（同じテンプレを 2 回コピーした記憶ミス）
3. 私（メイン側）も「単独で動いている前提」で並行存在を疑わなかった

### 検出方法（事後）
```bash
# 過去 24h の Cursor agent transcript を列挙
find ~/.cursor/projects -name "*.jsonl" -newermt "$(date -d '24 hours ago' '+%Y-%m-%d %H:%M:%S')"

# 同期間の git commit (Made-with: Cursor) を列挙
git log --since='24 hours ago' --grep='Made-with: Cursor' --format='%h|%ai|%s'

# transcript 数 ≥ 2 + commit 数 ≥ 2 なら並行可能性大
```

検知の自動化は `scripts/check-parallel-chats.mjs`（改善案 #12 / S11 / 4/23 朝 cron で配置予定）が担う。

### 影響（2026-04-22 のケースは結果的に良性）
- 並行チャットの fix `68d1765` は **正しい修正** で、私の R13 半角→全角 () バグを 4/23 朝 cron 失敗確定の状態から救済
- merge conflict は発生せず（diff が独立したファイル / 順次直列化）
- ただし悪性化シナリオ（同じファイルを別方向に編集 / 矛盾する報告 / トークン 2 倍消費）のリスクは残る

### 対策（実施済み）
1. 浜田が並行チャットを **手動で閉鎖**（21:51 浜田判断）
2. `chat-sessions/2026-04-22.md` に並行チャット騒動の経緯を記録
3. `scripts/check-parallel-chats.mjs` を 4/23 朝 cron 配置（S11 proposal）

### 予防（提案 / 朝 cron で 4/23 自動適用予定）
| ID | 内容 | 効果 |
|---|---|---|
| S11 | `scripts/check-parallel-chats.mjs` 新規（過去 24h transcript 数 + Cursor commit 数を比較し ⚠ 表示）| 翌朝に並行発生を検知 |
| TSB-011 | 本記事 | 検知方法 + 対策の知識化 |

### 教訓（Lessons Learned）
1. **「1 リポ 1 チャット」原則を明文化**: 明示的に役割分担している場合（例: AI A = customize / AI B = scripts）以外は並行禁止
2. **並行発生時の良性条件**: ① 編集ファイルが独立 ② commit 順序が直列化される ③ 双方が良質な批判精神（§47）を持つ。今夜は 3 条件すべて満たして救済された奇跡
3. **検知の自動化が唯一の継続的対策**: 浜田・AI 双方の「気付き」に頼ると今夜と同じ「21:48 まで誰も気付かない」が再発する

### 関連
- AGENTS.md §44 夕反省サイクル（改善案 #11 と連動 / proposal 事前検証儀式）
- AGENTS.md §47-B ルール疲労ガード（改善案 #17 / 並行チャットが救った R13 の元バグの再発防止）
- proposal: `docs/approved-changes/2026-04-23/S11-check-parallel-chats.proposal.json`
- 詳細経緯: `chat-sessions/2026-04-22.md` 「夜のセッション 3」
