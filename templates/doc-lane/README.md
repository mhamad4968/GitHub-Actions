# doc-lane PowerPoint テンプレート置き場

> **仕様**: `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md`

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
