# closed-v1 台帳の v1.x 拡張 — completion addendum 必須（R61）

**制定**: 2026-06-20（浜田 GO — R61）  
**契機**: VPN 733/734 v1 クローズ後の v1.1/v1.2 実装で完成報告書更新漏れ

---

## 適用条件

| 条件 | 例 |
|------|-----|
| `data/cio-project-closures.json` で **closed-v1** | VPN・Wi-Fi・JR iPad |
| v1 完成報告書が既に存在 | `docs/reports/*-completion.md` |
| **v1.x 機能追加**（CLOSED 解除しない） | 3ドメイン統合・674 連携・アプリ rename |

**CLOSED 状態は維持** — 新規 v2 SPEC / 再クローズは別 GO。

---

## 必須更新（同一セッション or 夕締め）

| # | 正本 | 内容 |
|---|------|------|
| 1 | **完成報告書** | 先頭に「v1.x 追記」注記 + **§ addendum**（BUILD/rev・件数・Git commit） |
| 2 | **SPEC** | 新 § または既存 § チェックリストを **✅ 完了** に |
| 3 | **SPEC §13 サマリ** | BUILD/rev・件数・状態行 |
| 4 | **kintone-apps.md** | 機械表 + 詳細行 BUILD/rev |
| 5 | **.rag ミラー** | `npm run verify:rag-mirror-canonical` 通過 |

---

## 参照例

- VPN v1.2: `docs/reports/2026-06-17-vpn-account-completion.md` **§6**
- SPEC: `docs/plans/2026-06-16-vpn-account-kintone-spec.md` §16–§18

---

## 機械検査

- 夕締め: `20-SESSION-REPORT-CHECKLIST.txt` **□ R61**
- 手動: completion report に `v1.x` / `addendum` / `追記` のいずれかがあるか

---

## commit 分割（R62）

500 行超の `customize/**` diff は **機能単位**で commit を分割する（例: bundle 追加 / deploy 別 / SPEC 別）。review と CI 失敗時の bisect を容易にする。

---

## 関連

- [`kintone-ledger-v1-closure-checklist.md`](kintone-ledger-v1-closure-checklist.md)（初回 CLOSED）
- [`evening-reflection-scope.md`](evening-reflection-scope.md)
