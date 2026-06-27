# doc-lane フェーズ2 — Word（DOCX）自律作成 仕様

> **起票**: 2026-06-27  
> **GO**: 浜田 **2026-06-27**（経営会議セキュリティレポート向け・図解・グラフ）  
> **状態**: **infra 済 — パイロット待ち**（R-DOC-16。浜田目視 OK 後に R-DOC-10 クローズ）
> **上位**: `docs/runbooks/doc-lane-autonomous-governance.md`（R-DOC-10）

---

## §0. 目的

フェーズ1（PPTX MCP）の **安全境界を維持**したまま、Word 資料（特に **経営会議向けセキュリティレポート**）に **図解・グラフ**を自律挿入できるようにする。

| ユースケース | 第一選択 | 備考 |
|--------------|----------|------|
| **月次セキュリティ（R7）** | **前月 DOCX copy + MCP**（`keiei-kaigi-security-report.md`） | §1 AI / §2・事例 枠 |
| **レポートへの追加図解** | `office-word` MCP `add_picture` | Figma PNG |
| **builder 一括** | `doc-lane:security-report` | **JSON 全文 + detection_confirmed 時のみ**（R-DOC-14） |
| **既存 DOCX 精密パッチ** | `docx-patch-windows.md` | v5 等 |

---

## §1. 導入 MCP

| 項目 | 値 |
|------|-----|
| サーバー名 | `office-word`（Cursor UI / mcp.json）。AI 呼び出しは `user-office-word` |
| 実体 | `C:\Users\mhamada202408224\.cursor\Office-Word-MCP-Server` |
| 起動 | `.venv\Scripts\python.exe word_mcp_server.py` |
| 前提 | **Windows Cursor**（PowerPoint MCP と同型） |

---

## §2. インフラ（チェックリスト）

- [x] MCP を `%USERPROFILE%\.cursor\mcp.json` に追加
- [x] `scripts/sync-cursor-mcp-windows-from-wsl.mjs` 更新
- [x] `data/cio-ai-team-tool-routing.json` — doc-lane MCP 拡張
- [x] `scripts/verify-doc-lane-word-phase2.mjs`
- [x] `.cursor/skills/office-docx-doc-lane/SKILL.md`
- [x] `docs/runbooks/doc-lane-docx-mcp.md`
- [ ] **パイロット 1 本 + 浜田目視 OK**（R-DOC-16 — infra 済・運用クローズ待ち）
- [ ] R-DOC-10 完全クローズ（パイロット OK 後）

---

## §3. セキュリティレポート標準フロー

```
[doc-lane] レーン開始 — DOCX / 月次セキュリティレポート
  ↓
verify:doc-lane-governance + verify:doc-lane-word-phase2
  ↓
浜田 1 行確認（§2 件数・事例）→ JSON detection_confirmed: true
  ↓
npm run doc-lane:security-report -- --config scripts/data/monthly-security-report-YYYYMM.json
  → _charts/*.png 生成 + DOCX へ 2×3 グリッド挿入
  ↓
（任意）figma generate_diagram → office-word add_picture
  ↓
get_document_text / get_document_outline read-back
  ↓
【浜田確認】Word で目視 → OK → cio:task-complete-seal
```

**DeepSeek 必須**（R-DOC-08 — 公式セキュリティ資料）。

---

## §4. 変更しない境界（フェーズ1 継承）

- **C:\tmp 正本** — Git commit 禁止
- **kintone deploy 混在禁止**
- **浜田目視 OK** まで完成扱いしない
- **バックアップ必須**（`*_backup.docx`）
- **`.text` 代入禁止** — `docx_template_format.set_paragraph_text`

---

## §5. スコープ外

- Excel MCP
- M365 クラウド自動アップロード
- PDF 直接編集（読取のみ markdownify 継続）

---

## §6. 関連

| ファイル | 役割 |
|----------|------|
| `docs/runbooks/doc-lane-docx-mcp.md` | MCP 手順正本 |
| `docs/runbooks/monthly-security-report.md` | 月次 builder |
| `.cursor/skills/office-docx-doc-lane/SKILL.md` | Word Skill |
| `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md` | フェーズ1 |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-27 | 草案 |
| 2026-06-27 | 浜田 GO — office-word MCP 導入・infra 整備 |
