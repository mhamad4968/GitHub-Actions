# WORKFLOW.md — タスク作業 OS（単一の作業手順）

> 制定: 2026-04-18 / 改訂: -
> 本ファイルは AGENTS.md（憲法）に従う「実行手順」である。
> AI エージェントは **すべてのタスクを以下の Phase 0 → Phase 5 の順** で進める。
> 各 Phase の完了時に「Phase X 完了宣言」を必ず出してから次へ進む。

---

## 全体像

```
[タスク受領]
   ↓
Phase 0: 文脈獲得（過去ログ確認）             AGENTS.md §42
   ↓
Phase 1: 事前調査（MCP / Web / RAG）          AGENTS.md §33-A
   ↓
Phase 2: 設計&計画(end-to-end + ロールバック) AGENTS.md §32, §15
   ↓ ──┐ §41 一問一答で承認
Phase 3: 実装(小ステップ + 各ステップ検証)    AGENTS.md §14
   ↓
Phase 4: 検証(lint / test / 視覚 / a11y)    AGENTS.md §9, §11, §26-§30
   ↓
Phase 5: 記録(kintone-apps / RAG / TSB)     AGENTS.md §19-§21
   ↓
[簡潔報告]                                    AGENTS.md §37
```

---

## Phase 0: 文脈獲得

### 入場条件
- ユーザーから新しい依頼を受領した

### 必須アクション
1. **朝のブリーフィングを最優先で読む**: `docs/reports/<今日の日付>-morning-prep.md` が存在すれば最初に読む（毎朝 06:00 cron 自動生成）
2. ブリーフィングが無い場合のみ以下を手動実行:
   - `Glob` で `docs/plans/*.md` をリストし、関連しそうなものを `Read`
   - `Glob` で `docs/reports/*.md` の直近 3 件を `Read`
   - `Read` で `kintone-apps.md` の末尾（更新履歴）100 行
   - `Grep` で過去の `agent-transcripts/<uuid>/<uuid>.jsonl` を関連キーワードで検索
   - 過去に踏んだ落とし穴は `docs/troubleshooting.md` の TSB-XXX

### 退場条件（宣言フォーマット）
```
✅ Phase 0 完了
- 朝ブリーフィング: 読了 / なし（手動 5 項目実施）
- 関連プラン: docs/plans/<file>.md
- 関連 TSB: TSB-XXX, TSB-YYY
- 過去会話の関連事項: <要約 1-2 行>
→ Phase 1 へ
```

---

## Phase 1: 事前調査

### 入場条件
- Phase 0 完了宣言が出ている

### 必須アクション（最低 3 ソース、§33-A 強制）

| 必須トリガーに該当する場合 | 調査ソース | ツール |
|---|---|---|
| 新規領域 / 失敗実績あり / iframe / sandbox / 外部 API / セキュリティ | 必須 | 下記 |
| ルーチン作業（既存の lint, deploy） | 任意（スキップ可。理由を宣言） | - |
| **Web UI への DOM 挿入**（kintone カスタマイズで `getHeaderSpaceElement` 等のスロットに要素を追加する場合）| **必須** | **`scripts/check-dom-injection.mjs <URL> <selector>` または Playwright MCP で対象 URL を開き DOM を確認** |

1. **公式ドキュメント** — `WebFetch` または `user-fetch` MCP / Cybozu Developer Network
2. **既知事例 / GitHub Issue** — `user-tavily` MCP / `user-google-search` MCP / `user-github` MCP
3. **社内ナレッジ** — `user-rag` MCP（`mcp-local-rag`）/ `docs/troubleshooting.md`

### 退場条件（宣言フォーマット）
```
✅ Phase 1 完了
- 調査要点（既知制約 1-3 点）:
  • <制約 1>
  • <制約 2>
- 採用方針: <一言>（根拠: 上記制約 X）
→ Phase 2 へ
```

スキップする場合は明示:
```
✅ Phase 1 スキップ（理由: ルーチン作業 / 既存パターン踏襲）
→ Phase 2 へ
```

---

## Phase 2: 設計 & 計画

### 入場条件
- Phase 1 完了 / スキップ宣言が出ている

### 必須アクション
1. **end-to-end ステップ** を全部書き出す（Phase 3〜5 で何をするか先に提示）
2. **検証ポイント** を各ステップに付ける（ESLint・playwright・手動確認 等）
3. **ロールバック手順** を 1 行で書く
4. **Mermaid 図** — 複数アプリ・複数ステップの場合は `docs/<日付>-<名称>.md` に保存（§32）
5. **§41 一問一答** でユーザー承認を取る（質問は 1 つだけ）

### 退場条件（ユーザー承認後）
```
✅ Phase 2 承認取得
- 計画ファイル: docs/<file>.md（または本メッセージ内）
- 検証ポイント: N 個
- ロールバック: <方法>
→ Phase 3 へ
```

---

## Phase 3: 実装

### 入場条件
- Phase 2 でユーザー承認を得ている

### 必須アクション
1. **計画通りに小ステップ実装**（1 ステップ = 1 ファイル変更が目安）
2. 各ステップ後に **lint / test / dry-run** を必ず通す
3. **同じ失敗 2 回で §14 ピボット**（即座にユーザーへ「方針転換します」と宣言）
4. **計画変更が必要になったら計画自体を先に更新**してから実装再開

### 退場条件
```
✅ Phase 3 完了
- 変更ファイル: N 個
- 各ステップの検証: 全通過 / X 件再走
- 計画変更: なし / あり（更新済み）
→ Phase 4 へ
```

---

## Phase 4: 検証

### 入場条件
- Phase 3 完了

### 必須アクション

| 種類 | ツール | 必須 |
|---|---|---|
| ESLint | `npm run lint:customize` | コード変更時 |
| 接続テスト | `npm run kintone:test` | API 呼び出し追加時 |
| 視覚検診 | Playwright MCP（PC + モバイル）| Web UI 変更時 |
| アクセシビリティ | `user-accessibility-scanner` MCP / axe-core | 公開 HTML 変更時 |
| ロード | dry-run / 1 件サンプル | 一括処理追加時 |

### 退場条件
```
✅ Phase 4 完了
- ESLint: 0 errors / 0 warnings
- 接続テスト: pass
- 視覚検診: PC ✓ / モバイル ✓ / コンソール 0 件
- 利用者向け確認手順:
  1. <手順 1>
  2. <手順 2>
→ Phase 5 へ
```

---

## Phase 5: 記録

### 入場条件
- Phase 4 完了

### 必須アクション
1. **`kintone-apps.md` の更新履歴**に 1 行追記（日付 / アプリID / BUILD revision / 概要）
2. 失敗を踏んだ場合 **`docs/troubleshooting.md` に TSB-XXX を追記**
3. **RAG 再 ingest**:
   ```
   npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/
   cp RULES-INDEX.md kintone-apps.md AGENTS.md WORKFLOW.md .rag/extra-docs/
   npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest .rag/extra-docs/
   ```
4. **`RULES-INDEX.md`** にも 1 行残す（任意）

### 退場条件
```
✅ Phase 5 完了
- kintone-apps.md: 1 行追記
- TSB: なし / TSB-XXX 追加
- RAG 再 ingest: 完了
→ 簡潔報告（§37）へ
```

---

## 簡潔報告（§37）

最終メッセージのフォーマット:

```
【結果】<1-2 行>
【テスト証拠】<lint / test / 視覚検診 等>
【納品パス】<該当ファイル / revision 番号>
【利用者向け確認手順】<3 項目以内>
```

---

## 自動化との連動

### 夕の反省サイクル（手動トリガー / §44）

ユーザーが「まとめて / 反省 / お疲れ / 終わり」等を発したら:

```
ユーザー発言
   ↓
AI: node scripts/evening-reflect.mjs で雛形生成
   ↓
AI: §2-§5（今日やったこと/うまくいった/詰まった/改善提案#R1#S1...）を埋めて提示
   ↓
ユーザー: 「#R1 承認 / #S1 却下 / #D1 修正して: …」
   ↓
AI: docs/approved-changes/<明日>/<id>.proposal.json を作成（status=approved）
```

### 朝の自動実施（毎朝 06:00 cron）

WSL cron が `scripts/daily-morning-prep.mjs` を実行し、ブリーフィングを `docs/reports/<日付>-morning-prep.md` に出力:

| # | 実行内容 | スクリプト |
|---|---|---|
| **0** | **昨夜承認分の自動実施（最優先）** | `node scripts/apply-approved-changes.mjs` |
| 1 | 環境ヘルス | `npm run kintone:test` |
| 2 | 静的解析 | `npm run lint:customize` |
| 3 | セキュリティ | `npm audit --omit=dev` |
| 4 | 依存最新性 | `npm outdated` |
| 5 | ルール整合性 | `node scripts/audit-rules.mjs` |
| 6 | プラン進捗 | `node scripts/scan-plans.mjs` |
| 7 | RAG 再 ingest | `npx mcp-local-rag ... ingest` |
| 8 | ブリーフィング生成 | `node scripts/daily-morning-prep.mjs` |

詳細は `scripts/daily-morning-prep.mjs` 内のコメント、cron 登録は `scripts/install-morning-cron.sh`、承認キューの仕組みは `docs/approved-changes/README.md`。

---

## 違反時のリカバリー

- **Phase 飛ばし**を発見したら、即座に該当 Phase へ戻り、宣言から再開
- **同じ失敗 2 回**で §14 を即発動（ピボット案 2 つ提示）
- **「忘れた？」「過去の話」と指摘されたら**、§42 を即発動（5 項目 grep 実行）

---

## 関連文書

- `AGENTS.md` — 開発憲法（§1-§49）
- `RULES-INDEX.md` — ルール逆引き索引
- `kintone-apps.md` — kintone アプリ仕様 + 更新履歴
- `docs/troubleshooting.md` — 失敗事例の TSB-XXX
- `docs/plans/` — 計画ファイル
- `docs/reports/` — レポート（朝のブリーフィング含む）
