(() => {
  'use strict';

  const ensureGlobalLabelStyle = () => {
    if (document.getElementById('jbis-global-label-style')) return;
    const style = document.createElement('style');
    style.id = 'jbis-global-label-style';
    style.textContent = `
      .control-label-text-gaia,
      .control-label-gaia,
      .subtable-label-gaia,
      .group-label-gaia {
        font-size: 16px !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        letter-spacing: .01em;
      }
    `;
    document.head.appendChild(style);
  };

  kintone.events.on([
    'app.record.index.show',
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
  ], (event) => {
    ensureGlobalLabelStyle();
    return event;
  });
})();

