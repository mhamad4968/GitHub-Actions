# WEB フロント品質�E�§26〜§30�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: UI・a11y・性能  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§26〜§30: 視覚検診・a11y・性能・レスポンシブ�E診断タイミング、E

## ぁE��読む�E�チェチE��リスト！E

- UI 変更
- customize 画面
- アクセシビリチE��

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第8章 WEB フロントエンド品質�E�E026-04-15 制定！E

本章は §15�E�コード�E完�E度基準）を WEB フロントエンド向けに具体化したも�Eである、E
HTML/CSS/JS でユーザーに直接触れる画面を作るとき、以下を遵守する、E

### §26 視覚的自己検診�E�Eisual Self-Audit�E�E
UI を変更したら、E*Playwright MCP** で以下�E検証を行い、結果をユーザーに報告すめE
1. **スクリーンショチE��撮影**: `browser_navigate` ↁE`browser_take_screenshot`�E�EC 幁E1280px + モバイル 375px の最佁E2 サイズ�E�E
2. **レイアウト崩れ確誁E*: 撮影画像を AI 自身が視覚的に確認し、意図しなぁE��レ・はみ出し�E重なりがなぁE��判定すめE
3. **コンソールエラー確誁E*: `browser_console_messages` で JS エラー・警告がゼロであること

修正前後でスクリーンショチE��を比輁E��、「変えたつもりがなぁE�Eに変わった箁E��」を検�Eした場合�E即座に報告する、E

### §27 ユニバーサル・チE��インの義務化�E�アクセシビリチE���E�E
公開すめEHTML は **WCAG 2.1 AA** を目標水準とし、以下を数値で検証する:
1. **axe-core 診断**: `browser_evaluate` で axe-core を実行し、violations 数を報告。critical/serious は **0 件** が忁E��、E
2. **コントラスト毁E*: チE��ストと背景の比率ぁE**4.5:1 以丁E*�E�大斁E���E 3:1 以上）であることを確誁E
3. **セマンチE��チE�� HTML**: `<div>` の乱用より `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` 等�EネイチE��ブ要素を優先（§13 と相乗！E
4. **キーボ�Eド操佁E*: Tab キーですべてのインタラクチE��ブ要素に到達でき、フォーカスが視覚的に刁E��ること
5. **`aria-label` / `alt`**: 画像�Eアイコンボタンには忁E��代替チE��ストを付与すめE

診断には `mcp-accessibility-scanner`�E�ECAG 自動診断�E�また�E Playwright MCP の `browser_snapshot`�E�アクセシビリチE��チE��ー取得）を使用する、E

### §28 パフォーマンスの基準値
- **初回表示�E�ECP�E�E*: 2 秒以冁E��社冁E��ントラ環墁E��提！E
- **DOM 完亁E*: 3 秒以冁E
- **バンドルサイズ**: 単一 HTML の場合、インライン JS/CSS 込みで **500KB 以丁E* を目安とする
- 計測は `browser_evaluate` で `performance.timing` を取得するか、ブラウザ DevTools プロトコルを利用

### §29 レスポンシブ設計�E義勁E
- **ブレイクポインチE*: 最佁E2 段階（モバイル ≤900px / PC�E�を `@media` で対忁E
- **横スクロール禁止**: 吁E��レイクポイントで水平スクロールバ�Eが�EなぁE��と
- **タチE��ターゲチE��**: モバイル表示でボタン・リンクの最小サイズは **44ÁE4px**

### §30 WEB 品質診断の実行タイミング
以下�Eタイミングで §26-§29 の検証を実施する:
- **UI 変更晁E*: HTML/CSS を修正した直征E
- **チE�Eロイ剁E*: 受け渡しパチE��ージ作�E剁E
- **定期**: 月�Eの RAG 再インチE��クスと合わせて

検証結果は以下�E形式で報告すめE
```
【WEB品質レポ�Eト、E
- スクリーンショチE��: PC ✁E/ モバイル ✁E
- コンソールエラー: 0件
- axe-core violations: critical 0 / serious 0 / moderate N
- コントラスト毁E 最佁EX.X:1�E�基溁E.5:1�E�E
- レスポンシチE 横スクロールなぁE✁E
```

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

