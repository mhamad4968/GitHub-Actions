# 完了通知（V2-N）— 夜相談用仕様（2026-08-08）

> **地位**: 相談・合意用仕様（**本ドキュメントだけでは実装しない**）  
> **親計画**: `docs/plans/2026-08-08-request-efficiency-v02-and-go-boundary.md`（V2-N）  
> **実装開始条件**: 夜セッションで浜田と方法を合意 → 明示の **実装GO**  
> **確認A / G0 だけではコードを触らない**

## 1. 目的

タスクや区切りが終わったとき、浜田の PC 上で **一目で分かるローカル完了合図**を出す。  
依頼効率化 v0.2 の最後の締め（音・ダイアログ等）であり、外部 Push / メール / SKYSEA とは無関係。

## 2. 前提・再利用資産

| 資産 | 役割 |
|------|------|
| `scripts/lib/desktop-notify.mjs` | 多段フォールバック通知（Win Popup 優先 · ログ必須） |
| `npm run session:notify-selftest` | 通知経路の診断 |
| `logs/session-desktop-notify.log` | 通知のディスク証跡 |

新規の通知エンジンは原則作らない。

## 3. 候補方式（夜に選ぶ）

| 案 | 内容 | 利点 | 欠点 |
|----|------|------|------|
| **A（推奨下書き）** | `npm run cio:done-notify` → 薄い wrapper が `desktopNotify` を呼ぶ | 既存資産・低リスク・verify しやすい | 呼び出し規約の設計が要る |
| **B** | Desktop `AI緊急用` に bat を置き手動ダブルクリック | 浜田操作が直感的 | OS/パス依存・自動化しにくい |
| **C** | Cursor hooks / sessionEnd に後付け | 締めと連動しやすい | オーバーエンジニアリング・誤爆しやすい |

**昼時点の推奨（確定ではない）**: **案 A**。夜に音の要否・モーダル vs トースト・自動呼び出し範囲を決める。

## 4. 機能要件（合意後に固定）

相談で決める項目（仕様の空欄）:

1. **いつ鳴らす／出すか** … 手動だけ / compose 確認A後 / verify 緑後 / 締め後 など
2. **文面** … 固定文言か、`--title` / `--body` か
3. **成功と失敗** … exit 非0 で色・文言を変えるか（案 A のオプション）
4. **音** … ダイアログのみ / ビープ併用 / 無音
5. **自動配線** … 当初は手動 `npm run cio:done-notify` のみか、どこかにフックするか

最低限の機械要件（推奨）:

- ローカルのみ（ネットワーク送信しない）
- 1 回の呼び出しで通知 1 回（連打対策は任意）
- ログ 1 行を必ず残す（既存 `desktop-notify` 方針）

## 5. 非機能・境界

| 項目 | 方針 |
|------|------|
| 応答 | 体感数秒以内（既存 Popup 待ちは許容） |
| 触らない | SKYSEA 実配信 · 閉済 v1 · 経営会議資料 · AGENTS 改定 |
| GO | 実装は **実装GO** 後。本仕様の commit は仕様のみ |
| テスト | 実装後は `session:notify-selftest` 相当 + `cio:done-notify` 1 回の手動確認 |

## 6. 実装GO後の想定作業（参考・未着手）

案 A 採択時の最小セット:

1. `scripts/cio-done-notify.mjs`（`desktopNotify` 呼び出し）
2. `package.json` に `cio:done-notify`
3. 短い runbook 節（`docs/runbooks/cio-request-compose.md` 末尾 or 専用 1 節）
4. Desktop 36 / 37 への 1 行ポインタ（任意）
5. 任意: `verify:` の軽い存在確認（過剰なゲートは作らない）

## 7. 夜セッションの進め方

```
1. 本仕様を Read
2. 案 A/B/C と「いつ・音・自動」を浜田と合意（3〜10分）
3. 実装GO が出たら案どおり最小実装
4. selftest → 手動1回 → commit/push
```

実装GOが無い・保留なら、仕様のみで閉じる（問題なし）。

## 8. 参照

- 親: `docs/plans/2026-08-08-request-efficiency-v02-and-go-boundary.md`
- v0.1: `docs/plans/2026-07-11-request-efficiency-tool-spec.md` §7 V2-N
- 通知実装: `scripts/lib/desktop-notify.mjs`
