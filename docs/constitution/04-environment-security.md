# 環墁E�EMCP 設定�EセキュリチE���E�§16〜§18�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: WSL/Windows・mcp.json 変更  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§16 WSL/Win・§17 mcp.json 手頁E�E§18 秘寁E��報、E

## ぁE��読む�E�チェチE��リスト！E

- mcp.json 編雁E
- パス変更
- 認証惁E��

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第4章 環墁E�EクロスプラチE��フォーム

### §16 WSL/Windows の使ぁE�EぁE
`.bat` / `.cmd` は Write/StrReplace 禁止。Shell + printf + CRLF で書く！Ewindows-cross-platform.mdc`�E�、E

### §16-1 浜田個人開発端末�E�摩擦最小化�E�！E026-04-27 制宁E/ 浜田持E��「個人のわたし�EPCです�Eで基本なんでもしてぁE��よ」！E

**前提**: 本リポを主に扱ぁE**浜田の個人 PC およびそ�E上�E個人 WSL** は、E*共有端末・職場貸与端末・多人数同一ログイン**ではなぁE��提とする�E�別マシン・別アカウント�E別絁E���E環墁E��本リポを開いたとき�E **本条を�E動適用しなぁE*�E�、E

**AI の扱ぁE*:

1. **憲法級�E禁止・要確認�E維持E*: Tier B・本番 kintone の書込・deploy・§52-8 高リスク shell・§57 憲法改定�E秘寁E��報の不忁E��な再掲・§35-1 / §56-1a の送E��等、E*既存条斁E�� GO また�E手頁E��義務付けられてぁE��も�E**は、本条により免除されなぁE��E
2. **ローカル専用の前準備は自律可**: 上記�E篁E��冁E��、E*当該端末に閉じた効果�Eみ**を持つ作業�E�侁E ユーザー crontab への `npm run session:clock:install-cron`、NVM / 環墁E��数 `KINTONE_AI_LAB_NODE` の明示、WSL での `cron` サービス起動確認、`npm run session:notify-selftest`、ローカルログ整備、リポ�E `npm run` による検証�E��E、E*毎回の浜田事前許可を征E��ずに実施してよい**。実施しためE**§37 に準じた一行報呁E*で足りる�E�チャチE��が無ぁE��合�EコミットメチE��ージ・`checkpoint-latest.md` 等に残すことで代替可�E�、E

**禁止の誤解釁E*:

- 「個人 PC だから」と **他老E��ータ・共有サービス・会社承認なき本番**へ手を伸ばすことは本条の趣旨に含めなぁE��E

### §17 MCP 設定変更の安�E手頁E
`~/.cursor/mcp.json` を変更する際�E最小差刁E��し、秘寁E��ログに出さなぁE��変更後�E JSON-RPC ハンドシェイクチE��トで動作確認する、E

### §17-2 mcp.json 編雁E�E最小差刁E��頁E(2026-04-23 制宁E/ TSB-015 反省 / `ensure_ascii=False` 副作用教訁E

**背景**: 2026-04-23 TSB-015 の duckduckgo-search 入替時、Python の `json.dump(d, f, ensure_ascii=False)` を使ったため、既存�E Unicode escape (`\u6848\u4ef6\u7ba1\u7406` 筁E ぁEUTF-8 生表訁E(`案件管琁E) に変換され、想定外�E差刁E��発生しぁE(機�E等価だが浜田が後で diff を見て混乱する)、E

**忁E���E宁E(mcp.json 編雁E��)**:

1. **編雁E��バックアチE�E義勁E* (二重保�E):
   - `bash scripts/backup-mcp.sh` (公弁Ebackup ↁE`backups/mcp/<YYYYMMDD-HHMMSS>/`)
   - inline backup: `cp ~/.cursor/mcp.json ~/.cursor/mcp.json.bak-<コンチE��スチE-<UTC>` (即晁Erollback 用)

2. **編雁E��Ediff 取得義勁E*:
   - `diff <inline_backup> ~/.cursor/mcp.json` で忁E��差刁E��要E
   - 想定外�E変更 (フォーマット変化 / 並び頁E��化 / Unicode escape ↁEUTF-8 変換 筁E があれ�E**即 rollback + 再実衁E*

3. **Python での編雁E��ール** (該当時):
   - `json.dump(d, f, indent=2)` のみ (`ensure_ascii` は **default = True** のまま使ぁE/ 既存形式維持E
   - `json.dump(d, f, ensure_ascii=False)` は Unicode escape を破壊する�Eで**禁止**
   - 末尾改行�E允E��ァイルに合わせる (允E��ァイルが末尾改行なしなら追加しなぁE

4. **JSON-RPC ハンドシェイクチE��ト後実施**:
   - 編雁E��E`python3 -c "import json; json.load(open('~/.cursor/mcp.json'))"` で構文 OK 確誁E
   - Cursor 再起勁E(新 MCP 追加晁E/ command 変更晁E
   - AI 側で宁Ecall チE��チE(§11-5 段階的検証 3 段階すべて)

**違反晁E(最小差刁E��外�E変更が混入した状態でコミッチE**:
- §17 違反として TSB 化候裁E
- 浜田が後で diff を見て混乱した実侁E= 本ルールの制定契橁E

**実侁E(2026-04-23 TSB-015)**:
- ❁ENG: `json.dump(d, f, ensure_ascii=False)` で書ぁE�� diff 取ったら filesystem path ぁEUTF-8 化してぁE��
- ✁EOK (rollback 征E: `json.dump(d, f, indent=2)` (ensure_ascii default) で書ぁE�� diff = google-search 削除 + duckduckgo-search 追加のみ

### §17-3 mcp.json の command 設宁E 絶対 path 標準化 (2026-04-23 制宁E/ TSB-013 v2 真因対策�E標準化)

**背景**: 2026-04-23 TSB-013 v2 で cron 環墁E�� `~/.local/bin` めEPATH に含まなぁE��め、cve-search の `command: "uv"` が起動失敁E(`exit=null`) ぁE❁E誤検知が�EてぁE��。健康チェチE��側の PATH 拡張で対痁E��法しぁE(commit `21ef26a`) が、根本対策�E **mcp.json 側で絶対 path を指定すること**、E

**忁E���E宁E(新要EMCP 追加晁E/ 既孁EMCP 修正晁E**:

1. **絶対 path 推奨パッケージ起動コマンチE*:
   - `uv` / `uvx` 系 ↁE`/home/<user>/.local/bin/uv` また�E `/home/<user>/.local/bin/uvx` (絶対 path)
   - `npx` 系 ↁE`/home/<user>/.nvm/versions/node/v24.14.1/bin/npx` (絶対 path / また�E `command` を使ぁE�Eで PATH 渡ぁE
   - `python` / `python3` 系 ↁE`/usr/bin/python3` (シスチE��標溁E/ 仮想環墁E��めEvenv の絶対 path)

2. **PATH 依孁E= アンチパターン** (一見動くが cron / 別シェル / NVM 刁E��時に失敁E:
   - ❁ENG: `"command": "uv"` (PATH 依孁E
   - ✁EOK: `"command": "/home/mhamada202408224/.local/bin/uv"` (絶対 path)

3. **既孁EMCP も頁E��絶対 path 化推奨** (4/24 朝以陁E/ 月次 MCP 健康診断時に判断):
   - 現状 `command: "npx"` / `command: "uv"` のも�Eを頁E��絶対 path に置き換ぁE(proposal 経由 / TSB-006 ガード�E宁E= 1 commit ≤5 ファイル)
   - 影響篁E��: cron / WSL 別ターミナル / 別シェルから MCP を呼ぶ場合に効ぁE/ Cursor 冁E��は既存形式でも動ぁE

4. **検証義勁E(§11-5 段階的検証 3 段隁E**:
   - ① Cursor 経由で宁Ecall ✁E(Cursor 起動時に PATH 通ってぁE��ケースが多い / 忁E��最封E
   - ② 手動 bash で MCP probe (侁E `health-check.mjs`)
   - ③ env -i + cron PATH で MCP probe (cron 環墁E�E現 = 真�E絶対 path 動作確誁E

**違反 (PATH 依存�E command 持E��で cron で失敗を起こす)**:
- TSB 化候裁E(TSB-013 v2 と同型)
- 浜田から「cron で動かなぁE��と持E��されたら本ルール再発勁E

**実侁E*:
- ❁ENG (TSB-013 検�E晁E: `"cve-search": { "command": "uv", ... }` ↁEcron で uv not found
- ✁EOK (TSB-015 採用 / 新規追加時に絶対 path で予防): `"duckduckgo-search": { "command": "/home/mhamada202408224/.local/bin/uvx", ... }`

### §18 セキュリチE��
API ト�Eクン・パスワード�E鍵を回答に不忁E��に再掲しなぁE��設定例�Eプレースホルダで示す、E

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

