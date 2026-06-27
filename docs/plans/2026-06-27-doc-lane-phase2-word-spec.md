# doc-lane フェーズ2 — Word（DOCX）自律作成 仕様（草案）

> **起票**: 2026-06-27  
> **状態**: **草案 — MCP 未導入**（フェーズ1 運用ルール確定後に GO）  
> **上位**: `docs/runbooks/doc-lane-autonomous-governance.md`（R-DOC-10）

---

## §0. 目的

フェーズ1（PPTX MCP）で確立した **安全境界**を維持したまま、Word 資料の自律作成範囲を拡大する。

---

## §1. 現状（フェーズ1 完了時点）

| 形式 | 手段 | 自律度 |
|------|------|--------|
| PPTX 新規 | `office-powerpoint` MCP | ✅ パイロット OK |
| DOCX 定型 | `scripts/build-monthly-security-report.py` 等 | ✅ スクリプト限定 |
| v5 マニュアル | python パッチ + `cio:doc-lane-gate` | △ 浜田目視必須 |
| DOCX 汎用 | 未整備 | ❌ |

---

## §2. フェーズ2 候補 MCP

| 候補 | 特徴 | 向き |
|------|------|------|
| **docx-mcp**（Rust） | 29 ツール・メモリ編集・表 | 細かい DOCX 編集 |
| **Office-Word-MCP-Server**（Python/uvx） | 作成・マージ・統計 | ローカル生成 |
| **M365 Work IQ Word** | OneDrive 連携 | M365 必須時のみ |

**AI チーム推奨（2026-06-27）**: 社内 PC ローカル正本なら **docx-mcp** を第一候補。既存 python-docx スクリプトは **維持**（月次レポート等）。

---

## §3. 導入時の追加作業（チェックリスト）

- [ ] MCP を `%USERPROFILE%\.cursor\mcp.json` に追加 + `health-check` ✅
- [ ] `data/cio-ai-team-tool-routing.json` — doc-lane MCP 拡張
- [ ] `scripts/verify-doc-lane-word-phase2.mjs`
- [ ] `.cursor/skills/office-docx-doc-lane/SKILL.md`
- [ ] `docs/runbooks/doc-lane-docx-mcp.md`
- [ ] パイロット 1 本（操作マニュアル 1 章相当）+ 浜田目視 OK
- [ ] R-DOC-10 クローズ（§2 ゲート表更新）

---

## §4. 変更しない境界（フェーズ1 継承）

- **C:\tmp 正本** — Git commit 禁止
- **kintone deploy 混在禁止**
- **浜田目視 OK** まで完成扱いしない
- **バックアップ必須**

---

## §5. スコープ外（フェーズ2）

- Excel MCP
- M365 クラウド自動アップロード
- PDF 直接編集（読取のみ markdownify 継続）

---

## §6. GO 条件

1. フェーズ1 運用 **2 週間** 問題なし（任意 — 浜田判断）
2. 本 spec レビュー OK
3. パイロット DOCX 目視 OK
