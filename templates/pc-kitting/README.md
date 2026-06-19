# PCキッティング — リポ正本

| パス | 用途 |
|------|------|
| `PCキッテング用/` | ① ドメイン参加前 |
| `PCキッティングインストール用/` | ② ドメイン参加後 |
| `add-bom.ps1` | UTF-8 BOM 一括適用 + 構文検証 |

**配布前**: `add-bom.ps1`（**.ps1 のみ** BOM 付与）→ `fix-bat-encoding.ps1 -VerifyOnly`（**.bat は BOM 禁止**）

**（新）キッティングセット**はリポに含まれません。USB 別資産を `PCキッティングインストール用\` 配下に置いてください。

配布手順: [`docs/runbooks/pc-kitting-deploy.md`](../../docs/runbooks/pc-kitting-deploy.md)
