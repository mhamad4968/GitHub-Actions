#Requires -Version 5.1
<#
.SYNOPSIS
  Windows ネイティブ（WSL なし）向けサンプル: タスク スケジューラで §51-6-2 の壁時計チェックを定期実行。

.DESCRIPTION
  正本の crontab 相当は WSL 内の `npm run session:clock:install-cron`。
  本スクリプトは **管理者が手で** タスクを登録する際の参考用（リポを WSL のパスに合わせて編集すること）。

.EXAMPLE
  # 10 分ごと（例: WSL の既定ディストリで kintone-ai-lab を開く）
  $action = New-ScheduledTaskAction -Execute "wsl.exe" -Argument "-d Ubuntu --cd /home/YOURUSER/kintone-ai-lab -- npm run session:split-check"
  $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 10) -RepetitionDuration ([TimeSpan]::MaxValue)
  Register-ScheduledTask -TaskName "kintone-ai-lab-session-split-check" -Action $action -Trigger $trigger -User $env:USERNAME -RunLevel Highest

.NOTES
  - 通知 UI は WSL 側の `desktop-notify`（Windows Popup）に依存する場合は、上記の代わりに
    `wsl.exe ... node scripts/session-split-cron-ping.mjs` を呼ぶと 4h 超でポップアップまで届く。
  - パス・ディストリ名は環境に合わせて必ず置換すること。
#>

Write-Host "このファイルはサンプルです。Register-ScheduledTask を手で実行する前に引数を編集してください。" -ForegroundColor Yellow
