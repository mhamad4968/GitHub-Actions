# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-06-30 JST — **セッション締め（595 同期・751 更新・一括反映ボタン）**

### 本日アクティブ（BUILD/rev — 2026-06-30）

| 項目 | 内容 |
|------|------|
| **595 社員マスタ** | BUILD=`2026-06-30-595-bulk-log-no-dup` rev **106** — 674/714/716 ミラー拡張・**台帳へ一括反映**・ログは **697** |
| **750/751 メーリングリスト** | 750 **67 件**同期・751 目視 OK |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **メーリングリスト750–751** — いずれも **closed-v1**（詳細は json + `docs/reports/`）。**業務改善のみ軽微 UX 継続可** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA 保留** | 触らない |
| **736 担当説明 保留** | Step2-3 待ち |

**次の1手**: **浜田依頼待ち**（項番 -0 で本題合意まで着手しない）。**触らない**: **688 / 677–679 / SKYSEA**

**Git**: **`b53faa8`** = `origin/main` — v1 CLOSED push 済

### ブリーフィング必須（CEO 2026-06-29）

**セッション切替のブリーフィング**（`SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7）で **必ず** **`npm run verify:session-close-git-warn`** を実行し **Git 残件を 1 行報告**（項番 **3c**）。`session:bootstrap` に **(1e) 非ブロック**内包。

- **OK 例**: `Git残件: なし（clean・origin 同期・verify exit 0）` — HEAD 短 hash
- **NG 例**: `Git残件: あり — 未コミット N 件 / ahead M / verify exit 1` — **次の1手** 1 行
- **NG 時**: 本題着手前に B1 整理または §41 で方針合意（checkpoint に GO がある場合は先に実施可）。**688 / 677–679 / SKYSEA** は触らない。

**禁止**: Git 残件報告の省略・「要点だけ」で未実行を隠蔽（§1 47 件持ち越し再発防止）。

**正本**: `SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 項番 **3c** / `session-bootstrap-verify.mjs` **(1e)** / `docs/session-report-checklist.md` / `.cursor/rules/session-handoff.mdc`（2026-06-29 CEO 指示を恒久化）。

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`

**595 本番**: BUILD=`2026-06-30-595-bulk-log-no-dup` rev **106**

**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

**運用メモ**: 595 CSV 取込後は一覧 **「台帳へ一括反映」** を実行。Desktop `＃重要確認事項.txt` は **2026-06-30 廃止**（read-pack/18 正本は維持）。

**夕反省**: `docs/reports/2026-06-30-evening-reflection.md` — A/R/S/D 承認待ち

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`

**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** 次に着手することを **§41 一問** → **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / **(1e) Git 残件** / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031

**CLOSE** `session-close-execute-first.mdc` — export-handoff → sync-desktop → clock:clear → close-git

**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
