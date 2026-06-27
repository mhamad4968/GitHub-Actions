# 夕反省 — 2026-06-27

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田 GO 2026-06-27** — R-DOC-12〜16 + R-KEIEI-01 すべて反映済

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

## 2. 改善案（ミス削減）— **GO 2026-06-27 すべて反映済**

| ID | 内容 | 反映先 | 状態 |
|----|------|--------|------|
| **R-DOC-12** | MCP 名称対照表 | `doc-lane-pptx-mcp.md` / `doc-lane-gate.mdc` | ✅ |
| **R-DOC-13** | verify:* 欠落検出 | `verify-doc-lane-governance.mjs` | ✅ |
| **R-DOC-14** | R7 第一選択 = MCP + 前月 copy | `keiei-kaigi-security-report.md` §6 / phase2 spec | ✅ |
| **R-DOC-15** | builder 複数アンカー | `build-monthly-security-report.py` | ✅ |
| **R-DOC-16** | Phase2 クローズ = パイロット + 目視 OK | phase2 spec / approved-changes | ✅ |
| **R-KEIEI-01** | 新 DOCX → registry 更新 | `keiei-kaigi-security-report.md` §2 | ✅ |

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
| `d84ccf3` | 夕反省 + verify 復元 |
| *(本締め)* | R-DOC-12〜16 + R-KEIEI-01 + Desktop sync |

**浜田確認済**: 5月・6月 DOCX ひな形（`C:\tmp\資料作成`）、PPTX パイロット目視 OK（グラフ修正後）、R7 役割分担 OK。

---

## 4. 承認記録

**浜田 GO 2026-06-27**: R-DOC-12 / R-DOC-14 / R-DOC-15 / R-DOC-16 / R-KEIEI-01 — 本締めで反映。R-DOC-13 は先行反映済。
