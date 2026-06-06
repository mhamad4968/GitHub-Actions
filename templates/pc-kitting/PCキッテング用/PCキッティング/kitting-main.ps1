#requires -RunAsAdministrator
<#
.SYNOPSIS
  JBIS PCキッティング — Windows 11 Pro 向け
  Windows Update / 機能有効化 / 再起動後 PC名・ドメイン参加
.NOTES
  対象 OS: Windows 11 Pro（Enterprise / Education もドメイン参加可）
  UTF-8 (BOM) で保存。デスクトップ PCキッティング_START.bat から起動。
#>
param(
    [ValidateSet('Full', 'PostReboot')]
    [string]$Mode = 'Full'
)

# --- 文字コード ---
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# --- パス ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateRoot = Join-Path $env:ProgramData 'JBIS-PC-Kitting'
$LogDir = Join-Path $StateRoot 'logs'
$StateFile = Join-Path $StateRoot 'state.json'
$RunOnceName = 'JBIS-PC-Kitting-PostReboot'
$script:KittingSkipDomainJoin674 = $false
# 社内 Active Directory ドメイン（FQDN）
$script:KittingDefaultDomain674 = 'kent.local'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("kitting_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))

# --- UI ---
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$script:LogLines = [System.Collections.Generic.List[string]]::new()
$script:UiForm = $null
$script:UiStatus = $null
$script:UiLog = $null
$script:UiProgress = $null

function Write-KittingLog {
    param([string]$Message)
    $line = '[{0:HH:mm:ss}] {1}' -f (Get-Date), $Message
    $script:LogLines.Add($line)
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    if ($script:UiLog) {
        $script:UiLog.AppendText($line + [Environment]::NewLine)
        $script:UiLog.SelectionStart = $script:UiLog.Text.Length
        $script:UiLog.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }
}

function Set-KittingStatus {
    param([string]$Message)
    if ($script:UiStatus) {
        $script:UiStatus.Text = $Message
        [System.Windows.Forms.Application]::DoEvents()
    }
    Write-KittingLog $Message
}

function Show-KittingProgressForm {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'PCキッティング — 処理中（Windows 11 Pro）'
    $form.Size = New-Object System.Drawing.Size(720, 480)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.TopMost = $true

    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Location = New-Object System.Drawing.Point(12, 12)
    $lbl.Size = New-Object System.Drawing.Size(680, 40)
    $lbl.Font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
    $lbl.Text = '準備中...'

    $pb = New-Object System.Windows.Forms.ProgressBar
    $pb.Location = New-Object System.Drawing.Point(12, 58)
    $pb.Size = New-Object System.Drawing.Size(680, 24)
    $pb.Style = 'Marquee'
    $pb.MarqueeAnimationSpeed = 30

    $tb = New-Object System.Windows.Forms.TextBox
    $tb.Location = New-Object System.Drawing.Point(12, 92)
    $tb.Size = New-Object System.Drawing.Size(680, 330)
    $tb.Multiline = $true
    $tb.ReadOnly = $true
    $tb.ScrollBars = 'Vertical'
    $tb.Font = New-Object System.Drawing.Font('Consolas', 9)
    $tb.WordWrap = $false

    $form.Controls.AddRange(@($lbl, $pb, $tb))
    $form.Add_Shown({ $form.Activate() })

    $script:UiForm = $form
    $script:UiStatus = $lbl
    $script:UiProgress = $pb
    $script:UiLog = $tb

    return $form
}

function Get-KittingOsInfo674 {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
    if (-not $os) {
        return @{
            Caption = '不明'
            Build = 0
            IsWin11 = $false
            IsDomainCapable = $false
            Version = ''
        }
    }
    $build = [int]$os.BuildNumber
    $caption = [string]$os.Caption
    $isWin11 = $build -ge 22000
    $isDomainCapable = $caption -match '(Pro|Enterprise|Education|プロ|エンタープライズ)' -and $caption -notmatch 'Home|ホーム'
    return @{
        Caption = $caption
        Build = $build
        IsWin11 = $isWin11
        IsDomainCapable = $isDomainCapable
        Version = [string]$os.Version
    }
}

function Test-KittingOsWin11Pro674 {
    $info = Get-KittingOsInfo674
    Write-KittingLog ("OS: {0} (Build {1})" -f $info.Caption, $info.Build)
    if (-not $info.IsWin11) {
        $r = [System.Windows.Forms.MessageBox]::Show(
            "この PC は Windows 11 ではありません（検出: $($info.Caption)）。`n`n本キッティングは Windows 11 Pro 向けです。`nこのまま続行しますか？",
            'PCキッティング — OS 確認',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Warning)
        if ($r -ne [System.Windows.Forms.DialogResult]::Yes) { return $false }
    }
    if (-not $info.IsDomainCapable) {
        $r = [System.Windows.Forms.MessageBox]::Show(
            "Windows 11 Home 等、ドメイン参加非対応のエディションです（$($info.Caption)）。`n`nWindows Update / 機能の有効化のみ可能で、ドメイン参加はできません。`n続行しますか？",
            'PCキッティング — エディション確認',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Warning)
        if ($r -ne [System.Windows.Forms.DialogResult]::Yes) { return $false }
        $script:KittingSkipDomainJoin674 = $true
    }
    else {
        $script:KittingSkipDomainJoin674 = $false
        Write-KittingLog 'Windows 11 Pro 系 — ドメイン参加に対応'
    }
    return $true
}

function Save-KittingState {
    param([hashtable]$Data)
    $Data | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $StateFile -Encoding UTF8
}

function Register-PostRebootTask {
    $psPath = Join-Path $ScriptDir 'kitting-main.ps1'
    $cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Sta -WindowStyle Normal -File `"$psPath`" -Mode PostReboot"
    Set-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce' -Name $RunOnceName -Value $cmd -Force
    Write-KittingLog '再起動後の自動続行を RunOnce に登録しました。'
}

function Clear-PostRebootTask {
    Remove-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce' -Name $RunOnceName -ErrorAction SilentlyContinue
}

function Install-KittingWindowsUpdates {
    Set-KittingStatus '【1/3】Windows Update — 更新プログラムを検索しています...'
    try {
        $Session = New-Object -ComObject Microsoft.Update.Session
        $Searcher = $Session.CreateUpdateSearcher()
        $Result = $Searcher.Search('IsInstalled=0 and Type=''Software''')
        $Count = $Result.Updates.Count
        Write-KittingLog "検出された更新: $Count 件"
        if ($Count -eq 0) {
            Set-KittingStatus '【1/3】Windows Update — 適用可能な更新はありません。'
            return
        }
        $ToInstall = New-Object -ComObject Microsoft.Update.UpdateColl
        foreach ($U in $Result.Updates) {
            if ($U.EulaAccepted -eq $false) { $U.AcceptEula() }
            $ToInstall.Add($U) | Out-Null
        }
        Set-KittingStatus "【1/3】Windows Update — $Count 件をダウンロード・インストール中（時間がかかります）..."
        $Downloader = $Session.CreateUpdateDownloader()
        $Downloader.Updates = $ToInstall
        $Downloader.Download() | Out-Null
        $Installer = $Session.CreateUpdateInstaller()
        $Installer.Updates = $ToInstall
        $InstallResult = $Installer.Install()
        Write-KittingLog ("インストール結果: 成功={0} 要再起動={1}" -f $InstallResult.ResultCode, ($InstallResult.RebootRequired -eq $true))
        Set-KittingStatus '【1/3】Windows Update — 完了'
    }
    catch {
        Write-KittingLog "Windows Update 警告: $($_.Exception.Message)"
        Set-KittingStatus '【1/3】Windows Update — 警告あり（続行します）'
    }
}

function Enable-KittingWindowsFeatures {
    param([array]$FeatureDefs)
    Set-KittingStatus '【2/3】Windows機能 — 有効化を開始します...'
    $i = 0
    $total = $FeatureDefs.Count
    foreach ($Def in $FeatureDefs) {
        $i++
        $name = $Def.Name
        $label = $Def.Label
        $useAll = [bool]$Def.All
        Set-KittingStatus ("【2/3】Windows機能 ({0}/{1}) — {2}" -f $i, $total, $label)
        $featState = Get-WindowsOptionalFeature -Online -FeatureName $name -ErrorAction SilentlyContinue
        if ($featState -and $featState.State -eq 'Enabled') {
            Write-KittingLog "  スキップ（有効済）: $label ($name)"
            continue
        }
        if (-not $featState) {
            Write-KittingLog "  スキップ（Win11 に該当なし）: $label ($name)"
            continue
        }
        $dismArgs = @('/online', '/enable-feature', "/featurename:$name", '/norestart')
        if ($useAll) { $dismArgs += '/all' }
        $proc = Start-Process -FilePath 'dism.exe' -ArgumentList $dismArgs -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -eq 0 -or $proc.ExitCode -eq 3010) {
            Write-KittingLog "  OK: $label ($name)"
        }
        else {
            Write-KittingLog "  スキップ/警告 (終了コード $($proc.ExitCode)): $label ($name)"
        }
    }
    Set-KittingStatus '【2/3】Windows機能 — 完了'
}

function Invoke-KittingRebootPrompt {
    if ($script:KittingSkipDomainJoin674) {
        Set-KittingStatus '【3/3】完了 — Home 版のためドメイン参加フェーズはスキップします。'
        Clear-PostRebootTask
        [System.Windows.Forms.MessageBox]::Show(
            "Windows Update と Windows機能の処理が完了しました。`n（Home 版のためドメイン参加は行いません）`n必要に応じて再起動してください。",
            'PCキッティング — 完了',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
        return
    }
    Set-KittingStatus '【3/3】再起動 — PC名・ドメイン設定のため再起動が必要です。'
    $r = [System.Windows.Forms.MessageBox]::Show(
        "Windows Update と Windows機能の処理が完了しました。`n`n再起動後、PC名の変更とドメイン参加の入力画面が表示されます。`n`n今すぐ再起動しますか？",
        'PCキッティング — 再起動',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Information)
    if ($r -eq [System.Windows.Forms.DialogResult]::Yes) {
        Write-KittingLog '再起動を実行します...'
        Save-KittingState @{ Phase = 'AwaitingPostReboot'; CompletedAt = (Get-Date).ToString('o') }
        Register-PostRebootTask
        Start-Sleep -Seconds 2
        shutdown.exe /r /t 10 /c 'PCキッティング: 再起動後にPC名・ドメイン設定を続行します'
        [System.Windows.Forms.MessageBox]::Show(
            "10秒後に再起動します。`nキャンセルする場合は Win+R → shutdown /a",
            '再起動',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
    }
    else {
        Write-KittingLog '再起動はユーザーにより延期されました。次回ログオン時に続行を促します。'
        Register-PostRebootTask
        [System.Windows.Forms.MessageBox]::Show(
            "次回のログオン時に PC名・ドメイン設定を続行できます。`n手動で続行する場合は PCキッティング_START.bat を管理者で再実行してください。",
            'PCキッティング',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    }
}

function Show-DomainJoinWizard {
    $confirm = [System.Windows.Forms.MessageBox]::Show(
        "PC名の変更とドメインへの参加を行いますか？`n`n（「いいえ」の場合は後から手動で設定できます）",
        'PCキッティング — PC名・ドメイン',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question)
    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-KittingLog 'PC名・ドメイン設定はユーザーによりスキップされました。'
        Clear-PostRebootTask
        return
    }

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'PCキッティング — PC名・ドメイン参加'
    $form.Size = New-Object System.Drawing.Size(480, 340)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.TopMost = $true

    $lbl1 = New-Object System.Windows.Forms.Label
    $lbl1.Text = '新しい PC 名（例: JBIS0123）'
    $lbl1.Location = New-Object System.Drawing.Point(16, 16)
    $lbl1.Size = New-Object System.Drawing.Size(440, 20)
    $tbPcName = New-Object System.Windows.Forms.TextBox
    $tbPcName.Location = New-Object System.Drawing.Point(16, 38)
    $tbPcName.Size = New-Object System.Drawing.Size(432, 24)
    $tbPcName.Text = $env:COMPUTERNAME

    $lbl2 = New-Object System.Windows.Forms.Label
    $lbl2.Text = 'ドメイン名（既定: kent.local）'
    $lbl2.Location = New-Object System.Drawing.Point(16, 70)
    $lbl2.Size = New-Object System.Drawing.Size(440, 20)
    $tbDomain = New-Object System.Windows.Forms.TextBox
    $tbDomain.Location = New-Object System.Drawing.Point(16, 92)
    $tbDomain.Size = New-Object System.Drawing.Size(432, 24)
    $tbDomain.Text = $script:KittingDefaultDomain674

    $lbl3 = New-Object System.Windows.Forms.Label
    $lbl3.Text = 'ドメイン参加用アカウント（例: KENT\administrator）'
    $lbl3.Location = New-Object System.Drawing.Point(16, 124)
    $lbl3.Size = New-Object System.Drawing.Size(440, 20)
    $tbUser = New-Object System.Windows.Forms.TextBox
    $tbUser.Location = New-Object System.Drawing.Point(16, 146)
    $tbUser.Size = New-Object System.Drawing.Size(432, 24)

    $lbl4 = New-Object System.Windows.Forms.Label
    $lbl4.Text = 'パスワード'
    $lbl4.Location = New-Object System.Drawing.Point(16, 178)
    $lbl4.Size = New-Object System.Drawing.Size(440, 20)
    $tbPass = New-Object System.Windows.Forms.TextBox
    $tbPass.Location = New-Object System.Drawing.Point(16, 200)
    $tbPass.Size = New-Object System.Drawing.Size(432, 24)
    $tbPass.UseSystemPasswordChar = $true

    $btnOk = New-Object System.Windows.Forms.Button
    $btnOk.Text = '実行'
    $btnOk.Location = New-Object System.Drawing.Point(260, 248)
    $btnOk.Size = New-Object System.Drawing.Size(90, 32)
    $btnOk.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $btnCancel = New-Object System.Windows.Forms.Button
    $btnCancel.Text = 'キャンセル'
    $btnCancel.Location = New-Object System.Drawing.Point(358, 248)
    $btnCancel.Size = New-Object System.Drawing.Size(90, 32)
    $btnCancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.AcceptButton = $btnOk
    $form.CancelButton = $btnCancel
    $form.Controls.AddRange(@($lbl1, $tbPcName, $lbl2, $tbDomain, $lbl3, $tbUser, $lbl4, $tbPass, $btnOk, $btnCancel))

    if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-KittingLog 'PC名・ドメイン入力がキャンセルされました。'
        return
    }

    $newName = $tbPcName.Text.Trim()
    $domain = $tbDomain.Text.Trim()
    $user = $tbUser.Text.Trim()
    $passPlain = $tbPass.Text

    if (-not $newName -or -not $domain -or -not $user) {
        [System.Windows.Forms.MessageBox]::Show('PC名・ドメイン・アカウントは必須です。', '入力エラー', 'OK', 'Error') | Out-Null
        return
    }

    $secPass = ConvertTo-SecureString $passPlain -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential($user, $secPass)

    try {
        Set-KittingStatus "ドメイン $domain に参加中（PC名: $newName）..."
        if ($newName -ne $env:COMPUTERNAME) {
            Add-Computer -DomainName $domain -NewName $newName -Credential $cred -Force -ErrorAction Stop
        }
        else {
            Add-Computer -DomainName $domain -Credential $cred -Force -ErrorAction Stop
        }
        Write-KittingLog "ドメイン参加成功: $domain / PC名: $newName"
        Clear-PostRebootTask
        Save-KittingState @{ Phase = 'DomainJoined'; ComputerName = $newName; Domain = $domain }

        $rr = [System.Windows.Forms.MessageBox]::Show(
            "PC名とドメイン参加が完了しました。`n再起動しますか？",
            'PCキッティング — 完了',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Information)
        if ($rr -eq [System.Windows.Forms.DialogResult]::Yes) {
            shutdown.exe /r /t 15 /c 'PCキッティング: ドメイン参加を反映するため再起動'
        }
    }
    catch {
        Write-KittingLog "エラー: $($_.Exception.Message)"
        [System.Windows.Forms.MessageBox]::Show(
            "ドメイン参加に失敗しました。`n`n$($_.Exception.Message)",
            'PCキッティング — エラー',
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
}

function Start-KittingFull {
    if (-not (Test-KittingOsWin11Pro674)) {
        Write-KittingLog 'ユーザーにより OS 確認で中止'
        return
    }
    . (Join-Path $ScriptDir 'features-list.ps1')
    $features = $KittingWindowsFeatures
    Write-KittingLog '=== PCキッティング開始（フル） ==='
    Write-KittingLog "ログ: $LogFile"
    Install-KittingWindowsUpdates
    Enable-KittingWindowsFeatures -FeatureDefs $features
    Invoke-KittingRebootPrompt
    Write-KittingLog '=== フル処理完了（再起動待ち） ==='
}

function Start-KittingPostReboot {
    if (-not (Test-KittingOsWin11Pro674)) {
        Write-KittingLog 'ユーザーにより OS 確認で中止'
        return
    }
    if ($script:KittingSkipDomainJoin674) {
        Write-KittingLog 'ドメイン参加非対応エディション — 再起動後フェーズをスキップ'
        Clear-PostRebootTask
        return
    }
    Write-KittingLog '=== PCキッティング — 再起動後フェーズ ==='
    Clear-PostRebootTask
    Show-DomainJoinWizard
    Write-KittingLog '=== 再起動後フェーズ終了 ==='
}

# --- STA 必須 ---
if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') {
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Sta', '-File', $MyInvocation.MyCommand.Path, '-Mode', $Mode)
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs -Wait
    exit $LASTEXITCODE
}

$form = Show-KittingProgressForm
try {
    if ($Mode -eq 'PostReboot') {
        Start-KittingPostReboot
    }
    else {
        Start-KittingFull
    }
}
catch {
    Write-KittingLog "致命的エラー: $($_.Exception.Message)"
    [System.Windows.Forms.MessageBox]::Show(
        $_.Exception.Message,
        'PCキッティング — エラー',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    exit 1
}
finally {
    if ($script:UiProgress) { $script:UiProgress.Style = 'Continuous'; $script:UiProgress.Value = 100 }
    Set-KittingStatus 'すべての処理が終了しました。ログを確認してください。'
}

# 完了後フォームを閉じるボタン
$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = '閉じる'
$btnClose.Location = New-Object System.Drawing.Point(600, 430)
$btnClose.Size = New-Object System.Drawing.Size(90, 28)
$btnClose.Add_Click({ $script:UiForm.Close() })
$script:UiForm.Controls.Add($btnClose)
$script:UiForm.Add_FormClosing({
    param($sender, $e)
    if ($script:UiProgress -and $script:UiProgress.Value -lt 100 -and $Mode -eq 'Full') {
        $r = [System.Windows.Forms.MessageBox]::Show(
            '処理中です。ウィンドウを閉じますか？（バックグラウンド処理は停止します）',
            '確認',
            'YesNo',
            'Question')
        if ($r -ne 'Yes') { $e.Cancel = $true }
    }
})
[System.Windows.Forms.Application]::Run($script:UiForm)
