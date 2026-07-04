#!/usr/bin/env node

/**

 * 595 → 新② 社員マスタ 同期（初回・日次共通）

 * 突合キー: 595.$id → 698.$id（初回 seed と同一）。所属変更時も同一行を PUT。

 * 誤 POST 重複（同一氏名・別 $id）は削除。完了後 697 sync595_meta に記録。

 */

import {

  fetchJson,

  getKintoneConfig,

  loadAppIds,

} from './lib/business-improvement-kintone.mjs';

import {

  buildSync595Meta,

  writeSync595Meta,

} from './lib/business-improvement-sync595-meta.mjs';

import {

  normalizeEmployeeKey,

  planSync595To698,

} from './lib/business-improvement-sync595-plan.mjs';



export { normalizeEmployeeKey } from './lib/business-improvement-sync595-plan.mjs';



const APP_595 = 595;

const FIELDS_595 = ['user_name', 'dept_name', 'group_name', 'employment_status', 'mail', '$id'];

const FIELDS_EMP = ['user_name', 'dept_name', 'group_name', 'employment_status', 'source595_id', '$id', '$revision'];



async function getAllRecords(baseUrl, headers, app, fields) {

  const out = [];

  let offset = 0;

  const limit = 500;

  for (;;) {

    const query = encodeURIComponent(`order by $id asc limit ${limit} offset ${offset}`);

    const params = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');

    const url = `${baseUrl}/k/v1/records.json?app=${app}&query=${query}&${params}`;

    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

    const batch = j.records || [];

    out.push(...batch);

    if (batch.length < limit) break;

    offset += limit;

  }

  return out;

}



async function deleteRecords(baseUrl, headers, appId, toDelete) {

  const CHUNK = 100;

  for (let i = 0; i < toDelete.length; i += CHUNK) {

    const slice = toDelete.slice(i, i + CHUNK);

    await fetchJson(`${baseUrl}/k/v1/records.json`, {

      method: 'DELETE',

      headers,

      body: JSON.stringify({

        app: appId,

        ids: slice.map((d) => d.id),

      }),

    });

    console.log(`[sync] DELETE ${Math.min(i + CHUNK, toDelete.length)}/${toDelete.length}`);

  }

}



async function main() {

  const dryRun = process.argv.includes('--dry-run');

  const { baseUrl, headers } = getKintoneConfig();

  const state = loadAppIds();

  const employeeAppId = state.employeeAppId;

  const settingsAppId = state.settingsAppId;

  if (!employeeAppId) throw new Error('employeeAppId missing — run business-improvement:create-employee-app');



  let stats = null;

  let drift = null;

  try {

    const rows595 = await getAllRecords(baseUrl, headers, APP_595, FIELDS_595);

    const rowsEmp = await getAllRecords(baseUrl, headers, employeeAppId, FIELDS_EMP);



    const plan = planSync595To698(rows595, rowsEmp);

    stats = plan.stats;

    drift = plan.drift;



    console.log(JSON.stringify({ dryRun, ...stats, ...drift }, null, 2));



    if (dryRun) return;



    const { toPost, toPut, toDelete } = plan;

    const CHUNK = 100;

    for (let i = 0; i < toPost.length; i += CHUNK) {

      await fetchJson(`${baseUrl}/k/v1/records.json`, {

        method: 'POST',

        headers,

        body: JSON.stringify({ app: employeeAppId, records: toPost.slice(i, i + CHUNK) }),

      });

      console.log(`[sync] POST ${Math.min(i + CHUNK, toPost.length)}/${toPost.length}`);

    }



    for (const item of toPut) {

      await fetchJson(`${baseUrl}/k/v1/record.json`, {

        method: 'PUT',

        headers,

        body: JSON.stringify({

          app: employeeAppId,

          id: item.id,

          revision: item.revision,

          record: item.record,

        }),

      });

    }

    if (toPut.length) console.log(`[sync] PUT ${toPut.length}`);



    if (toDelete.length) {

      await deleteRecords(baseUrl, headers, employeeAppId, toDelete);

    }



    console.log(`[sync] OK employeeApp=${employeeAppId}`);



    drift = {

      drift698Only: 0,

      drift595Only: 0,

      warn: false,

    };

    stats = { ...stats, mirrorTotal: rows595.length };



    if (settingsAppId) {

      await writeSync595Meta(

        baseUrl,

        headers,

        settingsAppId,

        buildSync595Meta({ ok: true, stats, drift }),

      );

    }

  } catch (e) {

    const msg = e.message || String(e);

    console.error(msg);

    if (!dryRun && settingsAppId) {

      try {

        await writeSync595Meta(

          baseUrl,

          headers,

          settingsAppId,

          buildSync595Meta({

            ok: false,

            stats,

            drift: stats ? { drift698Only: null, drift595Only: null, warn: true } : null,

            error: msg,

          }),

        );

      } catch (metaErr) {

        console.error(`[sync595_meta] write failed: ${metaErr.message || metaErr}`);

      }

    }

    process.exit(1);

  }

}



main().catch((e) => {

  console.error(e.message || e);

  process.exit(1);

});

