#requires -RunAsAdministrator
<#
.SYNOPSIS
  ドメイン参加後 — プログラムインストール・アイコン配置（Windows 11 Pro）
.NOTES
  デスクトップの「PCキッティングインストール用\（新）キッティングセット」内 1～10 フォルダを順に処理。
  UTF-8 (BOM) で保存。PCキッティング_インストール_START.bat から起動。
#>
param(
    [switch]$SkipConfirm
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'kitting-encoding.ps1')
Initialize-KittingEncoding674

$StateRoot = Join-Path $env:ProgramData 'JBIS-PC-Kitting'
$StateFile = Join-Path $StateRoot 'post-install-state.json'
$RunOnceName = 'JBIS-PostDomainInstall'

$script:KittingLogInfo674 = Initialize-KittingLogs674 -ScriptDir $ScriptDir -LogPrefix 'post_install' -Title '② ドメイン参加後インストール'
$LogFile = $script:KittingLogInfo674.Primary
$script:KittingExitCode674 = 0

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$script:LogLines = [System.Collections.Generic.List[string]]::new()
$script:UiForm = $null
$script:UiStatus = $null
$script:UiLog = $null
$script:UiProgress = $null
$script:PlacedDesktopIcons = [System.Collections.Generic.List[string]]::new()
$script:KitSetRoot = $null

function Write-InstallLog {
    param([string]$Message)
    $line = '[{0:HH:mm:ss}] {1}' -f (Get-Date), $Message
    $script:LogLines.Add($line)
    Write-KittingLogLine674 -Line $line
    if ($script:UiLog) {
        $script:UiLog.AppendText($line + [Environment]::NewLine)
        $script:UiLog.SelectionStart = $script:UiLog.Text.Length
        $script:UiLog.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }
}

function Set-InstallStatus {
    param(
        [string]$Message,
        [int]$Step = 0,
        [int]$TotalSteps = 10
    )
    if ($script:UiStatus) {
        if ($Step -gt 0) {
            $script:UiStatus.Text = ('[{0}/{1}] {2}' -f $Step, $TotalSteps, $Message)
            if ($script:UiProgress) {
                $script:UiProgress.Style = 'Continuous'
                $script:UiProgress.Maximum = $TotalSteps
                $script:UiProgress.Value = [Math]::Min($Step, $TotalSteps)
            }
        }
        else {
            $script:UiStatus.Text = $Message
        }
        [System.Windows.Forms.Application]::DoEvents()
    }
    Write-InstallLog $Message
}

function Show-InstallProgressForm {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'PCキッティング — ドメイン参加後インストール'
    $form.Size = New-Object System.Drawing.Size(820, 520)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.TopMost = $true

    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Location = New-Object System.Drawing.Point(12, 12)
    $lbl.Size = New-Object System.Drawing.Size(780, 40)
    $lbl.Font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
    $lbl.Text = '準備中...'

    $pb = New-Object System.Windows.Forms.ProgressBar
    $pb.Location = New-Object System.Drawing.Point(12, 58)
    $pb.Size = New-Object System.Drawing.Size(780, 24)
    $pb.Style = 'Continuous'
    $pb.Minimum = 0
    $pb.Maximum = 10
    $pb.Value = 0

    $tb = New-Object System.Windows.Forms.TextBox
    $tb.Location = New-Object System.Drawing.Point(12, 92)
    $tb.Size = New-Object System.Drawing.Size(780, 370)
    $tb.Multiline = $true
    $tb.ReadOnly = $true
    $tb.ScrollBars = 'Vertical'
    $tb.Font = Get-KittingUiLogFont674
    $tb.WordWrap = $false

    $form.Controls.AddRange(@($lbl, $pb, $tb))
    $form.Add_Shown({ $form.Activate() })

    $script:UiForm = $form
    $script:UiStatus = $lbl
    $script:UiProgress = $pb
    $script:UiLog = $tb
    return $form
}

function Get-KitSetFolderNames674 {
    @(
        '（新）キッティングセット',
        '(新)キッティングセット',
        '（新)キッティングセット',
        '(新）キッティングセット'
    )
}

function Get-KitSetRoot674 {
    $names = Get-KitSetFolderNames674
    $installRoot = Split-Path $ScriptDir -Parent
    $desktop = [Environment]::GetFolderPath('Desktop')
    $searchRoots = @($installRoot, $desktop) | Select-Object -Unique

    foreach ($root in $searchRoots) {
        if (-not $root) { continue }
        foreach ($name in $names) {
            $path = Join-Path $root $name
            if (Test-Path -LiteralPath $path) {
                return $path
            }
        }
    }
    return $null
}

function Test-KittingNumberedStepFolder674 {
    param([Parameter(Mandatory = $true)][string]$Name)
    if ($Name -match '^\s*(\d+)') {
        $num = [int]$Matches[1]
        return ($num -ge 1 -and $num -le 10)
    }
    return $false
}

function Get-StepFolders674 {
    param([string]$Root)
    Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-KittingNumberedStepFolder674 -Name $_.Name } |
        ForEach-Object {
            if ($_.Name -match '^\s*(\d+)') {
                [PSCustomObject]@{
                    Number = [int]$Matches[1]
                    Path   = $_.FullName
                    Name   = $_.Name
                }
            }
        } | Sort-Object Number
}

function Write-KittingExcludedFoldersLog674 {
    param([string]$KitRoot)
    $excluded = @(Get-ChildItem -LiteralPath $KitRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { -not (Test-KittingNumberedStepFolder674 -Name $_.Name) })
    Write-InstallLog '=== 処理対象: 1～10 の番号付きフォルダのみ ==='
    if ($excluded.Count -eq 0) {
        Write-InstallLog '処理対象外フォルダ: なし'
        return
    }
    Write-InstallLog '=== 処理対象外フォルダ（触りません） ==='
    foreach ($dir in ($excluded | Sort-Object Name)) {
        Write-InstallLog ('  除外: {0}' -f $dir.Name)
    }
}

function Unblock-KittingItem674 {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    try {
        Unblock-File -LiteralPath $Path -ErrorAction SilentlyContinue
    }
    catch { }
    $zone = '{0}:Zone.Identifier' -f $Path
    if (Test-Path -LiteralPath $zone) {
        Remove-Item -LiteralPath $zone -Force -ErrorAction SilentlyContinue
    }
    Write-InstallLog ('ブロック解除: {0}' -f (Split-Path -Leaf $Path))
}

function Get-PublicDesktop674 {
    Join-Path $env:PUBLIC 'Desktop'
}

function New-DesktopShortcut674 {
    param(
        [string]$TargetPath,
        [string]$ShortcutName,
        [string]$WorkingDirectory = $null
    )
    if (-not (Test-Path -LiteralPath $TargetPath)) {
        Write-InstallLog ('ショートカット作成スキップ（対象なし）: {0}' -f $ShortcutName)
        return $null
    }
    $desktop = Get-PublicDesktop674
    $lnkPath = Join-Path $desktop ("{0}.lnk" -f $ShortcutName)
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($lnkPath)
    $sc.TargetPath = $TargetPath
    if ($WorkingDirectory) { $sc.WorkingDirectory = $WorkingDirectory }
    $sc.Save()
    Unblock-KittingItem674 -Path $lnkPath
    if (-not $script:PlacedDesktopIcons.Contains($ShortcutName)) {
        [void]$script:PlacedDesktopIcons.Add($ShortcutName)
    }
    Write-InstallLog ('デスクトップに配置: {0}.lnk' -f $ShortcutName)
    return $lnkPath
}

function Copy-DesktopItem674 {
    param(
        [string]$SourcePath,
        [string]$DisplayName = $null
    )
    $desktop = Get-PublicDesktop674
    $leaf = Split-Path -Leaf $SourcePath
    $dest = Join-Path $desktop $leaf
    Copy-Item -LiteralPath $SourcePath -Destination $dest -Force
    Unblock-KittingItem674 -Path $dest
    $baseName = if ($DisplayName) { $DisplayName } else { [System.IO.Path]::GetFileNameWithoutExtension($leaf) }
    if (-not $script:PlacedDesktopIcons.Contains($baseName)) {
        [void]$script:PlacedDesktopIcons.Add($baseName)
    }
    Write-InstallLog ('デスクトップにコピー: {0}' -f $leaf)
    return $dest
}

function Invoke-InstallerWithLog674 {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList
    )
    $name = Split-Path -Leaf $FilePath
    $argsText = ($ArgumentList -join ' ')
    Write-InstallLog ('実行開始: {0} {1}' -f $name, $argsText)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.Arguments = $argsText
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    while (-not $proc.HasExited) {
        Write-InstallLog ('  プロセス実行中: {0} (PID {1})' -f $name, $proc.Id)
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Seconds 5
    }
    Write-InstallLog ('実行終了: {0} — 終了コード {1}' -f $name, $proc.ExitCode)
    return $proc.ExitCode
}

function Invoke-MsiInstaller674 {
    param([string]$MsiPath, [string]$ExtraArgs = '')
    $args = @('/i', ('"{0}"' -f $MsiPath), '/qn', '/norestart') + ($ExtraArgs -split '\s+' | Where-Object { $_ })
    $cmd = 'msiexec.exe ' + ($args -join ' ')
    Write-InstallLog ('実行開始: {0}' -f $cmd)
    $proc = Start-Process -FilePath 'msiexec.exe' -ArgumentList ($args -join ' ') -PassThru -Wait -NoNewWindow
    Write-InstallLog ('実行終了: msiexec — 終了コード {0}' -f $proc.ExitCode)
    return $proc.ExitCode
}

function Install-GenericFolder674 {
    param([string]$FolderPath)
    $executed = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

    $officeSetup = Get-ChildItem -LiteralPath $FolderPath -Filter 'OfficeSetup.exe' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($officeSetup) {
        Install-Office674 -OfficeSetupPath $officeSetup.FullName
        [void]$executed.Add($officeSetup.FullName)
    }

    $trellix = Get-ChildItem -LiteralPath $FolderPath -Filter '*Trellix*.exe' -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'SmartInstall|Install' } | Select-Object -First 1
    if (-not $trellix) {
        $trellix = Get-ChildItem -LiteralPath $FolderPath -Filter '*.exe' -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match 'Trellix|ウイルス|SmartInstall' } | Select-Object -First 1
    }
    if ($trellix -and -not $executed.Contains($trellix.FullName)) {
        Invoke-InstallerWithLog674 -FilePath $trellix.FullName -ArgumentList @('/s')
        [void]$executed.Add($trellix.FullName)
    }

    $zoomMsi = Get-ChildItem -LiteralPath $FolderPath -Filter 'ZoomInstallerFull.msi' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($zoomMsi) {
        Invoke-MsiInstaller674 -MsiPath $zoomMsi.FullName -ExtraArgs 'zNoDesktopShortCut=True'
        Install-ZoomShortcut674
        [void]$executed.Add($zoomMsi.FullName)
    }
    else {
        $zoomExe = Get-ChildItem -LiteralPath $FolderPath -Filter 'ZoomInstaller*.exe' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($zoomExe -and -not $executed.Contains($zoomExe.FullName)) {
            Invoke-InstallerWithLog674 -FilePath $zoomExe.FullName -ArgumentList @('/silent')
            Install-ZoomShortcut674
            [void]$executed.Add($zoomExe.FullName)
        }
    }

    Get-ChildItem -LiteralPath $FolderPath -Include '*.msi' -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { -not $executed.Contains($_.FullName) } |
        ForEach-Object {
            Invoke-MsiInstaller674 -MsiPath $_.FullName
            [void]$executed.Add($_.FullName)
        }

    Get-ChildItem -LiteralPath $FolderPath -Include '*.exe' -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { -not $executed.Contains($_.FullName) } |
        ForEach-Object {
            $silentArgs = @('/S', '/s', '/silent', '/verysilent', '/qn', '/norestart')
            $used = $false
            foreach ($arg in $silentArgs) {
                $code = Invoke-InstallerWithLog674 -FilePath $_.FullName -ArgumentList @($arg)
                if ($code -eq 0 -or $code -eq 3010) { $used = $true; break }
            }
            if (-not $used) {
                Write-InstallLog ('警告: サイレント引数で失敗 — {0}' -f $_.Name)
            }
            [void]$executed.Add($_.FullName)
        }
    Install-VpnShortcutIfNeeded674 -FolderPath $FolderPath
}

function Install-Office674 {
    param([string]$OfficeSetupPath)
    Write-InstallLog 'Office 365 セットアップを開始します（数十分かかる場合があります）'
    Invoke-InstallerWithLog674 -FilePath $OfficeSetupPath -ArgumentList @('/configure', '/silent')
    Start-Sleep -Seconds 10
    $officeDir = $null
    foreach ($p in @(
            'C:\Program Files\Microsoft Office\root\Office16',
            'C:\Program Files (x86)\Microsoft Office\root\Office16'
        )) {
        if (Test-Path -LiteralPath $p) { $officeDir = $p; break }
    }
    if (-not $officeDir) {
        Write-InstallLog 'Office インストール先がまだ見つかりません（後でショートカットのみ再試行）'
        return
    }
    $map = @{
        'Excel'       = 'EXCEL.EXE'
        'Word'        = 'WINWORD.EXE'
        'PowerPoint'  = 'POWERPNT.EXE'
        'Outlook'     = 'OUTLOOK.EXE'
    }
    foreach ($pair in $map.GetEnumerator()) {
        $exe = Join-Path $officeDir $pair.Value
        New-DesktopShortcut674 -TargetPath $exe -ShortcutName $pair.Key
    }
}

function Install-ZoomShortcut674 {
    $zoomExe = $null
    foreach ($p in @(
            'C:\Program Files\Zoom\bin\Zoom.exe',
            'C:\Program Files (x86)\Zoom\bin\Zoom.exe'
        )) {
        if (Test-Path -LiteralPath $p) { $zoomExe = $p; break }
    }
    if ($zoomExe) {
        New-DesktopShortcut674 -TargetPath $zoomExe -ShortcutName 'Zoom'
    }
}

function Install-VpnShortcutIfNeeded674 {
    param([string]$FolderPath)
    $vpnNames = @(
        @{ Name = 'Cisco AnyConnect Secure Mobility Client'; Exe = 'C:\Program Files (x86)\Cisco\Cisco AnyConnect Secure Mobility Client\vpnui.exe' },
        @{ Name = 'Cisco AnyConnect Secure Mobility Client'; Exe = 'C:\Program Files\Cisco\Cisco AnyConnect Secure Mobility Client\vpnui.exe' }
    )
    foreach ($vpn in $vpnNames) {
        if (Test-Path -LiteralPath $vpn.Exe) {
            New-DesktopShortcut674 -TargetPath $vpn.Exe -ShortcutName 'Cisco AnyConnect'
            return
        }
    }
    $found = Get-ChildItem -LiteralPath @('C:\Program Files', 'C:\Program Files (x86)') -Filter 'vpnui.exe' -Recurse -File -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($found) {
        New-DesktopShortcut674 -TargetPath $found.FullName -ShortcutName 'VPN'
    }
}

function Set-TrustedSiteZone674 {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][ValidateSet('HKLM', 'HKCU')][string]$Hive
    )
    $regPath = '{0}:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains' -f $Hive
    $parts = $HostName.Split('.')
    if ($parts.Length -ge 2) {
        $domainKey = ($parts[-2..-1] -join '.')
        if ($parts.Length -gt 2) {
            $sub = ($parts[0..($parts.Length - 3)] -join '.')
            $targetPath = Join-Path (Join-Path $regPath $domainKey) $sub
        }
        else {
            $targetPath = Join-Path $regPath $domainKey
        }
    }
    else {
        $targetPath = Join-Path $regPath $HostName
    }
    if (-not (Test-Path -LiteralPath $targetPath)) {
        New-Item -Path $targetPath -Force | Out-Null
    }
    foreach ($proto in @('http', 'https')) {
        New-ItemProperty -Path $targetPath -Name $proto -Value 2 -PropertyType DWord -Force | Out-Null
    }
}

function Get-UrlFromShortcutFile674 {
    param([string]$UrlFilePath)
    $urlLine = Select-String -LiteralPath $UrlFilePath -Pattern '^\s*URL=' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $urlLine) { return $null }
    $raw = ($urlLine.Line -replace '^\s*URL=\s*', '').Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    return $raw
}

function Add-TrustedSiteFromUrl674 {
    param([string]$UrlFilePath)
    $raw = Get-UrlFromShortcutFile674 -UrlFilePath $UrlFilePath
    if (-not $raw) {
        Write-InstallLog ('信頼済みサイト登録スキップ（URL なし）: {0}' -f (Split-Path -Leaf $UrlFilePath))
        return $false
    }
    try {
        $uri = [Uri]$raw
        if ($uri.Scheme -notin @('http', 'https')) {
            Write-InstallLog ('信頼済みサイト登録スキップ（http/https 以外）: {0}' -f $raw)
            return $false
        }
        $hostName = $uri.Host
        Set-TrustedSiteZone674 -HostName $hostName -Hive 'HKLM'
        Set-TrustedSiteZone674 -HostName $hostName -Hive 'HKCU'
        Write-InstallLog ('信頼済みサイト登録: {0} （http/https → 全ユーザー＋現在ユーザー）' -f $hostName)
        return $true
    }
    catch {
        Write-InstallLog ('信頼済みサイト登録失敗: {0} — {1}' -f (Split-Path -Leaf $UrlFilePath), $_.Exception.Message)
        return $false
    }
}

function Register-AllKitSetTrustedSites674 {
    param(
        [string]$KitRoot,
        [array]$Steps
    )
    if (-not (Test-Path -LiteralPath $KitRoot)) { return }

    Write-InstallLog '=== 信頼済みサイト登録（8番ショートカット + 配置済み .url のみ） ==='
    $registered = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $count = 0

    $urlSteps = @($Steps | Where-Object { $_.Name -match 'デスクトップ' -and $_.Name -match 'ショートカット' })
    if ($urlSteps.Count -eq 0) {
        $urlSteps = @($Steps | Where-Object { $_.Number -eq 8 })
    }

    foreach ($step in $urlSteps) {
        Write-InstallLog ('信頼済みサイト対象フォルダ: {0}' -f $step.Name)
        Get-ChildItem -LiteralPath $step.Path -Filter '*.url' -File -ErrorAction SilentlyContinue |
            Sort-Object Name |
            ForEach-Object {
                $url = Get-UrlFromShortcutFile674 -UrlFilePath $_.FullName
                if (-not $url) { return }
                if (-not $registered.Add($url)) {
                    Write-InstallLog ('信頼済みサイト登録スキップ（重複）: {0}' -f $url)
                    return
                }
                if (Add-TrustedSiteFromUrl674 -UrlFilePath $_.FullName) {
                    $count++
                }
            }
    }

    if ($urlSteps.Count -eq 0) {
        Write-InstallLog '8番（デスクトップショートカット）フォルダが無いため、キッティングセット内の .url はスキップします'
    }

    $desktop = Get-PublicDesktop674
    Get-ChildItem -LiteralPath $desktop -Filter '*.url' -File -ErrorAction SilentlyContinue |
        ForEach-Object {
            $url = Get-UrlFromShortcutFile674 -UrlFilePath $_.FullName
            if (-not $url) { return }
            if (-not $registered.Add($url)) { return }
            if (Add-TrustedSiteFromUrl674 -UrlFilePath $_.FullName) {
                $count++
            }
        }

    Write-InstallLog ('信頼済みサイト登録完了: {0} 件' -f $count)
}

function Install-DesktopShortcutsStep674 {
    param([string]$FolderPath)
    $items = Get-ChildItem -LiteralPath $FolderPath -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in @('.lnk', '.url') }
    foreach ($item in ($items | Sort-Object Name)) {
        Unblock-KittingItem674 -Path $item.FullName
        Copy-DesktopItem674 -SourcePath $item.FullName
        if ($item.Extension -eq '.url') {
            Add-TrustedSiteFromUrl674 -UrlFilePath $item.FullName
        }
    }
}

function Enable-ClassicContextMenu674 {
    Write-InstallLog 'Windows 11 右クリックメニューを旧仕様（クラシック）に変更します'
    $key = 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32'
    if (-not (Test-Path -LiteralPath $key)) {
        New-Item -Path $key -Force | Out-Null
    }
    Set-ItemProperty -LiteralPath $key -Name '(default)' -Value '' -Force
    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Process explorer.exe
    Write-InstallLog 'エクスプローラーを再起動しました（クラシック右クリック適用）'
}

function Initialize-DesktopIconLayout674 {
    if (-not ('DesktopIconLayout674' -as [type])) {
        Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class DesktopIconLayout674 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr hWnd, IntPtr hWndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, int wParam, StringBuilder lParam);

    [DllImport("user32.dll")]
    public static extern bool SendMessage(IntPtr hWnd, uint Msg, int wParam, ref POINT lParam);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int x; public int y; }

    public const int LVM_GETITEMCOUNT = 0x1004;
    public const int LVM_GETITEMTEXTW = 0x1073;
    public const int LVM_SETITEMPOSITION32 = 0x1031;

    public static IntPtr GetDesktopListView() {
        IntPtr result = IntPtr.Zero;
        EnumWindows((hWnd, lParam) => {
            IntPtr defView = FindWindowEx(hWnd, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (defView != IntPtr.Zero) {
                IntPtr lv = FindWindowEx(defView, IntPtr.Zero, "SysListView32", null);
                if (lv != IntPtr.Zero) {
                    result = lv;
                    return false;
                }
            }
            return true;
        }, IntPtr.Zero);
        return result;
    }

    public static bool SetItemPosition(IntPtr listView, int index, int x, int y) {
        POINT pt = new POINT { x = x, y = y };
        return SendMessage(listView, LVM_SETITEMPOSITION32, index, ref pt);
    }

    public static string GetItemText(IntPtr listView, int index) {
        StringBuilder sb = new StringBuilder(260);
        LVITEM lv = new LVITEM();
        lv.mask = 0x0001;
        lv.iItem = index;
        lv.iSubItem = 0;
        lv.pszText = sb;
        lv.cchTextMax = sb.Capacity;
        SendMessageLVItem(listView, LVM_GETITEMTEXTW, 0, ref lv);
        return sb.ToString();
    }

    [DllImport("user32.dll", EntryPoint = "SendMessageW", CharSet = CharSet.Unicode)]
    static extern IntPtr SendMessageLVItem(IntPtr hWnd, uint Msg, int wParam, ref LVITEM lParam);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct LVITEM {
        public int mask;
        public int iItem;
        public int iSubItem;
        public int state;
        public int stateMask;
        public StringBuilder pszText;
        public int cchTextMax;
        public int iImage;
        public IntPtr lParam;
    }

    public static int GetItemCount(IntPtr listView) {
        return (int)SendMessage(listView, LVM_GETITEMCOUNT, 0, IntPtr.Zero);
    }
}
'@
    }
}

function Arrange-DesktopIconsGrid674 {
    param(
        [int]$StartX = 20,
        [int]$StartY = 20,
        [int]$ColWidth = 96,
        [int]$RowHeight = 104,
        [int]$Columns = 4
    )
    if ($script:PlacedDesktopIcons.Count -eq 0) {
        Write-InstallLog '配置対象アイコンがないため整列をスキップします'
        return
    }
    Initialize-DesktopIconLayout674
    Start-Sleep -Seconds 3
    $lv = [DesktopIconLayout674]::GetDesktopListView()
    if ($lv -eq [IntPtr]::Zero) {
        Write-InstallLog 'デスクトップ ListView が取得できませんでした（整列スキップ）'
        return
    }
    $count = [DesktopIconLayout674]::GetItemCount($lv)
    Write-InstallLog ('デスクトップアイコン数: {0} — 整列開始' -f $count)

    $targets = @($script:PlacedDesktopIcons | Sort-Object)
    $index = 0
    foreach ($iconName in $targets) {
        for ($i = 0; $i -lt $count; $i++) {
            $text = [DesktopIconLayout674]::GetItemText($lv, $i)
            if ($text -eq $iconName -or $text.StartsWith($iconName)) {
                $col = $index % $Columns
                $row = [Math]::Floor($index / $Columns)
                $x = $StartX + ($col * $ColWidth)
                $y = $StartY + ($row * $RowHeight)
                [void][DesktopIconLayout674]::SetItemPosition($lv, $i, $x, $y)
                Write-InstallLog ('整列: {0} → ({1}, {2})' -f $text, $x, $y)
                $index++
                break
            }
        }
    }
    Write-InstallLog 'デスクトップアイコンの初期整列が完了しました（必要に応じて手動で並べ直してください）'
}

function Invoke-InstallStep674 {
    param(
        [int]$StepNumber,
        [string]$FolderPath,
        [string]$FolderName
    )
    $lower = $FolderName.ToLowerInvariant()

    if ($FolderName -match 'デスクトップ' -and $FolderName -match 'ショートカット') {
        Set-InstallStatus -Message ('ステップ {0}: ショートカット配置・ブロック解除・信頼済みサイト登録' -f $StepNumber) -Step $StepNumber
        Install-DesktopShortcutsStep674 -FolderPath $FolderPath
        return
    }

    if ($lower -match '右クリック|クラシック|context') {
        Set-InstallStatus -Message ('ステップ {0}: 右クリックメニュー旧仕様化' -f $StepNumber) -Step $StepNumber
        Enable-ClassicContextMenu674
        return
    }

    if ($lower -match 'office|オフィス') {
        Set-InstallStatus -Message ('ステップ {0}: Office 365 インストール' -f $StepNumber) -Step $StepNumber
        Install-GenericFolder674 -FolderPath $FolderPath
        return
    }

    if ($lower -match 'zoom') {
        Set-InstallStatus -Message ('ステップ {0}: Zoom インストール' -f $StepNumber) -Step $StepNumber
        Install-GenericFolder674 -FolderPath $FolderPath
        return
    }

    if ($lower -match 'vpn|cisco|anyconnect|トンネル') {
        Set-InstallStatus -Message ('ステップ {0}: VPN ツール インストール' -f $StepNumber) -Step $StepNumber
        Install-GenericFolder674 -FolderPath $FolderPath
        Install-VpnShortcutIfNeeded674 -FolderPath $FolderPath
        return
    }

    if ($lower -match 'trellix|ウイルス|ウイルスソフト|defender') {
        Set-InstallStatus -Message ('ステップ {0}: ウイルス対策ソフト インストール' -f $StepNumber) -Step $StepNumber
        Install-GenericFolder674 -FolderPath $FolderPath
        return
    }

    Set-InstallStatus -Message ('ステップ {0}: {1} — インストール実行' -f $StepNumber, $FolderName) -Step $StepNumber
    Install-GenericFolder674 -FolderPath $FolderPath
}

function Save-InstallState674 {
    param([hashtable]$Data)
    Write-KittingTextFile674 -Path $StateFile -Content ($Data | ConvertTo-Json -Depth 5)
}

function Register-PostInstallRunOnce674 {
    $psPath = Join-Path $ScriptDir 'post-domain-install.ps1'
    $cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Sta -WindowStyle Normal -File `"$psPath`" -SkipConfirm"
    Set-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce' -Name $RunOnceName -Value $cmd -Force
    Write-InstallLog '再起動後の自動再開を RunOnce に登録しました'
}

function Clear-PostInstallRunOnce674 {
    Remove-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce' -Name $RunOnceName -ErrorAction SilentlyContinue
}

function Start-FinalReboot674 {
    Write-InstallLog 'すべての処理が完了しました — 60 秒後に PC を再起動します'
    [System.Windows.Forms.MessageBox]::Show(
        "すべてのインストール処理が完了しました。`n`n60 秒後に PC を再起動します。`n作業中のファイルは保存してください。",
        'PCキッティング — 完了',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    shutdown.exe /r /t 60 /c 'PCキッティング（ドメイン参加後）完了に伴う再起動'
}

function Start-PostDomainInstall674 {
    $script:KitSetRoot = Get-KitSetRoot674
    if (-not $script:KitSetRoot) {
        [System.Windows.Forms.MessageBox]::Show(
            "「（新）キッティングセット」フォルダが見つかりません。`n`n「PCキッティングインストール用」フォルダ内に配置されているか確認してください。`n（USB からコピーした場合は、このフォルダごとデスクトップへ置いてください）",
            'PCキッティング — エラー',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
        return 2
    }

    $steps = @(Get-StepFolders674 -Root $script:KitSetRoot)
    if ($steps.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show(
            "「（新）キッティングセット」内に 1～10 の番号付きフォルダが見つかりません。",
            'PCキッティング — エラー',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
        return 3
    }

    Write-InstallLog ('キッティングセット: {0}' -f $script:KitSetRoot)
    Write-InstallLog ('ログ（共有用）: {0}' -f $script:KittingLogInfo674.LocalDir)
    Write-InstallLog ('ログ（最新）: {0}' -f $script:KittingLogInfo674.Latest)
    Write-KittingExcludedFoldersLog674 -KitRoot $script:KitSetRoot
    Write-InstallLog ('検出ステップ: {0}' -f (($steps | ForEach-Object { $_.Number }) -join ', '))

    $startFrom = 1
    if (Test-Path -LiteralPath $StateFile) {
        try {
            $saved = Get-Content -LiteralPath $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($saved.NextStep) { $startFrom = [int]$saved.NextStep }
            Write-InstallLog ('前回の続きから再開: ステップ {0}' -f $startFrom)
        }
        catch { }
    }

    $classicDone = $false
    foreach ($step in $steps) {
        if ($step.Number -lt $startFrom) { continue }

        try {
            Invoke-InstallStep674 -StepNumber $step.Number -FolderPath $step.Path -FolderName $step.Name
            if ($step.Name -match '右クリック|クラシック') { $classicDone = $true }
        }
        catch {
            Write-InstallLog ('エラー（ステップ {0}）: {1}' -f $step.Number, $_.Exception.Message)
        }

        Save-InstallState674 -Data @{ NextStep = ($step.Number + 1); KitSetRoot = $script:KitSetRoot }
    }

    Set-InstallStatus -Message '信頼済みサイト一括登録' -Step 10
    Register-AllKitSetTrustedSites674 -KitRoot $script:KitSetRoot -Steps $steps

    Set-InstallStatus -Message 'デスクトップアイコンの整列' -Step 10
    Arrange-DesktopIconsGrid674

    if (-not $classicDone) {
        Set-InstallStatus -Message '右クリックメニューを旧仕様に変更' -Step 10
        Enable-ClassicContextMenu674
    }

    Clear-PostInstallRunOnce674
    if (Test-Path -LiteralPath $StateFile) {
        Remove-Item -LiteralPath $StateFile -Force -ErrorAction SilentlyContinue
    }

    Set-InstallStatus -Message '完了 — 再起動準備' -Step 10
    Start-FinalReboot674
    return 0
}

# --- メイン ---
if (-not $SkipConfirm) {
    $confirm = [System.Windows.Forms.MessageBox]::Show(
        @"
ドメイン参加後のプログラムインストールを開始しますか？

・「PCキッティングインストール用」内の「（新）キッティングセット」1～10 を順に実行
・Office / Zoom / VPN 等はデスクトップにアイコン配置
・ショートカットはブロック解除して配置・整列
・.url のドメインを信頼済みサイトに自動登録
・Windows 11 右クリックを旧仕様に変更
・完了後、自動で PC 再起動

管理者権限で実行してください。
"@,
        'PCキッティング — ドメイン参加後インストール',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question)
    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
        exit 0
    }
}

$form = Show-InstallProgressForm
$scriptBlock = {
    try {
        $ec = Start-PostDomainInstall674
        if ($ec -ne 0) {
            $script:KittingExitCode674 = $ec
            [System.Windows.Forms.MessageBox]::Show(
                ("処理を開始できませんでした。`n`nログ: {0}`n（最新.log を AI に見せてください）" -f $script:KittingLogInfo674.LocalDir),
                'PCキッティング — エラー',
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
        }
    }
    catch {
        $script:KittingExitCode674 = 1
        Write-InstallLog ('致命的エラー: {0}' -f $_.Exception.Message)
        [System.Windows.Forms.MessageBox]::Show(
            ("エラーが発生しました。`n`n{0}`n`nログ: {1}`n（最新.log を AI に見せてください）" -f $_.Exception.Message, $script:KittingLogInfo674.LocalDir),
            'PCキッティング — エラー',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
    finally {
        Complete-KittingLogs674 -ExitCode $script:KittingExitCode674 -Summary 'post-domain-install'
        if ($script:UiForm) { $script:UiForm.Close() }
    }
}

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 300
$timer.Add_Tick({
    $timer.Stop()
    & $scriptBlock
})
$form.Add_Shown({ $timer.Start() })
[void][System.Windows.Forms.Application]::Run($form)
