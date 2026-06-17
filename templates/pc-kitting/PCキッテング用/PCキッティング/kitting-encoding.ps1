# UTF-8 / 日本語表示・ログの共通処理（Windows 11 Pro / PowerShell 5.1）
# kitting-main.ps1 / post-domain-install.ps1 から dot-source

$script:KittingActiveLogFiles674 = @()
$script:KittingLocalLatestLog674 = $null
$script:KittingLogInfo674 = $null

function Initialize-KittingEncoding674 {
    try {
        if ($Host.Name -eq 'ConsoleHost') {
            cmd /c 'chcp 65001 >nul' | Out-Null
        }
    }
    catch { }

    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $script:OutputEncoding = [System.Text.Encoding]::UTF8

    if (-not $script:KittingUtf8Bom674) {
        $script:KittingUtf8Bom674 = New-Object System.Text.UTF8Encoding $true
    }
}

function Get-KittingUiLogFont674 {
    foreach ($name in @('Meiryo UI', 'Yu Gothic UI', 'Segoe UI')) {
        try {
            return New-Object System.Drawing.Font($name, 9)
        }
        catch { }
    }
    return New-Object System.Drawing.Font('Segoe UI', 9)
}

function Write-KittingLogLine674 {
    param(
        [string]$LogFile,
        [Parameter(Mandatory = $true)][string]$Line
    )
    if (-not $script:KittingUtf8Bom674) {
        Initialize-KittingEncoding674
    }
    $targets = @()
    if ($LogFile) {
        $targets = @($LogFile)
    }
    elseif ($script:KittingActiveLogFiles674 -and $script:KittingActiveLogFiles674.Count -gt 0) {
        $targets = @($script:KittingActiveLogFiles674)
    }
    else {
        return
    }
    foreach ($f in ($targets | Select-Object -Unique)) {
        $dir = Split-Path -Parent $f
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }
        [System.IO.File]::AppendAllText($f, $Line + [Environment]::NewLine, $script:KittingUtf8Bom674)
    }
}

function Write-KittingTextFile674 {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    if (-not $script:KittingUtf8Bom674) {
        Initialize-KittingEncoding674
    }
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $script:KittingUtf8Bom674)
}

function Initialize-KittingLogs674 {
    param(
        [Parameter(Mandatory = $true)][string]$ScriptDir,
        [Parameter(Mandatory = $true)][string]$LogPrefix,
        [Parameter(Mandatory = $true)][string]$Title
    )

    $kitRoot = Split-Path $ScriptDir -Parent
    $systemLogDir = Join-Path $env:ProgramData 'JBIS-PC-Kitting\logs'
    $localLogDir = Join-Path $kitRoot 'logs'
    New-Item -ItemType Directory -Force -Path $systemLogDir, $localLogDir | Out-Null

    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $fileName = '{0}_{1}.log' -f $LogPrefix, $stamp
    $systemLog = Join-Path $systemLogDir $fileName
    $localLog = Join-Path $localLogDir $fileName
    $latestLog = Join-Path $localLogDir '最新.log'

    $script:KittingActiveLogFiles674 = @($systemLog, $localLog)
    $script:KittingLocalLatestLog674 = $latestLog

    $osCaption = '不明'
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
        $osCaption = [string]$os.Caption
    }
    catch { }

    $header = @(
        '========================================',
        (' JBIS PCキッティング ログ — {0}' -f $Title),
        (' 種別: {0}' -f $LogPrefix),
        (' 開始: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')),
        (' PC名: {0}' -f $env:COMPUTERNAME),
        (' アカウント: {0}\{1}' -f $env:USERDOMAIN, $env:USERNAME),
        (' OS: {0}' -f $osCaption),
        (' システムログ: {0}' -f $systemLog),
        (' 共有用ログ: {0}' -f $localLog),
        '========================================'
    )
    foreach ($line in $header) {
        Write-KittingLogLine674 -Line $line
    }

    $readme = @(
        '# キッティング ログフォルダ',
        '',
        'エラー時はこの `logs` フォルダごと AI（Cursor）に見せてください。',
        '',
        '| ファイル | 説明 |',
        '|----------|------|',
        '| `最新.log` | 直近の実行ログ（コピー） |',
        '| `kitting_*.log` / `post_install_*.log` | 日時付きの実行ログ |',
        '',
        'システム側の控え: `C:\ProgramData\JBIS-PC-Kitting\logs\`',
        ''
    ) -join [Environment]::NewLine
    Write-KittingTextFile674 -Path (Join-Path $localLogDir 'README.txt') -Content $readme

    $info = @{
        Primary    = $systemLog
        Local      = $localLog
        Latest     = $latestLog
        LocalDir   = $localLogDir
        SystemDir  = $systemLogDir
        KitRoot    = $kitRoot
        FileName   = $fileName
    }
    $script:KittingLogInfo674 = $info
    return $info
}

function Complete-KittingLogs674 {
    param(
        [int]$ExitCode = 0,
        [string]$Summary = ''
    )

    if (-not $script:KittingLogInfo674) { return }

    $footer = @(
        '----------------------------------------',
        (' 終了: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')),
        (' 終了コード: {0}' -f $ExitCode)
    )
    if ($Summary) {
        $footer += (' 結果: {0}' -f $Summary)
    }
    $footer += @(
        (' 共有用: {0}' -f $script:KittingLogInfo674.LocalDir),
        (' 最新.log: {0}' -f $script:KittingLogInfo674.Latest),
        '========================================'
    )
    foreach ($line in $footer) {
        Write-KittingLogLine674 -Line $line
    }

    try {
        Copy-Item -LiteralPath $script:KittingLogInfo674.Local -Destination $script:KittingLogInfo674.Latest -Force
    }
    catch {
        Write-KittingLogLine674 -Line ('[警告] 最新.log へのコピー失敗: {0}' -f $_.Exception.Message)
    }
}
