# 復元チェックポイント（最新）
**最終更新**: 2026-08-21 11:51 JST — **朝セッション締め**。夜は社員名簿SPEC〜実装。
**次の1手**: 夜 cold-start → 必読 `chat-sessions/2026-08-21-employee-roster-night-handoff.md` → SPEC作成→commit/push→実装→浜田目視。
**レーン変更**: **社員名簿（Space48）OPEN**。747/746 §19 および閉済UXは再開しない。
**Git**: **`1ecc1877`** = `origin/main` — push 済
**closeStatus**: closed
**8月レーン**: ①依頼効率化v0.2済 / ②MCP月次+DEL-3済 / **V2-N完了通知=実装済** / ③薄い統合Desktop37済 / ④B-MDFLOW薄い済 / 経営会議ネタレーン確定＋**8月度レポート本体=完了**
**制約**: 閉済9件（751/734 は CLOSED 維持・UX のみ）／688 heat外／677–679／712 deploy／736触らない／新アプリ=相談・GO後のみ／**SKYSEA=案件外**／所属正本680は今後改修時のみ
**本日状態**: 朝=747/746§19完了＋社員名簿合意・Excel受領。**SPECは夜**。番号=`employee_no`新設（4桁・名の上）。`emp_id`不触。
**closures JSON**: UXレーンクローズ時は **不触**（UXレーンのみ・closed-v1 維持）
### 本日アクティブ（BUILD/rev — 2026-08-21）
| App | BUILD | rev |
|-----|-------|-----|
| **747** | `2026-08-21-jre-chub-account-dash-v9-ux-dept680` | **15** |
| **746** | `2026-08-21-jre-chub-account-db-block-v2-strong` | **9** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
| **734** | `2026-08-16-license-count-list` | **34** |
| **751** | `2026-08-16-751-members-copy-comma` | **8** |
| **715** | `2026-08-19-715-target-filter-chips` | **27** |
| **714** | `2026-06-14-software-ledger-db-block-ui-mutations` | **5** |
| **694** | `2026-08-16-694-meta-count-chips` | **29** |
| **696** | `2026-08-16-696-ui-print-polish` | **15** |
**747 live fileKey**: `09d6d907-29a3-4192-8e0c-9537b0740d17`
**746 live fileKey**: `e665227e-6085-41a1-a702-3e40081b0f55`
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
**751 live fileKey**: `aed42a5a-b7fb-453d-9f25-d5a1d6ad52a1`
**734 live fileKey**: `56d0215d-8a47-4a89-a767-49ce522a77b9`
**715 live fileKey**: `0896775f-808e-435a-a4ef-d4d819cc94bf`
**694 live fileKey**: `7d69bcc4-2bf8-4db4-bc7b-5005d7cdcd62`
**696 live fileKey**: `614cd05b-7e04-4fa3-bdc4-8ba5fa1a2515`
**継続メモ**: 夜は **社員名簿のみ**。閉済UX再開しない。詳細は `2026-08-21-employee-roster-night-handoff.md`。
**GO待ち**: なし（骨格・番号方針合意済）。夜はSPEC→実装→浜田目視。
**調査正本**: `chat-sessions/2026-08-21-employee-roster-night-handoff.md`（SPEC化前）
**運用**: 品質ゲート · Lifecycle v2 · closures=9 · 688 heat外 · 736触らない · 712 deploy禁止 · `verify:retired-app-refs`
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
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **クローズ正本**: `data/cio-project-closures.json` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`
## セッション切替後の自律復元（Lifecycle v2 鏡像）
**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
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


## 2026-08-18

### 2026-08-18 昼（674 M365・所属ピッカー・セッション締め）
- 674 SKYSEA対応は **個人のみ**（フォーム必須解除・非個人は空）
- M365 5/5 赤バナー廃止（内部上限維持）
- 管理タブ **M365利用状況**（admin・初期=利用可・列「番号」）
- 台帳 **所属ピッカー**（680 `sort_no`・レ点中は閉じない）→ 浜田目視 **OK**
- live BUILD=`2026-08-18-674-org-picker-keep-open` rev **339**
- 仕様: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.6.4/§4.6.7/§4.8a-D、`docs/plans/2026-08-10-674-ui-hub-tabs-spec.md`
- closeStatus: **closed**（本セッション締め。day-close は今夜最終ならそのとき）



## 2026-08-16

### 2026-08-16 朝（694/696 UX・セッション締め）
- **694** Apple ID管理台帳: ツールバー3群・件数チップ・sticky・印刷機密1行 → BUILD=`2026-08-16-694-meta-count-chips` rev **29** → 目視 OK → **改善レーンクローズ**（運用継続）
- **696** メールアドレス管理台帳: IDs 1–8 → BUILD=`2026-08-16-696-ui-print-polish` rev **15** → 目視 OK → **改善レーンクローズ**（運用継続・closures JSON に入れない）
- 手順正本: `docs/runbooks/kintone-existing-app-ux-improve-v1.md`
- 715 再開しない。次アプリは浜田指示
- closeStatus: **closed**（朝セッション締め。day-close は今夜最終ならそのとき）

### 2026-08-16 朝追記（Cursor JS/TS 除外）
- 大フォルダ除外通知 → `jsconfig.json` 拡張。浜田再読み込み後、新通知なし
- `.vscode/settings.json` は gitignore（ローカルのみ）
- 694/696/715 再開しない。夜は浜田指示
- closeStatus: **closed**（再締め。day-close は今夜）




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-21.md -->
