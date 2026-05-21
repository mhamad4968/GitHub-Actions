  const APP_DASH = 688;
  const SHOW_EVENTS = ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'];

  function dashUrl(recordId) {
    const base = '/k/' + APP_DASH + '/';
    if (recordId) return base + '?workdays_record=' + encodeURIComponent(String(recordId));
    return base;
  }

  function ensureDashLink(event) {
    if (document.getElementById('workdays687-dash-link')) return;
    const header = kintone.app.record.getHeaderMenuSpaceElement();
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'workdays687-dash-link';
    bar.style.cssText =
      'margin:8px 0;padding:12px 16px;background:#e8f4fc;border:1px solid #3498db;border-radius:6px;font-size:14px;';

    const rid =
      event.record && event.record.$id && event.record.$id.value != null
        ? String(event.record.$id.value)
        : null;

    bar.innerHTML =
      '<strong>日常の入力・算出はダッシュボード（アプリ ' +
      APP_DASH +
      '）から行ってください。</strong><br>' +
      '<a href="' +
      dashUrl(rid) +
      '" style="font-weight:bold">→ 工事稼働日数ダッシュを開く</a>' +
      ' <span style="font-size:11px;color:#666">BUILD=' +
      BUILD +
      '</span>';

    header.appendChild(bar);
  }

  kintone.events.on(SHOW_EVENTS, function (event) {
    ensureDashLink(event);
    return event;
  });
