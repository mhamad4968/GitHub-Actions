# 夕反省 — 2026-06-26

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田判断待ち**（下表 ID）

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | 「東京支店」検索で施工部等がヒットしない | 一覧 haystack に `org` 未含有（v12 で初修正） |
| F2 | 所属+部署の組み合わせ検索不足 | 結合文字列・AND トークン未実装（v13 で修正） |
| F3 | `verify:cio-deploy-ledger-gate` がセッション締めをブロック | kintone-apps 詳細行 BUILD パーサが col3 `\|` と col1 括弧外文言に非対応 |
| F4 | deploy 後 `kintone-apps` 詳細行が機械表と乖離 | sync がパーサ NG のため詳細行未更新（WARN のみで deploy 継続） |
| F5 | R63 未達 — 745 deploy v6–v13 が commit 前に積み上が | 目視調整フェーズで deploy 優先・締め commit 遅延 |

---

## 2. 改善案（ミス削減）— **承認待ち**

| ID | 内容 | 種別 | 状態 |
|----|------|------|------|
| **R-JRE-01** | 745 一覧検索仕様を spec §7 に明文化（org/dept 単独・AND・結合表現・電話/メール） | spec | **承認待ち** |
| **R-KAP-01** | `cio-kintone-apps-portfolio-build.mjs` にユニットテスト追加（`\|` col3・括弧外 col1） | script/test | **承認待ち**（本日パーサ修正済・テスト未） |
| **R-KAP-02** | `deploy-customization.js` 成功後、`sync:kintone-apps-build --strict` 失敗なら exit 1 | deploy gate | **承認待ち** |
| **R-SESS-06** | 新規 dash アプリ初回目視チェックリストに「拠点名のみ検索」「支店+部署 AND」を追加 | checklist | **承認待ち** |
| **R-SESS-07** | deploy SUCCESS 後 **同一セッション commit** を UX 調整ループでも必須（R63 再確認） | mdc | **承認待ち** |

---

## 3. 本日実施した是正（コード）

- 745 検索: `buildRecordSearchHaystack` + AND トークン（v13）
- BUILD パーサ: 行ベース `**appId**` … `**BUILD=` マッチに変更
- `kintone-apps.md` 744/745 詳細行 BUILD rev 同期
