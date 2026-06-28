# 夕反省 — 2026-06-28（NAS管理台帳 kintone 化）

> **スコープ**: AI の失敗とミス削減案のみ（`docs/runbooks/evening-reflection-scope.md`）

---

## 1. 本日の失敗・手戻り

| # | 事象 | 原因 | 影響 |
|---|------|------|------|
| F1 | Excel 移行初回 **22 件・列ずれ** | SheetJS と openpyxl の列 index 差（組織名 1 列ずれ）を初回 migrate 前に実データ POST で検証不足 | 不正データ投入 → 修正後再移行 |
| F2 | `verify-kintone-live-schema` 後 **Node UV assertion crash**（Windows） | 検証 OK 後のプロセス終了時クラッシュ | deploy 時 `SKIP_CIO_LIVE_SCHEMA_GUARD=1` 依存 |
| F3 | 設備なし行 **設置先・状態** の表記ブレ | 仕様 `-` と UI「－」の混在、プレースホルダ初期値が組織名同値 | 浜田指摘 2 回 → PATCH スクリプト追加 |
| F4 | 状態 `-` → `－` の kintone PATCH **CB_VA01** | preview フォーム更新後 **deploy 前**に live レコード PUT | 2 段 deploy 手順で解決 |
| F5 | BUILD 名の乱立 | 細かい UI 修正ごとに BUILD  suffix 追加 | 浜田「purchase-fields BUILD 削除」指摘 → v1 に統一 |
| F6 | 中間 BUILD が画面に残るリスク | 再 deploy 前のキャッシュ・BUILD 文字列管理 | 最終 BUILD 統一で解消 |

---

## 2. 明日以降の改善提案（承認待ち）

| ID | 提案 | 優先 | 工数 | 承認 |
|----|------|------|------|------|
| **P1** | NAS 移行に **dry-run → 件数/先頭3件/末尾1件の自動 assert**（23 件・組織名非空）を `nas-ledger-migrate-xlsx.mjs` 必須化 | 高 | 小 | ☐ 承認 / ☐ 却下 |
| **P2** | `verify-kintone-live-schema` Windows UV crash を **TSB 登録**し、deploy ガード skip を「証跡必須＋代替 verify」に限定 | 高 | 中 | ☐ 承認 / ☐ 却下 |
| **P3** | 仕様書 §2/§6.4 に **「－」= 全角（状態・空欄表示）／設置先 DB 値 `-` は一覧で `－` 表示** を明文化（実装済み内容の正本化） | 中 | 小 | ☐ 承認 / ☐ 却下 |
| **P4** | NAS 台帳 **E2E smoke**（23 件表示・設備なし 3 行・CRUD 1 件）を `npm run nas-ledger:smoke` として追加 | 中 | 中 | ☐ 承認 / ☐ 却下 |
| **P5** | Excel 廃止を **浜田 GO 後** `excel-abandon-two-stage` チェックリスト 1 本化（NAS 専用行） | 低 | 小 | ☐ 承認 / ☐ 却下 |
| **P6** | Space 48 **thread 52** 制約を `kintone-apps.md` と仕様に恒久注記（新規 Space アプリ作成 runbook） | 低 | 小 | ☐ 承認 / ☐ 却下 |

---

## 3. メモ（反省のみ）

- **安全性優先**の GO 指示に対し、初回 migrate の **live 検証不足**が最大のリスクだった。今後は「Excel 系移行 = dry-run + サンプル assert + 浜田目視前に DB 件数確認」をテンプレ化する。
- UI 微調整（列幅・ダッシュ表示）と **BUILD/deploy** を分離し、BUILD は **マイルストーン単位**に留める運用がよい。
