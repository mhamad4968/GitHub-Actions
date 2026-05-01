【番号付き読み取りパック】AI緊急用（Desktop）同期用 — 正本はこのフォルダ（リポ）

目的
  浜田がチャットに貼る「読ませたい本文」を、**番号順（READ-01 → READ-02 → …）**で AI に読ませる。
  セッション終了時に `npm run session-starter:sync-desktop` を実行すると、
  **このフォルダ内の .txt がすべて** `C:\Users\mhamada202408224\Desktop\AI緊急用\` にコピーされる（ファイル名そのまま）。

運用（推奨）
  1. **READ-01〜07 は CIO が初回用に文面準備済み**（01〜06＝手順・憲法要約、**07＝浜田 CEO のお願い・朝イチでも読む**）。浜田の追記・差し替えはそのまま上書きしてよい。
  2. チャットに貼った追加内容を、**同じ番号または空き番号の READ-NN.txt にリポ側で保存**する（CIO が代筆してよい）。
  3. 使わない番号は「（未使用）」1 行にしてよい。
  4. セッション終了（日終わり）で `npm run session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`。
  5. 新セッションでは AI に **01 から昇順**で Read ツールをかけさせる（`SESSION-READ-LADDER.md` も参照）。

INDEX.txt
  各番号に「何の貼付か」1 行メモを書いてよい（任意）。

ファイル名規則
  READ-01.txt … READ-99.txt のように **2 桁ゼロ埋め**（ソート順のため）。
