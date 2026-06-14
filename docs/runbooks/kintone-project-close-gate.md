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
| 5 | **クローズ JSON** | `data/cio-project-closures.json` 更新 + `npm run verify:checkpoint-project-closure` |

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
| `wifi-ssid-dash` | 719 | `desktop.js`（bundle） | `desktop.src.js` |

---

## 機械検査（一括）

```powershell
npm run verify:kintone-project-close-gate
```

内訳: `lint:customize` + `verify:cio-spec-close-git` + `verify:kintone-customize-path-registry`

---

## 関連

- `docs/runbooks/kintone-ledger-spec-qa-checklist.md`（R19 SPEC GO 前）
- `docs/runbooks/repo-workspace-lifecycle.md`（R35 パス整理 GO）
- `.github/workflows/kintone-customize-deploy.yml`
