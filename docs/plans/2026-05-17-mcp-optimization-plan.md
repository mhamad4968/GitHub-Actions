# MCP 最適化・効率化 計画書（CIO / AIチーム合意）

**起票**: 2026-05-17 JST  
**依頼**: CEO — CIO 判断で優先度を定め、AIチームと意見交換のうえ安全に実施  
**正本台帳**: `docs/mcp-status.md`  
**日常ゲート（軽量）**: `npm run cio:mcp:env`  
**厳格ゲート（推奨）**: `npm run cio:mcp:gate`

---

## 1. エグゼクティブサマリ

| 項目 | 2026-05-17 ベースライン |
|------|-------------------------|
| レジストリ | merged **22** servers・必須 CIO 名 **OK** |
| initialize プローブ | **`cio:mcp:env` → OK 6/6**（kintone / 3AI / memory / sequential-thinking） |
| kintone Space 実 API | **`kintone:probe-space -- 48` → HTTP 200 JSON** |
| 死蔵（7日） | **8 件 dormant**（削除はしない・想起・役割整理） |

**方針**: 速度より **誤検知・ドリフト・「緑だが死んでいる」穴** を先に塞ぐ。サーバ削除・`mcp.json` 構造変更は **Tier B（CEO GO）**。

---

## 2. AIチーム意見交換（記録）

| 手段 | 内容 |
|------|------|
| **sequential-thinking MCP** | 6ステップで優先度 P0〜P4 を整理（検知穴 → URL 整合 → 死蔵は想起強化 → 削除は保留） |
| **既存 RCA** | `docs/mcp-status.md` §RCA（kintone-space / cybozu.com プレースホルダ）と整合 |
| **死蔵レポート** | `check-mcp-dormancy.mjs` — 7日で cyber-news / rag / cve-search 等は dormant だが **役割限定で維持** |

**合意**: 今ターンは **Tier A のみ**（スクリプト・npm・本計画書・台帳追記）。**mcp.json の追加削除は行わない**。

---

## 3. 優先度レーン（CIO 判断）

### P0 — 検知の穴を塞ぐ（実施済 2026-05-17）

| ID | 内容 | 成果物 |
|----|------|--------|
| MCP-P0-01 | `cio:mcp:gate` — registry + **BASE_URL 整合** + quickprobe + **Space 48 実 API** | `package.json` `cio:mcp:gate` |
| MCP-P0-02 | Space プローブが HTML を通さない | `probe-kintone-space-json.mjs`（非 200 / 非 JSON → exit 1） |

### P1 — 二重正本ドリフト防止（実施済 2026-05-17）

| ID | 内容 | 成果物 |
|----|------|--------|
| MCP-P1-01 | `KINTONE_BASE_URL` のホスト一致・プレースホルダ検知 | `scripts/verify-mcp-kintone-base-url.mjs` |
| MCP-P1-02 | 単体実行 | `npm run verify:mcp:kintone-base-url` |

### P2 — 選択効率・死蔵（ドキュ / ルール・継続運用）

| ID | 内容 | 状態 |
|----|------|------|
| MCP-P2-01 | サーバ 1 行トリガー維持 | `.cursor/rules/mcp-server-use-triggers.mdc` 既存 |
| MCP-P2-02 | 金曜 `mcp-status:refresh-usage` | CEO 合意済・CIO 定例 |
| MCP-P2-03 | 死蔵 8 件 — **削除せず** FE 時 shadcn/chrome、CVE 時 cve-search 等 | 運用で想起 |

### P3 — Tier B（CEO GO 後）

| ID | 内容 | リスク |
|----|------|--------|
| MCP-P3-01 | `mcp.json` から長期 dormant の整理 | 中（復旧手順要） |
| MCP-P3-02 | kintone AI 専用ユーザ・平文パスワード削減 | 中 |
| MCP-P3-03 | `cio:mcp:env` に rag/playwright 等の initialize 拡張（`--full`） | 低（時間増） |

### P4 — 将来

| ID | 内容 |
|----|------|
| MCP-P4-01 | WSL drvfs 時の probe 直列化（quickprobe 既存）のドキュ統一 |
| MCP-P4-02 | GitHub MCP Win / `gh` CLI 役割の再監査（`docs/plans/_future/2026-06-github-mcp-revival.md`） |

---

## 4. 使い分け（CIO 運用）

```text
日常（速い）     npm run cio:mcp:env
Composer 前      npm run cio:mcp:env:extended   # playwright / markdownify / DDG 追加 probe
タスク前・週次   npm run cio:mcp:gate
環境増強まとめ   npm run cio:env:enhance        # gate + overlay + 4AI 台帳（--full / --desktop 可）
金曜反省後       npm run mcp-status:refresh-usage  → docs/mcp-status.md 更新
WSL 編集後       npm run mcp:sync-cursor-windows  # figma/colors-fonts/mintlify overlay 同梱
```

**合格線**

- `cio:mcp:env`: `SUMMARY: OK 6/6`
- `cio:mcp:gate`: 上記 + `[verify-mcp-kintone-base-url] OK` + `status 200`（Space）

---

## 5. CEO 判断（Tier B）— **2026-05-17 全件 GO**

| # | 決定 | 実施 |
|---|------|------|
| 1 | **rag / cyber-news / cve-search** を mcp.json に **残す** | `check-mcp-dormancy.mjs` に **policy exempt** 追加 |
| 2 | 日常は **`cio:mcp:env` のまま**（gate は週次・kintone 作業前） | 計画書・ルールで固定（変更なし） |
| 3 | **AI 専用 kintone ユーザ**へ切替 | Runbook + `kintone:ai-user:*` スクリプト群 |

**移行手順正本**: `docs/runbooks/kintone-ai-dedicated-user.md`

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-17 | 初版・P0/P1 実装・ベースライン記録 |
| 2026-05-17 | Tier B CEO GO 1〜3 反映・AI ユーザ Runbook・死蔵 exempt |
