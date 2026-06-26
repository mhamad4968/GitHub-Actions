# 夕反省 — 2026-06-26

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田 GO 2026-06-26**（改善案すべて承認 → `docs/approved-changes/2026-06-26-rules-jre-kap-sess-hamada-go.md`）

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

## 2. 改善案（ミス削減）— **GO 2026-06-26**

| ID | 内容 | 種別 | 状態 |
|----|------|------|------|
| **R-JRE-01** | 745 一覧検索仕様を spec §7.6 に明文化 | spec | **反映済** |
| **R-KAP-01** | BUILD パーサユニットテスト | script/test | **反映済** |
| **R-KAP-02** | deploy 後 `sync --strict` 失敗で exit 1 | deploy gate | **反映済** |
| **R-SESS-06** | dash 初回目視チェックリスト（拠点検索・AND） | runbook | **反映済** |
| **R-SESS-07** | UX 調整ループでも deploy 後同一セッション commit | mdc | **反映済** |

---

## 3. 本日実施した是正（コード）

- 745 検索: `buildRecordSearchHaystack` + AND トークン（v13）
- BUILD パーサ: 行ベース `**appId**` … `**BUILD=` マッチに変更
- `kintone-apps.md` 744/745 詳細行 BUILD rev 同期

## 4. 承認後反映（2026-06-26 追記）

- spec §7.6 / Q11、runbook `kintone-dash-first-visual-checklist.md`
- `deploy-customization.js` strict sync、BUILD パーサ test、mdc R-KAP-02 / R-SESS-07
