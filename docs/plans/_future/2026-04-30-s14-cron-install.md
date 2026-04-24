# 📅 S14 月次セキュリティ巡回 cron 登録 (4/30 夜浜田立ち会い)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-04-30 (Thu) 夜 / 浜田立ち会い必須  
**契機**: 浜田 2026-04-23 23:00 改善案 #5 承認 / S14 開始準備  
**前提**: S14 proposal (`docs/approved-changes/2026-04-24/S14-monthly-security-rounds.proposal.json`) が 4/24 朝 cron で適用済 (= scripts/monthly-security-rounds.mjs が実体化済)

---

## ✅ 完了報告 (2026-04-25 / 5 日前倒し / B-4 / 浜田 Tier A 承認)

| ステップ | 結果 |
|---|---|
| ① script 存在確認 | ✅ `scripts/monthly-security-rounds.mjs` 存在 (149 行 / v1 スケルトン) |
| ② 手動試走 (§11-5 段階 ①+②) | ✅ exit 0 / `docs/reports/2026-04-security-rounds.md` 生成 → テスト artifact 削除 |
| ③ cron 環境再現 (§11-5 段階 ③) | ✅ `env -i` で PATH/HOME 限定実行 → exit 0 / `--json` 出力正常 |
| ④ logs ディレクトリ作成 | ✅ `mkdir -p logs/security-rounds/` |
| ⑤ crontab 登録 | ✅ `30 6 1 * * ...` 行追加 / バックアップ `/tmp/crontab.bak.20260425` |
| ⑥ PATH 拡張 | ✅ `~/.local/bin` 追加 (TSB-013 v2 教訓 / v2 で uv 系 MCP 対応) |
| ⑦ 検証 (`crontab -l`) | ✅ monthly 行確認済 |

**初回実走予定**: 2026-05-01 (Fri) 06:30 JST → `docs/reports/2026-05-security-rounds.md` 生成

**前倒しの根拠**: 浜田 2026-04-25 「壊れる以外は任せてる」承認 + 副作用ゼロ (script は v1 スケルトン / kintone API write なし / sudo 不要 / 浜田立ち会い不要と判断)

---

---

## 🎯 目的

S14 月次セキュリティ巡回を **5/1 月初 06:30 cron で自動実行**するように crontab を更新する。

cyber-news + cve-search MCP が月次自動的に SKYSEA 関連脆弱性 + kintone 主要依存パッケージ CVE を巡回し、`docs/reports/<YYYY-MM>-security-rounds.md` を生成する。

## 📋 現状 (4/23 時点)

- S14 v1 (スケルトン): 4/24 朝 cron で `scripts/monthly-security-rounds.mjs` 自動生成予定 (proposal 適用)
- cron 未登録 = 自動実行なし / 浜田が手動で `node scripts/monthly-security-rounds.mjs` 実行する状態
- v0 試走: `docs/reports/2026-04-23-security-rounds-v0.md` (4/23 21:00 浜田 PC Defender = 影響なし判定)

## 🆕 4/30 夜の作業 (浜田立ち会い / 約 15 分)

### 手順

1. **S14 適用確認** (5 分):
   ```bash
   ls scripts/monthly-security-rounds.mjs
   ```
   → 存在 ✅ なら次へ / 不在なら 4/24 朝 cron 失敗 = AI に「S14 適用結果確認」と一言

2. **手動試走** (5 分 / cron 登録前の動作確認):
   ```bash
   PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" \
   node scripts/monthly-security-rounds.mjs --dry-run
   ```
   → 出力 `docs/reports/2026-05-security-rounds.md` 生成確認 (5 月分のスケルトン report)

3. **cron 登録** (5 分 / 浜田 sudo 不要 / crontab 編集のみ):
   ```bash
   crontab -e
   # 末尾に追加:
   # S14 月次セキュリティ巡回 (5/1 開始 / 月初 06:30 = morning-prep 30 分後)
   30 6 1 * * cd /home/mhamada202408224/kintone-ai-lab && PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:/home/mhamada202408224/.local/bin:/usr/bin:/bin /home/mhamada202408224/.nvm/versions/node/v24.14.1/bin/node scripts/monthly-security-rounds.mjs >> /home/mhamada202408224/kintone-ai-lab/logs/security-rounds/cron.log 2>&1
   ```

4. **logs ディレクトリ作成**:
   ```bash
   mkdir -p /home/mhamada202408224/kintone-ai-lab/logs/security-rounds
   ```

5. **5/1 朝 06:30 後の確認** (5/1 朝):
   - `docs/reports/2026-05-security-rounds.md` 生成確認
   - 中身: cyber-news 5 feeds + cve-search 主要依存パッケージ巡回結果 + 浜田アクション提案

## 🚦 cron 環境注意点 (TSB-013 v2 教訓)

- PATH に `~/.local/bin` 必ず含める (uv 系 MCP 起動可能化)
- 上記の crontab 行で `:/home/mhamada202408224/.local/bin:` を含めてある = 安全
- node 絶対 path 指定 (NVM v24 = `/home/.../.nvm/versions/node/v24.14.1/bin/node`)

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| cron 5/1 06:30 で MCP 起動失敗 | health-check.mjs 同様に PATH 拡張済 (TSB-013 v2 修復) / 失敗時 Phase X 同型 cron シミュレートで真因特定 |
| cyber-news / cve-search が結果取れない | v1 はスケルトン report のみ / v2 (5/22+) で MCP 結果自動取得実装 |
| 月初 1 日が休日で浜田レビュー遅れ | レポート生成は cron で自動 / 浜田レビューは月初週で OK |

## ✅ 完了判定

- [ ] 4/24 朝 cron で S14 proposal 適用 = `scripts/monthly-security-rounds.mjs` 存在
- [ ] 4/30 夜手動試走 → `docs/reports/2026-05-security-rounds.md` 生成
- [ ] 4/30 夜 crontab 編集で S14 cron 登録
- [ ] 5/1 朝 06:30 cron 走行 + log 確認
- [ ] 5/1 浜田が `2026-05-security-rounds.md` 確認

## 🔗 関連

- 改善案 #5 (浜田 2026-04-23 23:00 承認)
- S14 proposal: docs/approved-changes/2026-04-24/S14-monthly-security-rounds.proposal.json
- v0 試走: docs/reports/2026-04-23-security-rounds-v0.md
- 戦略書: docs/plans/2026-04-23-mcp-strategy-v1.md (S14 関連セクション)
- 戦略書 v1.1: docs/plans/2026-04-23-cli-evolution-v1.md
- TSB-013 v2 (cron PATH 教訓)

## 📅 schedule

- **4/24 (金) 朝 06:00 cron**: S14 proposal 自動適用 → script 実体化
- **4/30 (木) 夜**: 浜田立ち会いで cron 登録 (15 分作業)
- **5/1 (金) 朝 06:30**: 初回 cron 自動実行
- **5/1 朝以降**: 浜田 + AI でレポート確認 + 浜田アクション (もし高 CVE あれば対応)
