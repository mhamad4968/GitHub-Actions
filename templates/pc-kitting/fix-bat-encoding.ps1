# Ensure PC kitting .bat launchers are ASCII (no BOM, CRLF) for cmd.exe.
param(
    [switch]$VerifyOnly
)

$roots = @($PSScriptRoot)
$extra = @(
    (Join-Path $env:USERPROFILE 'Desktop\PCキッテング用'),
    (Join-Path $env:USERPROFILE 'Desktop\PCキッティングインストール用')
)
foreach ($p in $extra) {
    if (Test-Path -LiteralPath $p) { $roots += $p }
}
if (Test-Path -LiteralPath 'C:\tmp') {
    $roots += Get-ChildItem -LiteralPath 'C:\tmp' -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'PC*' } |
        ForEach-Object { $_.FullName }
}

$ascii = New-Object System.Text.ASCIIEncoding
$fail = $false
$files = @()
foreach ($root in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $files += Get-ChildItem -LiteralPath $root -Recurse -Filter '*.bat' -File -ErrorAction SilentlyContinue
}
$files = $files | Select-Object -Unique -Property FullName

foreach ($item in $files) {
    $path = $item.FullName
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    $hasUtf16 = ($bytes.Length -ge 2 -and (($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) -or ($bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF)))
    if ($hasBom -or $hasUtf16) {
        if ($VerifyOnly) {
            Write-Host "[fix-bat] BAD ENCODING: $path"
            $fail = $true
            continue
        }
        $start = 0
        if ($hasBom) { $start = 3 }
        elseif ($hasUtf16) {
            Write-Host "[fix-bat] UTF-16 detected (re-save as ASCII): $path"
            $fail = $true
            continue
        }
        $text = (New-Object System.Text.UTF8Encoding $false).GetString($bytes, $start, $bytes.Length - $start)
        $text = $text -replace "`r?`n", "`r`n"
        [System.IO.File]::WriteAllText($path, $text, $ascii)
        Write-Host "[fix-bat] fixed: $path"
    }
    elseif ($VerifyOnly) {
        Write-Host "[fix-bat] OK: $path"
    }
}

if ($fail) { exit 1 }
Write-Host "[fix-bat] OK ($($files.Count) bat files checked)"
