# 前文・体系図・読み方

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: 初回着手�E全体像の把握  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

憲法�E地図・mermaid フロー・予宁EPC台帳レーン刁E��。�E斁E��読の代わりにここで全体像だけ掴む、E

## ぁE��読む�E�チェチE��リスト！E

- 新規タスク
- レーン混同�E不安があるとぁE

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 作業レーンの刁E��替え！EIO メモ・2026-05-04�E�E

- **部署予宁E*�E�Eintone **677�E�E78�E�E79**・主に **Space 54**�E�と **PC台帳系**�E�E*674�E�新・正�E�E*・**旧594�E�削除予定�E新規禁止�E�E*・**668** 等�E**Space 21** ほど�E��E **別案件**。着手前に **ぁE��どちら�EレーンぁE*を�E示し、E*アプリ ID・URL は `kintone-apps.md` で照吁E*する�E�混同防止�E�、E*594 を前提にした新仕様�E採用しなぁE*�E�Edocs/plans/2026-04-21-new-pc-ledger-spec.md` **§1.5**�E�、E*本番に594を参照専用で恒乁E��に残す前提はなぁE*、E
- **単独作業は原則禁止**�E�チーム運用�E�E 本番チE�Eロイ・仕様確定�E一括変更めE**一人で完結させなぁE*。レビュー・ペア・声かけ・承認を挟�E。予実�E索引�E **`templates/yojitsu-budget-lite/HANDOFF.md`**、E
- **MCP 実務**: 着手前チェチE��・タスク別優先表の **要点**は **`chat-sessions/desktop-ai-emergency-read-pack/08-READ-06.txt`**�E�ECP 節�E�と **`chat-sessions/SESSION-CLOSE-REPORT-20260504.txt` §6**、E

---

## 🗺�E�Eルール体系図�E�一目で全体像を把握�E�E

```mermaid
flowchart TD
  Start([🚀 タスク受領]) --> Preflight[🛫 プリフライトチェチE��<br/>~/.cursor/rules/preflight-checklist.mdc<br/>alwaysApply]

  Preflight --> Time[0�E�⃣ §34 時刻認識]
  Time --> Index[1�E�⃣ §0 RULES-INDEX 即答カード参照]
  Index --> Research{2�E�⃣ §33-A<br/>事前調査済み�E�}

  Research -->|No| DoResearch[公式Doc / GitHub / Tavily / RAG<br/>最佁EスチE��チE+ ユーザーへ要紁E��告]
  DoResearch --> SameFail
  Research -->|Yes| SameFail{3�E�⃣ §14<br/>同じ失敗を<br/>繰り返してなぁE��}

  SameFail -->|繰り返し| Pivot[戦略転揁E/ 代替桁E件以丁E提示]
  Pivot --> Quality
  SameFail -->|OK| Quality[4�E�⃣ §15 完�E度4要件設訁Ebr/>ルール / 日本語コメンチE/ エラーハンドリング / 検証可能性]

  Quality --> Declare[5�E�⃣ 一言宣言]
  Declare --> Build[💻 実裁E

  Build --> Native{§13<br/>ネイチE��チE標溁Ebr/>優先？}
  Native --> Sec{§18<br/>秘寁E��報<br/>非露出�E�}
  Sec --> KAPI{§4-§8<br/>kintone規紁Ebr/>準拠�E�}
  KAPI --> Verify[§9-§12 検証]

  Verify --> WebUI{Web UI<br/>変更�E�}
  WebUI -->|Yes| WebQ[§26-§30<br/>視覚検診 / a11y / 性能 / レスポンシブ]
  WebUI -->|No| Deliver
  WebQ --> Deliver[§31 C:\tmp 世代納品]

  Deliver --> Report[§37 簡潔報告]
  Report --> KB[📚 §19-§21<br/>RAG / troubleshooting.md / RULES-INDEX 更新]
  KB --> End([✁E完亁E)

  style Preflight fill:#fff3cd,stroke:#856404,stroke-width:3px
  style Research fill:#d1ecf1,stroke:#0c5460,stroke-width:2px
  style SameFail fill:#f8d7da,stroke:#721c24,stroke-width:2px
  style Pivot fill:#f5c6cb,stroke:#721c24,stroke-width:2px
  style DoResearch fill:#d4edda,stroke:#155724,stroke-width:2px
```

**読み方**:
- 黁E�� = 忁E��最初に通る関門�E��Eリフライト！E
- 水色 = 判断刁E��（事前調査�E�E
- 赤色 = 危険サイン�E�同一失敗繰り返し�E��E 戦略転換忁E��E
- 緑色 = 健全な行動

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

