# 朝イチ タスク・課題整理 — 2026-07-05 (Sun)

> **目的**: ① 課題整理・完了案件クローズ（浜田指示）  
> **正本**: `data/cio-project-closures.json` · `chat-sessions/checkpoint-latest.md`

---

## 1. 本日のレーン（確定順）

| 順 | 内容 | 状態 |
|----|------|------|
| **①** | タスク/課題整理 → commit/push | **本レポートで実施** |
| **②** | **kintone アカウント台帳** — 現行運用ヒアリング → 1問ずつ仕様 → 実装 → commit/push | **次の本題** |
| **③** | ~~**SKYSEA** 意見交換~~ → **8/1–8/15 再計画**（配信目標 **9/15**） | **7月見送り** |
| **月曜** | 社内アプリレビュー #3 — 698/700 フィードバック | 待ち |

---

## 2. closed-v1（8件 — 無断 v1 再開禁止）

| ID | ラベル | クローズ日 | 備考 |
|----|--------|-----------|------|
| business-improvement | 業務改善 ver.02 (697–713) | 2026-06-13 | **698/700 の軽微 UX は v1 外・7/4 実施済** |
| wifi-ssid | Wi-Fi SSID (718–719) | 2026-06-14 | Excel 廃止済 |
| jr-ipad-ledger | JR iPad (720–721) | 2026-06-15 | |
| vpn-account-ledger | VPN (733–734) | 2026-06-17 | |
| total-network-ledger | トータルネット (737–738) | 2026-06-21 | |
| mfp-ledger | 複合機 (741–742) | 2026-06-22 | |
| nas-ledger | NAS (748–749) | 2026-06-28 | |
| mailing-list | ML (750–751) | 2026-06-29 | Space21 移設済 |

**追加クローズ不要** — `verify:checkpoint-project-closure` OK（closures=8）

---

## 3. on-hold（4件 — 浜田 GO まで触らない）

| ID | 内容 | 再開条件 |
|----|------|----------|
| skysea-installer | SKYSEA 未導入 PC 自動インストール | **8/1–8/15 再計画** · **配信目標 9/15**（7/5 浜田） |
| yojitsu-budget | 予実 677/678/679 | 運用ヒアリング後 |
| construction-workdays-688 | 688 工事稼働ダッシュ | 浜田相談時 |
| jikkou-yosan-v1-demo | 736 担当説明・イメージ確認 | 月曜以降（Phase1 7/11 優先） |

---

## 4. アクティブ（メンテ・様子見）

| レーン | BUILD/rev | 次アクション |
|--------|-----------|-------------|
| **736 実行予算** | rev168 Phase 0c GO | **〜7/11 様子見** · Phase1: 7/11 マスタ検索 / 7/18 テキスト行 / 7/25 並び替え |
| **698 社員ミラー** | rev19 在籍フィルタ | 月曜レビュー待ち |
| **700 提案申請** | rev146 Q-UX-12 | 月曜レビュー待ち |
| **697 設定マスタ** | 本番 Excel 30所属 | 維持のみ |
| **674 PC台帳** | 本番運用中 | 595 CSV 後は「台帳へ一括反映」 |
| **595/714–717 スタック** | morning-prep 疎通 OK | 通常監視 |

---

## 5. 新規本題（②）

**kintone アカウント台帳** — 現行運用・利用中台帳の把握から開始。既存参考:

- VPN 734 / JRE 745・747 / 旧 627（674 移行済・627 deploy 対象外）
- PC台帳 674 は「1 PC = 1 アカウント」統合済 — **本件は別レーン（アカウント台帳単体）**

仕様・Space/App ID は **§41 一問ずつ** で確定後に `kintone-create-app` レーンへ。

---

## 6. バックログ・技術課題

| 優先 | 課題 | 扱い |
|------|------|------|
| P21 | B-MDFLOW Markdown 開発フロー | バックログ（本日外） |
| 保留 | nodemailer 9.x major | §38-1 · audit high · **浜田 7/4 保留** |
| 軽微 | TSB 目次 drift 037–041 | 朝報 WARN · 別途索引整備可 |
| 軽微 | morning-prep audit 表示文字化け | Windows cron 出力 · 非ブロック |

---

## 7. Git / 記録（①完了条件）

- cold-start 由来の未コミット（kintone-apps RAG 同期 · BI spec Q-UX-12/698 · checkpoint/handoff/bridge）を **1 commit**
- **push origin main**
- Desktop sync は ② 完了後または日終わりでも可（本①は docs/checkpoint 中心）

---

**次の1手（②）**: 浜田から **現行アカウント台帳の運用説明** を受領 → 利用中 kintone/Excel 台帳を AI が一覧化 → §41 で仕様開始
