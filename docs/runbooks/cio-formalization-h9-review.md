# H9 formalization review — turn-start strict 監査（2026-07-25）

> **registry**: `H9` · **reviewDate**: 2026-07-25  
> **機械正本**: `data/cio-formalization-h9-review.json`  
> **evening 論点**: `#S-OPS-STRICT-AUDIT`

## 目的

§50-3-8 / turn-start の **形骸化降格判定**（evening 論点 4）。lifecycle-v2 **L4**: 期限後 **GREEN→registry 削除 / RED→gate 昇格**。

## タイムライン

| 日付 | 内容 |
|------|------|
| 2026-07-11 | R3-10 配線完走（本 runbook · verify · metrics 日次 jsonl） |
| 2026-07-18 | metrics 7 日窓の蓄積開始（`strictAuditEligibleAfter`） |
| 2026-07-25 | **CEO 判定日** — `npm run cio:formalization-h9-review -- --evaluate` |

## metrics 蓄積

- **コマンド**: `npm run cio:team-ops-metrics`（close 連鎖または手動）
- **履歴**: `logs/cio-team-ops/metrics-daily.jsonl`（1 行 = 1 スナップショット）
- **閾値**: `data/cio-team-ops-kpi-thresholds.json` の `red.*`

## 判定基準（7 日窓）

| 判定 | 条件 | アクション（CEO G3 GO 後） |
|------|------|---------------------------|
| **GREEN** | RED metric 日数 = 0 · skip/Lite 閾値内 | registry から **H9 削除** · lifecycle-v2 §2 retired 追記 |
| **RED** | RED metric 日数 ≥ 2 | **gate 昇格**（例: `CIO_TURN_TIER_STRICT` 既定化）· evening 週次継続 |
| **UNDECIDED** | データ不足・境界 | CEO 手動 · `--record-decision defer` |

## CEO 手順（2026-07-25）

```powershell
npm run cio:team-ops-metrics
npm run cio:formalization-h9-review -- --evaluate
# 合意後:
npm run cio:formalization-h9-review -- --record-decision green
# または
npm run cio:formalization-h9-review -- --record-decision red
```

**registry 変更・commit** は **G3 GO** のみ（evaluate は候補提示まで）。

## 検証

```powershell
npm run verify:formalization-h9-review
npm run verify:constitution-evening
```
