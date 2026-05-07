# NEW-SESSION-STARTER 分割 5/6 — proofs-and-incidents

> 正本ハブ: `chat-sessions/NEW-SESSION-STARTER.md`（貼付用・短縮版）
> 親ファイル: v3.35 まで monolithic → **v3.36** より分割（2026-05-07 CIO）

---


§42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と
直近の chat-sessions/<日付>.md を即座に Read して、
過去ログ確認の宣言を 1 行出してから本題に戻って。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 「100% 問題ない証明して」を浜田から受けたとき（§47-A 発動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§47-A 発動。Phase W テンプレ = 30 ステップ深掘り検証を 1 つずつ実施:
- コード基盤 5 (git fsck / package-lock + node_modules / process / PATH / logs)
- cron + log 監査 7 (morning-prep / wipe-guard / mirror / health-check / auto-heal / watcher / backup)
- MCP 全件実 call 7 以上 (Tier 4 dormant も含む)
- データ整合 6 (RAG / memory / 過去 24h logs / 自爆系 grep / .env / cache)
- ルール / Git 5 (cross-ref / chat-sessions / git push 待ち / §50 自己監査 / proposal dry-run)
NG 1 件発見 → 修復 → 該当ステップ + 周辺再検証ループ。
詳細: AGENTS.md §47-A 全文。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ファイル wipe が起きたら（TSB-006 対策）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /home/mhamada202408224/kintone-ai-lab
npm run guard:check         ← 現状確認 + 自動復元
npm run restore:wiped       ← 手動復元 (人間向けレポート)
npm run watcher:status      ← file-watcher 動作確認

→ 詳細は CURSOR-トラブル対応メモ.txt + docs/troubleshooting.md TSB-006

