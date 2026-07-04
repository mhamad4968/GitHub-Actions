#Requires -Version 5.1
<#
.SYNOPSIS
  Windows タスク スケジューラ — 595→698 日次同期（毎日 22:30 ローカル）

.PARAMETER Time
  ローカル時刻 HH:mm（既定 22:30）

.PARAMETER Unregister
  タスクを削除する。

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/register-business-improvement-sync595-daily-task.ps1
#>
param(
  [string]$Time = '22:30',
  [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$TaskName = 'kintone-ai-lab-bi-sync595-daily'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runPs1 = Join-Path $PSScriptRoot 'business-improvement-sync595-daily-run.ps1'
if (-not (Test-Path $runPs1)) {
  Write-Error "Missing: $runPs1"
}

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runPs1`""

if ($Unregister) {
  schtasks /Delete /TN $TaskName /F 2>$null
  Write-Host "[bi-sync595-task] deleted (if existed): $TaskName"
  exit 0
}

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$null = & schtasks.exe /Query /TN $TaskName /FO LIST 2>&1
$taskExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap
if ($taskExists) {
  Write-Host "[bi-sync595-task] already registered: $TaskName"
  schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time|スケジュール|Schedule'
  exit 0
}

schtasks /Create `
  /TN $TaskName `
  /TR $tr `
  /SC DAILY `
  /ST $Time `
  /F `
  /RL LIMITED

if ($LASTEXITCODE -ne 0) {
  Write-Error "schtasks /Create failed exit=$LASTEXITCODE"
}

Write-Host "[bi-sync595-task] registered: $TaskName"
Write-Host "  schedule: daily at $Time (local timezone)"
Write-Host "  command: npm run business-improvement:sync-595"
Write-Host "  logs: $repo\logs\bi-sync595-scheduled-*.log"
schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time'
