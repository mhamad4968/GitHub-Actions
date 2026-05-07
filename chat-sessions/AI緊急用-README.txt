AI緊急用 フォルダ（Desktop）— 使い方メモ（正本はリポ `chat-sessions/` 配下。`npm run session-starter:sync-desktop` で **`19-AI緊急用-README.txt`** 名でコピーされる）

【新チャットで貼るファイル（項番 -1）】
  00-NEW-SESSION-STARTER_yyyymmdd.txt … **ハブ（短縮版）**。yyyymmdd は JST の日付 8 桁。sync のたびにこの名前で上書きされる。
  貼付推奨ファイル名は `verify:desktop-ai-emergency-sync` の最後の行にも出る。
  01〜06-STARTER-part-*.txt … **スターター詳細 6 分割**（憲法・手順・フル版相当・チェックリスト等）。浜田は任意で開く。AI はチャットにハブだけでも **Part A→F をリポ側で順 Read**（運用はハブ内表記）。

【履歴ファイル（同日にスターター内容が変わったときだけ増える）】
  00-NEW-SESSION-STARTER_yyyymmdd_2.txt, _3.txt … ＝直前版の退避。開くのは基本不要。

【その他の控え（ファイル名先頭が読取順・抜けなし）】
  07-HANDOFF-AI-FIVE-BLOCKS.md / 17-SESSION-BOOTSTRAP-CHECKLIST.txt / 18-HANDOFF-HUMAN.txt … リポと同名で上書き同期。
  24-evening-reflection-YYYY-MM-DD.md … **当日 JST** の夕反省 `docs/reports/YYYY-MM-DD-evening-reflection.md` がリポにあるときだけ sync でコピー。無い日はスキップ。

【番号付き読み取り（浜田貼付の控え・read-pack）】
  08-INDEX.txt … 索引（**読取順の正本**）。続けて 09-READ-01.txt … 15-READ-07.txt（**本文見出しは READ-01〜READ-07 のまま**。**15＝浜田 CEO のお願い**＋ツール憲法 §6）/ 16-README-read-pack.txt / 20-HISTORY-… / 21-重要確認.txt / 22-SESSION-ONE-REPORT-…md / 23-SESSION-REPORT-CHECKLIST.txt … **リポ `chat-sessions/desktop-ai-emergency-read-pack/` と同名**。
  セッション終了時: `npm run session-starter:sync-desktop` で本フォルダへコピー。`verify:desktop-ai-emergency-sync` でバイト一致確認。
  運用の細目: **08-INDEX.txt** と **16-README-read-pack.txt** を参照。

【個人メモ（運用対象外）】
  **`memo（削除禁止）/`** … **浜田個人メモ**。read-pack・sync・番号付けの **対象外**（AI は触らない）。

【旧名（移行）】
  `NEW-SESSION-STARTER_yyyymmdd.txt`（**00-** なし）・**00p01〜00p06**・**02〜14 番号帯**の read-pack／**13-README.txt**／**14-evening-…** は廃止。sync の prune で削除される。

【日終わり（推奨）】
  作業を閉じる前に: `npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync`（または `npm run session:bootstrap`）
