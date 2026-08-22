# セッション壁時計（JST）

同一 Cursor 会話の **§51-6-2 時間軸（4 時間）** を機械判定する。

**2026-05-17（浜田 CEO）**: **Cursor を閉じると自動停止**（`sessionEnd` hook → `session:clock:clear` ＋ watch/web 停止）。**Cursor を開くと自動起動**（`sessionStart` hook → set ＋ watch ＋ web ＋ **URL を additional_context 表示**）。手動: `npm run session:clock:stop` / `docs/runbooks/session-clock-cursor-lifecycle.md`。

**2026-04-29（浜田 CIO）**: セッション切替のたびに壁時計をリセットする運用（上記 hook に統合）。**この HEADER に永続化済（TSB-026）**。**人間注意書きの追記はここ（scripts/session-clock.mjs の HEADER 定数）に行うこと。**

**チャットから AI に依頼**（浜田が手で npm を打たなくてよい）: 「**壁時計をいまの時刻でセットして**（`npm run session:clock:set`）」→ AI が実行（§35-1）。依頼文の一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 → AI 依頼文**。

**人間向けの経過表示（エディタ）**: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（自動生成・git 追跡外）。`session:clock:watch` 稼働中は **既定 10 分ごと**に更新（`SESSION_CLOCK_WATCH_MS` で変更可）、`set` の直後も更新。子プロセスは **windowsHide** でバックグラウンド実行。`npm run session:clock:prompt-hook` は不要。

```bash
npm run session:clock:set
npm run session:clock:web-url
```

**ターミナルに URL だけ出す**（サーバは立てずポート試行のみ）: 上の `session:clock:web-url`。**実際にブラウザで見る**ときは `npm run session:clock:web` のログ先頭の「開く:」を正とする（既に Web が動いている別ターミナルがあればそちらの URL）。

## 開始（この1行だけを書き換えればよい）

開始: 2026-08-22 16:17
