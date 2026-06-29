#Requires -Version 5.1
<#
.SYNOPSIS
  Windows タスク スケジューラ — 毎月 1 日に mcp.json.bak-* prune を登録／確認／削除。

.PARAMETER Time
  ローカル時刻 HH:mm（既定 08:30 JST 想定）

.PARAMETER Unregister
  タスクを削除する。

.EXAMPLE
  npm run mcp:prune-backups:install-task

.EXAMPLE
  npm run mcp:prune-backups:uninstall-task
#>
param(
  [string]$Time = '08:30',
  [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$TaskName = 'kintone-ai-lab-mcp-prune-backups-monthly'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runPs1 = Join-Path $PSScriptRoot 'mcp-prune-backups-monthly-run.ps1'
if (-not (Test-Path $runPs1)) {
  Write-Error "Missing: $runPs1"
}

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runPs1`""

if ($Unregister) {
  schtasks /Delete /TN $TaskName /F 2>$null
  Write-Host "[mcp-prune-task] deleted (if existed): $TaskName"
  exit 0
}

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$null = & schtasks.exe /Query /TN $TaskName /FO LIST 2>&1
$taskExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap
if ($taskExists) {
  Write-Host "[mcp-prune-task] already registered: $TaskName"
  schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time|スケジュール|Schedule'
  exit 0
}

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

Write-Host "[mcp-prune-task] registered: $TaskName"
Write-Host "  schedule: monthly day 1 at $Time (local timezone)"
Write-Host "  command: npm run mcp:prune-backups:monthly"
Write-Host "  logs: $repo\logs\mcp-prune-scheduled-*.log"
Write-Host "  verify: npm run verify:mcp-backup-prune-monthly"
schtasks /Query /TN $TaskName /V /FO LIST | Select-String -Pattern '次回の実行時刻|Next Run Time|タスクの実行|Task To Run|開始時刻|Start Time'
