# 情報セキュリティ勉強会 — 年次 Runbook

> **頻度**: 毎年（各支店訪問前）  
> **正本 spec**: `docs/training/security/spec-YYYY.md`  
> **正本資料**: `docs/training/security/masters/`  
> **作業フォルダ**: `C:\tmp\情報セキュリティ勉強会テキスト`

---

## 1. いつ走るか

| タイミング | 作業 |
|------------|------|
| **年度初め（6〜7月）** | 前年度 master をベースに IPA・事例・動画 URL を更新 |
| **浜田 GO 後** | `sync-masters` → commit → 支店配布用に `output/` へコピー |
| **翌年度準備** | `spec-template.md` → `spec-YYYY.md`、master ファイル名を YYYY に |

---

## 2. 着手前（必須）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run verify:doc-lane-governance
npm run cio:pre-implement-gate
```

**DeepSeek（D2）**: 年次矛盾・IPA 引用年度・学習負荷・人事説明の盲点 1 問 → CIO 突合 3 行。

**読む**:

- `docs/training/security/spec-YYYY.md`
- 前年度 `masters/YYYY-security-training-master-outline.md`
- `docs/runbooks/doc-lane-pptx-mcp.md`（図解・差分編集）

---

## 3. 推奨ワークフロー（2026 以降）

### A. マスター改変（推奨 — レイアウト再現性が高い）

1. `masters/YYYY-security-training-master.pptx` を `C:\tmp\情報セキュリティ勉強会テキスト\` にコピー
2. PowerPoint または doc-lane MCP / python-pptx で **内容差し替え**（IPA 年度・事例・画像）
3. 浜田目視 OK
4. ルートに完成 `.pptx` を置く（ファイル名は日本語可）
5. リポ反映:

```powershell
npm run security-training:sync-masters
npm run verify:security-training-masters
git add docs/training/security/
git commit -m "docs(security-training): YYYY master PPTX/DOCX"
```

### B. ゼロから骨格（レガシー — 初回プロトyping のみ）

```powershell
python scripts/security-training/build-pptx-12slides.py
python scripts/security-training/build-word-2026.py
```

→ 画像・ノート・比較表は **A へマージ**する。

---

## 4. スライド品質基準（2026 正本）

- **15 前後**（章立て: 重要性 → 動向 3 テーマ → 基本ルール → 動画 → 締め）
- **公式図・スクショ**（IPA・警察庁等）— 出典明記
- **スピーカーノート**（投影は簡潔・口頭はノート）
- **禁止**: 個人携帯・社内不正事例の実名

---

## 5. 完了チェック

- [ ] `verify:security-training-masters` exit 0
- [ ] `spec-YYYY.md` のスライド数・動画 URL と一致
- [ ] 連絡先が「システム推進室」のみ
- [ ] 浜田 PowerPoint 目視 OK（1 行でチャット記録）
- [ ] `handoff-log.md` 1 行（年度・スライド数・commit hash）

---

## 6. 関連

| ファイル | 用途 |
|----------|------|
| `docs/training/security/masters/README.md` | 正本ファイル一覧 |
| `docs/training/security/spec-template.md` | 新年度 spec 雛形 |
| `scripts/security-training/sync-masters-from-tmp.py` | C:\\tmp → masters |
| `docs/runbooks/doc-lane.md` | doc-lane 全体 |
| `data/c-tmp-workspace-registry.json` | `security-training` フォルダ登録 |
