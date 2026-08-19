# 595 社員マスタ → 674 PC台帳 同期 Runbook

> **正本アプリ**: 595（社員マスタ）→ 674 / 714 / 716  
> **BUILD（2026-06-30）**: `2026-06-30-595-bulk-log-no-dup` rev **106**  
> **GO**: R-0630-01（2026-06-30 浜田承認）

---

## 1. 同期の仕組み

| 経路 | トリガー | 備考 |
|------|----------|------|
| **保存時ミラー** | 595 レコード詳細の `submit.success` | `sync674MirrorFrom595` — mail / emp_id / サブテーブル `pc_674_record_id` で突合 |
| **一覧一括反映** | 一覧ヘッダ **「台帳へ一括反映」** | CSV 取込後など。退職者はスキップ |
| **手動 backfill** | `npm run pc-ledger:backfill-org-from-595:apply` | 一括矯正（要 dry-run 先） |

**CSV 取込・REST 一括更新**は保存時ミラーを通らない → **一括反映ボタン**を実行する。

---

## 2. 一括反映ログ（697 のみ — 社員行禁止）

| 項目 | 正本 |
|------|------|
| **保存先** | App **697** 設定マスタ「共通設定」フィールド `bulk_downstream_595_log` |
| **フォールバック** | ブラウザ `localStorage`（697 未設定時） |
| **禁止** | **595 社員マスタにシステム行・ダミー社員を作ってログを置く**（F2 再発防止） |

ログ表示（595 一覧 UI）:

- **進捗行**: 短い状態（例: `完了`）
- **詳細行**: `最終: データ更新 成功N件 失敗M件 YYYYMMDD更新（退職スキップK件）` **1 行のみ**

697 フィールド追加脚本: `npm run business-improvement:add-bulk-downstream-595-log-field`（初回のみ）

---

## 3. 不具合調査（先に監査 — S-0630-01）

**原因を口頭で述べる前に** 次を実行:

```bash
npm run pc-ledger:audit-595-674-gaps
```

- 所属・氏名のズレ一覧を出力
- 必要なら `npm run pc-ledger:backfill-org-from-595:apply -- --dry-run` → `--apply`

詳細: `docs/troubleshooting.md` §595→674 同期ギャップ

---

## 4. deploy（TSB-039）

Windows で `verify:kintone-live-schema` が **OK 表示後 UV crash** した場合:

1. 手動 verify で OK を目視
2. チャットに **TSB-039 + appId + skip 理由 1 行** + OK 出力貼付
3. `SKIP_CIO_LIVE_SCHEMA_GUARD=1 npm run deploy:595`

---

## 5. 関連コマンド

```bash
npm run deploy:595
npm run pc-ledger:audit-595-674-gaps
npm run pc-ledger:backfill-org-from-595:apply -- --dry-run
npm run cio:preflight:595
```

---

## 6. 関連ファイル

| 種別 | パス |
|------|------|
| customize | `customize/595/desktop.js` |
| 監査 | `scripts/audit-595-674-sync-gaps.mjs` |
| 697 フィールド | `scripts/business-improvement-add-bulk-downstream-595-log-field.mjs` |

---

## 7. 674 `emp_id` 空欄是正（2026-08-19 実施）

個人 PC の空 `emp_id` は 595（mail / サブテーブル / 氏名）で埋めた。再実行: `npm run pc-ledger:backfill-emp-id-from-595:dry-run` → `:apply`。保存時は 674 customize が 595 から補完。手順正本は `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§12.6**。
