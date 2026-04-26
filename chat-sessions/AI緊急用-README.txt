AI緊急用 フォルダ（Desktop）— 使い方メモ（正本はリポ chat-sessions/ 配下。本ファイルは npm run session-starter:sync-desktop でコピーされる）

【新チャットで貼るファイル（項番 -1）】
  NEW-SESSION-STARTER_yyyymmdd.txt  … yyyymmdd は JST の日付 8 桁。sync のたびにこの名前で上書きされる。
  貼付推奨ファイル名は verify:desktop-ai-emergency-sync の最後の行にも出る。

【履歴ファイル（同日にスターター内容が変わったときだけ増える）】
  NEW-SESSION-STARTER_yyyymmdd_2.txt, _3.txt … ＝直前版の退避。開くのは基本不要。

【その他の控え】
  SESSION-BOOTSTRAP-CHECKLIST.txt / HANDOFF-HUMAN.txt … リポと同名で上書き同期。

【旧名】
  NEW-SESSION-STARTER.txt（拡張子のみの名前）は廃止。残っていれば中身が古い可能性が高いので削除してよい。

【日終わり（推奨）】
  作業を閉じる前に: npm run session-starter:sync-desktop → npm run verify:desktop-ai-emergency-sync（または npm run session:bootstrap）
