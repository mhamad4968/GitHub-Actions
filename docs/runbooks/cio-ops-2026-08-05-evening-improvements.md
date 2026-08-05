# 運用改善 — 2026-08-05 夕反省 GO

> GO: `docs/approved-changes/2026-08-05-evening-reflection-hamada-go.md`  
> 憲法本文（AGENTS）は変更しない。

## 締め一本化（A2 / O-CLOSE-01 / S-CLOSE-ONEPASS-01 / C-R44-OPS）

「今日は終わり」＝ **`npm run cio:session:close-git -- --execute --auto-stage --message "…"` 一巡の完了**（push・GHA 成功確認含む）。

| 禁止 | 正当 |
|------|------|
| 途中で `cio:checkpoint:git-heal` を連鎖 | NG 原因1件を直して **close-git 再実行のみ** |
| 手動 `**Git**:` 行編集 | close-git 内の R44 parent stamp のみ |
| PowerShell `Set-Content` / `Out-File` で checkpoint 編集 | Node `fs.writeFileSync(..., 'utf8')` または cio:* |

R44 off-by-one は **close-git 内 stamp のみ正当**（C-R44-OPS）。外からの heal chase は運用逸脱。

## 締め前 preflight（A3 / S-CLOSE-PREFLIGHT-01 / O-BRIDGE-01）

```powershell
npm run cio:session:close-preflight
# または close-git --execute 冒頭で自動実行（--skip-preflight は浜田 GO + 理由）
```

内容: `export-handoff` → `task:score-handoff` → 再 export → `#D-CLOSE-02` → `--validate-export`。

連続 docs commit の日は、区切りごと、または少なくとも **締め宣言の直前**に再 export（O-BRIDGE-01）。

## UTF-8 必須キー（A1 / S-CLOSE-UTF8-01 / D-CLOSE-PS-01）

`updateCheckpointGitHead` は書き込み前後に次を assert する:

- `**次の1手**:`
- `セッション切替後の自律復元`
- `Read より前`
- `項番 -0`
- `日終わり`

欠落時は throw（書き込まない）。日本語正本は **PS Set-Content 禁止**（D-CLOSE-PS-01）。

## clock:clear（A4）

full CLOSE では lifecycle どおり **close-git 直前に clear** を推奨。clear を close 後に単独実行した場合は **即 commit+push** まで一続き（未コミット放置禁止）。

## 締めトラブル短問（M-CLOSE-01）

DeepSeek／自己切り分けは先に3分岐:

1. **UTF-8 破壊か**（必須キー欠落）
2. **R44 chase か**（heal／手書きを挟んだか）
3. **bridge 古か**（#D-CLOSE-02 / Rank1）
