# 明日ブリーフィング前 — CIO 準備メモ（2026-05-12 向け）

> CEO 浜田承認: **反省7案すべて**＋前回の **アップデート案4点**。本ファイルは **朝のブリーフィング／項番 -0 前**に CIO が一読する。

---

## 1. 承認済み改善案 — リポ反映状況（2026-05-11 夜）

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | 「変わらない」→ **次ターンで `location.href`／`?` 以降**を CIO が聞く | **read-pack `14-READ-06.txt`** に追記済み（運用ルール） |
| **A2** | 一覧検索デバッグ `localStorage.npl674debug=1` または hash **`npl674debug=1`** | **`customize/new-pc-ledger-v1/desktop.js`** 実装済み・**本番 deploy 済**（`BUILD` **`2026-05-11-pc-ledger-index-search-debug-localstorage`**・fileKey **`8804a8a8-7512-475c-a2f9-5fcfc084a21b`**・rev **177**）。検証後は **`localStorage.removeItem('npl674debug')`** を推奨 |
| **A3** | §4.8c ポインタ read-pack | **14-READ-06.txt** に §4.8c・デバッグ手順を記載済み |
| **B1** | ターン冒頭 3 秒メモ・ツール直前 §1 | **運用**（チャット）。read-pack と **`.cursor/rules/session-handoff.mdc`** で想起 |
| **B2** | `session-handoff.mdc` 冒頭に §1 自書き義務 | **追記済み** |
| **B3** | 報告前 `npm run cio:chat-report-selfcheck` | **運用**（報告・締め・GO 仰ぎターン） |
| **B4** | 90 分／大 deploy ごとミニ締め | **推奨運用**（CEO 任意） |

**DeepSeek 突合（A2）**: デバッグは **本番でも有効化し得る**ため、**運用手順で「検証後は localStorage を削除」**を徹底する旨を CIO が案内する。

---

## 2. 明日の本題（予告）— TOTO 予想ツール改修

- **場所（ワークスペース外）**: `C:\Users\mhamada202408224\Desktop\TOTO予想\`（Python: `toto_*.py` 等）。**副次リポ**の可能性: `~/toto-prediction`（`AGENTS.md` 記載と整合するなら **当該 Git で commit/push**）。
- **改修要件の正本（浜田 Desktop）**: `C:\Users\mhamada202408224\Desktop\totoアプリ改修案.txt`（**自動取得・1〜5 の分析反映・戦略モードは AI 自動選択・人手の戦略選択 UI は不要**、xG／コンテキスト／ポアソン／アンサンブル＋支持率／窓関数 等）。
- **明日の進め方（CIO 案）**:
  1. **第 0 手**: `totoアプリ改修案.txt` と `Desktop\TOTO予想` の **README／エントリ（`toto起動.bat`）**を Readし、**現状パイプライン**を 1 枚に図示。
  2. **§50-3-8**: DeepSeek に **データ取得の法的・robots・レート制限**を含む短問 → 約 3 行突合。
  3. **段階実装**: まず **データ自動取得の安定化** → 次 **特徴量（xG 代替 or soccerdata）** → 最後 **アンサンブル＋支持率**。一括は **スコープ過大**のため **浜田に週次マイルストーン確認**（§41）。
  4. **動作確認**: **浜田依頼時のみ**目視（CEO 指示どおり）。

---

## 3. 朝イチ CLI（推奨）

```text
npm run verify:desktop-ai-emergency-sync
npm run session:bootstrap
```

（`SESSION_STARTER_DESKTOP_DIR` を付けた Windows では先に `session-starter:sync-desktop`。）
