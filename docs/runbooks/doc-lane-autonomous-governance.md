# doc-lane 自律資料作成 — 運用ルール（R-DOC 正本）

> **制定**: 2026-06-27（浜田 GO — フェーズ1 完了・フェーズ2 前提）  
> **承認**: `docs/approved-changes/2026-06-27-rules-doc-autonomous-hamada-go.md`  
> **機械ゲート**: `.cursor/rules/doc-lane-gate.mdc`  
> **PPTX 手順**: `docs/runbooks/doc-lane-pptx-mcp.md`  
> **フェーズ2**: `docs/plans/2026-06-27-doc-lane-phase2-word-spec.md`

---

## §0. 目的

AI チームが **浜田の逐次指示なし**に資料（PPTX / 将来 DOCX）を起稿・更新できるよう、**安全・確実・再現**の境界を定義する。

| 自律 OK | 自律 NG（浜田 GO 必須） |
|---------|-------------------------|
| 社内説明・手順・技術概要の初稿 | 社外配布・人事・契約・公式声明 |
| `C:\tmp\` への出力 | 完成 DOCX/PPTX の **Git commit** |
| パイロット済みパターンの量産 | ブランドテンプレ初回制定 |
| read-back + 目視依頼まで | 目視 OK なしの「完成」宣言 |

---

## §1. レーン宣言（R-DOC-01）

資料作成着手前にチャット **1 行**:

```
[doc-lane] レーン開始 — <形式> / <件名>（kintone deploy なし）
```

**kintone customize / deploy / フィールド変更と同一セッションで混在禁止**（予実 vs PC 台帳と同型の混同防止）。

---

## §2. 着手前ゲート（R-DOC-02）

| 形式 | 必須 npm |
|------|----------|
| **PPTX（MCP）** | `verify:doc-lane-pptx-phase1` → `verify:doc-lane-governance` → `health-check` |
| **PPTX（既存編集）** | 上記 + `docs/runbooks/pptx-patch-windows.md` |
| **DOCX（MCP / セキュリティ）** | `verify:doc-lane-word-phase2` → `verify:doc-lane-governance` → `health-check` |
| **v5 Word** | `cio:doc-lane-gate -- --strict` |
| **月次セキュリティ DOCX** | DOCX ゲート + `doc-lane:security-report:test` → builder 実行 |

```powershell
npm run cio:tool:route -- --intent "<依頼要約>" --log
```

**NG 時は作業中止** — 推測で MCP を叩かない。

---

## §3. 環境（R-DOC-03）

| 条件 | PPTX MCP | DOCX python | DOCX MCP（フェーズ2） |
|------|----------|-------------|------------------------|
| **Windows Cursor** | ✅ | ✅ | ✅ |
| WSL のみ | ❌ 中止 | ✅ | ❌ |

`office-powerpoint` / `office-word` は **Win 起動 + Cursor から MCP 接続**が前提。

---

## §4. 出力・正本（R-DOC-04）

| 種別 | 正本 | Git |
|------|------|-----|
| 完成 PPTX/DOCX/XLSX | `C:\tmp\資料作成\` または registry 記載パス | **commit 禁止** |
| 再現スクリプト | `scripts/` | commit 可 |
| runbook / spec / skill | `docs/` `.cursor/skills/` | commit 可 |

作業フォルダ命名: `YYYYMMDD_<件名>\`

台帳: `data/c-tmp-workspace-registry.json`

---

## §5. 編集安全（R-DOC-05）

1. **既存ファイル**: 編集前に `*_backup.pptx` / `*_backup.docx` を同フォルダへ
2. **新規 PPTX**: MCP `create_presentation`（上書き ID 再利用禁止）
3. **python-pptx パッチ**: `text_frame.clear()` 後に全文再設定（追記のみ禁止）
4. **保存後 read-back**: `extract_slide_text` / python 検証 — 不一致なら **再保存しない**

---

## §6. レイアウト（R-DOC-06 — PPTX）

1. `create_presentation` 直後 — **スライド幅 10 in × 高 7.5 in** を前提（16:9 13.333 と混同しない）
2. グラフ配置: `left + width ≤ 9.5`、`top ≥ 1.7`（Title Only レイアウト）
3. 複雑フロー（10 ノード超）: `figma` `generate_diagram` → PNG → `manage_image`
4. 簡易フロー: `add_shape` + `add_connector`（座標は runbook §4）

---

## §7. 完了定義（R-DOC-07）

**機械 verify OK だけでは完了扱いにしない。**

報告末尾の固定文（形式別）:

**PPTX**

```
【浜田確認】C:\tmp\資料作成\<path> を PowerPoint で開き、レイアウト・文言・図解を目視してください。OK なら 1 行で返信。
```

**v5 Word** — `doc-lane-completion-report.md` の目次 1 行（従来どおり）

浜田 **目視 OK** 後:

```bash
npm run cio:task-complete-seal -- --lane doc-lane --scope "<件名> 浜田 OK"
```

---

## §8. 第二レビュー（R-DOC-08）

| 資料種別 | §50-3-8 DeepSeek |
|----------|------------------|
| 社内技術・手順初稿 | 推奨 |
| 人事・社外・セキュリティ公式 | **必須** |
| 月次セキュリティレポート | **必須**（従来どおり） |

---

## §9. ツール選択（R-DOC-09）

| やりたいこと | 第一選択 | フォールバック |
|--------------|----------|----------------|
| 新規 PPTX + 図解 | `office-powerpoint` MCP | — |
| 既存 PPTX 精密差替 | python-pptx | MCP（新規スライド追加のみ） |
| 新規 DOCX + 図解・グラフ | `office-word` MCP + builder（月次） | python-docx パッチ |
| 既存 DOCX 精密差替 | python-docx | MCP（画像追加のみ） |
| DOCX/PDF 読取 | markdownify MCP | python-docx / pypdf |
| 複雑フロー図 | figma `generate_diagram` | PPT shape+connector |

正本 routing: `data/cio-ai-team-tool-routing.json` intent `doc-lane`

---

## §10. フェーズ2（R-DOC-10 — Word MCP）

**導入済**（2026-06-27）— `office-word` MCP + 月次 builder 併用。

- 正本: `docs/runbooks/doc-lane-docx-mcp.md`
- verify: `verify:doc-lane-word-phase2`
- **R-DOC-04〜07 は変更なし**（C:\tmp 正本・目視 OK）

詳細: `docs/plans/2026-06-27-doc-lane-phase2-word-spec.md`

---

## §11. 関連ファイル

| ファイル | 役割 |
|----------|------|
| `docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md` | PPTX フェーズ1 spec |
| `docs/plans/2026-06-27-doc-lane-phase2-word-spec.md` | Word フェーズ2 spec |
| `.cursor/skills/office-pptx-doc-lane/SKILL.md` | PPTX Skill |
| `.cursor/skills/office-docx-doc-lane/SKILL.md` | DOCX Skill |
| `.cursor/skills/kintone-doc-lane/SKILL.md` | doc-lane 全体 |
| `docs/runbooks/doc-lane-completion-report.md` | 完了報告テンプレ |
| `.cursor/rules/doc-lane-gate.mdc` | Cursor 機械リマインダ |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-27 | 初版 R-DOC-01〜10 — フェーズ1 完了・パイロット目視 OK 後 |
| 2026-06-27 | フェーズ2 — office-word MCP 導入・セキュリティレポート図解対応 |
