# 一気通貫メンテ・プレイブック

スペース 48（Security NEXT ニュース・週次要約）および関連自動化を、調査から検証・記録まで一連で行うときの手順です。  
**正準**: リポジトリ直下の [`AGENTS.md`](../AGENTS.md) および [`kintone-apps.md`](../kintone-apps.md)。

---

## フェーズ 0 — 開始・スコープ

1. **メンテ対象**を宣言する（例: アプリ 631 / 632、GitHub Actions `security-next-*`）。
2. **本番データを壊さない**こと。テストレコードを作る場合は削除手順までセットで計画する。
3. **シークレット**は `.env` / GitHub Environment `kintone-collect` のみ。チャットやログに貼らない。

---

## フェーズ 1 — 構造調査（アプリ・フィールド）

1. [`kintone-apps.md`](../kintone-apps.md) の表と実アプリを突き合わせる。
2. **631（ニュース）**のフィールド正本: `security-next-automation/src/lib/field-codes.ts` および `security-next-automation/docs/security-next-news-app-design.csv`。
3. **632（週次要約）**のフィールド正本: 同 `field-codes.ts` の `REPORT_FIELDS` および `security-next-automation/docs/security-next-weekly-report-app-design.csv`。
4. ローカルでフィールド一覧を取る場合（管理者 Basic 認証が `.env` にあるとき）:

   ```bash
   npm run app:fields 631
   npm run app:fields 632
   ```

---

## フェーズ 2 — ヘルスチェック（API）

REST で **アプリ設定の取得**ができることを確認する（トークンに各アプリの「アプリ管理の閲覧」相当が含まれること）。

```bash
# ルート .env に KINTONE_DOMAIN と API トークン（COLLECT または TOKEN）を置いたうえで:
npm run report:space-health
```

- **既定の検査対象**: アプリ **631**・**632**（ポータル URL は `https://jbis-kintone.cybozu.com/k/631/` および `/k/632/`）。
- 追加 ID を検査するとき: `SPACE_HEALTH_APP_IDS=631,632,594` のようにカンマ区切りで指定。

**GitHub Actions**: ワークフロー `space-health-report.yml` が同スクリプトを実行し、ジョブサマリーに Markdown を出力する。

**スペース 48 ポータル自動反映**: `KINTONE_SPACE_HEALTH_SPACE_ID` が設定され、HTML に `<!-- JBIS_SPACE_HEALTH_AUTO_START -->` … `END` マーカーがあるとき、ジョブ成功後に **マルチスレッドなら** [スペースの本文を更新する API](https://cybozu.dev/ja/kintone/docs/rest-api/spaces/update-space-body/) 、**シングルスレッドなら** [スレッド更新 API](https://cybozu.dev/ja/kintone/docs/rest-api/spaces/update-thread/) で上書きする。手順の細部は `kintone-apps.md` の「システムヘルスチェック」節。

---

## フェーズ 3 — 自動化（collect / analyze）の確認

1. **collect**: `security-next-automation` の `npm run collect`（または Actions `security-next-daily-collect`）。ログの `登録完了`・`gemini=` を確認。
2. **analyze**: `npm run analyze`（または `security-next-kintone` の analyze）。632 への **新規または同一 `target_week` の更新**・`summary_one_line` / `internal_*` を確認。
3. **Gemini / kintone 404** が出たら [`security-next-automation/src/lib/format-news-gemini.ts`](../security-next-automation/src/lib/format-news-gemini.ts) の `GEMINI_MODEL_FALLBACKS` と Secrets の `GEMINI_API_KEY` を確認。
4. **631 の拡張（未実装）**: [`phase2-631-collect-improvements.md`](phase2-631-collect-improvements.md) と **AGENTS.md 収集ガードレール**。

---

## フェーズ 4 — 実装変更・リファクタ

1. **最小差分**（依頼範囲外のリファクタ禁止）。
2. TypeScript の変更後は `npm run typecheck --prefix security-next-automation`。
3. カスタマイズ JS を触る場合は既存の `npm run deploy:*` 手順と ESLint に従う（[`AGENTS.md`](../AGENTS.md) 参照）。

---

## フェーズ 5 — 動作検証・記録

1. フェーズ 2 の `report:space-health` が **終了コード 0** であること。
2. 必要なら Actions を `workflow_dispatch` で手動実行。
3. **アプリ一覧・URL・フィールド変更があれば [`kintone-apps.md`](../kintone-apps.md) を更新**する。
4. 大きな構成変更があれば本プレイブックまたは `security-next-automation/README.md` に一言追記する。

---

## フェーズ 6 — 終了

1. 変更を `main` にマージ（または PR）。
2. 関係者が参照できる場所（スペース 48 の掲示方針に従い）に結果を共有。

---

## 実施記録（コピー用）

| 日付 | 実施者 | 対象 | 結果（ヘルス / collect / analyze） | 備考 |
|------|--------|------|-------------------------------------|------|
| YYYY-MM-DD | | 631,632 | | |
