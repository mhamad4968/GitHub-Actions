# 4AI 違反是正 Runbook（CEO承認 2026-05-22）

## 背景（5/22 セッションで発生した違反）

| 違反 | 内容 |
|------|------|
| §50-3-8 | customize/deploy 前に DeepSeek 未実施 |
| B3 | `customize/**` を CIO 本体が直接 Diff |
| §1 | 中間ターンで先頭 4 行欠落 |
| 第2者 | SPEC_TOUCHED ターンで SECOND_REVIEWER 未実施 |

## CEO 承認（2026-05-22）

| 案 | 状態 |
|----|------|
| **D1** 着手前 DeepSeek→突合→5038 | **承認・即時施行** |
| **D2** PPTX/資料も §50-3-8 | **承認・即時施行** |
| **D3** customize/** は Composer | **承認・即時施行** |
| **D4** 締めは report-verify exit 0 | **承認・即時施行** |
| **D5** 674 §10.5 目視 | **未承認** |
| **D6** 678 運用確認 | **承認** |
| **D7** 資格PPTX配布版 | **承認** |

## 着手前ゲート（毎実装ターン・この順のみ）

```
npm run cio:pre-implement-gate
```

1. 応答先頭に **§1 四行**（ティア／憲法／🎖️／ルール確認）
2. **DeepSeek 1 問**（盲点3点）— `mcp_user-deepseek_chat`
3. **CIO 突合3行**をチャットに書く（約3行突合メモ）
4. **customize/** or 80行超 → **Composer Subagent**（🎖️ に `Composer=Subagent実施済`）
5. `npm run cio:guard:5038 -- --stamp`（スキップ時 `--skip "理由"` + `§50-3-8 スキップ理由:` 1行）
6. **PPTX/資料**（D2）: 年次矛盾・学習負荷・人事説明の盲点を DeepSeek 質問に含める

証跡ファイル例: `logs/cio-four-ai-governance/5038-deepseek-evidence.md`

## 報告・締め（D4）

```
npm run cio:report-verify-response -- --file <下書き.md>
```

exit 0 を確認してから送信。

## 違反検知時の動作

- **証跡なしで customize/deploy** → **作業停止**、`cio:guard:5038` が NG
- **CIO が customize に大量 Diff** → 🎖️ 違反、Composer に差し戻し
- **§1 四行欠落** → 報告違反、即追記

## 参照

- `18-重要確認.txt`（Desktop read-pack）
- `13-READ-05.txt` 実装日冒頭
- `scripts/cio-pre-implement-gate.mjs`
