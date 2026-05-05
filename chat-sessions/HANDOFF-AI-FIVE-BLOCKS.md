# HANDOFF-AI-FIVE-BLOCKS — AI 引き継ぎ 5 ブロック構成（正本 / v1.2 / 2026-05-06）

**目的**: 長文を一度に読まなくてよいよう、**次 AI が同じ順で復元**できる骨格だけを固定する。詳細は各リンク先が正。

---

## ブロック 1 — いま何のレーンか（15 秒）

| 書くこと | 例 |
|----------|-----|
| アプリ／領域 | 674 新・PC台帳 / 679 予実 / 678 ダッシュ … |
| 触る正本パス（最大 2 つ） | `customize/new-pc-ledger-v1/desktop.js` 等 |
| 浜田からの合意 | 項番 -0 の OK 要約 1 行 |

**参照**: `kintone-apps.md` でアプリ ID を照合。`checkpoint-latest.md` 先頭の **5A / 5B**。

---

## ブロック 2 — 規律ゲート（着手前・必須）

**編集ツールや `deploy:*` を走らせる直前**にチャットへ残す（**§35-7**）。

1. **〔憲法 3 分〕** — レーン 1 行 + `08-READ-06.txt`（または本文中の READ-06 節）または `NEW-SESSION-STARTER.md` から **要約 1 行**。
2. **§50-3-8** — DeepSeek 1 問 + 約 3 行突合、**または** `§50-3-8 スキップ理由:` **1 行必須**。
3. **`[🎖️ 本セッション割当]`** — 1 行（未使用は「未使用」と明記）。

**参照**: `AGENTS.md` §35-7、§50-3-8、`desktop-ai-emergency-read-pack/08-READ-06.txt`。

---

## ブロック 3 — 読む順（read-pack）

**INDEX の順だけ**でよい（中身は必要な番号だけ深読み）。

1. `desktop-ai-emergency-read-pack/02-INDEX.txt`（**読取順**）
2. `desktop-ai-emergency-read-pack/03-READ-01.txt` → … → `09-READ-07.txt`（**ファイル名の番号昇順**）。`08-READ-06`（本文見出し **READ-06**）の直後は **【AI分業チェック】** 1 回必須。

**正本フォルダ**: `chat-sessions/desktop-ai-emergency-read-pack/`  
**Desktop 控え**: `C:\Users\mhamada202408224\Desktop\AI緊急用\`（`npm run session-starter:sync-desktop`）

---

## ブロック 4 — 機械検証（項番 0）＋ customize deploy ゲート

リポルートで **`npm run session:bootstrap`**（exit 0）。  
単体で足りるとき: `verify:constitution-handoff` → `verify:mandatory-read-gate`。

**本番 customize を反映するとき（594/595/626/627/629/671/674/677/678/679・2026-05-06 拡張）**

1. チャットで §35-7 の出力を済ませた **あと**、ターミナルで（`<app>` を対象アプリ ID に置換）:

   `npm run cio:preflight:<app> -- --note "（規律の一行要約・4文字以上）"`

   **任意**: ワーキングツリー要約 1 行をスタンプ JSON に載せる → 末尾に **`--with-git-diff-line`**。

2. **45 分以内**に `npm run deploy:<app>`（スタンプ無しは **失敗**）。

**緊急**: `SKIP_CIO_DEPLOY_GUARD=1 npm run deploy:<app>`（浜田 GO＋チャットに理由 1 行）。

**参照**: `SESSION-BOOTSTRAP-CHECKLIST.md`、`constitution-handoff-gate.mdc`、**`.cursor/rules/cio-discipline-always.mdc`**（常時注入）。

---

## ブロック 5 — 締め（日次・1 本）

- **`chat-sessions/SESSION-CLOSE-REPORT_yyyymmdd.txt`** を 1 本（事実・反省・次アクション）。
- **Desktop** へ控えを出すなら **`npm run session-starter:sync-desktop`** → `verify:desktop-ai-emergency-sync`。
- **壁時計停止**が指示されていれば **`npm run session:clock:clear`**。

**参照**: `AGENTS.md` §35-6、締め報告テンプレは `SESSION-CLOSE-REPORT-20260505.txt` の構成を流用。

---

## 改定履歴

| 日付 | 内容 |
|------|------|
| 2026-05-05 | 初版（674 セッション反省・CEO GO に基づく 5 分割構成） |
| 2026-05-05 | v1.1 — **674 deploy 機械ゲート**（`cio:preflight:674`・45 分・`SKIP_CIO_DEPLOY_GUARD`）追記 |
| 2026-05-06 | v1.2 — **全 customize deploy へゲート横展開**＋preflight **`--with-git-diff-line`**（任意） |
