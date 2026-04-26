# Z-3 docs/reports/ 月単位 archive 化 設計書

**日時**: 2026-04-26
**Tier**: B (浜田判断 = `archive_monthly` + `all_reports` + `after_day4` 取得済)
**ステータス**: Phase 1 完了 / Phase 2 = Day 4 後 / Phase 3 = 2026-05-01 朝

---

## 0. 背景

`docs/reports/` 配下が日数経過で肥大化しており、リポジトリ衛生上問題。
過去に commit された各種レポートを月単位で `archive/YYYY-MM/` 配下にまとめ、
ルート直下を「当月分のみ」に保つ運用に変更する。

## 1. 浜田判断履歴

| 質問 | 回答 |
|------|------|
| Z-3 (commit 方針) | `archive_monthly` |
| Z-3b (対象範囲) | `all_reports` (docs/reports/ 配下全ファイル) |
| Z-3c (P2 タイミング) | `after_day4` (Day 4 完全終了後) |

## 2. 設計

### 2-1. ディレクトリ構造

```
docs/reports/
├── archive/
│   ├── .gitkeep                            ← Phase 1 で作成済
│   ├── 2026-04/                            ← Phase 3 (5/1) で自動生成
│   │   ├── 2026-04-17-daily-summary.md
│   │   ├── 2026-04-17-final-tuning.md
│   │   ├── ...
│   │   └── 2026-04-30-evening-reflection.md
│   ├── 2026-05/                            ← 2026-06-01 で生成
│   └── ...
├── 2026-04-26-morning-prep.md              ← 当月分は通常配置
├── 2026-04-26-evening-reflection.md
└── ...
```

### 2-2. archive 対象 (Z-3b: `all_reports`)

`docs/reports/*.md` 配下 **全ファイル** が対象。
- 毎日生成: `*-morning-prep.md`, `*-evening-reflection.md`, `*-daily-summary.md`
- 単発生成: `*-quality-dashboard.md`, `*-final-tuning.md`, `*-list-view-fix.md` 等
- 例外: `archive/`, `README.md`, ルートに置きたい固定文書 (該当なし)

### 2-3. 自動 archive ロジック (Phase 2)

```javascript
// scripts/archive-reports.mjs (新規 / Day 4 後実装)
async function maybeArchivePreviousMonth() {
  const now = jstNow();
  const isFirstOfMonth = now.getDate() === 1;
  if (!isFirstOfMonth) return;

  const prevMonth = previousMonthString(now);
  const archiveDir = `docs/reports/archive/${prevMonth}`;
  if (existsSync(archiveDir)) return;

  mkdirSync(archiveDir, { recursive: true });
  const files = glob.sync(`docs/reports/${prevMonth}-*.md`);
  for (const file of files) {
    await git('mv', file, `${archiveDir}/${path.basename(file)}`);
  }
  await git('add', archiveDir);
  await git('commit', '-m',
    `[CHORE] archive: docs/reports/${prevMonth}/* (${files.length} files)`);
  log to autonomy-decisions/Z3-archive-${prevMonth}-actual-${jstISO()}.md
}
```

### 2-4. 起動契機

`scripts/daily-morning-prep.mjs` の冒頭で呼び出し:
```javascript
import { maybeArchivePreviousMonth } from './archive-reports.mjs';
await maybeArchivePreviousMonth();
```

または独立した cron として登録 (要検討 / Day 4 後)。

## 3. Phase 別 進行表

| Phase | 内容 | タイミング | ステータス |
|-------|------|-----------|----------|
| **P1** | archive/ ディレクトリ作成 + .gitkeep + 設計書 (本ファイル) | 2026-04-26 09:21 JST | ✅ 完了 |
| **P2** | scripts/archive-reports.mjs 新規 + 朝 cron 組込 + dry-run 動作確認 | Day 4 完全終了後 (今夜 or 4/27) | ⏳ TODO |
| **P3** | 2026-05-01 朝の初回 archive 自動実行 + 動作検証 + autonomy log 記録 | 2026-05-01 06:30 JST | ⏳ TODO |

## 4. リスク & 対策

| リスク | 対策 |
|--------|------|
| `git mv` 失敗 (未追跡ファイル) | `git status` 事前確認 / 未追跡なら手動 commit を促す |
| 月初め重複実行 | `archive/YYYY-MM/` 存在判定で skip |
| レポートが大量 (>100 ファイル) | `git mv` 一括ではなく分割実行 + commit batch |
| ファイル名規約違反 (YYYY-MM-DD-* 以外) | matched ファイルのみ移動 / unmatched は warning ログ |
| .rag/extra-docs 同期影響 | RAG ingest スクリプトが archive/ も対象にしているか確認 (P2 で要調査) |

## 5. ロールバック手順

万一 archive 後に問題発生した場合:
```bash
git revert <archive commit hash>
# または
git mv docs/reports/archive/YYYY-MM/*.md docs/reports/
git commit -m "[REVERT] Z-3 archive YYYY-MM rollback"
```

## 6. 関連

- 関連 TSB: なし (新規運用)
- 関連 §: §61-1 docs/reports/ 運用 (新設候補)
- 関連 commit (Phase 1): 後述 (本ファイル commit 時に追記)
