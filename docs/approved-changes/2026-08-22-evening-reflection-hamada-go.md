# 2026-08-22 夕反省 — 浜田 GO

- **ソース**: `docs/reports/2026-08-22-evening-reflection.md`
- **承認**: 全GO（#D1 / #R1 / #S1）— ただし名簿不具合（本務並び・並び替え速度）を先に修正してから反映
- **実施**:
  - **#D1**: SPEC に client filter＝ID経路と recordsP 同一判定を追記
  - **#R1**: 本ファイル＋ push-deploy ゲートに「一覧以外の消費者も同じ絞込か」1行
  - **#S1**: `filterRecordsByTitleRank776` を recordsP から共用
- **名簿バグ（同セッション・優先）**:
  - 595: 兼務保存時に本務 `list_sort` を上書きしない → BUILD `2026-08-22-595-preserve-primary-list-sort`
  - 776: 並び替えは変化範囲のみ PUT → BUILD `2026-08-22-776-reorder-range-put`
