# セッション切替リマインダ（§51-6-2 連動）

正本の条件一覧は **`AGENTS.md` §51-6-2**。ここは **運用の短い控え**（壁時計・チャット目印用）。

## AI 自律発動条件（いずれか 1 つで **命令**）

1. **時間軸**: 同一セッション **4 時間**経過  
2. **tool call 軸**: **200 回**経過  
3. **タスク軸**: 重い設計（Max Thinking 領域）が **完了直後**  
4. **コスト軸**: 当該セッションの On-Demand $ が **前セッションの 2 倍超**（推定）  
5. **危険軸**: **Tier B / 不可逆操作の直前**（新チャットで文脈リセット）  
6. **API 軸**: API 系統が **100%** 単独到達  

## 条件を満したら（AI）

- **このチャットの応答の最上段**に、次の **1 行目**から始める（浜田が「切替時刻」と分かる目印）:  
  `【セッション切替】§51-6-2 命令発動 — 条件: <1〜6のどれか> — <根拠1語句>`  
- **2 行目**に **`[§1-2-3 ティア判定: …]`**（§1-2-3-1）を置いてよい（切替通知とティア宣言の併記）。  
- 続けて **`AGENTS.md` §51-6-2** の「命令の発動手順」テンプレ（`[§51-6-2 命令発動]` ブロック）をそのまま貼る。  
- **`checkpoint-latest.md` 追記**と `handoff-log` ドラフト→OK フローは従来どおり（`session-handoff.mdc`）。

## 浜田（壁時計）

- **4 時間**は OS の **タイマー・カレンダーアラーム**に任せると抜けにくい（チャットだけに依存しない）。  
- **客観起点（推奨）**: 新チャットで会話を始めたら、**すぐ** `npm run session:clock:set` を実行し **`chat-sessions/SESSION-CLOCK.md`** の `開始:` を JST の「いま」にする。以降 **`npm run session:split-check`** または **`session:bootstrap` 内包**で **4 時間超**が機械検出される。  
- 新チャット開始時は従来どおり **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文** ＋ `HANDOFF-HUMAN` 5 行。

## チャット外で「教える」（`session:clock:watch`）

AI は Cursor のチャットを **常時監視できない**。代わりに **ローカルプロセス**でポーリングし、**4 時間超**のとき **デスクトップ通知**（Linux `notify-send` / macOS 通知 / Windows ポップアップ）を出す。

```bash
cd ~/kintone-ai-lab && npm run session:clock:watch
```

別ターミナルで常駐。**既定 2 分**ごと（`SESSION_CLOCK_WATCH_MS` で変更）。同一 `開始:` に対する通知は **1 回**（`logs/.session-clock-split-alerted`）。`session:clock:set` でリセット。

## 参照

- `AGENTS.md` §51-6-2（命令文言・反パターン・§47-D）  
- `chat-sessions/checkpoint-latest.md`「セッション切替後の自律復元」  
