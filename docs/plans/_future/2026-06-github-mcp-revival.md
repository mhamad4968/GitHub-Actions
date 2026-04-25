# 📅 C-10 github MCP 復活検討 (Windows-side 設定見直し)

**制定日**: 2026-04-25 (Sat) / J-シリーズ Tier C 登録
**実施予定日**: 2026-06 月内 (PC 台帳 ver.1 本番安定化後)
**契機**: 2026-04-25 health-check で github MCP が `skip` 状態を継続中 / `npm run smoke` でも skip 確認

---

## 🎯 目的

現在 skip 状態の github MCP を再有効化し、PR / Issue / Action 操作を AI から直接実行可能にする。

---

## 📋 現状

- mcp.json には `user-github` 登録あり
- ただし `health-check.mjs` で `initialize` 応答が一定タイムアウトを超えるため `skip` 扱い
- 結果として PR 作成・コメント取得・Action 状態確認は `gh` CLI 経由で対応中 (動作 OK だが MCP 経由なら一段階短縮できる)

---

## 📋 想定原因 (5 月時点での仮説)

1. WSL2 ↔ Windows-side の OAuth トークン取得経路が長い → タイムアウト
2. github MCP のバージョンが古く `streamableHttp` 系の挙動と相性悪
3. 認証方式 (PAT / OAuth) が現環境と不一致

---

## ✅ 完了条件

1. github MCP の最新版確認 + 互換性チェック
2. mcp.json で `command` / `args` / `env` を最新仕様に合わせて更新
3. `health-check.mjs` の `initialize` probe で active 化を確認
4. 簡単な動作試験 (リポジトリ一覧取得 / PR 詳細取得) が成功
5. AGENTS.md / docs/mcp-status.md 該当箇所を更新

---

## ⚠️ リスク + 対策

- **リスク 中**: PAT / token 取り扱いミスは秘密情報漏洩につながる
- **対策 1**: token は `.env.local` 専用 (commit 禁止)
- **対策 2**: 浜田立ち会いで初期化 (Tier B 相当 / 認証情報触る系は GO 必須)
- **対策 3**: 復活前に gh CLI で同操作を 1 件試行 → MCP との差分を比較

---

## 🔗 関連

- 起源: 2026-04-25 J-シリーズ Tier C リスト
- 関連 MCP: 既に動作中 16 active / 3 skip (github / cyber-news / cve-search)
- 依存: なし
- 注意: PC 台帳 ver.1 本番安定 (5/13) を待って着手
