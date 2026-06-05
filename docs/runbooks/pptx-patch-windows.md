# PPTX 編集 runbook（Windows）

> **制定**: 2026-06-03（夕反省 **P1–P5 GO**）

## 適用

- Desktop / `C:\tmp\` 配下の **PowerPoint** を AI が python-pptx で編集するとき
- MCP `user-office-powerpoint` を使うときも **パス解決ルールは同じ**

## 手順（必須）

1. **パス**: `Path.glob('*.pptx')` で実ファイルを解決。**ファイル名の推測・ハードコード禁止**（P2）
2. **バックアップ**: 編集前に `*_backup.pptx` または `*_更新YYYYMMDD.pptx` をコピー
3. **本文差替**: `text_frame.clear()` のあと全文を再設定。**追記のみ禁止**（P1）
4. **検証**: 保存直後に python で対象段落を read-back。期待文字列が無ければ **再保存しない**
5. **Windows 実行**: スクリプトは **`C:\tmp\*.py` にファイル化**して `python C:\tmp\xxx.py`。**PowerShell heredoc（`<<'EOF'`）禁止**（P5）
6. **人事向けスライド**: 編集前に **区分表（必須/推奨/任意）をチャットで1回提示 → 浜田 OK 後に着手**（P4）

## 正本

- 資格ロードマップ区分: `scripts/data/qualification-roadmap.json`（P3）
- 生成・パッチ例: `C:\tmp\rebuild_roadmap_pptx.py` / `C:\tmp\fix_slide4_section4.py`

## 失敗例（再発防止）

| 失敗 | 原因 | 対策 |
|------|------|------|
| 「更新されていない」 | 旧段落残存 | P1 clear + verify |
| MCP open 失敗 | 推測ファイル名 | P2 glob |
| PS 構文エラー | heredoc | P5 ファイル化 |
