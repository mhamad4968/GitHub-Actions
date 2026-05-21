【番号付き読み取りパック】AI緊急用（Desktop）同期用 — 正本はこのフォルダ（リポ）

目的
  浜田がチャットに貼る「読ませたい本文」を、**ファイル名の先頭 2 桁（00〜99）＋ハイフン**で並べ、Explorer の **名前順＝推奨読取順**にする。
  セッション終了時に `npm run session-starter:sync-desktop` を実行すると、
  **このフォルダ内の .txt** と、**先頭 2 桁が数字の `NN-*.md`**、スターター・HANDOFF 等・**`24-handoff-log.md` / `25-checkpoint-latest.md`**（リポ `chat-sessions/` 正本）・**`26-evening-reflection-SLOT.txt` または当日の `26-evening-reflection-*.md`** が Desktop へコピーされる（read-pack は **リポと同名**）。**`27-USER683-CLAUDE-RELAY-SESSION.txt`** は kintone 683 × Claude 中継用。

運用（推奨）
  1. **09〜15-READ-… は CIO が初回用に文面準備済み**（本文見出しは従来どおり **【READ-01】…【READ-07】**。**ファイル名の 15＝READ-07**＝浜田 CEO のお願い・朝イチ推奨）。浜田の追記・差し替えはそのまま上書きしてよい。
  2. チャットに貼った追加内容を、**同じ番号帯の READ-NN にリポ側で保存**する（CIO が代筆してよい）。
  3. 使わない番号は「（未使用）」1 行にしてよい。
  4. 日終わりで `npm run session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`。
  5. 新セッションでは AI に **08-INDEX** → **09〜20** → **21〜23**（儀式）→ **24〜26**（鏡・夕反省または SLOT）→ **27**（683 Claude）を **Explorer 名前順**で Read してよい（683 だけなら **27 を先に単体**でもよい。`SESSION-READ-LADDER.md` も参照）。
  6. **変更履歴**を短く知りたいときは **17-HISTORY-2026-05-06-read-pack-and-tools.txt**（以降、同日系はこのファイルに追記してよい）。

08-INDEX.txt
  各ファイルの役割を **1 行ずつ**索引化（任意追記可）。

ファイル名規則
  **`NN-` + 説明 + `.txt` / `.md`**（NN は **00〜99 のゼロ埋め 2 桁**。未満は先頭に `0` を付け、Explorer で辞書順が読取順になるようにする）。
