# 復元チェックポイント アーカイブ — 2026-04-10（654 予算ポータル工種別表整理）

> **アーカイブ理由**: 2026-04-19 に `checkpoint-latest.md` を当日の状態へ更新するにあたり、`docs/agent-restore-checkpoint.md`「長くなったら、抜粋を `chat-sessions/checkpoints/YYYY-MM-DD-_TOPIC.md` にコピーし、`checkpoint-latest.md` は短い「現在地」だけに戻す。`checkpoints/` 内の古いファイルは**削除しない**（監査・再参照用）」に従って退避。

**最終更新**: 2026-04-10（セッション締め）

## 現在のゴール（1〜3 行）

- **654 予算ポータル**: 「工種別の合計」は **工種・件数＋月・年間** の列のみ（会社・摘要・確認は非表示）。`deploy:654` 済み。
- **ルール**: デプロイ／JBIS UI／表レイアウト運用を `kintone-javascript.mdc` に、対話前提を `persist-policies.mdc` に追記済み。
- **文脈の残し方**: `chat-sessions/2026-04-10.md` に共有用コピペあり。

## 着手中のコンテキスト

- **App / トピック**: **654**（`customize/budget-portal/dashboard-desktop.js`）— 工種別合計表の列整理まで完了。
- **ブランチ / PR**（任意）: 特になし（コミットはユーザー判断）

## 未完了

- [ ] ユーザー指定の **次の実装・調査**（未指定ならプレースホルダ）
- [ ] 必要なら **654 画面での目視確認**（工種別ブロックの列・sticky）

## 次セッションで最初にやること

1. 新チャットで **`@chat-sessions/2026-04-10.md`**（または **`@chat-sessions/checkpoint-latest.md`**）＋ **`@RULES-INDEX.md`** を開き、やりたいことを一文で依頼する。
2. kintone 実装に入るなら **`CLAUDE.md`「セッション開始時の作法」** を踏む。

## ブロッカー・要確認

- なし

## 参考（任意）

- **本日の振り返り・共有用コピペ**: `chat-sessions/2026-04-10.md`
- 恒久決定の索引: `RULES-INDEX.md`
- 復元・忘れ防止の正本: `docs/agent-restore-checkpoint.md`

---

## セッション締めチェック（忘れ防止・コピペ可）

セッションを閉じる前に、**該当だけ**チェック（エージェントも人間も）。

- [x] **恒久**: 次回も効く決定を **`RULES-INDEX.md` 1 行** または **正本**（`kintone-apps.md` / `docs/*`）に残した
- [x] **現在地**: **このファイル**のゴール・未完了・**次に最初にやること**を、チャットと矛盾なく更新した
- [x] **詳細**: 長い経緯は **`chat-sessions/2026-04-10.md`** に残した
- [ ] （任意）**`npm run backup`** で退避したいときは実行する

※ 手順の正本: **`docs/agent-restore-checkpoint.md`**「『忘れた』を防ぐ」
