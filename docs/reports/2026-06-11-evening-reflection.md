# 2026-06-11 — AI 失敗とルール更新案（最終）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | サブテーブル内ドロップダウンに ASCII 短コード（`bi` / `app` 等）→ **CB_VA01** 連発 | 選択肢キー **日本語**に統一。仕様・fields.json 明記 |
| F2 | 既存サブテーブルへの列追加が API で拒否 | **DELETE → 全列一括 POST** |
| F3 | ポータル設定レコード PUT が初回無反映 | サブテーブル行を全フィールド付きで再 PUT |
| F4 | PowerShell `&&` で preflight+deploy 失敗 | npm script 単体実行 |
| F5 | `space48-portal-add-fields.mjs` が **revision 未指定** | GET preview revision 後 POST |
| F6 | deploy 後 `sync-kintone-apps-build` が 712/700 skip | `kintone-apps.md` 手動追記 |
| F7 | **表彰ランク（最終）**で自動 B 時に A 選択→支店長完了・5000P（浜田指摘） | 最終≦自動ガード・WF は `effectiveAutoRank`・浜田 **正常 OK** |
| F8 | 部長フェーズで自動 B/A 時に WF 不備時 **MgrToDone フォールバック**の余地 | 自動 C のみ部長完了に限定 |

---

## ルール更新案 — **承認待ち**

| ID | 概要 | 提案先 |
|----|------|--------|
| **R13** | サブテーブル内 DD/CB の REST 選択肢キーは **日本語**デフォルト（ASCII は事前プローブ） | `scripts/lib/kintone-subtable-dropdown-keys.md`（新） |
| **R14** | ポータル seed の短 code↔日本語マップを seed スクリプト **1 箇所**に集約 | `space48-portal-seed-config.mjs` |
| **R15** | 新アプリ deploy 成功後 **kintone-apps 行未追加を WARN** | `deploy-customization.js` 後 or runbook |
| **R16** | サブテーブル列変更は **DELETE+全列 POST** を先に検討 | `space48-portal-add-fields.mjs` ヘッダ |
| **R17** | 締め **desktop:sync-and-verify**（Windows は `SESSION_STARTER_DESKTOP_DIR`） | R7 補強 |
| **R18** | 業務改善 **表彰ランク**: 最終は自動以上不可・WF 分岐は自動のみ・仕様変更時は 700+spec 同時 | spec §Q-UX-06 + `debug-tips.md` 追記 |

---

## 意図的に書かないもの

- 明日の Q-SCHED-03 手順
- ポータル v2（バッジ・文字サイズ）
