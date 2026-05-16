#Requires -Version 5.1
<#
.SYNOPSIS
  Windows タスク スケジューラ — 毎月 1 日に user683 先月要約投入を登録／確認／削除。

.PARAMETER Time
  ローカル時刻 HH:mm（既定 08:00）。PC のタイムゾーンが JST なら JST 8:00。

.PARAMETER Unregister
  タスクを削除する。

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/register-user683-sync-summaries-monthly-task.ps1

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows/register-user683-sync-summaries-monthly-task.ps1 -Unregister
#>
param(
  [string]$Time = '08:00',
  [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$TaskName = 'kintone-ai-lab-user683-sync-prev-month'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runPs1 = Join-Path $PSScriptRoot 'user683-sync-summaries-prev-month-run.ps1'
if (-not (Test-Path $runPs1)) {
  Write-Error "Missing: $runPs1"
}

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runPs1`""

if ($Unregister) {
  schtasks /Delete /TN $TaskName /F 2>$null
  Write-Host "[user683-task] deleted (if existed): $TaskName"
  exit 0
}

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$null = & schtasks.exe /Query /TN $TaskName /FO LIST 2>&1
$taskExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap
if ($taskExists) {
  Write-Host "[user683-task] already registered: $TaskName"
  schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time|スケジュール|Schedule'
  exit 0
}

# /SC MONTHLY /D 1 = 毎月 1 日（ローカル TZ）
schtasks /Create `
  /TN $TaskName `
  /TR $tr `
  /SC MONTHLY `
  /D 1 `
  /ST $Time `
  /F `
  /RL LIMITED

if ($LASTEXITCODE -ne 0) {
  Write-Error "schtasks /Create failed exit=$LASTEXITCODE"
}

Write-Host "[user683-task] registered: $TaskName"
Write-Host "  schedule: monthly day 1 at $Time (local timezone)"
Write-Host "  command: npm run user683:sync-summaries:apply-prev-month"
Write-Host "  logs: $repo\logs\user683-sync-scheduled-*.log"
schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time'
