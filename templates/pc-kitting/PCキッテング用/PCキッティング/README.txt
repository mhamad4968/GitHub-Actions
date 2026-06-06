# PCキッティング（Windows 11 Pro 向け）

配置: デスクトップ **`PCキッテング用`** フォルダ内

対象 OS: **Windows 11 Pro**（Enterprise / Education も可）  
**`PCキッティング_START.bat`** をダブルクリックして実行します（管理者 / UAC）。

## 処理の流れ

1. **開始確認** … 「PCキッティングを開始しますか？」（はい・いいえ）
2. **OS 確認** … Windows 11 Pro かチェック（不一致時は警告）
3. **Windows Update** … 更新プログラムの検索・インストール
4. **Windows機能** … 画像どおりの機能を DISM で有効化（Win11 で無い項目は自動スキップ）
5. **再起動** … 完了後、再起動するか確認
6. **再起動後（自動）** … 「PC名とドメイン参加を行いますか？」→ 入力 → 参加

※ **Windows 11 Home** ではドメイン参加不可のため、Update / 機能のみ実行します。

## ログ

`C:\ProgramData\JBIS-PC-Kitting\logs\`

## 注意

- **管理者権限必須**（UAC が表示されます）
- Windows Update は **数十分〜数時間** かかることがあります
- Hyper-V 等は PC・BIOS 設定によっては有効化できず **警告ログのみ** で続行します
- ドメイン名の **既定値は `kent.local`**（入力画面で変更可）
- ドメイン参加アカウントは **社内の正しい値** を入力してください

## ファイル構成

```
デスクトップ\PCキッテング用\
  PCキッティング_START.bat   … 起動用（ここをダブルクリック）
  PCキッティング\
    kitting-main.ps1
    features-list.ps1
    README.txt
```

## 手動で再起動後フェーズだけ実行

```powershell
powershell -ExecutionPolicy Bypass -Sta -File "...\PCキッティング\kitting-main.ps1" -Mode PostReboot
```

（管理者 PowerShell）
