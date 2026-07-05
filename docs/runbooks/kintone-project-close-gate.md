# kintone プロジェクト CLOSED 前ゲート（R36）

**制定**: 2026-06-14（浜田 GO — R34–R40 一括）  
**関門**: **目視 OK・クローズ宣言・SPEC commit の前**に本ゲートを通す

---

## 必須（すべて OK）

| # | 検査 | コマンド |
|---|------|----------|
| 1 | **ESLint（customize）** | `npm run lint:customize` — error 0 |
| 2 | **bundle 成果物** | 719 等 bundle 型は `npm run wifi-ssid:bundle-dash` 後、**lint は `desktop.src.js` のみ**（`eslint.config.js` 参照） |
| 3 | **SPEC 同日 commit** | `npm run verify:cio-spec-close-git`（R24） |
| 4 | **customize パス registry** | `npm run verify:kintone-customize-path-registry`（R37） |
| 5 | **憲法 handoff** | `npm run verify:constitution-handoff` |
| 6 | **checkpoint archive 追跡** | `npm run verify:checkpoint-archive-tracked` |
| 7 | **クローズ JSON** | `data/cio-project-closures.json` 更新 + `npm run verify:checkpoint-project-closure` |
| 8 | **一括** | `npm run cio:project:close -- --verify` |

---

## 禁止（F2 / CI 赤再発）

- **目視 OK のあと** `customize/**` を push して **ESLint 未確認**（2026-06-14 Wi-Fi で CI 赤）
- **semantic フォルダ**（`wifi-ssid-dash` 等）を registry 未登録のまま deploy
- **bundle 成果物** `desktop.js` を手編集して `desktop.src.js` と乖離

---

## セマンティック customize 正本

`data/kintone-customize-path-registry.json` — ディレクトリ名 → appId + bundle パターン

| ディレクトリ | appId | deploy ファイル | lint 対象 |
|-------------|-------|-----------------|-----------|
| `wifi-ssid-db` | 718 | `desktop.js` | `desktop.js` |
| `jr-ipad-db` | 720 | `desktop.js` | `desktop.js` |
| `jr-ipad-dash` | 721 | `desktop.js`（bundle） | `desktop.src.js` |

実装 setup 時は `npm run <lane>:register-registry` で mappings を追記（R-2026-06-15-A3）。

### DB+台帳 ID 同期 bundle（R43）

dash が DB を REST 参照するレーンは **bundle 前に APP_DB 同期必須**（0 禁止）。

| レーン | sync | bundle |
|--------|------|--------|
| `vpn-account` | `vpn-account-sync-dash-db-id.mjs` | `vpn-account-bundle-dash.mjs` |

テンプレ: `scripts/lib/kintone-sync-dash-db-id.mjs` + `kintone-bundle-dash-with-sync.mjs`  
scaffold: `npm run kintone:ledger-v1-scaffold -- … --emit-scripts`

---

## 機械検査（一括）

```powershell
npm run verify:kintone-project-close-gate
```

内訳: `lint:customize` + `verify:cio-spec-close-git` + `verify:kintone-customize-path-registry` + `verify:constitution-handoff` + `verify:checkpoint-archive-tracked`

---

## kintone アプリ廃止（S-712-DEL-01 / 2026-07-05 GO）

利用頻度低・ポータル等の **廃止**時。712 実例: `docs/plans/2026-06-11-space48-portal-spec.md`

| # | 手順 | 担当 |
|---|------|------|
| 1 | **レコード export**（`scripts/*-export-backup.mjs` 等） | AI |
| 2 | **正本更新** — `kintone-apps.md` 運用終了 · registry から除外 · `deploy:*` ブロック | AI |
| 3 | **`cio-live-builds.json`** に RETIRED 注記 | AI |
| 4 | **Space / ポータルリンク削除** | 浜田（手動） |
| 5 | **kintone 管理画面でアプリ削除** | 浜田 |
| 6 | **API 確認** — `GAIA_AP01` not found | AI |
| 7 | **commit + push** 同一ターン | AI |

---

## 関連

- `docs/runbooks/kintone-ledger-spec-qa-checklist.md`（R19 SPEC GO 前）
- `docs/runbooks/repo-workspace-lifecycle.md`（R35 パス整理 GO）
- `.github/workflows/kintone-customize-deploy.yml`
