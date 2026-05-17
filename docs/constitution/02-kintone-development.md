# kintone 開発�E�§4〜§8�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: フィールド設計�EREST・チE�Eロイ  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§4〜§8: フィールド整合�E非同期�E一括・エラー表示・チE�Eロイ3点セチE��、E

## ぁE��読む�E�チェチE��リスト！E

- kintone REST
- deploy 剁E
- フィールド追加

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第2章 kintone 開発規紁E

### §4 フィールドコード�E整合性
推測禁止。`kintone-apps.md` また�E `npm run app:fields <ID>` の出力と一致するコード�Eみ使用する、E

**PC台帳スタチE���E�E94 / 595 / 626 / 627�E�を触る前征E*は、`npm run kintone:test`�E�認証と吁E��プリ設定�E読取疎通）と `npm run lint:customize`�E�Ecustomize/` の ESLint�E�を通すことを推奨。`kintone:test` が実際に GET するアプリ ID は **`scripts/kintone-connection-test.js` の `PC_STACK_APPS`**�E�E*既宁E 595 / 627 / 670 E74**、E*594 は除夁E*・移行時のみ **`INCLUDE_LEGACY_APP_594=1`**�E�、E*626 は GAIA 上削除済みのため疎通リストに含めなぁE*、E*594 は削除予宁E*�E�EPEC §1.5�E� E`PC_STACK_APPS` への再追加は **環墁E��数による一時的なみ**とし、リストから恒乁E��に戻す忁E���E **浜田 GO・移行方針に従う**。運用メモは `kintone-apps.md` の「PC台帳まわり�E�E94・595・626・627・668�E��E保守メモ」、E

**本番チE�Eタの作�E・更新・削除めE��プロイに直結すめEnpm**�E�Edeploy:*`、`ops-guide:publish`、`test:e2e:595`、`clear:*:apply`、sync / purge / reset 系など�E��E、E*実行前に利用老E�E管琁E��E��相諁E*すること。一覧は `kintone-apps.md` 冁E��実行前に相諁E��忁E��なコマンド」を参�E、E

**`scripts/backfill-*.js` の取り扱ぁE��E026-04-18 制定！E*: これら�E過去チE�Eタの紐付けを埋めるための **1 度きり用送E*で、既に本番反映済み、E*通常運用では再実行しなぁE*。各ファイルの先頭で実行ガード！EONESHOT_CONFIRM=yes` 忁E��）が動くため、引数なしでは exit code 2 でブロチE��される。`-- --dry-run` は確認用に常時可能、E*再実行が忁E��な場面�E�拠点追加・障害復旧・別環墁E��ら�EチE�Eタ移行など�E�では忁E��利用老E��相諁E*してから本実行すること。詳細は `kintone-apps.md` 冁E��保留中の整琁E��補！E: ワンショチE���E�」を参�E、E

### §5 非同期制御
`async/await` を基本とし、`kintone.events.on` ハンドラは event を正しく return する、E

### §6 一括処琁E�E最適匁E
1件ずつのループ更新をデフォルトにしなぁE��bulkRequest / 褁E��件更新を優先する、E

### §7 エラーの可視化
console だけでなく画面上で利用老E��状況を把握できるようにする、E

### §8 チE�Eロイ持E��の3点セチE��
アプリID・実行コマンド�EアチE�Eロード対象パスを同じ返答�Eに忁E��書く、E

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

