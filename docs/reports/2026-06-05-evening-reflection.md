# 夕反省 — 2026-06-05 JST

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`

---

## AI の失敗・反省

| # | 失敗 | 再発原因 | 対策 ID |
|---|------|----------|---------|
| F1 | 月次セキュリティレポートの生成物が **`C:\tmp` のみ**（リポ未管理） | 依頼が doc レーンで、既存テンプレが Desktop 外だったため ad hoc 化 | R1, R2 |
| F2 | Word 書式が4月テンプレと不一致（`.text` 代入で **フォント・サイズ消失**） | python-docx の `paragraph.text =` が run 書式を破棄するのに初回から helper 未使用 | R2, R5 |
| F3 | 箇条書きの太字判定ミス（`strip()` で **`　 ・` 先頭が消えた**） | 書式ルール関数で `text.strip()` 後に prefix 判定 | R5 |
| F4 | **5月検知 0件**・社外事例をプレースホルダのまま納品しうるところだった | 実データ（SKYSEA／ネットワーク監視）の有無を着手前に確認せず | R3 |
| F5 | PDF/DOCX 抽出で **markdownify MCP を使わず** python-docx/pypdf に迂回 | markdownify は extended probe で SKIP 扱い・手順未確認 | R6 |
| F6 | セッション序盤 **PowerShell `&&` / heredoc** でコマンド失敗 | Windows シェル差分を先に読まず試行 | （P5 既出・再遵守） |
| F7 | **GHA `security-next-kintone` 失敗**（Gemini 403 dunning）をセッション中に未エスカレーション | 本題が doc レーンで CI 監視が後回し | R4 |

---

## アップデート案 — **全 GO（2026-06-05 浜田）**

| ID | 内容 | 状態 | 反映先 |
|----|------|------|--------|
| **R1** | 月次セキュリティレポート builder をリポ移管 + `npm run doc-lane:security-report` | **GO** | `scripts/build-monthly-security-report.py` / `docs/runbooks/monthly-security-report.md` |
| **R2** | 4月テンプレ書式を `scripts/lib/docx_template_format.py` に共通化 | **GO** | 同上 + `docs/runbooks/docx-patch-windows.md` |
| **R3** | 着手前チェックリスト（SKYSEA/ネットワーク/社外事例） | **GO** | runbook §0 + `docs/session-report-checklist.md` §Q |
| **R4** | analyze: Gemini 403 時フォールバック要約で kintone 保存（exit 0） | **GO** | `security-next-automation/src/analyze.ts` |
| **R5** | prefix 判定は strip 前 raw + 単体テスト | **GO** | lib + `scripts/test_docx_template_format.py` |
| **R6** | doc-lane に markdownify 手順1行 | **GO** | `docs/runbooks/doc-lane.md` |

**反映**: 2026-06-05 承認ターンで runbook / scripts / analyze へ追記済。

---

## 深掘り — 明日以降に効く構造改善（判断材料）

### A. レーン分離（doc vs kintone vs infra）

| 論点 | 現状 | 提案 |
|------|------|------|
| 成果物の所在 | セキュリティレポートは `C:\tmp` のみ | **正本パスを runbook で固定**（出力 DOCX + builder + チャート） |
| 再現性 | 浜田 PC 上の python スクリプト 1 本 | **リポ commit + 月次 npm script** で次月は `--month 2026-06` だけ |
| プレースホルダ | 検知 0件がデフォルト | **データ未着なら表に「要確認」行**を残す（0件と未確認を混同しない） |

### B. Word 自動生成の品質ゲート

| 論点 | 提案 |
|------|------|
| 書式 | テンプレ **1 段落サンプルから font 抽出** → 全段落に apply（`.text` 禁止） |
| 検証 | 生成後 **`compare-format.py` 相当**を npm script 化し、16pt/10.5pt/MS ゴシック差分で exit 1 |
| グラフ | 警視庁出典・数値は **PDF ページ番号コメント**を builder 定数に保持 |

### C. MCP / CI 監視

| 論点 | 提案 |
|------|------|
| markdownify | 月次 doc ターン開始時 **`cio:mcp:env:extended`** 結果を 1 行報告 |
| security-next | Gemini 403 = **インフラ障害** — コード修正より **API 課金状態確認**が先。workflow は fail-fast のまま vs 部分成功の選択（R4） |
| 締め | doc レーンでも **`gh run list --limit 3`** を SESSION-CLOSE §1 に 1 行 |

### D. セッション運用（既存ルールの再強化）

| 項目 | 内容 |
|------|------|
| P5 再遵守 | Windows python は **`C:\tmp\*.py` ファイル化**（本日も遵守済み） |
| LITE 運用 | 浜田は **24/25 LITE のみ** — 本日 sync で 26 夕反省 md 差替え |
| 凍結 | **6/8 案B1** まで kintone customize/deploy 着手なし — 本日 doc レーンのみで OK |

---

## 夕反省に書かないもの

- 本日成果詳細 → **19 / SESSION-CLOSE**
- 凍結・クローズ → **checkpoint**
- **明日やること・第1手・スケジュール** → 書かない
