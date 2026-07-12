# shiryo-sakusei-mcp

経営会議・情報セキュリティレポート（月次）の資料作成専用 MCP。

**仕様書**: [SPEC.md](./SPEC.md)  
**依頼書テンプレ**: [docs/依頼書テンプレート.txt](./docs/依頼書テンプレート.txt)

## 配置

- `index.mjs` — MCP エントリ（Cursor: `shiryo-sakusei`）
- `lib/core.mjs` — ワークフロー・ファイル操作
- `python/report_cli.py` — docx 操作（python-docx / lxml）
- `assets/roundrect-paragraph.xml` — 「〇〇とは」丸角図形テンプレ

## 依存

- Node.js 20+
- Python 3 + `python-docx` + `lxml`
- 成果物フォルダ: `C:\tmp\資料作成`（`SHIRYO_WORK_DIR` で変更可）

## ツール一覧

| ツール | 説明 |
|--------|------|
| `shiryo_get_config` | 運用フロー・チェックリスト・公式画像探索先 |
| `shiryo_list_files` | 資料作成フォルダ一覧 |
| `shiryo_build_filename` | 出力ファイル名生成 |
| `shiryo_copy_template` | テンプレ複製＋表題＋検知/事例空欄 |
| `shiryo_insert_definition_box` | 丸角定義図形挿入 |
| `shiryo_extract_document` | テキスト抽出 |
| `shiryo_review_checklist` | 7月スタイル品質チェック |
| `shiryo_save_image_candidates` | 画像候補 Markdown 保存 |
| `shiryo_get_image_search_hints` | 公式サイト探索クエリ |
| `shiryo_promote_to_template` | 完成版→正本テンプレ昇格 |
| `shiryo_save_review_notes` | レビュー JSON 保存 |

## 有効化

`~/.cursor/mcp.json` に登録済み。**Cursor を再起動**すると `shiryo-sakusei` が利用可能。

## 月次の典型フロー

1. `shiryo_copy_template` — 新規 docx
2. （AI が周知文案・表を office-word 等で編集）
3. `shiryo_insert_definition_box` — 定義図形
4. `shiryo_save_image_candidates` — 画像 URL リスト
5. 浜田さん手直し
6. `shiryo_review_checklist` + `shiryo_save_review_notes`
7. `shiryo_promote_to_template` — 次月正本更新
