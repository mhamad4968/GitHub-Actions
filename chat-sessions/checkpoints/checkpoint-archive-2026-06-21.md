# checkpoint アーカイブ（2026-06-21）

> rollup from checkpoint-latest.md — 2 sections

## 2026-06-14 JST — **R34–R40 ガバナンス + ESLint CI 修正（セッション締め）**

| 項目 | 内容 |
|------|------|
| **背景** | Wi-Fi push 後 `kintone-customize-deploy` ESLint 赤（bundle 型 719） |
| **ESLint** | `qrcode-vendor.js` / bundle `desktop.js` ignore、`desktop.src.js` に `QRCode` global |
| **R34–R40** | Windows 正本パス / CLOSED 前 lint / customize registry / 死ショートカット / runbook CI / 四半期スキャン |
| **CI** | **`694c5a4`** — constitution-gates + kintone-customize-deploy + cursor-env-gates **success** |
| **正本** | `docs/runbooks/kintone-project-close-gate.md` / `data/windows-canonical-paths.json` / `data/kintone-customize-path-registry.json` |

---





---



## 2026-06-19 JST — **688 施工主報告印刷 + 関連 Kintone 本日対応（クローズ）**

| 項目 | 内容 |
|------|------|
| **688** | `2026-06-19-688-print-rounding-fix` rev **34** — 施工主報告用印刷（5セクション）・足場風速日数丸め・印刷フッター削除 |
| **595** | `2026-06-19-595-dept-picker-680` rev **96** — 680 所属候補モーダル |
| **674** | `2026-06-19-674-detail-hide-sidebar` rev **243** — 詳細画面右サイドバー非表示 |
| **721** | `2026-06-19-jr-ipad-dash-lifecycle-toggle` rev **12** — 有効/廃止トグル |
| **734** | `2026-06-19-vpn-dash-license-month-compare` rev **13** — ライセンス前回確定比較 |
| **720** | フォーム rev **7** — 新規採番時下書き必須緩和（customize BUILD 不変） |
| **733** | snapshot_month / snapshot_json 追加（フォーム rev **7**） |
| **CI修復** | 削除済 668 を portfolio BUILD 監査対象から除外 |
| **正本** | `docs/plans/2026-06-13-construction-workdays-excel-20260613.md` §9 / JR・VPN・PC台帳 改定履歴 |
| **判定** | 施工主報告印刷・丸め・空白ページ修正まで本番対応済（浜田 OK）— **2026-06-20 表記訂正: CLOSED → 保留**（`data/cio-project-closures.json` holds） |
| **再開条件** | 浜田から再度相談があった場合のみ |

---


<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-19.md -->

