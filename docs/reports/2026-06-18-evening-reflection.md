# 夕反省 2026-06-18 — 実行予算書 v1 実装日

**レーン**: Space 56 — App **735/736**（実行予算書）  
**Git（本コミット後）**: 736 一式 + 仕様 §9  
**本番 BUILD**: `2026-06-18-jikkou-yosan-v10-bidir-codes` / rev **29**

## 今日できたこと

- Excel 書式.xls 正本から **総括表・詳細表** UI（688型一覧 + 2タブ）を kintone **736** に実装・複数回 deploy
- **計行・罫線・小計計算**（groupKey バグ修正含む）を Excel 2623001-001 で検算一致
- **②〜⑦ 相互ジャンプ**（番号・金額・スクロールオフセット）
- **連携行の緑色**、**小計ラベル**（材料費合計等）、**詳細表行追加**（材料②③・外注④〜⑦）
- **工種CD ↔ 名称・種別CD ↔ 種別** の M735 連動（双方向 datalist）
- 仕様正本 **`docs/plans/2026-06-18-jikkou-yosan-spec.md` §9** 追加

## 反省点

1. **台帳遅れ**: deploy 成功のたびに R15 WARN（`kintone-apps.md` / field-registry）— 今日も手動追記がセッション末に集中
2. **BUILD 連投**: v6〜v10 と細かく deploy — 担当説明前なら v10 1本にまとめられた可能性
3. **仕様と実装の差**: Phase 1 で「リスト未依頼」とあったが M735 は実装に組込済 — 説明時に **「コード表マスタは実装済・リスト拡張は v2」** と言い分けが必要
4. **openRecord と master 読込**: 一覧から開く経路で master 未読込だった問題を途中修正 — 回帰テスト項目に未登録
5. **未コミット混在**: 736 以外（721/pc-kitting/595 等）の working tree が並存 — 今日分は **736 スコープ commit のみ** に分離

## 憲法・ルール更新提案（承認待ち）

### 提案 A — kintone 新アプリ deploy 完了の定義（R15 強化）

**内容**: `deploy:<app>` SUCCESS の直後に **`kintone-apps.md` BUILD 行 + `data/cio-live-builds.json`** を同一セッションで更新しない場合、**セッション終了不可**（verify スクリプトで NG）。

**理由**: 今日のように UI だけ先行し台帳が rev10 のまま残る事故を防ぐ。

### 提案 B — Excel 正本アプリの「説明前チェックリスト」

**内容**: 依頼部署へ渡す前に `docs/plans/<spec>.md` §実装正本 + `npm run jikkou-yosan:verify-sample`（または app 専用 gate）+ **Ctrl+Shift+R 超リロード** の3点を `.cursor/rules` または runbook 1 ページ化。

**理由**: 担当説明は「見た目 + 数字 + 操作」— gate だけでは UI 操作系バグを拾い切れない。

### 提案 C — customize 二段構成の必須化（736 型）

**内容**: `desktop.ui.js`（編集正本）+ `build-desktop.mjs`（バンドル）パターンを **688/736 以降の Excel UI** の標準テンプレとして `docs/runbooks/` に明文化。`desktop.js` 直編集禁止。

**理由**: calc-core と UI の分離が効いたが、初回は bundled 直編集で混乱しやすい。

### 提案 D — コード表 M と画面名称のエイリアス台帳

**内容**: `（塗）材料費` ↔ `材料費` 等の **WORK_TYPE_TO_MASTER** を M735 側メタデータまたは seed JSON の `display_alias` 列で管理（JS ハードコード縮小）。

**理由**: 双方向コード連動で JS 内エイリアスが増えると M 更新時に二重管理になる。

---

**注**: 明日の作業項目は本ファイルには記載しない（浜田指示）。
