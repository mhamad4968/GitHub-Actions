# public-portal-url.txt の 1 行目を URL とした Internet ショートカットを 配布用\ に出力する
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfg = Join-Path $here 'public-portal-url.txt'
$outDir = Join-Path $here '配布用'
$outFile = Join-Path $outDir '経理FAQポータル.url'

if (-not (Test-Path $cfg)) {
    Write-Error "public-portal-url.txt がありません。public-portal-url.example.txt をコピーし、社員が開く http(s)://... を1行で書いてください。"
    exit 1
}
$raw = Get-Content -LiteralPath $cfg -Raw -Encoding UTF8
$line = ($raw -split "`r?`n" | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^\s*#' } | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($line)) {
    Write-Error "public-portal-url.txt に有効な URL がありません。"
    exit 1
}
$url = $line.Trim()
if ($url -notmatch '^https?://') {
    Write-Error "URL は http:// または https:// で始めてください: $url"
    exit 1
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$content = "[InternetShortcut]`r`nURL=$url`r`n"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outFile, $content, $utf8)
Write-Host "[OK] ショートカットを出力しました"
Write-Host "     $outFile"
Write-Host "     URL = $url"
