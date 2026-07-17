#!/usr/bin/env node
/**
 * Safely configures App 700 evaluation notifications.
 * Read-only unless both --apply and --confirm APP700_EVALUATION_NOTIFICATIONS are present.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const EXPECTED_APP_ID = 700;
const CONFIRMATION = 'APP700_EVALUATION_NOTIFICATIONS';
const REQUIRED_FIELD_CODES = ['提案件名', 'Status', 'Assignee'];
const REQUIRED_STATES = ['Mgr', 'Branch'];
const GENERAL_EVENT_KEYS = [
  'recordAdded',
  'recordEdited',
  'statusChanged',
  'commentAdded',
  'fileImported',
];
const GET_HEADERS = (headers) => ({ ...headers, 'Content-Type': undefined });
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, '..');
const BACKUP_DIRECTORY = path.join(
  REPOSITORY_ROOT,
  'logs',
  'business-improvement-notifications',
);

const TARGET_ASSIGNEE = {
  entity: { type: 'FIELD_ENTITY', code: 'Assignee' },
  includeSubs: false,
};

// Kintone fixes the outgoing email subject format; these titles identify the requested action in its subject.
const DESIRED_PER_RECORD_NOTIFICATIONS = [
  {
    filterCond: 'Status in ("Mgr")',
    title: '【評価依頼】上司評価をお願いします',
    targets: [TARGET_ASSIGNEE],
  },
  {
    filterCond: 'Status in ("Branch")',
    title: '【評価依頼】支店長評価をお願いします',
    targets: [TARGET_ASSIGNEE],
  },
  {
    filterCond: 'Status in ("Hr", "本社評価中")',
    title: '【評価依頼】本社評価をお願いします',
    targets: [TARGET_ASSIGNEE],
  },
];

const DESIRED_TITLE_FIELD = {
  selectionMode: 'MANUAL',
  code: '提案件名',
};

function parseArguments(argv) {
  let apply = false;
  let dryRun = false;
  let confirmation = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') {
      apply = true;
    } else if (argument === '--dry-run') {
      dryRun = true;
    } else if (argument === '--confirm') {
      confirmation = argv[index + 1] ?? null;
      index += 1;
    } else if (argument.startsWith('--confirm=')) {
      confirmation = argument.slice('--confirm='.length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (apply && dryRun) {
    throw new Error('Choose either --apply or --dry-run, not both.');
  }

  const hasConfirmation = confirmation != null;
  if (apply !== hasConfirmation) {
    throw new Error(
      `Apply requires both --apply and --confirm ${CONFIRMATION}; no mutation was attempted.`,
    );
  }
  if (hasConfirmation && confirmation !== CONFIRMATION) {
    throw new Error(`Invalid confirmation token; expected ${CONFIRMATION}.`);
  }

  return { apply };
}

function requestUrl(baseUrl, endpoint, appId) {
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set('app', String(appId));
  return url;
}

async function getSetting(baseUrl, headers, endpoint, appId) {
  return fetchJson(requestUrl(baseUrl, endpoint, appId), {
    method: 'GET',
    headers: GET_HEADERS(headers),
  });
}

async function fetchState(baseUrl, headers, appId) {
  const endpoints = {
    appSettings: ['/k/v1/app/settings.json', '/k/v1/preview/app/settings.json'],
    general: [
      '/k/v1/app/notifications/general.json',
      '/k/v1/preview/app/notifications/general.json',
    ],
    perRecord: [
      '/k/v1/app/notifications/perRecord.json',
      '/k/v1/preview/app/notifications/perRecord.json',
    ],
    status: ['/k/v1/app/status.json', '/k/v1/preview/app/status.json'],
    fields: ['/k/v1/app/form/fields.json', '/k/v1/preview/app/form/fields.json'],
  };

  const entries = await Promise.all(
    Object.entries(endpoints).map(async ([name, [liveEndpoint, previewEndpoint]]) => {
      const [live, preview] = await Promise.all([
        getSetting(baseUrl, headers, liveEndpoint, appId),
        getSetting(baseUrl, headers, previewEndpoint, appId),
      ]);
      return [name, { live, preview }];
    }),
  );
  return Object.fromEntries(entries);
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'revision')
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function canonicalWithRevisions(value) {
  if (Array.isArray(value)) return value.map(canonicalWithRevisions);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalWithRevisions(item)]),
    );
  }
  return value;
}

function exactlyEqual(left, right) {
  return (
    JSON.stringify(canonicalWithRevisions(left))
    === JSON.stringify(canonicalWithRevisions(right))
  );
}

function assertEqual(left, right, message) {
  if (!equal(left, right)) throw new Error(message);
}

function isAssigneeEntity(notification) {
  return (
    notification?.entity?.type === 'FIELD_ENTITY'
    && notification.entity.code === 'Assignee'
  );
}

function hasOtherTrueEvent(notification) {
  return GENERAL_EVENT_KEYS.some(
    (key) => key !== 'statusChanged' && notification[key] === true,
  );
}

function buildDesiredGeneral(current) {
  const notifications = [];
  const removedGenericNotification = [];

  for (const notification of current.notifications ?? []) {
    if (!isAssigneeEntity(notification) || notification.statusChanged !== true) {
      notifications.push(notification);
      continue;
    }

    if (hasOtherTrueEvent(notification)) {
      const preserved = { ...notification, statusChanged: false };
      notifications.push(preserved);
      removedGenericNotification.push({ before: notification, after: preserved });
    } else {
      removedGenericNotification.push({ before: notification, after: null });
    }
  }

  return {
    notifications,
    notifyToCommenter: current.notifyToCommenter,
    removedGenericNotification,
  };
}

function relevantFields(fields) {
  return Object.fromEntries(
    REQUIRED_FIELD_CODES.map((code) => [code, fields.properties?.[code] ?? null]),
  );
}

function validateAndPlan(appId, state) {
  if (!appId) throw new Error('proposalAppId is missing.');
  if (Number(appId) !== EXPECTED_APP_ID) {
    throw new Error(`Refusing app ${appId}; proposalAppId must be ${EXPECTED_APP_ID}.`);
  }

  for (const name of ['appSettings', 'general', 'perRecord', 'status']) {
    assertEqual(
      state[name].live,
      state[name].preview,
      `${name} differs between live and preview; resolve pending settings first.`,
    );
  }
  assertEqual(
    relevantFields(state.fields.live),
    relevantFields(state.fields.preview),
    'Required field definitions differ between live and preview.',
  );

  for (const side of ['live', 'preview']) {
    for (const code of REQUIRED_FIELD_CODES) {
      if (!state.fields[side].properties?.[code]) {
        throw new Error(`Required field code "${code}" is unavailable in ${side}.`);
      }
    }
  }

  // These are internal workflow state keys, not their potentially localized display labels.
  const workflowStates = Object.keys(state.status.live.states ?? {}).sort();
  for (const requiredState of REQUIRED_STATES) {
    if (!workflowStates.includes(requiredState)) {
      throw new Error(`Required workflow state "${requiredState}" is absent.`);
    }
  }

  const currentPerRecord = state.perRecord.live.notifications ?? [];
  const perRecordIsEmpty = currentPerRecord.length === 0;
  const perRecordIsManaged = equal(
    currentPerRecord,
    DESIRED_PER_RECORD_NOTIFICATIONS,
  );
  if (!perRecordIsEmpty && !perRecordIsManaged) {
    throw new Error(
      'Existing per-record notifications are not empty and do not exactly match the managed set.',
    );
  }

  const desiredGeneral = buildDesiredGeneral(state.general.live);
  const desiredPerRecord = DESIRED_PER_RECORD_NOTIFICATIONS;
  const titleMatches = equal(state.appSettings.live.titleField, DESIRED_TITLE_FIELD);
  const generalMatches = equal(
    {
      notifications: state.general.live.notifications ?? [],
      notifyToCommenter: state.general.live.notifyToCommenter,
    },
    {
      notifications: desiredGeneral.notifications,
      notifyToCommenter: desiredGeneral.notifyToCommenter,
    },
  );
  const perRecordMatches = equal(currentPerRecord, desiredPerRecord);

  return {
    desiredGeneral,
    desiredPerRecord,
    workflowStates,
    applyRequired: !(titleMatches && generalMatches && perRecordMatches),
    summary: {
      app: Number(appId),
      currentTitleField: state.appSettings.live.titleField ?? null,
      desiredTitleField: DESIRED_TITLE_FIELD,
      removedGenericNotification: desiredGeneral.removedGenericNotification,
      preservedGeneralNotifications: desiredGeneral.notifications,
      currentPerRecordNotifications: currentPerRecord,
      desiredPerRecordNotifications: desiredPerRecord,
      workflowStates,
      applyRequired: !(titleMatches && generalMatches && perRecordMatches),
    },
  };
}

function exactStateForDrift(state) {
  return {
    appSettings: state.appSettings,
    general: state.general,
    perRecord: state.perRecord,
    status: state.status,
    requiredFields: {
      live: relevantFields(state.fields.live),
      preview: relevantFields(state.fields.preview),
    },
  };
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function writeBackup(appId, state) {
  await mkdir(BACKUP_DIRECTORY, { recursive: true });
  const backupPath = path.join(
    BACKUP_DIRECTORY,
    `${timestampForFilename()}-app-${appId}.json`,
  );
  const backup = {
    createdAt: new Date().toISOString(),
    app: Number(appId),
    snapshots: {
      appSettings: state.appSettings,
      general: state.general,
      perRecord: state.perRecord,
      status: state.status,
    },
  };
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, 'utf8');
  return backupPath;
}

async function putPreview(baseUrl, headers, endpoint, body) {
  return fetchJson(`${baseUrl}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

async function rollback({
  baseUrl,
  headers,
  appId,
  originalState,
  deployStarted,
}) {
  let revision = (
    await getSetting(baseUrl, headers, '/k/v1/preview/app/settings.json', appId)
  ).revision;

  const titleResult = await putPreview(
    baseUrl,
    headers,
    '/k/v1/preview/app/settings.json',
    {
      app: appId,
      titleField: originalState.appSettings.preview.titleField,
      revision,
    },
  );
  revision = titleResult.revision;

  const generalResult = await putPreview(
    baseUrl,
    headers,
    '/k/v1/preview/app/notifications/general.json',
    {
      app: appId,
      notifications: originalState.general.preview.notifications ?? [],
      notifyToCommenter: originalState.general.preview.notifyToCommenter,
      revision,
    },
  );
  revision = generalResult.revision;

  const perRecordResult = await putPreview(
    baseUrl,
    headers,
    '/k/v1/preview/app/notifications/perRecord.json',
    {
      app: appId,
      notifications: originalState.perRecord.preview.notifications ?? [],
      revision,
    },
  );
  revision = perRecordResult.revision;

  if (deployStarted) {
    await deployApp(baseUrl, headers, appId, revision);
  }
}

async function verifyApplied(baseUrl, headers, appId, desiredGeneral) {
  const [appSettings, general, perRecord] = await Promise.all([
    getSetting(baseUrl, headers, '/k/v1/app/settings.json', appId),
    getSetting(baseUrl, headers, '/k/v1/app/notifications/general.json', appId),
    getSetting(baseUrl, headers, '/k/v1/app/notifications/perRecord.json', appId),
  ]);

  assertEqual(
    appSettings.titleField,
    DESIRED_TITLE_FIELD,
    'Verification failed: live titleField does not match.',
  );
  assertEqual(
    {
      notifications: general.notifications ?? [],
      notifyToCommenter: general.notifyToCommenter,
    },
    {
      notifications: desiredGeneral.notifications,
      notifyToCommenter: desiredGeneral.notifyToCommenter,
    },
    'Verification failed: live general notifications do not match.',
  );
  assertEqual(
    perRecord.notifications ?? [],
    DESIRED_PER_RECORD_NOTIFICATIONS,
    'Verification failed: live per-record notifications do not match.',
  );

  return { titleField: true, general: true, perRecord: true };
}

async function applyChanges(baseUrl, headers, appId, initialState) {
  const freshState = await fetchState(baseUrl, headers, appId);
  const freshPlan = validateAndPlan(appId, freshState);
  if (!exactlyEqual(exactStateForDrift(freshState), exactStateForDrift(initialState))) {
    throw new Error(
      'Configuration drift was detected immediately before apply; no mutation was attempted.',
    );
  }
  if (!freshPlan.applyRequired) {
    console.log(JSON.stringify({ app: Number(appId), noOp: true, deployed: false }, null, 2));
    return;
  }

  const backupPath = await writeBackup(appId, freshState);
  let mutationAttempted = false;
  let deployStarted = false;

  try {
    let revision = freshState.appSettings.preview.revision;
    mutationAttempted = true;
    const appSettingsResult = await putPreview(
      baseUrl,
      headers,
      '/k/v1/preview/app/settings.json',
      {
        app: appId,
        titleField: DESIRED_TITLE_FIELD,
        revision,
      },
    );
    revision = appSettingsResult.revision;

    const generalResult = await putPreview(
      baseUrl,
      headers,
      '/k/v1/preview/app/notifications/general.json',
      {
        app: appId,
        notifications: freshPlan.desiredGeneral.notifications,
        notifyToCommenter: freshPlan.desiredGeneral.notifyToCommenter,
        revision,
      },
    );
    revision = generalResult.revision;

    const perRecordResult = await putPreview(
      baseUrl,
      headers,
      '/k/v1/preview/app/notifications/perRecord.json',
      {
        app: appId,
        notifications: freshPlan.desiredPerRecord,
        revision,
      },
    );
    revision = perRecordResult.revision;

    deployStarted = true;
    await deployApp(baseUrl, headers, appId, revision);
    const verification = await verifyApplied(
      baseUrl,
      headers,
      appId,
      freshPlan.desiredGeneral,
    );
    console.log(JSON.stringify({
      app: Number(appId),
      backupPath,
      deployed: true,
      verification,
    }, null, 2));
  } catch (applyError) {
    if (!mutationAttempted) throw applyError;
    try {
      await rollback({
        baseUrl,
        headers,
        appId,
        originalState: freshState,
        deployStarted,
      });
      throw new Error(
        `Apply failed: ${applyError.message}. Rollback succeeded. Backup: ${backupPath}`,
      );
    } catch (rollbackError) {
      if (rollbackError.message.includes('Rollback succeeded.')) throw rollbackError;
      throw new Error(
        `Apply failed: ${applyError.message}. Rollback failed: ${rollbackError.message}. Backup: ${backupPath}`,
      );
    }
  }
}

async function main() {
  const { apply } = parseArguments(process.argv.slice(2));
  const { baseUrl, headers } = getKintoneConfig();
  const { proposalAppId } = loadAppIds();
  if (!proposalAppId) throw new Error('proposalAppId is missing.');
  if (Number(proposalAppId) !== EXPECTED_APP_ID) {
    throw new Error(
      `Refusing app ${proposalAppId}; proposalAppId must be ${EXPECTED_APP_ID}.`,
    );
  }

  const state = await fetchState(baseUrl, headers, proposalAppId);
  const plan = validateAndPlan(proposalAppId, state);

  if (!apply) {
    console.log(JSON.stringify(plan.summary, null, 2));
    return;
  }
  if (!plan.applyRequired) {
    console.log(JSON.stringify({
      app: Number(proposalAppId),
      noOp: true,
      deployed: false,
    }, null, 2));
    return;
  }

  await applyChanges(baseUrl, headers, proposalAppId, state);
}

main().catch((error) => {
  console.error(`[evaluation-notifications] ${error.message}`);
  process.exitCode = 1;
});
