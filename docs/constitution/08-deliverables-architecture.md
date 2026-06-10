# 成果物・アーキテクト（§31〜§33）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: 納品・図解・外部調査  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 要約

このジャンルに属する § は、下記本文どおり `AGENTS.md` から抽出したものです。解釈の最終正本は `AGENTS.md` の同一 § です。

---

## 第9章 成果物管理

### §31 成果物納品プロトコル（2026-04-15 制定）
完成した成果物（HTML・JS・ドキュメント等）は、以下のルールで納品する:
1. **納品場所**: `C:\tmp\<YYYYMMDD>-<枝番>\`（WSL: `/mnt/c/tmp/<YYYYMMDD>-<枝番>/`）に配置する。同一日の複数回納品は枝番（-1, -2, -3...）で管理する。
2. **視認性**: 隠し属性を付けず、標準パーミッションで作成する。Windows エクスプローラーで即座に確認できること。
3. **報告**: 納品完了後、チャットで **納品先のフルパス** を報告する。
4. **プロジェクト正本との分離**: `C:\tmp` は「検収場」。正本は `kintone-ai-lab/` のまま。納品先は差し戻し用のスナップショットとして機能する。
5. **Kintone 運用ガイドの本番反映**: `docs/ops-guide/*.html` を改修したら、**`npm run ops-guide:publish`**（レコード同期 + `customize/ops-guide/desktop.js` のデプロイ）までを一連の完了とする。初回のみ **`npm run ops-guide:init`** と `.env` の **`KINTONE_OPS_GUIDE_APP`**（コンソール表示値を追記）。手順の正本は **`docs/ops-guide/KINTONE-AUTO.md`**。

---



## 第10章 アーキテクト能力（2026-04-15 制定）

### §32 図解義務化（Visual Documentation）
3アプリ連動など**複数アプリ・複数ステップにまたがる処理**を実装・改修する際は、以下を必ず行う:
1. **Mermaid フロー図を作成**し、`docs/` 内の設計書に埋め込む
2. 図には**アプリ間のデータフロー**（どのフィールドが・どこから・どこへ）を明示する
3. 図を見れば**コードを読まなくても処理の全体像が分かる**状態にする

利用ツール: Markdown 内の `mermaid` コードブロック（GitHub / エディタプレビューで表示可能）。

### §33 外部知見の検証（External Intelligence）／事前調査義務（重要ルール 2026-04-16 強化）

#### §33-A 実装前の事前調査義務（着手前に必ず実施）
**未経験 / 不確実 / 失敗実績のある領域に着手する前に、必ず MCP およびネットで類似事例・ベストプラクティス・既知の制約を調査する**。「とりあえず書いて試す」を最初の一歩にしない。

**必須トリガー（以下のいずれかに該当する場合は調査必須）:**
- Kintone カスタマイズの新領域（カスタムビュー / iframe 埋め込み / ファイル操作 / OAuth / プラグイン連携 など）
- ブラウザ標準 API の挙動が CSP / sandbox / iframe で変わる可能性がある領域（`postMessage` / `position:sticky` / `srcdoc` / `service worker` 等）
- 同一テーマで一度でも失敗した経験がある領域（§14 の方針転換と連動）
- 外部 SaaS / API の最新仕様確認（Kintone REST API の制限値、Microsoft Graph、Google Workspace 等）
- セキュリティ / 暗号 / 認証関連（自己流実装は §18 違反リスク）
- **kintone API の特殊仕様（2026-04-20 追加 / TSB 教訓）**: `change.<field>` イベントが Promise/Thenable を return できない / lookup フィールドへの API 書き込み制約 / サブテーブル更新時の id 必須 / kintone クエリの演算子制約（type/RADIO_BUTTON は in/not in のみ）/ ルックアップと計算フィールドは API 更新で即時反映されない 等 → **実装前に公式または既存コードで 1 ステップ確認**してからコード書く。2026-04-19 の `change.user_name` で async 書いて Thenable エラーで止まった事例が教訓

**調査ステップ（最低 3 つ実施してから着手）:**
1. **公式ドキュメント**: cybozu developer network、MDN、RFC、各 API 公式リファレンス（`fetch` MCP / `WebFetch`）
2. **既知事例**: GitHub の同等実装を検索（`github` MCP の code search。WSL では **`gh`** を優先）。ライセンス確認も同時に
3. **失敗事例 / 既知の落とし穴**: Stack Overflow / Zenn / Qiita / Cybozu Developer Network フォーラムを **`duckduckgo-search` MCP** で検索（「issue」「workaround」「limitation」「does not work」を組み合わせる）
4. **社内ナレッジ**: `kintone-ai-lab/docs/troubleshooting.md`（TSB-XXX）と RAG（`rag` MCP）を検索。過去の自分の教訓が最大のヒント

**結果の活用:**
- 着手前にユーザーへ「調査の要点（既知制約 1-3 点）」を 2-3 行で要約報告する。
- 採用したアプローチがなぜ妥当か、調査結果を根拠として 1 行添える。
- 調査で「この方法は環境制約で動かない」と判明したら、即 §14 を発動して別アプローチへ。

**今回の事例（反省記録 2026-04-16）:**
- iframe srcdoc + sandbox 内で `position:sticky` / postMessage 自動リサイズが不安定な件は、事前に MDN / GitHub Issue を 5 分調べていれば最初から避けられた。3 回の失敗を経てユーザーから明示的に指摘されてから方針転換した（手戻り発生）。
- 教訓: **新しい埋め込み環境（iframe / sandbox / Kintone カスタムビュー）に手を入れる前は、必ず「既知制約調査」を 1 ステップ挟む**。

#### §33-B 外部コード採用時の検証
GitHub・npm・Stack Overflow 等から外部コードを参考にする際は、以下を自己検証してから適用する:
1. **§13 適合**: ネイティブ API / 標準仕様で同じことができないか先に確認。外部ライブラリは最後の手段
2. **§18 セキュリティ**: API トークン・認証情報の漏洩リスクがないか
3. **kintone 互換性**: `kintone.events.on` のコールバック制約、`kintone.api` の非同期仕様と矛盾しないか
4. **ライセンス**: MIT / Apache 2.0 等の許容ライセンスであることを確認

安易なコピペは禁止。外部コードを使う場合はコメントに**出典 URL**を記載する。

#### 利用ツール（優先順位）
1. `rag` MCP — 社内ナレッジ（最速・最も信頼）
2. `fetch` MCP / `WebFetch` — 公式ドキュメント直接取得
3. `duckduckgo-search` MCP — Web 検索（**`tavily` は 2026-05-06 削除済**／`docs/mcp-status.md`）
4. `github` MCP — 実装事例・Issue 検索（WSL では **`gh`** を優先）
5. `cve-search` MCP / `cyber-news` MCP — セキュリティ関連時のみ

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| §↔ジャンル | `data/constitution-section-genre-map.json` |
| Cursor 常時 | `.cursor/rules/cio-constitution.mdc` |
| 手順 | `WORKFLOW.md` |

