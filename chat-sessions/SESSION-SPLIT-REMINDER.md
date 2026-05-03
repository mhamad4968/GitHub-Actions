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

## 憲法改定・長時間セッション（運用メモ / 2026-05-04）

- **post-commit で §51-6-2（同一チャット 4h 超）警告**が出続ける、または **憲法・hooks の編集**を終えたら、**新チャットへ切り替え**てから **`npm run session:clock:set`** で壁時計を取り直し、**`npm run session:bootstrap`** で機械ゲートを通す（長時間のまま憲法だけ更新しない）。
- **ファイル削除・「古い」整理**は **`AGENTS.md` §35-6**／**TSB-031** に従い、**浜田確認または §41 一問**を挟む。

## 浜田（壁時計）

- **4 時間**は OS の **タイマー・カレンダーアラーム**に任せると抜けにくい（チャットだけに依存しない）。  
- **客観起点（正本）**: **`sessionStart` hook** が **`session:clock:set`** で **`chat-sessions/SESSION-CLOCK.md`** の `開始:` を JST の「いま」に更新し、必要なら **`session:clock:watch`** も起動する（上記「1・2を自動化」節）。hook が無いときだけ **手で** `npm run session:clock:set`。以降 **`npm run session:split-check`** または **`session:bootstrap` 内包**で **4 時間超**が機械検出される。  
- 新チャット開始時は **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文**（**v3.27+**: 本文 **「■ 貼付単独で完走」** に -1〜0 手順を内包。**`HANDOFF-HUMAN` 5 行は任意**）。
- **セッション切替で新チャットに繋いだ直後（忘れ防止・2026-04-29 憲法 §51-6 遵守事項 5）**: **AI が `npm run session:clock:set` を必ず実行**し、`SESSION-CLOCK.md` の `開始:` を報告する（hook が先に更新していても **再実行してよい**）。続けて **`npm run session:clock:web` をバックグラウンド起動**し、**ターミナルに出た URL を浜田がブラウザで開く**（hook の有無にかかわらず **URL 促しは必須**）。浜田が手早く依頼したいときは下の「浜田 → AI 依頼文」でもよい。

## 浜田 → AI 依頼文（壁時計セット・Tier A）

**方針**: 時計の更新は **AI が端末で実行**（浜田はチャットで依頼するだけ / §35-1・TSB-024）。

**AI（忘れ防止）**: `SESSION-CLOCK.md` の `開始:` が未設定のまま本題に入るときは、**必ずチャットに 1 行口頭してから**同一ターンで `session:clock:set` を実行（**黙って実行だけ**は禁止）。常時想起: `.cursor/rules/constitution-handoff-gate.mdc` **§51-6-2 壁時計**。

- **いまの JST で開始を記録**（いちばん短い）:  
  `壁時計をいまの時刻でセットして（npm run session:clock:set）`
- **作業再開で時刻を切り直す**（中抜け後など）:  
  `このチャット用に壁時計をいまの JST で取り直して（session:clock:set）`
- **watch も欲しい**（通知プロセスが落ちたとき等）:  
  `壁時計をセットしたうえで、session:clock:watch もバックグラウンドで起動して`

AI は **`npm run session:clock:set`** を実行し、結果（`SESSION-CLOCK.md` の `開始:` 1 行）を短く報告すればよい。`npm run session:clock:prompt-hook` で表示確認できる。

## 人間向けタイマー（エディタで見る・`prompt-hook` 不要）

**目的**: ターミナルで `npm run session:clock:prompt-hook` を打たなくても、**エディタのタブ**で経過と 4h までの残りが分かる。

- **ファイル**: `chat-sessions/SESSION-CLOCK-TICKER.md`（**自動生成・git 追跡外**）
- **更新タイミング**: `npm run session:clock:set` の直後、`session:clock:watch` の **既定 2 分ごと**、cron の `session-split-cron-ping` の **各実行**（`npm run session:clock:write-ticker` と同じ処理）
- **運用**: Cursor でこのファイルを **開いてタブを固定**（split でも可）。外部更新で内容が変わるので、必要なら **エディタの「ファイルの再読み込み」**またはタブを閉じて開き直す

## ブラウザで見る（クリック・ブックマーク）

**目的**: エディタを開かず、**リンクやお気に入り**からいつでも経過を見る。

- **起動**（リポルート）: `npm run session:clock:web`
- **URL**: ターミナルに **`[session-clock-web] 開く: http://127.0.0.1:…/`** と出る **実際のポート**を開く（既定 **47931** から最大 **30** 個ぶん、**空きまで自動**で試す。前回のプロセスが残っていると **47932** などになる）
- **ポートの起点だけ変える**: `SESSION_CLOCK_WEB_PORT=48000 npm run session:clock:web`
- **ブックマーク / デスクトップの URL ショートカット**: 上記 URL を登録（**127.0.0.1 のみ**で待ち受け — インターネットには公開されない）
- **表示の中身**: `SESSION-CLOCK-TICKER.md` と同じ。**30 秒ごと**にページが自動再読み込み（`Cache-Control: no-store`＋`location.reload()`）
- **止める**: サーバを起動したターミナルで **Ctrl+C**
- **前提**: `session:clock:set` 済みで、`SESSION-CLOCK.md` の `開始:` が有効であること（WEB は **各 GET の直前**に in-process で `write-ticker` 相当を実行するため、**watch なしでも**経過表示は進む）

### データの流れ（WEB・5 行）

1. **正本**: `chat-sessions/SESSION-CLOCK.md` の **`開始:`**（JST 壁時計・hook または `session:clock:set` で更新）
2. **再計算**: WEB サーバが **HTTP GET `/` を受けるたび**、`SESSION-CLOCK.md` を読み直して **経過 ms** を計算し `SESSION-CLOCK-TICKER.md` を **上書き**（`scripts/lib/session-clock-write-ticker.mjs`）
3. **表示**: 続けて **TICKER を読み**、HTML の `<pre>` に埋め込む
4. **ブラウザ**: **30 秒ごとに `reload()`** → 再び 2〜3 が走る（経過・残りが進む）
5. **補助**: `session:clock:watch` / cron は **エディタ用 TICKER** や **通知**のため（WEB 単体でも壁時計は回る）

**負荷・将来案**: `docs/session-clock-web-performance-notes.md`

### ブラウザが `ERR_CONNECTION_REFUSED` のとき

1. **`npm run session:clock:web` を起動したターミナルが生きているか**（閉じる・Ctrl+C すると **即ダウン**して接続拒否になる）
2. **ブックマークのポートが古い**（前回は 47933、今回は別番 …）→ **毎回ターミナルに出た URL を開く**
3. **WSL で Windows の Chrome/Edge から `127.0.0.1` が繋がらない**環境では、試しに:  
   `SESSION_CLOCK_WEB_HOST=0.0.0.0 npm run session:clock:web`  
   （**同一 LAN に見える**ので、外出先 PC・職場の共有 Wi‑Fi では使わない）

## 「1」「2」を AI 側で自動化（正本: Cursor `sessionStart` hook）

**1**（`session:clock:set`）と **2**（`session:clock:watch` の常駐）は、**浜田が毎回打たなくてよい**ように、**Composer 新セッションの `sessionStart`** で自動実行する。

- 実装: `.cursor/hooks.json` の `sessionStart` 先頭 → **`node .cursor/hooks/session-start-autopilot.mjs`**
- 動作: **`npm run session:clock:set`** で `SESSION-CLOCK.md` を JST のいまに更新 → 未稼働なら **`session:clock:watch`** を **デタッチ起動**（4 時間超でデスクトップ通知）
- AI への事実注入: hook の stdout **`additional_context`**（プロンプト直下に入る想定）— **手動 1・2 は原則不要**と分かる
- ログ: `logs/session-start-hook.log` / `logs/session-clock-watch.log`
- **hook が無効**な環境・Cursor 外だけ、従来どおり手動で `session:clock:set` と（必要なら）`session:clock:watch`

## チャット外で「教える」（`session:clock:watch` の中身）

**通常は hook が起動する**ので、別ターミナルで手動起動は不要。ポーリングは **既定 2 分**（`SESSION_CLOCK_WATCH_MS`）。同一 `開始:` に対する通知は **1 回**（`logs/.session-clock-split-alerted`）。`session:clock:set` でリセット。

**標準ツールが無い環境**: 通知本体は `scripts/lib/desktop-notify.mjs`（**ダイアログ／ポップアップ優先**: WSL2 は Windows `Popup` → 他は `notify-send` / `gdbus` / `zenity --warning`（timeout）/ `xmessage` → ベル）。**GUI が出なくても** `logs/session-desktop-notify.log` に **毎回 1 行**残る。経路の確認は **`npm run session:notify-selftest`**。

**Cursor が閉じていても効かせる（この PC に仕込む・推奨）**: WSL/Linux で **`npm run session:clock:install-cron`**。ユーザー crontab に **10 分ごと**の `session-split-cron-ping.mjs` が入り、4h 超なら watch と **同じ抑止フラグ**で1回だけ通知する。解除は **`npm run session:clock:uninstall-cron`**。WSL では **`cron` デーモン起動**（例: `sudo service cron start`）が必要なことがある。cron 用の `node` は **`~/.nvm` の最新 semver**を優先（Cursor 同梱は避ける）。**固定したいとき**は `export KINTONE_AI_LAB_NODE=/path/to/node` を付けてから `npm run session:clock:install-cron`。crontab 行には **`DISPLAY=:0`** を付与する（インストーラが自動。別ディスプレイなら `SESSION_CLOCK_CRON_DISPLAY=:1 npm run session:clock:install-cron` 等）。

**健康診断・整合**: **`npm run session:clock:health`**（hooks / crontab 行 / node ドリフト）／**`npm run verify:session-clock-health`**（`session:bootstrap` と同じ厳格チェック）。**期待 node**は最後に成功した **`npm run session:clock:install-cron`** が `logs/.session-clock-install-node` に保存したパスを優先（`git pull` 後のドリフト検知用）。**監査ログ**: `logs/session-split-notify-audit.jsonl`（`watch` / `cron` からの `alerted` / `dup`）。**深夜のベル抑止**: 環境変数 **`SESSION_CLOCK_QUIET=1`**（`console-bell` のみ抑止・ファイルログは残る）。**Windows ネイティブ**のタスク登録サンプル: `scripts/install-session-clock-windows.ps1`。**WSL Popup 失敗時の stderr**: `logs/session-desktop-notify-powershell.log`。

手動だけ動かす場合:

- **`npm run session:clock:*` はリポルートで**（`~/` 直下だと `package.json` が無く **ENOENT** になる）。
- どこからでも叩くなら: `node ~/kintone-ai-lab/scripts/session-clock.mjs set`

```bash
cd ~/kintone-ai-lab && npm run session:clock:set
cd ~/kintone-ai-lab && npm run session:clock:watch
```

## 参照

- `AGENTS.md` §51-6-2（命令文言・反パターン・§47-D）  
- `chat-sessions/checkpoint-latest.md`「セッション切替後の自律復元」  
