# doc-lane PPTX 資料制作 — フェーズ1 仕様（AI チーム合意）

> **起票**: 2026-06-27  
> **状態**: **フェーズ1 完了・浜田 GO（2026-06-27）** — パイロット1.5 実施可  
> **スコープ**: 追加 MCP インストール **なし**（既存 `office-powerpoint` + `figma` を正式化）  
> **上位**: `docs/runbooks/doc-lane.md` / `data/cio-ai-team-tool-routing.json`

---

## §0. 目的

Office 資料（主に **PowerPoint**）を AI チームが **安全・再現可能** に作成できるよう、フェーズ1では **運用インフラ** を整備する。

| フェーズ | 内容 | 本書 |
|--------|------|------|
| **1（今回）** | ルーティング・Skill・Runbook・検証ゲート・作業領域 | ✅ |
| **1.5** | パイロット3枚（社内説明テンプレ）+ 浜田目視 OK | 浜田 GO 後 |
| **2** | Word MCP 追加（docx-mcp 等） | 別 spec |

---

## §1. 背景

- 資料作成依頼が増加見込み（図解・グラフ・フロー・オブジェクト配置）
- **`office-powerpoint` MCP は既に Win 側で稼働**（37 ツール・health-check ✅）
- 現状は doc-lane ルーティングが `create_presentation` のみで、**図形/コネクタ/グラフ**が索引外
- 既存 `pptx-patch-windows.md` は **python-pptx 編集**向け — MCP 新規作成フローが未整備

---

## §2. フェーズ1 で使うツール（追加インストールなし）

| 優先 | ツール | 用途 |
|------|--------|------|
| 1 | **office-powerpoint** MCP | 新規 PPT・スライド・**add_shape**・**add_connector**（フロー）・**add_chart**（グラフ）・表・画像 |
| 2 | **figma** MCP `generate_diagram` | 複雑フロー（Mermaid → FigJam）。PNG 化して PPT に貼付 |
| 3 | **markdownify** MCP | 既存 DOCX/PDF の読取（資料下書き入力） |
| 4 | **python-pptx**（runbook 既存） | MCP 不可時・既存 PPTX の精密パッチ |

**座標系**: MCP の `left`/`top`/`width`/`height` は **インチ**。16:9 スライド既定 13.333 × 7.5 in。

---

## §3. 安全方針（AI チーム合意 — 必須）

### 3.1 編集前ゲート

```powershell
npm run verify:doc-lane-pptx-phase1
npm run cio:tool:route -- --intent "PowerPoint 資料 フロー図" --log
```

- **Windows + Cursor 必須**（WSL のみセッションでは MCP ⏭ — 作業中止）
- **kintone deploy と混在禁止**（doc-lane レーン分離）

### 3.2 バックアップ（P1 継承）

- 既存ファイル編集前: `*_backup.pptx` または `*_更新YYYYMMDD.pptx` を **同フォルダ**にコピー
- MCP `create_presentation` は新規 ID — **上書き事故を避ける**

### 3.3 出力先

| 種別 | パス |
|------|------|
| 作業正本 | `C:\tmp\資料作成\`（`data/c-tmp-workspace-registry.json`） |
| 再現スクリプト | `scripts/`（リポ commit 可） |
| 完成 PPTX | **Git commit 禁止**（機密） |

### 3.4 検証ループ

1. `get_slide_info` / `extract_slide_text` で read-back
2. 期待テキスト・図形数が一致しない → **再保存しない**（`pptx-patch-windows.md` P1 同型）
3. 浜田 **目視 OK** まで「完成」扱いしない

### 3.5 図解の使い分け（確実性優先）

| 複雑度 | 手段 |
|--------|------|
| 低（3〜7 ボックス） | **add_shape + add_connector** |
| 中（分岐・並列） | 同上 + 座標表を Skill に記載 |
| 高（10 ノード超） | **Figma generate_diagram** → 画像 → **manage_image** |

---

## §4. 標準ワークフロー

```
依頼受領
  → verify:doc-lane-pptx-phase1
  → cio:tool:route（doc-lane）
  → Skill: .cursor/skills/office-pptx-doc-lane/SKILL.md
  → Runbook: docs/runbooks/doc-lane-pptx-mcp.md
  → create_presentation / create_presentation_from_templates
  → スライド追加・図形/グラフ/コネクタ配置
  → read-back 検証
  → C:\tmp\資料作成\ に保存
  → 浜田目視 OK
  → cio:task-complete-seal（任意）
```

---

## §5. テンプレ方針

- リポ: `templates/doc-lane/README.md`（配置ルールのみ — **バイナリ .pptx は v1.5**）
- 初回起稿: MCP `create_presentation` または既存社内 .pptx を `C:\tmp\資料作成\templates\` に手置き
- J-BIS ブランド色・ロゴは **v1.5** でテンプレ pptx 化（浜田提供 or 既存資料から抽出）

---

## §6. ルーティング更新（実装済み正本）

`data/cio-ai-team-tool-routing.json` intent **`doc-lane`**:

- keywords 追加: `PowerPoint`, `PPTX`, `スライド`, `フロー図`, `図解`, `グラフ`, `資料作成`
- MCP tools 拡張: `add_shape`, `add_connector`, `add_chart`, `manage_image`, …
- skill: `.cursor/skills/office-pptx-doc-lane/SKILL.md`
- runbook: `docs/runbooks/doc-lane-pptx-mcp.md`
- verify: `verify:doc-lane-pptx-phase1`

---

## §7. npm コマンド

| コマンド | 用途 |
|----------|------|
| `npm run verify:doc-lane-pptx-phase1` | フェーズ1 インフラ検査 |
| `npm run cio:tool:route -- --intent "…"` | MCP 提案 |
| `npm run health-check` | office-powerpoint 生存確認 |

---

## §8. スコープ外（フェーズ1）

- Word MCP 新規導入
- Excel MCP
- Visio / SmartArt 自動レイアウト
- 社外配布用ブランドテンプレの自動生成
- M365 Work IQ Word（クラウド）

---

## §17. AI チームレビュー（2026-06-27）

| 論点 | 担当視点 | 結論 |
|------|----------|------|
| 新 MCP 追加の必要性 | CIO | **不要** — 既存 office-powerpoint でフェーズ1足りる。導入リスクを避ける |
| 上書き・データ消失 | DeepSeek（安全） | **バックアップ必須** + 新規 create 優先。read-back 失敗時は再保存禁止 |
| WSL/Cursor 混在 | 運用 | **Win 必須ゲート**。WSL では python-pptx フォールバックのみ案内 |
| 座標レイアウト精度 | 実装 | v1 は **簡易図解**に限定。複雑図は Figma 経由 |
| 機密資料の Git | コンプライアンス | **C:\tmp 正本** — リポには runbook/script のみ |
| kintone レーン混在 | ガバナンス | **禁止** — doc-lane SKILL に明記 |
| ルーティング索引不足 | ツール링 | manifest 拡張 + route 回帰テスト 1 件追加 |
| 第二レビュー | §50-3-8 | doc-lane 既存 **deepseek** 維持（人事/社外資料時は必須） |
| パイロットタイミング | 浜田 | **インフラ commit 後**に spec §GO → 3 枚試作 |

**ブロッカー**: なし（フェーズ1 インフラ）  
**パイロット GO**: 浜田が本 spec §0〜§7 を確認後

---

## §18. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-27 | **パイロット1.5** — 3枚試作（タイトル/フロー/グラフ）`C:\tmp\資料作成\20260627_pilot-kintone-flow\` |
| 2026-06-27 | 初版 — AI チームレビュー・フェーズ1 インフラ GO |
