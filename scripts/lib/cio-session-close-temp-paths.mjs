/** セッション締め verify で無視する一時 untracked（B1 対象外） */
export const SESSION_CLOSE_TEMP_PATTERNS = [
  /^data\/csv-inspect\.json$/,
  /^data\/jma-monthly-counts\.json$/,
  /^data\/rain-.*\.txt$/,
  /^data\/workdays-.*-(dump|summary)\.json$/,
  /^data\/workdays-.*-summary\.txt$/,
  /^docs\/approved-changes\/pending\//,
];

export function isSessionCloseTempPath(rel) {
  const p = String(rel || '').replace(/\\/g, '/');
  return SESSION_CLOSE_TEMP_PATTERNS.some((re) => re.test(p));
}
