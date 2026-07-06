# 反省会・セッション締めのスコープ（CEO 2026-06-09 確定 / R5 承認）

## 反省会で書くもの

1. **AI の失敗**（事実・ルール忘れ・手順逸脱）
2. **憲法・ルール・runbook・ゲートの是正案**（再発防止の制度）

## 736 実行予算 — 仕様進捗の同期（2026-07-05 浜田 / 抜け漏れ対策）

**全案件共通（2026-07-05 拡張）**: 浜田がすべて把握・記憶する必要はない。**機械検査**で先祖返りを防ぐ。

```bash
npm run verify:spec-progress-sync
```

| タイミング | 更新対象 | 検査 |
|------------|----------|------|
| deploy / GO 受け入れ（反省会・締め） | 案件 SPEC 進捗表 · 版管理鏡像 · `kintone-apps.md` · checkpoint | **同一ターン** + `verify:spec-progress-sync` **exit 0** |
| 凍結・方針変更 | §9.6.1 等 · checkpoint | 同上 |
| セッション開始 | — | `session:bootstrap` / `smoke:quiet` 内包（第17検査） |
| セッション締め | — | `cio:session:close-git --execute` **commit 前必須** |

ルール追加: `data/cio-spec-progress-sync-rules.json`（新案件は JSON に 1 ルール追加するだけ）

736 詳細: `docs/plans/2026-06-18-jikkou-yosan-spec.md` **§9.2.3**

## 736 — 反省会で毎回触れる（2026-07-05 浜田）

**PH1c=7/7–9/7/11 · B=7/12–7/20** — 詳細は `736-july-2026-schedule.md`

| 区分 | 内容 | 反省会での AI |
|------|------|----------------|
| **PH1b** | ラベル行 · **7/11** | 1 行 |
| **PH1a** | マスタ検索 | 未 GO なら 1 行 |
| **PH1c** | 並び替え · **7/12–17 / 7/18** | 1 行 |
| **B backlog** | BL-DETAIL-01 · UI-BACKLOG-02/03 | 1 行 |

## 736 7月 — セッション開始自律説明（2026-07-05 浜田）

| ルール | 内容 |
|--------|------|
| **タイミング** | **セッション開始** · bootstrap 後 · **依頼を聞く前** |
| **内容** | **今日の予定**（期限 · 期間 · 直近 3 日） |
| **遅れ** | **NG** — 過期限日は **RED** + 挽回 1 手 |
| **正本** | `docs/runbooks/736-july-2026-schedule.md` · Lifecycle v2 ORIENT 第 6 項 |

## 736 §9.6 凍結 — 月末レビュー（2026-07-05 浜田）

| タイミング | AI / 浜田 |
|------------|-----------|
| **随時** | 浜田が **相談したいとき** に解凍・優先度等を話す（AI は能動言及しない） |
| **毎月末** | 反省会・締めで **必ず時間を取る** — 凍結リスト確認 + **今後どうするか** |

**月末アジェンダ（AI 起票）**:

1. `jikkou-yosan-spec.md` **§9.6.1** 表 + §9.2.3 凍結行 + F-01 を **一覧提示**
2. 各項目: **凍結継続 / 解凍 / 完了 / B バックログへ** — 浜田判断（決まらなければ **凍結継続**）
3. 変更があれば **同一ターン** spec · checkpoint 更新 + `verify:spec-progress-sync`

**禁止**: 月末に **勝手に解凍 GO** · 依頼者未出項目の能動提案

**初回**: **2026-07-31** 前後の反省会・締め

## 反省会で書かないもの

- 案件の「明日やること」・UAT 手順・利用者確認の進め方
- 機能 backlog（年列12月・下段カレンダー等）のロードマップ
- deploy 済み BUILD の説明・URL 一覧（正本は kintone-apps.md）

機能修正・利用者判断は **別レーン・別タイミング**。締め文書に混ぜない。

## 対象ファイル

| ファイル | 内容 |
|----------|------|
| `SESSION-CLOSE-REPORT-YYYYMMDD.txt` | 失敗 + ルール案 + 承認状態 |
| `docs/reports/YYYY-MM-DD-evening-reflection.md` | 同上（詳細） |
| `checkpoint-latest.md` / Desktop LITE | 同上（要約） |
| `22-HANDOFF-HUMAN.txt` | 失敗 + ルール案 + 承認待ちのみ |

## 関連

- R1〜R12 承認: `docs/approved-changes/2026-06-10-rules-r1-r12-hamada-go.md`
- 6/9 詳細: `docs/reports/2026-06-09-evening-reflection.md`
- 6/10 夕反省: `docs/reports/2026-06-10-evening-reflection.md`
- workdays deploy: `docs/runbooks/workdays-deploy-checklist.md`
