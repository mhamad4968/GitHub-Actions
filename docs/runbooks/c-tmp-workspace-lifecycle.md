# C:\tmp 作業領域ライフサイクル

> **制定**: 2026-06-14（`C:\tmp` 棚卸し後 runbook 整合）

## 正本

| 項目 | パス |
|------|------|
| フォルダ台帳 | `data/c-tmp-workspace-registry.json` |
| 都度作成 | `npm run cio:tmp:ensure-workspaces` |

## 2026-06-14 棚卸し結果

| 区分 | 扱い |
|------|------|
| **維持（常時）** | `マニュアル` / `予算管理` / `稼働日数算出ツール` / `PCキッティングインストール用` / `業務改善` / `情報セキュリティ勉強会テキスト` |
| **都度作成** | `資料作成` / `資格取得ロードマップ` |
| **削除済** | kintone 移行完了 Excel・完了案件フォルダ・ルート直下 ad-hoc `.py` |

## 2026-07-04 追記 — closed-v1 作業フォルダ廃止

**浜田確認**: アプリ v1 完成済 8 案件の `C:\tmp\<案件名>` は作業用途なし → **削除**。

| 段階 | ルール |
|------|--------|
| **移行前** | 移行元 Excel を `scripts/data/archive/closed-v1-migration-sources/` へコピー |
| **スクリプト** | `scripts/lib/closed-v1-migration-xlsx.mjs` の `archiveXlsx()` を既定パスに |
| **registry** | `data/c-tmp-workspace-registry.json` の `removedClosedV1Folders` に記録 |
| **削除** | `C:\tmp\<案件名>` フォルダ本体を Remove-Item |
| **正本** | データは **kintone**。Excel は re-import 用控えのみ |

儀式との接続: [`cio-project-closure-governance.md`](cio-project-closure-governance.md) **§G**

**機密**: パスワード入り Excel は kintone 正本移行後 **削除**（リポに commit しない）。

## 都度作成フォルダ

作業開始前:

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:tmp:ensure-workspaces
```

| フォルダ | 用途 | 追加で必要なもの |
|----------|------|------------------|
| `C:\tmp\資料作成` | 月次セキュリティレポート | 前月 DOCX テンプレ（`monthly-security-report.md` §新規月） |
| `C:\tmp\資格取得ロードマップ` | 資格 PPTX 編集 | `qualification-roadmap.json` の canonical PPTX（バックアップから配置） |

`scripts/build-monthly-security-report.py` は `work_dir` が無ければ **自動 mkdir** する。

## ad-hoc `.py`（ルート直下）

| 段階 | ルール |
|------|--------|
| 作業中 | `C:\tmp\xxx.py` 可（`pptx-patch-windows.md` P5） |
| 完了後 | **再利用** → `scripts/` 昇格 + npm / runbook 更新 |
| 完了後 | **一度きり** → 削除（復元不要） |

判定は AI がリポ内の正本スクリプトと runbook を突合する。

## 関連 runbook

- `docs/runbooks/repo-workspace-lifecycle.md`（リポジトリ内一時ファイル）
- `docs/runbooks/monthly-security-report.md`
- `docs/runbooks/qualification-roadmap-pptx.md`
- `docs/runbooks/pptx-patch-windows.md`
- `docs/runbooks/doc-lane.md`
