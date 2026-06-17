# Windows 11 Pro 向け — Windowsの機能（DISM フィーチャー名・画像のチェック状態に準拠）
# All=$true → dism /all（部分チェックの親＋主要サブ機能）
$KittingWindowsFeatures = @(
    @{ Name = 'NetFx3';                         Label = '.NET Framework 3.5'; All = $false }
    @{ Name = 'NetFx4Extended-ASPNET45';        Label = '.NET Framework 4.8 Advanced (ASP.NET)'; All = $false }
    @{ Name = 'Net-WCF-HTTP-Activation45';     Label = 'WCF HTTP アクティブ化'; All = $false }
    @{ Name = 'Net-WCF-TCP-Activation45';      Label = 'WCF TCP アクティブ化'; All = $false }
    @{ Name = 'Net-WCF-TCP-PortSharing45';     Label = 'WCF TCP ポート共有'; All = $false }
    @{ Name = 'Net-WCF-MSMQ-Activation45';     Label = 'WCF MSMQ アクティブ化'; All = $false }
    @{ Name = 'Net-WCF-Pipe-Activation45';     Label = 'WCF 名前付きパイプ アクティブ化'; All = $false }
    @{ Name = 'DirectoryServices-ADLDS';       Label = 'Active Directory Lightweight Directory Services'; All = $false }
    @{ Name = 'Microsoft-Hyper-V-All';         Label = 'Hyper-V'; All = $false }
    @{ Name = 'Remote-Differential-Compression'; Label = 'Remote Differential Compression API'; All = $false }
    @{ Name = 'SMB1Protocol';                  Label = 'SMB 1.0/CIFS ファイル共有'; All = $true }
    @{ Name = 'SMBDirect';                     Label = 'SMB Direct'; All = $false }
    @{ Name = 'WorkFolders-Client';            Label = 'Work Folders Client'; All = $false }
    @{ Name = 'Printing-PrintToPDFServices-Features'; Label = 'Microsoft Print to PDF'; All = $false }
    @{ Name = 'MSMQ-Server';                   Label = 'Microsoft メッセージ キュー (MSMQ)'; All = $true }
    @{ Name = 'MultiPoint-Connector';          Label = 'MultiPoint Connector'; All = $true }
    @{ Name = 'ServicesForNFS-ClientOnly';     Label = 'NFS 用サービス (クライアント)'; All = $false }
    @{ Name = 'WAS-WindowsActivationService';  Label = 'Windows プロセス アクティブ化サービス'; All = $true }
    @{ Name = 'IIS-WebServerRole';             Label = 'IIS (Web サーバー役割)'; All = $true }
    @{ Name = 'Printing-Foundation-Features';  Label = '印刷とドキュメント サービス'; All = $true }
    @{ Name = 'MediaPlayback';                 Label = 'メディア機能'; All = $true }
    @{ Name = 'LegacyComponents';              Label = 'レガシ コンポーネント'; All = $true }
    @{ Name = 'VirtualMachinePlatform';         Label = '仮想マシン プラットフォーム'; All = $false }
)
