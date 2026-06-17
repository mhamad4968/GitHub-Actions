#!/usr/bin/env node

import {

  RECORD_KIND_SETTING,

  NEXT_USER_NUM_START,

  fetchJson,

  formatDateYmd,

  getKintoneConfig,

  loadAppIds,

} from './lib/vpn-account-kintone.mjs';

import { ensureSettingsRecord } from './lib/kintone-post-settings-record.mjs';



const { baseUrl, headers } = getKintoneConfig();

const appId = loadAppIds().dbAppId;



await ensureSettingsRecord({

  baseUrl,

  headers,

  appId,

  recordKindValue: RECORD_KIND_SETTING,

  fetchJson,

  buildRecord: async () => ({

    record_kind: { value: RECORD_KIND_SETTING },

    next_user_num: { value: String(NEXT_USER_NUM_START) },

    account_label: { value: '（システム設定）' },

    dept: { value: 'システム推進室' },

    vpn_id: { value: '__vpn_settings__@kensetsutoso.fre' },

    password: { value: 'N/A' },

    registered_date: { value: formatDateYmd(new Date()) },

  }),

});

