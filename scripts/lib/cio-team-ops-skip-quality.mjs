/**
 * §50-3-8 skip 理由品質 — v3.2 K2（形骸化防止）
 */
export const SKIP_MIN_CHARS = 20;

export const SKIP_BANNED_PHRASES = [
  '形式のみ',
  '同上',
  '省略',
  '軽微のため',
  '時間のため',
  '浜田GO',
  '浜田 GO',
  '特になし',
  'なし',
];

export function validateSkipReason(reason) {
  const s = String(reason || '').trim();
  if (s.length < SKIP_MIN_CHARS) {
    return { ok: false, code: 'too_short', message: `skip 理由は ${SKIP_MIN_CHARS} 字以上必須` };
  }
  for (const phrase of SKIP_BANNED_PHRASES) {
    if (s === phrase || s.includes(phrase)) {
      return { ok: false, code: 'banned_phrase', message: `禁止フレーズ: ${phrase}` };
    }
  }
  return { ok: true };
}

export function shouldFailStrictWithout5038(stamp, evidenceSources) {
  const hasStamp = Boolean(stamp?.stampedAt);
  const hasEvidence = Array.isArray(evidenceSources) && evidenceSources.length > 0;
  return !hasStamp && !hasEvidence;
}
