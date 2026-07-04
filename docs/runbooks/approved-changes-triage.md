# approved-changes pending — triage Runbook

> **制定**: 2026-07-04（R-PENDING-01）  
> **正本キュー**: `docs/approved-changes/pending/`（アクティブのみ）  
> **処理済**: `docs/approved-changes/processed/YYYY-MM-DD/`

---

## 1. いつ走るか

| タイミング | 作業 |
|------------|------|
| **月次**（第1金曜 or セキュリティ自律更新後） | pending 全件レビュー |
| **major 滞留 30日超** | 浜田 §41 一問（適用 / 保留 / 却下） |
| **夕反省 GO 束** | 実装完走後 **同一ターン**で processed へ移動 |

---

## 2. 分類（安全性優先）

| 区分 | 扱い | 例 |
|------|------|-----|
| **major / manual_only** | pending 維持 — **浜田 GO 必須** | nodemailer 9.x |
| **minor 未適用** | pending 維持 — §38-1 自律更新ターンで適用可 | eslint / globals |
| **superseded** | 新 proposal がある旧版 → processed へ | nodemailer 9.0.1 ← 9.0.3 |
| **approved_hamada_go 実装済** | processed へ — pending に残さない | R49-R54 束 |
| **applied** | package.json / lock 反映済 → processed + 注記 | @kintone/cli minor |

**禁止**: major の無断 `npm update` / pending 削除のみ（processed 移動なし）

---

## 3. 手順（15 分 triage）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
dir docs\approved-changes\pending
npm run verify:approved-changes-pending  # 将来 — 重複検知
```

1. 一覧を **package 名でソート** — 重複を統合
2. 各件: superseded / applied / 要GO / 保留
3. processed へ `git mv` — JSON に `status` + `processed_at` + `note` を追記
4. `npm run cio:repo:purge-temp` dry-run — pending が空に近いことを確認
5. commit — `chore(approved-changes): triage pending YYYY-MM-DD`

---

## 4. 2026-07-04 初回 triage 結果

| ファイル | 判定 |
|----------|------|
| `2026-07-02-V1-nodemailer` | **pending 維持**（major 9.0.3 — 浜田 2026-07-04 保留） |
| `2026-06-28-V1-eslint` | **processed** — applied 10.6.0 |
| `2026-06-24-V1-globals` | **processed** — applied 17.7.0 |
| `2026-06-16-V1-_kintone_cli` | **processed** — applied 1.20.0 |
| `2026-06-21-V1-nodemailer` | **processed** — superseded by 2026-07-02 |
| `2026-06-16-V2-eslint` | **processed** — superseded by 2026-06-28 |
| `2026-06-17-R49-R54-evening` | **processed** — GO 済・実装済 |
| `2026-06-19-R55-S16-evening` | **processed** — GO 済・実装済 |

---

## 5. 関連

- `docs/reports/2026-07-04-governance-improvement-proposals.md`
- `AGENTS.md` §38-1
- `scripts/cio-repo-purge-temp.mjs`
