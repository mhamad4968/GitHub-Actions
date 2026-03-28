(function () {
  // このファイルは「出張精算アプリ」用の画面カスタマイズです。
  'use strict';

  // 金額フィールドのフィールドコード（アプリの設定と一致させる）
  const FIELD_AMOUNT = 'kingaku';
  // 高額とみなすしきい値（円）。これを超えたら警告を出します。
  const LIMIT_YEN = 50000;
  // 詳細画面に表示するメッセージ用の HTML 要素の ID です。
  const DETAIL_MSG_ID = 'jbis-shucccho-high-amount-banner';

  /**
   * レコードから金額を数値として取り出します。
   * @param {import('kintone').Types.Record} record kintone のレコードオブジェクト
   * @returns {number|null} 数値にできればその値、空なら null
   */
  function parseAmountYen(record) {
    // フィールドが無い場合は null を返します。
    if (!record[FIELD_AMOUNT]) return null;
    // kintone の数値フィールドは文字列で渡ってくることが多いです。
    const raw = record[FIELD_AMOUNT].value;
    // 空文字は「未入力」とみなします。
    if (raw === '' || raw === undefined || raw === null) return null;
    // 文字列を数値に変換します。
    const n = Number(raw);
    // NaN のときは null にそろえます。
    if (!Number.isFinite(n)) return null;
    return n;
  }

  /**
   * 金額がしきい値を超えているかどうかを返します。
   * @param {import('kintone').Types.Record} record レコード
   * @returns {boolean} 超えていれば true
   */
  function isHighAmount(record) {
    // 金額を数値化します。
    const yen = parseAmountYen(record);
    // 未入力のときは高額ではありません。
    if (yen === null) return false;
    // しきい値より大きいときだけ高額です（ちょうど 50000 は含めません）。
    return yen > LIMIT_YEN;
  }

  /**
   * 追加・編集画面で、金額フィールドの近くに警告文を出し分けします。
   * @param {import('kintone').Types.Record} record レコード
   */
  function updateWarningOnForm(record) {
    // 金額欄の DOM 要素を取得します（無ければ何もしません）。
    const fieldEl = kintone.app.record.getFieldElement(FIELD_AMOUNT);
    // フォーム上に金額欄が無い画面では抜けます。
    if (!fieldEl) return;
    // 既存の警告用要素を探します。
    let note = fieldEl.querySelector('.jbis-high-amount-note');
    // 無ければ新しく作って金額欄の末尾に置きます。
    if (!note) {
      // div 要素を作成します。
      note = document.createElement('div');
      // スタイル指定用のクラスを付けます。
      note.className = 'jbis-high-amount-note';
      // 目立つが邪魔になりすぎない見た目にします。
      note.style.marginTop = '8px';
      note.style.padding = '10px 12px';
      note.style.borderRadius = '6px';
      note.style.fontWeight = '600';
      note.style.display = 'none';
      // 金額のグループの中にぶら下げます。
      fieldEl.appendChild(note);
    }
    // 高額なら表示してメッセージを入れます。
    if (isHighAmount(record)) {
      // 警告文の固定文言です。
      note.textContent = '高額申請です';
      // 薄い赤背景で注意喚起します。
      note.style.display = 'block';
      note.style.background = '#fff1f2';
      note.style.color = '#9f1239';
      note.style.border = '1px solid #fda4af';
    } else {
      // 高額でなければ非表示にします。
      note.style.display = 'none';
    }
  }

  /**
   * レコード詳細画面で一覧表示の上あたりにバナーを表示します。
   * @param {import('kintone').Types.Record} record レコード
   */
  function updateWarningOnDetail(record) {
    // 詳細画面ヘッダー直下のスペース要素を取得します（スペースフィールド未設定なら null）。
    const space = kintone.app.record.getSpaceElement('high_amount_space');
    // スペースが無いときはヘッダーに直に差し込みます（運用でスペース追加推奨）。
    const mountParent = space || kintone.app.record.getHeaderMenuSpaceElement();
    // マウント先が無ければ諦めます。
    if (!mountParent) return;
    // 既存バナーを探します。
    let banner = document.getElementById(DETAIL_MSG_ID);
    // 無ければ作ります。
    if (!banner) {
      banner = document.createElement('div');
      banner.id = DETAIL_MSG_ID;
      banner.style.margin = '8px 0 12px';
      banner.style.padding = '12px 14px';
      banner.style.borderRadius = '6px';
      banner.style.fontWeight = '700';
      // 先頭に挿入して上で目立たせます。
      mountParent.prepend(banner);
    }
    // 高額なら表示します。
    if (isHighAmount(record)) {
      banner.textContent = '高額申請です';
      banner.style.display = 'block';
      banner.style.background = '#fff1f2';
      banner.style.color = '#9f1239';
      banner.style.border = '1px solid #fda4af';
    } else {
      // そうでなければ隠します。
      banner.style.display = 'none';
    }
  }

  // 新規作成画面を開いたときのイベントです。
  kintone.events.on('app.record.create.show', (event) => {
    // 警告表示を更新します。
    updateWarningOnForm(event.record);
    // kintone にそのまま返す必要があります。
    return event;
  });

  // 編集画面を開いたときのイベントです。
  kintone.events.on('app.record.edit.show', (event) => {
    // 警告表示を更新します。
    updateWarningOnForm(event.record);
    // そのまま返します。
    return event;
  });

  // 新規作成で金額を変えたときのイベントです。
  kintone.events.on('app.record.create.change.kingaku', (event) => {
    // 入力のたびに警告を出し分けします。
    updateWarningOnForm(event.record);
    return event;
  });

  // 編集で金額を変えたときのイベントです。
  kintone.events.on('app.record.edit.change.kingaku', (event) => {
    // 入力のたびに警告を出し分けします。
    updateWarningOnForm(event.record);
    return event;
  });

  // 詳細画面を開いたときのイベントです。
  kintone.events.on('app.record.detail.show', (event) => {
    // 詳細でも同じ文言を出します。
    updateWarningOnDetail(event.record);
    return event;
  });
})();
