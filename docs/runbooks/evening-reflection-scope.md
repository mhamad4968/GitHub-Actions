# 夕反省（evening-reflection）のスコープ

**制定**: 2026-05-30（浜田）

## 書くもの（このファイルだけ）

1. **AI の失敗・反省**（事実ベース。言い訳ではなく再発原因）
2. **明日以降ミスが減るアップデート案**（ルール・手順・スクリプト・runbook 等）
3. **承認済み／承認待ち**の改善案 ID（#R / #S / #D …）

## 書かないもの（別ファイルへ）

| 内容 | 正本 |
|------|------|
| 本日の成果・deploy 結果・検収 | `19-SESSION-ONE-REPORT-YYYY-MM-DD.md` |
| クローズ・触らない・凍結 | `25-checkpoint-latest.md` 先頭 |
| 明日の第1手・レーン（業務改善含む） | **当日 項番 -0**（前日決定禁止） |
| タスク計画・優先順位案 | 朝イチ合意。夕方に「明日は ○○」と書かない |
| git 差分の羅列 | 雛形 §1 自動収集で足りる。反省会で読み上げない |

## AI の手順

1. **R1**: 26 作成前に **必ず Read** — `docs/runbooks/evening-reflection-scope.md`
2. `npm run evening:reflect` で雛形生成（任意）
3. **§4 失敗**と **§5 改善提案（ミス削減）** だけを浜田向けに仕上げる
4. **§「明日へ」は使わない** — 次アクションは checkpoint / handoff へ
5. **R2**: checkpoint「クローズ」項目を 26 に再掲しない
6. **R3**: 「明日の第1手」「案A/B/C/D タスク計画」を 26 に書かない
7. 仕上げ後: `npm run verify:evening-reflection-scope`
8. 承認後 → runbook / rules へ反映

## 未来は分からない（2026-05-30 浜田）

**前日に「明日やること」を決めない。** レーン・第1手・業務改善の有無は **当日 項番 -0** で浜田に聞く。

## 機械検証（S1 / S2）

| コマンド | 用途 |
|----------|------|
| `npm run verify:evening-reflection-scope` | 26 の禁止語検出（exit 1） |
| `npm run verify:session-close-git-warn` | 締め時未コミット **NG（exit 1・commit 必須）** |
| `npm run desktop:sync-and-verify` | 上記 + Desktop sync 一括 |

## 関連

- 雛形: `scripts/evening-reflect.mjs`
- Desktop: `26-evening-reflection-YYYY-MM-DD.md`（sync）
- 参照: `docs/reports/2026-05-11-evening-reflection.md`（良い例：失敗＋改善案）
