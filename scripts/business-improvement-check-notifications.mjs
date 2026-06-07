#!/usr/bin/env node
/** 700 の通知・WF設定を確認 */
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId } = loadAppIds();

  const notifPaths = [
    `/k/v1/preview/app/notifications/general.json?app=${proposalAppId}`,
    `/k/v1/app/notifications/general.json?app=${proposalAppId}`,
    `/k/v1/preview/app/notifications/perRecord.json?app=${proposalAppId}`,
    `/k/v1/app/notifications/perRecord.json?app=${proposalAppId}`,
  ];
  const notifResults = {};
  for (const p of notifPaths) {
    try {
      notifResults[p] = await fetchJson(`${baseUrl}${p}`, {
        method: 'GET', headers: { ...headers, 'Content-Type': undefined },
      });
    } catch (e) {
      notifResults[p] = { error: e.message.split('\n')[0] };
    }
  }

  const st = await fetchJson(
    `${baseUrl}/k/v1/app/status.json?app=${proposalAppId}`,
    { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
  );

  const summarize = (n) => ({
    appNotifications: (n?.notifications || []).length,
    recordNotifications: (n?.recordNotifications || []).length,
    reminders: (n?.reminders || []).length,
    items: (n?.notifications || []).map((x) => ({
      trigger: x.trigger,
      title: x.title,
      target: x.target,
      includeSubs: x.includeSubs,
    })),
    recordItems: (n?.recordNotifications || []).map((x) => ({
      events: x.events,
      title: x.title,
      target: x.target,
      filterCond: x.filterCond,
    })),
  });

  console.log(JSON.stringify({
    proposalAppId,
    notifications: notifResults,
    mgrAssignee: st.states?.Mgr?.assignee || st.states?.['上司承認中']?.assignee || null,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
