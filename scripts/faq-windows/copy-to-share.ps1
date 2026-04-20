# deploy-share-path.txt の1行目をコピー先フォルダ（UNC 可）とみなし、out\faq-portal-full.html を上書きコピーする
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here 'out\faq-portal-full.html'
$cfg = Join-Path $here 'deploy-share-path.txt'

if (-not (Test-Path $src)) {
    Write-Error "コピー元がありません: $src （先に 04-build-intranet-html.bat を実行）"
    exit 1
}
if (-not (Test-Path $cfg)) {
    Write-Error "deploy-share-path.txt がありません。deploy-share-path.example.txt をコピーして1行でフォルダパスを書いてください。"
    exit 1
}
$raw = (Get-Content -LiteralPath $cfg -Raw -Encoding UTF8)
$line = ($raw -split "`r?`n" | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^\s*#' } | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($line)) {
    Write-Error "deploy-share-path.txt に有効なパスがありません（# で始まる行はコメント）"
    exit 1
}
$destDir = $line.Trim()
if (-not (Test-Path -LiteralPath $destDir)) {
    Write-Host "フォルダを作成します: $destDir"
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}
$destFile = Join-Path $destDir 'faq-portal-full.html'
Copy-Item -LiteralPath $src -Destination $destFile -Force
Write-Host "[OK] コピーしました"
Write-Host "     $destFile"
