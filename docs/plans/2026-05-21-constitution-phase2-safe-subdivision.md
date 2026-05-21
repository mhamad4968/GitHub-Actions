# 憲法・ルール Phase 2 — 安全な細分化・体系化

**起票**: 2026-05-21（CEO: コミット + AIチーム見やすい体系化 + **1人作業禁止**）  
**状態**: 進行中（索引・読本追加のみ。**AGENTS.md 本文の意味変更は Phase 2-B で CEO GO 後**）

---

## 目的

- AI 4役割が **迷わず・読み過ぎず** 正本に到達する。
- **間違い防止**: 機械検証 + 多AIレビュー + AGENTS 正本非置換。

---

## スコープ（Phase 2-A = 本コミット含む）

| 実施 | 非実施（別GO） |
|------|----------------|
| `18-ai-team-read-map.md`（役割別ナビ） | `AGENTS.md` § 本文の再分割・番号変更 |
| `00-rule-hierarchy` / README / RULES-INDEX 追記 | `constitution.mdc` ミラー全文手編集 |
| 検証 npm スクリプト連鎖の維持 | 新規 `alwaysApply: true` の .mdc 追加 |

---

## 1人作業禁止 — 必須プロトコル（§50-3-11）

```text
1. DeepSeek 1問（盲点・反例・暗黙上書きリスク）
2. CIO 突合3行（正本 AGENTS / part-A / mode-b との一致）
3. npm run cio:guard:5038 -- --stamp --text "…"
4. npm run verify:cio-four-ai-governance
5. commit（本 Phase のみ。push は浜田方針に従う）
```

**第2者**: DeepSeek または Kimi の短問。**完了宣言は CIO のみ**。

---

## Phase 2-B（将来・CEO GO 待ち）

- `.mdc` を **トピック別サブフォルダ**へ整理（パス変更は `verify:rule-hierarchy-prune` 許可リスト更新必須）
- `RULES-INDEX` の §→mdc 双方向リンク自動生成
- RAG ミラーへの `18-ai-team-read-map` 反映（`rag:mirror:canonical-docs`）

---

## §50-3-8 突合3行（2026-05-21 DeepSeek → CIO）

1. **固定化リスク** → 本表はショートカット。矛盾時は **AGENTS / 00-rule-hierarchy** が勝つ（README に明記）。
2. **CIO 不在デッドロック** → 5038 skip は **具体理由必須**。ブロック時は **§41 一問**で浜田分岐（憲法既存）。
3. **索引ずれ** → 変更後は **`verify:cio-four-ai-governance`** + `RULES-INDEX` 同時更新。

**暗黙弱体化**: §35-1・§56-1a・§41・§51 は **追記のみ**（Phase 2-A は AGENTS 本文未変更）。

---

## 関連

- Phase 1: `00-rule-hierarchy.md`・`17-four-ai-mode-b.md`
- 検証: `docs/runbooks/cio-four-ai-governance.md`
- エッセンス保全: `phase1-essence-preservation-checklist.md`
