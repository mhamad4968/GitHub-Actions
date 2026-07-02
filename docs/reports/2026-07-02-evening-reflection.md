# 夕反省 — 2026-07-02（595 退職PCリンク・メーリングリスト Space21 移設）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md` — **AI 失敗** + **ミス削減**（行動 **および** ルール・手順・脚本）  
> **承認**: §3 / §5 の ID — **浜田判断待ち**（本ファイル提出時点）

---

## 1. 本日 AI が失敗したこと

| # | 私がやったこと（失敗） | 結果 |
|---|------------------------|------|
| F1 | 595 fix **deploy 後 R63 commit を同一セッション内で遅延** | close-git 前に複数回の fixup commit |
| F2 | **750/751 Space21 移設後** SPEC / 完成報告 / closures の doc 更新が **移設スクリプトと別ターン** | 浜田指摘後に追記 commit |
| F3 | **checkpoint `**Git**` 行**を close-git 同期後に **古い hash へ巻き戻し** | mandatory-read-gate / close-git-warn の追加 commit 連鎖 |
| F4 | **kintone-apps.md 595 詳細行 garble**（rev 重複） | 締め前に手修正 |
| F5 | **kintone-apps deploy 履歴行の誤削除**が uncommitted で残存 | `git restore` で解消（commit せず） |
| F6 | **verify-mailing-list-751** が Windows Node **UV_HANDLE_CLOSING** で crash | 照合途中終了（データ差分は表示済） |
| F7 | **Plan & Usage スクショ未提出**（最終記録 **2026-06-21**・**11 日 stale**） | `credit:status` 記録催促継続 |

---

## 2. 改善 — 私が次から変えること（行動）

| ID | 失敗 | 私が次から変えること |
|----|------|----------------------|
| **A-0702-01** | F1 | kintone **deploy SUCCESS ターン内**に customize + `cio-live-builds` + `kintone-apps` + **commit まで完了**（R-KIN-01 再徹底） |
| **A-0702-02** | F2 | **インフラ変更（移設・ACL）と doc 正本更新を同一 commit 束**にする（スクリプト完走＝doc 更新まで） |
| **A-0702-03** | F3 | **checkpoint Git 行は `cio:session:close-git` の sync 後に手編集しない**。要更新は close-git 再実行 |
| **A-0702-04** | F7 | セッション締め報告に **`credit:status` 1 行**（Total% / stale 日数）を必ず載せる |

---

## 3. ルール・手順・脚本改善 — **承認待ち**

| ID | 対応失敗 | 概要 | 正本候補 |
|----|----------|------|----------|
| **R-ML-03** | F2 | `mailing-list-move-space21.mjs` 完走時に **SPEC §4・完成報告・closures.json** を同時 patch（doc 漏れ防止） | `scripts/mailing-list-move-space21.mjs` |
| **S-CLOSE-01** | F3 | `cio-checkpoint-git-sync.mjs` を **close-git 最終段の単一 writer** に固定し、手動 Git 行編集を verify で warn | `scripts/cio-session-close-git.mjs` |
| **S-ML-05** | F6 | `verify-mailing-list-751.mjs` — Windows UV crash 時 **照合結果を exit 0/1 分離**（TSB-039 同型） | `scripts/verify-mailing-list-751.mjs` |
| **R-595-03** | F4 | deploy:595 成功時 **`kintone-apps.md` サマリ行を `cio-live-builds.json` から自動 stamp**（garble 防止） | `scripts/deploy-customization.js` または post-deploy hook |
| **D-CREDIT-01** | F7 | `verify:session-close-git-warn` または close-git 末尾に **`credit:status` stale_nudge を 1 行出力** | `scripts/verify-session-close-git-warn.mjs` |

---

## 4. うまくいったこと（事実）

- **595** BUILD=`2026-07-02-595-retire-clear-pc674-link` rev **113** deploy SUCCESS — 退職時 674→保管 + 595 PC台帳サブテーブルクリア — **backfill 7件** — 浜田 OK
- **750/751** Space **21** / thread **23** 移設 + ACL（admin 全権 / system 閲覧+書出 / everyone 拒否）— 浜田 OK
- **GitHub Actions** — 本日 push 分 **success**（constitution-gates / cursor-env-gates）
- **MCP env** — OK **6/6**（kintone / deepseek / kimi / openrouter / memory / sequential-thinking）
- **BUILD audit strict** — 595/674/688/700/721/734 **6/6 OK**
- **mandatory-read-gate / constitution-handoff** — 締め時 **OK**

---

## 5. 毎夜必須議題（§44 — 2026-07-02 結論）

| 項目 | 今日の結論 |
|------|------------|
| CIO 二人体制 | 595 fix で DeepSeek MCP schema error → **スキップ**（Kimi 未使用）。移設・締めは **本体完走** — 次回 kintone 変更は §50-3-8 再試行 |
| §1c | 移設・ACL は **REST 結果を script 出力で確認** — 仮決なし |
| MCP | **6/6 OK** — close-git 内 `mcp:sync-cursor-windows` 済。追加 upgrade は **未実施**（安全優先） |
| ルールと実態 | checkpoint **minChars 2800** と close-git **複数 fixup** の摩擦 — **S-CLOSE-01 提案** |

---

## 6. Plan & Usage（D3 — 浜田未提出分の報告）

| 項目 | 値 |
|------|-----|
| **本日スクショ** | **未提出**（浜田申告どおり） |
| **直近記録** | **7%**（**2026-06-21**）🟢 |
| **stale** | **11 日** — `credit:status` 記録催促 |
| **次回 Ultra リセット** | **2026-07-16**（残 **14 日**） |
| **線形予測** | 枯渇日 OK（2032-02-16） |
| **AI 助言** | 通常運用継続。次回セッション開始時に **Total% 1 行**またはスクショ送付 → CIO が `credit:set` |

正本: `docs/runbooks/cursor-plan-usage-watch.md`

---

## 7. 承認

**2026-07-02 浜田 GO（夜間再開）**: §3 **R-ML-03 / S-CLOSE-01 / S-ML-05 / R-595-03 / D-CREDIT-01** — 一括承認・実装済  
正本: `docs/approved-changes/2026-07-02-rules-evening-hamada-go.md`

---

## 8. メモ

- 最大の再発リスクは **F3（checkpoint Git 行の先祖返り）** — close-git 同期と手編集の競合。
- Space 48 ポータル（712 等）の **750/751 リンク**は **未確認** — 別ターンで目視可。
