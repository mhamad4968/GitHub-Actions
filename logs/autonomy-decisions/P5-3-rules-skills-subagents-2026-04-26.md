# P5-3: Rules / Skills / Subagents タブ 監査結果

**日時**: 2026-04-26 09:30-09:40 JST
**Tier**: A (AI 自律 / 浜田スクショ不要 / readonly 範囲)
**ツール使用**: cursor-guide subagent 1 回 (readonly), Shell grep のみ
**並列**: なし (順次実施 / §51 遵守)

---

## 0. サマリ

7 件の不整合・改善余地を発見 (重大 4 / 中 2 / 低 1)。
P5-9 で AGENTS.md / persist-policies.mdc / .cursorrules / CLAUDE.md / TSB / NEW-SESSION-STARTER に反映。

| ID | 重大度 | 概要 |
|----|-------|------|
| F-1 | 重大 | persist-policies.mdc 法体系図 (§32-§33 まで) が AGENTS.md v23.13 (§57 まで) を反映していない |
| F-2 | 重大 | kintone.mdc が `AGENTS.md §8-3 / §9 / §8-2 / §10` 参照 → どの AGENTS.md か不明 (security-next-automation 用?) |
| F-3 | 重大 | `~/.cursor/rules/` は **公式仕様パスではない** (User Rules は Cursor 設定内部ストア) → 5 ファイル (persist-policies, kintone-javascript, kintone, preflight-checklist, windows-cross-platform) の動作実態が不明 |
| F-4 | 重大 | workspace `CLAUDE.md` (480 行) は `alwaysApply` 無視で **常時注入** + AGENTS.md と内容重複 (Plan of Action / Health Check / 報告テンプレ等) → トークン無駄遣い |
| F-5 | 中 | `~/.cursorrules` (5955 bytes) + `kintone-ai-lab/.cursorrules` (3568 bytes) は **deprecated** だが現役 → Project Rules / AGENTS.md への移行推奨 |
| F-6 | 中 | `~/.cursor/permissions.json` 未設定 → 公式 deny ルール (`Shell(rm)`, `Read(.env*)` 等) を活用していない (現状は §52-8-1 Cursor Hooks のみで防御) |
| F-7 | 低 | preflight-checklist.mdc の `§33-A` / `§34-1` サブ番号が AGENTS.md 現行と整合性要再確認 |

---

## 1. Rules タブ監査

### 1-1. 公式仕様 (cursor-guide 取得 / 一次ソース)

```
出典: cursor.com/docs/rules.md
Project Rules: <workspace>/.cursor/rules/*.{md,mdc} (git 管理)
User Rules:    Cursor Settings 内部ストア (ファイルではない)
Team Rules:    Cursor ダッシュボード (組織横断)
AGENTS.md:     親→子マージで子優先
CLAUDE.md:     alwaysApply 無視で常時注入 (互換性のため)
```

優先順位: **Team > Project > User** (Team が最強)

### 1-2. ローカル現状

| パス | 公式扱い | ファイル数 | 備考 |
|------|---------|-----------|------|
| `kintone-ai-lab/.cursor/rules/` | Project Rules ✓ | 8 | file-copy / kintone系 / security系 / snyk / next-jbis / modern-web |
| `~/.cursor/rules/` | **公式仕様外** ⚠ | 5 | persist-policies, kintone-js, kintone, preflight-checklist, windows-cross-platform |
| `kintone-ai-lab/AGENTS.md` | AGENTS.md ✓ | 1 | 3000+ 行 / §1-§57 |
| `kintone-ai-lab/CLAUDE.md` | 互換読込 (常時注入) ⚠ | 1 | 480 行 / AGENTS.md と重複多数 |
| `~/.cursorrules` | deprecated | 1 | 5955 bytes / legacy |
| `kintone-ai-lab/.cursorrules` | deprecated | 1 | 3568 bytes / legacy |

### 1-3. 発見事項詳細

#### F-1: persist-policies.mdc 法体系図が古い (重大)

`~/.cursor/rules/persist-policies.mdc` 65-91 行目「ルール体系の階層 (法体系図)」:
```
AGENTS.md (憲法 — 最上位)
├── §1-§3   基本原則
├── §4-§8   kintone 開発規約
├── §9-§15  品質保証
├── §16-§18 環境
├── §19-§21 ナレッジ運用 (RAG)
├── §22-§25 MCP 保全
├── §26-§30 WEB 品質
├── §31     成果物納品
├── §32-§33 アーキテクト能力
```

**現行 AGENTS.md (v23.13)**:
- §1-2 (モデル前提), §1-2-3 (Opus 内モデル使い分け), §1-2-4 (クレジット予算管理) ← 図に欠落
- §34-§50 (人間尊重 / 自律 / WORKFLOW / 夕反省 / 朝ルーチン / Critique / Best Options / Insight / MCP 想起) ← 図に欠落
- §50-2 (死蔵 MCP 根絶), §51 (並列禁止), §51-2/3/4/5 (並列受領 / 検知 / 4 軸 / ログ保全) ← 図に欠落
- §52 (自律レベル 2 段階), §52-3 (自己診断 6 問), §52-8 (高リスク shell), §52-8-1 (物理ブロック層) ← 図に欠落
- §54 (自己統治), §55 (セーフモード), §56 (RACI), §57 (改定プロセス) ← 図に欠落

→ P5-9 で法体系図を v23.13 反映に更新

#### F-2: kintone.mdc の AGENTS.md 参照が不明確 (重大)

`kintone-ai-lab/.cursor/rules/kintone.mdc` 内記述:
- L15: 「**AGENTS.md §8-3** を揃える」
- L17: 「**AGENTS.md §9 準拠**」
- L24: 「**AGENTS.md §8-2 参照**」
- L27: 「**AGENTS.md §7 準拠**」
- L34: 「**AGENTS.md §10 準拠**」

これらは **security-next-automation/AGENTS.md** (別リポ) の §番号と推測されるが明示されていない。
kintone-ai-lab/AGENTS.md には §8-3, §8-2, §7, §10 (該当領域) は存在しない。

**リスク**: 浜田/AI 双方が「kintone-ai-lab AGENTS.md の §10 を見ろ」と誤解し迷走する可能性

→ P5-9 で kintone.mdc の参照を **明示** (例: 「**security-next-automation/AGENTS.md §10 準拠**」)

#### F-3: ~/.cursor/rules/ は公式仕様外 (重大)

cursor-guide 公式回答 (1.1 節):
> **重要な誤解の訂正**: ご質問の `~/.cursor/rules/*.mdc` は **公式仕様には存在しません**。
> User Rules は「Cursor の設定として」保存され、ファイルシステム上の `~/.cursor/rules/` ディレクトリにはなりません。

しかし `~/.cursor/rules/` には 5 ファイルが実在:
1. persist-policies.mdc (8081 bytes / 4/26 06:24 更新)
2. kintone-javascript.mdc (15911 bytes / 4/16 22:09)
3. kintone.mdc (2390 bytes / 3/28 22:29)
4. preflight-checklist.mdc (2683 bytes / 4/18 13:35)
5. windows-cross-platform.mdc (1892 bytes / 4/14 20:05)

**仮説**: 過去の Cursor バージョンで実装されていた / 個人の独自ディレクトリ / 実際は読み込まれていない (確認必要)

**確認方法案**:
- (a) Cursor IDE で「設定 → Rules」を開き、これら 5 件が "User Rules" として表示されているか
- (b) 浜田にスクショ依頼 (cf. P5-5)
- (c) 試験的に `~/.cursor/rules/test-marker.mdc` を作って Cursor が読み込むか実測

→ P5-9 で AGENTS.md / NEW-SESSION-STARTER に「`~/.cursor/rules/` は公式仕様外 / 動作実態不明」と注記
→ 中長期的には **AGENTS.md (workspace) または Project Rules (`.cursor/rules/`) へ移行** 推奨

#### F-4: CLAUDE.md が AGENTS.md と重複しつつ常時注入 (重大)

cursor-guide 公式回答 (1.6 節):
> **CLAUDE.md の隠れ常時適用**: `alwaysApply: false` を意図しても、ファイル名が `CLAUDE.md` だと無視されて毎回注入される。

`kintone-ai-lab/CLAUDE.md` (480 行) の内容と AGENTS.md の重複:
| CLAUDE.md セクション | AGENTS.md 重複 § |
|---------------------|------------------|
| 自律サイクル / Plan of Action | §52 (Tier A/B), §47 (Critique), §48 (Best Options) |
| Health Check / 環境整合性 | §46 (朝ルーチン), §50 (MCP 想起) |
| 黄金 3 ステップ報告 | §37 (簡潔報告) |
| ナレッジ化 / Lessons Learned | §21 (知見フィードバック) |
| 一時ファイル整理 | §31 (成果物納品プロトコル) |
| PR 前セルフチェック | §11 (修復後検証義務) |

→ **トークン無駄遣い** (毎セッション 480 行 + AGENTS.md 3000+ 行 + ~/.cursor/rules/ 5 件 ≈ 5000-7000 行 注入)

**対応案 (P5-9 で議論)**:
- (A) CLAUDE.md を「AGENTS.md への索引のみ」に縮小 (50 行以内)
- (B) CLAUDE.md を `.gitignore` (ローカル参考用に降格)
- (C) CLAUDE.md を完全削除 (内容を AGENTS.md / persist-policies.mdc に統合済を確認)
- (D) 現状維持 (浜田判断)

#### F-5: legacy .cursorrules が現役 (中)

deprecated だが Cursor は現在も読み込む。内容は実用的:
- `~/.cursorrules`: 役割 / 応答速度 / 思考 / 形式 / 精度 / 実行バイアス / セキュリティ / 言語 (62 行)
- `kintone-ai-lab/.cursorrules`: kintone 共通開発ルール (`utils/kintone-common.ts` 等)

→ P5-9 で「Project Rules または AGENTS.md への段階的移行」を計画

#### F-6: ~/.cursor/permissions.json 未設定 (中)

公式機能 (`~/.cursor/permissions.json`) で `Shell(rm)`, `Read(.env*)`, `Write(**/*.key)` 等の deny ルールを定義可能だが未使用。

現状は §52-8-1 Cursor Hooks (`dangerous-shell-blocker.sh`) で代替しているが、**併用すれば二重防御強化**:
- Cursor Hooks: shell 実行直前に bash 正規表現で判定 (柔軟)
- permissions.json: Cursor IDE 公式機能で deny (確実)

→ P5-9 で「permissions.json 案」検討 (Day 4 後 / 浜田判断)

#### F-7: preflight-checklist.mdc § 番号整合性 (低)

参照されている §:
- §33-A: AGENTS.md §33 (外部知見の検証) は存在 / 「-A」suffix の有無未確認
- §34-1: AGENTS.md §34 (人間尊重) は存在 / 「-1」suffix の有無未確認
- §14, §15, §41, §0: 整合性確認済

→ P5-9 で AGENTS.md の §33/§34 直下を確認し、suffix が一致しなければ更新

---

## 2. Skills タブ監査

### 2-1. 現状

| パス | 公式扱い | 件数 | 備考 |
|------|---------|------|------|
| `~/.codex/skills/` | 互換読込 ✓ | 62 (全件 trailofbits-*) | Trail of Bits 公式 / 信頼ソース |
| `~/.cursor/skills-cursor/` | IDE 同梱 (Cursor 公式) | 12 | babysit, canvas, create-hook, create-rule, create-skill, create-subagent, migrate-to-skills, shell, split-to-prs, statusline, update-cli-config, update-cursor-settings |
| `~/.cursor/skills/` | 公式 user パス | **未使用** | カスタムスキル未配置 |
| `~/.agents/skills/` | 公式 user パス | **未使用** | カスタムスキル未配置 |
| `kintone-ai-lab/.cursor/skills/` | Project Skills | **未使用** | プロジェクト固有スキル未配置 |

### 2-2. 安全性

- trailofbits-* 62 件: セキュリティスキルなので「rm -rf / sudo / force」を含む description あり (検出対象として記載 / 実行ではない)
- skills-cursor 12 件: Cursor IDE 同梱 / 安全
- カスタムスキル: 未配置 = サプライチェーンリスク 0

→ **特記事項なし**。kintone 関連でカスタムスキル化したい候補があれば Day 4 後に検討。

### 2-3. 改善案 (P5-9)

カスタムスキル候補:
- `kintone-app-create`: 新規アプリ作成手順 (Day 1-3 PC 台帳開発で繰り返した型)
- `kintone-form-fields-add`: add-form-fields の引数組立 (Day 4 で手動 + 検証スクリプト併用予定)
- `kintone-revision-snapshot`: revision-snapshot.mjs の起動 (新規)

---

## 3. Subagents タブ監査

### 3-1. 現状

| パス | 公式扱い | 件数 | 備考 |
|------|---------|------|------|
| `kintone-ai-lab/.cursor/agents/` | Project Subagents | **未使用** | カスタム subagent 未配置 |
| `~/.cursor/agents/` | User Subagents | **未使用** | カスタム subagent 未配置 |
| ビルトイン | Cursor 公式 | 3 | explore, bash, browser |

カスタム subagent 0 件。Task tool での委任は cursor-guide / explore / generalPurpose 等のビルトイン経由。

### 3-2. 安全性

- カスタム subagent 0 件 = `description` 経由のプロンプトインジェクションリスク 0
- ビルトイン 3 件は Cursor IDE が管理 / 安全

### 3-3. 改善案 (P5-9 / Day 4 後)

カスタム subagent 候補 (readonly: true 必須):
- `kintone-spec-verifier`: 仕様 markdown vs 実 form fields の照合 (field-spec-diff.mjs を呼ぶ)
- `daily-morning-prep-runner`: 朝ブリーフィング自動実行 + 結果サマリ
- `audit-parallel-watcher`: parallel-session-detector.mjs の継続実行

---

## 4. 横断的安全推奨設定 (公式)

cursor-guide §4 より:
| 対策 | 設定箇所 | 現状 |
|------|---------|------|
| 機密ファイルを Agent から隠す | `.cursorignore` | ✅ 実装済 (R-2 / 86 行) |
| シェル / MCP / ファイル R-W の許可制御 | `~/.cursor/permissions.json` | ❌ 未実装 (F-6) |
| Workspace Trust 強制 | `settings.json` `"security.workspace.trust.enabled": true` | ❓ 未確認 |
| Auto-Run / "Run Everything" の禁止 | Cursor Settings → Agent | ✅ 実装済 (TSB-019 で保護) |
| 第三者ルール / スキル / subagent の差分レビュー | CODEOWNERS + PR レビュー | ❓ 未確認 |
| Team Rules の Enforce 利用 | ダッシュボード | N/A (個人プラン) |

→ P5-4 (Indexing & Docs) と P5-9 で `Workspace Trust` / `CODEOWNERS` を確認

---

## 5. 次工程 (P5-4 へ)

P5-3 完了。次は P5-4 (Indexing & Docs タブ監査):
- `.cursorignore` 検証 (Q-3-2 で作成済)
- RAG ingest 範囲確認
- Workspace Trust 設定確認
- CODEOWNERS 有無確認

P5-3 で発見した F-1〜F-7 は **P5-9 で AGENTS.md / persist-policies.mdc / .cursorrules / CLAUDE.md / TSB / NEW-SESSION-STARTER に反映** する (commit/push 含む)。

## 6. ステータス

- [x] cursor-guide MCP 公式仕様取得
- [x] ローカル設定実体調査 (Rules 5+8+1+1=15 件 / Skills 62+12 件 / Subagents 0+ビルトイン3)
- [x] 7 件の発見事項記録
- [ ] P5-9 で反映 (commit/push) → P5-4/P5-5 完了後にまとめて実施
