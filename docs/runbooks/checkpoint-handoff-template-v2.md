# Checkpoint / Handoff テンプレ v2 — 正本

> **正本日**: 2026-06-21 JST — AI チーム運用改善 C（浜田 GO）  
> **Lifecycle 上位**: `docs/runbooks/session-lifecycle-v2.md` §6 CLOSE  
> **品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`

---

## 1. 3 ファイルの役割

| ファイル | 役割 | 更新タイミング |
|----------|------|----------------|
| `chat-sessions/checkpoint-latest.md` | **凍結ゾーン**（preamble ≤50 行）— 次の1手・保留・Git | partial / full CLOSE |
| `chat-sessions/handoff-log.md` | **履歴** — `### YYYY-MM-DD` ブロックを末尾追記 | partial / full CLOSE |
| `docs/handoff/latest-session-bridge.json` | **機械引き継ぎ** — gitHead / nextTask / nextFiles | `export-handoff` |

**正本マニフェスト**: `data/cio-handoff-template.json`（version フィールドで改定追跡）

---

## 2. 接続ルール（DeepSeek 盲点① 反映）

```
checkpoint 凍結ゾーン更新 → handoff-log 末尾ブロック追記 → export-handoff → sync-desktop → verify:desktop → (full のみ close-git)
```

| CLOSE 種別 | checkpoint | handoff-log | export-handoff | sync-desktop | close-git |
|------------|------------|-------------|----------------|--------------|-----------|
| **partial** | 必須 | **必須** | 必須 | 推奨 | 任意 |
| **full** | 必須 | **必須** | 必須 | **必須** | 必須 |

**R-SESS-01（2026-06-25 GO）**: `export-handoff` の **直後**・`close-git` の **直前**に `npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync`。逆順禁止。

**skip 禁止**: handoff-log ブロックを省略して checkpoint だけ更新しない。

---

## 3. テンプレートファイル

| ファイル | 用途 |
|----------|------|
| `chat-sessions/templates/checkpoint-freeze-zone.template.md` | 凍結ゾーン骨格 |
| `chat-sessions/templates/handoff-log-block.template.md` | handoff-log 1 ブロック |
| `chat-sessions/templates/HANDOFF-HUMAN-block.template.txt` | 浜田 5 行（任意 prepend） |

**解決ロジック**（盲点②）: `scripts/lib/cio-handoff-template.mjs` → `data/cio-handoff-template.json` の `templateDir` 相対。**フォールバックなし**（無ければ verify NG）。

---

## 4. 凍結ゾーン必須項目

| 種別 | 項目 |
|------|------|
| 見出し | `## クローズ済み` / `## 保留・その他の制約` / `## セッション切替後の自律復元` |
| フィールド | `**最終更新**:` / `**次の1手**:` / `**Git**:` |
| **R736-03**（改 2026-06-25） | セッション締め時、凍結ゾーン内に **`### 本日アクティブ（BUILD/rev — YYYY-MM-DD）`** 表を1つ置き **BUILD/rev** を記載。**`## YYYY-MM-DD` 見出しは禁止**（preamble 検証が壊れる） |
| 行数 | ≤50 推奨（`verify:checkpoint-freeze-zone`） |

**書かない**: `## YYYY-MM-DD` 日付履歴（rollup 対象）

---

## 5. handoff-log ブロック必須キー

```markdown
### YYYY-MM-DD JST — **{タイトル}**

**要約**: …
**次の1手**: …（checkpoint と一致）
**Git**: `{hash}` — …
**GO待ち**: なし | …
**触らない**: …
---
```

**追記コマンド**:

```bash
npm run cio:handoff:append-block -- --title "タイトル" --summary "要約" --git-msg "commit msg"
npm run cio:handoff:append-block -- --dry-run --title "テスト"
```

---

## 6. bridge nextFiles（既定）

`data/cio-handoff-template.json` → `bridgeNextFiles`:

1. checkpoint-latest.md
2. handoff-log.md
3. latest-session-bridge.json
4. session-lifecycle-v2.md
5. push-deploy-quality-gates-v2.md
6. checkpoint-handoff-template-v2.md（本ファイル）
7. mode-b-canonical.mdc

`cio:session:export-handoff` が自動使用。

---

## 7. CLOSE 手順（統合）

### partial（一旦区切り / OK）

1. checkpoint 凍結ゾーン — テンプレ参照で `次の1手` / `Git` 更新
2. `npm run cio:handoff:append-block -- ...`
3. `npm run cio:session:export-handoff`
4. （任意）HANDOFF-HUMAN.txt 先頭 5 行 prepend

### full（締め / お疲れ）

1. 上記 partial 1〜3
2. `npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync`（**R-SESS-01**）
3. `npm run session:clock:clear`（**R-SESS-03**）
4. `npm run cio:session:close-git -- --execute --auto-stage --message "…"`

---

## 8. 検証

```bash
npm run verify:checkpoint-handoff-template
npm run verify:checkpoint-handoff-template -- --strict   # WARN も NG
npm run verify:checkpoint-freeze-zone
npm run verify:session-handoff-integrity -- --strict-staleness
```

**cold-start Phase 3** に template verify 組込み済み。

---

## 9. HANDOFF-AI-FIVE-BLOCKS との関係

|  doc | v2 での位置 |
|------|-------------|
| `HANDOFF-AI-FIVE-BLOCKS.md` | L1 詳細（規律・read-pack）— 毎回不要 |
| 本テンプレ v2 | **CLOSE 時の最小セット**（checkpoint + handoff + bridge） |

---

## 10. 改定ルール

- 必須キー変更 → `data/cio-handoff-template.json` の `version` 更新 → テンプレ 3 ファイル追随
- `verify:checkpoint-handoff-template` を CI / cold-start で通す

---

## 11. レビュー記録（2026-06-21）

| レビュア | 判定 | 反映 |
|----------|------|------|
| DeepSeek | GO | 接続ルール §2、templateDir 解決 §3、manifest version |
