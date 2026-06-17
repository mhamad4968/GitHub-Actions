# Apply UTF-8 BOM to PC kitting scripts (repo templates + optional Desktop copies).
param(
    [switch]$VerifyOnly
)

$utf8Bom = New-Object System.Text.UTF8Encoding $true
$roots = @($PSScriptRoot)
$desktopKit = Join-Path $env:USERPROFILE 'Desktop\PCキッテング用'
$desktopInstall = Join-Path $env:USERPROFILE 'Desktop\PCキッティングインストール用'
if (Test-Path -LiteralPath $desktopKit) { $roots += $desktopKit }
if (Test-Path -LiteralPath $desktopInstall) { $roots += $desktopInstall }

$allFiles = @()
foreach ($root in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $allFiles += Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in '.ps1', '.bat', '.txt' }
}
$allFiles = $allFiles | Select-Object -Unique -Property FullName

if (-not $allFiles -or $allFiles.Count -eq 0) {
    Write-Error "No kitting files found under: $($roots -join ', ')"
    exit 1
}

function Test-KittingPs1Parse {
    param([string]$Path)
    $errors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$null, [ref]$errors)
    return $errors
}

$fail = $false
foreach ($item in $allFiles) {
    $f = $item.FullName
    $bytes = [System.IO.File]::ReadAllBytes($f)
    $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    if (-not $VerifyOnly -and -not $hasBom) {
        $text = (New-Object System.Text.UTF8Encoding $false).GetString($bytes)
        [System.IO.File]::WriteAllText($f, $text, $utf8Bom)
        $hasBom = $true
        Write-Host "[add-bom] BOM applied: $f"
    }
    elseif ($VerifyOnly -and -not $hasBom) {
        Write-Host "[add-bom] MISSING BOM: $f"
        $fail = $true
    }
    if ($f -like '*.ps1') {
        $parseErrors = Test-KittingPs1Parse -Path $f
        if ($parseErrors -and $parseErrors.Count -gt 0) {
            Write-Host "[add-bom] PARSE ERROR: $f"
            foreach ($e in $parseErrors) {
                Write-Host ("  line {0}: {1}" -f $e.Extent.StartLineNumber, $e.Message)
            }
            $fail = $true
        }
    }
}

if ($fail) { exit 1 }
Write-Host "[add-bom] OK ($($allFiles.Count) files)"
