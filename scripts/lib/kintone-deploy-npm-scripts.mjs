/**
 * S-741-02 — package.json に cio:preflight / deploy npm を追記（新規 app 採番後）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = path.join(root, 'package.json');

/**
 * @param {object} opts
 * @param {number|string} opts.dbAppId
 * @param {number|string} opts.dashAppId
 * @param {string} opts.dbCustomizeRel e.g. customize/mfp-ledger-db/desktop.js
 * @param {string} opts.dashCustomizeRel e.g. customize/mfp-ledger-dash/desktop.js
 * @param {string} [opts.bundleNpm] e.g. mfp-ledger:bundle-dash
 */
export function ensureDeployNpmScripts({
  dbAppId,
  dashAppId,
  dbCustomizeRel,
  dashCustomizeRel,
  bundleNpm,
}) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || (pkg.scripts = {});
  const db = String(dbAppId);
  const dash = String(dashAppId);
  const preDb = `cio:preflight:${db}`;
  const preDash = `cio:preflight:${dash}`;
  const deployDb = `deploy:${db}`;
  const deployDash = `deploy:${dash}`;

  const dashDeployCmd = bundleNpm
    ? `npm run ${bundleNpm} && node scripts/cio-deploy-preflight-guard.mjs ${dash} && npx dotenv -e .env -e .env.proxy -- node scripts/deploy-customization.js ${dash} ${dashCustomizeRel}`
    : `node scripts/cio-deploy-preflight-guard.mjs ${dash} && npx dotenv -e .env -e .env.proxy -- node scripts/deploy-customization.js ${dash} ${dashCustomizeRel}`;

  const added = [];
  if (!scripts[preDb]) {
    scripts[preDb] = `node scripts/cio-preflight-stamp.mjs --app ${db}`;
    added.push(preDb);
  }
  if (!scripts[preDash]) {
    scripts[preDash] = `node scripts/cio-preflight-stamp.mjs --app ${dash}`;
    added.push(preDash);
  }
  if (!scripts[deployDb]) {
    scripts[deployDb] = `node scripts/cio-deploy-preflight-guard.mjs ${db} && npx dotenv -e .env -e .env.proxy -- node scripts/deploy-customization.js ${db} ${dbCustomizeRel}`;
    added.push(deployDb);
  }
  if (!scripts[deployDash]) {
    scripts[deployDash] = dashDeployCmd;
    added.push(deployDash);
  }

  if (added.length) {
    const sorted = Object.fromEntries(Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b)));
    pkg.scripts = sorted;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`[ensureDeployNpmScripts] added: ${added.join(', ')}`);
  } else {
    console.log('[ensureDeployNpmScripts] OK unchanged');
  }
  return added;
}
