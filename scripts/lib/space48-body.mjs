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
    '<a href="https://jbis-kintone.cybozu.com/k/734/" target="_blank" rel="nofollow noopener noreferrer">VPNアカウント台帳</a>' +
    ' を開き、ライセンス欄の <strong>「' +
    monthLabel +
    ' の集計を確定」</strong> ボタンを押してください。<br />' +
    '請求書到着後は前月比の確認のみで、再確定は不要です。</font></div>'
  );
}

export function hasVpnLicenseNotice(body) {
  return VPN_NOTICE_MARKERS.some((m) => body.includes(m));
}

/** kintone PUT 後に style が正規化されても除去できるようマーカー複数 */
export const VPN_NOTICE_MARKERS = [
  VPN_NOTICE_MARKER,
  '【VPNライセンス】月末の確定をお忘れなく',
];

/** @returns {number} marker を含む div ブロックの先頭 index（無ければ -1） */
function findVpnNoticeDivStart(body) {
  let best = -1;
  for (const marker of VPN_NOTICE_MARKERS) {
    const idx = body.indexOf(marker);
    if (idx < 0) continue;
    const divStart = body.lastIndexOf('<div', idx);
    if (divStart < 0) continue;
    if (best < 0 || divStart < best) best = divStart;
  }
  return best;
}

/** 1 ブロックだけ除去（marker 基準・style 正規化に非依存） */
export function removeOneVpnLicenseNotice(body) {
  const divStart = findVpnNoticeDivStart(body);
  if (divStart < 0) return body;
  const divEnd = body.indexOf('</div>', divStart);
  if (divEnd < 0) return body;
  return body.slice(0, divStart) + body.slice(divEnd + '</div>'.length);
}

export function removeVpnLicenseNotice(body) {
  let result = body;
  for (;;) {
    const next = removeOneVpnLicenseNotice(result);
    if (next === result) break;
    result = next;
  }
  // 旧形式（style 完全一致）の残骸も除去
  const styleEsc = VPN_NOTICE_BOX_STYLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const markerEsc = VPN_NOTICE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<div style="${styleEsc}"[^>]*>[\\s\\S]*?${markerEsc}[\\s\\S]*?<\\/div>\\s*`, 'g');
  return result.replace(re, '');
}

export function upsertVpnLicenseNotice(body, noticeHtml) {
  const stripped = removeVpnLicenseNotice(body);
  return noticeHtml + stripped;
}
