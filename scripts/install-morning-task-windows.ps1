# Windows Task Scheduler — 毎朝 06:00 JST 朝報（WSL cron の二重化）
# 実行: powershell -ExecutionPolicy Bypass -File scripts/install-morning-task-windows.ps1
# 削除: Unregister-ScheduledTask -TaskName kintone-ai-lab-morning-prep -Confirm:$false

$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\Users\mhamada202408224\kintone-ai-lab'
$NodeExe = 'C:\Program Files\nodejs\node.exe'
$TaskName = 'kintone-ai-lab-morning-prep'
$LogDir = Join-Path $RepoRoot 'logs\morning-prep'
$LogFile = Join-Path $LogDir 'windows-task.log'

if (-not (Test-Path $NodeExe)) {
  Write-Error "Node not found: $NodeExe"
}
if (-not (Test-Path $RepoRoot)) {
  Write-Error "Repo not found: $RepoRoot"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# 06:00 ローカル（日本 PC 想定 = JST）
$Trigger = New-ScheduledTaskTrigger -Daily -At '06:00'
$Action = New-ScheduledTaskAction -Execute $NodeExe -Argument "scripts/morning-prep-ensure.mjs" -WorkingDirectory $RepoRoot
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

Write-Host "[OK] Scheduled task registered: $TaskName"
Write-Host "  Time: Daily 06:00 (local)"
Write-Host "  Cmd:  node scripts/morning-prep-ensure.mjs  (full mode)"
Write-Host "  Log:  $LogFile (cron.log にも追記)"
Write-Host "  Verify: Get-ScheduledTask -TaskName $TaskName"
