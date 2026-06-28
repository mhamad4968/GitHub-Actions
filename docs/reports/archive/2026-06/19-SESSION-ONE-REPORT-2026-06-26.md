# セッション報告 — 2026-06-26

正本: `20-SESSION-REPORT-CHECKLIST.txt` / Desktop `19-SESSION-ONE-REPORT-2026-06-26.md`

---

## 成果（deploy・検収）

| アプリ | BUILD | rev | 内容 | 浜田 |
|--------|-------|-----|------|------|
| **744** | `2026-06-26-jre-cloud-account-db-block-v1` | **5** | DB save/delete ブロック・99件移行済 | — |
| **745** | `2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13` | **18** | v1 CRUD/595/月次集計/出力 + UX（集計表・検索・部署表示） | **検索・退職運用 OK** |

### 745 本日 UX（v6→v13）

- 集計: 当年1–12月自動表示・所属組織ブロック/小計/全社合計
- 部署「－」→ 支店名表示（DBは「－」のまま）
- 検索: 所属組織 + 部署 AND + 結合表現（v12–v13）
- 退職 = 利用終了日（削除なし）— 運用確認済

## インフラ・是正

- `verify:cio-deploy-ledger-gate` NG → `cio-kintone-apps-portfolio-build.mjs` パーサ修正（col3 `\|` / col1 括弧外テキスト）
- GitHub Actions: 直近 workflow **success**（security-next 等）
- `kintone-apps.md` 744/745 BUILD 同期

## 未コミット（別レーン — 本 commit 対象外）

- **736** customize / **699・698** bi-guide / **yojitsu SPEC** / **eslint** — 作業ツリーに残置（意図的除外）

## 仕様正本

`docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md`
