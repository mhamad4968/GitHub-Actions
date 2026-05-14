/**
 * ユーザサポート682ダッシュ（683）— Space 48 配置・682 をデータ正本とする閲覧専用ダッシュ（SPEC §6.1.1）
 *
 * 集計・欠日・重複のロジック正本: `customize/682/desktop.js`（本ファイルは初版コピー＋682 向け API 呼び出し。**月次・日次の日合計は暦日ごとに day_total を一度だけ計上**し 682 と整合）。
 * 共通化は SPEC §6.1.1 に従い次イテレーションで shared モジュール化予定。
 *
 *   npm run cio:preflight:683 -- --note "…"
 *   npm run deploy:683
 *
 * Ollama 要約（ブラウザ）: `npm run user683:ollama-relay`（中継）＋`docs/runbooks/user683-ollama-relay.md`。
 * 自動投入（推奨）: `npm run user683:sync-summaries:apply` → `docs/runbooks/user683-summary-job.md`（682→Ollama→kintone、683 は GET で表示）。
 */
(function () {
  'use strict';

  const BUILD = '2026-05-14-683-fetch-pagination-safe';
  /** `false`: AI要約ブロック（週次・月次・Ollama ボタン）を非表示。再表示するときは `true` にして deploy:683。 */
  const USER683_SHOW_AI_SUMMARY_UI = false;
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
  /** Ollama 中継 JSON 肥大防止のため日次コーパス上限（表には出さない） */
  const RELAY_DAY_CORPUS_MAX_LEN = 3200;
  /** 週次メモ（683 のみ・sessionStorage。682 正本とは未連携） */
  const WEEK_NOTE_KEY = 'user_support_683_week_notes_v1';
  const MONTH_NOTE_KEY = 'user_support_683_month_note_v1';
  /** 中継の POST 先（フル URL。例: https://社内ホスト/user683/summarize）。sessionStorage 優先。 */
  const RELAY_URL_STORAGE_KEY = 'user_support_683_ollama_relay_url';
  /** `user683:sync-summaries:*` が書き込む要約キャッシュを読むアプリ（`window.USER683_SUMMARY_CACHE_APP` で上書き可） */
  const SUMMARY_CACHE_APP_DEFAULT = 683;

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

  /** Ollama 中継コーパス用の日付ラベル（月日の先頭ゼロ省略） */
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

  const COLOR_DAY_LABEL_WEEKEND_HOLIDAY = '#92400e';
  const COLOR_DAY_LABEL_WEEKDAY = '#0f172a';

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

  /** 当該暦日を含む週の月曜（JST） */
  function jstMondayOfWeekContaining(year, month1to12, anchorDay) {
    const w = jstWeekdaySun0(year, month1to12, anchorDay);
    const delta = (w + 6) % 7;
    return jstCalendarAddDays(year, month1to12, anchorDay, -delta);
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
    try {
      const raw = window.sessionStorage.getItem(WEEK_NOTE_KEY);
      if (!raw) return ['', '', '', ''];
      const o = JSON.parse(raw);
      if (o && o.y === ym.y && o.m === ym.m && Array.isArray(o.w) && o.w.length === 4) {
        return o.w.map(function (x) {
          return String(x);
        });
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    return ['', '', '', ''];
  }

  function writeWeekNotes(ym, arr) {
    try {
      window.sessionStorage.setItem(
        WEEK_NOTE_KEY,
        JSON.stringify({ y: ym.y, m: ym.m, w: arr.slice(0, 4) }),
      );
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

  /** フィールドコードは `docs/runbooks/user683-summary-job.md` と `user683-sync-summaries-to-kintone.mjs` と一致させる */
  function fetchSummaryCacheFromKintone(ym) {
    var appId =
      typeof window !== 'undefined' && window.USER683_SUMMARY_CACHE_APP != null
        ? String(window.USER683_SUMMARY_CACHE_APP)
        : String(SUMMARY_CACHE_APP_DEFAULT);
    var ymk = ym.y + '-' + pad2(ym.m);
    var q = 'user683_dash_ym = "' + ymk + '" limit 1';
    return kintone
      .api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: appId,
        query: q,
        fields: [
          'user683_dash_ym',
          'user683_week_1',
          'user683_week_2',
          'user683_week_3',
          'user683_week_4',
          'user683_month',
        ],
      })
      .then(function (resp) {
        var recs = resp.records || [];
        if (!recs.length) return null;
        var r = recs[0];
        function gv(code) {
          return r[code] && r[code].value != null ? String(r[code].value) : '';
        }
        return {
          weeks: [gv('user683_week_1'), gv('user683_week_2'), gv('user683_week_3'), gv('user683_week_4')],
          month: gv('user683_month'),
        };
      })
      .catch(function (e) {
        console.warn(BUILD, 'summary cache GET', e);
        return null;
      });
  }

  function hydrate683SummaryTextareasFromServer(ym, sc) {
    if (!sc || !sc.weeks) return;
    var changed = false;
    for (var i = 0; i < 4; i += 1) {
      var ta = document.getElementById('user683-week-note-' + i);
      if (!ta) continue;
      var localTrim = String(ta.value || '').trim();
      var sv = sc.weeks[i] != null ? String(sc.weeks[i]).trim() : '';
      if (sv && !localTrim) {
        ta.value = String(sc.weeks[i]);
        changed = true;
      }
    }
    var mta = document.getElementById('user683-month-note');
    if (mta && sc.month != null) {
      var msv = String(sc.month).trim();
      if (msv && !String(mta.value || '').trim()) {
        mta.value = String(sc.month);
        changed = true;
      }
    }
    if (changed) {
      var nextW = [];
      for (var j = 0; j < 4; j += 1) {
        var t2 = document.getElementById('user683-week-note-' + j);
        nextW.push(t2 ? t2.value : '');
      }
      writeWeekNotes(ym, nextW);
      writeMonthNote(ym, mta ? mta.value : '');
    }
  }

  /**
   * 683 中継 POST 先の文字列を正規化する。
   * 例: 先頭に数字が付いた `20http//127.0.0.1:11434/...` → `http://127.0.0.1:11434/...` を抽出し、
   * `http//` を `http://` に直す。`https:// http://127.0.0.1/...` のような **二重スキーム**は先頭を剥がす。
   * 11434 は Ollama 本体で `/user683/summarize` は載らないため、
   * localhost 系かつパスが中継のときだけ **17883** に寄せる（`npm run user683:ollama-relay` の待受）。
   */
  function normalizeOllamaRelaySummarizeUrl(raw) {
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
      u.port = '17883';
    }
    var out = u.href;
    if (out.endsWith('/')) {
      out = out.replace(/\/+$/, '');
    }
    return out;
  }

  function getOllamaRelaySummarizeUrl() {
    var fromWin = '';
    var fromSess = '';
    try {
      if (typeof window !== 'undefined' && window.USER683_OLLAMA_RELAY_URL) {
        fromWin = String(window.USER683_OLLAMA_RELAY_URL).trim();
      }
    } catch (e) {
      console.warn(BUILD, e);
    }
    try {
      var s0 = window.sessionStorage.getItem(RELAY_URL_STORAGE_KEY);
      if (s0 && String(s0).trim()) {
        fromSess = String(s0).trim();
      }
    } catch (e2) {
      console.warn(BUILD, e2);
    }
    var raw = fromWin || fromSess;
    if (!raw) return '';
    var norm = normalizeOllamaRelaySummarizeUrl(raw);
    if (!norm) return '';
    if (norm !== raw) {
      console.info(BUILD, 'ollama relay URL normalized', { from: raw, to: norm });
    }
    if (norm !== raw) {
      try {
        window.sessionStorage.setItem(RELAY_URL_STORAGE_KEY, norm);
      } catch (e3) {
        console.warn(BUILD, e3);
      }
    }
    return norm;
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
    const anchors = [1, 8, 15, 22];
    const mondays = anchors.map(function (ad) {
      return jstMondayOfWeekContaining(ym.y, ym.m, ad);
    });
    const ranges = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, dim],
    ];
    const weeks = [];
    for (let wi = 0; wi < 4; wi += 1) {
      const mon = mondays[wi];
      const label = String(mon.m) + '/' + String(mon.d) + '週次';
      const corpus = collectCorpusForDayRange(ym, dim, ranges[wi][0], ranges[wi][1], byDay);
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

  function attachOllamaGenerateControls(ym, dim, byDay) {
    const wrap = document.getElementById('user683-ai-summary-placeholder');
    if (!wrap || wrap.querySelector('#user683-ollama-generate-btn')) {
      return;
    }
    const first = wrap.firstElementChild;
    if (!first) {
      return;
    }
    const headerRow = document.createElement('div');
    headerRow.id = 'user683-ai-header-row';
    headerRow.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;';
    wrap.insertBefore(headerRow, first);
    headerRow.appendChild(first);

    const btn = document.createElement('button');
    btn.id = 'user683-ollama-generate-btn';
    btn.type = 'button';
    btn.textContent = 'Ollamaで週次・月次要約を生成';
    btn.style.cssText =
      'cursor:pointer;padding:8px 14px;font-size:13px;font-weight:700;border-radius:6px;border:1px solid #0f766e;background:#14b8a6;color:#fff;';
    headerRow.appendChild(btn);

    const st = document.createElement('div');
    st.id = 'user683-ollama-gen-status';
    st.style.cssText = 'width:100%;font-size:12px;color:#64748b;margin-top:4px;';
    st.textContent = '';
    headerRow.appendChild(st);

    btn.onclick = function () {
      const url = getOllamaRelaySummarizeUrl();
        if (!url) {
        window.alert(
          '中継 URL が未設定です（sessionStorage または window.USER683_OLLAMA_RELAY_URL）。\n' +
            '自動投入なら PC で: npm run user683:sync-summaries:apply（Runbook docs/runbooks/user683-summary-job.md）。\n' +
            '\n' +
            '【この PC で中継を 17883 で動かしているとき・コンソール例】\n' +
            "sessionStorage.setItem('" +
            RELAY_URL_STORAGE_KEY +
            "', 'http://127.0.0.1:17883/user683/summarize');\n" +
            'location.reload();\n' +
            '\n' +
            '※ kintone が **HTTPS**（cybozu.com）のとき、**http://127.0.0.1** はブラウザの **混在コンテンツ**でブロックされることがあります。その場合は **HTTPS の社内中継 URL** を設定してください（Runbook docs/runbooks/user683-ollama-relay.md）。\n' +
            '（**11434** は Ollama 本体。**`http//`** のコロン欠けは ERR_NAME_NOT_RESOLVED の原因になります。）',
        );
        return;
      }
      btn.disabled = true;
      st.textContent = '生成中…（数分かかることがあります）';
      const payload = buildRelayPayload(ym, dim, byDay);
      const ac = new AbortController();
      const to = window.setTimeout(function () {
        ac.abort();
      }, 300000);
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          const ws = data.weekSummaries;
          if (!ws || !Array.isArray(ws)) {
            throw new Error('invalid response');
          }
          for (let i = 0; i < 4; i += 1) {
            const ta = document.getElementById('user683-week-note-' + i);
            if (ta) {
              ta.value = ws[i] != null ? String(ws[i]) : '';
            }
          }
          const mta = document.getElementById('user683-month-note');
          if (mta) {
            mta.value = data.monthSummary != null ? String(data.monthSummary) : '';
          }
          const nextW = [];
          for (let j = 0; j < 4; j += 1) {
            const t2 = document.getElementById('user683-week-note-' + j);
            nextW.push(t2 ? t2.value : '');
          }
          writeWeekNotes(ym, nextW);
          writeMonthNote(ym, mta ? mta.value : '');
          st.textContent = '完了しました。一覧を更新しています…';
          window.setTimeout(function () {
            try {
              refresh683Dash();
            } catch (e4) {
              console.error(BUILD, e4);
              window.location.reload();
            }
          }, 80);
        })
        .catch(function (e) {
          console.error(BUILD, e);
          st.textContent =
            '失敗: ' +
            (e && e.message ? e.message : String(e)) +
            '（中継・Ollama・HTTPS/CORS を確認）';
          window.alert(
            '要約の取得に失敗しました。中継が起動しているか、URL が HTTPS で届くか、Ollama が応答するかを確認してください。\n' +
              String(e && e.message ? e.message : e),
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

  /** 満ページのときだけ次 offset を取る（totalCount だけで継続しない） */
  function shouldFetchMoreKintoneRecords(batchLen, pageLimit) {
    return batchLen > 0 && batchLen === pageLimit;
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
          if (shouldFetchMoreKintoneRecords(batch.length, limit)) {
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
   * 中継→Ollama 用。682 の午前／午後対応文を連結（表には表示しない）。
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
    const labelColors = (opt && opt.labelColors) || null;
    const barColor = (opt && opt.barColor) || '#2563eb';
    const wrap = document.createElement('div');
    wrap.style.margin = boost ? '4px 0 10px' : '8px 0';
    wrap.style.padding = boost ? '12px 14px 14px' : compact ? '8px 10px' : '10px 12px';
    wrap.style.border = '1px solid #ccc';
    wrap.style.borderRadius = '6px';
    wrap.style.background = '#fafafa';
    const t = document.createElement('div');
    t.style.fontWeight = 'bold';
    t.style.marginBottom = boost ? '10px' : '6px';
    t.style.fontSize = boost ? '15px' : compact ? '12px' : '13px';
    t.textContent = title;
    wrap.appendChild(t);

    let maxVal = 1;
    for (let j = 0; j < values.length; j += 1) {
      if (values[j] > maxVal) maxVal = values[j];
    }

    const barH = boost ? (compact ? 208 : 248) : tall ? (compact ? 112 : 144) : compact ? 72 : 96;
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-end';
    row.style.justifyContent = 'space-between';
    var gapStr = chartTight ? '0px' : boost ? '4px' : compact ? '2px' : '4px';
    if (opt && opt.chartRowGapPx != null && !isNaN(Number(opt.chartRowGapPx))) {
      gapStr = String(Number(opt.chartRowGapPx)) + 'px';
    }
    row.style.gap = gapStr;
    row.style.minHeight = boost ? (compact ? 236 : 276) : tall ? (compact ? 132 : 172) : compact ? 92 : 120;
    row.style.overflowX = 'auto';

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
    /** 日別など「1(水)」が列幅より広いとき、横スクロールで読めるよう列の最小幅を確保 */
    if (opt && opt.chartColMinW) {
      colMinW = String(opt.chartColMinW);
    }
    if (opt && opt.chartLabFontPx) {
      fsLab = String(opt.chartLabFontPx);
    }
    if (opt && opt.chartNumFontPx) {
      fsNum = String(opt.chartNumFontPx);
    }

    for (let i = 0; i < labels.length; i += 1) {
      const val = values[i];
      const col = document.createElement('div');
      col.style.flex = '1';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.minWidth = colMinW;

      const bar = document.createElement('div');
      bar.style.width = '100%';
      bar.style.maxWidth = barMaxW;
      bar.style.margin = '0 auto';
      bar.style.height = Math.max(2, Math.round((barH * val) / maxVal)) + 'px';
      bar.style.background = barColor;
      bar.style.borderRadius = '2px 2px 0 0';
      const labStr = labels[i];
      bar.title = labStr + ': ' + val + '件';

      const num = document.createElement('div');
      num.style.marginTop = boost ? '6px' : '2px';
      num.style.fontSize = fsNum;
      num.style.fontWeight = '700';
      const lc = labelColors && labelColors[i] != null ? labelColors[i] : '#0f172a';
      num.style.color = lc;
      num.textContent = String(val);

      const lab = document.createElement('div');
      lab.style.marginTop = boost ? '4px' : '1px';
      lab.style.fontSize = fsLab;
      lab.style.fontWeight = boost ? '600' : '400';
      lab.style.color = lc;
      lab.style.lineHeight = chartTight ? '1.05' : '1.2';
      lab.style.textAlign = 'center';
      lab.style.whiteSpace = 'nowrap';
      lab.textContent = labStr;

      col.appendChild(bar);
      col.appendChild(num);
      col.appendChild(lab);
      row.appendChild(col);
    }
    wrap.appendChild(row);
    return wrap;
  }

  /**
   * 週次は「1〜7 / 8〜14 / 15〜21 / 22〜月末」ブロックに含まれる週の月曜（JST）をラベルに使用。
   * 初期値は sessionStorage。kintone キャッシュは **欄が空のときだけ** hydrate で補完（Ollama 直後の再描画でサーバ古値に潰さない）。
   */
  function buildAiSummaryPlaceholderEl(ym) {
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
    h.textContent = 'AI分析結果（要約）';
    wrap.appendChild(h);

    const anchors = [1, 8, 15, 22];
    const mondays = anchors.map(function (ad) {
      return jstMondayOfWeekContaining(ym.y, ym.m, ad);
    });
    const weekNotes = readWeekNotes(ym);

    const weekBlock = document.createElement('div');
    weekBlock.style.marginBottom = '12px';
    const wTitle = document.createElement('div');
    wTitle.style.fontWeight = '600';
    wTitle.style.fontSize = '13px';
    wTitle.style.marginBottom = '8px';
    wTitle.textContent = '週次要約（週初め月曜の月/日＋週次）';
    weekBlock.appendChild(wTitle);

    for (let wi = 0; wi < 4; wi += 1) {
      const mon = mondays[wi];
      const labelText = String(mon.m) + '/' + String(mon.d) + '週次';
      const row = document.createElement('div');
      row.style.marginBottom = '8px';
      const lab = document.createElement('label');
      lab.style.display = 'block';
      lab.style.fontWeight = '600';
      lab.style.fontSize = '12px';
      lab.style.marginBottom = '4px';
      lab.style.color = '#334155';
      lab.textContent = labelText;
      lab.setAttribute('for', 'user683-week-note-' + wi);
      row.appendChild(lab);
      const ta = document.createElement('textarea');
      ta.id = 'user683-week-note-' + wi;
      ta.rows = 3;
      ta.style.width = '100%';
      ta.style.boxSizing = 'border-box';
      ta.style.padding = '8px';
      ta.style.fontSize = '13px';
      ta.style.border = '1px solid #cbd5e1';
      ta.style.borderRadius = '6px';
      ta.style.resize = 'vertical';
      ta.value = weekNotes[wi] || '';
      (function (idx) {
        ta.addEventListener('input', function (ev) {
          const cur = readWeekNotes(ym);
          const next = cur.slice(0, 4);
          while (next.length < 4) next.push('');
          next[idx] = ev.target.value;
          writeWeekNotes(ym, next);
        });
      })(wi);
      row.appendChild(ta);
      weekBlock.appendChild(row);
    }
    wrap.appendChild(weekBlock);

    const mBlock = document.createElement('div');
    const mTitle = document.createElement('div');
    mTitle.style.fontWeight = '600';
    mTitle.style.fontSize = '13px';
    mTitle.style.marginBottom = '6px';
    mTitle.textContent = '月次要約';
    mBlock.appendChild(mTitle);
    const mta = document.createElement('textarea');
    mta.id = 'user683-month-note';
    mta.rows = 4;
    mta.style.width = '100%';
    mta.style.boxSizing = 'border-box';
    mta.style.padding = '8px';
    mta.style.fontSize = '13px';
    mta.style.border = '1px solid #cbd5e1';
    mta.style.borderRadius = '6px';
    mta.style.resize = 'vertical';
    mta.value = readMonthNote(ym);
    mta.addEventListener('input', function (ev) {
      writeMonthNote(ym, ev.target.value);
    });
    mBlock.appendChild(mta);
    wrap.appendChild(mBlock);

    return wrap;
  }

  function buildHeroEl(ym, curTotal, prevHasRecords, prevTotal) {
    const wrap = document.createElement('div');
    wrap.id = 'user683-hero';
    wrap.style.cssText =
      'padding:22px 24px 28px;background:linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%);color:#fff;border-radius:8px;margin:10px 12px;box-shadow:0 2px 10px rgba(0,0,0,.18);text-align:center;';

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
        mom.innerHTML = '前月比: <span style="color:#fecaca;font-weight:800;">+' + delta + ' 増</span>';
      } else if (delta < 0) {
        mom.innerHTML = '前月比: <span style="color:#93c5fd;font-weight:800;">−' + Math.abs(delta) + ' 減</span>';
      } else {
        mom.innerHTML = '前月比: <span style="opacity:.92;font-weight:800;">±0（同数）</span>';
      }
    }
    wrap.appendChild(mom);

    return wrap;
  }

  function buildMonthTableEl(ym, dim, byDay) {
    const wrap = document.createElement('div');
    wrap.style.margin = '8px 12px 14px';
    const t0 = document.createElement('div');
    t0.style.fontWeight = '600';
    t0.style.marginBottom = '6px';
    t0.style.fontSize = '12px';
    t0.style.color = '#475569';
    t0.textContent =
      '対応案件一覧（サマリー）・' +
      ym.y +
      '年' +
      ym.m +
      '月度 — 日別の本文は 682 で確認。' +
      (USER683_SHOW_AI_SUMMARY_UI
        ? '週次・月次要約は下の欄（手入力または Ollama 生成）'
        : '週次・月次要約（AI）欄は一時非表示。再開は開発で USER683_SHOW_AI_SUMMARY_UI を true にし deploy。');
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
        const hasText = Boolean(x.relayLine);
        bodyTd.textContent = hasText ? '（682 の対応文で確認）' : '（対応文なし・件数のみ）';
        bodyTd.title = hasText
          ? x.rows > 1
            ? '同一日 ' + x.rows + ' 行を合算済み。本文は 682 で確認してください。'
            : '本文は 682 の該当日レコードを開いてください。'
          : '';
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
          if (shouldFetchMoreKintoneRecords(batch.length, limit)) {
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

    root.appendChild(tool);

    const msgHost = document.createElement('div');
    msgHost.id = 'user683-dash-messages';
    root.appendChild(msgHost);

    const chartsRow = document.createElement('div');
    chartsRow.style.display = 'flex';
    chartsRow.style.flexWrap = 'wrap';
    chartsRow.style.gap = '16px';
    chartsRow.style.margin = '12px 12px 8px';
    chartsRow.style.alignItems = 'stretch';

    const chartDayHost = document.createElement('div');
    chartDayHost.id = 'user683-chart-day';
    chartDayHost.style.flex = '1.15';
    chartDayHost.style.minWidth = '260px';

    const chartYearHost = document.createElement('div');
    chartYearHost.id = 'user683-chart-year';
    chartYearHost.style.flex = '1';
    chartYearHost.style.minWidth = '300px';

    chartsRow.appendChild(chartDayHost);
    chartsRow.appendChild(chartYearHost);
    root.appendChild(chartsRow);

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
    const six = sixMonthWindowQuery(ym);

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
      fetchRecordsFieldsForQuery(APP682, six.query, [FC_DATE, FC_DAY_TOTAL]),
      summaryCacheP,
    ])
      .then(function (tuple) {
        const res = tuple[0];
        const monthRec = tuple[1];
        const prev = tuple[2];
        const sixRec = tuple[3];
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
            ym.y + '年' + ym.m + '月・日別（件）',
            dayLabels,
            dayVals,
            {
              compact: true,
              barColor: '#0d9488',
              tall: true,
              chartBoost: true,
              chartTight: false,
              chartBigLabels: false,
              chartNarrowBars: true,
              chartColMinW: '26px',
              chartRowGapPx: 8,
              chartLabFontPx: '9px',
              chartNumFontPx: '12px',
              labelColors: dayLabelColors,
            },
          ),
        );

        const ysums = sumDayTotalByYearMonth(sixRec);
        const ymBarKey = ym.y + '-' + pad2(ym.m);
        ysums[ymBarKey] = curTotal;
        const yLabels = [];
        const yVals = [];
        for (let si = 0; si < six.slots.length; si += 1) {
          const sk = six.slots[si].key;
          const p = sk.split('-');
          yLabels.push(p[0] + '/' + p[1]);
          yVals.push(ysums[sk] != null ? ysums[sk] : 0);
        }
        chartYearHost.innerHTML = '';
        chartYearHost.appendChild(
          buildBarCardGrid(
            '直近6暦月の月合計（右端＝' + ym.y + '年' + ym.m + '月・各月の日合計合算）',
            yLabels,
            yVals,
            { compact: true, barColor: '#4f46e5', tall: true, chartBoost: true },
          ),
        );

        tableHost.innerHTML = '';
        tableHost.appendChild(buildMonthTableEl(ym, range.dim, byDay));

        if (USER683_SHOW_AI_SUMMARY_UI) {
          attachOllamaGenerateControls(ym, range.dim, byDay);
          hydrate683SummaryTextareasFromServer(ym, summaryCache);
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
        tableHost.textContent = '';
      });
  }

  kintone.events.on('app.record.index.show', function (ev) {
    try {
      refresh683Dash();
    } catch (e) {
      console.error(BUILD, e);
    }
    return ev;
  });
})();
