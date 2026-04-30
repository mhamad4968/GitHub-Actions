# 🔬 新規 MCP 評価レポート: context7-mcp + excel-mcp（Q3 完成度優先実施）

**作成**: 2026-04-23 (Thu) 03:05 JST
**実施者**: AI（浜田 Q3 = 完成度優先 b 案承認後 / WebSearch 2 セッション）
**目的**: 戦略書 v1.0 第 10 部で🥇🥈に位置付けた 2 候補の実装可能性 + 浜田業務との適合性評価
**結論**: **両方採用推奨 / context7 = 即時可 / excel-mcp = 5/13 PC 台帳本番後**

---

## 📌 サマリ（30 秒で読める要約）

| MCP | 推奨度 | 採用時期 | リスク | コスト |
|---|---|---|---|---|
| **context7-mcp** (Upstash) | ⭐⭐⭐ 強推奨 | **5/13 PC 台帳本番運用後（5/14-16）即評価** or 浜田判断で前倒し可 | 低（活発メンテ + Cursor 公式統合）| ¥0（個人利用無料 / API キーでレート緩和）|
| **excel-mcp (negokaz/excel-mcp-server)** | ⭐⭐⭐ 強推奨 | **5/13 後 + Excel 業務発生時** | 低（WSL/Linux 対応確認済）| ¥0（MIT ライセンス）|

---

## 🧪 context7-mcp 詳細評価

### 概要
- **ベンダー**: Upstash（Redis Serverless で有名な企業）
- **機能**: ライブラリ・フレームワーク・SDK の **公式ドキュメントを LLM が直接引ける**
- **解決する問題**: LLM の学習データに含まれない最新 API / 古い情報によるハルシネーション抑制

### インストール
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "(任意 / レート緩和したい場合 context7.com で取得)"
      }
    }
  }
}
```

### 使い方
プロンプト末尾に `use context7` を追記すると LLM が自動で context7 を呼ぶ:

```
kintone JavaScript API でレコードを取得する方法を教えて。 use context7
```

または ID 直接指定:
```
context7 で /facebook/react のドキュメントを参照して...
```

### 対応ライブラリ
- **数千の主要 OSS ライブラリ**（Next.js / React / Vue / Supabase / MongoDB / Express / etc）
- **kintone JavaScript API**: 公式インデックスに含まれているか **未確認**
  - 含まれていれば即活用可
  - 含まれていなければ [追加リクエスト](https://context7.com/docs/adding-libraries) で対応依頼可

### 浜田業務との整合
| 業務 | context7 活用シーン |
|---|---|
| kintone customize JS 開発 | kintone JS API リファレンスを毎回 WebSearch している現状 → context7 で 1 ステップ化 |
| FAQ ポータル HTML 改修 | Vue / DOM API / fetch API 等の最新 docs 即引き |
| 経理 FAQ ポータル | iframe / blob URL / File API の最新仕様参照 |
| Vite / ESLint / その他 | 設定変更時に最新公式 docs 即引き |

### メリット・デメリット

| メリット | デメリット |
|---|---|
| LLM ハルシネーション抑制（最重要）| MCP 16 → 17 件への増加 = §47-B ルール疲労リスク微増 |
| 開発速度向上（WebSearch 3-5 ステップ → 1 ステップ）| kintone JS API 未対応の可能性（要事前確認）|
| 個人利用無料 | プロンプト末尾 `use context7` の手間（軽微）|
| Cursor 公式統合容易 | API キー無しだとレート制限（業務利用なら取得推奨）|
| 数千ライブラリ対応 | Upstash 撤退時のリスク（依存ベンダー） |

### 採用判断推奨フロー
1. **5/13 PC 台帳本番運用直後（5/14）**: context7.com に kintone JavaScript API が登録されているか確認
2. **登録あり** → 即 mcp.json に追加 + Cursor 再起動 + 1 タスクで試用
3. **登録なし** → 追加リクエスト + 5/30 までに対応待ち + 対応後採用
4. **試用 1 週間で評価** → 月次健康診断で「context7 使用回数」を確認 → 0 回なら削除

### 関連 MCP（採用しない判断）
- **gitmcp**: GitHub レポから docs を取るが、context7 ほど精度高くない
- **docfork**: 試験段階 / メンテ未確認

---

## 🧪 excel-mcp 詳細評価（候補 3 つ比較）

### 候補 1: negokaz/excel-mcp-server ⭐⭐⭐ 採用推奨
- **GitHub**: https://github.com/negokaz/excel-mcp-server
- **ベンダー**: 個人 OSS（活発メンテ）
- **言語**: Node.js (20.x+)
- **インストール**: `npx --yes @negokaz/excel-mcp-server`
- **対応プラットフォーム**: Windows / Linux / macOS（**WSL Linux で動作可**）
- **機能**:
  - テキスト・数式の読み書き
  - シート作成
  - セル書式設定
  - テーブル作成
  - Windows のみ: スクリーンキャプチャ（不要）
- **ライセンス**: MIT（無料）

### 候補 2: kousunh/Excel-mcp-server
- **特徴**: ライブモード（xlwings）+ パスモード（純粋 Python）の 2 モード
- **WSL 対応**: パスモードのみ
- **インストール**: git clone + npm install + pip install（やや重い）
- **採用判定**: 候補 1 で十分なため不採用

### 候補 3: sbroenne/mcp-server-excel
- **特徴**: .NET 製 / Excel COM オートメーション
- **対応**: Windows 専用（Excel デスクトップ版必須）
- **採用判定**: WSL 環境で動かないため不採用

### 浜田業務との整合（candidate 1: negokaz）
| 業務 | excel-mcp 活用シーン |
|---|---|
| M365 5 台ライセンス管理 | kintone 627 から Excel に export → AI が読取・整形 |
| 経理 FAQ ポータル | 経理担当が Excel で渡す元ファイルを AI が読取 → kintone import |
| 月次レポート | kintone 集計結果を Excel テンプレに書込 → 浜田レビュー |
| PC 台帳移行（5 月以降） | B-1 / B-2 CSV を Excel として整形検証 |

### メリット・デメリット

| メリット | デメリット |
|---|---|
| 浜田の Excel 業務直結（実用性最高）| MCP 16 → 17 件 (context7 と同時導入なら 18 件) |
| WSL Linux で動作確認済 | xlsx 仕様の理解必要（書式・式の制約）|
| MIT ライセンス無料 | 大規模ファイル（10MB+）のパフォーマンス未検証 |
| 数式読取可 | Excel 起動不要（裏返せばライブ編集不可）|

### 採用判断推奨フロー
1. **5/13 PC 台帳本番後**: 浜田に「Excel 業務で AI に手伝ってほしいシーン」を聞く
2. ある → 即 mcp.json に追加 + 試用
3. ない → 削除候補に格付（無理に追加しない）

---

## 📋 浜田判断用 Q4-Q5 候補

context7 / excel-mcp の採用は浜田判断必要のため、19:00 戻り後の Q4 / Q5 として準備:

### Q4 候補: context7-mcp を 5/14 (5/13 本番翌日) に試験導入する？
- a: 即試験導入（kintone JS API 登録確認 + 1 タスクで試用）
- b: 5/16 サブエージェント PoC 再議論時に併せて判断
- c: 採用しない（現状の rag + WebSearch で十分）

### Q5 候補: excel-mcp (negokaz 製) を 5/13 後に試験導入する？
- a: 即試験導入
- b: Excel 業務発生時に追加判断
- c: 採用しない

→ **これらは 4/23 19:00 戻り後の浜田判断項目とする**（今夜は提案のみ）

---

## 🔗 関連

- 戦略書 v1.0: `docs/plans/2026-04-23-mcp-strategy-v1.md` 第 10 部
- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md`
- env 経由化: `docs/reports/2026-04-23-mcp-env-research.md`
- D12 MCP 状態管理台帳: `docs/approved-changes/2026-04-24/D12-mcp-status-table.proposal.json`
