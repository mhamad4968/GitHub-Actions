# LOTO7 AI ANALYZER — 2026-07-25 B+C 改善 SPEC（控）

**状態**: CONFIRMED（浜田 GO 2026-07-25・方針 B+C）  
**コード正本**: `external/loto7/`（Git管理）  
**実行ミラー**: `C:\Users\mhamada202408224\Desktop\Loto7`  
**運用メモ**: `external/loto7/README-DEV.txt`  
**DB**: `loto7_advanced.db`（2026-07-25 取込時点・第687回）

> **P6（浜田承認 2026-07-25）**: Git正本から `npm run loto7:sync-to-desktop` で実行ミラーへ同期し、`npm run loto7:verify-sync` で一致を確認する。DB・学習モデル・pid・cache は運用データとしてGit管理しない。

---

## 1. 目的と非目的

| 区分 | 内容 |
|------|------|
| **目的（KPI）** | 平均一致数（本数字）をランダム期待 ≈1.324 より上げる／**P(k≥4)** を主指標にする |
| **非目的** | 1等・2等の確率向上を約束しない（2等＝本数字6＋ボーナスは1等並みに希少。DBにボーナス列なし） |
| **免責** | 画面フッターどおり「統計は過去の傾向であり当選を保証するものではない」 |

---

## 2. 実施範囲（B+C）

### B — 診断＋アンサンブル再設計

1. **walk-forward 診断**: `python backtest_report.py`  
   - look-ahead 禁止（当該回より前の抽選のみで生成）  
   - KPI: avg hits / P(k≥3) / P(k≥4) / P(k≥5)  
2. **アンサンブル投票の事前係数**（`loto7_predict.strategy_vote_priors` ほか）  
   - 共起ペア・ポジション・バランスを抑制  
   - 旧 `LOTO7_ENSEMBLE_BALANCE_BOOST` 強化（既定>1）は撤回 → **既定 0.52**  
   - コールドは保存履歴では強いが直近 WF では過剰になり得る → **控えめ強化**＋ホット／トレンド併用  

### C — 新戦略

- 戦略名: **`対極（ホット×コールド）`**（定数 `POLAR_STRATEGY_NAME`）  
- 内容: 低頻度帯から **2〜3個**、残りを高頻度帯から採る  
- UI: 個別戦略の7個は表に出さない設計のまま。投票には参加。  
  「戦略ウェイト（折りたたみ）」と「候補を保存（**8** 戦略・非表示）」で存在を示す。

---

## 3. 観測メモ（実験ノート・達成宣言ではない）

| 見方 | メモ |
|------|------|
| 保存済み predictions 突合 | コールド平均一致が相対的に高い／ペア・ポジションが足を引っ張る傾向 |
| walk-forward | 窓・乱数で順位が揺れる（過学習注意）。SPEC 上は「改善完了＝当選増」と書かない |
| ランダム期待 | E[hits] = 7×(7/37) ≈ **1.324** |

---

## 4. 検証コマンド

```text
cd Desktop\Loto7
python fetch_results.py
python verify_loto7.py
python backtest_report.py --last 60 --seed 42
```

アプリ反映: `start_app.bat` で再起動（稼働中は一度停止）。

---

## 5. 変更ファイル（Desktop 正本）

- `loto7_constants.py` — `POLAR_STRATEGY_NAME` / `RANDOM_EXPECTED_HITS`
- `loto7_predict.py` — priors / damp / `strategy_polar` / STRATEGIES
- `backtest_report.py` — 新規
- `verify_loto7.py` — polar スモーク
- `index.html` — 8戦略表記・ホット/コールド注記
- `README-DEV.txt` — §6 B+C

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-25 | B+C GO 実装。KPI=平均一致／P(k≥4)。lab に本 SPEC 控を追加。 |
