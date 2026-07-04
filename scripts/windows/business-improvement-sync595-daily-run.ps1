#Requires -Version 5.1
<#
.SYNOPSIS
  595 → 698 社員マスタ同期（定時ジョブ本体）

.NOTES
  正本: npm run business-improvement:sync-595
  Runbook: docs/runbooks/business-improvement-closed-v1-ux.md §R-BI-02
#>
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logDir = Join-Path $repo 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile = Join-Path $logDir "bi-sync595-scheduled-$stamp.log"

function Write-Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Host $line
}

Write-Log "START repo=$repo"
Set-Location $repo
if (-not (Test-Path (Join-Path $repo 'package.json'))) {
  Write-Log 'ERROR package.json not found'
  exit 2
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Log 'ERROR npm not in PATH'
  exit 2
}

try {
  npm run business-improvement:sync-595 2>&1 | Tee-Object -FilePath $logFile -Append
  if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR npm exit=$LASTEXITCODE"
    exit $LASTEXITCODE
  }
  Write-Log 'OK'
  exit 0
} catch {
  Write-Log "ERROR $($_.Exception.Message)"
  exit 1
}
