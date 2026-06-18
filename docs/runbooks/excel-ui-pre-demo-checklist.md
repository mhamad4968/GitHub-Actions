# Excel 正本 UI — 担当説明前チェックリスト（R22）

**制定**: 2026-06-18（浜田 GO — 夕反省提案 B）  
**適用**: Excel 書式を正本とする kintone customize（**688 工事稼働** / **736 実行予算書** 等）

---

## 共通 3 点（説明前必須）

| # | 項目 | 736 の例 |
|---|------|----------|
| 1 | **仕様 §実装正本** が当日 BUILD と一致 | `docs/plans/2026-06-18-jikkou-yosan-spec.md` **§9** |
| 2 | **app 専用 gate** exit 0 | `npm run jikkou-yosan:pre-demo-gate` |
| 3 | **Ctrl+Shift+R 超リロード** 後の目視 | タブ切替・ジャンプ・編集可否・色 |

688 の場合は `npm run workdays:deploy-gate -- 688` + `docs/runbooks/workdays-deploy-checklist.md` §3 を代用。

---

## 736 実行予算書 — 一括ゲート

```bash
npm run jikkou-yosan:pre-demo-gate
```

内包: `jikkou-yosan:calc-gate` + `jikkou-yosan:verify-sample` + §9 存在確認。

---

## 目視チェック（機械 gate 未カバー）

- 一覧 → レコード open（master 読込後に UI 表示）
- ②〜⑦ **番号・金額** クリックで相互ジャンプ + スクロール位置
- **連携行は緑**・**計行は編集不可**
- 材料②③・外注④〜⑦ **行追加/削除**
- 工種CD ↔ 工種名・種別CD ↔ 種別 **双方向**（M735 datalist）

---

## 数字の正本

| キー | 2623001-001 期待値 |
|------|---------------------|
| ① 契約計 | 164,697,500 |
| ⑧ 原価計 | 83,633,440 |
| ⑨ 利益 | 81,064,060 |

`npm run jikkou-yosan:verify-sample` の出力と一致すること。

---

## 関連

- 仕様: `docs/plans/2026-06-18-jikkou-yosan-spec.md`
- deploy: `npm run deploy:736`（R23 二段 build 必須）
- 台帳: R21 `npm run verify:cio-deploy-ledger-gate`
