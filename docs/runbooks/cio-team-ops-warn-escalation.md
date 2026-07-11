# Team ops WARN 昇格（v3.3 A-6）

> **正本**: `docs/plans/2026-07-11-ai-team-ops-optimization-spec-v33.md` §2 A-6

1. turn-start / pre-implement で §50-3-8 WARN → `logs/cio-turn-start/warn-streak.json` に記録
2. **連続 2 セッション** WARN → `force-strict-until.json` 書込 · 全 tier **strict 強制**
3. 解除: `npm run cio:session:cold-start`（WAKE）または手動削除
4. 形骸化原則2 — WARN は暫定、昇格後は strict で CLOSED 目標
