# 成果物・アーキチE��ト（§31〜§33�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: 納品・図解・外部調査  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§31 納品・§32 図解・§33 外部調査。調査3スチE��プ�E根拠、E

## ぁE��読む�E�チェチE��リスト！E

- C:\tmp 納品
- アーキ図
- 公式Doc調査

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第9章 成果物管琁E

### §31 成果物納品プロトコル�E�E026-04-15 制定！E
完�Eした成果物�E�ETML・JS・ドキュメント等）�E、以下�Eルールで納品する:
1. **納品場所**: `C:\tmp\<YYYYMMDD>-<枝番>\`�E�ESL: `/mnt/c/tmp/<YYYYMMDD>-<枝番>/`�E�に配置する。同一日の褁E��回納品は枝番�E�E1, -2, -3...�E�で管琁E��る、E
2. **視認性**: 隠し属性を付けず、標準パーミッションで作�Eする。Windows エクスプローラーで即座に確認できること、E
3. **報呁E*: 納品完亁E��、チャチE��で **納品先�Eフルパス** を報告する、E
4. **プロジェクト正本との刁E��**: `C:\tmp` は「検収場」。正本は `kintone-ai-lab/` のまま。納品先�E差し戻し用のスナップショチE��として機�Eする、E
5. **Kintone 運用ガイド�E本番反映**: `docs/ops-guide/*.html` を改修したら、E*`npm run ops-guide:publish`**�E�レコード同朁E+ `customize/ops-guide/desktop.js` のチE�Eロイ�E�までを一連の完亁E��する。�E回�Eみ **`npm run ops-guide:init`** と `.env` の **`KINTONE_OPS_GUIDE_APP`**�E�コンソール表示値を追記）。手頁E�E正本は **`docs/ops-guide/KINTONE-AUTO.md`**、E

---



## 第10章 アーキチE��ト�E力！E026-04-15 制定！E

### §32 図解義務化�E�Eisual Documentation�E�E
3アプリ連動など**褁E��アプリ・褁E��スチE��プにまたがる�E琁E*を実裁E�E改修する際�E、以下を忁E��行う:
1. **Mermaid フロー図を作�E**し、`docs/` 冁E�E設計書に埋め込む
2. 図には**アプリ間�EチE�Eタフロー**�E�どのフィールドが・どこから�Eどこへ�E�を明示する
3. 図を見れば**コードを読まなくても�E琁E�E全体像が�Eかる**状態にする

利用チE�Eル: Markdown 冁E�E `mermaid` コードブロチE���E�EitHub / エチE��タプレビューで表示可能�E�、E

### §33 外部知見�E検証�E�External Intelligence�E�／事前調査義務（重要ルール 2026-04-16 強化！E

#### §33-A 実裁E��の事前調査義務（着手前に忁E��実施�E�E
**未経騁E/ 不確宁E/ 失敗実績のある領域に着手する前に、忁E�� MCP およびネットで類似事例�Eベスト�EラクチE��ス・既知の制紁E��調査する**。「とりあえず書ぁE��試す」を最初�E一歩にしなぁE��E

**忁E��トリガー�E�以下�EぁE��れかに該当する場合�E調査忁E��！E**
- Kintone カスタマイズの新領域�E�カスタムビュー / iframe 埋め込み / ファイル操佁E/ OAuth / プラグイン連携 など�E�E
- ブラウザ標溁EAPI の挙動ぁECSP / sandbox / iframe で変わる可能性がある領域�E�EpostMessage` / `position:sticky` / `srcdoc` / `service worker` 等！E
- 同一チE�Eマで一度でも失敗した経験がある領域�E�§14 の方針転換と連動！E
- 外部 SaaS / API の最新仕様確認！Eintone REST API の制限値、Microsoft Graph、Google Workspace 等！E
- セキュリチE�� / 暗号 / 認証関連�E��E己流実裁E�E §18 違反リスク�E�E
- **kintone API の特殊仕様！E026-04-20 追加 / TSB 教訓！E*: `change.<field>` イベントが Promise/Thenable めEreturn できなぁE/ lookup フィールドへの API 書き込み制紁E/ サブテーブル更新時�E id 忁E��E/ kintone クエリの演算子制紁E��Eype/RADIO_BUTTON は in/not in のみ�E�E ルチE��アチE�Eと計算フィールド�E API 更新で即時反映されなぁE筁EↁE**実裁E��に公式また�E既存コードで 1 スチE��プ確誁E*してからコード書く、E026-04-19 の `change.user_name` で async 書ぁE�� Thenable エラーで止まった事例が教訁E

**調査スチE��プ（最佁E3 つ実施してから着手！E**
1. **公式ドキュメンチE*: cybozu developer network、MDN、RFC、各 API 公式リファレンス�E�Efetch` MCP / `WebFetch`�E�E
2. **既知事侁E*: GitHub の同等実裁E��検索�E�Egithub` MCP の code search。WSL では **`gh`** を優先）。ライセンス確認も同時に
3. **失敗事侁E/ 既知の落とし穴**: Stack Overflow / Zenn / Qiita / Cybozu Developer Network フォーラムめE**`duckduckgo-search` MCP** で検索�E�「issue」「workaround」「limitation」「does not work」を絁E��合わせる�E�E
4. **社冁E��レチE��**: `kintone-ai-lab/docs/troubleshooting.md`�E�ESB-XXX�E�と RAG�E�Erag` MCP�E�を検索。過去の自刁E�E教訓が最大のヒンチE

**結果の活用:**
- 着手前にユーザーへ「調査の要点�E�既知制紁E1-3 点�E�」を 2-3 行で要紁E��告する、E
- 採用したアプローチがなぜ妥当か、調査結果を根拠として 1 行添える、E
- 調査で「この方法�E環墁E��紁E��動かなぁE��と判明したら、即 §14 を発動して別アプローチへ、E

**今回の事例（反省記録 2026-04-16�E�E**
- iframe srcdoc + sandbox 冁E�� `position:sticky` / postMessage 自動リサイズが不安定な件は、事前に MDN / GitHub Issue めE5 刁E��べてぁE��ば最初から避けられた、E 回�E失敗を経てユーザーから明示皁E��持E��されてから方針転換した（手戻り発生）、E
- 教訁E **新しい埋め込み環墁E��Eframe / sandbox / Kintone カスタムビュー�E�に手を入れる前�E、忁E��「既知制紁E��査」を 1 スチE��プ挟む**、E

#### §33-B 外部コード採用時�E検証
GitHub・npm・Stack Overflow 等から外部コードを参老E��する際�E、以下を自己検証してから適用する:
1. **§13 適吁E*: ネイチE��チEAPI / 標準仕様で同じことができなぁE��先に確認。外部ライブラリは最後�E手段
2. **§18 セキュリチE��**: API ト�Eクン・認証惁E��の漏洩リスクがなぁE��
3. **kintone 互換性**: `kintone.events.on` のコールバック制紁E��`kintone.api` の非同期仕様と矛盾しなぁE��
4. **ライセンス**: MIT / Apache 2.0 等�E許容ライセンスであることを確誁E

安�Eなコピ�Eは禁止。外部コードを使ぁE��合�Eコメントに**出典 URL**を記載する、E

#### 利用チE�Eル�E�優先頁E��！E
1. `rag` MCP  E社冁E��レチE���E�最速�E最も信頼�E�E
2. `fetch` MCP / `WebFetch`  E公式ドキュメント直接取征E
3. `duckduckgo-search` MCP  EWeb 検索�E�E*`tavily` は 2026-05-06 削除渁E*�E�`docs/mcp-status.md`�E�E
4. `github` MCP  E実裁E��例�EIssue 検索�E�ESL では **`gh`** を優先！E
5. `cve-search` MCP / `cyber-news` MCP  EセキュリチE��関連時�Eみ

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

