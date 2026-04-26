# P4: §51-4/§51-5 並列セッション疑い 4 軸機械判定 — 自律実装ログ

**日時**: 2026-04-26 08:25 JST
**holder**: P4-parallel-detector-2026-04-26 (manual lock)
**Tier**: A (script + rule 改定 / 副作用最小)
**発端**: 浜田 08:00 GO「Aでお願いします」+ サマリー P4 IN_PROGRESS

---

## 1. 背景

- TSB-017: 別 Cursor セッションが現セッションの提案を文字通り実行する事象（提案された作業手順を別セッションが先に実装）
- §51-3 段階 1-3 は実装済（`session-lock.mjs` + `file-watcher.mjs` + `agents-md-changes.jsonl`）
- **未整備**: 「複数の証拠から並列セッションを疑う閾値判定」が AI 個別判断頼み
- P3 K-3 ログ観察で「watcher_pid が単一なら静穏 / 複数なら異常」の経験則を得たが規範化されていない

## 2. 設計（§51-4 / §51-5）

### 4 軸 + スコア

| # | 軸 | 観測 | 重み | 真陽性度 |
|---|---|---|---|---|
| 軸 1 | watcher_pid 不一致 | jsonl 内 2+ 種 | +5 | ⭐ 最高（別 file-watcher = 物理証拠） |
| 軸 2 | 同一ファイル過密編集 | 5 分以内 5+ 件 | +2 | 中（AI 連続編集でも発生し得る） |
| 軸 3 | session-lock 不在編集 | 直近 10 分編集 + lock 不在 | +3 | 高（L-1 違反 or 別セッション） |
| 軸 4 | 不審バックアップ命名 | `.b7-pre-*` `.tsb-*-pre-*` 等 | +4 | 高（TSB-017 パターン） |

### 判定閾値

| スコア | 判定 | AI 動作 |
|---|---|---|
| 0-2 | 🟢 静穏 | 通常運用 |
| 3-4 | 🟡 注意 | 朝報追記 + 開口一番報告 |
| 5-6 | 🟠 警報 | 作業中断 + 浜田 GO 待ち |
| 7+ | 🔴 確定 | 即 abort + L-6 候補 |

## 3. 実装ファイル

- **新規**: `scripts/parallel-session-detector.mjs` (4 軸スコアラー / JST タイムスタンプ / snapshot 保全)
- **改定**: `scripts/daily-morning-prep.mjs` §5-5 末尾に detector 結果統合
- **改定**: `scripts/smoke-test.mjs` 第 8 検査として組込（warn/ng exit code 対応）
- **改定**: `package.json` に `audit:parallel` / `audit:parallel:json` / `audit:parallel:explain` 追加
- **改定**: `AGENTS.md` §51-4 / §51-5 新設 + changelog v23.11
- **改定**: `RULES-INDEX.md` §51-4 / §51-5 行追加 + §N チェックリスト更新
- **改定**: `chat-sessions/NEW-SESSION-STARTER.md` v3.5 セクション追記
- **改定**: `chat-sessions/CURSOR-トラブル対応メモ.md` v2.5 セクション追記
- **同期**: `.rag/extra-docs/` + `/mnt/c/Users/mhamada202408224/Desktop/AI緊急用/` (SHA256 一致確認済)

## 4. 検証結果

```
$ npm run audit:parallel:explain
### §51-4 並列セッション疑い判定 (2026-04-26T08:22:48.360+09:00)
**総合スコア**: 0 点 / 🟢 静穏 (通常運用継続)
**jsonl 検査件数**: 26 件

| 軸 | スコア | 内訳 |
|---|---:|---|
| 軸 1: watcher_pid 不一致 | 0 | pid=212 (26 件) |
| 軸 2: 同一ファイル過密編集 | 0 | 該当なし |
| 軸 3: session-lock 不在編集 | 0 | 直近 10 分: 編集 1 件 / lock 保有 (holder=P4-parallel-detector-2026-04-26, manual=true) → 整合 |
| 軸 4: 不審なバックアップ命名 | 0 | 不審なバックアップ命名なし |

🟢 通常運用継続 OK
```

```
$ npm run smoke
[smoke] ✅ guard:check
[smoke] ✅ audit:rules
[smoke] ✅ audit:tsb
[smoke] ✅ verify:breaking
[smoke] ✅ audit:xref
[smoke] ✅ health-check
[smoke] ✅ rule-watcher
[smoke] ✅ audit:parallel        ← P4 で追加
overall=ok exit=0   (8/8 グリーン)
```

```
$ npm run verify:all
✅ 破断リンクなし
✅ TSB confirmed 95% (孤児除く 100%)
✅ post-BREAKING 削除復活なし
✅ AGENTS ↔ RULES-INDEX drift なし
```

## 5. 自己批判（improvement points）

- **lock 取得の常態化が遅れていた**: P1/P3/Q1 の連続作業で session-lock を都度 acquire していなかった（O-series 以来 release されたまま）  
  → 本 P4 で manual acquire を実施して 0 点に戻ったが、**規約上は L-1 違反扱い**  
  → 学び: 各タスク開始時に `npm run audit:parallel` を走らせ、軸 3 で +3 点を出さない運用が必要  
  → 改善案 (将来): 朝報生成時 / smoke-test 時に「軸 3 が +3 だが lock 不在 = 自セッション原因」を区別する hint を出すロジックを追加検討
- **軸 3 の lock 検知ロジックの初稿バグ**: 当初 `logs/session-lock.log` を見ようとしたが session-lock.mjs はその log を出力しておらず、`.session-state/ai-session.lock` 直接参照に修正  
  → 学び: 関連スクリプトの I/O を grep で先に確認する（実装前 5 分で防げた）
- **軸 2 の閾値検討余地**: 5 分 5+ 件は実用範囲だが、AI が憲法ファイルを大改定する時（例: TSB 起票時）に偽陽性が出る可能性  
  → false-positive.jsonl で実例を蓄積し、5/10 月次レビューで閾値再検討

## 6. 次の段階（後続）

- **将来 P4-2** (5/10 月次レビュー): false-positive.jsonl の蓄積を見て閾値・重み調整
- **将来 L-6**: §51-3 段階 2 force-kill 実装時に §51-4 7+ 点を発火条件に組込
- **次タスク**: Q-series 残 5 タブ（P5）/ または PC 台帳 Day 4（P2）— 浜田優先順次第

---

**lock**: P4-parallel-detector-2026-04-26 → commit/push 後 release 予定
