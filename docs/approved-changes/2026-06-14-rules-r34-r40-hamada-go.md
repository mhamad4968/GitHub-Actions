# R34–R40 ガバナンス — 浜田 GO（2026-06-14）

**承認**: 浜田 — 夕方セッション「憲法・ルール改善案すべて承認（安全性・正確性・確実性最優先）」

| ID | 内容 | 正本 |
|----|------|------|
| R34 | Windows 正本パス台帳 | `data/windows-canonical-paths.json` / `npm run verify:windows-canonical-paths` |
| R35 | パス整理 GO → runbook + 同日 commit 必須 | `docs/runbooks/repo-workspace-lifecycle.md` / `session-close-execute-first.mdc` |
| R36 | kintone CLOSED 前 `lint:customize` 必須 | `docs/runbooks/kintone-project-close-gate.md` / `verify:cio-spec-close-git` |
| R37 | semantic customize → appId registry | `data/kintone-customize-path-registry.json` |
| R38 | Desktop 死ショートカット監査 | `npm run verify:desktop-dead-shortcuts` |
| R39 | runbook/registry 軽量 CI | `constitution-gates` paths + `verify:runbook-registry-integrity` |
| R40 | 四半期 `C:\` duplicate スキャン | `repo-workspace-lifecycle.md` §四半期 |

**背景**: Wi-Fi 718/719 CLOSED 後も `kintone-customize-deploy` が ESLint で CI 赤。bundle 型 customize の lint 方針未整備。

**同日対応**: `eslint.config.js` — `qrcode-vendor.js` / bundle `desktop.js` ignore、`desktop.src.js` に `QRCode` global。
