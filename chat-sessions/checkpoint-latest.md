# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-05 JST — **朝セッション ① 課題整理完了**（task-triage · kintone-apps/BI RAG 同期 · push 予定）

### 本日アクティブ（BUILD/rev — 2026-07-04 夜まで反映済）

| 項目 | 内容 |
|------|------|
| **736 実行予算** | BUILD=`2026-07-04-736-row-menu-fixed-pop` **rev168** — Phase **0c GO** · **Phase 1** 7/11 マスタ検索 / 7/18 テキスト行 / 7/25 並び替え |
| **698 社員ミラー** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — 在籍/退職/すべて pill |
| **700 提案申請** | BUILD=`2026-07-04-bi-proposal-late-eval-collapse` **rev146** — Q-UX-12 浜田目視 OK |
| **697 設定マスタ** | 本番 Excel 30所属 upsert 済 |
| **② 本題** | **kintone アカウント台帳**（新規）— 運用ヒアリング → 仕様 → 実装 |

## クローズ済み（`data/cio-project-closures.json` — 8件 closed-v1）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** — **追加クローズ不要（7/5 確認）**

## 保留・触らない

| 状態 | 内容 |
|------|------|
| **688 / 677–679 / SKYSEA 実装** | 保留（**SKYSEA=本日午後 意見交換のみ**） |
| **736** | 〜7/11 様子見 · deploy 追加なし |
| **nodemailer 9.x** | major 保留（7/4 判断） |

**次の1手**: **② kintone アカウント台帳** — 浜田から現行運用説明 → 利用台帳把握 → §41 で仕様。**午後** SKYSEA 意見交換。**月曜** 698/700 レビュー  
**Git**: **`ec96f13`** → ① commit/push 直後に更新  
**Plan&Usage**: **18%**（2026-07-02）· リセット **7/15** · 3日に1回報告  
**整理正本**: `docs/reports/2026-07-05-morning-task-triage.md`  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** | **項番 0** **`npm run session:bootstrap`** | **bootstrap 3c** Git 残件 1 行報告必須  
**CLOSE** export-handoff → sync-desktop → clock:clear → close-git
