# 新・PC台帳 — 仕様確認を 1 個ずつ（2026-04-27）

> **明日も続き**のときは、**上から順に**未チェックの 1 件だけやってチェックを入れる。同一ターンで全部やろうとしない。  
> 正本: `docs/plans/2026-04-21-new-pc-ledger-spec.md`／手順: `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b**。

---

## A. リポ・機械（2026-04-27 時点で AI が順に確認済み）

- [x] **1** 正本に `#### 4.2.0 浜田認識の整理` がある（§4.2.0 節の存在）
- [x] **2** `SESSION-BOOTSTRAP-CHECKLIST.md` に **1b-A / 1b-B / 1b-C** とチャットテンプレがある
- [x] **3** `NEW-SESSION-STARTER.md` に **v3.16**（オーダー完遂・曖昧確認禁止）がある
- [x] **4** `2026-04-26-pc-ledger-day4-action.md` §4 前提に **1b-A→B→C** が書かれている
- [x] **5** `npm run field-spec:generate -- --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md` → stderr **`[field-spec-diff] generated 35 fields`**
- [x] **6** `npm run pc-ledger:verify-labels-spec` → **OK**
- [x] **7** `scripts/data/pc-ledger-v1-ui-display-labels.json` の `fields` キー数 **35**
- [x] **8** `.cursor/rules/session-handoff.mdc` に **フェーズ 1b（1b-A〜C＋テンプレ）** 記載
- [x] **9** `checkpoint-latest.md` 最終更新に **1b オーダー完走** の旨
- [x] **10** `RULES-INDEX.md` に **§4.2.0〜** と **フェーズ 1b** の行

---

## B. 人間＋AI（未チェックなら明日以降で 1 件ずつ）

- [ ] **11（1b-A）** 正本 **§4.2.0〜§4.4** を開き、**コア * と SKYSEA 4 件が別枠**と自分の言葉で言える（チャット 1 行で可）
- [ ] **12（1b-A）** §4.2.0 の表と、浜田が把握している **PC 名〜VPN** の行が一致するか **1 行ずつ**目視（違えば正本か認識を合わせる）
- [ ] **13（1b-C）** テンプレ `【1b 仕様確認オーダー完了】` をチャットに貼る（**5** の 1 行と **6** の結果を転記）
- [ ] **14** 浜田 **Tier B GO** 後のみ: `kintone-add-app` 等（Day4 §4）

---

## 明日の再開メモ

- 次は **B の先頭から**、未チェックの **最初の 1 個だけ**着手する。  
- 機械項目 **A は完了済み**（再確認したければ **5** だけ再実行でよい）。
