# セッション時計 WEB — 負荷と将来案

## 現状（2026-04-27 時点）

- **各 GET** で `writeTickerFile(root)` を **同一 Node プロセス内**で実行（`scripts/lib/session-clock-write-ticker.mjs`）。**子プロセスは使わない**。
- 処理内容: `SESSION-CLOCK.md` を読み、`SESSION-CLOCK-TICKER.md` を **全文上書き**（軽量）。

## 想定負荷

- **単一ブラウザ・30 秒間隔**なら無視できるレベル。
- **タブ多数**・**短い間隔で reload**・**他ツールが同じ TICKER を高頻度で読む**場合は、ディスク I/O が積み上がる可能性あり。

## 将来の最適化案（必要になったら）

1. **同一秒内の 2 回目以降をスキップ**（サーバ内で `lastWriteMs` を保持し、`Date.now()` が同じ秒なら `writeTickerFile` を省略）。**注意**: 秒の境目で経過表示が 1 秒古いままになるため、UX とトレードオフ。
2. **`GET /api/ticker.json`** を追加し、本文は **初回だけ HTML**、以降は **fetch で JSON** 置換（ページ全体の reload をやめる）。実装コストは中程度。
3. **インメモリキャッシュ**（`clock mtime` が変わるまで TICKER 文字列を再利用）— `set` のたびに必ず mtime が変わるわけではないため、**経過の鮮度**と相談。

## 関連

- 運用の人向け短文: `chat-sessions/SESSION-SPLIT-REMINDER.md` の「ブラウザで見る」節。
- 実装: `scripts/session-clock-web.mjs` / `scripts/lib/session-clock-write-ticker.mjs`。
