# 夕反省 — 2026-06-27

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **承認待ち** — 下記 §2 改善案（R-DOC-12〜16）

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | PPTX パイロットでグラフがスライドからはみ出し | スライド幅 10 in と 16:9（13.333 in）座標の混同 |
| F2 | 浜田が `user-office-word` を Cursor UI で見つけられない | MCP 表示名（`office-word`）と AI 内部名（`user-office-word`）の説明不足 |
| F3 | 締め verify で `npm run verify:doc-lane-word-phase2` が **Missing script** | `keiei-kaigi` 追加時に package.json から word-phase2 行が **上書き消失** |
| F4 | python builder と 6月版 DOCX テンプレの **見出しアンカー不一致** | builder は固定文字列検索、6月版は別見出し（統計グラフ節）— R7 運用（MCP 手編集）未整理のまま builder 正本扱いが残存 |
| F5 | 経営会議 §1/§2 役割分担が runbook 化される前に口頭合意のみ | R7 をチャットで確定後、正本化が 1 ターン遅れた |
| F6 | Phase2 Word MCP **パイロット目視 OK 未実施** | infra 先行で「導入済」表記 — 実 DOCX 1 本の浜田 OK が未 |

**本日 CI**: GitHub Actions（constitution-gates / cursor-env-gates）— 本日 push 分 **すべて success**。ローカル是正: F3（本締めで package.json 復元 + governance 検査強化）。

---

## 2. 改善案（ミス削減）— **承認待ち**

| ID | 内容 | 反映先（案） | 種別 |
|----|------|--------------|------|
| **R-DOC-12** | **MCP 名称対照表**を doc-lane 全 runbook 先頭に必須（UI 名 / 内部名 / descriptor パス） | `doc-lane-docx-mcp.md` 型を PPTX runbook にも / `doc-lane-gate.mdc` | ルール |
| **R-DOC-13** | `verify:doc-lane-governance` が **package.json の verify:* 欠落**を検出（F3 再発防止） | `verify-doc-lane-governance.mjs` | スクリプト |
| **R-DOC-14** | 月次レポートは **R7 第一選択 = MCP + 前月 copy**、builder は **JSON 全文指定時のみ**と spec 明記 | `keiei-kaigi-security-report.md` §6 / phase2 spec | 運用 |
| **R-DOC-15** | builder のグラフ見出しを **テンプレ台帳の recommended 版に合わせて複数アンカー対応**、または builder を「浜田数値 prefill 専用」に縮小 | `build-monthly-security-report.py` | コード |
| **R-DOC-16** | Phase2 **クローズ条件** = 経営会議 DOCX パイロット 1 本 + 浜田目視 OK（現「導入済」表記を「infra 済・パイロット待ち」に統一） | phase2 spec チェックリスト / approved-changes | ゲート |
| **R-KEIEI-01** | 浜田が `C:\tmp\資料作成` に新 DOCX 配置時 → **registry JSON 更新**を AI 必須手順に | `keiei-kaigi-docx-registry.json` + runbook §2 | 運用 |

### §2.1 憲法・深掘り（構造問題）

doc-lane は **1 日で R-DOC-01〜11 + Phase1/2 + 経営会議正本**まで拡張した。**ルール追加速度 > パイロット検証速度** のため、「導入済」と「運用実績あり」が混同しやすい（F6）。  
今後は **infra commit** と **浜田目視 OK** を approved-changes で **別 ID** に分けることを提案。

### §2.2 本締めで実施済（コード・承認不要）

- F3: `verify:doc-lane-word-phase2` を package.json に復元
- R-DOC-13 草案: governance verify に npm script 存在チェック追加
- phase2 spec: MCP 名称表記修正（未 commit 分を本締めに含める）

---

## 3. 本日の成果（参照のみ — 詳細は git log）

| コミット | 内容 |
|----------|------|
| `fd454cc` | R-DOC-01〜10 自律運用ルール |
| `fa763b0` | Phase2 Word MCP infra |
| `8b9b4f2` | R-DOC-11 経営会議正本 + R7 + テンプレ台帳 |

**浜田確認済**: 5月・6月 DOCX ひな形（`C:\tmp\資料作成`）、PPTX パイロット目視 OK（グラフ修正後）、R7 役割分担 OK。

---

## 4. 承認依頼

浜田 GO 後に反映: **R-DOC-12 / R-DOC-14 / R-DOC-15 / R-DOC-16 / R-KEIEI-01**  
**R-DOC-13** は本締めコミットに含め済み（GO 記録のみ追記可）。
