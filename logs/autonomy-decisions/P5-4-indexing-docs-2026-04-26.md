# P5-4: Indexing & Docs タブ 監査結果

**日時**: 2026-04-26 09:42-09:53 JST
**Tier**: A (AI 自律 / readonly 範囲)
**並列**: なし (順次 / §51 遵守)

---

## 0. サマリ

3 件の追加発見 (重大 1 / 中 2)。P5-3 の F-1〜F-7 と統合して P5-9 で反映。

| ID | 重大度 | 概要 |
|----|-------|------|
| F-8 | 重大 | `~/.cursor/cli-config.json`: `sandbox.mode: "disabled"` + `permissions.deny: []` → 公式 deny 未活用 (F-6 と同根 / IDE + CLI 両方) |
| F-9 | 中 | CODEOWNERS / .gitattributes / SECURITY.md すべて不存在 |
| F-10 | 中 | Windows 側 Cursor settings.json (6 行のみ) → Workspace Trust 設定など未登録 / Cursor IDE 設定が「ほぼ全部 default」 |

良好項目:
- ✅ `.cursorignore` (R-2 / 86 行 / 5 カテゴリ / 安全側設計)
- ✅ `.rag/extra-docs/` の同期スクリプト (sync-style / 古いコピー自動削除)

---

## 1. .cursorignore / .cursorindexingignore

| ファイル | 状態 | 評価 |
|---------|------|------|
| `.cursorignore` | ✅ 存在 (R-2 / 4641 bytes) | 安全側設計 / 5 カテゴリ |
| `.cursorindexingignore` | ❌ 不存在 | `.cursorignore` で代替 / 問題なし |

`.cursorignore` の構造:
1. 秘密情報 (`.env`, `data/credit-usage.json`)
2. 大量自動生成 (`logs/file-watcher/*.jsonl`, `.rag/lancedb/`)
3. バックアップ系 (`*.bak`, `*.backup.*Z`)
4. 並列セッション疑い snapshot
5. 一時ファイル

明示的に「絶対に ignore しない」ホワイトリスト記載あり (76-87 行):
- AGENTS.md / RULES-INDEX.md / WORKFLOW.md / CLAUDE.md
- scripts/ 配下全 .mjs / .js / .ts
- docs/ 配下全 .md
- chat-sessions/ 配下全 .md
- `.rag/extra-docs/` 配下
- tests/ 配下
- `logs/autonomy-decisions/` 配下 (Z-1 構造修正済)
- `data/credit-budget-config.json`

→ **見落としリスク 低**。R-2 制定時の浜田 GO 「インデックス範囲変更で今後見落とし等はないようにしてほしい」を満たす設計。

---

## 2. Cursor 設定ファイル

### 2-1. Windows 側 settings.json (`/mnt/c/Users/.../AppData/Roaming/Cursor/User/settings.json`)

```json
{
    "workbench.editor.enablePreview": false,
    "editor.renderControlCharacters": false,
    "files.autoSave": "afterDelay",
    "git.openRepositoryInParentFolders": "always",
    "git.autofetch": true,
    "workbench.colorTheme": "Default Dark Modern"
}
```

たった 6 項目。

#### 不在の重要設定 (公式推奨 cf. cursor-guide §4)

| 設定 | デフォルト | 推奨 | 状態 |
|------|----------|------|------|
| `security.workspace.trust.enabled` | true | true (信頼前のリポジトリで Rules / Skills 自動発火を抑止) | 未明示設定 (デフォルト) |
| `cursor.cmdk.useThemedDiffBackground` | – | – | 未設定 |
| `cursor.general.privacyMode` | normal | privateMode | 未設定 (cli-config 側で privacyMode: 4 = enabled 確認済) |

→ **F-10**: 設定ファイルが事実上 default のため Workspace Trust の状態が見えない。Day 4 後にスクショ確認 (P5-5 の浜田作業で同時に対応可能)

### 2-2. CLI 設定 (`~/.cursor/cli-config.json`)

```json
{
  "permissions": {
    "allow": ["Shell(ls)"],
    "deny": []
  },
  "approvalMode": "allowlist",
  "sandbox": { "mode": "disabled", "networkAccess": "user_config_with_defaults" },
  "model": { "modelId": "claude-opus-4-7-thinking-max" },
  "maxMode": false
}
```

#### 良好項目
- ✅ `approvalMode: "allowlist"` (新規 shell コマンドは要承認)
- ✅ `model.modelId: "claude-opus-4-7-thinking-max"` = §1-2 単一モデル原則と整合
- ✅ `maxMode: false` = §1-2-3 (Max Thinking 通常モード) と整合
- ✅ `attribution.attributeCommitsToAgent: true` (TSB-019 で確認済 `--trailer "Made-with: Cursor"` と整合)
- ✅ `privacyMode: 4` (有効)

#### 不安項目 = **F-8** (重大)
- ⚠ `permissions.deny: []` = 空 → 公式の `Shell(rm)`, `Shell(sudo)`, `Read(.env*)`, `Write(**/*.key)` 等の deny ルール **未設定**
- ⚠ `sandbox.mode: "disabled"` = サンドボックス無効化 → CLI から走らせるコマンドが host を直接触る (本人 WSL なので影響範囲は限定的だが、悪意ある skill / subagent からの保護が薄い)
- ⚠ `runEverythingSettingsPromptStreak: 0` = "Run Everything" 設定の確認スキップ判定値?

#### 改善案 (P5-9 で議論)

```json
{
  "permissions": {
    "allow": ["Shell(ls)", "Shell(git status)", "Shell(npm)"],
    "deny": [
      "Shell(rm)",
      "Shell(sudo)",
      "Shell(curl:*)",
      "Read(.env*)",
      "Read(**/.env*)",
      "Write(**/*.key)",
      "Write(**/*.pem)"
    ]
  },
  "sandbox": { "mode": "workspace-write" }
}
```

→ §52-8-1 Cursor Hooks (`dangerous-shell-blocker.sh`) と **二重防御**:
- Cursor Hooks: shell 実行直前 bash 正規表現
- permissions.json: Cursor IDE 公式機能で deny

両方有効化で「片方が誤って bypass されても他方で止まる」体制。

---

## 3. RAG ingest 範囲

### 3-1. .rag/extra-docs/ (RAG が読む対象 = AI コンテキストに乗りうる)

```
AGENTS.md
CLAUDE.md
CURSOR-トラブル対応メモ.md
NEW-SESSION-STARTER.md
README.md
RULES-INDEX.md
WORKFLOW.md
_archive/
cursor-hooks-design.md
cursorrules.md
sessions/  (10 件 / chat-sessions/ 同期)
```

### 3-2. 同期スクリプト (`scripts/rag-ingest-sessions.mjs`)

- chat-sessions/ → .rag/extra-docs/sessions/ にコピー (sync-style)
- checkpoint-latest.md / NEW-SESSION-STARTER.md / CURSOR-トラブル対応メモ.md は常駐
- chat-sessions/YYYY-MM-DD.md は最新 N 日分 (default 7) コピー
- 古いコピーは削除 (sync-style)

→ **健全**。古いセッションログがインデックスに残り続けるバグなし。

### 3-3. .cursorignore との関係

`.cursorignore` で `.rag/lancedb/`, `.rag/models/` は ignore (バイナリ index データ)。
`.rag/extra-docs/` は **明示的に index 対象維持** (= AI が見落とさない設計)。

→ 整合性 OK。

---

## 4. リポジトリ衛生 = **F-9** (中)

### 4-1. 不在の重要ファイル

| ファイル | 公式扱い | 用途 | 不在理由 |
|---------|---------|------|---------|
| `CODEOWNERS` または `.github/CODEOWNERS` | GitHub 機能 | PR 自動レビュー割当 / 重要ファイル変更時の保護 | 個人開発のため未設定 |
| `.gitattributes` | git 機能 | CRLF/LF 強制 / TSB-018 教訓と直結 | 未設定 |
| `SECURITY.md` | GitHub 機能 | セキュリティ報告先 / 公開リポなら推奨 | 未設定 |
| `.github/workflows/*.yml` | GitHub Actions | CI / 自動テスト | 既存あり (要確認) |

### 4-2. 影響度

- **CODEOWNERS 不在**: 第三者 PR 取り込み時の差分レビューが弱い (cursor-guide §4 推奨)
  - 個人開発なので緊急度は低い
  - ただし GitHub-Actions リポを別管理しており、AI コミットに `--trailer "Made-with: Cursor"` を付与 → AI 由来 PR の自動識別はできる

- **.gitattributes 不在**: TSB-018 (CRLF/LF) 再発リスク
  - 推奨: `.gitattributes` に `*.bat text eol=crlf` / `*.sh text eol=lf` / `*.js text eol=lf` 等

- **SECURITY.md 不在**: 公開リポでセキュリティ報告窓口が不明
  - 個人リポ + 学習用なので緊急度は低い

### 4-3. 改善案 (P5-9 で議論 / Day 4 後)

優先順位:
1. **`.gitattributes`** (TSB-018 直結 / 高優先) — Phase 2 (Day 4 後の今夜)
2. **`SECURITY.md`** (低コスト / 中優先) — Day 5
3. **`CODEOWNERS`** (個人開発のため低優先) — 不要 or 最小版

---

## 5. その他観察

### 5-1. Cursor IDE 内部 (`~/.cursor/`)

- `hooks.json` (Q-1 で実装 / §52-8-1)
- `hooks/dangerous-shell-blocker.sh` (Q-1 で実装)
- `mcp.json` (P5-2 で監査予定 / 4/26 06:24 更新)
- `mcp.json.backup.*` (3 件 / 過去変更履歴 / 各々 P5-2 で照合予定)
- `rules/` (5 件 / 公式仕様外パス = F-3)
- `scripts/`, `venvs/`, `cve-search_mcp/`, `kintone-space-mcp/`, `kntn-dev-mcp/` (MCP サーバ)

### 5-2. AI トラッキング (`~/.cursor/ai-tracking/`)

存在 (4/11 22:48) → 内容未確認だが学習データ系の可能性。プライバシー観点で確認価値あり (P5-9 後検討)。

---

## 6. P5-3 と P5-4 の発見統合表

P5-3 + P5-4 で計 10 件:

| ID | 重大度 | カテゴリ | 概要 |
|----|-------|---------|------|
| F-1 | 重大 | Rules | persist-policies.mdc 法体系図が古い |
| F-2 | 重大 | Rules | kintone.mdc の AGENTS.md §参照が不明確 |
| F-3 | 重大 | Rules | `~/.cursor/rules/` は公式仕様外 / 動作実態不明 |
| F-4 | 重大 | Rules | CLAUDE.md が AGENTS.md と重複 + 常時注入 |
| F-5 | 中 | Rules | legacy .cursorrules が現役 (Project Rules 移行推奨) |
| F-6 | 中 | Permissions | `~/.cursor/permissions.json` 未設定 |
| F-7 | 低 | Rules | preflight-checklist.mdc § 番号整合性 |
| F-8 | 重大 | CLI | `cli-config.json` sandbox.disabled + deny.empty |
| F-9 | 中 | Repo Hygiene | CODEOWNERS / .gitattributes / SECURITY.md 不在 |
| F-10 | 中 | Settings | Windows Cursor settings.json が事実上 default |

P5-9 で対応:
- 即時修正 (commit/push): F-1, F-2, F-7 (AGENTS.md / persist-policies.mdc / kintone.mdc)
- 設計記述追加: F-3, F-4, F-5 (NEW-SESSION-STARTER + AGENTS.md §57 改定提案)
- 設定変更案 (浜田 GO 必要 / Day 4 後): F-6, F-8 (permissions.json + cli-config.json)
- 中長期 TODO: F-9, F-10 (Day 5 以降)

---

## 7. 次工程 (P5-5 へ)

P5-4 完了。次は P5-5 (Plan & Usage タブ監査):
- 浜田に Cursor IDE 内 Settings → Plan & Usage タブのスクショ依頼
- 当月使用量 / 残クレジット / プラン詳細の確認
- §1-2-4 (クレジット予算管理) の予算閾値と整合性チェック
- credit-budget.mjs の最新値と照合

P5-5 → P5-9 (反映 + commit/push) → 13:00 直前ヘルスチェック → Day 4 開始の流れ。

## 8. ステータス

- [x] .cursorignore / .cursorindexingignore 確認
- [x] Windows / WSL Cursor settings 確認
- [x] cli-config.json 確認 (重大発見 F-8)
- [x] RAG ingest 範囲確認 (健全)
- [x] CODEOWNERS / .gitattributes / SECURITY.md 確認 (全て不在 = F-9)
- [x] P5-4 監査記録作成 (本ファイル)
- [ ] P5-5 浜田スクショ依頼 (次工程)
- [ ] P5-9 で反映 (commit/push)
