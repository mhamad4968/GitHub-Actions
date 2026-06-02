# 夕反省 — 2026-06-02 JST

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`

---

## AI の失敗・反省

| # | 失敗 | 再発原因 | 対策 ID |
|---|------|----------|---------|
| F1 | Excel 再分析時 **`C:\tmp` に xlsx が無く** inline 集計が失敗 | セッション跨ぎで tmp パス未再確認・単一パス依存 | A1, B2 |
| F2 | SPEC 草案に **誤字（中国語「否则」）** が混入 | 下書きの自己チェック不足 | A2 |
| F3 | `icloudSummary.maxNo` **異常値**（列 index ずれの疑い） | ヘッダ名からの動的解決なし | A3 |
| F4 | 682 修正後、ローカル workflow **文字化け diff** | 作業ツリー restore 漏れ | A4 |
| F5 | ステータス語彙を **何度も改稿** | 仕様開始時に語彙・書込経路を先固定していない | A5 |
| F6 | Excel 削除が **口頭合意のみ** | runbook/スクリプト未整備 | A6 |

---

## アップデート案 — **全 GO（2026-06-02 浜田）**

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | `npm run apple-id:verify-xlsx`（存在・シート・行数） | GO |
| **A2** | SPEC/runbook 保存前の誤字・外国語混入チェック | GO |
| **A3** | 分析/移行の列 index をヘッダ名から動的解決・共通化 | GO |
| **A4** | 締め時 workflow 文字化け検知（verify 拡張） | GO |
| **A5** | kintone 仕様開始時 §41 固定 5 項目テンプレ | GO |
| **A6** | `apple-id-go-live.md` + `apple-id:retire-excel` | GO |
| **B1** | 677 型 DB save/delete ブロックをテンプレ写経 | GO |
| **B2** | `apple-id:migrate:xlsx --dry-run` | GO |
| **B3** | jbis.039 採番 UT 3 ケース | GO |
| **B4** | §50-3-8 を採番・DELETE 実装直前に必須 | GO |
| **C1** | 削除時「退職なら廃止」警告 | GO |
| **C2** | ダッシュ未割当フィルタ既定 | GO |
| **C3** | deploy 後 `kintone-apps.md` 追記チェックリスト | GO |
| **D1** | 項番 -0 でレーン 1 行宣言（Space 21 等） | GO |
| **D2** | checkpoint 凍結表 + 独立案件 LITE 1 行 | GO |

**反映**: 実装は各案件着手時。runbook / rules / scripts へ順次。

---

## 夕反省に書かないもの

- 本日成果 → **19 / SESSION-CLOSE**
- 凍結・クローズ → **checkpoint**
- **明日やること・スケジュール・第1手** → 書かない（**2026-06-02 浜田**）
