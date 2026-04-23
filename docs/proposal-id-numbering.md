# proposal ID 採番ルール設計書

**制定日**: 2026-04-22 (Wed) / 改善案 #14 / R12-R16 vs 夕反省雛形 #R12-#R15 の ID 競合事件を踏まえて

---

## 背景

2026-04-22 夜、以下の ID 競合が同日発生した:

- **夕反省 §5 で自動生成された ID**（`evening-reflect.mjs` 出力）: `#R12` `#R13` `#R14` `#R15` `#TSB-010` `#D9` `#D10` `#S9` `#V1` `#K7` `#K8`
- **AI が今夜 commit した ID**（手動付与）: `R12` `R13` `R14` `R15` `R16` `S9` `TSB-010`

両者は **意味が異なる別物** だが ID 重複により、4/23 朝の混乱・追跡困難・参照ミスのリスクを生んだ。

---

## 採番ルール（段階 1 / 手動運用 / 即日適用）

### 1. ID 名前空間の所在

`#R<N>` `#S<N>` `#D<N>` `#C<N>` `#K<N>` `#V<N>` `#TSB-<NNN>` の **N は単一の連番空間** とする。
夕反省雛形と AI 手動付与は **同じ採番テーブル** を参照しなければならない。

### 2. 次の使用可能 N の計算方法

proposal を新規作成する直前に、必ず以下を実行して **使用可能な最小 N** を確認する:

```bash
# 例: R カテゴリの次番号
ls docs/approved-changes/{,processed/*/,rejected/}{R}*-*.proposal.json 2>/dev/null \
  | sed -E 's/.*\/(R[0-9]+)-.*/\1/' \
  | sort -V \
  | tail -5
# → 出力例: R14, R15, R16 → 次は R17
```

夕反省雛形（`docs/reports/<日付>-evening-reflection.md`）に ID を記載する場合も、上記コマンドで決定する。

### 3. 競合検知

`scripts/check-proposals.mjs`（改善案 #11 / S10）の拡張で「同じ ID が複数日付ディレクトリにまたがって存在する」場合に ⚠ 表示する（段階 2 で実装）。

---

## 採番ルール（段階 2 / 自動運用 / 4/24 以降の別 commit で実装）

### `scripts/evening-reflect.mjs` 拡張案

夕反省雛形を生成する際、以下のロジックで自動採番する:

```javascript
// 既存 + 処理済 + 却下 を全部スキャン
const allUsedIds = new Set();
for (const dir of ['', 'processed', 'rejected']) {
  const root = path.join(REPO_ROOT, 'docs', 'approved-changes', dir);
  // ... 再帰スキャンして R12, S9, D11 等を全件抽出
}

// カテゴリごとに最大値 + 1
const nextR = maxN(allUsedIds, 'R') + 1;
const nextS = maxN(allUsedIds, 'S') + 1;
// ...

// 雛形書き出し時に確実に未使用 ID を採番
```

さらに `evening-reflect.mjs` は **AI が手動付与した既存 proposal も読み込んで** 確実に競合させない。

---

## 採番ルール（段階 3 / RAG 連携 / 5 月以降）

- 過去全 ID をベクトル検索可能にして、AI が「過去の R7 = 曖昧訴え A/B/C/D」を引用できるようにする
- 既存 RAG（`mcp-local-rag`）に `docs/approved-changes/processed/` を追加 ingest

---

## 関連

- 改善案 #11（S10 + R21）= proposal 事前検証儀式（old_string マッチ検査）
- 改善案 #15（R22）= 月次でルール統廃合候補化（5 月以降）
- 2026-04-22 R13 半角→全角 () バグ事件（並行 Cursor チャットが救済）= 本件と並ぶ「夕反省 → cron 適用」周辺の品質課題
- AGENTS.md §44 夕反省サイクル / `docs/approved-changes/README.md`
