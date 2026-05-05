# セッション壁時計（JST）

同一 Cursor 会話の **§51-6-2 時間軸（4 時間）** を機械判定する。**新チャット直後**または**作業再開時**に次を1回実行する。

**2026-04-29（浜田 CIO）**: セッション切替のたびに AI は **`npm run session:clock:set` を必ず実行**し、続けて **`npm run session:clock:web`** でターミナルに出た **URL を浜田へ促してブラウザで開く**（`AGENTS.md` §51-6 遵守事項 5、`NEW-SESSION-STARTER` 項番 4）。**この HEADER に永続化済（TSB-026）** — set 実行時の HEADER 全置換でも自動復元される。**人間注意書きの追記はここ（scripts/session-clock.mjs の HEADER 定数）に行うこと。**

**チャットから AI に依頼**（浜田が手で npm を打たなくてよい）: 「**壁時計をいまの時刻でセットして**（`npm run session:clock:set`）」→ AI が実行（§35-1）。依頼文の一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 → AI 依頼文**。

**人間向けの経過表示（エディタ）**: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（自動生成・git 追跡外）。`session:clock:watch` 稼働中は **既定 2 分ごと**に更新、`set` の直後も更新。`npm run session:clock:prompt-hook` は不要。

```bash
npm run session:clock:set
npm run session:clock:web-url
```

**ターミナルに URL だけ出す**（サーバは立てずポート試行のみ）: 上の `session:clock:web-url`。**実際にブラウザで見る**ときは `npm run session:clock:web` のログ先頭の「開く:」を正とする（既に Web が動いている別ターミナルがあればそちらの URL）。

## 開始（この1行だけを書き換えればよい）

開始: 2026-05-05 20:21
