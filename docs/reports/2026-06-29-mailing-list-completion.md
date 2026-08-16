# メーリングリスト台帳 kintone 化 — 完成報告

> **日付**: 2026-06-29 (日) JST  
> **案件**: メーリングリスト台帳（750/751）— **Space 21**（2026-07-02 移設）  
> **正本仕様**: `docs/plans/2026-06-29-mailing-list-kintone-spec.md`  
> **v1.x 追記あり**（下記 § addendum — **CLOSED 維持** / R61）

---

## § addendum — v1.x UX（2026-08-16）

| 項目 | 内容 |
|------|------|
| 範囲 | 751 dash のみ（IDs 1–6・8）。750 DB 非変更 |
| BUILD / rev | `2026-08-16-751-members-copy-comma` / rev **8** |
| fileKey | `aed42a5a-b7fb-453d-9f25-d5a1d6ad52a1` |
| 内容 | ツールバー枠・メタ件数チップ・sticky・コピー・状態ピル・印刷機密1行（印刷面のみ）。**メンバー表示=/・コピー=カンマ** |
| 状態 | **closed-v1 維持**。浜田目視 **OK** → **改善レーンクローズ**（2026-08-16）。再開しない |

---

## 1. 成果サマリー

| 項目 | 内容 |
|------|------|
| **メーリングリストDB** | App **750** — 11 フィールド・**63 件**移行済 |
| **メーリングリスト台帳** | App **751** — BUILD **`2026-06-29-mailing-list-dash-clear-btn-v2`** rev **5** |
| **配置** | **Space 21 / thread 23**（2026-07-02 移設。当初 Space 48 / thread 52） |
| **移行** | Excel **63 件**（`C:\tmp\メーリングリスト一覧\メーリングリスト一覧.xlsx`） |
| **浜田確認** | **目視 OK**（条件クリアボタン含む） |
| **Excel 廃止** | **本番ファイルサーバー削除済**（2026-06-29 浜田報告） |

### URL

- DB: https://jbis-kintone.cybozu.com/k/750/
- 台帳: https://jbis-kintone.cybozu.com/k/751/

---

## 2. v1 機能

| 機能 | 内容 |
|------|------|
| 一覧 | 部署・メールアドレス・利用用途・メンバー（先頭5+他N）・変更メモ |
| 検索 | キーワード AND・メンバー横断検索・部署絞込 |
| 状態 | 全数｜有効｜削除（初期は有効） |
| 編集 | カンマ区切り丸ごと差替・直近変更メモ自動生成 |
| 出力 | 一覧印刷・Excel（現行 Excel 同型） |
| クリア | **条件クリア**（696 型） |

---

## 3. 運用

- **入力**: システム推進室（人事依頼 → kintone 編集・保存 → BIZメール反映）
- **正本**: kintone **750/751 のみ**

---

## 4. 運用コマンド

```bash
npm run deploy:750
npm run deploy:751          # bundle 同梱
npm run mailing-list:migrate:xlsx -- --dry-run
npm run cio:preflight:750 / cio:preflight:751
```

---

## 5. 主要ファイル

| 種別 | パス |
|------|------|
| 仕様 | `docs/plans/2026-06-29-mailing-list-kintone-spec.md` |
| App ID | `scripts/data/mailing-list-app-ids.json` |
| 部署並び | `scripts/data/mailing-list-dept-master.json` |
| ライブラリ | `scripts/lib/mailing-list-kintone.mjs` |
| 台帳 UI | `customize/mailing-list-dash/desktop.src.js` |
| DB UI | `customize/mailing-list-db/desktop.js` |
