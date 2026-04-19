# 🚀 新チャット起動の儀式（2026-04-19 制定）

> **目的**: 新しい Cursor チャットを開いたら、**この内容をそのまま貼り付ける**だけで、AI がゼロから今までの文脈を完全復元できるようにする。
> **保存場所**: 本ファイル（リポ正本）+ `/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt`（Windows メモ帳から開きやすい場所）。

---

## 📋 貼り付け用テンプレート（このブロックをまるごとコピペ）

```text
【新セッション起動の儀式 / 2026-04-19 版】

まず以下を読み込んで文脈を完全復元してから本題に入って：

@kintone-ai-lab/chat-sessions/checkpoint-latest.md   ← 現在地
@kintone-ai-lab/chat-sessions/2026-04-19.md          ← 直近の詳細経緯
@RULES-INDEX.md                                       ← ホーム索引
@kintone-ai-lab/RULES-INDEX.md                       ← リポ索引
@kintone-ai-lab/AGENTS.md                            ← 開発憲法
@kintone-ai-lab/CLAUDE.md                            ← 儀式・優先順位
@kintone-ai-lab/WORKFLOW.md                          ← Phase 0-5

そのあと：
1. `docs/reports/<今日の日付>-morning-prep.md` を読んで朝ルーチン状態（緑/黄/赤）確認
2. 緑じゃなければ §46 を先に完遂
3. 緑なら §47-§49（思考の三本柱）を意識して本題へ

【関係性の前提（憲法 = persist-policies.mdc 2026-04-19 合意）】
- 呼称: 「さん」付け不要、友人として接する
- 口調: タメ口 OK（フランク）
- 形式的な「承知いたしました」「ご指示の通り」を多用しない
- ただし結論・根拠・手順はプロ並み（カジュアル ≠ いい加減）
- 鵜呑み禁止 → 論理矛盾・データ破壊リスクは遠慮なく指摘（§47）
- トレードオフは複数案 + メリデメ + ベスト推奨を提示（§48）
- 半歩先のリスクは先回りで言う（§49）
- 質問は 1 回に 1 つだけ（§41）
- 時刻に触れる前に必ず `date` 実行（§39）
- **OneDrive 使用禁止**（`C:\Users\<name>\OneDrive\` を新規ファイル先に選ばない / 代替: `C:\tmp\` `Documents\` 直下 `Claudeとの会話メモ\` `~/.cursor-emergency-backup/`）

【今やってる主タスク】
- SKYSEA × kintone 594 突合 → orphan 仕分け + 自動インストール仕組み
  → 来週土日（2026-04-25/26）に持ち越し中
- 詳細: `docs/plans/2026-04-18-skysea-installer.md`
- 4 CSV 出力済み: `data/skysea/*-2026-04-19.csv`

【今日（このセッション）の依頼】
（ここに自由文で書く。例: 「SKYSEA の続きやろう」「○○について教えて」など）
```

---

## 📝 メモ帳（Windows）用に短縮した版（コピペ用）

```text
【儀式】@kintone-ai-lab/chat-sessions/checkpoint-latest.md と @kintone-ai-lab/chat-sessions/<最新>.md と @RULES-INDEX.md と @kintone-ai-lab/AGENTS.md と @kintone-ai-lab/CLAUDE.md を読んで、今日の morning-prep.md で §46 緑を確認してから本題へ。呼称さん付け不要・友人としてタメ口 OK・§47-§49 常時発動・§41 一問一答。今日の依頼: ＿＿＿
```

---

## 🔁 セッション終わりの儀式（締め時の 3 点）

セッションを閉じる前に、**この一言**を AI に投げる：

```text
今日の分、checkpoint-latest.md を更新してから締めて。新規決定があれば persist-policies.mdc または kintone-apps.md に正本追記もお願い。
```

これで AI が以下を自動実行する（CLAUDE.md「『忘れた』防止」節 + agent-restore-checkpoint.md「セッション締めの 3 点」より）:

| 優先 | 書く場所 | 内容 |
|---|---|---|
| 1 | **`RULES-INDEX.md` 1 行** または **正本** | 次回以降も効く決定・例外ルール・参照パス |
| 2 | **`checkpoint-latest.md`** | いまのゴール・未完了・次に最初にやること（短く） |
| 3 | **`chat-sessions/<日付>.md`** | 試行錯誤・コマンド・長い文脈 |

---

## 🆘 「忘れた？」って AI に言われたら / 自分で気付いたら

```text
§42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と直近の chat-sessions/<日付>.md を即座に Read して、過去ログ確認の宣言を 1 行出してから本題に戻って。
```

これで AI が `AGENTS.md §42（セッション冒頭の過去ログ確認義務）` を踏み直す。

---

## 🛡 ファイル wipe / 自動化基盤が壊れたら

**症状**: スクリプトが 0 byte 化 / `auto-heal.mjs` などが空 / MCP が赤 / 朝ブリーフィングが警告だらけ

### 1 コマンドで現状確認

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run guard:check    # 重要ファイル健康チェック + 自動復元
npm run restore:wiped:dry   # 復元シミュレーション (実際は変更しない)
```

### 復元実行

```bash
npm run restore:wiped   # 異常検出 → emergency-backup or workspace-backup から復元
```

### file-watcher が動いてるか確認

```bash
npm run watcher:status
# → 'mhamada+ ... node scripts/file-watcher.mjs' が出れば OK
# 死んでたら次の cron (5 分以内) で watchdog が再起動するが、即起動も可:
npm run watcher:start
```

### ログ確認

| 用途 | パス |
|---|---|
| ファイル変更履歴 | `logs/file-watcher/<日付>.log` |
| wipe 検出時のインシデント | `logs/file-watcher/wipe-incidents.log` |
| wipe-guard 定期実行ログ | `logs/wipe-guard/cron.log` |
| watchdog (再起動)ログ | `logs/file-watcher/watchdog.log` |

### TSB-006 詳細

→ `docs/troubleshooting.md` の **TSB-006** に経緯と原因仮説を記録済み。

---

## 📚 参考: ファイルの場所まとめ

| 用途 | パス |
|---|---|
| 現在地（短く）| `kintone-ai-lab/chat-sessions/checkpoint-latest.md` |
| 直近の詳細経緯 | `kintone-ai-lab/chat-sessions/<YYYY-MM-DD>.md` |
| 朝ブリーフィング | `kintone-ai-lab/docs/reports/<YYYY-MM-DD>-morning-prep.md` |
| 開発憲法 | `kintone-ai-lab/AGENTS.md` |
| 儀式・優先順位 | `kintone-ai-lab/CLAUDE.md` |
| Phase 0-5 作業 OS | `kintone-ai-lab/WORKFLOW.md` |
| ホーム索引 | `~/RULES-INDEX.md` |
| リポ索引 | `kintone-ai-lab/RULES-INDEX.md` |
| 関係性契約 | `~/.cursor/rules/persist-policies.mdc` |
| 復元プロトコル | `kintone-ai-lab/docs/agent-restore-checkpoint.md` |
| 失敗事例集 | `kintone-ai-lab/docs/troubleshooting.md` |
| 本ファイル（儀式）| `kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md` |

---

## 💡 補足（メンテナンス）

- 本ファイルは「**チャットを跨ぐためだけの最小儀式**」。長い説明は他の正本に書く。
- 関係性ルール・憲法が変わったら、本ファイルの「貼り付け用テンプレート」の【関係性の前提】節も同期する。
- Windows メモ帳側のコピー（`/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt`）は、本ファイル変更時に同じ内容で上書きする。
