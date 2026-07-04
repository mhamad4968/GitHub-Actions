# closed-v1 移行元 Excel アーカイブ

**2026-07-04** — 浜田確認: 各 kintone アプリ v1 完成済のため `C:\tmp\<案件名>` 作業フォルダを廃止。  
移行元 Excel の控えのみ本ディレクトリに保管。**データ正本は kintone**。

| ファイル | クローズ案件 |
|---------|-------------|
| C_Hubアカウント一覧.xlsx | JRE-C_Hub（Space 34） |
| JREクラウドアカウント一覧.xlsx | JREクラウド（Space 34） |
| JRシステム用iPad.xlsx | JR iPad 720–721 |
| NAS管理台帳_20260629.xlsx | NAS 748–749 |
| VPNアカウント管理.xlsx | VPN 733–734 |
| トータルネットワークのネットワーク情報管理台帳.xlsx | トータルネット 737–738 |
| メーリングリスト一覧更新2.xlsx | メーリングリスト 750–751 |
| 複合機管理台帳.xlsx | 複合機 741–742 |

スクリプト既定パス: `scripts/lib/closed-v1-migration-xlsx.mjs` → `archiveXlsx()`  
上書き: 各 `*_XLSX` 環境変数または `--xlsx=` 引数。
