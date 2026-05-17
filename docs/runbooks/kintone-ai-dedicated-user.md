# kintone MCP 認証 — 移行 Runbook

**CEO GO**: 2026-05-17（MCP 最適化 Tier B #3）  
**正本**: `docs/cio-permissions-guide.md` §3.3.4

---

## CEO 決定（2026-05-17 追記）— **採用ルート B**

- **`cio_ai` は使わない**（管理画面に見えない／不要）。
- **既存の部署管理権限アカウント**（`.env` の `KINTONE_USERNAME` / `PASSWORD`）を MCP も共有する。
- **627・668** は今月末削除予定のため **権限付与対象外**。
- 部署内利用のみのため、admin 分離より **実運用アカウント統一**を優先。

**CIO 実行**: `npm run kintone:sync-credentials-to-mcp` → Cursor Reload → `npm run kintone:ai-user:finish`

---

## 目的（ルート A: cio_ai — 参考・未採用）

`~/.cursor/mcp.json` の kintone 認証を **admin 以外**に寄せ、漏洩時の影響を限定する。ルート B では **部署管理アカウント＝既存 .env** で同趣旨を満たす。

---

## 1. ユーザ作成（CIO 自動 or CEO 手動）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run kintone:ai-user:create
```

- 既定ログイン名: **`cio_ai`**（`KINTONE_AI_USER_CODE` で変更可）
- 資格情報: **`temp/kintone_ai_user.env`**（gitignore・**共有禁止**）
- 既に `cio_ai` がある場合: CEO がパスワードを `temp/kintone_ai_user.env` に手書きして続行

---

## 2. アプリ権限（CEO — cybozu.com 管理画面）

**admin 権限は付与しない。** 以下を **閲覧** または **閲覧+編集**（タスクに応じて最小）:

| アプリ ID | 用途 |
|-----------|------|
| 677–683 | customize ポートフォolio（**627・668 は月末削除予定のため対象外**） |
| 685, 686 | ICT 掲示板 |
| 631, 632 | 収集・分析（利用時のみ） |
| Space **48** | システム推進室ポータル |

**不許可（重要）**

- アプリの **JavaScript/CSS カスタマイズ反映**（`preview/app/customize.json` POST）
- **ユーザー管理・システム管理**

---

## 3. mcp.json 反映（CIO — 権限付与前でも可）

```powershell
npm run kintone:ai-user:apply-mcp
```

→ **Cursor Reload Window**（MCP 経路は `cio_ai` になる。**685/48 は権限付与まで 400**）

---

## 4. 権限付与後の仕上げ（CEO 権限設定 → CIO）

```powershell
npm run kintone:ai-user:finish
```

（内部: `.env` 同期 + `verify:creds` + `cio:mcp:gate`）

**権限付与前の疎通確認のみ**:

```powershell
npm run kintone:ai-user:verify:creds
```

合格: login code が **admin でない**・685/Space 48 が **200 JSON**・customize preview が **安易に 200 でない**

---

## 5. ロールバック

CEO 手元の admin 資格で `~/.cursor/mcp.json` を復元。`temp/kintone_ai_user.env` を削除可。
