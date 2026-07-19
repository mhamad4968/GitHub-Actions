#requires -Version 5.1

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SecretFile = "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env"
$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$AtomicWriter = "/mnt/c/Users/mhamada202408224/kintone-ai-lab/scripts/write-mcp-ai-secrets-atomic.mjs"

function Invoke-WslUbuntu {
    param(
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [AllowNull()][string]$StandardInputText = $null
    )

    $allArguments = @("-d", "Ubuntu", "-e") + $ArgumentList
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = Join-Path $env:WINDIR "System32\wsl.exe"
    # Arguments are controlled whitespace-free tokens and paths. Quoting every
    # argument causes Windows PowerShell 5.1 to pass them as one WSL command.
    $startInfo.Arguments = $allArguments -join " "
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    try {
        if (-not $process.Start()) {
            throw "Unable to start WSL Ubuntu."
        }

        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        if ($null -ne $StandardInputText) {
            $process.StandardInput.Write($StandardInputText)
        }
        $process.StandardInput.Close()
        $process.WaitForExit()

        return [pscustomobject]@{
            ExitCode = $process.ExitCode
            StdOut = $stdoutTask.GetAwaiter().GetResult()
            StdErr = $stderrTask.GetAwaiter().GetResult()
        }
    }
    finally {
        $process.Dispose()
    }
}

if ($env:MCP_AI_ROTATION_ENTRY_CHECK -eq "1") {
    $entryResult = Invoke-WslUbuntu -ArgumentList @("test", "-f", $SecretFile)
    if ($entryResult.ExitCode -ne 0) {
        throw "Entry check reached WSL but could not find the approved secret file."
    }
    $writerCheck = Invoke-WslUbuntu -ArgumentList @("node", "--check", $AtomicWriter)
    if ($writerCheck.ExitCode -ne 0) {
        throw "Entry check could not validate the atomic writer."
    }
    Write-Host "[update-mcp-ai-secrets-interactive] entry check OK"
    exit 0
}

function Invoke-AtomicWslWrite {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][ValidatePattern('^[0-7]{3,4}$')][string]$Mode
    )

    $result = Invoke-WslUbuntu `
        -ArgumentList @("node", $AtomicWriter, $Mode) `
        -StandardInputText $Content
    if ($result.ExitCode -ne 0) {
        throw "Atomic WSL secret-file replacement failed."
    }
}

function ConvertFrom-SecureStringToShellQuoted {
    param([Parameter(Mandatory = $true)][Security.SecureString]$SecureValue)

    $bstr = [IntPtr]::Zero
    $plainText = $null
    try {
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
        $plainText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        if ([string]::IsNullOrEmpty($plainText)) {
            throw "API keys must not be empty."
        }
        if ($plainText.IndexOfAny([char[]]@("`r", "`n", [char]0)) -ge 0) {
            throw "API keys must be single-line values."
        }

        $singleQuoteEscape = [string][char]39 + [char]92 + [char]39 + [char]39
        return ([string][char]39) +
            $plainText.Replace([string][char]39, $singleQuoteEscape) +
            ([string][char]39)
    }
    finally {
        $plainText = $null
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
            $bstr = [IntPtr]::Zero
        }
    }
}

function Invoke-NpmVerification {
    param([Parameter(Mandatory = $true)][string]$ScriptName)

    & npm.cmd run $ScriptName
    return $LASTEXITCODE -eq 0
}

$moonshotSecure = $null
$deepseekSecure = $null
$openrouterSecure = $null
$moonshotQuoted = $null
$deepseekQuoted = $null
$openrouterQuoted = $null
$oldContent = $null
$oldMode = $null
$newContent = $null
$failureMessage = $null
$updated = $false
$rollbackAttempted = $false
$completed = $false

try {
    $existsResult = Invoke-WslUbuntu -ArgumentList @("test", "-f", $SecretFile)
    if ($existsResult.ExitCode -ne 0) {
        throw "The approved WSL secret file does not exist; run the migration workflow first."
    }

    $modeResult = Invoke-WslUbuntu -ArgumentList @("stat", "-c", "%a", $SecretFile)
    if ($modeResult.ExitCode -ne 0) {
        throw "Unable to read the existing WSL secret-file mode."
    }
    $oldMode = $modeResult.StdOut.Trim()
    if ($oldMode -notmatch '^[0-7]{3,4}$') {
        throw "The existing WSL secret-file mode is invalid."
    }

    $contentResult = Invoke-WslUbuntu -ArgumentList @("cat", "--", $SecretFile)
    if ($contentResult.ExitCode -ne 0) {
        throw "Unable to preserve the existing WSL secret-file content."
    }
    $oldContent = $contentResult.StdOut

    $moonshotSecure = Read-Host "Enter new MOONSHOT_API_KEY" -AsSecureString
    $deepseekSecure = Read-Host "Enter new DEEPSEEK_API_KEY" -AsSecureString
    $openrouterSecure = Read-Host "Enter new OPENROUTER_API_KEY" -AsSecureString

    $moonshotQuoted = ConvertFrom-SecureStringToShellQuoted $moonshotSecure
    $deepseekQuoted = ConvertFrom-SecureStringToShellQuoted $deepseekSecure
    $openrouterQuoted = ConvertFrom-SecureStringToShellQuoted $openrouterSecure

    $targetLinePattern = '(?m)^(?:export\s+)?(?:MOONSHOT_API_KEY|DEEPSEEK_API_KEY|OPENROUTER_API_KEY)=.*(?:\r?\n|$)'
    $retainedContent = [regex]::Replace($oldContent, $targetLinePattern, "").TrimEnd("`r", "`n")
    $prefix = if ($retainedContent.Length -gt 0) { $retainedContent + "`n`n" } else { "" }
    $newContent = $prefix +
        "export MOONSHOT_API_KEY=$moonshotQuoted`n" +
        "export DEEPSEEK_API_KEY=$deepseekQuoted`n" +
        "export OPENROUTER_API_KEY=$openrouterQuoted`n"
    $retainedContent = $null
    $prefix = $null

    Invoke-AtomicWslWrite -Content $newContent -Mode "600"
    $updated = $true

    Push-Location $RepositoryRoot
    try {
        $storageOk = Invoke-NpmVerification "verify:mcp-ai-secret-storage"
        $environmentOk = Invoke-NpmVerification "cio:mcp:env"
    }
    finally {
        Pop-Location
    }

    if (-not $storageOk -or -not $environmentOk) {
        $rollbackAttempted = $true
        try {
            Invoke-AtomicWslWrite -Content $oldContent -Mode $oldMode
        }
        catch {
            throw "Verification failed and rollback was incomplete. Stop using the affected MCP providers until the secret file is repaired."
        }
        throw "Verification failed. Rollback completed; the previous secret file content and mode were restored."
    }

    $completed = $true
    Write-Host "Local API key update and 6/6 verification succeeded."
    Write-Host "Revoke the old keys now in the Moonshot, DeepSeek, and OpenRouter provider dashboards."
}
catch {
    $failureMessage = $_.Exception.Message
    if ($updated -and -not $completed -and -not $rollbackAttempted) {
        $rollbackAttempted = $true
        try {
            Invoke-AtomicWslWrite -Content $oldContent -Mode $oldMode
            $failureMessage = "$failureMessage Rollback completed; the previous secret file content and mode were restored."
        }
        catch {
            $failureMessage = "Update failed and rollback was incomplete. Stop using the affected MCP providers until the secret file is repaired."
        }
    }
}
finally {
    if ($null -ne $moonshotSecure) {
        $moonshotSecure.Dispose()
    }
    if ($null -ne $deepseekSecure) {
        $deepseekSecure.Dispose()
    }
    if ($null -ne $openrouterSecure) {
        $openrouterSecure.Dispose()
    }
    $moonshotSecure = $null
    $deepseekSecure = $null
    $openrouterSecure = $null
    $moonshotQuoted = $null
    $deepseekQuoted = $null
    $openrouterQuoted = $null
    $oldContent = $null
    $newContent = $null
}

if ($null -ne $failureMessage) {
    Write-Error $failureMessage
    exit 1
}
