# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-13 JST — **業務改善 ver.02 v1 完成（クローズ）**

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 業務改善 ver.02 の **v1 再実装**（クローズ後の無断再開） | v1 完成条件外の任意（FAQその他・本番6段WF・RAG・Wordマニュアル） |
| 本番 WF 6段階への無断分割 | test_v3 WF 継続テスト |
| 評価スナップショット本番投入（未設計確認前） | ガイド doc 更新（完成条件外） |

**次の1手**: **（未確定 — 当日 項番 -0 で浜田と合意）** — 業務改善は **v1 クローズ済**（`docs/reports/2026-06-13-business-improvement-completion.md`）
**業務改善 ver.02**: **2026-06-13 クローズ** — 699 rev **105** / 700 rev **139** / 713 rev **12** — 浜田確認済
**クローズ正本**: `data/cio-project-closures.json` / `npm run verify:checkpoint-project-closure`
**R13–R18**: **浜田 GO 済** — `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`
**システム推進室ポータル**: **2026-06-11 完了**（712 — 5タブ・15リンク — 浜田 OK）
**ポータル未着手（手動）**: Space 48 スペース画面へ **712 リンク 1 つ**

---

## 2026-06-13 JST — **業務改善 ver.02 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 申請・評価・**年次集計**・ガイド UX（C案）まで動作確認済 — **v1 クローズ可** |
| **BUILD** | 699=`2026-06-13-bi-guide-lists-first-accordion` rev **105** / 700=`2026-06-13-bi-completion-date` rev **139** / 713=`2026-06-13-bi-annual-redirect-guide` rev **12** |
| **正本** | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **締め** | `chat-sessions/SESSION-CLOSE-REPORT-20260613.txt` |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---


## 2026-06-11 JST — **システム推進室ポータル（App 712）**

| 項目 | 内容 |
|------|------|
| **本日完了** | タブ型ポータル・サブテーブルリンク設定・seed 15 件・別タブで開く — 浜田 **OK** |
| **BUILD** | `2026-06-11-space48-portal-v3` rev **24** |
| **正本** | `docs/plans/2026-06-11-space48-portal-spec.md` |
| **入口** | [712](https://jbis-kintone.cybozu.com/k/712/) |
| **API 注意** | サブテーブル DD は選択肢キー **日本語必須** |

---



## 2026-06-11 JST — **業務改善 700 表彰ランク（確定仕様）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 承認経路 UI ＋ **表彰ランク**: 自動=WF正・最終≦自動・部長は自動Cのみ完結・注記文言 |
| **BUILD** | `2026-06-11-bi-rank-hint-message` rev **134** — 浜田 **正常動作 OK** |
| **正本** | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §Q-UX-06 |

---



## 2026-06-10 JST — **憲法 Phase 2-D 完了（§↔ジャンル機械リンク）**

| 項目 | 内容 |
|------|------|
| **本日完了** | `constitution-genre-catalog.json` 単一正本 / RULES-INDEX 自動節 / sync+verify 連鎖 / `18-ai-team-read-map` 索引ポインタ追記 |
| **AIチーム** | DeepSeek **GO** + `5038` stamp + `verify:cio-four-ai-governance` 全通過 |
| **Git** | `576090f` push 済 |
| **正本** | `docs/plans/2026-06-10-constitution-phase2d-team-proposal.md` |
| **触らない** | AGENTS.md § 本文 / constitution.mdc 手編集 |

---




## 2026-06-10 JST — **新規システム導入ヒアリング記録（Space 48）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 710 DB + 711 ダッシュ・一覧 + ヒアリングモーダル + **印刷 A4 2枚** — 浜田 **目視 OK** |
| **BUILD** | 710=`2026-06-10-new-system-intro-db-block-ui` rev **5** / 711=`2026-06-10-new-system-intro-dash-print-a4-v2` rev **4** |
| **正本** | `docs/plans/2026-06-10-new-system-intro-hearing-spec.md` |
| **入口** | [711](https://jbis-kintone.cybozu.com/k/711/) |

---




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-13.md -->
