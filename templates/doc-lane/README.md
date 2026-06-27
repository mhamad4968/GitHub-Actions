# doc-lane テンプレート置き場

> **仕様**: PPTX → `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md`  
> **経営会議 Word**: `docs/runbooks/keiei-kaigi-security-report.md`

## 経営会議 — 情報セキュリティレポート（Word）

| ファイル | 役割 |
|----------|------|
| `keiei-kaigi-security-report-structure.md` | **文書ひな形**（§1/§2/事例表） |
| `keiei-kaigi-docx-registry.json` | `C:\tmp\資料作成` 内 DOCX 台帳 |

実物 DOCX は **`C:\tmp\資料作成\`**（Git 外）。推奨ベース = 直近経営会議提出版。

## PowerPoint テンプレート置き場

## リポ内（このフォルダ）

- **README のみ** — バイナリ `.pptx` は v1.5 まで Git に置かない（サイズ・機密）

## 作業用テンプレ（ローカル）

社内ブランド付きテンプレがある場合:

```
C:\tmp\資料作成\templates\
  jbis-standard.pptx      ← 浜田配置 or 既存資料からコピー
```

MCP `create_presentation_from_templates` は **絶対パス**で参照。

## テンプレが無い場合

1. MCP `create_presentation` で白紙起稿
2. または `node scripts/build-qualification-roadmap-hr-deck.mjs` 等の既存 generator を参考に **scripts/** に再現スクリプトを追加

## 関連

- `docs/runbooks/doc-lane-pptx-mcp.md`
- `data/c-tmp-workspace-registry.json` — `C:\tmp\資料作成`
