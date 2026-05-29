# 18 遵守違反 — 根本原因と恒久対策（2026-05-30）

**スコア**: v5 目次セッション **約 45/100**（浜田監査）  
**正本**: `chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt`

## 違反一覧と「なぜ守られなかったか」

| # | 違反 | 直接原因（なぜ） | 構造原因 |
|---|------|------------------|----------|
| V1 | **§1 四行**を毎ターン先頭に出さない | 「全部今すぐ直す」依頼で**作業ツールを先に起動**。hooks が IDE チャットで先頭を自動挿入できない経路なのに**手動出力を省略** | **ターン開始の機械ゲートが無かった**（理解≠実行） |
| V2 | **4AI 順序**（DeepSeek→Composer→Kimi）未実施 | `DOC_LANE_4AI.md` / `doc_lane_preflight.py` は存在したが**編集着手前に未実行**。「後でまとめてレビュー」と先送り | レーン外パス（`C:\tmp`）を**憲法適用外と誤認** |
| V3 | **CIO 本体が 80 行超 Python を直接 Diff** | `C:\tmp\マニュアル\scripts` を repo 外とみなし **D3（Composer のみ）を適用外**と判断。「軽微」と自己正当化 | **パス横断の Diff 行数ゲートが無い** |
| V4 | **`cio:report-verify-response` 未実行** | 中間サマリ・進捗報告を「報告ターン」扱いせず **D4 をスキップ** | 報告下書きの **CLI 検証が送信前習慣化されていない** |
| V5 | **Desktop 19/25/26 の更新遅延** | read-pack 正本化を先にし **sync を後回し**（手順逆） | **作業完了定義に Desktop verify が含まれていなかった** |
| V6 | **「別途検討」「CEO 操作待ち」で先送り** | GitHub App 設定は CLI 不可と判断し**文言で先送り**（浜田命令: 別途検討禁止） | **不可項目と可項目の分岐テンプレが無い** |

## 再発メカニズム（要約）

1. **速度優先バイアス** — ユーザー「今すぐ」→ プロトコル省略  
2. **レーン誤認** — `C:\tmp` ＝ 憲法外、という誤ったヒューリスティック  
3. **hooks 盲信** — hooks 非経路で §1 / CEO ブロックを「後で」と判断  
4. **ゲートの表示のみ** — `cio:pre-implement-gate` は存在するが **--strict 未運用**  
5. **完了定義の欠落** — 「直した」＝ commit のみで **verify:desktop / report-verify まで含めていない**

## 恒久対策（即時施行）

| ID | 対策 | 実装 |
|----|------|------|
| P0 | **毎ターン最初**に `npm run cio:turn-start` | `scripts/cio-turn-start.mjs` |
| P1 | **実装・編集前**に `npm run cio:pre-implement-gate -- --strict` | 証跡なしは **exit 2** |
| P2 | **ドキュメントレーン**は stamp 必須 | `cio:doc-lane-gate` + `fix_toc_v5.py` 内 stamp 検査 |
| P3 | **報告・締め**は下書き → `cio:report-verify-response` exit 0 | 変更なし（D4 厳守を runbook 再掲） |
| P4 | **完了定義**に Desktop verify を含める | `cio:turn-start -- --complete` |
| P5 | **alwaysApply ルール** | `.cursor/rules/cio-18-zero-tolerance.mdc` |
| P6 | **CI 検証** | `verify:cio-18-countermeasures` を governance に追加 |

## ターン開始 — 必須順（欠落＝作業停止）

```
npm run cio:turn-start                    # 全ターン（§1 テンプレ表示）
npm run cio:pre-implement-gate -- --strict   # 編集・Shell・deploy の前
# doc-lane のとき追加:
npm run cio:doc-lane-gate -- --strict
# 報告・締めの送信前:
npm run cio:report-verify-response -- --file <下書き.md>
# セッション区切り:
npm run session-starter:sync-desktop && npm run verify:desktop-ai-emergency-sync
```

## GitHub Cursor/Mintlify pending（V6 是正）

- **CLI では解除不可**（App installation は CEO の GitHub Settings のみ）  
- **先送り禁止**: 応答には **手順 URL 1 行 + 実施後確認コマンド**を必ず書く（`github-commit-checks-pending.md`）  
- **「別途検討」という語の使用禁止**（checkpoint / handoff / 報告）

## 変更履歴

- **2026-05-30**: 初版（v5 セッション監査・浜田命令「恒久対策まで即実行」）
