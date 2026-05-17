# 並列禁止・セッション分割（§51 系）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: 並列作業・session:clock  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 要約

このジャンルに属する § は、下記本文どおり `AGENTS.md` から抽出したものです。解釈の最終正本は `AGENTS.md` の同一 § です。

---

## 第15章 並列処理禁止（2026-04-23 制定 / 浜田指示 / 1 タスク 1 操作の絶対原則）

### §51 並列処理禁止 / 1 タスク 1 操作原則（最重要 / エラー特定容易性 + 見落とし防止）

**背景**: 2026-04-23 Phase W 検証で AI が「W6-W8/W11 を 1 Shell で並列確認」「W22-W25 batch」「W26-W30 batch」のように複数項目を 1 ツール call にまとめた。結果:
- ❌ grep 0 hit で `&&` chain が中断 (V2 で発生)
- ❌ 検証結果が「正常 19 / 異常 0」のように集計表示され、内訳の各項目を個別に確認しないと見落とし発生 (cve-search ❌ 過去 cron log 見落としが実例)
- ❌ エラー時にどこで失敗したか特定困難

**浜田 22:05 指示**: 「今後は確実に間違いがないように 1 つずつ処理してほしい。並列処理でエラーが出たら困る。」

**§50-3 との関係（2026-04-29 追記）**: 第14章 **§50-3** の **航海図（パイプライン）** は計画の列挙に限り、**実実行は本条（1 ターン 1 ツール call 等）に従う**。

#### 必須遵守 (Plan of Action 段階で意識)

1. **1 ターン 1 ツール call 原則**: 検証系 / 修復系 / 編集系の作業では、1 ターンに 1 つのツール call のみ実行。複数ツール call を並列で発火しない。
2. **1 Shell call 1 コマンド原則**: `&&` / `;` / `|` でコマンドを連結しない。各コマンドは独立した Shell call で実行。例外: パイプは「1 つの目的の単一処理」(`ls | head -10` 等) なら OK。
3. **1 commit 1 意味原則**: 1 commit に複数の意味的変更を混在させない (TSB-006 ガード = 5 ファイル制限とは別の概念)。

#### 例外 (並列・連結を許可するケース)

| ケース | 例 | 理由 |
|---|---|---|
| 同種・副作用ゼロ・独立操作 | `ls dir1 && ls dir2 && ls dir3` | 何が出ても他に影響しない |
| 単一目的のパイプ処理 | `cat file \| grep pattern \| head -5` | 1 コマンドの意味的単位 |
| 並列読み取り (Read 複数 / Grep 複数) | 関連ファイル群の事前一括把握時のみ | 読み取りで状態変化なし / **編集前の事前調査限定** |
| 依存関係明示 | `cd repo && git status` | ディレクトリ変更後の状態確認は 1 単位 |

#### 違反時の挙動

- 違反したターンの直後に「§51 違反: <原因> / 次から 1 つずつ実行します」と明示宣言してから次の操作に進む
- 浜田から「1 つずつ」「並列禁止」「順次」と指摘されたら、即座に手を止めて宣言から再開

#### 適用例 (2026-04-23 Phase W 反省を反映)

- ❌ NG: `cd repo && git status && npm run lint && npm run test` (4 操作連結)
- ✅ OK: 4 つの Shell call に分割 (順次 / 各々 1 コマンド)
- ❌ NG: `for f in logs/*; do grep ... ; done | wc -l` (検証 batch / 集計だけ見て内訳見落とし)
- ✅ OK: 1 ファイルずつ Shell call で grep (内訳目視 → 異常検出可能)

### §51 関連
- 浜田 2026-04-23 22:05 指示文: chat-sessions/2026-04-23.md「22:00- ルール改善 7 件」セクション
- TSB-013 v1 → v2 反省 (1 段階で確信した慢心 = 並列確認で表層治療)
- TSB-007 ep5 反省 (auto-heal 4h cron で devDeps prune を long-cycle 観察できなかった = 並列に他ステップ進めて見落とした)
- **単一エージェント・直列実行**との整合: §51 = 1 ターン 1 ツール call。複数の AI エージェントを同一タスクに並列投入しない（判断の単一性とエラー追跡性のため）。

### §51-2 浜田からの複数指示受領時の AI 対応 (2026-04-23 制定 / 浜田 22:14 指示 / 過去 2 つ指示混乱・エラー反省)

**背景**: 2026-04-23 22:14 浜田指示「**また間違えて 2 つ指示した場合はまずは 1 つ目をして 2 つめは 1 つ目が完了してから次のをしますか？と聞いてほしい。2 つ指示があり混乱してエラーで止まったことがあった認識**」。AI 側 §51 (並列禁止) は AI 操作ベースだが、**浜田からの指示受領時の対応**を明文化する必要があった。

**必須遵守**:

1. **1 メッセージ複数指示受領時の AI 動作**:
   - 1 メッセージで 2 つ以上の指示 / 質問 / 依頼を受けた場合、AI は **1 つ目だけ実施**
   - 2 つ目以降は「**1 つ目完了しました。次の○○ を進めますか？**」と確認してから進める

2. **AI 側からも浜田に複数依頼しない**:
   - §41 (一問一答) と整合 = 1 メッセージで AI 側からも 1 質問 / 1 依頼まで
   - 「**待ってる間に他の作業しても OK ですか？**」のような並行依頼禁止

3. **2 つ指示の典型例と AI 対応**:

| 浜田の発言 | AI 対応 |
|---|---|
| 「A をやって。それと B もお願い」 | A だけ実施 → 完了報告 → 「B 進めますか？」確認 |
| 「sudo apt install jq && rg お願い (1 コマンド)」 | これは 1 操作 (1 sudo) = OK / 並列ではなく依存関係明示 |
| 「F1 完了したら F2 進めて」 (シーケンス指示) | F1 → 完了報告 → 「予告通り F2 進めます」と宣言してから進める |
| 「OK だよ、どんどん進めて」 (一括 OK) | 既に承認済タスクキューを順次 1 つずつ処理 / 新規依頼が混じってない場合 OK |

**違反時 (AI が 2 つ指示を並行処理して混乱)**:
- §51 違反扱い + 即訂正
- 「§51-2 違反: 同時 2 件処理してしまいました / 1 つずつ再開します」と明示宣言

**実例 (2026-04-23 22:13-22:18 / 制定契機)**:
- ❌ NG: 私 (AI) が浜田 sudo (F5+F6) 完了待ち中に「**待ってる間に F9 事前準備しても OK ですか？**」と並行依頼 → 浜田の「2 つ指示混乱・エラー」懸念に該当
- ✅ OK (即訂正): 「F5+F6 sudo 完了報告を待つだけ / F9 はその後」と明示
- 教訓: **AI 側からも並行依頼しない / 浜田負担を最小化**

**§41 (一問一答) との関係**: §41 = AI が浜田に 1 問だけ送る原則 / **§51-2 = 浜田から複数指示受けた時に AI が 1 つずつ処理する原則** = 双方向の補完

### §51-3 並列セッション検知時の AI 動作 (2026-04-25 制定 / 浜田 11:12 「並列セッションの疑いがあれば即座に他セッションを強制的に終了するように」 / TSB-017 受け)

**背景**: 2026-04-25 TSB-017 で「別 Cursor セッションが現セッション AI の B-7 提案テキストを読み実行」した事象が発生。§51 (AI 内部の並列禁止) は遵守されていたが、**人間環境内で複数セッションが同時稼働する物理的な並列** は AGENTS.md 内に明文化されていなかった。本条で物理層の並列対応を定義する。

**仕組み (段階導入 / L-1 ~ L-6)**:

| 段階 | 機構 | AI 動作 | 状態 |
|---|---|---|---|
| 段階 1 | `scripts/session-lock.mjs` (manual lock) | 検知 = 自分側を即座に abort + 浜田に報告 (= 自衛) | **2026-04-25 実装済 (L-1)** |
| 段階 2 | `ps aux` ベースの強制 kill (`--force-kill` モード) | 検知 = 既存セッション pid を SIGTERM → SIGKILL | **設計確定 (M-series 2026-04-25 11:28): A-2 三重防御 + B-1 本リポのみ + C-2 段階 3 連携 / 実装は 5/10 future plan (L-6) / 浜田 GO 必須** |
| 段階 3 | リアルタイム file watcher (AGENTS.md 等 5 憲法ファイル / SHA256) | working tree 変化 = jsonl 記録 + grace 外は stderr ベル | **2026-04-25 実装済 (K-3 / `scripts/file-watcher.mjs` 拡張 + S16 稼働確認)** |

**遵守事項 (現行 = 段階 1)**:

1. **作業開始時**: AGENTS.md / RULES-INDEX.md / WORKFLOW.md など憲法系ファイルを編集する前に `node scripts/session-lock.mjs acquire --manual --holder=<task-id>` を実行
2. **acquire 失敗時 (exit=2)**: 別セッション稼働中の疑い = **自分側を即座に abort** + 浜田に「並列セッション検知。既存 holder=<X> です」と報告
3. **編集中**: lock を維持したまま作業 (manual mode = pid 死亡判定なし / release されるまで他者をブロック)
4. **作業完了時**: `node scripts/session-lock.mjs release` で lock 解放 + commit + push 後に他セッションを許可
5. **不審な兆候 (lock なしでも)**: AGENTS.md の mtime が予期せず更新 / `.b7-pre`等の不審な backup file 出現 / smoke-test の予期せぬ warn = **§51-3 警報** として浜田に報告

**段階 2 (強制終了モード) の適用条件 (浜田 GO 確定 2026-04-25 11:28 / 実装は 5/10 予定)**:

- **A-2 三重防御**: `--force-kill` フラグ + `SESSION_LOCK_FORCE_KILL=1` env + 対話確認 (`read -p "kill pid=X holder=Y? (yes/no): "`) すべて満たした時のみ kill 実行
- **B-1 本リポ限定**: `/proc/<pid>/cwd` で対象が `kintone-ai-lab` 配下の cursor プロセスのみ kill (他プロジェクトの cursor / claude / codex / gemini は誤殺禁止)
- **C-2 段階 3 連携**: 段階 3 (K-3 file-watcher) が並列疑い検知時に対話プロンプトで段階 2 を呼び出す統合形 (= 段階 2 単独実行はサポートしない設計)
- kill 前に必ず lock holder 情報 + ps aux 出力を `logs/parallel-kills/YYYY-MM-DD-HHMM.json` に記録
- 自殺 (= 自分自身を kill) を防ぐため `process.pid` + 全祖先 pid を除外
- 実装順序 (浜田 11:28 「ABC の順で進めて」): A 三重防御 → B cwd 判定 → C 段階 3 連携

**反パターン**:

- ❌ lock を取らずに AGENTS.md を直接編集する (= TSB-017 再発リスク)
- ❌ 段階 1 の検知時に作業強行する (= 自衛 abort 必須)
- ❌ 段階 2 を浜田 GO なしで実装する (誤殺リスク / 段階導入を省略しない)

**実例 (2026-04-25 11:15 / 本条制定契機)**:

- TSB-017: 別 Cursor セッションが現セッション AI の B-7 提案を勝手に実行 → §51 並列禁止違反として記録
- 浜田 11:12 指示で本条制定 + `scripts/session-lock.mjs` 実装 (L-1)
- 段階 2 強制終了モードは L-6 future plan として起票 (浜田 GO 必須)

**§51 / §47-E との関係**: §51 = AI 内部の並列禁止 / §51-3 = 物理セッション間の並列検知 + 自衛 / §47-E = 浜田の憲法違反指示の却下 = **三層防御** (内部 / 物理 / 規範)

### §51-4 並列セッション疑いの 4 軸機械判定（2026-04-26 P4 制定 / TSB-017 + P3 観察知見の規範化）

**背景**: 2026-04-26 P3 (K-3 ログ観察) で、現状 §51-3 段階 1-3 は「lock 取得時に検知」「watcher で記録」までは整備済だが、**「複数の証拠から並列セッションを疑う閾値判定」が AI 個別判断に委ねられている** ことが判明。本条で **4 軸 + スコアリング** による機械的判定を規範化し、`scripts/parallel-session-detector.mjs` で実装する。

**4 軸 (各軸に重み付き点数)**:

| # | 軸 | 観測対象 | 検知トリガー | 重み | 真陽性度 |
|---|---|---|---|---|---|
| 軸 1 | **watcher_pid 不一致** | `logs/file-watcher/agents-md-changes.jsonl` | 1 ファイル内に 2 つ以上の watcher_pid 値が出現 | **+5** | ⭐ 最高 (= 別 file-watcher = 別セッション物理証拠) |
| 軸 2 | **同一ファイル過密編集** | 同上 jsonl | 同一 file が **5 分以内に 5 件以上** 変化記録 | **+2** | 中 (= AI 連続編集でも発生し得るため警告レベル) |
| 軸 3 | **session-lock 不在編集** | `logs/session-lock.log` + jsonl | jsonl に変更記録があるが対応する lock acquire ログが直近 10 分以内に存在しない | **+3** | 高 (= L-1 規約違反 = 怠慢 or 別セッション) |
| 軸 4 | **不審なバックアップ命名** | working tree 直下の dotfile / hidden | `.b7-pre-*` / `.tsb-*-pre-*` / `.proposal-pre-*` / `.session-handoff-*` 等が意図せず出現 | **+4** | 高 (= TSB-017 で発覚した別 AI による「私の手順を文字通り実行」パターン) |

**判定閾値**:

| 合計スコア | 判定 | AI 動作 |
|---|---|---|
| 0-2 点 | 🟢 静穏 | 通常運用継続 |
| 3-4 点 | 🟡 注意 | 朝報 §5-5 に「⚠️ 並列セッション疑い (N 点 / 内訳: 軸 X)」を追記 / AI 開口一番に「§51-4 注意レベル」を報告 |
| 5-6 点 | 🟠 警報 | **作業を中断** + 浜田に「§51-4 警報。詳細を logs/parallel-suspicion/<時刻>.json に記録しました。続行可否ご判断を」と GO 待ち |
| 7 点以上 | 🔴 確定 | **即座に session-lock を release + 自分側 abort** (= §51-3 段階 1 自衛発動) + 浜田に強い警告 + 段階 2 (force kill) 適用候補として L-6 リストへ追加 |

**実装**: `scripts/parallel-session-detector.mjs`

```
$ node scripts/parallel-session-detector.mjs           # 標準実行 (テキスト出力)
$ node scripts/parallel-session-detector.mjs --json    # 朝報・smoke-test 統合用
$ node scripts/parallel-session-detector.mjs --explain # 軸ごとの内訳を詳細表示
```

**False Positive 抑制 (= 真の並列でない時に騒がない仕組み)**:

1. **軸 2 (過密編集)**: 私自身の連続編集を誤検知しないため、**同一 watcher_pid 内の編集** はスコア対象外
2. **軸 3 (lock 不在)**: 読取専用セッション (= 何も編集しない情報収集セッション) は判定スコープ外
3. **軸 4 (不審 backup)**: 既知の合法 backup pattern (`*.bak.<timestamp>` 等) は除外リスト化
4. **直近 10 分の grace period**: 起動直後の watcher 自体の grace と整合
5. **手動上書き**: `--ignore-suspicion=<reason>` フラグで誤検知を一時的に skip + reason を `logs/parallel-suspicion/false-positive.jsonl` に記録 (5/10 月次レビューで誤検知パターンを学習)

**統合ポイント**:

- `scripts/daily-morning-prep.mjs §5-5`: 朝報生成時に detector を呼び出し、3 点以上なら ⚠️ 表示
- `scripts/smoke-test.mjs`: 第 8 検査として detector 結果を表示 (5/10 月次レビュー後に組み込む / 当面は手動実行のみ)
- `scripts/health-check.mjs S18 候補`: 月次レビューで実装判断

**§51 / §51-3 / §51-4 の関係**:

- **§51** = AI 内部の並列禁止 (= 1 セッション内での parallel tool 実行禁止)
- **§51-3** = 物理セッション間の並列検知 + 自衛 (= lock 機構 / file-watcher / 段階導入)
- **§51-4** = 物理並列の **判定基準の機械化** (= 4 軸スコアリング / detector script)
- **§47-E** = 浜田の憲法違反指示の即却下 (= ルール優先性)
- **四層防御** (内部 / 物理検知 / 物理判定 / 規範却下)

**反パターン**:

- ❌ detector 出力を読まずに作業継続する (= 警報無視)
- ❌ false positive と決めつけて `--ignore-suspicion` を乱用する (= 月次レビュー時に履歴で発覚)
- ❌ 5 点以上を浜田 GO なしで「自分で大丈夫と判断」して続行する (= §47-E 違反)

**実例 (本条の制定契機)**:

- TSB-017 (2026-04-25): 別セッション AI が `.b7-pre-` を作成 + AGENTS.md / RULES-INDEX.md 連動編集 → 軸 1 (watcher_pid 不一致) + 軸 4 (.b7-pre-) で **+9 点 = 確定** だった蓋然性大 (当時 detector 未実装で気付くまで 30 分以上)
- P3 観察 (2026-04-26): 私の連続 commit (N→O→Q1→P1) で軸 2 (過密編集) +2 点のみ = 静穏判定 (= false positive を出さず正しく動作する見込み)

### §51-5 並列セッション疑い時のログ保全（P4 制定）

**目的**: 検知時のスナップショット保全 → 月次レビューでの誤検知 / 真陽性パターン学習 + フォレンジック証拠保全。

**保存先**: `logs/parallel-suspicion/YYYY-MM-DD-HHMM-<score>.json`

**スキーマ**:

```json
{
  "detected_at": "2026-04-26T08:30:00+09:00",
  "score_total": 7,
  "verdict": "RED_CONFIRMED",
  "axis_breakdown": {
    "axis1_watcher_pid_mismatch": { "score": 5, "evidence": ["pid=212 (24 件)", "pid=8765 (1 件)"] },
    "axis2_burst_edit": { "score": 2, "evidence": ["AGENTS.md 7 件 / 4 分間"] },
    "axis3_no_lock": { "score": 0, "evidence": [] },
    "axis4_suspicious_backup": { "score": 0, "evidence": [] }
  },
  "ai_action": "session-lock release + abort + 浜田報告",
  "snapshot": {
    "agents_md_sha256": "...",
    "session_lock_holder": "P4-...",
    "running_pids": ["..."],
    "recent_commits": ["..."]
  },
  "follow_up": "L-6 段階 2 force kill 適用候補リストに追加"
}
```

### §51-6 セッション分割推奨（2026-04-26 P5-5 制定 / S4 / コンテキスト累積によるトークン浪費抑制）

**背景**: 2026-04-26 P5-5 観察で「session を区切らずに長時間継続するとコンテキストが累積し、AGENTS.md (約 90KB) + 過去 tool call 全文が毎ターン注入される → API token 消費が指数的に増大」が判明 (= F-13 / API 12 日完全枯渇の主因の 1 つ)。本節で **session 分割の推奨タイミング** を規範化する (= §51 並列禁止と矛盾しない時間軸分割)。

**推奨される分割タイミング**:

| 区切り | 推奨時刻 (JST) | 理由 |
|---|---|---|
| **朝セッション** | 06:00-10:00 | 朝のブリーフィング §0-§5 / 当日の計画立案 / 軽微な lint・refactor |
| **昼セッション** | 12:30-17:00 | 重い設計タスク (Max Thinking 領域 / PC 台帳 deploy 等 / TSB 起票) |
| **夜セッション** | 19:00-22:00 | 一日の振り返り / Lessons Learned 蓄積 / 翌日プラン |

各区切りで **新規 chat session** を立ち上げ、`chat-sessions/NEW-SESSION-STARTER.md` で文脈復元する (= 同 1 セッション内では tool call 履歴が累積し続けるため)。

**遵守事項**:

1. **同一セッションが 4 時間 / 200 tool call を超えたら**、AI から「§51-6 推奨: ここで一度区切り、新セッションで再開しませんか?」と提案
2. **重い設計タスクの直前** (= Max Thinking 領域に入る直前): 軽い文脈なら継続でよいが、事前作業で長くなった場合は新セッション推奨
3. **PC 台帳 Day N など不可逆操作の直前**: 必ず新セッション (= コンテキスト累積に紛れた誤解で本番に影響しないため)
4. **新セッション開始時**: NEW-SESSION-STARTER.md + `chat-sessions/checkpoint-latest.md` を必ず読み、文脈復元してから着手
5. **本題スイッチ（2026-04-29 / 迷走防止）**: セッション切替後の **追加 Read** は、`checkpoint-latest.md` **「セッション切替後の自律復元」項番 5** に従い、**項番 -0 で合意した本題**（部署予実 vs 新・PC台帳等）に対応する正本だけを読む。**部署予実のみ**のときに PC 台帳 Day4・§4.2・フェーズ 1b を一括で読む必要はない（逆も同様）。詳細は `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1c / 1b**。
6. **セッション切替直後の壁時計・WEB（2026-04-29 / 浜田 CIO 運用）**: **新規 chat session**（朝・昼・夜の帯切替、浜田の手動切替、§51-6-2 命令後の再起動を含む）において、AI が **シェルツールを使える最初のタイミング**で **`npm run session:clock:set` を必ず実行する**（`sessionStart` hook が先に `開始:` を更新していても **冪等に再実行してよい**。実行後 **`SESSION-CLOCK.md` の `開始:` 1 行をチャットに短く報告**する）。続けて **`npm run session:clock:web` をバックグラウンドで起動**し、ターミナルに出た **`[session-clock-web] 開く: http://127.0.0.1:…` のフル URL をチャットへ転記**し、浜田に **ブラウザで当該 URL を開く**よう促す（ローカルループバックのみ。**毎回ターミナルが示した URL を開く**／前回ブックマークのポートに固執しない — 詳細は `SESSION-SPLIT-REMINDER.md`）。**開発・コマンド実行は AI、目視の最終確認は浜田**（§35-1 / §56-1a）は不変。実行順序の正本は `NEW-SESSION-STARTER.md`（項番 0 前後で矛盾しないよう同期する）。
7. **セッション終了時の壁時計停止（2026-05-04）**: 浜田が「**壁時計を止めて**」「**今日の作業を閉じる**」等と言ったとき、または **同一チャットの締め**で明示されたとき、AI は **`npm run session:clock:clear`** を実行する（`chat-sessions/SESSION-CLOCK.md` の **`開始:` を `未設定` に戻す**＝§51-6-2 の時間軸チェックは **未検査**扱い。**次の新チャット**では従来どおり **`npm run session:clock:set`** から再開）。**`session:clock:web`** を動かしているターミナルは **Ctrl+C** で停止する（プロセス残留時は `SESSION-SPLIT-REMINDER.md` のトラブル節）。

**§51-3 並列禁止との関係**:

- §51-3 = **同時刻に複数セッション稼働は禁止** (= 物理並列 = TSB-017 リスク)
- §51-6 = **時間軸で分割は推奨** (= 1 つずつ順次 = コンテキスト累積回避)
- 両者は補完関係にある (= 並列はダメだが時間軸分割はむしろ推奨)

**反パターン**:

- ❌ 朝から夜まで 1 セッションで 8 時間継続 (= コンテキスト累積で API 過剰消費 / F-13 観察済)
- ❌ 区切らずに「あと 1 タスクだけ」と惰性継続 → 結局 4-6 時間連続
- ❌ 区切りを取らない理由として「文脈が消えるのが面倒」と続ける (= NEW-SESSION-STARTER.md で復元可能)

**実例 (本節の制定契機)**:

- 2026-04-26 04:00 朝 - 09:50 まで同一セッションで連続 6 時間稼働 (Composer 2 fallback / R1 物理ブロック / R2 .cursorignore / P5-3 / P5-4 / P5-5 / 等 多数連続)
- API 系統が 4/15-4/26 の 12 日で 100% 枯渇 (= 通常の 2.5 倍速)
- セッション分割を取り入れていれば API 消費 30-50% 削減できた可能性

#### §51-6-2 AI 自律セッション切り命令権（2026-04-26 R-4 制定 / 浜田 10:30 指示「セッションを切ることは重要 / 命令指示権限を与える」/ 提案 → 命令への昇格）

**背景**: 2026-04-26 P5-5 後の浜田指示「セッションをきることは重要なことです。こちらの対応は提案ではなくて、必ず行うように命令指示をする権限をあなたに与えます。」を受け、§51-6 の **「AI から提案」を「AI 命令」に昇格** する権限を AI に付与する。これにより AI 自身が token 浪費を能動的に抑制できる構造を制定する。

**§51-6 との違い**:

| 項目 | §51-6 (旧 / 提案) | §51-6-2 (新 / 命令) |
|---|---|---|
| AI 言葉遣い | 「区切りませんか?」 | **「§51-6-2 適用: 本セッションをここで区切ります」** |
| 浜田の選択 | 拒否可能 (継続容認) | **拒否は §47-D 矛盾指示として AI が再却下** |
| 実行責任 | 浜田が判断 | **浜田が新セッションを開く義務** |
| 例外 | なし | **浜田の「もう少し続けて」明示要求は 1 回まで容認** (= §1-2 例外規定 ① 準拠) |

**AI 自律発動条件 (いずれか 1 つで命令発動)**:

1. **時間軸**: 同一セッション 4 時間経過
2. **tool call 軸**: 200 回経過
3. **タスク軸**: 重い設計タスク (Max Thinking 領域) が完了した直後
4. **コスト軸**: 当該セッション中の On-Demand $ が前セッションの 2 倍超 (推定)
5. **危険軸**: PC 台帳 Day N など **Tier B / 不可逆操作の直前** (= 必ず新セッションで文脈をリセット)
6. **API 軸**: API 系統が 100% 単独到達 (= §1-2-2 連動 / Composer 2 fallback リスク回避)

**命令の発動手順 (AI 側)**:

1. 上記いずれかが満たされた瞬間、AI は次の文言で命令を発動:
   ```
   [§51-6-2 命令発動]
   発動条件: <該当条件>
   理由: <具体的根拠 (例: 経過 4h12m / tool call 218 回 / On-Demand +$8 / 等)>
   命令: 本セッションをここで区切ります。新セッションを開き、
         chat-sessions/NEW-SESSION-STARTER.md を読んでから再開してください。
   引き継ぎ: <次セッションへの To-Do 3-5 項目を箇条書き>
   ```
2. 引き継ぎ内容を **`chat-sessions/checkpoint-latest.md` に追記** (§42-2 連動)
3. 浜田が「もう少し続けて」と明示要求 → **1 回まで容認** + 次の発動条件で必ず命令再発動
4. **次セッション側**: 浜田が新チャットを開いたら、当該チャットの AI は **§51-6 遵守事項 5**（`session:clock:set` 必須 + `session:clock:web` による URL 提示とブラウザ開示の促し）を **初手で実行する**（引き継ぎ本文とあわせて忘れない）

**反パターン (本節で禁止)**:

- ❌ 発動条件を満たしているのに「あと 1 タスクだけ」と惰性継続 (= §51-6 推奨レベルでも禁止 / §51-6-2 制定で命令違反)
- ❌ 命令発動時に「分割提案」など弱い言葉に置換える (= 命令権の自己放棄)
- ❌ 浜田の「もう少し続けて」を 2 回連続で容認する (= §1-2 例外規定の濫用)

**§47-D / §47-E との関係**:

- 浜田が §51-6-2 命令を「却下する」と言った場合 → 1 回目は §1-2 例外として容認 / 2 回目は §47-D 矛盾指示として AI が逆却下 (= 「§51-6-2 命令権付与 と却下指示は矛盾するため、後者を §47-D により却下します」)
- これは浜田の長期利益 (token 節約 / コンテキスト鮮度) を AI が代理保護する構造

---

## 付則

- 本ファイルの変更はユーザーの承認を得てから行う
- 既存の `.cursorrules` および `.cursor/rules/*.mdc` との矛盾が生じた場合、本ファイル（AGENTS.md）を優先する
- 制定日: 2026-04-14
- 改訂日: 2026-04-15（v2: §13-§15 新設、§ 番号振替、法体系図を `persist-policies.mdc` に追記）
- 改訂日: 2026-04-15（v3: 第8章 WEB フロントエンド品質 §26-§30 を新設）
- 改訂日: 2026-04-15（v4: 第9章 §31 納品プロトコル新設、server.mjs v3.0 RFC 5987 日本語ファイル名復活）
- 改訂日: 2026-04-15（v5: 第10章 §32 図解義務化・§33 外部知見検証を新設。mermaid MCP 追加）
- 改訂日: 2026-04-16（§31 に運用ガイドの Kintone 自動反映 `ops-guide:publish` を追記）
- 改訂日: 2026-04-16（第11章 §35 自律型フルオートメーション・§36 デュアルラン・§37 簡潔報告を追記）
- 改訂日: 2026-04-16（v7: §35 に役割分担・深慮即行を追加。§37 を常時適用に強化。全ルールの体系整理完了）
- 改訂日: 2026-04-16（v8: §14 強化「治っていない時は同じ方法を3回繰り返さず必ず代替案を提示」、§33 強化「実装前に MCP/Web で事前調査義務（最低3ステップ）」を制定。今回の iframe 改修教訓を反映）
- 改訂日: 2026-04-16（v8: §38 ツール・依存関係の自律保守義務を新設）
- 改訂日: 2026-04-17（v9: §39 発言前の日時確認を最重要ルールとして新設、§34-1 を強化）
- 改訂日: 2026-04-18（v10: §41 一問一答ルール新設。ユーザーへの確認・依頼は 1 メッセージ 1 問、ターン制、最小ステップ明示を義務化）
- 改訂日: 2026-04-18（v11-v13: 第12章 セッション運用 OS 新設。§42 セッション冒頭の過去ログ確認義務 / §43 WORKFLOW.md 遵守義務 / §44 夕反省サイクル）
- 改訂日: 2026-04-19（v14: §45 タスク完遂義務新設。優先 0-6 / 完遂判定 ABC）
- 改訂日: 2026-04-19（v15-v16: §46 朝ルーチン絶対優先義務新設。Phase 0-4 / 「健康じゃないといい仕事ができない」哲学 / ユーザー新規依頼より上位）
- 改訂日: 2026-04-19（v17: 第13章 思考の三本柱 §47-§49 新設。§47 Professional Critique / §48 Best Options / §49 Proactive Insight）
- 改訂日: 2026-04-19（**緊急復元**: 09:02 の謎 wipe で本ファイル v10 までに巻き戻された §42-§49 を AI セッションコンテキストから復元。原因究明と再発防止は別タスクで対応予定）
- 改訂日: 2026-04-24（v18: 第16章 自律レベル制 §52 R10 新設。Tier A 自律実行型 / Tier B 承認待ちキュー型 / 自己診断 5 問 / 例外規定。浜田指示「基本は自律 / 確認だけが理想 / リスクあるものは夜の反省会で承諾」反映）
- 改訂日: 2026-04-24（[FEAT] v19: 第18章 自己統治能力 §54 R12 新設。§54-1 意味論的バージョニング (BREAKING/FEAT/FIX ラベル必須 + 3 質問判定フローチャート) + §54-2 Negative Log (棄却案永続化) 浜田 20:13 提案 + レビュー 5 件反映）
- 改訂日: 2026-04-24（[FEAT] v20: 第19章 §55 R13 異常時セーフモード。浜田 #2 GO / Tier A 縮小 + §52-6 合成但書 + 読取・診断継続 + 解除は手動 health-check 必須（cron のみ禁止）/ §42-2-7 を §55 へ委譲）
- 改訂日: 2026-04-25（[FEAT] v21: 第20章 §56 R14 責任の所在 (RACI) + 朝ブリーフィング §55/autonomy スキャン連動 / 浜田 D1–P1 一括承認バッチ）
- 改訂日: 2026-04-25（[BREAKING] v22: 旧第17章（§53 / 第二意見・別モデル常時起動）撤去。§52 Tier A は §52-3 自己診断のみで判定。§54-2 はメイン AI 記録に統一。§54-5 外部 AI 月次審査は任意化。索引・スクリプト整合。）
- 改訂日: 2026-04-25（[FEAT] v23: §1-2 モデル前提 — Cursor 作業を **Claude Opus 4.7 単一モデル固定**（別モデル切替・常時サブエージェント禁止の例外は §1-2 限定）。§42-2-6 と整合。v23 編集時に誤って末尾へ混入した旧第17章断片は再削除済み。）
- 改訂日: 2026-04-25 09:00（[FIX] v23.1: 7:24 commit `6bac959` (§35-5 task-log 制定) で誤って末尾に再追加されていた旧第17章 (§53 第二意見系 296 行) を H-2 タスクで発見 → 完全削除。AGENTS.md は 2005 行 → 1709 行に縮小（5月目標 #6「1700 行以下」を 9 行差まで前倒し達成）。audit-rules: 破断リンクなし / §53 定義消失確認。audit-tsb-confirmed: カバレッジ 94% 維持。事故詳細は TSB-016 に記録。再発防止: H-2 改善案 #20「post-BREAKING-commit ハッシュ検証 hook」を 5/22 リファクタで実装検討。）
- 改訂日: 2026-04-25 10:58（[FEAT] v23.2 / K-1: 第13章 §47-D「矛盾指示の却下義務」新設。短時間内の矛盾指示を AI が自律判断で却下する義務化。浜田 10:57「矛盾があるので却下しますでいいよ。叱ってほしい」明示要求を反映。）
- 改訂日: 2026-04-25 11:15（[FEAT] v23.3 / L-2: 第13章 §47-E「憲法違反指示の即却下義務」新設 + 第15章 §51-3「並列セッション検知時の AI 動作」新設。浜田 11:12「ルール = 憲法なので、私がルールと違う場合も同様に却下してほしい / 並列セッションの疑いがあれば即座に他セッションを強制的に終了するように」を反映。`scripts/session-lock.mjs` 段階 1 (manual lock + 自衛 abort) 実装済 (L-1)。段階 2 (強制終了モード) は L-6 future plan として起票予定。TSB-017 (別 Cursor セッションの §51 違反) を構造的に防御。）
- 改訂日: 2026-04-25 11:28（[FIX] v23.4 / M-series: §51-3 段階 2 (force-kill モード) 設計確定。浜田 GO: A-2 三重防御 (--force-kill フラグ + SESSION_LOCK_FORCE_KILL=1 env + 対話確認 read -p) / B-1 本リポのみ (/proc/<pid>/cwd 判定) / C-2 段階 3 連携 (= 段階 3 file-watcher から段階 2 を呼び出す統合形 / 段階 2 単独実行はサポートしない)。実装順序 ABC。実装は 5/10 (L-6 future plan)。）
- 改訂日: 2026-04-25 11:35（[FEAT] v23.5 / K-3: §51-3 段階 3 実装（憲法 5 ファイル SHA256 リアルタイム監視 / `scripts/file-watcher.mjs` + `agents-md-changes.jsonl`）。§42-2-2 に K-3 補完を追記。health-check S16 + smoke-test 第 7 検査 (`rule-watcher-status.mjs` / 未稼働は warn)。朝ブリーフィング 5-5 に過去 24h 集計。浜田 GO: K-3 本日前倒し着手。）
- 改訂日: 2026-04-26 06:35（[FEAT] v23.6 / N-2: 第21章 §57「憲法改定プロセス」新設（案 1 / 浜田朝ブリーフィング 06:33 GO）。§47-E から `§57 改定プロセスに移行します` 参照のみ存在し本体未定義 → audit-rules 破断リンク 1 件 を 0 件に解消。§54-1（ラベル）と §57（手順）の役割分担を表で明記。§57-1〜§57-9: 提起→起案→ラベル決定→適用（並列禁止 / ファイル編集順序）→検証（audit-rules + audit-tsb + verify-breaking + audit-xref + health-check + smoke-test）→周知→meta→記録様式→§47-E/§47-D/§51/§54-2 接続。RULES-INDEX.md §N チェックリスト + 「📜 憲法改定プロセス」表を追記。npm scripts に `audit:rules` / `health-check` / `smoke-test` 別名追加（§57-5 検証コマンドの正規化）。）
- 改訂日: 2026-04-26 06:42（[FEAT] v23.7 / N-3: §1-2-2「API 制限到達時の自動フォールバック禁止」新設（浜田朝指示「Switched to Composer 2 after reaching API limit. を改善したい」反映）。Cursor IDE 側の Opus → Composer/Sonnet silent fallback を §1-2 違反として構造的禁止。IDE 設定 5 項目（Auto / Auto-fallback / Use Auto on limits / 有効モデル一覧 / Background agents）を必須状態表で明記。AI 検知時動作（§47-E 連動）: 即時中断 → 浜田へ「§1-2-2 違反検知」報告 → GO 待ち。TSB-018 起票。RULES-INDEX.md §1-2 行を §1-2-2 まで拡張、§N チェックリストに §1-2 / §1-2-2 を追加。）
- 改訂日: 2026-04-26 07:05（[FEAT] v23.8 / N-4+N-5+N-6 / O-series: 浜田「甲：フル実装」承認 → §1-2-2 N-4 強化（4 択 A-D 提示の枠組み + §1-2-2-1 Cursor IDE 必須設定 = On-Demand ON + Spend Cap $130）+ §1-2-3 N-5 新設「Opus 内モデル使い分け」（Max Thinking vs Extra High / 既定は Extra High / Max Thinking 切替の証跡義務）+ §1-2-4 N-6 新設「クレジット予算管理」（月予算 $200+$130 / 1 日 1 回 % 貼付フロー / 70-85-95% 自発警告 / `scripts/credit-budget.mjs` + `data/credit-usage.json` + `daily-morning-prep.mjs §0` 統合 / AI と浜田の役割分担表）。Ultra プラン枯渇傾向の構造的対策完了。RULES-INDEX.md / NEW-SESSION-STARTER.md v3.3 / CURSOR-トラブル対応メモ.md v2.3 / 浜田 Desktop AI緊急用 同期。）
- 改訂日: 2026-04-26 07:55（[FEAT] v23.9 / Q1: §1-2-2-1 を 4 → 8 項目に拡張 + 第18章 §52-8「高リスク shell 暴走防止」新設。発端 = §1-2-2-1 検証中に浜田スクショで Cursor IDE Settings → Agents タブ `Auto-Run Mode = Run Everything (Unsandboxed)` + `Browser Protection: OFF` + `MCP Tools Protection: OFF` 三重 OFF を発見 → §52 RACI Tier B が IDE レベルで構造的 bypass される憲法違反級の silent breach（kintone 本番 API も承認なし執行可能だった）。浜田暫定対処 = Auto-Run Mode 維持（基本自律）+ Browser/MCP Protection ON（kintone MCP 経由ゲート復活 / Cap は $300 のまま 5/14 に $130 へ）。§1-2-2-1 拡張: A 課金 (On-Demand mode + Monthly Limit) / B Models (有効モデル一覧 + Add 操作) / C Agents (Auto-Run + Browser + MCP Protection) / D Cloud Agents 不使用注記。§52-8 新設: rm -rf / git push --force / npm install (新規) / chmod -R / sudo / .env 編集 等を「事前報告 → GO 待ち」必須化（読取系・既知 npm スクリプト・git 安全コマンドは例外）。TSB-019 起票。）
- 改訂日: 2026-04-26 08:10（[FIX] v23.10 / P1: `scripts/credit-budget.mjs` の JST 化（off-by-one バグ修正）+ `data/credit-usage.json` を git 追跡化。発端 = O-series で UTC 基準 `toISOString()` を使ったため JST 0:00-8:59 の記録が前日として保存されるバグ（実例: 2026-04-26 07:16 JST の浜田報告が `2026-04-25` として記録）。修正: 全日付計算を JST (UTC+9) 基準に統一する `todayJstIso() / nowJstIso() / dateToJstIsoDate() / jstIsoDateToDate() / jstDateAtMidnight()` ヘルパー導入。`recorded_at` が `+09:00` 付き ISO 8601 に。既存データも修正（4/25→4/26 / current_period_start 4/13→4/14）。AGENTS.md §1-2-4 末尾に「タイムゾーン」節追記。`reset --day=` の正しい usage 例も訂正（誤: `--reset-day=` / 正: `npm run credit:reset -- --day=14`）。`data/credit-usage.json` を git tracked にし、複数セッション間でも継続性が保たれるように。）
- 改訂日: 2026-04-26 08:25（[FEAT] v23.11 / P4: 第15章 §51-4「並列セッション疑いの 4 軸機械判定」+ §51-5「並列セッション疑い時のログ保全」新設。発端 = TSB-017 (別 Cursor セッションが現セッションの提案を勝手に実行) + P3 K-3 ログ観察で「現状は AI 個別判断頼み」と判明。実装: `scripts/parallel-session-detector.mjs` (4 軸 = ① watcher_pid 不一致 +5 / ② 同一ファイル 5 分以内 5+ 件編集 +2 / ③ session-lock 不在編集 +3 / ④ 不審バックアップ +4 / 閾値 = 0-2 静穏 / 3-4 注意 / 5-6 警報 / 7+ 確定)。`scripts/daily-morning-prep.mjs §5-5` に detector 結果統合 / `smoke-test.mjs` 第 8 検査として組込 (3-4 点 = warn / 5+ 点 = ng)。npm scripts: `audit:parallel` / `audit:parallel:json` / `audit:parallel:explain` 追加。誤検知抑止: `--ignore-suspicion=<reason>` で `logs/parallel-suspicion/false-positive.jsonl` に履歴化。RULES-INDEX.md 同期。smoke-test 8/8 グリーン確認。）
- 改訂日: 2026-04-26 08:45（[FEAT] v23.12 / P5-1 / R1: 第18章 §52-8-1「物理 block 層」新設 = TSB-019 構造的根本対策。`~/.cursor/hooks.json` に `beforeShellExecution` フックを追加、`~/.cursor/hooks/dangerous-shell-blocker.sh` で §52-8 deny カテゴリを物理 block (exit 2 + JSON deny)。三層防御アーキテクチャ確定: 第 1 層 AI 自己制約 (§52-8) + 第 2 層 IDE 承認ゲート (§1-2-2-1 #6/#7) + **第 3 層 OS 物理 block (§52-8-1)**。Hooks 自身の改ざん防止も deny pattern に追加で物理層自己保全。設計仕様書 `docs/cursor-hooks-design.md` 新規 (hooks.json 全文 / blocker.sh 全文 / 検証ログ 11 件 / 復旧手順)。検証: 単独テスト 10/10 グリーン + Cursor IDE Shell ツール経由 `rm -rf /tmp/<not-exist>` 実証 = `Rejected: Command execution was blocked by a hook` 確認。残構造的盲点: StrReplace 経由の hooks 改ざんは hook 対象外 → §52-8 第 1 層 AI 自己制約で「hooks 編集前は浜田 GO 必須」を内在化。浜田 P5-1 で R1 GO 取得済。）
- 改訂日: 2026-04-26 08:55（[FEAT] v23.13 / P5-2 / R2: `.cursorignore` 新設（86 行 / 5 カテゴリ = 秘密情報 + 大量自動生成 + バックアップ + parallel-suspicion + 一時ファイル）。Cursor IDE のセマンティック検索 / @ メンション補完から `.env` / `data/credit-usage.json` / `logs/file-watcher/*.jsonl` / `*.bak` 等を除外。設計方針 = source code/docs/scripts/tests は絶対 ignore しない（浜田指示「インデックス範囲変更で見落としないように」反映）。同時に **§52-8-1 物理 block hook の誤検知 1 件発覚 → 浜田 GO で即修正**: regex `(>|>>|tee)[[:space:]]+.*\.env` の `.* ` が heredoc 本文の `.env` 文字列にマッチ → `[^[:space:]<>&|;]*` で第 1 トークンに制約 + `sed -i` 系も AND 条件で分割。回帰テスト 14/14 グリーン (T2-T15) で誤検知解消 + 既存検知維持を確認。`docs/cursor-hooks-design.md` §11.5 に修正履歴記録。）
- 改訂日: 2026-04-26 09:55（[FEAT] v23.14 / P5-5: §1-2-3-1「AI 自己宣言義務」新設 + §1-2-4 改定 (3 系統対応 + 80% 警告 + Spending スクショ確認 必須化 + Monthly Limit $130 → $1000 引上げ反映) + §51-6「セッション分割推奨」新設。発端 = P5-5 (Plan & Usage タブ監査) で 3 重大発見: F-11 (Cursor IDE 側に 70/85/95% 警告 UI なし → AI 側で完全カバー必須) + F-12 (On-Demand $235.94/$300 で残 20 日 = 4/29-5/3 突破見込み → 浜田 GO で $1000 引上げ + S1-S5 節約パッケージ全実施) + F-13 (API token 16.7M を 12 日完全枯渇 = TSB-018 根本原因 / §1-2-3 形骸化)。改定: §1-2-3-1 = タスク冒頭で AI が `[§1-2-3 ティア判定: Extra High/Max Thinking]` を 1 行宣言義務化 (= 形骸化対策)。§1-2-4 = 月次予算表 $200+$1000 (Worst $1200/¥186,000 / 節約後見込 $430-500/¥66,000-78,000) + 朝の Spending スクショ抽出 4 値 (Total% / API% / On-Demand $ / Monthly Limit) + 3 系統閾値 (70/80/85/95%) + API 系統 100% 単独到達時の特例 (Composer 2 fallback トリガ = §1-2-2 検知挙動連動)。§51-6 = session 朝 (06-10) / 昼 (12:30-17) / 夜 (19-22) 区切り推奨 + 4h/200 tool call で AI 提案 + PC 台帳など不可逆操作直前は必ず新セッション + §51-3 並列禁止と補完関係 (時間軸分割は推奨)。TSB-021 候補起票: credit-budget.mjs に On-Demand 取得機能追加 (Day 5-6)。logs/autonomy-decisions/P5-5-plan-usage-2026-04-26.md 記録。S1-S5 節約パッケージ = S1 (ルーチン Composer 2 許容) + S2 (CLAUDE.md 整理) + S3 (Extra High 既定徹底) + S4 (session 区切り) + S5 (.cursorignore 強化)。）
- 改訂日: 2026-04-26 10:13（[FEAT] v23.15 / S2 / B+: CLAUDE.md thin 化 (480 行 / 54.6 KB → 73 行 / 4.15 KB / **92.4% 削減**) + `.cursorignore` に CLAUDE.md 追加 (Cursor index 完全遮断)。発端 = P5-5 / F-13 (API 12 日枯渇) 教訓で AI 推奨 B+ を浜田承認。CLAUDE.md は元々 Claude Code (ターミナル CLI) 用だが Cursor Composer はそもそも本ファイルを読まず AGENTS.md を正本とする → semantic search で引かれると 1 ヒット ~13K tokens 浪費 → AGENTS.md に主要内容統合済を理由に thin 化 (旧版自己保護条項 line 176「統合後に箇条書きで復元できる粒度を維持」準拠)。残置内容 = Cursor/Claude Code 利用判断 + Implementation Starter コピペ + Schema Retrieval Priority Strict + 行末コード保持原則 (TSB-018 教訓) + 黄金のサイクル 4 ステップ骨子 + 関連ファイル索引。削除内容は全て AGENTS.md §X-Y 参照リンクへ置換。旧版復元 = `git log --follow CLAUDE.md` から commit 046ec2d 以前を取得可能。検証: smoke-test 8/8 グリーン (37s) / verify:breaking 396ms pass (削除検知ガードもクリア) / scripts (health-check / wipe-guard / verify-breaking / file-watcher) 全て健全。削減効果見込: 1 セッション ~13K → ~700 tokens (94%) / 月 ~369K tokens 節約。commit `046ec2d` でリリース。）
- 改訂日: 2026-04-26 10:30（[FEAT] v23.16 / R-3 / P5-5 後続: §1-2 改定「単一モデル」→「**最適モデル原則 / Opus 4.7 デフォルト枠**」+ §1-2-3-2 新設「**AI 自律モデル選択原則**」(3 段階 L1 Composer 2 / L2 Extra High / L3 Max Thinking)。発端 = 浜田 10:22 指示「使うモデルは一番最適な方法で行ってほしい。絶対にこのモデルを使うというこだわりはしない。適時 AI 側で判断してほしい」+ Billing スクショで F-14 確定 (Max Thinking が API 消費の 59.4% / Extra High 40.8% / Composer 2 等 0.6% = §1-2-3-1 自己宣言だけでは抑制不足)。改定: (1) §1-2 = 「Opus 統一」を旧 / 「最適モデル」を新と明記 + 「こだわらない」の意味を 3 行で具体化。 (2) §1-2-1 = 表に Composer 2 を Cursor IDE 側で ON する旨追記 (silent fallback と区別する根拠としてティア宣言を併用)。 (3) §1-2-3-2 = 3 段階適用条件表 + 1 秒判定フロー (単純→L1 / 不可逆→L3 / 既定→L2) + 安全弁 (不可逆操作は L3 強制 / 迷ったら L2 / 途中昇格 OK / silent fallback とは区別) + 運用例 6 件 (commit→L1 / smoke-test 確認→L1 / .cursorignore 追記→L1 / 監査続き→L2 / Day 4 deploy→L3 / §57 起案→L3) + 期待効果 (Max Thinking 59.4%→20-30% / Composer 2 0.6%→30-40% / token 1/2-1/3) + 反パターン 3 件。RULES-INDEX.md / NEW-SESSION-STARTER.md / CURSOR-トラブル対応メモ.md / .rag/extra-docs / Desktop AI緊急用 同期予定。F-14〜F-16 を P5-5 ログ追記。）
- 改訂日: 2026-04-26 10:35（[FEAT] v23.17 / R-4 + R-5 / 浜田 10:30 指示「セッションを切ることは重要 / 命令指示権限を与える」+「ミスや発見があれば即座にこちらに確認しないで進めてよい」を反映。**R-4: §51-6-2 新設 = AI 自律セッション切り命令権** (§51-6 の「提案」を「命令」に昇格 / 6 つの自律発動条件 = 4h / 200 tool call / 重作業完了直後 / コスト 2x / Tier B 直前 / API 100% / 浜田却下時は §47-D 矛盾指示で逆却下 / 引き継ぎを checkpoint-latest.md へ追記義務)。**R-5: §52-9 新設 = Tier A 範囲ミス発見時の自律修正権** (§52-4 Conservative Default の能動的反対側補完 / 適用範囲表 4 項 + 絶対対象外表 5 項 + 実行手順 5 ステップ + 完了報告必須様式 + logs/autonomy-decisions/auto-fix-*.md 事後トレース義務 / Tier B / §52-8 / §57 / scope 外 / Cursor IDE 設定変更 は適用外維持)。+ PC 台帳 Day 4 時刻変更 13:00 → **20:00** (浜田提案 / 重要案件中の慎重進行優先 / §51-6 夜セッション帯と整合 / chat-sessions/2026-04-26-pc-ledger-day4.md / docs/plans/2026-04-26-pc-ledger-day4-action.md / todo P2 同期)。AGENTS.md 2493 → 2609 行 (+116)。RULES-INDEX.md / NEW-SESSION-STARTER.md / CURSOR-トラブル対応メモ.md / .rag/extra-docs / Desktop AI緊急用 同期同 commit。）
- 改訂日: 2026-04-26（[FEAT] v23.18: 浜田宣言「**開発は AI・確認は浜田**」を憲法級で固定。**§35-1** を「変更禁止」明記 + **§56-1a** 新設（§35 と同義の二重表記・逆転禁止）。§52 Tier B（浜田 GO 後のコマンド実行は AI）と両立を §35-1 に記載。RULES-INDEX.md 同期。）
- 改訂日: 2026-04-26（[FEAT] v23.19: セッション引き継ぎ後の **全棚卸し** を制度化。`chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md`（経緯・法律相当・ルール・npm 機能・MCP・必須機械検証・報告様式）+ `npm run session:bootstrap`（`smoke:quiet` ラッパー）+ `checkpoint-latest` / `RULES-INDEX` / `NEW-SESSION-STARTER` v3.14 / `session-handoff.mdc` 同期。浜田「引き継いだら全部確認してほしい／切替後安心できない」対応。）
- 改訂日: 2026-04-29（[FEAT] v23.22: 第14章 **§50-3 CTO運用規定** 新設＝浜田合意版（コスト削減・自律稼働・安全性）。PlanB（次の 1 出力のみ／~1k tok または ~1,500〜2,000 字・複数ファイル大規模／§41）/ **航海図と §51 実行の分離** / **CEO による航海図差し替え**（§50-3-3）/ 安価 MCP 試行上限（3 回または累計 5 分）→ Opus 切替 / MCP 送信サニタイズ / 「憲法適合済み」は検収コマンド併記 / 解釈競合は §41 で CEO 相談（§50-3-7）。**§1-2-4 連動**で課金レーン分離を明記。第15章 §51 に **§50-3 との関係** 1 段落追記。`.cursorrules` に憲法・§50-3 優先の 1 行。RULES-INDEX.md 同期。）
- 改訂日: 2026-04-29（[FEAT] v23.23: **§1-2-3-3 CIO によるモデル最終判断**（浜田 CIO＝未指定時は §1-2-3-1/2、明示時は CIO 優先／§35-1 不変）。**§51-6 遵守事項 5**＝セッション切替直後の **`session:clock:set` 必須**＋**`session:clock:web` で URL をチャットに転記し浜田にブラウザで開くよう促す**。§51-6-2 に次セッション初手での同条項実行を追記。`NEW-SESSION-STARTER.md` / `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md` / RULES-INDEX 同期。）
- 改訂日: 2026-04-29（[FEAT] v23.24: **§50-3-8 盲点・セカンドオピニオン（DeepSeek）固定運用**。予実管理・計算ロジック・複雑な kintone カスタマイズ着手直前の **DeepSeek-V3 への 3 点盲点抽出（型 / SPEC 乖離 / 差異ロジック継承）** と、CIO による **正本突合・約 3 行の突合メモ** チャット記録を義務化。§50-3-4/5/51・プラン B との接続を明記。RULES-INDEX §N チェックリストに §50-3-8 追加。`.rag/extra-docs` 同期。）
- 改訂日: 2026-04-30（[FEAT] v23.25: **§50-3-9 kintone MCP の自律的フォールバック**（浜田合意）。構造エラー時は同一 kintone MCP を再試行しない／通信エラーは 1 回のみ再試行し失敗時は即 REST へ／検知ターン先頭で「MCP エラーにより REST 手順へ移行」を明記／(a) `scripts/` 検証済みパターン改修 (b) `scripts/tmp-kintone-*.mjs` とタスク完了時の削除または正規名昇格＋**証跡（チャット or handoff 1 行）**／**期待値の言語化**（「今夜中」に依存せずタスク単位で完遂）。**§50-3-2** に航海図への手段(第2)併記義務を接続。§50-3 関連に §50-3-9 を追加。RULES-INDEX §N チェックリスト・`NEW-SESSION-STARTER.md` v3.33 同期。`checkpoint-latest.md` **航海図テンプレ**・`SESSION-BOOTSTRAP-CHECKLIST.md` 1c・`2026-04-26-pc-ledger-day4-action.md` §50-3-9 補足。`.rag/extra-docs/AGENTS.md` 同期。）
- 改訂日: 2026-05-02（[FEAT] v23.26 / §57-10 I案: **インフラ運用条項**（浜田チャット GO）。RAG 正本 4 ファイルの `.rag/extra-docs` ミラー＝`scripts/rag-mirror-canonical-docs.mjs`・`npm run rag:mirror:canonical-docs` / `verify:rag-mirror-canonical`・`verify:agent-env` 連鎖追加。post-commit を `scripts/git-hook-post-commit.mjs` に集約し `npm run hooks:install` を Node コピー方式に統一（Windows spawn 対策）。`docs/github-branch-protection.md` 新設。`logs/autonomy-decisions/rule-amendment-2026-05-02-57-10-i.md`。RULES-INDEX §N チェックリストに §57-10。）
- 改訂日: 2026-05-03（[FEAT] v23.27: **§11-6 他系統 AI への検証依頼**（浜田指示）。**CIO（浜田）の最終検収・目視は不変**のまま、**MCP 等の別系統 AI へ査読・チェックリスト意見を依頼し要約を報告に添える**ことを義務化（C=Consulted、A の代替禁止・§18 秘密非露出）。**§56-1a** に同趣旨の補足。RULES-INDEX §N 一覧・MCP 節表に **§11-6** 追記。）
- 改訂日: 2026-05-04（[FEAT] v23.28: **§35-6 セッション成果物の削除と「古い」整理のゲート**（Desktop 日報消失反省／浜田指示で日報 §5 から正本へ昇格）。独断削除禁止・正本は `chat-sessions/`＋コミット・Desktop は sync 控え／§41・§50-3-8 連動・手順に復元経路がある掃除のみ自律可。`RULES-INDEX.md` §35 行・§N 一覧に **§35-6**。**`NEW-SESSION-STARTER.md`** 憲法級ブロック直後に短文化。締め 1 本化は **`SESSION-CLOSE-REPORT_yyyymmdd.txt`** と双方向参照。`.rag/extra-docs/AGENTS.md` 同期。）
- 改訂日: 2026-05-04（[FEAT] v23.31: **§35-6 追補**（`AI緊急用` Desktop 直書き→リポ即反映＋sync／副次リポの `git status` 義務）／**§50-3-8 補足**（超軽微タスクで DeepSeek 省略可だが **`§50-3-8 スキップ理由:` 1 行必須**）／**§51-6 遵守事項 7**（**`npm run session:clock:clear`** で壁時計停止）／**`NEW-SESSION-STARTER`** 手順 **2b**（任意 `SESSION-CLOSE` Read）／**read-pack READ-01**・**SESSION-SPLIT-REMINDER**・**RULES-INDEX**・**verify-constitution-handoff** needles 同期。）
- 改訂日: 2026-05-04（[FEAT] v23.29: **§35-6 の機械検証＋TSB-031** — `verify-constitution-handoff.mjs` に `AGENTS`／スターター／bootstrap／**TSB-031 本文**／`constitution-handoff-gate.mdc`／`checkpoint-latest.md` needles 追加。**`docs/troubleshooting.md` TSB-031** 新設（目次表・集計更新）。**`SESSION-BOOTSTRAP-CHECKLIST.md`** フェーズ 2 に §35-6 チェック。**read-pack `03-READ-01.txt`**・**`SESSION-SPLIT-REMINDER.md`**・**`HANDOFF-HUMAN.txt`** 運用追補。**`RULES-INDEX.md`** TSB-031 索引 1 行。`.rag/extra-docs` は `npm run rag:mirror:canonical-docs` で同期。）
- 改訂日: 2026-05-04（[FEAT] v23.30: **§50-3-2a MDD 語彙の憲法一次定義** — 「MDD」＝航海図（Goal/Constraints/Acceptance）＋SPEC/md 正本＋領域別 §10.5/§11 を **AGENTS 本文で明示**。`.cursorrules` C 節・`RULES-INDEX`・予実 **B-MDFLOW** メモと相互参照。scaffold 未整備は **B-MDFLOW** に残し、既存 `rag:mirror` で不足を補う旨を記載。`.rag/extra-docs` は mirror で同期。）
- 改訂日: 2026-05-05（[FEAT] v23.32: **§35-7 チャット上 CIO の規律先行**（本体 AI が実装より先に憲法 3 分・§50-3-8／スキップ理由・🎖️・デプロイ前 1 行・締め自己評価をチャットに残す。CIO≠省ゲート最速）。**`chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md`** 新設＝引き継ぎ 5 ブロック索引。`read-pack/02-INDEX.txt`・`03-READ-01.txt`・`NEW-SESSION-STARTER.md` バージョン行・`checkpoint-latest.md`・`constitution-handoff-gate.mdc` へ相互参照。）
- 改訂日: 2026-05-05（[FEAT] v23.33: **§35-7 追補** — **`deploy:674` の preflight 機械ゲート**（45 分以内スタンプ・`SKIP_CIO_DEPLOY_GUARD` 緊急脱出）＋**`.cursor/rules/cio-discipline-always.mdc`（`alwaysApply: false` + `globs`）**。`npm run cio:preflight:674`・`scripts/cio-preflight-stamp.mjs` / `cio-deploy-preflight-guard.mjs`。`package.json` の `deploy:674` 連鎖更新。）
- 改訂日: 2026-05-06（[FEAT] v23.34: **§35-7 拡張** — **全 customize `deploy:*`（594/595/626/627/629/671/674/677/678/679）へ同一 preflight ゲート**横展開。`cio-preflight-stamp.mjs` に **`--with-git-diff-line`**（任意・`git diff --shortstat HEAD` 1 行を `gitDiffLine` に記録）。）
- 改訂日: 2026-05-07（[FEAT] v23.35: **Desktop「AI緊急用」00〜24 連番詰め** — スターター分割 **`01`〜`06`-STARTER-…txt**、HANDOFF 等 **07/17/18/19**、read-pack **08〜23**、夕反省 **24**。`session-starter:sync-desktop` が旧 **00p**・**02〜14 帯**・**13-README**・**14-evening-** を Desktop から削除。`verify-desktop-ai-emergency-sync`／`verify-constitution-handoff`／checkpoint／read-pack 本文の相互参照を整合。）
- 改訂日: 2026-05-09（[FEAT] v23.36 相当: read-pack **17〜20**（HISTORY／重要確認／1 本報告／報告チェック）＋儀式 **21〜23**（bootstrap／HANDOFF 人間／README）へ再採番。旧 **20〜23** 名は `LEGACY_DESKTOP_AI_EMERGENCY_FILES` で prune。）
- 改訂日: 2026-05-10（[FEAT] Desktop「AI緊急用」**鏡 24/25・夕反省 26**: **`25-handoff`→`24-handoff`**、**`26-checkpoint`→`25-checkpoint`**、**`24-evening`→`26-evening`**。夕反省無し日の Explorer **欠番 24** を解消。`SESSION_DESKTOP_MIRROR_FILES`・sync・verify・prune・`08-INDEX` を整合。）

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| Cursor 常時 | `.cursor/rules/cio-constitution.mdc` |
| 手順 | `WORKFLOW.md` |

