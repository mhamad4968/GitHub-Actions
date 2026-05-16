# 2026-05-16 夕反省・セッション締め（正本）

**対象日**: 2026-05-16（JST）  
**本題**: 678 先祖返り復旧、4系統ガバナンス、ICT 686 MSRC→NVD、Git commit/push、定期運用予定  
**次セッション入口**: 本ファイル → `chat-sessions/checkpoint-latest.md` → `docs/runbooks/cio-periodic-ops-schedule.md`

---

## 1. 本日の対応まとめ（事実）

| 区分 | 内容 | 状態 |
|------|------|------|
| **重大** | **678** 本番 customize がリポより古い（GHA が複数アプリ push で deploy スキップ） | **復旧済**（rev 157・BUILD 一致・浜田検収 OK） |
| ガバナンス | GHA 順次 deploy、`data/cio-live-builds.json`、portfolio 監査 8アプリ、Runbook | **リポ反映・push 済**（`d5181d1` 等） |
| 同期 | 677/679/682/683 portfolio sync、627/668 監査拡張、686 registry 更新 | **本番・監査 OK** |
| ICT | PostgreSQL/NGINX 記事の MSRC リンク 404 → NVD 差し替え（685 id 7/8、686 v8、収集側） | **浜田検収 OK** |
| Git | governance + ICT + periodic schedule | **push 済**（`7089411`〜`ec1ad1e`） |
| 運用 | `docs/runbooks/cio-periodic-ops-schedule.md`（月次・四半期・金曜 MCP） | **作成済** |

**Git（主要）**: `d92d854`（678 fix 起点）→ `d5181d1`（governance）→ `7089411`（ICT）→ `ec1ad1e`（定期運用 doc）

---

## 2. 重大ミス（678 先祖返り）— 知らないでは済まない

### 2.1 何が起きたか

1. **`6b3d370`** で **6 アプリ**（627, 677, 678, 679, 682, 683, ops-guide 等）の `customize/**` を **1 push** で変更した。  
2. GHA **`kintone-customize-deploy`** が変更アプリ数を **`uniq=6`** とみなし、**API deploy をスキップ**（ESLint のみ）。  
3. **リポと CI は「成功」**に見えるが、**本番 678 は旧 JS のまま** → ダッシュ崩れ・677 リンク復活等（先祖返り）。

### 2.2 なぜ重大か

- **「push した＝本番に載った」という誤認**が起きうる。  
- 浜田・CEO の **画面確認だけ**が真実の最後の砦だった（CI が嘘をついた）。  
- **予実ダッシュ（678）**は業務クリティカル。気づきが遅れれば運用事故。

### 2.3 構造原因（言い訳にしない）

| 原因 | 説明 |
|------|------|
| **CI 設計欠陥** | 複数アプリ変更時に deploy を省略する分岐があった |
| **台帳の遅れ** | 本番 BUILD の機械照合がなく、ズレに気づくのが遅い |
| **CIO 確認不足** | push 後に「全変更アプリの live BUILD 一致」を即確認していなかった |
| **第2者タイミング** | 着手前 DeepSeek/Kimi が deploy スキップ前提の盲点レビュー不足 |

### 2.4 再発防止（実装済み＋運用）

| 層 | 対策 | 参照 |
|----|------|------|
| CI | 変更アプリを **順次 deploy**（スキップ廃止） | `.github/workflows/kintone-customize-deploy.yml` |
| CI 後 | **`cio:audit:portfolio:strict`** | 同上 workflow |
| 台帳 | `data/cio-live-builds.json`（deploy 成功時自動更新） | `scripts/cio-live-build-registry.mjs` |
| 人間 | 浜田 **依頼時**画面確認（CIO は deploy 自律・確認依頼しない） | CEO 方針 |
| 定期 | **月次** `npm run cio:periodic:monthly` | `cio-periodic-ops-schedule.md` |

---

## 3. その他の反省（確認不足・忘れ）

| # | 内容 | 深刻度 |
|---|------|--------|
| 1 | **686 MSRC 404** — 収集時に URL×製品名の整合を最初から検証していれば事前防止可能 | 中（本番データ修正済） |
| 2 | **`cio-live-builds.json` seed 上書き** — 手動 seed が deploy 記録を一時消した（のち再 deploy で復旧） | 低（手順ミス） |
| 3 | **627/668** を「監視のみ」とし、浜田指摘まで portfolio 未拡張 | 低（6月削除予定だが 6b3d370 対象だった） |
| 4 | **Kimi 未使用** — 大きな customize 差分でレビュー観点 1 問なし（DeepSeek は事後中心） | 中（§50-3-8 タイミング） |
| 5 | **commit/push** — 最初は未実施のまま「完了」報告に近い状態（浜田 GO 後に実施） | 低 |
| 6 | **報告書式** — 途中ターンで §1 / A1 / V2 不足（後から `cio:report-verify-response` で修正） | 中（規律） |

---

## 4. AI 役割分担 — 本日の実績と自己採点

| 役割 | 本日の実績 |
|------|------------|
| **CIO（本体）** | 復旧 deploy、ガバナンス実装、ICT 修正、commit/push、Runbook、Desktop 同期 |
| **DeepSeek** | ガバナンス盲点、commit 前レビュー、締めレビュー（**着手前 §50-3-8 は一部ターンのみ**） |
| **Kimi** | **未使用**（80 行超 diff があったがレビュー 1 問なし） |
| **OpenRouter** | 未使用 |
| **浜田（CEO）** | 678/686 **画面確認**、GO（commit）、定期運用の依頼 |

### 自己採点: **7.0 / 10**

| 観点 | 点 | 理由 |
|------|-----|------|
| 成果・復旧 | 8 | 678 復旧・再発防止の仕組みまで到達 |
| 重大ミス | 4 | 先祖返りは CI 由来だが **気づきが CEO 報告後** |
| 規律（§1/V2/第2者） | 6 | 締めは整えるが途中ターンに欠落 |
| 自律（CIO） | 8 | deploy・npm・push は浜田に頼らず実施 |
| 引き継ぎ | 8 | 本ファイル・checkpoint・Desktop 同期 |

**DeepSeek 補足**: uniq 判定の明文化・registry 排他・Kimi ゲート必須化は **明日ルール案**に回す（下記）。

---

## 5. 明日以降のアップデート案 — **浜田 CEO 2026-05-16 全承認済（GO）・CIO 反映完了**

### A. ルール／フック（実装済）

| ID | 案 | 反映先 |
|----|-----|--------|
| **R-17-1** | 2 アプリ以上 customize → `npm run cio:guard:multi-customize` + handoff 1 行 | `scripts/cio-after-customize-change.mjs`, `package.json`, runbook |
| **R-17-2** | §50-3-8 **編集前** | `constitutional-focus-kintone-customize.mdc`, `cio-discipline-always.mdc` |
| **R-17-3** | 教訓 TSB | **TSB-035** `docs/troubleshooting.md` |
| **R-17-4** | ICT SPEC MSRC/NVD | `docs/plans/2026-05-16-ict-tech-digest-spec.md` §3 `url` |
| **R-17-5** | Kimi 80 行超 | 上記 `.mdc` R-17 節 |

### B. 運用（承認不要・既に正本化済み）

- カレンダー: `docs/runbooks/cio-periodic-ops-schedule.md`  
- 月次: `npm run cio:periodic:monthly`  
- 四半期: `npm run cio:periodic:quarterly` + GHA secrets  

### C. 次セッション初手（AI 向け）

1. Read 本ファイル + `checkpoint-latest.md` 先頭  
2. `npm run cio:audit:portfolio:strict`（1分・異常なければ1行で可）  
3. 本題がなければ **ユーザサポート 682/683** または CEO 指示待ち  

---

## 6. ルール遵守の根拠（本締めターン）

| ルール | 遵守 |
|--------|------|
| CIO 自律（deploy/npm） | ✅ 浜田に deploy 依頼なし |
| CEO 画面確認 | ✅ 678・686 は浜田検収 |
| 第2者 | ✅ DeepSeek（締め・commit 前） |
| GO 後 commit | ✅ 浜田 GO 済み |
| Desktop 正本 sync | ✅ 本ターン実施 |
| §1 / §M-2 / CEO ブロック | ✅ チャット締め報告で実施 |

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-16 | R-17 全承認 GO・CIO ルール/TSB/スクリプト反映 |
| 2026-05-16 | 初版（678 教訓・自己採点 7.0・明日ルール案 A1〜A5） |
