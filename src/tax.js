(function () {
  // 金額（税抜）から消費税額を求め、数値フィールド tax に書き込む画面カスタマイズ用スニペットです。
  'use strict';

  // 税抜金額のフィールドコード（出張精算アプリでは kintone-apps.md どおり kingaku）。
  const FIELD_AMOUNT = 'kingaku';
  // 消費税額を格納する数値フィールドのフィールドコード（フォームに同名フィールドを用意すること）。
  const FIELD_TAX = 'tax';
  // 標準税率 10%（軽減税率 8% にしたいときは 0.08 に変更）。
  const TAX_RATE = 0.1;

  /**
   * レcord から税抜金額を数値化して取り出します。
   * @param {import('kintone').Types.Record} record kintone のレコード
   * @returns {number|null} 有効な数値ならその値、空・不正なら null
   */
  function parseAmountYen(record) {
    // 金額フィールド自体が無い画面では null です。
    if (!record[FIELD_AMOUNT]) return null;
    // kintone の数値は文字列で渡ることがあります。
    const raw = record[FIELD_AMOUNT].value;
    // 空は未入力扱いです。
    if (raw === '' || raw === undefined || raw === null) return null;
    const n = Number(raw);
    // NaN は計算しないようにします。
    if (!Number.isFinite(n)) return null;
    return n;
  }

  /**
   * 税抜金額から消費税額（円）を計算します。端数は切り捨てます。
   * @param {number|null} amountYen 税抜金額
   * @returns {string} フィールドに入れる文字列（空文字 or 整数の文字列）
   */
  function taxYenStringFromAmount(amountYen) {
    // 未入力のときは税額も空にそろえます。
    if (amountYen === null) return '';
    // 負の金額は想定外なので 0 未満は 0 扱いにします。
    const base = amountYen < 0 ? 0 : amountYen;
    // 税額 = 税抜 × 税率を切り捨て。
    return String(Math.floor(base * TAX_RATE));
  }

  /**
   * event.record の tax フィールドに計算結果を書き込みます。
   * @param {import('kintone').Types.Event} event kintone イベント
   * @returns {import('kintone').Types.Event} 必ず event を返す
   */
  function recalcTaxOnRecord(event) {
    // tax フィールドがフォームに無いとここで失敗するため、アプリに追加してから読み込みます。
    if (!event.record[FIELD_TAX]) return event;
    // 税抜を読みます。
    const yen = parseAmountYen(event.record);
    // 税額文字列をセットします。
    event.record[FIELD_TAX].value = taxYenStringFromAmount(yen);
    // kintone の約束どおり event を返します。
    return event;
  }

  // 新規作成画面表示時に一度計算します。
  kintone.events.on('app.record.create.show', (event) => recalcTaxOnRecord(event));
  // 編集画面表示時も既存 kingaku から税額を再計算します。
  kintone.events.on('app.record.edit.show', (event) => recalcTaxOnRecord(event));
  // 新規で金額変更のたびに税額を更新します（フィールドコードが kingaku のとき）。
  kintone.events.on(
    'app.record.create.change.' + FIELD_AMOUNT,
    (event) => recalcTaxOnRecord(event),
  );
  // 編集で金額変更のたびに税額を更新します。
  kintone.events.on(
    'app.record.edit.change.' + FIELD_AMOUNT,
    (event) => recalcTaxOnRecord(event),
  );
})();
