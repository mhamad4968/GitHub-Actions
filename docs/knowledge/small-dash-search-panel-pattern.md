# 小規模 kintone dash — 検索パネル最小パターン（R66）

**参照実装**: App **696** `customize/shared-mail-dash/desktop.js`（BUILD `2026-06-21-696-search-panel`）  
**起源**: App **674** `§4.8a`（チップ + datalist + URL 復元）

## いつ使う

- 全件を **クライアント側**で読み込む台帳（〜数百件）
- kintone 標準 `query` URL 連携は **不要**

## 最小セット

| 要素 | 696 の実装 |
|------|------------|
| パネル枠 | `.smd-search-panel` 灰背景 + タイトル行 |
| キーワード | `<input list=…>` + **空白区切り AND** |
| datalist | 入力 prefix に応じて既存レコードから候補（最大 80） |
| 状態チップ | トグルボタン（例: 利用中 / 廃止） |
| 種別チップ | トグル（例: 共有 / 個人） |
| 部署 | `<select>` または datalist（正本: `vpn-account-depts.json`） |
| 件数 | `表示 N / 全 M` + 現条件サマリ |
| クリア | 初期フィルタに戻す |
| URL | `?smd696kw=` 等（アプリ固有 prefix） |

## 674 から **入れない**もの（小規模向け）

- kintone `query` / `order by` URL 連携  
- リスト一覧作成モーダル  
- サーバー側ページングキャッシュ

## 新規 dash チェックリスト

1. `BUILD` 定数 + deploy  
2. 検索 state を 1 オブジェクトに集約  
3. `filteredRecords()` を単一正本に  
4. 所属並びは `jbis-display-sort`（R68）  
5. SPEC § UI に検索仕様 1 行
