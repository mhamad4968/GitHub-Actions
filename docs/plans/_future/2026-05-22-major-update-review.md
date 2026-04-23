# 🔮 5/22+ メジャー更新一括レビュー (M1-M7 + P3 + P12)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-05-22 (Fri) 以降 / 5/13 本番運用後の安定期  
**契機**: 浜田 2026-04-23 23:00 改善案 #6 + #7 + #12 統合承認  
**ベース**: 戦略書 v1.0/v1.1 (M1-M7 + P3 残課題)

---

## 🎯 目的

4/26 PC 台帳 customize Day + 5/13 本番運用 + 5/16 PoC 再議論 + 5/17 SKYSEA 着手 が落ち着いた **5/22 以降の安定期**に、major update 系の残課題を一括レビュー + 段階的に実施する。

## 📋 レビュー対象 (合計 9 件)

### M1: eslint 9 → 10 (root) ✅ 既に実施済 (4/23 22:30 / commit `eaef5a4`)
- 状態: 完了 (lint:customize 0 errors / TSB-007 ep 系列克服)
- レビュー時の確認: 5/13 本番運用後も lint 緑維持か

### M2: vite 6 → 8 (vite-kintone-list-button) 🚨 5/22 実施
- 4/26 customize Day 直前で除外 → customize 完了後実施可
- 影響: vite-kintone build / customize/desktop.bundle.js 生成
- 動作確認: `npm run build` → 127 modules / 360KB → 同等出力か / kintone デプロイで動作確認

### M3: typescript 5 → 6 (sec-next) ✅ 既に実施済 (4/23 22:18 / commit `792405d`)
- 状態: 完了 (typecheck OK)
- レビュー時の確認: vite-kintone も typescript 5 → 6 にするか別途判断

### M4: node v24 LTS → v25 切替 / または v26 LTS 化 (2026-10) 待ち
- 状態: v25 動作確認済 (Phase F-9 / 全 5 検証 OK / `phase_f_residual_2026_04_23` memory entity)
- 推奨: v24 LTS 維持 → v26 LTS (2026-10) で切替
- 5/22 レビュー: v24 サポート終了予定確認 (2027-04 まで LTS)

### M5: tailwindcss 3 → 4 (vite-kintone-list-button) 🚨 5/22 実施
- 4/26 customize Day 直前で除外 → customize 完了後実施可
- 影響: tailwind.config.js → @tailwindcss/postcss + CSS @theme 構文への大改修必要
- リスク: 既存 UI 全部レイアウト崩れ → 1 件ずつ修正必要 / 工数大 (2-4 時間想定)
- 段階導入推奨: 1) 別ブランチで試作 / 2) 既存 customize の差分検証 / 3) main マージ

### M6: openai 4 → 6 (sec-next) ✅ 既に実施済 (4/23 22:21 / commit `19b34b2`)
- 状態: 完了 (実害ゼロ実証 / SDK 未使用)
- レビュー時の確認: 将来 sec-next で openai SDK を直接呼ぶ場合は API spec 変更影響評価必要

### M7: @types/node 22 → 25 + @types/nodemailer 7 → 8 (sec-next) ✅ 既に実施済 (4/23 22:20 / commit `e5bfbeb`)
- 状態: 完了 (型のみ / runtime 影響なし)

### P3: fetch MCP `python3 -m` → `uvx` 化
- 現状: `mcp.json` で `command: "python3"` `args: ["-m", "mcp_server_fetch"]`
- 変更後: `command: "/home/mhamada202408224/.local/bin/uvx"` `args: ["mcp-server-fetch"]`
- メリット: auto update + pip 依存削除 + §17-3 絶対 path 標準化と整合
- 工数: 5 分 (mcp.json 編集 + Cursor 再起動)

### P12: Web 検索 MCP 多重化 (brave-search 追加)
- 現状: duckduckgo-search のみ active (TSB-015 で google-search → DDG 入替済)
- 案: brave-search MCP 追加導入 (無料枠 2000 q/月 / クレカ不要 / Bing でない独自 index)
- 構成: brave 優先 / DDG fallback (AI が用途別に使い分け)
- 工数: 15 分 (brave.com で API key 取得 5 分 + mcp.json 編集 + Cursor 再起動)
- §50 想起儀式の Web 検索シーンで brave-search を第 1 推奨に格上げ

## 🚦 5/22 当日プラン (推奨順序)

| 時刻 | 内容 | 工数 | 担当 |
|---|---|---|---|
| 13:00 | 全件レビューミーティング (浜田 + AI / 各案件の状態 + 5/22 後の優先順位) | 30 分 | 浜田 + AI |
| 13:30 | P3 fetch MCP uvx 化 (低リスク即時) | 5 分 | AI 実装 / 浜田 Cursor 再起動 |
| 13:45 | P12 brave-search 追加 (浜田 brave.com 登録 + AI mcp.json 編集) | 15 分 | 浜田 + AI |
| 14:00 | M2 vite 6→8 試作 (別ブランチ / build 動作確認) | 30 分 | AI |
| 14:30 | M5 tailwindcss 3→4 試作 (config 大改修 / 既存 UI 比較) | 60 分 | AI + 浜田レビュー |
| 15:30 | 結果評価 + 浜田判断 (M2/M5 採用 or 保留) | 30 分 | 浜田 |
| 16:00 | 採用分の正式適用 + commit + RAG ingest + memory 更新 | 30 分 | AI |

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| M2/M5 で customize 壊れる | 別ブランチで試作 / main マージは浜田レビュー後 |
| brave-search API key 取得失敗 | DDG 維持 / P12 保留 |
| tailwindcss 4 で UI 全崩れ | git revert + npm install で即戻し / vite-kintone build 動作確認必須 |
| 5/22 当日に他急務発生 | 5/29 / 6/5 等の翌週金曜に schedule 移動 |

## ✅ 完了判定

- [ ] 5/22 全件レビュー実施 (or 翌週金曜)
- [ ] P3 + P12 即時実施分完了
- [ ] M2/M5 試作 + 浜田判断
- [ ] M4 v25 切替判断 (v26 LTS 待つかどうか)
- [ ] 戦略書 v1.2 更新 (本ファイルを完了マーク)
- [ ] memory entity `phase_y_residual_2026_05_22` 投入

## 🔗 関連

- 改善案 #6 + #7 + #12 (浜田 2026-04-23 23:00 統合承認)
- 戦略書 v1.0: docs/plans/2026-04-23-mcp-strategy-v1.md
- 戦略書 v1.1: docs/plans/2026-04-23-cli-evolution-v1.md
- memory entity: `cli_evolution_v1_2026_04_23` / `phase_f_residual_2026_04_23`

## 📅 schedule

- **5/13 (水)**: 本番運用開始
- **5/16 (土)**: Cursor サブエージェント PoC-1 再議論
- **5/17 (日)**: SKYSEA 計画開始
- **5/22 (金)**: ★ 本一括レビュー実施
