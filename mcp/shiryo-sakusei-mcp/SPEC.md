# 経営会議資料（情報セキュリティレポート）月次作成 — 仕様書

**版**: 1.0.0  
**作成日**: 2026-07-12  
**対象**: 月次経営会議向け「情報セキュリティレポート」docx の AI 支援作成

---

## 1. 目的

経営会議資料のうち **周知事項（1〜2テーマ）** を AI が調査・初稿化し、**検知状況・社外事例** は浜田さんが後から記入する運用を標準化する。7月完成版の体裁・品質を毎月の目標とする。

## 2. 成果物と配置

| 種別 | パス | 管理 |
|------|------|------|
| 成果物フォルダ | `C:\tmp\資料作成` | ローカル（git 外） |
| 正本テンプレ docx | `C:\tmp\資料作成\_template_完成スタイル.docx` | ローカル |
| 月次完成版 docx | `【YYYY年N月度経営会議資料】YYYY年MM月情報セキュリティレポート.docx` | ローカル |
| 運用フロー | `C:\tmp\資料作成\00-運用フロー.md` | ローカル |
| 依頼書テンプレ | `C:\tmp\資料作成\依頼書テンプレート.txt` | ローカル（正本コピー: `docs/依頼書テンプレート.txt`） |
| MCP 実装 | `kintone-ai-lab/mcp/shiryo-sakusei-mcp/` | **git 管理** |

環境変数 `SHIRYO_WORK_DIR` で成果物フォルダを変更可能（既定: `C:\tmp\資料作成`）。

## 3. 役割分担

| 担当 | 内容 |
|------|------|
| **浜田さん** | 依頼書記入、検知状況・社外事例の数値・事例入力、トーン調整、画像貼付 |
| **AI** | 依頼テンプレ提示、ネット調査、周知初稿、空欄セクション準備、画像候補 URL リスト、完成版レビュー、テンプレ昇格 |

## 4. 月次フロー

```
依頼（テンプレ記入）
  → shiryo_copy_template（新規 docx）
  → AI 調査・周知文案作成（office-word 等）
  → shiryo_insert_definition_box（定義図形）
  → shiryo_save_image_candidates（画像候補 MD）
  → 浜田さん手直し
  → shiryo_review_checklist + shiryo_save_review_notes
  → shiryo_promote_to_template（次月正本更新）
```

## 5. 依頼のしかた

**作成日に** チャットで「経営会議資料を作成したい」と送信 → AI が `docs/依頼書テンプレート.txt` 相当を貼付 → 浜田さんが記入して返信。

必須項目: 会議月、レポート対象月、周知事項（1件以上）  
任意: 会議日、2件目テーマ、画像希望、その他制約

## 6. 初稿品質基準（7月スタイル）

- 「〇〇とは」丸角図形（`shiryo_insert_definition_box`）
- 手口は **段階×狙い** の表
- 教訓は **当社へ置き換えると** の表
- **皆様にお願いしたいこと** ブリッジ
- 締め「十分な理解と対処が必要ですので…周知をお願いします」
- `２.検知状況`・`社外事例` は空欄（浜田さん入力）
- 画像候補リスト添付（URL のみ。docx への直接埋め込みは浜田さんが選定後）

品質評価: `shiryo_review_checklist`（パターンマッチによる自動チェック）

## 7. MCP 構成

```
shiryo-sakusei-mcp/
├── index.mjs              # MCP エントリ（Cursor 名: shiryo-sakusei）
├── lib/core.mjs           # ビジネスロジック
├── python/report_cli.py   # docx 操作（python-docx / lxml）
├── assets/roundrect-paragraph.xml  # 丸角定義図形 OOXML
├── docs/依頼書テンプレート.txt
├── README.md
└── SPEC.md（本書）
```

### 依存

- Node.js 20+
- Python 3 + `python-docx` + `lxml`
- 共有: `mcp/lib/mcp-stdio.mjs`

### Cursor 登録

`~/.cursor/mcp.json` の `shiryo-sakusei` エントリ。変更後は **Cursor 再起動** が必要。

```json
"shiryo-sakusei": {
  "command": "node",
  "args": ["C:\\Users\\mhamada202408224\\kintone-ai-lab\\mcp\\shiryo-sakusei-mcp\\index.mjs"]
}
```

## 8. ツール API 一覧

| ツール | 入力（主要） | 出力 |
|--------|-------------|------|
| `shiryo_get_config` | — | workDir, templatePath, workflow, checklist |
| `shiryo_list_files` | workDir? | ファイル一覧 |
| `shiryo_build_filename` | meetingMonth, reportMonth, year? | filename, fullPath |
| `shiryo_copy_template` | meetingMonth, reportMonth, meetingDate? | 新規 docx パス |
| `shiryo_insert_definition_box` | docxPath, header, body, paragraphIndex? | Python CLI 結果 |
| `shiryo_extract_document` | docxPath | テキスト・表 |
| `shiryo_review_checklist` | docxPath | score, items[] |
| `shiryo_save_image_candidates` | meetingMonth, topics[], candidates? | MD パス |
| `shiryo_get_image_search_hints` | theme, keywords? | queries[], officialSources |
| `shiryo_promote_to_template` | docxPath | templatePath |
| `shiryo_save_review_notes` | meetingMonth, notes?, items? | JSON パス |

## 9. 連携 MCP

| MCP | 用途 |
|-----|------|
| **shiryo-sakusei** | 資料作成専用レーン |
| **office-word** | docx 細部編集 |
| **markdownify** | 警察庁/JC3/IPA PDF・Web の調査 |
| **duckduckgo-search** | 最新ニュース・公式ページ探索 |
| **playwright** / **chrome-devtools** | 図表確認 |
| **cve-search** | 脆弱性・インシデント事実確認 |

## 10. 画像候補の出典優先順

1. 警察庁・JC3・IPA・総務省・NISC
2. 当事者企業の公式ニュースリリース PDF
3. 報道記事内の公式引用図（要確認）

著作権不明の画像は docx に直接埋め込まない。

## 11. ファイル命名規則

```
【{会議年}年{会議月}月度経営会議資料】{レポート年}年{MM}月情報セキュリティレポート.docx
```

例: `【2026年8月度経営会議資料】2026年07月情報セキュリティレポート.docx`  
（8月度会議＝7月分レポート）

## 12. 変更履歴

| 日付 | 版 | 内容 |
|------|-----|------|
| 2026-07-12 | 1.0.0 | 初版。7月完成版ベースの MCP・運用フロー・依頼書テンプレ確立 |
