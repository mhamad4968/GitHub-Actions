(function () {
  'use strict';

  /** 業務改善 ver.02 — 社員マスタ698 一覧：595同期 + 在籍フィルタ + sort595 */
  var BUILD = '2026-07-04-bi-employee-index-emp-filter';

  var APP595 = 595;
  var SETTINGS_APP_ID = 697;
  var BANNER_ID = 'bi-employee-sync595-banner';
  var BTN_SYNC_ID = 'bi-employee-sync595-manual-btn';
  var FILTER_WRAP_ID = 'bi-698-emp-filter-wrap';
  var STORAGE_KEY_698_EMP = 'bi698-index-emp-filter';
  var STALE_HOURS = 26;
  var SORT595_QUERY_RE = /order by\s+source595_id\s+asc/i;
  var EMP_ACTIVE = '在籍';
  var EMP_RETIRED = '退職';

  var FIELDS_595 = ['user_name', 'dept_name', 'group_name', 'employment_status', 'mail', '$id'];
  var FIELDS_EMP = ['user_name', 'dept_name', 'group_name', 'employment_status', 'source595_id', '$id', '$revision'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getHeaderSpace() {
    return (
      (typeof kintone !== 'undefined' &&
        kintone.app &&
        kintone.app.getHeaderSpaceElement &&
        kintone.app.getHeaderSpaceElement()) ||
      (typeof kintone !== 'undefined' &&
        kintone.mobile &&
        kintone.mobile.app &&
        kintone.mobile.app.getHeaderSpaceElement &&
        kintone.mobile.app.getHeaderSpaceElement()) ||
      null
    );
  }

  function parseSyncMeta(raw) {
    if (!raw || !String(raw).trim()) return null;
    try {
      return JSON.parse(String(raw));
    } catch (_e) {
      return null;
    }
  }

  function fmtNum(n) {
    if (n == null || n === '') return '—';
    var x = Number(n);
    return Number.isFinite(x) ? String(x) : esc(n);
  }

  function formatJstNow(date) {
    var d = date || new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(d);
      var g = function (t) {
        var p = parts.find(function (x) {
          return x.type === t;
        });
        return p ? p.value : '';
      };
      return g('year') + '-' + g('month') + '-' + g('day') + ' ' + g('hour') + ':' + g('minute') + ':' + g('second') + ' JST';
    } catch (_e2) {
      return d.toISOString();
    }
  }

  function metaAgeHours(meta) {
    if (!meta || !meta.at) return null;
    var t = Date.parse(meta.at);
    if (!Number.isFinite(t)) return null;
    return (Date.now() - t) / (3600 * 1000);
  }

  function isStaleMeta(meta) {
    var h = metaAgeHours(meta);
    return h != null && h > STALE_HOURS;
  }

  function normalizeUserName(name) {
    return String(name || '')
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function recordsSame(existing, payload) {
    return (
      String((existing.user_name && existing.user_name.value) || '').trim() === payload.user_name.value &&
      String((existing.dept_name && existing.dept_name.value) || '').trim() === payload.dept_name.value &&
      String((existing.group_name && existing.group_name.value) || '').trim() === payload.group_name.value &&
      String((existing.employment_status && existing.employment_status.value) || '') ===
        String((payload.employment_status && payload.employment_status.value) || '') &&
      String((existing.source595_id && existing.source595_id.value) || '') ===
        String((payload.source595_id && payload.source595_id.value) || '')
    );
  }

  function planSync595To698(rows595, rows698) {
    var idToEmp698 = new Map();
    var nameTo595Id = new Map();
    var nameTo698Rows = new Map();
    var keys595 = new Set();
    var keys698 = new Set();
    var i;
    var j;

    for (i = 0; i < rows595.length; i++) {
      var r595m = rows595[i];
      var id595m = String((r595m.$id && r595m.$id.value) || '');
      var name595 = normalizeUserName(r595m.user_name && r595m.user_name.value);
      if (name595) nameTo595Id.set(name595, id595m);
      keys595.add(normalizeEmployeeKey(r595m.user_name && r595m.user_name.value, r595m.dept_name && r595m.dept_name.value));
    }

    for (j = 0; j < rows698.length; j++) {
      var r698m = rows698[j];
      var id698m = String((r698m.$id && r698m.$id.value) || '');
      idToEmp698.set(id698m, r698m);
      keys698.add(normalizeEmployeeKey(r698m.user_name && r698m.user_name.value, r698m.dept_name && r698m.dept_name.value));
      var name698m = normalizeUserName(r698m.user_name && r698m.user_name.value);
      if (!nameTo698Rows.has(name698m)) nameTo698Rows.set(name698m, []);
      nameTo698Rows.get(name698m).push(r698m);
    }

    var toPost = [];
    var toPut = [];
    var toDelete = [];
    var claimed698Ids = new Set();
    var skip = 0;

    for (i = 0; i < rows595.length; i++) {
      var r595 = rows595[i];
      var id595 = String((r595.$id && r595.$id.value) || '');
      var payload = toEmployeeRecord(r595);
      var existing = idToEmp698.get(id595);

      if (!existing) {
        var name595Lookup = normalizeUserName(r595.user_name && r595.user_name.value);
        var candidates = (nameTo698Rows.get(name595Lookup) || []).filter(function (r) {
          return !claimed698Ids.has(String((r.$id && r.$id.value) || ''));
        });
        if (candidates.length === 1) {
          existing = candidates[0];
        } else if (candidates.length > 1) {
          existing = candidates[0];
          for (var c = 0; c < candidates.length; c++) {
            if (recordsSame(candidates[c], payload)) {
              existing = candidates[c];
              break;
            }
          }
        }
      }

      if (!existing) {
        toPost.push(payload);
        continue;
      }

      claimed698Ids.add(String((existing.$id && existing.$id.value) || ''));

      if (recordsSame(existing, payload)) {
        skip += 1;
        continue;
      }
      toPut.push({
        id: existing.$id.value,
        revision: existing.$revision.value,
        record: payload,
      });
    }

    for (j = 0; j < rows698.length; j++) {
      var r698 = rows698[j];
      var id698 = String((r698.$id && r698.$id.value) || '');
      if (claimed698Ids.has(id698)) continue;
      var name698 = normalizeUserName(r698.user_name && r698.user_name.value);
      var canonical595Id = nameTo595Id.get(name698);
      if (canonical595Id && canonical595Id !== id698) {
        toDelete.push({ id: r698.$id.value, revision: r698.$revision.value });
      }
    }

    var drift698Only = 0;
    keys698.forEach(function (k) {
      if (!keys595.has(k)) drift698Only += 1;
    });

    return {
      toPost: toPost,
      toPut: toPut,
      toDelete: toDelete,
      stats: {
        source595: rows595.length,
        existingEmp: rows698.length,
        toPost: toPost.length,
        toPut: toPut.length,
        toDelete: toDelete.length,
        skipUnchanged: skip,
        mirrorTotal: rows698.length + toPost.length - toDelete.length,
      },
      drift: {
        drift698Only: drift698Only,
        drift595Only: 0,
        warn: drift698Only > 0 || toDelete.length > 0,
      },
    };
  }

  function normalizeEmployeeKey(name, dept) {
    var n = String(name || '')
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    var d = String(dept || '')
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return d + '\u0001' + n;
  }

  function toEmployeeRecord(row595) {
    var rec = {
      user_name: { value: String((row595.user_name && row595.user_name.value) || '').trim() },
      dept_name: { value: String((row595.dept_name && row595.dept_name.value) || '').trim() },
      group_name: { value: String((row595.group_name && row595.group_name.value) || '').trim() },
    };
    var st = row595.employment_status && row595.employment_status.value;
    if (st) rec.employment_status = { value: st };
    if (row595.$id && row595.$id.value != null && row595.$id.value !== '') {
      rec.source595_id = { value: String(row595.$id.value) };
    }
    return rec;
  }

  /** 595 一覧と同じ並び（source595_id 昇順）。在籍フィルタは通常デフォルト（在籍のみ） */
  function escapeForQuery698(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function build698EmpFilterClause(empFilter) {
    if (empFilter === 'active') {
      return 'employment_status in ("' + escapeForQuery698(EMP_ACTIVE) + '")';
    }
    if (empFilter === 'retired') {
      return 'employment_status in ("' + escapeForQuery698(EMP_RETIRED) + '")';
    }
    return '';
  }

  function parse698EmpFilterFromQuery(q) {
    var s = String(q || '');
    if (/employment_status\s+in\s*\(\s*"退職"\s*\)/i.test(s)) return 'retired';
    if (/employment_status\s+in\s*\(\s*"在籍"\s*\)/i.test(s)) return 'active';
    return null;
  }

  function get698EmpFilterIntent(q) {
    var fromQ = parse698EmpFilterFromQuery(q);
    if (fromQ === 'active' || fromQ === 'retired') return fromQ;
    try {
      var ss = sessionStorage.getItem(STORAGE_KEY_698_EMP);
      if (ss === 'all' || ss === 'active' || ss === 'retired') return ss;
    } catch (_eSs) {
      /* noop */
    }
    return 'active';
  }

  function save698EmpFilterSession698(empFilter) {
    try {
      sessionStorage.setItem(STORAGE_KEY_698_EMP, String(empFilter || 'active'));
    } catch (_eSs) {
      /* noop */
    }
  }

  function navigate698IndexQuery(empFilter) {
    save698EmpFilterSession698(empFilter);
    var u;
    try {
      u = new URL(location.href);
    } catch (_eUrl) {
      return;
    }
    var filterClause = build698EmpFilterClause(empFilter);
    var nextQ = (filterClause ? filterClause + ' ' : '') + 'order by source595_id asc';
    u.searchParams.set('query', nextQ);
    location.replace(u.toString());
  }

  function ensure698IndexDefaultView() {
    var u;
    try {
      u = new URL(location.href);
    } catch (_e) {
      return false;
    }
    var q = String(u.searchParams.get('query') || '').trim();
    if (/order by/i.test(q) && !SORT595_QUERY_RE.test(q)) return false;

    var fromQ = parse698EmpFilterFromQuery(q);
    if (fromQ === 'active' || fromQ === 'retired') {
      if (SORT595_QUERY_RE.test(q)) return false;
      var baseFiltered = q.replace(/\s*order by[\s\S]*$/i, '').trim();
      u.searchParams.set('query', (baseFiltered ? baseFiltered + ' ' : '') + 'order by source595_id asc');
      location.replace(u.toString());
      return true;
    }

    var intent = get698EmpFilterIntent(q);
    var filterClause = build698EmpFilterClause(intent);
    var nextQ = (filterClause ? filterClause + ' ' : '') + 'order by source595_id asc';
    if (q === nextQ) return false;

    if (intent === 'all') {
      if (SORT595_QUERY_RE.test(q) && !q.replace(/\s*order by[\s\S]*$/i, '').trim()) {
        return false;
      }
    }

    u.searchParams.set('query', nextQ);
    location.replace(u.toString());
    return true;
  }

  function sync698EmpFilterButtons(wrap, activeValue) {
    if (!wrap) return;
    wrap.querySelectorAll('[data-698-emp-filter]').forEach(function (btn) {
      var on = btn.getAttribute('data-698-emp-filter') === activeValue;
      btn.classList.toggle('active', on);
      btn.style.background = on ? '#059669' : '#fff';
      btn.style.color = on ? '#fff' : '';
      btn.style.borderColor = on ? '#059669' : '#cbd5e1';
      btn.style.fontWeight = on ? '700' : '';
    });
  }

  function mount698EmpFilterBar() {
    var q = '';
    try {
      q = String(new URL(location.href).searchParams.get('query') || '').trim();
    } catch (_eQ) {
      q = '';
    }
    var current = parse698EmpFilterFromQuery(q);
    if (current === null) current = get698EmpFilterIntent(q);

    var existing = document.getElementById(FILTER_WRAP_ID);
    if (existing) {
      sync698EmpFilterButtons(existing, current);
      return;
    }
    var space = getHeaderSpace();
    if (!space) return;

    var wrap = document.createElement('div');
    wrap.id = FILTER_WRAP_ID;
    wrap.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px;padding:8px 12px;' +
      'background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;';

    var label = document.createElement('span');
    label.style.cssText = 'font-weight:600;color:#475569;white-space:nowrap;';
    label.textContent = '在籍:';
    wrap.appendChild(label);

    function mkBtn(text, value) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('data-698-emp-filter', value);
      b.style.cssText =
        'padding:6px 14px;font-size:13px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;';
      b.addEventListener('click', function () {
        sync698EmpFilterButtons(wrap, value);
        navigate698IndexQuery(value);
      });
      return b;
    }

    wrap.appendChild(mkBtn('在籍', 'active'));
    wrap.appendChild(mkBtn('退職', 'retired'));
    wrap.appendChild(mkBtn('すべて', 'all'));
    sync698EmpFilterButtons(wrap, current);

    var banner = document.getElementById(BANNER_ID);
    if (banner && banner.parentNode === space) {
      if (banner.nextSibling) {
        space.insertBefore(wrap, banner.nextSibling);
      } else {
        space.appendChild(wrap);
      }
    } else if (space.firstChild) {
      space.insertBefore(wrap, space.firstChild);
    } else {
      space.appendChild(wrap);
    }
  }

  function ensure698IndexSortLike595() {
    return ensure698IndexDefaultView();
  }

  function getAllRecords(appId, fields, filterQuery) {
    var all = [];
    var limit = 500;
    var offset = 0;
    var base = String(filterQuery || '').trim();

    function page() {
      var query = (base ? base + ' ' : '') + 'order by $id asc limit ' + limit + ' offset ' + offset;
      return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: appId,
        query: query,
        fields: fields,
      }).then(function (resp) {
        var batch = resp.records || [];
        for (var i = 0; i < batch.length; i++) all.push(batch[i]);
        if (batch.length < limit) return all;
        offset += limit;
        return page();
      });
    }
    return page();
  }

  function fetchCommonSettingsRecord() {
    return kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
      app: SETTINGS_APP_ID,
      query: 'record_kind in ("共通設定") order by $id asc limit 1',
      fields: ['$id', 'sync595_meta'],
    }).then(function (resp) {
      return (resp.records || [])[0] || null;
    });
  }

  function writeSync595Meta(meta) {
    return fetchCommonSettingsRecord().then(function (rec) {
      if (!rec) throw new Error('697 共通設定レコードがありません');
      return kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
        app: SETTINGS_APP_ID,
        id: rec.$id.value,
        record: { sync595_meta: { value: JSON.stringify(meta) } },
      });
    });
  }

  function buildSync595MetaFromStats(ok, stats, drift, error) {
    return {
      at: new Date().toISOString(),
      atDisplay: formatJstNow(),
      ok: Boolean(ok),
      source595: stats ? stats.source595 : null,
      existingBefore: stats ? stats.existingEmp : null,
      added: stats ? stats.toPost : null,
      updated: stats ? stats.toPut : null,
      deleted: stats ? stats.toDelete : null,
      unchanged: stats ? stats.skipUnchanged : null,
      mirrorTotal: stats ? stats.mirrorTotal : null,
      drift698Only: drift ? drift.drift698Only : null,
      drift595Only: drift ? drift.drift595Only : null,
      warn: drift ? Boolean(drift.warn) : false,
      error: error ? String(error).slice(0, 2000) : null,
    };
  }

  function run595To698SyncInBrowser() {
    var employeeAppId = kintone.app.getId();

    return getAllRecords(APP595, FIELDS_595, '')
      .then(function (rows595) {
        return getAllRecords(employeeAppId, FIELDS_EMP, '').then(function (rowsEmp) {
          var plan = planSync595To698(rows595, rowsEmp);
          var toPost = plan.toPost;
          var toPut = plan.toPut;
          var toDelete = plan.toDelete;
          var stats = plan.stats;
          var CHUNK = 100;
          var postChain = Promise.resolve();

          for (var pi = 0; pi < toPost.length; pi += CHUNK) {
            (function (start) {
              postChain = postChain.then(function () {
                return kintone.api(kintone.api.url('/k/v1/records', true), 'POST', {
                  app: employeeAppId,
                  records: toPost.slice(start, start + CHUNK),
                });
              });
            })(pi);
          }

          return postChain.then(function () {
            var putChain = Promise.resolve();
            for (var u = 0; u < toPut.length; u++) {
              (function (item) {
                putChain = putChain.then(function () {
                  return kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                    app: employeeAppId,
                    id: item.id,
                    revision: item.revision,
                    record: item.record,
                  });
                });
              })(toPut[u]);
            }
            return putChain.then(function () {
              var deleteChain = Promise.resolve();
              for (var di = 0; di < toDelete.length; di += CHUNK) {
                (function (startDel) {
                  deleteChain = deleteChain.then(function () {
                    var ids = toDelete.slice(startDel, startDel + CHUNK).map(function (d) {
                      return d.id;
                    });
                    if (!ids.length) return null;
                    return kintone.api(kintone.api.url('/k/v1/records', true), 'DELETE', {
                      app: employeeAppId,
                      ids: ids,
                    });
                  });
                })(di);
              }
              return deleteChain.then(function () {
                var drift = { drift698Only: 0, drift595Only: 0, warn: false };
                var finalStats = Object.assign({}, stats, { mirrorTotal: rows595.length });
                return writeSync595Meta(buildSync595MetaFromStats(true, finalStats, drift, null)).then(function () {
                  return buildSync595MetaFromStats(true, finalStats, drift, null);
                });
              });
            });
          });
        });
      });
  }

  function bannerTheme(meta) {
    if (!meta) {
      return {
        bg: '#fffbeb',
        border: '#fbbf24',
        titleColor: '#92400e',
        bodyColor: '#78350f',
        headline: '595同期情報：未取得',
      };
    }
    if (meta.ok === false) {
      return {
        bg: '#fef2f2',
        border: '#f87171',
        titleColor: '#991b1b',
        bodyColor: '#7f1d1d',
        headline: '595社員マスタ → 社員マスタ（698）同期：失敗',
      };
    }
    if (meta.warn || isStaleMeta(meta)) {
      return {
        bg: '#fffbeb',
        border: '#f59e0b',
        titleColor: '#92400e',
        bodyColor: '#78350f',
        headline: '595社員マスタ → 社員マスタ（698）同期：成功（要確認）',
      };
    }
    return {
      bg: '#ecfdf5',
      border: '#34d399',
      titleColor: '#065f46',
      bodyColor: '#047857',
      headline: '595社員マスタ → 社員マスタ（698）同期：成功',
    };
  }

  function driftWarningHtml(meta) {
    if (!meta) return '';
    var parts = [];
    if (isStaleMeta(meta)) {
      var h = metaAgeHours(meta);
      parts.push(
        '<strong style="color:#b45309">⚠ 同期が ' +
          (h != null ? Math.floor(h) : '?') +
          ' 時間以上更新されていません。</strong> 日次タスクまたは手動同期を実行してください。'
      );
    }
    if (Number(meta.drift698Only) > 0) {
      parts.push(
        '<strong style="color:#b45309">⚠ 698 のみ存在（595 に無いキー）: ' +
          fmtNum(meta.drift698Only) +
          ' 件</strong> — 所属・氏名変更の残存等。698 からの自動削除は行いません。'
      );
    }
    if (Number(meta.drift595Only) > 0) {
      parts.push(
        '<strong style="color:#b45309">⚠ 595 のみ（698 未反映）: ' +
          fmtNum(meta.drift595Only) +
          ' 件</strong> — 手動同期を実行してください。'
      );
    }
    if (!parts.length) return '';
    return '<div style="margin-top:8px;padding:8px 10px;background:rgba(245,158,11,.12);border-radius:8px">' + parts.join('<br>') + '</div>';
  }

  function syncBannerHtml(meta, syncBusy) {
    var theme = bannerTheme(meta);
    var box =
      'border-radius:12px;padding:14px 18px;margin:0 0 14px;box-shadow:0 1px 4px rgba(15,23,42,.06);font-size:14px;line-height:1.55';
    var body;

    if (!meta) {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">697 設定マスタの共通設定に同期メタがまだ記録されていません。' +
        '下の <strong>595→698 手動同期</strong> を実行してください。</span>';
    } else if (meta.ok === false) {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">' +
        '<strong>最終試行:</strong> ' +
        esc(meta.atDisplay || meta.at || '—') +
        '<br>' +
        (meta.error ? '<strong>エラー:</strong> ' + esc(meta.error) + '<br>' : '') +
        '※ 一覧のデータは<strong>前回成功時</strong>のミラーです。</span>';
    } else {
      body =
        '<span style="color:' +
        theme.bodyColor +
        '">' +
        '<strong>最終同期:</strong> ' +
        esc(meta.atDisplay || meta.at || '—') +
        '<br>' +
        '<strong>新規</strong> ' +
        fmtNum(meta.added) +
        ' 件 / <strong>更新</strong> ' +
        fmtNum(meta.updated) +
        ' 件' +
        (Number(meta.deleted) > 0 ? ' / <strong>重複削除</strong> ' + fmtNum(meta.deleted) + ' 件' : '') +
        ' / <strong>変更なし</strong> ' +
        fmtNum(meta.unchanged) +
        ' 件' +
        '<br>' +
        '<strong>595</strong> ' +
        fmtNum(meta.source595) +
        ' 件 → <strong>ミラー（698）</strong> ' +
        fmtNum(meta.mirrorTotal) +
        ' 件</span>';
    }

    body += driftWarningHtml(meta);

    var btnDisabled = syncBusy ? ' disabled' : '';
    var btnLabel = syncBusy ? '同期中…' : '595→698 手動同期';
    var btn =
      '<div style="margin-top:12px">' +
      '<button type="button" id="' +
      BTN_SYNC_ID +
      '" style="padding:8px 16px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px"' +
      btnDisabled +
      '>' +
      btnLabel +
      '</button>' +
      '<span style="margin-left:10px;font-size:12px;color:#64748b">管理者操作 — 595 を 698 に反映し 697 に記録します</span>' +
      '</div>';

    var note =
      '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(15,23,42,.12);font-size:0.88em;color:#475569">' +
      'このアプリは <strong>595 社員マスタの読み取り専用ミラー</strong> です。レコードの手動追加・編集は行わないでください。' +
      '（BUILD: ' +
      esc(BUILD) +
      '）</div>';

    return (
      '<div id="' +
      BANNER_ID +
      '" style="background:' +
      theme.bg +
      ';border:2px solid ' +
      theme.border +
      ';' +
      box +
      '">' +
      '<strong style="color:' +
      theme.titleColor +
      ';font-size:1.05em">' +
      theme.headline +
      '</strong><br>' +
      body +
      btn +
      note +
      '</div>'
    );
  }

  function mountBanner(meta, syncBusy) {
    var space = getHeaderSpace();
    if (!space) return;
    var existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();
    var wrap = document.createElement('div');
    wrap.innerHTML = syncBannerHtml(meta, syncBusy);
    var banner = wrap.firstElementChild;
    if (!banner) return;
    if (space.firstChild) {
      space.insertBefore(banner, space.firstChild);
    } else {
      space.appendChild(banner);
    }
    var btn = document.getElementById(BTN_SYNC_ID);
    if (btn && !syncBusy) {
      btn.addEventListener('click', onManualSyncClick);
    }
  }

  function onManualSyncClick() {
    if (
      !window.confirm(
        '595 社員マスタの内容を 698 に反映します。\n（同一 $id 行を更新。所属変更の誤重複レコードは削除）\n\n実行しますか？'
      )
    ) {
      return;
    }
    mountBanner(null, true);
    run595To698SyncInBrowser()
      .then(function (meta) {
        mountBanner(meta, false);
        window.alert(
          '同期完了\n新規 ' +
            fmtNum(meta.added) +
            ' / 更新 ' +
            fmtNum(meta.updated) +
            (Number(meta.deleted) > 0 ? ' / 重複削除 ' + fmtNum(meta.deleted) : '') +
            (meta.warn ? '\n\n⚠ 要確認項目あり — バナーを確認してください' : '')
        );
        window.location.reload();
      })
      .catch(function (e) {
        console.warn('[bi-698 manual sync]', e);
        var msg = e && e.message ? e.message : String(e);
        writeSync595Meta(buildSync595MetaFromStats(false, null, { warn: true }, msg))
          .catch(function () {
            /* noop */
          })
          .finally(function () {
            fetchCommonSyncMeta().then(function (m) {
              mountBanner(m, false);
            });
            window.alert('同期に失敗しました。\n' + msg);
          });
      });
  }

  function fetchCommonSyncMeta() {
    return fetchCommonSettingsRecord().then(function (rec) {
      if (!rec) return null;
      return parseSyncMeta(rec.sync595_meta && rec.sync595_meta.value);
    });
  }

  kintone.events.on(['app.record.index.show', 'mobile.app.record.index.show'], function (event) {
    if (ensure698IndexSortLike595()) {
      return event;
    }
    fetchCommonSyncMeta()
      .then(function (meta) {
        mountBanner(meta, false);
        mount698EmpFilterBar();
      })
      .catch(function (e) {
        console.warn('[bi-698 sync banner]', e);
        mountBanner(null, false);
        mount698EmpFilterBar();
      });
    return event;
  });
})();
