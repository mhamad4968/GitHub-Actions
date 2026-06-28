# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-29 JST — **NAS v1 完遂（Excel+712）・セッション締め・B1 未コミット整理は次セッション第1手**

### 本日アクティブ（BUILD/rev — 2026-06-28 NAS）

| 項目 | 内容 |
|------|------|
| **748 NAS DB** | BUILD=`2026-06-28-nas-ledger-db-block-ui` rev **6** — **23 件移行済** |
| **749 NAS 台帳** | BUILD=`2026-06-28-nas-ledger-dash-v1` rev **14** — 一覧/CRUD/印刷/xlsx/購入日・購入先。**浜田目視 OK** |
| **夕反省** | A1–A8 + S-NAS/R/D **浜田 GO — 実装済**（`2e2d0d0`） |
| **Excel 廃止** | **完全削除済**（2026-06-28 浜田報告）— kintone **748/749 のみ正本** |
| **712 リンク** | Space 48 → ポータル **712** リンク追加 **済**（2026-06-28 浜田手動） |

### 前セッション（参考 — 2026-06-26 JRE）

| 項目 | 内容 |
|------|------|
| **744** | BUILD=`2026-06-26-jre-cloud-account-db-block-v1` rev **5** |
| **745** | BUILD=`2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13` rev **18** |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** — いずれも **closed-v1**（詳細は json + `docs/reports/`）。**業務改善のみ軽微 UX 継続可** — 正本 `docs/runbooks/business-improvement-closed-v1-ux.md`。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **触らない** |
| **予実管理 保留** | **677/678/679** — **触らない** |
| **SKYSEA 保留** | **2026-07 頃**計画検討 |
| **736 担当説明 保留** | Step2-3 待ち（customize dirty あり・別レーン） |

**次の1手（項番 -0 前提）**: **B1 未コミット整理** — 下表レーンごとに **commit+push または restore** し `verify:session-close-git-warn` を **exit 0** にする（**688 / 677–679 / SKYSEA** — 触らない）  
**Git**: **`669d7fc`** = `origin/main` — NAS 完遂記録 push 済  
**dirty（B1 NG · 47 件）**: 次セッションで必ず解消 — **未コミット残さない**（R20/B1）

### B1 整理メニュー（項番 -0 でレーン選択）

| レーン | 件数目安 | 主なパス | 明日の選択肢 |
|--------|----------|----------|--------------|
| **A video-gen** | ~15 | `assets/video-gen/` `scripts/video-gen/` `mcp/heygen-mcp/` `mcp/ffmpeg-mcp/` `.cursor/rules/video-gen-lane.mdc` `AGENTS.md` §58 | **GO** → 1 commit+push / **NG** → `git restore`+削除 |
| **B MCP 基盤** | ~12 | `.cursor/mcp.json` `scripts/health-check.mjs` `mcp-backup-prune*` `docs/mcp-status.md` | **GO** → 1 commit+push / **NG** → restore |
| **C 736** | 2 | `customize/736/desktop.js` `desktop.ui.js` | **deploy する** → commit+deploy / **捨てる** → `git restore customize/736/` |
| **D bi-guide** | 2 | `customize/business-improvement-guide/*` | closed-v1 UX 継続 **GO** → commit / **NG** → restore |
| **E 保留 yojitsu** | 1 | `templates/yojitsu-budget-lite/SPEC.md` | **原則 restore**（保留レーン） |
| **F 鏡像・副次** | ~5 | `.rag/extra-docs/*` `RULES-INDEX.md` `debug-tips.md` | 上記 commit 後 `rag:mirror:canonical-docs` → 追加 commit |

**736 本番**: BUILD=`2026-06-26-736-ux-sticky-print-badges-v1` rev **134**（作業ツリー dirty・本番と不一致注意）
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **JRE 仕様**: `docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md` §7.6 | **MCP**: **現状凍結**  
**CLOSE 順（R-SESS-01）**: export-handoff → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync` → `session:clock:clear` → `cio:session:close-git`  
**bootstrap（R-SESS-02/04）**: Desktop `＃重要確認事項.txt` sync 自動復元  

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** `session-boundary-close-gate.mdc` | **履歴** `chat-sessions/checkpoints/checkpoint-archive-2026-06-25.md`
