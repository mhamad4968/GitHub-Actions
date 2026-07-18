import fs from 'node:fs';
import path from 'node:path';

const SESSION_CLOSE_REPORT_RE = /^SESSION-CLOSE-REPORT_(\d{8})\.txt$/i;

export function pruneStaleSessionCloseReports(dir, keepYmd) {
  const removed = [];
  for (const name of fs.readdirSync(dir)) {
    const match = name.match(SESSION_CLOSE_REPORT_RE);
    if (!match || match[1] === keepYmd) continue;
    const filePath = path.join(dir, name);
    if (!fs.statSync(filePath).isFile()) continue;
    fs.unlinkSync(filePath);
    removed.push(name);
  }
  return removed.sort();
}
