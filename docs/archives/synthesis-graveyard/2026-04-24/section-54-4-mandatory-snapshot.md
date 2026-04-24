# §54-4 制定議論: Mandatory Pre-Op Snapshot (浜田 B 案 / 全件 snapshot 路線)

**日付**: 2026-04-24 21:14  
**Synthesis 元 commit**: (本ファイル commit 直後)  
**§54-4 候補 2 = 浜田 B 案 (cost OK / 全件 snapshot) 採用 / Sonnet 反定立 5 件は部分採用**

## 経緯

1. **21:01-21:03** メイン AI 原案 (全件 snapshot 必須 + emergency 例外スキップ可 + 30 日保存) → Sonnet 反定立 21:03 で 5 件致命的指摘
2. **21:05-21:07** メイン AI 「軽量化合」(Pre-Op Verification = 公式リビジョン優先 + 軽量 Snapshot + dry-run + emergency 厳格化 + rate limit 配慮) を浜田に提示
3. **21:08** 浜田「自律優先 / cost OK」明示 + §54-3 (Operation Frequency) 廃止指示
4. **21:09** 浜田 B 案 GO (§54-3 廃止 + 候補 2 全件 snapshot 路線)
5. **21:14** §54-4 全件 snapshot 路線で確定 (Sonnet 反定立は部分採用)

## 棄却された案 (Sonnet 直接書込相当 = §54-2-1 Sonnet 書込権限)

### 反 1: メイン AI 「軽量化合」(Pre-Op Verification) (浜田 B 案で棄却)

**棄却された案**: メイン AI が Sonnet 反定立を踏まえて提示した「軽量化合」:
- 公式リビジョン優先 / 独自 Snapshot は最小限 (件数 + 主要 ID + 差分のみ / 1 KB-100 KB)
- dry-run 強制
- snapshot は §54-3 操作頻度カウント外
- 保存期間 7 日 (30 日 → 7 日)

**棄却理由 (浜田 B 案 21:09)**:
- 浜田「コストは掛かってもいい」明示 = 軽量化の根拠 (cost 配慮) が消失
- 全件 snapshot のほうが復旧時の確実性高い (浜田 cost OK 方針と整合)
- 7 日 → 30 日に戻す (cost OK = ディスク懸念も後退)

### 反 2: Sonnet 「Snapshot 完全廃止 / 公式リビジョン + dry-run のみ」 (浜田 B 案で棄却)

**棄却された案**: Sonnet 反定立 21:03 の代替案 = 「Snapshot 機構を完全廃止し、代わりに dry-run 強制 + 浜田明示承認ログのみにすべき。git 操作は HEAD ハッシュを判断ログに記録するだけで復元可能。kintone 破壊的操作は kintone 公式リビジョン履歴 + 操作前の件数ログ (軽量) で十分」。

**棄却理由 (浜田 B 案 21:09)**:
- Snapshot 廃止 = 浜田の「最後の砦」期待と不一致
- TSB-006 級事故時に「リビジョン履歴」は kintone 内のレコードであって WSL 側からは即時復元不可
- 浜田 cost OK 方針 = Snapshot 維持コストは許容範囲

## Sonnet 反定立 5 件の取扱 (部分採用)

| Sonnet 指摘 | 取扱 | 理由 |
|---|---|---|
| 1. 既存インフラで代替可能 | ⚠ 部分採用 | リビジョン番号は活用 / 独自 snapshot も維持 (浜田 cost OK) |
| 2. emergency 例外 = 制度の自殺 | ✅ 全面採用 | §54-4-6 でスキップ全廃 (致命的盲点指摘) |
| 3. §54-3 操作頻度と複合 | ✅ 全面採用 | §54-3 廃止で消失 |
| 4. rate limit / JSON 巨大化 / レースコンディション | ⚠ 部分採用 | rate limit/JSON 巨大化は浜田 cost OK で許容 / レースコンディションは §54-4-7 対策 |
| 5. 代替案 (Snapshot 廃止) | ⚠ 部分採用 | リビジョン活用は採用 / Snapshot 廃止は浜田 B 案で却下 |

## 合 (採用された Synthesis = §54-4)

**「全件 snapshot + emergency 例外厳格化 + レースコンディション対策 + 30 日保存」**

詳細:
- §54-4-1 対象操作 (kintone delete/rename / git push --force / mcp.json 破壊的編集 / DB DROP)
- §54-4-2 取得タイミング (操作直前 / 検証付き)
- §54-4-3 命名規則 (`data/snapshots/<対象>-pre-<操作>-<日時>.json`)
- §54-4-4 全件取得 (kintone-get-records 全件 + form-fields + app + リビジョン)
- §54-4-5 30 日保存 / `permanent/` 永続例外
- §54-4-6 emergency 例外厳格化 (スキップ全廃 / 簡略化のみ可 / 1 KB 最小記録必須)
- §54-4-7 レースコンディション対策 (リビジョン番号再取得 + 一致確認)
- §54-4-8 判断ログフィールド追加
- §54-4-9 Sonnet 5 件取扱対応表

## 学び

### Sonnet 反定立は「cost 重視」で 100% 正しかった
- もし浜田が cost を気にする立場なら Sonnet 案 (Snapshot 廃止) が正解
- AI 同士の議論では Sonnet 案が論理的に優位

### しかし浜田の本意 (cost OK / 自律優先 / 全件 safe) は別軸
- Synthesis Logic の限界 = AI 双方が「同じ前提」(cost 抑制) で議論していた
- 浜田の前提覆しで「Sonnet 反定立 = 部分採用 / 浜田原案路線維持」に転換
- §47-C 逆発動 = AI 認識不足を浜田が訂正した第 2 例 (1 例目 = §54-3 廃止)

### 反 = 必ずしも「合」に統合される必要はない
- Sonnet 反定立は「大半却下 / 一部採用」のパターンも有効
- 「合 = 必ず両者統合」ではない / 「合 = 浜田の本意 + AI 議論で発掘した致命的盲点 (反 2 emergency 例外) のみ採用」

## 元提案者

メイン AI (Opus) 原案 = 全件 snapshot / Sonnet 反定立 5 件 / 浜田 B 案 GO (cost OK / 全件 snapshot 路線)。

## 関連 commit

- (本ファイル commit 直後 = §54-4 制定 commit)
- 関連: d3cd276 (§54-3 廃止) / 485f804 (§54-3 制定 = 11 分短命) / d49603b (§52-3 v3 Q6) / 7c1b161 (§54 R12)

## 振り返り想起 trigger

- RAG 検索: 「Snapshot 必須 全件 / 浜田 cost OK / Sonnet 反定立部分採用 / レースコンディション対策」
- 5 月以降 §54-4 改訂時: 本ファイル参照 + 浜田の cost 許容範囲確認
- 「Snapshot を軽量化したい」と思った時: 「浜田は cost OK 方針 / 全件が安心」と必ず想起
