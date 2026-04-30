# 🔬 Cursor MCP env 解決仕様調査レポート（次元 4 段階 2 の事前調査）

**作成**: 2026-04-23 (Thu) 02:50 JST
**調査者**: AI（浜田 a 案承認 2026-04-23 02:45 / WebSearch 1 セッション）
**目的**: `~/.cursor/mcp.json` の平文パスワード `kent2511` を `.env` 経由化する方法を調査
**結論**: **3 つの実装方式が判明 / WSL 環境ではラッパースクリプト方式が最確実**

---

## 📌 サマリ（30 秒で読める要約）

### 公式仕様
1. **`${env:VAR_NAME}` 構文** = サポート有（env オブジェクト + headers フィールド）
2. **解決元** = Cursor プロセスが起動した OS 環境変数のみ
3. **`.env` ファイル直接読込** = 標準サポート**無し**

### 制約（重要）
- WSL Cursor server では `~/.bashrc` の export 値が読まれない（GUI 起動時の典型問題）
- 環境変数は `/etc/environment` or `~/.pam_environment` で定義する必要あり
- Remote-SSH 環境では既知バグ（ローカル env を参照してしまう）

### 浜田の WSL 環境での実装方式 3 択
| 方式 | 工数 | 確実性 | 推奨度 |
|---|---|---|---|
| **A. ラッパー shell script** | 30 分 | 🟢 最高 | ⭐⭐⭐ |
| **B. npm パッケージ `envmcp`** | 15 分 | 🟡 中 | ⭐⭐ |
| **C. `${env:KINTONE_PASSWORD}` 直接 + `/etc/environment`** | 10 分 | 🟠 低（WSL 環境で動かない可能性高）| ⭐ |

---

## 🧪 詳細調査結果

### 仕様の出典
- Cursor 公式 Forum: [Resolve local environment variables in MCP server definitions](https://forum.cursor.com/t/resolve-local-environment-variables-in-mcp-server-definitions/79639)
- Cursor 公式 Forum: [Config interpolation ${env:NAME} not working in headers](https://forum.cursor.com/t/config-interpolation-env-name-not-working-in-headers-for-remote-mcp-servers/156069)
- Qiita: [Cursorのmcp.jsonでプロジェクトルートにある.envを読み込んでMCPサーバーを起動する](https://qiita.com/noremoresh1tty-74n3/items/e7b745b11a1d25f6d817)
- Zenn: [MCP サーバーで環境変数を設定する方法](https://zenn.dev/heavenosk/articles/mcp-env-variables)
- Truefoundry 2026 Guide: [MCP Servers in Cursor: Setup, Configuration, and Security](https://www.truefoundry.com/blog/mcp-servers-in-cursor-setup-configuration-and-security-guide)

### `${env:VAR_NAME}` 構文の仕様
```json
{
  "mcpServers": {
    "kintone": {
      "command": "npx",
      "args": ["-y", "@kintone/mcp-server@latest"],
      "env": {
        "KINTONE_BASE_URL": "https://jbis-kintone.cybozu.com",
        "KINTONE_USERNAME": "admin",
        "KINTONE_PASSWORD": "${env:KINTONE_PASSWORD}"
      }
    }
  }
}
```

ただし WSL 環境で `~/.bashrc` 由来の env を参照したい場合は、Cursor server の起動環境に env が伝播していない可能性が高い。

---

## 📋 浜田の WSL Cursor server 環境での 3 つの実装方式

### 方式 A: ラッパー shell script（⭐⭐⭐ 最推奨）

#### 仕組み
`.env` を読んで env を export してから MCP server を起動する shell script を `command` に指定する。

#### 実装例

**`.env` ファイル**（`~/.cursor/.env` 配置 / `chmod 600` で本人のみ読込可）:
```bash
KINTONE_BASE_URL=https://jbis-kintone.cybozu.com
KINTONE_USERNAME=admin
KINTONE_PASSWORD=kent2511
```

**ラッパー script**（`~/.cursor/mcp-wrappers/start-kintone.sh`）:
```bash
#!/bin/bash
set -a
source ~/.cursor/.env
set +a
exec npx -y @kintone/mcp-server@latest
```

**ラッパー script**（`~/.cursor/mcp-wrappers/start-kintone-space.sh`）:
```bash
#!/bin/bash
set -a
source ~/.cursor/.env
set +a
exec node ~/.cursor/kintone-space-mcp/index.mjs
```

**`mcp.json` 修正**:
```json
{
  "mcpServers": {
    "kintone": {
      "command": "/home/mhamada202408224/.cursor/mcp-wrappers/start-kintone.sh"
    },
    "kintone-space": {
      "command": "/home/mhamada202408224/.cursor/mcp-wrappers/start-kintone-space.sh"
    }
  }
}
```

#### メリット
- 確実に動く（shell script は常に bash 経由 = `.env` source 確実）
- 任意の env を一元管理可能
- `.env` を `chmod 600` で本人のみ読込制限
- 他 MCP（cyber-news 等）にも同じパターン展開可能

#### デメリット
- ラッパー script を MCP 数だけ作成する必要（kintone + kintone-space = 2 件）
- mcp.json 変更後 Cursor 再起動必須
- script 自体の保全（wipe-guard 対象に追加要）

#### 工数
30 分（script 作成 + chmod + mcp.json 編集 + Cursor 再起動 + 動作確認）

---

### 方式 B: npm パッケージ `envmcp`（⭐⭐ 中推奨）

#### 仕組み
`envmcp` という npm パッケージで MCP server コマンドをラップする。`.env.mcp` ファイルから自動読込。

#### 実装例
```json
{
  "mcpServers": {
    "kintone": {
      "command": "npx",
      "args": ["envmcp", "@kintone/mcp-server@latest"]
    }
  }
}
```

`.env.mcp` 配置（プロジェクトルート or `~/.cursor/`）:
```bash
KINTONE_PASSWORD=kent2511
```

#### メリット
- 設定簡素（mcp.json の args に envmcp を 1 行追加するだけ）
- ラッパー script 不要

#### デメリット
- サードパーティパッケージへの依存（脆弱性 / 削除リスク）
- `envmcp` のメンテナンス状態未確認（要 GitHub stars / 最終更新日チェック）
- 既存 npm 経路への変更影響

#### 工数
15 分（npm install + mcp.json 編集 + 動作確認）

---

### 方式 C: `${env:VAR}` + `/etc/environment` 設定（⭐ 低推奨）

#### 仕組み
mcp.json で `${env:VAR_NAME}` を使い、env の値は `/etc/environment` で定義（Cursor server 起動時に読まれる）。

#### 実装例

**`/etc/environment` 追記**（要 sudo）:
```
KINTONE_PASSWORD="kent2511"
```

**`mcp.json` 修正**:
```json
{
  "mcpServers": {
    "kintone": {
      "command": "npx",
      "args": ["-y", "@kintone/mcp-server@latest"],
      "env": {
        "KINTONE_PASSWORD": "${env:KINTONE_PASSWORD}"
      }
    }
  }
}
```

#### メリット
- 公式仕様に最も近い（追加ツール不要）
- 設定簡素

#### デメリット
- WSL 環境で **`/etc/environment` が Cursor server 起動時に読まれるかは不確実**（公式 Forum の報告では WSL 起動経路により挙動差あり）
- sudo 必要 = リスク + 浜田作業が増える
- システム全体に env が見える = 他プロセスからも参照可能（プライバシー低下）
- 動作検証で「動かない」が出たら方式 A に戻すのが面倒

#### 工数
10 分（ただし「動かない」リスクで実質 60 分超の可能性）

---

## 🎯 私の §48 推奨

### 段階 1（5 月以降 / 浜田判断後）= **方式 A 採用**
- 確実性最優先 / WSL 環境への依存リスク回避 / 他 MCP への展開容易性

### 段階 2（5 月以降 / 段階 1 安定後）= 方式 A を全 MCP に展開
- cyber-news / kintone-dev も同パターンでラッパー化
- `.env` を一元管理

### 段階 3（6 月以降 / 余裕があれば）= envmcp（方式 B）評価
- envmcp パッケージのメンテ状態 + 脆弱性履歴を確認後、方式 A → B 移行検討

---

## 🔒 段階 1 監査の修正事項（次元 4 過剰懸念の訂正）

### 過剰懸念だった点
段階 1 監査 §4.1 で「mcp.json バックアップが git tracked になったら漏洩」と書いたが、実際は:

| 経路 | 状態 | リスク |
|---|---|---|
| `backups/` git tracked | ❌ 該当せず（`.gitignore` 行 28 で除外済）| ゼロ |
| `~/.cursor-emergency-backup/` 複製 | ❌ 該当せず（mcp.json 含まれてない）| ゼロ |
| Cursor cloud sync | ❌ 該当せず（settings.json 不在 = 未設定）| ゼロ |
| `cat ~/.cursor/mcp.json` ローカル閲覧 | ✅ 可能（本人のみ）| 実質ゼロ |
| WSL マルチユーザー（同マシン他ユーザー）| ✅ `chmod 644` なら可能 | 低（浜田単独使用想定）|

### 結論
**現状の漏洩リスクは実質ゼロ** = `.env` 経由化は **「セキュリティ理想」の追求であり緊急性は低い**。5 月以降に余裕を持って実施でよい。

ただし以下の場合は緊急度上がる:
- マシン共有が始まる（他ユーザー追加）
- Cursor cloud sync を有効化する
- mcp.json 内容を画面共有 / スクリーンショット / git push する場面

---

## 📅 5 月以降の実施スケジュール案

### Week 1（5/14-5/16）
- 方式 A の wrapper script 2 件作成（kintone + kintone-space）
- `~/.cursor/.env` 配置 + `chmod 600`
- mcp.json 編集 + Cursor 再起動
- 動作確認 + health-check 通過

### Week 2（5/17-5/23）
- 安定運用 1 週間
- TSB-XXX に「方式 A 移行記録」追記

### Week 3 以降（5/24+）
- 全 MCP の env を `~/.cursor/.env` に統一
- envmcp（方式 B）評価検討
- cyber-news / accessibility-scanner 等にも展開

---

## 🔗 関連

- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md` §4.1
- 段階 2 深掘り: `docs/reports/2026-04-23-mcp-deep-analysis-stage2.md` 次元 4
- 戦略書 v1.0: `docs/plans/2026-04-23-mcp-strategy-v1.md`
- AGENTS.md §17 / §22 / §23 / §24（MCP 設定変更時の義務）
- Cursor 公式 Forum / Qiita / Zenn 各記事（本文中リンク）
