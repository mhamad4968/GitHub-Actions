# 🔮 S12 v2: Windows-side MCP 除外 + dormancy 判定強化

**制定日**: 2026-04-24 (Fri) 朝 Phase Z 第 2 ループで発覚  
**実施予定日**: 2026-05-01 (Fri) 月次レビュー or 5/22 メジャー一括レビュー  
**契機**: 4/24 朝 Phase Z 第 2 ループで S12 が **github + office-powerpoint を dormant 誤検知**  
**対象スクリプト**: `scripts/check-mcp-dormancy.mjs`

---

## 🎯 真因 (発覚経緯)

### 4/24 07:08 第 2 ループで発見

```bash
$ node scripts/check-mcp-dormancy.mjs --json --days=7
{
  "total": 16, "active": 13, "dormant": 2, "deletion_candidate": 0, "disabled": 1
}
# dormant 内訳:
# - github (Windows-side / WSL から疎通不可)
# - office-powerpoint (Windows-side / WSL から疎通不可)
```

### なぜ false positive か

S12 は **WSL 側 (本リポ) の MCP usage log** を読んで「過去 N 日間で何回呼ばれたか」を計測している。  
しかし `github` / `office-powerpoint` は `mcp.json` で **Windows-side 専用** (`platform: "windows"` または `transport: "stdio"` で WSL 経由不可)。  
→ Cursor IDE (Windows) からは活発に使われていても、WSL 側 log は 0 件 → S12 が dormant と誤判定。

---

## 💡 改善案 (3 つの実装方針)

### A 案: mcp.json から Windows-side フラグ読み取り (推奨)

`mcp.json` の各 MCP entry に `_meta.platform` または `_meta.dormancy_exempt: true` フィールドを追加し、S12 が `dormancy_exempt: true` の MCP は **判定対象外** (= "exempt" status / dormancy にカウントせず) として扱う。

```json
{
  "mcpServers": {
    "github": {
      "command": "...",
      "_meta": { "platform": "windows", "dormancy_exempt": true, "exempt_reason": "Windows-side / WSL から疎通不可" }
    }
  }
}
```

### B 案: ハードコード除外リスト

S12 内に `WINDOWS_SIDE_MCPS = ['github', 'office-powerpoint']` を持ち除外。  
A 案より簡素だが、新 MCP 追加時に毎回スクリプト変更が必要。

### C 案: usage log 二重化 (Windows + WSL 両方読む)

Windows 側 Cursor の usage log を C:\Users\... から読み取り、WSL log と合算。  
最も正確だが Windows-WSL ファイル共有経路の信頼性に依存 + 実装コスト大。

---

## 📋 推奨

**A 案 + S12 集計改善** を 5/1 月次レビューで proposal 化:

1. `mcp.json` 編集: 16 MCP の `_meta.dormancy_exempt` 設定追加 (Windows-side 2 件 + disabled 1 件 = 3 件 exempt)
2. `scripts/check-mcp-dormancy.mjs` 改修: `_meta.dormancy_exempt: true` を除外 + 集計 status を 4 区分に拡張 (`active` / `dormant` / `deletion_candidate` / `exempt`)
3. health-check 集計表示: `MCP 死蔵検知` 行に `13/13 active (3 exempt)` のように表示

---

## ⚠ 関連ルール

- §50-2 死蔵 MCP 根絶ルール (R3 / 4/23 制定) との整合: exempt 判定の MCP は「死蔵」ではなく「Windows-side 不可視」として扱う
- §11-5 段階検証: S12 v2 適用後は ① 直接実行 / ② 手動 / ③ 4/25 朝 cron で実証

---

## 📅 スケジュール候補

- **5/1 (Fri)**: 月次レビュー時に S12 v2 を proposal 化 (`docs/approved-changes/2026-05-02/S16-mcp-dormancy-windows-exempt.proposal.json`)
- **5/2 (Sat) 朝 cron**: 自動適用
- **5/3 (Sun)**: 検証 + 結果確認 (5/3 朝の S12 cron 実行で active 13 (3 exempt) 表示確認)

または 5/22 メジャー一括レビュー時にまとめて対応。

---

**起票者**: AI / autonomous mode  
**起票時刻**: 2026-04-24 07:10 JST (Phase Z 第 2 ループで発覚)  
**整合性**: §47 (鵜呑み禁止 / 1 ループ目 ✅ でも 2 ループで真因発見した模範例)  
