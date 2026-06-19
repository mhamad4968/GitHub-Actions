# kintone アプリ削除・廃止チェックリスト（R49）

**制定**: 2026-06-17（浜田 GO — R49）  
**契機**: App **627** 削除後も **595 customize** が downstream REST を呼び続け保存エラー

---

## いつ使うか

- kintone アプリを **削除**または **運用廃止**（REST 先が消える）したとき
- 台帳 **DB/Dash ペア**の片方だけ残すとき（もう片方の参照を除去）

---

## チェックリスト（同一セッションまたは削除 PR 内で完了）

| # | 確認 | パス例 |
|---|------|--------|
| 1 | **customize** 内の `app:` / `APP_*` 定数 | `customize/**/desktop.js` |
| 2 | **downstream sync**（`submit.success` 等） | 595 / 674 型 |
| 3 | **`data/kintone-field-registry.json`** | `relatedAppFieldsFrom` / `inheritsRecordFieldsFrom` |
| 4 | **`data/kintone-customize-path-registry.json`** | deploy エイリアス |
| 5 | **`kintone-apps.md`** ポートフォリオ行・BUILD 表 | 削除または「廃止」注記 |
| 6 | **`scripts/data/*-app-ids.json`** | VPN / JR 等の ID 台帳 |
| 7 | **npm deploy スクリプト** | `package.json` の `deploy:NNN` |
| 8 | **live deploy 済み** | 参照元アプリを **preflight → deploy**（627 除去例: 595 rev 92+） |
| 9 | **SPEC / runbook** | 削除アプリへのリンク・§ 番号 |
| 10 | **`scripts/cio-portfolio-apps.mjs`** | `EXCLUDED` / 監査対象から **削除 appId を除外**（668 型 — R57） |
| 11 | **RAG mirror** | `npm run rag:mirror:canonical-docs` → **`verify:rag-mirror-canonical`** |
| 12 | **`data/kintone-accepted-gaps.json`** | deploy 未接続・退役の **許容ギャップ** を更新 |
| 13 | **`verify:cio-deploy-ledger-gate`** | 退役後も **参照元 app** の BUILD 三重が OK |

---

## 手順

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
# 削除 appId で全文検索（例: 627）
rg "\b627\b" customize data docs scripts kintone-apps.md package.json
```

検索ヒットを **0 件**（または意図した「廃止」注記のみ）にしてから削除を確定する。

---

## 関連

- [`kintone-ledger-v1-closure-checklist.md`](kintone-ledger-v1-closure-checklist.md)
- [`docs/approved-changes/2026-06-17-rules-r49-r54-hamada-go.md`](../approved-changes/2026-06-17-rules-r49-r54-hamada-go.md)
