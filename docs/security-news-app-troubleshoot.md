# 情報セキュリティ関連の kintone 集約が「うまく動かない」とき（631 / 632）

テナントでアプリ名が **「情報セキュリティ関連集約」** のように表示されていても、本リポジトリでは次の **2 アプリ**に分かれていることがほとんどです。

| 役割 | アプリ ID（例） | 何が動くか |
|------|-----------------|------------|
| **ニュースの自動取り込み** | **631** | `collect.ts`（日次・GitHub Actions `daily-collect.yml`） |
| **週次の傾向まとめ** | **632** | `analyze.ts`（週次・別ワークフロー） |

まず **「631 の件か」「632 の件か」「kintone 画面だけの件か」** を分けて考えてください。

---

## 1. 症状で選ぶ（最初の 1 分）

| 症状 | いちばん多い原因 |
|------|------------------|
| **631 に新しい記事が全然増えない** | GitHub Actions が落ちている・Secrets が空・**キーワード選別で 0 件**・RSS が取れない |
| **Actions は成功だが 631 が増えない** | 既に同じ URL が登録済み・**事件性キーワードに合わない**・`COLLECT_MAX_NEW_PER_RUN` で切り詰め |
| **ログに 429 / Quota** | **Gemini の無料枠**（体裁はフォールバックするがログは目立つ）。`GEMINI_MODEL` 変更または時間を空ける |
| **週次の「傾向と対策」が 632 に出ない** | **`analyze` 用トークン・`GEMINI_API_KEY・632 ID** が未設定・429 |
| **kintone で保存・一覧がおかしい** | **フィールドコード**が設計と違う（631 は `title` / `article_url` / `summary` / `digest` 等）。REST とは別問題 |

詳しい環境変数名は **[`security-next-automation/docs/collect-env-settings.md`](../security-next-automation/docs/collect-env-settings.md)** と **[`security-next-automation/README.md`](../security-next-automation/README.md)** が正本です。

---

## 2. 自動収集（631）の確認手順

### 2-1 GitHub Actions

1. リポジトリ → **Actions** → **`security-next-daily-collect`** を開く。
2. **最新の実行**をクリックし、**赤い失敗**ならログ先頭のエラー文を読む。
3. ワークフロー内の **「シークレットが定義されているか」** のステップで  
   `KINTONE_*_defined` が **false** になっていないか確認する。
4. 成功しているのに 631 が増えない場合、ログで次を探す（日本語ログ）:
   - **`[Pipeline] Step: KeywordPick, ToAdd=0`** → **選別で落ちている**
   - **`追加なし。終了。`** → **新規候補なし**または **すべて kintone に既登録**
   - **`Enrichment, Result: N`** ばかり → **Gemini 未使用 or 失敗**（記事自体は入ることがある）

### 2-2 ローカルで同じことを再現（手元に `.env` がある人向け）

リポジトリ **ルート**で（`security-next-automation/.env` を用意済みであること）:

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run security-next:collect
```

- すぐ終了する・日本語で **環境変数不足**と出る → **`security-next-automation/.env`** を  
  `collect-env-settings.md` と照合する。
- **ここでは動くのに Actions だけ失敗** → **Environment `kintone-collect`** の Secrets / Variables が  
  Repository 側と違う・空、を疑う。

### 2-3 キーワードで「全部除外」されている場合

`collect` は **事件性キーワード**が無い／**除外キーワード**があると登録されません。  
正本は **`security-next-automation/src/collect.ts`** の `INCIDENT_KEYWORDS` / `EXCLUSION_KEYWORDS`。

- 運用として「もっと取り込みたい」→ 配列の調整が必要（変更時は README / `.cursor/rules/kintone.mdc` と整合）。

---

## 3. 週次レポート（632）の確認手順

- **`npm run security-next:analyze`**（ルート）または Actions の analyze 系ジョブ。
- **631 にその週のレコードが無い**と対象なしで終了します。
- **Gemini 429** が続く場合は **[`gemini-rate-limit.ts`](../security-next-automation/src/lib/gemini-rate-limit.ts)** で再試行されますが、**日次上限**に達しているときは **`GEMINI_MODEL`** の変更や翌日再実行が必要です（回数の「目安」は README に据えない方針。Google の表示を正とする）。

---

## 4. kintone 側（アプリ設定）

- アプリ ID が **631 以外**に変わっていないか（GitHub の **`KINTONE_APP`** の値と一致）。
- API トークンに **631（＋632 も analyze なら）の「追加」「閲覧」**が付いているか。
- フィールドコードは  
  **`security-next-automation/docs/security-next-news-app-design.csv`**  
  と **`kintone-apps.md`** を参照（推測でコードを書かない）。

---

## 5. それでも分からないとき（エージェント・担当へ渡す情報）

次を **マスクした状態で**コピーできると切り分けが早いです。

1. **どちらのアプリか**（631 / 632 / 両方 / 不明）
2. **GitHub Actions の該当 Run の URL** と、**失敗ステップ名**（成功ならその旨）
3. **ログの抜粋**: `[Pipeline]` 行、`KeywordPick`、`Enrichment`、`[ニュース収集] 登録直前` 付近
4. **直近で手を入れた設定**（Secrets 名だけでよい・値は伏せる）

---

## 運用開始までの実施順（締切あり）

- **[631 を日曜までに回すチェックリスト](631-sunday-go-live-checklist.md)** … ローカル → GitHub → 定時確認の順。

## 参照リンク

- [collect-env-settings.md](../security-next-automation/docs/collect-env-settings.md) … Variables / Secrets 対応表  
- [security-next-automation README](../security-next-automation/README.md) … 運用の地図・パイプライン  
- [kintone-apps.md](../kintone-apps.md) … アプリ ID とフィールドの索引  
