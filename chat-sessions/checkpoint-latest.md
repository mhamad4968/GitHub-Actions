# 復元チェックポイント（最新）

<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- 旧版（2026-04-10 654 予算ポータル）は chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md に退避済み -->

**最終更新**: 2026-04-19 09:55 (Sun) — Phase A 完遂 + TSB-006 リカバリ体制完全構築

---

## 現在のゴール（1〜3 行）

- **継続性体制の再構築**: ポリシーブロックや突発的中断でセッションが切れても、`chat-sessions/<日付>.md` ＋ 本ファイル ＋ `docs/reports/<日付>-morning-prep.md` だけで完全復元可能な状態を恒常維持する。
- **SKYSEA 突合**: 朝の 4 CSV は `data/skysea/` に保管済み。orphan 32 件の仕分けと管理画面削除は **来週土日（2026-04-25/26）** に持ち越し（ユーザー判断）。
- **次回再開ファイル**: `@chat-sessions/2026-04-19.md` ＋ 本ファイル ＋ `@RULES-INDEX.md`。

## 着手中のコンテキスト

- **App / トピック**: PC台帳スタック（594/595/626/627）+ SKYSEA × kintone 突合 + ルール体系継続性
- **ヘルススコア（朝 06:55 時点）**: 🟢 緑 10/10 合格
- **触ったファイル（本日午前）**:
  - `data/skysea/installed-pcs-2026-04-19.csv`（158 行・SKYSEA 元データ）
  - `data/skysea/already-installed-2026-04-19.csv`（122 行・両方あり）
  - `data/skysea/needs-install-2026-04-19.csv`（136 行・要インストール）
  - `data/skysea/orphan-in-skysea-2026-04-19.csv`（32 行・SKYSEA のみ＝削除候補）
- **ライセンス**: 保有 241 / 使用中 158 / 残 83 → 要 136 で **不足 53**（追加発注 2 週間）

## 未完了

### 今日完了済み（Phase A 緊急止血 + 補強）
- [x] 本 checkpoint-latest.md の更新（旧版 = 2026-04-10 654 予算ポータル をアーカイブ）
- [x] `chat-sessions/2026-04-19.md` 新規作成（本日経緯の全記録）
- [x] `docs/plans/2026-04-18-skysea-installer.md` の進捗追記（既存削除なし）
- [x] `kintone-apps.md` 末尾履歴に追記（追記のみ・既存履歴は一切触らず）
- [x] `kintone-apps.md` の **6 行喪失復元**（C-4 印刷 / 関連ナビ / 668撤去 / WORKFLOW制定 / 夕反省 / §45）を `.rag/` から正本側へ追記復元
- [x] `.rag/extra-docs/persist-policies.md` を正本同期（旧版アーカイブ済み）
- [x] `docs/troubleshooting.md` 新規作成（TSB-005「セッション継続性」記載）
- [x] **呼称ルール（友人として / さん付け不要 / タメ口 OK）** を `~/.cursor/rules/persist-policies.mdc` の「対話の前提」節に正本追加 + `.rag/` コピー同期 + `chat-sessions/2026-04-19.md` に追記
- [x] **`chat-sessions/NEW-SESSION-STARTER.md`** 新規作成（新チャット起動の儀式テンプレ）
- [x] **`/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt`** 新規作成（Windows メモ帳から開ける貼り付け用）

### 来週土日（2026-04-25/26）持ち越し（SKYSEA 本筋）
- [ ] `scripts/skysea-recon.mjs` 再実行（最新版で 8 列出力）→ orphan CSV 更新
- [ ] orphan 32+ 件を 4 カテゴリ仕分け（個人 PC / 共有 / 管理用 / **🚫サーバ・NAS**）
- [ ] ユーザー（浜田）と削除可否を 1 件ずつ確認（**サーバ・NAS は削除厳禁**）
- [ ] plan §4 ヒアリング 10 項目で自動インストール方針決定（候補 A〜E）
- [ ] PowerShell 雛形・kintone 594 フィールド追加・「📌 SKYSEA 未導入」トグル UI 設計

### TSB-006 リカバリ体制（2026-04-19 完成）

- [x] `scripts/file-watcher.mjs` 新規（fs.watch ベース・常駐型・5 秒待ち wipe 検知）
- [x] `scripts/wipe-guard.mjs` 新規（15 分ごと cron・空ファイル検知 + 自動復元）
- [x] `scripts/emergency-mirror.mjs` 新規（`~/.cursor-emergency-backup/` にミラー・src=0 byte は拒否）
- [x] `scripts/restore-wiped.mjs` 新規（手動復元コマンド・人間向けレポート）
- [x] `scripts/watcher-watchdog.sh` 新規（5 分ごと + @reboot で file-watcher 死活監視）
- [x] cron 4 件登録（wipe-guard / emergency-mirror / watchdog / @reboot）
- [x] file-watcher 起動確認（PID 41917）
- [x] npm scripts 追加（guard:check / guard:mirror / restore:wiped / watcher:start/stop/status）
- [x] TSB-006 を `docs/troubleshooting.md` に詳細記録
- [x] `NEW-SESSION-STARTER.md` + Windows メモ帳版に wipe 対応コマンド追加

### 構造的予防（Phase B / 別セッションで提案予定）
- [ ] `scripts/daily-morning-prep.mjs` に「checkpoint 7日以上古い時に🚨」ロジック追加
- [ ] `chat-sessions/` を RAG ingest 対象に追加
- [ ] 夕反省サイクル（§44）に「checkpoint 更新提案」を必須項目化

### 憲法化（Phase C / 別セッションで提案予定）
- [ ] AGENTS.md §40（欠番埋め）または §50 として「セッション継続性義務」を制定

## 次セッションで最初にやること

**最短ルート**: `chat-sessions/NEW-SESSION-STARTER.md`（または Windows: `C:\Claudeとの会話メモ\NEW-SESSION-STARTER.txt`）の「貼り付け用テンプレート」をそのまま新チャットに貼る。

手動で進める場合の手順:

1. **`@chat-sessions/2026-04-19.md`** を読む（今日の経緯・課題・関係性合意・次の一手まで全記録）
2. **`@chat-sessions/checkpoint-latest.md`**（本ファイル）で現在地確認
3. **`docs/reports/<当日>-morning-prep.md`** で §46 朝ルーチン状態確認（緑じゃなければ §46 が先）
4. **呼称ルール確認**: 濱田にはさん付けせず、友人としてタメ口 OK（`~/.cursor/rules/persist-policies.mdc` 2026-04-19 合意）
5. SKYSEA 続きなら → 来週土日タスクの最上位「`skysea-recon.mjs` 再実行」から
6. それ以外の新規依頼なら → §42 過去ログ確認 → WORKFLOW.md Phase 0 から

## ブロッカー・要確認

- なし（朝ルーチン緑・全アプリ疎通 OK・ライセンス追加発注は浜田判断待ち）

## 参考（任意）

- **本日の詳細ログ**: `chat-sessions/2026-04-19.md`
- **2026-04-10 アーカイブ**: `chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md`
- **朝ブリーフィング**: `docs/reports/2026-04-19-morning-prep.md`（10/10 緑）
- **SKYSEA plan**: `docs/plans/2026-04-18-skysea-installer.md`
- **SKYSEA 突合スクリプト**: `scripts/skysea-recon.mjs`
- **関係性契約の正本**: `~/.cursor/rules/persist-policies.mdc`
- **思考の三本柱**: `AGENTS.md` 第13章 §47-§49

---

## セッション締めチェック（忘れ防止・コピペ可）

セッションを閉じる前に、**該当だけ**チェック（エージェントも人間も）。

- [ ] **恒久**: 次回も効く決定を **`RULES-INDEX.md` 1 行** または **正本**（`kintone-apps.md` / `docs/*`）に残した
- [ ] **現在地**: **このファイル**のゴール・未完了・**次に最初にやること**を、チャットと矛盾なく更新した
- [ ] **詳細**: 長い経緯は **`chat-sessions/2026-04-19.md`** に残した
- [ ] （任意）**`npm run backup`** で退避したいときは実行する

※ 手順の正本: **`docs/agent-restore-checkpoint.md`**「『忘れた』を防ぐ」
