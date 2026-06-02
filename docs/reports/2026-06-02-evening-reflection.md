# 夕反省 — 2026-06-02 JST（682 GHA / Apple ID 仕様確定）

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`  
> **前日決定禁止** — 業務レーンは **当日 -0** で聞く（本件は **6/3 Apple ID 作成 GO** は浜田が本日明示）

---

## AI の失敗・反省

| # | 失敗 | 再発原因 | 対策 ID |
|---|------|----------|---------|
| F1 | Excel 再分析時 **`C:\tmp` に xlsx が無く** inline 集計が失敗 | セッション跨ぎで tmp パス未再確認・単一パス依存 | **A1** |
| F2 | SPEC 草案に **誤字（中国語「否则」）** が混入 | 人間確認前の下書きをそのまま commit 候補にした | **A2** |
| F3 | `icloudSummary.maxNo` が **日付シリアル誤読**（分析スクリプト列 index ずれの疑い） | ヘッダ検出と実列 B/C の前提が未検証のまま JSON 正本化 | **A3** |
| F4 | 682 GHA 修正後、ローカル workflow が **文字化け diff** 状態に | editor/CRLF または未 restore の作業ツリー残存 | **A4**（本日 `git restore` 済） |
| F5 | Apple ID 仕様で **「プール/返却」→「利用中/廃止」** に何度も改稿 | 初回 Excel ヒアリングでステータス語彙を先に固定しなかった | **A5** |
| F6 | 6/4 Excel **削除**合意後、**削除前チェックリストの npm 化**が未着手 | 口頭合意のみで runbook/スクリプト未作成 | **A6** |

---

## アップデート案（承認待ち）

### ブロック A — 6/3 Apple ID 実装前（**優先・推奨 GO**）

| ID | 内容 | 効果 | 工数 |
|----|------|------|------|
| **A1** | **`npm run apple-id:verify-xlsx`** — `C:\tmp\appleID管理一覧\*.xlsx` 存在・シート `icloud`・行数下限チェック。**6/3 朝イチ必須** | 移行空振り防止 | 小 |
| **A2** | SPEC / runbook 保存前 **`rg '[\u4e00-\u9fff]'` 以外の CJK 混在**を CI または pre-commit で警告（至少: AI 自己チェック項目） | 誤字混入防止 | 小 |
| **A3** | `tmp-analyze-apple-id-xlsx.mjs` を **列 index をヘッダ名から動的解決**に修正し、移行スクリプトと **同一ライブラリ**化 | 移行データ破損防止 | 中 |
| **A4** | 締め時 **`git diff --name-only` で workflow 文字化け検知**（`verify-session-close-git-warn` 拡張案） | GHA 正本汚染防止 | 小 |
| **A5** | 今後の kintone 仕様セッション開始時 **§41 で先に固定する 5 項目テンプレ**（ステータス語彙・書込経路・採番・削除/廃止・Excel 退役日） | 仕様ブレ削減 | 小（doc のみ） |
| **A6** | **`docs/runbooks/apple-id-go-live.md`** — §10.3 チェックリスト + 6/4 **`npm run apple-id:retire-excel -- --apply`**（削除＋ログ） | Excel 削除の取り違え防止 | 中 |

### ブロック B — 実装当日の手順（6/3 実行順・SPEC §14 補強）

| ID | 内容 | 効果 |
|----|------|------|
| **B1** | **677 型 DB ブロック** — `customize/apple-id-db/` を **678 desktop.js の写経ではなく** 677 既存パターンからコピー＋フィールドコード差替 | save/delete 漏れ防止 |
| **B2** | 移行 **dry-run** — `apple-id:migrate:xlsx --dry-run` で POST 件数・`user_name` 結合サンプル 10 行を stdout | 本番 POST 前の目視材料 |
| **B3** | 採番 UT — `jbis.039` 起点・034–038 スキップ・既存 max との max(39,n+1) を **単体テスト 3 ケース** | 二重採番防止 |
| **B4** | §50-3-8（DeepSeek 盲点 3 点 + 3 行突合メモ）を **採番・DELETE API 実装直前**に必須化（runbook 1 行追記） | 憲法ゲート遵守 |

### ブロック C — 運用・UX（6/3 余力 or 6/4）

| ID | 内容 | 効果 |
|----|------|------|
| **C1** | 削除確認で **氏名あり →「退職なら廃止」** 警告（SPEC §5.3 済 — implement 確認） | 誤 DELETE 防止 |
| **C2** | ダッシュ **未割当フィルタ**（`user_name` 空 & 利用中）を既定タブ | Excel プール行相当の視認性 |
| **C3** | `kintone-apps.md` 追記テンプレ（App ID・BUILD・Space 21 thread 23）を **deploy 直後チェックリスト**化 | 台帳漏れ防止 |

### ブロック D — レーン混同防止（継続）

| ID | 内容 | 効果 |
|----|------|------|
| **D1** | 6/3 セッション **項番 -0** で「**Apple ID レーン**（Space 21）— 業務改善 6/8 凍結と混同しない」を **1 行宣言** | 674/677 取り違え防止 |
| **D2** | checkpoint 先頭 **凍結表は維持** — Apple ID は **Q36 外の独立案件**と LITE 1 行追記 | 前倒し業務改善との衝突回避 |

---

## 承認の仕方（浜田）

- **一括 GO**: 「A1–A6 + B1–B4 GO」など
- **部分 GO**: ID 単位（例: A1/A6 のみ）
- **却下**: ID + 理由 1 行 → 6/3 は SPEC 最小実装のみ

**CIO 推奨（6/3 前夜）**: 最低 **A1 + B2 + B4 + D1** を GO。A6 は 6/4 朝までに GO 推奨。

---

## 夕反省に書かないもの

- 本日成果（682 GHA・Apple ID SPEC）→ **19 / SESSION-CLOSE**
- 6/3 作業順の詳細 → **`docs/plans/2026-06-02-apple-id-kintone-spec.md` §10–§14**
- 6/8 業務改善 → **checkpoint 凍結表**

---

## 参照（事実 — 読み上げ不要）

- 682 GHA run **26806570679** success（5038 stamp  bundling 修正）
- Apple ID SPEC **確定** — 作成 **6/3** / 運用 **6/4** / Excel 削除 **6/4**
- 682 ローカル workflow 文字化け → **restore 済**
