# kintone 既存台帳 — UX 改善手順（v1）

**制定**: 2026-08-16（浜田 — 694/696 実地の流れを次アプリ用に固定）  
**対象**: すでに運用中の **dash（日常 UI）** の見た目・操作・印刷。新アプリ作成・DB フィールド追加ではない。  
**実地**: [694 Apple ID管理台帳](https://jbis-kintone.cybozu.com/k/694/) → [696 メールアドレス管理台帳](https://jbis-kintone.cybozu.com/k/696/)

目視チェックの表は `docs/runbooks/kintone-dash-first-visual-checklist.md`。本ファイルは **レーンの進め方**。

---

## 0. レーンクローズ ≠ プロジェクトクローズ

| 用語 | 意味 | やってよいこと / 禁止 |
|------|------|------------------------|
| **改善レーンクローズ** | 今回の UX は目視 OK。アプリは運用継続 | checkpoint に「再開しない」。`data/cio-project-closures.json` には **入れない**（**CLOSED 維持・不触**） |
| **プロジェクトクローズ** | アプリ自体を閉じた 9 件 | 697–713 等。誤って 694/696/715 を足さない |

**チェックポイント固定句（レーンクローズ時）**: `closures JSON 不触（UXレーンのみ・closed-v1 維持）`

次の対象アプリは **浜田が指定するまで着手しない**。715・閉済・688 heat 外・677–679・712・736 は触らない。

---

## 1. G0 — 案だけ（コード禁止）

浜田が「改善したい／案を出して」＝ **G0**。customize 編集・deploy・commit はしない。

1. Live を確認する（アプリ名、Space、dash の BUILD / rev / fileKey、DB アプリ ID）。
2. SPEC と `customize/<lane>/desktop.js` を読み、**すでに入っているもの**を先に書く（やり直さない）。
3. 案は **番号付き**（例: 1 ツールバー / 2 sticky / 3 コピー / 4 件数チップ / 6 ピル / 8 印刷）。画面・単票印刷・一覧印刷・Excel は **面を分ける**。
4. **混ぜないもの**を明示する。例: 他台帳の 680 所属を目的の違うキーにコピーしない、DB フィールド変更、接続パネル削除、印刷注意文を一覧に出す。
5. 推奨セットを 1 行で出す。番号指定まで待つ。

印刷の見出し・注意 1 行は **浜田指定が正**。未指定のまま 8 を GO されたら、既存見出しを残し、注意は 694 と同文「本紙は機密性の高い内容を含みます。」を **印刷面だけ**に載せる（画面に出さない）。

---

## 2. G2 — 番号 GO のあと

浜田が番号と **GO** を出してから実装する。

| 順 | 誰 | 内容 |
|----|-----|------|
| 1 | DeepSeek | §50-3-8 盲点 3 点（型 / SPEC 乖離 / 差異継承）→ CIO 突合 3 行 → `cio:guard:5038 --stamp` |
| 2 | CIO | `cio:pre-implement-gate -- --strict` |
| 3 | Composer | `customize/**` のみ。APP_DB はハードコードを維持（bundle で 0 にしない） |
| 4 | Kimi | レビュー。file が読めないときは think で代替し、CIO がコードで誤 BLOCK を却下する |
| 5 | CIO | `cio:preflight:<app> -- --note "…" --with-git-diff-line` → `deploy:<app>` |
| 6 | CIO | R63: **`npm run rag:mirror:canonical-docs` を先に実行** → customize + `kintone-apps.md` + `.rag/extra-docs/kintone-apps.md` + `data/cio-live-builds.json` を **同一 commit**（正本だけ stage すると pre-commit 拒否・#R1） |
| 7 | 浜田 | **Ctrl+F5** 目視のみ（npm は依頼しない） |
| 8 | CIO | OK ならレーンクローズ + **当該 SPEC の改定履歴** + checkpoint。NG は同一セッションで直して再 deploy |

### 2.1 フォームモーダル（#D1 · 2026-08-24）

新規登録・編集など **入力フォームのモーダル**は **`closeOnBackdrop: false`**（背景クリックで閉じない）。廃止/削除の短い確認だけ背景閉じ可。datalist 選択のすり抜けで入力が消える再発防止（696 `2026-08-24-696-modal-keep-open`）。

694 の効いた型（転用時はアプリの既存 UI を壊さない）:

- ツールバーは **枠＋legend**。印刷を `flex:1` で右端に飛ばさない。モーダルボタンは 36px にしない。
- sticky は `border-collapse:separate; border-spacing:0`。
- 件数チップは **全件**（絞込に依らない）。フィルタ用チップとクラスを分ける。
- 行色は **廃止が種別ティントに勝つ**（`:not(.retired)`）。
- 検索パネルが既にある台帳（696）は、694 のラジオツールバーに吸収しない。

---

## 3. 仕様・未コミット（忘れ防止）

- 目視 OK のターンで SPEC 改定履歴を書く。UI 節が古いまま閉じない。
- deploy 成功から 45 分以内に R63 commit（夕締め一括待ち禁止）。
- `chat-sessions/tmp-report-*.md` は報告下書き。正本にしない。
- レーンクローズ後も **アプリは動かす**。再開は浜田指示のみ。
