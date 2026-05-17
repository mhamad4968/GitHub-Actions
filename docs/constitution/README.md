# 憲法�Eルール  Eジャンル別読本�E�EI 向け�E�E

**目皁E*: `AGENTS.md`�E�紁E1,700 行）を **ジャンルごとに刁E��**し、タスクに応じて忁E��な部刁E��けを読む、E 
**§ 番号の正本**: 変更・解釈�E引き続き **`AGENTS.md`**。本チE��レクトリは **読みめE��ぁE��ラー**�E�Enpm run constitution:extract-genres` で再生成）、E

---

## AI の読み方�E�推奨頁E��E

1. **入口�E�常時！E*  E`.cursor/rules/cio-constitution.mdc`�E�薄型�E毎ターン四行！E
2. **状況索弁E*  E`RULES-INDEX.md`�E�「今どの §�E�」を 1 行で特定！E
3. **ジャンル本斁E*  E下表のファイルめE**1、E 本だぁE* Read�E��E斁E��読しなぁE��E
4. **正本確誁E*  E疑問・Tier B・[BREAKING] 時�E `AGENTS.md` の該彁E§ めERead

```text
タスク受頁E
  ↁERULES-INDEX�E�索引！E
  ↁEdocs/constitution/<ジャンル>.md�E��E割読本�E�E
  ↁEAGENTS.md §N�E�忁E��なときだけ正本�E�E
```

---

## ジャンル一覧

| ファイル | 冁E���E�章�E�E| ぁE��読む |
|----------|------------|----------|
| [00-preamble.md](00-preamble.md) | 前文・体系図・レーン刁E�� | 初回・迷ったとぁE|
| [01-fundamentals.md](01-fundamentals.md) | 第1章 §0〜§3・モチE��・正本 | **毎タスク開姁E* |
| [02-kintone-development.md](02-kintone-development.md) | 第2章 §4〜§8 | kintone 実裁E�EチE�Eロイ |
| [03-quality-engineering.md](03-quality-engineering.md) | 第3章 §9〜§15 | 品質・戦略転揁E|
| [04-environment-security.md](04-environment-security.md) | 第4章 §16〜§18 | WSL・mcp.json・秘寁E|
| [05-knowledge-rag.md](05-knowledge-rag.md) | 第5、E章 §19〜§21・RAG | ドキュ・検索 |
| [06-mcp-disaster-recovery.md](06-mcp-disaster-recovery.md) | 第7章 §22〜§25 | MCP 障害 |
| [07-frontend-web-quality.md](07-frontend-web-quality.md) | 第8章 §26〜§30 | UI・a11y |
| [08-deliverables-architecture.md](08-deliverables-architecture.md) | 第9、E0章 §31〜§33 | 納品・調査 |
| [09-human-autonomy-reporting.md](09-human-autonomy-reporting.md) | 第11章 §34〜§41 | 報告�E§41 一啁E|
| [10-session-operations.md](10-session-operations.md) | 第12章 §42〜§46 | セチE��ョン刁E��・朁E|
| [11-professional-judgment.md](11-professional-judgment.md) | 第13章 §47〜§49 | 批判・褁E��桁E|
| [12-mcp-usage.md](12-mcp-usage.md) | 第14章 §50 系 | **MCP 選抁E* |
| [13-parallel-session.md](13-parallel-session.md) | 第15章 §51 系 | 並列禁止・時訁E|
| [14-self-governance-safemode.md](14-self-governance-safemode.md) | 第18、E9章 | セーフモーチE|
| [15-raci-responsibility.md](15-raci-responsibility.md) | 第20・16章 Tier/RACI | **Tier A/B** |
| [16-amendment-process.md](16-amendment-process.md) | 第21章 §57 | 憲法改宁E|

---

## Cursor ルール�E�Emdc�E�との関俁E

| 層 | 役割 |
|----|------|
| `cio-constitution.mdc` | **唯一の alwaysApply 核**�E�四行�EDesktop 正本�E�E|
| `every-turn-rules-confirm.mdc` | 毎ターン儀式�E全斁E|
| `mcp-server-use-triggers.mdc` 筁E| **glob 別**の追加想起 |
| `docs/constitution/*.md` | **AGENTS の刁E��読本**�E�長斁E��減らす！E|

---

## そ�E他�E正本

| ファイル | 役割 |
|----------|------|
| `WORKFLOW.md` | 変更の Phase 0、E |
| `CLAUDE.md` | 薁E��エントリ |
| `kintone-apps.md` | アプリ ID・BUILD の真宁E|
| `docs/plans/2026-05-17-constitution-restructure.md` | 本整琁E�E計画・今後�E改訁E|

---

## メンチE��ンス

```powershell
# AGENTS.md 改定征E 再抽出 ↁEPhase2 要紁E��丁EↁE検証
npm run constitution:extract-genres
npm run constitution:enhance-phase2
npm run constitution:verify-coverage

# 4 正本ミラー�E�任意！E
npm run rag:mirror:canonical-docs
```

`manifest.json` に最終生成時刻とファイル一覧あり、E
