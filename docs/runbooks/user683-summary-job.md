# 683 週次・月次要約の自動投入（682 → Claude → kintone）

> **レーン整理（682 / 683 / 632）**: 先に **`docs/runbooks/user683-weekly-summary-and-print.md`** を Read（**632 はニュース週次**で **683 の週次 UI とは別**）。

ブラウザの **HTTPS → localhost HTTP** 制約を避け、**定時ジョブ（Windows タスク スケジューラ等）**から Node を実行して要約を kintone に書き、683 一覧は **GET で表示**する。

**683 一覧の「中継ゼロ」既定**: `customize/683/desktop.js` の **`USER683_RELAY_ZERO_MODE = true`** のとき、ブラウザからの AI 生成ボタンは出ません（閲覧・手修正・保存のみ）。ブラウザ生成を再有効にする場合は **`false`** にして deploy し、`user683-claude-relay.md` に従って中継 URL を用意してください。AI 欄見出し下には **翌暦月 1 日（JST）** を「更新予定」として小さく表示する（定時ジョブの実日時と異なる場合は目安）。

## 683 customize を本番に反映するとき

1. **プリフライト（45 分以内に deploy すること）**  
   `npm run cio:preflight:683 -- --note "…"`（`--note` は **4 文字以上**）

2. **デプロイ**  
   `npm run deploy:683`

3. **Python 中継を使うとき（任意だが推奨）**  
   `deploy:683` は **683 の JS カスタマイズのみ**を本番に載せます。別マシン／別プロセスで **`scripts/user683_claude_relay.py`**（`npm run user683:claude-relay` 等）を動かしている場合、**中継側のプロンプトや `RELAY_BUILD` を変えた変更**をブラウザの「生成」に反映するには、その環境で **中継プロセスを再起動**してください（古いプロセスのままだと旧ロジックのままです）。

4. **ブラウザから AI 生成を再度使うとき**  
   `customize/683/desktop.js` の **`USER683_RELAY_ZERO_MODE` を `false`** にしてから、上記 1→2 を実行する（中継 URL は `docs/runbooks/user683-claude-relay.md` を参照）。

## 変更の種類と CIO 向け報告の書き方

- **`customize/683/desktop.js` を変更していない**作業（例: `scripts/user683-sync-summaries-to-kintone.mjs` や `scripts/user683_claude_relay.py` のみ）では、**本番 kintone の `desktop.js` は未変更**のため **`npm run deploy:683` は不要**なことがあります。
- 683 一覧の挙動として本番に載せたい変更がある場合のみ **`npm run cio:preflight:683 -- --note "…"` → `npm run deploy:683`** を実行します。
- **中継経由でブラウザから AI 生成する**運用では、中継側を更新したリリースのあと **`user683_claude_relay.py` の再起動**が別途必要です（`deploy:683` だけでは中継プロセスは更新されません）。手順 3 および `user683-claude-relay.md` の「`deploy:683` のあと」も参照。

**報告にそのまま使える一文（CIO）**:

> 本番 kintone の desktop.js は未変更のため、今回は deploy は実行していません。反映が必要なら `npm run cio:preflight:683 -- --note "…"` → `npm run deploy:683` と、中継利用時は `user683_claude_relay.py` の再起動をお願いします。

## 前提

- **682** に暦月の日次レコード（`record_date` ほか）があること（683 と同じ前提）。
- **Anthropic Claude API** が使えること: ジョブ実行マシンの環境に **`ANTHROPIC_API_KEY`**（必須）と任意で **`ANTHROPIC_MODEL`**（既定 `claude-opus-4-7`）を設定する。
- kintone REST 用の **`.env`**（`KINTONE_BASE_URL` / `KINTONE_USERNAME` / `KINTONE_PASSWORD`、必要なら Basic）が `682:audit-month` と同様に通ること。

## キャッシュ用アプリとフィールド

既定では要約を **アプリ `USER683_SUMMARY_APP`（環境変数なし時は 683）** に 1 暦月 1 行で保存する。

### フィールドの追加（リポから一括）

手動でもよいが、次で **プレビューに POST → deploy** まで実行できる（682 の対応文追加と同型）。

```bash
npm run user683:add-summary-fields:dry-run
npm run user683:add-summary-fields
```

### 手動作成する場合のフィールドコード

次の **フィールドコード**（表示名は任意）。

| フィールドコード       | 型              | 用途           |
|------------------------|-----------------|----------------|
| `user683_dash_ym`      | 文字列（1行）   | `YYYY-MM` キー |
| `user683_week_1`     | 文字列（複数行）| 第1週ブロック要約 |
| `user683_week_2`     | 〃              | 第2週          |
| `user683_week_3`     | 〃              | 第3週          |
| `user683_week_4`     | 〃              | 第4週          |
| `user683_week_5`     | 〃              | 第5週          |
| `user683_week_6`     | 〃              | 第6週          |
| `user683_month`      | 〃              | 月次要約       |

別アプリに置く場合は **`USER683_SUMMARY_APP`** にアプリ ID を指定し、683 一覧側で `window.USER683_SUMMARY_CACHE_APP` を同じ ID に合わせる（省略時は 683）。

フィールドコードを変えたい場合はスクリプトと同じ名前の環境変数で上書き可能（`USER683_FC_YM` 等）。`scripts/user683-sync-summaries-to-kintone.mjs` 冒頭参照。

### 月次要約（前月比）

同期ジョブとブラウザの月次生成は、要約キャッシュから **直前暦月**の `user683_month` を取得し Claude に渡します。出力は **冒頭 1〜3 文で前月比の所感**、その後 **箇条書きで当月の要点**です。前月レコードが無い場合はプレースホルダのみで比較は「初月または欠」の扱いです。

**会計年度・長期連休（Claude 指示）**: 週次・月次の要約プロンプト（`user683-sync-summaries-to-kintone.mjs` / `user683_claude_relay.py`）では、**期末＝4月末・期首＝5月**と会計年度四半期の固定対応（**5–7月=第1四半期、8–10月=第2四半期、11–1月=第3四半期、2–4月=第4四半期**。暦年四半期は禁止）を求めます。**年末年始・GW・秋分前後の連休（シルバーウィーク）**を跨ぐ週／月では稼働日減を考慮します（コーパスに根拠が無い断定は禁止）。

## コマンド

```bash
# 682 取得とコーパス長だけ確認（Claude・書き込みなし）— JST 当月
npm run user683:sync-summaries:dry-run

# 先月だけ dry-run（翌暦月 1 日の定時ジョブで先月を締める前の確認用）
npm run user683:sync-summaries:dry-run-prev-month

# 既定は JST の当月。年月を明示する例:
npx dotenv -e .env -e .env.proxy -- node scripts/user683-sync-summaries-to-kintone.mjs --dry-run --year 2026 --month 4

# Claude 生成 + kintone UPSERT（Tier B）— 当月
npm run user683:sync-summaries:apply -- --year 2026 --month 4

# 先月分を一発投入（JST の「いま」の前月。--year / --month と併用不可）
npm run user683:sync-summaries:apply-prev-month
```

`--dry-run` と `--apply` は同時に指定しない。`--prev-month` は **`--year` / `--month` と同時に指定しない**（先月は JST で自動計算）。

## 定時ジョブの推奨（月1回・先月締め）

月次報告で **先月分**を確実に kintone に入れたい場合（例: **翌暦月 1 日（JST）**に実行）:

- **推奨コマンド**: `npm run user683:sync-summaries:apply-prev-month`  
  - 実行日が JST で **6月**なら **5月分**を対象にする（実行日の暦月ではない）。
- **当月だけ都度更新したい場合**（例: 5月中に 5月分だけ再生成）: `npm run user683:sync-summaries:apply`（引数なしで JST 当月）。

引数なしの `apply` だけを「**毎月 1 日**」に回すと、その日は暦が既に**新しい暦月**に入っているため **当月分**が生成されてしまう点に注意（先月締めには **`apply-prev-month`** を使う）。

## 683 一覧の表示

`customize/683/desktop.js` は一覧表示時に上記アプリを **GET** し、該当 `YYYY-MM` のレコードがあれば **週次・月次のテキストエリアを上書き**し、`sessionStorage` にも反映する（空の週だけは既存の session を残す）。

手動の **Claude 週次・月次生成**（`npm run user683:claude-relay` 等の中継経由）は **`docs/runbooks/user683-claude-relay.md`** を参照。**ブラウザ生成を使わず**、定時ジョブだけで要約を流し込む運用では **中継 URL は不要**（一覧は GET で表示）。全員で同じ HTTPS 中継を使う場合は **`customize/683/desktop.js` の `USER683_CLAUDE_RELAY_ORG_DEFAULT`** に 1 行だけ書いて deploy すれば、各ユーザの URL 貼付を省けます。

## 自動化の例（Windows）

**月1回・先月分を締める（推奨・CEO 2026-05-17 登録）** — リポから **1 コマンド**でタスク登録（**毎月 1 日 08:00 ローカル時刻**＝PC が JST なら JST 8:00）:

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run user683:sync-summaries:register-windows-task
```

- **タスク名**: `kintone-ai-lab-user683-sync-prev-month`
- **本体**: `scripts/windows/user683-sync-summaries-prev-month-run.ps1` → `npm run user683:sync-summaries:apply-prev-month`
- **ログ**: `logs/user683-sync-scheduled-*.log`
- **削除**: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/register-user683-sync-summaries-monthly-task.ps1 -Unregister`
- **時刻変更**: スクリプトを `-Time "09:00"` 付きで再実行（既存タスクは先に `-Unregister`）

**当月分だけを同月内に更新**する場合（任意の頻度・手動または別タスク）:

```powershell
npm run user683:sync-summaries:apply
```

（手動で特定月だけ入れるときは `npm run user683:sync-summaries:apply -- --year 2026 --month 4`。）

## 毎月の微調整（浜田依頼時）

定時ジョブ `npm run user683:sync-summaries:apply`（または `apply-prev-month`）のあと、ダッシュ（683）で文言を直したいときは **AI に次の4点を伝える**（手修正のみの場合は「コメントを保存」で十分）。

| 項目 | 記入例 |
|------|--------|
| 対象暦月 | `2026-05` |
| 第何週（任意） | 第6週（5/31〜5/31） |
| 症状 | コメント欄が空／途中で切れる／件数と合わない |
| 期待 | 1行要約の追記／言い回し修正（数値はコーパスに無いものは書かない） |

**AI 側の典型手順**: 682 から当該週のコーパス確認 → 必要なら Claude で週次のみ再生成 → 要約キャッシュの **当該 `user683_week_N` のみ PATCH**（週1〜5・月次は上書きしない）。

**事前チェック（推奨）**: `npm run user683:verify-summary-fields`（`user683_week_6` 等が本番に無いと PUT しても表示されない）。

## トラブルシュート

- **CB_IL02（REST GET）**: Node の `fetch` で **GET に `Content-Type: application/json` を付けない**（本リポの `user683-sync-summaries-to-kintone.mjs` は修正済み）。
- **CB_NO02 / GAIA 等**: フィールドコード不一致、またはアプリ権限・ゲストスペース URL と `.env` の組み合わせを確認。
- **`（Claude API キー未設定: ANTHROPIC_API_KEY）`**: ジョブを動かすシェル／タスクに **API キー**が渡っているか確認（`.env` を `dotenv` で読む運用ならファイルの場所とキー名）。
- **Claude HTTP 401 / 403**: キー無効・権限・組織ポリシーを確認。
- **Claude タイムアウト**: `USER683_CLAUDE_TIMEOUT_MS` を延長。
- **POST 失敗（必須フィールド）**: 683 にレコード追加用の **他必須フィールド**がある場合はアプリ設計を見直すか、要約専用の空アプリを `USER683_SUMMARY_APP` で指定。
- **第6週だけコメントが空**: `npm run user683:verify-summary-fields` で `user683_week_6` の有無を確認 → 無ければ `npm run user683:add-summary-fields`。
- **apply 直後に週6が空で終了**: コーパスはあるが要約未保存 — ログの `NG week 6` を確認（P2 検査）。

## レガシー（Ollama）

過去の **Ollama 中継・同期**の手順は **`docs/runbooks/user683-ollama-relay.md`** および **`npm run user683:ollama-relay`**（`scripts/user683-ollama-relay.mjs`）を参照。本番の自動投入パスは **Claude** に統一済み。
