# 夕反省改善案 GO — 2026-08-05

- **承認日**: 2026-08-05（夜）JST  
- **承認者**: 浜田（CEO）  
- **有効**: 即時〜次回夕反省で見直し  
- **対象**: A1–A4 / S-CLOSE-UTF8-01 / S-CLOSE-ONEPASS-01 / S-CLOSE-PREFLIGHT-01 / D-CLOSE-PS-01 / O-CLOSE-01 / O-BRIDGE-01 / M-CLOSE-01 / C-R44-OPS  
- **判定**: **すべて承認**  
- **憲法本文**: **変更しない**（薄い runbook / close-git ガード / §50-3-8 定型のみ）

## 承認 ID → 状態

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | 日本語正本は PS Set-Content 禁止（Node / cio:*） | **反映** |
| **A2** | 締めは close-git 一本・途中 heal／手書き禁止 | **反映** |
| **A3** | 締め前に export + score + D-CLOSE-02 | **反映**（preflight） |
| **A4** | clock:clear 後は即 commit+push（または close 連鎖内） | **反映** |
| **S-CLOSE-UTF8-01** | checkpoint 書き込み後必須キー assert | **反映** |
| **S-CLOSE-ONEPASS-01** | 途中 NG は1原因表示で停止（chase 抑制） | **反映** |
| **S-CLOSE-PREFLIGHT-01** | 締め前 preflight npm 1本 | **反映** |
| **D-CLOSE-PS-01** | runbook に PS 禁止1行 | **反映** |
| **O-CLOSE-01** | 「今日は終わり」＝ close-git 一巡完了 | **反映** |
| **O-BRIDGE-01** | 連続 docs 日は区切り／締め前に再 export | **反映** |
| **M-CLOSE-01** | 締め短問3分岐（UTF-8 / R44 chase / bridge 古） | **反映** |
| **C-R44-OPS** | R44 は close-git 内 stamp のみ正当 | **反映** |

## 反映物

| 成果物 | パス |
|--------|------|
| GO 記録 | `docs/approved-changes/2026-08-05-evening-reflection-hamada-go.md` |
| 夕反省 | `docs/reports/2026-08-05-evening-reflection.md` |
| 運用まとめ | `docs/runbooks/cio-ops-2026-08-05-evening-improvements.md` |
| 薄い規則 | `.cursor/rules/cio-ops-2026-08-05-evening-improvements.mdc` |
| UTF8 assert | `scripts/lib/cio-checkpoint-git-sync.mjs` |
| preflight | `scripts/cio-session-close-preflight.mjs` |
| close-git | `scripts/cio-session-close-git.mjs` |
| 検証 | `npm run test:evening-improvements-2026-08-05` |
