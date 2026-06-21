# 浜田 GO — 2026-06-21 夕反省改善案（R63–R68 一括承認）

**承認日**: 2026-06-21  
**承認者**: 浜田（CEO）  
**契機**: 696 共有メール台帳改善セッション夕締め反省（F1–F5）+ 所属・並び正本の運用指示

## 承認一覧

| ID | 内容 | 状態 |
|----|------|------|
| R63 | kintone customize **deploy SUCCESS → 同一セッション内 commit** | **GO — 実装** |
| R64 | `cio:preflight:<app>` の **`--note` 必須**を usage 明示 | **GO — 実装** |
| R65 | stale branch 断捨離 runbook（archive tag → delete） | **GO — 実装** |
| R66 | 小規模 dash 検索パネル最小テンプレ（674 由来） | **GO — 実装** |
| R67 | RULES-INDEX 意図しない dirty を session-close で warn | **GO — 実装** |
| R68 | **所属・拠点並び正本 JSON** — 浜田確定・**再確認不要** | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| R63 | `chat-sessions/desktop-ai-emergency-read-pack/20-SESSION-REPORT-CHECKLIST.txt` |
| R64 | `scripts/cio-preflight-stamp.mjs` |
| R65 | `docs/runbooks/github-stale-branch-cleanup.md` |
| R66 | `docs/knowledge/small-dash-search-panel-pattern.md` |
| R67 | `scripts/verify-session-close-git-warn.mjs` |
| R68 | `docs/knowledge/jbis-affiliation-location-sort-masters.md` · `scripts/lib/jbis-display-sort.mjs` |

## 所属・並び正本（R68・浜田 2026-06-21 渡し済み）

| 用途 | 正本 JSON | 備考 |
|------|-----------|------|
| **拠点並び**（22 拠点・sort_no） | `scripts/data/jbis-location-sort-master.json` | 全 kintone アプリ共通 |
| **所属ブロック並び**（本社9 + 支店営業所20） | `scripts/data/business-improvement-annual-department-order.json` | 年次・表形式ソート |
| **所属ドロップダウン／一覧表示順**（34 件） | `scripts/data/vpn-account-depts.json` | VPN・台帳 UI 共通 |

**運用**: AI は上記 JSON を正とし、浜田への「並びどうしますか？」確認は **JSON 改定時のみ**。
