# 部署予実（yojitsu-budget-lite）— kintone アプリ自律作成（2026-04-28）

## 依頼

浜田: アプリ作成は自律的に実施してよい。明日でよい。作成後報告。

## 実施内容

1. **MCP `kintone-add-app`** でアプリ新規  
   - **675** … `部署予実・入力（システム推進室）`  
   - **676** … `部署予実・ダッシュ（システム推進室）`
2. **675** に **MVP フォーム**（`kintone-add-form-fields` → `kintone-deploy-app` revision **5**）  
   - レコード直下: `kosyu_meisho`（必須）, `kosyu_code`, `hiin_shubetsu`, `tekiyo`, `kaisha`, `running_fee_amount`, `initial_fee_amount`, `biko`  
   - サブテーブル `shiharai_lines`（支払内訳）: `pay_date`, `pay_amount`, `invoice_no`, `line_memo`, `frame_type`（DROP_DOWN: ラーニング費用（定額費）／イニシャル費用（変動費））  
   - サブテーブル `monthly_block`: `month_dd`（5月〜4月）, `budget_amt`, `actual_amt`, `yosan_shusei`（必須）  
3. **消費率**（`monthly_block` 内 CALC）: 初回 API 投入時 **計算式文法エラー**（GAIA_IL01）→ **未追加**。UI または正しい式で後追い。  
4. **676** に `dash_readme`（MULTI_LINE_TEXT）のみ追加し **deploy SUCCESS**（集計・ルックアップは今後）。  
5. **`kintone-apps.md`** 一覧行を **675 / 676** に更新。  
6. **`templates/yojitsu-budget-lite/SPEC.md`** 冒頭の状態文を「アプリ作成済み・MVP」と更新。

## 未実装（SPEC との差分・次作業）

- 新フォーマット **全列**（右側集計ブロック・摘要別集計等）  
- **起票日**など旧／新で言及した任意列  
- 月次行の **消費率（計算のみ）**  
- ダッシュアプリの **入力 675 参照・集計フィールド**  
- **スペース割当**（`add-app` 時に `space` 未指定。必要なら kintone 管理画面で移動）  
- **アクセス権**（当部署グループのみ等はテナント側設定）

## 参照

- `kintone-apps.md`（アプリ 675・676）  
- `templates/yojitsu-budget-lite/SPEC.md` §6c
