# 夕反省改善案 GO — 2026-08-03

- **承認日**: 2026-08-03（夜）JST  
- **承認者**: 浜田（CEO）  
- **有効**: 即時〜次回夕反省で見直し  
- **対象**: A1–A3 / S-UI-SURF-01 / S-REPORT-A1 / S-PRINT-FILTER-01 / O-SURF-01 / O-CLOSED-01 / O-WAKE-01 / M-5038-SURF / M-REPORT-01 / C-41-SURF / C-GO-PRINT  
- **判定**: **すべて承認**  
- **憲法本文**: **変更しない**（薄い runbook / 18 追記 / §50-3-8 定型のみ）

## 承認 ID → 状態

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | 多面依頼は対象面を1行固定してから Diff | 本GO |
| **A2** | 禁止文言の初回は印刷面のみから | 本GO |
| **A3** | 報告前に `cio:report-verify-response`・□A1 固定表記 | 本GO |
| **S-UI-SURF-01** | 目立たせ文言の着手前面チェック | **反映** |
| **S-REPORT-A1** | □A1 正しい1行例を checklist 固定 | **反映** |
| **S-PRINT-FILTER-01** | 二重絞込系は印刷ヘッダーに画面／モーダル | **反映** |
| **O-SURF-01** | 着手前に表示面マトリクス1行 | 本GO |
| **O-CLOSED-01** | closed-v1 でも明示依頼の微小 UI／印刷は再開可 | **反映** |
| **O-WAKE-01** | WAKE 偽陽性は allowlist・締め前 dirty 最小化 | 本GO（knowledge-wake 済） |
| **M-5038-SURF** | §50-3-8 (a) に表示面漏れ | **反映** |
| **M-REPORT-01** | 報告はテンプレ生成→verify 優先 | **反映** |
| **C-41-SURF** | 多面 UI の表示範囲を §41 典型題材に（18 追記） | **反映** |
| **C-GO-PRINT** | 印刷文言は初回印刷面のみ既定 | **反映** |

## 反映物

| 成果物 | パス |
|--------|------|
| GO 記録 | `docs/approved-changes/2026-08-03-evening-reflection-hamada-go.md` |
| 夕反省 | `docs/reports/2026-08-03-evening-reflection.md` |
| 運用まとめ | `docs/runbooks/cio-ops-2026-08-03-evening-improvements.md` |
| 薄い規則 | `.cursor/rules/cio-ops-2026-08-03-evening-improvements.mdc` |
| 報告 checklist | `docs/session-report-checklist.md` |
| §50-3-8 定型 | `.cursor/rules/deepseek-cursor-spec-division.mdc` |
| closures 運用 | `docs/runbooks/cio-project-closure-governance.md` |
| 18 追記 | `chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt` |
| 検証 | `npm run test:evening-improvements-2026-08-03` |
