# Windows spawn 一瞬フラッシュ — 切り分け（R32）

**制定**: 2026-06-13（浜田 GO）  
**目的**: F5 再発防止 — **handoff / 壁時計 / Desktop sync を口頭混同しない**

---

## 原則

1. **仮説は 1 本ずつ** — 同時に「引継ぎが原因」「壁時計が原因」と言わない  
2. **試験 → 観察 → 修正** — runbook 手順なしの推測回答禁止  
3. **経路差を疑う** — `npm run X` 成功 × orchestrator 失敗 = spawn 経路差（F8）

---

## 手順（順序固定）

### Step 0 — 試験モード確認

```powershell
Get-Content .cio/session-clock-mode.json
```

| 状態 | 意味 |
|------|------|
| `trialPaused: true` | 壁時計試験停止中 — **Desktop START.bat 使わない** |
| `mode: manual-desktop` | hook は壁時計を起動しない — STOP は bat または Cursor 完全終了 |

### Step 1 — 観察（浜田）

- **いつ**フラッシュするか: Composer 終了 / Cursor 終了 / sync 実行 / 締め commit  
- **Notepad** が 24/25 `.md` を開いていないか（C2）

### Step 2 — hotpath 機械確認

```powershell
npm run verify:win-hidden-spawn-hotpaths
npm run desktop:sync-and-verify
```

| 結果 | 次 |
|------|-----|
| verify NG | 静的 hotpath 欠落 → `scripts/lib/win-hidden-spawn.mjs` |
| sync NG・直叩き OK | **経路差** — R29 runtime smoke 参照 |
| 両方 OK だが UI フラッシュ | Step 3 へ |

### Step 3 — 原因マップ（1 つに絞る）

| タイミング | 疑う経路 | 正本 |
|------------|----------|------|
| sessionEnd | export-handoff / stopAllClock | `.cursor/hooks/session-end-autopilot.mjs` |
| desktop sync | precheck の Notepad カウント | `desktop-ai-emergency-sync-precheck.mjs` |
| 壁時計 STOP | PS 掃除 | `session-clock-process.mjs` → **R22 taskkill 化** |
| close-git 連鎖 | runNpmScriptSync | `cio-session-close-git.mjs` |

### Step 4 — 報告フォーマット（AI → 浜田）

```
【切り分け結果】
観察: （Step 1）
機械: verify=… / sync=…
単一原因: （1 行）
次の修正: （R ID または file 1 件）
```

**禁止**: 「handoff も壁時計も怪しい」だけで終える。

---

## 関連

- `docs/runbooks/session-clock-cursor-lifecycle.md`（R21/R25）
- `npm run verify:win-hidden-spawn-hotpaths`（R29 runtime smoke 内包）
