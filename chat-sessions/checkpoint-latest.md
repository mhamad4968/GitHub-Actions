# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-29 JST — **B1 未コミット整理が次セッション第1手・開口必須（浜田指示）**

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** — いずれも **closed-v1**（詳細は json + `docs/reports/`）。**業務改善のみ軽微 UX 継続可** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **触らない** |
| **予実管理 保留** | **677/678/679** — **触らない** |
| **SKYSEA 保留** | **2026-07 頃**計画検討 |
| **736 担当説明 保留** | Step2-3 待ち（customize dirty あり・別レーン） |

**次の1手**: **B1 未コミット整理** — 下表レーン選択 → **commit+push または restore** → `verify:session-close-git-warn` **exit 0**（**688 / 677–679 / SKYSEA** — 触らない）
**Git**: **`00f642b`** = `origin/main` — 開口必須ルール push 済
**dirty（B1 NG · ~46 件）**: R20/B1 — **未コミット残さない**（次セッションで必ず解消）

### 開口必須（浜田指示 2026-06-29）

**次セッション最初の AI 返答** — 浜田の依頼・本題を受ける **前に必ず** 説明（実装・調査着手 **禁止**）:

1. **B1 違反**: working tree **未コミット ~46 件**（`verify:session-close-git-warn` NG）
2. **ルール**: セッション締め **未コミット残さない**（R20/B1）
3. **B1 整理メニュー**（下表 A〜F）— レーンごと **commit+push または restore**
4. **完了条件**: `npm run verify:session-close-git-warn` **exit 0** → **その後** 項番 -0

**禁止**: B1 説明をスキップして依頼どおり実装開始 / 一括 auto-stage で混在 commit

### B1 整理メニュー（項番 -0 でレーン選択）

| レーン | 件数 | 主なパス | 選択 |
|--------|------|----------|------|
| **A video-gen** | ~15 | `assets/video-gen/` `scripts/video-gen/` `mcp/heygen-mcp/` `mcp/ffmpeg-mcp/` | GO→commit / NG→restore |
| **B MCP** | ~12 | `.cursor/mcp.json` `health-check.mjs` `mcp-backup-prune*` | GO→commit / NG→restore |
| **C 736** | 2 | `customize/736/desktop.js` `desktop.ui.js` | deploy→commit / restore |
| **D bi-guide** | 2 | `customize/business-improvement-guide/*` | GO→commit / NG→restore |
| **E yojitsu** | 1 | `templates/yojitsu-budget-lite/SPEC.md` | **原則 restore** |
| **F 鏡像** | ~5 | `.rag/extra-docs/*` `RULES-INDEX.md` | commit 後 `rag:mirror:canonical-docs` |

**736 本番**: BUILD=`2026-06-26-736-ux-sticky-print-badges-v1` rev **134**（作業ツリー dirty・本番不一致注意）
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **開口必須 B1 説明**（依頼前）→ **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`mandatory-read-gate.mjs`** / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**CLOSE** `session-close-execute-first.mdc` — export-handoff → sync-desktop → clock:clear → close-git

## 2026-06-28 NAS v1 完遂（rollup 参照）

748 BUILD=`2026-06-28-nas-ledger-db-block-ui` rev **6** / 749 BUILD=`2026-06-28-nas-ledger-dash-v1` rev **14** — 23件 · 夕反省 GO · Excel 削除済 · 712 リンク済 — `docs/reports/2026-06-28-nas-ledger-completion.md`

## 2026-06-26 JRE（rollup 参照）

744/745 v1 CLOSED — `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md`
