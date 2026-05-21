/**
 * セッション引継ぎ正本（リポ `chat-sessions/`）を Desktop「AI緊急用」へバイト同期するペア。
 * Explorer 名前順で **23 の直後**に **24〜25（常時）**、**26（夕反省 md または SLOT）**、**27（read-pack）**。
 * （旧 **25/26 鏡**・**24-evening-…** は歯抜け回避のため廃止 → sync prune）
 *
 * @see scripts/sync-session-starter-to-desktop.mjs
 * @see scripts/verify-desktop-ai-emergency-sync.mjs
 */
export const SESSION_DESKTOP_MIRROR_FILES = [
  ['chat-sessions/handoff-log.md', '24-handoff-log.md'],
  ['chat-sessions/checkpoint-latest.md', '25-checkpoint-latest.md'],
];
