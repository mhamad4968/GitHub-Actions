# kintone カスタマイズ — IME と datalist / サジェスト（2026-08-11）

> 夕反省 T4 / R4 / RULE-1。実害例: App 674 一覧キーワードで `ma` → `mあ`（Chrome + datalist 更新中の composition）。

## 方針

1. `compositionstart` で `<input list="…">` の **list 属性を外す**（または更新を停止）
2. composition 中は input ハンドラで **datalist option 再生成をしない**
3. `compositionend` で list を戻し、必要なら1回だけ更新
4. Enter 送信は `isComposing` / composition 中なら無視

## 禁止

- IME 変換中に `datalist.innerHTML` 差し替えや option 全消し
- composition を無視した debounce 即時再描画

## 参照実装

`customize/new-pc-ledger-v1/desktop.js`（BUILD `2026-08-11-674-search-ime-datalist` 以降の keyword search）
