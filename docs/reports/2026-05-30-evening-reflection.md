# 夕反省 — 2026-05-30 JST（改訂3・全案 GO）

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`  
> **未来は分からない** — 明日の作業は **当日 -0 で聞く**（前日決定禁止）

---

## AI の失敗・反省

| # | 失敗 | 対策 ID |
|---|------|---------|
| F1 | 急務で **§1 四行・`cio:turn-start` 省略** | A1 |
| F2 | **夕反省にタスク計画**を混ぜた | R1〜R3, S1 |
| F3 | **クローズ後**を残タスク扱い | R2 |
| F4 | **区切り commit なし** | B1, S2 |
| F5 | PC ログ修復の **持続確認手順**不足 | B2, B3 |

---

## アップデート案 — **全 GO（2026-05-30 浜田）**

| ID | 内容 | 状態 |
|----|------|------|
| A1 | 毎ターン `cio:turn-start` 先行 | **実施済**（運用） |
| A2 | checkpoint 先頭短文化 + archive | **実施済** |
| A3 | 締め `desktop:sync-and-verify` 必須 | **実施済**（package 連結） |
| B1 | commit + push | **本ターン実施** |
| B2 | `pc-event-log-health.md` | **実施済** |
| B3 | 再起動後 5 分チェック | **runbook 内実施済** |
| R1 | scope Read 必須 | **`.cursor/rules/evening-reflection-scope.mdc`** |
| R2 | クローズ再掲禁止 | **scope.md + 18 追記** |
| R3 | 禁止語（第1手・案A/B/C/D） | **S1 機械検証** |
| S1 | `verify:evening-reflection-scope` | **実施済** |
| S2 | `verify:session-close-git-warn` | **desktop:sync-and-verify 連結** |
| D1 | 18 追記 | **実施済** |

---

## 夕反省に書かないもの

- 明日の第1手・レーン・業務改善（→ **当日 -0**）
- クローズ済みの再計画（→ **checkpoint**）
- 成果サマリ（→ **19**）
