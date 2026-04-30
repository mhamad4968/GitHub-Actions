# 🌅 朝のブリーフィング — 2026-04-18 (Sat) 16:23

> 本ファイルは `scripts/daily-morning-prep.mjs` が毎朝 06:00（WSL cron）に自動生成しています。
> AI エージェントは WORKFLOW.md §Phase 0 に従い、最初にこのファイルを読みます。

---

## 📋 昨夜承認分の自動実施結果

_(承認済み案件なし)_

---

## 1. 環境ヘルス（kintone API 疎通）

### ✅ npm run kintone:test

```text
[ok] app 594: PC管理台帳ver.2
[ok] app 595: 社員情報マスタ
[ok] app 626: アカウント採番アプリ
[ok] app 627: アカウント管理台帳
[kintone:test] PC台帳スタック疎通 OK
```

## 2. 静的解析（ESLint）

### ✅ npm run lint:customize

```text
(出力なし)
```

## 3. セキュリティ（npm audit）

### ✅ npm audit

```text
found 0 vulnerabilities
```

## 4. 依存パッケージの最新性（npm outdated）

```text
Package  Current   Wanted  Latest  Location              Depended by
dotenv    17.4.0   17.4.2  17.4.2  node_modules/dotenv   kintone-ai-lab
globals  15.15.0  15.15.0  17.5.0  node_modules/globals  kintone-ai-lab
```

## 5. ルール整合性（AGENTS.md ↔ RULES-INDEX.md / WORKFLOW.md）

## ルール整合性チェック

- AGENTS.md 定義: §1 / §2 / §3 / §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §12 / §13 / §14 / §15 / §16 / §17 / §18 / §19 / §20 / §21 / §22 / §23 / §24 / §25 / §26 / §27 / §28 / §29 / §30 / §31 / §32 / §33 / §34 / §35 / §36 / §37 / §38 / §39 / §41 / §42 / §43 / §44
- ⚠️ RULES-INDEX.md: 存在しません
- WORKFLOW.md: 18 個の §N 参照

✅ 破断リンクなし（参照されている §N はすべて AGENTS.md に存在）
⚠️ 未参照ルール: §3 / §4 / §6 / §7 / §8 / §10 / §12 / §13 / §16 / §17 / §18 / §20 / §22 / §23 / §24 / §25 / §27 / §28 / §29 / §31 / §34 / §35 / §36 / §38 / §39 （定義のみで参照なし）

## 6. 未完了プラン抽出（docs/plans/*.md）

## 未完了タスク（docs/plans/）

> **4 件の未完了項目を 1 ファイルから検出**

### 2026-04-18-skysea-installer.md

- L87: - [ ] kintone 594 から「現役PC」の PC_name 一覧を抽出する集計スクリプトの雛形（即実装可）
- L88: - [ ] PowerShell スクリプト雛形（突合 → 起動確認 → リモートインストール → 結果CSV）
- L89: - [ ] kintone 594 にフィールド追加案：
- L93: - [ ] 「📌 SKYSEA未導入」トグルを 594 検索パネルに追加する設計案（既存トグル群と同じ枠で）

## 7. RAG 知識ベース更新

### ✅ RAG ingest

```text
^

Error [ERR_REQUIRE_ESM]: require() of ES Module /home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/@exodus/bytes/encoding-lite.js from /home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js not supported.
Instead change the require of encoding-lite.js in /home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js to a dynamic import() which is available in all CommonJS modules.
    at Object.<anonymous> (/home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js:2:41)
    at Object.<anonymous> (/home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/jsdom/lib/api.js:6:27) {
  code: 'ERR_REQUIRE_ESM'
}

Node.js v20.18.2
                                        ^

```

## 8. kintone-apps.md 直近の更新履歴（末尾 5 行）

```text
| 2026-04-18 | 「保留中の整理候補（コード参照ゼロの扱い方針）」サブ章を追加。A: ユーザー入力専用フィールド10件は全件保持を明記、B: backfill-* 6本にONESHOT_CONFIRMガードを実装し保管方針を記録、C: UI文言改善候補4件は別途相談中として保留 |
| 2026-04-18 | **C-4**: 627 印刷帳票（`open627SystemInfoPrintWindow`）に `account_type` 別テーマ（個人=緑/共有=ローズ）と「全セル空段の自動省略」を実装。`isPrint627CellEmpty` で `----` `---` `ー` `—` 等のハイフン系手入力プレースホルダも「実質空」と判定（データには触れず印刷見た目のみで吸収）。バッジを「ACCOUNT LEDGER」固定 → 種別表示に変更。プレビュー用に `scripts/preview-c4-print.mjs` を追加（ローカル `tmp/c4-preview/` に HTML 出力）。`tmp/` を `.gitignore` 追加。BUILD: `2026-04-18-v3` / `v3.1`（revision 132）|
| 2026-04-18 | **関連アプリ横並び小ナビ**を 4 アプリ（**668 / 595 / 594 / 627**）の一覧／詳細／作成／編集の各画面ヘッダー領域に常駐表示。文字リンクのみ（11px・控えめ配色）、現在のアプリは「（このアプリ）」表記でグレーアウト、それ以外は新規タブで `/k/<id>/` を開く。`kintone.app.record.getHeaderMenuSpaceElement()` → fallback `kintone.app.getHeaderMenuSpaceElement()` の順で挿入スロットを取得。0/400/1000ms の遅延リトライで安定マウント。BUILD: 627=`v4` / 594=`v482`(revision 483) / 595=`v1`(revision 69) / 668=`v1`(revision 21) |
| 2026-04-18 | **668 の関連ナビは撤去**（v6, revision 26）。668 はガイド shell（`📌 主要メニュー` バー）が既に PC管理台帳 / アカウント台帳 / 社員マスタ など同じリンクを保持しており機能重複。各種挿入スロット（shell内／shell前／getHeaderSpaceElement）でクリッピングや視認性問題が解消できなかったため、二重ナビを廃止して📌 主要メニューに集約。594/595/627 の関連ナビは継続。**668 一覧のレコード行非表示**は `<style>` 注入＋0/200/600/1200/2400ms リトライで強化（v2, revision 22 で導入） |
| 2026-04-18 | **作業 OS を制定**: `WORKFLOW.md`（Phase 0-5: 文脈獲得→事前調査→設計→実装→検証→記録）と `AGENTS.md §43`（WORKFLOW.md 遵守義務）を新設。**毎朝 06:00 WSL cron** で `scripts/daily-morning-prep.mjs` がブリーフィングを `docs/reports/<日付>-morning-prep.md` に自動生成（kintone:test / lint / npm audit / npm outdated / `audit-rules.mjs`(AGENTS.md↔WORKFLOW.md 整合性) / `scan-plans.mjs`(`docs/plans` 未完了抽出) / RAG 再ingest / kintone-apps.md 末尾 / 推奨スタート手順 / ヘルススコア）。AI は Phase 0 で必ずこのファイルを最初に読み宣言してから着手する。cron は NVM 絶対パス (`~/.nvm/versions/node/v24.14.1/bin/node`) で登録され Cursor 停止中でも動作。npm: `morning:prep` / `morning:install-cron` / `morning:remove-cron` / `morning:dry-run` / `audit-rules` / `scan-plans`。初回手動実行ヘルススコア: **6/6 合格** |
```

---

## 🚀 今日の推奨スタート手順

### 直近の計画ファイル（3 件）

- `docs/plans/2026-04-18-skysea-installer.md` （更新: 2026-04-18 04:35）

**AI への指示例**:
```
「2026-04-18-skysea-installer.md の続きを進めて」
```

---

## 🔍 ヘルススコア

**7 / 7 合格**

- ✅ apply-approved-changes
- ✅ kintone:test
- ✅ lint:customize
- ✅ npm audit
- ✅ audit-rules
- ✅ scan-plans
- ✅ RAG ingest
