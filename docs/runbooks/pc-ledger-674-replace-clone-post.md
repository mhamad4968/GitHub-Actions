# App 674 — PC買替／レコード clone POST（2026-08-11）

> 夕反省 R1 / T1 / OPS-1。上位: `docs/runbooks/cio-ops-2026-08-11-evening-improvements.md`  
> 純関数正本（Node）: `scripts/lib/kintone-record-clone-post.mjs`  
> ブラウザ実装: `customize/new-pc-ledger-v1/desktop.js`（`SKIP_CLONE_FIELD_*` / `toApiRecordValuesOnly674` / `build674ReplacementPostRecord674`）

## 採番（退役 596 禁止）

- **禁止**: 旧 PC採番マスタ **596**（削除済）への REST／claim／peek
- **正**: 674 台帳の JBIS / S-JBIS 最大＋1（`allocateNextPcNameForReplacement674`）

## DoD（複製系・OPS-1）

| # | 確認 |
|---|------|
| 1 | POST に `RECORD_NUMBER` / `RECORD_ID` / CREATOR 等を載せない |
| 2 | 必須 DROP_DOWN（例: `skysea_manual_done`）を空にしない（新規行は **未了**） |
| 3 | 空 DATE/NUMBER はキーごと省略 |
| 4 | 作成後遷移: 既定は **edit**（HW 必須時）。show にするなら浜田1行（ORG-1） |
| 5 | SKYSEA クライアント削除待ちは **導入完了時のみ**（`skysea_manual_done === 完了`） |
| 6 | 個人の POST 前に `emp_id` が空なら 595 から埋める（空クローン再発防止・2026-08-19） |

## 実装前（ORG-1 / MCP-1）

1. 浜田: 「作成後は edit / show？」
2. 障害時・必須不明時: `kintone-schema-mcp` / `kintone-get-form-fields` で必須・型を先確認
3. `cio:preflight:674` の note に仮説1行（CON-2）

## 棚卸（OPS-2 維持）

- 履歴サブテーブル＝正本
- `latest_inventory_date`＝履歴最大日の派生（内部メタグループ）
