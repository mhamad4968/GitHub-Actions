/**
 * Space 48 本文 GET/PUT — VPN 注意書き等。
 * GET: /k/v1/space.json?id=  PUT: /k/v1/space/body.json
 */
import { getKintoneConfig, fetchJson } from './vpn-account-kintone.mjs';

export const SPACE48_ID = Number(process.env.SPACE48_SPACE_ID || 48);
export const VPN_NOTICE_MARKER = '⚠️【VPNライセンス】月末の確定をお忘れなく';
export const VPN_NOTICE_BOX_STYLE =
  'background:#fff3cd;border:2px solid #856404;padding:12px 16px;margin:0 0 16px;border-radius:4px';

export async function getSpaceBody(baseUrl, headers, spaceId = SPACE48_ID) {
  const url = `${baseUrl}/k/v1/space.json?id=${spaceId}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return j.body || '';
}

export async function putSpaceBody(baseUrl, headers, body, spaceId = SPACE48_ID) {
  await fetchJson(`${baseUrl}/k/v1/space/body.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id: spaceId, body }),
  });
}

export function buildVpnLicenseNoticeHtml(ym) {
  const monthLabel = ym || '当月';
  return (
    `<div style="${VPN_NOTICE_BOX_STYLE}">` +
    `<font size="4"><b>${VPN_NOTICE_MARKER}</b></font><br />` +
    '<font size="3">毎月末（28日〜）：' +
    '<a href="https://jbis-kintone.cybozu.com/k/734/" target="_blank" rel="nofollow noopener noreferrer">VPNアカウント管理台帳</a>' +
    ' を開き、ライセンス欄の <strong>「' +
    monthLabel +
    ' の集計を確定」</strong> ボタンを押してください。<br />' +
    '請求書到着後は前月比の確認のみで、再確定は不要です。</font></div>'
  );
}

export function hasVpnLicenseNotice(body) {
  return body.includes(VPN_NOTICE_MARKER);
}

export function removeVpnLicenseNotice(body) {
  const styleEsc = VPN_NOTICE_BOX_STYLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const markerEsc = VPN_NOTICE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<div style="${styleEsc}"[^>]*>[\\s\\S]*?${markerEsc}[\\s\\S]*?<\\/div>\\s*`, 'g');
  return body.replace(re, '');
}

export function upsertVpnLicenseNotice(body, noticeHtml) {
  const stripped = removeVpnLicenseNotice(body);
  return noticeHtml + stripped;
}
