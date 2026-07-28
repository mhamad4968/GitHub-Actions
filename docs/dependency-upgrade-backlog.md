# 依存関係アップデート — 保留課題（今後検討）

**目的**: `npm outdated` / `npm audit` で**あえて未実施**とした項目を、チャットに頼らず追跡する。対応するときは **`RULES-INDEX.md` に日付＋1 行**で結果を残す。

**自律境界（2026-07-02 浜田 GO）**: `AGENTS.md` **§38-1** — semver 内 minor/patch は CIO 自律可。**保留表の項目は無理に上げない**。

**最終見直し**: 2026-07-28 — `globals` 17.8.0（pending V1 消化）

---

## 0. 現在の保留（2026-07-02）

| パッケージ / 経路 | severity | 未実施理由 | 再評価タイミング |
|-------------------|----------|------------|------------------|
| **nodemailer** 7→9 | high（複数 CVE） | **major** — SMTP regression テストなし | 浜田 GO + `V1-nodemailer` 提案 |
| **form-data** ← `@kintone/cli` | high | **upstream 待ち** — `npm audit fix` 非 force 不可 | `@kintone/cli` 更新時 |
| **xlsx** (SheetJS) | high | **修正版なし** — 代替未選定 | 代替ライブラリ調査ターン |
| **axios / tar** ← `@kintone/cli` | high/moderate | **force のみ**（cli 破壊的ダウングレード案内） | `@kintone/cli` / rest-api-client 上流更新 |

---

## 1. ~~ESLint 10 系へのアップグレード~~ — **済 2026-07-02**

- **実施**: `eslint` **10.6.0** / `@eslint/js` **^10.0.1** — `npm run lint:customize` OK

---

## 2. ~~`globals` のメジャー上げ（15 → 17）~~ — **済 2026-07-02**／patch **17.8.0 済 2026-07-28**

- **実施**: `globals` **17.8.0**（17.7.0 → 17.8.0 minor/patch・§38-1）
---

## 3. `npm audit` の `tmp` 経由（low ×5）と `--force`

- **現状**: `tmp <=0.2.3` が `@kintone/customize-uploader` → `@inquirer/prompts` 経由で間接依存。**`npm audit fix --force`** は **@kintone/customize-uploader を 8.0.13 に下げる**案内になる（破壊的）。
- **未実施理由**: デプロイ用 uploader の**意図しないダウングレード**を避けるため（§38-1 保留）。
- **検討時の作業**: **@kintone/customize-uploader** の新リリースで `tmp` / `@inquirer` チェーンが解消されていないか定期確認。

---

## 4. `security-next-automation` のメジャー候補（参考）

- **openai** Latest **6.x**（現状 4.x 系）— API 変更の確認が必要なため未触手。
- **typescript** Latest **6.x**（dev は ^5.8、解決 5.9 系）— ルート `typescript` ^6 との整合を取りつつ別タスクで検討。

---

## 関連

- 自律境界: **`AGENTS.md` §38 / §38-1**
- 承認ログ: **`docs/approved-changes/2026-07-02-rules-security-deps-autonomy-hamada-go.md`**
- 実施ログ: **`RULES-INDEX.md`**
