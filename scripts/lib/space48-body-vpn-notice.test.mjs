#!/usr/bin/env node
/** @see scripts/lib/space48-body.mjs */
import assert from 'node:assert/strict';
import {
  buildVpnLicenseNoticeHtml,
  removeVpnLicenseNotice,
  upsertVpnLicenseNotice,
  VPN_NOTICE_BOX_STYLE,
  VPN_NOTICE_MARKER,
} from './space48-body.mjs';

const canonical = buildVpnLicenseNoticeHtml('2026-06');
const normalizedStyle =
  'background: rgb( 255 , 243 , 205 );border:2px solid rgb( 133 , 100 , 4 );padding:12px 16px;margin:0px 0px 16px;border-radius:4px';
const kintoneNormalized = canonical.replace(VPN_NOTICE_BOX_STYLE, normalizedStyle);
const bodyWithDup = canonical + kintoneNormalized + '<p>portal</p>';

const stripped = removeVpnLicenseNotice(bodyWithDup);
assert.equal((stripped.match(/VPNライセンス/g) || []).length, 0, 'all notice blocks removed');

const upserted = upsertVpnLicenseNotice(bodyWithDup, canonical);
assert.equal((upserted.match(/VPNライセンス/g) || []).length, 1, 'single notice after upsert');
assert.ok(upserted.includes(VPN_NOTICE_MARKER));

console.log('space48-body VPN notice tests OK');
