/**
 * lint:customize の JSON レポートを人間可読に出力
 */
import fs from 'node:fs';
import path from 'node:path';

const REPORT_REL = 'logs/eslint-customize-report.json';

/**
 * @param {string} root
 * @returns {{ ok: boolean, errors: Array<{file:string,line:number,message:string}> }}
 */
export function readEslintCustomizeErrors(root) {
  const reportPath = path.join(root, REPORT_REL);
  if (!fs.existsSync(reportPath)) {
    return { ok: false, errors: [{ file: REPORT_REL, line: 0, message: 'レポート無し — npm run lint:customize を先に実行' }] };
  }
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch {
    return { ok: false, errors: [{ file: REPORT_REL, line: 0, message: 'JSON パース失敗' }] };
  }
  const errors = [];
  for (const file of report) {
    for (const m of file.messages || []) {
      if (m.severity !== 2) continue;
      errors.push({
        file: file.filePath || file.file || '(unknown)',
        line: m.line || 0,
        message: m.message || '(no message)',
      });
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} root
 * @param {{ max?: number }} [opts]
 */
export function printEslintCustomizeErrors(root, opts = {}) {
  const max = opts.max ?? 15;
  const { ok, errors } = readEslintCustomizeErrors(root);
  if (ok) return true;
  console.error(`[eslint-summary] NG ${errors.length} error(s):`);
  for (const e of errors.slice(0, max)) {
    const rel = e.file.replace(/\\/g, '/').replace(/.*\/kintone-ai-lab\//, '');
    console.error(`  ${rel}:${e.line} — ${e.message}`);
  }
  if (errors.length > max) {
    console.error(`  …他 ${errors.length - max} 件 — 全文: ${REPORT_REL}`);
  }
  return false;
}
