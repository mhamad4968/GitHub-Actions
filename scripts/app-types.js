/**
 * @kintone/dts-gen の薄いラッパー。`.env`（dotenv-cli 経由）の KINTONE_* を読み、
 * types/kintone-{appId}.d.ts を生成する。
 *
 * Usage:
 *   npm run app:types -- <APP_ID> [--preview]
 *
 * 環境変数: KINTONE_BASE_URL, KINTONE_USERNAME + KINTONE_PASSWORD または KINTONE_API_TOKEN、
 *   任意 KINTONE_BASIC_AUTH_*, KINTONE_GUEST_SPACE_ID
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** 環境が足りないときに具体的な次手を出して終了する（Claude のループ回避用フェイルファスト）。 */
function exitWithEnvHelp(reasonLines) {
  const root = process.cwd();
  const envPath = path.join(root, '.env');
  const proxyPath = path.join(root, '.env.proxy');
  const hasEnv = existsSync(envPath);
  const hasProxy = existsSync(proxyPath);

  console.error('');
  console.error('[app:types] 環境が未設定です。上述の不足を直さずに再実行しても成功しません（フェイルファスト）。');
  for (const line of reasonLines) console.error(`  · ${line}`);
  console.error('');
  console.error('【このリポジトリで必要な変数】');
  console.error('  · KINTONE_BASE_URL（例: https://xxx.cybozu.com またはホスト名のみ。末尾 /k は可）');
  console.error('  · KINTONE_API_TOKEN または KINTONE_USERNAME + KINTONE_PASSWORD');
  console.error('  · 任意: KINTONE_BASIC_AUTH_USERNAME / PASSWORD、KINTONE_GUEST_SPACE_ID');
  console.error('');
  console.error('【解決の手順（例）】');
  console.error(`  1. カレントがリポジトリルートか確認（今: ${root}）`);
  console.error(`  2. ルートに .env / .env.proxy を置く: .env=${hasEnv ? 'あり' : 'なし'} .env.proxy=${hasProxy ? 'あり' : 'なし'}`);
  console.error('  3. 値は kintone 管理者・社内手順・シークレット管理（例: 1Password）から取得し、');
  console.error('     既存の `npm run app:fields` が通るのと同じキー名で埋める');
  console.error('  4. 必ず dotenv 付きで実行する:');
  console.error('       npm run app:types -- <APP_ID>');
  console.error('     手動デバッグ: npx dotenv -e .env -e .env.proxy -- node scripts/app-types.js <APP_ID>');
  console.error('');
  process.exit(1);
}

function assertLabEnvForAppTypes() {
  const base = process.env.KINTONE_BASE_URL;
  const token = process.env.KINTONE_API_TOKEN;
  const user = process.env.KINTONE_USERNAME;
  const pass = process.env.KINTONE_PASSWORD;
  const reasons = [];
  if (!base || String(base).trim() === '') reasons.push('KINTONE_BASE_URL が空または未設定');
  const hasToken = token != null && String(token).trim() !== '';
  const hasUserPass =
    user != null &&
    String(user).trim() !== '' &&
    pass != null &&
    String(pass).trim() !== '';
  if (!hasToken && !hasUserPass) {
    reasons.push('KINTONE_API_TOKEN もしくは KINTONE_USERNAME+KINTONE_PASSWORD のどちらも使えない');
  }
  if (reasons.length > 0) {
    const root = process.cwd();
    if (!existsSync(path.join(root, '.env')) && !existsSync(path.join(root, '.env.proxy'))) {
      reasons.push('ルートに .env も .env.proxy も無い（npm run app:types は dotenv -e .env -e .env.proxy 前提）');
    }
    exitWithEnvHelp(reasons);
  }
}

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

function normalizeBaseUrl(raw) {
  let baseUrl = raw.trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/, '');
  if (!/^https:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl.replace(/^https?:\/\//i, '')}`;
  }
  try {
    const u = new URL(baseUrl);
    if (!u.hostname) throw new Error('no hostname');
    return u.origin;
  } catch {
    throw new Error(`KINTONE_BASE_URL を解釈できません: ${JSON.stringify(raw)}`);
  }
}

const argv = process.argv.slice(2);
const preview = argv.includes('--preview');
const appId = argv.find((a) => /^\d+$/.test(a));

if (!appId) {
  console.error('Usage: npm run app:types -- <APP_ID> [--preview]');
  console.error('  --preview  : 未反映フォームのプレビュー向け（kintone-dts-gen の --preview）');
  process.exit(2);
}

assertLabEnvForAppTypes();

const baseUrl = normalizeBaseUrl(requireEnv('KINTONE_BASE_URL'));

const outDir = path.join(process.cwd(), 'types');
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `kintone-${appId}.d.ts`);

const pkgRoot = path.dirname(require.resolve('@kintone/dts-gen/package.json'));
const dtsGenEntry = path.join(pkgRoot, 'dist', 'index.js');

const args = [
  dtsGenEntry,
  '--base-url',
  baseUrl,
  '--app-id',
  appId,
  '-o',
  outFile,
];

const token = process.env.KINTONE_API_TOKEN;
if (token != null && String(token).trim() !== '') {
  args.push('--api-token', String(token).trim());
} else {
  args.push('-u', requireEnv('KINTONE_USERNAME'), '-p', requireEnv('KINTONE_PASSWORD'));
}

const bu = process.env.KINTONE_BASIC_AUTH_USERNAME;
const bp = process.env.KINTONE_BASIC_AUTH_PASSWORD;
if (bu && bp) {
  args.push('--basic-auth-username', String(bu), '--basic-auth-password', String(bp));
}

const guest = process.env.KINTONE_GUEST_SPACE_ID;
if (guest != null && String(guest).trim() !== '') {
  args.push('--guest-space-id', String(guest).trim());
}

if (preview) {
  args.push('--preview');
}

console.error(`[app:types] app=${appId} output=${outFile}${preview ? ' (preview)' : ''}`);

const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
