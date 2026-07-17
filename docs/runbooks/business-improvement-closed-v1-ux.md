# 業務改善 ver.02 — closed-v1 軽微 UX レーン

> **制定**: 2026-06-25（浜田 GO — R-BI-01 / R-BI-02）  
> **上位**: `data/cio-project-closures.json`（697–713 closed-v1）  
> **完成報告**: `docs/reports/2026-06-13-business-improvement-completion.md`

---

## 0. システム側運用準備 OK（2026-07-17・浜田承認）

**判定**: システム側の運用準備は **OK／完了**。本節は旧計画・旧残件メモより優先する。人への研修、社内制度の展開、実際の評価依頼メール初回受信は完了扱いに含めない。

| App | revision | BUILD／確認状態 |
|-----|----------|-----------------|
| **697 設定マスタ** | **11** | 32件＝本番30部署＋管理者専用 WF テスト1件＋共通1件。共通人事 LoginID `jinji`、評価項目20件 |
| **698 社員マスタ** | **19** | `2026-07-04-bi-employee-index-emp-filter`。273件／在籍264件。検証合格 |
| **699 ご利用ガイド** | **132** | `2026-07-17-manual-evaluation-email`。現行ナビ・一覧アコーディオン・評価メール説明を確認 |
| **700 提案申請** | **170** | `2026-07-17-hide-wf-test-dept`。必須項目・WF・テスト部署の管理者限定表示を確認 |
| **713 年次処理** | **12** | `2026-06-13-bi-annual-redirect-guide`。年次検証合格 |

### 検証コマンド

最新デプロイ後、次の5コマンドはすべて合格済み。再確認時も同じ順で実行する。

```text
npm run business-improvement:verify-settings
npm run business-improvement:verify-employee
npm run business-improvement:verify-guide
npm run business-improvement:verify-proposal
npm run business-improvement:verify-annual
```

通知設定の再取得・無変更確認:

```text
npm run business-improvement:configure-evaluation-notifications -- --dry-run
```

### WF テスト部署の保持

- `【WFテスト】開発検証用` は検証用として**意図的に保持**する。
- この1件の評価者・申請者 LoginID はすべて `admin`。
- App 700 の申請 UI では、正確な LoginID が `admin` の場合だけ表示し、その他すべてのアカウントには表示しない。
- 本番30部署、管理者専用テスト1件、共通設定1件を混同しない。テスト行削除をリリース条件にしない。

### 評価依頼通知と日常運用

- 汎用の「担当者」ステータス変更通知は削除済み。
- 上司・支店長・本社の各評価段階への到達時、現在の担当者へ案件単位の条件通知を送る。
- 通知タイトルは `【評価依頼】上司評価をお願いします`、`【評価依頼】支店長評価をお願いします`、`【評価依頼】本社評価をお願いします`。
- レコードタイトルは提案件名。標準メール件名で kintone、アプリ、提案件名、依頼段階を識別する。
- メール配信は各利用者の kintone メール通知設定に依存する。
- **定期リマインド通知は設定しない**。評価者は kintone 通知とガイドの未評価一覧を定期確認する。これは 2026-07-17 の浜田承認済み運用であり、旧「3日おき」記述を置換する。
- 最初の実メール到着は運用開始後の受入観察事項であり、システム側運用準備の阻害条件ではない。受信実績を事前に完了扱いしない。

### ご利用ガイドの現行表示

- 担当者: **はじめに・申請編**
- 評価者: **はじめに・申請編・評価編**
- **その他**: FAQ が実際に追加されるまで全員非表示
- 評価ボタン: `評価・承認する（n件）`。0件は無効状態の `評価待ちはありません`
- 一覧: アコーディオンブロック。評価者の未評価一覧は0件でも表示
- 既存スクリーンショットは、利用者から画像差し替えの明示依頼がない限り維持

**証跡**: `docs/reports/2026-07-17-business-improvement-operation-readiness.md`

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

### 697 設定マスタ — 8月本番 Excel・WF テスト（2026-07-04）

| 項目 | 正本 |
|------|------|
| 本番 Excel | `scripts/data/business-improvement-settings-master-production-2026-08.xlsx` |
| seed（upsert） | `npm run business-improvement:seed-settings -- --force --xlsx=…` |
| 検証 | `npm run business-improvement:validate-prod-settings-xlsx` |
| マスタ変更 | **人事発令**に伴う更新として扱う |
| 本社評価 | 共通 **`jinji`**／WF テスト行のみ **`admin`**（700 所属行 `hr_director_login` 優先） |
| 共通 jinji 復元 | `npm run business-improvement:restore-common-hr-jinji` |

仕様 §4.7.1、`scripts/data/business-improvement-wf-test-master.json`

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
| 在籍フィルタ | **在籍 / 退職 / すべて** pill（595 同型）。**通常＝在籍**（退職非表示）。BUILD `2026-07-04-bi-employee-index-emp-filter` rev19 |
| 差分警告 | `sync595_meta.warn` — 突合不能レコード・**26h 超 stale** |

フィールド追加: `npm run business-improvement:add-sync595-meta` / `npm run business-improvement:add-employee-source595-id`

---

## 4. R-BI-03 — 697 人事発令ドリブン更新（年次・随時）

**トリガ**: 人事発令・組織改編・評価者変更 — **Excel の内容は「正」**（kintone 旧値へ戻さない）。

| # | 手順 | コマンド / 正本 |
|---|------|-----------------|
| 1 | 本番 Excel 編集 | `scripts/data/business-improvement-settings-master-production-2026-08.xlsx` — シート **`設定マスタ_本番`** のみ |
| 2 | ミラー（任意） | `C:\tmp\業務改善\` へコピー |
| 3 | 機械検証 | `npm run business-improvement:validate-prod-settings-xlsx` |
| 4 | seed（upsert） | `npm run business-improvement:seed-settings -- --force --xlsx=scripts/data/...` |
| 5 | WF テスト確認 | テスト行 id=32 のみ admin — 共通 jinji は `restore-common-hr-jinji` |
| 6 | 700 確認 | 所属行 `hr_director_login` が本社評価 override になること（本番=jinji / テスト=admin） |
| 7 | 浜田目視 | 697 一覧 + WF テスト 1 件 |

**禁止**: 共通 `hr_director_login` を WF テスト用に admin 固定（テスト行のみ per-row override）。

---

## 5. R-BI-05 — ガイド／dash 一覧ブロック（アコーディオン + サマリージャンプ）

**制定**: 2026-07-09（#R-ACC-DEFAULT-01 浜田 GO）

| 項目 | 規約 |
|------|------|
| 初期表示 | 一覧ブロックは `<details>` **閉じ** |
| サマリー数字クリック | 該当 `details.open=true` · **他 `.bi-list-accordion` は false** · `scrollIntoView` |
| 手動クリック | summary クリックは **複数同時 open 可**（exclusive は件数ジャンプ時のみ） |
| 参照実装 | 699 `openBiListAccordionExclusive` · 719/749 リスト出力パターン |

**新規 dash 追加時**: 上記を implement チェックリストに含める（`business-improvement-closed-v1-ux.md` §2 と併用可）。

**関連**: 仕様 §4.7.1 / `scripts/data/business-improvement-wf-test-master.json`

---

## 4. R-BI-04 — 699 ログイン UX deploy 規律（2026-07-06 GO · #R699-BANNER-01）

**699** のログインバナー・サマリー表（Q-GUIDE-04 / Q-GUIDE-13）変更時:

| # | ルール |
|---|--------|
| 1 | **§41 で文案・レイアウトを1セット確定**してから implement |
| 2 | **1 GO = 1 deploy**（本日の5連 deploy 禁止） |
| 3 | deploy SUCCESS 後 **同一セッション commit**（R-SESS-07 / R63） |

**正本**: `docs/plans/2026-07-06-bi-699-status-summary-spec-draft.md` · `docs/approved-changes/2026-07-06-evening-improvements-hamada-go.md`
