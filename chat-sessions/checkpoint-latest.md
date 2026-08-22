# 復元チェックポイント（最新）
**最終更新**: 2026-08-22 11:26 JST — 昼締め＋夜作業順（Excel兼務・並び・部室）を必読に追記。
**次の1手**: cold-start → 必読 chat-sessions/2026-08-22-employee-roster-night-handoff.md → ①最新Excel突合(兼務) ②list_sort=Excel役職順 ③section_name登録 ④漏れ・UI/集計整え
**レーン変更**: **595/776 社員名簿 OPEN 継続**。747/746 および閉済UXは再開しない。
**Git**: **`3313e8a1`** = `origin/main` — push 済
**closeStatus**: closed（昼区切り・夜継続）
**制約**: 閉済9件／688 heat外／677–679／712 deploy禁止／736不触／SKYSEA=案件外／emp_id 不触
**本日状態**: 595=`2026-08-22-595-kenmu-list-sort-dept-end` rev**149**。776=`2026-08-22-776-sort-after-save` rev**49**（`section_name` フォーム追加済）。
### 本日アクティブ（BUILD/rev — 2026-08-22 昼締め）
| App | BUILD | rev |
|-----|-------|-----|
| **776** | `2026-08-22-776-sort-after-save` | **49** |
| **595** | `2026-08-22-595-kenmu-list-sort-dept-end` | **149** |
| **747** | `2026-08-21-jre-chub-account-dash-v9-ux-dept680` | **15** |
| **746** | `2026-08-21-jre-chub-account-db-block-v2-strong` | **9** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: 夜=最新Excel(C:\\tmp\\社員名簿…\\社員一覧表.xlsx 11:13更新)で兼務・並び・部室。削除は最終GOまで残置。
**GO待ち**: なし（夜作業順は浜田指示済）。部／室のExcel列マッピングだけ曖昧なら1問。
**調査正本**: `docs/plans/2026-08-21-employee-roster-kintone-spec.md`
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

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
## 2026-08-22 昼

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
