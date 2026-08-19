/**
 * App 714: 共有行は emp_id / user_name を空にする（v1.2）。
 * kintone フォーム必須を外し、必須判定は 715 JS（個人のみ）に任せる。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-emp-fields-optional.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-emp-fields-optional.mjs
 */
import { deployApp, fetchJson, getKintoneConfig } from './lib/software-ledger-kintone.mjs';

const APP = 714;
const CODES = ['emp_id', 'user_name'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const patch = {};
  CODES.forEach((code) => {
    const def = cur.properties?.[code];
    if (!def) throw new Error(`714 missing field ${code}`);
    if (def.required) {
      patch[code] = { ...def, required: false };
    } else {
      console.log(`[fields] already optional: ${code}`);
    }
  });
  if (!Object.keys(patch).length) {
    console.log('[fields] nothing to PUT');
    return;
  }
  if (dryRun) {
    console.log('[fields] dry-run would PUT required=false', Object.keys(patch));
    return;
  }
  const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: APP, revision: cur.revision, properties: patch }),
  });
  console.log(`[fields] PUT ok revision=${put.revision} codes=${Object.keys(patch).join(',')}`);
  await deployApp(baseUrl, headers, APP, put.revision);
  console.log('[deploy] App 714 SUCCESS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
