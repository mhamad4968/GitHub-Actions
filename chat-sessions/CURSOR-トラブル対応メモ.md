# Cursor トラブル対応メモ

> **目的**: 困った時にこの 1 ファイルだけ見れば対処できるよう、最低限の手順を集約。
> **正本**: `kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md`
> **Windows メモ帳版**: `C:\Claudeとの会話メモ\CURSOR-トラブル対応メモ.txt`
> **濱田のクイックアクセス**: `C:\Users\mhamada202408224\Desktop\AI緊急用\` （デスクトップ常駐・2026-04-19 整備）
> **更新日**: 2026-04-19

困ったら上から順に試す。それでもダメなら AI に状況を伝える。

---

## ① まず現状確認（30 秒）

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run guard:check
```

- 全 21 ファイル ✅ + MCP 全件 ✅ なら問題なし
- 何か ❌ や 0 byte があれば自動復元される

---

## ② 「Request blocked by Anthropic」+ Undo All が出た

⚠ **一番危険なパターン（TSB-006 の真犯人）**

| やること | 詳細 |
|---|---|
| ❌ Undo All を押さない | 被害が広がる可能性 |
| ✅ Review で内容確認 | 何を変更しようとしてたか把握 |
| ✅ エラー画面のスクショ保存 | Request ID が原因究明の決定打 |
| ✅ `npm run guard:check` | 被害確認（file-watcher が自動復元してるはず） |

リクエストが多すぎたとき → AI に「**ファイル数を分けて 5 個ずつ実行して**」と頼む

---

## ③ MCP が赤い（rag / accessibility-scanner 等）

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run guard:check
```

→ MCP 全 16 件 ✅ になってるか確認

- それでも Cursor UI が赤い → **Cursor 再起動**（接続キャッシュが古い）
- 再起動しても赤い → AI に「**rag MCP が赤い、絶対パス確認して**」と頼む

---

## ④ ファイルが消えた / 0 byte 化

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run restore:wiped
```

→ 自動で復元される（emergency-backup から）

ダメなら:
```bash
git status                  # 消えたファイル確認
git restore <ファイルパス>   # git から復元
```

最終手段: AI に「**○○ファイルが消えた、復元して**」と頼む

---

## ⑤ 新しいチャットを開いた / 文脈が分からなくなった

`C:\Claudeとの会話メモ\NEW-SESSION-STARTER.txt` を開いて中身（フル版）を新チャットに**コピペするだけ**。

→ AI が文脈・関係性・優先順位を全部復元する

---

## ⑥ Cursor が固まった / 動かない

1. 該当のチャットウィンドウを閉じる
2. Cursor アプリを再起動（タスクトレイから完全終了 → 再起動）
3. 新チャット起動 + NEW-SESSION-STARTER.txt を貼る

---

## ⑦ AI が「忘れた？」みたいな反応をした

新チャットに以下をそのまま貼る:

```text
§42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と
直近の chat-sessions/<日付>.md を即座に Read して、
過去ログ確認の宣言を 1 行出してから本題に戻って。
```

---

## ⑧ 何かおかしいけど何が起きてるか分からない

AI にこう聞く:

```text
状況を整理して。何が起きてる？必要なら npm run guard:check も走らせて。
```

→ AI が状況を診断して報告

---

## 自動で守ってくれてる仕組み（覚えなくて OK）

| 仕組み | 役割 |
|---|---|
| `file-watcher` | 重要 23 ファイルを 24 時間監視・5 秒で自動復元 |
| `wipe-guard` | 15 分ごとに健康チェック + 自動復元 |
| `emergency-mirror` | 4 時間ごとに `~/.cursor-emergency-backup/` にコピー |
| `watchdog` | file-watcher が死んだら 5 分以内に再起動 |
| `@reboot` | WSL 再起動時に file-watcher を自動起動 |
| **git** | 復旧コミット (`WIPE-RECOVERY-20260419-0902` タグ) で全部戻せる |

→ ユーザーが何もしなくても**多重防衛**が効いてる

---

## 関連ファイル

- 詳細手順: `kintone-ai-lab/docs/troubleshooting.md` TSB-006
- リカバリ運用: `kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md`
- 開発憲法: `kintone-ai-lab/AGENTS.md`
- 復元プロトコル: `kintone-ai-lab/docs/agent-restore-checkpoint.md`
