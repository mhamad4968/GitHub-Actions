# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->

<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->



**最終更新**: 2026-07-05 JST — **② kintone アカウント台帳 v1.2 本番運用 CLOSED** · Plan&Usage **21%**（リセット **7/15** 残11日）



### 本日アクティブ（BUILD/rev — 2026-07-05）



| 項目 | 内容 |

|------|------|

| **② kintone アカウント台帳** | **CLOSED v1.2 本番運用中** — 752/753 · BUILD 753=`2026-07-05-kintone-account-dash-v19-agg-100rem-list-sort` **rev22** · Excel **廃止** · Space 48 **リンク設置済** · 正本 `docs/plans/2026-07-05-kintone-account-ledger-spec.md` · git **`2d63799`** |

| **736 実行予算** | BUILD=`2026-07-04-736-row-menu-fixed-pop` **rev168** — Phase **0c GO** · Phase 1: 7/11 / 7/18 / 7/25 |

| **698 社員ミラー** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** |

| **700 提案申請** | BUILD=`2026-07-04-bi-proposal-late-eval-collapse` **rev146** — Q-UX-12 浜田目視 OK |



## クローズ済み（`data/cio-project-closures.json` — 8件 · 7/5 再確認済）



業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA 実装**



## 保留・その他の制約



| 状態 | 内容 |

|------|------|

| **688 保留** | 触らない |

| **予実管理 保留** | **677/678/679** — 触らない |

| **SKYSEA 保留** | **本日午後=意見交換のみ**（実装凍結） |

| **736 実行予算** | **〜7/11 様子見** · deploy 追加なし |

| **nodemailer 9.x** | **保留**（浜田 2026-07-04 判断） |



**次の1手**: **736 Phase 1**（7/11 マスタ検索）まで deploy 追加なし。**月曜** 698/700 レビュー。**午後** SKYSEA 意見交換（準備のみ・実装凍結）  

**Git**: kintone 753 **`2d63799`** = `origin/main` — push 済  

**Plan&Usage**（2026-07-05 浜田報告 ×2）: **Ultra $200/mo** · 合計 **21%** · Auto+Composer **28%** · API **5%** · On-Demand **$0/$1000**（上限 Fixed 1000）· **リセット 7/15（残11日）** — **現ペース問題なし**（Auto が主因。11日で ~79% 余裕）  

**整理正本**: `docs/reports/2026-07-05-morning-task-triage.md`  

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **クローズ正本**: `data/cio-project-closures.json` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  

**運用メモ**: 本番 Excel **`設定マスタ_本番`** のみ。595 CSV 後 **「台帳へ一括反映」**。Desktop `18-重要確認.txt` 正本  

**npm major 保留**: nodemailer 9.x · xlsx  

**MCP**: `cio:mcp:env` **6/6 OK**（2026-07-05 朝）



## セッション切替後の自律復元（Lifecycle v2 鏡像）



**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  

**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  

**CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **L2** bootstrap NG → NEW-SESSION-STARTER 6 部（1 回）| **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）


