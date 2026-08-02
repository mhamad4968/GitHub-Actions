# 夕反省改善案 GO — 2026-08-02

- **承認日**: 2026-08-02（夜）JST  
- **承認者**: 浜田（CEO）  
- **有効**: 即時〜次回夕反省で見直し  
- **対象**: A1–A3 / S-PRINT-01〜03 / O-PRINT-01 / M-RAG-01〜03  
- **判定**: **すべて承認**  
- **憲法本文**: **変更しない**

## 承認 ID → 状態

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | 印刷余白の初手は MediaBox 確認 | 本GO |
| **A2** | 向き依存失敗は同ターンで Memory／RAG へ | 本GO |
| **A3** | 印刷前に最終行見切れ1巡 | 本GO |
| **S-PRINT-01** | MediaBox＋向き＝縦を runbook 固定 | **反映** |
| **S-PRINT-02** | height:auto 実測→棒スケールを runbook 明記 | **反映** |
| **S-PRINT-03** | page1/page2 overflow 分離 | **反映**（v24＋runbook） |
| **O-PRINT-01** | 向き・縮小・MediaBox の3点切り分け | 本GO |
| **M-RAG-01** | 重要失敗は git runbook にミラー | **反映** |
| **M-RAG-02** | 683 印刷着手時に RAG/Memory 1回 | 本GO |
| **M-RAG-03** | Memory 名と RAG source を runbook 末尾に固定 | **反映** |
| **M-RAG-04** | 起動時ナレッジ自動注入（knowledge-wake-stamp · sessionStart/cold-start） | **反映**（追記承認・2026-08-02） |

## 反映物

| 成果物 | パス |
|--------|------|
| GO 記録 | `docs/approved-changes/2026-08-02-evening-reflection-hamada-go.md` |
| 夕反省 | `docs/reports/2026-08-02-evening-reflection.md` |
| 印刷 runbook | `docs/runbooks/user683-weekly-summary-and-print.md` |
| 運用まとめ | `docs/runbooks/cio-ops-2026-08-02-evening-improvements.md` |
| RAG | `note://2026-08-02/kintone-683-print-failures` |
| Memory | `kintone-683-print-report` |
| ナレッジWAKE | `data/cio-active-knowledge-needles.json` · `npm run cio:knowledge:wake-stamp` |
