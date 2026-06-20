# 2026-06-20 — AI 失敗とルール更新案（承認待ち）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | DB 名を一時 **`VPNアカウント台帳用DB`** と誤置換（**管理** 脱落） | 即修正。正: DB=**VPNアカウント管理台帳用DB** / Dash=**VPNアカウント台帳** |
| F2 | **736** committed 版に ESLint 9 件 → **GitHub CI 赤**（ローカル未コミット修正で pass） | 夕締めで 736 eslint 修正 commit |
| F3 | Windows `verify:kintone-live-schema` 後 **Node UV クラッシュ** → `SKIP_CIO_LIVE_SCHEMA_GUARD=1` 依存 | 734 deploy 時も同回避。根本原因未潰し（R53 継続） |
| F4 | **VPN 完成報告書**（`2026-06-17-vpn-account-completion.md`）が v1 のまま — v1.2 追記漏れ | 本日 addendum 追記 |
| F5 | **予実 SPEC**（677 保留レーン）が auto-priority で汚染 | `git checkout` で復元。保留レーンは commit 対象外を明文化 |
| F6 | 大規模 VPN 実装が **1 commit** — review 粒度が粗い | 機能単位 split を次回提案（R62） |

---

## ルール更新案 — **承認待ち**

| ID | 概要 | 提案先 |
|----|------|--------|
| **R58** | **保留レーン**（`cio-project-closures holds`）のファイルは `verify:session-close-git-warn` で **commit 禁止**または警告 | `scripts/verify-session-close-git-warn.mjs` |
| **R59** | **アプリ rename** 後は completion report + SPEC §13 BUILD + `kintone-apps.md` を **同一セッション checklist** 化 | `20-SESSION-REPORT-CHECKLIST.txt` |
| **R60** | **736 等 WIP customize** — push 前 `npm run lint:customize` **必須**（CI 赤の再発防止） | `.cursor/rules` / pre-push hook 案 |
| **R61** | **closed-v1 レーン**の v1.x 拡張（VPN v1.2 等）は completion report **addendum** 必須 | `docs/runbooks/kintone-v1-extension-addendum.md`（新規案） |
| **R62** | 500行超 customize 変更は **bundle 単位で commit 分割** | `split-to-prs` skill 参照 |

---

## 意図的に書かないもの

- 6/21 実行予算書の作業手順詳細
- 次レーン・第1手の宣言（→ checkpoint / 項番 -0）
