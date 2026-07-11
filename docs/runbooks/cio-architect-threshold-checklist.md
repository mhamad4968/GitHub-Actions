# Architect 起動閾値チェックリスト（v3.2 F）

> **地位**: `docs/plans/2026-07-11-ai-team-ops-optimization-spec-v32.md` 案 F。憲法改定なし。  
> **ルーティング**: `npm run cio:tool:route -- --intent "architect-review"`

---

## 起動条件（いずれか）

| # | 条件 | 例 |
|---|------|-----|
| 1 | **3 レーン以上**が同時に関与 | kintone + doc-lane + governance |
| 2 | **spec 200 行超**の設計判断 | 新 plan / 大規模 refactor 仕様 |
| 3 | **月 2 回ソフト上限**超の再起動 | runbook で理由を 1 行記録 |

## 起動しない（N/A）

- 単一レーン・200 行未満の体制改善（本 v3.2 パッケージ）
- deploy / kintone 実装のみ（Composer 主導）

## 手順

1. `npm run cio:tool:route -- --intent "architect-review" --log`
2. 上表で起動要否を判定 — **不要なら Architect を呼ばない**
3. 起動時: 設計論点を 3 点以内に整理 → CIO が検収
4. 証跡: チャットのみ不可 — plan / runbook / npm 出力

## 関連

- `docs/plans/2026-07-04-ai-team-six-roles-spec.md`
- `docs/runbooks/ai-team-tool-routing-v2.md`
