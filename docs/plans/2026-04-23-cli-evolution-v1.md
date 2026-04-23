# 🎯 CLI / ツール / 依存進化戦略 v1.0

**制定日**: 2026-04-23 (Thu) 22:00-23:30  
**契機**: 浜田 21:54 「CLI 等もアップデート進化出来ないかな？ / 時間あり / 安全に深く 1 つずつ」  
**ベース**: AGENTS.md §38 (ツール・依存関係の自律保守) + §50-2 (死蔵 MCP 根絶) + §11-5 (3 段階検証) + §51 (並列禁止)

---

## 📋 Phase E 全 10 ステップ実績

| Step | 内容 | 結果 |
|---|---|---|
| E1 | npm outdated + audit 診断 (root + 2 subprojects) | ✅ root 0 vuln / vite 3 vuln / sec-next 3 vuln |
| E2 | MCP servers 実 version 診断 | ✅ 全件最新 / fetch のみ 1 年メンテ低調 (代替候補) |
| E3 | CLI tools 棚卸し | ✅ gh 46 minor 遅れ ⚠ / 他は最新 |
| E4 | system tools 診断 | ✅ uv 5 patch 遅れ ⚠ / git+gh sudo 必要 ⚠ / node v24 LTS 維持推奨 |
| E5 | 自作 scripts 品質指標 | ✅ 29 files / 5985 行 / TODO 1 件 / 大型 7 件 妥当範囲 |
| E6 | 診断結果分類 | ✅ 即時 U1-U7 / 浜田 sudo S1-S2 / 浜田判断 M1-M5 |
| E7 | 即時 update U1-U7 実施 | ✅ 7 commit / 6 vuln → 0 / 全検証 OK |
| E8 | proposal 化 | ✅ 全件即時 update or 戦略書へ / proposal 0 件 |
| E9 | 戦略書作成 (本ファイル) | (作業中) |
| E10 | RAG ingest + memory + checkpoint + 最終 commit | (次) |

---

## ✅ 即時実施済 (U1-U7 / 7 commit / 6 vuln → 0)

| # | 対象 | 内容 | commit |
|---|---|---|---|
| U1 | root | dotenv 17.3.1 → 17.4.2 (patch) | `0c15d66` |
| U2 | vite-kintone-list-button | npm audit fix で 3 vuln 解消 + vite 6.4.1 → 6.4.2 (high) | `a481ee9` |
| U3 | security-next-automation | npm audit fix で 3 vuln 解消 + nodemailer 8.0.4 → 8.0.5 (moderate) | `648ab38` |
| U4 | system | uv 0.11.2 → 0.11.7 (patch / git tracked 外) | (system 直接) |
| U5 | vite-kintone-list-button | postcss + react + react-dom 残 patch | `ab98fbf` |
| U6 | vite-kintone-list-button | autoprefixer 10.4.27 → 10.5.0 (minor / build 検証 OK) | `fc6b9bf` |
| U7 | security-next-automation | rest-api-client + dotenv + @types/node 残 patch | `9c07840` |

**検証実績** (§11-5 段階検証 3 段階遵守):
- npm run build (vite-kintone): ✅ 127 modules / desktop.bundle.js 360KB / 1.85-2.23s
- npm run typecheck (sec-next): ✅ tsc --noEmit type error 0
- npm run lint:customize (root): ✅ 0 errors
- npm run kintone:test (root): ✅ 594/595/626/627 全疎通
- 0 vulnerabilities 維持 (root + 2 subprojects 全件)

---

## ✅ 浜田 sudo 完了 (S1 + S2 / 2026-04-23 22:09-22:11 実施 / AI 検証完了)

**S1 ✅ gh 2.45.0 → 2.91.0** (浜田 22:09 wget + sudo dpkg -i / 14MB / 約 1 分 / AI 検証 22:12):
- `gh --version` → `gh version 2.91.0 (2026-04-22 / 昨日リリース)` ✅
- `gh auth status` → mhamad4968 active / Token scopes (gist + read:org + repo + workflow) 維持 ✅

**S2 ✅ git 2.43.0 → 2.54.0** (浜田 22:11 add-apt-repository ppa:git-core/ppa + sudo apt install / Ubuntu PPA 経由 / 9.6MB / 約 30 秒 / AI 検証 22:12):
- `git --version` → `git version 2.54.0` ✅ (Ubuntu 24.04 PPA latest stable)
- `cd kintone-ai-lab && git status --short` → clean / `git log -1` → 既存 commit 履歴完全認識 ✅

→ **Phase E 全件解消 / 残は M1-M7 浜田判断のみ (5/1 月次レビュー or 5/13 本番後)**

---

## 🚨 浜田 sudo 必要 (S1 + S2 / 4/26 までに) ← 既に解消済 (上記 ✅ 参照)

### S1: gh CLI 2.45.0 → 2.91.0 (46 minor 遅れ)

**重要度**: 中 (セキュリティ修正含む可能性 / GitHub CLI のメジャー機能アップデート多数)

**修復コマンド** (浜田 WSL で実行):

```bash
# 推奨: GitHub 公式 .deb パッケージ直接 install
cd /tmp && wget https://github.com/cli/cli/releases/download/v2.91.0/gh_2.91.0_linux_amd64.deb && sudo dpkg -i gh_2.91.0_linux_amd64.deb && rm gh_2.91.0_linux_amd64.deb

# または: GitHub 公式 apt repository 設定 (一度だけ / 以降は sudo apt upgrade gh で最新化)
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) && \
sudo mkdir -p -m 755 /etc/apt/keyrings && \
out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg && \
cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && \
sudo mkdir -p -m 755 /etc/apt/sources.list.d && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
sudo apt update && sudo apt install gh -y
```

**検証**: `gh --version` → 2.91.0 / `gh auth status` → 認証維持確認

### S2: git 2.43.0 → 2.51.x (Ubuntu PPA)

**重要度**: 低 (Ubuntu 標準は古いが安定 / 最新 git の新機能 (--rebase-merges 等) を使う場合のみ)

**修復コマンド**:
```bash
sudo add-apt-repository ppa:git-core/ppa -y && sudo apt update && sudo apt install -y git
```

**検証**: `git --version` → 2.51.x

---

## 🟡 浜田判断要 (M1-M5 / 5/1 月次レビュー時)

### M1: eslint 9.39.4 → 10.2.1 (major)
- 4/19 v6→v10 アップ → 4/22 v9 ダウン経歴あり (TSB-007 ep1〜5 系列)
- v10 の recommended ルール変更で既存コード 5 件 NG ← 4/21 で経験
- **判断**: 4/26 PC 台帳 customize 完了後 + 5/13 本番運用後の安定期 (5/22 以降) で再検討

### M2: vite 6 → 8 (vite-kintone-list-button)
- 4/26 PC 台帳 customize Day 直前で破壊的変更リスク高
- **判断**: customize 完了後 = 5/13 本番後

### M3: typescript 5 → 6 (vite + sec-next)
- breaking change 多数 (型推論強化で既存コード再修正必要)
- **判断**: M1 と同タイミング (5/22 以降) で一気に評価

### M4: node v24 LTS → v25 切替
- v25 = non-LTS / v26 (今年 10 月 LTS 化予定) を待つほうが筋
- **判断**: 5/22 以降 / または v26 LTS 化時 (2026-10)

### M5: tailwindcss 3 → 4 (vite-kintone-list-button)
- 4/26 customize 直前で UI 破壊リスク
- **判断**: customize 完了後 = 5/13 本番後

### M6 (新規): openai 4 → 6 (sec-next)
- API spec 変更 / security-next-automation の Gemini fallback 影響評価必要
- **判断**: GitHub-Actions/security-next-automation の保守タイミングで判断 (浜田が別 PJ で管理)

### M7 (新規): @types/node 22 → 25 + @types/nodemailer 7 → 8 (sec-next)
- 型変更 / typecheck で影響評価必要
- **判断**: M3 と同タイミング

---

## 🆕 新ツール導入候補 (P2 / 浜田判断 / 5/1 月次レビュー時)

### Tier 1: 即導入推奨 (kintone 開発で効果絶大)
| ツール | 用途 | sudo 必要 | 評価 |
|---|---|---|---|
| **jq** | JSON 整形 / kintone API レスポンス確認 | sudo apt install jq | ★★★★★ (kintone API 開発で必須レベル) |
| **ripgrep (rg)** | 高速 grep / kintone-ai-lab 検索 (現状 grep より 5-10 倍高速) | sudo apt install ripgrep | ★★★★ (codebase 検索改善) |

### Tier 2: 用途あり (確認後導入)
| ツール | 用途 | sudo 必要 | 評価 |
|---|---|---|---|
| **fd** | 高速 find / `find` のモダン代替 | sudo apt install fd-find | ★★★ |
| **bat** | cat++ シンタックスハイライト | sudo apt install bat | ★★★ |
| **fzf** | fuzzy finder / コマンド履歴検索 | sudo apt install fzf | ★★★ (浜田の好み次第) |
| **yq** | YAML 操作 (jq の YAML 版 / GitHub Actions yml 編集時) | snap install yq | ★★ |

### Tier 3: 検討余地 (浜田 use case 不明)
| ツール | 用途 | 評価 |
|---|---|---|
| direnv | .envrc 自動読み込み | ★ (既存 dotenv 設計と整合確認要) |
| starship | shell prompt カスタマイズ | ★ (好み次第) |
| asdf / mise | 多言語 version manager (NVM の上位互換) | ★★ (将来 python / ruby 等を増やすなら) |

---

## 🔮 中長期 (5/22 以降 + 2026 後半)

### MCP 進化候補
1. **fetch MCP 代替検討**: mcp-server-fetch が 1 年メンテ低調 (2025-04-07 以降 release 0)
   - 候補 1: 別 fetch MCP 実装を探す
   - 候補 2: WebFetch (Cursor 標準) で代用 + cron / 月次は curl 直接
   - 判断: 5/1 S14 月次セキュリティ巡回時に評価
2. **追加 MCP 検討**: 4/23 戦略書で言及した「死蔵」候補を再評価 / 新規必要 MCP の発掘 (e.g. brave-search 課金検討 / kagi-search 高品質 / serpapi 等)

### システム進化候補
1. **WSL2 → WSL2 最新カーネル**: 浜田が時々 sudo apt full-upgrade で対応中
2. **Docker / Podman 導入**: kintone customize 環境を container 化検討 (5/13 本番運用後)
3. **GitHub Actions → セルフホスト runner**: コスト + 速度メリット / 浜田 PJ で評価中

### 自作 scripts 進化候補
1. **TypeScript 化**: 29 .mjs → .ts (型安全性 + IDE 補完強化 / 大規模 refactor)
2. **subroutine 分割**: 600 行 space-health-report.mjs 等を機能別ファイル化
3. **lint:scripts 拡張**: 現状 customize/ のみ → scripts/ も lint 対象化

### CLI 進化候補
1. **claude-code (Anthropic CLI)**: 既導入だが活用低 / Cursor との使い分け明文化
2. **cursor-agent CLI**: 既導入 / cron / バッチ用途で活用余地

---

## 📊 §11-2 信頼度ラベル (本戦略書)

- E1-E7 即時実施分: 🟢 100% (実機検証済 / commit 履歴明確 / 0 vuln 達成)
- S1-S2 浜田 sudo 案件: 🟢 100% (修復コマンド精緻化 / 検証手順明示)
- M1-M7 浜田判断: 🟡 90% (実装は別タイミング / 戦略は確定)
- 新ツール導入 (Tier 1-3): 🟡 70% (浜田の use case 確認次第)
- 中長期: 🟠 50% (時期 + 範囲が曖昧 / 5/1 月次レビュー時に再確定)

---

## 🔗 関連
- AGENTS.md §38 (ツール・依存関係の自律保守) / §50-2 (死蔵 MCP 根絶) / §11-5 (3 段階検証) / §51 (並列禁止)
- TSB-007 ep1〜5 (eslint downgrade 経歴 / M1 慎重判断の根拠)
- TSB-013 v1+v2 (uv 関連 / U4 で 0.11.7 update して将来再発警戒)
- TSB-014 (Chrome system deps / S1-S2 と同型 sudo 必要案件)
- TSB-015 (google-search → duckduckgo 入替 / §50-2 死蔵根絶の実例)
- 月次セキュリティ巡回 S14 (5/1 開始) で本戦略書の M1-M7 判断材料を毎月再評価
