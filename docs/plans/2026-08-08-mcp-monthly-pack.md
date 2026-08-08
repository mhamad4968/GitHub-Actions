# MCP 月次パック（2026-08）— 実施計画

> **地位**: 8月提案レーン ②（①依頼効率化の後）  
> **完了通知**: 夜セッション（本計画外）  
> **触らない**: mcp.json 構造削除・追加（Tier B）、SKYSEA、8/13資料、閉済再開

## 1. 目的

空月に MCP 台帳・ルーティング・軽いメンテをまとめて上げ、金曜定例を「形だけ」にしない。

## 2. スコープ（本パック）

| ID | 内容 | Tier | 状態 |
|----|------|------|------|
| M0 | 本計画1枚 | A | **済** |
| M1 | `mcp-status:refresh-usage` → 台帳表更新 | A | **済** |
| M2 | `cio:mcp:env` + `cio:mcp:gate` 緑確認 | A | **済** |
| M3 | 死蔵候補を **残す / Cold維持 / TierB検討** の3択で記録 | A | **済**（残す・Cold維持・TierB不要） |
| M4 | `cio:tool:route` 実戦3本（ops / constitution / report）を runbook 固定 | A | **済**（intent 追加含む） |
| M5 | eslint 10.6→10.8.1（V1 minor）同梱メンテ | A | **済** |
| M6 | checkpoint「8月提案レーン」節 + 次の1手更新 | A | **済** |
| MX | `cio:periodic:monthly`（live-schema portfolio） | A | **見送り**（API負荷・必要時） |
| MB | mcp.json 整理・npx @latest 一括 | **B** | **CEO GO後** |

## 3. やらない

- mintlify / cyber-news 再追加
- 経営会議資料
- 完了通知配線（夜）
- 憲法大統合・B-MDFLOW 実装（次の提案枠・G0のみ後日可）

## 4. 合格線

- `verify:cio-mcp-registry` / `cio:mcp:env` SUMMARY OK 6/6
- `cio:mcp:gate` OK
- `verify:mcp-deleted-refs` OK
- `verify:cio-tool-routing-infra` OK（実戦3本 needle）
- `docs/mcp-status.md` に 2026-08-08 監査スナップ

## 5. 参照

- `docs/mcp-status.md`
- `docs/plans/2026-05-17-mcp-optimization-plan.md`
- `docs/runbooks/cio-periodic-ops-schedule.md`
- `docs/runbooks/ai-team-tool-routing-v2.md`
