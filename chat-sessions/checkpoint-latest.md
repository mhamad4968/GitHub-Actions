# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-02 JST — **セッション締め（595 退職PCリンク解除・メーリングリスト Space21 移設）**

### 本日アクティブ（BUILD/rev — 2026-07-02）

| 項目 | 内容 |
|------|------|
| **595 社員マスタ** | BUILD=`2026-07-02-595-retire-clear-pc674-link` rev **113** — 退職時 674→保管 + 595 PC台帳サブテーブルクリア（backfill 7件） |
| **750/751 メーリングリスト** | **Space 21 / thread 23 移設** — ACL: **admin** 全権 / **system** 閲覧+書出 / **everyone** 拒否（浜田目視 OK） |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **メーリングリスト750–751** — いずれも **closed-v1**（750/751 は **Space21 移設のみ**・customize 変更なし）。**v1 再実装禁止**。**触らない**: **688 / 677–679 / SKYSEA**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA 保留** | 触らない |
| **736 担当説明 保留** | Step2-3 待ち |
| **nodemailer 9.x** | V1 proposal 手動レビュー待ち |

**次の1手**: 朝 `npm run cio:session:cold-start` → `session:bootstrap` — **浜田依頼待ち**（項番 -0）  
**Git**: **close-git 実行中** — 本締め commit 後に hash 更新  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**締め**: `SESSION-CLOSE-REPORT-20260702.txt`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** 貼付 | **項番 -0** OK まで着手しない | **項番 0** `session:bootstrap`  
**CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **L2** bootstrap NG → NEW-SESSION-STARTER 6 部（1 回）
