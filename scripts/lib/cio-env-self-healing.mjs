/**
 * 拡張案2 — 暗号化 .env バックアップ復号・Self-Healing Env
 * 値はログ出力禁止。CIO_ENV_MASTER_KEY は process.env のみ。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  auditEnvIntegrity,
  hasValue,
  loadEnvFile,
} from './cio-env-integrity.mjs';

export const ENC_REL = 'docs/secure/.env.enc';
export const ENC_META_REL = 'docs/secure/.env.enc.meta.json';

export function encPath(root) {
  return path.join(root, ENC_REL);
}

export function getMasterKey() {
  const raw = process.env.CIO_ENV_MASTER_KEY || '';
  if (!raw.trim()) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw.trim())) {
    return Buffer.from(raw.trim(), 'hex');
  }
  return crypto.scryptSync(raw.trim(), 'cio-env-salt-v1', 32);
}

export function encryptEnvPayload(plainObject, masterKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const plain = JSON.stringify(plainObject);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: enc.toString('hex'),
  };
}

export function decryptEnvPayload(blob, masterKey) {
  const iv = Buffer.from(blob.iv, 'hex');
  const tag = Buffer.from(blob.tag, 'hex');
  const data = Buffer.from(blob.data, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(plain);
}

export function writeEnvFile(envPath, entries, existing = {}) {
  const merged = { ...existing, ...entries };
  const lines = ['# Auto-restored by cio:env:self-healing — do not commit secrets'];
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null) continue;
    const s = String(v);
    lines.push(`${k}=${s.includes(' ') ? `"${s.replace(/"/g, '\\"')}"` : s}`);
  }
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

export function mergeMissingEnv(root, manifest, decryptedEntries) {
  const envPath = path.join(root, '.env');
  const current = loadEnvFile(envPath);
  const toAdd = {};
  for (const { key } of manifest.repoEnvRequired || []) {
    if (!hasValue(key, current) && decryptedEntries[key]) {
      toAdd[key] = decryptedEntries[key];
    }
  }
  for (const [k, v] of Object.entries(decryptedEntries)) {
    if (!hasValue(k, current) && v) toAdd[k] = v;
  }
  if (Object.keys(toAdd).length) {
    writeEnvFile(envPath, toAdd, current);
  }
  return Object.keys(toAdd);
}

export function selfHealEnv(root, manifest) {
  const issuesBefore = auditEnvIntegrity(root, manifest);
  if (!issuesBefore.length) {
    return { ok: true, healed: [], message: 'no issues' };
  }

  const masterKey = getMasterKey();
  const enc = encPath(root);
  if (!masterKey) {
    return {
      ok: false,
      healed: [],
      message: 'CIO_ENV_MASTER_KEY 未設定 — 復号不可',
      issues: issuesBefore,
    };
  }
  if (!fs.existsSync(enc)) {
    return {
      ok: false,
      healed: [],
      message: `${ENC_REL} 無し — npm run cio:env:encrypt-backup を先に実行`,
      issues: issuesBefore,
    };
  }

  let decrypted;
  try {
    const blob = JSON.parse(fs.readFileSync(enc, 'utf8'));
    decrypted = decryptEnvPayload(blob, masterKey);
  } catch {
    return {
      ok: false,
      healed: [],
      message: '復号失敗 — CIO_ENV_MASTER_KEY または .env.enc を確認',
      issues: issuesBefore,
    };
  }

  const healed = mergeMissingEnv(root, manifest, decrypted);
  const issuesAfter = auditEnvIntegrity(root, manifest);
  return {
    ok: issuesAfter.length === 0,
    healed,
    issues: issuesAfter,
    message: issuesAfter.length ? 'partial heal' : 'full heal',
  };
}
