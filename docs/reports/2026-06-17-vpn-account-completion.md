# VPN アカウント管理 — 完成サマリー（2026-06-17 確定）

**判定**: Space 48 本番で **一覧・新規・編集・削除・利用者印刷・ライセンス集計** まで浜田目視 OK。**v1 完成 — クローズ**。

**v1.1 / v1.2 追記（2026-06-20）**: 本書は v1 クローズ時点の記録。**§16–§18** 実装完了 — 詳細は SPEC §16–§18 を正本とする（**CLOSED 状態は維持**、拡張のみ）。

**v1.3 追記（2026-06-21）**: **§19–§21** 実装完了 — リスト出力（xlsx+印刷）・VPN接続情報アコーディオン（PW編集・更新日表示）。浜田目視 OK。**CLOSED 維持**。

**仕様正本**: `docs/plans/2026-06-16-vpn-account-kintone-spec.md`

---

## 1. アプリ構成（733 / 734）

| ID | 名称 | 役割 | BUILD / rev（最終） |
|----|------|------|---------------------|
| 733 | VPNアカウント管理台帳用DB | 正本（1 アカウント = 1 レコード + 設定 3 件） | `2026-06-20-vpn-db-rename-message` **rev 11** |
| 734 | VPNアカウント台帳 | 日常 UI（733 へ REST） | `2026-06-21-vpn-conn-pw-updated-date` **rev 28** |

**URL**: [733](https://jbis-kintone.cybozu.com/k/733/) / [734](https://jbis-kintone.cybozu.com/k/734/) — Space 48 / thread 52

---

## 2. データ・移行

| 項目 | 内容 |
|------|------|
| アカウント | **66 件**（user 番号型 63 + 手動 ID 3） |
| 設定レコード | **1 件**（`next_user_num = 80`） |
| 移行 | `npm run vpn-account:migrate:xlsx -- --apply` |
| 次の VPN ID | **`user080@kensetsutoso.fre`** |
| Excel | §9.4 — 浜田 PC で **削除可**（kintone が正本） |

---

## 3. 機能（v1）

| 機能 | 内容 |
|------|------|
| 一覧 | 694 型・登録日降順・15px 基準の大きめ文字 |
| 検索 | アカウント名 / VPN ID / 所属 / 備考 — **クリア**ボタン付き |
| 新規 | 自動採番 `user080〜`・手動 ID チェックボックス・`jbis`+5桁 PW |
| 編集 | VPN ID 読取専用・PW 手動変更可 |
| 削除 | 確認ダイアログ・ID 再利用不可 |
| 印刷 | A4 利用者渡し用・注意書き付き |
| 集計 | 550 円/口・**アコーディオン**（初期閉）・所属 **34 件すべて表示（0 口含む）** |

---

## 4. リポジトリ

| 種別 | パス |
|------|------|
| SPEC | `docs/plans/2026-06-16-vpn-account-kintone-spec.md` |
| DB customize | `customize/vpn-account-db/desktop.js` |
| Dash ソース | `customize/vpn-account-dash/desktop.src.js` → bundle |
| 移行 | `scripts/vpn-account-migrate-xlsx.mjs` |
| 所属マスタ | `scripts/data/vpn-account-depts.json` |
| App IDs | `scripts/data/vpn-account-app-ids.json` |

---

## 5. 再開条件

- 浜田 **GO** + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除
- v2 候補（スコープ外）: 廃止履歴保持 等

---

## 6. v1.1 / v1.2 拡張サマリー（2026-06-20）

| 項目 | 内容 |
|------|------|
| **v1.1** | 3 VPN ドメイン統合 — **105 件**（fre/ds/bnp）・`vpn_domain`・734 マルチドメイン UI |
| **v1.2** | PC台帳 **674** 連携 — VPN 新規/変更/削除 → 674 自動反映・595 検索既定 |
| **リネーム** | 734=**VPNアカウント台帳** / 733=**VPNアカウント管理台帳用DB** |
| **674 BUILD** | `2026-06-20-674-vpn-readonly-dom-lock` rev **245** |
| **Git** | `7f422ff` feat(vpn) push 済 |

---

## 7. v1.3 拡張サマリー（2026-06-21）

| 項目 | 内容 |
|------|------|
| **リスト出力** | 所属 multi-select + 一括（全選択/全解除/本社/支店・営業所）・ドメイン すべて/個別。Excel `.xlsx` + A4 印刷 |
| **VPN接続情報** | ライセンス集計の上・アコーディオン（初期閉）。見出し **VPNアカウント管理画面URL**（文字大きめ） |
| **接続 PW** | 3 ドメインの管理者 PW を 734 UI から編集 → **733 設定レコード**に保存。PW 横に **`(yyyy/mm/dd更新)`** |
| **bundle** | SheetJS 同梱 — `scripts/vpn-account-bundle-dash.mjs` |
| **734 BUILD** | `2026-06-21-vpn-conn-pw-updated-date` rev **28** / fileKey `8d2a21e0-d570-43c9-b908-1c2bab1d8c1b` |
| **判定** | 浜田目視 OK — **v1.3 完成**（CLOSED 維持） |

---

## 8. UX 改善 addendum（2026-08-16）

| 項目 | 内容 |
|------|------|
| **状態** | **closed-v1 維持**。UX 改善 IDs 1–6・8 を本番反映、浜田目視待ち |
| **画面** | ツールバー3区分、sticky安定化、全件/表示件数、コピー明示＋アカウント名、ドメインピル、36px操作 |
| **印刷** | 管理者一覧だけに機密注意1行。利用者単票の既存【ご注意】は変更なし |
| **非変更** | DB 733、フィールド、CRUD、採番、ライセンス集計計算、Excel |
| **Live** | BUILD=`2026-08-16-dashboard-ux-polish` / rev **32** / fileKey `47bbc59a-9dbd-4e02-8a04-4e46c4e2deeb` |

---

## 9. ライセンス集計 UX addendum（2026-08-16）

| 項目 | 内容 |
|------|------|
| 状態 | **closed-v1 維持**。ライセンス UX 1–4・案5 浜田目視 **OK** → **改善レーンクローズ**（2026-08-16）。再開しない |
| **1** | 比較基準＝当月未満の最新確定。列「確定比」 |
| **2** | 所属空欄・マスター外・未登録ドメインのソフト警告 |
| **3** | 対象月ステータス（未確定/確定済・保存時刻・比較対象） |
| **4** | 所属表示切替。**既定は全表示**。合計は常に全件 |
| **非変更** | DB 733、`snapshot_json` 形、550円、確定上書き |
| **Live** | BUILD=`2026-08-16-license-compare-ux` / rev **33** / fileKey `80a07af4-3f35-4dbd-b513-802e03e1d5fe` |

---

## 10. ライセンス口数クリック一覧（案5・2026-08-16）

| 項目 | 内容 |
|------|------|
| **状態** | **closed-v1 維持**。案5 浜田目視 **OK** → 改善レーンクローズ |
| **操作** | ドメイン口数・所属「現在」・合計口数 → 対象者モーダル |
| **列** | アカウント名 / 所属 / ドメイン / VPN ID / パスワード |
| **Live** | BUILD=`2026-08-16-license-count-list` / rev **34** / fileKey `56d0215d-8a47-4a89-a767-49ce522a77b9` |
