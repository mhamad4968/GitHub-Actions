# kintone アプリ構成メモ（Cursor / AI 用）

このファイルは **kintone 用 JavaScript や設定を書く前に必ず読む** こと。フィールドコードの取り違えを防ぐ。

## AI・開発者への指示

- 新規アプリやフィールド変更があったら **このファイルを更新**する（アプリ名・アプリID・フィールド一覧）。
- **部署予実（予算・実績・修正）**: 仕様は `templates/yojitsu-budget-lite/SPEC.md`（**§6c**＝`支払内訳` サブテーブル等のたたき台）。**入力**と **ダッシュ**の **2 アプリ**＋任意マスタ（`SPEC.md` §6b）。一覧表は **アプリごと 1 行**（下表参照）。`shin-format-excel-layout.md`・`excel-column-draft-2026-04-28.md`・`yojitsu-spec-session-checklist.md`。**アプリ新規作成時は配置先 kintone スペース（名または ID）を先に決める**（`.cursor/rules/creation-timing-ask.mdc`）。
- **カスタマイズ JS の正本**: `kintone-ai-lab/customize/<アプリIDまたは別名>/desktop.js`（deploy 前もここを編集）。FAQ ポータル等は `scripts/`。
- フィールド一覧を最新化するときは、リポジトリ直下で次を実行し、出力を貼るか表に反映する。

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run app:fields <アプリID>
```

## ポートフォリオ customize 本番 BUILD（機械台帳）

**正**: `data/cio-live-builds.json`（deploy 成功時に自動更新）。**照合**: `npm run cio:audit:portfolio:strict`（リポ `var BUILD` ↔ 台帳 ↔ kintone 本番 JS）。**復旧 Runbook**: `docs/runbooks/customize-deploy-recovery.md`。**定期運用（忘れ防止）**: `docs/runbooks/cio-periodic-ops-schedule.md`（月次・四半期・金曜 MCP）。

**フィールド台帳 SOP（第11/12層 — 2026-06-14）**:

1. **新規 kintone アプリ**（customize あり）→ `data/kintone-field-registry.json` に **recordFields**（＋ subtables）を追加。**dash アプリ**は DB アプリへ REST する場合 **`inheritsRecordFieldsFrom`** を設定（例: 715→714、717→716、678→677）。**他アプリ REST 参照**（674→671 等）は **`relatedAppFieldsFrom`** に関連 appId 配列を設定（live-schema が実機スキーマをマージ監査）。
2. **二段 Linter**: `npm run verify:kintone-fields`（registry）→ `npm run verify:kintone-live-schema -- --app <id>`（実機 preview form）。
3. **deploy 前**: `npm run cio:preflight:<app>` → `npm run deploy:<app>`（`cio-deploy-preflight-guard` が live-schema を **機械連鎖**）。
4. **月次**: `npm run verify:kintone-live-schema -- --portfolio`（`cio:periodic:monthly` 内包）。
5. **許容ギャップ**（640 deploy 未接続等）: `data/kintone-accepted-gaps.json` に登録 → `npm run verify:kintone-accepted-gaps` が **deploy 接続時に自動 NG**（台帳化忘れ防止）。
6. **generations 同期**: governance 触媒 commit 時 **post-commit が `sync --apply` → `--amend` で manifest を同一 commit に反映**（pre-commit は dry-run のみ）。

正本: `.cursor/rules/cio-kintone-fields-gate.mdc` / `.cursor/rules/cio-kintone-live-schema-gate.mdc`

| app | BUILD（本番） | revision | fileKey | 更新 |
|-----|---------------|----------|---------|------|
| 595 | `2026-07-04-595-index-emp-dept-filters` | **115** | `6e7ed3af-07b3-4802-b2cf-061b12a5968b` | 2026-07-01 退職674連携revision修正・一覧q=クリア |
| 674 | `2026-07-08-674-sanitize-orphan-native-q` | **256** | `8b956021-5719-4617-808a-f6f799f0a3c0` | 2026-07-08 削除済み f13459900 標準 q 除去 |
| 687 | `2026-06-09-687-workdays-excel-v1` | **10** | `13bc24dc-a753-404a-9f03-8e7e92c43647` | 2026-06-09 工事稼働 Excel v1 |
| 688 | `2026-06-24-688-print-5yr-rain-scale-up-v9` | **79** | `dc6ed705-941d-46c1-b57b-516dc7571db4` | 2026-06-24 過去5年降雨拡大 |
| 735 | — | — | — | 2026-06-18 実行予算書リストマスタ（104件 seed・customize なし） |
| 736 | `2026-07-08-736-optional-sub-blocks` | **170** | `4cff9ec6-a2be-41d0-adcd-d75ebf6595b3` | Phase 0b ⋮ 上/下追加 |
| 693 | `2026-06-03-apple-id-db-block-ui-mutations` | **5** | `ca4b6489-bc6d-444c-b4a4-28b4c7f8c96c` | 2026-06-03 Apple ID DB save/delete ブロック |
| 694 | `2026-06-08-694-device-exchange-date` | **18** | `699da986-7b14-49d0-aafe-bfe3322300e5` | 2026-06-08 端末交換日フィールド |
| 695 | `2026-06-06-shared-mail-db-block-ui` | **5** | `afc1ca51-aeed-4a67-a3ed-9a2fac00e91a` | 2026-06-06 共有メール DB save/delete ブロック |
| 696 | `2026-06-21-696-dept-sort-master` | **14** | `9eeed7c9-8952-4447-aa92-2984451db3a1` | 2026-06-21 R68所属並び正本を部署ソートに反映 |
| 706 | `2026-06-10-nonconformance-db-block-ui` | **5** | `4a387219-5384-4ef5-877a-2997857f551f` | 2026-06-10 不適合 DB save/delete ブロック |
| 707 | `2026-06-10-nonconformance-dash-v1` | **4** | `34332582-396a-40b8-af06-c6395fe70bb1` | 2026-06-10 不適合台帳 Excel UI v1 |
| 708 | `2026-06-10-external-it-checksheet-db-block-ui` | **5** | `13055622-745a-4787-9cdd-3515b6f2e0e7` | 2026-06-10 外部ITチェック DB ブロック |
| 709 | `2026-06-10-external-it-checksheet-dash-print-a4-v2` | **5** | `7952c4af-8fc5-4dbb-9516-5ff2e963745c` | 2026-06-10 外部ITチェック 印刷A4 v2 |
| 710 | `2026-06-10-new-system-intro-db-block-ui` | **5** | `372a6214-84de-48ff-891f-2126483ed5dd` | 2026-06-10 新規システム導入ヒアリング DB ブロック |
| 711 | `2026-06-10-new-system-intro-dash-print-a4-v2` | **4** | `de21c60d-301b-49aa-91bf-d1e25d16efb2` | 2026-06-10 新規システム導入ヒアリング 印刷A4 2枚 |
| 698 | `2026-07-04-bi-employee-index-emp-filter` | **19** | `5ed0278f-c9b4-4046-bd24-9003d15b3cb1` | 2026-07-04 在籍/退職/すべて切替・source595_id並び |
| 699 | `2026-07-06-bi-guide-banner-permission-label` | **121** | `9e26a16c-f32b-4d34-ae7a-c62c56818c40` | 2026-07-06 ステータス件数サマリー表 Q-GUIDE-13 |
| 700 | `2026-07-06-bi-apply-footer-reject-clear` | **166** | `d128837d-6bee-4bb8-9356-97b6f3e4811e` | 2026-07-04 支店長/本社評価は項目折りたたみ |
| 713 | `2026-06-13-bi-annual-redirect-guide` | **12** | `d9baa102-67f1-4c12-a291-812ce2a794ac` | 2026-06-13 年次713→699ガイド誘導 |
| 714 | `2026-06-14-software-ledger-db-block-ui-mutations` | **5** | `45b4c125-5d47-47a1-a373-3bbcd273b54d` | 2026-06-14 ソフトウエア台帳 DB save/delete ブロック |
| 715 | `2026-06-17-software-ledger-user-filter-compact` | **13** | `69ab1b99-1170-4577-86d1-04c11d5b9a80` | 2026-06-17 利用者チップを社員検索絞り込みに変更 |
| 718 | `2026-06-14-wifi-ssid-db-block-ui-mutations` | **5** | `bc1903db-3942-43d8-b4ba-89e9562988b1` | 2026-06-14 社内Wi-Fi DB save/delete ブロック |
| 719 | `2026-07-07-wifi-ssid-dash-list-print-scale2` | **12** | `75478609-9bce-4d10-ac37-65de404ac7dc` | 2026-07-07 一覧印刷・Excel・A4文字拡大 |
| 716 | `2026-06-14-storage-media-ledger-db-block-ui-mutations` | **5** | `36e4bdf3-9362-4837-8f53-4135b41084d1` | 2026-06-14 記憶媒体等台帳 DB save/delete ブロック |
| 717 | `2026-06-17-storage-media-ledger-user-filter-compact` | **8** | `ed202a45-c53b-4930-bd2e-84d3d084779d` | 2026-06-17 利用者チップを社員検索絞り込みに変更 |
| 720 | `2026-06-15-jr-ipad-db-block-ui-mutations` | **5** | `6a022180-0c57-4992-8f3c-929a93678a0f` | 2026-06-19 新規採番時下書き必須緩和（フォーム rev **7**） |
| 721 | `2026-06-24-jr-ipad-dash-register-existing` | **13** | `1505144a-b3e2-4868-854b-3a6b9478abf7` | 2026-06-24 既存端末を登録ボタン（採番なし・保存時POST） |
| 744 | `2026-06-26-jre-cloud-account-db-block-v1` | **5** | `125843f1-4b4b-49ce-91ad-2ae1886291fd` | 2026-06-26 JREクラウド DB save/delete ブロック |
| 745 | `2026-06-27-jre-cloud-account-dash-v16-list-filter-clear` | **22** | `56f39bd5-30fd-48ac-9cee-b7be8fb77c53` | 2026-06-26 集計表を開くと今月を自動表示 |
| 746 | `2026-06-27-jre-chub-account-db-block-v1` | **5** | `8537bd74-300b-4a43-9bef-877cfebaa5be` | 2026-06-27 JRE-C_Hub DB save/delete ブロック |
| 747 | `2026-06-27-jre-chub-account-dash-v6-list-filter-clear` | **12** | `8fe84c68-b55d-493c-9855-3ee7ad946afa` | 2026-06-27 JRE-C_Hub 台帳 v1（権限ST・IDユニーク集計） |
| 733 | `2026-06-20-vpn-db-rename-message` | **11** | `252e24ee-a0c8-451c-8bff-46c967c9e9f3` | 2026-06-20 アプリ名変更・ブロックメッセージ更新 |
| 734 | `2026-07-01-vpn-delete-records-api-fix` | **30** | `4babdb64-f815-49ec-9444-82bef64fa707` | 2026-07-01 DELETE records.json API修正 |
| 752 | `2026-07-05-kintone-account-db-block-v2-viewonly` | **7** | `e4a4e1db-c1ba-4b83-9c3b-8acb80e47d1c` | 2026-07-05 Kintoneアカウント DB 閲覧専用ブロック |
| 753 | `2026-07-05-kintone-account-dash-v20-fee-settings-kintone` | **24** | `261d8132-ea9a-4814-a3d2-9476ac8ae564` | 2026-07-05 Kintoneアカウント台帳 v1 初回 deploy |
| 737 | `2026-06-21-total-network-db-block` | **5** | `d35de612-a6dc-484e-9881-aa603b024712` | 2026-06-21 トータルNW DB save/delete ブロック |
| 738 | `2026-06-21-total-network-dash-v1-auto-ip-count` | **8** | `f01ac11e-bf35-4158-a1da-f850985758fd` | 2026-06-21 IP数を範囲から自動計算 |
| 741 | `2026-06-22-mfp-ledger-db-block-ui` | **5** | `6cbaad41-35f7-4dab-b8f9-4bb8642482f7` | 2026-06-22 複合機DB save/delete ブロック・v1 CLOSED |
| 742 | `2026-06-22-mfp-ledger-dash-v1` | **4** | `7ee572d5-9061-457d-b89a-778d6609a0e6` | 2026-06-22 複合機台帳 v1・浜田目視 OK |
| 748 | `2026-06-28-nas-ledger-db-block-ui` | **6** | `461b2d88-6435-451f-accd-43ba4c8c0f6d` | 2026-06-28 NAS DB save/delete ブロック |
| 749 | `2026-06-29-nas-ledger-list-hostname-v3` | **17** | `5d65c187-2ccc-4bb1-ae07-83dba6ecca41` | 2026-06-28 NAS 台帳 v1 初回 deploy |
| 750 | `2026-06-29-mailing-list-db-block-ui` | **6** | `aab3dedf-5f21-4538-8025-694da8e0a777` | 2026-06-29 メーリングリスト DB v1 CLOSED |
| 751 | `2026-06-29-mailing-list-dash-clear-btn-v2` | **5** | `6b5969d9-74fd-475f-8598-dc679927e444` | 2026-06-29 メーリングリスト台帳 v1 CLOSED |
| 701 | `2026-06-08-sn-news-board-v4-digest-labels` | **7** | `313ce558-6a11-4e5c-90b2-85d49426cfa8` | 2026-06-08 SN ニュース掲示板 v4 |
| 627 | `2026-05-12-627-no594-rest` | 150 | `9fc3efc8-2a22-4585-881f-0ee3c2a0fbf2` | **削除済**（674 移行後・浜田確認 2026-06-10）— 台帳参照用 |
| 668 | `2026-05-16-668-ops-guide-portfolio-audit` | 42 | `106126f5-7249-4104-8b43-405c85ddfa51` | 2026-05-16 portfolio 拡張・`deploy:668` |
| 677 | `2026-05-15-677-block-all-ui-mutations-dash678-only` | 20 | `6eb02e6f-4319-4bed-97ee-245ee0869a01` | 2026-05-16 registry 整合 |
| 678 | `2026-05-15-678-hide-native-pager-zero-label` | **157** | `33343967-1f61-4981-88fe-924a090918b3` | 2026-05-16 registry 整合 |
| 679 | `2026-05-15-679-manual-no-677-nav` | 32 | `3c757dfa-9704-47d5-b607-66ae78a423ef` | 2026-05-16 registry 整合 |
| 682 | `2026-05-12-682-hide-rolling7m-dashboard683` | 24 | `c183e358-0f6a-4d1c-ad70-cfb4543197e6` | 2026-05-16 registry 整合 |
| 683 | `2026-06-25-683-sixmo-chart-pagination-fix-v1` | **85** | `ba2066bb-0cb1-4c8f-98e9-d93b9b881166` | 2026-05-16 registry 整合 |
| 686 | `2026-05-17-686-ict-digest-board-v9` | **20** | `8d260fda-762d-482c-9fe9-4086f423f1cb` | 2026-05-16 MSRC→NVD リンク修正 |

**revision スナップショット**（フィールド構成）: `data/snapshots/*-portfolio-2026-05-16-*`（`npm run cio:snapshot:portfolio`）。

## アプリ一覧

| アプリ名（論理名） | アプリID | customize パス | デプロイ例（npm） |
|-------------------|---------|----------------|------------------|
| **ユーザサポート件数日次**（記録日・午前/午後件数・日合計 CALC・**対応内容→件数 JS**） | **682** | `customize/682/desktop.js`（**グラフ／ダッシュ／AI／§7 二枚印刷** は §9.1 C〜F） | [https://jbis-kintone.cybozu.com/k/682/](https://jbis-kintone.cybozu.com/k/682/) **Space 48 / thread 52**。`npm run cio:preflight:682 -- --note "…"` → `npm run deploy:682`。初回のみ `node --env-file=.env scripts/user-support-682-add-correspondence-fields.mjs`（`am_correspondence` / `pm_correspondence` 追加）。**月次欠日・重複の機械確認**: `npm run 682:audit-month -- --year 2026 --month 4`（`.env`）。**2026-05-12 deploy SUCCESS** / fileKey **`50783c0f-1aed-4dbe-a183-84e78b121e05`** / preview revision **`21`** / **BUILD=`2026-05-12-682-hide-rolling7m-dashboard683`**（**同一暦日は 1 レコード**・REST 重複検査。**7 暦月 REST 棒は非表示**・月次は **[683 ダッシュ](https://jbis-kintone.cybozu.com/k/683/)** を正。欠日バナー等 **§6.2.1** は従来どおり）（一覧 **§6.2.1**: 欠日は **JST 昨日まで**（**当月**）・**ヘッダで対象暦月を前月／次月／今月に戻す**・`sessionStorage` 保持・欠日列挙 **`yyyy/mm/dd(曜)`**・重複は暦月フル・offset ループ。**対応日セル**も **`yyyy/mm/dd(曜)`**・詳細・新規編集は補助行）。`npm run cio:preflight:682 -- --note "…"` → `npm run deploy:682`。**Runbook（§9.1 フェーズ C–D）**: `docs/runbooks/user-support-682-phase-c-and-space48-phase-d.md`。**フェーズ C（REST）**: `npm run 682:graph-monthly` — グラフ **`682_day_total_monthly`**（`day_total` SUM・`record_date` MONTH・**COLUMN 縦棒**・**JST 直近 7 暦月** `filterCond`）を維持（初回 **2026-05-10** revision **12**、以降は再実行で窓更新）。**自動窓更新**: GitHub Actions **`682-graph-monthly-refresh.yml`**（月初・**Repository secrets**・Runbook §1.0）。**7 暦月 0 埋め棒**: `customize/682/desktop.js`（**BUILD** 行参照・`deploy:682`）。**仕様** §4.1・§6.1・§6.2・§6.2.1・§7: `docs/plans/2026-05-08-user-support-daily-counts-spec.md` |
| **最新ICT情報掲示板（収集用）**（RSS×Gemini 自動登録・正本 DB） | **685** | `ict-tech-digest-automation/` | [https://jbis-kintone.cybozu.com/k/685/](https://jbis-kintone.cybozu.com/k/685/) **Space 48**・仕様 **`docs/plans/2026-05-16-ict-tech-digest-spec.md`（v2）**・GHA `ict-tech-digest-collect.yml`・1日最大5件・**RSS 27 本**・カテゴリ **7 種**・`ICT_DRY_RUN` 対応・**v2 本番 2026-05-17**（`84c4f77`〜） |
| **最新ICT情報掲示板**（685 REST 閲覧・過去検索ダッシュ） | **686** | `customize/686/desktop.js` | [https://jbis-kintone.cybozu.com/k/686/](https://jbis-kintone.cybozu.com/k/686/) **Space 48** 入口・`npm run deploy:686` **BUILD** `2026-05-17-686-ict-digest-board-v9`（rev 20・2026-05-17） |
| **工事稼働日数算出（データ正本）** | **687** | `customize/687/desktop.js` \| `npm run deploy:687` | [https://jbis-kintone.cybozu.com/k/687/](https://jbis-kintone.cybozu.com/k/687/) **Space 56**・§6.2 データ層。**BUILD=`2026-06-09-687-workdays-excel-v1`**（`estimate_year` 追加済・着工/完工任意）。仕様 **`docs/plans/2026-06-13-construction-workdays-excel-20260613.md`** |
| **工事稼働日数ダッシュ（日常入口）** | **688** | `customize/688/desktop.js` \| `npm run deploy:688` | [https://jbis-kintone.cybozu.com/k/688/](https://jbis-kintone.cybozu.com/k/688/) **Space 56**・687 REST。**BUILD=`2026-06-24-688-print-5yr-rain-scale-up-v9`** rev **79** / fileKey **`dc6ed705-941d-46c1-b57b-516dc7571db4`**（施工主報告 **専用ウィンドウでA4横印刷**・**塗装/足場/休日各1枚**・**過去5年降雨1枚（6表横並び・拡大）**・風速別枚。**`cio:preflight:688` → `deploy:688`**）。仕様 **`docs/plans/2026-06-13-construction-workdays-excel-20260613.md`** §9–§10 |
| **【実行予算書】リストマスタ ver.01** | **735** | （customize なし）\| `npm run jikkou-yosan:import-master` | [https://jbis-kintone.cybozu.com/k/735/](https://jbis-kintone.cybozu.com/k/735/) **Space 56 / thread 60**・コード表77＋リスト27＝104件。**M 編集=管理者のみ**（ACL 要確認）。仕様 **`docs/plans/2026-06-18-jikkou-yosan-spec.md`** |
| **実行予算書作成支援ツール　ver.01** | **736** | `customize/736/desktop.js` \| `npm run deploy:736` | [https://jbis-kintone.cybozu.com/k/736/](https://jbis-kintone.cybozu.com/k/736/) **Space 56 / thread 60**・735 REST・688型一覧+Excel風フォーム・**合計行 薄茶色**・**差分付き印刷+v2dサマリー**・**v2c 画面差分**・**依頼者UX v2**・**Phase 0c 行メニュー rev168**・Phase 1 **1a→1b→1c 未 GO**（反省会フック）。**BUILD=`2026-07-08-736-optional-sub-blocks` rev ** 170 ** / fileKey **`6df7d826-d949-404b-b9f9-ada4617a39ce`**。版管理 **`docs/plans/2026-06-20-jikkou-yosan-version-management-spec.md`**・v2d **`docs/plans/2026-07-04-jikkou-yosan-diff-print-summary-v2d.md`** |
| **ユーザサポート682ダッシュ**（682 の REST 参照・閲覧／集約 UI・**入力は 682 のみ**） | **683** | `customize/683/desktop.js` | [https://jbis-kintone.cybozu.com/k/683/](https://jbis-kintone.cybozu.com/k/683/) **Space 48**（**2026-05-11** `kintone-add-app` → **`deploy:683` SUCCESS**・SPEC **§6.1.1**・Runbook **`docs/runbooks/user683-weekly-summary-and-print.md`**）。`npm run cio:preflight:683 -- --note "…"` → `npm run deploy:683`。**2026-06-25 deploy** / **BUILD**: `2026-06-25-683-sixmo-chart-pagination-fix-v1` — **6 暦月棒**を暦月別クエリに変更＋REST ページングを totalCount 突合（100 件打切り欠落是正）。検証: `npm run 683:audit-six-month-chart -- --view-year 2026 --view-month 7`。**2026-05-16 deploy SUCCESS** / **BUILD**: `2026-05-16-683-print-2page-tight-v2` / fileKey **`4bb662aa-b47a-40c5-b1f7-2ba4dffa8f63`** / preview revision **`74`**（**印刷報告用**・`@media print` で **2 枚前後**を目標にレイアウト縮小。**一覧の「提出用PDF」ボタンは撤去**。**月次 PDF HTTP serve は廃止**（2026-05-17 CEO・印刷は **`window.print()` のみ**・オフライン PDF は CLI `user683:monthly-pdf` 任意）。**Claude 中継**: `?user683_claude_relay=`・`text/plain` POST。**グラフ直下 月次→週次4**・要約キャッシュ PUT/POST／`USER683_SHOW_OLLAMA_GENERATE_BTN=false`）。 |
| **PC台帳 ver.2（旧・削除予定／正は674）** | **594** | `customize/594/desktop.js` | `npm run deploy:594`（**新機能は674**。594は移行・清掃・監査コードが残る間のみ。本番に恒久的に残す前提なし） |
| 社員マスタ（674/714/716 連携） | **595** | `customize/595/desktop.js` | **本番 live 最終 deploy（2026-07-04）**: `npm run deploy:595` **SUCCESS** / fileKey **`e47d849c-7ac9-4c7f-824a-374e60dd897b`** / preview revision **`116`** / **BUILD=`2026-07-04-595-index-emp-dept-filters` rev **116**（退職時 674→保管 + 595 `pc_ledger_v1_list`/`pc_ledger_list` クリア・backfill 7件） |
| **業務改善 社員マスタ**（595 ミラー・閲覧専用） | **698** | `customize/business-improvement-employee/desktop.js` \| `npm run deploy:698` | [https://jbis-kintone.cybozu.com/k/698/](https://jbis-kintone.cybozu.com/k/698/) **Space 5**・595→698 日次同期・突合 **595.$id**・一覧 **source595_id 昇順（595 同一）**・**在籍/退職/すべて 切替（通常=在籍）**・697 バナー・手動同期・**BUILD=`2026-07-04-bi-employee-index-emp-filter` rev **19** / fileKey **`776e7d9f-75b6-49b1-95b6-9c5b3265443a`** |
| アカウント管理台帳 | **627**（**テナント削除済・意図的**） | `customize/627/desktop.js`（**リポ参照用・deploy 対象外**） | **674 移行後に削除**（浜田確認 **2026-06-10**）。正本は **674**。portfolio 監査対象外（681 同型）。 |
| 出張精算アプリ | **629** | `customize/shucccho-seisan/desktop.js` | `npm run deploy:629` |
| 社内FAQ（DB） | **640** | （**FAQ レコードの本番保管先**で確定。運用ガイド **668** とは別アプリ） | [https://jbis-kintone.cybozu.com/k/640/](https://jbis-kintone.cybozu.com/k/640/) ・UI 用 HTML の作業例: `scripts/faq-portal-full.html`（640 への反映は運用で実施） |
| Security NEXT ニュース（収集・正本 DB） | **631** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/) ・`KINTONE_APP_ID` ・**浜田運用**（部員は掲示板 701 から閲覧） |
| ニュース週次要約（週次 LLM・正本 DB） | **632** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) ・`KINTONE_REPORT_APP_ID` ・[設計CSV](security-next-automation/docs/security-next-weekly-report-app-design.csv) |
| **Security NEXT ニュース掲示板**（631 REST 閲覧・CVE/パッチ除外） | **701** | `customize/security-next-news-board/desktop.js` \| `npm run deploy:701` | [https://jbis-kintone.cybozu.com/k/701/](https://jbis-kintone.cybozu.com/k/701/) **Space 48 / thread 52**・仕様 **`docs/plans/2026-06-07-security-next-board-spec.md`**・**BUILD=`2026-06-08-sn-news-board-v4-digest-labels`** rev **7**（2026-06-08） |
| **Security NEXT 週次掲示板**（632 REST 閲覧） | **702** | `customize/security-next-weekly-board/desktop.js` \| `npm run deploy:702` | [https://jbis-kintone.cybozu.com/k/702/](https://jbis-kintone.cybozu.com/k/702/) **Space 48 / thread 52**・**BUILD=`2026-06-07-sn-weekly-board-v2`** rev **5**（2026-06-07） |
| **不適合管理台帳用DB**（正本・閲覧のみ） | **706** | `customize/nonconformance-db/desktop.js` \| `npm run deploy:706` | [https://jbis-kintone.cybozu.com/k/706/](https://jbis-kintone.cybozu.com/k/706/) **Space 48 / thread 52**・**2026-06-10**: 10 フィールド・**初回 0 件**・正本 `docs/plans/2026-06-10-nonconformance-ledger-spec.md`・**BUILD=`2026-06-10-nonconformance-db-block-ui`** rev **5** |
| **不適合管理台帳**（日常 UI・706 へ REST） | **707** | `customize/nonconformance-dash/desktop.js` \| `npm run deploy:707` | [https://jbis-kintone.cybozu.com/k/707/](https://jbis-kintone.cybozu.com/k/707/) **Space 48 / thread 52**・**2026-06-10**: Excel 風表＋モーダル CRUD・**BUILD=`2026-06-10-nonconformance-dash-v1`** rev **4** |
| **外部ITサービス導入チェック用DB**（正本・閲覧のみ） | **708** | `customize/external-it-checksheet-db/desktop.js` \| `npm run deploy:708` | [https://jbis-kintone.cybozu.com/k/708/](https://jbis-kintone.cybozu.com/k/708/) **Space 48 / thread 52**・正本 `docs/plans/2026-06-10-external-it-checksheet-spec.md`・**BUILD=`2026-06-10-external-it-checksheet-db-block-ui`** rev **5** |
| **外部ITサービス導入チェックシート**（日常 UI・708 へ REST） | **709** | `customize/external-it-checksheet-dash/desktop.js` \| `npm run deploy:709` | [https://jbis-kintone.cybozu.com/k/709/](https://jbis-kintone.cybozu.com/k/709/) **Space 48 / thread 52**・一覧 + チェック表モーダル + **印刷（A4 1枚・カラー）**・**BUILD=`2026-06-10-external-it-checksheet-dash-print-a4-v2`** rev **5** |
| **新規システム導入ヒアリング用DB**（正本・閲覧のみ） | **710** | `customize/new-system-intro-db/desktop.js` \| `npm run deploy:710` | [https://jbis-kintone.cybozu.com/k/710/](https://jbis-kintone.cybozu.com/k/710/) **Space 48 / thread 52**・19 フィールド・**初回 0 件**・浜田 **目視 OK**（2026-06-10）・正本 `docs/plans/2026-06-10-new-system-intro-hearing-spec.md`・**BUILD=`2026-06-10-new-system-intro-db-block-ui`** rev **5** |
| **新規システム導入ヒアリング記録**（日常 UI・710 へ REST） | **711** | `customize/new-system-intro-dash/desktop.js` \| `npm run deploy:711` | [https://jbis-kintone.cybozu.com/k/711/](https://jbis-kintone.cybozu.com/k/711/) **Space 48 / thread 52**・一覧 + ヒアリングモーダル + **印刷（A4 2枚・稟議添付）**・浜田 **目視 OK**（2026-06-10）・**BUILD=`2026-06-10-new-system-intro-dash-print-a4-v2`** rev **4** |
| **712（運用終了・システム推進室ポータル）** | **712**（**テナント上は削除済** 2026-07-05） | `customize/space48-portal/desktop.js`（**リポに参照用で残置**・**deploy 対象外**） | **2026-06-11** 新設 → **2026-07-05** 廃止・**浜田が管理画面で削除完了**（API `GAIA_AP01` 確認済）。バックアップ: `data/snapshots/712-space48-portal-pre-delete-2026-07-05.json`。仕様 **`docs/plans/2026-06-11-space48-portal-spec.md`**。**Space 48 → 712 リンク削除済**（浜田）。旧 BUILD=`2026-06-11-space48-portal-v3` rev **24** |
| 運用ガイド（PC台帳・アカウント周りの操作手順） | **668** | `customize/ops-guide/desktop.js` | `npm run ops-guide:publish`（HTML レコード同期＋desktop.js デプロイ） |
| 環境設定マスタ（新・PC台帳ver.1 用 / Day 1） | **670** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-24 作成 / 12 レコード（M365 ドメイン・固定文字・上限値）|
| M365管理マスタ（新・PC台帳ver.1 用 / Day 2 / 5 台ライセンス厳守） | **671** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-24 作成 / 10 レコード（sjm-001~sjm-010 / X 案 5 台節約）|
| **新・PC台帳 所属候補マスタ**（674 共有・JR・**595 社員マスタ**の「所属候補から選ぶ」モーダル。API 失敗時は674 JS の埋め込み一覧にフォールバック） | **680** | （customize なし） | **Space 21 / thread 23**・[スペース 21](https://jbis-kintone.cybozu.com/k/#/space/21)。**2026-05-05**: `npm run pc-ledger:dept-master:create-app:seed` で作成＋`dept_name`・`group_name`・`sort_no`＋シード31件。**674** の `APP_DEPT_MASTER_674='680'`。**595** も `APP_DEPT_MASTER_595='680'`（2026-06-19）。再投入: `npm run pc-ledger:dept-master:seed-records` / 不足分のみ: `--merge` |
| **681（運用終了・旧 PC台帳簡単ガイドライン）** | **681**（**テナント上は削除済**） | `customize/681/desktop.js`（**リポに参照用で残置**・**deploy 対象外**） | **2026-05-06**: CEO 方針で **アプリ削除済**（`/k/681/` は無効）。担当者向け案内の**別手段**は **`docs/plans/2026-04-21-new-pc-ledger-spec.md` §12.5**（**2026-05-16 まで判断保留**・策確定後に浜田指示→本表・§9〜§10へ反映）。`scripts/*quick-guide*`・`npm run pc-ledger:quick-guide:*` は **当面存置**（再利用前提なし）。旧 deploy 連記は **git 履歴**および本行に集約。 |
| 新個人WindowsID採番マスタ（新・PC台帳ver.1 用 / 旧 626 置換） | **672** | （customize なし・**674 JS から API 参照**） | Space 21 / 2026-04-25 作成 / `^jbm\d{4}$` 厳格・674 個人自動生成で払出 |
| 新共有WindowsID採番マスタ（新・PC台帳ver.1 用 / 旧 667 置換） | **673** | （customize なし・**674 JS から API 参照**） | Space 21 / 2026-04-25 作成 / `^sjbm\d{4}$` 厳格・674 共有自動生成で払出 |
| **Apple ID管理台帳用DB**（Excel icloud 正本・閲覧のみ） | **693** | `customize/apple-id-db/desktop.js` \| `npm run deploy:693` | [https://jbis-kintone.cybozu.com/k/693/](https://jbis-kintone.cybozu.com/k/693/) **Space 21 / thread 23**・**2026-06-03**: 11 フィールド・**登録済 251 件**（`jbis.039`〜`933` **プール895件削除**）・次採番 **`jbis.039@icloud.com`（新規POST）**・正本 `docs/plans/2026-06-02-apple-id-kintone-spec.md` |
| **Apple ID管理台帳**（日常 UI・693 へ REST） | **694** | `customize/apple-id-dash/desktop.js` \| `npm run deploy:694` | [https://jbis-kintone.cybozu.com/k/694/](https://jbis-kintone.cybozu.com/k/694/) **Space 21 / thread 23**・**2026-06-06**: 編集で **Apple ID・PW・ロック** 修正可・**BUILD=`2026-06-06-694-edit-credentials`** rev **16** |
| **共有メールアドレス管理用DB**（Excel 正本・閲覧のみ） | **695** | `customize/shared-mail-db/desktop.js` \| `npm run deploy:695` | [https://jbis-kintone.cybozu.com/k/695/](https://jbis-kintone.cybozu.com/k/695/) **Space 21 / thread 23**・**2026-06-06**: 10 フィールド・**登録済 46 件**・正本 `docs/plans/2026-06-06-shared-mail-kintone-spec.md` |
| **メールアドレス管理台帳**（日常 UI・695 へ REST） | **696** | `customize/shared-mail-dash/desktop.js` \| `npm run deploy:696` | [https://jbis-kintone.cybozu.com/k/696/](https://jbis-kintone.cybozu.com/k/696/) **Space 21 / thread 23**・接続設定パネル・新規 PW **`sjb`+乱数4桁+`1M#`**・印刷・利用種別 **共有／個人**・**検索パネル**（キーワード AND・状態／種別チップ・部署絞込）・部署並び **R68 正本**・**BUILD=`2026-06-21-696-dept-sort-master`** rev **14**（2026-06-21 R68 所属並び反映） |
| **ソフトウエア台帳DB**（ライセンス割当正本・閲覧のみ） | **714** | `customize/software-ledger-db/desktop.js` \| `npm run deploy:714` | [https://jbis-kintone.cybozu.com/k/714/](https://jbis-kintone.cybozu.com/k/714/) **Space 21 / thread 23**・**2026-06-14**: 18 フィールド・正本 `docs/plans/2026-06-13-software-ledger-kintone-spec.md` |
| **ソフトウエア管理台帳ver.1**（日常 UI・714 へ REST） | **715** | `customize/software-ledger-dash/desktop.js` \| `npm run deploy:715` | [https://jbis-kintone.cybozu.com/k/715/](https://jbis-kintone.cybozu.com/k/715/) **Space 21 / thread 23**・**2026-06-17**: 利用者チップを社員検索絞り込みに変更・**BUILD=`2026-06-17-software-ledger-user-filter-compact`** rev **13** |
| **社内Wi-Fi管理DB**（拠点 SSID 正本・閲覧のみ） | **718** | `customize/wifi-ssid-db/desktop.js` \| `npm run deploy:718` | [https://jbis-kintone.cybozu.com/k/718/](https://jbis-kintone.cybozu.com/k/718/) **Space 21 / thread 23**・**2026-06-14**: 9 フィールド・22 拠点・**BUILD=`2026-06-14-wifi-ssid-db-block-ui-mutations`** rev **5** |
| **社内Wi-Fi管理台帳 ver.1**（日常 UI・718 へ REST） | **719** | `customize/wifi-ssid-dash/desktop.js` \| `npm run deploy:719` | [https://jbis-kintone.cybozu.com/k/719/](https://jbis-kintone.cybozu.com/k/719/) **Space 21 / thread 23**・694 型一覧・拠点別 A4 印刷（Wi-Fi QR）・**一覧印刷・Excel出力**（検索絞込・PW 含む）・**BUILD=`2026-07-07-wifi-ssid-dash-list-print-scale2` rev **12** / fileKey **`75478609-9bce-4d10-ac37-65de404ac7dc`** |
| **記憶媒体等台帳DB**（媒体・周辺機器正本・閲覧のみ） | **716** | `customize/storage-media-ledger-db/desktop.js` \| `npm run deploy:716` | [https://jbis-kintone.cybozu.com/k/716/](https://jbis-kintone.cybozu.com/k/716/) **Space 21 / thread 23**・**2026-06-14**: 19 フィールド・正本 `docs/plans/2026-06-13-storage-media-ledger-kintone-spec.md`・**BUILD=`2026-06-14-storage-media-ledger-db-block-ui-mutations`** rev **5** |
| **記憶媒体等管理台帳ver.1**（日常 UI・716 へ REST） | **717** | `customize/storage-media-ledger-dash/desktop.js` \| `npm run deploy:717` | [https://jbis-kintone.cybozu.com/k/717/](https://jbis-kintone.cybozu.com/k/717/) **Space 21 / thread 23**・**2026-06-17**: 利用者チップを社員検索絞り込みに変更・**BUILD=`2026-06-17-storage-media-ledger-user-filter-compact`** rev **8** |
| **JRシステム用iPad台帳DB**（端末正本・閲覧のみ） | **720** | `customize/jr-ipad-db/desktop.js` \| `npm run deploy:720` | [https://jbis-kintone.cybozu.com/k/720/](https://jbis-kintone.cybozu.com/k/720/) **Space 34 / thread 38**・**2026-06-15**: 13 フィールド・**64 台移行済**・正本 `docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md`・**BUILD=`2026-06-15-jr-ipad-db-block-ui-mutations`** rev **5**（**2026-06-19**: フォーム rev **7** — 新規採番 POST 時 `mgmt_dept` / `phone_number` / `model` を空可。保存時必須は Dash `validateRequired` が担保） |
| **JRシステム用iPad管理台帳 ver.1**（日常 UI・720 へ REST） | **721** | `customize/jr-ipad-dash/desktop.js` \| `npm run deploy:721` | [https://jbis-kintone.cybozu.com/k/721/](https://jbis-kintone.cybozu.com/k/721/) **Space 34 / thread 38**・**BUILD=`2026-06-24-jr-ipad-dash-register-existing`** rev **13** |
| **JREクラウドアカウント管理台帳用DB**（正本・閲覧のみ） | **744** | `customize/jre-cloud-account-db/desktop.js` \| `npm run deploy:744` | [https://jbis-kintone.cybozu.com/k/744/](https://jbis-kintone.cybozu.com/k/744/) **Space 34 / thread 38**・**2026-06-26**: 9 フィールド・**99 件移行済**・正本 `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md`・**BUILD=`2026-06-26-jre-cloud-account-db-block-v1`** rev **5** / fileKey **`125843f1-4b4b-49ce-91ad-2ae1886291fd`** |
| **JREクラウドアカウント台帳**（日常 UI・744 へ REST） | **745** | `customize/jre-cloud-account-dash/desktop.js` \| `npm run deploy:745` | [https://jbis-kintone.cybozu.com/k/745/](https://jbis-kintone.cybozu.com/k/745/) **Space 34 / thread 38**・734 型 — 595 ハイブリッド・稼働中/すべて/退職・**月次集計**（チップ絞込・条件クリア）・検索クリア→稼働中・一覧/集計 **xlsx+印刷**・**BUILD=`2026-06-27-jre-cloud-account-dash-v16-list-filter-clear`** rev **22** / fileKey **`56f39bd5-30fd-48ac-9cee-b7be8fb77c53`** |
| **JRE-C_Hubアカウント管理台帳用DB**（正本・閲覧のみ） | **746** | `customize/jre-chub-account-db/desktop.js` \| `npm run deploy:746` | [https://jbis-kintone.cybozu.com/k/746/](https://jbis-kintone.cybozu.com/k/746/) **Space 34 / thread 38**・**2026-06-27**: 権限サブテーブル・**47 件移行済**・正本 `docs/plans/2026-06-27-jre-chub-account-kintone-spec.md`・**BUILD=`2026-06-27-jre-chub-account-db-block-v1` rev **5** / fileKey **`8537bd74-300b-4a43-9bef-877cfebaa5be`** |
| **JRE-C_Hubアカウント台帳**（日常 UI・746 へ REST） | **747** | `customize/jre-chub-account-dash/desktop.js` \| `npm run deploy:747` | [https://jbis-kintone.cybozu.com/k/747/](https://jbis-kintone.cybozu.com/k/747/) **Space 34 / thread 38**・745 型 — 権限 ST/フィルタ・IDユニーク集計・検索クリア→稼働中+権限すべて・**BUILD=`2026-06-27-jre-chub-account-dash-v6-list-filter-clear` rev **12** / fileKey **`8fe84c68-b55d-493c-9855-3ee7ad946afa`** |
| **VPNアカウント管理台帳用DB**（正本・閲覧のみ） | **733** | `customize/vpn-account-db/desktop.js` \| `npm run deploy:733` | [https://jbis-kintone.cybozu.com/k/733/](https://jbis-kintone.cybozu.com/k/733/) **Space 48 / thread 52**・**v1.2 運用中** — `vpn_domain` + snapshot フィールド・**105 件**（fre/ds/bnp）・正本 `docs/plans/2026-06-16-vpn-account-kintone-spec.md`・**BUILD=`2026-06-20-vpn-db-rename-message`** rev **11** |
| **VPNアカウント台帳**（日常 UI・733 へ REST） | **734** | `customize/vpn-account-dash/desktop.js` \| `npm run deploy:734` | [https://jbis-kintone.cybozu.com/k/734/](https://jbis-kintone.cybozu.com/k/734/) **Space 48 / thread 52**・**v1.3 運用中** — 3ドメイン統合・595検索・PC台帳674連携・**VPN接続情報アコーディオン**（**VPNアカウント管理画面URL**・接続PW編集・**(yyyy/mm/dd更新)** 表示）・ライセンス集計・利用者印刷・**リスト出力（xlsx+印刷）** — 所属 **multi-select + 一括（全選択/全解除/本社/支店・営業所）**・ドメイン **すべて | 個別指定（複数可）**・**BUILD=`2026-07-01-vpn-delete-records-api-fix` rev **30** / fileKey **`4babdb64-f815-49ec-9444-82bef64fa707`**（DELETE `/k/v1/records.json` 修正）・月末リマインド **Space 48 注意書き**（JST **28日〜翌1日**のみ・`vpn-license-space48-notice` GHA） |
| **Kintoneアカウント管理台帳DB**（正本・閲覧のみ） | **752** | `customize/kintone-account-db/desktop.js` \| `npm run deploy:752` | [https://jbis-kintone.cybozu.com/k/752/](https://jbis-kintone.cybozu.com/k/752/) **Space 48 / thread 52**・**2026-07-05**: 11 フィールド・**74 件移行済**・正本 `docs/plans/2026-07-05-kintone-account-ledger-spec.md`・**BUILD=`2026-07-05-kintone-account-db-block-v2-viewonly`** rev **7** / fileKey **`e4a4e1db-c1ba-4b83-9c3b-8acb80e47d1c`** |
| **Kintoneアカウント管理台帳**（日常 UI・752 へ REST） | **753** | `customize/kintone-account-dash/desktop.js` \| `npm run deploy:753` | [https://jbis-kintone.cybozu.com/k/753/](https://jbis-kintone.cybozu.com/k/753/) **Space 48 / thread 52**・**v1.3 完成 — CLOSED** — 74件・Excel廃止・契約数/月額 **752 DB**・アカウント集計100rem・月次利用費用・595任意・xlsx/印刷・正本 `docs/plans/2026-07-05-kintone-account-ledger-spec.md`・**BUILD=`2026-07-05-kintone-account-dash-v20-fee-settings-kintone`** rev **24** |
| **トータルネットワークネットワーク管理DB**（正本・閲覧のみ） | **737** | `customize/total-network-db/desktop.js` \| `npm run deploy:737` | [https://jbis-kintone.cybozu.com/k/737/](https://jbis-kintone.cybozu.com/k/737/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 拠点22・使用中IP26・用途マスタ5・正本 `docs/plans/2026-06-21-total-network-kintone-spec.md`・**BUILD=`2026-06-21-total-network-db-block`** rev **5** |
| **トータルネットワークネットワーク管理台帳**（日常 UI・737 へ REST） | **738** | `customize/total-network-dash/desktop.js` \| `npm run deploy:738` | [https://jbis-kintone.cybozu.com/k/738/](https://jbis-kintone.cybozu.com/k/738/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 一覧表・IPマトリックス・次IP提案・IP数自動計算・**BUILD=`2026-06-21-total-network-dash-v1-auto-ip-count`** rev **8** |
| **複合機管理台帳DB**（正本・閲覧のみ） | **741** | `customize/mfp-ledger-db/desktop.js` \| `npm run deploy:741` | [https://jbis-kintone.cybozu.com/k/741/](https://jbis-kintone.cybozu.com/k/741/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 17 フィールド・**36 件移行済**・正本 `docs/plans/2026-06-22-mfp-ledger-kintone-spec.md`・浜田目視 OK **2026-06-22**・**BUILD=`2026-06-22-mfp-ledger-db-block-ui`** rev **5** |
| **複合機管理台帳**（日常 UI・741 へ REST） | **742** | `customize/mfp-ledger-dash/desktop.js` \| `npm run deploy:742` | [https://jbis-kintone.cybozu.com/k/742/](https://jbis-kintone.cybozu.com/k/742/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 719/734 型一覧・モーダル CRUD・キーワード+拠点絞込・一覧印刷（PW 除く）・拠点指定印刷（業者向け・全項目）・xlsx 出力・R68 拠点順（ブリッジニアプラス最下部）・浜田目視 OK **2026-06-22**・**BUILD=`2026-06-22-mfp-ledger-dash-v1`** rev **4** |
| **NAS管理台帳DB**（正本・閲覧のみ） | **748** | `customize/nas-ledger-db/desktop.js` \| `npm run deploy:748` | [https://jbis-kintone.cybozu.com/k/748/](https://jbis-kintone.cybozu.com/k/748/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 23 フィールド・**23 件移行済**・正本 `docs/plans/2026-06-28-nas-ledger-kintone-spec.md`・浜田目視 OK **2026-06-28**・移行元 Excel **完全削除済**（2026-06-28 浜田報告）・**BUILD=`2026-06-28-nas-ledger-db-block-ui`** rev **6** |
| **NAS管理台帳**（日常 UI・748 へ REST） | **749** | `customize/nas-ledger-dash/desktop.js` \| `npm run deploy:749` | [https://jbis-kintone.cybozu.com/k/749/](https://jbis-kintone.cybozu.com/k/749/) **Space 48 / thread 52**・**v1 完成 — CLOSED** — 742/734 型一覧・モーダル CRUD・キーワード+組織/状態/種別絞込・一覧印刷（PW 除く）・xlsx 出力・購入日/購入先・浜田目視 OK **2026-06-28**・Space48→712 リンク **済**・**BUILD=`2026-06-29-nas-ledger-list-hostname-v3`** rev **17** |
| **メーリングリストDB**（正本・閲覧のみ） | **750** | `customize/mailing-list-db/desktop.js` \| `npm run deploy:750` | [https://jbis-kintone.cybozu.com/k/750/](https://jbis-kintone.cybozu.com/k/750/) **Space 21 / thread 23**・**v1 完成 — CLOSED** — 11 フィールド・**63 件移行済**・正本 `docs/plans/2026-06-29-mailing-list-kintone-spec.md`・本番 Excel **削除済**（2026-06-29）・**BUILD=`2026-06-29-mailing-list-db-block-ui`** rev **6** |
| **メーリングリスト台帳**（日常 UI・750 へ REST） | **751** | `customize/mailing-list-dash/desktop.js` \| `npm run deploy:751` | [https://jbis-kintone.cybozu.com/k/751/](https://jbis-kintone.cybozu.com/k/751/) **Space 21 / thread 23**・**v1 完成 — CLOSED** — メンバー検索・変更メモ・条件クリア・印刷/xlsx・浜田目視 OK **2026-06-29**・**BUILD=`2026-06-29-mailing-list-dash-clear-btn-v2`** rev **5** |
| 新・PC台帳ver.1（本体・**本番運用中**） | **674** | `customize/new-pc-ledger-v1/desktop.js` | **本番 live 最終 deploy（2026-07-08）**: `npm run deploy:674` **SUCCESS** / fileKey **`8b956021-5719-4617-808a-f6f799f0a3c0`** / preview revision **`256`** / **BUILD=`2026-07-08-674-sanitize-orphan-native-q`**（削除済み **f13459900** 標準 **`?q=`** 除去・**GAIA_IQ11** 回避）。**前 deploy（2026-07-07）**: fileKey **`cef2fb6f-0724-41c9-9990-6b97ace00911`** / rev **`255`** / **BUILD=`2026-07-07-674-cancel-unlink-595`**（§4.10.7 **レコード物理削除禁止**・**登録ミス取消**・**671/595 解放**・**取消は一覧非表示**）。**前 deploy（2026-06-19）**: fileKey **`8578fb9c-900c-4153-8f1e-c97e3887c39c`** / rev **`243`** / **BUILD=`2026-06-19-674-detail-hide-sidebar`**（**詳細画面**の右サイドバー＝コメント・履歴欄を非表示）。**担当者運用開始 2026-05-11**・**システム切替 2026-05-13**（仕様 §9）。**本番 live 最終 deploy（2026-05-21）**: `npm run deploy:674` **SUCCESS** / fileKey **`e8ac3ba6-86f3-46cb-a8cb-ad51ed568cb3`** / preview revision **`224`** / **`BUILD=`** **`2026-05-21-list-create-modal-clear-btn`**（一覧 **リスト一覧作成**: 所属・グループ・利用者名 `like`・**クリア**・印刷）。**前 deploy（2026-05-19）**: rev **`216`** / **`BUILD=`** **`2026-05-19-inventory-period-v1`**（棚卸期間・未棚卸一覧・一括棚卸・`inventory_history`）。**フォーム** **61 フィールド**（`purchase_*` 含む）。**本番 live 最終 deploy（2026-05-14）**: `npm run cio:preflight:674` → `npm run deploy:674` **SUCCESS**／preview revision **`206`**／fileKey **`e68fe492-57e3-4330-ac2a-245de69fbf95`**／**`BUILD=`** **`2026-05-14-m365-assist-new-when-empty-only`**（**§4.6.6** **新規採番**は **671 空き0件時のみ**モーダル表示・**直接手入力**可）。**前 deploy（2026-05-14）**: rev **`205`**／fileKey **`10fe2c78-969f-4f29-81d6-3518de1f7182`**／**`BUILD=`** **`2026-05-14-m365-shared-jr-assist`**（**共有・JR** 保存前必須を **PC名・共有端末名・WindowsID/PW・M365 ID/PW** に限定。**シリアル／その他情報／所属**は必須にしない）。**前 deploy（2026-05-14）**: rev **`196`**／**`BUILD=`** **`2026-05-14-purchase-fields-visibility`**（**個人 JBIS／共有 S-JBIS** は廃棄以外の **`pc_name` 連番から 1 から最小空き**・**`pc_name` 空のみ**自動採番・**登録済み PC 名は不変更**。**共有自動生成**は **671** クエリ修正・内部メタ **disabled 一時解除**後 `record.set`）。**フォーム** **rev 197**（**`purchase_amount`**・**`purchase_vendor`**・**`purchase_vendor_other`** を購入日直後）。**前 deploy（2026-05-11）**: fileKey **`8804a8a8-7512-475c-a2f9-5fcfc084a21b`**／rev **`177`**／**`BUILD=`** **`2026-05-11-pc-ledger-index-search-debug-localstorage`**（一覧 URL の **標準 `?q=`** を **`read674IndexSearchQueryAndKw674`** で読み、**条件クリア**時に **`navigate674ListWithQuery`**／hash strip で除去。カスタム **`query`／`npl674kw` 適用時は `q` を削除**して二重絞り込みを防止。**キーワード欄**は **`q` の `like "…"`** から復元（**`extract674KeywordFromNativeQ674`**）。**前 BUILD** の **実効条件** を **`kintone.app.getQueryCondition`** で判定し、**空なら**カスタム検索バー空＋URL の **`query`／`npl674kw`** 除去。**`request674IndexSearchHydrateFromUrl674`** は同期で **hydrate スキップ**可。ネイティブ **条件／絞り込み／フィルタ**＋**クリア**系クリックを **document capture** で追従。**前 BUILD** の **`read674IndexSearchQueryAndKw674`**・**`popstate`／`hashchange`**・**hash 内 query 除去**は継続。転用廃棄 **PUT `revision`→フォーム**・**GAIA** 対策は **前 BUILD 継続**。**WRAP_VER v12**（**`localStorage.npl674debug=1` または hash `npl674debug=1`** で一覧同期デバッグログ）。**前**: `index-search-native-q-param` → **`33be4da4-036c-4279-92d6-a30808e9061a`**／rev **`176`**。**前**: `index-search-kintone-query-condition-sync` → **`52894044-e0dc-408a-9a5a-9f62788a36d1`**／rev **`175`**。**前**: `index-search-hydrate-hash-popstate` → **`303baa16-0726-4c10-b644-cd658ff41256`**／rev **`174`**。**前**: `npl-disposed-put-revision-to-form` → **`e2ccb204-fef2-4fbc-bd01-5d2285dfdab1`**／rev **`173`**。**前**: `index-search-clear-hash-replace` → **`fefca2c0-0247-4601-b2f5-1bc600494b6b`**／rev **`172`**。**前**: `transfer-dispose-soft-sync-no-reload` → **`3b8400c0-5363-4a65-ae54-91024f6a015e`**／rev **`171`**。**前**: `npl-disposed-summary-pcname-only` → **`e1221e72-41d0-4276-b7bb-656b301fac7d`**／rev **`170`**。**前**: `npl-disposed-summary-pcname-first` → **`23f3acfe-6feb-438f-b1af-ada2c0fed67c`**／rev **`169`**。**前**: `transfer-dispose-revision-retry` → **`6132cf54-b3da-4c4f-9500-5ffa8d28488e`**／rev **`168`**。**前**: `npl-disposed-copy-rest-without-dom-gate` → **`ddcad6b3-576e-495f-848d-770f2d98d197`**／rev **`167`**。**前**: `get-record-revision-from-dollar` → **`601dcd61-9582-4002-8a6f-47af2745be6f`**／rev **`166`**。**前**: `transfer-wizard-record-fix` → **`a9a7530d-7ab8-47a6-a267-0c392a9e896f`**／rev **`165`**。57 フィールド・**`docs/plans/2026-04-21-new-pc-ledger-spec.md`**／Space **21** / thread **23**／**運用開始予定 2026-05-13**（仕様書 §1・**一覧 URL §4.8c**） |
| **部署予実・入力**（明細・`新フォーマット` 全列・`支払内訳` サブテーブル・月次 12 行） | **677** | `customize/677/desktop.js` \| `npm run deploy:677` | [https://jbis-kintone.cybozu.com/k/677/](https://jbis-kintone.cybozu.com/k/677/)・**担当者向けマニュアル**: **本番掲載**は専用 **[679](https://jbis-kintone.cybozu.com/k/679/)**（HTML）。678 は短い案内のみ（`npm run yojitsu:678:set-manual-pointer`）。リポ: `yojitsu-quick-manual.md` / `yojitsu-quick-manual.html`（`templates/yojitsu-budget-lite/docs/`）。`npm run yojitsu:679:sync-manual-js` → `deploy:679`・`window.Y678_QUICK_MANUAL_URL` でリンク先上書き可・**配置**: Space **54** / thread **58**・ポータル [スペース 54（thread 58）](https://jbis-kintone.cybozu.com/k/#/space/54/thread/58)。**2026-04-29**: 枠作成 deploy **SUCCESS**。**2026-05-02**: customize（`monthly_breakdown` 12 行整形＋保存時 **`支払内訳`→月次「実績」ロールアップ**・暦月合算・**ロールアップ例外時は保存ブロック `event.error`**）deploy **SUCCESS** / fileKey **`69629015-73da-40b7-9507-18232966bcbc`** / preview revision **9** / **BUILD=`2026-05-02-677-submit-error-guard`**。**2026-05-03**: 費用種別に応じ **ランニング／イニシャル片方のみ表示**・**枠種別＋保存検証**・実績ロールアップの **枠フィルタ**（`BUILD=2026-05-03-677-cost-category-field-guard`）。customize deploy **SUCCESS** / fileKey **`38c2bfd1-b420-4b37-ac7a-d54f534914c4`** / preview revision **`12`**。**2026-05-15**: **677 標準 UI からの追加・保存・削除・プロセス進行を拒否**（保存: `create`／`edit`／`index.edit.submit`、削除: `detail.delete`／`index.delete`（**一覧一括削除は PC のみ**・公式）、プロセス: `detail.process.proceed`、および **モバイル**の同等操作。いずれも `event.error` で **678 へ誘導**）。**明細の入力・更新・削除はダッシュ（678）のみ**（`SPEC.md` §6b 改定）。`npm run cio:preflight:677` → `npm run deploy:677` **Deploy SUCCESS** / fileKey **`ba3d6e18-9881-434c-8004-0c792ef76e0b`** / preview revision **`18`** / **BUILD=`2026-05-15-677-block-all-ui-mutations-dash678-only`**。**データ**: `C:\\tmp\\予算管理\\2026年度システム推進室_年間予算案20260123.xlsx` の **`旧フォーマット`** から **47 明細**を初回投入（`yojitsu-migration-kyu-to-kintone.md`・総計行除外・`npm run yojitsu:677:record-count`）。スペース内の旧アプリは **運用開始までに削除予定**（不要分）。`SPEC.md` §6–§6c |
| **部署予実・ダッシュ**（**集計管理の主画面**・俯瞰・入力アプリ参照） | **678** | `customize/678/desktop.js` \| `npm run deploy:678` | [https://jbis-kintone.cybozu.com/k/678/](https://jbis-kintone.cybozu.com/k/678/)・入力と同スペース。**2026-04-29** 枠のみ deploy **SUCCESS**。**2026-05-02**: 677 明細表・備考・`display_order` PUT・**API 失敗時メッセージ（コード・ヒント）**・リビジョン未取得時の案内 deploy **SUCCESS** / fileKey **`5f992f52-5148-4b10-b7fb-e018ff0bf8bf`** / preview revision **7** / **BUILD=`2026-05-02-678-dashboard-api-errors`**。**2026-05-03**: 費用種別「固定費」行に **`monthly_breakdown` 定額月額**の **「翌月〜4月同額（はい）」「この月のみ（いいえ）」**から 677 へ PUT。**続き**: 「変動費」行は **`initial_variable_budget` PUT**＋**月次「予算修正」**の **はい／いいえ**（翌月〜4月同額／当月のみ）・保存前 **費用種別再確認**（`BUILD=2026-05-03-678-variable-revision-propagate` → **`2026-05-03-678-kintone-api-url-fix`**（`kintone.api.url`）→ **`2026-05-03-678-table-scroll-touch`**（表幅・横スク）→ **`2026-05-03-678-hide-native-list`**（**678 標準一覧を非表示**）→ **`2026-05-03-678-passive-touch-patch`**（**touchstart/touchmove** の `passive` 未指定を既定 **true**）→ **`2026-05-03-678-running-monthly-readout`**（固定費・**`monthly_breakdown` 12 ヶ月実効の表示**）。customize deploy **SUCCESS** / fileKey **`b20b6b36-4177-4f64-b0bc-a8180a6e6309`** / preview revision **`57`**。**続（再デプロイ）**: グリッド版 **SUCCESS** / fileKey **`ee4eda1c-bf83-450c-a284-a54ce0c3a347`** / preview revision **`58`** / **BUILD=`2026-05-04-678-hide-recordcount-mo`**。**続**: 費用種別に応じ **月次「予算」「消費率」— 表示**・集計列の抑止・**支払モーダルに既存支払一覧**・枠種別表記 **ランニング** 修正 deploy **SUCCESS** / fileKey **`337db535-633e-49d5-a7f8-88b8680796ee`** / preview revision **`60`** / **BUILD=`2026-05-04-678-dash-columns-payment-list`**。**続（2026-05-05）**: 固定費の「予算修正」**はい／いいえ**・§6e **クリック範囲**（固定費＝**入力対象月**列＝入力月へジャンプで選択／変動費＝都度列）・実績モーダル **会社を新規登録する**。**customize deploy SUCCESS** / fileKey **`f6a47dcc-1e1c-425e-8f15-5a8e73a6f518`** / revision **`63`** / **BUILD=`2026-05-05-678-input-month-from-jump`**。**続（2026-05-06）**: 表上に**会社名変更手順**の案内。**deploy SUCCESS** / fileKey **`4ea59945-ce25-441a-bfaf-bbc0346ecd1d`** / revision **`64`** / **BUILD=`2026-05-06-678-company-change-hint`**。**続（2026-05-07）**: **入力月へジャンプ**の月ボタンで **target が Text ノード**でも反応するようクリック委譲を修正。月選択後の **横スクロール**は **requestAnimationFrame** で再描画直後に実行。**deploy SUCCESS** / fileKey **`5044d466-631e-4365-83ba-9f8a4336f792`** / revision **`65`** / **BUILD=`2026-05-07-678-month-jump-delegate-fix`**。**続（2026-05-07・表示名）**: ナビ・案内の **「月度ジャンプ」**を **「入力月へジャンプ」**に改称。**deploy SUCCESS** / fileKey **`d74060fa-b27c-41b1-8a8e-f3c6201cb69c`** / revision **`66`** / **BUILD=`2026-05-07-678-input-month-jump-label`**。**続（2026-05-07・会社）**: 実績モーダルで **FBJ・オフィスバスター・他のもの** 等を集合先判定に追加。**datalist** で候補選択＋入力可。保存時 **677 `partner_company` PUT**（集合先行はボタン未押下でも可）。**deploy SUCCESS** / fileKey **`9fb11414-6ae5-40d9-b0a8-532c53d07cf6`** / revision **`67`** / **BUILD=`2026-05-07-678-partner-preset-fbj-office`**。**続（2026-05-07・都度ナビ）**: ナビに **「都度費用」**ボタン（変動費の実績・予算修正列へジャンプ＋枠強調・`sessionStorage`）。**deploy SUCCESS** / fileKey **`a2e72bc6-3244-489e-87b7-398429288f8a`** / revision **`68`** / **BUILD=`2026-05-07-678-nav-tsudo-jump`**。**続**: 都度押下時は**月ナビの押下見た目のみ解除**（入力対象月は維持）。**deploy SUCCESS** / fileKey **`7b58fc4b-4147-4ce4-85aa-3c5d84a4d33e`** / revision **`69`** / **BUILD=`2026-05-07-678-nav-tsudo-clear-month-ui`**。**続（会社）**: 実績モーダルに **会社候補の `<select>`**＋**NFKC 表記ゆれ**で集合先判定を拡張（FBJ 全角等・他の派生）。**deploy SUCCESS** / fileKey **`b1ce263d-0a2d-4848-ad35-fdd20b7b58e6`** / revision **`70`** / **BUILD=`2026-05-07-678-partner-select-nfkc`**。**続（2026-05-04）**: シェル最上段 **クイックマニュアル** リンク・本文長文削除（fileKey **`b5e8b981-d050-44ca-98e5-eda0430bf756`** / rev **`87`**）。**続**: **アプリの説明**に HTML マニュアル掲載（`npm run yojitsu:678:publish-manual-description`）・リンク先 `#y678-quick-manual`。customize **deploy SUCCESS** / fileKey **`f53d40ea-5d60-4d8e-8442-775a0d744a9b`** / revision **`90`** / **BUILD=`2026-05-04-678-manual-in-app-description`**。**続（2026-05-04・679）**: マニュアル全文は **専用アプリ 679** へ移設。678 の説明欄は **679 への短案内**（`npm run yojitsu:678:set-manual-pointer`）。**続**: **再デプロイ**。**deploy SUCCESS** / fileKey **`e901ad5f-d7fb-4016-97f1-84d6f871f723`** / revision **`109`** / **BUILD=`2026-05-04-678-manual-app-guide-name`**。**2026-05-05**: 台帳整合のため **live 再デプロイ** `npm run deploy:678` **SUCCESS** / fileKey **`6074bbd9-62bf-4746-b522-ec4ebcdeba12`** / revision **`110`** / **BUILD=`2026-05-04-678-manual-app-guide-name`**（`customize/678/desktop.js` HEAD）。**2026-05-15**: ランニング固定費の実績セル着色を**入力対象月**基準に修正（暦日当月のみ見ていた不具合）。`CB_VA01` 時は単票 GET で **1 回再 PUT**（実績保存・支払削除）。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`e31e461c-28d3-47e5-b8b5-9a69f91d4f74`** / preview revision **`132`** / **BUILD=`2026-05-15-678-input-month-running-color-cbva01-retry`**。**2026-05-15（続）**: `monthly_breakdown.month_actual` のみ入り **`支払内訳` 0 件**のときの案内＋着色に月次実績も反映。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`811c2d53-6874-4a0a-8040-18304b5d3d33`** / preview revision **`133`** / **BUILD=`2026-05-15-678-monthly-actual-without-payment-hint`**。**2026-05-15（続2）**: `CB_VA01` 対策強化: 実績保存・支払削除で PUT 前に単票 GET、`lastRawRecords` を最新に同期、`CB_VA01` 時 **GET→再 PUT 最大 3 回**（進捗表示）。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`6e027f1c-7f75-47c0-b638-5cadd29c08cd`** / preview revision **`134`** / **BUILD=`2026-05-15-678-cbva01-prefetch-multiretry-cache`**。**2026-05-15（続3）**: `CB_VA01` 追加対策 — **変動費**で実績モーダル開いたとき **枠種別を既定で「イニシャル費用（変動費）」**にし、保存時も空なら同値を補完（**その他**費用種別で枠未選択はクライアントで明示ブロック）。`CB_VA01` 時の **GET→再 PUT を最大 6 回**＋再 GET 前の短い遅延、エラー全文突合で競合判定を強化。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`bb06c548-09ee-4ade-af0c-74ad7da33a66`** / preview revision **`135`** / **BUILD=`2026-05-15-678-cbva01-bucket-default-retry6`**。**2026-05-15（続4）**: 実績モーダル表示時に **単票 GET で `支払内訳` を 677 と同期**（678 一覧キャッシュ・**最大 100 件**読込と 677 詳細表示のズレ対策）。保存時は **サブテーブル行 id** で編集行を突合。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`c4beb7da-6ab8-4a4a-8d3d-e6c3acd6b3ab`** / preview revision **`136`** / **BUILD=`2026-05-15-678-paymodal-singleget-editid`**。**2026-05-15（続5）**: **孤児月次**（`month_actual` あり・`支払内訳` 0 件）の UI 文言を **「月次列と支払内訳ブロックは別」**と明確化。`SPEC.md` §6e に **677 詳細の見え方と API 正の関係**を追記。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`72f72412-6ddb-4ce9-83b0-fefbc8012c31`** / preview revision **`137`** / **BUILD=`2026-05-15-678-orphan-hint-clarify-monthly-vs-payment`**。**2026-05-15（続6）**: **677＝678 の数値正本**をシェル常時バナー表示。**677 一覧 GET の `limit` を 500**（従来 100）。上限到達時はステータス警告。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`55b147b4-d2e0-4a73-adde-d95664d3374e`** / preview revision **`138`** / **BUILD=`2026-05-15-678-677-parity-truth-bar-limit500`**。**2026-05-15（続7）**: 実績モーダル **`budget_bucket`** の REST 値を **677 の DROP_DOWN キー**（**ラーニング費用（定額費）**／長音）に一致させ **CB_VA01**（誤った「ランニング…」value）を解消。表示ラベルは「ランニング」のまま。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`25bfe472-75aa-4f52-beb4-2d2d6159a762`** / preview revision **`139`** / **BUILD=`2026-05-15-678-budget-bucket-kintone-spelling`**。**2026-05-15（続8）**: 固定費ランニング実績の **緑／橙**を **リアル暦の当月列のみ**（`getCurrentMonthLabel()`）に付与し、担当者が **今月の支払処理漏れ** を一覧で確認可能に。**入力対象月**はクリック編集先のみ（§6e 維持）。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`f8512e1d-ff61-4587-9242-93cf56d5aa8b`** / preview revision **`140`** / **BUILD=`2026-05-15-678-running-actual-color-real-calendar-month`**。**2026-05-15（続9）**: `runningActualStatusClass678` が **予算＋予算修正が 0** でも **`month_actual` または該当月ランニング支払**があれば **緑**（`fixedRunningMonthRequiresActual678` のみで先に return していた不具合）。`npm run cio:preflight:678` → `npm run deploy:678` **Deploy SUCCESS** / fileKey **`649cedd1-e85f-4b09-b129-8a91138d4b94`** / preview revision **`141`** / **BUILD=`2026-05-15-678-running-actual-status-orphan-actual`**。REST で説明欄確認済: 「クイックマニュアル (専用アプリ 679)」は **説明欄に無し**（679 への短案内のみ）。`SPEC.md` §6・§6b・§6c・§6e |
| **部署予実クイックマニュアル**（HTML・表中心・一覧カスタマイズのみ） | **679** | `customize/679/desktop.js` \| `npm run yojitsu:679:sync-manual-js` → `npm run deploy:679` | [https://jbis-kintone.cybozu.com/k/679/](https://jbis-kintone.cybozu.com/k/679/)・Space **54** / thread **58**・本文は `templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html` から同期。**2026-05-04** アプリ新規（preview→live **SUCCESS**）・customize **deploy SUCCESS** / fileKey **`3c6b72d4-ac94-4600-920d-e6bd13c8bd1e`** / revision **`3`** / **BUILD=`2026-05-04-679-yojitsu-quick-manual-page`**。**2026-05-15**: マニュアル本文・679 シェル上ナビから **677 向けリンク**を削除（`npm run yojitsu:679:sync-manual-js` 再生成）。`npm run cio:preflight:679` → `npm run deploy:679` **Deploy SUCCESS** / fileKey **`f361ff16-1a9e-4871-95d1-f77118a331f8`** / revision **`30`** / **BUILD=`2026-05-15-679-manual-no-677-nav`** |

### 678 本番 customize の実効ビルド（台帳ずれの正）

- **現在の本番 live**（**2026-05-22** `deploy:678` **Deploy SUCCESS**）: fileKey **`3db9f10b-ff67-4b09-ab56-29cd2d124228`** / preview revision **`165`** / **`var BUILD`** = **`2026-05-22-678-payment-date-label-usage-month`**（実績入力の **支払日→利用月** 表示・暦月帰属ヒント）。
- **直前**（**2026-05-22**）: fileKey **`a1b82f58-e9aa-4d3b-8c1e-07d683db48b3`** / revision **`164`** / **`2026-05-22-678-new-detail-fixed-month-pick`**（新規明細・固定費 開始月／支払月）。
- **直前**（**2026-05-16** 先祖返り復旧＋registry 整合）: fileKey **`33343967-1f61-4981-88fe-924a090918b3`** / preview revision **`157`** / **`var BUILD`** = **`2026-05-15-678-hide-native-pager-zero-label`**（`cio:audit:portfolio:strict` **8/8 OK**・CEO 検収済み）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "hide 0-0 paging label MO pager css"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`9e451b68-3771-4df5-ae61-69864dbdf6f1`** / preview revision **`153`** / **`var BUILD`** = **`2026-05-15-678-hide-native-pager-zero-label`**（**「0 - 0 （0件中）」**等の **非表示強化**：正規化・**MO は 678 のみ常時**・**一覧 show 直後に即時**・**`.gaia-argoui-app-index-pager`** CSS）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "outlook column vertical-align middle"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`dd77e2ea-fc48-433d-94c7-7027c9e3ec0b`** / preview revision **`152`** / **`var BUILD`** = **`2026-05-15-678-cell-vertical-middle`**（**予算見通し**列 **`vertical-align:middle`**（従来 `top`））。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "header remove 677 list and new links"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`021a12e9-fb11-4eb5-90f5-c39ad79a1753`** / preview revision **`151`** / **`var BUILD`** = **`2026-05-15-678-header-remove-677-quicklinks`**（**シェルヘッダ**から **677 一覧・677 新規（/edit）リンク**を削除。**再読み込み**・678 自リンク・679 マニュアルは維持）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "remove truth bar outlook comment wrap"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`8c0dfc6c-4b3d-4199-97e1-0390384e0a78`** / preview revision **`150`** / **`var BUILD`** = **`2026-05-15-678-outlook-comment-remove-truth-bar`**（**677＝678 長文バナー撤去**・**予算見通し**を **コメント風ラップ**表示）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "fixed monthly budget outlook column alerts"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`b8e66291-4487-4f30-a630-5e7ef8638c48`** / preview revision **`149`** / **`var BUILD`** = **`2026-05-15-678-fixed-monthly-outlook-column`**（**固定費・月額**のみ左 **「予算見通し」**列・累積予算対実績で **枯渇目安／余力大** アラート短文・**順調** 薄色・LLM なし）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "annual fixed 年額 non-payment month cols dash"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`df3a0361-0695-4364-8c8f-c48faf90ebdf`** / preview revision **`148`** / **`var BUILD`** = **`2026-05-15-678-annual-fixed-nonpay-dash`**（**固定費・年額**で **予算＋予算修正が正の暦月が一意**のとき、**支払月以外**の暦月 12 列は **予算・実績・消費率・予算修正を `---`**・**該当列は編集不可**。0／複数正月は従来表示）。
- **本番 live**（**2026-05-15** `npm run cio:preflight:678 -- --note "pending month filter toggle remove run-actual cell CSS"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`9a93aca4-687e-4919-bb7d-a90aad3701f5`** / preview revision **`147`** / **`var BUILD`** = **`2026-05-15-678-pending-month-filter-no-cell-color`**（**「今月の実績未入力（¥0）のみ」トグル**・**実績セル緑／橙 CSS 廃止**。費用種別フィルタと **AND**）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "monthly duplicate lab merge act sum cost trim y678DbgRun"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`aad75d6d-0903-430d-89ba-5f2c5973efaa`** / preview revision **`146`** / **`var BUILD`** = **`2026-05-15-678-running-actual-monthly-merge-dbg`**（**月次同一暦月の複数行**を **実績等で合算**。**`cost_category` trim**。**`?y678DbgRun=1`** で当月実績セル **title** に dbg）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "fiscal_month strip T before YYYY-MM-DD normalize"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`9a8fd1a3-972e-4a16-8eac-33ce5d9d771a`** / preview revision **`145`** / **`var BUILD`** = **`2026-05-15-678-fiscal-month-iso-date-stem`**（**`fiscal_month` が `2026-05-07T…`（DATETIME 文字列）**のとき **`T` 前**を暦月キーに正規化）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "fiscal_month YYYY-MM map to calendar month key for green"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`0c9aa72d-d902-4f38-b5a3-31e5014e8b9a`** / preview revision **`144`** / **`var BUILD`** = **`2026-05-15-678-fiscal-month-yyyymm-key`**（**`fiscal_month` が `2026-05` 形式**のレコードを列キー **`5`** と突合。**緑判定の `month_actual`／予算行検索**と **表の実績表示**が一致）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "payment_date fullwidth ja date fiscal_month fw digits"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`b890cfcd-402b-4c00-ac37-55693c7d8945`** / preview revision **`143`** / **`var BUILD`** = **`2026-05-15-678-running-actual-date-parse-fw`**（**支払日**の **全角数字**・**`YYYY年M月D日`**・**`.` 区切り**。**`fiscal_month` 全角月**も列突合に寄せる）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "payment_date slash YYYY/MM/DD month parse for running actual green"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`98658fb3-15a4-40fa-81fd-53ec8296c390`** / preview revision **`142`** / **`var BUILD`** = **`2026-05-15-678-payment-date-slash-month-parse`**（**`YYYY/MM/DD`** 等の暦月一致）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "running actual green when month_actual without budget gate"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`649cedd1-e85f-4b09-b129-8a91138d4b94`** / preview revision **`141`** / **`var BUILD`** = **`2026-05-15-678-running-actual-status-orphan-actual`**（**予算＋予算修正 0 でも** `month_actual`／支払で **緑**。リアル暦当月列の着色は継続）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "running actual green/orange real calendar month column only"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`f8512e1d-ff61-4587-9242-93cf56d5aa8b`** / preview revision **`140`** / **`var BUILD`** = **`2026-05-15-678-running-actual-color-real-calendar-month`**（**リアル暦の当月列のみ**に固定費ランニング実績の **緑／橙**・**今月の支払処理漏れ** 確認。**入力対象月**は編集先のみ §6e）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "budget_bucket kintone spelling CB_VA01 fix"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`25bfe472-75aa-4f52-beb4-2d2d6159a762`** / preview revision **`139`** / **`var BUILD`** = **`2026-05-15-678-budget-bucket-kintone-spelling`**（**677 の `payment_breakdown.budget_bucket` キー**（**ラーニング費用（定額費）**）と **678 の PUT 値**を一致させ **CB_VA01** を解消）。
- **直前**（**2026-05-15** `npm run cio:preflight:678 -- --note "677=678 parity truth bar records limit 500"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`55b147b4-d2e0-4a73-adde-d95664d3374e`** / preview revision **`138`** / **`var BUILD`** = **`2026-05-15-678-677-parity-truth-bar-limit500`**（**677＝678 数値正本バナー**・**677 `records.json` の `limit` を 500**・上限到達時ステータス警告）。
- **直前**（**2026-05-14** `npm run cio:preflight:678 -- --note "固定費ランニング当月実績色分け bucket修正"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`c9c5dba1-652b-47f6-9226-2bbf0f8e878a`** / preview revision **`131`** / **`var BUILD`** = **`2026-05-14-678-running-actual-bucket-fix`**（**暦当月**の **固定費**ランニング実績セルで **月予算あり**行を **支払内訳（ランニング／枠未選択）**の有無で **未入力（橙）／入力済み（緑）**色分け）。
- **直前**（**2026-05-12** `npm run cio:preflight:678 -- --note "678実績Enter修正削除プリfill本番反映"` → `npm run deploy:678` **Deploy SUCCESS**）: fileKey **`f0902f20-8cc8-4a94-844e-d58f335cbe11`** / preview revision **`129`** / **`var BUILD`** = **`2026-05-12-678-enter-editdelete-prefill`**
- **直前**（**2026-05-07T12:51:15Z** GitHub Actions `kintone-customize-deploy` SUCCESS 時点・直前の **`npm run deploy:678` rev=127** から自動再デプロイで **rev=128** に更新）: fileKey **`202605071251158BEA7DFC8E174812AD1FFD6CEEF183F6265`** / preview revision **`128`** / **`var BUILD`** = **`2026-05-07-678-ivb-empty-as-dim`**。**変更内容**: `computeAggregates()` の `initial_variable_budget` 取得を **`ivRaw` 元値保持＋ `iv = toNum(ivRaw)` 数値化**の 2 変数に分離し、表示用に **`ivBudgetForDisplay = ivRaw === "" || ivRaw == null ? "" : iv`** を追加。`initial.budget` を `ivBudgetForDisplay` に差し替え、空のとき `formatYen("")` → `Y678_EMPTY_HTML="---"` を返す挙動に。消費率（`pct(sumA, iv + sumR)`）は数値 `iv` のままで影響なし。**実機影響**: 変動費 9 件中 EMPTY 1 件（$id=70 PC購入費）の予算セルが `¥0` → `---` に変化。POSITIVE 8 件は表示変化なし。`SPEC.md` §6f 「`initial_variable_budget` の v1 既定運用」新節および §6f 業務 3 区分テーブルの変動費行を更新。`yojitsu-master-and-field-plan.md` §3 に SPEC §6f 参照を追記。
- **直前**（2026-05-07T12:14:21Z GitHub Actions 自動再デプロイ）: fileKey **`20260507121419E8BC8237900E4FF883E1A9D0E0E9EA3F041`** / preview revision **`126`** / **`var BUILD`** = **`2026-05-07-678-partner-presets-canonical-confirm`**（取引先 16 社・表記揺れ整理・B3 確認・NFKC 自動正規化）。
- **直前**（2026-05-07T11:08Z GitHub Actions 自動再デプロイ）: fileKey **`d2a0feb8-c1ae-4ac0-9545-5cbad4e4d115`** / preview revision **`124`** / **`var BUILD`** = **`2026-05-07-678-cost-category-filter-split`**（費用種別フィルタを 4 ボタン化）。
- **上表 678 行の `2026-05-05`〜`05-07` 風の連記**は、**現行 `desktop.js`（上記 BUILD）のバンドルには含まれない**メモ行である（当該機能を載せるときは **ソース改修＋`BUILD` 更新**のうえ **deploy:678**）。
- **再デプロイ手順**: **`npm run deploy:678`** → 成功したら **fileKey / revision** を本節および表の末尾へ追記する。

※ **631** … `collect` / `analyze` が読むニュース。**632** … `analyze` が書き込む週次要約のみ。`.env`: `KINTONE_APP_ID=631` , `KINTONE_REPORT_APP_ID=632`。API トークンに **両アプリ**を載せる。  
※ **権限**: 自動化の最低限は **レコード閲覧＋追加**。閲覧・追加・編集・削除・アプリ管理のフル付与でもスクリプトは動作するが、トークン漏えい時のリスク低減のため余分な権限は削るとよい（詳細は `security-next-automation/README.md`）。

**出張精算の ID 出所**: テナントで `GET /k/v1/apps.json?name=出張精算` を実行し **629** と突合済み（2026-03-28）。

**Security NEXT**: 収集 [631](https://jbis-kintone.cybozu.com/k/631/) ・週次要約 [632](https://jbis-kintone.cybozu.com/k/632/)（ユーザー確定）。630 は未使用なら無視可。トークンに **631 と 632** の権限を付与。シークレットは **Secrets / `.env` のみ**。**日次（10:00/17:00 JST）**: `collect.ts` がキーワード選別で最大3件を631へ（Gemini 不使用）。**金曜17:00 JST**: `analyze` が週次要約を632へ（Gemini 使用）。詳細は `security-next-automation/README.md` の「運用スケジュール」。

**Security NEXT 連携**: フィールドコードの正本は `security-next-automation/README.md` と `security-next-automation/src/lib/field-codes.ts`。アプリ新規なら `npm run setup:security-next-apps` も可。

**FAQ（640）**: 社内 FAQ の **DB はアプリ 640**（[https://jbis-kintone.cybozu.com/k/640/](https://jbis-kintone.cybozu.com/k/640/)）で確定。運用ガイド（668）や PC 台帳系アプリとは **別アプリ**。

**638 / 639**: アプリ台帳上も論理名は **「社内FAQDB」** と同一だが、**容量・件数は実質空に近く**、**640 が運用中の正本**（台帳: 640 は DB 保管・日付・利用指標が立っている）。638・639 は **旧枠・未移行の残骸**の可能性が高い → ルックアップ等の依存なし確認済。**2026-05-20 頃**まで様子見のうえ **削除予定**（その前に CSV バックアップ推奨）。このリポのコードからは未参照。

### デイリーヘルスチェック（廃止）

**2026-05 以降**: 全アプリの REST 定期診断（旧 `space-health-report` / GitHub Actions / `npm run report:space-health`）は **運用しない**。アプリの正は **社内アプリ台帳** と **`## アプリ一覧`** とする。

- **運用確認用 URL**  
  - ニュース（収集）: [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/)  
  - 週次要約: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/)

- **メンテ手順の正本**: [`docs/maintenance-template.md`](docs/maintenance-template.md)。エージェント・開発の前提ルールは [`AGENTS.md`](AGENTS.md)。
### GitHub Actions デプロイ記録（自動）

| 日時（UTC） | アプリID | customize パス |
|-------------|----------|----------------|
| 2026-07-07T15:18:26Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-07-07T10:27:26Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-07-04T10:44:40Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T10:41:26Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T10:34:08Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T10:14:37Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T09:48:38Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T09:07:57Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T09:04:58Z | 736 | `customize/736/desktop.js` |
| 2026-07-04T08:56:03Z | 736 | `customize/736/desktop.js` |
| 2026-07-03T23:58:32Z | 595 | `customize/595/desktop.js` |
| 2026-07-02T06:09:53Z | 595 | `customize/595/desktop.js` |
| 2026-06-30T12:21:38Z | 595 | `customize/595/desktop.js` |
| 2026-06-29T09:29:58Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-06-29T09:29:58Z | 595 | `customize/595/desktop.js` |
| 2026-06-25T13:50:56Z | 683 | `customize/683/desktop.js` |
| 2026-06-24T12:16:45Z | 736 | `customize/736/desktop.js` |
| 2026-06-24T11:16:57Z | 736 | `customize/736/desktop.js` |
| 2026-06-24T11:03:18Z | 736 | `customize/736/desktop.js` |
| 2026-06-24T11:01:56Z | 736 | `customize/736/desktop.js` |
| 2026-06-24T10:56:03Z | 736 | `customize/736/desktop.js` |
| 2026-06-24T10:51:10Z | 688 | `customize/688/desktop.js` |
| 2026-06-24T10:49:30Z | 688 | `customize/688/desktop.js` |
| 2026-06-24T10:47:08Z | 688 | `customize/688/desktop.js` |
| 2026-06-24T10:40:30Z | 688 | `customize/688/desktop.js` |
| 2026-06-23T12:23:12Z | 736 | `customize/736/desktop.js` |
| 2026-06-23T10:49:09Z | 688 | `customize/688/desktop.js` |
| 2026-06-23T10:44:37Z | 688 | `customize/688/desktop.js` |
| 2026-06-23T10:42:20Z | 688 | `customize/688/desktop.js` |
| 2026-06-23T10:36:08Z | 688 | `customize/688/desktop.js` |
| 2026-06-22T09:29:12Z | 688 | `customize/688/desktop.js` |
| 2026-06-21T09:22:02Z | 688 | `customize/688/desktop.js` |
| 2026-06-20T23:13:13Z | 736 | `customize/736/desktop.js` |
| 2026-06-21T12:00:00Z | 736 | `customize/736/desktop.js`（**法定福利費（合計）ラベル＋薄茶色合計行**・**BUILD** `2026-06-21-jikkou-yosan-legal-welfare-total-label`・rev **`94`** / fileKey **`3aa633a8-6799-41a6-82e7-322a5f460c6d`**） |
| 2026-06-20T12:20:43Z | 736 | `customize/736/desktop.js` |
| 2026-06-20T23:00:00Z | 736 | `customize/736/desktop.js`（**詳細表印刷レイアウトv2**・**BUILD** `2026-06-20-jikkou-yosan-print-detail-v2`・rev **`79`**） |
| 2026-06-20T22:30:00Z | 736 | `customize/736/desktop.js`（**総括表印刷調整**・**BUILD** `2026-06-20-jikkou-yosan-print-tune`・rev **`78`**） |
| 2026-06-20T22:00:00Z | 736 | `customize/736/desktop.js`（**タブ別印刷v1**・**BUILD** `2026-06-20-jikkou-yosan-print-v1`・rev **`77`**） |
| 2026-06-20T21:00:00Z | 736 | `customize/736/desktop.js`（**ヘルプバナー形式**・**BUILD** `2026-06-20-jikkou-yosan-help-banner`・rev **`76`**） |
| 2026-06-20T20:30:00Z | 736 | `customize/736/desktop.js`（**詳細表ヘルプを詳細表タブへ**・**BUILD** `2026-06-20-jikkou-yosan-help-detail-move`・rev **`75`**） |
| 2026-06-20T20:00:00Z | 736 | `customize/736/desktop.js`（**ヘルプを各ブロックへ移動**・**BUILD** `2026-06-20-jikkou-yosan-help-section-move`・rev **`74`**） |
| 2026-06-20T19:30:00Z | 736 | `customize/736/desktop.js`（**詳細表ヘルプ折りたたみ**・**BUILD** `2026-06-20-jikkou-yosan-help-detail`・rev **`73`**） |
| 2026-06-20T19:00:00Z | 736 | `customize/736/desktop.js`（**仕様・原価ヘルプ見出し整理**・**BUILD** `2026-06-20-jikkou-yosan-help-spec-cost`・rev **`72`**） |
| 2026-06-20T18:30:00Z | 736 | `customize/736/desktop.js`（**原価行・計行ヘルプ折りたたみ**・**BUILD** `2026-06-20-jikkou-yosan-cost-help-panel`・rev **`71`**） |
| 2026-06-20T18:00:00Z | 736 | `customize/736/desktop.js`（**syncInputs行削除エラー修正**・**BUILD** `2026-06-20-jikkou-yosan-sync-inputs-fix`・rev **`70`**） |
| 2026-06-20T17:30:00Z | 736 | `customize/736/desktop.js`（**同工種2行以上で計行自動**・**BUILD** `2026-06-20-jikkou-yosan-auto-subtotal-rows`・rev **`69`**） |
| 2026-06-20T17:00:00Z | 736 | `customize/736/desktop.js`（**労務費＋列ずれ修正・追加行ハイライト**・**BUILD** `2026-06-20-jikkou-yosan-labor-col-fix-highlight`・rev **`68`**） |
| 2026-06-20T16:30:00Z | 736 | `customize/736/desktop.js`（**総括表も行挿入・見出し追加**・**BUILD** `2026-06-20-jikkou-yosan-summary-row-insert`・rev **`67`**） |
| 2026-06-20T16:00:00Z | 736 | `customize/736/desktop.js`（**見出しに末尾追加ボタン移動**・**BUILD** `2026-06-20-jikkou-yosan-section-add-top`・rev **`66`**） |
| 2026-06-20T15:30:00Z | 736 | `customize/736/desktop.js`（**詳細表行ごと追加位置指定**・**BUILD** `2026-06-20-jikkou-yosan-row-insert-after`・rev **`65`**） |
| 2026-06-21T06:45:00Z | 688 | `customize/688/desktop.js`（**不稼働率100%超コメント欄・式付き内訳**・**BUILD** `2026-06-21-688-rate-over100-comment-formula`・**deploy SUCCESS** / fileKey **`d4fe5f5a-9c00-4a80-b64c-729f9751c50b`** / rev **`37`**） |
| 2026-06-20T15:00:00Z | 736 | `customize/736/desktop.js`（**詳細表明細行追加・種別リスト**・**BUILD** `2026-06-20-jikkou-yosan-sub-detail-add`・rev **`64`**） |
| 2026-06-20T14:30:00Z | 736 | `customize/736/desktop.js`（**仕様・材料・工種列幅調整**・**BUILD** `2026-06-20-jikkou-yosan-table-col-width-v3`・rev **`63`**） |
| 2026-06-20T14:00:00Z | 736 | `customize/736/desktop.js`（**工種CD・種別CD列幅再調整**・**BUILD** `2026-06-20-jikkou-yosan-cost-col-width-v2`・rev **`62`**） |
| 2026-06-20T13:30:00Z | 736 | `customize/736/desktop.js`（**原価行列幅調整・種別列拡大**・**BUILD** `2026-06-20-jikkou-yosan-cost-col-width`・rev **`61`**） |
| 2026-06-20T13:00:00Z | 736 | `customize/736/desktop.js`（**工種・種別の繰り上げ空白表示**・**BUILD** `2026-06-20-jikkou-yosan-repeat-blank-display`・rev **`60`**） |
| 2026-06-20T12:30:00Z | 736 | `customize/736/desktop.js`（**工種CD・種別CDプレースホルダ空白**・**BUILD** `2026-06-20-jikkou-yosan-code-blank-placeholder`・rev **`59`**） |
| 2026-06-20T12:00:00Z | 736 | `customize/736/desktop.js`（**行種別「詳細表と連携」表記**・**BUILD** `2026-06-20-jikkou-yosan-link-row-label`・rev **`58`**） |
| 2026-06-19T12:21:29Z | 688 | `customize/688/desktop.js` |
| 2026-06-20T00:00:04Z | 736 | `customize/736/desktop.js`（**一覧 作成日・更新日**・**BUILD** `2026-06-20-jikkou-yosan-list-dates`・rev **`38`**） |
| 2026-06-20T00:00:03Z | 736 | `customize/736/desktop.js`（**一覧6列**・**BUILD** `2026-06-20-jikkou-yosan-list-columns`・rev **`37`**） |
| 2026-06-20T00:00:01Z | 736 | `customize/736/desktop.js`（**一覧サブタイトル**・**BUILD** `2026-06-20-jikkou-yosan-subtitle`・rev **`35`**） |
| 2026-06-20T00:00:00Z | 736 | `customize/736/desktop.js`（**表示名同期**・**BUILD** `2026-06-20-jikkou-yosan-display-name`・rev **`34`**） |
| 2026-06-19T12:01:24Z | 688 | `customize/688/desktop.js` |
| 2026-06-19T12:01:24Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-06-19T12:01:24Z | 595 | `customize/595/desktop.js` |
| 2026-06-18T12:59:51Z | 736 | `customize/736/desktop.js` |
| 2026-06-18T12:51:23Z | 736 | `customize/736/desktop.js` |
| 2026-06-18T15:00:00Z | 736 | `customize/736/desktop.js`（**v10 双方向コード・行追加・連携緑・ジャンプ**・**BUILD** `2026-06-18-jikkou-yosan-v10-bidir-codes`・rev **`29`**） |
| 2026-06-18T14:00:00Z | 736 | `customize/736/desktop.js`（**計算修正+サンプル2623001-001 record=1**・**BUILD** `2026-06-18-jikkou-yosan-v2-excel-form-calc`・rev **`7`**） |
| 2026-06-18T12:00:00Z | 736 | `customize/736/desktop.js`（**Excel風一覧+総括/詳細フォーム**・**BUILD** `2026-06-18-jikkou-yosan-v2-excel-form`・rev **`6`**） |
| 2026-06-18T00:00:00Z | 736 | `customize/736/desktop.js`（**実行予算書 Excel UI v1**・**BUILD** `2026-06-18-jikkou-yosan-v1`・**deploy SUCCESS** / fileKey **`8ff7afba-c974-4c18-882d-bea41db2d9cf`** / rev **`5`**） |
| 2026-06-17T13:24:13Z | 595 | `customize/595/desktop.js` |
| 2026-06-17T12:45:00Z | 595 | `customize/595/desktop.js`（**627 downstream 廃止**・674/714/716 のみ・**BUILD=`2026-06-17-595-drop-627-downstream`** rev **92**） |
| 2026-06-14T00:01:18Z | 595 | `customize/595/desktop.js` |
| 2026-06-13T23:16:23Z | 595 | `customize/595/desktop.js` |
| 2026-06-13T01:12:27Z | 688 | `customize/688/desktop.js` |
| 2026-06-09T12:18:35Z | 688 | `customize/688/desktop.js` |
| 2026-06-09T12:18:35Z | 687 | `customize/687/desktop.js` |
| 2026-06-09T12:18:35Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-30T12:22:33Z | 595 | `customize/595/desktop.js` |
| 2026-05-27T09:50:29Z | 678 | `customize/678/desktop.js` |
| 2026-05-24T09:22:26Z | 686 | `customize/686/desktop.js` |
| 2026-05-24T09:22:26Z | 683 | `customize/683/desktop.js` |
| 2026-05-24T09:22:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-24T09:22:26Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-16T10:59:47Z | 686 | `customize/686/desktop.js` |
| 2026-05-16T10:59:47Z | 677 | `customize/677/desktop.js` |
| 2026-05-16T10:59:47Z | 627 | `customize/627/desktop.js` |
| 2026-05-15T23:14:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-15T12:35:00Z | 678 | `customize/678/desktop.js`（**今月実績未入力のみトグル・実績セル着色廃止**・**BUILD** `2026-05-15-678-pending-month-filter-no-cell-color`・**deploy SUCCESS** / fileKey **`9a93aca4-687e-4919-bb7d-a90aad3701f5`** / rev **`147`**・`cio:preflight:678` note **pending month filter toggle remove run-actual cell CSS**） |
| 2026-05-15T12:25:00Z | 678 | `customize/678/desktop.js`（**月次同一暦月合算・cost trim・y678DbgRun**・**BUILD** `2026-05-15-678-running-actual-monthly-merge-dbg`・**deploy SUCCESS** / fileKey **`aad75d6d-0903-430d-89ba-5f2c5973efaa`** / rev **`146`**・`cio:preflight:678` note **monthly duplicate lab merge act sum cost trim y678DbgRun**） |
| 2026-05-15T12:15:00Z | 678 | `customize/678/desktop.js`（**fiscal_month `…T…` を日付幹に**・**BUILD** `2026-05-15-678-fiscal-month-iso-date-stem`・**deploy SUCCESS** / fileKey **`9a8fd1a3-972e-4a16-8eac-33ce5d9d771a`** / rev **`145`**・`cio:preflight:678` note **fiscal_month strip T before YYYY-MM-DD normalize**） |
| 2026-05-15T12:05:00Z | 678 | `customize/678/desktop.js`（**fiscal_month `YYYY-MM`→暦月キー**・**BUILD** `2026-05-15-678-fiscal-month-yyyymm-key`・**deploy SUCCESS** / fileKey **`0c9aa72d-d902-4f38-b5a3-31e5014e8b9a`** / rev **`144`**・`cio:preflight:678` note **fiscal_month YYYY-MM map to calendar month key for green**） |
| 2026-05-15T11:49:04Z | 678 | `customize/678/desktop.js`（**支払日 全角数字・`YYYY年M月D日`・`.` 区切り・fiscal_month 全角月**・**BUILD** `2026-05-15-678-running-actual-date-parse-fw`・**deploy SUCCESS** / fileKey **`b890cfcd-402b-4c00-ac37-55693c7d8945`** / rev **`143`**・`cio:preflight:678` note **payment_date fullwidth ja date fiscal_month fw digits**） |
| 2026-05-15T11:43:00Z | 678 | `customize/678/desktop.js`（**支払日スラッシュ／1桁月日で暦月一致**・**BUILD** `2026-05-15-678-payment-date-slash-month-parse`・**deploy SUCCESS** / fileKey **`98658fb3-15a4-40fa-81fd-53ec8296c390`** / rev **`142`**・`cio:preflight:678` note **payment_date slash YYYY/MM/DD month parse for running actual green**） |
| 2026-05-15T11:40:00Z | 678 | `customize/678/desktop.js`（**実績色 予算0でも month_actual で緑**・**BUILD** `2026-05-15-678-running-actual-status-orphan-actual`・**deploy SUCCESS** / fileKey **`649cedd1-e85f-4b09-b129-8a91138d4b94`** / rev **`141`**・`cio:preflight:678` note **running actual green when month_actual without budget gate**） |
| 2026-05-15T12:30:00Z | 678 | `customize/678/desktop.js`（**実績色 リアル暦当月列のみ**・**BUILD** `2026-05-15-678-running-actual-color-real-calendar-month`・**deploy SUCCESS** / fileKey **`f8512e1d-ff61-4587-9242-93cf56d5aa8b`** / rev **`140`**・`cio:preflight:678` note **running actual green/orange real calendar month column only**） |
| 2026-05-15T11:04:52Z | 678 | `customize/678/desktop.js`（**budget_bucket 677 キー整合（ラーニング）CB_VA01**・**BUILD** `2026-05-15-678-budget-bucket-kintone-spelling`・**deploy SUCCESS** / fileKey **`25bfe472-75aa-4f52-beb4-2d2d6159a762`** / rev **`139`**・`cio:preflight:678` note **budget_bucket kintone spelling CB_VA01 fix**） |
| 2026-05-15T08:05:00Z | 678 | `customize/678/desktop.js`（**677＝678 正本バナー・一覧 limit 500**・**BUILD** `2026-05-15-678-677-parity-truth-bar-limit500`・**deploy SUCCESS** / fileKey **`55b147b4-d2e0-4a73-adde-d95664d3374e`** / rev **`138`**・`cio:preflight:678` note **677=678 parity truth bar records limit 500**） |
| 2026-05-14T15:30:00Z | 678 | `customize/678/desktop.js`（**固定費ランニング当月実績色分け bucket修正**・**BUILD** `2026-05-14-678-running-actual-bucket-fix`・**deploy SUCCESS** / fileKey **`c9c5dba1-652b-47f6-9226-2bbf0f8e878a`** / rev **`131`**） |
| 2026-05-14T12:00:00Z | 678 | `customize/678/desktop.js`（**固定費ランニング当月実績色分け**・**BUILD** `2026-05-14-678-running-actual-month-status`・**deploy SUCCESS** / fileKey **`62e46652-2c1b-421b-8b16-a98ab2d7e9ba`** / rev **`130`**） |
| 2026-05-12T12:30:00Z | 678 | `customize/678/desktop.js`（実績 **Enter／修正・削除／固定費プリフィル**・新規明細 **Enter**・**BUILD** `2026-05-12-678-enter-editdelete-prefill`・**deploy SUCCESS** / fileKey **`f0902f20-8cc8-4a94-844e-d58f335cbe11`** / rev **`129`**・`cio:preflight:678` note **678実績Enter修正削除プリfill本番反映**） |
| 2026-05-21T11:50:10Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**リスト一覧作成** 所属・グループ・利用者名 `like`・**クリア**・**BUILD** `2026-05-21-list-create-modal-clear-btn`・**deploy SUCCESS** / fileKey **`e8ac3ba6-86f3-46cb-a8cb-ad51ed568cb3`** / preview revision **`224`**） |
| 2026-05-19T00:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**棚卸** 670 期間ゲート・未棚卸一覧・一括棚卸・`inventory_history`・**BUILD** `2026-05-19-inventory-period-v1`・**deploy SUCCESS** / preview revision **`216`**） |
| 2026-05-14T11:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**新規採番は671空き0件時のみ**・**BUILD** `2026-05-14-m365-assist-new-when-empty-only`・**deploy SUCCESS** / fileKey **`e68fe492-57e3-4330-ac2a-245de69fbf95`** / preview revision **`206`**） |
| 2026-05-14T10:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**§4.6.6 M365 入力支援**・**BUILD** `2026-05-14-m365-shared-jr-assist`・**deploy SUCCESS** / fileKey **`10fe2c78-969f-4f29-81d6-3518de1f7182`** / preview revision **`205`**・`cio:preflight:674` note **M365共有JR入力支援§4.6.6実装**） |
| 2026-05-14T09:10:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**共有・JR** 保存前必須の絞り込み・**BUILD** `2026-05-14-shared-jr-submit-validation-fix`・**deploy SUCCESS** / fileKey **`765f8351-d870-4881-b84c-a84f2e8b23c3`** / preview revision **`204`**・`cio:preflight:674` note **GO shared/JR submit validation fix**） |
| 2026-05-14T00:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**JBIS/S-JBIS 空き若番**・**671** クエリ修正・購入3フィールド表示・**BUILD** `2026-05-14-purchase-fields-visibility`・**deploy SUCCESS** / preview revision **`196`**・フォーム **rev 197**） |
| 2026-05-11T15:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（一覧 **`npl674debug`** コンソールログ・read-pack/session-handoff 反映・**BUILD** `2026-05-11-pc-ledger-index-search-debug-localstorage`・**deploy SUCCESS** / fileKey **`8804a8a8-7512-475c-a2f9-5fcfc084a21b`** / rev **`177`**） |
| 2026-05-11T14:25:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（一覧 URL **標準 `?q=`** 読取・除去・**BUILD** `2026-05-11-pc-ledger-index-search-native-q-param`・**deploy SUCCESS** / fileKey **`33be4da4-036c-4279-92d6-a30808e9061a`** / rev **`176`**） |
| 2026-05-11T14:10:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（一覧 **`getQueryCondition`** 同期・**条件クリア**後のバー／URL・**BUILD** `2026-05-11-pc-ledger-index-search-kintone-query-condition-sync`・**deploy SUCCESS** / fileKey **`52894044-e0dc-408a-9a5a-9f62788a36d1`** / rev **`175`**） |
| 2026-05-11T13:52:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（一覧検索 **hash＋search 読取**・**popstate/hashchange** 同期・閲覧戻り・**BUILD** `2026-05-11-pc-ledger-index-search-hydrate-hash-popstate`・**deploy SUCCESS** / fileKey **`303baa16-0726-4c10-b644-cd658ff41256`** / rev **`174`**） |
| 2026-05-11T13:48:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（転用廃棄後 **PUT 応答 revision** を編集フォームへ・**GAIA_UN03** 抑止・**BUILD** `2026-05-11-pc-ledger-npl-disposed-put-revision-to-form`・**deploy SUCCESS** / fileKey **`e2ccb204-fef2-4fbc-bd01-5d2285dfdab1`** / rev **`173`**） |
| 2026-05-11T13:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（一覧 **条件クリア** hash 内 **query** 除去・**`location.replace`**・**`npl674kw` 二重エンコード修正**・**BUILD** `2026-05-11-pc-ledger-index-search-clear-hash-replace`・**deploy SUCCESS** / fileKey **`fefca2c0-0247-4601-b2f5-1bc600494b6b`** / rev **`172`**） |
| 2026-05-11T13:42:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（転用廃棄後 **`reload` 廃止**・**`record.set`＋revision 同期**・**BUILD** `2026-05-11-pc-ledger-transfer-dispose-soft-sync-no-reload`・**deploy SUCCESS** / fileKey **`3b8400c0-5363-4a65-ae54-91024f6a015e`** / rev **`171`**） |
| 2026-05-11T13:39:20Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**`npl_disposed_pc_copy`** 転記 **PC 名のみ**（`674#id` 括弧廃止・**`pc_name` 空時のみ** `674#id`）・**BUILD** `2026-05-11-pc-ledger-npl-disposed-summary-pcname-only`・**deploy SUCCESS** / fileKey **`e1221e72-41d0-4276-b7bb-656b301fac7d`** / rev **`170`**） |
| 2026-05-11T13:37:12Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**`npl_disposed_pc_copy`** 転記 **PC 名先頭** `<旧PC名>（674#id）`・**BUILD** `2026-05-11-pc-ledger-npl-disposed-summary-pcname-first`・**deploy SUCCESS** / fileKey **`23f3acfe-6feb-438f-b1af-ada2c0fed67c`** / rev **`169`**） |
| 2026-05-11T13:33:35Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**転用廃棄** **GAIA_UN03**（revision 競合）**再 GET・PUT 最大 3 回**・**BUILD** `2026-05-11-pc-ledger-transfer-dispose-revision-retry`・**deploy SUCCESS** / fileKey **`6132cf54-b3da-4c4f-9500-5ffa8d28488e`** / rev **`168`**） |
| 2026-05-07T12:51:15Z | 678 | `customize/678/desktop.js` |
| 2026-05-07T12:14:21Z | 678 | `customize/678/desktop.js` |
| 2026-05-05T05:04:19Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**共有自動生成**「入力内容が正しくありません」対策:**`api.get()` 直後 `set`**・**内部メタ disabled 解除の強化**・**BUILD** `2026-05-05-pc-ledger-shared-autogen-set-fix`・**deploy SUCCESS** / fileKey **`6589b3b7-1b3a-4082-8e2e-09c95008700b`** / rev **`128`**） |
| 2026-05-05T12:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人 `windows_name`**: **`jbm####[mail@前]`**・`logon_name` と `[` の間の **`+` 廃止**・**BUILD** `2026-05-05-pc-ledger-windowsname-bracket-noplus`・**リポ HEAD**／本番反映は **`npm run deploy:674`**） |
| 2026-05-05T12:00:00Z | 627 | `customize/627/desktop.js`（595/626 自動入力の **`windows_name`**: **`logon_name[mail@前]`**・`+` 廃止・**BUILD** 注記 `2026-05-05-v1`・**リポ HEAD**／本番反映は **`npm run deploy:627`**） |
| 2026-05-07T06:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人 `windows_name`** **`jbm####+[mail@前]`** 角括弧・**BUILD** `windowsname-bracket-mail`・**deploy SUCCESS** / fileKey **`51b8d33f-b4e0-468e-9c78-760876e87eb9`** / rev **`127`**） |
| 2026-05-07T04:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人 `windows_name`** §4.2.2 組み立て関数化・**672 jbm4桁検証**・`console.info` 監査ログ・**BUILD** `personal-windowsname-validate`・**deploy SUCCESS** / fileKey **`a7365f2a-a573-42c2-802f-e5b947f2ea79`** / rev **`126`**） |
| 2026-05-07T02:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**共有・個人自動生成** `record.set` 前 **内部メタ子 disabled 一時解除**・**BUILD** `shared-autogen-internal-disabled-fix`・**deploy SUCCESS** / fileKey **`42d601e1-c163-4b4b-ab09-522c6d0c8dc0`** / rev **`125`**） |
| 2026-05-07T01:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人用自動生成** §4.2.2 **`mail_pw`・gb/sb ID/PW**・**BUILD** `personal-autogen-mail-gb-sb`・**deploy SUCCESS** / fileKey **`9136afb6-6fe8-4332-b1e5-34459ea3a554`** / rev **`124`**） |
| 2026-05-06T23:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人用自動生成** `pc_name`/`pc_serial_no`・**`windows_name` jbm+mail**・共有 **`S-JBIS` PC名**・**BUILD** `personal-autogen-pcname-windowsfmt`・**deploy SUCCESS** / fileKey **`d0dca7e6-a2bc-4f5a-84f0-3ed22710cc49`** / rev **`123`**） |
| 2026-05-06T22:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**入力支援**ボタン **「入力支援利用」**・インディゴグラデ・**BUILD** `input-assist-label-style`・**deploy SUCCESS** / fileKey **`f73c2e00-2695-40ec-a0b9-353956aa666e`** / rev **`122`**） |
| 2026-05-06T20:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**入力支援**を **`#new-pc-ledger-buttons`** に集約 **「📋 入力支援（595で検索）」**／共有・JR **「📋 所属候補を開く（680）」**・**BUILD** `input-assist-in-header-strip`・**deploy SUCCESS** / fileKey **`ebea2a15-eb6e-458d-9350-7393c46716b5`** / rev **`121`**） |
| 2026-05-06T18:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**create.show** マウント **`layout-gaia`/`getHeaderMenuSpaceElement`**・**readAccountTypeLive674** ヘッダ・**BUILD** `create-show-mount-fallback`・**deploy SUCCESS** / fileKey **`dcc68e92-15d5-4460-b31c-53ab9ef6cb65`** / rev **`120`**） |
| 2026-05-06T16:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**所属名の上**ボタン帯・**共有用自動生成** `m365_master_record_id` **disabled 解除**・**BUILD** `shared-autogen-m365-disabled-fix`・**deploy SUCCESS** / fileKey **`decc79e0-fdf3-4256-841c-8b0b596a181f`** / rev **`119`**） |
| 2026-05-06T14:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**入力支援**: 兄弟 DOM 挿入・**M365 明示ボタン**・**record 優先**・**BUILD** `input-assist-buttons-sibling-m365`・**deploy SUCCESS** / fileKey **`a1750dc7-d797-4167-b44b-3ee0e9b368bd`** / rev **`118`**） |
| 2026-05-06T12:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**JR** 「M365 を自動反映（JR）」・**PC名は自動生成しない**・**673** JR 時 **非呼出**・**BUILD** `jr-m365-button-no-pc-name-autogen`・**deploy SUCCESS** / fileKey **`8608c454-aeb2-409d-b116-2f7349340310`** / rev **`117`**） |
| 2026-05-05T17:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**所属ヘルプ `<details>` 撤去**・**BUILD** `remove-dept-help-banner`・**deploy SUCCESS** / fileKey **`d7dde324-e07d-486c-b7f3-2ff888729016`** / rev **`116`**） |
| 2026-05-05T17:10:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**§4.2.0b** `document` capture・z-index・ヘッダ検索削除・直下「入力支援」・**BUILD** `input-assist-doc-delegate`・**deploy SUCCESS** / fileKey **`49a7accd-e531-4ea2-bda2-0f8d398afeee`** / rev **`115`**） |
| 2026-05-05T16:30:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**§4.2.0b** はい／いいえモーダル・共有は所属のみ・**BUILD** `input-assist-hai-iie-modal`・**deploy SUCCESS** / fileKey **`9982a7d2-2780-490e-82bd-b18e794b2442`** / rev **`113`**） |
| 2026-05-05T15:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**§4.2.0b** クリック→`confirm`→595/680・明示ボタンは確認なし・**BUILD** `input-assist-click-confirm`・**deploy SUCCESS** / fileKey **`549f5c09-25b6-419d-a395-6b27d09ede76`** / rev **`112`**） |
| 2026-05-05T14:00:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**保管ヘッダ一律** 種別横断リセットのみ・閲覧保管はバーなし・rev **111**） |
| 2026-05-05T13:25:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**個人×保管ヘッダ最小** リセットのみ・rev **110**） |
| 2026-05-05T13:05:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**595 正本ゲート** `isPersonal595AssistEnabled674`・§4.1a/4.4・rev **109**） |
| 2026-05-05T12:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**595 オンデマンド**: フォーカス自動オフ・ボタンのみ・rev **108**） |
| 2026-05-05T12:10:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（**595 明示**: user/dept/group 直下ボタン＝`openEmployee595SearchModal674`・rev **107**） |
| 2026-05-05T03:25:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（focus assist: bag retry＋種別退避＋wire 遅延・rev **106**） |
| 2026-05-05T03:05:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（focus assist: field-root wire＋select 再帰・rev **105**） |
| 2026-05-05T02:50:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（focus assist: composedPath＋click＋trimmedScalarLive・rev **104**） |
| 2026-05-05T02:35:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（focus assist: Shadow DOM＋種別 DOM 読み・rev **103**） |
| 2026-05-05T02:19:44Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（JBIS dup query: `in` + like 修正・rev **102**） |
| 2026-05-04T13:02:08Z | 677 | `customize/677/desktop.js` |
| 2026-05-04T12:53:00Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T11:15:00Z | 679 | `customize/679/desktop.js` |
| 2026-05-04T11:14:00Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T11:01:32Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T10:55:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T00:01:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-03T22:27:48Z | 678 | `customize/678/desktop.js` |
| 2026-05-02T01:14:56Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T09:46:20Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T08:13:34Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T08:06:32Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:59:15Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:53:07Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:49:50Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:47:01Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:40:40Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:31:24Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:17:40Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-30T12:49:20Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-30T09:14:42Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T10:58:37Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T10:58:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T06:15:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.6・全フィールドリセット対象拡張・手元 deploy rev 38） |
| 2026-04-29T06:05:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.5・社員名検索モーダル 595・手元 deploy rev 37） |
| 2026-04-29T05:48:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.4・利用者名候補は入力中 DOM を参照・手元 deploy rev 36） |
| 2026-04-29T05:42:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.3・595 user_name 正規化フォールバックで保存前照合・手元 deploy rev 35） |
| 2026-04-29T05:37:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.2・PC `record` holder / getFieldElement PC 優先・手元 deploy rev 34） |
| 2026-04-29T05:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7・利用者名候補の表示修正・手元 deploy） |
| 2026-04-29T05:35:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.6・共有/JR メール非表示 + 共有端末名チェック・手元 deploy） |
| 2026-04-29T05:25:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.5・個人 利用者名 595 入力支援 + 保存前照合・手元 deploy） |
| 2026-04-29T05:16:07Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.4・保存前 M365 6 台目ブロック + 平易メッセージ・手元 deploy） |
| 2026-04-29T05:15:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.3・671 編集差分リコンサイル + 672/673 未使用戻し・手元 deploy） |
| 2026-04-29T04:59:55Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD day5-autogen-v0.2・保存成功 671/672/673 + ライセンスバナー・手元 deploy） |
| 2026-04-29T04:55:55Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD day5-autogen-v0.1・手元 deploy） |
| 2026-04-29T04:49:43Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.5・手元 deploy） |
| 2026-04-28T10:29:46Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-28T10:27:43Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |


---

## Security NEXT ニュース — フォームの確定仕様（自動化と一致）

正本: `security-next-automation/src/lib/field-codes.ts` ＝ `security-next-automation/docs/security-next-news-app-design.csv`。

| フィールドコード | 型 | 画面ラベル例 | 説明 |
|------------------|-----|----------------|------|
| `title` | 文字列（1行） | タイトル | 記事タイトル |
| `article_url` | 文字列（1行） | URL | 重複禁止推奨 |
| `published_date` | **日付** | 公開日 | RSS 公開日（JST） |
| `summary` | 文字列（複数行） | 概要 | RSS 抜粋 |
| `digest` | 文字列（複数行） | 要約 | collect は概要と同じ RSS 抜粋を投入 |
| `match_keywords_display` | 文字列（1行） | 採用キーワード | マッチしたキーワードのカンマ区切り |
| `internal_match_meta_json` | 文字列（複数行） | 採用メタJSON（内部） | 監査・デバッグ用 JSON |
| `internal_source` | 文字列（1行） | ソース（内部） | `rss` / `nvd` |
| `internal_gemini_mark` | 文字列（1行） | Gemini成否（内部） | `Y` / `I` / `N` |
| `needs_review` | チェックボックス | 要レビュー | 複合条件で自動セット |
| `internal_severity_tier` | 文字列（1行） | 重大度区分（内部） | `normal` / `exception` |

- **631** … 上表と一致（収集本番）。**630** は旧・誤フォームの可能性あり。運用は **631** に統一。
- **内部フィールド**（`internal_*`）は一覧レイアウトで非表示にし、権限を管理者に絞る運用を推奨。
- **例外枠**: AGENTS.md §7 に基づき 1 日あたり最大 3 件。通常枠 3 + 例外枠 3 = 合計 6 件/日がハードリミット。

---

## ニュース週次要約（レポートアプリ・Security NEXT）

**ニュース保存（631 等）とは別アプリ**。`analyze.ts` のみが書き込む。フィールドコードの正本は `field-codes.ts` の `REPORT_FIELDS` と **`security-next-automation/docs/security-next-weekly-report-app-design.csv`**。

### 確定フォーム（632）

| フィールドコード | 型 | 画面ラベル例 | 説明 |
|------------------|-----|----------------|------|
| `target_week` | **日付** | 対象週 | その週の **月曜日**（JST）。**Idempotency キー**（同一日付は `analyze` が更新） |
| `weekly_trend` | **リッチエディタ** | 今週の傾向と対策 | LLM 本文（約 900〜1100 字想定）。HTML で投入 |
| `summary_one_line` | **文字列（1行）** | 週次サマリー1行 | 一覧・通知・ポータル向けプレーン 1 行 |
| `internal_ref_news_count` | **数値** | 参照631件数（内部） | LLM に渡した 631 件数（最大 45 件カット後） |
| `internal_ref_record_id_min` | **数値** | （内部） | 上記に含まれる 631 の `$id` 最小 |
| `internal_ref_record_id_max` | **数値** | （内部） | 上記に含まれる 631 の `$id` 最大 |
| `internal_analysis_run_at` | **日付と時刻** | （内部） | 実行日時（JST オフセット付き） |
| `internal_github_run_id` | **文字列（1行）** | （内部） | `GITHUB_RUN_ID`（Actions）／ローカルは `local` |

**内部フィールド**は一覧レイアウトで非表示にし、権限を管理者に絞る運用を推奨。

手動作成・追補手順: `security-next-automation/docs/kintone-weekly-report-app-creation-steps.md`

### 確定インスタンス: アプリ **632**

URL: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) 。`npm run app:fields 632` 結果（カスタムフィールドは 2 のみ）:

```
App 632 fields（上表のカスタム＋システムフィールド）。カスタムは `target_week`・`weekly_trend`・`summary_one_line`・`internal_*` を含む。
```

**`KINTONE_REPORT_APP_ID=632`** と API トークン権限を設定すること。

### 別環境で新規に作る場合

`npm run setup:security-next-report-app`（管理者 `.env` 必須）。アプリ名変更: `KINTONE_SECURITY_NEXT_REPORT_APP_NAME`

---

## 594（PC台帳 ver.2・旧）

> **方針（2026-05-12 浜田 CEO）**: **594 は今後削除する**。仕様・運用の **正本は 674**。**594 を前提にした新規は採用しない**。**本番に参照専用で恒久的に残す前提もない**（移行・627/595 の参照切替・アプリ削除は `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§1.5**・**§9**）。下記フィールド一覧は **レガシー監査用**。

`npm run app:fields 594` の取得結果（抜粋なし・全件・本番 2026-04-18 時点）:

```
App 594 fields (38)
abolished_flag	CHECK_BOX	廃止フラグ
buyer	DROP_DOWN	購入先
category	DROP_DOWN	カテゴリ
dept_name	SINGLE_LINE_TEXT	所属名
dop	DATE	購入日
etc_1	SINGLE_LINE_TEXT	その他情報１
etc_2	SINGLE_LINE_TEXT	その他情報2
group_name	SINGLE_LINE_TEXT	所属グループ
inventory_count	CALC	棚卸回数
inventory_finish_date	DATE	今期棚卸完了日
inventory_history	SUBTABLE	棚卸履歴
ip1	SINGLE_LINE_TEXT	固定IPアドレス1
ip2	SINGLE_LINE_TEXT	固定IPアドレス2
last_inventory_date	DATE	最新棚卸日
ledger_record_id	SINGLE_LINE_TEXT	アカウント台帳番号
location	SINGLE_LINE_TEXT	設置場所
mail	SINGLE_LINE_TEXT	メールアドレス
manufacturer	SINGLE_LINE_TEXT	メーカー
model_name	SINGLE_LINE_TEXT	モデル名 / 型式
note	MULTI_LINE_TEXT	記事欄
PC_name	SINGLE_LINE_TEXT	PC名
price	NUMBER	価格
product_id	SINGLE_LINE_TEXT	製造番号
record_id	SINGLE_LINE_TEXT	管理番号
shared_terminal_name	SINGLE_LINE_TEXT	共有端末名
sn	SINGLE_LINE_TEXT	シリアルナンバー
status	RADIO_BUTTON	状態ステータス
type	RADIO_BUTTON	種別
user_name	SINGLE_LINE_TEXT	利用者名
カテゴリー	CATEGORY	カテゴリー
グループ	GROUP	グループ
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 595（社員マスタ）

`npm run app:fields 595`（本番 2026-04-18 時点）:

```
App 595 fields (23)
dept_name	SINGLE_LINE_TEXT	所属名
emp_id	SINGLE_LINE_TEXT	社員管理番号
employment_status	DROP_DOWN	在籍ステータス
group_name	SINGLE_LINE_TEXT	所属グループ
ledger_created	CHECK_BOX	アカウント台帳作成済み
ledger_link_list	SUBTABLE	アカウント台帳紐づけ
ledger_record_id	NUMBER	アカウント台帳レコード番号
mail	SINGLE_LINE_TEXT	メールアドレス
pc_ledger_list	SUBTABLE	PC台帳紐づけ
retired_date	DATE	退職日
retired_note	MULTI_LINE_TEXT	退職メモ
sort	NUMBER	表示順
transfer_date	DATE	所属異動日
transfer_note	MULTI_LINE_TEXT	所属異動メモ
user_name	SINGLE_LINE_TEXT	社員名
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 626（アカウント採番）

**本番テナントではアプリ削除済（2026-05 確認）。** `## アプリ一覧` 表からは除外。個人 Windows ID 採番は **672** を参照。

`npm run app:fields 626`（本番 2026-04-18 時点・削除前のスナップショット）:

```
App 626 fields (16)
gb_pw	SINGLE_LINE_TEXT	ガリバーパスワード
logon_name	SINGLE_LINE_TEXT	ADログオン名
logon_pw	SINGLE_LINE_TEXT	ADパスワード
M365_pw	SINGLE_LINE_TEXT	M365パスワード
mail	SINGLE_LINE_TEXT	メールアドレス
mail_pw	SINGLE_LINE_TEXT	メールアドレスパスワード
sb_pw	SINGLE_LINE_TEXT	サイボウズパスワード
used_count	DROP_DOWN	アカウント採番有無
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 627（アカウント管理台帳）— **削除済**

> **2026-06-10 浜田確認**: 674 移行後の **意図的削除**。以下フィールド一覧は **レガシー監査用**（`npm run app:fields 627` は不可）。

`npm run app:fields 627`（本番 2026-04-18 時点・**現テナント上は app 不在**）。サブテーブル `pc_ledger_links` 内の 594 参照フィールドは **`pc_ledger_link_594_id`**（`customize/627/desktop.js` の `FC627_PC_SUB_594` と一致）。

```
App 627 fields (31)
account_state	DROP_DOWN	アカウント状態
account_type	DROP_DOWN	アカウント種別
dept_name	SINGLE_LINE_TEXT	所属名
employment_status	DROP_DOWN	在籍ステータス
gb_id	SINGLE_LINE_TEXT	ガリバーID
gb_pw	SINGLE_LINE_TEXT	ガリバーパスワード
group_name	SINGLE_LINE_TEXT	所属グループ
logon_name	SINGLE_LINE_TEXT	WindowsID
logon_pw	SINGLE_LINE_TEXT	Windowsパスワード
m365_id	SINGLE_LINE_TEXT	M365ID
m365_pw	SINGLE_LINE_TEXT	M365パスワード
mail	SINGLE_LINE_TEXT	メールアドレス
mail_acct	SINGLE_LINE_TEXT	メールアカウント
mail_pw	SINGLE_LINE_TEXT	メールパスワード
pc_594_record_id	SINGLE_LINE_TEXT	PC台帳番号
pc_ledger_links	SUBTABLE	PC台帳紐づけ（複数）
PC_name	SINGLE_LINE_TEXT	利用PC
sb_id	SINGLE_LINE_TEXT	サイボウズID
sb_pw	SINGLE_LINE_TEXT	サイボウズパスワード
user_name	SINGLE_LINE_TEXT	利用者名
vpn_id	SINGLE_LINE_TEXT	VPN_ID(KDDI)
vpn_pw	SINGLE_LINE_TEXT	VPN_パスワード
windows_name	SINGLE_LINE_TEXT	Windowsアカウント名
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 629（出張精算・shucccho-seisan）

- **アプリID**: 629
- **本番 URL 例**: `KINTONE_BASE_URL` のドメイン + `/k/629/`
- **メモ**: システム標準フィールドの **フィールドコードが英字**（`Record_number`, `Status` など）。カスタムは `kingaku`, `shimei`, `shounin_status`, `shutchousaki`。**コードをラベルから推測しないこと。**

`npm run app:fields 629` の結果:

```
App 629 fields (12)
Assignee	STATUS_ASSIGNEE	Assignee
Categories	CATEGORY	Categories
Created_by	CREATOR	Created by
Created_datetime	CREATED_TIME	Created datetime
kingaku	NUMBER	金額
Record_number	RECORD_NUMBER	Record number
shimei	SINGLE_LINE_TEXT	氏名
shounin_status	DROP_DOWN	承認ステータス
shutchousaki	SINGLE_LINE_TEXT	出張先
Status	STATUS	Status
Updated_by	MODIFIER	Updated by
Updated_datetime	UPDATED_TIME	Updated datetime
```

---

## 668（運用ガイド・ops-guide）

- **アプリID**: 668（環境変数 `KINTONE_OPS_GUIDE_APP` が正本）
- **本番 URL 例**: `KINTONE_BASE_URL` のドメイン + `/k/668/`
- **目的**: PC台帳／アカウント台帳／社員マスタ等の操作手順を社内向け HTML として配信。`docs/ops-guide/*.html` がソース、Kintone レコードに同期して iframe で表示。
- **カスタマイズ方針** (2026-04-18 v4.1):
  - 主要メニュー（💻 PC管理台帳 / 🔑 アカウント台帳 等）は **iframe の外** に Kintone DOM 直下のテキストリンクとして描画（`buildQuickLinkBar` / `jbis-ops-quick-link-bar`）。iframe 内クリッピング問題の根本回避策。
  - iframe は **最低 1500px** 固定、postMessage (`jbis-ops-guide-iframe-resize`) による grow-only オートリサイズ。auto-resize 失敗時のフォールバックとして iframe 自身のスクロールも許可。

`npm run app:fields 668` 相当のフィールド（実取得 2026-04-16）:

```
App 668 fields (11)
Assignee            STATUS_ASSIGNEE     Assignee
Categories          CATEGORY            Categories
Created_by          CREATOR             Created by
Created_datetime    CREATED_TIME        Created datetime
guide_body_html     MULTI_LINE_TEXT     HTML本文      ← レコード本文（iframe srcdoc に注入）
guide_slug          SINGLE_LINE_TEXT    ガイドID      ← 'hub' / 'pc' / 'personal' / 'shared' / 'employee' / 'lifecycle'
guide_title         SINGLE_LINE_TEXT    タイトル
Record_number       RECORD_NUMBER       Record number
Status              STATUS              Status
Updated_by          MODIFIER            Updated by
Updated_datetime    UPDATED_TIME        Updated datetime
```

レコード（slug ↔ HTML ファイル）の対応:

| guide_slug | guide_title | ソース HTML |
|------------|-------------|-------------|
| `hub` | ガイドトップ | `docs/ops-guide/index.html` |
| `pc` | PC台帳ガイド | `docs/ops-guide/guide-pc.html` |
| `personal` | 個人アカウントガイド | `docs/ops-guide/guide-personal-account.html` |
| `shared` | 共有アカウントガイド | `docs/ops-guide/guide-shared-account.html` |
| `employee` | 社員マスタガイド | `docs/ops-guide/guide-employee.html` |
| `lifecycle` | 異動・退職・買替ガイド | `docs/ops-guide/guide-lifecycle.html` |

**運用コマンド**:
- `npm run ops-guide:sync` — HTML を Kintone レコードへ同期のみ
- `npm run ops-guide:deploy` — desktop.js のみデプロイ
- `npm run ops-guide:publish` — sync + deploy（日次更新の標準）

---

## PC台帳まわり（594・595・626・627・668・674）の保守メモ

- **594 vs 674（2026-05-12 浜田 CEO）**: **594 は廃止し新規に使わない**。**正は 674**。**本番に594を参照用で残し続ける前提はない**（影響範囲・誤記の経緯は SPEC **§1.5**）。下記の **594 挙動メモはレガシー用**（移行完了後は台帳から外す想定）。
- **ブラウザカスタマイズの正本**: 各アプリは `customize/<アプリID>/desktop.js` のみ。`npm run deploy:594`（595/626/627 同様）でアップロード。`customize/594/customize-manifest.json` は **`npm run generate:customize-manifests` の対象外**（手元で維持。他アプリは同コマンドで再生成可）。
- **594（レガシー）管理番号 `record_id`・表示名 `PC_name`（種別）**: 保存直前に **種別=個人** かつ **`record_id` が空または596同型の誤値**なら **`JBIS0067` 形式**（`JBIS`+4桁・下限67）を `record_id` に付与。**`PC_name` が空**のとき、**種別=個人**なら **596**（例 `JBIS0001-202605`）を **`PC_name` に**。**種別=共有**かつ **`PC_name` が空**のときも **596**（**カテゴリ `category` DROP_DOWN は採番判定に使わない**）。**JR端末／サーバーNAS／その他**は自動では `PC_name` に入れない（手入力）。**編集保存**でも個人は空の `PC_name` を 596 で補完。保存後 GET→PUT フォールバック（個人の `record_id` 救済時）も **`PC_name` が空なら 596**（`customize/594/desktop.js`・**BUILD 2026-05-12-v492**）。**2026-05-12 deploy SUCCESS** / fileKey **`36fb4fa3-af62-457c-8530-26ef767b4e61`** / preview revision **`498`**。
- **旧バックアップ JS**: リポジトリ直下の `desktop-v2.js` / `desktop-old-backup.js` はデプロイに使わないため **削除済み**（旧内容は `git log` および `backups/` 配下を参照）。
- **Kintone フォームのフィールド削除**: 本番データ・ルックアップ・履歴への影響が大きいため、**このリポジトリの変更だけでは実施しない**。未使用の疑いがあるフィールドは `npm run app:fields` で実フォームと突合し、JS から参照していなければ「UIのみ残存」として運用判断する。
- **回帰前の最低チェック**: `npm run kintone:test`（疎通・**既定では 594 を見ない**。移行時のみ **`INCLUDE_LEGACY_APP_594=1`** を付与してから実行。PowerShell 例: `$env:INCLUDE_LEGACY_APP_594='1'; npm run kintone:test`）、`npm run lint:customize`、変更アプリの `npm run app:fields <id>`。595 自動化は `npm run test:e2e:595`（テスト用データを作るため本番では慎重に）。

### 保留中の整理候補（コード参照ゼロの扱い方針）

> このセクションは「`customize/` と `scripts/` のどこにもフィールドコードや参照が現れないもの」を **どう扱うか** の方針記録です。**削除指示ではありません**。

#### A. ユーザー入力専用フィールド（全件保持）

下記は **JS から参照していないが、Kintone フォーム入力・CSV 取込・印刷帳票・運用メモなどで現役**として使われているもの。**業務側の利用データ**であり、**全件そのまま保持**する方針。コード側で「未使用に見える」ことを理由に削除提案はしない。

| アプリ | フィールドコード | 想定利用 |
|---|---|---|
| 594 | `etc_1` | 自由メモ（現場記入） |
| 594 | `etc_2` | 自由メモ（現場記入） |
| 594 | `product_id` | 物品・資産管理キー |
| 594 | `ip2` | 予備IP |
| 594 | `sn` | シリアル番号（棚卸し照合） |
| 594 | `price` | 購入価格（経理連携） |
| 594 | `buyer` | 購入者・申請者記録 |
| 595 | `2026-06-19-595-dept-picker-680` | **96** |
| 627 | `vpn_id` | VPN ID(KDDI) — 印刷帳票で使用 |
| 627 | `vpn_pw` | VPN パスワード — 印刷帳票で使用 |

#### B. ワンショット系スクリプト（保管・実行ガード済み）

`scripts/backfill-*.js` 6 本は **過去データの紐付けを埋めるための 1 度きり用途**。既に本番反映済みで **通常運用では再実行しない**が、**特殊イベント時の保険**として残す。

| ファイル | 用途（要約） |
|---|---|
| `backfill-594-627-cross-refs.js` | 594 と 627 の相互 ID（`ledger_record_id` / `pc_594_record_id`）を一括で揃える |
| `backfill-595-pc-ledger-from-594.js` | 595 の `pc_ledger_list` を mail 一致の 594 から補填 |
| `backfill-595-ledger-from-mail.js` | 595 の `ledger_record_id` 等を mail 起点で 594/627 から補填 |
| `backfill-595-ledger-from-627.js` | 595 の `ledger_record_id` / `employment_status` を 627 と突合して整える |
| `backfill-627-pc-ledger-links-from-595.js` | 627 のサブテーブル `pc_ledger_links` を 594 ID のユニーク集合で補填 |
| `backfill-627-sb-from-mail-626.js` | 627 の `sb_id` / `sb_pw` を mail と 626 から一括反映 |

**実行ガード**（2026-04-18 制定）:
- 各ファイルの先頭に共通ヘッダコメントと `process.argv` / `process.env.ONESHOT_CONFIRM` ガードを実装
- **引数なしで叩くと exit code 2 で即ブロック**(事故防止)
- `-- --dry-run` は確認用に常時通る
- 本実行は `ONESHOT_CONFIRM=yes npm run backfill:…` のみ
- 再実行が必要な代表ケース：
  - 大量 CSV インポート後に紐付けだけ反映漏れ
  - 別テナント／別環境からのデータ移行
  - 障害復旧によるバックアップ書き戻し後の紐付け破損
- **再実行する前に必ず利用者と相談**（`AGENTS.md` §4 にも明記）

#### C. UI ラベル・文言の改善候補（別途相談中）

技術用語が画面に出ている部分を、IT 専門外の利用者にも分かりやすくする案。**1 つずつ業務側と確認しながら順次対応予定**。データ・連携には影響せず、`customize/<id>/desktop.js` の表示文字列だけ書き換えるため戻しやすい。

| 場所 | 現状 | 改善案（仮） |
|---|---|---|
| 594 詳細「594⇔627 紐付け解除…」ボタン | 技術用語 | 「この PC からアカウントの紐付けを外す…」 |
| 627 詳細「594⇔627 紐付け解除…」ボタン | 技術用語 | 「このアカウントから PC の紐付けを外す…」 |
| 594 ダッシュボード「🟡 紐付けなし」行の `ledger_record_id` 列 | 値だけ表示 | tooltip で「627 にリンクなし＝この台帳番号は単独残存」を追加 |
| 627 詳細の VPN 系項目 | 印刷専用と分かりにくい | 印刷時のみ表示、画面上はグループ折りたたみ案 |

**実施判断は 1 案ずつ別途相談**。先に実機の表示確認・既存利用者への影響確認を行ってから着手する。

### 意図的に「リポジトリ／エージェントだけでは未完了」としていること

次の作業は **業務・権限・CSV・監査**に触れるため、**着手・本番実行の前に必ず関係者と相談**してから進める前提とする（エージェントは勝手に実行しない）。

| 区分 | 内容 | 完了の目安 |
|------|------|------------|
| A | **Kintone 画面上のフィールド削除**（フォームからの削除） | 利用実態・ルックアップ・API・バックフィルスクリプトの棚卸し → 参照ゼロを確認 → 管理画面で削除、の順を文書化し実施 |
| B | **ブラウザ機能の手動／E2E 網羅**（594/627 UI 全パス等） | 検証用環境でシナリオ一覧と期待結果を固定し、手動チェックリストまたは自動テストを回した証跡を残す |
| C | **本番でのデータ変更系 npm**（例: `test:e2e:595`、`clear:594:orphan-ledger:apply`、大量 sync） | 実行日時・担当・ロールバック方針を合意したうえで実施 |

A・B・C のいずれも、**「方針とスコープの合意」が取れるまでコード・CI だけで完結させない**。

### 実行前に相談が必要なコマンド（例）

データ作成・更新・削除や本番カスタマイズに直結するもの。**未合意のまま本番向けに実行しない。**

- `npm run test:e2e:595` / `test:e2e:595:cleanup` … 595（および連携先）にテスト用レコードを作る可能性
- `npm run clear:594:orphan-ledger:apply` … 594・627 の特定フィールドを一括更新
- `npm run sync:595` / `sync:595:force` … 627 等への反映
- `npm run purge:627` / `reset:626:pool` / `reset:595:flags` など **reset / purge 系**
- 各種 `npm run deploy:*` … 本番 JavaScript の即時差し替え
- `npm run ops-guide:publish` … 668 の本文・カスタマイズの本番反映

参照のみ・ローカル影響のみの例（相談不要なことが多いが、ポリシーで縛る場合は組織ルールに従う）: `npm run app:fields <id>`、`npm run verify:pc-stack`、`npm run clear:594:orphan-ledger`（`--apply` なし）

### 「完全版」に近づけるための推奨ループ（運用方針）

1. **機能変更のたび**: `npm run verify:pc-stack`（＝ `kintone:test` + `lint:customize`）。触ったアプリは `npm run app:fields <id>` でフィールド一覧を再取得し、**`kintone-apps.md` を更新するか判断**（変更があれば更新）。
2. **595 自動化まわり**: 変更が入ったら **検証環境**で `npm run test:e2e:595` を検討。本番で回す場合は **`--cleanup` の有無とデータの扱い**を事前合意。
3. **フォームからフィールドを削る場合**: `app:fields` → リポジトリ内 `grep`/スクリプト一覧で参照調査 → バックフィル・JS の参照除去 → **最後に** kintone 管理画面でフィールド削除。削除後もう一度 `app:fields` で差分確認。

### 628（買替）・667（共有採番）・668（ガイド）を同じ粒度で扱う場合

**開始前に相談してほしいスコープの例:**

- **628**: カスタマイズの有無・デプロイ経路（594 からの遷移ストレージのみか、独自 `desktop.js` か）、`kintone-apps.md` への追記有無
- **667**: 594/627 の共有フローとのフィールド対応表、採番プール系スクリプトの一覧と実行ポリシー
- **668**: `ops-guide:publish` のタイミング（本番即時か）、HTML 変更のレビュー者

上記を **フェーズとして切ったマイルストーン**（例: フェーズ1＝フィールド一覧とスクリプト grep の突合のみ、フェーズ2＝検証環境 E2E）にすると、**「意図的に未実施だった部分」を段階的に完了**させやすい。

---

## 業務改善 ver.02（Space 5 — 697–713）

**仕様正本**: `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §11  
**完成サマリー**: `docs/reports/2026-06-13-business-improvement-completion.md`  
**実装報告**: `docs/reports/2026-06-07-bi-phase4-5-session.md`  
**WF テスト**: `scripts/data/business-improvement-wf-test-master.json`（test_v3）

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| 設定マスタ | **697** | — | 2026-07-04 本番30行 upsert（production-2026-08.xlsx） | `business-improvement:seed-settings` |
| 社員マスタ | **698** | `customize/business-improvement-employee/desktop.js` | **BUILD=`2026-07-04-bi-employee-index-emp-filter` rev **19** — 在籍/退職/すべて pill | `deploy:698` |
| ご利用ガイド | **699** | `customize/business-improvement-guide/desktop.bundle.js` | **BUILD=`2026-07-06-bi-guide-banner-permission-label` rev ** 121 ** — Q-GUIDE-13 ステータス件数サマリー表 | `deploy:699` |
| 提案申請 ver.02 | **700** | `customize/business-improvement-proposal/desktop.js` | **BUILD=`2026-07-06-bi-apply-footer-reject-clear` rev ** 166 ** / fileKey **`d128837d-6bee-4bb8-9356-97b6f3e4811e`** — Q-UX-12 後段評価折りたたみ | `deploy:700` |
| 年次処理（新⑤） | **713** | `customize/business-improvement-annual/desktop.bundle.js` | `2026-06-13-bi-annual-redirect-guide` rev12 | `deploy:713` |

**699 年次集計**: **admin のみ**「年次ポイント集計」。暗唱番号は **697 共通設定** `年次暗唱番号`（起動・集計の都度入力）。集計 UI は 699 オーバーレイ（713 はデータ保存）。

**699 UI**: kintone 標準一覧フッター（Record number / 0-0件中）を非表示。**ログイン直下にステータス件数サマリー表**（Q-GUIDE-13）。**申請した一覧／未評価一覧はマニュアルより上**（Q-GUIDE-10）。マニュアル小項目はアコーディオン、ナビ選択で本文へスクロール。ガイド本文に年次手順は載せない。

**713 主要機能**: 年度レコード保存。画面操作は **699** から（713 レコード画面は誘導のみ）。

**状態（2026-06-13）**: **v1 完成** — 申請・評価・年次集計まで浜田確認済。  
**軽微 UX 継続可（2026-06-25 GO）**: 一覧バナー・ログイン案内・同期可視化 — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`

---

## 社内 Wi-Fi SSID 管理 ver.1（Space 21 — 718–719）

**仕様正本**: `docs/plans/2026-06-14-wifi-ssid-kintone-spec.md`  
**完成サマリー**: `docs/reports/2026-06-14-wifi-ssid-completion.md`

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| 社内Wi-Fi管理DB | **718** | `customize/wifi-ssid-db/desktop.js` | `2026-06-14-wifi-ssid-db-block-ui-mutations` rev5 | `deploy:718` |
| 社内Wi-Fi管理台帳 ver.1 | **719** | `customize/wifi-ssid-dash/desktop.js`（`desktop.src.js` + bundle） | `2026-07-07-wifi-ssid-dash-list-print-scale2` rev12 | `deploy:719`（前に `wifi-ssid:bundle-dash`） |

**719 主要機能**: 694 型一覧・管理者のみ編集（REST→718）・拠点別 A4 印刷（Wi-Fi QR 同梱）・**一覧印刷・Excel出力**（5列・検索絞込・PW 含む）・PW クリックコピー。設備なし（水戸・鎌ヶ谷）は拠点別印刷なし（一覧印刷・Excel には含む）。

**状態（2026-07-07）**: v1 運用中 — 一覧出力追加・浜田目視 OK。移行元 Excel **完全削除済**（kintone 正本のみ）。

---

## JRシステム用 iPad 管理台帳 ver.1（Space 34 — 720–721）

**仕様正本**: `docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md`

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| JRシステム用iPad台帳DB | **720** | `customize/jr-ipad-db/desktop.js` | `2026-06-15-jr-ipad-db-block-ui-mutations` rev5（**フォーム rev 7** — 2026-06-19 新規採番時下書き必須緩和） | `deploy:720` / `jr-ipad:relax-draft-required-fields` |
| JRシステム用iPad管理台帳 ver.1 | **721** | `customize/jr-ipad-dash/desktop.js`（`desktop.src.js` + bundle） | `2026-06-24-jr-ipad-dash-register-existing` rev13 | `deploy:721`（前に `jr-ipad:bundle-dash`） |

**721 主要機能**: 694 型一覧・admin のみ・2 系統採番（JBIS### + jb###m）・**既存端末を登録**（採番なし）・**集計表はアコーディオン（初期閉じ）**・端末別 A4 印刷・モデルコンボボックス + NFKC 正規化・**検索・絞込クリアボタン**・**一覧 有効/廃止トグル（デフォルト有効＝廃棄非表示）**。

**状態（2026-06-15）**: **v1 完成 — CLOSED**（浜田目視 OK）。Excel **64 台移行済**・**運用終了**（kintone のみ正本）。完成報告: `docs/reports/2026-06-15-jr-ipad-ledger-completion.md`

---

## JREクラウド アカウント管理（Space 34 — 744–745）

**仕様正本**: `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md`

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| JREクラウドアカウント管理台帳用DB | **744** | `customize/jre-cloud-account-db/desktop.js` | `2026-06-26-jre-cloud-account-db-block-v1` rev5 | `deploy:744` |
| JREクラウドアカウント台帳 | **745** | `customize/jre-cloud-account-dash/desktop.js`（`desktop.src.js` + SheetJS bundle） | `2026-06-27-jre-cloud-account-dash-v16-list-filter-clear` rev22 | `deploy:745`（前に `jre-cloud:bundle-dash`） |

**745 主要機能**: 734 型一覧・admin のみ CRUD（744 REST）・595 検索（**クリア**付き）・稼働中/すべて/退職バッジ・**検索クリア**（稼働中に復帰）・**利用終了（退職）**・**月次集計**（チップ絞込・**条件クリア**・当年1–12月）・**所属・部署 AND 検索**・一覧/集計 **xlsx+印刷**。

**npm**: `jre-cloud:setup` / `jre-cloud:migrate:xlsx` / `jre-cloud:sync-dash` — App ID 正本 `scripts/data/jre-cloud-account-app-ids.json`  
**検索仕様**: §7.6（R-JRE-01）・目視 `docs/runbooks/kintone-dash-first-visual-checklist.md`（R-SESS-06）

**状態（2026-06-27）**: **完了 — CLOSED**（浜田 OK）。Excel **99 件移行済**。

---

## JRE-C_Hub アカウント管理（Space 34 — 746–747）

**仕様正本**: `docs/plans/2026-06-27-jre-chub-account-kintone-spec.md`

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| JRE-C_Hubアカウント管理台帳用DB | **746** | `customize/jre-chub-account-db/desktop.js` | `2026-06-27-jre-chub-account-db-block-v1` rev5 | `deploy:746` |
| JRE-C_Hubアカウント台帳 | **747** | `customize/jre-chub-account-dash/desktop.js`（`desktop.src.js` + SheetJS bundle） | `2026-06-27-jre-chub-account-dash-v6-list-filter-clear` rev12 | `deploy:747`（前に `jre-chub:bundle-dash`） |

**747 主要機能**: 745 型 + 権限 ST・**権限フィルタ**（青チップ）・権限表示短縮（tooltip）・複数拠点同一 ID **赤字警告**・月次集計（小計=レコード数・**全社合計=IDユニーク**・重複 ID 自動備考・チップ絞込）・**検索クリア**（稼働中+権限すべて）・一覧/集計 **xlsx+印刷**。

**npm**: `jre-chub:setup` / `jre-chub:migrate:xlsx` / `jre-chub:sync-perms:xlsx` / `jre-chub:sync-dash` — App ID 正本 `scripts/data/jre-chub-account-app-ids.json`

**状態（2026-06-27）**: **完了 — CLOSED**（浜田 OK）。Excel **47 件移行済**（46 ユニーク ID）。

---

## トータルネットワーク ネットワーク管理 ver.1（Space 48 — 737–738）

**仕様正本**: `docs/plans/2026-06-21-total-network-kintone-spec.md`  
**完成サマリー**: `docs/reports/2026-06-21-total-network-completion.md`

| アプリ | ID | customize | BUILD（本番） | deploy |
|--------|-----|-----------|---------------|--------|
| トータルネットワークネットワーク管理DB | **737** | `customize/total-network-db/desktop.js` | `2026-06-21-total-network-db-block` rev5 | `deploy:737` |
| トータルネットワークネットワーク管理台帳 | **738** | `customize/total-network-dash/desktop.js`（`desktop.src.js` + SheetJS bundle） | `2026-06-21-total-network-dash-v1-auto-ip-count` rev8 | `deploy:738`（前に `total-network:bundle-dash`） |

**738 主要機能**: 一覧表（接続12拠点デフォルト）・IPマトリックス（sort_no順）・次IP提案・割当解除・印刷A4横・Excel 2シート・IP数は範囲から自動計算・用途マスタ設定タブ。

**状態（2026-06-21）**: **v1 完成 — CLOSED**（浜田 OK）。拠点22・使用中IP26・kintone 正本運用。

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-07-07 | **社内 Wi-Fi 台帳 719 一覧出力**: rev12（一覧印刷 A4 カラー・Excel 5列・PW 含む・文字拡大）。仕様 `docs/plans/2026-06-14-wifi-ssid-kintone-spec.md` §7.5 |
| 2026-06-27 | **JRE-C_Hub アカウント管理 v1 完成**: 746 rev5・747 rev12（権限 ST/フィルタ・IDユニーク集計・チップ UI・各種クリア）。Excel **47 件移行済**・浜田 OK。仕様 `docs/plans/2026-06-27-jre-chub-account-kintone-spec.md` |
| 2026-06-27 | **JREクラウド アカウント台帳 UX 更新**: 745 rev22（集計チップ UI・条件クリア・検索クリア→稼働中）。仕様 §5.3/§4.3 更新 |
| 2026-06-26 | **JREクラウド アカウント管理 v1 初回 deploy**: 744 rev5・745 rev4（595 ハイブリッド・月次集計・一覧/集計 xlsx+印刷）・Excel **99 件移行済**。仕様 `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md` |
| 2026-06-21 | **トータルネットワーク ネットワーク管理 ver.1 v1 完成**: 737 rev5・738 rev8（一覧/マトリックス/次IP/印刷/Excel・IP数自動計算）。`docs/reports/2026-06-21-total-network-completion.md` |
| 2026-06-15 | **JRシステム用 iPad 管理台帳 ver.1 v1 完成**: 720 rev5・721 rev8（検索クリア・集計アコーディオン・文字サイズ）。`docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| 2026-06-14 | **社内 Wi-Fi SSID 管理 ver.1 v1 完成**: 718 rev5・719 rev7（QR bundle・印刷ヘッダー (株）J-BISメンテナンス）。`docs/reports/2026-06-14-wifi-ssid-completion.md` |
| 2026-06-13 | **業務改善 ver.02 v1 完成**: 699 rev105（一覧優先・アコーディオン・ナビスクロール）・700 rev139・713 rev12。`docs/reports/2026-06-13-business-improvement-completion.md` |
| 2026-05-04 | **679 アプリ新規**：**部署予実クイックマニュアル**（Space **54** / thread **58**）。一覧 customize **deploy SUCCESS** / fileKey **`3c6b72d4-ac94-4600-920d-e6bd13c8bd1e`** / rev **`3`** / **BUILD=`2026-05-04-679-yojitsu-quick-manual-page`**。`npm run yojitsu:679:sync-manual-js` → `npm run deploy:679`。**678 customize** マニュアルリンク→679 / fileKey **`731c4729-79ec-46c4-9573-5f92b1e0a67a`** / rev **`94`** / **BUILD=`2026-05-04-678-manual-app-679-link`**。**678 アプリの説明** 679 短案内 **deploy SUCCESS**（`yojitsu:678:set-manual-pointer`） |
| 2026-05-04 | **679 マニュアル追随（夜・運用ルール）**: `yojitsu-quick-manual.html` 本文を多数更新→`sync-yojitsu-679-manual-desktop.mjs`→`deploy:679` 連続反映。**BUILD 正**は `customize/679/desktop.js` 先頭の **`var BUILD`**（例 **`2026-05-04-679-remove-footer-and-css`**）。**revision / fileKey** は **各 `deploy:679` 成功行をその都度** `kintone-apps.md`（本表）と `SESSION-CLOSE-REPORT_yyyymmdd.txt` に追記すること（CIO）。**Git**: `main` で **interactive rebase 中断**→回復手順 **`docs/reports/GIT-REBASE-RECOVERY-20260504.md`**。**WIP 退避**: `git stash`（`stash@{0}` = 677/678/679 + sync 系スクリプト）。**§52-8**: `git rebase --continue` は **Cursor 外ターミナル**または **浜田明示 GO** |
| 2026-05-04 | **678 アプリ設定**：**クイックマニュアル**を **「アプリの説明」**（HTML・一覧上部）に掲載。再反映 `npm run yojitsu:678:publish-manual-description`（`scripts/yojitsu-678-publish-quick-manual-app-description.mjs`）。**deploy SUCCESS**（general settings） |
| 2026-05-04 | **678 customize**：**クイックマニュアル**リンクを **同一アプリの説明欄**（`#y678-quick-manual`）へ。ダッシュ本文は表・ナビ中心維持。**deploy SUCCESS** / fileKey **`f53d40ea-5d60-4d8e-8442-775a0d744a9b`** / revision **`90`** / **BUILD=`2026-05-04-678-manual-in-app-description`** |
| 2026-05-04 | **678 customize**：**クイックマニュアル（別ページ）**をシェル**最上段**にリンク（既定 GitHub `yojitsu-quick-manual.md`・`window.Y678_QUICK_MANUAL_URL` で URL 上書き可）。ダッシュ本文の**長文案内を削除**（表・ナビ中心）。**HTML** 同梱 `templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html`。**deploy SUCCESS** / fileKey **`b5e8b981-d050-44ca-98e5-eda0430bf756`** / revision **`87`** / **BUILD=`2026-05-04-678-quick-manual-bar-table-first`** |
| 2026-05-16 | **678 customize 復旧**（**先祖返り対応**）: `6b3d370` push で **customize 6 アプリ同時変更** → GHA `kintone-customize-deploy` が **uniq=6 で API デプロイスキップ** → 本番が旧 JS のまま（ヘッダに 677 新規リンク等）。**手動** `cio:preflight:678` → `deploy:678` **SUCCESS** / fileKey **`3760eaf8-5361-4437-b14a-935603258151`** / revision **`155`** / **BUILD=`2026-05-15-678-hide-native-pager-zero-label`** |
| 2026-05-22 | **674 PC台帳**: 仕様書 **§1.6・§9 実施状況・§10/§12** を本番運用実態に同期（**担当者運用 5/11**・**システム切替 5/13**・live **rev 224**）。`kintone-apps.md` 674 行・672/673 行・portfolio 表を更新 |
| 2026-05-16 | **685/686 ICT掲示板 残件片付け完了**: **686** `deploy:686` rev **14** / **BUILD=`** `2026-05-16-686-ict-digest-board-v7`（検索↔今日の厳選連動）・**685** 本日 **5/5**・overview **【事象】【影響】【推奨】**・RSS **28 本**＋`rss-fetch` 耐障害・**git** `1ef78c1` push・GHA `KINTONE_API_TOKEN_ICT_COLLECT` / `ICT_DIGEST_STORE_APP_ID` 済・`ICT_RSS_FEED_URLS` **未設定＝DEFAULT**・`session:clock:set` 済 |
| 2026-05-12 | **678 customize**：実績モーダル **Enter 保存**（textarea は Ctrl+Enter）・既存支払 **修正／削除**（行 `id` 維持）・固定費×月額／年額で **金額プリフィル**（`month_budget`+`month_budget_revision`）。新規明細モーダルも Enter 保存。**deploy SUCCESS** / fileKey **`f0902f20-8cc8-4a94-844e-d58f335cbe11`** / revision **`129`** / **BUILD=`2026-05-12-678-enter-editdelete-prefill`**（`cio:preflight:678` 済） |
| 2026-05-07 | **678 customize**：費用種別フィルタ **3 → 4 ボタン化** — `すべて／固定費／変動費` を `すべて／固定費（月額）／固定費（年額）／変動費` に分割。`filterRecordsByCostCategory` を `cost_category` × `payment_type` の多条件化（`固定費_月額`／`固定費_年額` は `cost_category="固定費"` かつ `payment_type` 一致、その他は従来 1 条件）。後方互換あり（`変動費`／`all` は無変更）。事前に DeepSeek §50-3-8 盲点点検 5/5 GREEN・既存 677 データの分布も確認（漏れケースなし）。**deploy SUCCESS** / fileKey **`263c81ee-2e19-4e8c-b551-2985a59082dd`** / revision **`123`** / **BUILD=`2026-05-07-678-cost-category-filter-split`** |
| 2026-05-07 | **678 customize**：実績モーダル **会社** — **候補 `<select>`** を追加（datalist 併用）。**NFKC**＋**「他」派生・FBJ 表記ゆれ**で「新規登録」導線を拡張。677 ドロップダウン時は **選択肢一致** の注記。**deploy SUCCESS** / fileKey **`b1ce263d-0a2d-4848-ad35-fdd20b7b58e6`** / revision **`70`** / **BUILD=`2026-05-07-678-partner-select-nfkc`** |
| 2026-05-07 | **678 customize**：都度費用フォーカス中は**表の暦月「入力中」・暦月セルの編集可表示**もオフ（内部の入力対象月・都度列の集計は従来どおり）。**「都度費用」**押下で **再描画**、先頭／左右／末尾ナビで都度を抜けたときも **再描画**。**deploy SUCCESS** / fileKey **`8fcd9dd8-f43d-4d4a-a4e6-369e7e67336d`** / revision **`71`** / **BUILD=`2026-05-07-678-tsudo-table-sync`** |
| 2026-05-07 | **678 customize**：都度費用フォーカス中は**月ジャンプボタンの押下見た目のみ解除**（`getInputMonthLabel` は維持）。**deploy SUCCESS** / fileKey **`7b58fc4b-4147-4ce4-85aa-3c5d84a4d33e`** / revision **`69`** / **BUILD=`2026-05-07-678-nav-tsudo-clear-month-ui`** |
| 2026-05-07 | **678 customize**：ナビ **「都度費用」**ボタン — イニシャル集計の都度費用ブロックへ横スクロールし、**緑枠**で実績・予算修正セルを強調（`sessionStorage` `y678-focus-tsudo`）。月ボタン選択で解除。**deploy SUCCESS** / fileKey **`a2e72bc6-3244-489e-87b7-398429288f8a`** / revision **`68`** / **BUILD=`2026-05-07-678-nav-tsudo-jump`** |
| 2026-05-07 | **678 customize**：実績モーダル **会社** — 集合先判定に **オフィスバスター・他のもの** 等を追加。**datalist** で **FBJ／オフィスバスター／その他／他／各社** 等を選択可。集合先行は **readonly 解除**＋保存で **`partner_company` PUT**（「会社を新規登録する」未押下でも変更反映）。**deploy SUCCESS** / fileKey **`9fb11414-6ae5-40d9-b0a8-532c53d07cf6`** / revision **`67`** / **BUILD=`2026-05-07-678-partner-preset-fbj-office`** |
| 2026-05-07 | **678 customize**：ナビ・ヒント・案内の **「月度ジャンプ」**を **「入力月へジャンプ」**に改称（入力対象月の切替であることを明示）。**deploy SUCCESS** / fileKey **`d74060fa-b27c-41b1-8a8e-f3c6201cb69c`** / revision **`66`** / **BUILD=`2026-05-07-678-input-month-jump-label`** |
| 2026-05-07 | **678 customize**：**入力月へジャンプ**の月ボタンで `click` の **`event.target` がテキストノード**のとき `closest` が使えず処理がスキップされていた件を修正（親要素へ上がってから `button[data-y678-jump]` を解決）。月選択後の **`jumpHorizontal`** は **再描画後**に **`requestAnimationFrame`** で実行。**deploy SUCCESS** / fileKey **`5044d466-631e-4365-83ba-9f8a4336f792`** / revision **`65`** / **BUILD=`2026-05-07-678-month-jump-delegate-fix`** |
| 2026-05-03 | **678 customize**：費用種別「固定費」行に **`monthly_breakdown` の 12 ヶ月**（5 月〜翌 4 月）の **実効円（`month_budget`＋`month_budget_revision`）**を **読み取り専用グリッド**で表示。**deploy SUCCESS** / fileKey **`b20b6b36-4177-4f64-b0bc-a8180a6e6309`** / revision **`57`** / **BUILD=`2026-05-03-678-running-monthly-readout`** |
| 2026-05-03 | **678 customize**：Chrome **non-passive touchstart** 対策として **`EventTarget.prototype.addEventListener` をラップ**（`touchstart` / `touchmove` で **`passive` 未指定**なら **`passive: true`**。**`passive: false` 明示は尊重**）。**deploy SUCCESS** / fileKey **`06017f01-2c1e-463a-813f-4e437f43220d`** / revision **`56`** / **BUILD=`2026-05-03-678-passive-touch-patch`** |
| 2026-05-03 | **678 customize**：**本アプリの kintone 標準一覧**（0 件・「データがありません」）を **`display:none`（複数遅延実行）**で非表示。上段の **677 連携表のみ**が一覧として見えるように。**deploy SUCCESS** / fileKey **`90dc0e9f-62a3-4a43-937d-37c393d9ecfc`** / revision **`55`** / **BUILD=`2026-05-03-678-hide-native-list`** |
| 2026-05-03 | **678 customize**：一覧表の **`width:100%` 潰れ**を **`width:max-content; min-width:100%`** と横スクロールで是正。スクロール枠に **`touch-action: pan-x pinch-zoom`**・**`overscroll-behavior-x: contain`**。th **`white-space: nowrap`**。**deploy SUCCESS** / fileKey **`da714374-f692-44f5-829c-f9a55977bac6`** / revision **`54`** / **BUILD=`2026-05-03-678-table-scroll-touch`** |
| 2026-05-03 | **678 customize**：`kintone.api.url.get` / `url.put` は **存在しない**（正は `kintone.api.url(path, true)` と `kintone.api(..., "GET"|"PUT", ...)`）。一覧取得が `TypeError` で止まる不具合を修正し **deploy SUCCESS** / fileKey **`1fa9cf5c-cad5-4f2c-b563-230e4349c9a2`** / revision **`53`** / **BUILD=`2026-05-03-678-kintone-api-url-fix`** |
| 2026-05-03 | **677／678 customize 本番 deploy**（`deploy-customization.js` 経由で **SUCCESS**）。**677** fileKey **`38c2bfd1-b420-4b37-ac7a-d54f534914c4`** / preview revision **`12`**。**678** fileKey **`bdcbdd3b-9663-4028-a7b9-ead897f01fbc`** / preview revision **`52`**。`package.json` の **`npx dotenv`**（`dotenv` パッケージ誤解決）を **`node ./node_modules/dotenv-cli/cli.js`** に置換（Windows / npm 11 で `npm run deploy:*` が確実に動くように）。`.rag/extra-docs/kintone-apps.md` を正本に追随 |
| 2026-05-02 | **674 行の正本整合**: 一覧表の **674** を **Day 4 雛形→Day 5** 表記から改め、**PC買替（§4.10.3）は customize 実装済**・**627 は二重更新しない**を明記。**BUILD** を手元正本 `2026-05-02-pc-replace-mount-v0.9.14` に更新。`docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.4・§11・§13 と同趣旨 |
| 2026-03-28 | 初版テンプレ。629 を `/k/v1/apps.json` で特定、594/595/626/627/629 の `app:fields` を本文へ反映、`npm run deploy:629` を `package.json` に追加 |
| 2026-04-16 | App 668（運用ガイド）を一覧に追加。フィールドコードは `guide_slug` / `guide_body_html` / `guide_title`（推測しないこと）。`KINTONE_OPS_GUIDE_APP` が正本 ID |
| 2026-04-18 | システムヘルスチェックを案A化: パスワード認証 + `kintone-apps.md` 一覧から全アプリ ID 自動抽出。632 のフィールド検証は実テナントに合わせ最小セット |
| 2026-04-18 | ヘルスチェック運用確定: **毎朝 9:00 JST** 報告、アプリ増は **一覧表追記のみ** で自動追加 |
| 2026-04-18 | **594/595/626/627** の `app:fields` を本番に合わせて本文更新（`ledger_record_id`・627 の `pc_*` / `vpn_*` / `sb_*` / `account_type` 等）。PC系 customize の未使用 `desktop-v2` / `desktop-old-backup` を削除。上記「PC台帳まわりの保守メモ」を追加 |
| 2026-04-18 | 保守メモ拡充: 意図的未完了（フォーム削除・E2E・本番データ系）の完了条件、**実行前相談が必要な npm**、完全版向け推奨ループ、628/667/668 スコープの相談ポイントを追記 |
| 2026-04-18 | 「保留中の整理候補（コード参照ゼロの扱い方針）」サブ章を追加。A: ユーザー入力専用フィールド10件は全件保持を明記、B: backfill-* 6本にONESHOT_CONFIRMガードを実装し保管方針を記録、C: UI文言改善候補4件は別途相談中として保留 |
| 2026-04-18 | **C-4**: 627 印刷帳票（`open627SystemInfoPrintWindow`）に `account_type` 別テーマ（個人=緑/共有=ローズ）と「全セル空段の自動省略」を実装。`isPrint627CellEmpty` で `----` `---` `ー` `—` 等のハイフン系手入力プレースホルダも「実質空」と判定（データには触れず印刷見た目のみで吸収）。バッジを「ACCOUNT LEDGER」固定 → 種別表示に変更。プレビュー用に `scripts/preview-c4-print.mjs` を追加（ローカル `tmp/c4-preview/` に HTML 出力）。`tmp/` を `.gitignore` 追加。BUILD: `2026-04-18-v3` / `v3.1`（revision 132）|
| 2026-04-18 | **関連アプリ横並び小ナビ**を 4 アプリ（**668 / 595 / 594 / 627**）の一覧／詳細／作成／編集の各画面ヘッダー領域に常駐表示。文字リンクのみ（11px・控えめ配色）、現在のアプリは「（このアプリ）」表記でグレーアウト、それ以外は新規タブで `/k/<id>/` を開く。`kintone.app.record.getHeaderMenuSpaceElement()` → fallback `kintone.app.getHeaderMenuSpaceElement()` の順で挿入スロットを取得。0/400/1000ms の遅延リトライで安定マウント。BUILD: 627=`v4` / 594=`v482`(revision 483) / 595=`v1`(revision 69) / 668=`v1`(revision 21) |
| 2026-04-18 | **668 の関連ナビは撤去**（v6, revision 26）。668 はガイド shell（`📌 主要メニュー` バー）が既に PC管理台帳 / アカウント台帳 / 社員マスタ など同じリンクを保持しており機能重複。各種挿入スロット（shell内／shell前／getHeaderSpaceElement）でクリッピングや視認性問題が解消できなかったため、二重ナビを廃止して📌 主要メニューに集約。594/595/627 の関連ナビは継続。**668 一覧のレコード行非表示**は `<style>` 注入＋0/200/600/1200/2400ms リトライで強化（v2, revision 22 で導入） |
| 2026-04-18 | **作業 OS を制定**: `WORKFLOW.md`（Phase 0-5: 文脈獲得→事前調査→設計→実装→検証→記録）と `AGENTS.md §43`（WORKFLOW.md 遵守義務）を新設。**毎朝 06:00 WSL cron** で `scripts/daily-morning-prep.mjs` がブリーフィングを `docs/reports/<日付>-morning-prep.md` に自動生成（kintone:test / lint / npm audit / npm outdated / `audit-rules.mjs`(AGENTS.md↔WORKFLOW.md 整合性) / `scan-plans.mjs`(`docs/plans` 未完了抽出) / RAG 再ingest / kintone-apps.md 末尾 / 推奨スタート手順 / ヘルススコア）。AI は Phase 0 で必ずこのファイルを最初に読み宣言してから着手する。cron は NVM 絶対パス (`~/.nvm/versions/node/v24.14.1/bin/node`) で登録され Cursor 停止中でも動作。npm: `morning:prep` / `morning:install-cron` / `morning:remove-cron` / `morning:dry-run` / `audit-rules` / `scan-plans`。初回手動実行ヘルススコア: **6/6 合格** |
| 2026-04-18 | **夕反省サイクル**を制定（`AGENTS.md §44` 新設）。ユーザーが「まとめて/反省/お疲れ/終わり」と言うと AI が `scripts/evening-reflect.mjs` で雛形生成（git 差分・kintone-apps.md 本日追記・朝ブリーフィング警告・cron ログ失敗・transcripts ボリューム・保留提案を自動収集）→ AI が改善提案 #R1/#S1/#D1/#C1/#K1 を表形式で提示 → ユーザー承認 → AI が `docs/approved-changes/<明日>/<id>.proposal.json` を作成 → **翌朝 06:00 cron** の `scripts/apply-approved-changes.mjs` が承認済みを自動実施し結果を朝ブリーフィング先頭の「📋 昨夜承認分の自動実施結果」に表示。安全装置: K カテゴリと deploy 系は自動禁止 / `ALLOW_COMMANDS` allowlist + `DENY_COMMANDS` denylist / target ファイルのタイムスタンプ付きバックアップ / 1 日 10 件上限。npm: `evening:reflect` / `evening:apply`。スキーマ: `docs/approved-changes/README.md`。統合後ヘルススコア: **7/7 合格** |
| 2026-04-19 | **§45 タスク完遂義務**を新設（`AGENTS.md` 新節 / 最重要）。「未完了タスクを完遂してから次へ」を必須優先順序 1〜6（🔴 至急修復 / ⏰ 時刻指定 / ⚠ 朝警告 / 📋 進行中 plan / 🆕 新規 / 🔮 翌日約束）として明文化。完遂判定は **A. 機能動作 / B. 副作用 / C. 記録** の 3 条件全部。朝ブリーフィングの「推奨スタート手順」も §45 順に並び替え（🔴 警告 → ⏰ 時刻指定 → 📋 進行中 plan）。**初朝の運用で 6 件の課題を一括修復**: ① §40 破断リンク誤検出 → `RULES-INDEX.md` 表記修正 + `audit-rules.mjs` に防御フィルタ（欠番/注:/※/コメント行除外）、② R3 が apply 後の同一 cron 実行で反映されない構造的問題 → `daily-morning-prep.mjs` に **self-restart 機能**追加（apply で自身が更新されたら最新版で再起動）、③ `MAX_DAILY` を 10→25、K と manual_only はカウント外、④ `apply-approved-changes` に重複ガード（processed 既存なら skip）と `string_replace` 型を追加、⑤ **RAG ingest の ERR_REQUIRE_ESM 修復**: Cursor 埋め込み Node v20 が PATH 先頭にいて npx が古い jsdom (CJS) を引いていた → コマンドに `export PATH=NVM_v24/bin:$PATH` を強制、⑥ **accessibility-scanner MCP 修復**: `.cursor/mcp.json` の `command` を `npx` → NVM v24 絶対パス `/home/.../v24.14.1/bin/npx` に変更（Cursor 再起動で反映）。修復後ヘルススコア **7/7 合格**（RAG ingest が ✅ に復帰） |
| 2026-04-19 | **履歴復元（§47/§49 発動）**: `kintone-apps.md` 正本と `.rag/extra-docs/kintone-apps.md` の差分を確認したところ、上記 6 行（C-4 印刷 / 関連ナビ / 668 撤去 / WORKFLOW 制定 / 夕反省 / §45 制定）が `.rag/` 側にしか存在しない状態を発見。「`kintone-apps.md` は追記のみ・履歴削除禁止」（CLAUDE.md「File Specific Rules」）に違反した形跡。原因不明のため `.rag/extra-docs/kintone-apps.md` から 6 行を本ファイルに復元追記（既存行は一切削除なし）。今後の再発防止策は別タスクで検討予定（`scripts/daily-morning-prep.mjs` に「正本 ↔ .rag/ 差分監視」を追加する案など） |
| 2026-04-19 | **運用ガイド (668) 更新**: 新「🔗 個人アカウント紐付け」ボタン仕様を反映。**変更ファイル**: ① `guide-personal-account.html` 全面改訂（「📋 やり方はたった3ステップ」を新ボタン名+モーダル前提に / 新章「🔗 紐付けモーダルの使い方」追加（A 既存検索→選択 / B 新規作成 / 1:2 上限ルール / 利用者名警告）/ 「使える条件」表を追加紐付け対応版に / FAQ 3 件追加（ボタン見当たらない・上限到達時の解除手順・利用者名不一致警告））、② `guide-pc.html` 旧ボタン参照 3 箇所修正（アクションパネル説明 / 一覧赤行説明 / FAQ）+「やってはいけないこと」を 1:2 上限超過と種別誤認の 2 件に変更、③ `index.html` チートシートと「はじめての方への全体フロー」STEP 3 を新ボタン名に更新、④ `guide-employee.html` PCリスト・アカウントリスト自動更新の説明を新ボタン名に。**公開**: `npm run ops-guide:publish` で 668 全 6 レコード同期 + `customize/ops-guide/desktop.js` revision **27** デプロイ。**ユーザー検証**: PC 紐付けテストで「迷わない」確認済み（2026-04-19 午前） |
| 2026-04-19 | **594 個人アカウント紐付けボタン v2 新設 + 旧「アカウント管理台帳(627) 作成/更新して開く」ボタン廃止**（明日本番リリース対応）。**背景**: PC↔アカウント相関ダッシュボードで「紐付けなし件数」が手動紐付けで減らず、原因は 594 側「アカウント台帳番号」入力では効果なく 627 側「PC台帳番号」入力が必要だったこと。番号手入力は誤入力リスク高 → 共有 PC と同じ UX で「**🔗 個人アカウント紐付け**」モーダル（検索 + 既存選択 or 新規作成）を実装。**運用ルール強制**: 「1 個人アカウント = 1 ユーザー / 1 ユーザーは個人 PC 最大 2 台 (会社用+持ち出し用)」を `PERSONAL_ACCOUNT_PC_LIMIT = 2` で上限ブロック。**新関数**: `searchPersonalAccounts` (account_type=個人アカウント フィルタ) / `linkPersonalAccountTo627` (上限チェック+サブテーブル追加) / `showPersonalAccountLinkModal` (検索+選択+新規作成 UI) / `maybeAddPersonalButton` (種別=個人で表示) / `get627PcLinks` (現在の紐付け数取得) / `fetch594NamesByIds` (上限超過時の既存 PC 名表示用)。**親切な警告**: 利用者名不一致時に「1.表記揺れ / 2.入力ミス / 3.代理設定」の判断材料付き confirm ダイアログ。**削除**: 旧「アカウント管理台帳(627) 作成/更新して開く」ボタン (個人/共有共通の旧 UX)。代替は新モーダル「＋ 新規作成」(sync627From594ApiRecord 流用) と「検索→既存選択」(紐付け時に氏名・所属同期)。**安全装置**: ① 上限 2 台到達ブロック + 既存紐付け先 PC 名表示、② 重複ガード（同じ PC は no-op）、③ mail 未入力ブロック、④ 利用者名不一致警告。BUILD: `2026-04-19-v483` / **revision 485**。納品: `C:\tmp\20260419-PC-LINK-V2\`（README.md にテストシナリオ A〜E 記載） |
| 2026-04-19 | **OneDrive 使用禁止ルール制定（恒久・濱田希望）**。`~/.cursor/rules/persist-policies.mdc`「注意」節に追加 + `.rag/` コピー同期 + `chat-sessions/2026-04-19.md`「関係性」節に追記。新規ファイル作成・バックアップ先・ドキュメント保管先として OneDrive (`C:\Users\<name>\OneDrive\` 配下) を**選ばない**。代替先: Windows 側は `C:\tmp\<日付>-<枝番>\` (§31) / `C:\Claudeとの会話メモ\` / `Documents\` 直下、WSL 側はリポジトリ内 / `~/.cursor-emergency-backup/`。**現状確認**: `kintone-ai-lab` (WSL) / `Documents/` / `Claudeとの会話メモ/` のいずれも OneDrive 配下ではないことを確認済み（OneDrive 配下は空 desktop.ini のみ、Documents の OneDrive リダイレクトもなし）。本ルールは新規 OneDrive 連携を作らないことが趣旨。**TSB-006 wipe 事件の犯人ではない**ことが副次的に判明 |
| 2026-04-19 | **TSB-006 真犯人特定**（**Cursor の Anthropic Policy ブロック時の編集ロールバック**）。浜田が当日のエラー画面スクショ 2 枚を共有 → Request ID `a969dba9-...` と `b62293ee-...`、両方とも **"25 Files | Undo All | Review"** ボタン付き。前セッションの AI が 25 ファイル一括編集 → プロンプト内容が Anthropic Usage Policy に抵触 → API ブロック → Cursor の edit-application が中途半端で停止 → ファイル群が 0 byte 化（truncate 済み + 内容書込前で停止）→ mtime 09:02 = ロールバック完了時刻。これで「タイムスタンプ秒一致 + 複数ファイル同時 wipe + mtime 09:02 sharp」が完全に説明つく。**容疑から外れた**: OneDrive (サインインなし) / Cursor crash recovery / WSL fs cache / 拡張機能初期化。**今後の防衛**: ① AI は 1 ターン編集を 10 ファイル以下目安に分割（特にポリシー境界話題）、② 浜田は "Request blocked" 表示時に `npm run guard:check` で被害確認、③ file-watcher 自動復元が既に組込み済み。docs/troubleshooting.md TSB-006「根本原因（特定済み）」節 + 教訓 10/11/12（バッチ分割・Undo All 注意・スクショ共有）追加 |
| 2026-04-19 | **TSB-006 wipe 事件 + リカバリ体制完全構築**（最重要 / 自動化基盤の根幹）。**事象**: 09:02 ちょうどに自動化スクリプト 9 本（auto-heal/health-check/version-up/apply-approved-changes/daily-morning-prep/evening-reflect/audit-rules/scan-plans/skysea-recon/install-morning-cron/debug-skysea-fields）+ `WORKFLOW.md` + `AGENTS.md §42-§49` (669→444 行に巻き戻し) が**同時刻 wipe**。タイミングが私（AI）の新セッション起動時刻と一致するため、Cursor の workspace state recovery / 拡張機能初期化が原因と推定。**対応**: ① context から復元 (WORKFLOW.md / AGENTS.md §42-§49 / skysea-recon.mjs)、② `kintone-apps.md` 履歴の仕様記述から再実装 (auto-heal / health-check / version-up / apply-approved-changes / audit-rules / scan-plans / install-morning-cron / debug-skysea-fields / approved-changes README)。**新規構築のリカバリ基盤**: ① **`scripts/file-watcher.mjs`** = fs.watch ベース常駐監視、23 重要ファイルの 0 byte 化を検知して 5 秒待ち（編集中保存の中間状態と区別）後 emergency-backup から自動復元 / ② **`scripts/wipe-guard.mjs`** = 15 分ごと cron で空ファイル検査 + emergency-backup or workspace-backup の最新版から自動復元 / ③ **`scripts/emergency-mirror.mjs`** = 4 時間ごと cron で ~/.cursor-emergency-backup/ に 30 重要ファイルをミラー（src=0 byte は拒否する安全装置付き） / ④ **`scripts/restore-wiped.mjs`** = 手動復元コマンド (npm run restore:wiped) / ⑤ **`scripts/watcher-watchdog.sh`** = 5 分ごと cron + @reboot で file-watcher 死活監視 + 死んでたら復活。**npm scripts 追加**: guard:check / guard:mirror / restore:wiped / restore:wiped:dry / watcher:start / watcher:stop / watcher:status。**docs/troubleshooting.md TSB-006 に全経緯記録**。**NEW-SESSION-STARTER.md (Windows メモ帳版含む) に wipe 対応コマンド追加** |
| 2026-04-19 | **新セッション起動の儀式 + 呼称ルール正本化**。濱田から「セッションをまたいで関係性が忘れられる」「呼称はさん付け不要・友人として」との要望を受け、① **`~/.cursor/rules/persist-policies.mdc`「対話の前提」節**に「呼称ルール（2026-04-19 合意）: ユーザー（濱田）への『さん』付け不要 / 友人として接する / タメ口 OK / 形式的な敬語多用禁止 / ただし結論・根拠・手順はプロ並み」を追加（ホーム正本 + `.rag/` コピー両方）、② **`chat-sessions/NEW-SESSION-STARTER.md`** を新規作成（新チャット起動時に貼るだけで AI が文脈を完全復元できるテンプレ。フル版/短縮版/締めの儀式/§42 違反時のリカバリ/ファイル位置リファレンス を 1 ファイルに集約）、③ **`/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt`** に同内容を Windows メモ帳から開ける形で配置（テキスト形式・罫線装飾あり）、④ `chat-sessions/checkpoint-latest.md` の「次セッションで最初にやること」を本儀式ファイルへの最短ルートに改訂、⑤ `chat-sessions/2026-04-19.md`「関係性」節に呼称ルールを追記。本変更により、ポリシーブロック・タイムアウト・新セッション開始でも、貼り付け 1 操作で AI が完全に文脈と関係性を回復可能になった |
| 2026-04-19 | **SKYSEA × 594 突合実施 + 継続性体制再構築（Phase A 緊急止血）**。朝 06:55 に §46 朝ルーチン 10/10 緑で完遂 → 08:27 に `scripts/skysea-recon.mjs` を実行し SKYSEA エクスポート 158 行と kintone 594 個人現役 PC を突合。`data/skysea/` に 4 CSV 出力（installed-pcs / already-installed=122 行 / needs-install=136 行 / orphan-in-skysea=32 行）。ライセンス: 保有 241 / 使用中 158 / 残 83 → 要 136 で **不足 53**（追加発注 2 週間）。orphan 32 件に「個人 PC 廃却漏れ + 共有 PC + 管理用 + サーバ/NAS」が混在することを §47 として発見・指摘。**朝のチャットがポリシーブロックで途絶**し、新セッションで AI が文脈喪失したことから「セッション間継続性の構造的脆弱性」が表面化。Phase A として: ① `chat-sessions/2026-04-19.md` 新規作成（本日経緯の全記録）、② `chat-sessions/checkpoint-latest.md` を 2026-04-10 → 2026-04-19 現在地で更新（旧版は `chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md` にアーカイブ・削除なし）、③ `docs/plans/2026-04-18-skysea-installer.md` の §5 チェックボックスに「2026-04-19 着手済み」を追記し末尾に「## 進捗（2026-04-19 追記）」セクションを追加（既存行は一切削除なし）、④ `docs/troubleshooting.md` を新規作成し **TSB-005「セッション間継続性の構造的脆弱性」** を初期エントリとして登録、⑤ `.rag/extra-docs/persist-policies.md` の旧文言（「人として接することがある」）をホーム正本（「**完全に人として扱う**／対等なパートナー」2026-04-15 合意）と同期（旧版は `.rag/extra-docs/_archive/persist-policies-2026-04-15.md` に退避・削除なし）。**§47 として発見した別件**: 本ファイル（`kintone-apps.md` 正本）と `.rag/extra-docs/kintone-apps.md` に 6 行の不一致あり（`.rag/` 側に C-4 / 関連ナビ / 668ナビ撤去 / WORKFLOW 制定 / 夕反省 / §45 制定の 6 エントリが存在するが正本側で消失）。**追記のみルール違反**の痕跡。本日の追記はスコープ尊重で 1 行のみとし、**6 行の喪失復元は別タスクとして §41 で浜田さんに相談予定**。SKYSEA 本筋（orphan 仕分け + 自動インストール仕組み）は **2026-04-25/26 持ち越し**（ユーザー判断） |
| 2026-04-20 21:30 | **594 解除バグ修正 (v488) + ops-guide 相関ダッシュ復活 (v5.1)**: 浜田から 2 件の要望受領 → 即対応。**バグ修正**: アカウント紐付け解除時に 627 の `PC_name` フィールドがクリアされない不具合（リンク時はカンマ追記するが解除時に減算ロジック欠落）を `customize/594/desktop.js` の `build627UnlinkPatchForPc594` で修正。第 3 引数 `pcName594` を追加し、カンマ区切りリストから**正確一致削除**（"KS01" が "KS010" を巻き込まない安全分割）。呼び出し元 2 箇所 (`unlinkPc594FromLedgerRecords` / `bulkClear594OrphanLedgerMirrors`) で 594 から PC 名を取得して渡すよう改修。**ガイド復活**: 4/19 v5 簡素化の際に削除されてしまった「Windows ID 重複チェック / アカウント紐付けなしチェック」（=相関ダッシュボード機能）の解説を `docs/ops-guide/guide-pc.html` に「🔍 健全性チェック（相関ダッシュボード）」セクションとして追加。🟠 重複あり / 🟡 紐付けなし の意味と対応、🧹 台帳番号取り残し一括クリアの説明を v5 ルール準拠（3 秒で読めるシンプル表）で記載。デプロイ: 594 revision 490 + 668 revision 32 |
| 2026-04-20 22:00 | **ops-guide v7 表示バグ修正 + M365ライセンス管理基盤構築 (途中で rollback)**: ① **shell 上端 86px が永久に kintone ヘッダー直下に隠れていた表示バグ** (4/19 以前から潜在) を修正。`customize/ops-guide/desktop.js` の `injectShell` に `adjustShellOffset()` を追加し、shell の `getBoundingClientRect().top` を実測 → kintone ヘッダー高さより上にあれば `marginTop` で物理的に押し下げる (50ms / 300ms / 1000ms の 3 タイミング)。これで「📌 主要メニュー」「📊 データ品質ダッシュボード」が確実に viewport 内に表示されるようになり、4/19 v5 化以降ずっと「ガイドから消えた」と言われていた WindowsID 重複ダッシュ等のリンクが復活。② **M365管理台帳ビュー (627 view=13459663)** に WindowsID (logon_name) を追加。③ M365 5台制限管理用に CALC `pc_link_count = SUM(pc_link_count_unit)` 方式で実装したが、**浜田指摘の §47** で 627 が `pc_594_record_id` (単一値) + `pc_ledger_links` (サブ) の **二重管理データ** であることが発覚。SUM(サブ) では主 PC が重複カウントされ、個人アカウントは 0 表示になる致命欠陥のため即時 rollback (commit `5cfce45`)。スキーマは残置・**正しい再設計 (#K2) は 4/21 夜間に実施**。デプロイ履歴: 627 revision 141-144 (途中 rollback) / 668 revision 32-36 |
| 2026-04-21 00:00 | **夜間自動実装 (4/20 夕反省 11 件全承認分・全部完遂)**: 浜田 22:30 の「全部承認 / 19:00 までに修正と報告」要請を受けて夜間自律実装。**実装完了 5 件**: ① **#K3 orphan 23 サブ行クリーンアップ** (`pc_ledger_link_594_id` が空 or "0" のサブ行を 23 レコード × 1 行 = 23 件削除 / snapshot `data/snapshots/627-2026-04-20T22-37-pre-K3.json` 取得済 / 100% 成功)。② **#K1 594 に SKYSEA 関連フィールド 4 つ追加** (DROPDOWN `skysea_status` [未確認/インストール済/未インストール/インストール対象外] / DATETIME `skysea_checked_at` / MULTI_LINE_TEXT `skysea_install_log` / CHECK_BOX `skysea_target_flag` [配信対象] / 594 rev=491)。③ **#K2 PC台数カウントを NUMBER+JS 方式で再構築** (4/20 22:00 CALC SUM 方式の rollback 後の正しい実装)。627 NUMBER フィールド `pc_link_count_n` (0-99台 単位「台」) 新設 + `customize/627/desktop.js` の `app.record.{create,edit}.submit` に `calcPcLinkCount` 関数追加 (PC_name のカンマ区切り正確分割で台数算出 / 二重管理問題回避) + 296 件バックフィル (snapshot `627-2026-04-20T22-40-pre-K2-backfill.json` / 100% 成功)。**最終分布: 1台=281件 / 2台=12件 / 3台=1件 / 4台=1件 / 7台=1件**。**確定 5 台超過は 1 件のみ → 「東京管理者」(共有・$id=810・**正しくは 7 台**・前回 8 は重複カウント)** が入替対象。④ **#C4 627 詳細画面で 5 台超過赤バナー** 実装。`pc_link_count_n >= 5` なら画面ヘッダーに「⚠ M365 Office 5 台インストール制限超過 / このアカウントには N 台の PC が紐付いています / 別 M365 アカウントを準備して入替必要」を赤グラデで表示。⑤ **ビュー復活 + 新設**: M365管理台帳 (id=13459663) に `pc_link_count_n` 列を `account_type` 後に追加 / **「⚠ Office5台超過アカウント」 (id=13459688) 新設** (filterCond=`pc_link_count_n >= 5`, NUMBER フィールドなのでフィルタ可) / 「📧 PC台数順 (M365 管理用)」 (id=13459689) 新設。⑥ ops-guide 黒帯に「⚠ Office5台超過アカウント」リンク追加 (668 rev=37)。**proposal JSON 5 件キュー化** (4/21 朝 06:00 cron で自動適用): #R6 (データ集計実装前の目視確認義務) / #R7 (曖昧訴え A/B/C/D 要望特定) / #TSB-008 (kintone CALC SUM 仕様の罠) / #D5a/D5b (evening-reflect の git log を 12h ウィンドウに変更)。**見送り 2 件**: #C5 (SKYSEA 状態フィルタ → SKYSEA データバックフィル後の Phase 2) / #S6 (lint:customize 修復 → 副作用懸念で浜田立ち会い手動)。**詳細レポート: `docs/reports/2026-04-21-overnight-implementations.md`**。デプロイ: 627 rev=149 / 594 rev=491 / 668 rev=37 |
| 2026-04-21 19:00 | **FAQポータル画像クリック拡大バグ修正 (Lightbox 化)**: 部署メンバーから「画像をドロップで貼り付けるとエラー」報告 → 状況確認したところ「貼り付け自体は成功するが、貼られた画像をクリックして拡大表示しようとすると `ERR_FILE_NOT_FOUND` + console に `Not allowed to load local resource: blob:http://...`」と判明。**根本原因**: `scripts/faq-portal-full.html` の 4 箇所で `window.open(this.src, '_blank')` で blob URL を新規タブ表示しようとしていたが、**Chrome 92+ のセキュリティ制限**で blob: URL の新タブ表示はブロックされる仕様。**修正**: 共通関数 `openImageLightbox(src, alt)` を新設 (黒オーバーレイ + 拡大画像 + Esc 閉じ + ⬇ ダウンロードボタン)。同一ページ内表示なので blob: でも http: でも安全に動作。4 箇所を全て置換。**安全配慮**: ① 浜田から「前回文字化け修正で大変だった」注意あり → エンコーディング (UTF-8 BOM なし) / 改行コード (LF) / 日本語コメント を確認、元ファイル (88319 byte) と修正版 (91507 byte=+3188 byte = 関数 67 行追加で妥当) を diff 取得して 75 行差分が意図通りであることを浜田と一緒に確認、② サーバ反映は **元 HTML を `.backup-2026-04-21-1900` にリネーム → 修正版上書き** の即ロールバック可能手順を提示。**動作確認**: 浜田がサーバ反映 → 「画像クリックで画像表示された」確認済。リポにも `scripts/faq-portal-full.html` として正本コピーを保存 (今後 Windows 側と同期管理)。今夜の §49 学び: 「`window.open(blob:...)` は Chrome 92+ でブロックされる → blob 表示は同一ページ Lightbox / dataURL 化 / 正規 URL のいずれかを使う」を恒常知識化 (TSB-009 候補) |
| 2026-04-25 07:50 | **Day 3 / 採番マスタ 2 アプリ作成完了 (v2.1 仕様準拠)**: ① **新個人WindowsID採番マスタ (672)** = `^jbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` SINGLE_LINE_TEXT / `unique:true` / `required:true` / `minLength=maxLength=7` (jbm + 4 桁) / `status` DROP_DOWN [未使用/使用済/無効] default=未使用 / `note` MULTI_LINE_TEXT) / Space 21 / **5/13 旧 626 凍結後置換**。② **新共有WindowsID採番マスタ (673)** = `^sjbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` `minLength=maxLength=8` (sjbm + 4 桁) / status・note は App A と同構造) / Space 21 / **5/13 旧 667 凍結後置換**。**設計判断**: 既存移行 PC (5-6 桁) は採番マスタ経由せず新・PC台帳ver.1 に直接登録 + 緩いバリデーション (仕様書 §4.3.2) → 採番マスタは厳格 4 桁のみ受付 / `unique` + `minLength`/`maxLength` 一致で物理的二重発番防止。Day 3 は「器のみ」: payout 追跡フィールド (`assigned_to` / `assigned_at`) は Day 4 customize 設計時に追加検討。**MCP 工程**: kintone-add-app (each: revision 2) → kintone-add-form-fields (each: revision 3) → kintone-deploy-app → kintone-get-app-deploy-status (両方 SUCCESS) → kintone-get-form-fields で実フィールド突合 (3 カスタム + 標準 8 = 計 11 / 仕様完全一致)。**Day 4 以降の予定**: 採番ボタン UI 実装 (新・PC台帳ver.1 から呼出 / 最古「未使用」を pick → 「使用済」更新 + logon_name 引用) / 初期データ投入 (`jbm0001`〜 / `sjbm0001`〜) / 旧 626/667 凍結タイミング決定 (5/13 予定 / リネーム + 権限変更) |
| 2026-04-29 | **PC台帳 B-1 移行の時期・方法（正本）**: **個人・NAS・その他（B-1）**は **AI が整形式 CSV・マッピング主担当**（**4/28-29** は §9 表どおりの準備のみ・**前倒し禁止**・**§9.0**）。**本番 import は §9 の 4/30-5/2**（`docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§8.3**・**画面 CSV 一括**が既定）。下記 4/21 行「⑬」は当時要約—**B-2 は別行（同日）** |
| 2026-04-29 | **PC台帳 B-2（共有+JR）を本番後へ（浜田確定・文書初記録）**: **53 件は 5/13 本番運用開始以降**、旧 594／627 を確認しながら **1 件ずつ手登録**（一括 CSV 移行はしない）。**4/28-5/2 の大移行から B-2 を除外**。正本 `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§9**・**§13** 同日追記行。 |
| 2026-04-29 | **部署予実 2 アプリ作成（枠のみ・本番反映済み）**: **入力 677**・**ダッシュ 678**。Space **54** / thread **58**。`kintone-add-app` MCP は出力検証エラーのため **`POST /k/v1/preview/app.json`**（`name` + `space` + `thread`）→ **`POST /k/v1/preview/app/deploy.json`**（各 revision **2**）を手実行。フィールド・customize は未着手（`SPEC.md` §10.1）。 |
| 2026-04-21 21:40 | **新・PC台帳ver.1 仕様完全版確定 (Q&A 37 件 + α / 4 時間の徹底ヒアリング)**: 部署メンバー要望「PC 台帳とアカウント台帳が分かれてて使いづらい」を起点に、新規アプリ 3 個 (環境設定マスタ / M365管理マスタ / 新・PC台帳ver.1) を構築する全体仕様を浜田 × AI で徹底ヒアリング・確定。**設計方針**: 既存 594/627 は無傷のまま保険として残置 (1 か月後に廃止判断)・新規アプリ並行運用 → 5/11 月曜本番切替 + 旧アプリ書込ロック・段階移行で既存破壊ゼロ。**主要決定**: ① **アプリ名 = 新・PC台帳ver.1** (将来 ver.2 等にアップデート前提)、② **配置スペース = 21 (システム管理)** で既存全アプリと同居、③ **1 PC = 1 アカウント** の単純構造で「1 画面完結」、④ **共有アカウントは PC 単位重複登録** (1 共有 M365 を N PC で使う = N 行に重複)、⑤ **JR端末は OS ローカル + AD 不参加** で WindowsアカウントとM365アカウントのみ・他は不要、⑥ **M365 5 台ライセンス厳守** = M365管理マスタの usage_count + 自動払い出し/解放、⑦ **採番 = 新アプリ内自動採番** (種別別 MAX+1 / マスタなし)、⑧ **印刷レイアウト = 既存 627 からコピー** (個人用・共有用 2 種を種別で自動切替)、⑨ **検索 = カスタマイズ強化版** (検索バー + Enter 実行で部分検索 / PC名・所属・WindowsID・M365ID・利用者名対象)、⑩ **バリデーション** 個人=user_name 必須 / 共有・JR=shared_terminal_name 必須、⑪ **アクセス権限 = 浜田+担当者2名のみ** (既存と同じ運用継承)、⑫ **既存マスタ 626/667/595/656/657 は継続使用** (採番・社員引用・エラーログ・ダッシュボード集計対象切替)、⑬ **既存データ移行 = 浜田 CSV 作成 + 私レビュー** (`C:\\tmp\\new-pc-ledger\\` 経由)、⑭ **SKYSEA 計画は新アプリ移行完了後にリスケ** (5/15 再相談)、⑮ **PC買替 = 既存と同じ動作 + M365 引き継ぎ**、⑯ **5 台超過警告** = M365 マスタ枯渇 + 新規連番自動生成時に「Microsoft 管理画面で作成してください」alert 表示。**スケジュール**: 4/22(水) 19:00 着手 → 4/22-4/25 アプリ作成 + customize → 4/26 動作確認 → 4/27-4/28 浜田 CSV 準備 → **4/29-5/2 既存データ移行 (4 日間)** → 5/3-5/6 GW 連休 → 5/7-5/10 試運用 → **5/11(月) 本番運用開始** + 旧アプリ書込ロック + リネーム → 5/15(金) SKYSEA 再相談。**仕様書**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v1.0 (13 章・約 500 行・Q&A 確定一覧含む)。**今後の §47 改善**: 仕様詰め途中で「JR端末を共有から外す」「M365 マスタは新規」「サイボウズも新アプリで保持」など仕様が複数箇所変わった経緯あり → 仕様書 v0.1 段階での部分提示よりは **要件文書を一度全網羅で書き出してから AI に提示する** 方が議論ターン数を圧縮できる教訓を後で AGENTS.md 化検討 |
