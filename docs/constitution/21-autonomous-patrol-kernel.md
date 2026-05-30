# 第21読本 — 無人パトロール・自己修復（週末監査・デッドコード）AI-KERNEL

**正本（非置換）**: `AGENTS.md` 第7〜9層 / `docs/runbooks/cio-weekend-autonomous-audit.md`  
**関連**: `04-environment-security.md`

---

## 前提条件

- 土日・実装レーン凍結（customize/deploy 禁止・Q36 GO前）
- 週末自律修正タグ: `[WEEKEND-DEAD-CODE-PURGE]` / `[WEEKEND-SELF-HEALING]`（構文のみ）
- baseline: `data/cio-weekend-rollback-baseline.json`
- Self-Healing Env: `docs/secure/.env.enc` + `CIO_ENV_MASTER_KEY`

## 実行手順

1. 週末: `npm run cio:weekend:autonomous-audit`（verify群 + dead-lines + dead-code）
2. env不足: `npm run cio:env:self-healing` → `verify:cio-env-integrity`
3. 週明け verify NG: `npm run cio:rollback:weekend-actions`（revert + lock + 1行安全報告）
4. 手動 dead-code: `npm run cio:dead-code-purge -- --scan|--apply`
5. 月曜: レポート Read → CEO 1行要約

## 禁止事項

- 週末の customize/deploy 独自判断
- Self-Healing で仕様意味変更
- 週末 revert 後の force push（CEO明示なし）
- 監査レポートなしの「問題なし」宣言
- `[WEEKEND-*]` コミットの手動放置（週明け rollback 未確認）

## 判定コード

| コマンド | 合格 |
|----------|------|
| `cio:weekend:autonomous-audit` | exit 0 + レポート存在 |
| `cio:env:self-healing` | exit 0 |
| `cio:rollback:weekend-actions` | verify NG時 revert / 不要時 exit 0 |
| `verify:cio-environment-infra` | exit 0 |
| `verify:cio-extreme-defence-infra` | exit 0 |
