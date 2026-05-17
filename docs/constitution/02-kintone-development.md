# kintone 開発（§4〜§8）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: フィールド設計・REST・デプロイ  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`---

## 30秒要約（Phase 2）

§4〜§8: フィールド整合・非同期・一括・エラー表示・デプロイ3点セット。

## いつ読む（チェックリスト）

- kintone REST
- deploy 前
- フィールド追加

## 条文本文（AGENTS 抽出・削除禁止）

> 以下は `AGENTS.md` からの抽出コピー。**省略・削除しない**。解釈疑義は `AGENTS.md` 正本。

## 第2章 kintone 開発規約

### §4 フィールドコードの整合性
推測禁止。`kintone-apps.md` または `npm run app:fields <ID>` の出力と一致するコードのみ使用する。

**PC台帳スタック（594 / 595 / 626 / 627）を触る前後**は、`npm run kintone:test`（認証と各アプリ設定の読取疎通）と `npm run lint:customize`（`customize/` の ESLint）を通すことを推奨。`kintone:test` が実際に GET するアプリ ID は **`scripts/kintone-connection-test.js` の `PC_STACK_APPS`**（**既定: 595 / 627 / 670–674**。**594 は除外**・移行時のみ **`INCLUDE_LEGACY_APP_594=1`**）。**626 は GAIA 上削除済みのため疎通リストに含めない**。**594 は削除予定**（SPEC §1.5）— `PC_STACK_APPS` への再追加は **環境変数による一時的なみ**とし、リストから恒久的に戻す必要は **浜田 GO・移行方針に従う**。運用メモは `kintone-apps.md` の「PC台帳まわり（594・595・626・627・668）の保守メモ」。

**本番データの作成・更新・削除やデプロイに直結する npm**（`deploy:*`、`ops-guide:publish`、`test:e2e:595`、`clear:*:apply`、sync / purge / reset 系など）は、**実行前に利用者・管理者と相談**すること。一覧は `kintone-apps.md` 内「実行前に相談が必要なコマンド」を参照。

**`scripts/backfill-*.js` の取り扱い（2026-04-18 制定）**: これらは過去データの紐付けを埋めるための **1 度きり用途**で、既に本番反映済み。**通常運用では再実行しない**。各ファイルの先頭で実行ガード（`ONESHOT_CONFIRM=yes` 必須）が動くため、引数なしでは exit code 2 でブロックされる。`-- --dry-run` は確認用に常時可能。**再実行が必要な場面（拠点追加・障害復旧・別環境からのデータ移行など）では必ず利用者と相談**してから本実行すること。詳細は `kintone-apps.md` 内「保留中の整理候補（B: ワンショット）」を参照。

### §5 非同期制御
`async/await` を基本とし、`kintone.events.on` ハンドラは event を正しく return する。

### §6 一括処理の最適化
1件ずつのループ更新をデフォルトにしない。bulkRequest / 複数件更新を優先する。

### §7 エラーの可視化
console だけでなく画面上で利用者が状況を把握できるようにする。

### §8 デプロイ指示の3点セット
アプリID・実行コマンド・アップロード対象パスを同じ返答内に必ず書く。

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

