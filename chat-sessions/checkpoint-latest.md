# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-04 JST — **業務改善 697/700 本番設定 + メンテ断捨離**

### 本日アクティブ（BUILD/rev — 2026-07-04）

| 項目 | 内容 |
|------|------|
| **697 設定マスタ** | 本番 Excel `scripts/data/business-improvement-settings-master-production-2026-08.xlsx` — 30所属 upsert 済（人事発令反映） |
| **697 共通** | id=31 `hr_director_login=jinji` / `arai-s@j-bis.co.jp` |
| **697 WFテスト** | id=32 `【WFテスト】開発検証用` — 全ロール **admin** / jb-sys@j-bis.co.jp |
| **700 提案申請** | BUILD=`2026-07-04-bi-proposal-hr-dept-override` rev **144** — 所属行 `hr_director_login` 優先 |
| **698 社員ミラー** | 595 同期 fix（`f98b062`） |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **メーリングリスト750–751** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA 保留** | 触らない |
| **736 担当説明 保留** | Step2-3 待ち |
| **nodemailer 9.x** | V1 proposal 手動レビュー待ち |

**次の1手**: **浜田依頼待ち**（項番 -0）— WF 本番切替前に `npm run business-improvement:validate-prod-settings-xlsx` で再検証可  
**Git**: **`923f00a`** = `origin/main` — 697/700 本番設定 push 済（メンテ追記は本ターン commit 予定）  
**Plan&Usage**: 前回 **18%**（2026-07-02）· Ultra リセット **7/15**  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**運用メモ**: 本番 Excel 編集は **`設定マスタ_本番`** シートのみ。人事発令反映を正とする。`C:\tmp\業務改善\` に最新 Excel ミラー配置。Desktop `＃重要確認事項.txt` **廃止済**（`18-重要確認.txt` 正本）。  
**npm**: `business-improvement:build-prod-wf-settings-xlsx` / `validate-prod-settings-xlsx` / `restore-common-hr-jinji`  
**MCP**: Tier B 前に `cio:mcp:env` 推奨

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**
