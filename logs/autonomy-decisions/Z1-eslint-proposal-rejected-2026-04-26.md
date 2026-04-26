# Z-1: ESLint downgrade proposal V1/V2 却下 + TSB-020 候補起票

**日時**: 2026-04-26 08:58 JST
**Tier**: B (浜田判断 = `reject_now` 取得済)
**関連**: TSB-007 (ESLint 9.39.4 固定決定), TSB-020 (proposal generator バグ修正 / 未起票)

---

## 1. 経緯

朝の morning-prep.mjs (or 夜間 cron) で proposal generator が以下 2 件を生成していた:

| ID | package | current | target | 提案 |
|----|---------|---------|--------|------|
| V1 | @eslint/js | 10.0.1 | 9.39.4 | `npm update @eslint/js` |
| V2 | eslint | 10.2.1 | 9.39.4 | `npm update eslint` |

しかし `package.json` の devDependencies は `^9.39.4` 固定 (TSB-007 の決定)。
→ 10.x は実インストールされておらず、提案自体が誤検知。

## 2. 浜田判断

> Z-1: `reject_now` (今すぐ却下 + reason 記録 + TSB-020 候補で proposal 生成ロジックを修正)

## 3. AI 実施内容

1. `docs/approved-changes/pending/2026-04-26-V1-_eslint_js.proposal.json` 削除
2. `docs/approved-changes/pending/2026-04-26-V2-eslint.proposal.json` 削除
3. `docs/approved-changes/rejected/2026-04-26-V1-_eslint_js.proposal.json` 新規 (rejection metadata 付き)
4. `docs/approved-changes/rejected/2026-04-26-V2-eslint.proposal.json` 新規 (同上)
5. 本 autonomy-decision log を作成

## 4. TSB-020 候補 (未起票 / Day 4 後に正式起票)

### タイトル案
"proposal generator が package.json で意図的に固定された major version を考慮せず逆方向 downgrade 提案を生成する"

### 根本原因
- `scripts/proposal-generator.mjs` (推定) が `npm outdated` の出力を盲目的に target にしている
- `package.json` の caret/tilde range を読まずに「latest > current」だけで判断している

### 修正方針 (Day 4 後に検討)
1. `package.json` の version range を読み取り、その範囲内に target を制限
2. もしくは `.proposal-generator-ignore` のような設定ファイルで `eslint`, `@eslint/js` をスキップリスト化
3. もしくは TSB-007 のような「意図的固定」をマーカーコメントで package.json に書き込み、generator が読む

### 影響
- 影響度: **低** (実害は npm update 実行しても caret 範囲内でしか動かないため）
- 緊急度: **低** (誤検知が混乱を招く程度)
- 優先度: **P5 series 完了後 / Day 5-6 あたりで対応**

## 5. 自己批判

- proposal を pending に放置していた (浜田指摘されるまで気付かなかった)
  - → 今後は朝のブリーフィング §0 で「pending proposal 件数」を必ず表示する (P5 後に reform)
- `npm outdated` の挙動を完全把握していなかった (caret range の解釈)
  - → reform: `package.json` の version 文法 cheatsheet を docs/refs/ に置く

## 6. ステータス

- [x] 浜田 GO 取得
- [x] pending → rejected 移動完了
- [x] rejection metadata 記録
- [x] autonomy-decision log 作成
- [ ] commit + push (本ファイル含めて Day 4 終了後 or 別 commit)
- [ ] TSB-020 正式起票 (Day 5-6)
