# 夕反省改善（2026-08-08 浜田全承認）

正本仕様: `docs/plans/2026-08-08-evening-improvements-spec.md`  
承認: `docs/approved-changes/2026-08-08-evening-reflection-hamada-go.md`

## 完了定義（R3 / DoD）

集計・一覧・フィルタ UI／破壊的フローを「完了」と言う前に、次を満たす。

| # | 条件 |
|---|------|
| 1 | **列定義**（列名・意味）と **マスタ行**（並び）をチャットまたは SPEC に固定 |
| 2 | **live 突合**（未一致件数／済・未了件数）を1回出す（`npm run cio:674:inventory-hub-diag` 等） |
| 3 | 一覧ボタンは **Event を業務引数にしない**（ラッパ） |
| 4 | 破壊的フロー（買替等）は **代表1パス**の手順証跡（実施内容1行で可） |
| 5 | deploy 後 **GHA 緑**（constitution-gates / 該当 deploy） |

## 期間二系統（O2／O3見送り）

| 系統 | 用途 | 根拠 |
|------|------|------|
| **670キャンペーン** | 棚卸ボタン表示・未棚卸クエリ・状況一覧の済／未了（現行） | `PC_INVENTORY_PERIOD_*` |
| **年次 5/1〜翌4/30** | 合意上の年次イメージ・画面の参考ラベル | C1 浜田合意 2026-08-08 |

**統合しない**（O3）。画面で両方を明示する。

## 体制チェック（T1/T2/T3）

- **T1**: Diff前に列＋マスタ＋liveサンプル
- **T2**: 一覧／アコーディオン実装後、DeepSeek に「Event直渡し／引数誤認」1問
- **T3**: 買替等は代表1パス証跡を残してから浜田検収依頼

## コマンド

```bash
npm run cio:674:inventory-hub-diag
npm run cio:deploy-ready:674 -- --note "…"
npm run deploy:674
```

## 関連

- `.cursor/rules/cio-ops-2026-08-08-evening-improvements.mdc`
- `docs/runbooks/674-term-dictionary.md`
- `.cursor/rules/cio-ops-2026-08-07-evening-improvements.mdc`（前日分・併存）
