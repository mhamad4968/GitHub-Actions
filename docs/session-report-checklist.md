# セッション報告用チェックリスト（AI → 浜田）

> **運用開始**: **2026-05-06 JST** — 本チェックリスト＋**`every-turn-rules-confirm.mdc` §1e**＋**hooks 自動検証**を、報告・日終わり・状況まとめのターンから **常時適用**（浜田 CEO 指示）。**報告時は □ 本文をチャットに貼付**し、CEO が **チャットだけで目視検収**できるようにする（ファイル参照のみ禁止）。**§P（2026-05-06 追補）**: **該当節のみ**貼ってよい。
> **目的**: チャット上の報告を **毎回同じ骨格**にし、**§1 欠落・破壊系先走り・確認不足**を防ぐ。  
> **厳格化（自動）**: **報告ターン**で応答末尾に **§M-2 の機械可読 7 行（V2）**が無い、**V1 のみ**、または **V2 四キー矛盾**があると **hooks が `stop` で自動フォロー**（再回答を投入）。実装は **`.cursor/hooks/report-checksheet-*.mjs`** と **`hooks.json`**（`beforeSubmitPrompt` / `afterAgentResponse` / `stop`）。**2026-05-08 CEO 命令**: 警告ログだけで済ませず **必ずフォロー**する。  
> **報告前自動判定（`report-checksheet-pending.mjs`）**: ユーザが「報告」意図のプロンプトを送る **直前**に **`session-clock.mjs check`** と **`npm run report:pipeline-status`** を実行。**NG** のとき Cursor の **`additional_context`** で **(A) 本チェックリスト通読** または **(B) `C:\\Users\\mhamada202408224\\Desktop\\AI緊急用` 配下の全ファイル Read**（どちらか一方以上・**推奨は両方**）を指示する。バイパス: 環境変数 **`SKIP_REPORT_PRECHECK=1`**（浜田承認下のみ）。ログ: **`logs/report-precheck.log`**／状態: **`.cursor/hooks/state/report-precheck-last.json`**。  
> **正本**: 本ファイル。Desktop 用の短縮版は **`chat-sessions/desktop-ai-emergency-read-pack/20-SESSION-REPORT-CHECKLIST.txt`**（`npm run session-starter:sync-desktop` で同期）。  
> **憲法**: 開発＝AI・**仕様確認・GO・検収＝浜田 CEO**（`AGENTS.md` §35-1 / §56-1a）。**実行後のダブルチェック（検証の 2 者）は AI 側**（本体＋ DeepSeek / Kimi 等の第 2 入力、または憲法が許す客体検証＋突合の組み合わせ。CEO は第 2 者の代わりにならない）— `every-turn-rules-confirm.mdc` §0・§1c、`constitution-enforcement-core.mdc`。  
> **CEO 受付ゲート（報告の認否）**: **ティア判定・【適用憲法】・`[🎖️ 本セッション割当]` の 3 つが欠けるものは「報告」として認めない**（浜田 CEO 定義）。**順守根拠の実務最小**は **`[ルール確認]` 1 行**（どの正本に従ったか）— `every-turn-rules-confirm.mdc` §1 では **上記に加え第 4 行として必須**のため、**チャット運用は 4 行フル**を推奨する。
>
> **健康表記（2026-05-09 CEO／CIO 追補）**: 報告の「健康状態確認」＝ **`npm run health-check`**（`scripts/health-check.mjs`）の **事実サマリ**。**§1 先頭4行を「心身の健康」と題さない**。**`TSB-001` を健康節に結び付けない**（`docs/troubleshooting.md` の TSB-001 は fileKey 孤児ラベルで、実行診断とは無関係）。**hooks が IDE に届かない経路**では、確定前に **`npm run cio:chat-report-selfcheck`**（`--stdin` / `--file`、必要なら `--strict-head` / `--require-v2`）で **禁止語と体裁を CLI 二重化**する。
>
> **報告・締め・GO 前の一発ゲート（2026-07-25 浜田承認・軽量化）**: 下書き作成後、**通常報告**は **`npm run cio:report-verify-response -- --file <path>`**（§1＋V2＋□A1）、**締め・GO仰ぎ**は **`npm run cio:close-report-verify-response -- --file <path>`**（前記＋CEO最低基準全文）を実行し **exit 0** を確認する。全文再掲を通常報告へ強制して結論を埋没させる運用は廃止する。
>
> **依頼に CEO 最低基準全文が含まれる場合（2026-05-09）**: ユーザメッセージに **`chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt` の非空行と同一の全文**が含まれるとき、**当該応答にも同一文字列を行単位で欠かさず再掲**する（省略・要約・「依頼を読んだので省略」禁止）。**「チャットに入っているから抜けてよい」は不存在**（正本 `CEO-MINIMUM-ABSOLUTE-BASELINE.txt` 最終行）。  
> **`session:bootstrap`／棚卸し直後の経緯報告**は **`chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7** — **応答最上段の §1 先頭4行（`[§1-2-3 ティア判定]`・`【適用憲法】`・`[🎖️ 本セッション割当]`・`[ルール確認]`）＋（1〜8・**3c**・4a）** を **別途フル充填** — **そのチェックシートのない経緯報告も認めない**（浜田 CEO 厳守・`every-turn-rules-confirm.mdc` §1e **1e-0**）。**3c**＝**`npm run verify:session-close-git-warn` 結果を必ず 1 行報告**（2026-06-29 CEO）。  
> **順守根拠**: 行動に入る前は **§1b**（関連 § の列挙＋方針 1 文）。報告では **`【適用憲法】`＋`[ルール確認]`** で **どの正本・どの § に従ったか**を残し、**ルール違反をしていないことの根拠**とする（空宣言禁止）。

### §3c-1. push 後 checkpoint Git 行（R-ML-03 GO 2026-06-29）

| タイミング | 手順 |
|------------|------|
| **full CLOSE 後** | `cio:session:close-git` が `syncCheckpointGitAfterPush` で checkpoint **`**Git**:` 行**を HEAD hash + origin 同期に自動更新 — **手書き「origin 未 push」禁止** |
| **D-CHKPT-02 WARN** | bootstrap で `mandatory-read-gate` が **checkpoint Git 行 stale** を検知したら **`npm run cio:checkpoint:git-heal -- --commit --push`**（または close-git）。**2026-07-20 抜本**: post-commit は回帰 NG 時に常時 follow-up heal（checkpoint 非含有 commit も含む）· `#S-CHKPT-PARENT-01` で tip^1 を subject 不問で許容 · cold-start Phase 6b で自動 heal。3 点検: `cio:checkpoint:git-heal -- --check` · `mandatory-read-gate` · `verify:session-close-git-warn`。amend/force 禁止は維持（#S-R44-SKIP-01） |
| **案件 CLOSED のみ / partial** | push 直後に `npm run verify:session-close-git-warn` を実行し、**OK 例** `Git残件: なし（clean・origin 同期・verify exit 0）` + 短 hash を checkpoint に 1 行転記 |
| **NG 時** | `Git残件: あり — 未コミット N 件 / ahead M / verify exit 1` + 分類（S-ML-01 reports/code）を報告。本題着手前に B1 整理 |

正本: `scripts/lib/cio-checkpoint-git-sync.mjs` · `session-close-execute-first.mdc`

---

## §M. hooks 検証用フッタ（報告ターン・応答末尾に必須）

**応答末尾に必須**（**V2 七行**）。`afterAgentResponse` フックが正規表現で検証し、欠落・V1 のみ・V2 矛盾のいずれかで `stop` で自動フォロー。

### §M-2. **VERSION: 2（推奨・2026-05-07 拡張）**

**4 新フィールドで、私が黙って §1c・§50-3-8・破壊級ガードを飛ばすのを物理的に検出する**。**`CHECKSHEET_VERSION: 2` のときは下記 7 行すべて必須**。各フィールドの値は **本ターンで実際に行ったこと**を書く（虚偽は §1e／`constitution-enforcement-core.mdc` 違反）。

```text
【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: deepseek|kimi|openrouter|none(reason=...)
SPEC_TOUCHED: yes|no
DESTRUCTIVE_OPS: none|<簡潔な列挙 例: kintone-PUT(2), deploy:678(1), file-delete(0)>
DRY_RUN_TO_APPLY_GAP: same-turn|>=1-turn|n/a
```

**矛盾検出（`report-checksheet-validate.mjs`）**:

- `SPEC_TOUCHED: yes` かつ `SECOND_REVIEWER: none(...)` で **`reason=` が空**または **「軽微」のみ** → **§1c・§50-3-8 違反**として **`stop` 自動フォロー**＋`logs/report-checksheet-violations.log` 記録＋パイプライン `FAILED_V2_CONSTRAINTS`
- `DESTRUCTIVE_OPS != none` かつ `DRY_RUN_TO_APPLY_GAP: same-turn` で **理由付帯なし** → **`kintone-destructive-rest-guard.mdc` 違反候補**として同様に **フォロー必須**
- **四キーのいずれか欠落**も **フォロー必須**（`MISSING_FIELD_*`）
- **`CHECKSHEET_VERSION: 1` のみ（3 行）**は受理せず **`V1_REQUIRE_V2` でフォロー**（パイプライン `FAILED_STRICT_V1`）

### §M-1. **VERSION: 1（後方互換・最小 3 行）**

旧形式。**hooks 厳格モード（2026-05-08〜）では報告ターンの `afterAgentResponse` 検証で受理されず**、**V2 七行への差し替えを `stop` が要求**する。チャット外のメモや **git commit メッセージのみ**など、hooks 対象外の用途に限定する。

```text
【セッション報告チェックシート】
CHECKSHEET_VERSION: 1
CHECKSHEET_OK: yes
```

---

## いつ使うか

- **中間報告**（大きな手のあと・方針転換の前）
- **セッション終了直前**（日終わり・切替の直前）
- **浜田に判断を仰ぐ直前**（GO が要る作業の前）

---

## §P. チャット貼付の範囲（部分貼付 OK・2026-05-06 CEO）

**hooks（`report-checksheet-validate.mjs`）が機械検証するのは応答末尾の 3 行のみ**（`【セッション報告チェックシート】` … `CHECKSHEET_OK:`）。**□ ブロックは次のとおり部分貼付でよい**。

1. **常に貼る**: **セクション A の `□ A` ブロック**（4 行＝ティア・憲法・🎖️・ルール確認）＋**`□ A1`（ダブルチェック：誰と・結果）**（**2026-05-08 追補・浜田 CEO**）。`□ A` は **`every-turn-rules-confirm.mdc` §1** と同内容。**A3（複数回看直し）**は **報告ターン・push 直前ターンでは常時**（該当外は `（該当なし）` 1 行）。
2. **該当するときだけ貼る**: **A2・A3（上記以外）・B・C・D・E〜I** の各見出しブロック。**そのターンで触れない節の見出しは省略してよい**。
3. **省略した節があるとき**（推奨）: 1 行で **`（該当なし: B§1c, C, D, …）`** のように列挙し、CEO が未記載を「スキップ」ではなく「非該当」と判断できるようにする。
4. **ミニ骨格**（`実績:` / `不可逆:` / `次 / 浜田GO待ち:`）は **中身がある行だけ**でよい（空欄は省略可）。

---

## A. 報告として認める最小ブロック（§1 先頭・欠いたら §1d）

**浜田 CEO が「報告」として受け付ける条件**: **A1 の 3 行**（ティア・憲法・🎖️ 本セッション割当）が **揃っていること**。欠けていれば **報告として認めない**。  
**次の 4 行は `every-turn-rules-confirm.mdc` と同一ラベル・同一順**（**第 4 行 `[ルール確認]`＝ルール違反をしていないことの根拠**）。

- [ ] **`[§1-2-3 ティア判定: L1|L2|L3]`** を **1 行**（根拠 **1 語以上**）
- [ ] **`【適用憲法】`** を **1 行**（依拠する **`AGENTS.md` の §** を列挙した要約。純メタのみなら `§なし（憲法スコープ外）` 等で可）
- [ ] **`[🎖️ 本セッション割当]`** を **1 行**（CIO / DeepSeek / Kimi / OpenRouter の割当。**CEO は検収・GO**。未使用は「未使用」と明記。継続なら「継続・前ターンと同割当」可だが **1 行必須**）
- [ ] **`[ルール確認]`** を **1 行** — **どの正本を Read したか**（パス列挙）。**これが「ルール違反をしていない根拠」の表層**（触れていないなら `→ 本応答内で直後に Read` と書いたうえで実施）。**kintone DELETE／破壊級 REST** ターンは **`kintone-destructive-rest-guard.mdc` Read 済み**を含める

### A1. ダブルチェック（誰と・結果）— 報告常時（浜田 CEO・2026-05-08 追補）

**CIO 体制の 2 者**（`constitution-enforcement-core.mdc`）について、浜田が **チャットだけで検収**できるよう、**相手**と**結果**を必ず残す（**「実施した気」1 語禁止**）。

**#S-REPORT-A1（2026-08-03 浜田 GO）— 正しい1行例（貼付ラベル）**

| 種別 | 文面 |
|------|------|
| **正** | `□ A1 ダブルチェック（誰と・結果）` |
| **誤（verify NG）** | `□ A1 ダブルチェック` / `□A1: ダブルチェック DeepSeek=ok`（**「誰と」括弧なし**） |

続けて着手前／検証締め／`ダブルチェック要約:` を書く。手書きより **`npm run cio:report:draft -- --out <path>` → 事実置換 → `npm run cio:report-verify-response -- --file <path>`** を優先（#M-REPORT-01）。

**T5（2026-08-09）**: 報告下書きは **先に** `cio:report:draft`（alias `cio:report-draft`）または medal／□A1 テンプレ固定から始める（手書きラベルから始めない）。  
**RULE-2（同）**: verify **初回 NG** は失敗に数え、**同一ターン**でテンプレ修正→再 verify までを完了定義に含める。  
**R4（2026-08-10）**: `cio:report:draft` 生成物に **□A1 許容語彙サンプル**（HTML コメント）が同梱される。要約行には `DeepSeek`／`第2者`／`非該当` 等を必ず1語以上残す（`scripts/cio-report-draft.mjs`）。

- [ ] **着手前（§50-3-8 相当）**: **第2者を誰にしたか**（DeepSeek / Kimi / 両名 / OpenRouter / **無**）と、**短問の要旨**＋**回答の要旨**（**1 行以上**）。**コード変更・憲法改定級・deploy 級を含まない本報告**なら **`（着手前ダブルチェック: 非該当 — 理由1語以上）`** でよい。**スキップ**なら **`§50-3-8 スキップ理由:`** と同内容を **ここに再掲**するか、**§C へ誘導する 1 行**（いずれかで CEO が追えること）。
- [ ] **検証締め（§1c 相当・該当時）**: **完了／検証済／デプロイ OK** 等を本報告に含める場合、**誰の視点で何を突合したか**＋**結果**（例: **コマンド名・exit 0**、第2者の **指摘→反映**）を **1 行以上**。**該当しない**なら **`（検証締めダブルチェック: 非該当）`** 1 行。
- [ ] **要約 1 行（必須）**: 次のラベルで固定: **`ダブルチェック要約:`** — 例: `ダブルチェック要約: DeepSeek に短問→抜けなし・本体突合済`／`ダブルチェック要約: DeepSeek+Kimi 同一短問→CIO 突合問題なし`／`ダブルチェック要約: 無（純方針・§50-3-8 スキップ理由: README 誤字のみ）`

**末尾 V2 の `SECOND_REVIEWER:`** と **矛盾しないこと**（虚偽は hooks・憲法違反）。

### A2. 行動に入る直前（§1b・報告内で要約してよい）

- [ ] **関連 `AGENTS.md` § を列挙**し、**方針 1 文**を残してから編集・Shell・deploy に着手した（本報告が **事後**なら、当該作業ブロックで **すでに満たした旨**を 1 行でよい）

### A3. 複数回自己見直し（CEO 命令・2026-05-08）

**チャット送信直前・報告ターンの応答確定直前・`git push` 直前**に、**心の中の確認に相当する省略は禁止**。**最低 2 回**、観点を変えて見直す。**Tier B・不可逆操作・報告ターン・憲法／hooks 正本の改定を含むターン**は **3 回目まで必須**。

- [ ] **第 1 見直し（事実・証跡）**: コマンド結果・パス・差分・ログの引用が **本文と矛盾しないか**
- [ ] **第 2 見直し（形式・ゲート）**: §1 四行・§P・**§M-2 の V2 七行**・§1c（該当時）・hooks が要求する末尾が **欠けていないか**
- [ ] **第 3 見直し（CEO 検収・再発）** — **上記トリガーのいずれかに該当するターンは必須**: 根因・再発条件・**浜田が読んで誤解しないか**（該当しないターンは **`（第3見直し: 該当なし — …）` 1 行**で明示）

各見直しで直したら **チャットに 1 行ずつ**残す（例: `【見直し1】…` `【見直し2】…` `【見直し3】…`）。報告ターンでは §P の □ ブロック内にまとめてもよい。

---

## B. 仕様ラベル・AI 側検証の 2 者（§1c・該当ターンは省略禁止）

**`[検証2者: …]`** は **浜田 CEO の確認の代わりではない**（CEO は §0 表どおり **GO・検収**）。**完了・デプロイ OK・検証済**等を宣言するターンは **憲法どおり AI 側で 2 者**（例: **DeepSeek 視点 1 問＋本体突合＋ `npm …` exit 0**、または **`§50-3-8 スキップ理由:`** と客体検証の組み合わせを **1 行で具体**）。**本体単独の「検証した気」は不可**。

- [ ] **`[仕様状態: 確定 | 仮決(条件=…) | 未決 | なし]`** — 仕様の意味に触れるターンは必須（純メタのみ `なし`）
- [ ] **`[検証2者: …]`** — 上記 **締め宣言トリガー**に該当するなら **必須**（曖昧な省略禁止）

---

## C. §50-3-8（該当する着手の直前）

- [ ] **DeepSeek 1 問**（盲点抽出）＋**突合メモ約 3 行**  
  または  
- [ ] **`§50-3-8 スキップ理由:`** 1 行（ルールのみ・既承認の繰り返し等）

---

## D. kintone 破壊級（DELETE・全件入替・アプリ設定の破壊）

正: **`docs/kintone-destructive-operations.md`** ＋ **`.cursor/rules/kintone-destructive-rest-guard.mdc`**

- [ ] **dry-run（既定のみ）**で得た **対象一覧（id・見出し等）をチャットに貼付済み**
- [ ] 浜田から **`この一覧で削除 GO`**（または同等の明示 GO）を得た（**得るまで `--apply` しない**）
- [ ] 可能なら **UI 非表示のみ先行**、**物理削除は別コミット／別ターン**（合意どおりならその旨 1 行）

---

## E. 実績（事実のみ）

- [ ] **ブランチ名**・**コミット**（未コミットなら理由 1 行）
- [ ] 触った **正本のパス**（例: `kintone-apps.md` の **行・アプリ ID**）
- [ ] 本番 kintone を触れたら **deploy 結果**（fileKey / preview revision / **BUILD** など、運用で決めた最小セット）

---

## F. 高リスク・不可逆

- [ ] **不可逆だった操作**を列挙（なければ **「なし」**）
- [ ] 復旧手段・監査の有無（該当時 1 行）

---

## G. 次の 1 手と判断待ち

- [ ] **次にやること**（最大 3 行）
- [ ] **浜田 GO が必要な項目**を分離（何の GO か明記）

---

## Q. 月次情報セキュリティレポート（doc-lane・着手前）

正本: [`docs/runbooks/monthly-security-report.md`](runbooks/monthly-security-report.md) §0

- [ ] **対象月・テンプレ docx**（前月レポート）パス確定
- [ ] **§1 ソース PDF**（社内月報）§1 取得済
- [ ] **SKYSEA / ネットワーク検知件数** — 確定値 or プレースホルダ明示（`detection_confirmed: false`）
- [ ] **社外事例** — 件数・出典確定 or プレースホルダ明示
- [ ] **`npm run doc-lane:security-report`**（JSON 更新 → 出力 docx 確認）
- [ ] 書式: **`scripts/lib/docx_template_format.py`**（prefix は strip 前 raw）

---

## H. read-pack / Desktop（リポで read-pack 等を変えたターン）

- [ ] **`npm run session-starter:sync-desktop`**（`/mnt/c` がある環境で）
- [ ] 運用に含めるなら **`npm run verify:desktop-ai-emergency-sync`**

---

## I. 引き継ぎ 1 行（任意だが推奨）

- [ ] **`chat-sessions/handoff-log.md`** に **1 行**（合意・コミット・次の 1 手のいずれか）

---

**貼付テンプレ（チャット用・CEO が「報告」として受け付ける最小骨格）**

```text
[§1-2-3 ティア判定: L?]（根拠: …）
【適用憲法】…
[🎖️ 本セッション割当] …
[ルール確認] …（= 順守根拠: Read 済み正本・§）
---
□ A1 ダブルチェック（誰と・結果）— 着手前／検証締め（該当時）／要約1行（ダブルチェック要約: …）
---
（§1c 該当時）
[仕様状態: …]
[検証2者: …]（AI 側 2 者。CEO 代替禁止）
---
実績: …
不可逆: なし | …
次: … | 浜田 GO 待ち: …
---
（□チェックリスト本文 …）
【セッション報告チェックシート】
CHECKSHEET_VERSION: 1
CHECKSHEET_OK: yes
```
