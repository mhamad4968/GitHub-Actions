# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-25 朝〜昼 JST — **セッション中断（夕方再開）**。App756 UIクロム目視OK＋依頼者確認メール再送済。未push分は本締め前に commit/push 必須。

**Git（締め時に更新）**: 締め処理で `origin/main` と一致させる（ahead 放置禁止・force禁止・stash pop 禁止＝先祖返り防止）。

## 本日状態（2026-07-25）

### App 756（実行予算 Ver.02）LIVE 正
| 項目 | 値 |
|------|-----|
| BUILD | `2026-07-25-ver02-actual-right-10px` |
| revision | **103** |
| fileKey | `61178d0c-7268-4147-a3da-885cbeed3ee0` |
| customize | `customize/jikkou-yosan-v2-app1/desktop.js`（ui → build） |
| SPEC | `docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` §6.2 |

**浜田目視 OK（本日）**
- 文字サイズ 標準／大／特大（固定メニュー・`localStorage` `jy2-font-scale`）… C11
- 縦スクロール（sticky spacer 揺れ修正後）
- 表題下の大余白解消
- 右端罫線・横スクロール（100%ズーム）
- 予実: ヘッダ沈み解消（縦 sticky 禁止）・一重スクロール・右息抜き **10px**（6pxから左へ+4の意図。2pxは逆で不採用）

**触らない**
- 735/736 WRITE 禁止・736 保持
- 688（許可外）・677–679・SKYSEA 実PC・712 deploy 禁止

### 依頼者（7/27）
- **確認メール再送済**（浜田 2026-07-25）
- 下書き正本: `docs/plans/2026-07-25-jikkou-yosan-ver02-requester-meeting-email-draft.md`
- 7/27: 口頭確認＋メール回答依頼
- 優先合意（本日）: ①文字サイズ済 → ②LIVE目視済 → ③依頼者メール済 → 次④DD（R-19/20）→ ⑤Excel投入（データ待ち）

### App 674（PC台帳）
- 購入先 DROP_DOWN に **コジマ／ツクモ** 追加・浜田目視OK（本日朝）
- 控えJSON: `scripts/data/pc-ledger-674-add-purchase-fields.json`（UTF-8・大塚商会/FBJ/KDDI/コジマ/ツクモ）

### 環境
- DeepSeek MCP: 旧 `deepseek-chat` 廃止対応で **v4 ラッパ**（`scripts/mcp-deepseek-v4/` + `verify:deepseek-mcp-v4`）。空応答が出ることがある → §50-3-8 は理由付きスキップ可／OpenRouterフォールバック
- H9 / △2: reviewDate=**2026-07-25**（早期 GREEN/降格禁止の観測日）。夕方再開時に評価結果を確認可

## 夕方再開時の次の1手（迷子防止）

1. Desktop `00-NEW-SESSION-STARTER_yyyymmdd.txt` 貼付 → `npm run session:bootstrap`（OKまで着手しない）
2. 本ファイル＋ `handoff-log.md` 末尾ブロック Read
3. **LIVE BUILD 確認**: `data/cio-live-builds.json` の 756 が `ver02-actual-right-10px` / rev103 であること。違う＝先祖返り疑い → **旧 BUILD を載せ直さない**。正は本日コミット群＋registry
4. 次作業候補（§41で1つ選ぶ）:
   - ④ DD整理（R-19 名称規格1/2＋工種別切替一覧 / R-20 取引先）— 依頼者回答待ちでも社内棚卸し可
   - 依頼者回答のSPEC反映（来たら）
   - Excel案件追加投入（依頼者データ待ち）
   - H9 正式評価記録（本日が reviewDate）
5. 756 を触るなら: env `JIKKOU_YOSAN_V2_BUILD` を消してから build。deploy 後は **同一セッションで R63 commit**（customize + kintone-apps + cio-live-builds）

## 継続メモ（残）

| # | 内容 | 状態 |
|---|------|------|
| R-11/12/13 | 諸経費・法定福利・各種保険の正式式 | 依頼者回答待ち（再送済） |
| R-19/20 | 名称規格・取引先リスト | 依頼者整理依頼済 |
| R-05/07 | 空工種番号・未使用候補 | 同上 |
| Excel投入 | 追加案件 | データ待ち |
| 版管理 | 確認事項なしとメール記載 | 打合せで追加があれば受領 |

## クローズ済み・制約（要約）

- 案件クローズ9件: `data/cio-project-closures.json`
- 688 WBGT以外触らない / 677–679触らない / SKYSEA 8/3まで実PC禁止 / 736触らない / 712 deploy禁止

## セッション切替（Lifecycle v2）

**正本** `docs/runbooks/session-lifecycle-v2.md`  
**WAKE** `npm run cio:session:cold-start` → **項番 -0** → `npm run session:bootstrap`  
**禁止**: stash pop で古い tree を被せる／force push／旧756 customize を再deployして今日の UI を潰す

<!-- archive hint: 夕方再開後に日締めするとき archive へ退避可 -->
