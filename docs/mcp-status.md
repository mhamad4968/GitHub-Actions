# 📊 MCP 状態管理台帳

**初版作成**: 2026-04-23 (Thu) / **最終更新**: 2026-05-29（**Opus 4.8 大覚醒整備** — AI-KERNEL・repo-tree / eslint-mcp 活性化）

### §活性化 — 画像MCP代替ツール（2026-05-29）

| MCP | 用途 | 起動 |
|-----|------|------|
| **`repo-tree`** | リポジトリ構造ビジュアル化（depth・exclude 可） | `npx -y @andredezzy/deep-directory-tree-mcp` |
| **`eslint-mcp`** | コード品質・lint 自動監査（公式 `@eslint/mcp`） | `npx -y @eslint/mcp@latest` |

**代替方針**: 構造 = **repo-tree** / 品質 = **eslint-mcp** + **accessibility-scanner**。内蔵 **GenerateImage** のみ（画像 MCP 計画削除維持）。

### §見送り — 画像生成 MCP（計画削除・2026-05-29）

| 項目 | 状態 |
|------|------|
| **画像生成 MCP（DALL·E / SD 等）** | **計画削除** — `mcp.json` 追加**禁止**・台帳表に行を足さない |
| **許可のみ** | Cursor 内蔵 **`GenerateImage`** → **`assets/images/`**（`cursor-generate-image-assets.mdc`） |

### §方式B — 固定4AI と MCP アクセス（正本マトリクス）

機械正本: **`data/cio-mcp-four-ai-matrix.json`**。ルール側: **`.cursor/rules/mcp-server-use-triggers.mdc`** §4AI。

| 役割 | モデル | MCP（呼び出し可・代表） |
|------|--------|-------------------------|
| **① CIO** | Opus 4.7 ベース / 必要時 **Opus 4.8** | **registry 必須10** + kintone-dev/space・figma・colors-fonts・CVE/ニュース・GitHub（Win）・FE 検証系 |
| **② Composer** | 2.5 Subagent | kintone・playwright・rag・markdownify・shadcn-ui・chrome-devtools・duckduckgo-search・memory（**diff のみ**） |
| **③ Kimi** | Kimi | kimi・openrouter・markdownify・rag・memory（**長文**） |
| **④ DeepSeek** | DeepSeek | deepseek・openrouter・memory・sequential-thinking（**§50-3-8**） |

**registry 必須（`verify:cio-mcp-registry`）**: `deepseek`, `kimi`, `openrouter`, `memory`, `sequential-thinking`, `rag`, `markdownify`, `kintone`, `playwright`, `duckduckgo-search`

**更新ルール**: mcp.json 変更時 / 月次 MCP 健康診断時 / 浜田判断あった時に必ず本ファイル更新
**正本順位**: 本ファイル < **`~/.cursor/mcp.json` とワークスペース `.cursor/mcp.json` がマージ**（Cursor 仕様）。`kintone-ai-lab` ルートで開いたとき **Figma + colors-fonts** はリポ側 JSON にも記載（2026-05-04）。

### §CIO マルチエージェント — MCP 名チェック（2026-05-10）

- **`npm run verify:cio-mcp-registry`** … **deepseek / kimi / openrouter / memory / sequential-thinking / rag / markdownify / kintone / playwright / duckduckgo-search** が **レジストリに存在**すること（`disabled: true` は除外）。秘密は出さない。
- **`npm run cio:mcp:env`** … 上記のあと **`.env`＋`.env.proxy` 注入**で `cio-mcp-quickprobe`（kintone + 3AI + memory + sequential-thinking）を **JSON-RPC initialize** まで実測。**CIO 合格線**: **3AI・kintone のキーは `.env` が空でも `%USERPROFILE%\.cursor\mcp.json`（＋リポ `.cursor/mcp.json`）の `server.env` を自動補完**し、**SKIP なしで全件 OK**（不足なら **exit 2**＝未整備）。
- **`npm run cio:mcp:gate`**（**2026-05-17**）… **厳格ゲート**: registry → **`verify-mcp-kintone-base-url`**（プレースホルダ `cybozu.com` 禁止・Win/リポ/env ホスト一致）→ quickprobe → **`probe-kintone-space-json.mjs 48`**（実 API・JSON 必須）。計画書 **`docs/plans/2026-05-17-mcp-optimization-plan.md`**。
- **`npm run cio:mcp:env:extended`**（**2026-05-21**）… 必須 6 件に加え **playwright / markdownify / duckduckgo-search** を initialize プローブ（Composer 実務系の事前確認）。
- **`npm run cio:env:enhance`**（**2026-05-21**）… **環境増強ワンショット**: `health-check` → `cio:mcp:gate` → **`mcp:apply-repo-overlays-windows`**（figma / colors-fonts / mintlify を Win `%USERPROFILE%\.cursor\mcp.json` へ）→ `verify:cursor-mcp-windows` → `verify:mcp-four-ai-alignment`。`--full` で `verify:cio-four-ai-governance`・`--desktop` で Desktop 同期連鎖・`--quick` で gate 省略。
- **実行経路（2026-05-11 CEO 合意）**: **日常の健康ゲートは Windows ネイティブ**で `Set-Location C:\Users\<you>\kintone-ai-lab; npm run cio:mcp:env`（**`SUMMARY: OK 6/6`** を正）。**WSL の `/mnt/c/...` は月次のベストエフォート**（drvfs ＋並列 `npx` で **kimi のみ TIMEOUT** になり得る）。**WSL で kimi だけ落ちるとき**は **`CIO_MCP_PROBE_KIMI_TIMEOUT_MS`**（`scripts/cio-mcp-quickprobe.mjs`）と **ネット（VPN／FW／mirrored）**を先に切り分ける。
- **監査メモ（2026-05-11）**: **`npm run health-check`** は Windows の **非 IDE CLI** では多くの MCP が **意図的に ⏭**（`HEALTH_CHECK_STRICT_WIN=1` で厳格化可）。**実 initialize の正**は引き続き **`cio:mcp:env`**。**S12 死蔵 WARN** は週次 `mcp-status:refresh-usage` で是正判断。**`main` が `origin/main` より遅れ**ているときは `git fetch` / `git pull` で正本を揃えてから再検証。**Node DEP0190**（`spawn`+`shell:true`+args）— `cio-mcp-quickprobe` は Windows で **`npx` が ENOENT になるため `shell:true` を維持**（警告のみ・コマンド列は固定）。
- **`kintone-space`（自作・WSL）— 2026-05-11 CIO**: **`KINTONE_BASE_URL` が `https://cybozu.com`（汎用 LP）のまま**だと API が **HTML** を返し、MCP が **`Unexpected token <`** になる。**本番テナント**（例: `https://<tenant>.cybozu.com`、**末尾スラッシュ無し**）へ **`~/.cursor/mcp.json` の `kintone` と `kintone-space`（bash `-lc` 内の export 含む）**を揃える。加えて **`~/.cursor/kintone-space-mcp/index.mjs`** の GET で **`Content-Type: application/json` を付けない**修正（`CB_IL02` 回避）— リポ **`npm run kintone:patch-space-mcp-get-headers`**（WSL・`HOME` 固定）。疎通は **`npm run kintone:probe-space -- 48`**（`.env`）。**Cursor は MCP 子プロセスを再起動**（ウィンドウ再読み込み等）するまで旧コードが残る場合あり。
- **WSL 正本** `~/.cursor/mcp.json` を編集したら Windows へ **`npm run mcp:sync-cursor-windows`**（TSB-028）。

### §RCA — `kintone-space` が HTML／`CB_IL02` になった要因連鎖（2026-05-11 CEO 向け）

1. **二重正本と同期経路の欠落（組織・運用）**: `scripts/sync-cursor-mcp-windows-from-wsl.mjs` は **WSL `~/.cursor/mcp.json` を正本**とし Windows を再生成するが、**`/mnt/c` 非マウント・WSL 未起動**等で **`mcp:sync-cursor-windows` が SKIP**になり得る（`handoff-log` 2026-05-11 追記と同旨）。その状態で **Windows `%USERPROFILE%\.cursor\mcp.json` だけ手編集**すると、**WSL 正本が旧プレースホルダのまま**という **ズレが再発**する（TSB-028 違反パターン）。
2. **プレースホルダ URL の温床（技術）**: 初期例・ドキュの **`https://cybozu.com`** は **JSON として正しいがテナントではない**。REST が **HTML（LP／ログイン）** を返し、MCP が **`Unexpected token <`** と誤解する。**5/7 健康是正**（`handoff-log` §「実施 1」）で **Windows 側 3 箇所は jbis に直した記録**がある一方、**2026-05-11 時点の実ファイルでは再び `cybozu.com` が残存**していた → **その後の復元・別端末コピー・正本未同期のいずれか**で **リグレッション**（証跡は `handoff-log` 1124 vs 実測の矛盾）。
3. **検知ゲートの穴（プロセス）**: **`npm run cio:mcp:env`** の `cio-mcp-quickprobe` は **2026-05-11 まで公式 `@kintone/mcp-server` の initialize のみ**で、**`kintone-space` の実 API（`GET /k/v1/space.json`）は叩いていなかった**。よって **`KINTONE_BASE_URL` 誤りでも SUMMARY 6/6 が緑**になり、**Space 系だけ劣化して長期潜伏**しうる（是正: **`kintone-space.env` のマージ**＋**`kintone:probe-space`** を台帳手順に固定）。
4. **自作 MCP の実装バグ（技術）**: `kintone-space-mcp` が **GET にも `Content-Type: application/json`** を付与 → Cybozu **`CB_IL02`**。利用頻度が低く **本番系結合試験に乗らなかった**ため顕在化が遅れた（是正: リポ **`npm run kintone:patch-space-mcp-get-headers`**）。
5. **IDE プロセス寿命（運用）**: `mcp.json` やサーバー JS を直しても **Cursor が子 MCP を握り直すまで旧挙動**が残る → **Reload Window** 前提（憲法の「実機確認ラベル」と整合）。

**再発防止（最小）**: **WSL と Windows の `KINTONE_BASE_URL` を同一値で突合**（`diff` 相当）→ **`mcp:sync-cursor-windows` が SKIP なら理由をチャット 1 行**→ **`cio:mcp:env` 後に週次またはタスク完了時に `kintone:probe-space -- 48`**（または軽量 `GET /k/v1/app.json`）を **ゲートに追加検討**。

### §Cursor 可用性メモ（2026-05-06 JST / WSL `kintone-ai-lab`）

- **`npm run health-check`（MCP initialize 系）**: `github`・`office-powerpoint` は **WSL から ⏭（Windows 側想定）**、`figma` は **url-only（stdio 対象外）**、それ以外は **✅ initialize OK**（`markdownify`・`deepseek`・`kimi`・`openrouter`・`kintone` 系・`playwright`・`rag` 等）。**`tavily`・`filesystem`・`fetch` は 2026-05-06 に `~/.cursor/mcp.json` から除去済**（`filesystem`／`fetch` は Cursor 標準ツールで代替）。
- **Cursor チャットからの `call_mcp_tool`**: ワークスペース配下の **descriptor**（`~/.cursor/projects/<id>/mcps/<server>/tools/*.json`）に従う。**本番 kintone 書込・長文生成・CVE/ニュース・RAG** はここ経由で起用可。**PR/Issue 操作の `user-github`** は WSL セッションでは使えない設計のため、同種は **`gh` CLI**（認証済）を **第一選択**（浜田合意 2026-05-06）。Windows 上の Cursor は補助。
- **S12 死蔵警告**: 下表の「過去 30 日使用」列は **`npm run mcp-status:refresh-usage`**（`check-mcp-dormancy.mjs` 30 日 JSON）で更新する。**毎週金曜夜・週次反省の直後**の Cursor セッションで **CIO（AI）が定例実行**し、差分があれば **`docs/mcp-status.md` を commit + push** まで行う（浜田合意 2026-05-06／運用確定）。**月次健康診断**・**MCP 追加・削除時**も CIO が表を見直す。**浜田に「npm を実行して」と依頼しない**（Desktop **`＃重要確認事項.txt`**・**READ-07**・**`npm run verify:agent-env`** が **registry 検査まで連鎖**）。
- **O-3 監視スナップ（2026-05-06 JST）**: `npm view` — **`@colorsandfonts/mcp` 1.1.0**、**`@iflow-mcp/markdownify-mcp` 0.0.2**（いずれも registry latest と一致）。**TSB-029**: `mcp.json` の **node フルパス** → `markdownify-mcp/dist/index.js` の **存在確認 OK**（NVM 変更時は TSB-029・`docs/troubleshooting.md` に従い global 再導入＋パス更新）。
- **憲法系 MCP キー（Exa / Brave / Firecrawl / Harness）**: **理想**は **`temp/mcp_keys.env` と `mcp.json` を同値**にしておくこと（新 PC・WSL/Windows 二重正本の復旧用。値は手元でコピーし **git に載せない**）。**`npm run mcp:apply-keys`**（`scripts/apply-mcp-keys-from-env.mjs`）は **env 側が空のキーは上書きしない**（2026-05-06 変更）— 空プレースホルダのまま実行しても **既存の `mcp.json` は消えない**。新規セットアップで env だけ埋めて初回反映、という流れも可。

### 浜田回答メモ（依頼事項 2026-05-06）

| # | 内容 | 決定 |
|---|------|------|
| 2 | WSL での GitHub 操作 | **`gh` CLI** に任せる（`user-github` MCP は WSL では使わない前提を上記に固定） |
| 3 | 「過去30日」欄・鮮度 | **毎週金曜夜の反省の後**に **毎週** 見直しで合意 |
| 4 | Cursor 課金ダッシュボード（スクリーンショット） | **Total 76%**／Auto+Composer **56%**／API **100%**（同梱枠枯渇）／On-demand **$388.51 / $1000**（上限 Fixed **$1000 USD**）— `npm run credit:set 76` で日次記録に反映可（§1-2-4） |
| 5 | Tavily | **削除で OK** → 同日 **`~/.cursor/mcp.json`** および **`C:\Users\…\.cursor\mcp.json`** から除去。`scripts/sync-cursor-mcp-windows-from-wsl.mjs` から **tavily コピー行を削除** |

> **CIO 定例（運用確定）**: 上記 (3) の「過去30日」欄の **再集計・表への反映**は **CIO が金曜・週次反省の直後に必ず実施**。手順正本: **`docs/runbooks/cio-friday-mcp-status-refresh-4ai.md`**。コマンド **`npm run mcp-status:refresh-usage`**（`--dry-run` で差分確認のみも可）。浜田さん側はカレンダーで **タイミング**のみ管理でよい。

---

## 2026-04-28 — 自律エージェント向けルール

- リポに **`.cursor/rules/mcp-tool-discipline.mdc`**（フロントマタは **`alwaysApply: false`**。必要時にルール ON）を追加。`call_mcp_tool` 前の **descriptor（`mcps/<server>/tools/*.json`）必読**・`mcp_auth` を先に単独実行・同一目的では **MCP を curl より優先**する、を **リポ内でも固定**（再宣言として有効）。
- **2026-05-02 追補**: **`.cursor/rules/mcp-server-use-triggers.mdc`（`alwaysApply: false` + `globs`）** … **どの MCP サーバを選ぶか**の 1 行トリガー（CIO×DeepSeek/Kimi/OpenRouter 相談反映）。descriptor 必読は引き続き **mcp-tool-discipline**。
- **2026-05-04 追補**: **デザイン系（Figma）** — 公式リモート MCP または `figma-developer-mcp` の導入手順・使い分けは **`docs/mcp-design-figma.md`**。`~/.cursor/mcp.json` へ追加後、下表に行を足す。
- **2026-05-04 午前追補（CIO 依頼・Kimi/DeepSeek 相談）**: **配色・パレット**用に **`@colorsandfonts/mcp`**（サーバ名 `colors-fonts`）をグローバル＋リポ `.cursor/mcp.json` に追加。**kintone 表のトークン・コントラスト**手順は **`docs/mcp-design-kintone-tables.md`**。
- **2026-05-06 施行**: **`.cursor/rules/ai-agent-tools-constitution.mdc`**（**`alwaysApply: false` + `globs`**）— Exa/Brave/Firecrawl・Linear 相当の課題管理・Puppeteer・Mintlify/Harness・秘密禁止・有料大量取得前の確認。**§7** — PR/deploy 前など区切りで **`[憲法適合]`** 1 行の自己宣言。**`mcp-server-use-triggers.mdc`** に調査系 1 行トリガーを追補。
- **2026-05-06 追補（多AI）**: 同憲法 **§0.5** — **CIO 体制の中**で第1者が第2視点を補強するため、他AI（DeepSeek/Kimi/OpenRouter 等）との**協議を積極推奨**（第2者・GO の憲法定義は不変）。**`constitution-brief-card.mdc`** の CIO 2 者の直後にポインタを追加。
- **2026-05-06 追補（フロント MCP）**: **`shadcn-ui`**（`@jpisnice/shadcn-ui-mcp-server`）— UI コンポーネント時は **必ず参照**。**`chrome-devtools`**（`chrome-devtools-mcp`）— FE 修正・バグ調査で **実レンダリング／コンソール**の事実確認。運用正本 **`.cursor/rules/mcp-frontend-shadcn-chrome.mdc`**（**`alwaysApply: false` + FE 系 `globs`**）。WSL `~/.cursor/mcp.json` 変更後は **`cd ~/kintone-ai-lab && npm run mcp:sync-cursor-windows`**（TSB-028）。
- **2026-05-02 §57-10 連動**: RAG 正本 4 ファイルの `.rag/extra-docs` ミラー＝`npm run rag:mirror:canonical-docs` / `verify:rag-mirror-canonical`（`verify:agent-env` 連鎖）。憲法・索引の実体はルート正本（§2）。

### 表の鮮度（2026-04-28）

- **「過去 30 日使用」列**: **毎週金曜・反省直後**に CIO が **`npm run mcp-status:refresh-usage`** で transcript ベース再集計（冒頭 **最終更新** 行の脚注も更新）。**追加・削除・再有効化**や **月次健康診断**のタイミングでも随時実行可。
- **「次回再評価」列**: 手動メモ。**自動再集計はしない**。MCP の **追加・削除・再有効化**をしたとき、または **月次健康診断**のタイミングで、行ごとに見直す。

---

## 📋 MCP 一覧（基準 16 本 + 追記枠／上記「表の鮮度」参照）

| # | MCP | 状態 | 過去 30 日使用 | 主役割 | 次回再評価 |
|---|---|---|---|---|---|
| 1 | github | ⏭ Win-skip | 0 回（exempt） | GitHub Issue/PR 操作 (Win 起動必要) | 5/16（サブエージェント PoC 再議論時）|
| 2 | cyber-news | ✅ active | **4 回** | サイバーセキュリティニュース取得 | 5/1（月次健康診断）|
| 3 | office-powerpoint | ⏭ Win-skip | 0 回（exempt） | PPT 自動生成 (Win 起動必要) | 5/13 後（本番運用後の月次レポート用検討）|
| 4 | ~~google-search~~ → **duckduckgo-search** | ✅ active (4/23 21:35 入替 / TSB-015 解消) | **1 回** | DuckDuckGo Web 検索 (uvx duckduckgo-mcp-server / Bing ベース / DDG_REGION=jp-ja / API key 不要 / bot 検知緩) | 5/1 月次巡回 + 必要時随時 |
| 5 | ~~filesystem~~ | 🗑 **削除済 2026-05-06** | — | （除去）`~/.cursor/mcp.json` から除去・Cursor 標準 Read／WSL で代替 | — |
| 6 | memory | ✅ **active 化済** | **8 回** | セッション横断記憶 (現在 10 entities + 11 relations) | PC 台帳 PJ で実戦投入後判断（5/13 頃）|
| 7 | ~~fetch~~ | 🗑 **削除済 2026-05-06** | — | （除去）Cursor **WebFetch**／`user-fetch` で代替 | — |
| 8 | sequential-thinking | ✅ active | **7 回** | 段階的思考 | PC 台帳 PJ で実戦投入後判断 |
| 9 | **kintone (公式)** | ✅ active | **72 回** | kintone API CRUD | 5/13 後（本番運用後）|
| 10 | **kintone-dev (自作)** | ✅ active | 0 回（exempt） | API 仕様参照 (アプリ作成 MCP ではない / 4/23 早朝訂正済) | **4/26 PC 台帳 Day 4 後判断** |
| 11 | **kintone-space (自作)** | ✅ active | 0 回（exempt） | kintone スペース操作 | **4/24 環境設定マスタ作成時に実戦投入予定** |
| 12 | ~~tavily~~ | 🗑 **削除済 2026-05-06** | 0 回（削除済） | （除去）Web 検索は **duckduckgo-search** | — |
| 13 | playwright | ✅ active (4/23 21:30 Chrome 147.0.7727.116 install + 実 call 動作確認済) | **23 回** | ブラウザ自動操作 / E2E | 4/26 PC 台帳 customize テスト時 |
| 14 | cve-search | ✅ **active 化済** | 0 回（exempt） | CVE 脆弱性検索 | 5/1（月次セキュリティ巡回時 / S14）|
| 15 | rag | ✅ **強化済** | **1 回** | LanceDB ローカル RAG (現在 76 docs / 3429 chunks) | **§50 + §21 強化（R24/R25）後再評価 / 4/30 判断** |
| 16 | accessibility-scanner | ✅ active (4/23 21:30 同 Chrome で実 call 動作確認済) | 0 回（exempt） | アクセシビリティ検査 | 4/26 PC 台帳 customize 時 |
| 17 | **figma（公式 remote MCP）** | ✅ **global + リポ**に `url` 追記済（2026-05-04）／初回 OAuth | 0 回（exempt） | 表・ダッシュの **配色・タイポ・間隔・レイアウト**を Figma から取得し実装に反映 | **`docs/mcp-design-figma.md`**／Figma プランの rate limit に注意 |
| 18 | **figma-developer-mcp**（任意） | **📋 PAT 要・stdio** | — | 上記の代替（npm `figma-developer-mcp`） | 同上／§17-3 で **npx 絶対 path** |
| 19 | **colors-fonts**（`@colorsandfonts/mcp`） | ✅ **global + リポ**（Node v24 `npx` 絶対 path／pin `1.1.0`） | 0 回（exempt） | **パレット生成**・**WCAG/APCA コントラスト**・CSS/Tailwind/**Figma トークン JSON** 出力（Figma 無しでも表配色のたたき台） | **`docs/mcp-design-kintone-tables.md`**／`call_mcp_tool` 前は descriptor 必読 |

### 凡例
- ✅ active: 正常稼働 / 利用可能
- ⏭ Win-skip: WSL から疎通不可 / Windows 側でのみ稼働
- ⏸ disabled: mcp.json で `disabled: true`

### 🌟 本日 (4/23) のレベルアップ実績
1. **rag**: TSB-012 修復 (commit `122ea4f`) → documentCount 0 → **76** / chunkCount → **3429** / hybrid mode 安定稼働
2. **memory**: 0 → **10 entities + 11 relations** (TSB-007 ep5 / auto-heal 自爆 / 朝 cron 結果 / S14 修復 / 戦略書 v1 全部 graph 化)
3. **cyber-news**: 早朝 list_feeds 確認 → 20:11 vulnerabilities カテゴリ実戦投入 (10 件取得 / CVE-2026-33825 Defender 発見)
4. **cve-search**: 早朝 db_status 確認 → 20:14 vul_last_cves + vul_cve_search 実戦投入 (eslint 0 件 + Defender 詳細取得)
5. **§50 MCP Recall Ritual** (R24) を AGENTS.md に早期適用 → AI のタスク開始時 30 秒チェック義務化

---

## ⏸ disabled の経緯記録

### tavily（**削除済 2026-05-06** / 浜田合意）
- **最終状態**: `mcp.json` から **エントリ除去**（WSL グローバル + Windows 同期先の両方）。`sync-cursor-mcp-windows-from-wsl.mjs` は **tavily を出力しない**。
- **経緯要約**: 2026-04-23 時点で `disabled: true`（課金回避・duckduckgo-search 代替）→ 2026-05-06 **完全削除**で確定。

---

## 📋 残 dormant MCP の活性化方針 (4/23 20:25 制定)

### Tier 1: 4/26 PC 台帳作成期間で実戦投入予定
- **kintone-space** (Day 1-4): スペース 21 配置・権限管理時
- **kintone-dev** (Day 1-4): API 仕様参照時 (search_field_types / get_api_endpoint 等)
- **playwright** (Day 4): customize 動作確認 + 視覚自己検診 (§26)
- **accessibility-scanner** (Day 4): WCAG 2.1 AA 検証 (§27)

### Tier 2: 月次 cron で活性化予定
- **cyber-news + cve-search**: S14 月次セキュリティ巡回 (5/1 開始予定 / cron 登録は 4/30 夜手動)
- **rag**: 朝 cron で再 ingest + R25/R26 で ingest 儀式強化 (4/24 朝 cron 適用)

### Tier 3: 即時活性化トリガー (R24 §50 で義務化)
- **（旧 fetch MCP）**: 公式 docs 取得は **Cursor 標準 WebFetch**／`user-fetch`（MCP）で代替
- **duckduckgo-search**: Web 検索（「○○ 仕様」「○○ 既知バグ」検索時）
- **sequential-thinking**: 大型設計判断時 (例: 4/26 PC 台帳 customize 設計の分解)
- **memory**: 重要決定 / TSB 検出時に entities + relations 追加

### Tier 4: 削除候補
- ~~**filesystem**~~: **2026-05-06 削除済**（`~/.cursor/mcp.json` から除去・Windows 同期スクリプト追従）
- ~~**fetch**~~: **2026-05-06 削除済**（同上）
- ~~**tavily**~~: **2026-05-06 削除済**（上記）
- **github / office-powerpoint**: WSL 側では使えない / 削除可だが Win 側で使う日のため残置

---

## 🚨 平文認証問題（2026-04-23 検出 / 次元 4）

### 該当 MCP
- `kintone`: env.KINTONE_PASSWORD = `kent2511` (平文)
- `kintone-space`: env.KINTONE_PASSWORD = `kent2511` (平文)

### リスク
1. `cat ~/.cursor/mcp.json` で誰でも閲覧可能
2. mcp.json バックアップ（`backups/mcp/`）が git tracked になったら漏洩
3. cron ログ等への引きずり

### 対策段階
- **段階 1（即時 / 4/24 朝 cron 適用）**: `backups/mcp/` を `.gitignore` 追加（次元 4 改善案 C）
- **段階 2（5 月以降）**: Cursor MCP env 解決仕様調査 + `.env` 経由化（次元 4 改善案 A）

---

## 📈 月次健康診断（5/1 開始予定）

### 集計項目
1. 各 MCP の過去 30 日使用回数（agent-transcripts grep）
2. 各 MCP の接続健全性（health-check.mjs）
3. 各 MCP の応答時間（次元 5 / S12 で実装予定）
4. 死蔵警告（連続 30 日 0 回 = ⚠ 表示 / 次元 2 / S12）

### 判断材料
- 2 ヶ月連続 0 回 = 削除候補昇格
- 急に使用増加 = 「なぜ今増えたか」を §44 夕反省で記録
- 障害連続発生 = 安定性レビュー

---

## 🔗 関連

- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md`
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md`
- 戦略書: `docs/plans/2026-04-23-mcp-strategy-v1.md`
- セキュリティ巡回 v0 (4/23 試走): `docs/reports/2026-04-23-security-rounds-v0.md`
- AGENTS.md §17 / §20 / §21 / §22 / §23 / §24 / **§50** (4/23 早期適用済)
- 健康診断: `scripts/health-check.mjs`
- バックアップ: `scripts/backup-mcp.sh`
- 災害復旧: `scripts/restore-mcp.sh` / `docs/mcp-disaster-recovery.md`
