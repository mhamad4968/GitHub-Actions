# 🎯 CLI / ツール / 依存進化戦略 v1.1

**制定日**: 2026-04-23 (Thu) 22:00-22:08 (v1.0) / 22:08-22:40 (v1.1 = Phase F 残件処理)  
**契機**: 浜田 21:54 「CLI 等もアップデート進化出来ないかな？」 → 22:14 「残件も済ませよう / 全部しよう / 1 つずつ深く」 → 22:13 「壊れるならやめよう」 (F7+F8 除外)  
**ベース**: AGENTS.md §38 (ツール・依存関係の自律保守) + §50-2 (死蔵 MCP 根絶) + §11-5 (3 段階検証) + §51 (並列禁止) + §47-C (浜田認識不足判断の AI 否定権限 = 本日制定 R8) + §51-2 (浜田 2 つ指示時 AI 1 つずつ確認 = 本日制定 R9)

---

## 🆕 v1.1 追記 (2026-04-23 22:08-22:40 / Phase F 残件処理)

### Phase F 全 11 ステップ実績 (A 案採用 = F7+F8 除外)

| Step | 内容 | 結果 | commit |
|---|---|---|---|
| F1 | M3 typescript 5→6 (sec-next) | ✅ typecheck OK | `792405d` |
| F2 | M7 @types/node 22→25 + @types/nodemailer 7→8 (sec-next) | ✅ 型のみ / typecheck OK | `e5bfbeb` |
| F3 | M6 openai 4→6 (sec-next) | ✅ SDK 未利用で実害ゼロ実証 / typecheck OK | `19b34b2` |
| F4 | M1 eslint 9→10 (root) | ✅ lint:customize 0 errors / TSB-007 ep 系列克服 | `eaef5a4` |
| F5 | T1 jq sudo install (浜田 sudo) | ✅ jq-1.7 / mcp.json query 動作 | (system) |
| F6 | T2 ripgrep sudo install (浜田 sudo) | ✅ rg 14.1.0 / 明示ファイル検索 OK | (system) |
| **F7** | **vite 6→8 (vite-kintone)** | **🚨 除外確定** (4/26 PC 台帳 customize Day 影響リスク高 / 浜田「壊れるならやめよう」判断) | - |
| **F8** | **tailwindcss 3→4 (vite-kintone)** | **🚨 除外確定** (config 大改修 + UI 破壊リスク高 / 同上) | - |
| F9 | M4 node v25 動作検証 (NVM use 試行) | ✅ 全 5 検証 OK (lint / kintone:test / typecheck / health-check 19 active / 切替判断は浜田) | (調査のみ) |
| F10 | P3 fetch MCP 代替調査 | ✅ 公式安定 / 代替不要 / 5/22+ で uvx 化検討 | (調査のみ) |
| F11 | R8 + R9 + 戦略書 v1.1 + 整合化 | ✅ commit `25e52df` (R8+R9) + `966fbff` (RULES-INDEX) | (本) |

### F7 + F8 除外決定の経緯 (R8 §47-C 制定契機)

1. 22:13 私 (AI) が「F7+F8 含む全 update 着手」と宣言 (リスク警告は最終警告として記載)
2. 浜田「最終警告はリスクとか壊れるということ？であればやめよう」 = 自発的訂正
3. 私 (AI) が **A 案 (F7+F8 除外)** に切替 + R8 §47-C を新ルールとして制定 (浜田 22:14 「今後こちらの認識不足で間違えた判断はすべて否定しやめさせてほしい」)

→ F7 + F8 = M2 + M5 と整合 / **5/13 本番運用後 / customize 完了後**に再評価 (戦略書 v1.0 の 🟡 浜田判断要 セクション参照)

### F9 node v25 動作確認結果 (浜田判断材料)

| 検証項目 | v25.8.2 結果 |
|---|---|
| node --version / npm --version | v25.8.2 / npm 11.11.1 |
| lint:customize (root) | ✅ 0 errors |
| kintone:test (root) | ✅ 594/595/626/627 全疎通 |
| typecheck (sec-next / typescript 6 含む) | ✅ type error 0 |
| health-check.mjs (全 MCP probe) | ✅ 正常 19 / 異常 0 / 警告 0 / 全 16 MCP active |

**選択肢** (浜田判断 / 急がず):
- **A**: v25 切替実施 (NVM default を v25 に変更 + crontab PATH 更新 + Cursor 再起動 / 影響範囲広 / 工数 30 分 + リスク中)
- **B (推奨)**: **v24 LTS 維持** (戦略書 v1.0 通り / v25 動作確認は実証データとして保持 / 5/22 以降または v26 LTS 化 (2026-10) 時に再評価)

### F10 fetch MCP 結論

- mcp-server-fetch (Anthropic 公式) は 1 年 release なし = **安定 / 重大バグなし**
- 代替不要 = **現状維持** (python3 -m mcp_server_fetch)
- 改善余地: 5/22+ で `uvx mcp-server-fetch` 化 (auto update + pip 依存削除) 検討
- ライバル: docker 版 / fetch-mcp (typescript) / WebFetch (Cursor 標準) = 緊急性低

### Phase F autonomous 領域 100% 達成

- 即時実施 7 件 (U1-U7) + Phase F 残件 4 件 (F1-F4) + 新ツール 2 件 (F5-F6) + 動作確認 2 件 (F9-F10) = 計 15 件全件完遂
- F7+F8 除外確定 (浜田判断) = M2/M5 として戦略書記録 = やり残し忘れリスク回避
- 残課題: M2 (vite 6→8) + M5 (tailwindcss 3→4) + M4 (node v25 切替判断) = 全部 5/13 本番後 or 5/22+ で再評価

---

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
2. **subroutine 分割**: 大型 `*.mjs` を機能別ファイル化
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
