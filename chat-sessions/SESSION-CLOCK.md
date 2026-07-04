# セチE��ョン壁時計！EST�E�E
同一 Cursor 会話の **§51-6-2 時間軸�E�E 時間�E�E* を機械判定する、E
**2026-05-17�E�浜田 CEO�E�E*: **Cursor を閉じると自動停止**�E�EsessionEnd` hook ↁE`session:clock:clear` �E�Ewatch/web 停止�E�、E*Cursor を開くと自動起勁E*�E�EsessionStart` hook ↁEset �E�Ewatch �E�Eweb �E�E**URL めEadditional_context 表示**�E�。手勁E `npm run session:clock:stop` / `docs/runbooks/session-clock-cursor-lifecycle.md`、E
**2026-04-29�E�浜田 CIO�E�E*: セチE��ョン刁E��のた�Eに壁時計をリセチE��する運用�E�上訁Ehook に統合）、E*こ�E HEADER に永続化済！ESB-026�E�E*、E*人間注意書き�E追記�Eここ�E�Ecripts/session-clock.mjs の HEADER 定数�E�に行うこと、E*

**チャチE��から AI に依頼**�E�浜田が手で npm を打たなくてよい�E�E 、E*壁時計をぁE��の時刻でセチE��して**�E�Enpm run session:clock:set`�E�」�E AI が実行（§35-1�E�。依頼斁E�E一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 ↁEAI 依頼斁E*、E
**人間向け�E経過表示�E�エチE��タ�E�E*: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（�E動生成�Egit 追跡外）。`session:clock:watch` 稼働中は **既宁E10 刁E��と**に更新�E�ESESSION_CLOCK_WATCH_MS` で変更可�E�、`set` の直後も更新。子�Eロセスは **windowsHide** でバックグラウンド実行。`npm run session:clock:prompt-hook` は不要、E
```bash
npm run session:clock:set
npm run session:clock:web-url
```

**ターミナルに URL だけ�EぁE*�E�サーバ�E立てず�Eート試行�Eみ�E�E 上�E `session:clock:web-url`、E*実際にブラウザで見る**とき�E `npm run session:clock:web` のログ先頭の「開ぁE」を正とする�E�既に Web が動ぁE��ぁE��別ターミナルがあれ�Eそちら�E URL�E�、E
## 開始（この1行だけを書き換えればよい�E�E
開姁E 2026-07-04 19:50
