# 実行予算書 736 — 差分・版管理 スモーク（B-2）

> **いつ**: App **736** の customize deploy **前**（`npm run deploy:736` の直前）  
> **所要**: 約 10 分（手動）  
> **正本シナリオ**: 材料 1 行 +7,600（版2・直前版比較）

---

## 前提

- テスト用工事コードのレコードが存在すること（修正版作成可能）
- 本番 BUILD が `kintone-apps.md` 機械表と一致していること

---

## 手順

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 版1を **版確定** | ステータスが `版確定` のまま（下書きに戻らない） |
| 2 | **修正版を作成** → 版2を開く | 一覧から版2が開ける |
| 3 | 比較モード | **直前版と比較** が自動 ON（再計算ボタン不要） |
| 4 | 材料行 1 箇所だけ **+7,600** 変更 | — |
| 5 | 総括表 ② | `▲ +7,600`（水色・自動反映） |
| 6 | 材料費合計・⑧ | `▲ +7,600` |
| 7 | ⑨ | `▼ -7,600` |
| 8 | 差分サマリー | **削除 0 件**（53件等の誤表示なし） |
| 9 | 直接編集行 | 変更した材料行のみ黄（cascade 以外） |

---

## deploy 前チェック（機械）

```bash
npm run jikkou-yosan:deploy-gate
```

deploy-gate は **build → ux-gate → ui/js sync → calc-gate → rowkey-gate → lint** を実行し、本 runbook の存在を確認する。

**UX 先祖返り**（sticky・per-block 削除行・折りたたみ初期状態）: `docs/runbooks/jikkou-yosan-ux-regression-gate.md` の U1〜U5 を追加実施。

---

## 記録

deploy したセッションの handoff / SESSION-CLOSE に 1 行:

```
736 diff-smoke: OK（版2・材料+7600・削除0・②⑧⑨）
```

または NG 内容を具体的に記載。

---

## 関連

- 版管理仕様: `docs/plans/2026-06-20-jikkou-yosan-version-management-spec.md` §8.5
- 差分印刷（次フェーズ）: `docs/plans/2026-06-24-jikkou-yosan-diff-print-session-memo.md`
