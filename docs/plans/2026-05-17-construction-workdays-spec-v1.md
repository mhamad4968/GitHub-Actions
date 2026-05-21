# 工事稼働日数算出 — SPEC v1（参照）

正本（ツール横）:

`C:\tmp\稼働日数算出ツール\SPEC-v1.md`

kintone 実装・レビューは上記ファイルを参照すること。内容の二重管理は行わない。

**kintone 配置（確定）**: [Space 56 業務アプリ](https://jbis-kintone.cybozu.com/k/#/space/56) / **thread 60** / アクセス **Everyone（全社 kintone 利用者）**。正本 SPEC **§6.1**。

**2アプリ構成（§6.2）**:

| 役割 | appId | URL |
|------|-------|-----|
| データ正本 | **687** | https://jbis-kintone.cybozu.com/k/687/ |
| **ダッシュ（日常入口）** | **688** | https://jbis-kintone.cybozu.com/k/688/ |

687: フィールド正本。688: Excel 風 UI（687 REST 読書き）。ACL Everyone は両アプリ管理画面設定。
