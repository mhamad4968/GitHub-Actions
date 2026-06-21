# 第23読本 — プロジェクト完了・認識同期（浜田↔AI 事故防止）AI-KERNEL

**正本（非置換）**: `AGENTS.md` §41-4 / §35-6 / §56-1a  
**Runbook**: `docs/runbooks/cio-project-closure-governance.md`  
**TSB**: `docs/troubleshooting.md` TSB-038

---

## 前提条件

- **開発=AI / 確認=浜田**（§35-1 / §56-1a）。**認識の最終確認も浜田**だが、AI は **古い checkpoint を正として浜田に逆提案しない**
- プロジェクト **v1 完了** は `data/cio-project-closures.json` + 完成サマリー + kintone-apps 状態行の **3 系統一致**
- `**次の1手**` の機械読取は `scripts/lib/cio-checkpoint-read.mjs`（`次の1手` / `次回 1 手` 両対応）

## 実行手順

### 完了時（同一セッション）

1. 完成サマリー + SESSION-CLOSE-REPORT
2. `cio-project-closures.json` 登録
3. checkpoint 先頭 + handoff 末尾更新
3b. partial/full CLOSE: `docs/runbooks/checkpoint-handoff-template-v2.md` — **`cio:handoff:append-block`** 必須
4. 台帳 v1: [`kintone-ledger-v1-closure-checklist.md`](../runbooks/kintone-ledger-v1-closure-checklist.md)（R41）完走
5. `verify:checkpoint-project-closure` → export-handoff → `cio:session:close-git`（R44 checkpoint Git 同期内包）
6. commit / push

### 新セッション・ブリーフィング前

1. `npm run cio:briefing:recognition-gate` または `verify:checkpoint-project-closure`
2. closures / kintone-apps / checkpoint **3 系統突合**をチャットに記載
3. 浜田認識と矛盾 → **§41 一問** → checkpoint 修正 **後**に次手を述べる

## 禁止事項

- クローズ済みプロジェクトを checkpoint の古い「次手」だけで **再開レーン**として報告
- 締めターンで checkpoint / handoff 未更新のまま SESSION-CLOSE のみ
- `cio:morning:pre-implement --project <closed>` で compare-83 / 案B1 を再実行
- **クローズ済みレーン**への `--project` / `--intent` 着手（R47 — `cio:pre-implement-gate` が exit 3）
- 浜田「完了」と kintone-apps / closures が一致しているのに **AI だけが未完了扱い**を続ける

## 判定コード

| コマンド | 合格 |
|----------|------|
| `verify:checkpoint-project-closure` | exit 0 |
| `cio:session:close-recognition-gate` | 締め時 exit 0 |
| `cio:briefing:recognition-gate` | ブリーフィング前 exit 0 |
| `verify:cio-project-closure-governance` | インフラ整合 exit 0 |
