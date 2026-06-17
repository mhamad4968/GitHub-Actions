# PCキッティング配布 runbook（R52）

**制定**: 2026-06-17（浜田 GO — R52）  
**正本パッケージ**: `templates/pc-kitting/`

---

## 配布物の構成

| フォルダ | 内容 | リポ |
|----------|------|------|
| `PCキッテング用/` | ① ドメイン参加前（Update・機能・ドメイン） | ✅ |
| `PCキッティングインストール用/` | ② ドメイン参加後インストール（スクリプトのみ） | ✅ |
| **`（新）キッティングセット/`** | Office・Zoom・ウイルス対策・ショートカット等 | ❌ **USB 別資産** |

② を実行するには `PCキッティングインストール用\（新）キッティングセット\` を **同梱または別 USB からコピー**すること。

---

## 配布前（開発 PC）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab\templates\pc-kitting
powershell -ExecutionPolicy Bypass -File .\add-bom.ps1
powershell -ExecutionPolicy Bypass -File .\add-bom.ps1 -VerifyOnly
```

- すべての `.ps1` が **UTF-8 BOM** + **Parser OK** であること
- 起動は **`PCキッティング_START.bat`** → **`kitting-run.ps1`**（`kitting-main.ps1` 直接不可）

---

## キッティング PC へのコピー

1. `PCキッテング用\` と `PCキッティングインストール用\` を **フォルダごと** Desktop へ
2. （新）キッティングセットを `PCキッティングインストール用\` 配下へ
3. ① `PCキッティング_START.bat`（管理者）
4. ドメイン参加後 ② `PCキッティング_インストール_START.bat`（管理者）

---

## 文字化け（Unexpected token / CenterScreen）

**原因**: PowerShell 5.1 が UTF-8 BOM なし `.ps1` を Shift-JIS として解析。

**対処**: 正本から再コピー + `kitting-run.ps1` 経由起動（初回 BOM 自動修復）。

---

## 関連

- [`templates/pc-kitting/README.md`](../../templates/pc-kitting/README.md)
- [`PCキッテング用/PCキッティング/README.txt`](../../templates/pc-kitting/PCキッテング用/PCキッティング/README.txt)
