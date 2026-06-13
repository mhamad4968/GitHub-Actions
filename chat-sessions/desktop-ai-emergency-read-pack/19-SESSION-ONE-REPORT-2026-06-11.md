# 本日の対応まとめ — 2026-06-11（JST）最終

> **【履歴・SUPERSEDED-2026-06-13】** 業務改善 ver.02 v1 は **2026-06-13 クローズ済**。次手は `checkpoint-latest.md` 先頭 + `HANDOFF-HUMAN.txt` **先頭 6/13 块**を正とする。

> Desktop: **`19-SESSION-ONE-REPORT-2026-06-11.md`**（sync 正本）  
> 締め正本: **`chat-sessions/SESSION-CLOSE-REPORT-20260611.txt`**

---

## 1. 本日完了（浜田 OK）

| # | 内容 | 結果 |
|---|------|------|
| 1 | **業務改善 700** — 承認経路チップ（上司／支店長／本社）・差戻し再申請 | deploy 済 |
| 2 | **業務改善 700** — **表彰ランク仕様確定**（自動=経路・最終は格上げ不可） | 浜田 **正常動作確認 OK** |
| 3 | **業務改善 699** — フォント特大 23px 等 | BUILD `2026-06-11-bi-font-xlarge-23px` rev **88** |
| 4 | **システム推進室ポータル App 712** 新設 | 5 タブ・15 リンク・別タブで開く — 浜田 OK |
| 5 | **712** フィールド・seed・customize v3 | rev **24** |
| 6 | **仕様・台帳・npm** | portal spec / `kintone-apps.md` / `deploy:712` 等 |

---

## 2. kintone 本番 BUILD（確定）

| App | 役割 | BUILD | rev |
|-----|------|-------|-----|
| **699** | ご利用ガイド | `2026-06-11-bi-font-xlarge-23px` | **88** |
| **700** | 提案申請 ver.02 | `2026-06-11-bi-rank-hint-message` | **134** |
| **712** | システム推進室ポータル | `2026-06-11-space48-portal-v3` | **24** |

**712**: https://jbis-kintone.cybozu.com/k/712/  
**正本**: `docs/plans/2026-06-11-space48-portal-spec.md` / `docs/plans/2026-05-23-business-improvement-proposal-spec.md`

---

## 3. 業務改善 — 表彰ランク（確定仕様）

| 要素 | ルール |
|------|--------|
| **自動ランク** | 合計点から JS 判定。**WF 分岐の正** |
| **最終ランク** | 完結評価者が明示確定。**自動より上は不可** |
| **部長** | 自動 **C** のみ完了。B/A は支店長（または本社）へ |
| **支店長** | 自動 **B** で完結。A は評価見直し → 本社へ |
| **UI 注記** | 「現在評価（自動）は XX。XX 以上は加点不足で評価見直し」 |

---

## 4. ポータル 712 — 残タスク（手動）

- Space 48 スペース画面に **712 へのリンク 1 つ**（kintone UI）

---

## 5. 技術メモ

- サブテーブル DD: 選択肢キー **日本語必須**（ASCII 短 code → CB_VA01）
- ポータル seed: 短 code → 日本語は `space48-portal-seed-config.mjs`

---

## 6. 夕反省・ルール GO

`docs/reports/2026-06-11-evening-reflection.md` — F1–F8  
**R13–R18 浜田 GO 済** — `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`

## 7. 明日（項番 -0 合意済）

**第1手**: 業務改善 **年次集計** — **Q-SCHED-03**（§4.8・Q-ANN → 新⑤ 6/12–13）  
**並行可**: Space 48 → 712 リンク（手動）
