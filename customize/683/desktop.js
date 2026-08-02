/**
 * ユーザサポート682ダッシュ（683）— Space 48 配置・682 をデータ正本とする閲覧専用ダッシュ（SPEC §6.1.1）
 *
 * 集計・欠日・重複のロジック正本: `customize/682/desktop.js`（本ファイルは初版コピー＋682 向け API 呼び出し。**月次・日次の日合計は暦日ごとに day_total を一度だけ計上**し 682 と整合）。
 * 共通化は SPEC §6.1.1 に従い次イテレーションで shared モジュール化予定。
 *
 *   npm run cio:preflight:683 -- --note "…"
 *   npm run deploy:683
 *
 * 中継ゼロ（閲覧・手修正・保存のみ）: `USER683_RELAY_ZERO_MODE = true`（既定）でブラウザの AI 生成ボタンを出さない。要約投入は **`npm run user683:sync-summaries:apply`**。
 * ブラウザから AI 生成する場合: `USER683_RELAY_ZERO_MODE = false` にして deploy し、`docs/runbooks/user683-claude-relay.md`（`USER683_CLAUDE_RELAY_ORG_DEFAULT` 等）。
 * 印刷報告用: 一覧「印刷報告用」→ブラウザ印刷（2枚構成・`@media print`）。
 */
(function () {
  'use strict';

  const BUILD = '2026-08-02-683-print-2sheet-fit-v9';
  /** `true`: グラフ直下に月次・週次コメント欄（kintone 要約キャッシュの表示・修正保存）。 */
  const USER683_SHOW_AI_SUMMARY_UI = true;
  /**
   * **中継ゼロ運用**（`true`）: 一覧では要約の閲覧・手修正・「コメントを保存」のみ。ブラウザから Claude 中継へはアクセスしない（生成ボタン非表示）。
   * 要約の投入・更新は `npm run user683:sync-summaries:apply`（タスクスケジューラ等）が kintone 要約キャッシュへ書き込む。`false` にすると週次・月次の AI 生成ボタンが出る（社内 HTTPS 中継 URL が必要）。
   */
  const USER683_RELAY_ZERO_MODE = true;
  const USER683_SHOW_CLAUDE_GENERATE_BTN = !USER683_RELAY_ZERO_MODE;
  /** データ正本アプリ（REST の app は常にここを指定） */
  const APP682 = 682;
  /** 683 一覧用（682 の `user_support_682_banner_cal_ym_v1` と衝突させない） */
  const SESSION_YM_KEY = 'user_support_683_banner_cal_ym_v1';
  const FC_DATE = 'record_date';
  const FC_DAY_TOTAL = 'day_total';
  const FC_AM = 'am_count';
  const FC_PM = 'pm_count';
  const FC_AM_TEXT = 'am_correspondence';
  const FC_PM_TEXT = 'pm_correspondence';
  /** 中継 POST の JSON 肥大防止のため日次コーパス上限 */
  const RELAY_DAY_CORPUS_MAX_LEN = 3200;
  /** 日別表「主な対応内容」列の最大表示文字数 */
  const TABLE_DAY_SUMMARY_MAX_LEN = 320;
  /** 週次メモ（683 のみ・sessionStorage。682 正本とは未連携） */
  const WEEK_NOTE_KEY = 'user_support_683_week_notes_v1';
  const MONTH_NOTE_KEY = 'user_support_683_month_note_v1';
  /** Claude 中継 POST 先（フル URL）。sessionStorage 優先。 */
  const CLAUDE_RELAY_URL_STORAGE_KEY = 'user_support_683_claude_relay_url';
  /** HTTP の kintone／ローカル検証向け: sessionStorage 未設定時の既定 POST 先（`npm run user683:claude-relay`）。HTTPS の本番オリジンでは Chromium がループバック fetch を拒否するため使わない。`window.USER683_CLAUDE_RELAY_USE_FALLBACK === false` で無効化。 */
  const USER683_CLAUDE_RELAY_FALLBACK = 'http://127.0.0.1:17884/user683/summarize';
  /**
   * 組織共通の Claude 中継 URL（**HTTPS** のフル URL、`…/user683/summarize`）。空なら未使用。
   * 1 行だけ埋めて deploy すれば、各ユーザが `?user683_claude_relay=` を貼らなくてよい。
   * 優先順: `window.USER683_CLAUDE_RELAY_URL` → sessionStorage → **本定数** → `window.USER683_ORG_CLAUDE_RELAY_URL`
   */
  var USER683_CLAUDE_RELAY_ORG_DEFAULT = '';
  /** `user683:sync-summaries:*` が書き込む要約キャッシュを読むアプリ（`window.USER683_SUMMARY_CACHE_APP` で上書き可） */
  const SUMMARY_CACHE_APP_DEFAULT = 683;
  const FC_SUMMARY_YM = 'user683_dash_ym';
  const FC_SUMMARY_W1 = 'user683_week_1';
  const FC_SUMMARY_W2 = 'user683_week_2';
  const FC_SUMMARY_W3 = 'user683_week_3';
  const FC_SUMMARY_W4 = 'user683_week_4';
  const FC_SUMMARY_W5 = 'user683_week_5';
  const FC_SUMMARY_W6 = 'user683_week_6';
  /** 日曜〜土曜の暦週を当月 1 日〜末日でクリップしたときの最大ブロック数（例: 2026-05 は 6） */
  const USER683_SUMMARY_WEEK_SLOTS = 6;
  const FC_SUMMARY_WEEK_CODES = [
    FC_SUMMARY_W1,
    FC_SUMMARY_W2,
    FC_SUMMARY_W3,
    FC_SUMMARY_W4,
    FC_SUMMARY_W5,
    FC_SUMMARY_W6,
  ];
  const FC_SUMMARY_MONTH = 'user683_month';

  /**
   * 国民の祝日（JST の暦日）。振替・特例は年ごとに内閣府公布と突合して更新すること。
   * 未収載日は「祝」色なし（平日黒のまま）。
   */
  var JP_HOLIDAY_YMD = {};
  (
    '2025-01-01,2025-01-13,2025-02-11,2025-02-23,2025-02-24,2025-03-20,2025-04-29,2025-05-03,2025-05-04,2025-05-05,2025-05-06,' +
    '2025-07-21,2025-08-11,2025-09-15,2025-09-23,2025-10-13,2025-11-03,2025-11-23,2025-11-24,' +
    '2026-01-01,2026-01-12,2026-02-11,2026-02-23,2026-03-20,2026-04-29,2026-05-03,2026-05-04,2026-05-05,2026-05-06,' +
    '2026-07-20,2026-08-11,2026-09-21,2026-09-22,2026-09-23,2026-10-12,2026-11-03,2026-11-23,' +
    '2027-01-01,2027-01-11,2027-02-11,2027-02-23,2027-03-21,2027-04-29,2027-05-03,2027-05-04,2027-05-05,' +
    '2027-07-19,2027-08-11,2027-09-20,2027-09-23,2027-10-11,2027-11-03,2027-11-23,' +
    '2028-01-01,2028-01-10,2028-02-11,2028-02-23,2028-03-20,2028-04-29,2028-05-03,2028-05-04,2028-05-05,' +
    '2028-07-17,2028-08-11,2028-09-18,2028-09-22,2028-10-09,2028-11-03,2028-11-23'
  )
    .split(',')
    .forEach(function (x) {
      const t = x.trim();
      if (t) JP_HOLIDAY_YMD[t] = true;
    });

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

  /** 中継コーパス用の日付ラベル（月日の先頭ゼロ省略） */
  function formatYmdShortWday(isoYmd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd);
    if (!m) return isoYmd;
    const mo = String(parseInt(m[2], 10));
    const day = String(parseInt(m[3], 10));
    const utcNoon = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    const wd = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
    }).format(new Date(utcNoon));
    return m[1] + '/' + mo + '/' + day + '(' + wd + ')';
  }

  const COLOR_DAY_LABEL_WEEKEND_HOLIDAY = '#a67c52';
  const COLOR_DAY_LABEL_WEEKDAY = '#475569';

  /** 683 棒グラフ（彩度を抑えたトーン） */
  const CH683_BAR_DAY = '#6ba89f';
  /** 月次（直近6暦月）— 茶系（週次の青と差別化） */
  const CH683_BAR_MONTH = '#8f735f';
  /** 週次積み上げ（午前／午後）— 青系2トーン（スレート＋ソフトスカイ） */
  const CH683_WEEK_AM = '#a8c8e6';
  const CH683_WEEK_PM = '#4a6785';
  const CH683_WEEK_SINGLE = '#6d8cad';
  const CH683_BAR_ZERO = '#cad8e8';

  /**
   * 月次 `buildBarCardGrid`（compact + chartBoost）と週次積み上げの**棒の描画高さ**を揃える。
   * `buildBarCardGrid` 内の式 `boost ? (compact ? … : …)` と同値を維持すること。
   */
  const CH683_CHART_BOOST_COMPACT_BAR_H = 208;
  const CH683_CHART_BOOST_COMPACT_ROW_MIN_H = 236;

  function jstYmdToUtcNoonMs(year, month1to12, day) {
    return Date.UTC(year, month1to12 - 1, day, 12, 0, 0);
  }

  function jstWeekdaySun0(year, month1to12, day) {
    const s = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
    }).format(new Date(jstYmdToUtcNoonMs(year, month1to12, day)));
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[s] != null ? map[s] : 0;
  }

  function jstCalendarAddDays(year, month1to12, day, delta) {
    const ms = jstYmdToUtcNoonMs(year, month1to12, day) + delta * 86400000;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(ms));
    const yy = parseInt(
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
    const da = parseInt(
      parts.find(function (p) {
        return p.type === 'day';
      }).value,
      10,
    );
    return { y: yy, m: mo, d: da };
  }

  function jstWeekdayNarrowJa(year, month1to12, day) {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      weekday: 'narrow',
    }).format(new Date(jstYmdToUtcNoonMs(year, month1to12, day)));
  }

  function isJpHolidayYmd(ymd) {
    return JP_HOLIDAY_YMD[ymd] === true;
  }

  /** 土・日・祝（静的表に入っている暦日のみ）を茶系とする判定 */
  function jstBrownCalendarYmd(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return false;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    const nw = jstWeekdayNarrowJa(y, mo, d);
    if (nw === '土' || nw === '日') return true;
    return isJpHolidayYmd(ymd);
  }

  function readWeekNotes(ym) {
    const need = weekSlotCountForYm(ym);
    const empty = [];
    for (let i = 0; i < need; i += 1) empty.push('');
    try {
      const raw = window.sessionStorage.getItem(WEEK_NOTE_KEY);
      if (!raw) return empty;
      const o = JSON.parse(raw);
      if (o && o.y === ym.y && o.m === ym.m && Array.isArray(o.w)) {
        const w = o.w.map(function (x) {
          return String(x);
        });
        while (w.length < need) w.push('');
        return w.slice(0, need);
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return empty;
  }

  function writeWeekNotes(ym, arr) {
    try {
      const need = weekSlotCountForYm(ym);
      const w = arr.slice(0, need);
      while (w.length < need) w.push('');
      window.sessionStorage.setItem(WEEK_NOTE_KEY, JSON.stringify({ y: ym.y, m: ym.m, w: w }));
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  function readMonthNote(ym) {
    try {
      const raw = window.sessionStorage.getItem(MONTH_NOTE_KEY);
      if (!raw) return '';
      const o = JSON.parse(raw);
      if (o && o.y === ym.y && o.m === ym.m && typeof o.text === 'string') return o.text;
    } catch (e) {
      console.warn(BUILD, e);
    }
    return '';
  }

  function writeMonthNote(ym, text) {
    try {
      window.sessionStorage.setItem(
        MONTH_NOTE_KEY,
        JSON.stringify({ y: ym.y, m: ym.m, text: text }),
      );
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  function summaryCacheAppId() {
    return typeof window !== 'undefined' && window.USER683_SUMMARY_CACHE_APP != null
      ? String(window.USER683_SUMMARY_CACHE_APP)
      : String(SUMMARY_CACHE_APP_DEFAULT);
  }

  function summaryRecordBody(ymKey, weeks, monthText) {
    var body = {};
    body[FC_SUMMARY_YM] = { value: ymKey };
    for (var wi = 0; wi < FC_SUMMARY_WEEK_CODES.length; wi += 1) {
      body[FC_SUMMARY_WEEK_CODES[wi]] = { value: weeks[wi] != null ? String(weeks[wi]) : '' };
    }
    body[FC_SUMMARY_MONTH] = { value: monthText != null ? String(monthText) : '' };
    return body;
  }

  /** フィールドコードは `docs/runbooks/user683-summary-job.md` と `user683-sync-summaries-to-kintone.mjs` と一致させる */
  function fetchSummaryCacheFromKintone(ym) {
    var appId = summaryCacheAppId();
    var ymk = ym.y + '-' + pad2(ym.m);
    var q = FC_SUMMARY_YM + ' = "' + ymk + '" limit 1';
    return kintone
      .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: appId,
        query: q,
        fields: [FC_SUMMARY_YM].concat(FC_SUMMARY_WEEK_CODES.slice(), [FC_SUMMARY_MONTH, '$id', '$revision']),
      })
      .then(function (resp) {
        var recs = resp.records || [];
        if (!recs.length) return null;
        var r = recs[0];
        function gv(code) {
          return r[code] && r[code].value != null ? String(r[code].value) : '';
        }
        return {
          id: r.$id && r.$id.value != null ? String(r.$id.value) : '',
          revision:
            r.$revision && r.$revision.value != null ? String(r.$revision.value) : '',
          weeks: FC_SUMMARY_WEEK_CODES.map(function (code) {
            return gv(code);
          }),
          month: gv(FC_SUMMARY_MONTH),
        };
      })
      .catch(function (e) {
        console.warn(BUILD, 'summary cache GET', e);
        return null;
      });
  }

  function readSummaryTextsFromDom(ym) {
    var weeks = [];
    var need = weekSlotCountForYm(ym);
    for (var i = 0; i < need; i += 1) {
      var ta = document.getElementById('user683-week-note-' + i);
      weeks.push(ta ? String(ta.value || '') : '');
    }
    var mta = document.getElementById('user683-month-note');
    return { weeks: weeks, month: mta ? String(mta.value || '') : '' };
  }

  function putSummaryCacheToKintone(ym, weeks, monthText, meta) {
    var appId = summaryCacheAppId();
    var ymKey = ym.y + '-' + pad2(ym.m);
    var record = summaryRecordBody(ymKey, weeks, monthText);
    if (meta && meta.id) {
      var putBody = { app: appId, id: meta.id, record: record };
      if (meta.revision != null && meta.revision !== '') {
        putBody.revision = meta.revision;
      }
      return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', putBody);
    }
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', {
      app: appId,
      record: record,
    });
  }

  function setSummaryCacheMetaOnWrap(sc) {
    var wrap = document.getElementById('user683-ai-summary-placeholder');
    if (!wrap) return;
    if (sc && sc.id) {
      wrap.setAttribute('data-user683-summary-id', sc.id);
    } else {
      wrap.removeAttribute('data-user683-summary-id');
    }
    if (sc && sc.revision != null && sc.revision !== '') {
      wrap.setAttribute('data-user683-summary-revision', String(sc.revision));
    } else {
      wrap.removeAttribute('data-user683-summary-revision');
    }
  }

  function readSummaryCacheMetaFromWrap() {
    var wrap = document.getElementById('user683-ai-summary-placeholder');
    if (!wrap) return null;
    var id = wrap.getAttribute('data-user683-summary-id');
    if (!id) return null;
    return {
      id: id,
      revision: wrap.getAttribute('data-user683-summary-revision') || '',
    };
  }

  function hydrate683SummaryTextareasFromServer(ym, sc) {
    if (!sc) return;
    setSummaryCacheMetaOnWrap(sc);
    var need = weekSlotCountForYm(ym);
    for (var i = 0; i < need; i += 1) {
      var ta = document.getElementById('user683-week-note-' + i);
      if (!ta) continue;
      if (sc.weeks && sc.weeks[i] != null) {
        ta.value = String(sc.weeks[i]);
      }
    }
    var mta = document.getElementById('user683-month-note');
    if (mta && sc.month != null) {
      mta.value = String(sc.month);
      scheduleAutosizeMonthSummaryTextarea();
    }
    var texts = readSummaryTextsFromDom(ym);
    writeWeekNotes(ym, texts.weeks);
    writeMonthNote(ym, texts.month);
  }

  function attachSummarySaveControls(ym) {
    var wrap = document.getElementById('user683-ai-summary-placeholder');
    if (!wrap || wrap.querySelector('#user683-summary-save-btn')) return;
    var foot = document.createElement('div');
    foot.style.marginTop = '12px';
    foot.style.display = 'flex';
    foot.style.flexWrap = 'wrap';
    foot.style.alignItems = 'center';
    foot.style.gap = '10px';
    var btn = document.createElement('button');
    btn.id = 'user683-summary-save-btn';
    btn.type = 'button';
    btn.textContent = 'コメントを保存';
    btn.style.cssText =
      'cursor:pointer;padding:8px 14px;font-size:13px;font-weight:700;border-radius:6px;border:1px solid #1d4ed8;background:#2563eb;color:#fff;';
    var st = document.createElement('div');
    st.id = 'user683-summary-save-status';
    st.style.cssText = 'font-size:12px;color:#64748b;';
    st.textContent = 'AI生成文を修正したら保存してください（要約キャッシュを kintone に反映）。';
    foot.appendChild(btn);
    foot.appendChild(st);
    wrap.appendChild(foot);
    btn.onclick = function () {
      var texts = readSummaryTextsFromDom(ym);
      var meta = readSummaryCacheMetaFromWrap();
      btn.disabled = true;
      st.style.color = '#64748b';
      st.textContent = '保存中…';
      putSummaryCacheToKintone(ym, texts.weeks, texts.month, meta)
        .then(function (resp) {
          writeWeekNotes(ym, texts.weeks);
          writeMonthNote(ym, texts.month);
          var nextMeta = meta ? { id: meta.id, revision: meta.revision } : null;
          if (resp && resp.id != null) {
            nextMeta = { id: String(resp.id), revision: resp.revision != null ? String(resp.revision) : '' };
          } else if (meta && resp && resp.revision != null) {
            nextMeta = { id: meta.id, revision: String(resp.revision) };
          }
          if (!nextMeta || !nextMeta.id) {
            return fetchSummaryCacheFromKintone(ym);
          }
          return nextMeta;
        })
        .then(function (metaOrCache) {
          if (metaOrCache && metaOrCache.weeks) {
            setSummaryCacheMetaOnWrap(metaOrCache);
          } else if (metaOrCache) {
            setSummaryCacheMetaOnWrap(metaOrCache);
          }
          st.style.color = '#0f766e';
          st.textContent = '保存しました。';
        })
        .catch(function (e) {
          console.error(BUILD, e);
          st.style.color = '#b91c1c';
          st.textContent =
            '保存に失敗しました（権限・フィールド・revision を確認して再読込してください）。';
        })
        .then(function () {
          btn.disabled = false;
        });
    };
  }

  /**
   * Claude 中継 POST 先の文字列を正規化する。
   * 例: 先頭に数字が付いた `20http//127.0.0.1:11434/...` → `http://127.0.0.1:11434/...` を抽出し、
   * `http//` を `http://` に直す。`https:// http://127.0.0.1/...` のような **二重スキーム**は先頭を剥がす。
   * localhost 系かつパスが `/user683/summarize` のとき、誤って **11434**（別用途）を入れた場合は **17884**（Claude 中継）に寄せる。
   */
  function normalizeClaudeRelaySummarizeUrl(raw) {
    if (raw == null) return '';
    var s = String(raw).trim();
    if (!s) return '';
    var si;
    for (si = 0; si < 6; si += 1) {
      if (!/^https?:\/\/\s*https?:\/\//i.test(s)) {
        break;
      }
      s = s.replace(/^https?:\/\/\s*/i, '');
    }
    s = s.replace(/(https?)\/\//gi, '$1://');
    var extracted = s.match(/(https?:\/\/[^\s'")]+)/i);
    if (extracted) {
      s = extracted[1];
    }
    var u;
    try {
      u = new URL(s);
    } catch (e0) {
      return '';
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return '';
    }
    var pathNorm = (u.pathname || '').replace(/\/+$/, '') || '';
    var pathIsRelay = /\/user683\/summarize$/i.test(pathNorm);
    var loopHost =
      u.hostname === '127.0.0.1' ||
      u.hostname === 'localhost' ||
      u.hostname === '[::1]' ||
      u.hostname === '0.0.0.0';
    if (pathIsRelay && loopHost && u.port === '11434') {
      u.port = '17884';
    }
    var out = u.href;
    if (out.endsWith('/')) {
      out = out.replace(/\/+$/, '');
    }
    return out;
  }

  function isTopWindowHttps() {
    try {
      return typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /** `http://127.0.0.1` 等。HTTPS の公開ページから fetch すると Chromium の PNA（ループバック禁止）で失敗する。 */
  function isPrivateLoopbackHttpUrl(urlStr) {
    if (!urlStr) return false;
    var u;
    try {
      u = new URL(urlStr);
    } catch (e0) {
      return false;
    }
    if (u.protocol !== 'http:') return false;
    var h = String(u.hostname || '').toLowerCase();
    return h === '127.0.0.1' || h === 'localhost' || h === '[::1]' || h === '0.0.0.0';
  }

  function getClaudeRelaySummarizeUrl() {
    var fromWin = '';
    var fromSess = '';
    try {
      if (typeof window !== 'undefined' && window.USER683_CLAUDE_RELAY_URL) {
        fromWin = String(window.USER683_CLAUDE_RELAY_URL).trim();
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    try {
      var s0 = window.sessionStorage.getItem(CLAUDE_RELAY_URL_STORAGE_KEY);
      if (s0 && String(s0).trim()) {
        fromSess = String(s0).trim();
      }
    } catch (e2) {
      console.warn(BUILD, e2);
    }
    var raw = fromWin || fromSess;
    if (!raw) {
      var fromOrgConst = String(USER683_CLAUDE_RELAY_ORG_DEFAULT || '').trim();
      if (fromOrgConst) {
        raw = fromOrgConst;
      }
    }
    if (!raw) {
      var fromOrgWin = '';
      try {
        if (typeof window !== 'undefined' && window.USER683_ORG_CLAUDE_RELAY_URL) {
          fromOrgWin = String(window.USER683_ORG_CLAUDE_RELAY_URL).trim();
        }
      } catch (eOrg) {
        console.warn(BUILD, eOrg);
      }
      if (fromOrgWin) {
        raw = fromOrgWin;
      }
    }
    if (!raw) {
      try {
        if (typeof window !== 'undefined' && window.USER683_CLAUDE_RELAY_USE_FALLBACK === false) {
          return '';
        }
      } catch (e4) {
        console.warn(BUILD, e4);
      }
      if (isTopWindowHttps()) {
        return '';
      }
      raw = USER683_CLAUDE_RELAY_FALLBACK;
    }
    var norm = normalizeClaudeRelaySummarizeUrl(raw);
    if (!norm) return '';
    if (isTopWindowHttps() && isPrivateLoopbackHttpUrl(norm)) {
      console.warn(
        BUILD,
        'Claude relay URL is loopback http; Chromium blocks fetch from https public origins (Private Network Access). Set window.USER683_CLAUDE_RELAY_URL to an HTTPS tunnel or relay.',
        { url: norm },
      );
      return '';
    }
    if (norm !== raw) {
      console.info(BUILD, 'claude relay URL normalized', { from: raw, to: norm });
    }
    if (norm !== raw) {
      try {
        window.sessionStorage.setItem(CLAUDE_RELAY_URL_STORAGE_KEY, norm);
      } catch (e3) {
        console.warn(BUILD, e3);
      }
    }
    return norm;
  }

  function stripClaudeRelayQueryParams() {
    try {
      if (typeof window === 'undefined' || !window.location || !window.history || !window.history.replaceState) {
        return;
      }
      var u = new URL(window.location.href);
      if (!u.searchParams.has('user683_claude_relay') && !u.searchParams.has('u683cr')) {
        return;
      }
      u.searchParams.delete('user683_claude_relay');
      u.searchParams.delete('u683cr');
      window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {
      console.warn(BUILD, e);
    }
  }

  /**
   * 683 一覧 URL のクエリから中継 URL を取り込む（コンソール不要）。
   * `?user683_claude_relay=` または短縮 `?u683cr=`（値はフル URL。HTTPS トンネル想定）
   */
  function applyClaudeRelayFromQuery() {
    try {
      if (typeof window === 'undefined' || !window.location) {
        return;
      }
      var u = new URL(window.location.href);
      var raw = String(u.searchParams.get('user683_claude_relay') || u.searchParams.get('u683cr') || '').trim();
      if (!raw) {
        return;
      }
      var norm = normalizeClaudeRelaySummarizeUrl(raw);
      if (!norm) {
        console.warn(BUILD, 'ignored invalid user683_claude_relay / u683cr query');
        stripClaudeRelayQueryParams();
        return;
      }
      if (isTopWindowHttps() && isPrivateLoopbackHttpUrl(norm)) {
        console.warn(BUILD, 'ignored loopback http relay in query on https page');
        stripClaudeRelayQueryParams();
        return;
      }
      window.USER683_CLAUDE_RELAY_URL = norm;
      try {
        window.sessionStorage.setItem(CLAUDE_RELAY_URL_STORAGE_KEY, norm);
      } catch (e0) {
        console.warn(BUILD, e0);
      }
      stripClaudeRelayQueryParams();
      console.info(BUILD, 'Claude relay URL applied from URL query');
    } catch (e1) {
      console.warn(BUILD, e1);
    }
  }

  /** Claude 生成ボタン押下時、中継 URL が無効なときの案内（月次・週次で共通） */
  function alertClaudeRelayUrlUnset() {
    var isHttps;
    try {
      isHttps =
        typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    } catch (e0) {
      isHttps = false;
    }
    var msg =
      '【中継なしでも可】要約の表示・手編集・保存だけなら、定時ジョブの「npm run user683:sync-summaries:apply」が kintone に書き込んだ内容がそのまま使えます（この PC で中継を立てる必要はありません）。詳細: docs/runbooks/user683-summary-job.md\n\n' +
      '【以下は「ブラウザから AI で新規生成」するときだけ】\n' +
      'Claude 中継 URL が未設定か、このページから使えない値です。\n\n' +
      '【いちばん簡単（コンソール不要）】\n' +
      'ターミナルで npm run user683:claude-relay:public を実行し、表示された「?user683_claude_relay=…」の行をコピー。\n' +
      '683 一覧を開いたブラウザのアドレス欄の末尾に貼り付けて Enter（アドレスからクエリは自動で外れます）。その後「生成」を押す。\n\n' +
      '【従来（コンソール）】\n' +
      '1) npm run user683:claude-relay:public\n' +
      '2) 表示された window.USER683_CLAUDE_RELAY_URL の 1 行を F12 → Console に貼り付け → Enter → 再読込\n' +
      '3) 終わったらターミナルで Ctrl+C\n\n' +
      '【組織一括】全員同じ HTTPS 中継を使うなら、customize の USER683_CLAUDE_RELAY_ORG_DEFAULT に 1 行だけ書いて deploy（各ユーザの貼付が不要）。\n' +
      '【補足】127.0.0.1 直は HTTPS kintone では使えません。詳細: docs/runbooks/user683-claude-relay.md\n\n' +
      '【HTTP の kintone またはローカル検証】\n' +
      'PC で npm run user683:claude-relay を起動し、http://127.0.0.1:17884/user683/summarize を sessionStorage または window 変数で設定できます。';
    if (!isHttps) {
      msg =
        '【中継なしでも可】要約の表示・手編集・保存だけなら、定時ジョブの「npm run user683:sync-summaries:apply」で kintone に入った内容をそのまま使えます。詳細: docs/runbooks/user683-summary-job.md\n\n' +
        '【以下は「ブラウザから AI で新規生成」するとき】\n' +
        'Claude 中継 URL が未設定か無効です。\n\n' +
        '【手順】\n' +
        '1) 別ターミナル: npm run user683:claude-relay（127.0.0.1:17884）\n' +
        '2) このページが HTTP のときは、未設定なら既定で http://127.0.0.1:17884/user683/summarize を使います。貼り付けた sessionStorage が壊れている場合は DevTools で確認。\n' +
        '3) `window.USER683_CLAUDE_RELAY_USE_FALLBACK === false` のときは上記既定は使いません。\n' +
        '4) 組織一括: customize の USER683_CLAUDE_RELAY_ORG_DEFAULT に HTTPS 中継を 1 行だけ書いて deploy。\n\n' +
        '詳細: docs/runbooks/user683-claude-relay.md';
    }
    window.alert(msg);
  }

  function isWeekGenerateReady(ym, endDayInMonth) {
    var endYmd = ym.y + '-' + pad2(ym.m) + '-' + pad2(endDayInMonth);
    return todayJstYmd() >= endYmd;
  }

  function setSummaryGenStatus(text, color) {
    var st = document.getElementById('user683-summary-status');
    if (!st) return;
    st.style.color = color || '#64748b';
    st.textContent = text || '';
  }

  function collectCorpusForDayRange(ym, dim, d0, d1, byDay) {
    const parts = [];
    const hi = Math.min(d1, dim);
    for (let d = d0; d <= hi; d += 1) {
      const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
      const x = byDay[ymd];
      if (x && x.relayLine) {
        parts.push(formatYmdShortWday(ymd) + ': ' + x.relayLine);
      }
    }
    return parts.join('\n');
  }

  function buildRelayPayload(ym, dim, byDay) {
    const ranges = weekBlockRangesSunSatInMonth(ym);
    const weeks = [];
    for (let wi = 0; wi < ranges.length; wi += 1) {
      const d0 = ranges[wi][0];
      const d1 = ranges[wi][1];
      const label = String(ym.m) + '/' + String(d0) + '〜' + String(ym.m) + '/' + String(d1) + '週次';
      const corpus = collectCorpusForDayRange(ym, dim, d0, d1, byDay);
      weeks.push({ label: label, corpus: corpus });
    }
    const monthParts = [];
    for (let d = 1; d <= dim; d += 1) {
      const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
      const x = byDay[ymd];
      if (x && x.relayLine) {
        monthParts.push(formatYmdShortWday(ymd) + ': ' + x.relayLine);
      }
    }
    return {
      build: BUILD,
      ym: { y: ym.y, m: ym.m },
      weeks: weeks,
      month: { label: ym.y + '年' + ym.m + '月', corpus: monthParts.join('\n') },
    };
  }

  function attachClaudeGenerateControls(ym, dim, byDay) {
    if (!USER683_SHOW_CLAUDE_GENERATE_BTN) return;
    var ranges = weekBlockRangesSunSatInMonth(ym);
    var monthBtn = document.getElementById('user683-month-gen-btn');
    if (monthBtn && !monthBtn.getAttribute('data-user683-claude-bound')) {
      monthBtn.setAttribute('data-user683-claude-bound', '1');
      monthBtn.onclick = function () {
        var url = getClaudeRelaySummarizeUrl();
        if (!url) {
          alertClaudeRelayUrlUnset();
          return;
        }
        var ac = new AbortController();
        var to = window.setTimeout(function () {
          ac.abort();
        }, 180000);
        var payload = buildRelayPayload(ym, dim, byDay);
        monthBtn.disabled = true;
        var py = prevCalendarMonthYm(ym.y, ym.m);
        setSummaryGenStatus('前月要約を取得中…', '#64748b');
        fetchSummaryCacheFromKintone(py)
          .then(function (prevCache) {
            var prevSummary =
              prevCache && prevCache.month != null ? String(prevCache.month) : '';
            setSummaryGenStatus('月次要約を生成中…', '#64748b');
            return fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
              body: JSON.stringify({
                action: 'month',
                month: {
                  corpus: payload.month.corpus,
                  prevYmKey: py.y + '-' + pad2(py.m),
                  prevMonthSummary: prevSummary,
                  currentYmKey: ym.y + '-' + pad2(ym.m),
                },
              }),
              signal: ac.signal,
              credentials: 'omit',
            });
          })
          .then(function (res) {
            if (!res.ok) {
              throw new Error('HTTP ' + res.status);
            }
            return res.json();
          })
          .then(function (data) {
            var mta = document.getElementById('user683-month-note');
            if (mta) {
              mta.value = data.monthSummary != null ? String(data.monthSummary) : '';
              writeMonthNote(ym, mta.value);
              scheduleAutosizeMonthSummaryTextarea();
            }
            setSummaryGenStatus('月次要約を生成しました。必要なら「コメントを保存」してください。', '#0f766e');
          })
          .catch(function (e) {
            console.error(BUILD, e);
            setSummaryGenStatus(
              '月次生成失敗: ' + (e && e.message ? e.message : String(e)),
              '#b91c1c',
            );
          })
          .finally(function () {
            try {
              window.clearTimeout(to);
            } catch (e3) {
              console.warn(BUILD, e3);
            }
            monthBtn.disabled = false;
          });
      };
    }
    for (var wi = 0; wi < ranges.length; wi += 1) {
      (function (weekIdx) {
        var btn = document.getElementById('user683-week-gen-' + weekIdx);
        if (!btn || btn.getAttribute('data-user683-claude-bound')) return;
        btn.setAttribute('data-user683-claude-bound', '1');
        var endDay = ranges[weekIdx][1];
        if (!isWeekGenerateReady(ym, endDay)) {
          btn.disabled = true;
          btn.title = '当該週の最終日（JST）以降に生成できます';
          return;
        }
        btn.disabled = false;
        btn.title = '';
        btn.onclick = function () {
          var url = getClaudeRelaySummarizeUrl();
          if (!url) {
            alertClaudeRelayUrlUnset();
            return;
          }
          var corpus = collectCorpusForDayRange(ym, dim, ranges[weekIdx][0], ranges[weekIdx][1], byDay);
          btn.disabled = true;
          setSummaryGenStatus('週次' + String(weekIdx + 1) + 'を生成中…', '#64748b');
          var ac = new AbortController();
          var to = window.setTimeout(function () {
            ac.abort();
          }, 180000);
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({ action: 'week', week: { corpus: corpus } }),
            signal: ac.signal,
            credentials: 'omit',
          })
            .then(function (res) {
              if (!res.ok) {
                throw new Error('HTTP ' + res.status);
              }
              return res.json();
            })
            .then(function (data) {
              var ta = document.getElementById('user683-week-note-' + weekIdx);
              if (ta) {
                ta.value = data.weekSummary != null ? String(data.weekSummary) : '';
              }
              var nextW = readWeekNotes(ym).slice(0, weekSlotCountForYm(ym));
              while (nextW.length < weekSlotCountForYm(ym)) nextW.push('');
              if (ta) nextW[weekIdx] = ta.value;
              writeWeekNotes(ym, nextW);
              setSummaryGenStatus(
                '週次' + String(weekIdx + 1) + 'を生成しました。必要なら「コメントを保存」してください。',
                '#0f766e',
              );
            })
            .catch(function (e) {
              console.error(BUILD, e);
              setSummaryGenStatus(
                '週次生成失敗: ' + (e && e.message ? e.message : String(e)),
                '#b91c1c',
              );
            })
            .finally(function () {
              try {
                window.clearTimeout(to);
              } catch (e3) {
                console.warn(BUILD, e3);
              }
              btn.disabled = false;
            });
        };
      })(wi);
    }
  }

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

  function effectiveViewYm() {
    const s = readStoredYm();
    if (s) return s;
    return jstCalYearMonth();
  }

  function calendarDaysInMonth(year, month1to12) {
    return new Date(year, month1to12, 0).getDate();
  }

  /**
   * 当月 1 日〜末日を、日曜始まり・土曜終わりの暦週で分割（月外は含めない）。
   * 例: 2026-05 は 1(金)2(土) が第1ブロックのみ、3(日)から第2ブロック。
   */
  function weekBlockRangesSunSatInMonth(ym) {
    const dim = calendarDaysInMonth(ym.y, ym.m);
    const ranges = [];
    let curD = 1;
    while (curD <= dim) {
      const sun0 = jstWeekdaySun0(ym.y, ym.m, curD);
      const weekStartD = curD - sun0;
      const weekEndD = weekStartD + 6;
      const seg0 = weekStartD < 1 ? 1 : weekStartD;
      const seg1 = weekEndD > dim ? dim : weekEndD;
      ranges.push([seg0, seg1]);
      curD = seg1 + 1;
    }
    if (ranges.length > USER683_SUMMARY_WEEK_SLOTS) {
      console.warn(BUILD, 'weekBlockRangesSunSatInMonth: truncating', ranges.length);
      return ranges.slice(0, USER683_SUMMARY_WEEK_SLOTS);
    }
    return ranges;
  }

  function weekSlotCountForYm(ym) {
    return weekBlockRangesSunSatInMonth(ym).length;
  }

  function nextCalendarMonthYm(y, m) {
    if (m >= 12) {
      return { y: y + 1, m: 1 };
    }
    return { y: y, m: m + 1 };
  }

  /** 直前の暦月（JST 表示中 ym から） */
  function prevCalendarMonthYm(y, m) {
    if (m <= 1) {
      return { y: y - 1, m: 12 };
    }
    return { y: y, m: m - 1 };
  }

  /** 表示中暦月の AI 要約（週次・月次）自動投入の目安（翌暦月 1 日・JST）。定時ジョブの実時刻と異なる場合は目安のみ。 */
  function formatAiSummaryUpdateEstimateLine(ym) {
    const nx = nextCalendarMonthYm(ym.y, ym.m);
    return '更新予定: ' + nx.y + '/' + nx.m + '/1頃（翌暦月1日・JST）';
  }

  function formatWeekBlockLabel(ym, wi) {
    const ranges = weekBlockRangesSunSatInMonth(ym);
    if (wi < 0 || wi >= ranges.length) {
      return { title: '', genBtn: '', d0: 1, d1: 1 };
    }
    const d0 = ranges[wi][0];
    const d1 = ranges[wi][1];
    const start = String(ym.m) + '/' + String(d0);
    const end = String(ym.m) + '/' + String(d1);
    return {
      title: '第' + String(wi + 1) + '週（' + start + '〜' + end + '）',
      genBtn: '第' + String(wi + 1) + '週（' + start + '〜' + end + '）AI要約を生成',
      d0: d0,
      d1: d1,
    };
  }

  function sumDayTotalInWeekBlock(ym, byDay, wi) {
    const ranges = weekBlockRangesSunSatInMonth(ym);
    if (wi < 0 || wi >= ranges.length) return 0;
    const d0 = ranges[wi][0];
    const d1 = ranges[wi][1];
    let sum = 0;
    for (let d = d0; d <= d1; d += 1) {
      const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
      const x = byDay && byDay[ymd];
      if (x && x.dt != null) {
        sum += x.dt;
      }
    }
    return sum;
  }

  function sumAmPmInWeekBlock(ym, byDay, wi) {
    const ranges = weekBlockRangesSunSatInMonth(ym);
    if (wi < 0 || wi >= ranges.length) return { am: 0, pm: 0 };
    const d0 = ranges[wi][0];
    const d1 = ranges[wi][1];
    let am = 0;
    let pm = 0;
    for (let d = d0; d <= d1; d += 1) {
      const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
      const x = byDay && byDay[ymd];
      if (x) {
        am += x.am != null ? x.am : 0;
        pm += x.pm != null ? x.pm : 0;
      }
    }
    return { am: am, pm: pm };
  }

  /**
   * 当月の暦週（日曜始まり・682 と同じ区切り）ごとの縦棒。**積み上げは午前／午後件数の週合計**。
   * インフラ／サポート／システム等の区分は 682 に無いため、当該3系統の積み上げは描画しない（SPEC §4「カテゴリ等は原則不要」）。
   */
  function buildWeekStackedAmPmBarGrid(ym, byDay, opt) {
    const compact = opt && opt.compactThreeColumn;
    const ranges = weekBlockRangesSunSatInMonth(ym);
    const n = ranges.length;
    const weeks = [];
    let maxDt = 1;
    for (let wi = 0; wi < n; wi += 1) {
      const dt = sumDayTotalInWeekBlock(ym, byDay, wi);
      const ap = sumAmPmInWeekBlock(ym, byDay, wi);
      if (dt > maxDt) maxDt = dt;
      const d0 = ranges[wi][0];
      const d1 = ranges[wi][1];
      weeks.push({
        wi: wi,
        dt: dt,
        am: ap.am,
        pm: ap.pm,
        labLine1: '第' + String(wi + 1) + '週',
        labLine2: String(ym.m) + '/' + String(d0) + '〜' + String(ym.m) + '/' + String(d1),
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'us683-week-card';
    wrap.style.margin = compact ? '0' : '4px 0 10px';
    wrap.style.padding = compact ? '10px 8px 10px' : '12px 14px 14px';
    wrap.style.border = '1px solid #ccc';
    wrap.style.borderRadius = '6px';
    wrap.style.background = '#fafafa';
    wrap.style.width = '100%';
    wrap.style.boxSizing = 'border-box';
    wrap.style.overflow = 'hidden';
    /** `height:100%`＋下段 flex の stretch で中身が縦にはみ出し、週次カード内にスクロールバーが出るのを避ける */
    wrap.style.minHeight = '0';

    const subLong =
      '棒の高さは週内の日合計（day_total）の合算。積み上げ色は午前件数・午後件数の週合算（インフラ／サポート／システム別は 682 に区分フィールドが無いため未表示）。';

    const t = document.createElement('div');
    t.className = 'us683-week-card-title';
    t.style.fontWeight = 'bold';
    t.style.marginBottom = compact ? '4px' : '6px';
    t.style.fontSize = compact ? '13px' : '15px';
    t.textContent = compact
      ? ym.y + '年' + ym.m + '月・週次（件）'
      : ym.y + '年' + ym.m + '月・週次対応件数（暦週・日曜始まり）';
    if (compact) {
      wrap.title = subLong;
    }
    wrap.appendChild(t);

    if (!compact) {
      const sub = document.createElement('div');
      sub.style.fontSize = '11px';
      sub.style.color = '#64748b';
      sub.style.marginBottom = '10px';
      sub.style.lineHeight = '1.45';
      sub.textContent = subLong;
      wrap.appendChild(sub);
    }

    const legend = document.createElement('div');
    legend.className = 'us683-week-card-legend';
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = compact ? '8px' : '12px';
    legend.style.marginBottom = compact ? '4px' : '8px';
    legend.style.fontSize = compact ? '9px' : '11px';
    legend.style.color = '#334155';
    function legItem(color, text) {
      const sp = document.createElement('span');
      sp.style.display = 'inline-flex';
      sp.style.alignItems = 'center';
      sp.style.gap = '6px';
      const sw = document.createElement('span');
      sw.style.width = '12px';
      sw.style.height = '12px';
      sw.style.borderRadius = '2px';
      sw.style.background = color;
      sp.appendChild(sw);
      sp.appendChild(document.createTextNode(text));
      return sp;
    }
    legend.appendChild(legItem(CH683_WEEK_AM, '午前（週合算）'));
    legend.appendChild(legItem(CH683_WEEK_PM, '午後（週合算）'));
    wrap.appendChild(legend);

    const barH = compact ? CH683_CHART_BOOST_COMPACT_BAR_H : 200;
    const row = document.createElement('div');
    row.className = 'us683-week-card-row';
    row.style.display = 'flex';
    row.style.alignItems = 'flex-end';
    row.style.justifyContent = compact ? 'flex-start' : 'space-between';
    row.style.gap = compact ? '4px' : '8px';
    row.style.minHeight = compact ? CH683_CHART_BOOST_COMPACT_ROW_MIN_H + 'px' : '248px';
    row.style.overflow = 'hidden';

    const colMinW = compact ? '0' : '72px';
    const colorAm = CH683_WEEK_AM;
    const colorPm = CH683_WEEK_PM;
    const colorFull = CH683_WEEK_SINGLE;

    for (let i = 0; i < weeks.length; i += 1) {
      const w = weeks[i];
      const col = document.createElement('div');
      col.className = 'us683-week-card-col';
      col.style.flex = compact ? '1 1 0%' : '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.minWidth = colMinW;
      if (compact) {
        col.style.maxWidth = '100%';
        col.style.overflow = 'hidden';
      }
      const stackOuter = document.createElement('div');
      stackOuter.style.width = '100%';
      stackOuter.style.maxWidth = compact ? '100%' : '36px';
      stackOuter.style.margin = '0 auto';
      stackOuter.style.display = 'flex';
      stackOuter.style.flexDirection = 'column';
      stackOuter.style.justifyContent = 'flex-end';
      stackOuter.style.height = barH + 'px';
      const apSum = w.am + w.pm;
      let hAm = 0;
      let hPm = 0;
      const scaleH = Math.max(2, Math.round((barH * w.dt) / maxDt));
      if (w.dt > 0 && apSum > 0) {
        hAm = w.am > 0 ? Math.round((scaleH * w.am) / apSum) : 0;
        hPm = w.pm > 0 ? Math.round((scaleH * w.pm) / apSum) : 0;
        let tot = hAm + hPm;
        if (tot === 0) {
          hAm = scaleH;
        } else {
          let fix = tot - scaleH;
          while (fix > 0 && (hAm > 0 || hPm > 0)) {
            if (hPm >= hAm && hPm > 0) hPm -= 1;
            else if (hAm > 0) hAm -= 1;
            fix -= 1;
          }
          while (fix < 0) {
            if (w.pm >= w.am) hPm += 1;
            else hAm += 1;
            fix += 1;
          }
        }
      } else if (w.dt > 0) {
        hAm = scaleH;
      }

      if (hPm > 0) {
        const segPm = document.createElement('div');
        segPm.style.width = '100%';
        segPm.style.height = hPm + 'px';
        segPm.style.background = colorPm;
        segPm.style.borderRadius = '2px 2px 0 0';
        segPm.title = w.labLine1 + ': 合計' + w.dt + '件（午前' + w.am + '・午後' + w.pm + '）';
        stackOuter.appendChild(segPm);
      }
      if (hAm > 0) {
        const segAm = document.createElement('div');
        segAm.style.width = '100%';
        segAm.style.height = hAm + 'px';
        segAm.style.background = w.dt > 0 && apSum === 0 ? colorFull : colorAm;
        segAm.style.borderRadius = hPm > 0 ? '0 0 0 0' : '2px 2px 0 0';
        segAm.title = w.labLine1 + ': 合計' + w.dt + '件（午前' + w.am + '・午後' + w.pm + '）';
        stackOuter.appendChild(segAm);
      }
      if (w.dt === 0) {
        const z = document.createElement('div');
        z.style.width = '100%';
        z.style.height = '2px';
        z.style.background = CH683_BAR_ZERO;
        z.title = w.labLine1 + ': 0件';
        stackOuter.appendChild(z);
      }

      col.appendChild(stackOuter);

      const num = document.createElement('div');
      num.className = 'us683-week-card-num';
      num.style.marginTop = compact ? '4px' : '6px';
      num.style.fontSize = compact ? '12px' : '14px';
      num.style.fontWeight = '700';
      num.style.color = '#0f172a';
      num.textContent = String(w.dt);
      col.appendChild(num);

      const lab = document.createElement('div');
      lab.className = 'us683-week-card-lab';
      lab.style.marginTop = compact ? '2px' : '4px';
      lab.style.fontSize = compact ? '9px' : '10px';
      lab.style.fontWeight = '600';
      lab.style.color = '#0f172a';
      lab.style.textAlign = 'center';
      lab.style.lineHeight = '1.2';
      if (compact) {
        lab.style.maxWidth = '100%';
        lab.style.overflow = 'hidden';
        lab.style.wordBreak = 'break-all';
      }
      lab.innerHTML = w.labLine1 + '<br>' + w.labLine2;
      col.appendChild(lab);

      row.appendChild(col);
    }
    wrap.appendChild(row);
    return wrap;
  }

  function formatWeekBlockLabelWithCount(spec, total) {
    return spec.title + '・' + String(total) + '件';
  }

  function updateWeekBlockCountLabels(ym, byDay) {
    const n = weekSlotCountForYm(ym);
    for (let wi = 0; wi < n; wi += 1) {
      const lab = document.getElementById('user683-week-label-' + wi);
      if (!lab) continue;
      const spec = formatWeekBlockLabel(ym, wi);
      const total = sumDayTotalInWeekBlock(ym, byDay, wi);
      lab.textContent = formatWeekBlockLabelWithCount(spec, total);
    }
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

  /** 表示中の暦月を右端とする直近 6 暦月（月別棒グラフ用クエリ） */
  function sixMonthWindowQuery(ym) {
    const startYm = addMonthsCal(ym.y, ym.m, -5);
    const from = startYm.y + '-' + pad2(startYm.m) + '-01';
    const dimEnd = calendarDaysInMonth(ym.y, ym.m);
    const to = ym.y + '-' + pad2(ym.m) + '-' + pad2(dimEnd);
    const query =
      'record_date >= "' + from + '" and record_date <= "' + to + '" order by record_date asc';
    const slots = [];
    for (let delta = -5; delta <= 0; delta += 1) {
      const s = addMonthsCal(ym.y, ym.m, delta);
      slots.push({ key: s.y + '-' + pad2(s.m) });
    }
    return { query: query, slots: slots };
  }

  /**
   * 次ページ取得要否。limit=500 指定でも 1 ページ 100 件で返る環境があるため、
   * totalCount が取れるときは offset と突合する（6 暦月棒の月合計欠落対策）。
   */
  function shouldFetchMoreKintoneRecords(batchLen, offsetAfterBatch, totalCount, pageLimit) {
    if (batchLen === 0) return false;
    if (totalCount != null && totalCount !== '') {
      const tc = Number(totalCount);
      if (Number.isFinite(tc) && tc >= 0) {
        return offsetAfterBatch < tc;
      }
    }
    return batchLen === pageLimit;
  }

  /** 6 暦月棒グラフ用 — 各暦月を個別クエリで合算（一括取得＋ページング欠落を避ける） */
  function fetchSixMonthBarTotals(ym) {
    const six = sixMonthWindowQuery(ym);
    const promises = six.slots.map(function (slot) {
      const parts = slot.key.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const range = monthQueryRange(y, m);
      return sumDayTotalInRange(APP682, range.query).then(function (r) {
        return { key: slot.key, sum: r.sum };
      });
    });
    return Promise.all(promises).then(function (rows) {
      const ysums = {};
      for (let i = 0; i < rows.length; i += 1) {
        ysums[rows[i].key] = rows[i].sum;
      }
      return { slots: six.slots, ysums: ysums };
    });
  }

  function fetchRecordsFieldsForQuery(appId, query, fields) {
    const all = [];
    let offset = 0;
    const limit = 500;
    let pageCount = 0;
    const maxPages = 50;

    function step() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: String(appId),
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
          offset += batch.length;
          pageCount += 1;
          if (pageCount >= maxPages) {
            return all;
          }
          if (shouldFetchMoreKintoneRecords(batch.length, offset, resp.totalCount, limit)) {
            return step();
          }
          return all;
        });
    }

    return step();
  }

  /**
   * 暦月キーごとに日合計を集約。同一 record_date に複数行あるときは day_total の最大を 1 日分とする（682 と同型）。
   */
  function sumDayTotalByYearMonth(records) {
    /** @type {Record<string, number>} */
    const byYmd = {};
    for (let i = 0; i < records.length; i += 1) {
      const rec = records[i];
      const ymd = recordDateYmd(rec);
      if (!ymd) continue;
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

  function toNumCell(cell) {
    if (!cell || cell.value == null || String(cell.value).trim() === '') return 0;
    const n = Number(cell.value);
    return Number.isFinite(n) ? n : 0;
  }

  function getCellText(rec, code) {
    const c = rec[code];
    if (!c || c.value == null) return '';
    return String(c.value);
  }

  function normalizeSummaryWhitespace(s) {
    return String(s)
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function truncateOneLine(s, max) {
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }

  /**
   * 週次・月次生成用コーパス。682 の午前／午後対応文を連結（表には表示しない）。
   * 長文は RELAY_DAY_CORPUS_MAX_LEN で切る（個人情報は中継経路に載る点は 682 正本と同程度）。
   */
  function mergeCorrespondenceForRelay(amRaw, pmRaw) {
    const am = normalizeSummaryWhitespace(amRaw || '');
    const pm = normalizeSummaryWhitespace(pmRaw || '');
    if (!am && !pm) return '';
    const merged =
      am && pm && am === pm ? am : !am ? pm : !pm ? am : am + ' ' + pm;
    return truncateOneLine(merged, RELAY_DAY_CORPUS_MAX_LEN);
  }

  /** 同一 record_date の複数行を合算（682 正本フィールド） */
  function aggregate683ByYmd(records) {
    const map = {};
    for (let i = 0; i < records.length; i += 1) {
      const ymd = recordDateYmd(records[i]);
      if (!ymd) continue;
      if (!map[ymd]) map[ymd] = { am: 0, pm: 0, dt: 0, rows: 0, amRaw: '', pmRaw: '' };
      map[ymd].am += toNumCell(records[i][FC_AM]);
      map[ymd].pm += toNumCell(records[i][FC_PM]);
      const dtCell = toNumCell(records[i][FC_DAY_TOTAL]);
      map[ymd].dt = Math.max(map[ymd].dt, dtCell);
      map[ymd].rows += 1;
      const at = getCellText(records[i], FC_AM_TEXT);
      const pt = getCellText(records[i], FC_PM_TEXT);
      if (at) map[ymd].amRaw += (map[ymd].amRaw ? '\n' : '') + at;
      if (pt) map[ymd].pmRaw += (map[ymd].pmRaw ? '\n' : '') + pt;
    }
    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k += 1) {
      const o = map[keys[k]];
      o.relayLine = mergeCorrespondenceForRelay(o.amRaw, o.pmRaw);
    }
    return map;
  }

  function sumDayTotalFromDetailRecords(records) {
    /** @type {Record<string, number>} */
    const byYmd = {};
    for (let i = 0; i < records.length; i += 1) {
      const ymd = recordDateYmd(records[i]);
      if (!ymd) continue;
      const n = toNumCell(records[i][FC_DAY_TOTAL]);
      const prev = byYmd[ymd];
      if (prev == null || n > prev) {
        byYmd[ymd] = n;
      }
    }
    let s = 0;
    for (const ymd in byYmd) {
      if (!Object.prototype.hasOwnProperty.call(byYmd, ymd)) continue;
      s += byYmd[ymd];
    }
    return s;
  }

  /** タイトル＋横並びの縦棒（日別・月別の共通描画） */
  function buildBarCardGrid(title, labels, values, opt) {
    const compact = opt && opt.compact;
    const tall = opt && opt.tall;
    const boost = opt && opt.chartBoost;
    const chartTight = opt && opt.chartTight;
    const fitNoScroll = opt && opt.chartFitNoScroll;
    const labelColors = (opt && opt.labelColors) || null;
    const barColor = (opt && opt.barColor) || CH683_BAR_DAY;
    const wrap = document.createElement('div');
    wrap.className =
      'us683-bar-card' + (opt && opt.chartCardExtraClass ? ' ' + String(opt.chartCardExtraClass) : '');
    wrap.style.margin = boost ? '4px 0 10px' : '8px 0';
    wrap.style.padding = boost ? '12px 14px 14px' : compact ? '8px 10px' : '10px 12px';
    wrap.style.border = '1px solid #ccc';
    wrap.style.borderRadius = '6px';
    wrap.style.background = '#fafafa';
    wrap.style.overflowX = 'hidden';
    const t = document.createElement('div');
    t.className = 'us683-bar-card-title';
    t.style.fontWeight = 'bold';
    t.style.marginBottom = boost ? '10px' : '6px';
    t.style.fontSize = boost ? '15px' : compact ? '12px' : '13px';
    t.textContent = title;
    wrap.appendChild(t);

    let maxVal = 1;
    for (let j = 0; j < values.length; j += 1) {
      if (values[j] > maxVal) maxVal = values[j];
    }

    const barH = boost ? (compact ? CH683_CHART_BOOST_COMPACT_BAR_H : 248) : tall ? (compact ? 112 : 144) : compact ? 72 : 96;
    const row = document.createElement('div');
    row.className = 'us683-bar-card-row';
    row.style.display = 'flex';
    row.style.alignItems = 'flex-end';
    /** `space-between` は列間に余白を広げがち。日次のように本数が多いときは `chartPackColumnsTight` で詰める */
    row.style.justifyContent = opt && opt.chartPackColumnsTight ? 'flex-start' : 'space-between';
    var gapStr = chartTight ? '0px' : boost ? '4px' : compact ? '2px' : '4px';
    if (opt && opt.chartRowGapPx != null && !isNaN(Number(opt.chartRowGapPx))) {
      gapStr = String(Number(opt.chartRowGapPx)) + 'px';
    }
    row.style.gap = gapStr;
    row.style.minHeight = boost ? (compact ? CH683_CHART_BOOST_COMPACT_ROW_MIN_H : 276) : tall ? (compact ? 132 : 172) : compact ? 92 : 120;
    /** 683 ではグラフ内の横スクロールを出さない（一覧内の見た目優先） */
    row.style.overflowX = 'hidden';

    const bigLab = opt && opt.chartBigLabels;
    const narrowBars = opt && opt.chartNarrowBars;
    let fsNum = boost ? (compact ? '15px' : '16px') : compact ? '9px' : '10px';
    let fsLab = boost ? (compact ? '12px' : '13px') : compact ? '8px' : '9px';
    let barMaxW = boost ? (compact ? '22px' : '28px') : compact ? '16px' : '22px';
    let colMinW = chartTight ? (boost ? '14px' : '12px') : boost ? (compact ? '18px' : '22px') : compact ? '14px' : '18px';
    if (bigLab && boost) {
      fsNum = compact ? '17px' : '18px';
      fsLab = compact ? '14px' : '15px';
    }
    if (narrowBars && boost && chartTight) {
      colMinW = '9px';
      barMaxW = compact ? '13px' : '15px';
    }
    /** 日別など「1(水)」が列幅より広いとき、横スクロールで読めるよう列の最小幅を確保（`chartFitNoScroll` 時は列を縮めて親幅に収める） */
    if (opt && opt.chartColMinW && !fitNoScroll) {
      colMinW = String(opt.chartColMinW);
    }
    if (opt && opt.chartLabFontPx) {
      fsLab = String(opt.chartLabFontPx);
    }
    if (opt && opt.chartNumFontPx) {
      fsNum = String(opt.chartNumFontPx);
    }

    /** `chartFitNoScroll` 時、各列内で棒の最大幅を列幅の何％にするか（日次の横幅節約用。既定 100）。 */
    let barMaxWhenFitScroll = '100%';
    if (fitNoScroll) {
      const pRaw = opt && opt.chartBarMaxColumnPct;
      const p = pRaw != null && !isNaN(Number(pRaw)) ? Number(pRaw) : 100;
      const clamped = Math.min(100, Math.max(10, p));
      barMaxWhenFitScroll = clamped + '%';
    }

    for (let i = 0; i < labels.length; i += 1) {
      const val = values[i];
      const col = document.createElement('div');
      col.className = 'us683-bar-card-col';
      col.style.flex = fitNoScroll ? '1 1 0%' : '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.minWidth = fitNoScroll ? '0' : colMinW;

      const bar = document.createElement('div');
      bar.className = 'us683-bar-card-bar';
      bar.style.width = '100%';
      bar.style.maxWidth = fitNoScroll ? barMaxWhenFitScroll : barMaxW;
      bar.style.margin = '0 auto';
      bar.style.height = Math.max(2, Math.round((barH * val) / maxVal)) + 'px';
      bar.style.background = barColor;
      bar.style.borderRadius = '2px 2px 0 0';
      const labStr = labels[i];
      bar.title = labStr + ': ' + val + '件';

      const num = document.createElement('div');
      num.className = 'us683-bar-card-num';
      num.style.marginTop = boost ? '6px' : '2px';
      num.style.fontSize = fsNum;
      num.style.fontWeight = '700';
      const lc = labelColors && labelColors[i] != null ? labelColors[i] : '#0f172a';
      num.style.color = lc;
      num.textContent = String(val);

      const lab = document.createElement('div');
      lab.className = 'us683-bar-card-lab';
      lab.style.marginTop = boost ? '4px' : '1px';
      lab.style.fontSize = fsLab;
      lab.style.fontWeight = boost ? '600' : '400';
      lab.style.color = lc;
      lab.style.lineHeight = chartTight ? '1.05' : '1.2';
      lab.style.textAlign = 'center';
      lab.style.whiteSpace = fitNoScroll ? 'normal' : 'nowrap';
      if (fitNoScroll) {
        lab.style.maxWidth = '100%';
        lab.style.overflow = 'hidden';
        lab.style.textOverflow = 'ellipsis';
      }
      lab.textContent = labStr;

      col.appendChild(bar);
      col.appendChild(num);
      col.appendChild(lab);
      row.appendChild(col);
    }
    wrap.appendChild(row);
    return wrap;
  }

  const USER683_MONTH_SUMMARY_LINE_PX = 21;
  const USER683_MONTH_SUMMARY_PAD_PX = 20;
  const USER683_MONTH_SUMMARY_MIN_ROWS = 4;

  /**
   * 月次要約欄のみ: 内容に合わせて高さを伸ばし、内側スクロールを避ける（週次は固定4行のまま）。
   */
  function autosizeMonthSummaryTextarea() {
    var ta = document.getElementById('user683-month-note');
    if (!ta) return;
    var minPx = USER683_MONTH_SUMMARY_LINE_PX * USER683_MONTH_SUMMARY_MIN_ROWS + USER683_MONTH_SUMMARY_PAD_PX;
    ta.style.overflowY = 'hidden';
    ta.style.height = '0px';
    var h = ta.scrollHeight;
    if (h < minPx) {
      h = minPx;
    }
    ta.style.height = h + 2 + 'px';
  }

  function scheduleAutosizeMonthSummaryTextarea() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        autosizeMonthSummaryTextarea();
      });
    });
  }

  /**
   * 月次・週次コメント欄の寸法・行間・印刷見た目を共通化する。
   */
  function ensureUser683AiSummaryStyles() {
    if (document.getElementById('user683-ai-summary-style')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'user683-ai-summary-style';
    style.textContent =
      '#user683-ai-summary-placeholder .user683-summary-subtitle{' +
      'font-weight:600;font-size:13px;margin:0 0 6px;color:#334155;}' +
      '#user683-ai-summary-placeholder .user683-summary-week-row{' +
      'margin:0 0 12px;display:flex;flex-direction:column;gap:8px;}' +
      '#user683-ai-summary-placeholder .user683-summary-week-row:last-child{' +
      'margin-bottom:0;}' +
      '#user683-ai-summary-placeholder .user683-summary-week-label{' +
      'display:block;font-weight:600;font-size:12px;line-height:1.5;margin:0;color:#334155;}' +
      '#user683-ai-summary-placeholder textarea.user683-summary-field{' +
      'display:block;width:100%;box-sizing:border-box;margin:0;padding:10px 8px;' +
      'font-size:13px;line-height:21px;font-family:inherit;color:#0f172a;white-space:pre-wrap;' +
      'min-height:calc(21px * 4 + 20px);height:calc(21px * 4 + 20px);' +
      'border:1px solid #cbd5e1;border-radius:6px;resize:vertical;background:#fff;overflow:auto;}' +
      '#user683-ai-summary-placeholder textarea#user683-month-note.user683-summary-field{' +
      'height:auto;min-height:calc(21px * 4 + 20px);max-height:none;' +
      'overflow-y:hidden;overflow-x:hidden;resize:vertical;}' +
      '#user683-ai-summary-placeholder .user683-summary-generate-btn{' +
      'margin:0;cursor:pointer;padding:6px 12px;font-size:12px;font-weight:700;' +
      'border-radius:6px;border:1px solid #0f766e;background:#14b8a6;color:#fff;}' +
      '#user683-ai-summary-placeholder .user683-summary-update-note{' +
      'margin:0 0 10px;font-size:11px;line-height:1.35;color:#64748b;}';
    document.head.appendChild(style);
  }

  function configureUser683SummaryTextarea(ta, isMonthNote) {
    ta.rows = isMonthNote ? 2 : 4;
    ta.className = isMonthNote ? 'user683-summary-field user683-summary-field-month' : 'user683-summary-field';
  }

  /**
   * 週次は当月内の「日曜〜土曜」暦週をクリップしたブロック（最大6）。初期表示は sessionStorage。読込後は kintone 要約キャッシュで上書き。
   */
  function buildAiSummaryPlaceholderEl(ym) {
    ensureUser683AiSummaryStyles();
    const wrap = document.createElement('div');
    wrap.id = 'user683-ai-summary-placeholder';
    wrap.style.margin = '0 12px 12px';
    wrap.style.padding = '12px 14px';
    wrap.style.border = '1px solid #cbd5e1';
    wrap.style.borderRadius = '8px';
    wrap.style.background = '#f8fafc';

    const h = document.createElement('div');
    h.style.fontWeight = '700';
    h.style.fontSize = '15px';
    h.style.marginBottom = '10px';
    h.textContent = 'AI分析コメント（月次・週次）';
    wrap.appendChild(h);

    const upd = document.createElement('div');
    upd.className = 'user683-summary-update-note';
    upd.textContent = formatAiSummaryUpdateEstimateLine(ym);
    wrap.appendChild(upd);

    const monthNote = readMonthNote(ym);
    const mBlock = document.createElement('div');
    mBlock.className = 'user683-summary-week-row';
    const mTitle = document.createElement('div');
    mTitle.className = 'user683-summary-subtitle';
    mTitle.textContent = '月次要約';
    mBlock.appendChild(mTitle);
    const mta = document.createElement('textarea');
    mta.id = 'user683-month-note';
    configureUser683SummaryTextarea(mta, true);
    mta.value = monthNote;
    mta.addEventListener('input', function (ev) {
      writeMonthNote(ym, ev.target.value);
      scheduleAutosizeMonthSummaryTextarea();
    });
    mBlock.appendChild(mta);
    if (USER683_SHOW_CLAUDE_GENERATE_BTN) {
      const mGen = document.createElement('button');
      mGen.id = 'user683-month-gen-btn';
      mGen.type = 'button';
      mGen.textContent = '月次 AI 要約を生成';
      mGen.className = 'user683-summary-generate-btn';
      mBlock.appendChild(mGen);
    }
    wrap.appendChild(mBlock);

    const weekNotes = readWeekNotes(ym);
    const nWeek = weekSlotCountForYm(ym);

    const weekBlock = document.createElement('div');
    weekBlock.style.marginBottom = '12px';
    const wTitle = document.createElement('div');
    wTitle.className = 'user683-summary-subtitle';
    wTitle.textContent = '週次要約';
    weekBlock.appendChild(wTitle);

    for (let wi = 0; wi < nWeek; wi += 1) {
      const spec = formatWeekBlockLabel(ym, wi);
      const row = document.createElement('div');
      row.className = 'user683-summary-week-row';
      const lab = document.createElement('label');
      lab.id = 'user683-week-label-' + wi;
      lab.className = 'user683-summary-week-label';
      lab.textContent = formatWeekBlockLabelWithCount(spec, 0);
      lab.setAttribute('for', 'user683-week-note-' + wi);
      row.appendChild(lab);
      const ta = document.createElement('textarea');
      ta.id = 'user683-week-note-' + wi;
      configureUser683SummaryTextarea(ta);
      ta.value = weekNotes[wi] || '';
      (function (idx) {
        ta.addEventListener('input', function (ev) {
          const need = weekSlotCountForYm(ym);
          const cur = readWeekNotes(ym);
          const next = cur.slice(0, need);
          while (next.length < need) next.push('');
          next[idx] = ev.target.value;
          writeWeekNotes(ym, next);
        });
      })(wi);
      row.appendChild(ta);
      if (USER683_SHOW_CLAUDE_GENERATE_BTN) {
        const wGen = document.createElement('button');
        wGen.id = 'user683-week-gen-' + wi;
        wGen.type = 'button';
        wGen.textContent = spec.genBtn;
        wGen.className = 'user683-summary-generate-btn';
        row.appendChild(wGen);
      }
      weekBlock.appendChild(row);
    }
    wrap.appendChild(weekBlock);

    const st = document.createElement('div');
    st.id = 'user683-summary-status';
    st.style.cssText = 'margin-top:8px;font-size:12px;color:#64748b;min-height:1.2em;';
    wrap.appendChild(st);

    scheduleAutosizeMonthSummaryTextarea();

    return wrap;
  }

  function buildHeroEl(ym, curTotal, prevHasRecords, prevTotal) {
    const wrap = document.createElement('div');
    wrap.id = 'user683-hero';
    wrap.style.cssText =
      'padding:22px 24px 28px;background:linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%);color:#fff;border-radius:8px;margin:10px 12px;box-shadow:0 2px 10px rgba(0,0,0,.18);text-align:center;';
    wrap.setAttribute('data-us683-cur-total', String(curTotal));
    wrap.setAttribute('data-us683-prev-total', String(prevHasRecords ? prevTotal : ''));
    wrap.setAttribute('data-us683-prev-has', prevHasRecords ? '1' : '0');

    const line1 = document.createElement('div');
    line1.style.fontSize = '28px';
    line1.style.fontWeight = '800';
    line1.style.lineHeight = '1.35';
    line1.textContent = ym.y + '年' + ym.m + '月のサポート案件合計：' + curTotal + ' 件';
    wrap.appendChild(line1);

    const mom = document.createElement('div');
    mom.style.marginTop = '18px';
    mom.style.fontSize = '26px';
    mom.style.fontWeight = '800';
    mom.style.lineHeight = '1.45';
    if (!prevHasRecords) {
      mom.innerHTML = '前月比: <span style="opacity:.9;font-weight:800;">—（前月にデータなし）</span>';
    } else {
      const delta = curTotal - prevTotal;
      if (delta > 0) {
        mom.innerHTML =
          '前月比: 先月より <span style="color:#fecaca;font-weight:800;">+' +
          delta +
          ' 件増加</span>（先月 ' +
          prevTotal +
          ' 件 → 当月 ' +
          curTotal +
          ' 件）';
      } else if (delta < 0) {
        mom.innerHTML =
          '前月比: 先月より <span style="color:#93c5fd;font-weight:800;">−' +
          Math.abs(delta) +
          ' 件減少</span>（先月 ' +
          prevTotal +
          ' 件 → 当月 ' +
          curTotal +
          ' 件）';
      } else {
        mom.innerHTML =
          '前月比: <span style="opacity:.92;font-weight:800;">先月と同数</span>（先月・当月とも ' +
          curTotal +
          ' 件）';
      }
    }
    wrap.appendChild(mom);

    return wrap;
  }

  function daySummaryLineRaw(x) {
    if (!x) return '';
    var line = normalizeSummaryWhitespace(x.relayLine || '');
    if (!line) {
      line = normalizeSummaryWhitespace(
        [x.amRaw, x.pmRaw].filter(Boolean).join(' '),
      );
    }
    return line;
  }

  function formatDaySummaryForTable(x) {
    return truncateOneLine(daySummaryLineRaw(x), TABLE_DAY_SUMMARY_MAX_LEN);
  }

  function buildMonthTableEl(ym, dim, byDay) {
    const wrap = document.createElement('div');
    wrap.style.margin = '8px 12px 14px';
    const t0 = document.createElement('div');
    t0.style.fontWeight = '600';
    t0.style.marginBottom = '6px';
    t0.style.fontSize = '12px';
    t0.style.color = '#475569';
    t0.textContent = '対応案件一覧（サマリー）・' + ym.y + '年' + ym.m + '月度';
    wrap.appendChild(t0);

    const tbl = document.createElement('table');
    tbl.style.width = '100%';
    tbl.style.tableLayout = 'fixed';
    tbl.style.borderCollapse = 'collapse';
    tbl.style.fontSize = '12px';
    tbl.style.background = '#fff';
    tbl.style.border = '1px solid #ccc';

    const cg = document.createElement('colgroup');
    cg.innerHTML =
      '<col style="width:12.5em"><col style="width:3.2em"><col style="width:auto">';
    tbl.appendChild(cg);

    const thead = document.createElement('thead');
    thead.innerHTML =
      '<tr style="background:#f1f5f9;">' +
      '<th style="padding:6px 4px 6px 6px;border:1px solid #ccc;text-align:left;">対応日</th>' +
      '<th style="padding:6px 4px;border:1px solid #ccc;text-align:right;">件</th>' +
      '<th style="padding:6px 8px;border:1px solid #ccc;text-align:left;">主な対応内容</th>' +
      '</tr>';
    tbl.appendChild(thead);

    const tb = document.createElement('tbody');
    const today = todayJstYmd();
    for (let d = 1; d <= dim; d += 1) {
      const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
      const tr = document.createElement('tr');
      const cellDate = document.createElement('td');
      cellDate.style.padding = '5px 4px 5px 6px';
      cellDate.style.border = '1px solid #ddd';
      cellDate.style.whiteSpace = 'nowrap';
      cellDate.style.overflow = 'visible';
      cellDate.style.verticalAlign = 'top';
      cellDate.title = '';
      cellDate.textContent = formatYmdSlashWday(ymd);
      cellDate.style.color = jstBrownCalendarYmd(ymd)
        ? COLOR_DAY_LABEL_WEEKEND_HOLIDAY
        : COLOR_DAY_LABEL_WEEKDAY;
      tr.appendChild(cellDate);

      const x = byDay[ymd];
      const isFuture = ymd > today;
      const dtTd = document.createElement('td');
      dtTd.style.textAlign = 'right';
      dtTd.style.border = '1px solid #ddd';
      dtTd.style.padding = '5px 4px';
      dtTd.style.whiteSpace = 'nowrap';
      dtTd.style.verticalAlign = 'top';
      const bodyTd = document.createElement('td');
      bodyTd.style.padding = '5px 8px';
      bodyTd.style.border = '1px solid #ddd';
      bodyTd.style.color = '#333';
      bodyTd.style.fontSize = '12px';
      bodyTd.style.wordBreak = 'break-word';
      bodyTd.style.verticalAlign = 'top';

      if (isFuture) {
        dtTd.textContent = '—';
        bodyTd.textContent = '—';
        bodyTd.style.color = '#888';
      } else if (!x || x.rows === 0) {
        dtTd.textContent = '0';
        bodyTd.textContent = '—';
        bodyTd.style.color = '#666';
      } else {
        dtTd.textContent = String(x.dt);
        const fullLine = daySummaryLineRaw(x);
        const summaryLine = formatDaySummaryForTable(x);
        const hasText = Boolean(fullLine);
        bodyTd.textContent = hasText ? summaryLine : '（対応文なし・件数のみ）';
        if (hasText) {
          bodyTd.setAttribute('data-us683-full-summary', fullLine);
          bodyTd.title = fullLine;
        } else {
          bodyTd.title = '';
        }
      }
      tr.appendChild(dtTd);
      tr.appendChild(bodyTd);
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
    wrap.appendChild(tbl);
    return wrap;
  }

  function recordDateYmd(rec) {
    const cell = rec[FC_DATE];
    if (!cell || cell.value == null) return '';
    return String(cell.value).slice(0, 10);
  }

  function fetchAllRecordDatesForQuery(appId, query) {
    const all = [];
    let offset = 0;
    const limit = 500;
    let pageCount = 0;
    const maxPages = 50;

    function step() {
      return kintone
        .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: String(appId),
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
          offset += batch.length;
          pageCount += 1;
          if (pageCount >= maxPages) {
            const total =
              resp.totalCount != null && resp.totalCount !== ''
                ? Number(resp.totalCount)
                : all.length;
            return { records: all, totalCount: total };
          }
          if (shouldFetchMoreKintoneRecords(batch.length, offset, resp.totalCount, limit)) {
            return step();
          }
          const total =
            resp.totalCount != null && resp.totalCount !== ''
              ? Number(resp.totalCount)
              : all.length;
          return { records: all, totalCount: total };
        });
    }

    return step();
  }

  function analyzeMonthRecords(records, year, month1to12, dim) {
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

  function fillBannerMessages(container, payload) {
    if (!container) return;
    container.innerHTML = '';
    if (payload.error) {
      const root = document.createElement('div');
      root.id = 'user-support683-month-check';
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
    root.id = 'user-support683-month-check';
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
        '同一記録日の重複があります。682 一覧で修正してください。（' +
          dup.slice(0, 8).join(', ') +
          (dup.length > 8 ? ' …他' + (dup.length - 8) + '件' : '') +
          '）',
      );
    }
    root.textContent = parts.join(' ');
    container.appendChild(root);
  }

  function sumDayTotalInRange(appId, query) {
    return fetchRecordsFieldsForQuery(appId, query, [FC_DATE, FC_DAY_TOTAL]).then(function (records) {
      /** @type {Record<string, number>} */
      const byYmd = {};
      for (let i = 0; i < records.length; i += 1) {
        const ymd = recordDateYmd(records[i]);
        if (!ymd) continue;
        const cell = records[i][FC_DAY_TOTAL];
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
      let s = 0;
      for (const ymd in byYmd) {
        if (!Object.prototype.hasOwnProperty.call(byYmd, ymd)) continue;
        s += byYmd[ymd];
      }
      return { sum: s, recordCount: records.length };
    });
  }

  var USER683_PRINT_AFTERPRINT_BOUND = false;

  function ensureUser683PrintReportStyles() {
    var id = 'user683-print-report-style';
    var st = document.getElementById(id);
    if (!st) {
      st = document.createElement('style');
      st.id = id;
      document.head.appendChild(st);
    }
    st.setAttribute('data-build', BUILD);
    st.textContent =
      /* 計測用: display:none だと scale 高さが 0 になり印刷で4枚化する */
      '@media screen{' +
      '#user683-print-report-portal{' +
      'display:block!important;position:fixed!important;left:-12000px!important;top:0!important;' +
      'width:1100px!important;visibility:hidden!important;pointer-events:none!important;z-index:-1!important;' +
      '}' +
      '}' +
      '@media print{' +
      '@page{size:A4 landscape;margin:4mm;}' +
      'html,body{height:auto!important;margin:0!important;padding:0!important;}' +
      'body>*:not(#user683-print-report-portal){display:none!important;}' +
      '#user683-print-report-portal{' +
      'display:block!important;position:static!important;left:auto!important;top:auto!important;' +
      'width:100%!important;visibility:visible!important;pointer-events:auto!important;' +
      'background:#fff!important;color:#000!important;font-family:Meiryo,"Yu Gothic",system-ui,sans-serif;font-size:12pt;' +
      '-webkit-print-color-adjust:exact;print-color-adjust:exact;' +
      '}' +
      /* 各シートを A4横1枚に固定（溢れは内側 scale で収める） */
      '.us683-print-page1,.us683-print-page2{' +
      'box-sizing:border-box!important;height:202mm!important;max-height:202mm!important;' +
      'overflow:hidden!important;page-break-inside:avoid!important;break-inside:avoid-page!important;' +
      '}' +
      '.us683-print-page1{page-break-after:always!important;break-after:page!important;font-size:12pt;}' +
      '.us683-print-page2{page-break-before:auto!important;break-before:auto!important;page-break-after:avoid!important;break-after:avoid!important;}' +
      '.us683-print-sheet-inner{transform-origin:top left;width:100%;}' +
      '.us683-print-block{margin-bottom:2px;}' +
      '.us683-print-mom-box{border:2px solid #222;padding:2px 5px;margin:0 0 2px;font-size:12pt;font-weight:800;line-height:1.25;background:#f3f4f6;}' +
      '.us683-print-mom-label{font-size:9pt;font-weight:700;margin-bottom:0;}' +
      '.us683-print-page1 .us683-print-h2{font-size:11pt;font-weight:700;margin:2px 0 1px;border-bottom:1px solid #222;padding-bottom:0;}' +
      '.us683-print-page1 .us683-print-h2.us683-print-h2-month{font-size:13pt;font-weight:800;margin:2px 0 1px;}' +
      '.us683-print-page1 .us683-print-month-summary{white-space:pre-wrap;border:2px solid #222;padding:5px 6px;min-height:1.2em;background:#fafafa;font-size:16pt;font-weight:600;line-height:1.32;overflow:visible;}' +
      '.us683-print-hero-wrap{border:1px solid #333;border-radius:2px;padding:2px!important;margin:0 0 2px!important;}' +
      '.us683-print-hero-wrap .us683-print-hero-inner{background:transparent!important;color:#000!important;' +
      'box-shadow:none!important;text-align:left!important;padding:0!important;margin:0!important;border-radius:0!important;}' +
      '.us683-print-hero-inner>div{padding:2px 4px!important;margin:0!important;box-shadow:none!important;border-radius:0!important;}' +
      '.us683-print-hero-inner>div>div:nth-child(1){font-size:13pt!important;line-height:1.15!important;font-weight:800!important;margin:0!important;}' +
      '.us683-print-hero-inner>div>div:nth-child(2){display:none!important;}' +
      '.us683-print-hero-wrap .us683-print-hero-inner *{color:#000!important;background:transparent!important;}' +
      '.us683-print-chart-full{width:100%!important;margin:0 0 1px!important;}' +
      '.us683-print-chart-full .us683-print-h2{font-size:10pt;margin:0 0 1px;border-bottom:1px solid #222;}' +
      '.us683-print-chart-row{display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:4px!important;width:100%!important;margin:0 0 2px!important;}' +
      '.us683-print-chart-row .us683-print-chart-col{flex:1 1 0%!important;min-width:0!important;}' +
      '.us683-print-chart-row .us683-print-h2{font-size:9pt;margin:0 0 1px;border-bottom:1px solid #222;}' +
      '.us683-print-chart-slot{margin:0!important;overflow:hidden!important;}' +
      '.us683-print-chart-slot>.us683-print-chart-scaled{transform-origin:top left;}' +
      '.us683-print-page1 .us683-bar-card,.us683-print-page1 .us683-week-card,' +
      '.us683-print-page2 .us683-bar-card,.us683-print-page2 .us683-week-card{padding:3px 5px!important;margin:0!important;}' +
      '.us683-print-page1 .us683-bar-card-title,.us683-print-page1 .us683-week-card-title,' +
      '.us683-print-page2 .us683-bar-card-title,.us683-print-page2 .us683-week-card-title{font-size:10pt!important;font-weight:700!important;margin-bottom:2px!important;line-height:1.2!important;}' +
      '.us683-print-page1 .us683-bar-card-num,.us683-print-page1 .us683-week-card-num,' +
      '.us683-print-page2 .us683-bar-card-num,.us683-print-page2 .us683-week-card-num{font-size:9pt!important;font-weight:700!important;}' +
      '.us683-print-page1 .us683-bar-card-lab,.us683-print-page1 .us683-week-card-lab,' +
      '.us683-print-page2 .us683-bar-card-lab,.us683-print-page2 .us683-week-card-lab{font-size:7pt!important;font-weight:600!important;line-height:1.1!important;}' +
      '.us683-print-page1 .us683-bar-card--daily .us683-bar-card-lab{font-size:6pt!important;line-height:1!important;white-space:nowrap!important;word-break:keep-all!important;overflow:hidden!important;text-overflow:clip!important;}' +
      '.us683-print-page1 .us683-week-card-legend,.us683-print-page2 .us683-week-card-legend{font-size:8pt!important;}' +
      '.us683-print-page1 .us683-bar-card-row,.us683-print-page1 .us683-week-card-row,' +
      '.us683-print-page2 .us683-bar-card-row,.us683-print-page2 .us683-week-card-row{min-height:0!important;}' +
      '.us683-print-page2 .us683-print-h2{font-size:9pt;font-weight:700;margin:0 0 1px;border-bottom:1px solid #222;padding-bottom:0;}' +
      /* 2枚目表: 全文・小さめ（行のページ割れ回避は空白ページの原因になるのでしない） */
      '.us683-print-p2-wrap{font-size:5.5pt!important;line-height:1.08!important;margin:0!important;}' +
      '.us683-print-p2-wrap>div{margin:0!important;padding:0!important;}' +
      '.us683-print-p2-wrap>div>div:first-child{display:none!important;}' +
      '.us683-print-p2-wrap table{font-size:5.5pt!important;width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;}' +
      '.us683-print-p2-wrap th,.us683-print-p2-wrap td{' +
      'padding:0 1px!important;border:1px solid #bbb!important;vertical-align:top!important;' +
      'font-size:5.5pt!important;line-height:1.08!important;}' +
      '.us683-print-p2-wrap td{word-break:break-word!important;overflow:visible!important;white-space:normal!important;}' +
      '.us683-print-p2-wrap td:nth-child(1){width:8.5em!important;white-space:nowrap!important;}' +
      '.us683-print-p2-wrap td:nth-child(2){width:2em!important;white-space:nowrap!important;text-align:right!important;}' +
      '}';
  }

  /** 印刷2枚目: 余白圧縮＋data属性の全文を復元（…切り捨て禁止） */
  function user683TightenPrintSummaryTable(root) {
    if (!root) return;
    var tables = root.querySelectorAll('table');
    for (var ti = 0; ti < tables.length; ti += 1) {
      var tbl = tables[ti];
      tbl.style.margin = '0';
      tbl.style.fontSize = '5.5pt';
      var cells = tbl.querySelectorAll('th,td');
      for (var ci = 0; ci < cells.length; ci += 1) {
        var cell = cells[ci];
        cell.style.padding = '0 1px';
        cell.style.fontSize = '5.5pt';
        cell.style.lineHeight = '1.08';
        cell.style.verticalAlign = 'top';
        cell.style.overflow = 'visible';
        cell.style.maxHeight = 'none';
      }
      var bodyCells = tbl.querySelectorAll('tbody td:nth-child(3)');
      for (var bi = 0; bi < bodyCells.length; bi += 1) {
        var bd = bodyCells[bi];
        var full = bd.getAttribute('data-us683-full-summary');
        if (full) {
          bd.textContent = full;
          bd.title = full;
        }
        bd.style.whiteSpace = 'normal';
        bd.style.wordBreak = 'break-word';
        bd.style.overflow = 'visible';
        bd.style.maxHeight = 'none';
        bd.style.textOverflow = 'clip';
      }
    }
  }

  /** クローンした画面用グラフの巨大 minHeight を印刷向けに潰す */
  function user683CompactPrintChartClone(root) {
    if (!root) return;
    var cards = root.querySelectorAll('.us683-bar-card,.us683-week-card');
    for (var i = 0; i < cards.length; i += 1) {
      cards[i].style.margin = '0';
      cards[i].style.padding = '4px 6px';
    }
    var rows = root.querySelectorAll('.us683-bar-card-row,.us683-week-card-row');
    for (var ri = 0; ri < rows.length; ri += 1) {
      rows[ri].style.minHeight = '0';
      rows[ri].style.height = 'auto';
    }
    var tallEls = root.querySelectorAll('div');
    for (var bi = 0; bi < tallEls.length; bi += 1) {
      var bh = parseFloat(tallEls[bi].style.height || '') || 0;
      if (bh >= 140) {
        tallEls[bi].style.height = Math.round(bh * 0.5) + 'px';
      }
    }
  }

  /**
   * A4横1枚（約202mm）にシート全体を scale して収める。
   * 計測前に portal を画面外で display できる状態にしておくこと。
   */
  function user683FitPrintSheet(pageEl) {
    if (!pageEl) return;
    var inner = pageEl.querySelector('.us683-print-sheet-inner');
    if (!inner) return;
    pageEl.style.height = '202mm';
    pageEl.style.maxHeight = '202mm';
    pageEl.style.overflow = 'hidden';
    inner.style.transform = 'none';
    inner.style.width = '100%';
    var maxH = pageEl.clientHeight;
    if (!maxH || maxH < 80) {
      maxH = Math.round((202 * 96) / 25.4);
    }
    var h = Math.max(inner.scrollHeight, inner.offsetHeight);
    if (h <= maxH + 1) return;
    var s = (maxH / h) * 0.985;
    if (s < 0.28) s = 0.28;
    if (s > 1) s = 1;
    inner.style.transformOrigin = 'top left';
    inner.style.transform = 'scale(' + s + ')';
    inner.style.width = 100 / s + '%';
  }

  function getOrCreateUser683PrintPortal() {
    var el = document.getElementById('user683-print-report-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'user683-print-report-portal';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  function user683StripAllIds(root) {
    if (!root) {
      return;
    }
    if (root.getAttribute && root.getAttribute('id')) {
      root.removeAttribute('id');
    }
    var n = root.querySelectorAll('[id]');
    for (var i = 0; i < n.length; i += 1) {
      n[i].removeAttribute('id');
    }
  }

  function user683CloneHostFirstChild(hostId) {
    var host = document.getElementById(hostId);
    if (!host || !host.firstElementChild) {
      return null;
    }
    var c = host.firstElementChild.cloneNode(true);
    user683StripAllIds(c);
    return c;
  }

  function user683ScalePrintChartSlot(slot, scale) {
    if (!slot || !slot.firstElementChild) return;
    var child = slot.firstElementChild;
    user683CompactPrintChartClone(child);
    var s = scale > 0 && scale <= 1 ? scale : 0.78;
    child.classList.add('us683-print-chart-scaled');
    child.style.transform = 'none';
    child.style.width = '100%';
    var h0 = child.offsetHeight || child.scrollHeight || 0;
    child.style.transform = 'scale(' + s + ')';
    child.style.transformOrigin = 'top left';
    child.style.width = 100 / s + '%';
    var h = h0 > 0 ? h0 : child.offsetHeight || child.scrollHeight || 0;
    if (h > 0) {
      slot.style.height = Math.ceil(h * s) + 'px';
    }
    slot.style.overflow = 'hidden';
  }

  function openUser683PrintReport() {
    if (!document.getElementById('user683-hero')) {
      window.alert('ダッシュの読み込み完了後に「印刷報告用」を押してください。');
      return;
    }
    ensureUser683PrintReportStyles();
    var portal = getOrCreateUser683PrintPortal();
    portal.innerHTML = '';

    var p1 = document.createElement('div');
    p1.className = 'us683-print-page1';
    var p1inner = document.createElement('div');
    p1inner.className = 'us683-print-sheet-inner';
    p1.appendChild(p1inner);

    var heroSrc = document.getElementById('user683-hero');
    var hw = document.createElement('div');
    hw.className = 'us683-print-hero-wrap us683-print-block';
    var hi = document.createElement('div');
    hi.className = 'us683-print-hero-inner';
    var hc = heroSrc.cloneNode(true);
    user683StripAllIds(hc);
    hi.appendChild(hc);
    hw.appendChild(hi);
    p1inner.appendChild(hw);

    var curTotalAttr = heroSrc.getAttribute('data-us683-cur-total') || '';
    var prevTotalAttr = heroSrc.getAttribute('data-us683-prev-total') || '';
    var prevHasAttr = heroSrc.getAttribute('data-us683-prev-has') || '0';
    var curN = Number(curTotalAttr);
    var prevN = Number(prevTotalAttr);
    if (!Number.isFinite(curN)) {
      curN = 0;
    }
    if (!Number.isFinite(prevN)) {
      prevN = 0;
    }
    var momBox = document.createElement('div');
    momBox.className = 'us683-print-mom-box us683-print-block';
    var momLabel = document.createElement('div');
    momLabel.className = 'us683-print-mom-label';
    momLabel.textContent = '【先月対比（件数）】';
    momBox.appendChild(momLabel);
    var momBody;
    if (prevHasAttr !== '1') {
      momBody = '前月比: —（前月にデータなし）';
    } else {
      var delta = curN - prevN;
      if (delta > 0) {
        momBody =
          '前月比: 先月より +' +
          delta +
          ' 件増加（先月 ' +
          prevN +
          ' 件 → 当月 ' +
          curN +
          ' 件）';
      } else if (delta < 0) {
        momBody =
          '前月比: 先月より −' +
          Math.abs(delta) +
          ' 件減少（先月 ' +
          prevN +
          ' 件 → 当月 ' +
          curN +
          ' 件）';
      } else {
        momBody = '前月比: 先月と同数（先月・当月とも ' + curN + ' 件）';
      }
    }
    momBox.appendChild(document.createTextNode(momBody));
    p1inner.appendChild(momBox);

    var h2m = document.createElement('h2');
    h2m.className = 'us683-print-h2 us683-print-h2-month';
    h2m.textContent = '月次要約';
    p1inner.appendChild(h2m);
    var ms = document.createElement('div');
    ms.className = 'us683-print-month-summary us683-print-block';
    var mta = document.getElementById('user683-month-note');
    var summaryText = mta ? String(mta.value || '').trim() : '';
    if (!mta) {
      ms.textContent = '（月次要約フィールドなし）';
    } else if (!summaryText) {
      ms.textContent = '（月次要約未入力 — 件数の先月対比は上枠を参照）';
    } else {
      ms.textContent = summaryText;
    }
    p1inner.appendChild(ms);

    function addChartCol(parentCol, title, hostId, scale) {
      var h2 = document.createElement('h2');
      h2.className = 'us683-print-h2';
      h2.textContent = title;
      parentCol.appendChild(h2);
      var slot = document.createElement('div');
      slot.className = 'us683-print-block us683-print-chart-slot';
      if (scale) {
        slot.setAttribute('data-us683-print-scale', String(scale));
      }
      var cloned = user683CloneHostFirstChild(hostId);
      if (cloned) {
        user683CompactPrintChartClone(cloned);
        slot.appendChild(cloned);
      } else {
        slot.textContent = '（グラフを取得できませんでした）';
      }
      parentCol.appendChild(slot);
      return slot;
    }

    /* 1枚目: 月次要約＋日次グラフ */
    var dayFull = document.createElement('div');
    dayFull.className = 'us683-print-chart-full us683-print-block';
    addChartCol(dayFull, '日次グラフ', 'user683-chart-day', 0.55);
    p1inner.appendChild(dayFull);
    portal.appendChild(p1);

    /* 2枚目: 週次|年次＋対応案件一覧（全文） */
    var p2 = document.createElement('div');
    p2.className = 'us683-print-page2';
    var p2inner = document.createElement('div');
    p2inner.className = 'us683-print-sheet-inner';
    p2.appendChild(p2inner);

    var chartRow = document.createElement('div');
    chartRow.className = 'us683-print-chart-row us683-print-block';
    var colWeek = document.createElement('div');
    colWeek.className = 'us683-print-chart-col';
    var colYear = document.createElement('div');
    colYear.className = 'us683-print-chart-col';
    addChartCol(colWeek, '週次グラフ', 'user683-chart-week', 0.38);
    addChartCol(
      colYear,
      '年次推移グラフ（直近6暦月）',
      'user683-chart-year',
      0.38,
    );
    chartRow.appendChild(colWeek);
    chartRow.appendChild(colYear);
    p2inner.appendChild(chartRow);

    var h2t = document.createElement('h2');
    h2t.className = 'us683-print-h2';
    h2t.textContent = '対応案件一覧（サマリー）';
    p2inner.appendChild(h2t);
    var wrap2 = document.createElement('div');
    wrap2.className = 'us683-print-p2-wrap';
    var th = document.getElementById('user683-table-host');
    if (th && th.firstElementChild) {
      var tclone = th.firstElementChild.cloneNode(true);
      user683StripAllIds(tclone);
      wrap2.appendChild(tclone);
      user683TightenPrintSummaryTable(wrap2);
    } else {
      wrap2.textContent = '（一覧表がまだありません）';
    }
    p2inner.appendChild(wrap2);
    portal.appendChild(p2);

    if (!USER683_PRINT_AFTERPRINT_BOUND) {
      USER683_PRINT_AFTERPRINT_BOUND = true;
      window.addEventListener(
        'afterprint',
        function () {
          var p = document.getElementById('user683-print-report-portal');
          if (p) {
            p.innerHTML = '';
          }
        },
        false,
      );
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        var slots = portal.querySelectorAll('.us683-print-chart-slot');
        for (var si = 0; si < slots.length; si += 1) {
          var sl = slots[si];
          if (sl.firstElementChild) {
            var sc = Number(
              sl.getAttribute('data-us683-print-scale') || '0.78',
            );
            user683ScalePrintChartSlot(sl, sc);
          }
        }
        user683FitPrintSheet(p1);
        user683FitPrintSheet(p2);
        try {
          window.print();
        } catch (ePrint) {
          console.warn(BUILD, ePrint);
        }
      });
    });
  }

  function refresh683Dash() {
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
    root.className = 'us683-dash-root';
    root.setAttribute('data-build', BUILD);

    const heroHost = document.createElement('div');
    heroHost.id = 'user683-hero-host';
    const loadHero = document.createElement('div');
    loadHero.style.cssText =
      'padding:22px;margin:10px 12px;border-radius:8px;background:#e2e8f0;font-weight:600;color:#334155;font-size:15px;';
    loadHero.textContent = '当月合計・前月比・表・グラフを読み込み中…';
    heroHost.appendChild(loadHero);
    root.appendChild(heroHost);

    const intro = document.createElement('div');
    intro.style.cssText =
      'padding:8px 12px;font-size:14px;color:#1e293b;border-bottom:1px solid #d0d7de;background:#f0f4f8;';
    intro.innerHTML =
      '<a href="/k/' + APP682 + '/" target="_blank" rel="noopener">ユーザサポート件数日次</a>';
    root.appendChild(intro);

    const tool = document.createElement('div');
    tool.className = 'us683-dash-toolbar';
    tool.style.display = 'flex';
    tool.style.alignItems = 'center';
    tool.style.flexWrap = 'wrap';
    tool.style.gap = '8px';
    tool.style.margin = '8px 12px 4px';
    tool.style.fontSize = '13px';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '← 前月';
    prevBtn.style.cursor = 'pointer';
    prevBtn.onclick = function () {
      const n = addMonthsCal(ym.y, ym.m, -1);
      writeStoredYm(n.y, n.m);
      refresh683Dash();
    };
    tool.appendChild(prevBtn);

    const spanYm = document.createElement('strong');
    spanYm.textContent = ym.y + '年' + ym.m + '月';
    tool.appendChild(spanYm);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = '次月 →';
    nextBtn.style.cursor = 'pointer';
    nextBtn.onclick = function () {
      const n = addMonthsCal(ym.y, ym.m, 1);
      writeStoredYm(n.y, n.m);
      refresh683Dash();
    };
    tool.appendChild(nextBtn);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = '今月に戻す';
    resetBtn.style.cursor = 'pointer';
    resetBtn.disabled = isNaturalThisMonth && readStoredYm() == null;
    resetBtn.onclick = function () {
      clearStoredYm();
      refresh683Dash();
    };
    tool.appendChild(resetBtn);

    const printReportBtn = document.createElement('button');
    printReportBtn.type = 'button';
    printReportBtn.textContent = '印刷報告用';
    printReportBtn.title =
      'ブラウザの印刷ダイアログを開きます（A4横・計2枚）。向き「横」を確認。';
    printReportBtn.style.cursor = 'pointer';
    printReportBtn.onclick = function () {
      openUser683PrintReport();
    };
    tool.appendChild(printReportBtn);

    root.appendChild(tool);

    const msgHost = document.createElement('div');
    msgHost.id = 'user683-dash-messages';
    root.appendChild(msgHost);

    const chartsOuter = document.createElement('div');
    chartsOuter.id = 'user683-charts-wrap';
    chartsOuter.style.margin = '12px 12px 8px';
    chartsOuter.style.boxSizing = 'border-box';
    chartsOuter.style.width = '100%';
    chartsOuter.style.overflowX = 'hidden';

    /** 1段目: 日次のみ（横幅いっぱい）。2段目: 週次＋月次。 */
    const chartsRowDay = document.createElement('div');
    chartsRowDay.style.display = 'flex';
    chartsRowDay.style.width = '100%';
    chartsRowDay.style.overflowX = 'hidden';
    chartsRowDay.style.minWidth = '0';

    const chartsRowWeekMonth = document.createElement('div');
    chartsRowWeekMonth.style.display = 'flex';
    chartsRowWeekMonth.style.flexWrap = 'wrap';
    chartsRowWeekMonth.style.gap = '16px';
    chartsRowWeekMonth.style.marginTop = '12px';
    chartsRowWeekMonth.style.alignItems = 'flex-start';
    chartsRowWeekMonth.style.width = '100%';
    chartsRowWeekMonth.style.overflowX = 'hidden';
    chartsRowWeekMonth.style.minWidth = '0';

    const chartDayHost = document.createElement('div');
    chartDayHost.id = 'user683-chart-day';
    chartDayHost.style.flex = '1';
    chartDayHost.style.minWidth = '0';
    chartDayHost.style.width = '100%';
    chartDayHost.style.boxSizing = 'border-box';
    chartDayHost.style.overflowX = 'hidden';

    const chartWeekHost = document.createElement('div');
    chartWeekHost.id = 'user683-chart-week';
    chartWeekHost.style.flex = '1';
    chartWeekHost.style.minWidth = '200px';
    chartWeekHost.style.boxSizing = 'border-box';
    chartWeekHost.style.overflow = 'hidden';

    const chartYearHost = document.createElement('div');
    chartYearHost.id = 'user683-chart-year';
    chartYearHost.style.flex = '1';
    chartYearHost.style.minWidth = '220px';
    chartYearHost.style.boxSizing = 'border-box';
    chartYearHost.style.overflow = 'hidden';

    chartsRowDay.appendChild(chartDayHost);
    chartsRowWeekMonth.appendChild(chartWeekHost);
    chartsRowWeekMonth.appendChild(chartYearHost);
    chartsOuter.appendChild(chartsRowDay);
    chartsOuter.appendChild(chartsRowWeekMonth);
    root.appendChild(chartsOuter);

    if (USER683_SHOW_AI_SUMMARY_UI) {
      root.appendChild(buildAiSummaryPlaceholderEl(ym));
    }

    const tableHost = document.createElement('div');
    tableHost.id = 'user683-table-host';
    const tableWrap = document.createElement('div');
    tableWrap.style.marginTop = '6px';
    tableWrap.appendChild(tableHost);
    root.appendChild(tableWrap);

    header.appendChild(root);

    const range = monthQueryRange(ym.y, ym.m);
    const prevYm = addMonthsCal(ym.y, ym.m, -1);
    const prevRange = monthQueryRange(prevYm.y, prevYm.m);

    const summaryCacheP = USER683_SHOW_AI_SUMMARY_UI
      ? fetchSummaryCacheFromKintone(ym)
      : Promise.resolve(null);

    Promise.all([
      fetchAllRecordDatesForQuery(APP682, range.query),
      fetchRecordsFieldsForQuery(APP682, range.query, [
        FC_DATE,
        FC_DAY_TOTAL,
        FC_AM,
        FC_PM,
        FC_AM_TEXT,
        FC_PM_TEXT,
      ]),
      sumDayTotalInRange(APP682, prevRange.query),
      fetchSixMonthBarTotals(ym),
      summaryCacheP,
    ])
      .then(function (tuple) {
        const res = tuple[0];
        const monthRec = tuple[1];
        const prev = tuple[2];
        const sixData = tuple[3];
        const summaryCache = tuple[4];

        const a = analyzeMonthRecords(res.records, ym.y, ym.m, range.dim);
        fillBannerMessages(msgHost, {
          missing: a.missing,
          dupInfo: a.dupInfo,
          M: a.M,
          N: a.N,
        });

        const curTotal = sumDayTotalFromDetailRecords(monthRec);
        const prevHasRecords = prev.recordCount > 0;
        const prevTotal = prev.sum;

        heroHost.innerHTML = '';
        heroHost.appendChild(buildHeroEl(ym, curTotal, prevHasRecords, prevTotal));

        const byDay = aggregate683ByYmd(monthRec);

        const dayLabels = [];
        const dayVals = [];
        const dayLabelColors = [];
        for (let d = 1; d <= range.dim; d += 1) {
          const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
          const wdN = jstWeekdayNarrowJa(ym.y, ym.m, d);
          dayLabels.push(String(d) + '(' + wdN + ')');
          dayVals.push(byDay[ymd] ? byDay[ymd].dt : 0);
          dayLabelColors.push(
            jstBrownCalendarYmd(ymd) ? COLOR_DAY_LABEL_WEEKEND_HOLIDAY : COLOR_DAY_LABEL_WEEKDAY,
          );
        }
        chartDayHost.innerHTML = '';
        chartDayHost.appendChild(
          buildBarCardGrid(
            ym.y + '年' + ym.m + '月・日次（件）',
            dayLabels,
            dayVals,
            {
              compact: true,
              chartCardExtraClass: 'us683-bar-card--daily',
              barColor: CH683_BAR_DAY,
              tall: true,
              chartBoost: true,
              chartTight: false,
              chartBigLabels: false,
              chartNarrowBars: true,
              chartFitNoScroll: true,
              chartBarMaxColumnPct: 50,
              chartPackColumnsTight: true,
              chartRowGapPx: 0,
              chartLabFontPx: range.dim >= 31 ? '8px' : '9px',
              chartNumFontPx: '11px',
              labelColors: dayLabelColors,
            },
          ),
        );

        const ysums = sixData.ysums;
        const yLabels = [];
        const yVals = [];
        for (let si = 0; si < sixData.slots.length; si += 1) {
          const sk = sixData.slots[si].key;
          const p = sk.split('-');
          yLabels.push(p[0] + '/' + p[1]);
          yVals.push(ysums[sk] != null ? ysums[sk] : 0);
        }
        chartYearHost.innerHTML = '';
        chartYearHost.appendChild(
          buildBarCardGrid(
            '月次・直近6暦月の合計（右端＝' + ym.y + '年' + ym.m + '月・各月の日合計合算）',
            yLabels,
            yVals,
            {
              compact: true,
              barColor: CH683_BAR_MONTH,
              tall: true,
              chartBoost: true,
              chartFitNoScroll: true,
              chartRowGapPx: 6,
            },
          ),
        );

        chartWeekHost.innerHTML = '';
        chartWeekHost.appendChild(buildWeekStackedAmPmBarGrid(ym, byDay, { compactThreeColumn: true }));

        tableHost.innerHTML = '';
        tableHost.appendChild(buildMonthTableEl(ym, range.dim, byDay));

        if (USER683_SHOW_AI_SUMMARY_UI) {
          hydrate683SummaryTextareasFromServer(ym, summaryCache);
          updateWeekBlockCountLabels(ym, byDay);
          attachSummarySaveControls(ym);
          if (USER683_SHOW_CLAUDE_GENERATE_BTN) {
            attachClaudeGenerateControls(ym, range.dim, byDay);
          }
        }
      })
      .catch(function (e) {
        console.error(BUILD, e);
        heroHost.innerHTML = '';
        const err = document.createElement('div');
        err.style.cssText =
          'padding:16px;margin:10px 12px;border-radius:8px;background:#fff3cd;color:#533f03;border:1px solid #856404;';
        err.textContent =
          '682 のレコードを取得できませんでした（通信・権限・682 アプリ権限を確認）。再読込してください。';
        heroHost.appendChild(err);
        fillBannerMessages(msgHost, {
          error:
            '682 のレコードを取得できませんでした（通信・権限・682 アプリ権限を確認）。再読込してください。',
        });
        chartDayHost.textContent = '';
        chartYearHost.textContent = '';
        chartWeekHost.textContent = '';
        tableHost.textContent = '';
      });
  }

  try {
    applyClaudeRelayFromQuery();
  } catch (eApply) {
    console.warn(BUILD, eApply);
  }

  kintone.events.on('app.record.index.show', function (ev) {
    try {
      applyClaudeRelayFromQuery();
    } catch (eApply2) {
      console.warn(BUILD, eApply2);
    }
    try {
      refresh683Dash();
    } catch (e) {
      console.error(BUILD, e);
    }
    return ev;
  });
})();
