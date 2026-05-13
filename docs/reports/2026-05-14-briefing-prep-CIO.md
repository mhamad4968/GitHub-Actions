# 明日ブリーフィング前 — CIO 準備メモ（2026-05-14 向け）

> CEO 浜田承認: **2026-05-14 夕反省の A1〜A6 すべて**。**本題は PC 台帳（674）**。TOTO は **`docs/AI_HANDOFF.md` で一時停止**。

---

## 1. 本日の確定（674）

| 項目 | 内容 |
|------|------|
| 個人 JBIS | 廃棄以外の個人 `pc_name` から **1 から最小空き番**（`pc_name` 空のみ・登録済み名は不変更） |
| 共有 S-JBIS | 同様の空き若番。**671** M365 取得クエリ修正済 |
| 購入 | `purchase_amount` / `purchase_vendor` / `purchase_vendor_other`、フォーム rev **197** |
| customize | **BUILD** `2026-05-14-purchase-fields-visibility`、rev **196** 付近 |
| 誤一括振り直し | 一度実施→ログ復元。**一括スクリプトは `--ack-rebatch-existing-jbis-names` 必須** |

浜田 CEO **購入欄 OK**。動作確認は **依頼時のみ**（`docs/runbooks/pc-ledger-674-hamada-ui-verify-jbis-purchase.md`）。

---

## 2. 承認済みアップデート案 A1〜A6 — 反映状況

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | `kintone-apps.md` 674 行に BUILD/rev・採番・購入を追記 | **実施済**（2026-05-14 夜） |
| **A2** | `checkpoint-latest` / `handoff-log` / Desktop read-pack 維持 | **実施済**（`session-starter:sync-desktop` + verify） |
| **A3** | customize 変更前 **DeepSeek 盲点 1 問＋約3行突合** | **read-pack `14-READ-06.txt` 2026-05-14 追補** |
| **A4** | 全応答 **§1 四行**・締め **§M-2 七行** | **read-pack + `session-handoff.mdc` 継承**（チャット運用） |
| **A5** | 浜田依頼時の **3 点目視**チェックリスト | **`docs/runbooks/pc-ledger-674-hamada-ui-verify-jbis-purchase.md`** |
| **A6** | 674 関連 **Git commit** | **`2a32e06`**（674 関連 16 ファイル） |

---

## 3. 前回ブリーフィング課題の整理

| 課題 | 扱い |
|------|------|
| **TOTO 予想改修**（`2026-05-12-briefing-prep-CIO.md` §2） | **一時停止**（`docs/AI_HANDOFF.md`）。本題は **674** |
| **674 一覧検索・§4.8c**（A1〜A3 2026-05-11） | **read-pack 済**・本番 rev **177** 以降。本日は **採番・購入**が主 |
| **§1 / §M-2 毎ターン**（B1〜B3） | **2026-05-14 セッションは不十分**→ A4 追補で次セッションからフル |
| **O-5 クレジット監視**（handoff-log） | **2026-05-14 JST 課金日を通過**（`npm run credit:status` **2026-05-14 深夜 CIO**）: 直近消費 **76%**（2026-05-06 記録）🟡・**次回リセット 2026-06-14**（残 31 日）・On-Demand cap **$1000**。**本番 deploy / Max Thinking 多用は朝に再確認** |
| **浜田目視** | **依頼時のみ**（チェックリスト 1 枚化済） |

---

## 4. 朝イチ CLI（推奨）

```text
npm run verify:desktop-ai-emergency-sync
npm run session:bootstrap
npm run credit:status
```

（Windows Desktop 同期は `SESSION_STARTER_DESKTOP_DIR=C:\Users\mhamada202408224\Desktop\AI緊急用` で `session-starter:sync-desktop`。）

---

## 5. 次の1手（CIO）

1. read-pack **09→** と `checkpoint-latest` 先頭 **2026-05-14** を読む。
2. **674 本番 deploy**・**REST `--apply`**・**JBIS 一括振り直し**は **浜田 GO 後のみ**（`cio:preflight:674` → `deploy:674`）。
3. 浜田から目視依頼があれば runbook **§1〜3** を実施し証跡を残す。

## 6. CIO 深夜自律締め（2026-05-14・浜田就寝中）

- **実施**: `credit:status`・Desktop **`session-starter:sync-desktop` + `verify:desktop-ai-emergency-sync`**・作業用 `_tmp-*.mjs` 削除・本節追記。
- **未実施（意図的）**: 674 **deploy**・kintone **apply**・浜田 **目視**・JBIS 一括 **`--apply`**（いずれも GO／依頼待ち）。
