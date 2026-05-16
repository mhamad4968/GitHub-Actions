#!/usr/bin/env node
/** One-line JST clock for handoff headings (avoids `powershell -NoProfile` Run prompts). */
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const parts = fmt.formatToParts(new Date());
const v = (t) => parts.find((p) => p.type === t)?.value ?? '';
process.stdout.write(`${v('year')}-${v('month')}-${v('day')} ${v('hour')}:${v('minute')}\n`);
