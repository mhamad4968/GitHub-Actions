# DB+Dash 台帳 v1 初回リリース Runbook

**承認**: R-741-01 / RB-741-01（2026-06-22 浜田 GO）  
**憲法**: `docs/constitution/24-db-dash-scaffold-kernel.md`

---

## 1. 事前

- [ ] 仕様書 Q1–Qn 確定・§15 AI レビュー済
- [ ] `npm run cio:pre-implement-gate`
- [ ] 参照型アプリ URL 確認（719 / 734 等）

## 2. マスタ・スクリプト

```bash
npm run <slug>:add-master      # 680 等が必要な場合
npm run <slug>:create-db
npm run <slug>:create-dash
npm run <slug>:register-registry
```

- [ ] `scripts/data/<slug>-app-ids.json` に dbAppId / dashAppId 記録
- [ ] `npm run verify:kintone-app-ids -- --slug <slug>`

## 3. 移行（Excel 正本がある場合）

```bash
npm run <slug>:migrate:xlsx -- --dry-run
npm run <slug>:migrate:xlsx -- --apply
```

- [ ] 件数一致（例: 36 件）
- [ ] 移行ログに PW なし

## 4. customize

```bash
npm run <slug>:sync-dash      # APP_DB 同期 + bundle
npm run lint:customize        # src のみ OK（bundle desktop.js は ignore 済）
```

- [ ] DB block: mobile イベント含む
- [ ] Dash: BUILD 行・APP_DB 一致

## 5. deploy

```bash
npm run cio:preflight:<dbId> -- --note "…"
npm run deploy:<dbId>
npm run cio:preflight:<dashId> -- --note "…"
npm run deploy:<dashId>
```

- [ ] `sync:kintone-apps-build -- <dbId>` / `<dashId>`
- [ ] `npm run verify:cio-deploy-ledger-gate -- --apps <dbId>,<dashId>`
- [ ] `npm run rag:mirror:canonical-docs`

## 6. ACL（API 失敗時）

→ `docs/runbooks/kintone-acl-manual-space48-crud.md`

## 7. 浜田目視 OK

- [ ] 一覧・CRUD・検索・印刷・xlsx（仕様どおり）
- [ ] DB アプリ save/delete ブロック

## 8. CLOSED

→ `docs/runbooks/excel-abandon-two-stage.md`  
→ `npm run <slug>:close`（closures + verify）

## 参照実績

| 案件 | ID | completion |
|------|-----|------------|
| 複合機 | 741/742 | `docs/reports/2026-06-22-mfp-ledger-completion.md` |
| Wi-Fi | 718/719 | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| VPN | 733/734 | `docs/reports/2026-06-17-vpn-account-completion.md` |
