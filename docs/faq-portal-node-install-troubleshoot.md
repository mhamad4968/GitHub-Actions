# Node.js / npm インストールが進まないとき（短いメモ）

## Node.js（.msi）が止まる

- インストーラを **管理者として実行**する。  
- **5〜15 分**待つ（ウイルス対策のスキャンで遅延することがある）。  
- **PC を再起動**してから再実行。  
- LTS を **再ダウンロード**して実行（破損対策）。  
- **winget**: 管理者 PowerShell で `winget install OpenJS.NodeJS.LTS`  
- 企業環境では **情シス**に「Node.js LTS インストール可否・配布パッケージ」を依頼。

## `npm install` が終わらない

- `npm install --verbose` で止まっている行を確認。  
- `npm config set registry https://registry.npmjs.org/`  
- 社内プロキシがある場合は `npm config set https-proxy ...`（情シスに確認）。

再開の全体手順は [`faq-portal-resume-tomorrow.md`](faq-portal-resume-tomorrow.md)。
