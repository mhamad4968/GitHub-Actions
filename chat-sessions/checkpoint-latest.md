# 復元チェックポイント（最新）
**最終更新**: 2026-08-23 08:55 JST — **721 P2-1+A+B+V1-7**（jr-ipad **reopened**）
**次の1手**: SPEC commit → customize 実装 → `deploy:721` → 浜田目視
**レーン変更**: **`jr-ipad-ledger` reopened**（P2-1・A解除・Bコピー・V1-7）。P2-2/C-I 見送り。720 不触
**Git**: 作業中
**closeStatus**: **open**
**制約**: 閉済8件＋jr-ipad **reopened**／688 heat外／677–679／712禁止／736不触／SKYSEA=案件外／emp_id不触／**720 schema不触**／**P2-2しない**
**本日状態**: P0/P1 rev16 目視OK済。P2-VUX 着手。SPEC=`docs/plans/2026-08-23-jr-ipad-721-p2-vux-spec.md`
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-08-23）
| App | BUILD | rev |
|-----|-------|-----|
| **721** | `2026-08-23-jr-ipad-dash-p0-p1-ux` → P2-VUX 実装後更新 | **16** |
| **776** | `2026-08-22-776-reorder-range-put` | **75** |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** |
| **747** | `2026-08-21-jre-chub-account-dash-v9-ux-dept680` | **15** |
| **746** | `2026-08-21-jre-chub-account-db-block-v2-strong` | **9** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: P2-2・C〜I は今回やらない。
**GO待ち**: なし（実装中）。目視は deploy 後。
**調査正本**: `docs/plans/2026-08-23-jr-ipad-721-p2-vux-spec.md`
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## クローズ済み（`data/cio-project-closures.json` — reopen 中 1）
業務改善697–713 / Wi-Fi718–719 / **JR iPad720–721=reopened(P2-VUX)** / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753**

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | **案件外**（2026-08-10）— 手動インストール。kintone登録は浜田指示時のみ |
| **736** | 現行版保持・触らない |
| **756/757/758** | LIVE rev318 · MANUAL_ONLY |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-08-22 夜

### 2026-08-22 夜締め（名簿データ①〜④＋改善GOクローズ）
- 浜田: **すべてOK**／E2・E5ほか **今回見送り**／S7 Excel削除は最終GOまで残置
- live **776** `2026-08-22-776-agg-kanetsu-seko-under-koji` rev **73** / **595** `…roster-sync-fast` rev **151**
- closeStatus: **closed**（改善レーン。日終わり close-git は別途）

### 2026-08-22 昼締め（名簿 UI＋部／室＋revision衝突修正）
- **夜必読**: `chat-sessions/2026-08-22-employee-roster-night-handoff.md`
- 776: 兼務色／部署末尾／スクロール／ページ送り（`$id`分割）目視OK
- 776: `section_name` 追加・「部追加」・保存時並びUI
- **バグ**: 保存時 revision 衝突 → `sort-after-save` で success 後適用に修正・緊急 deploy（4h超 SKIP）
- 595: 新規兼務→部署末尾／既存並び・section 維持
- closeStatus: **closed**（昼区切り。夜継続）



## 2026-08-21 夜

### 2026-08-21 夜締め（社員名簿 Phase1〜2）
- 595: 兼務 ST DROP_DOWN（dept/group/title）
- 776: キーワード／所属複数／件数／Excel+印刷／集計表／PC台帳型「いまの条件」「該当件数」／ツールバー揃え／部署区切り薄紫緑／reform順
- live 776 BUILD=`2026-08-21-776-reform-dept-order` rev **38**
- 浜田: 列幅・ヘッダ・reform順まで **OK** → 本日終わり
- closeStatus: **closing**（day-close）



## 2026-08-21

### 2026-08-21 朝締め（747/746完了＋社員名簿を夜へ）
- 747/746 §19 浜田OK・レーンクローズ済
- 社員名簿: 合意・調査・Excel受領まで。SPEC未。夜必読 `chat-sessions/2026-08-21-employee-roster-night-handoff.md`
- closeStatus: **closed**（朝セッション）

### 2026-08-21 朝（747/746 §19 UX・データ健全化・レーンクローズ）
- SPEC §19 → commit/push → 746 強ロック + データ（2999クリア・部署680正）+ 747 UX v9
- live **747** `2026-08-21-jre-chub-account-dash-v9-ux-dept680` rev **15** / **746** `…db-block-v2-strong` rev **9**
- 浜田目視 **OK** → **改善レーンクローズ**（運用継続・closures JSON 不触）
- 閉済 UX（694/696/715/734/751）再開しない
- closeStatus: **closed**（本レーン締め。day-close は今夜最終ならそのとき）



<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-22.md -->
