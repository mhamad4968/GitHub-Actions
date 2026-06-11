# 2026-06-10 — AI 失敗と憲法・ルール更新案



> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）



（明日の作業・案件・UAT 手順は対象外。機能の未実装リストも書かない。）



---



## AI の失敗



| # | 失敗 | 同日対応 |

|---|------|----------|

| F1 | Phase 2-D sync 初回で PowerShell `&&` 連結 → 即失敗（作業中断に見えた） | `;` + `$LASTEXITCODE` に切替 |

| F2 | `constitution:extract-genres` 再実行で genre md が LF 化 → pre-commit EOL NG | node で CRLF 一括復元後 commit |

| F3 | Phase 2-D commit/push 後、Desktop `AI緊急用` 同期が同一ターンで未実施 | 本締めで `desktop:sync-and-verify` |

| F4 | 1 日に kintone 6 app + PC メンテ + 憲法 Phase 2-D とレーンが混在し handoff 要約が長文化 | checkpoint 先頭に Phase 2-D 行を追加 |



---



## ルール更新案 — **浜田 GO 済（2026-06-10 夜・全件）**



正本: `docs/approved-changes/2026-06-10-rules-r1-r12-hamada-go.md`



| ID | 概要 | 反映 |

|----|------|------|

| R1–R6 | workdays ゲート + 締めスコープ（6/9 提案） | 6/9 実装 + 6/10 正式 GO |

| R7 | Desktop 同期同一ターン | `cio-four-ai-governance.md` |

| R8 | PowerShell コマンド例 | `WORKFLOW.md` |

| R9 | extract CRLF 固定 | `extract-constitution-by-genre.mjs` |

| R10 | deploy-gate 一括 | `workdays-deploy-gate.mjs` |

| R11 | SESSION-ONE-REPORT 2026-06-10 | read-pack 19 番 |

| R12 | xlsx audit リスク受容 | `2026-06-10-pc-maintenance.md` §R12 |



---



## 意図的に書かないもの



- 年次 Q-SCHED-03 の作業手順（→ 当日 -0）

- 706–711 の機能追加・FAQ

- xlsx 代替 lib 実装（R12 は受容記録のみ）


