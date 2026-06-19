/**
 * 社内 SMTP（j-bis.co.jp:587）— VPN リマインド等の GHA / ローカル共通。
 * 正本: docs/plans/2026-06-06-shared-mail-kintone-spec.md §接続設定
 */
import nodemailer from 'nodemailer';

const JBIS_MAIL_DOMAIN = '@j-bis.co.jp';
const DEFAULT_SMTP_HOST = 'j-bis.co.jp';

function withJbisDomain(addr) {
  if (!addr) return addr;
  return addr.includes('@') ? addr : `${addr}${JBIS_MAIL_DOMAIN}`;
}

export function smtpConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(user && pass);
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const rawUser = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const user = withJbisDomain(rawUser);
  const from = withJbisDomain(process.env.SMTP_FROM?.trim()) || user;
  if (!rawUser || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS are required');
  }
  return { host, port, user, pass, from };
}

/** j-bis.co.jp:587 は POP110 同様 **SSL/TLS なし**（浜田確認）。SMTP_USE_SSL=1 で STARTTLS 可 */
function buildTransportOptions(host, port) {
  const useSsl =
    process.env.SMTP_USE_SSL === '1' ||
    process.env.SMTP_USE_SSL === 'true' ||
    port === 465;
  const tls = useSsl ? buildTlsOptions(host) : undefined;
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: useSsl && port === 587,
    ignoreTLS: !useSsl,
    ...(tls ? { tls } : {}),
  };
}

/** j-bis.co.jp は mwprem.net 証明書のため Node 既定 TLS 検証で失敗する（SSL 利用時のみ） */
function buildTlsOptions(host) {
  const strict = process.env.SMTP_TLS_STRICT === '1' || process.env.SMTP_TLS_STRICT === 'true';
  if (strict) return undefined;
  const insecureExplicit =
    process.env.SMTP_TLS_INSECURE === '1' || process.env.SMTP_TLS_INSECURE === 'true';
  if (insecureExplicit || host === DEFAULT_SMTP_HOST) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

/**
 * @param {{ to: string; subject: string; text: string; html?: string; from?: string }} opts
 */
export async function sendJbisMail(opts) {
  const { host, port, user, pass, from: cfgFrom } = getSmtpConfig();
  const from = withJbisDomain(opts.from?.trim()) || cfgFrom;
  const transportOpts = buildTransportOptions(host, port);
  const transporter = nodemailer.createTransport({
    ...transportOpts,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
