# 依頼効率化 v0.2 + GO境界 Step0 — 実施計画（2026-08-08）

> **地位**: 計画正本（G0〜。実装配線の大規模変更は浜田 **実装GO** 後）  
> **優先**: ①本レーン → ②MCP月次は後続（本計画の対象外）  
> **完了通知（音）**: **最後**（本日夜でも可・本計画の必須スコープ外）  
> **経営会議資料**: 8/13 依頼まで触らない

## 1. Step0 — 薄いGO境界（抜本＝全文改定ではない）

憲法 `docs/constitution/28-ceo-go-phases-charter.md` は **ポインタのまま**。依頼レーンで迷わないよう、次の **3行**を Desktop 36・runbook・compose 出力で同一文言にする。

```
確認A（compose OK）＝依頼文の確定のみ。コード変更・deploy・commit 禁止。
G0（「調査から」）＝読取・報告・修正案のみ。実装・deploy・commit 禁止。
G2（「実装GO」明示）＝当該スコープの実装・gate・deploy 可。確認Aや調査だけでは入らない。
```

| 置き場 | 役割 |
|--------|------|
| `36-REQUEST-COMPOSE-INDEX.txt` | 浜田早見（冒頭固定） |
| `docs/runbooks/cio-request-compose.md` §5 | AI 運用正本 |
| compose 貼付ブロック `【段階】` | 毎回チャットに出る機械ラベル |
| `28-ceo-go-phases-charter.md` | 変更しない（参照のみ） |

## 2. v0.2 スコープ（本線）

| ID | 内容 | 工数 | 実装GO要 |
|----|------|------|----------|
| S0 | 上記3行の統一＋`【段階】`行 | S | 今回の配線は進行済想定 |
| V2-1 | compose ログ（`chat-sessions/request-compose-logs/` 任意） | S | 要 |
| V2-2 | Cursor Skill 1本（依頼文作成の手順固定） | S–M | 要 |
| V2-3 | レーン別デフォルト（CEO最低基準の貼付方針は任意） | M | **済**（全レーン default=false · report/constitution に hint） |
| V2-N | 完了通知 `cio:done-notify` | S | **最後**（本計画の締め） |

**やらない（v0.2）**: 新アプリ発明、SKYSEA配信、閉済再開、経営会議ネタ、MCP月次パック。

## 3. 失敗しにくい自律の型

```
G0  調査・計画・下書き（席を離れて可）
 → 浜田 実装GO
G2  実装・verify・Desktop sync
 → （最後）完了通知
```

機械防止:

1. 確認Aだけでは customize / deploy / commit しない（既存＋`【段階】`で可視化）
2. `--phase investigate` と implement のヒント取り違え禁止（verify 維持）
3. 触らないリスト自動挿入維持
4. 区切りは verify 緑まで（「たぶんOK」禁止）

## 4. 本日〜次の区切り

| # | 内容 | 状態 |
|---|------|------|
| 1 | Step0 文言統一（36 / runbook / compose `【段階】`） | **済** |
| 2 | 本計画ファイル commit | **済** |
| 3 | V2-1 ログ + V2-2 Skill | **済** |
| 4 | V2-3 レーン別デフォルト | **済** |
| 5 | 完了通知 | **今夜** |
| 6 | ② MCP月次 | **進行中**（`docs/plans/2026-08-08-mcp-monthly-pack.md`） |

## 5. 参照

- v0.1 spec: `docs/plans/2026-07-11-request-efficiency-tool-spec.md`
- runbook: `docs/runbooks/cio-request-compose.md`
- Desktop: `36-REQUEST-COMPOSE-INDEX.txt`
- GO正本: `docs/constitution/28-ceo-go-phases-charter.md`
