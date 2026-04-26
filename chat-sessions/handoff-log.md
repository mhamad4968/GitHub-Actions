# 引き継ぎログ（短縮）

浜田さんは `chat-sessions/HANDOFF-HUMAN.txt` を5行だけ埋めてチャットに貼る。  
AI は、セッション切替・終了・浜田さんがそのテンプレを貼ったタイミングで **必ずこのファイルの末尾に新しいブロックを追記**する（追記のみ。過去ブロックは消さない）。

---

### 2026-04-26 19:25 JST

**浜田メモ（原文 / 本セッション内訓示）**:
> その辺はさっきもいいましたがあなたの役割です  
> 役割の理解はできていますか？  
> そこらへんの理解も含めてすべて引継ぎ時にしっかり理解してほしい。憲法やルール等が多々きめております

**経緯（簡潔 / §37）**:
- 新・PC 台帳 v1 §4.4 仕様揃え（共有用 自動生成ボタンを `共有 OR JR端末` で表示）→ `customize/new-pc-ledger-v1/desktop.js` 修正 → lint OK → push（`95bfbb6`）
- AI が締めで「再デプロイしてください / 手動アップロードでも OK」と書き **§35-1 / §56-1a 違反**（浜田指摘 ×2）
- 即訂正: `npm run deploy:674` を新設 + 実行 + 検証（live revision=9 / size 12004）+ push（`4e9a062`）
- 引き継ぎでも落ちないよう **物理ガード 4 ヶ所**追加: TSB-024 / NEW-SESSION-STARTER 最上段 🚨 / フェーズ 7 第 7 項 / 本ログ

**AI 補足（漏れ防止）**:
- `git`: `## main...origin/main` ahead 0（直前 push 済 / 本ターンの追記分は未 commit）
- `次の1手`: 本ターンの handoff / TSB-024 / NEW-SESSION-STARTER v3.18 / フェーズ 7 第 7 項 をまとめて 1 commit → push → `npm run session-starter:sync-desktop` → `npm run session:bootstrap` で機械検証
- `GO待ち`: なし（§52-9 範囲のドキュ整備 / 不可逆操作なし）
- `session-lock`: 未取得（憲法 5 ファイルを直接編集していない / NEW-SESSION-STARTER は復元・引継ぎ専用ドキュ）
- `関連パス`:
  - `docs/troubleshooting.md` **TSB-024**（アンチパターン全文 + 禁句リスト + 教訓 3）
  - `chat-sessions/NEW-SESSION-STARTER.md` v3.18 + 最上段 🚨 ブロック
  - `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 第 7 項

**次セッションへの 1 行**: 開口一番に **役割宣言テンプレ（フェーズ 7 第 7 項）**を貼る。`deploy:<appId>` が未整備なら **AI が npm script を追加して実行**する（依頼しない）。`AGENTS.md §35-1 / §56-1a` 逆転禁止。

---
