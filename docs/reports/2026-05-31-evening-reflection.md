# 夕反省 — 2026-05-31 JST（夜・LITE／v5 目次／締め）

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`  
> **前日決定禁止** — 業務レーンは **当日 -0** で聞く

---

## AI の失敗・反省

| # | 失敗 | 再発原因 | 対策 ID |
|---|------|----------|---------|
| F1 | **メモ帳で 24/25 全文 .md を開いた**運用が残り、Application Hang（Event 1002） | 大容量 mirror と `sync-desktop` の上書き競合・RAM 逼迫 | C1, C2, S3 |
| F2 | LITE 実装後も **18 に浜田向け一行ルール未追記**（read-pack のみ） | 実装と運用正本の更新タイミングがずれた | D2 |
| F3 | 午前締め `SESSION-CLOSE-REPORT` 作成後、**夕方作業（v5 目次・LITE）を締め正本へ未反映** | 1 日 2 セッション時の「最終締め」更新手順が未定義 | C3 |
| F4 | **push 3 件滞留**（`84d80be` 等）— ローカル commit のみで CI 未検証 | 締め手順に push まで含めず止めた | B4 |
| F5 | v5 目次修正後 **浜田の目視確認依頼を明示せず**終了 | doc-lane 完了報告テンプレに「CEO 目視 1 行」が無い | C4 |
| F6 | Plan & Usage 監視合意を **18 / runbook に未反映** | 口頭合意のみで正文化を後回し | D3 |

---

## アップデート案（承認待ち）

| ID | 内容 | 種別 | 状態 |
|----|------|------|------|
| **C1** | **18 追記**: メモ帳で開くのは **`24-handoff-log-LITE.txt` / `25-checkpoint-latest-LITE.txt` のみ**。`**24/25 の .md` は AI 同期専用 — 開かない** | D | **承認待ち** |
| **C2** | **`sync-desktop` 前チェック**: Notepad が `24-handoff-log.md` / `25-checkpoint-latest.md` を開いていたら **警告＋浜田に閉じるよう 1 行**（スクリプト or runbook） | S | **承認待ち** |
| **C3** | **1 日複数セッション**: 最後の締めターンで **SESSION-CLOSE-REPORT を上書き**し、handoff **末尾 1 ブロック追加**のみ（朝締めを残さない） | R | **承認待ち** |
| **C4** | **doc-lane 完了報告**: v5 等の目次修正後は **「浜田: Word で目次 p.xx を 1 項目目視」** を報告末尾に固定 1 行 | R | **承認待ち** |
| **B4** | **締め push 必須化**: `desktop:sync-and-verify` 成功後 **`git push`** まで CIO が実施（失敗時は handoff に記録）— B1 拡張 | B | **承認待ち** |
| **S3** | **`verify:desktop-ai-emergency-sync`**: LITE 生成後 **ファイルサイズ上限**（例: 各 32KB）で全文 mirror 誤配置を検知 | S | **承認待ち** |
| **D2** | C1 承認後 → **`18-重要確認.txt` + constitution mirror** へ同期 | D | **C1 依存** |
| **D3** | Plan & Usage 閾値（Auto+Composer **>70%** / API **>50%** / On-Demand **>$0**）を **`docs/runbooks/cursor-plan-usage-watch.md`** 新設 | D | **承認待ち** |
| **E1** | RAM **>80%** 時は sync 前に **Notepad 全終了を推奨**（runbook 1 行 — 本日 73% は警告域） | B | **承認待ち** |

---

## 夕反省に書かないもの

- 成果サマリ・deploy 結果（→ **19** / SESSION-CLOSE）
- 凍結・クローズ・6/8 実装待ち（→ **checkpoint**）
- 業務改善の前日決定（→ **当日 -0**）

---

## 参照（本日の事実 — 反省会では読み上げない）

- v5 目次 **70 項**・Ｃ－２／Ｃ－３ 反映・`verify_toc_completeness_v5.py` OK
- LITE mirror **`84d80be`** — pre-commit OK
- Q36 GO・壁時計 manual-desktop — **午前締め済**（checkpoint 先頭）
