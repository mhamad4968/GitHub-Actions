/**
 * M365管理マスタ（671）— 保存成功時に 674 実態へ linked_pcs / usage_count / status を再同期。
 * 手で 671 の台数だけ触った場合のズレを、次の 671 保存で 674 を正本として自動修正する。
 *
 *   npm run deploy:671
 */
(function () {
  'use strict';

  const BUILD = '2026-04-30-reconcile671-v1';
  const APP674 = '674';
  const APP671 = '671';
  const APP_ENV = '670';

  function kintoneApiGet(urlPath, params) {
    return kintone.api(kintone.api.url(urlPath, true), 'GET', params);
  }

  function kintoneApiPut(urlPath, body) {
    return kintone.api(kintone.api.url(urlPath, true), 'PUT', body);
  }

  function loadEnv670Map() {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_ENV,
      query: 'order by レコード番号 desc limit 200',
      fields: ['setting_key', 'setting_value'],
    }).then(function (resp) {
      const map = Object.create(null);
      for (let i = 0; i < (resp.records || []).length; i++) {
        const r = resp.records[i];
        const k = (r.setting_key && r.setting_key.value) || '';
        if (k) map[k] = (r.setting_value && r.setting_value.value) || '';
      }
      return map;
    });
  }

  function parseLinked671(raw) {
    return String(raw || '')
      .split(/[\r\n,]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function dedupeLinked671PreserveOrder(pcs) {
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < pcs.length; i++) {
      const p = pcs[i];
      if (!p || seen[p]) continue;
      seen[p] = true;
      out.push(p);
    }
    return out;
  }

  function next671StatusFromUsage(count, lim) {
    return count >= lim ? '満杯' : '利用可';
  }

  function sync671RowFrom674(masterId) {
    const midStr = String(masterId || '').trim();
    if (!midStr) return Promise.resolve();

    function once() {
      return loadEnv670Map().then(function (envMap) {
        const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
        const q =
          '(account_type in ("共有", "JR端末")) and pc_status not in ("廃棄") and m365_master_record_id = ' +
          midStr +
          ' limit 500';
        return kintoneApiGet('/k/v1/records.json', {
          app: APP674,
          query: q,
          fields: ['pc_name'],
        }).then(function (resp674) {
          const set = Object.create(null);
          for (let i = 0; i < (resp674.records || []).length; i++) {
            const row = resp674.records[i];
            const p = (row.pc_name && row.pc_name.value) || '';
            const t = String(p).trim();
            if (t) set[t] = true;
          }
          const pcsArr = Object.keys(set).sort();
          const desiredLinked = pcsArr.join(',');
          const desiredUsage = pcsArr.length;
          const desiredStatus = next671StatusFromUsage(desiredUsage, lim);

          return kintoneApiGet('/k/v1/record.json', { app: APP671, id: midStr }).then(function (get671) {
            const r671 = get671.record;
            const st671 = (r671.status && r671.status.value) || '';
            if (st671 === '廃止') {
              return Promise.resolve();
            }
            const curList = parseLinked671((r671.linked_pcs && r671.linked_pcs.value) || '');
            const curNorm = dedupeLinked671PreserveOrder(curList)
              .slice()
              .sort()
              .join(',');
            if (curNorm === desiredLinked) {
              const curUs = parseInt((r671.usage_count && r671.usage_count.value) || '0', 10) || 0;
              const curSt = (r671.status && r671.status.value) || '';
              if (curUs === desiredUsage && curSt === desiredStatus) return Promise.resolve();
            }
            return kintoneApiPut('/k/v1/record.json', {
              app: APP671,
              id: midStr,
              revision: get671.revision,
              record: {
                linked_pcs: { value: desiredLinked },
                usage_count: { value: String(desiredUsage) },
                status: { value: desiredStatus },
              },
            });
          });
        });
      });
    }
    return once().catch(function () {
      return once();
    });
  }

  const ev = [
    'app.record.create.submit.success',
    'app.record.edit.submit.success',
    'mobile.app.record.create.submit.success',
    'mobile.app.record.edit.submit.success',
  ];
  kintone.events.on(ev, function (event) {
    const rid = String((event.record && event.record.$id && event.record.$id.value) || '').trim();
    if (!rid) return event;
    return sync671RowFrom674(rid).then(
      function () {
        return event;
      },
      function (e) {
        console.warn('[671 M365 master] sync from 674 failed', e);
        return event;
      },
    );
  });

  console.log('[671 M365 master] customize loaded BUILD=' + BUILD);
})();
