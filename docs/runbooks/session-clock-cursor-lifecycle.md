# 壁時計 × Cursor ライフサイクル（CEO 運用 2026-05-17）

> **方針**: **Cursor を閉じたら止める**／**Cursor を開いたら自動で動かし URL を見せる**

---

## 自動（hooks）

| タイミング | hook | 動作 |
|------------|------|------|
| **Cursor 起動 / 新 Composer セッション** | `sessionStart` → `session-start-autopilot.mjs` | 残骸 watch/web 停止 → `session:clock:set` → watch 起動 → **web 起動** → **`additional_context` に URL** |
| **Cursor 終了 / セッション終了** | `sessionEnd` → `session-end-autopilot.mjs` | `session:clock:clear` → watch/web 停止（**R21**: `manual-desktop` / `trialPaused` 時は **skip**） |

**R21（浜田 GO 2026-06-13）**: `.cio/session-clock-mode.json` で `mode: manual-desktop` または `trialPaused: true` のとき、**Composer 終了だけでは stopAllClock しない**。Cursor **完全終了**または Desktop `壁時計_STOP.bat`。

---

## 試験フラグ trialPaused（R25 — 浜田 GO 2026-06-13）

| 項目 | 内容 |
|------|------|
| 目的 | PS フラッシュ原因切り分け（壁時計 vs handoff） |
| 設定 | `.cio/session-clock-mode.json` → `"trialPaused": true`, `"mode": "manual-desktop"` |
| 試験中 | **Desktop `壁時計_START.bat` 禁止** / hook は壁時計を触らない |
| 終了条件 | 浜田が **PS フラッシュ再現なし** を 1 セッション確認 |
| 昇格 | R21 恒久化済み → **R22**（taskkill 化）適用 → `trialPaused: false` に戻す |
| 禁止 | 試験フラグを **commit せず締める**（F4 → R24） |

正本切り分け: `docs/runbooks/windows-spawn-flash-triage.md`

ログ: `logs/session-start-hook.log` / `logs/session-end-hook.log`

---

## 手動運用（Desktop bat — 2026-05-31 浜田）

**背景**: hook 自動起動で CMD/PowerShell が一瞬表示される場合がある。  
**方式**: `.cio/session-clock-mode.json` → `"mode": "manual-desktop"` で **hook は壁時計を起動しない**。

| 操作 | ファイル |
|------|----------|
| **起動** | Desktop **`壁時計_START.bat`**（VBS 経由・node 完了まで **待機**） |
| **停止** | Desktop **`壁時計_STOP.bat`** または Cursor 終了（sessionEnd） |

初回配置: `npm run session:clock:install-desktop-bat`  
更新間隔: 既定 **10 分**（`.cio/session-clock-mode.json` の `watchMs`）

**運用フロー**

1. Cursor を開く（hook は MCP stamp 等のみ — **壁時計は動かない**）
2. Desktop **`壁時計_START.bat`** をダブルクリック  
   - `[1/4]` 整理 → `[2/4]` 時刻セット → `[3/4]` watch/web → `[4/4]` **WEB 応答待ち → ブラウザ自動表示**  
   - bat ウィンドウは **ブラウザが開くまで** 残る（完了メッセージ後 3 秒で閉じる）
3. ブラウザで経過表示（任意）
4. 作業終了 → Cursor 終了 **または** `壁時計_STOP.bat`

---

## 手動（hook 無効・トラブル時）

```bash
npm run session:clock:stop   # clear + watch/web 停止
npm run session:clock:set    # 開始時刻をいまに
npm run session:clock:web    # 前景で web（ログに URL）
```

URL 正本: `logs/session-clock-web.url`（web 起動後）

---

## 浜田 CEO

- **起動後**: hook が **ブラウザを自動で開く**（Windows）。チャットの `additional_context` にも URL が出る
- **終了時**: Cursor を通常終了すれば **自動停止**。強制 kill で hook が走らない場合は次回起動時に残骸を掃除してから再開

### トラブル: ポート枯渇

- シェルに **`SESSION_CLOCK_WEB_PORT=48000`** が残っていると 48000 帯だけ試して失敗しやすい。**hook は 47931 固定**（環境変数を無視して起動）
- 手動復旧: `npm run session:clock:stop` → 再び Cursor を開く

---

## 実装

- `scripts/lib/session-clock-process.mjs`
- `scripts/session-clock-web.mjs`（`logs/.session-clock-web.pid` / `.url` 書込）
- `.cursor/hooks.json` の `sessionStart` / `sessionEnd`
