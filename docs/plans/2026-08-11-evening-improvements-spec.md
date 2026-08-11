# 2026-08-11 夕反省改善パッケージ仕様（浜田全対応）

**Status**: GO（浜田 2026-08-11「すべてたいおうしてOK」「安全に確実に対応」）  
**種別**: 体制／運用／ルール／憲法（ポインタのみ）／MCP（定型のみ）／ミス削減  
**制約**: 新 MCP サーバー作成なし。**AGENTS.md 大改訂なし（CON-1 見送り）**。08-10 ops は上書きしない（日付別新設）。本パッケージで customize 再 deploy は不要（674 修正は既 tip）。

---

## 0. 本日の反省（背景）

1. 退役アプリ 596 への買替採番参照
2. クローン POST のシステム項目混入（RECORD_NUMBER 等）
3. 必須 DROP_DOWN 空クリア
4. 作成後遷移が show で HW 必須未充足
5. SKYSEA 未導入への削除待ち誤表示
6. 棚卸の最新／履歴二重真実
7. IME 中 datalist 更新
8. 多段 deploy（仮説未固定）
9. main ahead 未 push

---

## 1. 承認マトリクス

| ID | 扱い |
|----|------|
| T1〜T5 | **実施** |
| R1〜R4 | **実施** |
| ORG-1 / ORG-2 | **実施** |
| OPS-1〜OPS-3 | **実施** |
| MCP-1 | **実施** |
| MCP-2 | **見送り** |
| RULE-1 / RULE-2 | **実施** |
| CON-1 | **見送り** |
| CON-2 / CON-3 | **実施** |

---

## 2. DoD

- [x] runbook・mdc・GO・本仕様・夕反省が tip に載る
- [x] 674 買替 clone runbook + IME datalist runbook
- [x] `kintone-record-clone-post` lib + unit test + desktop 針一致（DeepSeek 盲点1）
- [x] `verify:retired-app-refs` を pre-push と constitution-gates に各1回（盲点2: 重複は許容・順序独立）
- [x] brief-card／deepseek／checklist／kintone-apps／mcp triggers にポインタ
- [x] 夕反省ステータスが **反映済**
- [x] `node scripts/test-evening-improvements-2026-08-11.mjs` OK
- [x] `npm run verify:evening-reflection-scope` OK（該当時）
- [x] 針の保守: リファクタ時は **同ターン**で needle と lib 定数を更新（盲点3）

---

## 3. 正本パス

- `docs/runbooks/cio-ops-2026-08-11-evening-improvements.md`
- `docs/runbooks/pc-ledger-674-replace-clone-post.md`
- `docs/runbooks/kintone-input-ime-datalist.md`
- `.cursor/rules/cio-ops-2026-08-11-evening-improvements.mdc`
- `docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md`
- 上位（衝突回避）: `docs/runbooks/cio-ops-2026-08-10-evening-improvements.md`（維持）
