# checkpoint アーカイブ（2026-06-10）

> rollup from checkpoint-latest.md — Space 48 チェック系 3 本 + 699 評価編 checkpoint 補正

## 2026-06-10 JST — **Space 48 チェック系（706–711）**

| # | 案件 | appId | 状態 | 正本 SPEC |
|---|------|-------|------|-----------|
| 1 | 不適合管理台帳 | 706/707 | **目視 OK** | `docs/plans/2026-06-10-nonconformance-ledger-spec.md` |
| 2 | 外部 IT サービス導入チェック | 708/709 | **目視 OK**（印刷 A4 1枚） | `docs/plans/2026-06-10-external-it-checksheet-spec.md` |
| 3 | 新規システム導入ヒアリング記録 | 710/711 | **目視 OK**（印刷 A4 2枚） | `docs/plans/2026-06-10-new-system-intro-hearing-spec.md` |

**共通パターン**: DB 正本（UI ブロック）+ ダッシュ（一覧・モーダル CRUD・REST・印刷） / Space **48** / thread **52**

**BUILD（本番）**:
- 706=`2026-06-10-nonconformance-db-block-ui` rev **5** / 707=`2026-06-10-nonconformance-dash-v1` rev **4**
- 708=`2026-06-10-external-it-checksheet-db-block-ui` rev **5** / 709=`2026-06-10-external-it-checksheet-dash-print-a4-v2` rev **5**
- 710=`2026-06-10-new-system-intro-db-block-ui` rev **5** / 711=`2026-06-10-new-system-intro-dash-print-a4-v2` rev **4**

**入口**: [707](https://jbis-kintone.cybozu.com/k/707/) / [709](https://jbis-kintone.cybozu.com/k/709/) / [711](https://jbis-kintone.cybozu.com/k/711/)

**次**: **6/11** 年次 Q-SCHED-03 → **6/12–13** 新⑤ + Q-MANUAL-01

---

## 2026-06-10 JST — **699 評価編 checkpoint 補正**

699 評価編は 6/9 完了（rev87）だが checkpoint 更新漏れを本日補正。`data/cio-live-builds.json` を正とする。

**最終更新**: 2026-06-10 JST — 浜田 711 目視 OK 確認・commit 前
