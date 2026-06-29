# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-29 JST — **B1 完了・ブリーフィング Git 残件報告義務（CEO 2026-06-29）**

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** — いずれも **closed-v1**（詳細は json + `docs/reports/`）。**業務改善のみ軽微 UX 継続可** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **触らない** |
| **予実管理 保留** | **677/678/679** — **触らない** |
| **SKYSEA 保留** | **2026-07 頃**計画検討 |
| **736 担当説明 保留** | Step2-3 待ち（本番 BUILD=`2026-06-26-736-ux-sticky-print-badges-v1` rev **134**） |

**次の1手**: **浜田依頼待ち**（736 Step2-3 / bi-guide / yojitsu 等は GO 後）
**Git**: **`d458979`** = `origin/main` — **clean**（`verify:session-close-git-warn` **exit 0**）
**B1**: **2026-06-29 完了** — video-gen 試行削除・MCP 維持・595/674 BUILD 同期・RAG mirror（commits `3a0fc5e`〜`d458979`）。次セッション以降は **ブリーフィング 3c** で Git 状態を毎回明示（未コミット・ahead・verify exit を省略しない）。

### ブリーフィング必須（CEO 2026-06-29）

**セッション切替のブリーフィング**（`SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7）で **必ず** **`npm run verify:session-close-git-warn`** を実行し **Git 残件を 1 行報告**（項目 **3c**）。`session:bootstrap` に **(1e) 非ブロック**内包。

- **OK 例**: `Git残件: なし（clean・origin 同期・verify exit 0）` ＋ HEAD 短 hash
- **NG 例**: `Git残件: あり — 未コミット N 件 / ahead M / verify exit 1` ＋ **次の1手** 1 行
- **NG 時**: 本題着手前に B1 整理または §41 で方針合意（checkpoint に GO がある場合は先に実施可）

**禁止**: Git 残件報告の省略・「要点だけ」・未実行の隠蔽（B1 47 件持ち越し再発防止）

**正本**: `SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 項目 **3c** / `session-bootstrap-verify.mjs` **(1e)** / `docs/session-report-checklist.md` / `.cursor/rules/session-handoff.mdc`（2026-06-29 CEO 指示を恒久化）

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** 次に着手することを **§41 一問** → **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / **(1e) Git 残件** / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**CLOSE** `session-close-execute-first.mdc` — export-handoff → sync-desktop → clock:clear → close-git

## 2026-06-28 NAS v1 完遂（rollup 参照）

748 BUILD=`2026-06-28-nas-ledger-db-block-ui` rev **6** / 749 BUILD=`2026-06-28-nas-ledger-dash-v1` rev **14** — 23件 · 夕反省 GO · Excel 削除済 · 712 リンク済 — `docs/reports/2026-06-28-nas-ledger-completion.md`

## 2026-06-26 JRE（rollup 参照）

744/745 v1 CLOSED — `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md`
