# ルール更新 R13–R18 — 浜田 GO（2026-06-11 夜）

> **承認者**: 浜田  
> **承認文**: 「ルール更新案はすべて承認します」  
> **反映 commit**: （本ファイル同梱）

---

## 承認一覧

| ID | 概要 | 実装状態 |
|----|------|----------|
| **R13** | サブテーブル DD/CB REST 選択肢キーは **日本語**デフォルト | ✅ `scripts/lib/kintone-subtable-dropdown-keys.md` |
| **R14** | ポータル seed 短 code↔日本語マップ **1 箇所** | ✅ `scripts/lib/space48-portal-kintone.mjs` + seed 参照 |
| **R15** | deploy 後 `kintone-apps` 行未追加 **WARN** | ✅ `sync-kintone-apps-build.mjs` + `deploy-customization.js` |
| **R16** | サブテーブル列変更 **DELETE+全列 POST** チェックリスト | ✅ `space48-portal-add-fields.mjs` ヘッダ + R13 doc |
| **R17** | 締め **desktop:sync-and-verify** 必須 | ✅ `docs/runbooks/cio-four-ai-governance.md` §R17 |
| **R18** | 業務改善表彰ランク実装チェックリスト | ✅ `docs/knowledge/debug-tips.md` + spec §Q-UX-06（6/11 済） |

---

## 明日レーン（項番 -0 合意済）— **【SUPERSEDED-2026-06-13】**

> **6/13 追補**: 下記 Q-SCHED-03 は **v1 クローズで完了**。現行 nextTask は `checkpoint-latest.md` 先頭 + `data/cio-project-closures.json`。

| 優先 | 内容 |
|------|------|
| ~~**第1手**~~ | ~~業務改善 **年次集計** — **Q-SCHED-03**~~ **→ 6/13 完了（`docs/reports/2026-06-13-business-improvement-completion.md`）** |
| **並行可（未着手）** | Space 48 → 712 リンク（手動・数分） |
---

## 正本リンク

- 6/11 提案: `docs/reports/2026-06-11-evening-reflection.md`
- ポータル: `docs/plans/2026-06-11-space48-portal-spec.md`
- 業務改善年次: `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §4.8 / Q-ANN
