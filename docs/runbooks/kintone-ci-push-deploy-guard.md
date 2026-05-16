# kintone: GitHub Actions の push 連動デプロイ・安全ゲート

**正本ワークフロー**: `.github/workflows/kintone-customize-deploy.yml`  
**目的**: `main` へ push しただけで **意図しない kintone 本番 JS 反映**が起きないようにする（CIO 自律ゲート・2026-05-16）。

## 何が変わったか（push 時）

1. **Repository variables（Actions Variables）**  
   - 名前: **`KINTONE_PUSH_AUTO_DEPLOY`**  
   - 値が文字列 **`true`** のときだけ、**push** で `customize/<数字>/desktop.js` が変わった場合に **従来どおり API デプロイ**（`deploy_js=1`）へ進む。  
   - **未設定・`True`・`1`・その他** → **API デプロイは行わない**（**`npm run lint:customize` のみ**で完了）。

2. **複数アプリ同一 push の拒否**  
   - 同一 push の `git diff` に、**異なるアプリ ID** の `customize/<数字>/desktop.js` が **2 本以上**含まれる → **API デプロイ拒否**（どれを上げるかの曖昧さ・先頭 1 件拾いの誤爆を防ぐ）。  
   - **同一アプリの複数コミットを 1 push にまとめた**場合（差分はすべて同じ `<数字>`）は **許可**（`uniq` が 1 のため）。

3. **`workflow_dispatch`（手動実行）**  
   - **常に API デプロイ経路へ進める**（運用者が Actions UI で対象 run を確認して実行する前提）。  
   - 手動でも危険なので **Environment `kintone-collect`**・Secrets の **KINTONE_APP / トークン**が正しいことを必ず確認する。

4. **`github.event.before` が空の push**（稀な初回系）  
   - **`KINTONE_PUSH_AUTO_DEPLOY=true` のときだけ** `deploy_js=1` を許可。それ以外はスキップ。

## 運用チェックリスト（浜田 CEO / 管理者）

- [ ] GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions** → **Variables** タブ  
- [ ] **`KINTONE_PUSH_AUTO_DEPLOY`** を **`true`** にする（**push で自動デプロイを継続したい場合のみ**）。  
- [ ] **複数アプリの `desktop.js` を 1 コミットで push しない**（CI が拒否する。分割 push か手動 workflow）。  
- [ ] **674（`customize/new-pc-ledger-v1/`）・629（`customize/shucccho-seisan/`）** など **パスが `customize/<数字>/` 以外**の変更は、本ゲートの **「複数アプリ判定」対象外**（従来どおり diff に `customize/<数字>/desktop.js` が無ければデプロイはスキップ）。必要なら **workflow_dispatch** でデプロイ。

## 参考: ローカル preflight デプロイ

ローカルの **`npm run cio:preflight:<app>` → `npm run deploy:<app>`** は本ドキュメントの対象外（GitHub Actions とは別経路）。

## 変更履歴

- **2026-05-16**: CIO 導入（変数ゲート + 複数アプリ push 拒否）。DeepSeek 方針 (A) + 複数アプリ (B) を統合。
