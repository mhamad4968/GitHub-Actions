# ✅ S13 v2: health-check 集計 + markdown 出力反映【2026-04-24 18:10 実装完了 / 前倒し】

**制定日**: 2026-04-24 (Fri) 朝 Phase Z 第 1 ループで判明  
**実施予定日 (当初)**: 2026-05-01 (Fri) 月次レビュー  
**実施日 (前倒し)**: 2026-04-24 (Fri) 18:00-18:10 (浜田 17:43 帰宅後の 1h17m 改善枠 / commit `19fad43`)  
**契機**: 4/24 朝 Phase Z で S13 v1 (commit `b9f3b01`) が **「半完成」状態** と判明 (起動はされるが集計と markdown 出力に未反映)  
**対象スクリプト**: `scripts/health-check.mjs`

---

## 🎯 真因 (4/24 07:00 第 1 ループで発覚)

S13 v1 で wiring (35 行 = check-node-modules + check-mcp-dormancy 起動) を line 271 直前に追加したが、以下が漏れていた:

1. `summary` オブジェクトに `nodeModulesCheck.status` / `mcpDormancyCheck.status` の集計が未加算
2. `result` オブジェクトに `node_modules` / `mcp_dormancy` フィールドが未追加
3. markdown 出力に該当セクションが存在せず

→ 4/24 朝の cron 実行では「機能は動いている (script 実行あり) が見えない (出力に反映なし)」という最悪の状態。検知精度ゼロ。

---

## 💡 v2 実装内容

### 1. summary 集計に 3 項目加算

```js
const nodeModulesOkCount = nodeModulesCheck.status === 'ok' ? 1 : 0;
const nodeModulesNgCount = nodeModulesCheck.status === 'ng' ? 1 : 0;
const nodeModulesSkipCount = nodeModulesCheck.status === 'skip' ? 1 : 0;
const mcpDormancyOkCount = mcpDormancyCheck.status === 'ok' ? 1 : 0;
const mcpDormancyNgCount = mcpDormancyCheck.status === 'ng' ? 1 : 0;
const mcpDormancySkipCount = mcpDormancyCheck.status === 'skip' ? 1 : 0;
const summary = {
  ok: ... + nodeModulesOkCount + mcpDormancyOkCount,
  ng: ... + nodeModulesNgCount + mcpDormancyNgCount,
  skip: ... + nodeModulesSkipCount + mcpDormancySkipCount,
};
```

### 2. result オブジェクトに追加

```js
const result = {
  ...,
  node_modules: nodeModulesCheck,
  mcp_dormancy: mcpDormancyCheck,
  summary,
};
```

### 3. markdown 出力に新セクション

```markdown
### 🛡 自己診断強化 (S9 + S12 wiring)

- **node_modules 完全性 (S9)**: ✅ node_modules 完全性 OK
- **MCP 死蔵検知 (S12)**: ✅ 13/16 active (3 exempt) (過去 7 日)
```

### 4. S12 v2 連動 (exempt count 表示)

```js
const exemptNote = j.exempt > 0 ? ` (${j.exempt} exempt)` : '';
mcpDormancyCheck = { status: 'ok', note: `${j.active}/${j.total} active${exemptNote} (過去 ${j.window_short_days} 日)` };
```

---

## 🔬 §11-5 段階検証結果

| 段階 | 結果 | 詳細 |
|---|---|---|
| ① 直接実行 (syntax) | ✅ | `node -c scripts/health-check.mjs` OK |
| ② 手動 script | ✅ | markdown に「自己診断強化」セクション + 「13/16 active (3 exempt)」表示確認 |
| ③ cron シミュレート | ✅ | `env -i + cron PATH` で総合 **正常 21 / 異常 0** (前回 19 → 21 = +2 件カウント増) |
| ④ 4/25 朝 cron 実証 | 🟡 | 翌朝の `docs/reports/2026-04-25-morning-prep.md` で確認予定 |

---

## 📊 効果測定

### 4/24 朝 (S13 v1 / 半完成)
- ヘルススコア: 10/10 (但し node_modules + MCP 死蔵は無反映)
- 健康診断: 正常 19 / 異常 0 / 警告 0 / スキップ 3

### 4/25 朝以降 (S13 v2 / 完成)
- ヘルススコア: 10/10 (継続)
- 健康診断: 正常 21 / 異常 0 / 警告 0 / スキップ 3 (+2 件透明化)
- markdown に「🛡 自己診断強化」セクション表示
- 浜田が朝のブリーフィングで node_modules 完全性 + MCP 死蔵状態を一目で把握可能

---

## ⚠ 関連ルール / 教訓

- §11-5 段階的検証 3 段階 (R2 / 2026-04-23 制定): 修復は ① 直接 / ② 手動 / ③ cron で全部通すこと
- §47-B-2 段階的批判の容認 (R7): S13 v1 で「動いた」と即判定せず、Phase Z 検証で「出力反映なし = 半完成」と気付けたのは R7 の効果
- 教訓: wiring (起動) と集計 (反映) は別作業。proposal 設計時にセットで担保が必要

---

**起票者**: AI / autonomous mode  
**起票時刻**: 2026-04-24 18:10 JST  
**整合性**: §47 (1 ループ目 ✅ でも「半完成」と批判できる眼力 / 3 ループ目で取りこぼさず実装まで完了)  
