#requires -RunAsAdministrator
<#
.SYNOPSIS
  JBIS PC kitting bootstrap (ASCII-only). Ensures UTF-8 BOM on sibling .ps1, then runs kitting-main.ps1.
.NOTES
  PowerShell 5.1 on Japanese Windows may parse .ps1 as system ANSI unless UTF-8 BOM is present.
  PCキッティング_START.bat must invoke this file instead of kitting-main.ps1 directly.
#>
param(
    [ValidateSet('Full', 'PostReboot')]
    [string]$Mode = 'Full',
    [switch]$SkipConfirm
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Repair-KittingPs1Utf8Bom {
    param([string]$Dir)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $utf8Bom = New-Object System.Text.UTF8Encoding $true
    $repaired = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $Dir -Filter '*.ps1' -File | ForEach-Object {
        if ($_.Name -ieq 'kitting-run.ps1') { return }
        $path = $_.FullName
        $bytes = [System.IO.File]::ReadAllBytes($path)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            return
        }
        $text = $utf8.GetString($bytes)
        [System.IO.File]::WriteAllText($path, $text, $utf8Bom)
        [void]$repaired.Add($_.Name)
    }
    return $repaired
}

try {
    [void](Repair-KittingPs1Utf8Bom -Dir $ScriptDir)
}
catch {
    Write-Error ("UTF-8 BOM repair failed: {0}" -f $_.Exception.Message)
    exit 1
}

$mainPath = Join-Path $ScriptDir 'kitting-main.ps1'
if (-not (Test-Path -LiteralPath $mainPath)) {
    Write-Error ("Missing kitting-main.ps1 in {0}" -f $ScriptDir)
    exit 1
}

$params = @{ Mode = $Mode }
if ($SkipConfirm) { $params.SkipConfirm = $true }

& $mainPath @params
exit $LASTEXITCODE
