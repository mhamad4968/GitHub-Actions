# 🤖 PC 台帳 customize 完了後の AI 動作確認スクリプト化 (4/27 以降)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-04-27 (Sun) 以降 / 4/26 customize Day 完了後  
**契機**: 浜田 2026-04-23 23:00 改善案 #13 承認 / Playwright + a11y-scanner で自動 UI 検証

---

## 🎯 目的

4/26 PC 台帳 customize Day で構築した UI を、**Playwright + accessibility-scanner MCP で自動 UI 検証**できるようにする。§26 視覚的自己検診 + §27 UD 義務化 (WCAG 2.1 AA) を**毎セッション手動実行ではなく自動化**。

## 📋 現状 (4/23 時点)

- §26 視覚的自己検診: 手動 (UI 変更時に AI が Playwright MCP 呼出)
- §27 UD 義務化: 手動 (a11y-scanner MCP 呼出)
- 浜田負担: 「動作確認お願い」と毎回頼む必要

## 🆕 自動検証スクリプト設計

### scripts/customize-auto-verify.mjs (新規 / 4/27 以降作成)

```
入力: 検証対象 URL (例: kintone PC 台帳の一覧画面 / 詳細画面)
処理:
  1. Playwright で URL を開く
  2. PC 幅 1280px + モバイル 375px の 2 サイズでスクショ
  3. axe-core で a11y 違反検出 (critical / serious / moderate / minor)
  4. console errors / warnings 取得
  5. レスポンス時間計測
出力: docs/reports/<YYYY-MM-DD>-customize-verify.md (結果レポート)
```

### 起動方式

| 起動 | 頻度 | 説明 |
|---|---|---|
| 手動 (浜田) | 任意 | `npm run customize:verify <URL>` で実行 |
| AI (Cursor 経由) | UI 変更後 | AI が「customize 検証して」と一言で実行 |
| cron (週次 or 月次) | 安定運用後 | 5/22+ で月次運用化検討 |

## 🚦 段階導入

| 段階 | 内容 | 実施日 |
|---|---|---|
| 段階 1 | scripts/customize-auto-verify.mjs 雛形作成 (Playwright + axe-core 統合) | **4/27 以降** |
| 段階 2 | npm run customize:verify エイリアス追加 (package.json) | 4/27 以降 |
| 段階 3 | 月次 cron 化 (5/22+) | 5/22+ |

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| Chrome 147 / Playwright 設定で 4/27 時点で動かない | TSB-014 修復済 (4/23) で即動作確認可 / 動かない場合は再 install |
| axe-core の violations 多数で報告膨張 | critical/serious のみ厳密 / moderate/minor は warning |
| 月次 cron 化で kintone 認証情報の cron 環境問題 | .env 経由 / cron PATH に dotenv 含める |

## ✅ 完了判定

- [ ] 4/27 customize-auto-verify.mjs 雛形作成
- [ ] npm run customize:verify エイリアス
- [ ] PC 台帳 (594 / 595 / 626 / 627) 各 URL で実行 → critical 0 確認
- [ ] レポート docs/reports/<日付>-customize-verify.md 生成
- [ ] 5/22+ で月次 cron 化判断

## 🔗 関連
- 改善案 #13 (浜田 23:00 承認)
- AGENTS.md §26 視覚的自己検診 / §27 UD 義務化
- TSB-014 (Chrome 147 + libnspr4 system deps install / 4/23 浜田 sudo 完了)
- §50 MCP Recall Ritual (playwright + accessibility-scanner シーン)
- 主タスク 4/26 customize Day
