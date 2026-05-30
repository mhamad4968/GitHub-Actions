# 週末自律監査プロトコル（実装凍結・CEO 不在）

**制定**: 2026-05-29  
**適用**: **土日** — 実装レーン凍結中（Q36 GO 前 customize/deploy 禁止）  
**非置換**: §50-3-11 / §35-1 — **監査のみ**（本番変更なし）

---

## 前提条件

| 項目 | 必須 |
|------|------|
| 曜日 | 土曜 or 日曜（JST） |
| 主導 | **CIO**（必要時 **Opus 4.8** L3 — `cio-opus48-intelligence-activation.md`） |
| 第2者 | **DeepSeek** §50-3-8 1問（監査スコープ盲点） |
| 禁止 | customize/** 編集・deploy:*・本番 PUT |

## 実行手順

### Phase 0 — 着手前

1. DeepSeek: 「週末監査で見落としうる依存・セキュリティ盲点3点」
2. 突合3行をチャット記録

### Phase 1 — 機械スキャン（CIO 自律）

```bash
npm run cio:weekend:autonomous-audit
```

生成物: **`docs/plans/<YYYY-MM-DD>-weekend-health-audit.md`**

### Phase 2 — 追加（任意・軽量）

```bash
npm run verify:cio-mcp-registry
npm run verify:mcp-four-ai-alignment
npm audit --omit=dev
```

### Phase 3 — 月曜提出準備

- レポート先頭に **1 行サマリ**（OK/NG 件数）
- NG は **是正案1行**付き（自動 commit しない — 月曜 CEO GO 後）

## 禁止事項

- 週末の **独自判断**での customize/deploy
- 監査レポートなしの月曜「問題なし」宣言
- npm audit だけで **§50-3-11 代替**とみなすこと

## 判定コード

| 状態 | 条件 |
|------|------|
| **exit 0** | `cio:weekend:autonomous-audit` 成功 + レポートファイル存在 |
| **exit 1** | verify 赤 — レポートに NG 記載・月曜 CEO へ報告 |
| **月曜第1手** | レポート Read → CEO 1 行要約 |

## bridge 動的連動（2026-05-30 追補）

週末監査起動時、`docs/handoff/latest-session-bridge.json` を自動ロードし、**nextFiles** に対し eslint-mcp / repo-tree 監査対象として記録する。成果は **`docs/plans/2026-05-29-weekend-health-audit.md`** の **【監査詳細セクション】** へマージ追記。

## Self-Healing（将来布石・2026-05-30 GO）

| 条件 | 許可 |
|------|------|
| 週末監査中に **L2 以下・構文のみ** エラー検出 | Composer 2.5 が Diff 生成・適用可 |
| 仕様意味変更 | **禁止** |
| コミット | 先頭 **`[WEEKEND-SELF-HEALING]`** 必須 |
| 追跡 | 月曜 CEO が 100% 目視可能 |

**禁止**: Self-Healing で customize/deploy 本番反映（Q36 GO 前凍結維持）。

## 関連

- `docs/runbooks/cio-friday-mcp-status-refresh-4ai.md`（金曜定例）
- `docs/runbooks/cio-opus48-intelligence-activation.md`（L3 深検証）
