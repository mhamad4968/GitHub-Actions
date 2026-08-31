# 夕反省 — 2026-08-05

> スコープ正本: `docs/runbooks/evening-reflection-scope.md`  
> **GO**: 2026-08-05 浜田すべて承認（`docs/approved-changes/2026-08-05-evening-reflection-hamada-go.md`）

## 1. 失敗（事実）

| # | 事実 |
|---|------|
| 1 | セッション締め中に PowerShell `Set-Content` で `checkpoint-latest.md` を書き換え、**UTF-8 が破壊**。`**次の1手**`／自律復元節が欠落し、constitution-handoff / mandatory-read-gate が落ちた。未 push の壊れた commit を hard reset で破棄するまで復旧に手数を使った |
| 2 | close-git 後に **R44 chase**（heal → export → stamp → tip 進み → 再 NG）を手動で繰り返した。`git-heal` 単体や手書き Git 行を混ぜ、一度で親 stamp に収束させられなかった |
| 3 | 日中の docs 連続 commit のあと **bridge / spec-task-scores を締め直前まで更新せず**、#D-CLOSE-02（bridge 古）と Rank1 乖離で close-git が一度止まった |
| 4 | `close-git --skip-desktop-sync` のあと `session:clock:clear` を別実行し、**SESSION-CLOCK の未コミット**を残して `verify:session-close-git-warn` を再 NG にした |

## 2. 改善案（ミス削減）— 行動

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | checkpoint / handoff など UTF-8 日本語正本の編集は **PowerShell Set-Content / Out-File を使わない**。Node `fs.writeFileSync(..., 'utf8')` か既存の cio:* 脚本のみ | 反映済 |
| **A2** | 締めは **`cio:session:close-git --execute` 一本**に寄せる。途中で `git-heal`・手書き Git 行・単独 export を挟まない（止まったら原因1件直してから再実行） | 反映済 |
| **A3** | 締め開始前に `cio:session:export-handoff` + `cio:task:score-handoff` + `verify:session-close-handoff-freshness` を1巡し、#D-CLOSE-02 / Rank1 を先に緑にする | 反映済 |
| **A4** | clock:clear は close-git 完了後にまとめて行い、**clear 後は即 commit+push**（または close-git 連鎖に含める）までを一続きとする | 反映済 |

## 3. 改善案 — ルール・脚本

| ID | 内容 | 状態 |
|----|------|------|
| **S-CLOSE-UTF8-01** | checkpoint 編集系（heal / R44 stamp / handoff repair）の入口で **必須キー（`**次の1手**:`・自律復元節）を書き込み後 assert**し、破壊時は exit 1（PowerShell 経路を禁止コメントでも明記） | 反映済 |
| **S-CLOSE-ONEPASS-01** | `cio:session:close-git` に「途中 NG 時は heal を自動連鎖せず **1原因を表示して停止**」する注記／ガードを足し、手動 chase を減らす | 反映済 |
| **S-CLOSE-PREFLIGHT-01** | 締め前 preflight（export + score-handoff + D-CLOSE-02）を npm script 1本にまとめ、close-git の --execute 冒頭で呼べるようにする | 反映済 |
| **D-CLOSE-PS-01** | runbook（session-lifecycle-v2 / close-git 節）に「**日本語正本は PS Set-Content 禁止**」を1行追記 | 反映済 |

## 4. §体制・運用・MCP・憲法

| ID | 層 | 内容 | 状態 |
|----|----|------|------|
| **O-CLOSE-01** | 運用 | 「今日は終わり」＝ **成果まとめではなく close-git 一巡の完了**を優先。GHA 確認は push 後の成功確認まで含める | 反映済 |
| **O-BRIDGE-01** | 運用 | 連続 docs commit 日は、区切りごとに export-handoff するか、少なくとも締め宣言の直前に必ず再 export する | 反映済 |
| **M-CLOSE-01** | MCP／運用 | 締めトラブル時の短問は「UTF-8 破壊か／R44 chase か／bridge 古か」の3分岐を先に切り分ける（DeepSeek 定型1行可） | 反映済 |
| **C-R44-OPS** | 憲法運用 | R44 off-by-one は **close-git 内の stamp のみ正当**。条文改定は不要。運用逸脱（外からの heal 連鎖）が主因 | 反映済 |

### 1-N 憲法運用レビュー（本日の結論）

- SKYSEA 本番配信境界（回答＋GO前は実PC配信禁止）は守れた。憲法不足ではない。
- 締め事故は **手続き逸脱（PS書き込み・heal chase）** が主因。AGENTS 本文改定は不要。薄い runbook／close-git ガードで足りる。
- §44 論点: close 経路の「一本化」を運用に戻すこと。追加の alwaysApply ルールは不要。
