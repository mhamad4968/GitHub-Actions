# 浜田 GO — 2026-06-20 夕反省改善案（R58–R62 一括承認）

**承認日**: 2026-06-20  
**承認者**: 浜田（CEO）  
**契機**: VPN v1.2 夕締め反省（F1–F6）

## 承認一覧

| ID | 内容 | 状態 |
|----|------|------|
| R58 | `holds` 保留レーンの dirty 検査（session-close） | **GO — 実装** |
| R59 | アプリ rename 時 checklist（completion + SPEC §13 + kintone-apps） | **GO — 実装** |
| R60 | pre-push で `lint:customize` 必須 | **GO — 実装** |
| R61 | closed-v1 の v1.x 拡張 — completion addendum 必須 runbook | **GO — 実装** |
| R62 | 500行超 customize — commit 分割推奨（チェックリスト） | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| R58 | `scripts/lib/cio-project-closure.mjs` / `scripts/verify-session-close-git-warn.mjs` |
| R59 | `chat-sessions/desktop-ai-emergency-read-pack/20-SESSION-REPORT-CHECKLIST.txt` |
| R60 | `scripts/git-hook-pre-push.mjs` / `docs/runbooks/windows-governance-ops.md` |
| R61 | `docs/runbooks/kintone-v1-extension-addendum.md` |
| R62 | `20-SESSION-REPORT-CHECKLIST.txt` / `docs/runbooks/kintone-v1-extension-addendum.md` §commit |

## 緊急 bypass

| 環境変数 | 用途 |
|----------|------|
| `CIO_ALLOW_HOLD_LANE_DIRTY=1` | R58 — 保留レーン dirty を session-close で許可 |
| `CIO_ALLOW_PUSH_WITHOUT_LINT=1` | R60 — lint NG でも push（緊急のみ） |
