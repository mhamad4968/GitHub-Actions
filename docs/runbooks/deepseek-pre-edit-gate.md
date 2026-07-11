# DeepSeek 着手前ゲート（U4・CEO 承認 2026-05-17）

> **目的**: `customize/**`・`SPEC.md`・本番 kintone PUT の編集前に、**DeepSeek 1 問**を機械的に挟み、§50-3-8 の形骸化を防ぐ。  
> **正本ルール**: `.cursor/rules/deepseek-pre-edit-gate.mdc`  
> **報告**: `docs/session-report-checklist.md` §C・□A1

---

## 1. 適用範囲

| 対象 | 着手前 DeepSeek 1 問 |
|------|---------------------|
| `customize/**` の Write/StrReplace | **必須** |
| `docs/plans/*-spec.md`・`**/SPEC*.md` の意味変更 | **必須** |
| kintone 本番 PUT / `deploy:*` / レコード大量更新スクリプト | **必須** |
| README 誤字・コメントのみ・リネームのみ | **スキップ可**（理由 1 行） |
| 純メタ（handoff・checkpoint・本 Runbook の追記のみ） | **スキップ可**（`§50-3-8 スキップ理由:` 1 行） |
| ORIENT / Read のみ（編集なし） | **スキップ可** |
| doc-lane **lite**（`cio:turn-start --lane doc-lane --tier lite` 済） | **スキップ可**（turn-start が理由を出力） |
| **憲法 § 改定**・AGENTS 意味変更 | **必須**（L3 推奨） |

---

## 2. CIO が編集ツールの前にやること（チェックリスト）

1. [ ] 変更対象パスを 1 行で特定した
2. [ ] **DeepSeek**（`mcp_user-deepseek_chat`）に **1 問**投げた  
   - テンプレ: 「盲点・反例・仕様乖離の疑いを 3 点以内で。対象: `<paths>`」
3. [ ] チャットに **必須 1 行**を残した（どちらか一方）  
   - `[§50-3-8] 実施済: deepseek`  
   - `[§50-3-8] スキップ理由: <具体理由>`（「軽微」「minor」単体は不可）
4. [ ] **約 3 行突合メモ**（採用/却下/要 CEO 確認）を残した
5. [ ] その後に初めて Write/StrReplace / deploy / PUT

**OpenRouter**: DeepSeek 不通時のみ。チャットに `SECOND_REVIEWER: openrouter` と理由を残す。

---

## 3. スキップ理由の例（許容）

- `README 誤字 1 箇所のみ`
- `handoff-log 末尾追記のみ・SPEC 意味変更なし`
- `BUILD 定数 1 行のみ・ロジック無変更`

**不許容**: `軽微` / `minor` / `時間がない` / `前回やった`

---

## 4. 関連コマンド

```bash
# §50-3-8 機械ゲート（2026-05-21・方式B）
npm run cio:guard:5038 -- --staged
npm run cio:guard:5038 -- --stamp --text "盲点3点要約…"
npm run cio:guard:5038 -- --skip "README誤字のみ"

# 4AI統制一式
npm run verify:cio-four-ai-governance

# 月次 BUILD 監査（別レーン・CEO 2026-05-17 承認）
npm run cio:periodic:monthly

# 報告体裁（締め・GO 前）
npm run cio:report-verify-response -- --file <下書き>
```

---

## 5. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-17 | U4 初版（CEO 承認・CIO 実装） |
