# 業務改善 ver.02 — closed-v1 軽微 UX レーン

> **制定**: 2026-06-25（浜田 GO — R-BI-01 / R-BI-02）  
> **上位**: `data/cio-project-closures.json`（697–713 closed-v1）  
> **完成報告**: `docs/reports/2026-06-13-business-improvement-completion.md`

---

## 1. スコープ（v1 再実装禁止との境界）

**継続可（軽微 UX）** — 完成条件外の **表示・案内・同期可視化** のみ:

| 例 | アプリ |
|----|--------|
| ログイン能力バナー・年次集計注記 | 699 |
| 595 同期ステータス一覧バナー | 698 |
| FAQ 文言・ガイド UI 調整 | 699 |
| 697 設定フィールド（同期メタ等・運用可視化） | 697 |

**禁止**: WF 再設計・評価ロジック変更・新規アプリ v1 再実装・提案フロー本体の仕様変更。

---

## 2. R-BI-01 — 新規 customize アプリ追加チェックリスト

**698 教訓**: deploy 成功後に `kintone-apps.md` 未登録 → 次セッション台帳ズレ。

**同一セッション内**（締め前）に以下を **セット完了**:

| # | 作業 | コマンド / パス |
|---|------|-----------------|
| 1 | customize ソース | `customize/business-improvement-<name>/desktop.js` |
| 2 | path registry | `data/kintone-customize-path-registry.json` |
| 3 | package.json | `deploy:<id>` + `cio:preflight:<id>` |
| 4 | 機械台帳 | `kintone-apps.md` ポートフォリオ表 + §業務改善表 |
| 5 | live builds | deploy 成功で `data/cio-live-builds.json` 自動更新を確認 |
| 6 | preflight → deploy | `npm run cio:preflight:<id>` → `npm run deploy:<id>` |
| 7 | 浜田目視 | 一覧/詳細で表示確認 |

**Windows UV assertion**（R736-01）: `verify-kintone-live-schema` 手動 OK 後のみ `SKIP_CIO_LIVE_SCHEMA_GUARD=1`。

---

## 3. R-BI-02 — 595 同期メタ運用

| 項目 | 正本 |
|------|------|
| 保存先 | 697 共通設定 `sync595_meta`（JSON） |
| 書込 | `npm run business-improvement:sync-595`（成功/失敗両方） |
| 表示 | 698 一覧 customize（697 GET）+ **手動同期ボタン**（698 一覧・595→698 反映） |
| 日次 | `npm run business-improvement:sync-595:register-windows-task`（毎日 22:30 ローカル） |
| 月次確認 | 698 バナーが **成功（緑）/ 要確認（黄）/ 失敗（赤）** を正しく示すこと |
| 突合 | **595.$id → 698.$id**（初回 seed 同一）。$id 不一致時は **氏名** でフォールバック PUT。誤 POST 重複は削除 |
| 一覧並び | **595 と同一** — `source595_id`（595 レコード番号）昇順。698 一覧 customize が既定適用 |
| 差分警告 | `sync595_meta.warn` — 突合不能レコード・**26h 超 stale** |

フィールド追加: `npm run business-improvement:add-sync595-meta` / `npm run business-improvement:add-employee-source595-id`
