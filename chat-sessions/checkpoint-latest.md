# checkpoint-latest（2026-06-07 終了時点）

**最終更新**: 2026-06-07（本日終了・はじめに完了）

---

## 次にやること（最優先）

**2026-06-08（明日）**: **699 ご利用ガイド — 申請編**（Q-GUIDE-07 スクショ 3〜5 枚含む）

1. 申請編の本文（入力項目・添付・申請ボタン）を Hamada と確定
2. `customize/business-improvement-guide/desktop.js` の `guideApplyChapter` / 申請章 HTML を実装
3. 必要なら Q-GUIDE-07 用スクショを `docs/assets/business-improvement-guide/` に追加
4. preflight → `npm run deploy:699` → 実機確認

**6/9**: 評価編。**その他（FAQ）**は後日。

---

## 本日完了（2026-06-07）

| 区分 | 内容 |
|------|------|
| **699 はじめに** | 4 小節（制度説明→システムの説明、ログイン、申請〜完了の流れ、一覧の見方）文案・実装・Hamada OK |
| **699 UI** | 横メニュー＋クリックドロップダウン、章背景色、見出しアイコン、ログイン状態バナー（共有/評価者・**提案を出す**太字） |
| **699 本番** | BUILD `2026-06-07-bi-guide-v13d-banner-bold-both` **rev 39** |
| **正本** | spec Q-GUIDE-04/05/09、handbook §5、Q-GUIDE-09 はじめに完了 |
| **git** | `605d883` はじめに完了 + 本日追加分（バナー太字 rev38–39）を push 済み想定で close 時 commit |

---

## 参照

| 用途 | パス |
|------|------|
| 699 カスタマイズ | `customize/business-improvement-guide/desktop.js` |
| 仕様 | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` |
| 実装ハンドブック | `docs/plans/2026-05-28-business-improvement-implementation-handbook.md` |
| 導入資料（ヒント） | `C:\tmp\業務改善\導入資料\` |
| 終了レポート | `chat-sessions/SESSION-CLOSE-REPORT-20260607.txt` |

---

## 履歴（参考）

- 午前: Phase 4b-5（697/698/699/700 デプロイ・Q-GUIDE-04 骨子）
- 夕方: はじめに全文・UI・本番 rev39 まで
