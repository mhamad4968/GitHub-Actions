# doc-lane 完了報告テンプレ（C4 / 2026-05-31 承認）

**制定**: 2026-05-31（浜田 GO）

## 固定 1 行（v5 目次・Word 編集後）

機械 verify（`verify_toc_completeness_v5.py` / `cio:doc-lane-gate`）が **OK** でも、報告末尾に必ず:

```
【浜田確認】Word 目次を 1 項目目視してください（例: Ｃ－２ p.22）。問題なければ 1 行で OK を返信。
```

## v5 目次確認済み（2026-05-31）

浜田 **目視 OK** — Ｃ－２／Ｃ－３ 含め問題なし。

## AI 手順

1. `npm run cio:doc-lane-gate -- --strict` → OK
2. `fix_toc_v5.py` / verify スクリプト実行（末尾で **`verify_v5_ch3_c5_references.py`** — 第３章 Ｃ－５/Ｃ－６ 誤参照検出・P3）
3. 誤参照 NG 時: `python scripts\verify_v5_ch3_c5_references.py --apply`（Word 閉じてから。開いているときは `archive\*_ch3c5fix_*.docx` に代替保存）
4. チャット報告末尾に **上記固定 1 行**
5. 浜田 OK 後 → handoff に「目視 OK」1 行（任意）

## 関連

- `scripts/cio-doc-lane-gate.mjs`（OK 時にも同文を stdout）
- `C:\tmp\マニュアル\scripts\fix_toc_v5.py`
