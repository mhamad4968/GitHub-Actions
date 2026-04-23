# ⏰ 朝 cron 重み増加対策 (S13 適用後の負荷分散)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-05 中 (S13 適用効果観察後 / 5/15 目処)  
**契機**: 浜田 2026-04-23 23:00 改善案 #9 承認 / 朝 cron 重み増加への先回り対策

---

## 🎯 目的

S13 (health-check に S9/S12 wiring) が 4/24 朝 cron で適用されると、health-check.mjs が **node_modules 完全性 + MCP 死蔵** を追加検査するため処理時間が増加する。**朝 cron が遅延 / 失敗するリスクを先回りで予防**する。

## 📋 現状 (4/23 時点)

朝 06:00 cron (`daily-morning-prep.mjs`) の処理:
1. apply-approved-changes (16+ 件適用)
2. kintone:test (4 アプリ疎通)
3. lint:customize (eslint)
4. npm audit (root)
5. npm outdated
6. audit-rules (rule 整合性)
7. scan-plans (plan 進捗)
8. RAG 再 ingest (docs/ + .rag/extra-docs/)
9. ブリーフィング生成

→ 現状約 **5-10 分**で完了

S13 適用後の追加処理:
10. check-node-modules.mjs (3 ディレクトリ全 deps チェック)
11. check-mcp-dormancy.mjs (16 MCP の使用率調査)

→ 推定 **+2-3 分** = 全体 **7-13 分**

## 🆕 対策案 (3 段階)

### 段階 1: 監視のみ (4/24-5/15)
- 4/24 朝 cron 適用後、毎朝の処理時間を `logs/morning-prep/cron.log` で計測
- 12 分超えたら段階 2 発動

### 段階 2: タイミング分散 (5/15+)
- 06:00 cron → 06:00 (apply-approved + ヘルス系) + 06:10 (RAG 再 ingest + ブリーフィング生成) に分割
- crontab 2 行化:
  ```cron
  0 6 * * * ... daily-morning-prep.mjs --phase=quick
  10 6 * * * ... daily-morning-prep.mjs --phase=heavy
  ```

### 段階 3: 並列実行 (6/22+)
- daily-morning-prep.mjs 内で互いに独立な処理を `Promise.all` で並列化
- ただし §51 (AI 操作の並列禁止) は本件と無関係 = cron 内処理は OK

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| 段階 2 で時刻ずれ起きた時の整合性 | 06:00 quick 完了時に lock file 作成 / 06:10 heavy はその lock 確認 |
| 並列化で MCP 同時起動失敗 | 並列度を 2-3 に制限 / MCP probe は順次維持 |
| 監視期間の判断ミス | 12 分基準を明示 + 浜田判断仰ぐ |

## ✅ 完了判定

- [ ] 4/24-5/15 朝 cron 処理時間ログ取得 (毎朝記録)
- [ ] 12 分超えた日があれば段階 2 発動
- [ ] 段階 2 適用後 1 ヶ月安定稼働
- [ ] 段階 3 検討は 6/22+ で再評価

## 🔗 関連
- 改善案 #9 (浜田 23:00 承認)
- S13 proposal: docs/approved-changes/2026-04-24/S13-health-check-wiring.proposal.json
- daily-morning-prep.mjs (現状の朝 cron 本体)
