function numericSort(a, b) {
  return Number(a.appId) - Number(b.appId);
}

export function parseManagedAppsFromMarkdown(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === '## アプリ一覧');
  if (start < 0) throw new Error('kintone-apps.md: `## アプリ一覧` が見つかりません');

  const apps = [];
  const seen = new Set();
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^###\s/.test(line)) break;
    const match = line.match(/^\|(.+?)\|\s*\*\*(\d+)\*\*/);
    if (!match) continue;
    const appId = match[2];
    if (seen.has(appId)) continue;
    seen.add(appId);
    const logicalName = match[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    apps.push({ appId, logicalName });
  }
  if (!apps.length) throw new Error('kintone-apps.md: アプリ一覧から appId を取得できません');
  return apps.sort(numericSort);
}

/** ## アプリ一覧の appId のうち、registry scope に無いもの（オフライン・API なし） */
export function findManagedIdsMissingFromRegistry(managedApps, scopeIds) {
  const scope = new Set([...scopeIds].map(String));
  return [...new Set(managedApps.map((app) => String(app.appId)))].filter(
    (id) => !scope.has(id),
  );
}

export function normalizeLiveApp(app) {
  return {
    appId: String(app.appId),
    name: String(app.name || ''),
    spaceId: app.spaceId == null ? null : String(app.spaceId),
    threadId: app.threadId == null ? null : String(app.threadId),
    createdAt: app.createdAt || null,
    modifiedAt: app.modifiedAt || null,
  };
}

export function classifyInventory({
  managedApps,
  retiredIds,
  scopeIds,
  liveApps,
  previousLiveApps = [],
}) {
  const retired = new Set([...retiredIds].map(String));
  const scope = new Set([...scopeIds].map(String));
  const managedById = new Map(managedApps.map((app) => [String(app.appId), app]));
  const liveById = new Map(
    liveApps
      .map(normalizeLiveApp)
      .filter((app) => scope.has(app.appId))
      .map((app) => [app.appId, app]),
  );
  const previousById = new Map(
    previousLiveApps
      .map(normalizeLiveApp)
      .filter((app) => scope.has(app.appId))
      .map((app) => [app.appId, app]),
  );

  const activePresent = [];
  const activeMissing = [];
  const retiredAbsent = [];
  const retiredPresent = [];

  for (const managed of managedApps) {
    const appId = String(managed.appId);
    const live = liveById.get(appId);
    if (retired.has(appId)) {
      (live ? retiredPresent : retiredAbsent).push({ ...managed, live: live || null });
    } else {
      (live ? activePresent : activeMissing).push({ ...managed, live: live || null });
    }
  }

  for (const appId of retired) {
    if (managedById.has(appId) || !scope.has(appId)) continue;
    const live = liveById.get(appId);
    const row = { appId, logicalName: 'AIチーム管理・削除済みID', live: live || null };
    (live ? retiredPresent : retiredAbsent).push(row);
  }

  const unlistedLive = [...liveById.values()]
    .filter((app) => !managedById.has(app.appId) && !retired.has(app.appId))
    .sort(numericSort);

  const trackedMissing = [...scope]
    .filter((appId) => !managedById.has(appId) && !retired.has(appId) && !liveById.has(appId))
    .map((appId) => ({ appId, logicalName: 'AIチーム管理レジストリ掲載' }))
    .sort(numericSort);

  const newSinceLast = previousById.size
    ? [...liveById.values()]
        .filter((app) => !previousById.has(app.appId))
        .sort(numericSort)
    : [];

  const removedSinceLast = previousById.size
    ? [...previousById.values()]
        .filter((app) => !liveById.has(app.appId))
        .sort(numericSort)
    : [];

  const nameChanges = previousById.size
    ? [...liveById.values()]
        .filter((app) => {
          const previous = previousById.get(app.appId);
          return previous && previous.name !== app.name;
        })
        .map((app) => ({
          appId: app.appId,
          previousName: previousById.get(app.appId).name,
          currentName: app.name,
        }))
        .sort(numericSort)
    : [];

  return {
    activePresent: activePresent.sort(numericSort),
    activeMissing: activeMissing.sort(numericSort),
    retiredAbsent: retiredAbsent.sort(numericSort),
    retiredPresent: retiredPresent.sort(numericSort),
    unlistedLive,
    trackedMissing,
    newSinceLast,
    removedSinceLast,
    nameChanges,
    ok: activeMissing.length === 0 && retiredPresent.length === 0 && trackedMissing.length === 0,
  };
}
