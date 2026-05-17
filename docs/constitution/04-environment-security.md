# 環境・MCP 設定・セキュリティ（§16〜§18）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: WSL/Windows・mcp.json 変更  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`---

## 30秒要約（Phase 2）

§16 WSL/Win・§17 mcp.json 手順・§18 秘密情報。

## いつ読む（チェックリスト）

- mcp.json 編集
- パス変更
- 認証情報

## 条文本文（AGENTS 抽出・削除禁止）

> 以下は `AGENTS.md` からの抽出コピー。**省略・削除しない**。解釈疑義は `AGENTS.md` 正本。

## 第4章 環境・クロスプラットフォーム

### §16 WSL/Windows の使い分け
`.bat` / `.cmd` は Write/StrReplace 禁止。Shell + printf + CRLF で書く（`windows-cross-platform.mdc`）。

### §16-1 浜田個人開発端末（摩擦最小化）（2026-04-27 制定 / 浜田指示「個人のわたしのPCですので基本なんでもしていいよ」）

**前提**: 本リポを主に扱う **浜田の個人 PC およびその上の個人 WSL** は、**共有端末・職場貸与端末・多人数同一ログイン**ではない前提とする（別マシン・別アカウント・別組織の環境で本リポを開いたときは **本条を自動適用しない**）。

**AI の扱い**:

1. **憲法級の禁止・要確認は維持**: Tier B・本番 kintone の書込・deploy・§52-8 高リスク shell・§57 憲法改定・秘密情報の不必要な再掲・§35-1 / §56-1a の逆転等、**既存条文で GO または手順が義務付けられているもの**は、本条により免除されない。
2. **ローカル専用の前準備は自律可**: 上記の範囲内で、**当該端末に閉じた効果のみ**を持つ作業（例: ユーザー crontab への `npm run session:clock:install-cron`、NVM / 環境変数 `KINTONE_AI_LAB_NODE` の明示、WSL での `cron` サービス起動確認、`npm run session:notify-selftest`、ローカルログ整備、リポ内 `npm run` による検証）は、**毎回の浜田事前許可を待たずに実施してよい**。実施したら **§37 に準じた一行報告**で足りる（チャットが無い場合はコミットメッセージ・`checkpoint-latest.md` 等に残すことで代替可）。

**禁止の誤解釈**:

- 「個人 PC だから」と **他者データ・共有サービス・会社承認なき本番**へ手を伸ばすことは本条の趣旨に含めない。

### §17 MCP 設定変更の安全手順
`~/.cursor/mcp.json` を変更する際は最小差分とし、秘密をログに出さない。変更後は JSON-RPC ハンドシェイクテストで動作確認する。

### §17-2 mcp.json 編集の最小差分手順 (2026-04-23 制定 / TSB-015 反省 / `ensure_ascii=False` 副作用教訓)

**背景**: 2026-04-23 TSB-015 の duckduckgo-search 入替時、Python の `json.dump(d, f, ensure_ascii=False)` を使ったため、既存の Unicode escape (`\u6848\u4ef6\u7ba1\u7406` 等) が UTF-8 生表記 (`案件管理`) に変換され、想定外の差分が発生した (機能等価だが浜田が後で diff を見て混乱する)。

**必須遵守 (mcp.json 編集前)**:

1. **編集前バックアップ義務** (二重保全):
   - `bash scripts/backup-mcp.sh` (公式 backup → `backups/mcp/<YYYYMMDD-HHMMSS>/`)
   - inline backup: `cp ~/.cursor/mcp.json ~/.cursor/mcp.json.bak-<コンテキスト>-<UTC>` (即時 rollback 用)

2. **編集後 diff 取得義務**:
   - `diff <inline_backup> ~/.cursor/mcp.json` で必ず差分目視
   - 想定外の変更 (フォーマット変化 / 並び順変化 / Unicode escape ↔ UTF-8 変換 等) があれば**即 rollback + 再実行**

3. **Python での編集ルール** (該当時):
   - `json.dump(d, f, indent=2)` のみ (`ensure_ascii` は **default = True** のまま使う / 既存形式維持)
   - `json.dump(d, f, ensure_ascii=False)` は Unicode escape を破壊するので**禁止**
   - 末尾改行は元ファイルに合わせる (元ファイルが末尾改行なしなら追加しない)

4. **JSON-RPC ハンドシェイクテスト後実施**:
   - 編集後 `python3 -c "import json; json.load(open('~/.cursor/mcp.json'))"` で構文 OK 確認
   - Cursor 再起動 (新 MCP 追加時 / command 変更時)
   - AI 側で実 call テスト (§11-5 段階的検証 3 段階すべて)

**違反時 (最小差分以外の変更が混入した状態でコミット)**:
- §17 違反として TSB 化候補
- 浜田が後で diff を見て混乱した実例 = 本ルールの制定契機

**実例 (2026-04-23 TSB-015)**:
- ❌ NG: `json.dump(d, f, ensure_ascii=False)` で書いて diff 取ったら filesystem path が UTF-8 化していた
- ✅ OK (rollback 後): `json.dump(d, f, indent=2)` (ensure_ascii default) で書いて diff = google-search 削除 + duckduckgo-search 追加のみ

### §17-3 mcp.json の command 設定: 絶対 path 標準化 (2026-04-23 制定 / TSB-013 v2 真因対策の標準化)

**背景**: 2026-04-23 TSB-013 v2 で cron 環境が `~/.local/bin` を PATH に含まないため、cve-search の `command: "uv"` が起動失敗 (`exit=null`) し ❌ 誤検知が出ていた。健康チェック側の PATH 拡張で対症療法した (commit `21ef26a`) が、根本対策は **mcp.json 側で絶対 path を指定すること**。

**必須遵守 (新規 MCP 追加時 / 既存 MCP 修正時)**:

1. **絶対 path 推奨パッケージ起動コマンド**:
   - `uv` / `uvx` 系 → `/home/<user>/.local/bin/uv` または `/home/<user>/.local/bin/uvx` (絶対 path)
   - `npx` 系 → `/home/<user>/.nvm/versions/node/v24.14.1/bin/npx` (絶対 path / または `command` を使う側で PATH 渡す)
   - `python` / `python3` 系 → `/usr/bin/python3` (システム標準 / 仮想環境なら venv の絶対 path)

2. **PATH 依存 = アンチパターン** (一見動くが cron / 別シェル / NVM 切替時に失敗):
   - ❌ NG: `"command": "uv"` (PATH 依存)
   - ✅ OK: `"command": "/home/mhamada202408224/.local/bin/uv"` (絶対 path)

3. **既存 MCP も順次絶対 path 化推奨** (4/24 朝以降 / 月次 MCP 健康診断時に判断):
   - 現状 `command: "npx"` / `command: "uv"` のものを順次絶対 path に置き換え (proposal 経由 / TSB-006 ガード遵守 = 1 commit ≤5 ファイル)
   - 影響範囲: cron / WSL 別ターミナル / 別シェルから MCP を呼ぶ場合に効く / Cursor 内では既存形式でも動く

4. **検証義務 (§11-5 段階的検証 3 段階)**:
   - ① Cursor 経由で実 call ✅ (Cursor 起動時に PATH 通っているケースが多い / 必須最小)
   - ② 手動 bash で MCP probe (例: `health-check.mjs`)
   - ③ env -i + cron PATH で MCP probe (cron 環境再現 = 真の絶対 path 動作確認)

**違反 (PATH 依存の command 指定で cron で失敗を起こす)**:
- TSB 化候補 (TSB-013 v2 と同型)
- 浜田から「cron で動かない」と指摘されたら本ルール再発動

**実例**:
- ❌ NG (TSB-013 検出時): `"cve-search": { "command": "uv", ... }` → cron で uv not found
- ✅ OK (TSB-015 採用 / 新規追加時に絶対 path で予防): `"duckduckgo-search": { "command": "/home/mhamada202408224/.local/bin/uvx", ... }`

### §18 セキュリティ
API トークン・パスワード・鍵を回答に不必要に再掲しない。設定例はプレースホルダで示す。

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

