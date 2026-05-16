/**
 * ユーザサポート件数日次（682）
 * - 午前／午後の対応内容: 1 行 1 件。保存直前に非空行数を am_count / pm_count へ反映（空は 0）。
 * - am_count / pm_count: 新規・編集画面で disabled（入力者は数値を直接変更不可）。
 * - 記録日: 新規作成時、未入力なら Asia/Tokyo の当日を既定（対応日）。**同一暦日は 1 レコードのみ**（`create.submit` / `edit.submit` で REST 重複検査。同時保存の競合はサーバ側ユニークが無い限り残り得る）。
 *
 *   npm run deploy:682
 *
 * 一覧: 選択暦月（JST・既定は今月）の record_date 欠日・重複をヘッダに表示（§6.2 / §6.2.1）。前月／次月／今月に戻す。
 * 直近7暦月（日合計）の REST 棒: **[683 ダッシュ](https://jbis-kintone.cybozu.com/k/683/)** で閲覧するため **682 では出さない**（`SHOW_ROLLING_7M_ON_APP682 === false`・**2026-05-12 CEO 重要確認**）。682 レポートの **kintone 標準グラフ**はアプリのグラフ設定で別管理。
 * 対応日表示: 一覧・詳細は yyyy/mm/dd(曜)。新規・編集は値は YYYY-MM-DD のまま、補助行で同形式。
 */
(function () {
  'use strict';

  const BUILD = '2026-05-12-682-hide-rolling7m-dashboard683';
  /**
   * **true**: 682 一覧ヘッダ・レポート画面に 7 暦月 REST 棒を表示。
   * **false**: 非表示（月次傾向は **[683 ダッシュ](https://jbis-kintone.cybozu.com/k/683/)** で閲覧・**2026-05-12 CEO 重要確認**）。
   */
  const SHOW_ROLLING_7M_ON_APP682 = false;
  /** 一覧ヘッダで確認する暦年・月（JST）のセッション保持 */
  const SESSION_YM_KEY = 'user_support_682_banner_cal_ym_v1';
  const FC_DATE = 'record_date';
  const FC_DAY_TOTAL = 'day_total';
  /** §5.1 REST グラフと同名（グラフ画面で 0 埋め補助表示の対象判定に使用） */
  const GRAPH_KEY_MONTHLY = '682_day_total_monthly';
  const FC_AM_TEXT = 'am_correspondence';
  const FC_PM_TEXT = 'pm_correspondence';
  const FC_AM = 'am_count';
  const FC_PM = 'pm_count';

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function todayJstYmd() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    const m = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    const d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + m + '-' + d;
  }

  /** JST の「昨日」を YYYY-MM-DD（当日の前日・暦上） */
  function yesterdayJstYmd() {
    const t = todayJstYmd();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!m) return t;
    const utcNoon = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0) - 86400000;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(utcNoon));
    const y = parts.find(function (p) {
      return p.type === 'year';
    }).value;
    const mo = parts.find(function (p) {
      return p.type === 'month';
    }).value;
    const d = parts.find(function (p) {
      return p.type === 'day';
    }).value;
    return y + '-' + mo + '-' + d;
  }

  /** ISO YYYY-MM-DD → 表示用 yyyy/mm/dd(曜)（ja-JP・JST） */
  function formatYmdSlashWday(isoYmd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd);
    if (!m) return isoYmd;
    const utcNoon = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    const wd = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
    }).format(new Date(utcNoon));
    return m[1] + '/' + m[2] + '/' + m[3] + '(' + wd + ')';
  }

  /**
   * 一覧: 対応日セルを yyyy/mm/dd(曜) に揃える。
   * event.records と getFieldElements の順は kintone 既定で一致する想定。件数差は短い方でループ。
   */
  function formatRecordDateOnIndex(event) {
    const recs = event.records;
    if (!recs || !recs.length) return;
    const els = kintone.app.getFieldElements(FC_DATE);
    if (!els || !els.length) return;
    const n = Math.min(recs.length, els.length);
    for (let i = 0; i < n; i += 1) {
      const v = recs[i][FC_DATE] && recs[i][FC_DATE].value;
      if (v == null || String(v).trim() === '') continue;
      const iso = String(v).slice(0, 10);
      els[i].textContent = formatYmdSlashWday(iso);
    }
  }

  /** 詳細: 対応日を yyyy/mm/dd(曜) で表示（実値は変更しない） */
  function formatRecordDateOnDetail(event) {
    const rec = event.record;
    const v = rec[FC_DATE] && rec[FC_DATE].value;
    if (v == null || String(v).trim() === '') return;
    const iso = String(v).slice(0, 10);
    const el = kintone.app.record.getFieldElement(FC_DATE);
    if (!el) return;
    const inner =
      el.querySelector('.control-value-gaia') ||
      el.querySelector('.control-value-' + FC_DATE) ||
      el.querySelector('[class*="control-value"]');
    const target = inner || el;
    target.textContent = formatYmdSlashWday(iso);
  }

  /** 新規・編集: 日付入力はそのまま。補助行のみ yyyy/mm/dd(曜)（保存値は触らない） */
  function syncRecordDateHelperOnForm(record) {
    const el = kintone.app.record.getFieldElement(FC_DATE);
    if (!el) return;
    let helper = el.querySelector('.js-user-support682-record-date-fmt');
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'js-user-support682-record-date-fmt';
      helper.style.marginTop = '4px';
      helper.style.fontSize = '13px';
      helper.style.color = '#333';
      el.appendChild(helper);
    }
    const v = record[FC_DATE] && record[FC_DATE].value;
    if (v == null || String(v).trim() === '') {
      helper.textContent = '';
      return;
    }
    const iso = String(v).slice(0, 10);
    helper.textContent = '対応日: ' + formatYmdSlashWday(iso);
  }

  /** 現在の暦年・月（1–12）を JST で返す */
  function jstCalYearMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    const y = parseInt(
      parts.find(function (p) {
        return p.type === 'year';
      }).value,
      10,
    );
    const mo = parseInt(
      parts.find(function (p) {
        return p.type === 'month';
      }).value,
      10,
    );
    return { y: y, m: mo };
  }

  function addMonthsCal(year, month1to12, delta) {
    const idx = year * 12 + month1to12 - 1 + delta;
    return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
  }

  function readStoredYm() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_YM_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (
        o &&
        typeof o.y === 'number' &&
        typeof o.m === 'number' &&
        o.m >= 1 &&
        o.m <= 12 &&
        o.y >= 1970 &&
        o.y <= 2100
      ) {
        return { y: o.y, m: o.m };
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return null;
  }

  function writeStoredYm(y, m) {
    try {
      window.sessionStorage.setItem(SESSION_YM_KEY, JSON.stringify({ y: y, m: m }));
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  function clearStoredYm() {
    try {
      window.sessionStorage.removeItem(SESSION_YM_KEY);
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  /** 一覧バナーで集計する暦月（未選択時は JST 今月） */
  function effectiveViewYm() {
    const s = readStoredYm();
    if (s) return s;
    return jstCalYearMonth();
  }

  /** 暦月 month1to12 の日数 */
  function calendarDaysInMonth(year, month1to12) {
    return new Date(year, month1to12, 0).getDate();
  }

  function monthQueryRange(year, month1to12) {
    const dim = calendarDaysInMonth(year, month1to12);
    const m = pad2(month1to12);
    const from = year + '-' + m + '-01';
    const to = year + '-' + m + '-' + pad2(dim);
    const query =
      'record_date >= "' + from + '" and record_date <= "' + to + '" order by record_date asc';
    return { from: from, to: to, dim: dim, query: query };
  }

  /**
   * JST 今月を末尾とする 7 暦月（先頭＝今月の 6 暦月前）— `scripts/user-support-682-ensure-monthly-bar-graph.mjs` と同じ窓。
   * @returns {{ query: string, monthSlots: { key: string, label: string }[] }}
   */
  function rollingSevenMonthWindow682() {
    const endYm = jstCalYearMonth();
    const startYm = addMonthsCal(endYm.y, endYm.m, -6);
    const from = startYm.y + '-' + pad2(startYm.m) + '-01';
    const dim = calendarDaysInMonth(endYm.y, endYm.m);
    const to = endYm.y + '-' + pad2(endYm.m) + '-' + pad2(dim);
    const query =
      'record_date >= "' +
      from +
      '" and record_date <= "' +
      to +
      '" order by record_date asc';
    const monthSlots = [];
    for (let delta = -6; delta <= 0; delta += 1) {
      const ym = addMonthsCal(endYm.y, endYm.m, delta);
      monthSlots.push({ key: ym.y + '-' + pad2(ym.m), label: ym.y + '/' + pad2(ym.m) });
    }
    return { query: query, monthSlots: monthSlots };
  }

  /** offset ループで query に合致するレコードを fields 指定で全件取得 */
  function fetchRecordsFieldsForQuery(app, query, fields) {
    const all = [];
    let offset = 0;
    const limit = 500;

    function step() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: String(app),
          query: query,
          fields: fields,
          totalCount: true,
          limit: limit,
          offset: offset,
        })
        .then(function (resp) {
          const batch = resp.records || [];
          for (let i = 0; i < batch.length; i += 1) {
            all.push(batch[i]);
          }
          const total = Number(resp.totalCount != null ? resp.totalCount : all.length);
          offset += batch.length;
          if (batch.length > 0 && offset < total) {
            return step();
          }
          return all;
        });
    }

    return step();
  }

  /**
   * レコード群を暦月キー YYYY-MM ごとに日合計を集約（欠損キーは呼び出し側で 0 扱い）。
   * 同一 record_date に複数行があるときは day_total の最大を 1 日分として加算し、重複行による二重計上を避ける。
   */
  function sumDayTotalByYearMonth(records) {
    /** @type {Record<string, number>} */
    const byYmd = {};
    for (let i = 0; i < records.length; i += 1) {
      const rec = records[i];
      const dv = rec[FC_DATE] && rec[FC_DATE].value;
      if (!dv) continue;
      const ymd = String(dv).slice(0, 10);
      const cell = rec[FC_DAY_TOTAL];
      let n = 0;
      if (cell && cell.value != null && String(cell.value).trim() !== '') {
        n = Number(cell.value);
        if (!Number.isFinite(n)) n = 0;
      }
      const prev = byYmd[ymd];
      if (prev == null || n > prev) {
        byYmd[ymd] = n;
      }
    }
    const sums = {};
    for (const ymd in byYmd) {
      if (!Object.prototype.hasOwnProperty.call(byYmd, ymd)) continue;
      const ymk = ymd.slice(0, 7);
      sums[ymk] = (sums[ymk] || 0) + byYmd[ymd];
    }
    return sums;
  }

  /**
   * @param {{ key: string, label: string }[]} monthSlots
   * @param {Record<string, number>} sums
   * @param {{ compact?: boolean }} opt
   */
  function buildRolling7mBarsEl(monthSlots, sums, opt) {
    const compact = opt && opt.compact;
    const wrap = document.createElement('div');
    wrap.id = 'user682-rolling-7m-wrap';
    wrap.style.margin = compact ? '6px 0 0 0' : '10px 0 12px 0';
    wrap.style.padding = compact ? '8px 10px' : '12px 14px';
    wrap.style.border = '1px solid #ccc';
    wrap.style.borderRadius = '6px';
    wrap.style.background = '#fafafa';
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    title.style.fontSize = compact ? '12px' : '13px';
    title.textContent = '直近7暦月（日合計・データがない月は0）';
    wrap.appendChild(title);

    const vals = [];
    for (let i = 0; i < monthSlots.length; i += 1) {
      const k = monthSlots[i].key;
      vals.push(sums[k] != null ? sums[k] : 0);
    }
    let maxVal = 1;
    for (let j = 0; j < vals.length; j += 1) {
      if (vals[j] > maxVal) maxVal = vals[j];
    }

    const barH = compact ? 64 : 88;
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-end';
    row.style.justifyContent = 'space-between';
    row.style.gap = compact ? '4px' : '6px';
    row.style.minHeight = compact ? '86px' : '110px';

    for (let i = 0; i < monthSlots.length; i += 1) {
      const col = document.createElement('div');
      col.style.flex = '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.minWidth = '0';

      const val = vals[i];
      const bar = document.createElement('div');
      bar.style.width = '100%';
      bar.style.maxWidth = compact ? '36px' : '42px';
      bar.style.margin = '0 auto';
      bar.style.height = Math.max(3, Math.round((barH * val) / maxVal)) + 'px';
      bar.style.background = '#2563eb';
      bar.style.borderRadius = '3px 3px 0 0';
      bar.title = monthSlots[i].label + ': ' + val + '件';

      const num = document.createElement('div');
      num.style.marginTop = '3px';
      num.style.fontSize = compact ? '11px' : '12px';
      num.style.fontWeight = '600';
      num.textContent = String(val);

      const lab = document.createElement('div');
      lab.style.marginTop = '1px';
      lab.style.fontSize = compact ? '10px' : '11px';
      lab.style.color = '#555';
      lab.textContent = monthSlots[i].label;

      col.appendChild(bar);
      col.appendChild(num);
      col.appendChild(lab);
      row.appendChild(col);
    }
    wrap.appendChild(row);
    return wrap;
  }

  function removeRolling7mDom() {
    const w = document.getElementById('user682-rolling-7m-wrap');
    if (w) w.remove();
  }

  function getReportIdFromUrl() {
    try {
      const u = new URL(window.location.href);
      const v = u.searchParams.get('report');
      if (v == null || v === '') return null;
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    } catch (e) {
      return null;
    }
  }

  function fetchReportMetaFor682() {
    return kintone
      .api(kintone.api.url('/k/v1/app/reports.json', true), 'GET', {
        app: kintone.app.getId(),
        lang: 'ja',
      })
      .then(function (resp) {
        const reps = (resp && resp.reports) || {};
        const g = reps[GRAPH_KEY_MONTHLY];
        if (!g || g.id == null) return null;
        return { id: Number(g.id) };
      });
  }

  /** 標準グラフは欠月を出せないため、同じ窓で REST 集計した棒を上段に表示（下段は kintone 標準のまま） */
  function installRolling7mOnReportPage() {
    if (Number(kintone.app.getId()) !== 682) return;
    if (!SHOW_ROLLING_7M_ON_APP682) return;
    const rid = getReportIdFromUrl();
    if (rid == null) return;
    fetchReportMetaFor682()
      .then(function (meta) {
        if (!meta || meta.id !== rid) return;
        const win = rollingSevenMonthWindow682();
        return fetchRecordsFieldsForQuery(
          kintone.app.getId(),
          win.query,
          [FC_DATE, FC_DAY_TOTAL],
        ).then(function (records) {
          const sums = sumDayTotalByYearMonth(records);
          removeRolling7mDom();
          const el = buildRolling7mBarsEl(win.monthSlots, sums, {});
          const anchor =
            document.querySelector('.gaia-argoui-app-report-body') ||
            document.querySelector('.contents-body') ||
            document.body;
          if (anchor.firstChild) {
            anchor.insertBefore(el, anchor.firstChild);
          } else {
            anchor.appendChild(el);
          }
        });
      })
      .catch(function (e) {
        console.error(BUILD, e);
      });
  }

  function recordDateYmd(rec) {
    const cell = rec[FC_DATE];
    if (!cell || cell.value == null) return '';
    return String(cell.value).slice(0, 10);
  }

  /** offset ループで当月の record_date のみ全取得（limit 500 超対策） */
  function fetchAllRecordDatesForQuery(app, query) {
    const all = [];
    let offset = 0;
    const limit = 500;

    function step() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: String(app),
          query: query,
          fields: [FC_DATE],
          totalCount: true,
          limit: limit,
          offset: offset,
        })
        .then(function (resp) {
          const batch = resp.records || [];
          for (let i = 0; i < batch.length; i += 1) {
            all.push(batch[i]);
          }
          const total = Number(resp.totalCount != null ? resp.totalCount : all.length);
          offset += batch.length;
          if (batch.length > 0 && offset < total) {
            return step();
          }
          return { records: all, totalCount: total };
        });
    }

    return step();
  }

  /**
   * 欠日: 当月 1 日〜JST 昨日（当月内にクリップ）のみ母数。
   * 重複: クエリ範囲（暦月フル）内の全日で検出。
   */
  function analyzeMonthRecords(records, year, month1to12, dim) {
    /** @type {Record<string, number>} */
    const counts = {};
    for (let i = 0; i < records.length; i += 1) {
      const k = recordDateYmd(records[i]);
      if (!k) continue;
      counts[k] = (counts[k] || 0) + 1;
    }
    const monthStart = year + '-' + pad2(month1to12) + '-01';
    const monthEnd = year + '-' + pad2(month1to12) + '-' + pad2(dim);
    const yest = yesterdayJstYmd();
    let dueLast = null;
    if (yest >= monthStart) {
      dueLast = yest < monthEnd ? yest : monthEnd;
    }

    const missing = [];
    let N = 0;
    if (dueLast != null) {
      for (let d = 1; d <= dim; d += 1) {
        const dayStr = year + '-' + pad2(month1to12) + '-' + pad2(d);
        if (dayStr < monthStart || dayStr > dueLast) continue;
        N += 1;
        if (!counts[dayStr]) missing.push(dayStr);
      }
    }
    const M = N - missing.length;

    const dupInfo = [];
    const keys = Object.keys(counts).sort();
    for (let j = 0; j < keys.length; j += 1) {
      const key = keys[j];
      if (counts[key] > 1) {
        dupInfo.push(formatYmdSlashWday(key) + '×' + counts[key]);
      }
    }
    return { missing: missing, dupInfo: dupInfo, M: M, N: N };
  }

  /** 欠日・重複メッセージのみ描画（ツールバーは別） */
  function fillBannerMessages(container, payload) {
    if (!container) return;
    container.innerHTML = '';
    if (payload.error) {
      const root = document.createElement('div');
      root.id = 'user-support682-month-check';
      root.style.margin = '0 0 4px 0';
      root.style.padding = '10px 12px';
      root.style.borderRadius = '6px';
      root.style.fontSize = '13px';
      root.style.lineHeight = '1.55';
      root.style.background = '#fff3cd';
      root.style.border = '1px solid #856404';
      root.style.color = '#533f03';
      root.textContent = payload.error;
      container.appendChild(root);
      return;
    }
    const miss = payload.missing || [];
    const dup = payload.dupInfo || [];
    if (miss.length === 0 && dup.length === 0) {
      return;
    }
    const root = document.createElement('div');
    root.id = 'user-support682-month-check';
    root.style.margin = '0 0 4px 0';
    root.style.padding = '10px 12px';
    root.style.borderRadius = '6px';
    root.style.fontSize = '13px';
    root.style.lineHeight = '1.55';
    root.style.background = '#fdecea';
    root.style.border = '1px solid #f5c2c0';
    root.style.color = '#842029';
    const parts = [];
    if (miss.length && payload.N > 0) {
      const missFmt = miss
        .slice(0, 12)
        .map(function (x) {
          return formatYmdSlashWday(x);
        })
        .join(', ');
      parts.push(
        payload.M +
          ' / ' +
          payload.N +
          ' 日分が未入力です。入力をお願いします。（欠日: ' +
          missFmt +
          (miss.length > 12 ? ' …他' + (miss.length - 12) + '日' : '') +
          '）',
      );
    }
    if (dup.length) {
      parts.push(
        '同一記録日の重複があります。一覧で修正してください。（' +
          dup.slice(0, 8).join(', ') +
          (dup.length > 8 ? ' …他' + (dup.length - 8) + '件' : '') +
          '）',
      );
    }
    root.textContent = parts.join(' ');
    container.appendChild(root);
  }

  function refreshIndexMonthDashboard(app) {
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) {
      console.warn(BUILD, 'getHeaderSpaceElement is null');
      return;
    }
    const ym = effectiveViewYm();
    const jNow = jstCalYearMonth();
    const isNaturalThisMonth = ym.y === jNow.y && ym.m === jNow.m;

    header.innerHTML = '';
    const root = document.createElement('div');
    root.id = 'user-support682-dash-root';

    const tool = document.createElement('div');
    tool.style.display = 'flex';
    tool.style.alignItems = 'center';
    tool.style.flexWrap = 'wrap';
    tool.style.gap = '8px';
    tool.style.margin = '8px 12px 4px';
    tool.style.fontSize = '13px';

    const lab = document.createElement('span');
    lab.textContent = '欠日・重複の対象月（JST）: ';
    tool.appendChild(lab);

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '← 前月';
    prevBtn.setAttribute('aria-label', '前月');
    prevBtn.style.cursor = 'pointer';
    prevBtn.onclick = function () {
      const n = addMonthsCal(ym.y, ym.m, -1);
      writeStoredYm(n.y, n.m);
      refreshIndexMonthDashboard(app);
    };
    tool.appendChild(prevBtn);

    const spanYm = document.createElement('strong');
    spanYm.textContent = ym.y + '年' + ym.m + '月';
    tool.appendChild(spanYm);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = '次月 →';
    nextBtn.setAttribute('aria-label', '次月');
    nextBtn.style.cursor = 'pointer';
    nextBtn.onclick = function () {
      const n = addMonthsCal(ym.y, ym.m, 1);
      writeStoredYm(n.y, n.m);
      refreshIndexMonthDashboard(app);
    };
    tool.appendChild(nextBtn);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = '今月に戻す';
    resetBtn.style.cursor = 'pointer';
    resetBtn.disabled = isNaturalThisMonth && readStoredYm() == null;
    resetBtn.onclick = function () {
      clearStoredYm();
      refreshIndexMonthDashboard(app);
    };
    tool.appendChild(resetBtn);

    const msgHost = document.createElement('div');
    msgHost.id = 'user-support682-dash-messages';

    root.appendChild(tool);
    root.appendChild(msgHost);
    /** @type {HTMLElement | null} */
    var rollHost = null;
    if (SHOW_ROLLING_7M_ON_APP682) {
      rollHost = document.createElement('div');
      rollHost.id = 'user682-index-rolling7m-host';
      root.appendChild(rollHost);
    }
    header.appendChild(root);

    const range = monthQueryRange(ym.y, ym.m);

    if (SHOW_ROLLING_7M_ON_APP682) {
      const win7 = rollingSevenMonthWindow682();
      Promise.all([
        fetchAllRecordDatesForQuery(app, range.query),
        fetchRecordsFieldsForQuery(app, win7.query, [FC_DATE, FC_DAY_TOTAL]),
      ])
        .then(function (pair) {
          const res = pair[0];
          const rollRec = pair[1];
          const a = analyzeMonthRecords(res.records, ym.y, ym.m, range.dim);
          fillBannerMessages(msgHost, {
            missing: a.missing,
            dupInfo: a.dupInfo,
            M: a.M,
            N: a.N,
          });
          if (rollHost) {
            rollHost.innerHTML = '';
            const sums = sumDayTotalByYearMonth(rollRec);
            rollHost.appendChild(buildRolling7mBarsEl(win7.monthSlots, sums, { compact: true }));
          }
        })
        .catch(function (e) {
          console.error(BUILD, e);
          fillBannerMessages(msgHost, {
            error:
              '選択した月の記録日を確認できませんでした（通信または権限）。しばらくしてから再読込してください。',
          });
          if (rollHost) {
            rollHost.textContent =
              '直近7暦月の集計を表示できませんでした（通信または権限）。再読込してください。';
          }
        });
    } else {
      fetchAllRecordDatesForQuery(app, range.query)
        .then(function (res) {
          const a = analyzeMonthRecords(res.records, ym.y, ym.m, range.dim);
          fillBannerMessages(msgHost, {
            missing: a.missing,
            dupInfo: a.dupInfo,
            M: a.M,
            N: a.N,
          });
        })
        .catch(function (e) {
          console.error(BUILD, e);
          fillBannerMessages(msgHost, {
            error:
              '選択した月の記録日を確認できませんでした（通信または権限）。しばらくしてから再読込してください。',
          });
        });
    }
  }

  function countNonEmptyLines(raw) {
    const s = raw == null ? '' : String(raw);
    const lines = s.split(/\r\n|\n|\r/);
    let n = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (String(lines[i]).trim() !== '') n += 1;
    }
    return n;
  }

  function getText(rec, code) {
    const cell = rec[code];
    if (!cell || cell.value == null) return '';
    return String(cell.value);
  }

  /** 対応内容が空なら 0、あれば非空行数を am_count / pm_count に確定 */
  function applyCounts(record) {
    const amText = getText(record, FC_AM_TEXT);
    const pmText = getText(record, FC_PM_TEXT);

    if (record[FC_AM]) {
      record[FC_AM].value =
        String(amText).trim() === '' ? '0' : String(countNonEmptyLines(amText));
    }
    if (record[FC_PM]) {
      record[FC_PM].value =
        String(pmText).trim() === '' ? '0' : String(countNonEmptyLines(pmText));
    }
  }

  function ensureRecordDateOnCreate(record) {
    if (!record[FC_DATE]) return;
    const v = record[FC_DATE].value;
    if (v == null || String(v).trim() === '') {
      record[FC_DATE].value = todayJstYmd();
    }
  }

  /** 保存直前の記録日（YYYY-MM-DD） */
  function recordDateYmdForSubmit(record) {
    const cell = record[FC_DATE];
    if (!cell || cell.value == null) return '';
    return String(cell.value).trim().slice(0, 10);
  }

  /**
   * 同一 record_date の別レコードが存在する場合は保存を拒否（編集時は自レコードをクエリから除外）。
   * @returns {Promise<object>} event（event.error をセットし得る）
   */
  function assertUniqueRecordDateOnSubmit(event) {
    const ymd = recordDateYmdForSubmit(event.record);
    if (!ymd) {
      event.error = '記録日を入力してください。';
      return kintone.Promise.resolve(event);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      event.error = '記録日は YYYY-MM-DD 形式で入力してください。';
      return kintone.Promise.resolve(event);
    }

    const app = kintone.app.getId();
    let query = FC_DATE + ' = "' + ymd + '"';
    if (
      event.type === 'app.record.edit.submit' ||
      event.type === 'mobile.app.record.edit.submit'
    ) {
      const idCell = event.record.$id;
      const rid = idCell && idCell.value != null ? String(idCell.value).trim() : '';
      if (rid !== '' && /^\d+$/.test(rid)) {
        query += ' and $id != ' + rid;
      }
    }

    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: String(app),
      query: query,
      fields: ['$id'],
      totalCount: true,
      limit: 1,
    }).then(function (resp) {
      const total = Number(resp.totalCount != null ? resp.totalCount : 0);
      if (total > 0) {
        event.error =
          '記録日「' +
          ymd +
          '」のレコードは既にあります。1 暦日につき 1 件のみ登録できます。別の日付にするか、既存レコードを編集してください。';
      }
      return event;
    }).catch(function (e) {
      console.error(BUILD, e);
      event.error =
        '記録日の重複確認中にエラーが発生しました。通信状態を確認のうえ、しばらくしてから再試行してください。';
      return event;
    });
  }

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function (event) {
    try {
      const rec = event.record;
      if (rec[FC_AM]) rec[FC_AM].disabled = true;
      if (rec[FC_PM]) rec[FC_PM].disabled = true;

      if (event.type === 'app.record.create.show') {
        ensureRecordDateOnCreate(rec);
      }
      syncRecordDateHelperOnForm(rec);
    } catch (e) {
      console.error(BUILD, e);
    }
    return event;
  });

  kintone.events.on(
    ['app.record.create.change.' + FC_DATE, 'app.record.edit.change.' + FC_DATE],
    function (event) {
      try {
        syncRecordDateHelperOnForm(event.record);
      } catch (e) {
        console.error(BUILD, e);
      }
      return event;
    },
  );

  kintone.events.on(
    [
      'app.record.create.submit',
      'app.record.edit.submit',
      'mobile.app.record.create.submit',
      'mobile.app.record.edit.submit',
    ],
    function (event) {
      try {
        if (
          event.record[FC_AM_TEXT] &&
          event.record[FC_PM_TEXT] &&
          event.record[FC_AM] &&
          event.record[FC_PM]
        ) {
          applyCounts(event.record);
        }
        if (
          (event.type === 'app.record.create.submit' ||
            event.type === 'mobile.app.record.create.submit') &&
          event.record[FC_DATE]
        ) {
          ensureRecordDateOnCreate(event.record);
        }
      } catch (e) {
        console.error(BUILD, e);
        event.error =
          '対応内容から件数を反映できませんでした。画面を再読み込みして再試行してください。';
        return event;
      }

      if (Number(kintone.app.getId()) !== 682) {
        return event;
      }

      return assertUniqueRecordDateOnSubmit(event);
    },
  );

  kintone.events.on('app.record.detail.show', function (event) {
    try {
      if (Number(kintone.app.getId()) !== 682) return event;
      formatRecordDateOnDetail(event);
    } catch (e) {
      console.error(BUILD, e);
    }
    return event;
  });

  kintone.events.on('app.record.index.show', function (event) {
    try {
      const app = kintone.app.getId();
      if (Number(app) !== 682) {
        return event;
      }
      formatRecordDateOnIndex(event);
      refreshIndexMonthDashboard(app);
    } catch (e) {
      console.error(BUILD, e);
    }
    return event;
  });

  kintone.events.on(['app.report.show', 'mobile.app.report.show'], function (event) {
    try {
      if (Number(kintone.app.getId()) !== 682) {
        return event;
      }
      setTimeout(function () {
        installRolling7mOnReportPage();
      }, 450);
    } catch (e) {
      console.error(BUILD, e);
    }
    return event;
  });
})();
