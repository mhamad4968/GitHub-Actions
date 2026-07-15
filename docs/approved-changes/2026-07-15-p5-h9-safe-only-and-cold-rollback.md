# 2026-07-15 — P5/H9 再判定 + Cold 誤適用の即時復旧

> 浜田「P5 Cold / H9 も可能なら実施可。安全性十分注意」

## 合議（再判定）

| 項目 | DeepSeek | OpenRouter | CIO |
|------|----------|------------|-----|
| P5 dry-run のみ | GO | dry-run推奨 | **GO** |
| P5 本番 apply | NO | 慎重 | **NO**（736前） |
| H9 metrics/status | GO | metricsのみ | **GO** |
| H9 evaluate/green | NO | NO | **NO**（7/25まで） |

## 事故と復旧（重要）

調査中に誤って `cio:mcp:profile -- --dry-run --apply governance` を実行。  
**旧仕様では両旗同時だと apply が勝つ** → Cold 7 本が一時 disabled。

| 時刻 | 処置 |
|------|------|
| 即時 | `mcp.json.bak.2026-07-15T06-57-36-747Z` から復元 |
| 確認 | disabled=[] · context7/kintone-dev 有効 · `cio:mcp:gate` **OK 6/6** |
| 恒久 | `cio-mcp-profile.mjs` で **dry-run+apply 同時 → exit 2（書込拒否）** |

## 本日の正当実施

1. H9: `cio:formalization-h9-review --status`（scheduled · 10d）+ `cio:team-ops-metrics`
2. P5: **dry-run only**（本番 apply なし）
3. 上記スクリプト安全弁

**浜田**: もし Reload 後に Cold っぽい挙動が残っていたら、もう一度 Reload（復元済み mcp.json を読み直す）。
