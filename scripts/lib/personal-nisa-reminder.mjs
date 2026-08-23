/**
 * 個人 NISA／ラップ月次リマインダ（ゲートではない・失敗にしない）
 * 正本: docs/personal/nisa-ops.md · Skill: nisa-monthly-ops
 */
export const NISA_MONTHLY_DAY = 15;
export const NISA_MONTHLY_WINDOW = 2; // 13〜17 日

/** @param {number} dayOfMonth JST 1–31 */
export function isNisaMonthlyReminderDue(dayOfMonth) {
  const d = Number(dayOfMonth);
  return (
    Number.isFinite(d) &&
    d >= NISA_MONTHLY_DAY - NISA_MONTHLY_WINDOW &&
    d <= NISA_MONTHLY_DAY + NISA_MONTHLY_WINDOW
  );
}

export function nisaMonthlyOpsFrameLabel() {
  return '【必須】個人資産月次（NISA／ラップ／iDeCo）— スクショ→増額相談 · docs/personal/nisa-ops.md';
}

/** morning-prep 用セクション（due のときだけ呼ぶ） */
export function nisaMonthlyMorningSection() {
  return [
    '## 0a2. 📣 【必須】個人資産月次（NISA／ラップ／iDeCo）',
    '',
    '> **必須リマインダ**（cold-start を落とすゲートではない）。13〜17日のセッションでは CIO が必ず取り上げる。黙スキップ禁止。延期は浜田明示＋次回日。',
    '',
    '- 時期: **毎月15日前後**（本節は 13〜17 日にだけ出る）',
    '- 浜田: 証券の資産状況スクショを貼る（NISA必須・ラップ／iDeCo任意）',
    '- AI: Skill `nisa-monthly-ops`／正本 `docs/personal/nisa-ops.md` — 据置／増額を **1案** → GO',
    '- ナレッジ: 月次前に DDG 要点のみ（日次巡回しない）',
    '',
  ].join('\n');
}
