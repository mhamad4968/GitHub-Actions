# Q1: TSB-019 (Cursor IDE Auto-Run RACI bypass) 制定 + §1-2-2-1 拡張 + §52-8 新設

- **日時**: 2026-04-26 07:42 検出 → 07:48 浜田暫定対処 → 07:55 §52-8 新設 → 08:00 commit 実行予定
- **ID**: Q1-tsb019-mcp-protection-2026-04-26
- **session-lock holder**: Q1-tsb019-mcp-protection-2026-04-26 (manual)
- **Tier 判定**: Tier A
  - Q1 (不可逆?): No (rule 改定 = revert 可能)
  - Q2 (副作用範囲): 限定: AGENTS.md / RULES-INDEX.md / docs/troubleshooting.md / chat-sessions/* / .rag/extra-docs/* / Desktop AI緊急用 (sync)
  - Q3 (ロールバック): Yes (git revert 可)
  - Q4 (過去 TSB): No (新規ルール)
  - Q5 (直前ターン浜田明示): Yes (07:48 「Aでお願いします」+ 「順番で行いたい」)
  - Q6 (scope check): in-scope (浜田 GO 後の同一 commit 単位)

## 検出経緯

§1-2-2-1 (Cursor IDE 必須設定 / 4 項目) の verify 中、Cursor IDE Settings → Agents タブを浜田スクショで開いてもらった結果、以下の三重 OFF 構成を発見:

| 項目 | 検出時 | 暫定対処後 |
|---|---|---|
| Auto-Run Mode | Run Everything (Unsandboxed) | **そのまま維持**（浜田判断「基本自律 + 都度承認はつらい」）|
| Browser Protection | OFF | **ON** |
| MCP Tools Protection | OFF | **ON** ⭐ |

→ §52 RACI Tier B (kintone 本番 API 等) が **IDE レベルで完全 bypass** されており、AGENTS.md の規定 (浜田の明示 GO 必須) が **実効性ゼロ** だった (silent breach 級)。

## 決定事項

| # | 項目 | 結論 |
|---|---|---|
| 1 | Cursor IDE 暫定対処 | Browser Protection: ON / MCP Tools Protection: ON （Auto-Run Mode は Run Everything 維持）|
| 2 | §1-2-2-1 拡張 | 4 → 8 項目 (A 課金 / B Models / C Agents / D Cloud Agents) |
| 3 | §52-8 新設 | 高リスク shell コマンド事前報告ルール (rm -rf / git push -f / npm install (新規) / chmod -R / sudo / .env 編集 等) |
| 4 | TSB-019 起票 | 真因 + 暫定 + 恒久 + 教訓 5 件を docs/troubleshooting.md 末尾に記録 |
| 5 | Cap 設定 | 既存 $300 のまま運用 (5/14 リセット時に $130 へ戻す = 朝報 reminder で AI 通知) |

## 周知ファイル更新

| ファイル | 内容 |
|---|---|
| `AGENTS.md` | §1-2-2-1 4→8 項目 + §52-2 表に高リスク shell 行追加 + §52-8 新設 + Changelog v23.9 |
| `RULES-INDEX.md` | §1-2-2-1 / §52-8 行更新 + 全§列挙に §52-8 追加 |
| `docs/troubleshooting.md` | TSB-019 詳細セクション追加 (root_cause_confirmed=true, status=✅) |
| `chat-sessions/NEW-SESSION-STARTER.md` | v3.4 セクション追記 |
| `chat-sessions/CURSOR-トラブル対応メモ.md` | v2.4 セクション追記 + 最終更新行更新 |
| `.rag/extra-docs/*.md` | 上記 5 ファイルを同期 |
| `/mnt/c/Users/.../Desktop/AI緊急用/*.txt` | NEW-SESSION-STARTER + CURSOR-トラブル対応メモ を sha256 一致確認の上 sync |

## 検証

- `npm run smoke` → **7/7 ok**（guard:check / audit:rules / audit:tsb / verify:breaking / audit:xref / health-check / rule-watcher）
- §52 セクション順序: §52-1 〜 §52-8 まで連番整列確認
- AGENTS.md 行数: 2030 行台 → 2150 行台（§52-8 追加分 + §1-2-2-1 拡張分）

## 教訓 (TSB-019 へ転記済 / 5 件)

1. 憲法と IDE 設定の乖離は「silent breach 級」
2. 「設定 = ドキュメント」ではない
3. Browser/MCP Protection という Cursor の優れた設計を活用すべきだった
4. Q-series 包括監査の必要性
5. 「困ってない = 安全」は誤り

## 後続タスク (commit 後の優先順)

- **P1**: [FIX] credit-budget.mjs JST 化 (off-by-one バグ)
- **P2**: A: K-3 ログ観察 + 日次 5-5 セクション検証
- **P3**: B: 並列セッション疑いルール定義
- **P4**: Q-series 包括 Cursor 設定監査 (残 5 タブ Hooks / Tools & MCPs / Rules-Skills-Subagents / Indexing & Docs / Plan & Usage)
- **P5**: PC 台帳 Day 4 (浜田立会い)
