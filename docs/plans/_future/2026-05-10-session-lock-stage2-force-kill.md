# L-6 / §51-3 段階 2: scripts/session-lock.mjs --force-kill モード

- **起票日**: 2026-04-25 (L-series / TSB-017 構造防御の続編)
- **想定着手**: 2026-05-10 以降 (浜田 GO 必須 / 誤殺リスク評価完了後)
- **責任 (R)**: AI Tier B / **承諾 (A)**: 浜田
- **関連ルール**: §51 / §51-3 / §47-E / §52 (Tier B 承認待ちキュー型)
- **関連 TSB**: TSB-017
- **依存タスク**: K-3 (file-watcher リアルタイム監視 = 段階 3)

## 目的

§51-3 段階 1 (現状) は「自分側を abort = 自衛」のみ。
浜田 11:12 指示 **「並列セッションの疑いがあれば即座に他セッションを強制的に終了するように」** の本質的な実現には、**既存の並列セッション (= cursor プロセス) を物理的に kill する** 機構が必要。

ただし誤殺リスクが大きく (例: 浜田自身が手動操作中の cursor を殺してしまう / 別作業中の AI セッションを殺す)、段階 1 → 段階 2 → 段階 3 と慎重に導入する。

## スコープ

`scripts/session-lock.mjs` に `--force-kill` モード追加:

```bash
node scripts/session-lock.mjs acquire --manual --holder=<id> --force-kill
```

動作:
1. 既存 lock があれば lock 情報を表示
2. `ps aux | grep -i cursor` で cursor プロセス一覧取得
3. lock holder pid が cursor プロセス内に存在するか確認
4. 存在 + 浜田 GO 確認 → SIGTERM (15) 送信 → 5 秒待機 → 生きていれば SIGKILL (9)
5. kill 結果と被害範囲を `logs/parallel-kills/YYYY-MM-DD-HHMM.json` に記録
6. 自分自身の pid (`process.pid`) は除外 (= 自殺防止)
7. cursor 以外のプロセスは除外 (= 誤殺防止 / claude / codex / gemini 等)

## 設計上の注意点

### 自殺防止

- `process.pid` および全祖先 pid を除外リスト (parent → grandparent → ...) として保持
- `/proc/<pid>/stat` で親 pid を辿る

### 誤殺防止

- 対象は **`/proc/<pid>/cmdline` に "cursor" を含むプロセスのみ**
- `claude` / `codex` / `gemini` / `node` 単体 は **除外** (他 AI tools との競合回避)
- ホワイトリスト方式 (= 「殺してよい cmdline pattern」を明示)

### 浜田 GO の取り方

選択肢:
- **A**: `--force-kill` フラグ単体 = 浜田が CLI で明示実行した時のみ kill
- **B**: 環境変数 `SESSION_LOCK_FORCE_KILL=1` 必須 + `--force-kill` フラグ = 二重防御
- **C**: 殺す前に `read -p "kill pid=X holder=Y? (yes/no): "` で対話確認

推奨: **B + C 併用** (CLI フラグ + env + 対話 = 三重防御 / 暴発リスク最小化)

### データロスト防止

- kill 前に既存 lock holder の作業内容を確認するルートはない (= 別セッションの状態は不明)
- → kill 直前に **`git stash list` を強制実行** して念のため記録?
  - ただし別セッションの shell からは現セッションが操作できない
  - → 結局は浜田の判断に委ねる (= 対話確認で「本当に殺してよいか」を確認)

## ロールバック計画

`--force-kill` モードに不具合が見つかった場合:
- 環境変数 `SESSION_LOCK_FORCE_KILL=0` で無効化
- `scripts/session-lock.mjs` の該当 if ブロックを `if (false &&` で物理的に殺す (1 行 patch)
- 段階 1 (manual lock + 自衛 abort) は影響を受けない (独立)

## テストケース (実装前に書く)

1. **自殺防止テスト**: 自分自身の pid を kill 対象に含めない
2. **誤殺防止テスト**: cursor 以外の cmdline は kill しない
3. **対話確認テスト**: 「no」入力で kill 中止 + lock 取らずに exit
4. **kill 成功テスト**: 偽の cursor プロセス (`bash -c 'while true; do sleep 1; done & echo $! > /tmp/fake-cursor'`) を kill できる
5. **ログ記録テスト**: kill 結果が `logs/parallel-kills/` に正しく記録される

## 受け入れ条件

- [ ] テストケース 1-5 全て pass
- [ ] 浜田が CLI で 1 回試行 → 期待通りに kill されるか確認
- [ ] kill ログが `logs/parallel-kills/` に記録される
- [ ] post-commit hook 影響なし
- [ ] smoke-test 影響なし
- [ ] §51-3 表に「段階 2 = 実装済」と更新

## リスク評価

| リスク | 影響度 | 確率 | 対策 |
|---|---|---|---|
| 自分自身を kill (自殺) | 高 (= 作業ロスト) | 低 (除外実装) | process.pid + 祖先 pid 除外 |
| 別 AI tool を誤殺 (claude/codex/gemini) | 中 | 中 | cmdline ホワイトリスト |
| 浜田の手動 cursor を誤殺 | 中 (= 浜田作業ロスト) | 低 (対話確認) | 対話確認 + env + フラグ三重 |
| kill しても zombie として残る | 低 | 低 | SIGKILL fallback |
| 段階 2 が暴発して段階 1 まで壊れる | 高 | 低 | 機能独立 + ロールバック計画 |

## 浜田判断ポイント

実装着手時に浜田に問う:
- A. 対話確認 (`read -p`) を必須にするか / フラグ + env で十分とするか
- B. kill 範囲を「現リポジトリの cursor プロセスのみ」「全 cursor プロセス」のどちらにするか
- C. 段階 2 と段階 3 (file-watcher) のどちらを先に実装するか

## 関連リンク

- §51-3 第15章 / AGENTS.md
- TSB-017 / docs/troubleshooting.md
- L-1 実装 (段階 1) / scripts/session-lock.mjs
- K-3 future plan (段階 3 / file-watcher) / docs/plans/_future/2026-04-26-agents-md-realtime-watch.md
