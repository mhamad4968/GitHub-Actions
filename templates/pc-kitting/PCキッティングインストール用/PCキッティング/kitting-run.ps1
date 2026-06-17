#requires -RunAsAdministrator
<#
.SYNOPSIS
  JBIS post-domain install bootstrap (ASCII-only). Ensures UTF-8 BOM, then runs post-domain-install.ps1.
#>
param(
    [switch]$SkipConfirm
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Repair-KittingPs1Utf8Bom {
    param([string]$Dir)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $utf8Bom = New-Object System.Text.UTF8Encoding $true
    Get-ChildItem -LiteralPath $Dir -Filter '*.ps1' -File | ForEach-Object {
        if ($_.Name -ieq 'kitting-run.ps1') { return }
        $path = $_.FullName
        $bytes = [System.IO.File]::ReadAllBytes($path)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            return
        }
        $text = $utf8.GetString($bytes)
        [System.IO.File]::WriteAllText($path, $text, $utf8Bom)
    }
}

try {
    [void](Repair-KittingPs1Utf8Bom -Dir $ScriptDir)
}
catch {
    Write-Error ("UTF-8 BOM repair failed: {0}" -f $_.Exception.Message)
    exit 1
}

$mainPath = Join-Path $ScriptDir 'post-domain-install.ps1'
if (-not (Test-Path -LiteralPath $mainPath)) {
    Write-Error ("Missing post-domain-install.ps1 in {0}" -f $ScriptDir)
    exit 1
}

$params = @{}
if ($SkipConfirm) { $params.SkipConfirm = $true }

& $mainPath @params
exit $LASTEXITCODE
