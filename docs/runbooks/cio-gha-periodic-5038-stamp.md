# GHA 定期 kintone REST — §50-3-8 skip スタンプ（正本）

**目的**: GitHub Actions の**無人**定期ジョブが `cio-deploy-preflight-guard` を通るとき、DeepSeek チャットは不要だが **5038 証跡（skip スタンプ）**は必須とする（方式B 再発防止）。

---

## 対象

| 操作 ID | workflow | npm（bundled） | 内容 |
|---------|----------|----------------|------|
| `682-graph-monthly` | `682-graph-monthly-refresh.yml` | **`npm run 682:graph-monthly:gha`** | 682 月次グラフ窓 REST 更新 + preview deploy |

**§51-6-2 / SESSION-CLOCK（2026-08-02）**: `cio-deploy-preflight-guard` は **`GITHUB_ACTIONS=true` のとき壁時計 4h 検査をスキップ**する（checkout された `SESSION-CLOCK.md` の経過で定期ジョブが落ちる再発防止）。workflow 側は防御層として `SKIP_CIO_SESSION_CLOCK_DEPLOY=1` も明示。ローカル人間セッションの 4h 硬拒否は維持。

**禁止**: workflow から **`682:graph-monthly:scheduled` を直接呼ぶ**（5038 忘れで失敗する）。`verify:gha-periodic-workflows` が検知して exit 1。

---

## bundled npm の中身（682）

1. `cio:preflight:682` — 45 分スタンプ
2. `cio-gha-periodic-5038-stamp.mjs --operation 682-graph-monthly` — §50-3-8 skip 記録
3. `cio-deploy-preflight-guard.mjs 682` — preflight + 5038 検証
4. `user-support-682-ensure-monthly-bar-graph.mjs` — REST 本体

---

## 新しい定期 GHA を足すとき

1. `scripts/cio-gha-periodic-5038-stamp.mjs` の `OPERATIONS` に **1 行追加**（skip 理由を具体化）
2. `package.json` に **`*:gha` bundled スクリプト**（preflight → 5038 stamp → guard → 本体）
3. workflow は **bundled npm のみ**呼ぶ
4. `scripts/verify-gha-periodic-workflows.mjs` にルール追加
5. 本 runbook の表を更新

**customize/SPEC を触る GHA** は本パターン不可 — DeepSeek §50-3-8 フル + `cio:guard:5038 --stamp` が必要。

---

## 検証

```bash
npm run verify:gha-periodic-workflows
```

`smoke:quiet` 第 15 検査に組込済。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-02 | 初版 — 682-graph-monthly 6/1 失敗（5038 未設定）の恒久対策 |
