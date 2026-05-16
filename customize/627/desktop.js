/**
 * アプリ627（アカウント管理台帳）新規: 595 + **626 アカウント採番**から自動入力。
 * 626 が取得できない／権限がないと、パスワード・logon・windows_name などが空のままになる。
 * 本番: https://jbis-kintone.cybozu.com/k/626/
 *
 * BUILD: 2026-04-18-v1 (詳細: 594⇔627 紐付け解除ボタン)
 * BUILD: 2026-04-18-v2 (UI文言: 「このアカウントからPCの紐付けを外す」へ・C-1/C-2 統一)
 * BUILD: 2026-04-18-v3 (C-4: 印刷帳票で account_type 別テーマ＋全セル空段の自動省略)
 * BUILD: 2026-04-18-v3.1 (C-4 fix: ハイフン系 (---/----/ー/—/－等) も「実質空」と判定して段省略)
 * BUILD: 2026-04-18-v4 (関連アプリ横並び小ナビを画面上部に常駐: 668/595/594/627 へのテキストリンク)
 * BUILD: 2026-05-05-v1 (627 自動入力: `windows_name` を `logon_name[mail@前]` に統一。`+` なし)
 * BUILD: 2026-05-12-no594-rest（旧594アプリへの REST・ナビ・ミラー停止。正は674）
 */
(function () {
  'use strict';

  var BUILD = '2026-05-12-627-no594-rest';

  const APP595 = '595';
  /** 新・PC台帳（674）。旧594へのリンクは出さない */
  const APP674_PC = '674';
  /** アカウント採番（プール）。627の実体の多くはここ起点 */
  const APP626 = '626';
  /** 627 側: 旧PC台帳から移行した参照（フィールドコード名はスキーマ互換のまま） */
  const FC627_PC594 = 'pc_594_record_id';
  /** 627 側: 複数 PC 用サブテーブル（setup-627-pc-ledger-links-subtable.js） */
  const FC627_PC_SUBTABLE = 'pc_ledger_links';
  /** サブテーブル内の旧台帳レコード番号（トップの pc_594_record_id とフィールドコード重複不可） */
  const FC627_PC_SUB_594 = 'pc_ledger_link_594_id';
  /** 627: アカウント種別（ラジオ想定。未作成でも動くように optional 扱い） */
  const FC627_ACCOUNT_TYPE = 'account_type';
  /** 626 の M365 パスワード（半角大文字 M・sync595.js と同一） */
  const F626_M365_PW = 'M365_pw';
  /** 626・627 共通: サイボウズパスワードのフィールドコードは sb_pw */
  const F626_SB_PW = 'sb_pw';
  /** 626 割当済み印（sync595 の SYNC595_626_USED_VALUE 既定と一致） */
  const USED626 = '〇';
  const POOL_QUERY626 =
    `mail = "" and used_count not in ("${USED626}") order by レコード番号 asc limit 1`;
  /** 627.m365_id 用（sync の M365_DOMAIN_SUFFIX 既定） */
  const M365_SUFFIX = '@kensetsutoso01.onmicrosoft.com';

  /** 保存フロー間で共有する一時状態（create.show → create.submit.success） */
  const pendingState = Object.seal({
    id595: null,
    id626: null,
    needs626PoolMark: false,
    mail626: '',
  });

  /** 二重登録リダイレクト後に詳細で表示するフラグ */
  const STORAGE_KEY_627_DUP = 'jbis627_dup_notice_v1';

  const escQuery = (s) =>
    String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const localPart = (mail) => {
    if (!mail) return '';
    const i = mail.indexOf('@');
    return i > 0 ? mail.slice(0, i) : mail;
  };

  /** 626 レコードからサイボウズ用パスワードを取る（フィールド sb_pw） */
  const cybozuPasswordFrom626Row = (r626) => {
    if (!r626) return '';
    return String(r626[F626_SB_PW]?.value ?? '').trim();
  };

  /** sync595 / jbis-account-state と同趣旨（ブラウザ用・ラベルは 有効／退職 固定） */
  const deriveAccountStateFrom595 = (r595) => {
    const active = '有効';
    const retired = '退職';
    const emp = String(r595.employment_status?.value ?? '').trim();
    const rd = String(r595.retired_date?.value ?? '').trim();
    return emp.includes('退職') || rd !== '' ? retired : active;
  };

  /**
   * 594 の「アカウント登録」やブックマーク用。mail のみ必須（他キーは無視可）。
   * 例: #jbis_prefill_mail=a%40b.com
   */
  const parsePrefillFromHash = () => {
    const raw = location.hash?.replace(/^#/, '') ?? '';
    if (!raw) return null;
    const params = new URLSearchParams(raw);
    const mail = params.get('jbis_prefill_mail');
    if (!mail) return null;
    return { jbis_prefill_mail: mail };
  };

  const isMobileEvent = (event) =>
    event?.type?.startsWith('mobile.') ?? false;

  /** get() の戻りを set() に渡す（event 直渡しは未対応環境で UI に乗らないことがある） */
  const getFormHolder = (isMobile) => {
    if (isMobile && kintone.mobile?.app?.record) {
      return kintone.mobile.app.record.get();
    }
    if (kintone.app?.record) {
      return kintone.app.record.get();
    }
    return null;
  };

  const setFormHolder = (isMobile, holder) => {
    if (!holder) return;
    try {
      if (isMobile && kintone.mobile?.app?.record) {
        kintone.mobile.app.record.set(holder);
      } else if (kintone.app?.record) {
        kintone.app.record.set(holder);
      }
    } catch (e) {
      console.warn('[jbis 627] record.set', e);
    }
  };

  /**
   * 595/626 で埋めた値をフォームに反映。
   * - event.record だけでなく kintone.app.record.get() の record を更新し set する
   * - 新 UI では get/set のペアが無いと入力欄に表示されないことがある
   */
  const flushPrefillToCreateForm = (event, bundle595, bundle626) => {
    const mobile = isMobileEvent(event);
    const holder = getFormHolder(mobile);
    if (!holder?.record) {
      apply627From595626(event.record, bundle595, bundle626);
      console.warn('[jbis 627] record.get() 不可。event.record のみ更新しました。');
      return;
    }
    apply627From595626(holder.record, bundle595, bundle626);
    /* event と holder が別オブジェクトのとき submit 用に両方そろえる */
    if (holder.record !== event.record) {
      apply627From595626(event.record, bundle595, bundle626);
    }
    setFormHolder(mobile, holder);
  };

  const clearHashFromUrl = () => {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  };

  const setRec = (rec, code, value) => {
    const v = value ?? '';
    if (!rec[code] || !('value' in rec[code])) {
      if (rec && !rec[code]) {
        console.warn(
          '[jbis 627] 627のフォームにフィールドがありません（フィールドコード確認）:',
          code
        );
      }
      return;
    }
    rec[code].value = v;
  };

  /** 同一 mail の 627 が既にあるか（重複登録防止） */
  const fetchExisting627ByMail = (mail) =>
    kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: kintone.app.getId(),
      query: `mail = "${escQuery(mail)}" limit 1`,
      fields: ['$id', 'mail'],
    });

  const fetch595ByMail = (mail) =>
    kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: APP595,
      query: `mail = "${escQuery(mail)}" limit 1`,
      fields: [
        '$id', 'mail', 'user_name', 'dept_name', 'group_name',
        'employment_status', 'retired_date', 'remarks',
      ],
    });

  /**
   * 626 は 1 件だけ取得するため fields を省略し、参照権限のあるフィールドをすべて返させる。
   * （fields に存在しないコードを列挙すると API が全体エラーになる）
   */
  const fetch626ByLogon = async (logon) => {
    const lg = String(logon ?? '').trim();
    if (!lg) return null;
    const resp = await kintone.api(
      kintone.api.url('/k/v1/records.json', true), 'GET',
      { app: APP626, query: `logon_name = "${escQuery(lg)}" limit 1` }
    );
    return resp.records?.[0] ?? null;
  };

  const fetch626ForMail = async (mail) => {
    const url = kintone.api.url('/k/v1/records.json', true);
    const resp = await kintone.api(url, 'GET', {
      app: APP626,
      query: `mail = "${escQuery(mail)}" limit 1`,
    });

    if (resp.records?.[0]) {
      const row = resp.records[0];
      if (cybozuPasswordFrom626Row(row)) {
        return { row, fromPool: false };
      }
      const lg = row.logon_name?.value ?? '';
      const alt = await fetch626ByLogon(lg);
      if (alt && cybozuPasswordFrom626Row(alt)) {
        return { row: alt, fromPool: false };
      }
      return { row, fromPool: false };
    }

    const resp2 = await kintone.api(url, 'GET', {
        app: APP626,
        query: POOL_QUERY626,
    });
    if (resp2.records?.[0]) {
          return { row: resp2.records[0], fromPool: true };
        }
        return { row: null, fromPool: false };
  };

  /** sync595 build627Record と同じ対応（627 フォームに存在するフィールドのみ反映） */
  const apply627From595626 = (rec, r595, r626) => {
    const mail = r595.mail?.value;
    if (!mail) return;

    const lp = localPart(mail);
    const logonName = r626.logon_name?.value ?? '';
    const m365pw = r626[F626_M365_PW]?.value ?? '';

    setRec(rec, 'mail', mail);
    setRec(rec, 'user_name', r595.user_name?.value ?? '');
    setRec(rec, 'group_name', r595.group_name?.value ?? '');
    setRec(rec, 'dept_name', r595.dept_name?.value ?? '');
    const acctSt = deriveAccountStateFrom595(r595);
    setRec(rec, 'account_state', acctSt);
    setRec(
      rec, 'employment_status',
      acctSt === '退職' ? '退職' : (r595.employment_status?.value ?? '')
    );
    setRec(rec, 'remarks', r595.remarks?.value ?? '');
    setRec(rec, 'logon_name', logonName);
    setRec(rec, 'logon_pw', r626.logon_pw?.value ?? '');
    setRec(rec, 'gb_pw', r626.gb_pw?.value ?? '');
    setRec(rec, 'mail_pw', r626.mail_pw?.value ?? '');
    setRec(rec, 'm365_pw', m365pw);
    setRec(rec, 'gb_id', lp);
    setRec(rec, 'mail_acct', lp);
    setRec(rec, 'm365_id', lp + M365_SUFFIX);
    setRec(rec, 'windows_name', logonName ? `${logonName}[${lp}]` : lp);
    setRec(rec, 'sb_id', lp);
    setRec(rec, 'sb_pw', cybozuPasswordFrom626Row(r626));
  };

  const onCreateShowWithPrefill = (event) => {
    const pre = parsePrefillFromHash();
    if (!pre?.jbis_prefill_mail) return event;
    const mail = String(pre.jbis_prefill_mail).trim();
    if (!mail) return event;

    return new kintone.Promise(async (resolve) => {
      try {
        const respExisting = await fetchExisting627ByMail(mail);
        if (respExisting.records?.[0]) {
          const rid = respExisting.records[0].$id.value;
          const appId = kintone.app.getId();
          try { sessionStorage.setItem(STORAGE_KEY_627_DUP, '1'); } catch { /* Private モード等 */ }
          clearHashFromUrl();
          location.href = `${location.origin}/k/${appId}/show#record=${encodeURIComponent(String(rid))}`;
          resolve(event);
      return;
    }

        const resp595 = await fetch595ByMail(mail);
        const r595 = resp595.records?.[0];
        if (!r595) throw new Error('595_NOT_FOUND');
        const m = String(r595.mail?.value ?? '').trim();
        if (!m) throw new Error('595_MAIL_EMPTY');

        const pair626 = await fetch626ForMail(m);
        if (!pair626.row) throw new Error('626_NOT_FOUND');

        pendingState.id595 = r595.$id.value;
        pendingState.id626 = pair626.row.$id.value;
        pendingState.mail626 = r595.mail?.value ?? '';
        const m626 = pair626.row.mail?.value;
        pendingState.needs626PoolMark =
          pair626.fromPool === true || !m626 || String(m626).trim() === '';

        flushPrefillToCreateForm(event, r595, pair626.row);
        clearHashFromUrl();
      } catch (e) {
        const code = e?.message ?? '';
        if (code === '595_NOT_FOUND') {
          alert('社員マスタ(595)に該当メールがありません。595 にメール登録後にお試しください。');
        } else if (code === '595_MAIL_EMPTY') {
          alert('社員マスタ(595)のメールが空です。');
        } else if (code === '626_NOT_FOUND') {
          alert(
            'アカウント採番（626）からレコードを取得できませんでした。\n' +
            '・626 に「未使用」プール（mail 空・used_count が〇以外）があるか\n' +
            '・この画面を保存するユーザーに 626 の参照権限があるか\n' +
            'を確認してください。\n' +
            '626: https://jbis-kintone.cybozu.com/k/626/'
          );
        } else {
          console.error('[jbis 627 create.show]', e);
          alert('595/626 の取得に失敗しました。アプリ権限・ネットワークを確認してください。');
        }
        clearHashFromUrl();
        Object.assign(pendingState, {
          id595: null, id626: null, needs626PoolMark: false, mail626: '',
        });
      }
      resolve(event);
    });
  };

  /**
   * M4: 重複チェッカー（mail / logon_name / emp_id）
   * - mail: 既存どおり「すでにアカウントはあります」エラー
   * - logon_name (WindowsID): 同一 logon_name の他レコードがあればエラー
   * - emp_id (社員管理番号): フィールド存在時のみ、同一値の他レコードがあればエラー
   * 編集時は自分自身（$id）を除外して判定する。
   */
  const FC627_LOGON = 'logon_name';
  const FC627_EMPID = 'emp_id';
  /**
   * WindowsID(logon_name) が「ローカルアカウント」というラベル値の場合、
   * 各 PC でローカル管理者を同名表記する運用上、複数台に同じ表記が存在することが正常。
   * → 重複チェック（保存時エラー / 詳細バナー）の双方からスキップする。
   * 全角/半角・前後空白の表記揺れに耐えるため NFKC 正規化＋trim で比較。
   */
  const LOGON_LOCAL_PLACEHOLDER = 'ローカルアカウント';
  const isLocalAccountLogon = (raw) => {
    let s;
    try { s = String(raw ?? '').normalize('NFKC').trim(); }
    catch { s = String(raw ?? '').trim(); }
    return s === LOGON_LOCAL_PLACEHOLDER;
  };

  const checkRecordDuplicate = async (rec, selfId) => {
    const errors = {};
    let firstMsg = '';
    const appId = kintone.app.getId();
    const selfClause = selfId ? ` and $id != "${escQuery(String(selfId))}"` : '';

    const checkOne = async (code, label, value, msgFmt) => {
      const v = String(value ?? '').trim();
      if (!v) return;
      try {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records.json', true), 'GET', {
            app: appId,
            query: `${code} = "${escQuery(v)}"${selfClause} limit 1`,
            fields: ['$id'],
          }
        );
        const dup = resp.records?.[0];
        if (dup) {
          const dupId = String(dup.$id?.value ?? '').trim();
          const m = msgFmt(v, dupId);
          errors[code] = m;
          if (!firstMsg) firstMsg = m;
        }
      } catch (e) {
        console.warn(`[jbis 627 dup-check ${code}]`, e);
      }
    };

    await checkOne('mail', 'メール', rec?.mail?.value,
      (v, id) => `すでに同じメール (${v}) のアカウントがあります（627: #${id}）。二重登録はできません。`);

    // 「ローカルアカウント」表記は各 PC で同名運用するため重複チェックから除外
    if (!isLocalAccountLogon(rec?.[FC627_LOGON]?.value)) {
      await checkOne(FC627_LOGON, 'WindowsID', rec?.[FC627_LOGON]?.value,
        (v, id) => `すでに同じWindowsID (${v}) のアカウントがあります（627: #${id}）。二重登録はできません。`);
    }

    if (rec && Object.prototype.hasOwnProperty.call(rec, FC627_EMPID)) {
      await checkOne(FC627_EMPID, '社員管理番号(EMP-ID)', rec?.[FC627_EMPID]?.value,
        (v, id) => `すでに同じ社員管理番号 (${v}) のアカウントがあります（627: #${id}）。二重登録はできません。`);
    }

    return { errors, firstMsg };
  };

  const onCreateSubmitDuplicateCheck = (event) => {
    return new kintone.Promise(async (resolve) => {
      try {
        const { errors, firstMsg } = await checkRecordDuplicate(event.record, null);
        if (firstMsg) {
          event.error = firstMsg;
          event.errors = Object.assign(event.errors ?? {}, errors);
        }
      } catch (e) {
        console.error('[jbis 627 create.submit duplicate check]', e);
      }
      resolve(event);
    });
  };

  const onEditSubmitDuplicateCheck = (event) => {
    return new kintone.Promise(async (resolve) => {
      try {
        const selfId = String(event.recordId ?? event.record?.$id?.value ?? '').trim();
        const { errors, firstMsg } = await checkRecordDuplicate(event.record, selfId);
        if (firstMsg) {
          event.error = firstMsg;
          event.errors = Object.assign(event.errors ?? {}, errors);
        }
      } catch (e) {
        console.error('[jbis 627 edit.submit duplicate check]', e);
      }
      resolve(event);
    });
  };

  kintone.events.on('app.record.create.submit', onCreateSubmitDuplicateCheck);
  kintone.events.on('app.record.edit.submit', onEditSubmitDuplicateCheck);

  // ====================================================================
  // 2026-04-21 制定 (#K2): pc_link_count_n 自動更新
  //   PC_name (カンマ区切り) を解析し、紐付けPC台数を NUMBER フィールドに書き込み。
  //   - 個人アカウント = 通常 1 (会社用) / 持ち出し用ありで 2
  //   - 共有アカウント / JR端末 = 複数 (3-7台等)
  //   - PC_name 空 = 0
  //   この方式は CALC SUM(pc_ledger_links) 方式の二重管理問題 (TSB-008) を回避する。
  // ====================================================================
  const calcPcLinkCount = (event) => {
    try {
      const rec = event?.record;
      if (!rec) return event;
      const pcname = String(rec.PC_name?.value || '').trim();
      const n = pcname ? pcname.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean).length : 0;
      if (rec.pc_link_count_n) {
        rec.pc_link_count_n.value = String(n);
      }
    } catch (e) {
      console.warn('[jbis 627 K2 pc_link_count_n auto-fill]', e);
    }
    return event;
  };
  kintone.events.on('app.record.create.submit', calcPcLinkCount);
  kintone.events.on('app.record.edit.submit', calcPcLinkCount);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.create.submit', calcPcLinkCount);
    kintone.events.on('mobile.app.record.edit.submit', calcPcLinkCount);
  }
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      'mobile.app.record.create.submit',
      onCreateSubmitDuplicateCheck
    );
    kintone.events.on(
      'mobile.app.record.edit.submit',
      onEditSubmitDuplicateCheck
    );
  }

  // ── M4: 詳細画面で現在レコードの重複（logon_name / emp_id）を可視化 ──
  const JBIS627_DUP_DETAIL_BANNER_ID = 'jbis627-dup-detail-banner';
  const mount627DupDetailBanner = async (rec) => {
    if (!rec) return;
    if (document.getElementById(JBIS627_DUP_DETAIL_BANNER_ID)) return;
    const selfId = String(rec.$id?.value ?? '').trim();
    if (!selfId) return;

    const dups = [];
    const appId = kintone.app.getId();
    const findDups = async (code, label) => {
      const v = String(rec?.[code]?.value ?? '').trim();
      if (!v) return;
      try {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records.json', true), 'GET', {
            app: appId,
            query: `${code} = "${escQuery(v)}" and $id != "${escQuery(selfId)}" limit 5`,
            fields: ['$id'],
          }
        );
        const ids = (resp.records || []).map((r) => String(r.$id?.value ?? '')).filter(Boolean);
        if (ids.length) dups.push({ code, label, value: v, ids });
      } catch (e) {
        console.warn(`[jbis 627 dup detail ${code}]`, e);
      }
    };

    await findDups('mail', 'メール');
    // 「ローカルアカウント」表記は各 PC で同名運用するため重複バナーから除外
    if (!isLocalAccountLogon(rec?.[FC627_LOGON]?.value)) {
      await findDups(FC627_LOGON, 'WindowsID');
    }
    if (Object.prototype.hasOwnProperty.call(rec, FC627_EMPID)) {
      await findDups(FC627_EMPID, '社員管理番号(EMP-ID)');
    }
    if (!dups.length) return;

    const host = resolve627DetailMountParent();
    if (!host) return;

    const wrap = document.createElement('div');
    wrap.id = JBIS627_DUP_DETAIL_BANNER_ID;
    wrap.setAttribute('role', 'alert');
    wrap.style.cssText =
      'margin:0 0 10px;padding:12px 16px;background:#fef2f2;border:2px solid #b91c1c;border-radius:8px;' +
      'color:#7f1d1d;font-size:12px;font-weight:900;line-height:1.6;width:100%;box-sizing:border-box;';
    const title = document.createElement('div');
    title.textContent = '⚠ 重複あり：このレコードと同じ値の別レコードが見つかりました。整理を検討してください。';
    title.style.cssText = 'font-size:13px;margin-bottom:8px;';
    wrap.appendChild(title);

    const buildRecordChip = (id) => {
      const chip = document.createElement('span');
      chip.style.cssText =
        'display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;padding:2px 4px 2px 8px;' +
        'background:#fff;border:1px solid #b91c1c;border-radius:6px;vertical-align:middle;';
      const a = document.createElement('a');
      a.href = `${location.origin}/k/${kintone.app.getId()}/show?record=${encodeURIComponent(id)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `#${id} を開く`;
      a.title = 'このレコードを別タブで開く';
      a.style.cssText =
        'color:#1d4ed8;text-decoration:none;font-weight:700;font-size:12px;padding:2px 4px;';
      a.addEventListener('mouseenter', () => { a.style.textDecoration = 'underline'; });
      a.addEventListener('mouseleave', () => { a.style.textDecoration = 'none'; });
      chip.appendChild(a);
      const cp = document.createElement('button');
      cp.type = 'button';
      cp.textContent = 'コピー';
      cp.title = `レコード番号 ${id} をクリップボードへコピー`;
      cp.style.cssText =
        'background:#fef2f2;border:1px solid #b91c1c;color:#7f1d1d;border-radius:4px;' +
        'cursor:pointer;font-size:11px;font-weight:700;padding:2px 6px;line-height:1;';
      cp.addEventListener('click', async (ev) => {
        ev.preventDefault();
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(String(id));
          } else {
            const ta = document.createElement('textarea');
            ta.value = String(id);
            ta.style.cssText = 'position:fixed;top:-1000px;';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          const orig = cp.textContent;
          cp.textContent = '✓';
          cp.style.background = '#dcfce7';
          cp.style.color = '#15803d';
          setTimeout(() => {
            cp.textContent = orig;
            cp.style.background = '#fef2f2';
            cp.style.color = '#7f1d1d';
          }, 1200);
        } catch (e) {
          console.warn('[jbis 627 dup banner copy]', e);
        }
      });
      chip.appendChild(cp);
      return chip;
    };

    dups.forEach((d) => {
      const row = document.createElement('div');
      row.style.cssText = 'margin:4px 0;font-weight:700;display:flex;flex-wrap:wrap;align-items:center;gap:4px;';
      const lbl = document.createElement('span');
      lbl.textContent = `・${d.label} (${d.value}) → 重複:`;
      lbl.style.cssText = 'margin-right:4px;';
      row.appendChild(lbl);
      d.ids.forEach((id) => row.appendChild(buildRecordChip(id)));
      if (d.ids.length >= 5) {
        const more = document.createElement('span');
        more.textContent = '（5件まで表示。さらに重複の可能性あり）';
        more.style.cssText = 'font-weight:600;color:#7f1d1d;font-size:11px;margin-left:6px;';
        row.appendChild(more);
      }
      wrap.appendChild(row);
    });

    host.insertBefore(wrap, host.firstChild);
  };

  /** 二重登録ガードの案内を画面上に出す（alert 単体は kintone / ブラウザで無音になりやすい） */
  const showDuplicateAccountNoticeBanner = () => {
    const msg = 'すでにアカウントはあります。同じメールで二重登録はできません。';
    const inject = () => {
      if (document.getElementById('jbis627-dup-banner')) return true;
      const host =
        kintone.app?.record?.getHeaderMenuSpaceElement?.() ??
        document.querySelector('.gaia-argoui-app-toolbar') ??
        document.querySelector('.ocean-ui-app-index-head') ??
        document.body;
      if (!host) return false;
      const el = document.createElement('div');
      el.id = 'jbis627-dup-banner';
      el.setAttribute('role', 'alert');
      el.setAttribute('tabindex', '0');
      el.style.cssText =
        'margin:8px 12px;padding:14px 18px;background:#fff3cd;border:2px solid #856404;border-radius:6px;color:#533f03;font-size:14px;font-weight:bold;line-height:1.5;box-shadow:0 2px 6px rgba(0,0,0,.12);position:relative;z-index:99999;';
      el.textContent = msg;
      host.insertBefore(el, host.firstChild);
      return true;
    };
    if (!inject()) {
      setTimeout(inject, 200);
      setTimeout(inject, 600);
      setTimeout(inject, 1500);
    }
    setTimeout(() => {
      try { window.alert(msg); } catch { /* noop */ }
    }, 500);
  };

  const onDetailShowDupNotice = (event) => {
    let show = false;
    try {
      if (sessionStorage.getItem(STORAGE_KEY_627_DUP) === '1') {
        sessionStorage.removeItem(STORAGE_KEY_627_DUP);
        show = true;
      }
    } catch { /* noop */ }
    if (!show) {
      try {
        const qs = new URLSearchParams(window.location.search ?? '');
        if (qs.get('jbis_dup') === '1') {
          show = true;
          const u = new URL(window.location.href);
          u.searchParams.delete('jbis_dup');
          history.replaceState(
            null, '', u.pathname + u.search + window.location.hash
          );
        }
      } catch { /* noop */ }
    }
    if (show) showDuplicateAccountNoticeBanner();
    return event;
  };

  kintone.events.on('app.record.detail.show', onDetailShowDupNotice);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.detail.show', onDetailShowDupNotice);
  }

  // ====================================================================
  // 2026-04-21 制定 (#C4): Office 5 台超過警告バナー
  //   M365 のライセンスは 1 アカウントで 5 台までインストール可能。
  //   pc_link_count_n >= 5 のレコードを開いたとき、画面上部に赤バナーで警告。
  //   入替用に別 M365 アカウント準備が必要であることを管理者に明示する。
  // ====================================================================
  const M365_OFFICE_LIMIT = 5;
  const showOfficeOverLimitBanner = (count) => {
    const containerId = 'jbis627-office-over-limit-banner';
    if (document.getElementById(containerId)) return;
    const space = (typeof kintone !== 'undefined' && kintone.app && kintone.app.record && typeof kintone.app.record.getSpaceElement === 'function')
      ? kintone.app.record.getHeaderMenuSpaceElement()
      : null;
    const host = space || document.querySelector('.gaia-argoui-app-show-header') || document.body;
    const div = document.createElement('div');
    div.id = containerId;
    div.style.cssText =
      'background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;padding:14px 20px;' +
      'border-radius:10px;margin:10px 0;font-size:14px;line-height:1.6;' +
      'box-shadow:0 4px 12px rgba(220,38,38,.3);font-weight:700;';
    div.innerHTML =
      '<div style="font-size:18px;margin-bottom:6px;">⚠ M365 Office 5 台インストール制限超過</div>' +
      '<div style="font-weight:500;">このアカウントには <b>' + count + ' 台</b> の PC が紐付いています（制限: 5 台）。<br>' +
      '別 M365 アカウントを準備して、超過分の PC のアカウント入替が必要です。</div>';
    host.insertBefore(div, host.firstChild);
  };
  const onDetailShowOfficeLimit = (event) => {
    try {
      const count = parseInt(event?.record?.pc_link_count_n?.value ?? '0', 10);
      if (count >= M365_OFFICE_LIMIT) showOfficeOverLimitBanner(count);
    } catch (e) {
      console.warn('[jbis 627 C4 Office over limit banner]', e);
    }
    return event;
  };
  kintone.events.on('app.record.detail.show', onDetailShowOfficeLimit);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.detail.show', onDetailShowOfficeLimit);
  }

  /**
   * システム情報印刷の7段レイアウト（各段はセル配列。code は 627 のフォームに存在するもののみ）
   */
  const JBIS627_PRINT_LAYOUT = [
    [
      { label: '部署名', code: 'dept_name' },
      { label: '社員名', code: 'user_name' },
      { label: 'PC名', code: 'PC_name' },
    ],
    [
      { label: 'メールアドレス', code: 'mail' },
      { label: 'メールアカウント', code: 'mail_acct' },
      { label: 'メールパスワード', code: 'mail_pw' },
    ],
    [
      { label: 'WindowsID', code: 'logon_name' },
      { label: 'Windowsパスワード', code: 'logon_pw' },
    ],
    [
      { label: 'サイボウズID', code: 'sb_id' },
      { label: 'サイボウズパスワード', code: 'sb_pw' },
    ],
    [
      { label: 'ガリバーID', code: 'gb_id' },
      { label: 'ガリバーパスワード', code: 'gb_pw' },
    ],
    [
      { label: 'M365ID', code: 'm365_id' },
      { label: 'M365パスワード', code: 'm365_pw' },
    ],
    [
      { label: 'VPN ID(KDDI)', code: 'vpn_id' },
      { label: 'VPNパスワード', code: 'vpn_pw' },
    ],
  ];
  /** ヘッダの印刷ボタン id（二重配置防止） */
  const JBIS627_PRINT_BTN_ID = 'jbis627-system-info-print-btn';
  /** 詳細: PC台帳番号帯 */
  const JBIS627_PC_LEDGER_BANNER_ID = 'jbis627-pc-ledger-banner';
  /** 詳細画面では record.get() が使えないため、直近の show イベントの record を退避する */
  let jb627PrintRecordSnapshot = null;

  const safeText = (s) => String(s ?? '');

  const resolve627DetailMountParent = () => {
    const selectors = [
      '.gaia-argoui-app-show-contents',
      '.gaia-argoui-app-show-body',
      '.ocean-ui-app-record-view-body',
      '.ocean-ui-app-record-view-layout-content',
      '.layout-gaia',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    try {
      const sp = kintone.app?.record?.getHeaderMenuSpaceElement?.();
      if (sp) return sp;
    } catch { /* noop */ }
    return null;
  };

  const collect627PcLedgerIds = (rec) => {
    if (!rec) return [];
    const ids = [];
    const seen = new Set();
    const pushUnique = (raw) => {
      const s = String(raw ?? '').trim();
      if (!s || seen.has(s)) return;
      seen.add(s);
      ids.push(s);
    };
    pushUnique(rec[FC627_PC594]?.value);
    const rows = rec[FC627_PC_SUBTABLE]?.value ?? [];
    if (Array.isArray(rows)) {
      rows.forEach((row) => pushUnique(row?.value?.[FC627_PC_SUB_594]?.value));
    }
    return ids;
  };

  /**
   * 627 レコードから PC 台帳（594）への参照をすべて外す PATCH（他フィールドは触れない）。
   * @param {Record<string, unknown>} rec627
   */
  const build627ClearAllPcLinksPatch = (rec627) => {
    const patch = /** @type {Record<string, { value: unknown }>} */ ({});
    const curSingle = String(rec627[FC627_PC594]?.value ?? '').trim();
    if (curSingle) patch[FC627_PC594] = { value: null };
    const rows = Array.isArray(rec627[FC627_PC_SUBTABLE]?.value)
      ? rec627[FC627_PC_SUBTABLE].value
      : [];
    if (rows.length) patch[FC627_PC_SUBTABLE] = { value: [] };
    return patch;
  };

  /**
   * 627 詳細から: この 627 の pc_594 / サブテーブル参照をすべて外す。
   * 旧594アプリには REST しない（方針: 594 非使用）。
   * @param {string} ledger627Id 627 の $id
   * @param {string[]} pc594Ids 画面表示時点の旧台帳レコード番号一覧（627フィールドに保持されている値）
   */
  const unlink627PcRefsAndMirror594Ledgers = async (ledger627Id, pc594Ids) => {
    const lid = String(ledger627Id || '').trim();
    const uniq = [
      ...new Set(
        (pc594Ids || [])
          .map((x) => String(x || '').trim())
          .filter((x) => /^\d+$/.test(x)),
      ),
    ];
    if (!lid || !/^\d+$/.test(lid)) {
      return { ok: false, message: 'アカウント台帳のレコード番号が取れません。', touched594: 0 };
    }
    if (!uniq.length) {
      return { ok: false, message: '解除対象の PC台帳番号がありません。', touched594: 0 };
    }

    const app627 = kintone.app.getId();
    try {
      const res627 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
        app: app627,
        id: lid,
      });
      const rec627 = res627.record || {};
      const patch627 = build627ClearAllPcLinksPatch(rec627);
      if (Object.keys(patch627).length > 0) {
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: app627,
          id: lid,
          revision: rec627.$revision?.value,
          record: patch627,
        });
      }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : String(e),
        touched594: 0,
      };
    }

    return { ok: true, message: '', touched594: 0 };
  };

  const build674PcLedgerIndexUrl = () => `${location.origin}/k/${APP674_PC}/`;

  const mount627PcLedgerBanner = (rec) => {
    if (document.getElementById(JBIS627_PC_LEDGER_BANNER_ID)) return true;
    const host = resolve627DetailMountParent();
    if (!host) return false;

    const ids = collect627PcLedgerIds(rec);
    const accType = String(rec?.[FC627_ACCOUNT_TYPE]?.value ?? '').trim();
    const isSharedAccount = accType === '共有アカウント';
    const rid627 = String(rec?.$id?.value ?? '').trim();

    const wrap = document.createElement('div');
    wrap.id = JBIS627_PC_LEDGER_BANNER_ID;
    wrap.style.cssText =
      'display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;box-sizing:border-box;' +
      'margin:0 0 10px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;';

    const badgeStyle =
      'display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;' +
      'border:1px solid #cbd5e1;background:#ffffff;color:#0f172a;font-size:12px;font-weight:900;';

    const badge = document.createElement('span');
    badge.style.cssText = badgeStyle;
    badge.textContent = `PC台帳番号: ${ids.length ? ids.join(' / ') : '未設定'}`;
    wrap.appendChild(badge);

    if (rid627) {
      const selfId = document.createElement('span');
      selfId.style.cssText = badgeStyle;
      selfId.textContent = `アカウント台帳番号(627): ${rid627}`;
      wrap.appendChild(selfId);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = 'コピー';
      copy.style.cssText =
        'margin-left:0;padding:4px 10px;border-radius:6px;border:1px solid #1d4ed8;' +
        'background:#eff6ff;color:#1d4ed8;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap;';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(String(rid627));
          copy.textContent = 'コピー済み';
          setTimeout(() => { copy.textContent = 'コピー'; }, 1200);
        } catch {
          alert('コピーできませんでした。手動で選択してコピーしてください。');
        }
      });
      wrap.appendChild(copy);
    }

    if (accType) {
      const t = document.createElement('span');
      t.style.cssText = badgeStyle;
      t.textContent = `アカウント種別: ${safeText(accType)}`;
      wrap.appendChild(t);
    }

    if (isSharedAccount) {
      const note = document.createElement('div');
      note.style.cssText =
        'flex-basis:100%;font-size:12px;line-height:1.5;color:#0f172a;font-weight:800;' +
        'padding:2px 2px 0 2px;';
      note.textContent =
        '※ 共有アカウントは複数のPC台帳に紐づく想定です（下の「PC台帳を開く」から確認できます）。';
      wrap.appendChild(note);
    }

    const warn2 = document.createElement('div');
    warn2.style.cssText =
      'flex-basis:100%;font-size:12px;line-height:1.5;color:#b91c1c;font-weight:900;' +
      'padding:2px 2px 0 2px;';
    warn2.textContent =
      '【入力注意】紐付けに使う番号は「一覧の行番号」ではなく、各レコードの「レコード番号（$id）」です。';
    wrap.appendChild(warn2);

    if (rid627 && ids.length) {
      const tb = document.createElement('div');
      tb.style.cssText =
        'flex-basis:100%;margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;' +
        'display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;';
      const hint = document.createElement('span');
      hint.style.cssText = 'font-size:11px;color:#64748b;flex:1;min-width:200px;line-height:1.45;';
      hint.innerHTML =
        '<b>紐付けを外すと…</b>：このアカウント側の「PC欄」（旧台帳番号の参照）をすべて空にします。' +
        '<b>アカウントの登録自体は消えません</b>（氏名・パスワード等もそのまま）。' +
        '共有アカウントの場合は<b>紐付いていた複数の参照が一度に外れます</b>。' +
        '<span style="color:#b45309;font-weight:800;">旧594アプリには接続しません（674が正本）。</span>';
      const btn = document.createElement('button');
      btn.type = 'button';
      const BTN_LABEL_627 = 'このアカウントからPCの紐付けを外す…';
      btn.textContent = BTN_LABEL_627;
      btn.style.cssText =
        'padding:6px 12px;border-radius:6px;border:1px solid #b45309;background:#fff7ed;' +
        'color:#9a3412;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;';
      const pcSnap = [...ids];
      btn.addEventListener('click', async () => {
        const msg =
          '【このアカウントから「PCの紐付け」を外します】\n\n' +
          `対象アカウント: アカウント台帳(627) レコード番号 ${rid627}\n` +
          `対象の旧台帳参照番号(${pcSnap.length}件): ${pcSnap.join(' / ')}\n\n` +
          '▼ どうなりますか?\n' +
          '・このアカウント側の「PC欄」から、上記の参照をすべて外します\n' +
          '・旧PC台帳(594)アプリにはアクセスしません（方針: 594 非使用）\n' +
          '・アカウント自体(氏名・パスワード・WindowsID等)は削除しません\n\n' +
          '▼ 元に戻すには\n' +
          '・新・PC台帳(674)で正しいPCを選び、再度紐付けが必要です\n\n' +
          '実行しますか?';
        if (!confirm(msg)) return;
        btn.disabled = true;
        btn.textContent = '処理中…';
        try {
          const res = await unlink627PcRefsAndMirror594Ledgers(rid627, pcSnap);
          if (!res.ok) {
            alert(`PCの紐付けを外せませんでした。\n\n${res.message || ''}`);
            btn.disabled = false;
            btn.textContent = BTN_LABEL_627;
            return;
          }
          alert(
            '627 の PC 参照を外しました（旧594アプリは更新していません）。画面を再読み込みします。',
          );
          location.reload();
        } catch (e) {
          alert(`エラー: ${e instanceof Error ? e.message : String(e)}`);
          btn.disabled = false;
          btn.textContent = BTN_LABEL_627;
        }
      });
      tb.appendChild(hint);
      tb.appendChild(btn);
      wrap.appendChild(tb);
    }

    // 旧台帳番号の表示（594 へはリンクしない）
    if (ids.length) {
      const details = document.createElement('details');
      details.style.cssText = 'flex-basis:100%;';
      const sum = document.createElement('summary');
      sum.textContent = `保持している旧台帳参照番号（${ids.length}件）`;
      sum.style.cssText =
        'cursor:pointer;color:#1d4ed8;font-weight:800;font-size:12px;user-select:none;';
      details.appendChild(sum);

      const list = document.createElement('div');
      list.style.cssText =
        'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
      ids.forEach((id) => {
        const sp = document.createElement('span');
        sp.textContent = String(id);
        sp.style.cssText =
          'display:inline-block;padding:2px 8px;border-radius:999px;' +
          'border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-weight:800;font-size:12px;';
        list.appendChild(sp);
      });
      const open674 = document.createElement('a');
      open674.href = build674PcLedgerIndexUrl();
      open674.target = '_blank';
      open674.rel = 'noopener noreferrer';
      open674.textContent = '新・PC台帳(674)を開く';
      open674.style.cssText =
        'display:inline-block;margin-left:8px;padding:2px 8px;border-radius:6px;border:1px solid #15803d;' +
        'background:#ecfdf5;color:#166534;font-weight:800;font-size:12px;text-decoration:none;';
      list.appendChild(open674);
      details.appendChild(list);
      wrap.appendChild(details);
    }

    host.insertBefore(wrap, host.firstChild);
    return true;
  };

  const esc627PrintHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const get627PrintFieldValue = (rec, code) => {
    if (!rec) return '';
    if (code === '$id') return String(rec.$id?.value ?? '');
    const fld = rec[code];
    if (fld?.value == null) return '';
    const v = fld.value;
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.join(', ');
      if (v.name != null) return String(v.name);
      return '';
    }
    return String(v);
  };

  const get627PrintCellValue = (rec, cell) =>
    cell ? get627PrintFieldValue(rec, cell.code) : '';

  /**
   * セル値が「実質空」かどうか（空文字 / 空白だけ / ハイフン系記号だけ）。
   * 過去運用で「未使用」を表す `----` `---` `--` `ー` `—` `－` 等が手入力されているため、
   * これらを空欄と同等に扱う（C-4: 印刷帳票のみの判定。データには影響なし）。
   * ハイフン系: ASCII `-` (U+002D), Hyphen `‐` (U+2010), En dash `–` (U+2013),
   *            Em dash `—` (U+2014), Horizontal bar `―` (U+2015),
   *            Katakana long sound `ー` (U+30FC), Halfwidth `ｰ` (U+FF70),
   *            Full-width hyphen-minus `－` (U+FF0D)
   */
  const isPrint627CellEmpty = (raw) =>
    /^[\s\u002D\u2010\u2013\u2014\u2015\u30FC\uFF70\uFF0D]*$/u.test(String(raw ?? ''));

  /**
   * 1段ぶんの HTML（横並びグリッドセル）。tierIndex 0 は部署・氏名・PC を強調表示。
   * tierIndex >= 1 で全セルが「実質空」なら段ごと省略する（C-4: 共有/個人で不要セクションを抑制）。
   */
  const build627PrintTierHtml = (rec, tierCells, tierIndex) => {
    const isLead = tierIndex === 0;
    if (!isLead) {
      const allEmpty = tierCells.every(
        (cell) => isPrint627CellEmpty(get627PrintCellValue(rec, cell))
      );
      if (allEmpty) return '';
    }
    let tierClass = 'jbis627-tier';
    if (isLead) tierClass += ' jbis627-tier--lead';
    const ncol = tierCells.length;
    if (ncol === 3) {
      tierClass += ' jbis627-tier--cols3';
    } else if (ncol === 2) {
      tierClass += ' jbis627-tier--cols2';
      if (tierCells[0]?.code === 'm365_id') tierClass += ' jbis627-tier--m365';
    }
    const cellsHtml = tierCells.map((cell) => {
      const raw = get627PrintCellValue(rec, cell);
      const isEmpty = isPrint627CellEmpty(raw);
      const val = isEmpty ? '---' : raw.trim();
      const dimStyle = isEmpty ? ' style="color:#94a3b8;font-style:italic"' : '';
      return `<div class="jbis627-cell">\
<div class="jbis627-lab">${esc627PrintHtml(cell.label)}</div>\
<div class="jbis627-val"${dimStyle}>${esc627PrintHtml(val)}</div></div>`;
    }).join('');
    return `<div class="${tierClass}">${cellsHtml}</div>`;
  };

  /**
   * 別ウィンドウに表を出し、ブラウザの印刷ダイアログを開く（パスワード行を含むので取り扱い注意）。
   * head/body を document 直下に append だけすると環境によって白画面になるため document.write で組み立てる。
   */
  const open627SystemInfoPrintWindow = (rec) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('別ウィンドウを開けませんでした。ポップアップブロックを解除してください。');
      return;
    }
    w.opener = null;

    const recNo = get627PrintFieldValue(rec, 'レコード番号');
    const bodyInner = JBIS627_PRINT_LAYOUT
      .map((tier, i) => build627PrintTierHtml(rec, tier, i))
      .filter(Boolean)
      .join('');
    const metaLine =
      `${recNo ? `No. ${esc627PrintHtml(recNo)} \u00b7 ` : ''}${esc627PrintHtml(new Date().toLocaleString('ja-JP'))}`;

    // C-4: account_type で印刷テーマと文言を出し分け（既存の 668 ガイド配色と統一）
    const accTypeRaw = String(rec?.[FC627_ACCOUNT_TYPE]?.value ?? '').trim();
    const isShared = accTypeRaw === '共有アカウント';
    const theme = isShared
      ? {
          label: '共有アカウント',
          title: 'アカウント管理台帳（共有）',
          subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
          notice: '本アカウントは複数メンバーで<b>共有して利用するID/PW</b>です。'
            + 'ID・パスワードを変更した場合は<b>関係者全員に必ず共有</b>してください。'
            + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
          heroBg: '#ffe4e6',
          heroFg: '#881337',
          heroBorder: '#fecdd3',
          heroSub: '#9f1239',
          noticeBorder: '#e11d48',
          noticeBg: '#ffe4e6',
          noticeFg: '#881337',
          badgeBg: '#fff1f2',
          badgeBorder: '#fda4af',
          badgeFg: '#9f1239',
          cardBorder: '#fecdd3',
          bodyBg: '#fff1f2',
          tierLeadBg: '#fff5f7',
          tierLeadBorder: '#ffe4e6',
          tierEvenBg: '#fff8f9',
          shadowColor: 'rgba(159,18,57,.12)',
        }
      : {
          label: accTypeRaw || '個人アカウント',
          title: 'アカウント管理台帳',
          subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
          notice: 'アカウント情報の管理は個人の責任で行ってください。'
            + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
          heroBg: '#d1fae5',
          heroFg: '#134e4a',
          heroBorder: '#a7f3d0',
          heroSub: '#365f52',
          noticeBorder: '#0d9488',
          noticeBg: '#d1fae5',
          noticeFg: '#134e4a',
          badgeBg: '#ecfdf5',
          badgeBorder: '#86efac',
          badgeFg: '#166534',
          cardBorder: '#bbf7d0',
          bodyBg: '#ecfdf5',
          tierLeadBg: '#f0fdf4',
          tierLeadBorder: '#dcfce7',
          tierEvenBg: '#f7fef9',
          shadowColor: 'rgba(15,118,110,.12)',
        };

    const docHtml = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">\
<meta name="viewport" content="width=device-width,initial-scale=1">\
<title>アカウント台帳・システム情報</title>\
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap">\
<style>\
:root{\
--hero-bg:${theme.heroBg};--hero-fg:${theme.heroFg};--hero-border:${theme.heroBorder};--hero-sub:${theme.heroSub};\
--notice-border:${theme.noticeBorder};--notice-bg:${theme.noticeBg};--notice-fg:${theme.noticeFg};\
--badge-bg:${theme.badgeBg};--badge-border:${theme.badgeBorder};--badge-fg:${theme.badgeFg};\
--card-border:${theme.cardBorder};--body-bg:${theme.bodyBg};\
--tier-lead-bg:${theme.tierLeadBg};--tier-lead-border:${theme.tierLeadBorder};--tier-even-bg:${theme.tierEvenBg};\
--shadow-color:${theme.shadowColor};\
}\
*{box-sizing:border-box;}\
body{margin:0;padding:28px 20px 40px;background:var(--body-bg);\
font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}\
.jbis627-wrap{max-width:880px;margin:0 auto;}\
.jbis627-hero{background:var(--hero-bg);color:var(--hero-fg);padding:26px 28px 22px;border-radius:18px 18px 0 0;\
border:1px solid var(--hero-border);border-bottom:none;\
box-shadow:0 10px 28px var(--shadow-color);position:relative;}\
.jbis627-hero h1{margin:0;font-size:1.35rem;font-weight:700;letter-spacing:.02em;}\
.jbis627-hero p{margin:10px 0 0;font-size:12px;font-weight:500;line-height:1.65;color:var(--hero-sub);}\
.jbis627-badge{display:inline-block;margin-top:12px;padding:4px 12px;border-radius:999px;\
background:var(--badge-bg);font-size:11px;font-weight:700;letter-spacing:.04em;\
border:1px solid var(--badge-border);color:var(--badge-fg);}\
.jbis627-notice{margin:0;padding:14px 18px 16px;border-left:4px solid var(--notice-border);\
background:var(--notice-bg);border-bottom:1px solid var(--hero-border);}\
.jbis627-notice p{margin:0;font-size:12px;font-weight:600;line-height:1.7;color:var(--notice-fg);}\
.jbis627-card{background:#fff;border-radius:0 0 18px 18px;\
box-shadow:0 18px 40px rgba(15,23,42,.08);overflow:hidden;border:1px solid var(--card-border);\
border-top:none;}\
.jbis627-tier{display:grid;gap:0;padding:0;border-bottom:1px solid #e2e8f0;}\
.jbis627-tier--cols1{grid-template-columns:1fr;}\
.jbis627-tier--cols2{grid-template-columns:1fr 1fr;}\
.jbis627-tier--cols3{grid-template-columns:1fr 1fr 1fr;}\
.jbis627-tier--m365{grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);}\
.jbis627-tier--memo .jbis627-cell--memo{min-height:0;padding:18px 20px 22px;border-right:none;}\
.jbis627-lab--memo{text-transform:none;letter-spacing:0.04em;font-size:11px;font-weight:700;\
color:#475569;margin-bottom:8px;line-height:1.35;}\
.jbis627-memo-space{min-height:72px;border:1px dashed #94a3b8;border-radius:6px;background:#f8fafc;\
margin-top:10px;}\
.jbis627-tier:last-child{border-bottom:none;}\
.jbis627-cell{padding:18px 20px 20px;background:#fff;border-right:1px solid #f1f5f9;min-height:92px;}\
.jbis627-cell:last-child{border-right:none;}\
.jbis627-tier:nth-child(even) .jbis627-cell{background:var(--tier-even-bg);}\
.jbis627-tier--lead .jbis627-cell{background:var(--tier-lead-bg);padding:22px 22px 24px;min-height:108px;\
border-right:1px solid var(--tier-lead-border);}\
.jbis627-tier--lead .jbis627-lab{font-size:12px;font-weight:700;color:#475569;letter-spacing:.06em;\
text-transform:none;margin-bottom:10px;}\
.jbis627-tier--lead .jbis627-val{font-size:1.35rem;font-weight:700;line-height:1.45;color:#0f172a;}\
.jbis627-lab{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;\
margin-bottom:8px;line-height:1.3;}\
.jbis627-val{font-size:14px;font-weight:600;line-height:1.55;color:#0f172a;word-break:break-word;\
min-height:1.4em;font-feature-settings:"tnum";}\
.jbis627-foot{margin-top:22px;text-align:center;font-size:11px;color:#64748b;font-weight:500;}\
@media print{\
@page{size:A4 portrait;margin:7mm;}\
body{padding:0;background:var(--body-bg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}\
.jbis627-wrap{max-width:100%;margin:0;}\
.jbis627-hero{padding:12px 16px 10px;border-radius:0;box-shadow:none;border:1px solid var(--hero-border);\
background:var(--hero-bg);color:var(--hero-fg);}\
.jbis627-hero h1{font-size:16pt;line-height:1.2;margin:0;color:var(--hero-fg);}\
.jbis627-hero p{margin:7px 0 0;font-size:9.5pt;line-height:1.45;font-weight:500;color:var(--hero-sub);}\
.jbis627-badge{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;\
background:var(--badge-bg);border:1px solid var(--badge-border);color:var(--badge-fg);\
font-size:9pt;font-weight:700;letter-spacing:.04em;}\
.jbis627-notice{padding:10px 14px 11px;border-left:4px solid var(--notice-border);background:var(--notice-bg);\
border-bottom:1px solid var(--hero-border);}\
.jbis627-notice p{margin:0;font-size:9.5pt;line-height:1.55;font-weight:600;color:var(--notice-fg);}\
.jbis627-card{box-shadow:none;border-radius:0;border:1px solid var(--card-border);border-top:none;}\
.jbis627-tier{break-inside:avoid;page-break-inside:avoid;border-color:#cbd5e1;}\
.jbis627-cell{padding:12px 16px 14px;min-height:0;border-color:#e2e8f0;}\
.jbis627-tier:nth-child(even) .jbis627-cell{background:var(--tier-even-bg) !important;}\
.jbis627-tier--lead .jbis627-cell{background:var(--tier-lead-bg) !important;padding:14px 18px 16px;min-height:0;\
border-right:1px solid var(--tier-lead-border);}\
.jbis627-tier--lead .jbis627-lab{font-size:11pt;margin-bottom:6px;color:#475569;\
text-transform:none;letter-spacing:0.02em;font-weight:700;}\
.jbis627-tier--lead .jbis627-val{font-size:15pt;font-weight:700;line-height:1.35;color:#0f172a;}\
.jbis627-lab{font-size:10pt;margin-bottom:5px;line-height:1.3;color:#475569;\
text-transform:none;letter-spacing:0.02em;font-weight:700;}\
.jbis627-val{font-size:12.5pt;line-height:1.45;font-weight:600;word-break:break-word;\
overflow-wrap:anywhere;}\
.jbis627-foot{margin-top:12px;font-size:9.5pt;line-height:1.35;color:#64748b;}\
.jbis627-tier--memo .jbis627-cell--memo{padding:10px 14px 12px !important;}\
.jbis627-lab--memo{font-size:9pt !important;margin-bottom:4px !important;}\
.jbis627-memo-space{min-height:48px;margin-top:6px;background:#fafafa !important;}\
}\
</style></head><body>\
<div class="jbis627-wrap">\
<header class="jbis627-hero">\
<h1>${esc627PrintHtml(theme.title)}</h1>\
<p>${esc627PrintHtml(theme.subtitle)}</p>\
<span class="jbis627-badge">${esc627PrintHtml(theme.label)}</span>\
</header>\
<aside class="jbis627-notice" role="note">\
<p>${theme.notice}</p>\
</aside>\
<div class="jbis627-card">\
${bodyInner}\
<div class="jbis627-tier jbis627-tier--cols1 jbis627-tier--memo">\
<div class="jbis627-cell jbis627-cell--memo">\
<div class="jbis627-lab jbis627-lab--memo">その他・メモ（手書き用）</div>\
<div class="jbis627-memo-space" aria-hidden="true"></div>\
</div></div>\
</div>\
<p class="jbis627-foot">${metaLine}</p>\
</div></body></html>`;

    const d = w.document;
    d.open();
    d.write(docHtml);
    d.close();
    w.focus();
    setTimeout(() => {
      try { w.print(); } catch (e) { console.warn('[jbis 627] window.print', e); }
    }, 400);
  };

  /** 編集は get()、詳細は get 不可のためスナップショット、の順で印刷用レコードを得る */
  const resolve627PrintRecord = (isMobile) => {
    let rec = null;
    try {
      const holder = getFormHolder(isMobile);
      if (holder?.record) rec = holder.record;
    } catch { rec = null; }
    return rec ?? jb627PrintRecordSnapshot ?? null;
  };

  /** 詳細／編集のヘッダスペースへ「システム情報を印刷」を 1 個だけ置く */
  const mount627SystemInfoPrintButton = (isMobile) => {
    if (document.getElementById(JBIS627_PRINT_BTN_ID)) return true;
    let host = null;
    if (isMobile) {
      host = kintone.mobile?.app?.record?.getHeaderMenuSpaceElement?.() ?? null;
    }
    if (!host) {
      host = kintone.app?.record?.getHeaderMenuSpaceElement?.() ?? null;
    }
    if (!host) return false;
    const btn = document.createElement('button');
    btn.id = JBIS627_PRINT_BTN_ID;
    btn.type = 'button';
    btn.textContent = 'システム情報を印刷';
    btn.setAttribute('title', 'アカウント・パスワード等を印刷用の表で開きます');
    btn.style.cssText =
      'margin:4px 8px;padding:7px 12px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid #0f766e;background:#0d9488;color:#fff;cursor:pointer;white-space:nowrap;';
    btn.addEventListener('mouseenter', () => { btn.style.background = '#0f766e'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#0d9488'; });
    btn.addEventListener('click', () => {
      const rec = resolve627PrintRecord(isMobile);
      if (!rec) {
        alert('レコードを取得できませんでした。もう一度開き直してください。');
        return;
      }
      open627SystemInfoPrintWindow(rec);
    });
    host.appendChild(btn);
    return true;
  };

  /** Ocean 表示の遅延に合わせて印刷ボタン配置を数回試す */
  const schedule627SystemInfoPrintButton = (isMobile) => {
    [0, 400, 1000].forEach((ms) => {
      setTimeout(() => {
        try {
          if (!document.getElementById(JBIS627_PRINT_BTN_ID)) {
            mount627SystemInfoPrintButton(isMobile);
          }
        } catch (e) {
          console.warn('[jbis 627] system print schedule', e);
        }
      }, ms);
    });
  };

  /** 詳細・編集表示でシステム情報印刷 UI を用意する */
  const onRecordShow627SystemPrint = (event) => {
    try {
      if (event?.record) jb627PrintRecordSnapshot = event.record;
      // PC台帳番号帯（詳細のみ）
      if (String(event?.type ?? '').includes('detail.show')) {
        try { mount627PcLedgerBanner(event.record); }
        catch (e) { console.warn('[jbis 627] pc ledger banner', e); }
        try { void mount627DupDetailBanner(event.record); }
        catch (e) { console.warn('[jbis 627] dup detail banner', e); }
      }
      schedule627SystemInfoPrintButton(isMobileEvent(event));
    } catch (e) {
      console.warn('[jbis 627] system print show', e);
    }
      return event;
  };

  kintone.events.on('app.record.detail.show', onRecordShow627SystemPrint);
  kintone.events.on('app.record.edit.show', onRecordShow627SystemPrint);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      'mobile.app.record.detail.show',
      onRecordShow627SystemPrint
    );
    kintone.events.on(
      'mobile.app.record.edit.show',
      onRecordShow627SystemPrint
    );
  }

  kintone.events.on('app.record.create.show', onCreateShowWithPrefill);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.create.show', onCreateShowWithPrefill);
  }

  // ── 利用者名 → 所属名 / 所属グループ 自動取得 (2026-04-19 追加) ─────────
  // 利用者名 (user_name) を入力・変更したら、社員マスタ (595) から
  // dept_name / group_name を自動取得して 627 のフィールドに埋める。
  // kintone 標準ルックアップを使わない (既存スキーマ・API 互換性維持のため)。
  // 候補が複数ある場合は最初の 1 件を採用。0 件の場合は既存値を変更しない。
  const fetch595ByUserName = (userName) =>
    kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: APP595,
      query: `user_name = "${escQuery(userName)}" limit 5`,
      fields: ['$id', 'user_name', 'dept_name', 'group_name'],
    });

  // kintone change イベントは Promise / Thenable を return できない仕様。
  // → 同期で event を return し、非同期処理は fire-and-forget で起動。
  //   完了後に kintone.app.record.set() でフォームに反映する (約 200-500ms 後)。
  const onUserNameChangeFillDept = (event) => {
    const rec = event.record;
    const userName = String(rec?.user_name?.value ?? '').trim();
    if (!userName) return event;  // 空入力なら何もしない (既存値も触らない)

    fetch595ByUserName(userName).then((resp) => {
      const r595 = resp?.records?.[0];
      if (!r595) return;  // 595 に該当なし: 既存値を保持

      // 現在のフォーム状態を取得して、所属だけ上書きして set
      const cur = kintone.app.record.get();
      if (!cur || !cur.record) return;
      const dept = r595.dept_name?.value ?? '';
      const grp = r595.group_name?.value ?? '';
      if (cur.record.dept_name) cur.record.dept_name.value = dept;
      if (cur.record.group_name) cur.record.group_name.value = grp;
      kintone.app.record.set(cur);

      // 同姓同名警告
      if (resp.records.length > 1) {
        console.info(
          `[jbis 627] 同姓同名 ${resp.records.length} 件: 自動取得した所属が想定と違う場合は手動修正してください (利用者: ${userName})`
        );
      }
    }).catch((e) => {
      console.warn('[jbis 627 user_name change]', e);
    });

    return event;
  };

  kintone.events.on(
    ['app.record.create.change.user_name', 'app.record.edit.change.user_name'],
    onUserNameChangeFillDept
  );
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      ['mobile.app.record.create.change.user_name', 'mobile.app.record.edit.change.user_name'],
      onUserNameChangeFillDept
    );
  }

  /**
   * 627 create.submit.success: 595/626 連携のみ（旧594 ledger ミラーは廃止）。
   */
  const onCreateSubmitSuccess = (event) => new kintone.Promise(async (resolve) => {
    const rid627 = String(event.recordId || event.record?.$id?.value || '');
    const { id595, id626, needs626PoolMark, mail626 } = { ...pendingState };
    Object.assign(pendingState, {
      id595: null, id626: null, needs626PoolMark: false, mail626: '',
    });

    if (!rid627) { resolve(event); return; }

    const tasks = [];
    const url = kintone.api.url('/k/v1/record.json', true);

    if (id595 && id626) {
      tasks.push(
        kintone.api(url, 'PUT', {
        app: APP595,
          id: id595,
        record: {
            ledger_record_id: { value: String(rid627) },
            // 595 の CHECK_BOX（ledger_created）の選択肢「作成済み」と一致させること
            ledger_created: { value: ['作成済み'] },
          },
        })
      );
      if (needs626PoolMark && mail626) {
        tasks.push(
          kintone.api(url, 'PUT', {
          app: APP626,
            id: id626,
          record: {
            mail: { value: mail626 },
              used_count: { value: USED626 },
            },
          })
        );
      }
    }

    try {
      if (tasks.length > 0) await Promise.all(tasks);
    } catch (e) {
      console.error('[jbis 627 submit.success 595/626]', e);
        alert(
        `627 は保存されましたが、595 または 626 の連携更新に失敗しました。レコード番号 ${rid627} と 595/626 を確認してください。`
        );
  }
    resolve(event);
  });

  kintone.events.on('app.record.create.submit.success', onCreateSubmitSuccess);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      'mobile.app.record.create.submit.success',
      onCreateSubmitSuccess
    );
  }

  /**
   * 627 edit.submit.success: 旧594ミラー廃止（何もしない）。
   */
  const onEditSubmitSuccess = (event) => new kintone.Promise(async (resolve) => {
    resolve(event);
  });

  kintone.events.on('app.record.edit.submit.success', onEditSubmitSuccess);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      'mobile.app.record.edit.submit.success',
      onEditSubmitSuccess
    );
  }

  /** 一覧の追加検索で使うフィールド（kintone-apps.md の 627 と一致・推測で追加しない） */
  const SEARCH627_DEPT = 'dept_name';
  const SEARCH627_GROUP = 'group_name';
  const SEARCH627_USER = 'user_name';
  const SEARCH627_EMP = 'employment_status';
  const SEARCH627_ACC = 'account_state';
  /** 一覧カスタム検索の PC 名（アプリ627のフィールドコードと一致） */
  const SEARCH627_PC_NAME = 'PC_name';
  /** 検索パネルの DOM id（二重挿入防止） */
  const SEARCH627_WRAP_ID = 'jbis-627-list-search';
  /** 古いカスタマイズの DOM が残っていると新レイアウトが効かないため、差し替えたら値を上げる */
  const SEARCH627_WRAP_DATA_VER = 'data-jbis627-search-ver';
  const SEARCH627_WRAP_VER = '12';

  /** 一覧ヘッダ上で、CSV 等標準 UI がカスタム検索パネルより手前になるようにする */
  const ensure627ToolbarMenuAboveCustomSearch = () => {
    if (document.getElementById('jbis-627-toolbar-menu-zfix')) return;
    const st = document.createElement('style');
    st.id = 'jbis-627-toolbar-menu-zfix';
    st.textContent = `.ocean-ui-app-index-head > *:not(#jbis-627-list-search) {
  position: relative;
  z-index: 6;
}
.gaia-argoui-app-toolbar-top > *:not(#jbis-627-list-search),
.gaia-argoui-app-index-head > *:not(#jbis-627-list-search) {
  position: relative;
  z-index: 6;
}`;
    document.head.appendChild(st);
  };

  /** 627 一覧用: 追加検索まわりの CSS（窄いブラウザ幅でも折り返して使える） */
  const ensure627ListSearchBarStyles = () => {
    const sid = 'jbis-627-list-search-style-v8';
    if (document.getElementById(sid)) return;
    const legacy = document.getElementById('jbis-627-list-search-style');
    if (legacy) { try { legacy.remove(); } catch { /* noop */ } }
    const st = document.createElement('style');
    st.id = sid;
    st.textContent = `\
.jbis-627-list-search-mount--toolbar{flex-wrap:wrap !important;align-items:flex-start !important;}\
#jbis-627-list-search{flex:0 0 auto;width:100%;max-width:min(100%,calc(100vw - 24px));min-width:0;\
box-sizing:border-box;padding:12px 12px 14px 12px;margin:0 0 20px 0 !important;\
background:#f8fafc;border:1px solid #e2e8f0;border-bottom:2px solid #cbd5e1;border-radius:8px;\
position:sticky;top:0;left:0;z-index:2;box-shadow:0 2px 8px rgba(15,23,42,.08);\
overflow-x:auto;align-self:flex-start;}\
#jbis-627-list-search .jbis627-search-hint{font-size:10px;color:#64748b;margin:0 0 8px;\
line-height:1.45;max-width:100%;word-wrap:break-word;}\
#jbis-627-list-search .jbis627-search-fields{display:grid;\
grid-template-columns:repeat(3,minmax(140px,1fr));gap:10px 12px;align-items:end;\
width:100%;min-width:0;box-sizing:border-box;}\
#jbis-627-list-search .jbis627-search-field{display:flex;flex-direction:column;gap:4px;min-width:0;}\
#jbis-627-list-search .jbis627-search-field label{font-size:11px;font-weight:600;\
color:#334155;white-space:normal;line-height:1.25;}\
#jbis-627-list-search .jbis627-search-field input,\
#jbis-627-list-search .jbis627-search-field select{box-sizing:border-box;width:100%;min-width:0;\
padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:12px;}\
#jbis-627-list-search .jbis627-search-actions{display:flex;flex-wrap:wrap;gap:8px;\
align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;\
width:100%;box-sizing:border-box;}\
#jbis-627-list-search .jbis627-search-actions button{padding:6px 14px;border-radius:6px;\
cursor:pointer;font-weight:600;font-size:12px;}\
#jbis-627-list-search .jbis627-search-actions .jbis627-btn-primary{border:none;\
background:#2563eb;color:#fff;}\
#jbis-627-list-search .jbis627-search-actions .jbis627-btn-secondary{border:1px solid #94a3b8;\
background:#fff;color:#334155;}\
#jbis-627-list-search.jbis-627-list-search--body-fallback{position:fixed;left:8px;right:8px;\
bottom:10px;top:auto;max-height:min(48vh,420px);overflow-y:auto;z-index:12000;\
box-shadow:0 -4px 24px rgba(15,23,42,.18);}\
@media (max-width:1200px){\
#jbis-627-list-search .jbis627-search-fields{grid-template-columns:repeat(2,minmax(140px,1fr));}}\
@media (max-width:720px){\
#jbis-627-list-search .jbis627-search-fields{grid-template-columns:1fr;}}`;
    document.head.appendChild(st);
  };

  /**
   * 627 一覧: 条件を kintone の query 文字列にする（未入力は無視）。
   * 在籍・アカウント状態は DROP_DOWN のためクエリでは = 不可・in ("値") で指定。他は部分一致 like。
   * サブテーブル（pc_ledger_links.*）は一覧 query では使えずエラーになるため、
   * PC台帳「入力あり/未入力」は $id in (...) の後段フィルタに分離する。
   */
  const build627ListQuery = (dept, group, user, emp, acc, pcFilled, accountType) => {
    const parts = [];
    const d = String(dept ?? '').trim();
    const g = String(group ?? '').trim();
    const u = String(user ?? '').trim();
    const e = String(emp ?? '').trim();
    const a = String(acc ?? '').trim();
    const p = String(pcFilled ?? '').trim();
    const at = String(accountType ?? '').trim();
    if (d) parts.push(`${SEARCH627_DEPT} like "${escQuery(d)}"`);
    if (g) parts.push(`${SEARCH627_GROUP} like "${escQuery(g)}"`);
    if (u) parts.push(`${SEARCH627_USER} like "${escQuery(u)}"`);
    if (e) parts.push(`${SEARCH627_EMP} in ("${escQuery(e)}")`);
    if (a) parts.push(`${SEARCH627_ACC} in ("${escQuery(a)}")`);
    // RADIO/DROP_DOWN の環境差を吸収するため in ("値") に寄せる
    if (at) parts.push(`${FC627_ACCOUNT_TYPE} in ("${escQuery(at)}")`);
    if (p === 'set') parts.push(`${FC627_PC594} != ""`);
    if (p === 'empty') parts.push(`${FC627_PC594} = ""`);
    return parts.join(' and ');
  };

  /**
   * PC名: kintone の like は単語検索のため「KS002」が「KS0022-…」にヒットしないことがある。
   * 必要フィールドだけ取得し、記号除去＋小文字化した表記で部分一致 → $id in (...)。
   * （594 の build594PcNameIdQuery と同趣旨）
   */
  const build627PcNameIdQuery = async (pcPartRaw) => {
    const raw = String(pcPartRaw ?? '').trim();
    if (!raw) return null;
    const normStr = (s) => {
      try { return String(s ?? '').normalize('NFKC'); }
      catch { return String(s ?? ''); }
    };
    const compact = (s) => normStr(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const want = compact(raw);
    if (!want) return null;

    const urlRecs = kintone.api.url('/k/v1/records.json', true);
    const app = kintone.app.getId();
    const limit = 500;
    const maxOffset = 5000;
    const ids = [];
    let offset = 0;

    for (;;) {
      const res = await kintone.api(urlRecs, 'GET', {
        app,
        fields: ['$id', SEARCH627_PC_NAME],
        query: `$id > 0 order by $id asc limit ${limit} offset ${offset}`,
      });
      const recs = res?.records ?? [];
      for (const r of recs) {
        const id = Number(r.$id?.value);
        const pv = String(r[SEARCH627_PC_NAME]?.value ?? '');
        if (compact(pv).includes(want) && Number.isFinite(id)) {
          ids.push(id);
        }
      }
      if (recs.length < limit) break;
      offset += limit;
      if (offset > maxOffset || ids.length >= 1000) break;
    }
    return ids.length ? `$id in (${ids.slice(0, 1000).join(',')})` : '$id = -1';
  };

  /** q と PC名の $id 条件を and（どちらか空ならもう一方のみ） */
  const merge627QueryAndPcNameIds = (qBase, idQ) => {
    if (!idQ) return qBase;
    if (!qBase) return idQ;
    return `(${qBase}) and (${idQ})`;
  };

  /**
   * 627 一覧: WindowsID(logon_name) の値が他のレコードと重複しているアカウントの $id を集める。
   * 入力ミス検出用途。NFKC + trim 正規化後の同値で 2 件以上のものが対象。
   * 「ローカルアカウント」表記と空文字は対象外（運用上、複数あって正常）。
   * 結果は最大 1000 件まで。
   */
  const build627IdsHavingDuplicateLogonQuery = async () => {
    const url = kintone.api.url('/k/v1/records.json', true);
    const app = kintone.app.getId();
    const limit = 500;
    const maxOffset = 50000;
    const buckets = new Map(); // normalizedLogon -> [recordId,...]
    let offset = 0;
    for (;;) {
      const res = await kintone.api(url, 'GET', {
        app,
        query: `$id > 0 order by $id asc limit ${limit} offset ${offset}`,
        fields: ['$id', FC627_LOGON],
      });
      const recs = res?.records ?? [];
      for (const r of recs) {
        const rid = Number(r.$id?.value);
        if (!Number.isFinite(rid)) continue;
        const raw = r[FC627_LOGON]?.value;
        let v;
        try { v = String(raw ?? '').normalize('NFKC').trim(); }
        catch { v = String(raw ?? '').trim(); }
        if (!v) continue;
        if (v === LOGON_LOCAL_PLACEHOLDER) continue;
        if (!buckets.has(v)) buckets.set(v, []);
        buckets.get(v).push(rid);
      }
      if (recs.length < limit) break;
      offset += limit;
      if (offset > maxOffset) break;
    }
    const ids = [];
    buckets.forEach((arr) => { if (arr.length >= 2) ids.push(...arr); });
    if (!ids.length) return '$id = -1';
    const uniq = [...new Set(ids)].slice(0, 1000);
    return `$id in (${uniq.join(',')})`;
  };

  /**
   * 627 一覧: 「PCが複数紐付いている」アカウントの $id を集める。
   * 判定ロジック: pc_594_record_id（単独）と pc_ledger_links（サブテーブル）に書かれた
   * pc_ledger_link_594_id を和集合し、ユニーク件数が 2 以上のもの。
   * 間違い探し用途のため、最大 1000 件まで。
   */
  const build627IdsHavingMultiplePcsQuery = async () => {
    const url = kintone.api.url('/k/v1/records.json', true);
    const app = kintone.app.getId();
    const limit = 500;
    const maxOffset = 50000;
    const ids = [];
    let offset = 0;
    for (;;) {
      const res = await kintone.api(url, 'GET', {
        app,
        query: `$id > 0 order by $id asc limit ${limit} offset ${offset}`,
        fields: ['$id', FC627_PC594, FC627_PC_SUBTABLE],
      });
      const recs = res?.records ?? [];
      for (const r of recs) {
        const rid = Number(r.$id?.value);
        if (!Number.isFinite(rid)) continue;
        const set = new Set();
        const single = String(r[FC627_PC594]?.value ?? '').trim();
        if (single) set.add(single);
        const rows = r[FC627_PC_SUBTABLE]?.value ?? [];
        for (const row of rows) {
          const v = String(row?.value?.[FC627_PC_SUB_594]?.value ?? '').trim();
          if (v) set.add(v);
        }
        if (set.size >= 2) {
          ids.push(rid);
          if (ids.length >= 1000) break;
        }
      }
      if (ids.length >= 1000 || recs.length < limit) break;
      offset += limit;
      if (offset > maxOffset) break;
    }
    return ids.length ? `$id in (${ids.slice(0, 1000).join(',')})` : '$id = -1';
  };

  /** 627 一覧: pc_ledger_links に 1 件でも行がある $id を集め、$id in (...) のクエリを返す */
  const build627IdsHavingPcLedgerLinksQuery = async () => {
    const url = kintone.api.url('/k/v1/records.json', true);
    const app = kintone.app.getId();
    const limit = 500;
    const maxOffset = 5000;
    const ids = [];
    let offset = 0;

    for (;;) {
      const res = await kintone.api(url, 'GET', {
        app,
        query: `$id > 0 order by $id asc limit ${limit} offset ${offset}`,
        fields: ['$id', FC627_PC_SUBTABLE],
      });
      const recs = res?.records ?? [];
      for (const r of recs) {
        const rid = Number(r.$id?.value);
        const rows = r[FC627_PC_SUBTABLE]?.value ?? [];
        if (rows?.length > 0 && Number.isFinite(rid)) {
          ids.push(rid);
          if (ids.length >= 1000) break;
        }
      }
      if (ids.length >= 1000 || recs.length < limit) break;
      offset += limit;
      if (offset > maxOffset) break;
    }
    return ids.length ? `$id in (${ids.slice(0, 1000).join(',')})` : '$id = -1';
  };

  /** 一覧 URL の query を差し替えて再表示する */
  const navigate627ListWithQuery = (queryStr) => {
    let u;
    try { u = new URL(location.href); } catch { return; }
    if (queryStr) {
      u.searchParams.set('query', queryStr);
    } else {
      u.searchParams.delete('query');
    }
    location.href = u.toString();
  };

  /** 627 一覧で検索パネルを載せる親要素を決める */
  const resolve627ListSearchMount = () => {
    const oceanHead = document.querySelector('.ocean-ui-app-index-head');
    if (oceanHead) return { parent: oceanHead, insert: 'first' };

    if (typeof kintone.app.getHeaderSpaceElement === 'function') {
      const headerSpace = kintone.app.getHeaderSpaceElement();
      if (headerSpace) return { parent: headerSpace, insert: 'last' };
    }
    const menu = kintone.app.getHeaderMenuSpaceElement();
    if (menu) return { parent: menu, insert: 'last' };

    for (const sel of ['.gaia-argoui-app-toolbar-top', '.gaia-argoui-app-index-head']) {
      const n = document.querySelector(sel);
      if (n) return { parent: n, insert: 'first' };
    }
    const listBox = document.querySelector('.recordlist-gaia');
    if (listBox) return { parent: listBox, insert: 'first' };
    const layoutGaia = document.querySelector('#contents-body .layout-gaia');
    if (layoutGaia) return { parent: layoutGaia, insert: 'first' };
    return { parent: null, insert: 'last' };
  };

  /** 検索パネルを DOM に差し込み、親の flex が見切れないようクラスを付与する */
  const attach627ListSearchPanel = (wrap) => {
    const info = resolve627ListSearchMount();
    if (!info.parent) return false;
    if (info.insert === 'first') {
      info.parent.insertBefore(wrap, info.parent.firstChild);
    } else {
      info.parent.appendChild(wrap);
    }
    info.parent.classList?.add('jbis-627-list-search-mount--toolbar');
    info.parent.closest?.('.ocean-ui-app-index-head')
      ?.classList?.add('jbis-627-list-search-mount--toolbar');
    return true;
  };

  /** ヘッダ付近に 627 一覧用の検索欄を置く */
  const render627ListSearchBar = () => {
    ensure627ListSearchBarStyles();
    const existingWrap = document.getElementById(SEARCH627_WRAP_ID);
    if (existingWrap) {
      if (existingWrap.getAttribute(SEARCH627_WRAP_DATA_VER) === SEARCH627_WRAP_VER) return;
      try { existingWrap.remove(); } catch (e) {
        console.warn('[jbis 627] 旧検索バーの除去に失敗', e);
      }
    }
    const wrap = document.createElement('div');
    wrap.id = SEARCH627_WRAP_ID;
    wrap.setAttribute(SEARCH627_WRAP_DATA_VER, SEARCH627_WRAP_VER);
    /* kintone 標準 CSS が margin/padding を上書きすることがあるため、レイアウトの要をインラインで固定 */
    wrap.style.setProperty('box-sizing', 'border-box', 'important');
    wrap.style.setProperty('width', '100%', 'important');
    wrap.style.setProperty('max-width', 'min(100%, calc(100vw - 24px))', 'important');
    wrap.style.setProperty('margin', '0 0 20px 0', 'important');
    wrap.style.setProperty('padding', '12px 12px 14px', 'important');
    wrap.style.setProperty('background', '#f8fafc', 'important');
    wrap.style.setProperty('border', '1px solid #e2e8f0', 'important');
    wrap.style.setProperty('border-bottom', '2px solid #cbd5e1', 'important');
    wrap.style.setProperty('border-radius', '8px', 'important');
    wrap.style.setProperty('overflow-x', 'auto', 'important');
    wrap.style.setProperty('align-self', 'flex-start', 'important');

    const hint = document.createElement('p');
    hint.className = 'jbis627-search-hint';
    hint.textContent =
      '在籍ステータスは選択肢から、アカウント状態は同一表記（完全一致）で。所属・氏名などの like は kintone の単語検索の制限あり。PC名は単語途中（例: KS002→KS0022）も拾うため一覧APIで部分一致します。PC台帳は「入力あり／未入力」で代表番号とサブテーブル（pc_ledger_links）を参照。📌 PCが複数紐付き は「pc_594_record_id とサブテーブル の和集合が2件以上」のアカウントを抽出（間違い探し用）。🪪 WindowsID重複 は同一 logon_name が2件以上のアカウントを WindowsID 順で並べて抽出（「ローカルアカウント」表記は除外）。';

    const fields = document.createElement('div');
    fields.className = 'jbis627-search-fields';

    const addField = (labelText, placeholder) => {
      const box = document.createElement('div');
      box.className = 'jbis627-search-field';
      const lab = document.createElement('label');
      lab.textContent = labelText;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.setAttribute('autocomplete', 'off');
      inp.placeholder = placeholder;
      box.appendChild(lab);
      box.appendChild(inp);
      fields.appendChild(box);
      return inp;
    };

    const inpDept = addField('所属名', '部分一致');
    const inpGroup = addField('所属グループ', '部分一致');
    const inpUser = addField('利用者', '部分一致');
    const inpPcName = addField('PC名', '部分一致');

    // 在籍ステータス → ドロップダウン (在籍/休職/退職)
    const empRow = document.createElement('div');
    empRow.className = 'jbis627-search-field';
    const empLab = document.createElement('label');
    empLab.textContent = '在籍ステータス';
    const inpEmp = document.createElement('select');
    inpEmp.setAttribute('aria-label', '在籍ステータスで絞り込み');
    const addOptEmp = (v, t) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = t;
      inpEmp.appendChild(o);
    };
    addOptEmp('', 'すべて');
    addOptEmp('在籍', '在籍');
    addOptEmp('休職', '休職');
    addOptEmp('退職', '退職');
    empRow.appendChild(empLab);
    empRow.appendChild(inpEmp);
    fields.appendChild(empRow);

    const inpAcc = addField('アカウント状態', '例: 有効（完全一致）');

    const typeRow = document.createElement('div');
    typeRow.className = 'jbis627-search-field';
    const typeLab = document.createElement('label');
    typeLab.textContent = 'アカウント種別';
    const selType = document.createElement('select');
    selType.setAttribute('aria-label', 'アカウント種別で絞り込み');

    const addOpt = (parent, v, t) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      parent.appendChild(o);
    };
    addOpt(selType, '', 'すべて');
    addOpt(selType, '個人アカウント', '個人アカウント');
    addOpt(selType, '共有アカウント', '共有アカウント');
    typeRow.appendChild(typeLab);
    typeRow.appendChild(selType);
    fields.appendChild(typeRow);

    const pcRow = document.createElement('div');
    pcRow.className = 'jbis627-search-field';
    const pcLab = document.createElement('label');
    pcLab.textContent = 'PC台帳番号';
    const selPc = document.createElement('select');
    selPc.setAttribute('aria-label', 'PC台帳番号の入力の有無で絞り込み');
    addOpt(selPc, '', 'すべて');
    addOpt(selPc, 'set', '入力あり');
    addOpt(selPc, 'empty', '未入力');
    pcRow.appendChild(pcLab);
    pcRow.appendChild(selPc);
    fields.appendChild(pcRow);

    // 「PCが複数紐付き」チェック（間違い探し用）
    const multiPcRow = document.createElement('div');
    multiPcRow.className = 'jbis627-search-field jbis627-search-field--checkbox';
    const multiPcLab = document.createElement('label');
    multiPcLab.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:#7c2d12;font-weight:700;';
    const chkMultiPc = document.createElement('input');
    chkMultiPc.type = 'checkbox';
    chkMultiPc.id = 'jbis627-chk-multipc';
    chkMultiPc.style.cssText = 'transform:scale(1.2);accent-color:#b91c1c;';
    multiPcLab.appendChild(chkMultiPc);
    const multiPcSpan = document.createElement('span');
    multiPcSpan.textContent = '📌 PCが複数紐付き（間違い探し）';
    multiPcLab.appendChild(multiPcSpan);
    multiPcRow.appendChild(multiPcLab);
    fields.appendChild(multiPcRow);

    // 「WindowsID重複」チェック（入力ミス検出用）
    const dupLogonRow = document.createElement('div');
    dupLogonRow.className = 'jbis627-search-field jbis627-search-field--checkbox';
    const dupLogonLab = document.createElement('label');
    dupLogonLab.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:#7c2d12;font-weight:700;';
    const chkDupLogon = document.createElement('input');
    chkDupLogon.type = 'checkbox';
    chkDupLogon.id = 'jbis627-chk-duplogon';
    chkDupLogon.style.cssText = 'transform:scale(1.2);accent-color:#b91c1c;';
    dupLogonLab.appendChild(chkDupLogon);
    const dupLogonSpan = document.createElement('span');
    dupLogonSpan.textContent = '🪪 WindowsID重複（入力ミス検出）';
    dupLogonLab.appendChild(dupLogonSpan);
    dupLogonRow.appendChild(dupLogonLab);
    fields.appendChild(dupLogonRow);

    const actions = document.createElement('div');
    actions.className = 'jbis627-search-actions';
    const btnSearch = document.createElement('button');
    btnSearch.type = 'button';
    btnSearch.className = 'jbis627-btn-primary';
    btnSearch.textContent = '検索';
    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.className = 'jbis627-btn-secondary';
    btnClear.textContent = '条件クリア';
    actions.appendChild(btnSearch);
    actions.appendChild(btnClear);

    btnSearch.addEventListener('click', async () => {
      const pcRaw = String(inpPcName.value ?? '').trim();
      const qNoPc = build627ListQuery(
        inpDept.value, inpGroup.value, inpUser.value,
        inpEmp.value, inpAcc.value, selPc.value, selType.value
      );

      btnSearch.disabled = true;
      btnSearch.textContent = '検索中…';

      try {
        let qLedger = qNoPc;
        if (selPc.value === 'set' || selPc.value === 'empty') {
          try {
            const idQ = await build627IdsHavingPcLedgerLinksQuery();
            if (selPc.value === 'set') {
              if (idQ) qLedger = `(${qNoPc} or ${idQ})`;
            } else if (idQ) {
              const m = String(idQ).match(/^\$id\s+in\s+\(([^)]+)\)\s*$/);
              if (m?.[1]) {
                qLedger = `${qNoPc} and $id not in (${m[1]})`;
              } else {
                qLedger = '$id = -1';
              }
            }
          } catch (eLed) {
            console.warn('[jbis 627] pc ledger links fetch failed', eLed);
            alert('PC台帳番号の検索でエラーが発生しました（しばらくして再試行してください）');
      return;
    }
        }

        let finalQ = qLedger;
        if (pcRaw) {
          try {
            const pcIdQ = await build627PcNameIdQuery(pcRaw);
            finalQ = merge627QueryAndPcNameIds(qLedger, pcIdQ);
          } catch (ePc) {
            console.warn('[jbis 627] PC名検索の取得に失敗', ePc);
            alert('PC名検索でエラーが発生しました（しばらくして再試行してください）');
            return;
          }
        }

        // PC複数紐付きチェック (間違い探し)
        if (chkMultiPc.checked) {
          try {
            const multiQ = await build627IdsHavingMultiplePcsQuery();
            // multiQ は "$id in (...)" もしくは "$id = -1"
            finalQ = finalQ ? `(${finalQ}) and (${multiQ})` : multiQ;
          } catch (eMulti) {
            console.warn('[jbis 627] multi-PC fetch failed', eMulti);
            alert('PC複数紐付き検索でエラーが発生しました（しばらくして再試行してください）');
            return;
          }
        }

        // WindowsID 重複チェック (入力ミス検出)
        // 抽出後の見やすさのため logon_name 順に並べ替えて navigate する
        let sortAfter = false;
        if (chkDupLogon.checked) {
          try {
            const dupQ = await build627IdsHavingDuplicateLogonQuery();
            finalQ = finalQ ? `(${finalQ}) and (${dupQ})` : dupQ;
            sortAfter = true;
          } catch (eDup) {
            console.warn('[jbis 627] duplicate logon fetch failed', eDup);
            alert('WindowsID重複検索でエラーが発生しました（しばらくして再試行してください）');
            return;
          }
        }

        if (sortAfter && finalQ && !/order\s+by/i.test(finalQ)) {
          finalQ = `${finalQ} order by ${FC627_LOGON} asc, $id asc`;
        }

        navigate627ListWithQuery(finalQ);
      } finally {
        btnSearch.disabled = false;
        btnSearch.textContent = '検索';
      }
    });

    btnClear.addEventListener('click', () => {
      inpDept.value = '';
      inpGroup.value = '';
      inpUser.value = '';
      inpPcName.value = '';
      inpEmp.value = '';
      inpAcc.value = '';
      selType.value = '';
      selPc.value = '';
      chkMultiPc.checked = false;
      chkDupLogon.checked = false;
      navigate627ListWithQuery('');
    });

    wrap.appendChild(hint);
    wrap.appendChild(fields);
    wrap.appendChild(actions);
    if (!attach627ListSearchPanel(wrap)) {
      wrap.classList.add('jbis-627-list-search--body-fallback');
      document.body.appendChild(wrap);
      console.warn(
        '[jbis 627] 一覧検索を画面下に固定表示しました（ヘッダ用 DOM が見つからないため）。kintone 管理画面でアプリのヘッダースペースを利用できると埋め込み表示になります。'
      );
    }
  };

  /** Ocean UI 描画後に検索欄を再試行する */
  const schedule627ListSearchBar = () => {
    [0, 300, 1000].forEach((ms) => {
      setTimeout(() => {
        try {
          if (!document.getElementById(SEARCH627_WRAP_ID)) render627ListSearchBar();
        } catch (e) {
          console.warn('[jbis 627] list search schedule', e);
        }
      }, ms);
    });
  };

  /** 一覧画面のビュー切替・フィルタ周りの見た目を整理（標準UIの class に依存） */
  const ensure627IndexFilterPolish = () => {
    if (document.getElementById('jbis-627-index-filter-polish')) return;
    const st = document.createElement('style');
    st.id = 'jbis-627-index-filter-polish';
    st.textContent = `/* JBIS: アカウント管理台帳(627) 一覧・フィルタまわり */
.gaia-argoui-app-toolbar {
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 8px 4px 10px;
  box-sizing: border-box;
}
.gaia-argoui-app-toolbar .goog-flat-menu-button {
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  background: #fff;
  min-height: 20px;
  padding: 1px 6px;
  font-size: 11px;
}
.gaia-argoui-app-toolbar .goog-flat-menu-button:hover {
  background: #f1f5f9;
}
.gaia-argoui-app-toolbar .gaia-argoui-select-label,
.gaia-argoui-app-toolbar .gaia-argoui-select-wrp {
  font-size: 12px;
}
.gaia-argoui-app-filter {
  margin: 6px 0 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
}
.gaia-argoui-app-filter-item,
.gaia-argoui-app-filter-cond-item,
.gaia-argoui-app-filter-name {
  font-size: 11px;
  line-height: 1.4;
}
.ocean-ui-app-index-head {
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 4px 0 10px;
  box-sizing: border-box;
}`;
    document.head.appendChild(st);
  };

  /** カスタムHTMLビュー「アカウント棚卸フィルタ」の絞り込みボタンを日付入力相当の高さにそろえる */
  const ensure627AccountInventoryFilterUi = () => {
    if (document.getElementById('jbis-627-account-inventory-filter-ui')) return;
    const st = document.createElement('style');
    st.id = 'jbis-627-account-inventory-filter-ui';
    st.textContent = `/* JBIS 627: カスタム棚卸フィルタの絞り込みボタン */
.jbis-inventory-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 6px;
}
.jbis-inventory-filter-btn {
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
  height: 20px;
  padding: 0 6px;
  font-size: 9px;
  line-height: 1.1;
  font-weight: 600;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}
.jbis-inventory-filter-btn--primary {
  color: #fff;
  background: #2563eb;
  border: 1px solid #1d4ed8;
}
.jbis-inventory-filter-btn--primary:hover {
  background: #1d4ed8;
}
.jbis-inventory-filter-btn--secondary {
  color: #0f172a;
  background: #fff;
  border: 1px solid #94a3b8;
}
.jbis-inventory-filter-btn--secondary:hover {
  background: #f1f5f9;
}`;
    document.head.appendChild(st);
  };

  const labelForInventoryFilterControl = (el) => {
    if (!el?.tagName) return '';
    const tag = el.tagName.toUpperCase();
    if (tag === 'INPUT') {
      const t = (el.getAttribute('type') ?? '').toLowerCase();
      if (['button', 'submit', 'reset'].includes(t)) {
        return String(el.value ?? '').replace(/\s+/g, ' ').trim();
      }
      return '';
    }
    return String(el.textContent ?? '').replace(/\s+/g, ' ').trim();
  };

  const apply627AccountInventoryFilterButtonClasses = () => {
    const sel = "button, input[type='button'], input[type='submit'], input[type='reset']";
    const root = document.querySelector('.gaia-argoui-app-index-table')
      || document.querySelector('.ocean-ui-app-index-head')
      || document;
    const nodes = root.querySelectorAll(sel);
    let primary = null;
    let secondary = null;
    for (const el of nodes) {
      const lab = labelForInventoryFilterControl(el);
      if (lab === '絞り込み') primary = el;
      else if (lab === '絞り込み解除') secondary = el;
    }
    primary?.classList.add(
      'jbis-inventory-filter-btn', 'jbis-inventory-filter-btn--primary'
    );
    secondary?.classList.add(
      'jbis-inventory-filter-btn', 'jbis-inventory-filter-btn--secondary'
    );
    if (primary && secondary && primary.parentElement === secondary.parentElement) {
      primary.parentElement.classList.add('jbis-inventory-filter-actions');
    }
  };

  const schedule627AccountInventoryFilterUi = () => {
    [0, 300, 1000].forEach((ms) => {
      setTimeout(() => {
        try { apply627AccountInventoryFilterButtonClasses(); }
        catch (e) { console.warn('[jbis 627] inventory filter buttons', e); }
      }, ms);
    });
  };

  // --- PC台帳未紐付けフィルタ ---
  const JBIS627_NO_PC_PANEL_ID = 'jbis-627-no-pc-filter';

  const ensure627NoPcLinkFilterCss = () => {
    if (document.getElementById('jbis-627-no-pc-css')) return;
    const st = document.createElement('style');
    st.id = 'jbis-627-no-pc-css';
    st.textContent = `\
.jbis627-nopc-bar{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:4px 8px;margin:0 0 6px;font-size:11px;}\
.jbis627-nopc-btn{box-sizing:border-box;-webkit-appearance:none;appearance:none;margin:0;cursor:pointer;font-size:11px;font-weight:600;line-height:1.2;white-space:nowrap;border-radius:4px;padding:4px 8px;background:transparent;border:none;color:#2563eb;text-decoration:underline;text-underline-offset:2px;}\
.jbis627-nopc-btn:hover{color:#1d4ed8;background:#eff6ff;}\
.jbis627-nopc-btn[aria-pressed="true"]{color:#fff;background:#0284c7;text-decoration:none;border-radius:4px;}\
.jbis627-nopc-count{font-weight:700;font-size:11px;color:#0f172a;margin-left:auto;}\
.jbis627-nopc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;padding:8px 0;}\
.jbis627NoPcCard{border:1px solid rgba(15,23,42,.10);border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.06);padding:10px 12px;cursor:pointer;transition:transform .1s,box-shadow .1s;border-top:4px solid #2563eb;}\
.jbis627NoPcCard:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(15,23,42,.12);}\
.jbis627NoPcCard__title{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;}\
.jbis627NoPcCard__sub{font-size:11px;color:#475569;}`;
    document.head.appendChild(st);
  };

  const fetchAllNoPcRecords = async () => {
    const app = 627;
    const query = `(${FC627_PC594} = "" or ${FC627_PC594} = "#N/A" or ${FC627_PC594} = "-") order by $id desc`;
    const fields = ['$id', 'logon_name', 'windows_name', 'user_name', 'PC_name', FC627_ACCOUNT_TYPE, 'dept_name', 'group_name', FC627_PC594];
    const all = [];
    let offset = 0;
    for (;;) {
      const q = `${query} limit 500 offset ${offset}`;
      const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', { app, query: q, fields });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
      offset += 500;
    }
    return all.filter((r) => {
      const v = String(r[FC627_PC594]?.value ?? '').trim();
      return !v || v === '#N/A' || v === '-' || !/^\d+$/.test(v);
    });
  };

  const renderNoPcCards = (records, container) => {
    container.innerHTML = '';
    if (!records.length) {
      container.innerHTML = '<div style="padding:12px;color:#64748b;font-size:12px;">該当するレコードがありません。</div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'jbis627-nopc-cards';
    for (const r of records) {
      const id = r.$id?.value ?? '';
      const logon = r.logon_name?.value ?? '';
      const win = r.windows_name?.value ?? '';
      const user = r.user_name?.value ?? '';
      const pc = r.PC_name?.value ?? '';
      const type = r[FC627_ACCOUNT_TYPE]?.value ?? '';
      const dept = r.dept_name?.value ?? '';
      const group = r.group_name?.value ?? '';
      const card = document.createElement('div');
      card.className = 'jbis627NoPcCard';
      card.addEventListener('click', () => { location.href = `/k/627/show#record=${id}`; });
      card.innerHTML =
        `<div class="jbis627NoPcCard__title">${safeText(user || logon || '(未設定)')} (${safeText(type)})</div>` +
        `<div class="jbis627NoPcCard__sub">${safeText(group)}${dept ? ` [${safeText(dept)}]` : ''} | ${safeText(logon)} | ${safeText(win || '-')} | ${safeText(pc || '-')}</div>`;
      grid.appendChild(card);
    }
    container.appendChild(grid);
  };

  const install627NoPcLinkFilter = () => {
    ensure627NoPcLinkFilterCss();
    if (document.getElementById(JBIS627_NO_PC_PANEL_ID)) return;
    const header = kintone.app.getHeaderMenuSpaceElement();
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = JBIS627_NO_PC_PANEL_ID;
    bar.className = 'jbis627-nopc-bar';
    bar.innerHTML =
      '<button type="button" id="jbis627-toggle-nopc" class="jbis627-nopc-btn" aria-pressed="false">PC台帳未紐付</button>' +
      '<span id="jbis627-nopc-count" class="jbis627-nopc-count"></span>';
    header.appendChild(bar);

    let resultsContainer = document.getElementById('jbis627-nopc-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'jbis627-nopc-results';
      resultsContainer.style.display = 'none';
      if (header.parentNode) {
        header.parentNode.insertBefore(resultsContainer, header.nextSibling);
      }
    }
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = '';

    const TABLE_SELS = [
      '.gaia-argoui-app-index-table', '.ocean-ui-grid',
      '.recordlist-gaia', '.contents-recordlist-gaia',
      '.gaia-argoui-app-index-pager',
    ];
    const showTable = () => {
      TABLE_SELS.forEach((s) => {
        document.querySelectorAll(s).forEach((el) => el.style.removeProperty('display'));
      });
      resultsContainer.style.display = 'none';
    };
    const hideTable = () => {
      TABLE_SELS.forEach((s) => {
        document.querySelectorAll(s).forEach((el) => el.style.setProperty('display', 'none', 'important'));
      });
      resultsContainer.style.display = '';
    };

    const btn = document.getElementById('jbis627-toggle-nopc');
    const countEl = document.getElementById('jbis627-nopc-count');
    let active = false;

    btn.addEventListener('click', async () => {
      active = !active;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (!active) {
        showTable();
        countEl.textContent = '';
        return;
      }
      countEl.textContent = '検索中...';
      try {
        const recs = await fetchAllNoPcRecords();
        countEl.textContent = `${recs.length}件`;
        hideTable();
        renderNoPcCards(recs, resultsContainer);
      } catch (e) {
        console.warn('[jbis 627] no-pc fetch', e);
        countEl.textContent = 'エラー';
      }
    });
  };

  // ===== 🪪 WindowsID重複ダッシュボード =====
  // 設計趣旨:「同じ logon_name で 2 件以上登録されているグループ」を一覧化し、
  //   どれを残すべきかを横並びで比較して即修正できる別画面（CUSTOMビュー）を提供する。
  //   "ローカルアカウント"・空 は対象外（多重登録が正常な運用のため）。
  const DUP_DASHBOARD_VIEW_ID_627 = 13459662;
  const DUP_LOGON_LOCAL_PLACEHOLDER = 'ローカルアカウント';
  const dupNorm = (s) => {
    const v = String(s ?? '');
    try { return v.normalize('NFKC').trim(); } catch { return v.trim(); }
  };
  const dupIsLocal = (s) => dupNorm(s) === DUP_LOGON_LOCAL_PLACEHOLDER;
  const dupEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const dupLink627 = (id) => `${location.origin}/k/627/show#record=${encodeURIComponent(id)}`;

  const dupFetchAll627 = async () => {
    const url = kintone.api.url('/k/v1/records', true);
    const all = [];
    for (let off = 0; off < 50000; off += 500) {
      const res = await kintone.api(url, 'GET', {
        app: 627,
        query: `$id > 0 order by ${FC627_LOGON} asc, $id asc limit 500 offset ${off}`,
        fields: ['$id', FC627_LOGON, 'user_name', 'dept_name', 'group_name',
          'employment_status', FC627_ACCOUNT_TYPE, 'mail',
          FC627_PC594, FC627_PC_SUBTABLE, '作成日時', '更新日時'],
      });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
    }
    return all;
  };

  /** 627 に保持されている旧台帳 $id は 674 の $id と一致しないため、594 REST は行わずラベルのみ付与 */
  const dupFetchPcMap = async (pcIds) => {
    const map = new Map();
    for (const raw of pcIds || []) {
      const id = String(raw || '').trim();
      if (!id) continue;
      map.set(id, { name: `旧台帳参照番号:${id}（674でPCを検索）`, type: '' });
    }
    return map;
  };

  // CSVダウンロード（kintone環境向けの堅牢実装）
  // 1) msSaveOrOpenBlob（IE/旧Edge）優先、2) Blob + a[download]、3) フォールバックで data: URL を新規タブ
  const downloadCsvSafe627 = (filename, csvText) => {
    const text = (csvText && csvText.startsWith('\ufeff')) ? csvText : ('\ufeff' + (csvText || ''));
    let blob;
    try {
      blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    } catch (e) {
      console.warn('[CSV] Blob() failed, fallback to data URL', e);
      const w = window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(text), '_blank');
      if (!w) alert('CSV出力でポップアップがブロックされました。ブラウザ設定をご確認ください。');
      return;
    }
    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
    const URLObj = window.URL || window.webkitURL;
    const url = URLObj.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    try {
      a.click();
    } catch (e) {
      console.warn('[CSV] a.click() failed, fallback to window.open', e);
      const w = window.open(url, '_blank');
      if (!w) alert('CSV出力でポップアップがブロックされました。ブラウザ設定をご確認ください。');
    }
    setTimeout(() => {
      try { a.remove(); } catch (_) { /* noop */ }
      try { URLObj.revokeObjectURL(url); } catch (_) { /* noop */ }
    }, 1500);
  };

  const renderDup627Dashboard = async () => {
    const root = document.getElementById('jbis627-duplicate-dashboard');
    if (!root) return;
    root.style.padding = '0';
    root.innerHTML = `
      <div style="padding:18px 22px 12px;background:linear-gradient(180deg,#0f172a,#7c2d12);color:#fff;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-size:20px;font-weight:800;">🪪 WindowsID重複ダッシュボード</div>
          <div style="font-size:12px;color:#fed7aa;">同じ WindowsID(logon_name) で 2 件以上登録されているアカウントをグループ表示</div>
        </div>
        <div style="margin-top:6px;font-size:11px;color:#fcd34d;">
          <b>対象</b>: 同一 logon_name が 2 件以上のグループ／
          <b>除外</b>: 「ローカルアカウント」と空欄（複数登録が正常な運用のため）／
          <b>使い方</b>: 各グループ内で「正しいレコード」を1件残し、誤登録を修正・削除してください。
        </div>
      </div>
      <div id="dup627-summary" style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 22px;background:#fef2f2;border-bottom:1px solid #fecaca;font-size:13px;">読込中…</div>
      <div style="padding:10px 22px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fff;border-bottom:1px solid #e2e8f0;">
        <input id="dup627-q" type="search" placeholder="WindowsID で絞り込み" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;min-width:220px;">
        <select id="dup627-q-type" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;">
          <option value="">アカウント種別: すべて</option>
        </select>
        <label style="font-size:12px;color:#475569;display:inline-flex;align-items:center;gap:4px;">
          <input type="checkbox" id="dup627-only-active" checked> 退職者のみのグループは非表示
        </label>
        <button id="dup627-reset" type="button" style="margin-left:auto;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:700;">条件をクリア</button>
        <button id="dup627-csv" type="button" style="background:#7c2d12;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700;">📥 CSVダウンロード</button>
      </div>
      <div id="dup627-body" style="padding:0 22px 24px;background:#fff;">
        <div style="padding:24px;color:#475569;">読込中… (627全件を取得し、WindowsID をグループ化しています)</div>
      </div>
    `;

    let recs627;
    try {
      recs627 = await dupFetchAll627();
    } catch (e) {
      const body = document.getElementById('dup627-body');
      if (body) body.innerHTML = `<div style="color:#b91c1c;padding:16px;">取得失敗: ${dupEsc(e?.message || e)}</div>`;
      return;
    }

    // logon_name でグルーピング (NFKC + trim、"ローカルアカウント"/空 は除外)
    const groups = new Map(); // normLogon -> { display, records: [] }
    for (const r of recs627) {
      const raw = r[FC627_LOGON]?.value ?? '';
      const norm = dupNorm(raw);
      if (!norm || dupIsLocal(raw)) continue;
      if (!groups.has(norm)) groups.set(norm, { display: norm, records: [] });
      groups.get(norm).records.push(r);
    }
    // 2件以上のものだけ
    const dupGroups = [];
    for (const [, g] of groups) {
      if (g.records.length >= 2) dupGroups.push(g);
    }
    // 件数の多い順 → 同件数なら logon_name 昇順
    dupGroups.sort((a, b) => (b.records.length - a.records.length) || a.display.localeCompare(b.display));

    // PC情報を一括取得
    const pcIds = new Set();
    for (const g of dupGroups) {
      for (const r of g.records) {
        const single = String(r[FC627_PC594]?.value || '').trim();
        if (single) pcIds.add(single);
        for (const sr of (r[FC627_PC_SUBTABLE]?.value || [])) {
          const v = String(sr?.value?.[FC627_PC_SUB_594]?.value || '').trim();
          if (v) pcIds.add(v);
        }
      }
    }
    const pcMap = await dupFetchPcMap([...pcIds]);

    // 種別ドロップダウン充填
    const typeSet = new Set();
    for (const g of dupGroups) {
      for (const r of g.records) {
        const t = String(r[FC627_ACCOUNT_TYPE]?.value || '').trim();
        if (t) typeSet.add(t);
      }
    }
    const typeSel = document.getElementById('dup627-q-type');
    if (typeSel) {
      [...typeSet].sort().forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = `アカウント種別: ${t}`;
        typeSel.appendChild(opt);
      });
    }

    const totalGroups = dupGroups.length;
    const totalRecords = dupGroups.reduce((s, g) => s + g.records.length, 0);

    const summary = document.getElementById('dup627-summary');
    if (summary) {
      summary.innerHTML = `
        <span style="background:#fff;border:1px solid #fecaca;border-radius:6px;padding:6px 12px;color:#7f1d1d;">重複グループ <b>${totalGroups}</b> 種類</span>
        <span style="background:#fff;border:1px solid #fecaca;border-radius:6px;padding:6px 12px;color:#7f1d1d;">合計 <b>${totalRecords}</b> 件のレコードが重複候補</span>
        <span style="background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:6px 12px;color:#475569;">アカウント台帳全体: ${recs627.length} 件</span>
      `;
    }

    const recPcLabels = (rec) => {
      const ids = new Set();
      const single = String(rec[FC627_PC594]?.value || '').trim();
      if (single) ids.add(single);
      for (const sr of (rec[FC627_PC_SUBTABLE]?.value || [])) {
        const v = String(sr?.value?.[FC627_PC_SUB_594]?.value || '').trim();
        if (v) ids.add(v);
      }
      if (ids.size === 0) return '<span style="color:#9ca3af;">— 未紐付け —</span>';
      return [...ids].map((id) => {
        const pc = pcMap.get(id);
        const lbl = pc
          ? `${dupEsc(pc.name)}${pc.type ? ` <span style="color:#64748b;">[${dupEsc(pc.type)}]</span>` : ''}`
          : dupEsc(id);
        return `<span style="color:#334155;font-weight:600;">${lbl}</span>`;
      }).join('<br>');
    };

    const stIcon = (st) => st === '退職' ? '🪦 退職' : (st === '休職' ? '⏸ 休職' : (st || ''));
    const stColor = (st) => st === '退職' ? '#9a3412' : (st === '休職' ? '#a16207' : '#166534');

    const renderBody = () => {
      const body = document.getElementById('dup627-body');
      if (!body) return;
      const q = (document.getElementById('dup627-q')?.value || '').trim().toLowerCase();
      const fType = document.getElementById('dup627-q-type')?.value || '';
      const onlyActive = !!document.getElementById('dup627-only-active')?.checked;

      const filtered = dupGroups.filter((g) => {
        if (q && !g.display.toLowerCase().includes(q)) return false;
        if (fType) {
          const hasType = g.records.some((r) => String(r[FC627_ACCOUNT_TYPE]?.value || '').trim() === fType);
          if (!hasType) return false;
        }
        if (onlyActive) {
          const allRetired = g.records.every((r) => String(r.employment_status?.value || '').trim() === '退職');
          if (allRetired) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        body.innerHTML = `<div style="padding:24px;color:#16a34a;text-align:center;font-weight:700;background:#f0fdf4;border:2px solid #86efac;border-radius:8px;margin-top:14px;">🎉 該当する重複グループはありません${(q || fType || onlyActive) ? '（条件を変えると表示されることがあります）' : ''}</div>`;
        return;
      }

      const groupsHtml = filtered.map((g) => {
        const sorted = [...g.records].sort((a, b) => Number(a.$id?.value || 0) - Number(b.$id?.value || 0));
        const rowsHtml = sorted.map((r, i) => {
          const id = String(r.$id?.value || '');
          const user = String(r.user_name?.value || '').trim();
          const dept = String(r.dept_name?.value || '').trim();
          const grp = String(r.group_name?.value || '').trim();
          const status = String(r.employment_status?.value || '').trim();
          const accType = String(r[FC627_ACCOUNT_TYPE]?.value || '').trim();
          const mail = String(r.mail?.value || '').trim();
          const created = String(r.作成日時?.value || '').slice(0, 10);
          const updated = String(r.更新日時?.value || '').slice(0, 10);
          const bg = i === 0 ? '#fff7ed' : (i % 2 === 0 ? '#ffffff' : '#fefce8');
          const oldestBadge = i === 0 ? '<span style="background:#0ea5e9;color:#fff;font-size:10px;padding:1px 6px;border-radius:8px;margin-left:4px;">最古</span>' : '';
          return `<tr style="background:${bg};">
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-weight:700;white-space:nowrap;">
              <a href="${dupLink627(id)}" target="_blank" rel="noopener" style="color:#0f172a;text-decoration:none;">#${dupEsc(id)}</a>
              ${oldestBadge}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:13px;">
              ${dupEsc(user) || '<span style="color:#9ca3af;">—</span>'}
              ${mail ? `<div style="font-size:11px;color:#64748b;">${dupEsc(mail)}</div>` : ''}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:12px;">
              ${dupEsc(dept) || '<span style="color:#9ca3af;">—</span>'}
              ${grp ? `<div style="color:#64748b;">${dupEsc(grp)}</div>` : ''}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:12px;color:${stColor(status)};font-weight:700;white-space:nowrap;">
              ${dupEsc(stIcon(status)) || '<span style="color:#9ca3af;">—</span>'}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:12px;color:#475569;white-space:nowrap;">
              ${dupEsc(accType) || '<span style="color:#9ca3af;">—</span>'}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:12px;">${recPcLabels(r)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:11px;color:#64748b;white-space:nowrap;">
              作成: ${dupEsc(created)}<br>更新: ${dupEsc(updated)}
            </td>
          </tr>`;
        }).join('');
        return `
          <div style="margin:14px 0 0;border:2px solid #fdba74;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.05);">
            <div style="padding:10px 14px;background:#7c2d12;color:#fff;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:14px;">🪪</span>
              <span style="font-size:15px;font-weight:800;letter-spacing:.02em;">${dupEsc(g.display)}</span>
              <span style="background:#fff;color:#7c2d12;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${g.records.length} 件登録</span>
              <a href="${location.origin}/k/627/?view=&q=${encodeURIComponent(`${FC627_LOGON} = "${g.display.replace(/"/g, '\\"')}" order by $id asc`)}" target="_blank" rel="noopener"
                style="margin-left:auto;background:#fff;color:#7c2d12;text-decoration:none;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;">この WindowsID で台帳検索 ↗</a>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#fed7aa;color:#7c2d12;font-size:11px;">
                <th style="padding:6px 8px;text-align:left;">レコード</th>
                <th style="padding:6px 8px;text-align:left;">利用者 / メール</th>
                <th style="padding:6px 8px;text-align:left;">部署 / グループ</th>
                <th style="padding:6px 8px;text-align:left;">在籍</th>
                <th style="padding:6px 8px;text-align:left;">アカウント種別</th>
                <th style="padding:6px 8px;text-align:left;">紐付くPC</th>
                <th style="padding:6px 8px;text-align:left;">作成 / 更新</th>
              </tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div style="margin:10px 0 6px;color:#475569;font-size:12px;">
          表示中: <b>${filtered.length}</b> / ${totalGroups} グループ
          （合計 ${filtered.reduce((s, g) => s + g.records.length, 0)} 件）
        </div>
        ${groupsHtml}
      `;
    };

    document.getElementById('dup627-q')?.addEventListener('input', renderBody);
    document.getElementById('dup627-q-type')?.addEventListener('change', renderBody);
    document.getElementById('dup627-only-active')?.addEventListener('change', renderBody);
    document.getElementById('dup627-reset')?.addEventListener('click', () => {
      const q = document.getElementById('dup627-q'); if (q) q.value = '';
      const ts = document.getElementById('dup627-q-type'); if (ts) ts.value = '';
      const oa = document.getElementById('dup627-only-active'); if (oa) oa.checked = true;
      renderBody();
    });
    document.getElementById('dup627-csv')?.addEventListener('click', () => {
      const btn = document.getElementById('dup627-csv');
      const origLabel = btn?.textContent;
      try {
        if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }
        const header = ['WindowsID', 'グループ件数', '627レコード番号', '利用者', 'メール',
          '部署', 'グループ', '在籍ステータス', 'アカウント種別', '紐付くPC', '作成日時', '更新日時'];
        const lines = [header.join(',')];
        const csvEsc = (s) => {
          const v = String(s ?? '');
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        };
        for (const g of dupGroups) {
          for (const r of g.records) {
            const ids = new Set();
            const single = String(r[FC627_PC594]?.value || '').trim();
            if (single) ids.add(single);
            for (const sr of (r[FC627_PC_SUBTABLE]?.value || [])) {
              const v = String(sr?.value?.[FC627_PC_SUB_594]?.value || '').trim();
              if (v) ids.add(v);
            }
            const pcLabels = [...ids].map((id) => {
              const pc = pcMap.get(id);
              return pc ? `${pc.name}${pc.type ? `[${pc.type}]` : ''}` : `旧台帳#${id}`;
            }).join(' / ');
            lines.push([
              g.display, g.records.length,
              String(r.$id?.value || ''),
              String(r.user_name?.value || ''),
              String(r.mail?.value || ''),
              String(r.dept_name?.value || ''),
              String(r.group_name?.value || ''),
              String(r.employment_status?.value || ''),
              String(r[FC627_ACCOUNT_TYPE]?.value || ''),
              pcLabels,
              String(r.作成日時?.value || ''),
              String(r.更新日時?.value || ''),
            ].map(csvEsc).join(','));
          }
        }
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const filename = `windowsid-duplicate-${stamp}.csv`;
        const csvText = '\ufeff' + lines.join('\r\n');
        downloadCsvSafe627(filename, csvText);
      } catch (e) {
        console.error('[JBIS-627] CSV download failed', e);
        alert(`CSVダウンロードに失敗しました。\n${e?.message || e}\nコンソール(F12) もご確認ください。`);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origLabel || '📥 CSVダウンロード'; }
      }
    });

    renderBody();
  };

  // 通常一覧ビューのトップに「重複候補が X 件あります」のバナーを常時表示する。
  // チェックボックスを開かなくても、件数とダッシュボード導線が一目で分かるように。
  const ensure627DupBannerOnList = async () => {
    if (document.getElementById('jbis627-dup-banner')) return;
    const headerMenu = kintone.app.getHeaderMenuSpaceElement();
    if (!headerMenu) return;
    const banner = document.createElement('div');
    banner.id = 'jbis627-dup-banner';
    banner.style.cssText = 'margin:6px 0;padding:10px 14px;border-radius:10px;border:2px solid #fdba74;background:#fff7ed;color:#7c2d12;font-size:12px;font-weight:700;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
    banner.innerHTML = `
      <span style="font-size:16px;">🪪</span>
      <span id="jbis627-dup-banner-text">WindowsID重複の集計中…</span>
      <a id="jbis627-dup-banner-link" href="${location.origin}/k/627/?view=${DUP_DASHBOARD_VIEW_ID_627}" target="_blank" rel="noopener"
        style="margin-left:auto;background:#7c2d12;color:#fff;text-decoration:none;padding:6px 12px;border-radius:6px;font-size:12px;">
        🪪 重複ダッシュボードを開く ↗
      </a>
    `;
    headerMenu.parentNode?.insertBefore(banner, headerMenu.nextSibling);
    try {
      const recs = await dupFetchAll627();
      const counter = new Map();
      for (const r of recs) {
        const norm = dupNorm(r[FC627_LOGON]?.value);
        if (!norm || dupIsLocal(r[FC627_LOGON]?.value)) continue;
        counter.set(norm, (counter.get(norm) || 0) + 1);
      }
      let groups = 0; let records = 0;
      counter.forEach((c) => { if (c >= 2) { groups += 1; records += c; } });
      const txt = document.getElementById('jbis627-dup-banner-text');
      if (txt) {
        if (groups === 0) {
          txt.textContent = '✅ WindowsID(logon_name) の重複登録は現在ありません。';
          banner.style.background = '#f0fdf4';
          banner.style.borderColor = '#86efac';
          banner.style.color = '#166534';
        } else {
          txt.innerHTML = `<span style="font-size:14px;">⚠ WindowsID重複候補: <b>${groups}</b> グループ / <b>${records}</b> 件のレコードがあります</span>
            <span style="font-weight:400;color:#9a3412;font-size:11px;margin-left:6px;">（"ローカルアカウント"・空欄は除外済）</span>`;
        }
      }
    } catch (e) {
      console.warn('[jbis 627] dup banner aggregate failed', e);
      const txt = document.getElementById('jbis627-dup-banner-text');
      if (txt) txt.textContent = '（重複集計に失敗しました）';
    }
  };

  const onIndexShowPolish = (event) => {
    try {
      // 🪪 WindowsID重複ダッシュボードのCUSTOMビュー時は専用描画して終わり
      if (Number(event.viewId) === DUP_DASHBOARD_VIEW_ID_627) {
        renderDup627Dashboard().catch((err) => {
          console.error('[jbis 627] dup dashboard render failed', err);
          const root = document.getElementById('jbis627-duplicate-dashboard');
          if (root) root.innerHTML = `<div style="color:#b91c1c;padding:16px;">ダッシュボードの読込に失敗しました: ${dupEsc(err?.message || err)}</div>`;
        });
        return event;
      }
      ensure627ToolbarMenuAboveCustomSearch();
      schedule627ListSearchBar();
      ensure627IndexFilterPolish();
      ensure627AccountInventoryFilterUi();
      schedule627AccountInventoryFilterUi();
      install627NoPcLinkFilter();
      // 通常リスト系ビューに「重複候補X件」バナーを設置
      ensure627DupBannerOnList().catch((e) => console.warn('[jbis 627] dup banner mount', e));
    } catch (e) {
      console.warn('[jbis 627] index filter polish', e);
    }
    return event;
  };

  kintone.events.on('app.record.index.show', onIndexShowPolish);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.index.show', onIndexShowPolish);
  }

  // ─────────────────────────────────────────────────────────────────
  // 関連アプリへの横並び小ナビ（一覧／詳細／作成／編集 すべての画面に常駐）
  // 文字リンクのみ・控えめサイズ。クリックで新規タブで該当アプリを開く。
  // ─────────────────────────────────────────────────────────────────
  const JBIS_RELATED_APPS = [
    { id: '668', label: '利用ガイド' },
    { id: '595', label: '社員情報マスタ' },
    { id: '674', label: '新・PC台帳' },
    { id: '627', label: 'アカウント管理台帳' },
  ];
  const JBIS_RELATED_NAV_ID = 'jbis-related-apps-nav';
  const JBIS_RELATED_CURRENT_APP_ID = '627';

  const buildRelatedAppsNav = () => {
    const nav = document.createElement('div');
    nav.id = JBIS_RELATED_NAV_ID;
    nav.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 6px;'
      + 'font-size:11px;color:#64748b;line-height:1.6;'
      + 'font-family:"Hiragino Sans","Meiryo",sans-serif;';

    const prefix = document.createElement('span');
    prefix.textContent = '🔗 関連:';
    prefix.style.cssText = 'font-weight:600;color:#475569;';
    nav.appendChild(prefix);

    JBIS_RELATED_APPS.forEach((app, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = '|';
        sep.style.cssText = 'color:#cbd5e1;';
        nav.appendChild(sep);
      }
      if (app.id === JBIS_RELATED_CURRENT_APP_ID) {
        const cur = document.createElement('span');
        cur.textContent = `${app.label}（このアプリ）`;
        cur.style.cssText = 'color:#94a3b8;font-weight:600;';
        nav.appendChild(cur);
      } else {
        const a = document.createElement('a');
        a.href = `/k/${app.id}/`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = app.label;
        a.style.cssText = 'color:#0d9488;text-decoration:none;font-weight:600;';
        a.addEventListener('mouseenter', () => { a.style.textDecoration = 'underline'; });
        a.addEventListener('mouseleave', () => { a.style.textDecoration = 'none'; });
        nav.appendChild(a);
      }
    });
    return nav;
  };

  const mountRelatedAppsNav = () => {
    if (document.getElementById(JBIS_RELATED_NAV_ID)) return true;
    let slot = null;
    try { slot = kintone.app?.record?.getHeaderMenuSpaceElement?.() ?? null; }
    catch { /* noop */ }
    if (!slot) {
      try { slot = kintone.app?.getHeaderMenuSpaceElement?.() ?? null; }
      catch { /* noop */ }
    }
    if (!slot) return false;
    slot.appendChild(buildRelatedAppsNav());
    return true;
  };

  const scheduleRelatedAppsNav = () => {
    [0, 400, 1000].forEach((ms) => {
      setTimeout(() => {
        try { mountRelatedAppsNav(); }
        catch (e) { console.warn('[jbis related-apps-nav]', e); }
      }, ms);
    });
  };

  ['app.record.index.show', 'app.record.detail.show',
    'app.record.create.show', 'app.record.edit.show'].forEach((evt) => {
    kintone.events.on(evt, (event) => {
      scheduleRelatedAppsNav();
      return event;
    });
  });
})();
