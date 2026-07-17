# 業務改善提案システム — 運用準備証跡

**判定日**: 2026-07-17
**承認者**: 浜田
**対象**: システム側の運用準備

`SYSTEM_SIDE_OPERATION_READINESS: OK`

## 1. 判定

5アプリの現行設定・必須項目・ワークフロー・画面・年次処理・評価依頼通知を確認し、浜田承認により**システム側運用準備は OK／完了**と判定した。

この判定は、人への研修、社内制度の展開、実際の評価依頼メール初回受信の完了を意味しない。初回受信は各利用者の kintone メール通知設定に依存するため、運用開始後の受入観察事項とする。

## 2. ライブ版

| App | revision | BUILD／データ |
|-----|----------|---------------|
| **697 設定マスタ** | **11** | 32件＝本番30部署＋管理者専用 WF テスト1件＋共通1件。共通人事 LoginID `jinji`、評価項目20件 |
| **698 社員マスタ** | **19** | `2026-07-04-bi-employee-index-emp-filter`。273件／在籍264件 |
| **699 ご利用ガイド** | **132** | `2026-07-17-manual-evaluation-email` |
| **700 提案申請** | **170** | `2026-07-17-hide-wf-test-dept` |
| **713 年次処理** | **12** | `2026-06-13-bi-annual-redirect-guide` |

## 3. 検証結果

次の検証は最新デプロイ後にすべて合格した。

- `npm run business-improvement:verify-readiness-docs`（正本文書・closure・live-build 不変条件）
- `npm run business-improvement:verify-settings`
- `npm run business-improvement:verify-employee`
- `npm run business-improvement:verify-guide`
- `npm run business-improvement:verify-proposal`
- `npm run business-improvement:verify-annual`
- `npm run business-improvement:configure-evaluation-notifications -- --dry-run` による通知設定の再取得・確認

App 700 は必須項目と WF を確認済み。App 713 は年次処理の検証に合格した。

## 4. 管理者専用 WF テスト行

`【WFテスト】開発検証用` は、評価者・申請者 LoginID をすべて `admin` とした管理者専用行であり、検証用に意図的に保持する。App 700 の申請 UI は、この部署を正確な LoginID `admin` にだけ表示し、その他すべてのアカウントには表示しない。

したがって、697 の32件は本番30部署、管理者専用テスト1件、共通設定1件の正しい構成であり、テスト行の削除は準備条件ではない。

## 5. 評価依頼通知

汎用の「担当者」ステータス変更通知は削除済み。代わりに、現在の担当者を宛先とする3つの独立した案件単位条件通知を設定した。

| 技術上の状態 | 表示段階 | 通知タイトル |
|--------------|----------|--------------|
| `Mgr` | 上司評価 | `【評価依頼】上司評価をお願いします` |
| `Branch` | 支店長評価 | `【評価依頼】支店長評価をお願いします` |
| `Hr`／`本社評価中` | 本社評価 | `【評価依頼】本社評価をお願いします` |

レコードタイトルは**提案件名**。標準メール件名により、kintone、アプリ、提案件名、依頼段階を識別できる。実際のメール配信は各利用者の kintone メール通知設定に依存する。

## 6. 承認済み運用と制約

- **定期リマインド通知は設定しない**。
- 評価者は kintone 通知とご利用ガイドの未評価一覧を定期確認する。
- 旧 Q13 の「3日おき」リマインドは廃止し、本運用で置換する。
- 最初の実メール到着は運用時に観察するが、システム側準備の阻害条件にはしない。
- 担当者のナビは「はじめに・申請編」、評価者は加えて「評価編」を表示する。
- 空の「その他」は FAQ が実際に追加されるまで全員に表示しない。
- 評価アクションは `評価・承認する（n件）`、0件時は無効の `評価待ちはありません`。
- 各一覧はアコーディオン。評価者の未評価一覧は0件でも表示する。
- マニュアル文面は現行の申請・一覧・評価・通知動作に整合している。
- 既存スクリーンショットは明示的な画像差し替え依頼がない限り維持する。

## 7. 関連版管理・正本

文書更新前に Git `origin/main` は commit `5c903c34` と同期済み。

| commit | 内容 |
|--------|------|
| `8c83e7a2` | 評価依頼通知設定 |
| `f829eb09` | ご利用ガイドの評価メール説明 |
| `5c903c34` | WF テスト部署の管理者限定表示 |

関連パス:

- `docs/plans/2026-05-23-business-improvement-proposal-spec.md`
- `docs/runbooks/business-improvement-closed-v1-ux.md`
- `scripts/business-improvement-configure-evaluation-notifications.mjs`
- `scripts/data/business-improvement-wf-test-master.json`
- `customize/business-improvement-guide/`
- `customize/business-improvement-proposal/`

## 8. 判定対象外

次は本報告で完了を主張しない。

- 利用者・評価者への研修完了
- 社内制度・方針の展開完了
- 最初の実評価依頼メールの受信完了
