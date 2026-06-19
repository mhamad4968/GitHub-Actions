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
    kitting-run.ps1          … 起動ブートストラップ（UTF-8 BOM 自動修復 → main 実行）
    kitting-main.ps1
    kitting-encoding.ps1
    features-list.ps1
    README.txt
    logs\                    … 実行後に生成（共有用ログ）
```

## 起動エラー（Unexpected token / 文字化け / CenterScreen）

**原因**: `.ps1` が **UTF-8 BOM なし**でコピーされると、PowerShell 5.1（日本語 Windows）が
Shift-JIS として読み込み、日本語文字列内の `"` や `}` が壊れて **構文解析エラー**になります。
（例: `10遘貞ｾ後↓...` のような文字化け）

**対処**:
1. リポ `templates\pc-kitting\PCキッテング用\` から **フォルダごと** デスクトップへ上書きコピー
2. **`PCキッティング_START.bat`** で起動（`kitting-run.ps1` 経由 — 初回に BOM を自動修復）
3. 開発側で BOM を一括適用する場合: `templates\pc-kitting\add-bom.ps1` を実行

## 起動エラー（'l' / 'ITDIR' / Script not found / `・ｿ@echo`）

**原因**: `.bat` に **UTF-8 BOM** が付いている（旧 `add-bom.ps1` が .bat にも BOM を付けていた）。
cmd.exe が先頭行を `・ｿ@echo off` のように壊し、続く行も `setlocal`→`l`、`set ROOT`→`OOT=` となります。

**対処**: リポ `templates\pc-kitting\PCキッテング用\` から **フォルダごと** デスクトップへ
上書きコピーし、**ASCII 版（BOM なし）** `PCキッティング_START.bat` で再実行してください。
開発 PC では `templates\pc-kitting\fix-bat-encoding.ps1` で .bat の BOM を除去してから配布できます。
（サブフォルダ名は `PCキッティング` のままで可 — .bat は中の ps1 を自動検出します）

## 手動で再起動後フェーズだけ実行

```powershell
powershell -ExecutionPolicy Bypass -Sta -File "...\PCキッティング\kitting-run.ps1" -Mode PostReboot
```

（管理者 PowerShell）
