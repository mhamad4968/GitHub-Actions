# 東海支店 iPad 台帳 — 同期中継 Runbook

正本 SPEC: `docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md`

## 起動

- Desktop: `東海支店iPad_同期リレー_START.bat`
- または: `npm run tokai-ipad:sync-relay`
- URL: `http://127.0.0.1:17969`
- Health: `GET /tokai-ipad/health`

## 役割

- **admin** ログイン: Dash は 595/674 を `kintone.api` 直接（中継不要）
- **tokai** ログイン: 中継経由のみ（ブラウザに管理者トークンを埋め込まない）

## 一括同期（CLI）

```bash
npm run tokai-ipad:sync-credentials:dry-run
npm run tokai-ipad:sync-credentials:apply
```

## 674 複数ヒット時の判定（AI チーム可）

`pc_status` を見る（new-pc-ledger と同義）。

1. **廃棄 / 取消** → 除外（現行ではない）
2. 残りに **利用中** があればそれだけ採用候補にする
3. 候補 1 件 → 自動採用 / 0 件 → NO_HIT / 2+ 件 → 浜田相談

実装: `resolvePcLedgerCredentialHits`（`scripts/lib/tokai-ipad-kintone.mjs`）

## 既知ギャップ（2026-07-28）

| device | 利用者 | 状態 |
|--------|--------|------|
| tokai20 | 田山　稜太 | **解消** — 廃棄106除外→利用中272を採用（§3.2a） |
| tokai22 | 宮川　航平 | 674 ヒットなし → M365/VPN 空のまま |

## Apps

- DB: https://jbis-kintone.cybozu.com/k/769/
- Dash: https://jbis-kintone.cybozu.com/k/770/
- Space 32 / thread 34
- **720/721 は触らない**
