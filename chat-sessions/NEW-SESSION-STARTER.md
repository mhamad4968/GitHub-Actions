━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 NEW-SESSION-STARTER（ハブ）/ **v3.36** — 2026-05-07 **分割版**（CIO）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**■ 目的**  
Desktop「AI緊急用」の **貼付用テキストを読みやすい長さ**にしつつ、**項番 -1 と同値の情報量**（旧単一ファイル全文）を維持します。浜田は **本ハブ 1 本**を開けばよく、細則は必要なパートだけ追加で開けます。AI は **分割 6 本を順に Read** して復元します。

**■ AI（CIO）必須 Read 順（抜け・飛ばし禁止）**  
チャットにハブだけ貼られても、次を **この順で** `Read`（1 本ずつ通読。長いときは offset/limit 分割可・抜け禁止）:

1. `chat-sessions/session-starter-parts/part-A-constitution-kernel.md` — 憲法級・禁句・deploy preflight・🎖️・ティア  
2. `part-B-ritual-and-changelog.md` — 貼付完走・項番 -0/0・並列 5 点・MCP・v3.x changelog  
3. `part-C-full-paste-core.md` — フル版相当・@ リスト・**今やってる主タスク**（夕方 `evening-reflect` が Part C のみ自動更新）  
4. `part-D-checklists-and-one-liners.md` — 翌朝 5 分・短縮 1 行・締め・§42  
5. `part-E-proofs-and-incidents.md` — §47-A・TSB-006 wipe  
6. `part-F-path-table-footer.md` — パス表・版メモ  

**■ 浜田（Desktop `AI緊急用`）**  
- **貼付推奨（項番 -1）**: 従来どおり **`00-NEW-SESSION-STARTER_yyyymmdd.txt`**（= 本ハブ）  
- **参照用（任意）**: **`01`〜`06`-STARTER-part-*.txt** の 6 本（`npm run session-starter:sync-desktop` でリポと同期）

**■ 項番 -1〜0 の極要約（詳細は Part B）**  
- **-0**: `checkpoint-latest.md` 先頭 1 行＋`handoff-log.md` 末尾＋§41 一問 → **浜田 OK まで** `verify:*` / **`npm run session:bootstrap`** / 本題の副作用に着手しない。  
- **0**: リポルートで **`npm run session:bootstrap` を 1 回**（憲法 verify → mandatory-read-gate → **verify:session-clock-health --strict** → Desktop sync → verify:desktop → smoke）。  
- **壁時計**: bootstrap 直後 **`npm run session:clock:set`** → **`npm run session:clock:web`** の URL を浜田へ。

---

**■ 分割ジャンル早見**

| # | ファイル | 内容 |
|---|-----------|------|
| A | part-A-… | 憲法カード・TSB-024 禁句・preflight・削除ゲート・🎖️ 表・ティア宣言 |
| B | part-B-… | 貼付単独で完走・項番手順・並列チェック・MCP 運用・changelog 長文 |
| C | part-C-… | フル版相当・@ Read・主タスク（自動更新ブロック） |
| D | part-D-… | 翌朝チェック・短縮 1 行・締め・§42 |
| E | part-E-… | §47-A 30 ステップ・wipe 初動 |
| F | part-F-… | パス表・最終更新（旧単一ファイル末尾相当） |

---

**■ 改定ルール**  
「項番 -1〜0 の手順」を変えるときは **Part B の「■ 貼付単独で完走」** を先に正本更新し、**本ハブの極要約**を矛盾なく追随。`checkpoint-latest.md` 等は短い鏡像に留める（浜田の貼付枚数を増やさない）。

<!--
verify-constitution-handoff needles (hub+PartA 連結でも可・ハブ単体維持):
TSB-024 §35-1 §56-1a (7) 役割宣言 再デプロイしてください 🚫 AI が絶対に書いてはいけない禁句 [§1-2-3 ティア判定 §1-2-3-1 §35-6 §35-7 HANDOFF-AI-FIVE-BLOCKS cio:preflight:674 customize 本番 deploy 機械ゲート --with-git-diff-line 独断で消さない session:clock:clear 【適用憲法】 every-turn-rules-confirm.mdc constitution-brief-card.mdc 網羅結合版
-->

最終更新: 2026-05-07 JST — **v3.36**（6+1 分割・S14 cron は `install-morning-cron.sh` で `.nvmrc` 追随）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
