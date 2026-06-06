$utf8bom = New-Object System.Text.UTF8Encoding $true
$desktop = Join-Path $env:USERPROFILE 'Desktop'

$targets = @(
    @{
        Base  = Join-Path $desktop 'PCキッテング用'
        Files = @(
            'PCキッティング\kitting-encoding.ps1',
            'PCキッティング\kitting-main.ps1',
            'PCキッティング\features-list.ps1',
            'PCキッティング\README.txt',
            'PCキッティング_START.bat'
        )
    },
    @{
        Base  = Join-Path $desktop 'PCキッティングインストール用'
        Files = @(
            'PCキッティング\kitting-encoding.ps1',
            'PCキッティング\post-domain-install.ps1',
            'README.txt',
            'PCキッティング_インストール_START.bat'
        )
    }
)

foreach ($target in $targets) {
    foreach ($rel in $target.Files) {
        $f = Join-Path $target.Base $rel
        if (Test-Path -LiteralPath $f) {
            $t = [IO.File]::ReadAllText($f)
            [IO.File]::WriteAllText($f, $t, $utf8bom)
        }
    }
}
