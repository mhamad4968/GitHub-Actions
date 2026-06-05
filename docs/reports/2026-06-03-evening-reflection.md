# 夕反省 — 2026-06-03 JST

> **役割**: AI の失敗＋**ミス削減のアップデート案**のみ。  
> 正本: `docs/runbooks/evening-reflection-scope.md`

---

## AI の失敗・反省

| # | 失敗 | 再発原因 | 対策 ID |
|---|------|----------|---------|
| F1 | PPTX 4枚目修正後、浜田側で**更新されていない**ように見えた | `text_frame` 追記のみで旧文言残存／保存先の確認不足 | P1, P2 |
| F2 | PowerPoint MCP が**ファイル名不一致**で open 失敗 | ハードコードパス（「浜田付き」等の推測名） | P2 |
| F3 | 応用情報の取得目安を**3～4年**と記載（方針と不一致） | 1～3枚目カードの「初学4年」を人事説明にそのまま転記 | P3, P4 |
| F4 | 必須／推奨／任意を**複数回**修正 | 初回作成時に浜田確定の区分表を先に固定していない | P4 |
| F5 | Windows で Python **heredoc 実行失敗** | PowerShell は `<<'PYEOF'` 非対応なのに試行 | P5 |
| F6 | Apple ID **jbis プール行**が管理画面を混乱させた | 移行仕様（未割当プール skip）と UI 表示の整合を先に説明・削除手順化せず | P6 |
| F7 | セッション締め時 **git commit 未実施**のまま終了しうる | 実装完了＝締め完了と誤認／close gate 前に浜田 OK で区切った | P7 |

---

## アップデート案 — **全 GO（2026-06-03 浜田）**

| ID | 内容 | 状態 | 反映先 |
|----|------|------|--------|
| **P1** | PPTX パッチは **`text_frame.clear()` 必須**＋保存直後 verify | **GO** | `docs/runbooks/pptx-patch-windows.md` |
| **P2** | PPTX パスは **`Path.glob('*.pptx')` 解決**のみ | **GO** | 同上 |
| **P3** | 資格ロードマップ **JSON 正本1本** → 1～4 枚目同期 | **GO** | `scripts/data/qualification-roadmap.json` + `docs/runbooks/qualification-roadmap-pptx.md` |
| **P4** | 人事スライド編集前に **区分表1回提示→OK** | **GO** | `pptx-patch-windows.md` |
| **P5** | Windows 編集は **`C:\tmp\*.py` ファイル化**（heredoc 禁止） | **GO** | `pptx-patch-windows.md` |
| **P6** | Apple ID プール削除 **移行後 checklist** | **GO** | SPEC §10.5 |
| **P7** | 浜田 OK 後 **同一セッションで git close warn** | **GO** | `SESSION-BOOTSTRAP-CHECKLIST.md` 日終わり |
| **P8** | 資格 PPTX 正本パスを **checkpoint 常時1行** | **GO** | `checkpoint-latest.md` 先頭表 |

**反映**: 2026-06-03 締めターンで runbook / SPEC / JSON へ追記済。

---

## 夕反省に書かないもの

- 本日成果 → **19 / SESSION-CLOSE**
- 凍結・クローズ → **checkpoint**
- **明日やること・スケジュール・第1手** → 書かない（**2026-06-03 浜田**）
