(function () {
  'use strict';

  /** 業務改善 ver.02 — 提案申請 申請UI（Phase 4b）+ 評価UI（Phase 5） */
  var BUILD = '2026-06-07-bi-proposal-apply-v33';
  var WF_ACTION_APPLY = 'Apply';
  var WF_ACTION_REAPPLY = 'reapply';
  var BI = {
    settingsAppId: 697,
    employeeAppId: 698,
    guideAppId: 699,
    proposalAppId: null,
  };

  var FONT_KEY = 'bi-proposal-font-size';
  var SPACE_ID = 'bi_apply_ui';
  var MAX_TEXT = 120;

  var F = {
    dept: '部署',
    repName: '社員名',
    type: '提案種別',
    title: '提案件名',
    date: '提案日',
    purpose: '目的',
    current: '現状',
    problem: '問題点',
    plan: '改善案',
    effect: '効果',
    proposers: '提案者一覧',
    propDept: '提案者所属',
    propName: '提案者名',
    attach: '添付ファイル_0',
    status: 'ステータス',
  };

  var HIDE_EVAL = [
    'eval_effect', 'eval_ingenuity', 'eval_effort', 'eval_overall',
    '評価コメント', '合計点', '表彰ランク_自動', '表彰ランク_最終', '付与ポイント',
    'branch_delegate', '差戻し理由', '申請者', '部長評価者', '支店長評価者',
    '人事部長評価者', '評価スナップショット', '提案操作履歴', F.date,
  ];

  var HIDE_APPLY = [
    F.dept, F.repName, F.type, F.title, F.purpose, F.current, F.problem,
    F.plan, F.effect, F.proposers, F.attach,
  ];

  var ACC = [
    { code: F.purpose, label: '目的' },
    { code: F.current, label: '現状' },
    { code: F.problem, label: '問題点' },
    { code: F.plan, label: '改善案' },
    { code: F.effect, label: '効果' },
  ];

  var INPUT_FULL = 'width:100%;max-width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px';
  var TYPE_OPTS = ['業務改善提案', 'アイデア提案'];
  var APPLY_STATUS = {
    '未処理': 1, unprocessed: 1, Draft: 1,
    '申請者修正待ち': 1, applicant_fix: 1,
  };

  var WF_STATE_LABELS = {
    Draft: '未処理', unprocessed: '未処理', '未処理': '未処理',
    Mgr: '上司承認中', manager: '上司承認中', '上司承認中': '上司承認中',
    Branch: '支店長承認中', branch: '支店長承認中', '支店長承認中': '支店長承認中',
    Hr: '人事研修部長承認中', hr: '人事研修部長承認中', '人事研修部長承認中': '人事研修部長承認中',
    Done: '完了', done: '完了', '完了': '完了',
    applicant_fix: '申請者修正待ち', '申請者修正待ち': '申請者修正待ち',
  };

  var WF_FALLBACK_ROUTE = [
    { key: 'Draft', label: '未処理', index: 0 },
    { key: 'Mgr', label: '上司承認中', index: 1 },
    { key: 'Branch', label: '支店長承認中', index: 2 },
    { key: 'Hr', label: '人事研修部長承認中', index: 3 },
    { key: 'Done', label: '完了', index: 4 },
  ];

  var ui = {
    root: null,
    open: {},
    depts: [],
    syncing: false,
    searchTarget: 0,
    autoPurpose: false,
    pendingApply: false,
    pendingReapply: false,
    rendering: false,
    cache: {},
    attachFiles: [],
    readOnly: false,
    allowNavigate: false,
    applyDraftRec: null,
    wfRoute: null,
    wfRoutePromise: null,
    wfActions: null,
    wfPeople: null,
    loginUser: '',
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escQ(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function fontPx() {
    return localStorage.getItem(FONT_KEY) === 'large' ? '18px' : '16px';
  }

  function hideFields(codes) {
    codes.forEach(function (code) {
      try { kintone.app.record.setFieldShown(code, false); } catch (e) { /* noop */ }
    });
  }

  function isDetailShow(ev) {
    return ev.type.indexOf('detail') >= 0;
  }

  function recordShowUrl(recordId, edit) {
    var id = String(recordId);
    var url = '/k/' + kintone.app.getId() + '/show#record=' + id;
    return edit ? url + '&mode=edit' : url;
  }
  function isApplyMode(ev) {
    if (ev.type.indexOf('create') >= 0) return true;
    var st = recordStatusKey(ev.record);
    return !!APPLY_STATUS[st];
  }

  function recordStatusKey(rec) {
    return val(rec, 'Status') || val(rec, F.status) || 'Draft';
  }

  function normalizeWfStateKey(key) {
    var map = {
      unprocessed: 'Draft', '未処理': 'Draft',
      manager: 'Mgr', '上司承認中': 'Mgr',
      branch: 'Branch', '支店長承認中': 'Branch',
      hr: 'Hr', '人事研修部長承認中': 'Hr',
      done: 'Done', '完了': 'Done',
      applicant_fix: 'Draft', '申請者修正待ち': 'Draft',
    };
    return map[key] || key;
  }

  function wfStateLabel(key) {
    return WF_STATE_LABELS[key] || key;
  }

  function fetchWfRoute() {
    if (ui.wfRoute) return kintone.Promise.resolve(ui.wfRoute);
    if (ui.wfRoutePromise) return ui.wfRoutePromise;
    ui.wfRoutePromise = kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', {
      app: kintone.app.getId(),
    }).then(function (res) {
      var states = res.states || {};
      ui.wfActions = res.actions || [];
      ui.wfRoute = Object.keys(states).map(function (key) {
        return {
          key: key,
          label: wfStateLabel(key),
          index: parseInt(states[key].index || '0', 10),
        };
      }).sort(function (a, b) { return a.index - b.index; });
      return ui.wfRoute;
    }).catch(function () {
      ui.wfRoute = WF_FALLBACK_ROUTE.slice();
      return ui.wfRoute;
    });
    return ui.wfRoutePromise;
  }

  function wfRouteCurrentIndex(steps, cur) {
    var idx = -1;
    steps.forEach(function (s, i) {
      if (s.key === cur || s.label === cur || wfStateLabel(cur) === s.label) idx = i;
    });
    if (idx < 0 && APPLY_STATUS[cur]) idx = 0;
    return idx;
  }

  function wfPersonFromField(rec, fieldCode) {
    if (!rec || !rec[fieldCode] || !rec[fieldCode].value || !rec[fieldCode].value.length) return '';
    var u = rec[fieldCode].value[0];
    return u && u.code ? u.code : '';
  }

  function wfStepRoleLabel(stateKey) {
    var map = {
      Draft: '申請', unprocessed: '申請', '未処理': '申請',
      applicant_fix: '再申請', '申請者修正待ち': '再申請',
      Mgr: '上司承認', manager: '上司承認', '上司承認中': '上司承認',
      Branch: '支店長承認', branch: '支店長承認', '支店長承認中': '支店長承認',
      Hr: '人事承認', hr: '人事承認', '人事研修部長承認中': '人事承認',
      Done: '完了', done: '完了', '完了': '完了',
    };
    return map[stateKey] || wfStateLabel(stateKey);
  }

  function wfStepPerson(stateKey, rec) {
    var people = ui.wfPeople || {};
    if (stateKey === 'Draft' || stateKey === 'unprocessed' || stateKey === '未処理' ||
        stateKey === 'applicant_fix' || stateKey === '申請者修正待ち') {
      return people.applicant || wfPersonFromField(rec, '申請者') || ui.loginUser || '';
    }
    if (stateKey === 'Mgr' || stateKey === 'manager' || stateKey === '上司承認中') {
      return people.mgr || wfPersonFromField(rec, '部長評価者') || '';
    }
    if (stateKey === 'Branch' || stateKey === 'branch' || stateKey === '支店長承認中') {
      return people.branch || wfPersonFromField(rec, '支店長評価者') || '';
    }
    if (stateKey === 'Hr' || stateKey === 'hr' || stateKey === '人事研修部長承認中') {
      return people.hr || wfPersonFromField(rec, '人事部長評価者') || '';
    }
    return '';
  }

  function wfStepChipLabel(stateKey, rec) {
    var role = wfStepRoleLabel(stateKey);
    if (stateKey === 'Done' || stateKey === 'done' || stateKey === '完了') return role;
    var person = wfStepPerson(stateKey, rec);
    return person ? role + '（' + person + '）' : role + '（未設定）';
  }

  function resolveWfPeople(rec) {
    ui.loginUser = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';
    var cached = {
      applicant: wfPersonFromField(rec, '申請者') || ui.loginUser,
      mgr: wfPersonFromField(rec, '部長評価者'),
      branch: wfPersonFromField(rec, '支店長評価者'),
      hr: wfPersonFromField(rec, '人事部長評価者'),
    };
    return resolveSettingsForApply(rec).then(function (row) {
      return fetchHrLoginApply().then(function (hrLogin) {
        if (!cached.mgr && row && row.manager_login) cached.mgr = row.manager_login.value || '';
        if (!cached.branch && row && row.branch_manager_login) cached.branch = row.branch_manager_login.value || '';
        if (!cached.hr) cached.hr = hrLogin || '';
        ui.wfPeople = cached;
        return cached;
      });
    }).catch(function () {
      ui.wfPeople = cached;
      return cached;
    });
  }

  function refreshWfRouteDisplay(rec, variant) {
    rec = rec || recForApplyCheck();
    variant = variant || 'apply';
    return resolveWfPeople(rec).then(function () {
      var wrap = ui.root && ui.root.querySelector('[data-bi-wf-route-wrap]');
      if (wrap) wrap.innerHTML = wfRouteHtml(rec, 'apply');
      var evWrap = evUi.root && evUi.root.querySelector('[data-bi-wf-route-wrap]');
      if (evWrap) evWrap.innerHTML = wfRouteHtml(rec, 'eval');
    });
  }

  function resolveLogicalWfSteps(rec, variant) {
    if (evalIsDoneStatus(rec)) return ui.wfRoute || WF_FALLBACK_ROUTE;
    var st = recordStatusKey(rec);
    var steps = [
      { key: 'Draft', label: '未処理', index: 0 },
      { key: 'Mgr', label: '上司承認中', index: 1 },
    ];
    var auto = val(rec, FE.rankAuto);
    if (!filled(auto) && evalItemsDone(rec)) auto = recalcEvalFields(rec).auto;
    var delegate = branchDelegateOn(rec);
    var needsBranch = false;
    var needsHr = false;

    if (st === 'Branch' || st === 'branch' || st === '支店長承認中') {
      needsBranch = true;
      needsHr = auto === 'A';
    } else if (st === 'Hr' || st === 'hr' || st === '人事研修部長承認中') {
      needsBranch = true;
      needsHr = true;
    } else if (st === 'Mgr' || st === 'manager' || st === '上司承認中') {
      if (variant === 'eval') {
        needsBranch = delegate || auto === 'A' || auto === 'B';
        needsHr = auto === 'A';
      }
    }

    var idx = 2;
    if (needsBranch) steps.push({ key: 'Branch', label: '支店長承認中', index: idx++ });
    if (needsHr) steps.push({ key: 'Hr', label: '人事研修部長承認中', index: idx++ });
    steps.push({ key: 'Done', label: '完了', index: idx });
    return steps;
  }

  function wfRouteSteps(rec, variant) {
    if (variant === 'eval') return resolveLogicalWfSteps(rec, variant);
    return ui.wfRoute || WF_FALLBACK_ROUTE;
  }

  function wfRouteHtml(rec, variant) {
    var steps = wfRouteSteps(rec, variant);
    var cur = recordStatusKey(rec);
    var curIdx = wfRouteCurrentIndex(steps, cur);
    var parts = steps.map(function (s, i) {
      var isCurrent = i === curIdx;
      var isPast = curIdx >= 0 && i < curIdx;
      var chip = wfStepChipLabel(s.key, rec);
      var unset = chip.indexOf('（未設定）') >= 0;
      var bg = isCurrent ? (variant === 'eval' ? '#92400e' : '#1d4ed8') : (isPast ? '#86efac' : (unset ? '#fef3c7' : '#e2e8f0'));
      var color = isCurrent || isPast ? '#fff' : (unset ? '#b45309' : '#64748b');
      if (unset && !isCurrent && !isPast) {
        bg = '#fef3c7';
        color = '#b45309';
      }
      return '<span style="display:inline-flex;align-items:center;flex-wrap:wrap">' +
        (i > 0 ? '<span style="color:#94a3b8;margin:0 6px">→</span>' : '') +
        '<span title="' + esc(chip) + '" style="padding:4px 10px;border-radius:999px;background:' + bg +
        ';color:' + color + ';font-size:0.85em;font-weight:' + (isCurrent ? '700' : '400') + '">' +
        esc(chip) + '</span></span>';
    }).join('');

    var hint = '';
    var curStep = curIdx >= 0 ? steps[curIdx] : null;
    var nextStep = curIdx >= 0 ? steps[curIdx + 1] : (steps[1] || null);
    if (variant === 'apply') {
      if (!ui.readOnly && nextStep) {
        var nextChip = wfStepChipLabel(nextStep.key, rec);
        hint = '<div style="flex:1 1 100%;margin-top:6px;color:#64748b;font-size:0.82em;line-height:1.4">' +
          '申請ボタンで <strong>' + esc(nextChip) + '</strong> へ進み、kintone 標準メールが送信されます';
        if (nextChip.indexOf('（未設定）') >= 0) {
          hint += ' — <span style="color:#b45309">部署を選ぶと上司が表示されます</span>';
        }
        hint += '</div>';
      } else if (ui.readOnly && curStep) {
        hint = '<div style="flex:1 1 100%;margin-top:6px;color:#64748b;font-size:0.82em">現在: <strong>' +
          esc(wfStepChipLabel(curStep.key, rec)) + '</strong></div>';
      }
    } else if (variant === 'eval' && curStep) {
      var curChip = wfStepChipLabel(curStep.key, rec);
      var auto = effectiveAutoRank(rec);
      hint = '<div style="flex:1 1 100%;margin-top:6px;color:#78716c;font-size:0.82em;line-height:1.4">' +
        '現在の作業: <strong>' + esc(curChip) + '</strong>';
      if (nextStep) {
        hint += ' — 承認後: <strong>' + esc(wfStepChipLabel(nextStep.key, rec)) + '</strong>';
      }
      if (filled(auto) && (auto === 'A' || auto === 'B' || auto === 'C')) {
        hint += ' <span style="color:#92400e">（表彰ランク' + esc(auto) + '）</span>';
      }
      hint += '</div>';
    }

    return '<div data-bi-wf-route style="flex:1 1 220px;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px">' +
      '<span style="color:#475569;font-size:0.85em;margin-right:4px;white-space:nowrap">承認経路</span>' +
      parts + hint + '</div>';
  }

  function getRec() {
    return kintone.app.record.get().record;
  }

  function setRec(rec) {
    ui.syncing = true;
    kintone.app.record.set({ record: rec });
    ui.syncing = false;
  }

  function val(rec, code) {
    if (!rec[code] || rec[code].value == null) return '';
    var v = rec[code].value;
    if (typeof v === 'object') return '';
    return String(v);
  }

  function filled(s) {
    return String(s || '').trim().length > 0;
  }

  function top3Done(rec) {
    return filled(val(rec, F.dept)) && filled(val(rec, F.repName)) && filled(val(rec, F.type));
  }

  function accDone(rec, code) {
    if (ui.cache && ui.cache[code] != null) return filled(ui.cache[code]);
    return filled(val(rec, code));
  }

  function countAccDone(rec) {
    var n = 0;
    ACC.forEach(function (a) { if (accDone(rec, a.code)) n += 1; });
    return n;
  }

  function badgeKind(rec, code, required) {
    if (accDone(rec, code)) return 'done';
    return required ? 'req' : 'opt';
  }

  function attachKind(rec) {
    return getAttachFiles(rec).length ? 'done' : 'opt';
  }

  function getAttachFiles(rec) {
    if (ui.attachFiles && ui.attachFiles.length) return ui.attachFiles;
    var files = rec && rec[F.attach] && rec[F.attach].value;
    return Array.isArray(files) ? files : [];
  }

  function refreshAttachFromRec(rec) {
    var files = rec[F.attach] && rec[F.attach].value;
    var fromRec = Array.isArray(files) ? files : [];
    if (!fromRec.length && ui.attachFiles.length) return;
    ui.attachFiles = fromRec.map(function (f) {
      return {
        fileKey: f.fileKey,
        name: f.name,
        size: f.size,
        contentType: f.contentType,
      };
    });
  }

  function mergeCacheToRec(rec) {
    ACC.forEach(function (a) {
      if (ui.cache[a.code] != null) {
        rec[a.code] = { type: 'MULTI_LINE_TEXT', value: String(ui.cache[a.code]) };
      }
    });
    if (ui.cache.title != null) rec[F.title] = { type: 'SINGLE_LINE_TEXT', value: String(ui.cache.title) };
    if (ui.cache.dept != null) rec[F.dept] = { type: 'DROP_DOWN', value: String(ui.cache.dept) };
    if (ui.cache.repName != null) rec[F.repName] = { type: 'SINGLE_LINE_TEXT', value: String(ui.cache.repName) };
    if (ui.cache.type != null) rec[F.type] = { type: 'DROP_DOWN', value: String(ui.cache.type) };
    if (ui.attachFiles.length) {
      rec[F.attach] = { type: 'FILE', value: ui.attachFiles.slice() };
    }
    return rec;
  }

  function cloneKintoneRec(rec) {
    return JSON.parse(JSON.stringify(rec));
  }

  function resetApplyDraft() {
    ui.applyDraftRec = null;
  }

  function getApplyWorkingRec() {
    if (!ui.applyDraftRec) {
      ui.applyDraftRec = cloneKintoneRec(getRec());
    }
    return mergeCacheToRec(ui.applyDraftRec);
  }

  function syncAttachToRec() {
    if (ui.applyDraftRec) {
      ui.applyDraftRec[F.attach] = { type: 'FILE', value: ui.attachFiles.slice() };
    }
  }

  function pushApplyDraftToForm() {
    syncDomToCache();
    var rec = getApplyWorkingRec();
    setRec(rec);
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function refreshCacheFromRec(rec) {
    ACC.forEach(function (a) { ui.cache[a.code] = val(rec, a.code); });
    ui.cache.title = val(rec, F.title);
    ui.cache.dept = val(rec, F.dept);
    ui.cache.repName = val(rec, F.repName);
    ui.cache.type = val(rec, F.type);
  }

  function syncDomToCache() {
    if (!ui.root) return;
    ui.root.querySelectorAll('[data-bi-field]').forEach(function (ta) {
      ui.cache[ta.getAttribute('data-bi-field')] = ta.value.slice(0, MAX_TEXT);
    });
    var tit = ui.root.querySelector('[data-bi-title]');
    if (tit) ui.cache.title = tit.value;
    var dept = ui.root.querySelector('[data-bi-dept]');
    if (dept) ui.cache.dept = dept.value;
    var rep = ui.root.querySelector('[data-bi-rep]');
    if (rep) ui.cache.repName = rep.value;
    var typ = ui.root.querySelector('[data-bi-type]');
    if (typ) ui.cache.type = typ.value;
  }

  function recFromCache() {
    return getApplyWorkingRec();
  }

  function recForApplyCheck() {
    syncDomToCache();
    return recFromCache();
  }

  function allApplyRequiredDone(rec) {
    var r = rec || recForApplyCheck();
    return top3Done(r) && filled(val(r, F.title)) &&
      ACC.every(function (a) { return accDone(r, a.code); });
  }

  function isReapply(rec) {
    var st = recordStatusKey(rec);
    return st === '申請者修正待ち' || st === 'applicant_fix';
  }

  function applyLabel(rec) {
    return isReapply(rec) ? '再申請する' : '申請する';
  }

  function validateApply(rec) {
    var missing = [];
    if (!filled(val(rec, F.dept))) missing.push('部署');
    if (!filled(val(rec, F.repName))) missing.push('社員名（代表）');
    if (!filled(val(rec, F.type))) missing.push('提案種別');
    if (!filled(val(rec, F.title))) missing.push('提案件名');
    ACC.forEach(function (a) {
      if (!accDone(rec, a.code)) missing.push(a.label);
    });
    return missing;
  }

  function hideNativeProcessActions() {
    var id = 'bi-hide-kintone-process';
    if (document.getElementById(id)) return;
    var st = document.createElement('style');
    st.id = id;
    st.textContent =
      '.gaia-app-statusbar,.gaia-argoui-app-toolbar-statusmenu{display:none!important;}' +
      '.gaia-ui-actionmenu-save,.gaia-ui-actionmenu-cancel,.gaia-ui-actionmenu-remove,' +
      '[data-cy="record-save-button"],[data-cy="record-cancel-button"]{display:none!important;}';
    document.head.appendChild(st);
  }

  function closeBiModal() {
    var m = document.getElementById('bi-modal');
    if (m) m.remove();
  }

  function openBiModal(title, bodyHtml, buttons) {
    closeBiModal();
    var wrap = document.createElement('div');
    wrap.id = 'bi-modal';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:12px;max-width:480px;width:100%;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,.2)">' +
      '<h3 style="margin:0 0 12px;color:#1e3a8a">' + esc(title) + '</h3>' +
      '<div style="margin-bottom:16px;line-height:1.6">' + bodyHtml + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">' + buttons + '</div></div>';
    document.body.appendChild(wrap);
    wrap.onclick = function (e) { if (e.target === wrap) closeBiModal(); };
    return wrap;
  }

  function hasAttachments(rec) {
    return getAttachFiles(rec).length > 0;
  }

  function fetchSettingsRow(dept) {
    if (!dept) return kintone.Promise.resolve(null);
    var q = 'record_kind in ("所属行") and dept_name = "' + escQ(dept) + '" limit 1';
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.settingsAppId,
      query: q,
      fields: ['manager_login', 'branch_manager_login', 'dept_name', 'applicant_login'],
    }).then(function (res) { return (res.records && res.records[0]) || null; });
  }

  function fetchSettingsByApplicant(login) {
    if (!login) return kintone.Promise.resolve(null);
    var q = 'record_kind in ("所属行") and applicant_login = "' + escQ(login) + '" limit 1';
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.settingsAppId,
      query: q,
      fields: ['manager_login', 'branch_manager_login', 'dept_name', 'applicant_login'],
    }).then(function (res) { return (res.records && res.records[0]) || null; });
  }

  function resolveSettingsForApply(rec) {
    var login = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';
    return fetchSettingsByApplicant(login).then(function (row) {
      if (row) return row;
      return fetchSettingsRow(val(rec, F.dept));
    });
  }

  function fetchHrLoginApply() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.settingsAppId,
      query: 'record_kind in ("共通設定") limit 1',
      fields: ['hr_director_login'],
    }).then(function (res) {
      var r = res.records && res.records[0];
      return r && r.hr_director_login ? r.hr_director_login.value : 'jinji';
    });
  }

  function userSelect(code) {
    return code ? { type: 'USER_SELECT', value: [{ code: String(code) }] } : { type: 'USER_SELECT', value: [] };
  }

  function prepareRecordForApply(rec) {
    return resolveSettingsForApply(rec).then(function (row) {
      return fetchHrLoginApply().then(function (hrLogin) {
        if (!val(rec, F.date)) {
          rec[F.date] = { type: 'DATE', value: todayISO() };
        }
        var ml = row && row.manager_login ? row.manager_login.value : '';
        var bl = row && row.branch_manager_login ? row.branch_manager_login.value : '';
        rec['部長評価者'] = userSelect(ml);
        rec['支店長評価者'] = userSelect(bl);
        rec['人事部長評価者'] = userSelect(hrLogin);
        var login = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';
        if (login) rec['申請者'] = userSelect(login);
        return rec;
      });
    });
  }

  function uploadFileToKintone(file) {
    return new kintone.Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', kintone.api.url('/k/v1/file.json', true));
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (e) { reject(new Error('アップロード応答の解析に失敗しました')); }
          return;
        }
        try {
          var json = JSON.parse(xhr.responseText);
          reject(new Error(json.message || ('HTTP ' + xhr.status)));
        } catch (e2) {
          reject(new Error('HTTP ' + xhr.status));
        }
      };
      xhr.onerror = function () { reject(new Error('ネットワークエラー')); };
      var formData = new FormData();
      formData.append('__REQUEST_TOKEN__', kintone.getRequestToken());
      formData.append('file', file, file.name);
      xhr.send(formData);
    });
  }

  function addAttachmentFile(file) {
    return uploadFileToKintone(file).then(function (res) {
      ui.attachFiles.push({
        fileKey: res.fileKey,
        name: file.name,
        size: String(file.size),
        contentType: file.type || 'application/octet-stream',
      });
      syncAttachToRec();
    });
  }

  function removeAttachmentFile(index) {
    if (index < 0 || index >= ui.attachFiles.length) return;
    ui.attachFiles.splice(index, 1);
    syncAttachToRec();
    ui.open.attach = true;
    updateAttachUi();
  }

  function attachFileListHtml(files) {
    if (!files.length) return '<li style="color:#64748b">なし</li>';
    return files.map(function (f, idx) {
      return '<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span>' + esc(f.name || 'file') + '</span>' +
        (ui.readOnly ? '' : '<button type="button" data-bi-file-del="' + idx + '" style="padding:4px 8px;border:0;background:#fee2e2;color:#b91c1c;border-radius:6px;cursor:pointer">削除</button>') + '</li>';
    }).join('');
  }

  function bindAttachDeleteButtons() {
    if (!ui.root) return;
    ui.root.querySelectorAll('[data-bi-file-del]').forEach(function (btn) {
      btn.onclick = function () {
        removeAttachmentFile(Number(btn.getAttribute('data-bi-file-del')));
      };
    });
  }

  function updateAttachUi() {
    if (!ui.root) return;
    var files = getAttachFiles();
    var listEl = ui.root.querySelector('[data-bi-file-list]');
    if (listEl) listEl.innerHTML = attachFileListHtml(files);
    var toggleAttach = ui.root.querySelector('[data-bi-toggle-attach]');
    if (toggleAttach) {
      var labelSpan = toggleAttach.querySelector('span');
      if (labelSpan) {
        labelSpan.innerHTML = '<strong>添付ファイル</strong> ' + badgeHtml(attachKind());
      }
    }
    bindAttachDeleteButtons();
  }

  function installBiUnloadGuard() {
    if (window.__biUnloadGuardOn) return;
    window.__biUnloadGuardOn = true;
    window.addEventListener('beforeunload', function (e) {
      if (ui.allowNavigate || evUi.allowNavigate) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    }, true);
  }

  function resolveAppBasePath(appId) {
    var path = location.pathname;
    var guestMatch = path.match(/^(\/k\/guest\/\d+)\/\d+/);
    if (guestMatch) return guestMatch[1] + '/' + appId;
    if (/^\/k\/\d+/.test(path)) return '/k/' + appId;
    return '/k/' + appId;
  }

  function guideIndexUrl() {
    return resolveAppBasePath(BI.guideAppId) + '/';
  }

  function armNavigateAway() {
    ui.allowNavigate = true;
    evUi.allowNavigate = true;
    window.onbeforeunload = null;
  }

  function navigateAwaySafe(url) {
    armNavigateAway();
    var target = url;
    if (target.charAt(0) === '/') target = location.origin + target;
    setTimeout(function () {
      try {
        (window.top || window).location.assign(target);
      } catch (e) {
        location.href = target;
      }
    }, 50);
  }

  function clickKintoneSave() {
    pushApplyDraftToForm();
    var btn = document.querySelector('.gaia-ui-actionmenu-save') ||
      document.querySelector('[data-cy="record-save-button"]');
    if (btn) btn.click();
    else alert('保存ボタンが見つかりません。画面上部の保存を押してください。');
  }

  function resolveWfActionAssignee(action, rec) {
    if (action === WF_ACTION_APPLY || action === WF_ACTION_REAPPLY) {
      return wfPersonFromField(rec, '部長評価者') || (ui.wfPeople && ui.wfPeople.mgr) || '';
    }
    return '';
  }

  function runWorkflowAction(recordId, action, assignee) {
    var body = {
      app: kintone.app.getId(),
      id: String(recordId),
      action: action,
    };
    if (assignee) body.assignee = String(assignee);
    return kintone.api(kintone.api.url('/k/v1/record/status.json', true), 'PUT', body);
  }

  function afterApplySuccess(recordId) {
    try { sessionStorage.setItem('bi-apply-done', '1'); } catch (e) { /* noop */ }
    navigateAwaySafe(guideIndexUrl());
  }

  function applyRecordPayload(rec) {
    var payload = {};
    var codes = [
      F.dept, F.repName, F.type, F.title, F.date, F.purpose, F.current, F.problem, F.plan, F.effect,
      F.proposers, F.attach,
      '申請者', '部長評価者', '支店長評価者', '人事部長評価者',
    ];
    codes.forEach(function (code) {
      if (rec[code] != null && rec[code].value !== undefined) {
        payload[code] = { value: rec[code].value };
      }
    });
    return payload;
  }

  function saveApplyRecordViaApi(rec) {
    var app = kintone.app.getId();
    var recordId = kintone.app.record.getId();
    var payload = applyRecordPayload(rec);
    if (recordId) {
      return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
        app: app,
        id: String(recordId),
        record: payload,
      }).then(function () { return String(recordId); });
    }
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
      app: app,
      record: payload,
    }).then(function (res) { return String(res.id); });
  }

  function startApplySave() {
    syncDomToCache();
    var rec = recForApplyCheck();
    var missing = validateApply(rec);
    if (missing.length) {
      alert('未入力の必須項目があります:\n' + missing.join('、'));
      var first = ACC.find(function (a) { return !accDone(rec, a.code); });
      if (first) expandAcc(first.code);
      return;
    }
    armNavigateAway();
    var reapply = isReapply(rec);
    prepareRecordForApply(rec).then(function (prepared) {
      mergeCacheToRec(prepared);
      prepared = syncRepToRow1(ensureProposers(prepared));
      return resolveWfPeople(prepared).then(function (people) {
        if (!people.mgr) {
          alert('部長評価者が特定できません。\n部署の選択、または設定マスタ(697)の所属行を確認してください。');
          return;
        }
        if (people.mgr) prepared['部長評価者'] = userSelect(people.mgr);
        if (people.branch) prepared['支店長評価者'] = userSelect(people.branch);
        if (people.hr) prepared['人事部長評価者'] = userSelect(people.hr);
        if (people.applicant) prepared['申請者'] = userSelect(people.applicant);
        var action = reapply ? WF_ACTION_REAPPLY : WF_ACTION_APPLY;
        var assignee = people.mgr || wfPersonFromField(prepared, '部長評価者');
        if (!assignee) {
          alert('申請処理に失敗しました。部長評価者が未設定です。');
          return;
        }
        return saveApplyRecordViaApi(prepared).then(function (recordId) {
          return runWorkflowAction(recordId, action, assignee).then(function () {
            afterApplySuccess(recordId);
          });
        });
      });
    }).catch(function (err) {
      alert('申請処理に失敗しました。\n' + ((err && err.message) || String(err)));
    });
  }

  function promptApply() {
    var rec = recForApplyCheck();
    var missing = validateApply(rec);
    if (missing.length) {
      alert('未入力の必須項目があります:\n' + missing.join('、'));
      return;
    }
    if (!hasAttachments(rec)) {
      var wrap = openBiModal(
        '添付ファイル',
        '<p style="margin:0">添付ファイルがありません。添付なしで申請しますか？</p>',
        '<button type="button" id="bi-att-skip" style="padding:8px 14px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">そのまま申請</button>' +
        '<button type="button" id="bi-att-add" style="padding:8px 14px;border:1px solid #2563eb;background:#eff6ff;color:#1d4ed8;border-radius:8px;cursor:pointer">添付ファイルを添付する</button>' +
        '<button type="button" id="bi-att-cancel" style="padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">キャンセル</button>'
      );
      wrap.querySelector('#bi-att-skip').onclick = function () {
        closeBiModal();
        confirmApplyModal();
      };
      wrap.querySelector('#bi-att-add').onclick = function () {
        closeBiModal();
        ui.open.attach = true;
        render();
        setTimeout(function () {
          var inp = ui.root && ui.root.querySelector('[data-bi-file-input]');
          if (inp) inp.click();
        }, 100);
      };
      wrap.querySelector('#bi-att-cancel').onclick = closeBiModal;
      return;
    }
    confirmApplyModal();
  }

  function confirmApplyModal() {
    var rec = getApplyWorkingRec();
    var msg = isReapply(rec)
      ? '再申請しますか？修正内容を部長評価に送ります。'
      : '申請しますか？';
    var wrap = openBiModal(
      isReapply(rec) ? '再申請の確認' : '申請の確認',
      '<p style="margin:0">' + esc(msg) + '</p>',
      '<button type="button" id="bi-apply-yes" style="padding:8px 14px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">はい</button>' +
      '<button type="button" id="bi-apply-no" style="padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">キャンセル</button>'
    );
    wrap.querySelector('#bi-apply-yes').onclick = function () {
      closeBiModal();
      startApplySave();
    };
    wrap.querySelector('#bi-apply-no').onclick = closeBiModal;
  }

  function accActionButtons(a, rec) {
    var nextBtn = '<button type="button" data-bi-next="' + esc(a.code) + '" style="padding:8px 14px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">次の項目へ</button>';
    if (a.code === F.effect && allApplyRequiredDone(rec)) {
      return nextBtn +
        '<button type="button" data-bi-apply style="padding:8px 14px;background:#15803d;color:#fff;border:0;border-radius:8px;cursor:pointer;margin-left:8px">' +
        esc(applyLabel(rec)) + '</button>';
    }
    return nextBtn;
  }

  function badgeHtml(kind) {
    var map = {
      done: { bg: '#dcfce7', fg: '#166534', t: '入力済' },
      req: { bg: '#ffedd5', fg: '#c2410c', t: '未入力' },
      opt: { bg: '#f1f5f9', fg: '#64748b', t: '任意' },
    };
    var s = map[kind] || map.opt;
    return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.85em;background:' +
      s.bg + ';color:' + s.fg + '">' + s.t + '</span>';
  }

  function ensureProposers(rec) {
    if (!rec[F.proposers]) rec[F.proposers] = { type: 'SUBTABLE', value: [] };
    if (!rec[F.proposers].value.length) {
      rec[F.proposers].value.push({
        value: {
          [F.propDept]: { type: 'SINGLE_LINE_TEXT', value: '' },
          [F.propName]: { type: 'SINGLE_LINE_TEXT', value: '' },
        },
      });
    }
    return rec;
  }

  function syncRepToRow1(rec) {
    rec = ensureProposers(rec);
    var row = rec[F.proposers].value[0];
    if (!row.value) row.value = {};
    row.value[F.propDept] = { type: 'SINGLE_LINE_TEXT', value: val(rec, F.dept) };
    row.value[F.propName] = { type: 'SINGLE_LINE_TEXT', value: val(rec, F.repName) };
    return rec;
  }

  function syncRow1ToRep(rec) {
    rec = ensureProposers(rec);
    var row = rec[F.proposers].value[0];
    if (row && row.value) {
      rec[F.dept] = { type: 'DROP_DOWN', value: (row.value[F.propDept] && row.value[F.propDept].value) || '' };
      rec[F.repName] = { type: 'SINGLE_LINE_TEXT', value: (row.value[F.propName] && row.value[F.propName].value) || '' };
    }
    return rec;
  }

  function fetchDepts() {
    if (ui.depts.length) return kintone.Promise.resolve(ui.depts);
    return kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', { app: kintone.app.getId() })
      .then(function (res) {
        var p = res.properties && res.properties[F.dept];
        ui.depts = p && p.options ? Object.keys(p.options).sort(function (a, b) {
          return Number(p.options[a].index) - Number(p.options[b].index);
        }) : [];
        return ui.depts;
      })
      .catch(function () { ui.depts = []; return ui.depts; });
  }

  function searchEmployees(term) {
    var q = 'employment_status in ("在籍") and user_name like "' + escQ(term) +
      '" order by user_name asc limit 50';
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.employeeAppId,
      query: q,
      fields: ['user_name', 'dept_name'],
    });
  }

  function pickEmployee(emp) {
    var rec = getApplyWorkingRec();
    var name = (emp.user_name && emp.user_name.value) || '';
    var dept = (emp.dept_name && emp.dept_name.value) || '';
    if (ui.searchTarget === 0) {
      ui.cache.repName = name;
      ui.cache.dept = dept;
      rec[F.repName] = { type: 'SINGLE_LINE_TEXT', value: name };
      rec[F.dept] = { type: 'DROP_DOWN', value: dept };
      rec = syncRepToRow1(rec);
    } else {
      rec = ensureProposers(rec);
      while (rec[F.proposers].value.length <= ui.searchTarget) {
        rec[F.proposers].value.push({
          value: {
            [F.propDept]: { type: 'SINGLE_LINE_TEXT', value: '' },
            [F.propName]: { type: 'SINGLE_LINE_TEXT', value: '' },
          },
        });
      }
      var row = rec[F.proposers].value[ui.searchTarget];
      row.value[F.propName] = { type: 'SINGLE_LINE_TEXT', value: name };
      row.value[F.propDept] = { type: 'SINGLE_LINE_TEXT', value: dept };
    }
    closeModal();
    render();
    maybeAutoExpand(rec);
  }

  function closeModal() {
    var m = document.getElementById('bi-emp-modal');
    if (m) m.remove();
  }

  function openSearchModal(target) {
    ui.searchTarget = target;
    closeModal();
    var wrap = document.createElement('div');
    wrap.id = 'bi-emp-modal';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:12px;max-width:520px;width:100%;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,.2)">' +
      '<h3 style="margin:0 0 12px">社員検索（在籍）</h3>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px"><input id="bi-emp-q" type="text" placeholder="氏名の一部" style="flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px">' +
      '<button type="button" id="bi-emp-go" style="padding:8px 14px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">検索</button></div>' +
      '<ul id="bi-emp-list" style="list-style:none;margin:0;padding:0;max-height:280px;overflow:auto"></ul>' +
      '<button type="button" id="bi-emp-close" style="margin-top:12px;padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">閉じる</button></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('#bi-emp-close').onclick = closeModal;
    wrap.onclick = function (e) { if (e.target === wrap) closeModal(); };
    var run = function () {
      var term = wrap.querySelector('#bi-emp-q').value.trim();
      var list = wrap.querySelector('#bi-emp-list');
      if (!term) { list.innerHTML = '<li style="padding:8px;color:#64748b">検索語を入力してください</li>'; return; }
      list.innerHTML = '<li style="padding:8px;color:#64748b">検索中…</li>';
      searchEmployees(term).then(function (res) {
        var rows = res.records || [];
        if (!rows.length) {
          list.innerHTML = '<li style="padding:8px;color:#64748b">該当なし</li>';
          return;
        }
        list.innerHTML = rows.map(function (r, i) {
          var n = (r.user_name && r.user_name.value) || '';
          var d = (r.dept_name && r.dept_name.value) || '';
          return '<li><button type="button" data-bi-pick="' + i + '" style="width:100%;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid #e2e8f0;background:#fff;cursor:pointer">' +
            esc(n) + ' <span style="color:#64748b">(' + esc(d) + ')</span></button></li>';
        }).join('');
        list.querySelectorAll('[data-bi-pick]').forEach(function (btn) {
          btn.onclick = function () { pickEmployee(rows[Number(btn.getAttribute('data-bi-pick'))]); };
        });
      }).catch(function () {
        list.innerHTML = '<li style="padding:8px;color:#b91c1c">検索に失敗しました</li>';
      });
    };
    wrap.querySelector('#bi-emp-go').onclick = run;
    wrap.querySelector('#bi-emp-q').onkeydown = function (e) { if (e.key === 'Enter') run(); };
  }

  function focusField(sel) {
    var el = ui.root && ui.root.querySelector(sel);
    if (!el) return;
    scrollToEl(el);
    setTimeout(function () { el.focus(); }, 120);
  }

  function openPurposeAndFocus() {
    if (ui.open[F.purpose]) {
      focusField('[data-bi-field="' + F.purpose + '"]');
      return;
    }
    ui.open[F.purpose] = true;
    render();
    setTimeout(function () { focusField('[data-bi-field="' + F.purpose + '"]'); }, 80);
  }

  function scrollToEl(el) {
    if (!el) return;
    setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }

  function expandAcc(code) {
    ui.open[code] = true;
    render();
    scrollToEl(ui.root && ui.root.querySelector('[data-bi-acc="' + code + '"]'));
  }

  function nextAcc(code) {
    var i = -1;
    ACC.forEach(function (a, idx) { if (a.code === code) i = idx; });
    if (i >= 0 && i < ACC.length - 1) expandAcc(ACC[i + 1].code);
  }

  function maybeAutoExpand(rec) {
    /* 提案種別→提案件名→目的 は bindUi のフォーカス遷移で誘導 */
  }

  function tryAdvance(code) {
    setTimeout(function () {
      if (!ui.root) return;
      var rec = recForApplyCheck();
      if (!accDone(rec, code)) {
        var warn = ui.root.querySelector('[data-bi-warn="' + code + '"]');
        if (warn) warn.style.display = 'block';
        return;
      }
      nextAcc(code);
    }, 0);
  }

  function footerActionsHtml(rec) {
    if (ui.readOnly) {
      return '<a href="' + esc(guideIndexUrl()) + '" style="padding:10px 18px;border:1px solid #64748b;background:#fff;color:#334155;border-radius:8px;text-decoration:none">ガイドに戻る</a>';
    }
    var r = rec || recForApplyCheck();
    var missing = validateApply(r);
    return '<button type="button" data-bi-draft-save style="padding:10px 18px;border:1px solid #64748b;background:#fff;color:#334155;border-radius:8px;cursor:pointer">一時保存</button>' +
      (missing.length === 0
        ? '<button type="button" data-bi-apply-footer style="padding:10px 18px;background:#15803d;color:#fff;border:0;border-radius:8px;cursor:pointer">' + esc(applyLabel(r)) + '</button>'
        : '<span style="color:#64748b;font-size:0.9em">申請には未入力: ' + esc(missing.join('、')) + '</span>');
  }

  function bindApplyActions(scope) {
    var root = scope || ui.root;
    if (!root) return;
    root.querySelectorAll('[data-bi-apply]').forEach(function (btn) {
      btn.onclick = function () { promptApply(); };
    });
    var applyFooter = root.querySelector('[data-bi-apply-footer]');
    if (applyFooter) applyFooter.onclick = function () { promptApply(); };
    var draftBtn = root.querySelector('[data-bi-draft-save]');
    if (draftBtn) draftBtn.onclick = function () { clickKintoneSave(); };
  }

  function updateAccBadges(rec) {
    if (!ui.root) return;
    ACC.forEach(function (a) {
      var toggle = ui.root.querySelector('[data-bi-toggle="' + a.code + '"]');
      if (!toggle) return;
      var labelSpan = toggle.querySelector('span');
      if (labelSpan) {
        labelSpan.innerHTML = '<strong>' + esc(a.label) + '</strong> ' + badgeHtml(badgeKind(rec, a.code, true));
      }
    });
  }

  function updateApplyUi(rec) {
    if (!ui.root) return;
    rec = recForApplyCheck();
    refreshWfRouteDisplay(rec, 'apply');
    var btnWrap = ui.root.querySelector('[data-bi-footer-buttons]');
    if (btnWrap) {
      btnWrap.innerHTML = footerActionsHtml(rec);
      bindApplyActions(ui.root.querySelector('[data-bi-footer-actions]') || btnWrap);
    }
    var effActions = ui.root.querySelector('[data-bi-acc-actions="' + F.effect + '"]');
    if (effActions) {
      effActions.innerHTML = accActionButtons({ code: F.effect, label: '効果' }, rec);
      bindApplyActions(effActions);
      ui.root.querySelectorAll('[data-bi-acc-actions="' + F.effect + '"] [data-bi-next]').forEach(function (btn) {
        btn.onclick = function () { tryAdvance(btn.getAttribute('data-bi-next')); };
      });
    }
    updateAccBadges(rec);
  }

  function roAttr() {
    return ui.readOnly ? ' disabled readonly' : '';
  }

  function render(recOptional) {
    if (!ui.root || ui.rendering) return;
    ui.rendering = true;
    try {
    if (!ui.readOnly && !ui.applyDraftRec) refreshCacheFromRec(getRec());
    else if (ui.readOnly) refreshCacheFromRec(recOptional || getRec());
    var rec = ui.readOnly ? ensureProposers(recOptional || getRec()) : ensureProposers(getApplyWorkingRec());
    var done = ACC.filter(function (a) { return filled(ui.cache[a.code]); }).length;
    var deptOpts = ui.depts.map(function (d) {
      return '<option value="' + esc(d) + '"' + (val(rec, F.dept) === d ? ' selected' : '') + '>' + esc(d) + '</option>';
    }).join('');
    var typeOpts = TYPE_OPTS.map(function (t) {
      return '<option value="' + esc(t) + '"' + (val(rec, F.type) === t ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');

    var propRows = rec[F.proposers].value.map(function (row, idx) {
      var rd = (row.value[F.propDept] && row.value[F.propDept].value) || '';
      var rn = (row.value[F.propName] && row.value[F.propName].value) || '';
      return '<tr><td><input data-bi-pdept="' + idx + '" value="' + esc(rd) + '" style="width:100%;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px"' + roAttr() + '></td>' +
        '<td><div style="display:flex;gap:6px"><input data-bi-pname="' + idx + '" value="' + esc(rn) + '" style="flex:1;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px"' + roAttr() + '>' +
        (ui.readOnly ? '' : '<button type="button" data-bi-psearch="' + idx + '" style="padding:6px 10px;border:1px solid #93c5fd;background:#eff6ff;border-radius:6px;cursor:pointer">検索</button>') + '</div></td>' +
        '<td>' + (!ui.readOnly && idx > 0 ? '<button type="button" data-bi-pdel="' + idx + '" style="padding:4px 8px;border:0;background:#fee2e2;color:#b91c1c;border-radius:6px;cursor:pointer">削除</button>' : '') + '</td></tr>';
    }).join('');

    var accHtml = ACC.map(function (a) {
      var open = !!ui.open[a.code];
      var v = ui.cache[a.code] != null ? String(ui.cache[a.code]) : val(rec, a.code);
      return '<div data-bi-acc="' + a.code + '" style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:10px;overflow:hidden">' +
        '<button type="button" data-bi-toggle="' + a.code + '" style="width:100%;text-align:left;padding:12px 14px;border:0;background:#f8fafc;cursor:pointer;display:flex;justify-content:space-between;align-items:center">' +
        '<span><strong>' + esc(a.label) + '</strong> ' + badgeHtml(badgeKind(rec, a.code, true)) + '</span>' +
        '<span>' + (open ? '▲' : '▼') + '</span></button>' +
        (open ? '<div style="padding:12px 14px">' +
          '<textarea data-bi-field="' + a.code + '" maxlength="' + MAX_TEXT + '" rows="4" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical"' + roAttr() + '>' + esc(v) + '</textarea>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
          '<span style="color:#64748b;font-size:0.9em">' + v.length + '/' + MAX_TEXT + '</span>' +
          (ui.readOnly ? '' : '<div data-bi-acc-actions="' + esc(a.code) + '" style="display:flex;flex-wrap:wrap;gap:8px">' + accActionButtons(a, rec) + '</div>') + '</div>' +
          '<p data-bi-warn="' + a.code + '" style="display:none;margin:8px 0 0;color:#c2410c;font-size:0.9em">' + esc(a.label) + 'を入力してください</p></div>' : '') +
        '</div>';
    }).join('');

    var files = getAttachFiles(rec);
    var fileList = attachFileListHtml(files);

    ui.root.style.fontSize = fontPx();
    ui.root.innerHTML =
      '<div style="font-family:\'Segoe UI\',Meiryo,sans-serif;line-height:1.5;padding:16px 18px 28px;background:linear-gradient(180deg,#eff6ff 0%,#f8fafc 100%);border-radius:12px;border:1px solid #bfdbfe">' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px">' +
      '<h2 style="margin:0;color:#1e3a8a;font-size:1.2em">業務改善提案 — ' + (ui.readOnly ? '提案書（閲覧）' : '申請') + '</h2>' +
      '<div><span style="margin-right:6px">文字サイズ：</span>' +
      '<button type="button" data-bi-font="standard" style="padding:5px 10px;margin-right:4px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;background:' +
      (fontPx() === '16px' ? '#dbeafe' : '#fff') + '">標準</button>' +
      '<button type="button" data-bi-font="large" style="padding:5px 10px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;background:' +
      (fontPx() === '18px' ? '#dbeafe' : '#fff') + '">大</button></div></div>' +
      '<div data-bi-summary style="background:#fff;border:1px solid #93c5fd;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
      '<strong style="color:#1d4ed8">入力 ' + done + '/5</strong>' +
      ACC.filter(function (a) { return !filled(ui.cache[a.code]); }).map(function (a) {
        return '<span style="padding:4px 10px;background:#ffedd5;color:#c2410c;border-radius:999px;font-size:0.85em">' + esc(a.label) + '</span>';
      }).join('') + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">' +
      '<label>部署<br><select data-bi-dept style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px"' + roAttr() + '><option value=""></option>' + deptOpts + '</select></label>' +
      '<label>社員名（代表）<br><div style="display:flex;gap:6px"><input data-bi-rep type="text" value="' + esc(val(rec, F.repName)) + '" style="flex:1;padding:8px;border:1px solid #cbd5e1;border-radius:8px"' + roAttr() + '>' +
      (ui.readOnly ? '' : '<button type="button" data-bi-rep-search style="padding:8px 12px;border:1px solid #93c5fd;background:#eff6ff;border-radius:8px;cursor:pointer">検索</button>') + '</div></label>' +
      '<label>提案種別<br><select data-bi-type style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px"' + roAttr() + '><option value=""></option>' + typeOpts + '</select></label></div>' +
      '<label style="display:block;margin-bottom:12px">提案件名<br><input data-bi-title type="text" value="' + esc(val(rec, F.title)) + '" style="' + INPUT_FULL + '"' + roAttr() + '></label>' +
      '<div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>提案者一覧</strong>' +
      (ui.readOnly ? '' : '<button type="button" data-bi-add-row style="padding:6px 12px;border:1px solid #93c5fd;background:#eff6ff;border-radius:8px;cursor:pointer">行を追加</button>') + '</div>' +
      '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left">所属</th><th style="padding:8px;text-align:left">社員名</th><th></th></tr></thead><tbody>' + propRows + '</tbody></table></div>' +
      accHtml +
      '<div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:10px">' +
      '<button type="button" data-bi-toggle-attach style="width:100%;text-align:left;padding:12px 14px;border:0;background:#f8fafc;cursor:pointer;display:flex;justify-content:space-between">' +
      '<span><strong>添付ファイル</strong> ' + badgeHtml(attachKind(rec)) + '</span><span>' + (ui.open.attach ? '▲' : '▼') + '</span></button>' +
      (ui.open.attach ? '<div style="padding:12px 14px"><ul data-bi-file-list style="margin:0 0 8px;padding-left:18px">' + fileList + '</ul>' +
      (ui.readOnly ? '' : '<input type="file" data-bi-file-input style="display:none" multiple>' +
      '<button type="button" data-bi-pick-file style="padding:8px 14px;border:1px solid #93c5fd;background:#eff6ff;border-radius:8px;cursor:pointer">ファイルを選択</button>' +
      '<p style="margin:8px 0 0;color:#64748b;font-size:0.9em">添付は任意です。申請時に未添付の場合は確認ダイアログが表示されます。</p>') + '</div>' : '') + '</div>' +
      '<div data-bi-footer-actions style="margin-top:14px;padding:14px;background:#fff;border:1px solid #93c5fd;border-radius:10px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between">' +
      '<div data-bi-wf-route-wrap style="flex:1 1 280px;min-width:0">' + wfRouteHtml(rec, 'apply') + '</div>' +
      '<div data-bi-footer-buttons style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:flex-end;flex:0 0 auto">' +
      footerActionsHtml(rec) +
      '</div></div>' +
      '<p style="margin:12px 0 0;color:#94a3b8;font-size:0.8em">BUILD ' + esc(BUILD) + '</p></div>';

    bindUi();
    maybeAutoExpand(rec);
    } finally {
      ui.rendering = false;
    }
  }

  function updateSummary() {
    if (!ui.root) return;
    syncDomToCache();
    var rec = recForApplyCheck();
    var bar = ui.root.querySelector('[data-bi-summary]');
    if (!bar) return;
    var done = ACC.filter(function (a) { return filled(ui.cache[a.code]); }).length;
    var chips = ACC.filter(function (a) { return !filled(ui.cache[a.code]); }).map(function (a) {
      return '<span style="padding:4px 10px;background:#ffedd5;color:#c2410c;border-radius:999px;font-size:0.85em">' + esc(a.label) + '</span>';
    }).join('');
    bar.innerHTML = '<strong style="color:#1d4ed8">入力 ' + done + '/5</strong>' + chips;
    updateApplyUi(rec);
    maybeAutoExpand(rec);
  }

  function patchRec(mutator, fullRender) {
    if (ui.syncing) return;
    var rec = getApplyWorkingRec();
    mutator(rec);
    if (fullRender) render();
    else updateSummary();
  }

  function bindUi() {
    if (!ui.root) return;
    ui.root.querySelectorAll('[data-bi-font]').forEach(function (btn) {
      btn.onclick = function () {
        localStorage.setItem(FONT_KEY, btn.getAttribute('data-bi-font'));
        render();
      };
    });
    ui.root.querySelectorAll('[data-bi-toggle]').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute('data-bi-toggle');
        ui.open[code] = !ui.open[code];
        render();
      };
    });
    var attT = ui.root.querySelector('[data-bi-toggle-attach]');
    if (attT) attT.onclick = function () { ui.open.attach = !ui.open.attach; render(); };
    if (ui.readOnly) return;
    var dept = ui.root.querySelector('[data-bi-dept]');
    if (dept) dept.onchange = function () {
      ui.cache.dept = dept.value;
      patchRec(function (r) {
        r[F.dept] = { type: 'DROP_DOWN', value: dept.value };
        syncRepToRow1(r);
      }, false);
    };
    var rep = ui.root.querySelector('[data-bi-rep]');
    if (rep) {
      rep.oninput = function () {
        ui.cache.repName = rep.value;
        patchRec(function (r) { r[F.repName] = { type: 'SINGLE_LINE_TEXT', value: rep.value }; syncRepToRow1(r); }, false);
      };
    }
    var repS = ui.root.querySelector('[data-bi-rep-search]');
    if (repS) repS.onclick = function () { openSearchModal(0); };
    var typ = ui.root.querySelector('[data-bi-type]');
    if (typ) typ.onchange = function () {
      ui.cache.type = typ.value;
      patchRec(function (r) { r[F.type] = { type: 'DROP_DOWN', value: typ.value }; }, false);
      if (filled(typ.value)) focusField('[data-bi-title]');
    };
    var tit = ui.root.querySelector('[data-bi-title]');
    if (tit) {
      tit.oninput = function () {
        ui.cache.title = tit.value;
        patchRec(function (r) { r[F.title] = { type: 'SINGLE_LINE_TEXT', value: tit.value }; }, false);
      };
      tit.onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filled(tit.value)) openPurposeAndFocus();
        }
      };
      tit.onblur = function () {
        if (!filled(tit.value)) return;
        setTimeout(function () {
          if (!ui.root) return;
          var ae = document.activeElement;
          if (ae && ui.root.contains(ae) && ae.getAttribute('data-bi-field') === F.purpose) return;
          if (!filled(ui.cache[F.purpose])) openPurposeAndFocus();
        }, 150);
      };
    }

    ui.root.querySelectorAll('[data-bi-pdept]').forEach(function (el) {
      el.oninput = function () {
        var idx = Number(el.getAttribute('data-bi-pdept'));
        patchRec(function (r) {
          r = ensureProposers(r);
          r[F.proposers].value[idx].value[F.propDept] = { type: 'SINGLE_LINE_TEXT', value: el.value };
          if (idx === 0) syncRow1ToRep(r);
        });
      };
    });
    ui.root.querySelectorAll('[data-bi-pname]').forEach(function (el) {
      el.oninput = function () {
        var idx = Number(el.getAttribute('data-bi-pname'));
        patchRec(function (r) {
          r = ensureProposers(r);
          r[F.proposers].value[idx].value[F.propName] = { type: 'SINGLE_LINE_TEXT', value: el.value };
          if (idx === 0) syncRow1ToRep(r);
        });
      };
    });
    ui.root.querySelectorAll('[data-bi-psearch]').forEach(function (btn) {
      btn.onclick = function () { openSearchModal(Number(btn.getAttribute('data-bi-psearch'))); };
    });
    ui.root.querySelectorAll('[data-bi-pdel]').forEach(function (btn) {
      btn.onclick = function () {
        var idx = Number(btn.getAttribute('data-bi-pdel'));
        patchRec(function (r) {
          r = ensureProposers(r);
          r[F.proposers].value.splice(idx, 1);
        });
      };
    });
    var add = ui.root.querySelector('[data-bi-add-row]');
    if (add) add.onclick = function () {
      patchRec(function (r) {
        r = ensureProposers(r);
        r[F.proposers].value.push({
          value: {
            [F.propDept]: { type: 'SINGLE_LINE_TEXT', value: '' },
            [F.propName]: { type: 'SINGLE_LINE_TEXT', value: '' },
          },
        });
      });
    };

    ui.root.querySelectorAll('[data-bi-field]').forEach(function (ta) {
      var code = ta.getAttribute('data-bi-field');
      ta.oninput = function () {
        var v = ta.value.slice(0, MAX_TEXT);
        ui.cache[code] = v;
        var len = v.length;
        var counter = ta.parentElement && ta.parentElement.querySelector('span');
        if (counter) counter.textContent = len + '/' + MAX_TEXT;
        patchRec(function (r) {
          r[code] = { type: 'MULTI_LINE_TEXT', value: v };
        }, false);
      };
      ta.onblur = function () {
        var v = ta.value.slice(0, MAX_TEXT);
        ui.cache[code] = v;
        patchRec(function (r) {
          r[code] = { type: 'MULTI_LINE_TEXT', value: v };
        }, false);
        tryAdvance(code);
      };
    });
    ui.root.querySelectorAll('[data-bi-next]').forEach(function (btn) {
      btn.onclick = function () { tryAdvance(btn.getAttribute('data-bi-next')); };
    });
    bindApplyActions(ui.root);
    var pickFile = ui.root.querySelector('[data-bi-pick-file]');
    var fileInput = ui.root.querySelector('[data-bi-file-input]');
    if (pickFile && fileInput) {
      pickFile.onclick = function () { fileInput.click(); };
      fileInput.onchange = function () {
        var files = fileInput.files;
        if (!files || !files.length) return;
        var pickBtn = pickFile;
        var prevLabel = pickFile.textContent;
        pickFile.disabled = true;
        pickFile.textContent = 'アップロード中…';
        var chain = kintone.Promise.resolve();
        for (var i = 0; i < files.length; i++) {
          (function (f) {
            chain = chain.then(function () { return addAttachmentFile(f); });
          })(files[i]);
        }
        chain.then(function () {
          fileInput.value = '';
          ui.open.attach = true;
          updateAttachUi();
        }).catch(function (err) {
          alert('ファイルのアップロードに失敗しました。\n' + (err && err.message ? err.message : ''));
        }).then(function () {
          pickFile.disabled = false;
          pickFile.textContent = prevLabel;
        });
      };
    }
    bindAttachDeleteButtons();
  }

  function onSubmitApply(event) {
    if (!isApplyMode(event)) return event;
    syncDomToCache();
    event.record = mergeCacheToRec(event.record);
    if (ui.pendingApply) {
      var people = ui.wfPeople;
      if (people) {
        if (people.mgr) event.record['部長評価者'] = userSelect(people.mgr);
        if (people.branch) event.record['支店長評価者'] = userSelect(people.branch);
        if (people.hr) event.record['人事部長評価者'] = userSelect(people.hr);
        if (people.applicant) event.record['申請者'] = userSelect(people.applicant);
      }
      if (!val(event.record, F.date)) {
        event.record[F.date] = { type: 'DATE', value: todayISO() };
      }
    }
    return event;
  }

  function onSubmitRecord(event) {
    if (isApplyMode(event)) return onSubmitApply(event);
    if (isEvalMode(event) && evUi.role) recalcEval(event.record);
    return event;
  }

  function onSubmitSuccess(event) {
    if (ui.pendingApply) {
      var action = ui.pendingReapply ? WF_ACTION_REAPPLY : WF_ACTION_APPLY;
      var rec = event.record || getRec();
      var assignee = resolveWfActionAssignee(action, rec);
      ui.pendingApply = false;
      ui.pendingReapply = false;
      ui.allowNavigate = true;
      if (!assignee) {
        alert('申請処理に失敗しました。部長評価者が未設定です。\n保存は完了しています。');
        return event;
      }
      return runWorkflowAction(event.recordId, action, assignee).then(function () {
        afterApplySuccess(event.recordId);
        return event;
      }).catch(function (err) {
        var msg = (err && err.message) || String(err);
        alert('申請処理に失敗しました。保存は完了しています。\n' + msg);
        return event;
      });
    }
    if (evUi.pendingEvalWf) {
      var pending = evUi.pendingEvalWf;
      evUi.pendingEvalWf = null;
      evUi.allowNavigate = true;
      return runWorkflowAction(event.recordId, pending.action, pending.assignee || '').then(function () {
        afterEvalSuccess(event.recordId);
        return event;
      }).catch(function (err) {
        var msg = (err && err.message) || String(err);
        alert('承認処理に失敗しました。評価内容は保存済みです。\n' + msg);
        return event;
      });
    }
    if (evUi.pendingEvalDraft) {
      evUi.pendingEvalDraft = false;
      evUi.commentDraft = val(event.record, FE.comment);
      alert('一時保存しました');
      return event;
    }
    return event;
  }

  /* ===== Phase 5 評価UI ===== */
  var FE = {
    effect: 'eval_effect',
    ingenuity: 'eval_ingenuity',
    effort: 'eval_effort',
    overall: 'eval_overall',
    comment: '評価コメント',
    total: '合計点',
    rankAuto: '表彰ランク_自動',
    rankFinal: '表彰ランク_最終',
    points: '付与ポイント',
    branchDelegate: 'branch_delegate',
    mgr: '部長評価者',
    br: '支店長評価者',
    hr: '人事部長評価者',
  };

  var STAGE_KEYS = ['stage_a', 'stage_b', 'stage_c', 'stage_d', 'stage_e'];
  var EVAL_CRITERIA = {
    effect: {
      roman: '①',
      title: '効果',
      maxPoints: 10,
      intro: '総合的に判断する。',
      bullets: ['提案内容が数値化されているか', '効果が見込めるか'],
      levels: [
        { key: 'stage_a', label: '①極めて大きな効果がある', points: 10 },
        { key: 'stage_b', label: '②大きな効果がある', points: 8 },
        { key: 'stage_c', label: '③一応効果がある', points: 6 },
        { key: 'stage_d', label: '④効果が少ない', points: 4 },
        { key: 'stage_e', label: '⑤効果がない', points: 2 },
      ],
      invalidNote: '※旧システムの「無効（0点）」は新システムでは選択しません（未選択＝未評価）。',
    },
    ingenuity: {
      roman: '②',
      title: '工夫度',
      maxPoints: 5,
      intro: '現状への問題意識・独自発想・創意性を評価する。',
      bullets: ['現状への問題意識', '独自発想・創意性'],
      levels: [
        { key: 'stage_a', label: '①他に類のない新しい独自の発想で、改善方法が抜群である', points: 5 },
        { key: 'stage_b', label: '②非常に魅力的なものであり、かなり想像的で着想に優れている', points: 4 },
        { key: 'stage_c', label: '③他からのヒント等を基にしているが、創意性は認められる', points: 3 },
        { key: 'stage_d', label: '④周知のアイデアですでに適用されている方法等の応用である', points: 2 },
        { key: 'stage_e', label: '⑤現在の方法等に些細な変化を加えたもの等創造性があまり認められない', points: 1 },
      ],
      invalidNote: '※旧システムの「無効（0点）」は新システムでは選択しません。',
    },
    effort: {
      roman: '③',
      title: '努力度',
      maxPoints: 5,
      intro: 'テーマ選定から完成までのプロセスの努力を評価する。',
      bullets: ['テーマを選定してから完成するまでのプロセスの努力程度'],
      levels: [
        { key: 'stage_a', label: '①抜群の改善努力をしている', points: 5 },
        { key: 'stage_b', label: '②非常に努力している', points: 4 },
        { key: 'stage_c', label: '③かなり努力している', points: 3 },
        { key: 'stage_d', label: '④ある程度努力している', points: 2 },
        { key: 'stage_e', label: '⑤思いつきのまま、または要望・意見に類するものである', points: 1 },
      ],
      invalidNote: '※旧システムの「無効（0点）」は新システムでは選択しません。',
    },
    overall: {
      roman: '①',
      title: '総合的審査',
      maxPoints: 10,
      intro: 'アイデア提案全体を総合的に判断する。',
      bullets: ['独自性・魅力・実現可能性等を総合評価'],
      levels: [
        { key: 'stage_a', label: '①全く独自の着想で他に類がなく非常によい提案である', points: 10 },
        { key: 'stage_b', label: '②非常に魅力的な企画であり独創的なものでよい提案である', points: 8 },
        { key: 'stage_c', label: '③技術的・資金的にも実現可能な提案である', points: 6 },
        { key: 'stage_d', label: '④すでに類似している提案がある', points: 4 },
        { key: 'stage_e', label: '⑤現時点では実施が難しい', points: 2 },
      ],
      invalidNote: '※旧システムの「無効（0点）」は新システムでは選択しません。',
    },
  };
  var STAGE_PTS = {
    effect: [10, 8, 6, 4, 2],
    ingenuity: [5, 4, 3, 2, 1],
    effort: [5, 4, 3, 2, 1],
    overall: [10, 8, 6, 4, 2],
  };
  var AWARD_PTS = { A: 5000, B: 1000, C: 100 };

  var evUi = {
    root: null,
    role: null,
    login: '',
    fieldOpts: {},
    pendingEvalWf: null,
    pendingEvalDraft: false,
    allowNavigate: false,
    commentDraft: '',
    evalDraft: null,
    branchDelegateMeta: null,
    branchDelegateMetaPromise: null,
  };

  function loadBranchDelegateMeta() {
    if (evUi.branchDelegateMeta) return kintone.Promise.resolve(evUi.branchDelegateMeta);
    if (evUi.branchDelegateMetaPromise) return evUi.branchDelegateMetaPromise;
    evUi.branchDelegateMetaPromise = kintone.api(
      kintone.api.url('/k/v1/app/form/fields.json', true),
      'GET',
      { app: kintone.app.getId() }
    ).then(function (res) {
      var f = res.properties && res.properties[FE.branchDelegate];
      var meta = { type: 'CHECK_BOX', optionKey: 'delegate' };
      if (f) {
        meta.type = f.type || 'CHECK_BOX';
        if (f.options) {
          var keys = Object.keys(f.options);
          meta.optionKey = keys.indexOf('delegate') >= 0 ? 'delegate' : (keys[0] || 'delegate');
        }
      }
      evUi.branchDelegateMeta = meta;
      return meta;
    }).catch(function () {
      evUi.branchDelegateMeta = { type: 'CHECK_BOX', optionKey: 'delegate' };
      return evUi.branchDelegateMeta;
    });
    return evUi.branchDelegateMetaPromise;
  }

  function branchDelegateRecFromDraft(on) {
    var meta = evUi.branchDelegateMeta || { type: 'CHECK_BOX', optionKey: 'delegate' };
    if (meta.type === 'DROP_DOWN') {
      return { type: 'DROP_DOWN', value: on ? meta.optionKey : '' };
    }
    return { type: 'CHECK_BOX', value: on ? [meta.optionKey] : [] };
  }

  function resetEvalDraft() {
    evUi.evalDraft = null;
  }

  function ensureEvalDraft() {
    if (evUi.evalDraft) return;
    var rec = getRec();
    evUi.evalDraft = {
      effect: val(rec, FE.effect),
      ingenuity: val(rec, FE.ingenuity),
      effort: val(rec, FE.effort),
      overall: val(rec, FE.overall),
      rankFinal: val(rec, FE.rankFinal),
      branchDelegate: branchDelegateOn(rec),
    };
  }

  function applyEvalDraftToRec(rec) {
    if (evUi.evalDraft) {
      var d = evUi.evalDraft;
      rec[FE.effect] = { type: 'DROP_DOWN', value: d.effect || '' };
      rec[FE.ingenuity] = { type: 'DROP_DOWN', value: d.ingenuity || '' };
      rec[FE.effort] = { type: 'DROP_DOWN', value: d.effort || '' };
      rec[FE.overall] = { type: 'DROP_DOWN', value: d.overall || '' };
      rec[FE.rankFinal] = { type: 'DROP_DOWN', value: d.rankFinal || '' };
      rec[FE.branchDelegate] = branchDelegateRecFromDraft(!!d.branchDelegate);
    }
    rec[FE.comment] = {
      type: 'MULTI_LINE_TEXT',
      value: evUi.commentDraft != null ? String(evUi.commentDraft) : val(rec, FE.comment),
    };
    recalcEval(rec);
    return rec;
  }

  function getEvalWorkingRec() {
    return applyEvalDraftToRec(cloneKintoneRec(getRec()));
  }

  function syncWorkingRecToEvalDraft(rec) {
    ensureEvalDraft();
    evUi.evalDraft.effect = val(rec, FE.effect);
    evUi.evalDraft.ingenuity = val(rec, FE.ingenuity);
    evUi.evalDraft.effort = val(rec, FE.effort);
    evUi.evalDraft.overall = val(rec, FE.overall);
    evUi.evalDraft.rankFinal = val(rec, FE.rankFinal);
    evUi.evalDraft.branchDelegate = branchDelegateOn(rec);
    evUi.commentDraft = val(rec, FE.comment);
  }

  function isEvalMode(ev) {
    if (ev.type.indexOf('create') >= 0) return false;
    return !isApplyMode(ev);
  }

  function userCodeFromField(f) {
    if (!f || !f.value || !f.value.length) return '';
    return f.value[0] && f.value[0].code ? f.value[0].code : '';
  }

  function fetchSettingsForDept(dept) {
    if (!dept) return kintone.Promise.resolve(null);
    var q = 'record_kind in ("所属行") and dept_name = "' + escQ(dept) + '" limit 1';
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.settingsAppId,
      query: q,
      fields: ['dept_name', 'manager_login', 'branch_manager_login'],
    }).then(function (res) { return (res.records && res.records[0]) || null; });
  }

  function fetchHrLogin() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: BI.settingsAppId,
      query: 'record_kind in ("共通設定") limit 1',
      fields: ['hr_director_login'],
    }).then(function (res) {
      var r = res.records && res.records[0];
      return r && r.hr_director_login ? r.hr_director_login.value : 'jinji';
    });
  }

  function rolePriorityForStatus(st) {
    if (st === 'Branch' || st === 'branch' || st === '支店長承認中') return ['branch', 'hr', 'manager'];
    if (st === 'Hr' || st === 'hr' || st === '人事研修部長承認中') return ['hr', 'branch', 'manager'];
    if (st === 'Mgr' || st === 'manager' || st === '上司承認中') return ['manager', 'branch', 'hr'];
    return ['manager', 'branch', 'hr'];
  }

  function loginMatchesEvalRole(rec, login, hrLogin, settingsRow, role) {
    var mgr = userCodeFromField(rec[FE.mgr]);
    var br = userCodeFromField(rec[FE.br]);
    if (role === 'manager') {
      return login === mgr ||
        !!(settingsRow && settingsRow.manager_login && login === settingsRow.manager_login.value);
    }
    if (role === 'branch') {
      return login === br ||
        !!(settingsRow && settingsRow.branch_manager_login && login === settingsRow.branch_manager_login.value);
    }
    if (role === 'hr') {
      var hrField = userCodeFromField(rec[FE.hr]);
      return login === hrLogin || (!!hrField && login === hrField);
    }
    return false;
  }

  function resolveEvalRoleForStatus(rec, login, hrLogin, settingsRow) {
    var st = recordStatusKey(rec);
    var priorities = rolePriorityForStatus(st);
    var i;
    var role;
    for (i = 0; i < priorities.length; i++) {
      role = priorities[i];
      if (evalRoleMatchesStatus(role, st) && loginMatchesEvalRole(rec, login, hrLogin, settingsRow, role)) {
        return role;
      }
    }
    for (i = 0; i < priorities.length; i++) {
      role = priorities[i];
      if (loginMatchesEvalRole(rec, login, hrLogin, settingsRow, role)) return role;
    }
    return null;
  }

  function resolveEvalRole(rec, login) {
    return fetchHrLogin().then(function (hrLogin) {
      return fetchSettingsForDept(val(rec, F.dept)).then(function (row) {
        return resolveEvalRoleForStatus(rec, login, hrLogin, row);
      });
    });
  }

  function ptsFromKey(fieldKey, optionKey) {
    if (!optionKey) return 0;
    var idx = STAGE_KEYS.indexOf(optionKey);
    if (idx < 0) return 0;
    var arr = STAGE_PTS[fieldKey];
    if (!arr || arr[idx] == null) return 0;
    return arr[idx];
  }

  function calcTotal(rec) {
    var type = val(rec, F.type);
    if (type === 'アイデア提案') {
      return ptsFromKey('overall', val(rec, FE.overall));
    }
    return ptsFromKey('effect', val(rec, FE.effect)) +
      ptsFromKey('ingenuity', val(rec, FE.ingenuity)) +
      ptsFromKey('effort', val(rec, FE.effort));
  }

  function calcAutoRank(rec, total) {
    var type = val(rec, F.type);
    var t = total != null ? total : calcTotal(rec);
    if (type === 'アイデア提案') {
      if (t >= 10) return 'A';
      if (t >= 7) return 'B';
      return 'C';
    }
    if (t >= 18) return 'A';
    if (t >= 14) return 'B';
    return 'C';
  }

  function evalItemsDone(rec) {
    var type = val(rec, F.type);
    if (type === 'アイデア提案') return filled(val(rec, FE.overall));
    return filled(val(rec, FE.effect)) && filled(val(rec, FE.ingenuity)) && filled(val(rec, FE.effort));
  }

  function branchDelegateOn(rec) {
    var f = rec[FE.branchDelegate];
    if (!f || f.value == null) return false;
    var v = f.value;
    var meta = evUi.branchDelegateMeta || { type: 'CHECK_BOX', optionKey: 'delegate' };
    if (Array.isArray(v)) {
      return v.indexOf('delegate') >= 0 || v.indexOf(meta.optionKey) >= 0;
    }
    var s = String(v);
    return filled(s) && (s === 'delegate' || s === meta.optionKey);
  }

  function recalcEvalFields(rec) {
    var total = calcTotal(rec);
    var auto = calcAutoRank(rec, total);
    var fin = val(rec, FE.rankFinal);
    var points = fin && AWARD_PTS[fin] ? String(AWARD_PTS[fin]) : '';
    return { total: String(total), auto: auto, points: points };
  }

  function effectiveAutoRank(rec) {
    if (evalItemsDone(rec)) {
      var live = recalcEvalFields(rec).auto;
      if (filled(live)) return live;
    }
    var saved = val(rec, FE.rankAuto);
    if (filled(saved)) return saved;
    return '';
  }

  function recalcEval(rec) {
    var calc = recalcEvalFields(rec);
    var totalNum = Number(calc.total);
    if (!Number.isFinite(totalNum)) totalNum = 0;
    rec[FE.total] = { type: 'NUMBER', value: String(totalNum) };
    rec[FE.rankAuto] = { type: 'SINGLE_LINE_TEXT', value: calc.auto };
    if (filled(calc.points)) {
      rec[FE.points] = { type: 'NUMBER', value: calc.points };
    } else if (rec[FE.points]) {
      rec[FE.points] = { type: 'NUMBER', value: '' };
    }
    return rec;
  }

  function fieldKindFromCode(code) {
    if (code === FE.effect) return 'effect';
    if (code === FE.ingenuity) return 'ingenuity';
    if (code === FE.effort) return 'effort';
    if (code === FE.overall) return 'overall';
    return 'effect';
  }

  function evalLevelLabel(kind, key) {
    var c = EVAL_CRITERIA[kind];
    if (!c) return key;
    for (var i = 0; i < c.levels.length; i++) {
      if (c.levels[i].key === key) return c.levels[i].label;
    }
    return key;
  }

  function loadEvalFieldOpts() {
    return kintone.Promise.resolve(evUi.fieldOpts);
  }

  function evalOptionDisplayLabel(lv) {
    return lv.label + ' ' + lv.points + '点';
  }

  function evalOptionListHtml(code, cur, kind) {
    var c = EVAL_CRITERIA[kind];
    var opts = '<option value=""></option>' + c.levels.map(function (lv) {
      return '<option value="' + esc(lv.key) + '"' + (cur === lv.key ? ' selected' : '') + '>' +
        esc(evalOptionDisplayLabel(lv)) + '</option>';
    }).join('');
    return '<select data-bi-eval="' + esc(code) + '" style="width:100%;padding:10px;border:1px solid #d6b896;border-radius:8px;font-size:0.95em">' +
      opts + '</select>' +
      '<p style="margin:8px 0 0;color:#94a3b8;font-size:0.85em">無効　0点（旧システム参照・新システムでは選択不可）</p>';
  }

  function evalCardHtml(kind, code, cur) {
    var c = EVAL_CRITERIA[kind];
    var bullets = c.bullets.length
      ? '<ul style="margin:10px 0 0;padding-left:22px;color:#57534e;font-size:0.92em;line-height:1.65">' +
        c.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>'
      : '';
    return '<div style="background:#fff;border:1px solid #d6b896;border-radius:10px;padding:14px;margin-bottom:12px">' +
      '<div style="font-size:1.12em;font-weight:700;color:#78350f;margin-bottom:8px">' +
      esc(c.roman + '【' + c.title + '】') + '</div>' +
      '<p style="margin:0;color:#444;font-size:0.95em;line-height:1.55;padding-left:1em">' + esc(c.intro) + '</p>' +
      bullets +
      '<p style="margin:14px 0 8px;color:#64748b;font-size:0.88em">配点上限 ' + c.maxPoints +
      '点 — 該当する段階を選択してください</p>' +
      evalOptionListHtml(code, cur, kind) +
      (c.invalidNote ? '<p style="margin:8px 0 0;color:#94a3b8;font-size:0.82em;line-height:1.45">' + esc(c.invalidNote) + '</p>' : '') +
      '</div>';
  }

  function evalScoreBreakdown(rec) {
    var type = val(rec, F.type);
    if (type === 'アイデア提案') {
      var ok = val(rec, FE.overall);
      if (!ok) return '—';
      return '総合的審査 ' + ptsFromKey('overall', ok) + '点';
    }
    var rows = [
      ['effect', FE.effect, '効果'],
      ['ingenuity', FE.ingenuity, '工夫度'],
      ['effort', FE.effort, '努力度'],
    ];
    var parts = [];
    rows.forEach(function (row) {
      var v = val(rec, row[1]);
      if (v) parts.push(row[2] + ' ' + ptsFromKey(row[0], v) + '点');
    });
    return parts.length ? parts.join(' ＋ ') : '—';
  }

  function evalIsDoneStatus(rec) {
    var st = recordStatusKey(rec);
    return st === 'Done' || st === 'done' || st === '完了';
  }

  function evalRoleMatchesStatus(role, status) {
    if (role === 'manager') {
      return status === 'Mgr' || status === 'manager' || status === '上司承認中';
    }
    if (role === 'branch') {
      return status === 'Branch' || status === 'branch' || status === '支店長承認中';
    }
    if (role === 'hr') {
      return status === 'Hr' || status === 'hr' || status === '人事研修部長承認中';
    }
    return false;
  }

  function evalCanShowActions(rec) {
    if (evalIsDoneStatus(rec) || !evUi.role) return false;
    var st = recordStatusKey(rec);
    if (!evalRoleMatchesStatus(evUi.role, st)) return false;
    if (evUi.role === 'manager') return branchDelegateOn(rec) || evalItemsDone(rec);
    return true;
  }

  function wfActionsFromState(stateKey) {
    var key = normalizeWfStateKey(stateKey);
    return (ui.wfActions || []).filter(function (a) {
      return a.from === key || a.from === stateKey || normalizeWfStateKey(a.from) === key;
    });
  }

  function findWfAction(stateKey, names, toHint) {
    var actions = wfActionsFromState(stateKey);
    var i;
    for (i = 0; i < names.length; i++) {
      var hit = actions.find(function (a) { return a.name === names[i]; });
      if (hit) return hit;
    }
    if (toHint) return actions.find(function (a) { return a.to === toHint; }) || null;
    return null;
  }

  function wfActionTargetsDone(actionName, fromStatus) {
    if (!actionName) return false;
    var status = normalizeWfStateKey(fromStatus);
    var act = (ui.wfActions || []).find(function (a) {
      return a.name === actionName && normalizeWfStateKey(a.from) === status;
    });
    if (act) return act.to === 'Done' || act.to === 'done' || act.to === '完了';
    return actionName === 'MgrToDone' || actionName === 'BranchApprove' || actionName === 'HrApprove';
  }

  function withForwardMeta(rec, base) {
    if (!base) return null;
    base.targetsDone = wfActionTargetsDone(base.action, recordStatusKey(rec));
    return base;
  }

  function resolveEvalForwardAction(rec) {
    var status = recordStatusKey(rec);
    var role = evUi.role;
    var auto = effectiveAutoRank(rec);
    var people = ui.wfPeople || {};
    if (role === 'manager') {
      if (branchDelegateOn(rec) || auto === 'A' || auto === 'B') {
        var toBranch = findWfAction(status, ['部長承認_支店長へ', 'MgrToBranch'], 'Branch') ||
          findWfAction(status, ['部長承認_支店長へ'], '支店長承認中');
        if (toBranch) {
          return withForwardMeta(rec, {
            action: toBranch.name,
            label: '支店長評価へ',
            assignee: people.branch || wfPersonFromField(rec, '支店長評価者'),
            assigneeRequired: true,
            assigneeMissing: '支店長評価者が未設定です',
          });
        }
      }
      var toDone = findWfAction(status, ['部長承認_完了', 'MgrToDone'], 'Done') ||
        findWfAction(status, ['部長承認_完了'], '完了');
      if (toDone) {
        return withForwardMeta(rec, {
          action: toDone.name,
          label: '承認する',
          assignee: '',
          assigneeRequired: false,
        });
      }
    }
    if (role === 'branch') {
      if (auto === 'A') {
        var toHr = findWfAction(status, ['支店長承認_人事へ', 'BranchToHr'], 'Hr') ||
          findWfAction(status, ['支店長承認_人事へ'], '人事研修部長承認中');
        if (toHr) {
          return withForwardMeta(rec, {
            action: toHr.name,
            label: '人事部長評価へ',
            assignee: people.hr || wfPersonFromField(rec, '人事部長評価者'),
            assigneeRequired: true,
            assigneeMissing: '人事部長評価者が未設定です。設定マスタ(697)の人事部長を確認してください',
          });
        }
        return withForwardMeta(rec, {
          action: '',
          label: '人事部長評価へ',
          assignee: '',
          assigneeRequired: true,
          assigneeMissing: 'A評価ですがWFに「人事部長評価へ」(BranchToHr)がありません。test_v3 WFを適用してください',
        });
      }
      var branchDone = findWfAction(status, ['支店長承認_完了', 'BranchApprove'], 'Done') ||
        findWfAction(status, ['支店長承認_完了'], '完了');
      if (branchDone) {
        return withForwardMeta(rec, {
          action: branchDone.name,
          label: '承認する',
          assignee: '',
          assigneeRequired: false,
        });
      }
    }
    if (role === 'hr') {
      var hrDone = findWfAction(status, ['人事承認_完了', 'HrApprove'], 'Done') ||
        findWfAction(status, ['人事承認_完了'], '完了');
      if (hrDone) {
        return withForwardMeta(rec, {
          action: hrDone.name,
          label: '承認する',
          assignee: '',
          assigneeRequired: false,
        });
      }
    }
    return null;
  }

  function evalForwardTargetsDone(rec) {
    var fwd = resolveEvalForwardAction(rec);
    return !!(fwd && fwd.targetsDone);
  }

  function evalCompletionBlockReason(rec) {
    syncEvalFormFromDom();
    rec = getEvalWorkingRec();
    var fin = val(rec, FE.rankFinal);
    if (!filled(fin)) return '完了に進む前に表彰ランク（最終）を選択してください';
    if (!AWARD_PTS[fin]) return '表彰ランク（最終）が不正です。A / B / C から選択してください';
    var calc = recalcEvalFields(rec);
    if (!filled(calc.points)) return '付与ポイントを確定できません。表彰ランク（最終）を確認してください';
    return '';
  }

  function resolveEvalRejectAction(rec) {
    var status = recordStatusKey(rec);
    return findWfAction(status, ['差戻し', '差戻し_支店長', '差戻し_人事'], '申請者修正待ち') ||
      findWfAction(status, ['差戻し', '差戻し_支店長', '差戻し_人事'], 'applicant_fix') ||
      wfActionsFromState(status).find(function (a) {
        return a.to === '申請者修正待ち' || a.to === 'applicant_fix';
      }) || null;
  }

  function evalApproveBlockReason(rec) {
    if (!evalCanShowActions(rec)) return '評価を完了してください';
    if (evUi.role === 'manager' && !branchDelegateOn(rec) && !evalItemsDone(rec)) {
      return '評価項目をすべて選択してください';
    }
    var fwd = resolveEvalForwardAction(rec);
    if (!fwd || !fwd.action) {
      return (fwd && fwd.assigneeMissing) ? fwd.assigneeMissing : '利用可能な承認操作がありません';
    }
    if (fwd.assigneeRequired && !fwd.assignee) return fwd.assigneeMissing || '次の作業者が未設定です';
    if (fwd.targetsDone) {
      var doneBlock = evalCompletionBlockReason(rec);
      if (doneBlock) return doneBlock;
    }
    return '';
  }

  function histNowIso() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + '+09:00';
  }

  function appendOperationHistory(rec, action, detail) {
    var login = (kintone.getLoginUser() && kintone.getLoginUser().name) || evUi.login || '';
    var code = '提案操作履歴';
    if (!rec[code]) rec[code] = { type: 'SUBTABLE', value: [] };
    rec[code].value.push({
      value: {
        hist_at: { type: 'DATETIME', value: histNowIso() },
        hist_action: { type: 'SINGLE_LINE_TEXT', value: action },
        hist_actor: { type: 'SINGLE_LINE_TEXT', value: login },
        hist_detail: { type: 'MULTI_LINE_TEXT', value: detail || '' },
      },
    });
    return rec;
  }

  function syncEvalFormFromDom() {
    ensureEvalDraft();
    if (!evUi.root) return;
    var cmt = evUi.root.querySelector('[data-bi-eval-comment]');
    if (cmt) evUi.commentDraft = cmt.value;
    var rf = evUi.root.querySelector('[data-bi-rank-final]');
    if (rf) evUi.evalDraft.rankFinal = rf.value || '';
  }

  function syncEvalCommentFromDom() {
    syncEvalFormFromDom();
  }

  function commitEvalComment() {
    if (!evUi.root) return;
    var cmt = evUi.root.querySelector('[data-bi-eval-comment]');
    if (cmt) evUi.commentDraft = cmt.value;
  }

  function formatKintoneApiError(err) {
    var msg = (err && err.message) || String(err || '');
    if (err && err.errors) {
      try { msg += '\n' + JSON.stringify(err.errors); } catch (e) { /* noop */ }
    }
    return msg;
  }

  function normalizeEvalScalar(raw) {
    if (raw == null) return '';
    if (typeof raw === 'object') return '';
    return String(raw).trim();
  }

  function isValidEvalDropDown(code, value) {
    if (!filled(value)) return false;
    if (code === FE.rankFinal) return !!AWARD_PTS[value];
    if (code === FE.effect || code === FE.ingenuity || code === FE.effort || code === FE.overall) {
      return STAGE_KEYS.indexOf(value) >= 0;
    }
    return filled(value);
  }

  function sanitizeSubtableForPut(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(function (row) {
      var out = { value: {} };
      if (row && row.id != null && row.id !== '') out.id = String(row.id);
      var cells = (row && row.value) || {};
      Object.keys(cells).forEach(function (fc) {
        var cell = cells[fc];
        if (!cell || cell.value == null) return;
        if (typeof cell.value === 'object') return;
        out.value[fc] = { value: cell.value };
      });
      return out;
    });
  }

  function evalRecordPayload(rec) {
    var payload = {};
    var type = val(rec, F.type);
    var codes = [
      FE.effect, FE.ingenuity, FE.effort, FE.overall, FE.comment,
      FE.total, FE.rankAuto, FE.rankFinal, FE.points, FE.branchDelegate,
      '差戻し理由', '提案操作履歴',
    ];
    codes.forEach(function (code) {
      if (code === FE.overall && type !== 'アイデア提案') return;
      if ((code === FE.effect || code === FE.ingenuity || code === FE.effort) && type === 'アイデア提案') {
        return;
      }
      if (code === '提案操作履歴') {
        if (rec[code] && rec[code].value) {
          payload[code] = { value: sanitizeSubtableForPut(rec[code].value) };
        }
        return;
      }
      if (!rec[code] || rec[code].value === undefined) return;

      if (code === FE.branchDelegate) {
        var raw = rec[code];
        if (!raw || raw.value === undefined || raw.value === null) return;
        if (Array.isArray(raw.value)) {
          if (!raw.value.length) return;
          payload[code] = { value: raw.value.filter(Boolean) };
          return;
        }
        var delegateVal = normalizeEvalScalar(raw.value);
        if (!filled(delegateVal)) return;
        payload[code] = { value: delegateVal };
        return;
      }

      if (code === FE.total || code === FE.points) {
        var numRaw = normalizeEvalScalar(rec[code].value);
        if (!filled(numRaw) || numRaw === 'NaN' || Number.isNaN(Number(numRaw))) return;
        payload[code] = { value: String(numRaw) };
        return;
      }

      if (code === FE.rankFinal || code === FE.effect || code === FE.ingenuity ||
          code === FE.effort || code === FE.overall) {
        var dropVal = normalizeEvalScalar(rec[code].value);
        if (!isValidEvalDropDown(code, dropVal)) return;
        payload[code] = { value: dropVal };
        return;
      }

      var scalar = rec[code].value;
      if (typeof scalar === 'object') return;
      payload[code] = { value: scalar };
    });
    return payload;
  }

  function putEvalRecord(recordId, rec) {
    var payload = evalRecordPayload(rec);
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {
      app: kintone.app.getId(),
      id: String(recordId),
      record: payload,
    });
  }

  function startEvalDraftSave() {
    syncEvalFormFromDom();
    var rec = getEvalWorkingRec();
    var recordId = kintone.app.record.getId();
    putEvalRecord(recordId, rec).then(function () {
      syncWorkingRecToEvalDraft(rec);
      alert('一時保存しました');
    }).catch(function (err) {
      alert('一時保存に失敗しました。\n' + formatKintoneApiError(err));
    });
  }

  function startEvalForwardSave(fwd) {
    armNavigateAway();
    syncEvalFormFromDom();
    var rec = getEvalWorkingRec();
    if (fwd.targetsDone) {
      var doneBlock = evalCompletionBlockReason(rec);
      if (doneBlock) {
        evUi.allowNavigate = false;
        alert(doneBlock);
        return;
      }
      rec = getEvalWorkingRec();
    }
    appendOperationHistory(rec, fwd.label || '承認', '');
    var recordId = kintone.app.record.getId();
    putEvalRecord(recordId, rec).then(function () {
      return runWorkflowAction(recordId, fwd.action, fwd.assignee || '');
    }).then(function () {
      afterEvalSuccess(recordId);
    }).catch(function (err) {
      evUi.allowNavigate = false;
      alert('承認処理に失敗しました。\n' + formatKintoneApiError(err));
    });
  }

  function startEvalRejectSave(rej, reason) {
    armNavigateAway();
    syncEvalFormFromDom();
    var rec = getEvalWorkingRec();
    rec['差戻し理由'] = { type: 'MULTI_LINE_TEXT', value: reason };
    appendOperationHistory(rec, '差戻し', reason);
    var recordId = kintone.app.record.getId();
    var people = ui.wfPeople || {};
    var assignee = people.applicant || wfPersonFromField(rec, '申請者') || '';
    putEvalRecord(recordId, rec).then(function () {
      return runWorkflowAction(recordId, rej.name, assignee);
    }).then(function () {
      afterEvalSuccess(recordId);
    }).catch(function (err) {
      evUi.allowNavigate = false;
      alert('差戻し処理に失敗しました。\n' + formatKintoneApiError(err));
    });
  }

  function promptEvalReject(rec) {
    var rej = resolveEvalRejectAction(rec);
    if (!rej) {
      alert('差戻し操作が設定されていません（WF未設定の可能性があります）');
      return;
    }
    var wrap = openBiModal(
      '差戻し',
      '<p style="margin:0 0 10px">申請者が内容を修正できるよう差戻します。理由は必須です。</p>' +
      '<textarea id="bi-reject-reason" rows="4" style="width:100%;padding:8px;border:1px solid #d6b896;border-radius:8px" placeholder="差戻し理由"></textarea>',
      '<button type="button" id="bi-reject-run" style="padding:8px 14px;background:#b45309;color:#fff;border:0;border-radius:8px;cursor:pointer">差戻しを実行</button>' +
      '<button type="button" id="bi-reject-no" style="padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">キャンセル</button>'
    );
    wrap.querySelector('#bi-reject-run').onclick = function () {
      var reason = (wrap.querySelector('#bi-reject-reason').value || '').trim();
      if (!reason) {
        alert('差戻し理由を入力してください');
        return;
      }
      closeBiModal();
      startEvalRejectSave(rej, reason);
    };
    wrap.querySelector('#bi-reject-no').onclick = closeBiModal;
  }

  function promptEvalForward(rec) {
    var block = evalApproveBlockReason(rec);
    if (block) {
      alert(block);
      return;
    }
    var fwd = resolveEvalForwardAction(rec);
    if (!fwd) {
      alert('承認操作を特定できません');
      return;
    }
    var wrap = openBiModal(
      '承認の確認',
      '<p style="margin:0">承認しますか？</p>',
      '<button type="button" id="bi-forward-yes" style="padding:8px 14px;background:#15803d;color:#fff;border:0;border-radius:8px;cursor:pointer">はい</button>' +
      '<button type="button" id="bi-forward-reject" style="padding:8px 14px;background:#b45309;color:#fff;border:0;border-radius:8px;cursor:pointer">差戻し</button>' +
      '<button type="button" id="bi-forward-no" style="padding:8px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">キャンセル</button>'
    );
    wrap.querySelector('#bi-forward-yes').onclick = function () {
      closeBiModal();
      startEvalForwardSave(fwd);
    };
    wrap.querySelector('#bi-forward-reject').onclick = function () {
      closeBiModal();
      promptEvalReject(rec);
    };
    wrap.querySelector('#bi-forward-no').onclick = closeBiModal;
  }

  function afterEvalSuccess(recordId) {
    try { sessionStorage.setItem('bi-eval-done', '1'); } catch (e) { /* noop */ }
    navigateAwaySafe(guideIndexUrl());
  }

  function evalIntroText(rec) {
    var type = val(rec, F.type);
    var typeNote = type === 'アイデア提案'
      ? '（アイデア提案＝総合的審査のみ・満点10点）'
      : '（業務改善提案＝効果10点＋工夫度5点＋努力度5点＝合計20点）';
    if (evUi.role === 'branch') {
      return '部長評価済みです。評価内容を確認し、必要なら各項目を修正できます（修正後は一時保存）。' + typeNote;
    }
    if (evUi.role === 'hr') {
      return '前段階の評価を確認し、必要なら各項目を修正できます（修正後は一時保存）。' + typeNote;
    }
    return '各項目の審査基準を確認し、ドロップダウンから該当段階を選択してください。' + typeNote;
  }

  function evalFooterActionsHtml(rec) {
    if (evalIsDoneStatus(rec)) {
      return '<p style="margin:0;color:#64748b;font-size:0.9em">この案件は完了しています。</p>';
    }
    var fwd = resolveEvalForwardAction(rec);
    var rej = resolveEvalRejectAction(rec);
    var showActions = evalCanShowActions(rec);
    var fwdLabel = (fwd && fwd.label) || '承認する';
    var html = '<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #d6b896;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
      '<button type="button" data-bi-eval-draft style="padding:10px 18px;border:1px solid #64748b;background:#fff;color:#334155;border-radius:8px;cursor:pointer">一時保存</button>';
    if (showActions && fwd) {
      html += '<button type="button" data-bi-eval-forward style="padding:10px 18px;background:#15803d;color:#fff;border:0;border-radius:8px;cursor:pointer;font-weight:600">' +
        esc(fwdLabel) + '</button>';
      if (rej) {
        html += '<button type="button" data-bi-eval-reject style="padding:10px 18px;border:1px solid #b45309;background:#fff7ed;color:#b45309;border-radius:8px;cursor:pointer">差戻し</button>';
      }
    } else if (!showActions) {
      var waitMsg = evUi.role === 'branch' || evUi.role === 'hr'
        ? 'このフェーズの承認操作は表示できません（ログインまたはステータスを確認してください）'
        : '評価完了後に「' + esc(fwdLabel) + '」等のボタンが表示されます';
      html += '<span style="color:#64748b;font-size:0.88em">' + waitMsg + '</span>';
    } else if (!fwd) {
      html += '<span style="color:#b45309;font-size:0.88em">承認操作を特定できません（WF設定を確認してください）</span>';
    }
    html += '</div>';
    return html;
  }

  function readOnlyBlock(rec) {
    var props = (rec[F.proposers] && rec[F.proposers].value) || [];
    var pl = props.map(function (row) {
      var d = (row.value[F.propDept] && row.value[F.propDept].value) || '';
      var n = (row.value[F.propName] && row.value[F.propName].value) || '';
      return esc(d) + ' / ' + esc(n);
    }).join('<br>');
    return '<div style="background:#fff;border:1px solid #e7d5c4;border-radius:10px;padding:14px">' +
      '<p style="margin:0 0 8px"><strong>' + esc(val(rec, F.type)) + '</strong> — ' + esc(val(rec, F.title)) + '</p>' +
      '<p style="margin:0 0 8px;color:#57534e">部署: ' + esc(val(rec, F.dept)) + ' / 代表: ' + esc(val(rec, F.repName)) +
      (val(rec, F.date) ? ' / 提出: ' + esc(val(rec, F.date)) : '') + '</p>' +
      '<p style="margin:0 0 4px"><strong>提案者</strong><br>' + (pl || '—') + '</p>' +
      ACC.map(function (a) {
        return '<p style="margin:8px 0 0"><strong>' + esc(a.label) + '</strong><br>' +
          esc(val(rec, a.code)).replace(/\n/g, '<br>') + '</p>';
      }).join('') + '</div>';
  }

  function renderEval() {
    if (!evUi.root) return;
    var rec = getEvalWorkingRec();
    var calc = recalcEvalFields(rec);
    var type = val(rec, F.type);
    var auto = effectiveAutoRank(rec);
    var fin = val(rec, FE.rankFinal);
    var needsFinalRank = evalForwardTargetsDone(rec);
    var wide = window.innerWidth >= 1280;
    var commentVal = evUi.commentDraft != null ? evUi.commentDraft : val(rec, FE.comment);
    var cards = type === 'アイデア提案'
      ? evalCardHtml('overall', FE.overall, val(rec, FE.overall))
      : ['effect', 'ingenuity', 'effort'].map(function (k) {
          var codes = { effect: FE.effect, ingenuity: FE.ingenuity, effort: FE.effort };
          return evalCardHtml(k, codes[k], val(rec, codes[k]));
        }).join('');
    var breakdown = evalScoreBreakdown(rec);
    var pointsLabel = calc.points
      ? calc.points
      : (needsFinalRank ? '（表彰ランク（最終）を選択すると確定）' : '—');

    evUi.root.style.fontSize = fontPx();
    evUi.root.innerHTML =
      '<div style="font-family:\'Segoe UI\',Meiryo,sans-serif;line-height:1.5;padding:16px;background:linear-gradient(180deg,#faf5f0 0%,#f5f5f4 100%);border-radius:12px;border:1px solid #d6b896">' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<h2 style="margin:0;color:#78350f">業務改善提案 — 評価</h2>' +
      '<span style="color:#78716c;font-size:0.9em">ステータス: ' + esc(wfStateLabel(recordStatusKey(rec))) + '</span></div>' +
      '<div style="display:' + (wide ? 'grid' : 'block') + ';grid-template-columns:' + (wide ? '1fr 1fr' : 'none') + ';gap:16px">' +
      '<div>' + readOnlyBlock(rec) + '</div>' +
      '<div><div style="background:#fff;border:1px solid #d6b896;border-radius:10px;padding:14px">' +
      '<p style="margin:0 0 12px;padding:10px 12px;background:#fff7ed;border-radius:8px;color:#57534e;font-size:0.9em;line-height:1.5">' +
      esc(evalIntroText(rec)) + '</p>' +
      cards +
      '<label style="display:block;margin:12px 0 0">評価コメント（任意）<br><textarea data-bi-eval-comment rows="3" style="width:100%;padding:8px;border:1px solid #d6b896;border-radius:8px">' +
      esc(commentVal) + '</textarea></label>' +
      (evUi.role === 'manager' ? '<label style="display:block;margin:12px 0 0;padding:10px;background:#fff7ed;border-radius:8px">' +
        '<input type="checkbox" data-bi-branch-delegate' + (branchDelegateOn(rec) ? ' checked' : '') + '> 支店長へ判断を委ねる（支店長判断）</label>' : '') +
      '<div style="margin-top:14px;padding:12px;background:#fef3c7;border-radius:8px">' +
      '<div style="font-size:0.9em;color:#57534e;margin-bottom:6px">内訳: ' + esc(breakdown) + '</div>' +
      '<div>合計点: <strong>' + esc(calc.total) + '点</strong>' +
      (type === 'アイデア提案' ? '（満点10点）' : '（満点20点）') + '</div>' +
      '<div>表彰ランク（自動）: <strong>' + esc(auto || '—') + '</strong></div>' +
      (needsFinalRank ? '<div style="margin-top:10px"><label>表彰ランク（最終）<span style="color:#b45309"> *必須</span><br><select data-bi-rank-final style="padding:8px;border-radius:8px">' +
        '<option value=""></option><option value="A"' + (fin === 'A' ? ' selected' : '') + '>A（5,000 pt）</option>' +
        '<option value="B"' + (fin === 'B' ? ' selected' : '') + '>B（1,000 pt）</option>' +
        '<option value="C"' + (fin === 'C' ? ' selected' : '') + '>C（100 pt）</option></select></label>' +
        (fin ? '' : '<p style="margin:8px 0 0;color:#b45309;font-size:0.9em">完了に進む前に表彰ランク（最終）を選択してください</p>') +
        '</div>' : '') +
      '<div>付与ポイント: <strong>' + esc(pointsLabel) + '</strong></div></div>' +
      evalFooterActionsHtml(rec) +
      '</div></div></div>' +
      '<div data-bi-wf-route-wrap style="margin-top:14px;padding:12px 14px;background:#fff;border:1px solid #d6b896;border-radius:10px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
      wfRouteHtml(rec, 'eval') +
      '</div>' +
      '<p style="margin:12px 0 0;color:#94a3b8;font-size:0.8em">BUILD ' + esc(BUILD) + '</p></div>';
    bindEvalUi();
  }

  function patchEval(mutator, options) {
    if (ui.syncing) return;
    options = options || {};
    var rec = getEvalWorkingRec();
    mutator(rec);
    syncWorkingRecToEvalDraft(rec);
    if (!options.skipRender) renderEval();
  }

  function bindEvalUi() {
    if (!evUi.root) return;
    evUi.root.querySelectorAll('[data-bi-eval]').forEach(function (sel) {
      sel.onchange = function () {
        var code = sel.getAttribute('data-bi-eval');
        patchEval(function (r) { r[code] = { type: 'DROP_DOWN', value: sel.value }; });
      };
    });
    var cmt = evUi.root.querySelector('[data-bi-eval-comment]');
    if (cmt) {
      cmt.oninput = function () { evUi.commentDraft = cmt.value; };
      cmt.onblur = function () { commitEvalComment(); };
    }
    var bd = evUi.root.querySelector('[data-bi-branch-delegate]');
    if (bd) bd.onchange = function () {
      ensureEvalDraft();
      evUi.evalDraft.branchDelegate = bd.checked;
      renderEval();
    };
    var rf = evUi.root.querySelector('[data-bi-rank-final]');
    if (rf) rf.onchange = function () {
      patchEval(function (r) { r[FE.rankFinal] = { type: 'DROP_DOWN', value: rf.value }; });
    };
    var draft = evUi.root.querySelector('[data-bi-eval-draft]');
    if (draft) draft.onclick = function () { startEvalDraftSave(); };
    var forward = evUi.root.querySelector('[data-bi-eval-forward]');
    if (forward) forward.onclick = function () { promptEvalForward(getEvalWorkingRec()); };
    var reject = evUi.root.querySelector('[data-bi-eval-reject]');
    if (reject) reject.onclick = function () { promptEvalReject(getRec()); };
  }

  function onShowEval(event) {
    hideFields(HIDE_EVAL.concat(HIDE_APPLY));
    hideNativeProcessActions();
    installBiUnloadGuard();
    evUi.allowNavigate = false;
    resetEvalDraft();
    evUi.commentDraft = val(event.record, FE.comment);
    evUi.login = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';
    return loadBranchDelegateMeta().then(function () {
      return resolveEvalRole(event.record, evUi.login).then(function (role) {
        if (!role) {
          hideFields(HIDE_EVAL);
          return event;
        }
        evUi.role = role;
        var host = mountHost();
        if (!host) return event;
        evUi.root = host;
        ui.root = null;
        return loadEvalFieldOpts().then(function () {
          return fetchWfRoute().then(function () {
            return resolveWfPeople(event.record).then(function () {
              setTimeout(function () { renderEval(); }, 0);
              return event;
            });
          });
        });
      });
    });
  }

  function onShowEvalDetailRedirect(event) {
    hideFields(HIDE_EVAL.concat(HIDE_APPLY));
    evUi.login = (kintone.getLoginUser() && kintone.getLoginUser().code) || '';
    return resolveEvalRole(event.record, evUi.login).then(function (role) {
      if (!role) {
        hideFields(HIDE_EVAL);
        return event;
      }
      var rid = event.record.$id && event.record.$id.value;
      if (rid) location.href = recordShowUrl(rid, true);
      return event;
    });
  }

  function onShowApplyView(event) {
    hideFields(HIDE_EVAL.concat(HIDE_APPLY));
    var host = mountHost();
    if (!host) return event;
    ui.root = host;
    ui.readOnly = true;
    resetApplyDraft();
    evUi.root = null;
    ui.autoPurpose = false;
    event.record = syncRepToRow1(ensureProposers(event.record));
    refreshAttachFromRec(event.record);
    return fetchDepts().then(function () {
      return fetchWfRoute().then(function () {
        return resolveWfPeople(event.record).then(function () {
          setTimeout(function () { render(); }, 0);
          return event;
        });
      });
    });
  }

  function onShowApply(event) {
    hideFields(HIDE_EVAL.concat(HIDE_APPLY));
    hideNativeProcessActions();
    installBiUnloadGuard();
    var host = mountHost();
    if (!host) return event;
    ui.root = host;
    ui.readOnly = false;
    ui.allowNavigate = false;
    resetApplyDraft();
    evUi.root = null;
    ui.autoPurpose = false;
    ui.attachFiles = [];
    event.record = syncRepToRow1(ensureProposers(event.record));
    refreshAttachFromRec(event.record);
    return fetchDepts().then(function () {
      return fetchWfRoute().then(function () {
        return resolveWfPeople(event.record).then(function () {
          setTimeout(function () { render(); }, 0);
          return event;
        });
      });
    });
  }

  function mountHost() {
    var el = kintone.app.record.getSpaceElement(SPACE_ID);
    if (el) return el;
    var form = document.querySelector('.record-edit-gaia') || document.querySelector('.record-detail-gaia') || document.querySelector('.layout-gaia');
    if (!form) return null;
    var host = document.getElementById('bi-apply-fallback');
    if (!host) {
      host = document.createElement('div');
      host.id = 'bi-apply-fallback';
      form.insertBefore(host, form.firstChild);
    }
    return host;
  }

  function onShow(event) {
    BI.proposalAppId = kintone.app.getId();
    if (isApplyMode(event)) {
      if (isDetailShow(event)) return onShowApplyView(event);
      return onShowApply(event);
    }
    if (isEvalMode(event)) {
      if (isDetailShow(event)) return onShowEvalDetailRedirect(event);
      return onShowEval(event);
    }
    return event;
  }

  var SHOW = [
    'app.record.create.show', 'app.record.edit.show', 'app.record.detail.show',
    'mobile.app.record.create.show', 'mobile.app.record.edit.show', 'mobile.app.record.detail.show',
  ];
  kintone.events.on(SHOW, onShow);
  kintone.events.on([
    'app.record.create.submit', 'app.record.edit.submit',
    'mobile.app.record.create.submit', 'mobile.app.record.edit.submit',
  ], onSubmitRecord);
  kintone.events.on([
    'app.record.create.submit.success',
    'app.record.edit.submit.success',
    'mobile.app.record.create.submit.success',
    'mobile.app.record.edit.submit.success',
  ], onSubmitSuccess);
})();
