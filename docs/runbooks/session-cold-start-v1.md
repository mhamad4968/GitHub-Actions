# セッション cold-start v1 — 統合立ち上げ

> 正本: 2026-06-20 JST — 朝報未作成・入口分散・毎回手直しの再発防止

## 問題（なぜ毎回手直しが起きたか）

1. **朝報**: WSL cron 06:00 は PC オフ/スリープで動かない → `cio:quick-health` が verify-only で NG → warn して続行のみ
2. **入口分散**: `cio:morning:ready` / `cio:session:start` / `session:bootstrap` が別々で、preflight（task-scores・bridge）が抜ける
3. **陳腐化**: `spec-task-scores.json` と checkpoint のズレで `verify:session-handoff-integrity` が NG

## 解決（1 本化）

```bash
npm run cio:session:cold-start
```

### 状態遷移

```
MORNING → PREFLIGHT → ROLLUP → QUICK-HEALTH → BOOTSTRAP → IMPORT → READY
```

| Phase | 内容 |
|-------|------|
| MORNING | 当日 `*-morning-prep.md` 無ければ **fast 生成**（1〜3 分） |
| PREFLIGHT | `cio:task:score-spec` + 必要時 `export-handoff` |
| ROLLUP | checkpoint rollup + export + integrity + closure |
| QUICK-HEALTH | 朝報 ensure + kintone:test + guard:check |
| BOOTSTRAP | `session:bootstrap`（憲法・desktop sync・smoke 15） |
| IMPORT | `verify:session-handoff-integrity --import` |

### オプション

| フラグ | 意味 |
|--------|------|
| `--skip-bootstrap` | bootstrap を省略（朝だけ整えたい） |
| `--skip-rollup` | checkpoint rollup 省略 |
| `--full-morning` | fast ではなく **フル朝報**（5〜8 分）を強制生成 |

## 朝報の二段構え

| モード | コマンド | 所要 | 用途 |
|--------|----------|------|------|
| **fast** | `npm run morning:ensure -- --fast` | 1〜3 分 | セッション開始時（kintone:test + lint + 軽量監査） |
| **full** | `npm run morning:ensure` | 5〜8 分 | cron 06:00 / 週次フル確認 |

レポート先頭に `MORNING_PREP_MODE: fast|full` マーカーを埋め込み（形式ドリフト検知用）。

**fast で失敗すると止まる項目**: `kintone:test` / `lint:customize`（exit 2）

## 従来コマンドとの関係

| 旧 | 新 |
|----|-----|
| `cio:morning:ready` + 手動 bootstrap | **`cio:session:cold-start`** |
| `cio:session:start` | preflight 追加済み。統合は cold-start 推奨 |
| `cio:quick-health` NG 時手動 ensure | **自動** fast 生成に変更 |

## Windows 06:00 二重化（任意）

WSL cron に加え、PC ログオン時/毎朝の Task Scheduler:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-morning-task-windows.ps1
```

- タスク名: `kintone-ai-lab-morning-prep`
- ロック: `logs/morning-prep/.morning-prep.lock`（二重起動防止・35 分 stale）

## 壁時計 trialPaused

`.cio/session-clock-mode.json` で `trialPaused: true` のとき、bootstrap の cron strict は **意図的にスキップ**（`session-clock-health.mjs`）。

## 参照

- `scripts/lib/cio-session-preflight.mjs`
- `scripts/cio-session-cold-start.mjs`
- `.cursor/skills/kintone-session-bootstrap/SKILL.md`
