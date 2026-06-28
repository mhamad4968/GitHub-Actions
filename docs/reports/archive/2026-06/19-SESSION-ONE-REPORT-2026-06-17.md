# 本日の対応まとめ — 2026-06-17（JST）

> Desktop: **`19-SESSION-ONE-REPORT-2026-06-17.md`**（sync 正本）

---

## 1. 本日完了（浜田 OK / 実施済み）

| # | 内容 | 結果 |
|---|------|------|
| 1 | **595 社員マスタ** — 削除済み 627 連携除去 | deploy rev **92** — 浜田 OK |
| 2 | **595** — emp_id 自動付番 + 既存7件バックフィル | deploy rev **93** — 浜田 OK |
| 3 | **715 ソフトウエア台帳** — emp_id 空ガード + 利用者チップ改善 | rev **12**→**13** — 浜田 OK |
| 4 | **717 記憶媒体台帳** — 利用者チップ 715 同型 | rev **8** — 浜田 OK |
| 5 | **PCキッティング** — UTF-8 BOM / `kitting-run.ps1` / START.bat 更新 | テンプレート正本更新・キッティング PC へコピー済 |
| 6 | **（新）キッティングセット** | USB 資産を `PCキッティングインストール用\` 配下に配置 — 明日②試験予定 |

---

## 2. kintone 本番 BUILD（本日 deploy）

| App | 役割 | BUILD | rev |
|-----|------|-------|-----|
| **595** | 社員マスタ | `2026-06-17-595-emp-id-auto-assign`（627除去含む） | **93** |
| **715** | ソフトウエア dash | `2026-06-17-software-ledger-user-filter-compact` | **13** |
| **717** | 記憶媒体 dash | `2026-06-17-storage-media-ledger-user-filter-compact` | **8** |

---

## 3. GitHub / CI

| 項目 | 状態 |
|------|------|
| `main` 最新 push | **`e0ec691`** — R41–R48 governance |
| 直近 workflow | **success**（daily-collect / ict-tech-digest / 6/16 push gates） |
| **本日の kintone 修正** | **未コミット**（working tree dirty） |

---

## 4. PCキッティング（運用メモ）

- リポ正本: `templates/pc-kitting/`
- **（新）キッティングセット**はリポに含まれない（USB 別資産）
- 起動: `PCキッティング_START.bat` → `kitting-run.ps1` → `kitting-main.ps1`

---

## 5. 夕反省

`docs/reports/2026-06-17-evening-reflection.md` — F1–F8  
**R49–R54 承認待ち** — `docs/approved-changes/pending/2026-06-17-R49-R54-evening.proposal.json`
