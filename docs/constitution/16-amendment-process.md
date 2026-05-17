# 憲法改定（§57・第21章�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: AGENTS.md 改変�E[BREAKING]  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§57 憲法改定�E[BREAKING]・改定キュー、EGENTS 改変�Eここを�Eに読む、E

## ぁE��読む�E�チェチE��リスト！E

- AGENTS 改宁E
- ルール追加
- §57 GO

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第21章 憲法改定�Eロセス�E�E026-04-26 制宁E/ 浜田 「§57 桁E1」朝ブリーフィング / R15 / [FEAT]�E�E

### §57 改定�Eロセス (Amendment Workflow)

**背景**: §47-D / §47-E / §51 / §54-1 が、E*ルール = 憲況E*」前提で運用される以上、E*改定そのも�Eの手頁E* を�E斁E��しておかなぁE��「却下�EしよぁE��なぁE��。§47-E は「改定意図明示時�Eみ却下せず議論に入る」と書ぁE��ぁE��が、その「議論」�E手頁E��未定義 ↁE§47-E から `§57 改定�Eロセスに移行します` とぁE��参�Eだけが先行し、E*audit-rules で破断リンクが発生してぁE��**�E�E026-04-26 朝ブリーフィングで検�E�E�。本節はそれを実体化する、E

**§54-1 との役割刁E��**:

| 軸 | §54-1 意味論的バ�Eジョニング | §57 改定�Eロセス |
|---|---|---|
| **What** | どのラベルを付けるか�E�EBREAKING] / [FEAT] / [FIX]�E�| 誰がどぁE��えるか�E�手頁E�E頁E��！E|
| **粒度** | 1 commit = 1 ラベル | 1 改宁E= 提起 ↁE起桁EↁE適用 ↁE検証 ↁE周知 |
| **発動契橁E* | commit する瞬閁E| 浜田が「§X を変えたい」と明示した瞬閁E|
| **記録允E* | commit message + 付則 changelog | `logs/autonomy-decisions/` + 付則 changelog |
| **失敗時の防御** | `verify-breaking-deletions.mjs`�E��E追加検知�E�| `audit-rules.mjs`�E�破断リンク検知�E�E §57-5 |

つまめE**§54-1 はラベル / §57 は手頁E*。改宁Ecommit には両方が適用される！EBREAKING] ラベルが付くなめE§57-3 で BREAKING を選ぶ�E�、E

#### §57-1 改定提起 (Proposal)

- **発動主佁E*: 浜田 or AI�E�§47-A Professional Critique 等で AI が提起することも可�E�E
- **発動条件のぁE��れか**:
  1. 浜田ぁE`§X を変えたい` `§X を撤回したい` `§X を改定したい` 等、E*明示皁E��改定意図を表昁E*
  2. AI ぁE§47-A / §47-D / §47-E / §54-2 Negative Log 等で **構造皁E��盾を発要E*し、改定提案を Tier B キューに起票
  3. TSB / インシチE��ト�E再発防止策として AI が改定提案を起票�E�EFEAT] / [BREAKING] 候補！E
- **却下事由�E�§57-1 で止まる！E*:
  - 改定意図の明示なぁEↁE§47-E で **即却丁E*�E�§57 に進まなぁE��E
  - S0/S1 障害対応中 ↁE安�E側固定（§55 セーフモード解除後に §57-1 へ戻す！E

#### §57-2 起案�Eレビュー (Drafting & Review)

- AI ぁE**diff 桁E+ 影響篁E��** を提示する。最低限以下を含める:
  1. **改定対象** (§X-Y / 該当衁E/ 関連 §)
  2. **改定理由** (背景 + 引用允E 浜田持E�� / TSB / 朝報 / Negative Log)
  3. **§54-1 ラベル候裁E* ([BREAKING] / [FEAT] / [FIX]) と判定根拠
  4. **影響を受ける他条斁E* (cross-reference / RULES-INDEX エントリ更新要否)
  5. **ロールバック手頁E* ([BREAKING] の場合�E忁E��E/ §54-4 Snapshot ID も併訁E
- 浜田レビュー: 起案を読んで **GO / 修正持E�� / 却丁E* を返す、EO 時�E §57-3 へ、E
- AI 単独提起の場吁E Tier B キューに `tier-b-rule-amendment-YYYY-MM-DD-HHMM` で起票し、浜田 GO まで保留、E

#### §57-3 ラベル決宁E(Label Selection)

- §54-1 の 3 質問判定フローチャートを実衁EↁEラベル確定、E
- ラベルは **commit message の prefix** と **付則 changelog の prefix** の両方に忁E��付ける（侁E `[BREAKING] v24: ...` / `[FEAT] v23.6 / N-2: ...`�E�、E
- ラベル不一致時�E §54-1 違反として再起案、E

#### §57-4 適用 (Apply)

- ファイル編雁E��E��！E*並列禁止 / §51 厳宁E*�E�E
  1. `AGENTS.md` 本斁E��条斁E��加・削除・改訂！E
  2. `RULES-INDEX.md`�E�参照チE�Eブル / §N 一覧 / 役割表 行追加�E�E
  3. `WORKFLOW.md`�E�手頁E��響あり時�Eみ�E�E
  4. 関連スクリプト�E�Escripts/*.mjs` の参�E更新�E�E
  5. `chat-sessions/NEW-SESSION-STARTER.md` / `CURSOR-トラブル対応メモ.md`�E�運用に直結する変更時！E
  6. 浜田 Desktop `AI緊急用/*.txt`�E�§57-6 周知で同期�E�E
- 1 ターン 1 ファイルが原剁E��が、E*整合性確保�Eため同一意図の更新は同一 commit に含める** ことを許可�E�EBREAKING] 時�E特に忁E��E= `verify-breaking-deletions.mjs` 誤検知防止�E�、E

#### §57-5 検証 (Verify)

- 忁E��コマンド（頁E��実衁E/ 並列禁止�E�E
  ```bash
  npm run audit:rules            # 破断リンク 0 を確誁E
  npm run audit:tsb              # TSB カバレチE��維持E
  npm run verify:breaking        # [BREAKING] 削除斁E�E再追加なしを確誁E
  npm run audit:xref             # AGENTS ↁERULES-INDEX 整吁E
  npm run health-check           # S1-S16 通過
  npm run smoke-test             # 7 検査オールグリーン
  ```
- 1 つでめE`❌` が�Eたら **commit を保留して原因究昁E* ↁE§57-2 へ戻る（妥協禁止 / 浜田 N-series 朝指示�E�、E
- AGENTS.md hash が変わる�Eで `.session-state/agents-md-hash.txt` を更新する�E�§42-2-2�E�、E

#### §57-6 周知 (Communication)

- **付則 changelog に忁E�� 1 行追訁E*�E�日仁E+ ラベル + バ�Eジョン + 一斁E��マリ + 反映箁E���E�、E
- **重大改宁E*�E�EBREAKING] / Tier 構造変更 / セーフモード変更 / §57 自身の改定）�E以下も同期:
  - `chat-sessions/NEW-SESSION-STARTER.md`�E�次セチE��ョン継続性�E�E
  - `chat-sessions/CURSOR-トラブル対応メモ.md`�E�緊急時参照�E�E
  - 浜田 Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用\*.txt`�E�EHA256 一致確認、E*浜田方釁E*: 新チャチE��儀式�Eここを毎回開く前提のため、儀式系 MD を触ったコミットでは **`npm run session-starter:sync-desktop`** を同一ターンで忁E��実行し、Desktop を最優先で最新にする。手勁E`cp` より npm 経路を推奨�E�E
- 翌朝 `daily-morning-prep.mjs` の §1 で「昨日の改定」として浜田に提示、E

#### §57-7 改定�E改宁E(Meta)

- §57 自身を改定するとぁE
  - 忁E�� [BREAKING] ラベル�E�手頁E��格を変えるためE��E
  - §47-E / §54-1 / §51 / §52 と矛盾しなぁE��とめE**明示確誁E*�E�提案テンプレに「他�E法と矛盾なし」チェチE��欁E��含める�E�E
  - 浜田の **明示 GO** が無ぁE��り適用禁止�E�EI 単独で §57 を変えてはならなぁE��E

#### §57-8 記録様弁E(Logging Format)

```
logs/autonomy-decisions/rule-amendment-YYYY-MM-DD-HHMM.md
- proposer: hamada | ai
- amendment_id: e.g. N-2-section-57-newly-defined
- target: §57 (新設) / §47-E (改訁E など
- label: [BREAKING] | [FEAT] | [FIX]
- diff_summary: <3-5 衁E
- impact: <影響条斁E�Eスクリプト・ドキュメンチE
- review_at: YYYY-MM-DD HH:MM
- approved_by: hamada (時刻明訁E
- applied_commit: <sha>
- verify_result: smoke-test ✁E/ audit-rules ✁E/ verify-breaking ✁E
```

#### §57-9 §47-E / §47-D / §51 との接綁E

- **§47-E**: 浜田持E��が�E法違叁EↁE**改定意図が�E示なめE§57-1 へ** / なければ即却下、E
- **§47-D**: 浜田の短時間矛盾 ↁE矛盾即却下。改定したい場合�E浜田が改めて §57-1 を起こす、E
- **§51 / §51-3**: §57 適用中も並列禁止。session-lock 取得後に §57-4 の編雁E��E��を進める、E
- **§54-2 Negative Log**: 棁E��された改定案も `synthesis-graveyard/` に保管�E��E提案時の参老E���E�、E
- **§57-10**: 副次インフラ運用�E�EAG ミラー・branch protection 手頁E�Egit hooks�E�を **本条の下佁E*として追補、E*§57-1〜§57-9 の代替ではなぁE*、E

#### §57-10 I桁E Eインフラ運用�E�EAG 副本斁E/ GitHub / git hooks�E�！E026-05-02 制宁E/ 浜田チャチE�� GO / CIO×DeepSeek・Kimi・OpenRouter 合意反映�E�E

**位置づぁE*: 第21章の **骨格手頁E��§57-1〜§57-9�E�を置き換えなぁE*。本条は **RAG 用副本斁E*・**GitHub ブランチ保護**・**post-commit 等�E git 賁E��**を、E*§57-2 起桁E+ 浜田 GO + §54-1 ラベル**で改訂すめE**着地允E*である�E�§50-3-8 の多モチE��相諁E��実裁E��E��モとも整合）、E

1. **RAG 正本ミラー�E�§2 正本主義�E�E*  
   - **正本**はリポジトリルート�E `RULES-INDEX.md` / `kintone-apps.md` / `AGENTS.md` / `WORKFLOW.md`、E 
   - **RAG ingest 副本斁E*は `.rag/extra-docs/` 配下。�E容は **`npm run rag:mirror:canonical-docs`** で正本から上書きコピ�Eする�E�副本斁E�E手編雁E�E再発防止のため禁止�E�差刁E�E正本側で行う�E�、E 
   - **検証**: **`npm run verify:rag-mirror-canonical`**�E�E*`npm run verify:agent-env`** 連鎖に含まれる�E�、E 
   - **編雁E��ーンの義勁E*: 上訁E4 ファイルのぁE��れかを変えぁEcommit では、E*同一 commit** に `.rag/extra-docs` を揃える�E�Enpm run rag:mirror:canonical-docs` めEpre-commit 相当�E習�Eとみなす）、E

2. **GitHub `main` branch protection**  
   - **UI 設宁E*は管琁E��E��限が前提。手頁E�E忁E��Echeck の注意点は **`docs/github-branch-protection.md`** を正とする、E 
   - **paths 限宁E*のワークフローだけを忁E��Echeck に入れなぁE��E*マ�Eジ不�E**の罠�E�。実在ぁE**`main` の push で常に緑になめE* check 名�Eみ採用する、E

3. **git post-commit�E�ESB-016 / TSB-024 / mandatory-read-gate�E�E*  
   - **実裁E*は `scripts/git-hook-post-commit.mjs`。`git-hooks/post-commit` は `#!/bin/sh` から Node へ委譲�E�Eindows Git の `cannot spawn` / 空 hook を回避�E�、E 
   - **インスト�Eル**: **`npm run hooks:install`**�E�E.git/hooks/` へコピ�E。壊れぁEhook の上書き可�E�、E

4. **多モチE��合意の取り扱ぁE*  
   - Kimi / DeepSeek / OpenRouter 等�E見解は **参老E�E劁E*、E*優先頁E���E確定と実裁E��ミット責任**は CIO�E�本リポ�E統括 AI 手頁E�E§1-2-3-3�E�が行う、E

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

