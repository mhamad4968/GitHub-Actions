# 本日の対応まとめ — 2026-06-03（JST）

> Desktop: **`19-SESSION-ONE-REPORT-2026-06-03.md`**（sync 正本）  
> 締め正本: **`chat-sessions/SESSION-CLOSE-REPORT-20260603.txt`**

---

## 1. 本日完了

| # | 内容 | 結果 |
|---|------|------|
| 1 | **Apple ID kintone** — DB **693** / ダッシュ **694** 作成・deploy | Space 21 — **浜田 OK** |
| 2 | Excel **icloud** シート移行・重複行（iPhone+iPad）対応 | **251 件**登録（jbis.039〜933 **プール895件削除**） |
| 3 | ダッシュ UI — 採番バナー・新規作成・ソート・印刷・平文PW表示 等 | BUILD **`2026-06-03-apple-id-dash-no-toolbar-new`** rev **13** |
| 4 | 次採番 **`jbis.039@icloud.com`**（POST 起点・未割当プール廃止） | バナー **「新規作成」** で運用 |
| 5 | **資格取得ロードマップ PPTX** — 4枚目人事説明＋区分見直し | **ver.03** — **浜田 OK** |

---

## 2. Apple ID（運用サマリ）

| 項目 | 内容 |
|------|------|
| DB | [693 Apple ID管理台帳用DB](https://jbis-kintone.cybozu.com/k/693/) — 閲覧のみ |
| ダッシュ | [694 Apple ID管理台帳](https://jbis-kintone.cybozu.com/k/694/) — CRUD・廃止・削除・印刷 |
| 正本 SPEC | `docs/plans/2026-06-02-apple-id-kintone-spec.md` |
| app IDs | `scripts/data/apple-id-app-ids.json` → `{ dbAppId: 693, dashAppId: 694 }` |
| スケジュール | **6/4** kintone のみ運用・**Excel 削除**（runbook 未実施） |

---

## 3. 資格ロードマップ PPTX（確定）

| 項目 | 内容 |
|------|------|
| 正本 | `C:\tmp\資格取得ロードマップ\システム推進室_資格取得ロードマップver.03（方針説明付き）.pptx` |
| 必須 | 基本情報技術者／情報セキュリティマネジメント |
| 推奨 | 建設業経理士2級／第二種電気工事士／応用情報技術者 |
| 任意 | NWスペシャリスト／ITストラテジスト／情報処理安全確保支援士 |
| 方針 | 業務=OJT メイン／資格=通信講座等で日々研鑽／応用情報=**9年目あたり** |

---

## 4. 凍結（変更なし）

- 業務改善 kintone **customize/deploy** — **6/8 まで着手しない**
- Apple ID は **Space 21 独立レーン**

---

## 5. Git / リポ

| 項目 | 状態 |
|------|------|
| Apple ID 実装 | ローカル変更あり（**本締め時点 commit 未実施** — 浜田判断） |
| kintone-apps.md / scripts / customize | 693/694 追記済（ワークツリー） |

---

## 6. 夕反省（2026-06-03 全 GO）

`docs/reports/2026-06-03-evening-reflection.md` — **P1–P8 全 GO** → runbook / SPEC / JSON 反映済
