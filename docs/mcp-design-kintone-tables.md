# kintone 表・ダッシュの配色／レイアウト — デザイン系 MCP の使い方

**目的**: 一覧・集計・Excel 準拠レイアウトなど **kintone customize（`desktop.js` + CSS）** を作るとき、**推測ではなくトークンと数値**で色・余白・階層を決める。CIO 依頼（2026-05-04）で **Figma 公式 remote** と **`@colorsandfonts/mcp`** を追加し、**Kimi / DeepSeek** で役割分担を確認済み。

**前提**: これらはすべて **Cursor 上の設計・コード生成補助**（本番画面を MCP がリアルタイムに書き換えるわけではない）。実装後の **WCAG・DOM** は **Playwright** / **accessibility-scanner** で検証する。

---

## サーバの役割（棲み分け）

| ツール | いつ使うか |
|--------|------------|
| **Figma MCP**（`figma`） | **Figma のフレーム／変数が正**のとき。レイアウト、コンポーネント階層、デザイントークンを構造化で取り込み、`desktop.js` の DOM/CSS に写経する。 |
| **colors-fonts**（`@colorsandfonts/mcp`） | **まだ Figma が無い**、または **パレット案とコントラスト数値**だけ欲しいとき。5 色パレット・モノクローム階調・スタイル（corporate / muted 等）・**Figma トークン JSON** 出力。 |
| **accessibility-scanner** | 実装後の **ページ単位の a11y 監査**（ブラウザ前提）。パレット段階の数値チェックは colors-fonts でも可。 |

**DeepSeek 相談メモ**: 3 つは **補完**。**CSS 変数の「定義の正」は一つに決める**（例: Figma 変数名を正とし、colors-fonts は候補出し・コントラスト検証に限定）とブレにくい。

---

## 推奨ワークフロー（表を新規／改修）

1. **ブランド／部門色のたたき台**  
   `colors-fonts` で `generate_palette`（スタイルと任意 `baseColor`）→ 出力 CSS または JSON をメモ。
2. **コントラスト**  
   ヘッダ背景／帯／文字色の組み合わせごとに `check_contrast`（同 MCP）。表の **小さな文字**は AA 以上を意識。
3. **Figma がある場合**  
   フレーム URL（`node-id=` 付き推奨）をプロンプトに貼り、Figma MCP で **間隔・フォント・色変数**を確認 → `desktop.js` のテーブル用クラスに反映。
4. **実装**  
   kintone の DOM 制約（`.recordlist-` 系など）に合わせてセレクタを当てる（詳細は各アプリ SPEC）。
5. **検証**  
   本番相当環境で **Playwright** または **accessibility-scanner**（必要なら両方）。

---

## 設定の所在

- **グローバル**: `~/.cursor/mcp.json` に **`figma`**（`url`）と **`colors-fonts`**（`npx` **絶対パス** + pin バージョン）を追加済みなら、どのワークスペースでも利用可能。
- **本リポ**: `.cursor/mcp.json` に同様のエントリあり（**他端末では `command` の Node パスを自分の環境に合わせる**こと）。**Cursor 再起動**後、MCP 一覧で緑を確認。
- **Figma 初回**: OAuth／プラグイン手順は **`docs/mcp-design-figma.md`**。

---

## 変更履歴

- 2026-05-04: 初版（Figma + colors-fonts + kintone 表ワークフロー／CIO×Kimi×DeepSeek）。
