# 復元チェックポイント（最新）
**最終更新**: 2026-08-01 20:45 JST — **セッション締め（full CLOSE・夜最終）**。756 Excel枠 11000〜11300（昼間／夜間）・名称枠を10700直後・11100二重非表示。浜田: OMIT残 11400・13500 は次セッション。
**次の1手**: **新チャット**で `00-NEW-SESSION-STARTER` 貼付→bootstrap → **756 原価管理明細の未実装枠を Excel 正で続行**（OMIT残: 11400・13500）。一時保存→App757／予実保存→App758 は維持。
**Git**: **`f03a6657`** = `origin/main` — push 済

**本日状態（要約）**: 756 LIVE **rev286** `…-excel-dedupe-coded`。夜=並び修正・11000〜11300・dedupe。R63 クリーン。GitHub Actions 本日 success。

### 本日アクティブ（BUILD/rev — 2026-08-01）
| App | BUILD | rev |
|-----|-------|-----|
| **756** | `2026-08-01-ver02-actual-excel-dedupe-coded` | **286** |

**継続メモ**:
1. **756 工事原価管理**: Excel「原価管理明細」枠。済=塗装系・名称枠・10800/10900・11000〜11300・経費系多数。**OMIT残: 11400・13500**。
2. 同一工種コードの二重枠は表示側で正規1件（内訳非破壊）。ENSURE区分はコード表。
3. 内訳連動は月曜以降。RAG aide 観察〜**8/9**。**新アプリ**＝指示後

**GO待ち**: なし。新アプリ＝相談・GO後のみ。

**案内規律（浜田 2026-07-28）**: **完了済の件を GO待ち／次の1手／質問に出さない**。

**調査正本**: `docs/plans/2026-07-31-756-cost-mgmt-excel-table-structure-spec.md`（#R-EXCEL-UI-09〜14）

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 品質ゲート · Lifecycle v2 · closures=9。

**688**: heat-closed以外触らない · **674**: 購入先OK · **736**: 触らない · **756/757/758**: LIVE rev286 · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev286。Excel 原価管理明細枠寄せ継続（OMIT残 11400・13500） |
| **712** | 削除済 — deploy 禁止 |

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`

## 2026-08-01

### 2026-08-01 夜（最終締め）
- 756: LIVE rev286 `…-dedupe-coded`。11000〜11300・名称枠10700直後・11100二重非表示。R63 clean。GHA success
- 浜田: OMIT残 11400・13500 は次セッション。新チャットで続行
- close-git / clock:clear（本締め）

### 2026-08-01 午後（最終締め）
- 756: LIVE rev270 `…-12900-misc`。詳細左persist／列幅／12600・12700・12900。R63 clean
- 浜田: 残り約12枠は次セッション。新チャットで続行
- close-git / clock:clear（本締め）

### 2026-08-01 午前（セッション締め）
- 756: Excel 原価管理明細寄せ（10200〜10700・名称枠・10900・オペレーター＋その他労務・詳細2セル・＋修正）LIVE rev244
- 浜田: 残り約26枠は明日以降。新チャットで続行
- close-git / clock:clear（本締め）


## 2026-07-31

### 2026-07-31 夜（セッション締め）
- 756: 操作列・＋詳細行撤去・struct-raf・SPEC・ops ルール（4h硬拒否）
- Desktop AI緊急用 最新同期・verify OK
- 明日: ブロック単位再描画＋Excelどおり修正継続



## 2026-07-30

### 2026-07-30 夜（セッション締め）
- Desktop AI緊急用: 旧ファイル prune＋最新入替（`session-starter:sync-desktop` + verify）
- 夕反省GO全承認反映済・SPEC対面待ちスタンプ・CI緑
- close-git / clock:clear
