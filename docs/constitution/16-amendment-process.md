# 憲法改定（§57・第21章）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: AGENTS.md 改変・[BREAKING]  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 30秒要約（Phase 2）

§57 憲法改定・[BREAKING]・改定キュー。AGENTS 改変はここを先に読む。

## いつ読む（チェックリスト）

- AGENTS 改定
- ルール追加
- §57 GO

## 条文本文（AGENTS 抽出・削除禁止）

> 以下は `AGENTS.md` からの抽出コピー。**省略・削除しない**。解釈疑義は `AGENTS.md` 正本。

## 第21章 憲法改定プロセス（2026-04-26 制定 / 浜田 「§57 案 1」朝ブリーフィング / R15 / [FEAT]）

### §57 改定プロセス (Amendment Workflow)

**背景**: §47-D / §47-E / §51 / §54-1 が「**ルール = 憲法**」前提で運用される以上、**改定そのものの手順** を明文化しておかないと「却下のしようがない」。§47-E は「改定意図明示時のみ却下せず議論に入る」と書いているが、その「議論」の手順が未定義 → §47-E から `§57 改定プロセスに移行します` という参照だけが先行し、**audit-rules で破断リンクが発生していた**（2026-04-26 朝ブリーフィングで検出）。本節はそれを実体化する。

**§54-1 との役割分担**:

| 軸 | §54-1 意味論的バージョニング | §57 改定プロセス |
|---|---|---|
| **What** | どのラベルを付けるか（[BREAKING] / [FEAT] / [FIX]）| 誰がどう変えるか（手順・順序） |
| **粒度** | 1 commit = 1 ラベル | 1 改定 = 提起 → 起案 → 適用 → 検証 → 周知 |
| **発動契機** | commit する瞬間 | 浜田が「§X を変えたい」と明示した瞬間 |
| **記録先** | commit message + 付則 changelog | `logs/autonomy-decisions/` + 付則 changelog |
| **失敗時の防御** | `verify-breaking-deletions.mjs`（再追加検知）| `audit-rules.mjs`（破断リンク検知）+ §57-5 |

つまり **§54-1 はラベル / §57 は手順**。改定 commit には両方が適用される（[BREAKING] ラベルが付くなら §57-3 で BREAKING を選ぶ）。

#### §57-1 改定提起 (Proposal)

- **発動主体**: 浜田 or AI（§47-A Professional Critique 等で AI が提起することも可）
- **発動条件のいずれか**:
  1. 浜田が `§X を変えたい` `§X を撤回したい` `§X を改定したい` 等、**明示的に改定意図を表明**
  2. AI が §47-A / §47-D / §47-E / §54-2 Negative Log 等で **構造的矛盾を発見**し、改定提案を Tier B キューに起票
  3. TSB / インシデントの再発防止策として AI が改定提案を起票（[FEAT] / [BREAKING] 候補）
- **却下事由（§57-1 で止まる）**:
  - 改定意図の明示なし → §47-E で **即却下**（§57 に進まない）
  - S0/S1 障害対応中 → 安全側固定（§55 セーフモード解除後に §57-1 へ戻す）

#### §57-2 起案・レビュー (Drafting & Review)

- AI が **diff 案 + 影響範囲** を提示する。最低限以下を含める:
  1. **改定対象** (§X-Y / 該当行 / 関連 §)
  2. **改定理由** (背景 + 引用元: 浜田指示 / TSB / 朝報 / Negative Log)
  3. **§54-1 ラベル候補** ([BREAKING] / [FEAT] / [FIX]) と判定根拠
  4. **影響を受ける他条文** (cross-reference / RULES-INDEX エントリ更新要否)
  5. **ロールバック手順** ([BREAKING] の場合は必須 / §54-4 Snapshot ID も併記)
- 浜田レビュー: 起案を読んで **GO / 修正指示 / 却下** を返す。GO 時は §57-3 へ。
- AI 単独提起の場合: Tier B キューに `tier-b-rule-amendment-YYYY-MM-DD-HHMM` で起票し、浜田 GO まで保留。

#### §57-3 ラベル決定 (Label Selection)

- §54-1 の 3 質問判定フローチャートを実行 → ラベル確定。
- ラベルは **commit message の prefix** と **付則 changelog の prefix** の両方に必ず付ける（例: `[BREAKING] v24: ...` / `[FEAT] v23.6 / N-2: ...`）。
- ラベル不一致時は §54-1 違反として再起案。

#### §57-4 適用 (Apply)

- ファイル編集順序（**並列禁止 / §51 厳守**）:
  1. `AGENTS.md` 本文（条文追加・削除・改訂）
  2. `RULES-INDEX.md`（参照テーブル / §N 一覧 / 役割表 行追加）
  3. `WORKFLOW.md`（手順影響あり時のみ）
  4. 関連スクリプト（`scripts/*.mjs` の参照更新）
  5. `chat-sessions/NEW-SESSION-STARTER.md` / `CURSOR-トラブル対応メモ.md`（運用に直結する変更時）
  6. 浜田 Desktop `AI緊急用/*.txt`（§57-6 周知で同期）
- 1 ターン 1 ファイルが原則だが、**整合性確保のため同一意図の更新は同一 commit に含める** ことを許可（[BREAKING] 時は特に必須 = `verify-breaking-deletions.mjs` 誤検知防止）。

#### §57-5 検証 (Verify)

- 必須コマンド（順序実行 / 並列禁止）:
  ```bash
  npm run audit:rules            # 破断リンク 0 を確認
  npm run audit:tsb              # TSB カバレッジ維持
  npm run verify:breaking        # [BREAKING] 削除文の再追加なしを確認
  npm run audit:xref             # AGENTS ↔ RULES-INDEX 整合
  npm run health-check           # S1-S16 通過
  npm run smoke-test             # 7 検査オールグリーン
  ```
- 1 つでも `❌` が出たら **commit を保留して原因究明** → §57-2 へ戻る（妥協禁止 / 浜田 N-series 朝指示）。
- AGENTS.md hash が変わるので `.session-state/agents-md-hash.txt` を更新する（§42-2-2）。

#### §57-6 周知 (Communication)

- **付則 changelog に必ず 1 行追記**（日付 + ラベル + バージョン + 一文サマリ + 反映箇所）。
- **重大改定**（[BREAKING] / Tier 構造変更 / セーフモード変更 / §57 自身の改定）は以下も同期:
  - `chat-sessions/NEW-SESSION-STARTER.md`（次セッション継続性）
  - `chat-sessions/CURSOR-トラブル対応メモ.md`（緊急時参照）
  - 浜田 Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用\*.txt`（SHA256 一致確認。**浜田方針**: 新チャット儀式はここを毎回開く前提のため、儀式系 MD を触ったコミットでは **`npm run session-starter:sync-desktop`** を同一ターンで必ず実行し、Desktop を最優先で最新にする。手動 `cp` より npm 経路を推奨）
- 翌朝 `daily-morning-prep.mjs` の §1 で「昨日の改定」として浜田に提示。

#### §57-7 改定の改定 (Meta)

- §57 自身を改定するとき:
  - 必ず [BREAKING] ラベル（手順骨格を変えるため）
  - §47-E / §54-1 / §51 / §52 と矛盾しないことを **明示確認**（提案テンプレに「他憲法と矛盾なし」チェック欄を含める）
  - 浜田の **明示 GO** が無い限り適用禁止（AI 単独で §57 を変えてはならない）

#### §57-8 記録様式 (Logging Format)

```
logs/autonomy-decisions/rule-amendment-YYYY-MM-DD-HHMM.md
- proposer: hamada | ai
- amendment_id: e.g. N-2-section-57-newly-defined
- target: §57 (新設) / §47-E (改訂) など
- label: [BREAKING] | [FEAT] | [FIX]
- diff_summary: <3-5 行>
- impact: <影響条文・スクリプト・ドキュメント>
- review_at: YYYY-MM-DD HH:MM
- approved_by: hamada (時刻明記)
- applied_commit: <sha>
- verify_result: smoke-test ✅ / audit-rules ✅ / verify-breaking ✅
```

#### §57-9 §47-E / §47-D / §51 との接続

- **§47-E**: 浜田指示が憲法違反 → **改定意図が明示なら §57-1 へ** / なければ即却下。
- **§47-D**: 浜田の短時間矛盾 → 矛盾即却下。改定したい場合は浜田が改めて §57-1 を起こす。
- **§51 / §51-3**: §57 適用中も並列禁止。session-lock 取得後に §57-4 の編集順序を進める。
- **§54-2 Negative Log**: 棄却された改定案も `synthesis-graveyard/` に保管（再提案時の参考に）。
- **§57-10**: 副次インフラ運用（RAG ミラー・branch protection 手順・git hooks）を **本条の下位**として追補。**§57-1〜§57-9 の代替ではない**。

#### §57-10 I案 — インフラ運用（RAG 副本文 / GitHub / git hooks）（2026-05-02 制定 / 浜田チャット GO / CIO×DeepSeek・Kimi・OpenRouter 合意反映）

**位置づけ**: 第21章の **骨格手順（§57-1〜§57-9）を置き換えない**。本条は **RAG 用副本文**・**GitHub ブランチ保護**・**post-commit 等の git 資産**を、**§57-2 起案 + 浜田 GO + §54-1 ラベル**で改訂する **着地先**である（§50-3-8 の多モデル相談と実装順メモとも整合）。

1. **RAG 正本ミラー（§2 正本主義）**  
   - **正本**はリポジトリルートの `RULES-INDEX.md` / `kintone-apps.md` / `AGENTS.md` / `WORKFLOW.md`。  
   - **RAG ingest 副本文**は `.rag/extra-docs/` 配下。内容は **`npm run rag:mirror:canonical-docs`** で正本から上書きコピーする（副本文の手編集は再発防止のため禁止＝差分は正本側で行う）。  
   - **検証**: **`npm run verify:rag-mirror-canonical`**（**`npm run verify:agent-env`** 連鎖に含まれる）。  
   - **編集ターンの義務**: 上記 4 ファイルのいずれかを変えた commit では、**同一 commit** に `.rag/extra-docs` を揃える（`npm run rag:mirror:canonical-docs` を pre-commit 相当の習慣とみなす）。

2. **GitHub `main` branch protection**  
   - **UI 設定**は管理者権限が前提。手順・必須 check の注意点は **`docs/github-branch-protection.md`** を正とする。  
   - **paths 限定**のワークフローだけを必須 check に入れない（**マージ不能**の罠）。実在し **`main` の push で常に緑になる** check 名のみ採用する。

3. **git post-commit（TSB-016 / TSB-024 / mandatory-read-gate）**  
   - **実装**は `scripts/git-hook-post-commit.mjs`。`git-hooks/post-commit` は `#!/bin/sh` から Node へ委譲（Windows Git の `cannot spawn` / 空 hook を回避）。  
   - **インストール**: **`npm run hooks:install`**（`.git/hooks/` へコピー。壊れた hook の上書き可）。

4. **多モデル合意の取り扱い**  
   - Kimi / DeepSeek / OpenRouter 等の見解は **参考入力**。**優先順位の確定と実装コミット責任**は CIO（本リポの統括 AI 手順・§1-2-3-3）が行う。

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

