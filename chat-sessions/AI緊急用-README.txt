AI緊急用 フォルダ（Desktop）— 使い方メモ（正本はリポ `chat-sessions/` 配下。`npm run session-starter:sync-desktop` で **`23-AI緊急用-README.txt`** 名でコピーされる）

【CIO／Agent — Auto-Run／ターミナル承認（2026-05-11 CEO／CIO 更新）】
（**CIO の自律判断・インフラは提案止まりにしない**等の CEO 短冊は Desktop **`＃重要確認事項.txt`** の **「CIO の自律判断」** 節を正本。MCP 名チェックはリポ **`npm run verify:cio-mcp-registry`**、疎通は **`npm run cio:mcp:env`** — **日常は Windows ネイティブで実行して `SUMMARY: OK 6/6` を正**、WSL `/mnt/c/...` は月次ベストエフォート／kimi のみ落ちるときは **`CIO_MCP_PROBE_KIMI_TIMEOUT_MS`** とネット。詳細 **`docs/mcp-status.md` §CIO**。）
0. **CIO 自律パス（UI の最後の一手をファイルで補完）**: `%APPDATA%\Cursor\User\globalStorage\state.vscdb` の `ItemTable` キー **`src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser`** 内 JSON の **`composerState.yoloEnableRunEverything`** を **`true`** にする作業は、リポ **`scripts/apply_cursor_run_everything_state_vscdb.py`** で実施する（**実行前にバックアップ**・**Cursor 完全終了推奨**・失敗時はバックアップから `state.vscdb` を戻す）。**製品 UI（Ctrl+Shift+J → Agents）と矛盾した場合は UI を正**とする。
1. **`permissions.json`（ファイル・CIO）**: [Cursor `permissions.json` 公式](https://cursor.com/docs/reference/permissions) に従う。**重要（2026-05-11 UI 実測）**: Agents の文言 **`Run Everything is disabled while that file defines allowlists`** は、**`mcpAllowlist` だけが残っていても**「allowlists を定義している」とみなし、**Run Everything が出ない**ことがある（公式の「MCP のみなら terminal は IDE」とズレる）。**CIO v9**: **`%USERPROFILE%\.cursor\permissions.json` を退避バックアップのうえでファイルごと削除**し、allowlist を **IDE 側**に戻す（旧 MCP 一覧は **`%USERPROFILE%\.cursor\permissions.backup-20260511-v8-mcp-only.json`**）。復旧はその JSON を `permissions.json` に戻すだけ。
2. **浜田操作（必須・IDE 側）**: **（1）の保存後、Cursor を再起動** → **`Ctrl+Shift+J` → Agents** で **「Run Everything」**（または製品が提示する **最大の自動実行**）を **必ず選択**（**Use Allowlist のまま空リスト放置厳禁**・逆効果で毎回 Run 化）。併せて **Composer パネル（歯車等）の Auto-run 系トグル**をオン。※**Ask Every Time** では **`terminalAllowlist` は参照されにくく毎回 Run 化しやすい**（公式どおり）。
3. **リスク（憲法と併記）**: **Run Everything**（製品が提示する場合）は **任意シェルが無確認で実行されうる**。**§52-8-1 物理 block**・**Browser / MCP Tools Protection ON**（TSB-019 教訓）は **別層で維持**すること。
4. **運用推奨（CIO）**: JST 1 行は **`npm run time:jst`**。コマンドは **`npm run …` / `node scripts/…`** に寄せる（超長い `node -e` は Run が出やすい）。
5. **Desktop はワークスペース外**のため、**`%USERPROFILE%\.cursor\sandbox.json`** と **リポ `.cursor/sandbox.json`** の **`additionalReadonlyPaths`** に **`…/Desktop/AI緊急用`** と **`…/Desktop`**（WSL なら **`/mnt/c/...`** 併記）を入れておくと一覧しやすい（**強い自動実行を併用する場合はサンドボックス境界を再確認**）。
6. **Windows ネイティブ Node（`/mnt/c` なし）**: **`npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync`** は、**`SESSION_STARTER_DESKTOP_DIR` 未設定でも** `%USERPROFILE%\Desktop\AI緊急用`（および **OneDrive 配下の Desktop**・**`%PUBLIC%\Desktop`** 等の既定候補）を **自動検出**する（2026-05-16 CIO）。**`verify:desktop-ai-emergency-sync`** は **read-pack（`desktop-ai-emergency-read-pack` の .txt と `NN-*.md`）もバイト一致**まで検査する（2026-05-16 追補）。**任意パス**を使うときだけ **`SESSION_STARTER_DESKTOP_DIR`** に **`…\Desktop\AI緊急用`** の **絶対パス**をセット（**Desktop／デスクトップ直下の「AI緊急用」のみ**許可・実装は `scripts/lib/session-starter-desktop-dir.mjs`）。

【新チャットで貼るファイル（項番 -1）】

  00-NEW-SESSION-STARTER_yyyymmdd.txt … **ハブ（短縮版）**。yyyymmdd は JST の日付 8 桁。sync のたびにこの名前で上書きされる。

  貼付推奨ファイル名は `verify:desktop-ai-emergency-sync` の最後の行にも出る。

  01〜06-STARTER-part-*.txt … **スターター詳細 6 分割**（憲法・手順・フル版相当・チェックリスト等）。浜田は任意で開く。AI はチャットにハブだけでも **Part A→F をリポ側で順 Read**（運用はハブ内表記）。



【履歴ファイル（同日にスターター内容が変わったときだけ増える）】

  00-NEW-SESSION-STARTER_yyyymmdd_2.txt, _3.txt … ＝直前版の退避。開くのは基本不要。



【その他の控え（ファイル名先頭が読取順・抜けなし）】

  07-HANDOFF-AI-FIVE-BLOCKS.md / 21-SESSION-BOOTSTRAP-CHECKLIST.txt / 22-HANDOFF-HUMAN.txt … リポと同名で上書き同期。

  24-handoff-log.md / 25-checkpoint-latest.md … リポ **`chat-sessions/handoff-log.md`** と **`chat-sessions/checkpoint-latest.md`** を **常に**同名バイトで Desktop へ同期（verify も検査）。

  26-evening-reflection-YYYY-MM-DD.md … **当日 JST** の夕反省 `docs/reports/YYYY-MM-DD-evening-reflection.md` がリポにあるときだけ sync でコピー。無い日は **24〜25 のみ**（Explorer で歯抜けなし）。



【番号付き読み取り（浜田貼付の控え・read-pack）】

  08-INDEX.txt … 索引（**読取順の正本**）。続けて 09-READ-01.txt … 15-READ-07.txt（**本文見出しは READ-01〜READ-07 のまま**。**15＝浜田 CEO のお願い**＋ツール憲法 §6）/ 16-README-read-pack.txt / 17-HISTORY-… / 18-重要確認.txt / 19-SESSION-ONE-REPORT-…md / 20-SESSION-REPORT-CHECKLIST.txt … **リポ `chat-sessions/desktop-ai-emergency-read-pack/` と同名**。**27-USER683-CLAUDE-RELAY-SESSION.txt** … **kintone 683 × Claude 中継**（セッション切替後の最短手順・同 read-pack）。

  セッション終了時: `npm run session-starter:sync-desktop` で本フォルダへコピー。`verify:desktop-ai-emergency-sync` でバイト一致確認。

  運用の細目: **08-INDEX.txt**（**番号が増えた・細分化したらここを先に更新**）と **16-README-read-pack.txt** を参照。**21〜23** は read-pack 外のリポ正本から同名コピー（Explorer では **20 の直後**）。



【個人メモ（運用対象外）】

  **`memo（削除禁止）/`** … **浜田個人メモ**。read-pack・sync・番号付けの **対象外**（AI は触らない）。



【旧名（移行）】

  `NEW-SESSION-STARTER_yyyymmdd.txt`（**00-** なし）・**00p01〜00p06**・**02〜14 番号帯**の read-pack／**13-README.txt**／**14-evening-…** は廃止。sync の prune で削除される。



【日終わり（推奨）】

  作業を閉じる前に: `npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync`（または `npm run session:bootstrap`）

