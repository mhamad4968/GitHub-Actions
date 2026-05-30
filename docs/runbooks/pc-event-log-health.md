# PC イベントログ健全性（masa ローカル）

**制定**: 2026-05-30（B2/B3 承認）  
**対象**: Windows 11 — Killer / Bluetooth HCI の再発監視

---

## 背景

| Event ID | ソース | 症状 | 原因（2026-05-30） |
|----------|--------|------|-------------------|
| **3503** | DeviceAssociationService | Killer UI が DAS をポーリング | Intel Killer Performance Suite (`Killer.exe`) |
| **5** | BTHUSB | ~30 秒間隔の HCI ログ洪水 | EMEET スピーカーの自動再接続 + BT/USB 省電力 |

修復後（2026-05-30 20:46 JST 頃）いずれも **新規 0 件** を確認済み。

---

## 修復スクリプト（正本パス）

| 用途 | パス |
|------|------|
| Event 3503 緩和 | `C:\ProgramData\RivetNetworks\Fix-DAS3503-Killer.ps1` |
| BTHUSB Event 5 緩和 | `C:\Users\mhamada202408224\AppData\Local\Temp\Fix-BTHUSB-HCI.ps1` |

**3503 実施内容（要約）**: Killer IHS/バックグラウンド無効化 → `Killer.exe` 停止 → DAS 再起動 → 必要時スケジュールタスク `RivetNetworks-DAS3503-Mitigation`

**BTHUSB 実施内容（要約）**: USB 選択的サスペンド OFF → BT 省電力 OFF → EMEET 自動接続サービス無効 → BT スタック再起動

---

## 再起動後 5 分チェック（B3）

再起動または Windows Update 後 **5 分以内**に PowerShell（管理者不要）で実行:

```powershell
$since = (Get-Date).AddMinutes(-5)

# Event 3503（DeviceAssociationService）
Get-WinEvent -FilterHashtable @{
  LogName = 'System'; Id = 3503; StartTime = $since
} -ErrorAction SilentlyContinue | Select-Object -First 3 TimeCreated, Message

# BTHUSB Event 5
Get-WinEvent -FilterHashtable @{
  LogName = 'System'; ProviderName = 'BTHUSB'; Id = 5; StartTime = $since
} -ErrorAction SilentlyContinue | Select-Object -First 3 TimeCreated, Message

# Cursor hooks（任意・直近セッション）
$hookLog = Join-Path $env:USERPROFILE '.cursor\logs\hooks.log'
if (Test-Path $hookLog) { Get-Item $hookLog | Select-Object FullName, LastWriteTime, Length }
```

### 判定

| 結果 | 対応 |
|------|------|
| 3503 / BTHUSB 5 が **0 件** | OK — 記録のみ |
| **1 件以上** | 該当スクリプトを再実行 → 15 分後に再チェック |
| 再発が **24h 継続** | `docs/troubleshooting.md` に TSB 起票候補 |

---

## 定期確認（任意・週 1）

```powershell
$since = (Get-Date).AddDays(-7)
@(3503) | ForEach-Object {
  $c = (Get-WinEvent -FilterHashtable @{ LogName='System'; Id=$_; StartTime=$since } -EA SilentlyContinue).Count
  "Event $_ last 7d: $c"
}
Get-WinEvent -FilterHashtable @{
  LogName='System'; ProviderName='BTHUSB'; Id=5; StartTime=$since
} -EA SilentlyContinue | Measure-Object | ForEach-Object { "BTHUSB 5 last 7d: $($_.Count)" }
```

---

## AI の手順

1. PC トラブル対応後 → 本 runbook を参照し **B3 を同一セッションまたは再起動後に実施**
2. 夕反省 **26** には PC 修復の**持続確認手順**だけ書く（明日の作業は書かない）
3. 恒久対策が必要なら **ミス削減案（#S/#R）** として提案 — レーン計画は **当日 -0**
