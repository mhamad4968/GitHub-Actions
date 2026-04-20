# 社内用: proxy-url.txt の URL を先頭に挿入した HTML を out\ に出力する（UTF-8 BOM なし）
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $here '..\..')
$urlFile = Join-Path $here 'proxy-url.txt'
$htmlSrc = Join-Path $repoRoot 'scripts\faq-portal-full.html'
$outDir = Join-Path $here 'out'
$outPath = Join-Path $outDir 'faq-portal-full.html'

if (-not (Test-Path $urlFile)) {
    Write-Error "proxy-url.txt がありません。proxy-url.txt.example をコピーして URL を1行で書いてください。"
    exit 1
}
$base = (Get-Content -LiteralPath $urlFile -Raw -Encoding UTF8).Trim()
if ([string]::IsNullOrWhiteSpace($base)) {
    Write-Error "proxy-url.txt が空です。"
    exit 1
}
if (-not (Test-Path $htmlSrc)) {
    Write-Error "ソースが見つかりません: $htmlSrc"
    exit 1
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$content = Get-Content -LiteralPath $htmlSrc -Raw -Encoding UTF8
if ($content -match '(?s)^\s*<script>\s*window\.FAQ_API_BASE\s*=') {
    Write-Host "[OK] ソース先頭に既に FAQ_API_BASE があります。そのままコピーします。"
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($outPath, $content, $utf8)
    Write-Host "出力: $outPath"
    exit 0
}

$inject = "<script>window.FAQ_API_BASE = `"$base`";</script>`r`n"
$out = $inject + $content
$utf8Out = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outPath, $out, $utf8Out)
Write-Host "[OK] 出力: $outPath"
Write-Host "     FAQ_API_BASE = $base"
