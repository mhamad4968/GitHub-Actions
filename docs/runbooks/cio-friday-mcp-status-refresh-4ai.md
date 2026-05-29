# 金曜定例 — MCP 利用状況更新（4AI 安全手順）

**制定**: 2026-05-29（憲法大整理・環境充実化）  
**頻度**: **毎週金曜** — 週次反省の直後  
**担当**: **① CIO**（浜田はカレンダーのみ・実行依頼しない）

---

## 前提（方式B・実装レーン凍結中も実施可）

| 役割 | 本定例での役割 |
|------|----------------|
| **① CIO** | 実行・commit 判断・CEO 1 行報告 |
| **④ DeepSeek** | 着手前 §50-3-8（盲点：表更新漏れ・死蔵 MCP 誤削除・registry 不整合） |
| **② Composer** | **不使用**（本定例は doc 更新のみ） |
| **③ Kimi** | 差分が大きいとき事後レビュー（任意） |

**禁止**: `mcp.json` の無承認追加・**GenerateImage + `assets/images/` 以外の画像 MCP は計画削除**（`cursor-generate-image-assets.mdc` 参照）。

---

## 手順（この順のみ）

### 0. ゲート（任意・推奨）

```bash
npm run verify:cio-mcp-registry
npm run verify:mcp-four-ai-alignment
```

いずれか **exit 非0** → 本定例を止め、registry 是正後に再開。

### 1. DeepSeek §50-3-8（1 問）

> `mcp-status:refresh-usage` 実行前の盲点3点（死蔵判定・表脚注・4AI matrix 整合）

### 2. ドライラン

```bash
npm run mcp-status:refresh-usage -- --dry-run
```

差分 **0** → チャットに「金曜 MCP usage：差分なし」1 行で終了（commit 不要）。

### 3. 本実行

```bash
npm run mcp-status:refresh-usage
```

### 4. 事後 verify

```bash
npm run verify:mcp-four-ai-alignment
npm run verify:mode-b-zombie-docs
```

### 5. commit + push（差分あり時のみ）

```bash
git add docs/mcp-status.md
git commit -m "chore(mcp): refresh 30-day usage ledger (Friday routine)"
git push origin main
```

**任意**: `npm run session-starter:sync-desktop`（read-pack に MCP 節変更を反映したとき）

---

## 関連正本

- `docs/mcp-status.md` §CIO 定例
- `.cursor/rules/mcp-server-use-triggers.mdc` 項 0
- `docs/runbooks/cio-periodic-ops-schedule.md`
- `.cursor/rules/mode-b-canonical.mdc`（定例一覧）
