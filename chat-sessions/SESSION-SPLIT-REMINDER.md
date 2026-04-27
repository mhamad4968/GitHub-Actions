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
- **客観起点（正本）**: **`sessionStart` hook** が **`session:clock:set`** で **`chat-sessions/SESSION-CLOCK.md`** の `開始:` を JST の「いま」に更新し、必要なら **`session:clock:watch`** も起動する（上記「1・2を自動化」節）。hook が無いときだけ **手で** `npm run session:clock:set`。以降 **`npm run session:split-check`** または **`session:bootstrap` 内包**で **4 時間超**が機械検出される。  
- 新チャット開始時は従来どおり **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文** ＋ `HANDOFF-HUMAN` 5 行。

## 「1」「2」を AI 側で自動化（正本: Cursor `sessionStart` hook）

**1**（`session:clock:set`）と **2**（`session:clock:watch` の常駐）は、**浜田が毎回打たなくてよい**ように、**Composer 新セッションの `sessionStart`** で自動実行する。

- 実装: `.cursor/hooks.json` の `sessionStart` 先頭 → **`node .cursor/hooks/session-start-autopilot.mjs`**
- 動作: **`npm run session:clock:set`** で `SESSION-CLOCK.md` を JST のいまに更新 → 未稼働なら **`session:clock:watch`** を **デタッチ起動**（4 時間超でデスクトップ通知）
- AI への事実注入: hook の stdout **`additional_context`**（プロンプト直下に入る想定）— **手動 1・2 は原則不要**と分かる
- ログ: `logs/session-start-hook.log` / `logs/session-clock-watch.log`
- **hook が無効**な環境・Cursor 外だけ、従来どおり手動で `session:clock:set` と（必要なら）`session:clock:watch`

## チャット外で「教える」（`session:clock:watch` の中身）

**通常は hook が起動する**ので、別ターミナルで手動起動は不要。ポーリングは **既定 2 分**（`SESSION_CLOCK_WATCH_MS`）。同一 `開始:` に対する通知は **1 回**（`logs/.session-clock-split-alerted`）。`session:clock:set` でリセット。

**標準ツールが無い環境**: 通知本体は `scripts/lib/desktop-notify.mjs`（`notify-send` → `gdbus` → `zenity` → ベル）。**GUI が出なくても** `logs/session-desktop-notify.log` に **毎回 1 行**残る。経路の確認は **`npm run session:notify-selftest`**。

**Cursor が閉じていても効かせる（この PC に仕込む・推奨）**: WSL/Linux で **`npm run session:clock:install-cron`**。ユーザー crontab に **10 分ごと**の `session-split-cron-ping.mjs` が入り、4h 超なら watch と **同じ抑止フラグ**で1回だけ通知する。解除は **`npm run session:clock:uninstall-cron`**。WSL では **`cron` デーモン起動**（例: `sudo service cron start`）が必要なことがある。cron 用の `node` は **`~/.nvm` の最新 semver**を優先（Cursor 同梱は避ける）。**固定したいとき**は `export KINTONE_AI_LAB_NODE=/path/to/node` を付けてから `npm run session:clock:install-cron`。

手動だけ動かす場合:

```bash
cd ~/kintone-ai-lab && npm run session:clock:watch
```

## 参照

- `AGENTS.md` §51-6-2（命令文言・反パターン・§47-D）  
- `chat-sessions/checkpoint-latest.md`「セッション切替後の自律復元」  
