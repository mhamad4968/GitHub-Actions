━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cursor トラブル対応メモ / 2026-04-23 制定 (v2 / 全面リライト)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

困ったら上から順に試す。それでもダメなら AI に状況を伝える。

正本: kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md
控え: C:\Users\mhamada202408224\Desktop\AI緊急用\CURSOR-トラブル対応メモ.txt

v1 (2026-04-19) からの主な強化:
- 新トラブル類型 ⑨〜⑬ 追加 (TSB-013/014/015 + R8/R9 教訓由来)
- 自動防衛仕組みを 8 cron + file-watcher 21 ファイル監視に更新
- 連絡先メモに新規 TSB-013/014/015 + R8/R9 + 戦略書 v1 追加

v2.1 (2026-04-25) 並列セッション + K-3（憲法ファイルリアルタイム監視）:
- **疑い**: 自分が触ってないのに AGENTS.md / RULES-INDEX.md 等が変わった → `docs/troubleshooting.md` **TSB-017**、  
  `logs/file-watcher/agents-md-changes.jsonl` を確認。**作業即中止** → 浜田連絡（§51-3）
- **watcher 更新後は必ず再起動**:  
  `cd /home/mhamada202408224/kintone-ai-lab && npm run watcher:stop && npm run watcher:start`  
  （古い PID のままだと K-3 の SHA256 監視が効かない）
- **稼働確認**: `npm run watcher:status` または `npm run watcher:rules-status`
- **全体診断**: `npm run smoke`（7 項目）


━━━ ① まず現状確認（30 秒）━━━━━━━━━━━━━━━━━━━━━━━━

WSL ターミナルで:

  cd /home/mhamada202408224/kintone-ai-lab
  npm run guard:check

→ 全 21 ファイル ✅ 健在 + MCP 全件 ✅ なら問題なし
→ 何か ❌ や 0 byte があれば自動復元される

【さらに詳しく診断したい時】
  PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" node scripts/health-check.mjs
  → 全 16 MCP probe + Node 整合 + cron + disk + mem + rag DB チェック


━━━ ② 「Request blocked by Anthropic」+ Undo All が出た ━━━━

⚠ 一番危険なパターン (TSB-006 の真犯人)

【絶対やる】
  1. ❌ Undo All は押さない（被害が広がる可能性）
  2. ✅ Review で内容を確認（何を変更しようとしてたか）
  3. ✅ エラー画面のスクショを保存（Request ID が原因究明の決定打）
  4. ✅ npm run guard:check で被害確認
  5. ✅ file-watcher が動いてれば自動復元しやすい（`npm run watcher:status` で PID 確認）

【リクエストが多すぎたとき】
  → AI に「ファイル数を分けて 5 個ずつ実行して」と頼む（AGENTS.md §47-5 大量編集ガード）


━━━ ③ MCP が赤い（rag / accessibility-scanner 等）━━━━━━━━

  cd /home/mhamada202408224/kintone-ai-lab
  npm run guard:check
  PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" node scripts/health-check.mjs

→ MCP 全 16 件 ✅ になってるか確認

【それでも Cursor UI が赤い】
  Cursor を再起動（接続キャッシュが古い）

【再起動しても赤い】
  AI に「rag MCP が赤い、絶対パス確認して TSB-013 v2 教訓で」と頼む
  → §17-3 mcp.json command の絶対 path 標準化を確認

【cve-search だけ ❌ で他全部 ✅ の時】
  TSB-013 v2 真因 (cron 環境で uv が PATH not found) の可能性
  → AI に「health-check.mjs の env.PATH に ~/.local/bin 追加されてるか確認」と頼む
  → 既に対策済 (commit 21ef26a) なので通常は再発しないが、health-check.mjs 巻戻った場合は要確認


━━━ ④ ファイルが消えた / 0 byte 化 ━━━━━━━━━━━━━━━━━

  cd /home/mhamada202408224/kintone-ai-lab
  npm run restore:wiped

→ 自動で復元される（emergency-backup から）

【それでもダメ】
  git status で消えたファイルを確認
  git restore <ファイルパス>

【git からも消えてる】
  ~/.cursor-emergency-backup/ から手動コピー
  ls ~/.cursor-emergency-backup/

【最終手段】
  AI に「○○ファイルが消えた、復元して」と頼む


━━━ ⑤ 新しいチャットを開いた / 文脈が分からなくなった ━━━

C:\Users\mhamada202408224\Desktop\AI緊急用\NEW-SESSION-STARTER.txt を開いて
中身（フル版）を新チャットにコピペするだけ。

→ AI が文脈・関係性・優先順位・主タスク・新ルール（R1-R9）を全部復元する
→ v3 (2026-04-23) は 4/24 PC 台帳 Day 1 + R1-R9 全反映済


━━━ ⑥ Cursor が固まった / 動かない ━━━━━━━━━━━━━━━━

  1. 該当のチャットウィンドウを閉じる
  2. Cursor アプリを再起動（タスクトレイから完全終了 → 再起動）
  3. 新チャット起動 + NEW-SESSION-STARTER.txt を貼る


━━━ ⑦ AI が「忘れた？」みたいな反応をした ━━━━━━━━━━━

新チャットに以下をそのまま貼る:

  §42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と
  直近の chat-sessions/<日付>.md を即座に Read して、
  過去ログ確認の宣言を 1 行出してから本題に戻って。


━━━ ⑧ 何かおかしいけど何が起きてるか分からない ━━━━━━

AI にこう聞く:

  状況を整理して。何が起きてる？必要なら npm run guard:check と health-check.mjs も走らせて。

→ AI が状況を診断して報告してくれる

【もっと厳重に「100% 問題ないを証明」してほしい】
  AI に「100% 問題ない証明して、1 つでも NG なら再検証して」と頼む
  → §47-A 発動 / Phase W テンプレ (30 ステップ深掘り) を AI が autonomous で実施


━━━ ⑨ MCP 起動失敗 / cron で MCP probe ❌ になる（TSB-013 v2 / 2026-04-23）━━━

【症状】
  - logs/health/cron.log で特定 MCP (cve-search 等) が ❌ 応答なし
  - 手動で MCP 実行すると ✅ 動く（手動は OK / cron で ❌ の乖離）

【真因】
  - mcp.json の command が PATH 依存（"command": "uv" など）
  - cron PATH (/NVM/bin:/usr/bin:/bin) に ~/.local/bin が含まれず uv not found

【対応】
  - AI に「TSB-013 v2 同型 / mcp.json の絶対 path 化検討」と頼む
  - 既に health-check.mjs に PATH 拡張対策済 (commit 21ef26a) なので通常は出ない
  - 出た場合は §17-3 絶対 path 標準化を新規 MCP に適用してない可能性


━━━ ⑩ 朝 cron で lint:customize が ❌（TSB-007 ep5 / 2026-04-23）━━━

【症状】
  - 朝の morning-prep.md で lint:customize が ESLint 6.4.0 で失敗（v9 or v10 のはず）
  - node_modules/.bin/eslint が消えている

【真因（修復済）】
  - auto-heal.mjs の `npm audit fix --omit=dev` が devDependencies を 4h ごとに prune
  - npm v7+ 仕様で --omit=dev = production-only モード = devDeps 削除

【対応（既に修復済 / commit 99c8360）】
  - auto-heal.mjs から --omit=dev 削除済
  - 万一再発したら npm install で復元 + AI に「ep5 系列再発 / auto-heal の --omit=dev チェック」と頼む

【予防】
  - S9 check-node-modules.mjs (4/23 朝 cron 適用済) で node_modules 完全性 4h ごと監視


━━━ ⑪ 2 つ指示で AI が混乱・エラーで止まった（R9 §51-2 / 2026-04-23）━━━

【症状】
  - 1 メッセージで複数依頼 → AI が並行処理で混乱・エラー
  - 過去 (2026-04-23 22:14 浜田反省) の経験あり

【予防】
  - 1 メッセージに 1 指示だけ書く（§51-2 浜田向けルール）
  - もし複数書いてしまった場合、AI が「1 つ目完了しました。次の○○ 進めますか？」と確認するはず（§51-2 義務）

【AI が並行処理しちゃった場合】
  - 「§51-2 違反です。1 つずつやり直して」と即指摘


━━━ ⑫ Web 検索 MCP が結果を返さない（TSB-015 / 2026-04-23）━━━

【症状】
  - google-search MCP で検索しても結果が常に空 / CAPTCHA 出る

【真因（修復済）】
  - Google bot 検知で headless ブラウザを CAPTCHA ブロック
  - 構造的問題（MCP 設計起因）

【対応（既に修復済 / commit 942848e + 0fd7477）】
  - google-search → duckduckgo-search に入替済 (4/23 21:35)
  - mcp_user-duckduckgo-search_search で動作 (Bing ベース / API key 不要)

【もし duckduckgo も結果空になったら】
  - AI に「Web 検索代替検討 / brave-search / serpapi 等」と頼む
  - 戦略書 docs/plans/2026-04-23-cli-evolution-v1.md の P3 セクション参照


━━━ ⑬ playwright / accessibility-scanner / google-search 系で起動失敗（TSB-014 / 2026-04-23）━━━

【症状】
  - "Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome"
  - "libnspr4.so: cannot open shared object file"

【真因（修復済）】
  - Chromium 本体 + system libraries (libnspr4 / libnss3 等) 未インストール
  - sudo 必要

【対応（既に修復済 / 浜田 sudo 22:09-22:25）】
  - sudo $(which npx) playwright install-deps chromium  ← system deps 20 packages
  - npx playwright install chrome                       ← Google Chrome 147 install
  - 完了後 mcp_user-playwright_browser_tabs で動作確認

【もし system deps が消えたら】
  - sudo apt install -y libnspr4 libnss3 libasound2t64 fonts-liberation で復元


━━━ 自動で守ってくれてる仕組み（覚えなくて OK / 2026-04-24 時点 8 cron + S12 v2 / S13 v2）━━━

- file-watcher: 重要 21 ファイル監視・5 秒で自動復元 (PID 41917 / 5 日連続稼働)
- wipe-guard: 15 分ごとに健康チェック・自動復元
- emergency-mirror: 4 時間ごと (17 */4) ~/.cursor-emergency-backup/ にコピー
- watchdog: file-watcher が死んだら 5 分以内に再起動 (+ @reboot)
- daily-morning-prep: 06:00 cron で apply-approved-changes + ヘルスチェック + ブリーフィング生成
- health-check: 4 時間ごと (33 */4) MCP 全件 probe + rag DB チェック + node_modules + MCP 死蔵 (S13 v2 統合)
- auto-heal: 4 時間ごと (43 */4) npm audit fix patch only (--omit=dev 削除済)
- backup-mcp: 00:00 daily で mcp.json + 自作 MCP コードを backups/mcp/ に世代保存

→ ユーザーが何もしなくても多重防衛が効いてる
→ 異常検知 → 朝のブリーフィング (docs/reports/<日付>-morning-prep.md) で先頭に 🚨 表示
→ 4/24 から「🛡 自己診断強化 (S9 + S12 wiring)」セクションも表示 (S13 v2 効果 / 13/16 active 3 exempt 表示)


━━━ ⑭ proposal が apply-approved-changes で「old_string 不一致」エラー (2026-04-24 制定) ━━━

【症状】
朝のブリーフィング「📋 昨夜承認分の自動実施結果」で `❌ old_string 不一致` 表示。
proposal は processed/ に移動済 (apply-approved-changes は failed でも移動する設計)。

【真因】
proposal 制定後にコード本体が編集されて、proposal の old_string が部分一致しなくなった。
4/24 朝の S13 = 4/23 制定時 → 4/23 早朝 TSB-012 修復で集計セクション直前に rag deep
check コードが挿入された → S13 の old_string が分離 → apply で完全一致せず ❌。

【自己対応 (AI に頼む)】
「S13 (or 該当 ID) を手動 apply してほしい」と AI に依頼。AI が以下を実行:
  1. processed/<日付>/<ID>.proposal.json から new_string を取り出す
  2. 現状コードの該当位置を Read で特定 (proposal の周辺コードを grep)
  3. StrReplace で手動挿入
  4. §11-5 3 段階検証 (① syntax / ② 手動 script / ③ cron シミュレート)
  5. fix commit + 翌朝 cron で実証

【予防】
proposal 制定時に「old_string にコード位置に依存しない狭めの context を選ぶ」
(例: `// ───── 集計 ─────\nconst summary = {` のような長文 context は危険 / 短い ID 句を含めるか line 数で固定)


━━━ ⑮ MCP 死蔵検知が「Windows-side で false positive」(2026-04-24 制定 / S12 v2 適用済) ━━━

【症状】
check-mcp-dormancy.mjs / health-check が github + office-powerpoint を「死蔵」⚠ と判定。
でも Cursor IDE では普通に使えてる。

【真因】
S12 は WSL 側 usage log のみ計測。Windows-side MCP (Cursor IDE 経由のみ動く) は
WSL log に現れないため常に shortCount=0 → 自動的に dormant 誤判定。

【対応 (4/24 18:00 適用済 / 自分でやる必要なし)】
~/.cursor/mcp.json に以下を追加:
  "github": { ... , "_meta": { "dormancy_exempt": true, "exempt_reason": "..." } }
  "office-powerpoint": { ... , "_meta": { ... } }
  "tavily": { ... , "_meta": { ... } } (有料 disabled)
→ S12 v2 が exempt status として分類 / dormant にカウントせず ⚪ exempt 表示。
→ 朝のブリーフィングで「✅ 13/16 active (3 exempt)」と表示される。

【新 MCP 追加時の注意】
WSL から呼べない MCP (Windows-only / Cursor IDE 専用) を追加したら必ず _meta.dormancy_exempt: true を追加。
mcp.json 編集は R4 §17-2 厳守 (backup + ensure_ascii=True + diff 確認)。


━━━ 連絡先メモ（2026-04-23 時点）━━━━━━━━━━━━━━━━━

【失敗事例集 (TSB)】
- 詳細手順: kintone-ai-lab/docs/troubleshooting.md
  TSB-006 (Anthropic block + Undo All wipe)
  TSB-007 ep1〜5 (eslint 系列 / ep5 = auto-heal --omit=dev 自爆 / 修復済)
  TSB-009 (画像系 dangling reference)
  TSB-010 (FAQ ポータル v2 失敗)
  TSB-011 (並行 Cursor チャット騒動)
  TSB-012 (rag MCP broken / 修復済)
  TSB-013 v1+v2 (cron uv PATH / 修復済)
  TSB-014 (Chrome system deps / 浜田 sudo 完了)
  TSB-015 (google-search 死蔵 → duckduckgo 入替)
  S12 v2 (Windows-side MCP false positive / 4/24 解消 / 上記 ⑮)
  S13 v2 (health-check 半完成 → 出力反映完成 / 4/24 / 上記 ⑭)

【リカバリ運用】
- 新セッション起動: kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md (v3)
- 復元プロトコル: kintone-ai-lab/docs/agent-restore-checkpoint.md
- 現在地: kintone-ai-lab/chat-sessions/checkpoint-latest.md

【開発憲法】
- AGENTS.md (50+ ルール / §1-§51-2 + R1-R9)
- RULES-INDEX.md (§N 全件チェックリスト + MCP 活用 + 並列禁止)
- WORKFLOW.md (Phase 0-5)

【戦略書 (2026-04-23 制定)】
- MCP 強化戦略 v1.0: docs/plans/2026-04-23-mcp-strategy-v1.md
- CLI / 依存進化戦略 v1.1: docs/plans/2026-04-23-cli-evolution-v1.md
- MCP 状態管理: docs/mcp-status.md (16 MCP / 月次更新)

【新ルール (2026-04-23 制定 R1-R9)】
- R1 §51 並列処理禁止 / 1 タスク 1 操作原則 (第15章)
- R2 §11-5 修復系の段階的検証 3 段階
- R3 §50-2 死蔵 MCP 根絶ルール
- R4 §17-2 mcp.json 編集の最小差分手順
- R5 §17-3 mcp.json command の絶対 path 標準化
- R6 §47-A 「100% 証明」要求の 30 ステップ深掘り (Phase W テンプレ)
- R7 §47-B-2 段階的批判の容認 / 1 段階完璧主義禁止
- R8 §47-C 浜田認識不足判断の AI 否定権限
- R9 §51-2 浜田複数指示受領時の AI 1 つずつ確認


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
最終更新: 2026-04-24 v2.1 (⑭ proposal old_string 不一致 + ⑮ MCP 死蔵 false positive 追加 / S12 v2 + S13 v2 効果反映)
このメモは C:\Users\mhamada202408224\Desktop\AI緊急用\CURSOR-トラブル対応メモ.txt
正本: kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
