# 2026-04-28 — parallel-session-detector 軸1 副次件数しきい値

- **事象**: `agents-md-changes.jsonl` で旧 watcher_pid が **3 件**残り、新 pid が多数 → 軸1 が +5（並列確定扱い）し smoke **ng**。
- **判断**: watcher **再起動残骸**（コメントの 1〜2 件想定を 3 件に拡張）＋**副次が主の 12% 未満かつ 5 件未満**なら並列にしない。
- **実装**: `AXIS1_MIN_SECONDARY_EVENTS=5` / `AXIS1_MIN_SECONDARY_RATIO=0.12` で 2 位の必要件数 `max(5, floor(0.12×主))`。
- **結果**: 同ログで総点 **8→3**（黄）。`npm run smoke:quiet` は **warn のみ**（軸3 lock は別途運用）。
