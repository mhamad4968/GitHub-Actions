# セッション壁時計（JST）

同一 Cursor 会話の **§51-6-2 時間軸（4 時間）** を機械判定する。**新チャット直後**または**作業再開時**に次を1回実行する。

**チャットから AI に依頼**（浜田が手で npm を打たなくてよい）: 「**壁時計をいまの時刻でセットして**（`npm run session:clock:set`）」→ AI が実行（§35-1）。依頼文の一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 → AI 依頼文**。

**人間向けの経過表示（エディタ）**: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（自動生成・git 追跡外）。`session:clock:watch` 稼働中は **既定 2 分ごと**に更新、`set` の直後も更新。`npm run session:clock:prompt-hook` は不要。

```bash
npm run session:clock:set
```

## 開始（この1行だけを書き換えればよい）

開始: 2026-04-28 07:07
