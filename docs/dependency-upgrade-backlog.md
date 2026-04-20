# 依存関係アップデート — 保留課題（今後検討）

**目的**: `npm outdated` / `npm audit` で**あえて未実施**とした項目を、チャットに頼らず追跡する。対応するときは **`RULES-INDEX.md` に日付＋1 行**で結果を残す。

**最終見直し**: 実施のたびに本ファイルを更新（完了した行は打ち消し線または「済」と日付）。

---

## 1. ESLint 10 系へのアップグレード

- **現状**: ルートは `eslint` **^9.39.4**、`@eslint/js` **^9.39.4**。`npm outdated` では **eslint 10** / **@eslint/js 10** が Latest。
- **未実施理由**: **メジャー**のため、フラット設定・ルール互換・プラグインの対応を確認してから。
- **検討時の作業**: リリースノート確認 → `npm run lint:customize` および必要なら設定ファイルの移行 →問題なければ `package.json` 更新。

---

## 2. `globals` のメジャー上げ（例: 15 → 17）

- **現状**: `globals` **^15.15.0**。Latest は **17.x**。
- **未実施理由**: ESLint 9 環境との組み合わせ・推奨バージョンを確認してからにしたい。
- **検討時の作業**: ESLint 公式・`eslint.config` の推奨に合わせて段階的に。

---

## 3. `npm audit` の `tmp` 経由（low ×5）と `--force`

- **現状**: `tmp <=0.2.3` が `@kintone/customize-uploader` → `@inquirer/prompts` 経由で間接依存。**`npm audit fix --force`** は **@kintone/customize-uploader を 8.0.13 に下げる**案内になる（破壊的）。
- **未実施理由**: デプロイ用 uploader の**意図しないダウングレード**を避けるため。
- **検討時の作業**: **@kintone/customize-uploader** の新リリースで `tmp` / `@inquirer` チェーンが解消されていないか定期確認。解消後に `npm update` と `npm audit` を再実行。それまで **low はリスク許容**として運用するか、組織ポリシーに応じて判断。

---

## 4. `security-next-automation` のメジャー候補（参考）

- **openai** Latest **6.x**（現状 4.x 系）— API 変更の確認が必要なため未触手。
- **typescript** Latest **6.x**（dev は ^5.8、解決 5.9 系）— ルート `typescript` ^6 との整合を取りつつ別タスクで検討。

---

## 関連

- 随時更新の方針: ルート **`CLAUDE.md`「ツール・依存関係・MCP のバージョン（随時アップデート）」**
- 実施ログ: **`RULES-INDEX.md`**
