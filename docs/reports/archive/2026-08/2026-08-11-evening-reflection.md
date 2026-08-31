# 夕反省 — 2026-08-11

> スコープ正本: `docs/runbooks/evening-reflection-scope.md`  
> **GO**: **浜田全対応指示（2026-08-11「すべてたいおうしてOK」「安全に確実に対応」）** → 反映正本 `docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md`  
> 第2者: DeepSeek（反映前盲点3点・§50-3-8）

## 0. GitHub 確認（本日）

| 項目 | 結果 |
|------|------|
| open Issue / PR | **0** |
| constitution-gates / cursor-env-gates / kintone-customize-deploy | tip push 後 **success**（同一 BUILD スキップ含む） |
| `verify:gha-periodic-workflows` | **OK** |
| `682-graph-monthly-refresh` | 08-01 schedule 失敗は恒久スキップ済・直近 dispatch **success** |
| `npm audit` | **0** |
| 未 push | 作業中に **ahead 20** → 本日 push で解消 |

---

## 1. 失敗（事実）

| # | 事実 |
|---|------|
| 1 | PC買替が削除済 **596** を採番参照したまま（退役参照の後追い） |
| 2 | クローン POST に `RECORD_ID` / `RECORD_NUMBER` 等システム項目が混入 |
| 3 | 必須 `skysea_manual_done` を空にし CB_VA01 |
| 4 | 買替作成後が詳細表示で、HW 必須の編集導線が欠けた |
| 5 | SKYSEA 未導入機にもクライアント削除待ちバナー |
| 6 | 最新棚卸日と履歴の二重真実（最新だけ埋めても履歴非追従） |
| 7 | 一覧検索で IME 中 datalist 更新 → `ma`→`mあ` |
| 8 | 買替1機能で多段 deploy（仮説未固定） |
| 9 | `main` が origin より約20コミット先行し tip CI 未実行 |

---

## 2. 改善案（ミス削減）— 行動

| ID | 内容 | 状態 |
|----|------|------|
| **T1** | 複製 POST 前: システム項目除外・必須 DROP_DOWN 非空・空 DATE/NUMBER 省略 | **反映済** |
| **T2** | 作成系は POST 後遷移（edit/show）＋直後必須をセット設計 | **反映済** |
| **T3** | フラグ連動バナーは「条件＝状態の意味」を1行書いてから実装 | **反映済** |
| **T4** | 検索／入力は IME composition 前提 | **反映済** |
| **T5** | 案件区切りで ahead なら push＋CI 緑まで | **反映済** |

---

## 3. 改善案 — ルール・脚本

| ID | 内容 | 状態 |
|----|------|------|
| **R1** | 674 買替／クローン薄い runbook | **反映済** |
| **R2** | `verify:retired-app-refs` を pre-push＋constitution-gates へ | **反映済** |
| **R3** | clone POST 純関数 lib＋単体＋desktop 針一致 | **反映済** |
| **R4** | datalist／IME ガード方針の文書化 | **反映済** |

---

## 4. §体制・運用・MCP・ルール・憲法

### 4-A 体制

| ID | 内容 | 状態 |
|----|------|------|
| **ORG-1** | 作成＋必須の前に浜田1行: 遷移先 edit / show | **反映済** |
| **ORG-2** | 退役時は inventory 登録と参照ゲートを同ターン | **反映済** |

### 4-B 運用

| ID | 内容 | 状態 |
|----|------|------|
| **OPS-1** | 複製系 DoD 4点（API・必須・遷移・フラグ条件） | **反映済** |
| **OPS-2** | 棚卸: 履歴＝正本／最新＝派生（維持） | **反映済** |
| **OPS-3** | 機能完了単位で定期 push（ahead 放置禁止） | **反映済** |

### 4-C MCP

| ID | 内容 | 状態 |
|----|------|------|
| **MCP-1** | 買替・クローン障害時は form 必須／型を MCP で先確認 | **反映済** |
| **MCP-2** | 新 MCP サーバー追加 | **見送り（承認）** |

### 4-D ルール

| ID | 内容 | 状態 |
|----|------|------|
| **RULE-1** | 薄い globs mdc（clone POST／IME） | **反映済** |
| **RULE-2** | 退役アプリ ID を稼働コードに残さない（inventory 1行） | **反映済** |

### 4-E 憲法

| ID | 内容 | 状態 |
|----|------|------|
| **CON-1** | AGENTS.md 大改訂 | **見送り（承認）** |
| **CON-2** | 多段 deploy は stamp note に仮説1行 | **反映済** |
| **CON-3** | 未 push＝検証ゼロ。ahead 放置を運用違反 | **反映済** |

### 1-N 憲法運用レビュー（本日の結論）

主因は **退役参照**・**複製 POST**・**遷移／フラグ**・**IME**・**未 push**。条文大改訂より複製 DoD・退役ゲート頻度・push 区切りの薄い恒久化で足りる。

---

## 5. 反映先（本パッケージ）

- 仕様: `docs/plans/2026-08-11-evening-improvements-spec.md`
- runbook: `docs/runbooks/cio-ops-2026-08-11-evening-improvements.md`
- 674: `docs/runbooks/pc-ledger-674-replace-clone-post.md`
- IME: `docs/runbooks/kintone-input-ime-datalist.md`
- rule: `.cursor/rules/cio-ops-2026-08-11-evening-improvements.mdc`
- GO: `docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md`
- lib/針: `scripts/lib/kintone-record-clone-post.mjs`／`scripts/lib/kintone-record-clone-post.test.mjs`／`scripts/test-evening-improvements-2026-08-11.mjs`

**出さないもの（スコープ）**: 明日のレーン・第1手・スケジュール案。
