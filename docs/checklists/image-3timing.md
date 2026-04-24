# 🖼 画像表示系修正の 3 タイミング動作確認チェックリスト（§11-4 準拠）

**制定**: 2026-04-25 (Sat) / B-3 タスク / §11-4（2026-04-22 制定）の正式雛形化
**根拠 TSB**: TSB-009（FAQ ポータル blob URL 4 箇所バグ）/ TSB-010（FAQ ポータル dangling reference 4/21-22 潜在）

---

## 🎯 使い方

`Lightbox` / `blob URL` / `<img src=>` / `URL.createObjectURL` / `URL.revokeObjectURL` / D&D 添付プレビュー 等の **画像表示系修正** は、**3 タイミングすべて** で動作確認するまで完成宣言不可。

> 重要原則: **「投稿前 OK ≠ 投稿後即時 OK ≠ リロード後 OK」**
> Chrome 92+ の blob URL セキュリティ制限 + dangling reference 問題で、片方だけテストすると残り 2 つで TSB 級バグが潜伏する。

---

## 📋 チェックリスト本体（コピペして利用）

```
## 🖼 §11-4 画像 3 タイミング動作確認レポート

**修復対象**: <FAQ ポータル / 申請フォーム / その他>
**修復内容**: <例: window.open(blob:...) → Lightbox 化>
**触ったブラウザ API**: <URL.createObjectURL / blob: URL / dataURL / HTMLImageElement / etc>

### ① 投稿前（プレビュー画像クリック）

- [ ] 状態: ローカルで生成した blob URL がまだ有効（送信ボタン押下前）
- [ ] 動作: 画像クリック → 拡大表示
- [ ] 期待結果: 拡大表示成功 / Esc で閉じる / ⬇ でダウンロード可
- [ ] 実機テスト時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] console エラー有無:
  ```text
  <なし / または 1-3 行抜粋>
  ```

### ② 投稿後即時（送信成功直後 / リロード前）

- [ ] 状態: 投稿成功 → 画面再描画されたが、blob URL がまだ DOM 内に残っている
- [ ] 動作: 画像クリック → 拡大表示
- [ ] 期待結果: 拡大表示成功（dangling reference 起こさない）
- [ ] 実機テスト時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] console エラー有無:
  ```text
  <なし / または "Failed to load resource: net::ERR_FILE_NOT_FOUND" 等の決定的 1-3 行>
  ```
- [ ] **特に注意**: ② は **TSB-010 の発生地点**。① と ③ だけ見ると ② で潜在 → ある日突然「画像が消える」の症状で発覚する。

### ③ リロード後（F5 後 / 別セッション開き直し後）

- [ ] 状態: 投稿された画像が永続化（HTTP URL / kintone 添付 URL 等）に変わっている
- [ ] 動作: 画像クリック → 拡大表示
- [ ] 期待結果: 拡大表示成功 / 画像が永続 URL から読み込まれる
- [ ] 実機テスト時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] Network タブで読み込み URL 確認:
  ```text
  <例: https://<sub>.cybozu.com/k/api/blob/file?... 等>
  ```

### 🎯 完了判定

- [ ] ① ② ③ **すべて ✅** で初めて「治った」と宣言可
- [ ] 1 タイミングでも ⚠️/❌ なら **TSB v2 候補**として真因再追跡 + 雛形埋め直し
- [ ] **§11-2 信頼度ラベル**: 3 タイミング完遂で 🟢 100% / 部分なら 🟡 70% 以下を申告
- [ ] **§47 鵜呑み禁止**: 「投稿前で動いたから後も動くはず」を信じず、3 タイミング実証
```

---

## 🚨 過去の失敗パターン（教訓）

### TSB-009（2026-04-21 / blob URL 4 箇所バグ）

- 症状: 「画像をドロップで貼り付けるとエラー」と部署メンバーから報告
- 真相: `scripts/faq-portal-full.html` の **4 箇所** で `window.open(this.src, '_blank')` で blob URL を新規タブ表示しようとしていたが、**Chrome 92+ のセキュリティ制限** で blob: URL の新タブ表示はブロックされる仕様
- 修正: 共通関数 `openImageLightbox(src, alt)` を新設（黒オーバーレイ + 拡大画像 + Esc 閉じ + ⬇ ダウンロード）。同一ページ内表示なので blob: でも http: でも安全
- 教訓: **Chrome 92+ 仕様変更を知らず標準 API（`window.open`）を信頼した結果、4 箇所同時バグ**。`§13 ネイティブ／標準優先` の例外として **「blob 表示は同一ページ Lightbox / dataURL 化 / 正規 URL のいずれかを使う」** を恒常知識化

### TSB-010（2026-04-21〜22 / dangling reference 潜在）

- 症状: 4/21 から夜まで「画像クリックで `ERR_FILE_NOT_FOUND` + console に `Not allowed to load local resource: blob:http://...`」が潜在
- 真相: 投稿成功後 → 画面再描画 → blob URL が revoke されたのに DOM に残った状態 = **タイミング ② を確認していなかった** ため 4/21 から潜在 → 4/22 21:00 表面化
- 教訓: **投稿前 OK だけでなく、投稿後即時の dangling reference も必ず確認する**。これが本チェックリスト ② を作った直接の動機

---

## 🔧 ブラウザ API 早見表（誤用しがちなパターン）

| API / 動作 | 落とし穴 | 安全な書き方 |
|---|---|---|
| `URL.createObjectURL(blob)` | revoke 忘れ → メモリリーク / revoke 早すぎ → dangling | 表示中は revoke しない / unmount で revoke |
| `URL.revokeObjectURL(url)` | revoke 後の参照 → ERR_FILE_NOT_FOUND | revoke は描画完全終了後に呼ぶ |
| `window.open(blob:..., '_blank')` | **Chrome 92+ でブロック** (TSB-009 の真因) | 同一ページ Lightbox / dataURL / 正規 URL に変換 |
| `<img src="blob:...">` | revoke で 404 表示 | `<img src>` 削除後に revoke |
| D&D `event.dataTransfer.files[0]` | iframe 跨ぎで permission denied | parent 側で受信 → postMessage で child へ |
| HEIC / HEIF 直接表示 | iOS 以外で表示不可 | サーバ側 JPEG 変換 or canvas 経由 |

---

## 📚 関連ドキュメント

- `AGENTS.md §11-4` 画像表示系修正の 3 タイミング動作確認義務
- `AGENTS.md §11-2` 信頼度ラベル必須化（4 段階）
- `AGENTS.md §13` ネイティブ／標準優先（blob URL は例外パターン）
- `docs/troubleshooting.md` TSB-009 / TSB-010
- `docs/checklists/3stage-fix-verification.md` 修復系の段階的検証 3 段階（§11-5 連動）
