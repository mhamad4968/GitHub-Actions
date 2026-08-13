# 毎日最終セッション締め（自発）

> **制定**: 2026-08-13（浜田 — ①〜⑦を毎回指示しない）  
> **対象**: **その日の最終セッションのみ**。partial / 昼区切りでは回さない。

浜田が手順を言わなくても CIO が開始する。

| # | 内容 | 誰 |
|---|------|-----|
| ① | GitHub 確認と不具合是正 | CIO（`cio:eod:github`） |
| ② | 本日の反省点 | CIO（`evening:reflect` → 本文を埋める） |
| ③ | 運用・体制・MCP・ルール・憲法の改善案 | CIO が出し、**浜田が承認** |
| ④ | 承認案の対応 | CIO（GO 後のみ） |
| ⑤ | SPEC・未コミット → commit / push | close-git |
| ⑥ | Desktop `AI緊急用` 最新入替 | sync-desktop |
| ⑦ | AIチーム締め完了 | close-git-warn |

```bash
npm run cio:day-close -- --until-pause
# ③をチャットへ → 浜田 GO → ④を実施
npm run cio:day-close -- --after-go
```

改善なしで締めるときだけ `--skip-go`。

**しない**: ③の実装を GO 前にやる。夕反省に明日の1手を書く。途中セッションでこの7手を回す。cold-start の必須ゲート化。
