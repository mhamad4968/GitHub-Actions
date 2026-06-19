/**
 * 工事稼働日数ダッシュ（688）— データ正本アプリ 687 / Excel 準拠
 *   npm run deploy:688
 * 計算コア: scripts/workdays-calc-core.mjs
 */
(function () {
  'use strict';

  const BUILD = '2026-06-19-688-print-rounding-fix';

  const REF5YR = {"location":"大宮地区","windPeriod":"2018〜2025","rainPeriod":"2018〜2025","updated":"2026-06-13","csvSource":"風速.csv, 降雨.csv","wind_ge10_ms":{"label":">=10ms","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":1,"2019":4,"2020":1,"2021":1,"2022":3,"2023":6,"2024":5,"2025":1},"avg":2.75},{"m":2,"byYear":{"2018":1,"2019":2,"2020":2,"2021":1,"2022":4,"2023":2,"2024":4,"2025":3},"avg":2.375},{"m":3,"byYear":{"2018":0,"2019":0,"2020":3,"2021":4,"2022":1,"2023":1,"2024":5,"2025":2},"avg":2},{"m":4,"byYear":{"2018":2,"2019":2,"2020":3,"2021":1,"2022":0,"2023":0,"2024":1,"2025":0},"avg":1.125},{"m":5,"byYear":{"2018":1,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":6,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":1,"2025":0},"avg":0.125},{"m":8,"byYear":{"2018":1,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":9,"byYear":{"2018":1,"2019":1,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25},{"m":10,"byYear":{"2018":2,"2019":0,"2020":1,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.5},{"m":11,"byYear":{"2018":0,"2019":1,"2020":0,"2021":0,"2022":0,"2023":1,"2024":1,"2025":1},"avg":0.5},{"m":12,"byYear":{"2018":3,"2019":1,"2020":1,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.625}]},"wind_ge15_ms":{"label":">=15ms","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":3,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":4,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":5,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":6,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":8,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":9,"byYear":{"2018":1,"2019":1,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25},{"m":10,"byYear":{"2018":1,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0}]},"wind_ge20_ms":{"label":">=20ms","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":3,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":4,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":5,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":6,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":8,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":9,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":10,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0}]},"wind_ge30_ms":{"label":">=30ms","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":3,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":4,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":5,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":6,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":8,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":9,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":10,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0}]},"rain_ge1_mm":{"label":">=1mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":4,"2019":1,"2020":7,"2021":3,"2022":2,"2023":2,"2024":3,"2025":4},"avg":3.25},{"m":2,"byYear":{"2018":3,"2019":4,"2020":4,"2021":2,"2022":6,"2023":4,"2024":9,"2025":1},"avg":4.125},{"m":3,"byYear":{"2018":10,"2019":9,"2020":9,"2021":7,"2022":6,"2023":9,"2024":9,"2025":9},"avg":8.5},{"m":4,"byYear":{"2018":4,"2019":11,"2020":8,"2021":7,"2022":14,"2023":5,"2024":12,"2025":9},"avg":8.75},{"m":5,"byYear":{"2018":9,"2019":4,"2020":10,"2021":13,"2022":12,"2023":11,"2024":13,"2025":13},"avg":10.625},{"m":6,"byYear":{"2018":12,"2019":13,"2020":16,"2021":11,"2022":10,"2023":14,"2024":9,"2025":6},"avg":11.375},{"m":7,"byYear":{"2018":6,"2019":15,"2020":23,"2021":14,"2022":11,"2023":5,"2024":13,"2025":5},"avg":11.5},{"m":8,"byYear":{"2018":9,"2019":10,"2020":5,"2021":10,"2022":7,"2023":13,"2024":10,"2025":10},"avg":9.25},{"m":9,"byYear":{"2018":8,"2019":8,"2020":12,"2021":13,"2022":10,"2023":8,"2024":8,"2025":9},"avg":9.5},{"m":10,"byYear":{"2018":17,"2019":7,"2020":8,"2021":8,"2022":10,"2023":4,"2024":10,"2025":10},"avg":9.25},{"m":11,"byYear":{"2018":5,"2019":3,"2020":5,"2021":5,"2022":5,"2023":3,"2024":6,"2025":2},"avg":4.25},{"m":12,"byYear":{"2018":5,"2019":1,"2020":6,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":1.625}]},"rain_ge10_mm":{"label":">=10mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":1,"2019":1,"2020":2,"2021":2,"2022":1,"2023":0,"2024":1,"2025":1},"avg":1.125},{"m":2,"byYear":{"2018":0,"2019":1,"2020":0,"2021":1,"2022":2,"2023":1,"2024":1,"2025":0},"avg":0.75},{"m":3,"byYear":{"2018":6,"2019":2,"2020":3,"2021":4,"2022":4,"2023":5,"2024":6,"2025":5},"avg":4.375},{"m":4,"byYear":{"2018":2,"2019":2,"2020":4,"2021":3,"2022":7,"2023":2,"2024":2,"2025":3},"avg":3.125},{"m":5,"byYear":{"2018":4,"2019":2,"2020":3,"2021":2,"2022":3,"2023":4,"2024":6,"2025":6},"avg":3.75},{"m":6,"byYear":{"2018":3,"2019":6,"2020":4,"2021":5,"2022":1,"2023":6,"2024":6,"2025":5},"avg":4.5},{"m":7,"byYear":{"2018":4,"2019":6,"2020":7,"2021":9,"2022":3,"2023":0,"2024":4,"2025":1},"avg":4.25},{"m":8,"byYear":{"2018":4,"2019":5,"2020":2,"2021":7,"2022":3,"2023":3,"2024":9,"2025":2},"avg":4.375},{"m":9,"byYear":{"2018":4,"2019":4,"2020":5,"2021":5,"2022":7,"2023":3,"2024":1,"2025":4},"avg":4.125},{"m":10,"byYear":{"2018":5,"2019":4,"2020":4,"2021":4,"2022":2,"2023":2,"2024":4,"2025":2},"avg":3.375},{"m":11,"byYear":{"2018":3,"2019":0,"2020":2,"2021":2,"2022":1,"2023":2,"2024":2,"2025":0},"avg":1.5},{"m":12,"byYear":{"2018":2,"2019":0,"2020":2,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.625}]},"rain_ge30_mm":{"label":">=30mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":1,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":3,"byYear":{"2018":3,"2019":1,"2020":1,"2021":1,"2022":1,"2023":0,"2024":2,"2025":0},"avg":1.125},{"m":4,"byYear":{"2018":1,"2019":0,"2020":2,"2021":0,"2022":1,"2023":0,"2024":1,"2025":1},"avg":0.75},{"m":5,"byYear":{"2018":1,"2019":1,"2020":1,"2021":0,"2022":1,"2023":0,"2024":2,"2025":1},"avg":0.875},{"m":6,"byYear":{"2018":0,"2019":2,"2020":2,"2021":1,"2022":0,"2023":2,"2024":3,"2025":1},"avg":1.375},{"m":7,"byYear":{"2018":1,"2019":1,"2020":2,"2021":4,"2022":1,"2023":0,"2024":2,"2025":1},"avg":1.5},{"m":8,"byYear":{"2018":1,"2019":0,"2020":1,"2021":3,"2022":1,"2023":1,"2024":4,"2025":1},"avg":1.5},{"m":9,"byYear":{"2018":1,"2019":1,"2020":1,"2021":1,"2022":3,"2023":1,"2024":0,"2025":2},"avg":1.25},{"m":10,"byYear":{"2018":3,"2019":2,"2020":1,"2021":1,"2022":1,"2023":1,"2024":0,"2025":0},"avg":1.125},{"m":11,"byYear":{"2018":2,"2019":0,"2020":1,"2021":1,"2022":1,"2023":1,"2024":1,"2025":0},"avg":0.875},{"m":12,"byYear":{"2018":0,"2019":0,"2020":2,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.375}]},"rain_ge50_mm":{"label":">=50mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":3,"byYear":{"2018":1,"2019":0,"2020":0,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25},{"m":4,"byYear":{"2018":0,"2019":0,"2020":2,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25},{"m":5,"byYear":{"2018":0,"2019":1,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":1},"avg":0.25},{"m":6,"byYear":{"2018":0,"2019":1,"2020":1,"2021":1,"2022":0,"2023":2,"2024":1,"2025":0},"avg":0.75},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":1,"2022":1,"2023":0,"2024":1,"2025":1},"avg":0.5},{"m":8,"byYear":{"2018":1,"2019":0,"2020":0,"2021":1,"2022":0,"2023":0,"2024":3,"2025":0},"avg":0.625},{"m":9,"byYear":{"2018":1,"2019":1,"2020":0,"2021":1,"2022":1,"2023":1,"2024":0,"2025":2},"avg":0.875},{"m":10,"byYear":{"2018":2,"2019":1,"2020":1,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.625},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":1,"2021":1,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25}]},"rain_ge70_mm":{"label":">=70mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":3,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":4,"byYear":{"2018":0,"2019":0,"2020":1,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":5,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":6,"byYear":{"2018":0,"2019":1,"2020":0,"2021":0,"2022":0,"2023":1,"2024":0,"2025":0},"avg":0.25},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":1,"2023":0,"2024":0,"2025":1},"avg":0.25},{"m":8,"byYear":{"2018":0,"2019":0,"2020":0,"2021":1,"2022":0,"2023":0,"2024":2,"2025":0},"avg":0.375},{"m":9,"byYear":{"2018":1,"2019":1,"2020":0,"2021":0,"2022":0,"2023":1,"2024":0,"2025":1},"avg":0.5},{"m":10,"byYear":{"2018":2,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.25},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0}]},"rain_ge100_mm":{"label":">=100mm","years":["2018","2019","2020","2021","2022","2023","2024","2025"],"months":[{"m":1,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":2,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":3,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":4,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":5,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":6,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":1,"2024":0,"2025":0},"avg":0.125},{"m":7,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":8,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":1,"2025":0},"avg":0.125},{"m":9,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":1},"avg":0.125},{"m":10,"byYear":{"2018":1,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0.125},{"m":11,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0},{"m":12,"byYear":{"2018":0,"2019":0,"2020":0,"2021":0,"2022":0,"2023":0,"2024":0,"2025":0},"avg":0}]}};

  const JP_HOLIDAY_YMD = {"2018-01-01":true,"2018-01-08":true,"2018-02-11":true,"2018-02-12":true,"2018-03-21":true,"2018-04-29":true,"2018-04-30":true,"2018-05-03":true,"2018-05-04":true,"2018-05-05":true,"2018-07-16":true,"2018-08-11":true,"2018-09-17":true,"2018-09-23":true,"2018-09-24":true,"2018-10-08":true,"2018-11-03":true,"2018-11-23":true,"2019-01-01":true,"2019-01-14":true,"2019-02-11":true,"2019-03-21":true,"2019-04-29":true,"2019-04-30":true,"2019-05-03":true,"2019-05-04":true,"2019-05-05":true,"2019-05-06":true,"2019-07-15":true,"2019-08-11":true,"2019-08-12":true,"2019-09-16":true,"2019-09-23":true,"2019-10-14":true,"2019-11-03":true,"2019-11-04":true,"2019-11-23":true,"2020-01-01":true,"2020-01-13":true,"2020-02-11":true,"2020-02-23":true,"2020-02-24":true,"2020-03-20":true,"2020-04-29":true,"2020-05-03":true,"2020-05-04":true,"2020-05-05":true,"2020-05-06":true,"2020-07-23":true,"2020-08-10":true,"2020-09-21":true,"2020-09-22":true,"2020-11-03":true,"2020-11-23":true,"2021-01-01":true,"2021-01-11":true,"2021-02-11":true,"2021-02-23":true,"2021-03-20":true,"2021-04-29":true,"2021-05-03":true,"2021-05-04":true,"2021-05-05":true,"2021-07-19":true,"2021-07-22":true,"2021-07-23":true,"2021-08-08":true,"2021-08-09":true,"2021-09-20":true,"2021-09-23":true,"2021-11-03":true,"2021-11-23":true,"2022-01-01":true,"2022-01-10":true,"2022-02-11":true,"2022-02-23":true,"2022-03-21":true,"2022-04-29":true,"2022-05-03":true,"2022-05-04":true,"2022-05-05":true,"2022-07-18":true,"2022-08-11":true,"2022-09-19":true,"2022-09-23":true,"2022-10-10":true,"2022-11-03":true,"2022-11-23":true,"2023-01-01":true,"2023-01-02":true,"2023-01-09":true,"2023-02-11":true,"2023-02-23":true,"2023-03-21":true,"2023-04-29":true,"2023-05-03":true,"2023-05-04":true,"2023-05-05":true,"2023-07-17":true,"2023-08-11":true,"2023-09-18":true,"2023-09-23":true,"2023-10-09":true,"2023-11-03":true,"2023-11-23":true,"2024-01-01":true,"2024-01-08":true,"2024-02-11":true,"2024-02-12":true,"2024-02-23":true,"2024-03-20":true,"2024-04-29":true,"2024-05-03":true,"2024-05-04":true,"2024-05-05":true,"2024-05-06":true,"2024-07-15":true,"2024-08-11":true,"2024-08-12":true,"2024-09-16":true,"2024-09-22":true,"2024-09-23":true,"2024-10-14":true,"2024-11-03":true,"2024-11-04":true,"2024-11-23":true,"2025-01-01":true,"2025-01-13":true,"2025-02-11":true,"2025-02-23":true,"2025-02-24":true,"2025-03-20":true,"2025-04-29":true,"2025-05-03":true,"2025-05-04":true,"2025-05-05":true,"2025-05-06":true,"2025-07-21":true,"2025-08-11":true,"2025-09-15":true,"2025-09-23":true,"2025-10-13":true,"2025-11-03":true,"2025-11-23":true,"2025-11-24":true,"2026-01-01":true,"2026-01-12":true,"2026-02-11":true,"2026-02-23":true,"2026-03-20":true,"2026-04-29":true,"2026-05-03":true,"2026-05-04":true,"2026-05-05":true,"2026-05-06":true,"2026-07-20":true,"2026-08-11":true,"2026-09-21":true,"2026-09-22":true,"2026-09-23":true,"2026-10-12":true,"2026-11-03":true,"2026-11-23":true,"2027-01-01":true,"2027-01-11":true,"2027-02-11":true,"2027-02-23":true,"2027-03-21":true,"2027-04-29":true,"2027-05-03":true,"2027-05-04":true,"2027-05-05":true,"2027-07-19":true,"2027-08-11":true,"2027-09-20":true,"2027-09-23":true,"2027-10-11":true,"2027-11-03":true,"2027-11-23":true,"2028-01-01":true,"2028-01-10":true,"2028-02-11":true,"2028-02-23":true,"2028-03-20":true,"2028-04-29":true,"2028-05-03":true,"2028-05-04":true,"2028-05-05":true,"2028-07-17":true,"2028-08-11":true,"2028-09-18":true,"2028-09-22":true,"2028-10-09":true,"2028-11-03":true,"2028-11-23":true,"2029-01-01":true,"2029-01-08":true,"2029-02-11":true,"2029-02-12":true,"2029-02-23":true,"2029-03-20":true,"2029-04-29":true,"2029-04-30":true,"2029-05-03":true,"2029-05-04":true,"2029-05-05":true,"2029-07-16":true,"2029-08-11":true,"2029-09-17":true,"2029-09-23":true,"2029-09-24":true,"2029-10-08":true,"2029-11-03":true,"2029-11-23":true,"2030-01-01":true,"2030-01-14":true,"2030-02-11":true,"2030-02-23":true,"2030-03-20":true,"2030-04-29":true,"2030-05-03":true,"2030-05-04":true,"2030-05-05":true,"2030-05-06":true,"2030-07-15":true,"2030-08-11":true,"2030-09-16":true,"2030-09-23":true,"2030-10-14":true,"2030-11-03":true,"2030-11-04":true,"2030-11-23":true};



/** @param {number} y @param {number} m 1-12 */
  function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
}

/** @param {string} iso YYYY-MM-DD */
  function parseIsoDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

/** @param {{y:number,mo:number,d:number}} p */
  function toIso(p) {
  return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** @param {Date} start @param {Date} end @param {number} y @param {number} m */
  function overlapDays(start, end, y, m) {
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, daysInMonth(y, m), 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  if (s > e) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

/** @param {number} year */
  function nationalHolidaySet(year) {
  const set = new Set();
  const prefix = `${year}-`;
  for (const iso of Object.keys(JP_HOLIDAY_YMD)) {
    if (iso.startsWith(prefix)) set.add(iso);
  }
  return set;
}

/**
 * Option A: 着工〜完工 ∩ 暦月 の休日内訳（土日・平日祝日）
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
  function holidayBreakdownInRange(start, end, y, m) {
  const hol = nationalHolidaySet(y);
  const dim = daysInMonth(y, m);
  const ms = new Date(Date.UTC(y, m - 1, 1, 12));
  const me = new Date(Date.UTC(y, m - 1, dim, 12));
  const s = start > ms ? start : ms;
  const e = end < me ? end : me;
  let weekends = 0;
  let weekdayHol = 0;
  if (s > e) return { C: 0, weekends: 0, weekdayHol: 0 };
  for (let d = 1; d <= dim; d += 1) {
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (dt < s || dt > e) continue;
    const dow = dt.getUTCDay();
    const iso = toIso({ y, mo: m, d });
    if (dow === 0 || dow === 6) weekends += 1;
    else if (hol.has(iso)) weekdayHol += 1;
  }
  const C = overlapDays(start, end, y, m);
  return { C, weekends, weekdayHol };
}

/**
 * 建設年度（4月始まり）の暦月 m (1-12) → 西暦年
 * @param {number} fiscalYear
 * @param {number} m 1-12
 */
  function calendarYearForDashboardMonth(fiscalYear, m) {
  return m >= 4 ? fiscalYear : fiscalYear + 1;
}

/**
 * Option A: 工期範囲内の日のみ ※1 をカウント
 * @param {Array<{date:string,value:number}>} rows
 * @param {Date} start @param {Date} end @param {number} y @param {number} m
 */
  function weatherCountGeInRange(rows, threshold, start, end, y, m) {
  let count = 0;
  for (const { date, value } of rows) {
    if (value == null || Number.isNaN(value)) continue;
    if (value < threshold) continue;
    const p = parseIsoDate(date);
    if (!p || p.y !== y || p.mo !== m) continue;
    const dt = new Date(Date.UTC(p.y, p.mo - 1, p.d, 12));
    if (dt < start || dt > end) continue;
    count += 1;
  }
  return count;
}

/**
 * @param {number} m 1-12
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>|Record<number,{gw?:number,summer?:number,nye?:number}>} manual
 */
  function manualHolidayForMonth(m, manual) {
  if (!manual) return { gw: 0, summer: 0, nye: 0 };
  if (Array.isArray(manual)) {
    const hit = manual.find((r) => r.m === m);
    return {
      gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
      summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
      nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
    };
  }
  const hit = manual[m];
  return {
    gw: hit && hit.gw != null ? Number(hit.gw) || 0 : 0,
    summer: hit && hit.summer != null ? Number(hit.summer) || 0 : 0,
    nye: hit && hit.nye != null ? Number(hit.nye) || 0 : 0,
  };
}

/**
 * Excel ※2–④（Option A: 暦日・休日・※1 はすべて工期範囲内）
 * @param {object} p
 * @param {string} p.startDate
 * @param {string} p.endDate
 * @param {number} p.fiscalYear
 * @param {number} p.windTh
 * @param {number} p.rainTh
 * @param {Array<{date:string,value:number}>} p.wind
 * @param {Array<{date:string,value:number}>} p.rain
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
  function calcWorkdays(p) {
  const sp = parseIsoDate(p.startDate);
  const ep = parseIsoDate(p.endDate);
  if (!sp || !ep) throw new Error('着工日・完工日を YYYY-MM-DD で指定してください');
  const start = new Date(Date.UTC(sp.y, sp.mo - 1, sp.d, 12));
  const end = new Date(Date.UTC(ep.y, ep.mo - 1, ep.d, 12));
  if (start > end) throw new Error('着工日は完工日以前にしてください');

  const monthly = [];

  for (let m = 1; m <= 12; m += 1) {
    const calYear = calendarYearForDashboardMonth(p.fiscalYear, m);
    const { C, weekends, weekdayHol } = holidayBreakdownInRange(start, end, calYear, m);
    const man = manualHolidayForMonth(m, p.holidayManual);
    const gw = man.gw;
    const summer = man.summer;
    const nye = man.nye;
    const D = weekends + weekdayHol + gw + summer + nye;

    const E =
      C > 0 ? weatherCountGeInRange(p.wind, p.windTh, start, end, calYear, m) : 0;
    const W =
      C > 0 ? weatherCountGeInRange(p.rain, p.rainTh, start, end, calYear, m) : 0;

    const G = C ? (D * E) / C : 0;
    const I = C - (D + E - G);
    const H_rate = I ? (D + E - G) / I : 0;
    const N = I;

    const J = C ? (D * W) / C : 0;
    const L = C - (D + W - J);
    const K_rate = L ? (D + W - J) / L : 0;
    const O = L;

    monthly.push({
      m,
      calYear,
      C,
      D,
      weekends,
      weekdayHol,
      gw,
      summer,
      nye,
      E,
      W,
      G,
      J,
      N,
      O,
      H_rate,
      K_rate,
      scaffoldAvail: I,
      paintAvail: L,
    });
  }

  const scaffold = monthly.reduce((s, r) => s + r.N, 0);
  const paint = monthly.reduce((s, r) => s + r.O, 0);

  return { scaffold, paint, monthly };
}

  function inferFiscalYear(startDate) {
  const p = parseIsoDate(startDate);
  if (!p) return new Date().getFullYear();
  return p.mo >= 4 ? p.y : p.y - 1;
}

/** 工期設定資料 p.94 — 小数第2位四捨五入・小数第1位止め */
  function roundWorkdaysPdf1(n) {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(Number(n) * 10) / 10;
}

/**
 * 工期設定資料 p.94 雨休率（塗装・ダブり補正あり）
 * O = R×H/C, W = C−H−R+O, P% = round((H+R−O)/W×100)
 * @returns {{ weatherR: number, overlap: number, avail: number, rate: number, ratePct: number }}
 */
  function calcRainHolidayRatePdf(D, weather, C) {
  const H = Number(D) || 0;
  const Cn = Number(C) || 0;
  const weatherR = roundWorkdaysPdf1(weather);
  const overlap = Cn ? roundWorkdaysPdf1((weatherR * H) / Cn) : 0;
  const avail = roundWorkdaysPdf1(Cn - H - weatherR + overlap);
  const numerator = H + weatherR - overlap;
  const rate = avail ? numerator / avail : 0;
  const ratePct = Math.round(rate * 100);
  return { weatherR, overlap, avail, rate, ratePct, numerator };
}

/**
 * Excel 20260613 — 工事稼働日管理表（1〜12月・暦日=各月全日・※1=過去5年平均）
 * @param {object} p
 * @param {number} p.calendarYear 休日・暦日の基準年（西暦）
 * @param {Record<number, number>|Array<{m:number}>} p.weatherByMonth 月1〜12の平均日数
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
  function calcWorkdaysExcel20260613(p) {
  const calYear = p.calendarYear;
  const weatherByMonth = p.weatherByMonth || {};
  const monthly = [];

  for (let m = 1; m <= 12; m += 1) {
    const C = daysInMonth(calYear, m);
    const monthStart = new Date(Date.UTC(calYear, m - 1, 1, 12));
    const monthEnd = new Date(Date.UTC(calYear, m - 1, C, 12));
    const { weekends, weekdayHol } = holidayBreakdownInRange(monthStart, monthEnd, calYear, m);
    const man = manualHolidayForMonth(m, p.holidayManual);
    const gw = man.gw;
    const summer = man.summer;
    const nye = man.nye;
    const D = weekends + weekdayHol + gw + summer + nye;
    const weather =
      typeof weatherByMonth[m] === 'number'
        ? weatherByMonth[m]
        : weatherByMonth[String(m)] != null
          ? Number(weatherByMonth[String(m)])
          : 0;
    const overlap = C ? (D * weather) / C : 0;
    const avail = C - (D + weather - overlap);
    const rate = avail ? (D + weather - overlap) / avail : 0;

    monthly.push({
      m,
      calYear,
      C,
      D,
      weekends,
      weekdayHol,
      gw,
      summer,
      nye,
      E: weather,
      W: weather,
      G: overlap,
      J: overlap,
      N: avail,
      O: avail,
      H_rate: rate,
      K_rate: rate,
      scaffoldAvail: avail,
      paintAvail: avail,
    });
  }

  const totalAvail = monthly.reduce((s, r) => s + r.N, 0);
  return { totalAvail, monthly };
}

/**
 * 見積作成年 Y に対する過去5年（Y-5 〜 Y-1）
 * @param {number} estimateYear
 */
  function pastFiveYearsForEstimate(estimateYear) {
  const y = Number(estimateYear);
  if (!Number.isFinite(y)) throw new Error('見積作成年が不正です');
  return [y - 5, y - 4, y - 3, y - 2, y - 1];
}

/**
 * 参照データから見積作成年に対応する5年月平均を構築
 * @param {{ months?: Array<{m:number,byYear?:Record<string,number>}> }} refBlock
 * @param {number} estimateYear
 */
  function build5yrMonthlyAverages(refBlock, estimateYear) {
  const years = pastFiveYearsForEstimate(estimateYear).map(String);
  const monthRows = refBlock && refBlock.months ? refBlock.months : [];
  const byMonth = {};
  monthRows.forEach(function (r) {
    byMonth[r.m] = r;
  });
  const missingYears = new Set();
  const months = [];

  for (let m = 1; m <= 12; m += 1) {
    const src = byMonth[m] || {};
    const byYear = {};
    let sum = 0;
    years.forEach(function (y) {
      const raw = src.byYear && src.byYear[y] != null ? src.byYear[y] : src.byYear && src.byYear[Number(y)];
      if (raw == null || Number.isNaN(Number(raw))) {
        missingYears.add(y);
        return;
      }
      const v = Number(raw);
      byYear[y] = v;
      sum += v;
    });
    const avg = years.length ? sum / years.length : 0;
    months.push({ m, byYear, years: years.slice(), avg });
  }

  return {
    years,
    months,
    missingYears: years.filter(function (y) {
      return missingYears.has(y);
    }),
  };
}

/**
 * @param {object} p
 * @param {number} p.estimateYear 見積作成年（休日・暦日の基準年）
 * @param {object} p.ref5yr REF5YR 相当
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
  function calcWorkdaysBundleForEstimate(p) {
  const wind5 = build5yrMonthlyAverages(p.ref5yr.wind_ge10_ms, p.estimateYear);
  const rain5 = build5yrMonthlyAverages(p.ref5yr.rain_ge10_mm, p.estimateYear);
  const missing = Array.from(new Set(wind5.missingYears.concat(rain5.missingYears))).sort();
  if (missing.length) {
    throw new Error(
      '見積作成年 ' +
        p.estimateYear +
        ' の過去5年（' +
        wind5.years.join('・') +
        '）のうち、参照データにない年があります: ' +
        missing.join(', '),
    );
  }
  const bundle = calcWorkdaysBundle20260613({
    calendarYear: p.estimateYear,
    wind5yrMonths: wind5.months,
    rain5yrMonths: rain5.months,
    holidayManual: p.holidayManual,
  });
  return {
    ...bundle,
    estimateYear: p.estimateYear,
    pastYears: wind5.years,
    wind5yr: wind5,
    rain5yr: rain5,
  };
}

/**
 * @param {object} p
 * @param {number} p.calendarYear
 * @param {Array<{m:number,avg:number}>} p.wind5yrMonths
 * @param {Array<{m:number,avg:number}>} p.rain5yrMonths
 * @param {Array<{m:number,gw?:number,summer?:number,nye?:number}>} [p.holidayManual]
 */
  function calcWorkdaysBundle20260613(p) {
  function toMap(rows) {
    const map = {};
    (rows || []).forEach(function (r) {
      map[r.m] = Number(r.avg) || 0;
    });
    return map;
  }
  const windRes = calcWorkdaysExcel20260613({
    calendarYear: p.calendarYear,
    holidayManual: p.holidayManual,
    weatherByMonth: toMap(p.wind5yrMonths),
  });
  const rainRes = calcWorkdaysExcel20260613({
    calendarYear: p.calendarYear,
    holidayManual: p.holidayManual,
    weatherByMonth: toMap(p.rain5yrMonths),
  });
  return {
    scaffold: windRes.totalAvail,
    paint: rainRes.totalAvail,
    monthlyWind: windRes.monthly,
    monthlyRain: rainRes.monthly,
  };
}

  const REF5YR_WIND_THRESHOLDS = [10, 15, 20, 30];
  const REF5YR_RAIN_THRESHOLDS = [1, 10, 30, 50, 70, 100];

/** @param {'wind'|'rain'} kind @param {number} threshold */
  function ref5yrBlockKey(kind, threshold) {
  return kind === 'wind' ? 'wind_ge' + threshold + '_ms' : 'rain_ge' + threshold + '_mm';
}

/** @param {string} key */
  function ref5yrBlockTitle(key) {
  const titles = {
    wind_ge10_ms: '≧10m/s　月別最大風速',
    wind_ge15_ms: '≧15m/s　月別最大風速',
    wind_ge20_ms: '≧20m/s　月別最大風速',
    wind_ge30_ms: '≧30m/s　月別最大風速',
    rain_ge1_mm: '≧1mm　月別降雨量',
    rain_ge10_mm: '≧10mm　月別降雨量',
    rain_ge30_mm: '≧30mm　月別降雨量',
    rain_ge50_mm: '≧50mm　月別降雨量',
    rain_ge70_mm: '≧70mm　月別降雨量',
    rain_ge100_mm: '≧100mm　月別降雨量',
  };
  return titles[key] || key;
}

/**
 * 日別 CSV 行から閾値別・年月別日数を集計
 * @param {Array<{date:string,value:number}>} rows
 * @param {number} threshold
 */
  function aggregateDailyToMonthlyCounts(rows, threshold) {
  const counts = {};
  (rows || []).forEach(function (row) {
    const p = parseIsoDate(row.date);
    if (!p) return;
    const y = String(p.y);
    if (!counts[y]) counts[y] = {};
    if (counts[y][p.mo] == null) counts[y][p.mo] = 0;
  });
  (rows || []).forEach(function (row) {
    const val = Number(row.value);
    if (Number.isNaN(val) || val < threshold) return;
    const p = parseIsoDate(row.date);
    if (!p) return;
    const y = String(p.y);
    if (!counts[y]) counts[y] = {};
    counts[y][p.mo] = (counts[y][p.mo] || 0) + 1;
  });
  return counts;
}

/**
 * @param {{ months?: Array<{m:number,byYear?:Record<string,number>}> }} block
 * @param {Record<string, Record<number, number>>} counts year -> month -> count
 */
  function mergeMonthlyCountsIntoBlock(block, counts) {
  if (!block.months) block.months = [];
  const csvYears = Object.keys(counts).sort();
  for (let m = 1; m <= 12; m += 1) {
    let row = block.months.find(function (r) {
      return r.m === m;
    });
    if (!row) {
      row = { m: m, byYear: {} };
      block.months.push(row);
    }
    if (!row.byYear) row.byYear = {};
    csvYears.forEach(function (y) {
      row.byYear[y] = counts[y] && counts[y][m] != null ? counts[y][m] : 0;
    });
  }
  block.months.sort(function (a, b) {
    return a.m - b.m;
  });
  const yearSet = new Set(block.years || []);
  csvYears.forEach(function (y) {
    yearSet.add(y);
  });
  block.months.forEach(function (row) {
    Object.keys(row.byYear || {}).forEach(function (y) {
      yearSet.add(y);
    });
  });
  block.years = Array.from(yearSet).sort();
  block.months.forEach(function (row) {
    const vals = block.years.map(function (y) {
      return Number(row.byYear[y]) || 0;
    });
    row.avg = vals.length ? vals.reduce(function (s, v) { return s + v; }, 0) / vals.length : 0;
  });
  return block;
}

/**
 * 日別 CSV から REF5YR 全閾値ブロックを更新（既存年は上書き・他年は維持）
 * @param {object} ref5yr
 * @param {Array<{date:string,value:number}>} rows
 * @param {'wind'|'rain'} kind
 */
  function mergeDailyCsvIntoRef5yr(ref5yr, rows, kind) {
  const out = JSON.parse(JSON.stringify(ref5yr || {}));
  const thresholds = kind === 'wind' ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
  thresholds.forEach(function (th) {
    const key = ref5yrBlockKey(kind, th);
    const counts = aggregateDailyToMonthlyCounts(rows, th);
    if (!rows || !rows.length) return;
    if (!out[key]) {
      out[key] = {
        label: kind === 'wind' ? '>=' + th + 'm/s' : '>=' + th + 'mm',
        threshold: th,
        years: [],
        months: [],
      };
    }
    mergeMonthlyCountsIntoBlock(out[key], counts);
  });
  const allYears = new Set();
  thresholds.forEach(function (th) {
    const key = ref5yrBlockKey(kind, th);
    (out[key] && out[key].years ? out[key].years : []).forEach(function (y) {
      allYears.add(y);
    });
  });
  const span = Array.from(allYears).sort();
  if (span.length) {
    const period = span[0] + '〜' + span[span.length - 1];
    if (kind === 'wind') out.windPeriod = period;
    else out.rainPeriod = period;
  }
  out.updatedFromCsv = new Date().toISOString().slice(0, 10);
  return out;
}

/**
 * @param {object} ref5yr
 * @param {Array<{date:string,value:number}>} windRows
 * @param {Array<{date:string,value:number}>} rainRows
 */
  function rebuildRef5yrFromDailyCsv(ref5yr, windRows, rainRows) {
  let out = JSON.parse(JSON.stringify(ref5yr || {}));
  if (windRows && windRows.length) out = mergeDailyCsvIntoRef5yr(out, windRows, 'wind');
  if (rainRows && rainRows.length) out = mergeDailyCsvIntoRef5yr(out, rainRows, 'rain');
  return out;
}

/** ビルド用: 祝日マスタを JS オブジェクトリテラル文字列で返す */
  function jpHolidayYmdForBundle() {
  return JP_HOLIDAY_YMD;
}

  const APP_DATA = 687;
  const FC = {
    project: 'project_name',
    start: 'start_date',
    end: 'end_date',
    estimate: 'estimate_year',
    obs: 'obs_location',
    obsNote: 'obs_location_note',
    windTh: 'threshold_wind_ms',
    rainTh: 'threshold_rain_mm',
    fiscal: 'holiday_fiscal_year',
    windTbl: 'wind_data',
    windDate: 'wind_obs_date',
    windVal: 'wind_max_ms',
    rainTbl: 'rain_data',
    rainDate: 'rain_obs_date',
    rainVal: 'rain_mm',
    holTbl: 'holiday_manual',
    holMonth: 'hm_month',
    holGw: 'hm_gw',
    holSummer: 'hm_summer',
    holNye: 'hm_nye',
    resScaffold: 'result_scaffold_days',
    resPaint: 'result_paint_days',
    calcAt: 'calculated_at',
    note: 'calc_note',
  };

  const OBS_OPTIONS = ['東京', 'さいたま', '熊谷', '宇都宮', '前橋', '横浜', '千葉', 'その他'];
  const JMA_OBSDL = 'https://www.data.jma.go.jp/risk/obsdl/';
  const SESSION_RECORD_KEY = 'workdays688_last_record_id';

  let state = emptyState();
  let pendingCsvKind = null;
  let activeTab = 'scaffold';

  function emptyHolidayManual() {
    const rows = [];
    for (let m = 1; m <= 12; m += 1) {
      rows.push({ m: m, gw: 0, summer: 0, nye: 0 });
    }
    return rows;
  }

  function emptyState() {
    return {
      recordId: null,
      revision: null,
      dirty: false,
      project_name: '',
      estimate_year: null,
      start_date: '',
      end_date: '',
      obs_location: '',
      obs_location_note: '',
      threshold_wind_ms: 10,
      threshold_rain_mm: 10,
      holiday_fiscal_year: null,
      wind: [],
      rain: [],
      holidayManual: emptyHolidayManual(),
      ref5yr: null,
      result_scaffold_days: null,
      result_paint_days: null,
      calculated_at: '',
      lastResult: null,
    };
  }

  function gv(rec, code) {
    return rec[code] && rec[code].value != null ? rec[code].value : '';
  }

  function readSubFromKintone(rec, tbl, dateFc, valFc) {
    const rows = (rec[tbl] && rec[tbl].value) || [];
    const out = [];
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i].value || {};
      const date = String(v[dateFc] && v[dateFc].value != null ? v[dateFc].value : '').slice(0, 10);
      const n = Number(v[valFc] && v[valFc].value);
      if (!date || Number.isNaN(n)) continue;
      out.push({ date: date, value: n });
    }
    return out;
  }

  function readHolidayManualFromKintone(rec) {
    const rows = (rec[FC.holTbl] && rec[FC.holTbl].value) || [];
    const byMonth = {};
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i].value || {};
      const m = Number(v[FC.holMonth] && v[FC.holMonth].value);
      if (!m || m < 1 || m > 12) continue;
      byMonth[m] = {
        m: m,
        gw: Number(v[FC.holGw] && v[FC.holGw].value) || 0,
        summer: Number(v[FC.holSummer] && v[FC.holSummer].value) || 0,
        nye: Number(v[FC.holNye] && v[FC.holNye].value) || 0,
      };
    }
    const out = emptyHolidayManual();
    for (let i = 0; i < out.length; i += 1) {
      if (byMonth[out[i].m]) out[i] = byMonth[out[i].m];
    }
    return out;
  }

  function subToKintone(rows, dateFc, valFc) {
    return rows.map(function (r) {
      const row = { value: {} };
      row.value[dateFc] = { value: r.date };
      row.value[valFc] = { value: String(r.value) };
      return row;
    });
  }

  function holidayManualToKintone(rows) {
    return rows.map(function (r) {
      return {
        value: {
          [FC.holMonth]: { value: String(r.m) },
          [FC.holGw]: { value: String(r.gw != null ? r.gw : 0) },
          [FC.holSummer]: { value: String(r.summer != null ? r.summer : 0) },
          [FC.holNye]: { value: String(r.nye != null ? r.nye : 0) },
        },
      };
    });
  }

  function stateFromKintone(rec) {
    const s = emptyState();
    s.recordId = rec.$id && rec.$id.value != null ? String(rec.$id.value) : null;
    s.revision = rec.$revision && rec.$revision.value != null ? String(rec.$revision.value) : null;
    s.project_name = String(gv(rec, FC.project));
    const est = gv(rec, FC.estimate);
    const fy = gv(rec, FC.fiscal);
    const start = String(gv(rec, FC.start)).slice(0, 10);
    if (est !== '') s.estimate_year = Number(est);
    else if (fy !== '') s.estimate_year = Number(fy);
    else if (start) s.estimate_year = Number(start.slice(0, 4));
    s.start_date = start;
    s.end_date = String(gv(rec, FC.end)).slice(0, 10);
    s.obs_location = String(gv(rec, FC.obs));
    s.obs_location_note = String(gv(rec, FC.obsNote));
    s.threshold_wind_ms = Number(gv(rec, FC.windTh)) || 10;
    s.threshold_rain_mm = Number(gv(rec, FC.rainTh)) || 10;
    const fyLegacy = gv(rec, FC.fiscal);
    s.holiday_fiscal_year = fyLegacy !== '' ? Number(fyLegacy) : s.estimate_year;
    s.wind = readSubFromKintone(rec, FC.windTbl, FC.windDate, FC.windVal);
    s.rain = readSubFromKintone(rec, FC.rainTbl, FC.rainDate, FC.rainVal);
    s.holidayManual = readHolidayManualFromKintone(rec);
    const rs = gv(rec, FC.resScaffold);
    const rp = gv(rec, FC.resPaint);
    s.result_scaffold_days = rs !== '' ? Number(rs) : null;
    s.result_paint_days = rp !== '' ? Number(rp) : null;
    s.calculated_at = String(gv(rec, FC.calcAt));
    s.dirty = false;
    syncRef5yrFromDaily();
    return s;
  }

  function stateToKintoneRecord(s, includeResults) {
    const rec = {};
    rec[FC.project] = { value: s.project_name };
    if (s.estimate_year != null) {
      rec[FC.estimate] = { value: String(s.estimate_year) };
      rec[FC.fiscal] = { value: String(s.estimate_year) };
      rec[FC.start] = { value: s.estimate_year + '-01-01' };
      rec[FC.end] = { value: s.estimate_year + '-12-31' };
    }
    rec[FC.obs] = { value: s.obs_location };
    rec[FC.obsNote] = { value: s.obs_location_note };
    rec[FC.windTh] = { value: String(s.threshold_wind_ms) };
    rec[FC.rainTh] = { value: String(s.threshold_rain_mm) };
    if (s.holiday_fiscal_year != null && s.estimate_year == null) {
      rec[FC.fiscal] = { value: String(s.holiday_fiscal_year) };
    }
    rec[FC.windTbl] = { value: subToKintone(s.wind, FC.windDate, FC.windVal) };
    rec[FC.rainTbl] = { value: subToKintone(s.rain, FC.rainDate, FC.rainVal) };
    rec[FC.holTbl] = { value: holidayManualToKintone(s.holidayManual) };
    if (includeResults && s.lastResult) {
      rec[FC.resScaffold] = { value: String(Math.round(s.lastResult.scaffold * 100) / 100) };
      rec[FC.resPaint] = { value: String(Math.round(s.lastResult.paint * 100) / 100) };
      rec[FC.calcAt] = { value: new Date().toISOString() };
      rec[FC.note] = { value: buildCalcNote(s.lastResult, s.lastWarnings || []) };
    }
    return rec;
  }

  function apiGetRecord(id) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', { app: APP_DATA, id: id });
  }

  function apiPutRecord(id, revision, record) {
    const body = { app: APP_DATA, id: id, record: record };
    if (revision) body.revision = revision;
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', body);
  }

  function apiPostRecord(record) {
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', { app: APP_DATA, record: record });
  }

  function apiListProjects() {
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: APP_DATA,
      query: 'order by $id desc limit 100',
      fields: [FC.project, FC.estimate, FC.fiscal, FC.start, FC.obs, FC.resScaffold, FC.resPaint, '$id'],
    });
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

  function addDaysIso(iso, days) {
    const p = parseIsoDate(iso);
    if (!p) return iso;
    const t = Date.UTC(p.y, p.mo - 1, p.d + days, 12);
    const nd = new Date(t);
    return toIso({ y: nd.getUTCFullYear(), mo: nd.getUTCMonth() + 1, d: nd.getUTCDate() });
  }

  function normalizeDate(raw) {
    const s = String(raw).trim();
    let m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(s);
    if (m) {
      return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
    }
    m = /^(\d{4})(\d{2})(\d{2})$/.exec(s.replace(/\D/g, ''));
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    return null;
  }

  function cloneRef5yr(src) {
    return JSON.parse(JSON.stringify(src || REF5YR));
  }

  function getRef5yr() {
    return state.ref5yr || REF5YR;
  }

  function syncRef5yrFromDaily() {
    state.ref5yr = rebuildRef5yrFromDailyCsv(cloneRef5yr(REF5YR), state.wind, state.rain);
  }

  function decodeCsvArrayBuffer(buf) {
    const encodings = ['shift-jis', 'utf-8'];
    for (let i = 0; i < encodings.length; i += 1) {
      try {
        const text = new TextDecoder(encodings[i]).decode(buf);
        if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(text)) return text;
      } catch (_e) {
        /* noop */
      }
    }
    return new TextDecoder('utf-8').decode(buf);
  }

  function parseCsvTwoColumn(text) {
    const lines = String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
    const rows = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(/[,\t]/).map(function (c) {
        return c.trim().replace(/^"|"$/g, '');
      });
      if (cols.length < 2) continue;
      if (/日付|年月日|date|風速|降雨|降水/i.test(cols[0] + cols[1])) continue;
      const date = normalizeDate(cols[0]);
      const val = parseFloat(String(cols[1]).replace(/[^\d.-]/g, ''));
      if (!date || Number.isNaN(val)) continue;
      rows.push({ date: date, value: val });
    }
    return rows;
  }

  function currentEstimateYear() {
    const el = document.getElementById('wd688-estimate');
    if (el && el.value !== '') return Number(el.value);
    if (state.estimate_year != null) return state.estimate_year;
    return new Date().getFullYear();
  }

  function buildCalcNote(result, warnings) {
    const lines = [
      'BUILD=' + BUILD,
      '見積作成年=' + (result.estimateYear != null ? result.estimateYear : '—'),
      '過去5年=' + (result.pastYears ? result.pastYears.join('・') : '—'),
      '足場=' + result.scaffold.toFixed(2) + ' / 塗装=' + result.paint.toFixed(2),
      '（Excel 20260613準拠・1〜12月・※1=見積作成年の過去5年月平均・祝日=マスタ自動）',
      '',
      '月 | 年 | 暦 | 休 | 風※1 | 雨※1 | ダブ風 | ダブ雨 | 足場 | 塗装 | 不稼働率(足) | 不稼働率(塗)',
    ];
    const windRows = result.monthlyWind || result.monthly || [];
    const rainRows = result.monthlyRain || result.monthly || [];
    for (let i = 0; i < windRows.length; i += 1) {
      const r = windRows[i];
      const rain = rainRows[i] || r;
      lines.push(
        [
          r.m,
          r.calYear,
          r.C,
          r.D,
          r.E,
          rain.W,
          r.G != null ? r.G.toFixed(2) : '',
          rain.J != null ? rain.J.toFixed(2) : '',
          r.N.toFixed(2),
          rain.O.toFixed(2),
          r.H_rate != null ? (r.H_rate * 100).toFixed(2) + '%' : '',
          rain.K_rate != null ? (rain.K_rate * 100).toFixed(2) + '%' : '',
        ].join(' | '),
      );
    }
    if (warnings.length) {
      lines.push('', '【警告】', warnings.join('\n'));
    }
    return lines.join('\n');
  }

  function collectWarnings() {
    const warnings = [];
    if (state.estimate_year == null) warnings.push('見積作成年が未入力です');
    if (!state.obs_location) warnings.push('観測地点が未選択です');
    if (!getRef5yr() || !getRef5yr().wind_ge10_ms) warnings.push('過去5年参照データが読み込めていません');
    return warnings;
  }

  function readHolidayManualFromForm() {
    for (let m = 1; m <= 12; m += 1) {
      const row = state.holidayManual[m - 1];
      const gwEl = document.getElementById('wd688-hm-gw-' + m);
      const suEl = document.getElementById('wd688-hm-summer-' + m);
      const nyEl = document.getElementById('wd688-hm-nye-' + m);
      if (gwEl) row.gw = Number(gwEl.value) || 0;
      if (suEl) row.summer = Number(suEl.value) || 0;
      if (nyEl) row.nye = Number(nyEl.value) || 0;
    }
  }

  function runCalc() {
    readHolidayManualFromForm();
    const estimateYear = currentEstimateYear();
    if (!estimateYear || Number.isNaN(estimateYear)) throw new Error('見積作成年を入力してください');
    const bundle = calcWorkdaysBundleForEstimate({
      estimateYear: estimateYear,
      ref5yr: getRef5yr(),
      holidayManual: state.holidayManual,
    });
    state.lastResult = {
      scaffold: bundle.scaffold,
      paint: bundle.paint,
      monthlyWind: bundle.monthlyWind,
      monthlyRain: bundle.monthlyRain,
      estimateYear: bundle.estimateYear,
      pastYears: bundle.pastYears,
      wind5yr: bundle.wind5yr,
      rain5yr: bundle.rain5yr,
    };
    state.lastWarnings = collectWarnings();
    state.result_scaffold_days = Math.round(bundle.scaffold * 100) / 100;
    state.result_paint_days = Math.round(bundle.paint * 100) / 100;
    state.estimate_year = estimateYear;
    state.holiday_fiscal_year = estimateYear;
    state.dirty = true;
    return state.lastResult;
  }

  function markDirty() {
    state.dirty = true;
    updateDirtyBanner();
  }

  function updateDirtyBanner() {
    const el = document.getElementById('wd688-dirty');
    if (!el) return;
    if (state.dirty) {
      el.textContent = '未保存の変更があります。データ入力・再算出のあと「保存」を押してください。';
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function readFormIntoState() {
    const g = function (id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    state.project_name = g('wd688-project');
    state.estimate_year = g('wd688-estimate') !== '' ? Number(g('wd688-estimate')) : null;
    state.obs_location = g('wd688-obs');
    state.obs_location_note = g('wd688-obs-note');
    state.threshold_wind_ms = Number(g('wd688-wind-th')) || 10;
    state.threshold_rain_mm = Number(g('wd688-rain-th')) || 10;
    readHolidayManualFromForm();
    markDirty();
  }

  function fillFormFromState() {
    const s = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.value = val != null ? String(val) : '';
    };
    s('wd688-project', state.project_name);
    s('wd688-estimate', state.estimate_year != null ? state.estimate_year : '');
    s('wd688-obs', state.obs_location);
    s('wd688-obs-note', state.obs_location_note);
    s('wd688-wind-th', state.threshold_wind_ms);
    s('wd688-rain-th', state.threshold_rain_mm);
    for (let m = 1; m <= 12; m += 1) {
      const row = state.holidayManual[m - 1];
      s('wd688-hm-gw-' + m, row.gw);
      s('wd688-hm-summer-' + m, row.summer);
      s('wd688-hm-nye-' + m, row.nye);
    }
    renderSummary();
    renderMonthlyTable();
    updateTabButtons();
    updateDirtyBanner();
  }

  function renderSummary() {
    const sc = document.getElementById('wd688-scaffold');
    const pt = document.getElementById('wd688-paint');
    const meta = document.getElementById('wd688-meta');
    if (sc) {
      sc.textContent =
        state.result_scaffold_days != null ? state.result_scaffold_days.toFixed(2) + ' 日' : '—';
    }
    if (pt) {
      pt.textContent = state.result_paint_days != null ? state.result_paint_days.toFixed(2) + ' 日' : '—';
    }
    if (meta) {
      let t = '';
      if (state.recordId) t += '案件ID: ' + state.recordId;
      if (state.calculated_at) t += ' / 最終算出: ' + state.calculated_at.slice(0, 19).replace('T', ' ');
      meta.textContent = t;
    }
  }

  function monthLabel(m) {
    return m + '月';
  }

  function fmtNum(n, digits) {
    if (n == null || Number.isNaN(n)) return '—';
    return Number(n).toFixed(digits != null ? digits : 2);
  }

  function fmtPct(rate) {
    if (rate == null || Number.isNaN(rate)) return '—';
    return (Number(rate) * 100).toFixed(2) + '%';
  }

  function fmtRainHolidayPct(pct) {
    if (pct == null || Number.isNaN(pct)) return '—';
    return String(Math.round(Number(pct))) + '%';
  }

  function paintPdfMonth(r) {
    return calcRainHolidayRatePdf(r.D, r.W, r.C);
  }

  function paintPdfYear(yt) {
    return calcRainHolidayRatePdf(yt.D, yt.weather, yt.C);
  }

  function windPdfMonth(r) {
    return {
      weatherR: roundWorkdaysPdf1(r.E),
      overlap: roundWorkdaysPdf1(r.G),
      avail: roundWorkdaysPdf1(r.N),
    };
  }

  function windPdfYear(yt) {
    return {
      weatherR: roundWorkdaysPdf1(yt.weather),
      overlap: roundWorkdaysPdf1(yt.overlap),
      avail: roundWorkdaysPdf1(yt.avail),
    };
  }

  function computeYearTotals(rows, isWind) {
    function sum(key) {
      return rows.reduce(function (s, r) {
        return s + (Number(r[key]) || 0);
      }, 0);
    }
    const C = sum('C');
    const D = sum('D');
    const weather = isWind ? sum('E') : sum('W');
    const overlap = C ? (D * weather) / C : 0;
    const avail = C - (D + weather - overlap);
    const rate = avail ? (D + weather - overlap) / avail : 0;
    return {
      weather: weather,
      weekends: sum('weekends'),
      weekdayHol: sum('weekdayHol'),
      gw: sum('gw'),
      summer: sum('summer'),
      nye: sum('nye'),
      D: D,
      overlap: overlap,
      C: C,
      avail: avail,
      rate: rate,
    };
  }

  function renderExcelTransposedTable(rows, mode) {
    const isWind = mode === 'scaffold';
    const yt = computeYearTotals(rows, isWind);
    const weatherLabel = isWind
      ? '風速日数 ※1<br><span class="wd688-sub">(10m/s以上・見積作成年の過去5年月平均)</span>'
      : '降雨日数 ※1<br><span class="wd688-sub">(10mm以上・見積作成年の過去5年月平均)</span>';
    const overlapLabel = isWind
      ? '休日数と風速日数のダブり ※2'
      : '休日数と降雨日数のダブり ※2';

    function cellVal(r, key) {
      return r[key];
    }

    function weatherVal(r) {
      if (isWind) return r.E;
      return paintPdfMonth(r).weatherR;
    }

    function overlapVal(r) {
      if (isWind) return r.G;
      return paintPdfMonth(r).overlap;
    }

    function availVal(r) {
      if (isWind) return r.N;
      return paintPdfMonth(r).avail;
    }

    function rateVal(r) {
      return isWind ? r.H_rate : r.K_rate;
    }

    function fmtYearCell(v, opts) {
      opts = opts || {};
      if (opts.rainPctInt) return fmtRainHolidayPct(v);
      if (opts.pct) return fmtPct(v);
      if (opts.fixed != null) return fmtNum(v, opts.fixed);
      return v;
    }

    const pdfYear = isWind ? null : paintPdfYear(yt);

    let html =
      '<div class="wd688-excel-wrap"><table class="wd688-table wd688-excel-table"><thead><tr>' +
      '<th class="wd688-row-label">月</th>';
    for (let i = 0; i < rows.length; i += 1) {
      html += '<th>' + monthLabel(rows[i].m) + '</th>';
    }
    html +=
      '<th class="wd688-year-col">年<br><span class="wd688-sub">合計</span></th></tr></thead><tbody>';

    function addRow(label, valueFn, opts) {
      opts = opts || {};
      html += '<tr><td class="wd688-row-label">' + label + '</td>';
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        if (opts.inputPrefix) {
          html +=
            '<td><input type="number" min="0" step="1" id="wd688-hm-' +
            opts.inputPrefix +
            '-' +
            r.m +
            '" class="wd688-hm-in" value="' +
            cellVal(r, opts.field) +
            '" style="width:52px"></td>';
        } else {
          const v = valueFn(r);
          html +=
            '<td>' +
            (opts.rainPctInt
              ? fmtRainHolidayPct(v)
              : opts.pct
                ? fmtPct(v)
                : opts.fixed != null
                  ? fmtNum(v, opts.fixed)
                  : v) +
            '</td>';
        }
      }
      html += '<td class="wd688-year-col">' + fmtYearCell(opts.yearVal, opts) + '</td>';
      html += '</tr>';
    }

    addRow(weatherLabel, weatherVal, {
      fixed: isWind ? 0 : 1,
      yearVal: isWind ? yt.weather : pdfYear.weatherR,
    });
    html +=
      '<tr><td class="wd688-row-label wd688-indent" colspan="' +
      (rows.length + 2) +
      '">休日数</td></tr>';
    addRow('<span class="wd688-indent2">土　曜・日　曜</span>', function (r) {
      return r.weekends;
    }, { yearVal: yt.weekends });
    addRow('<span class="wd688-indent2">祝　日・祭　日</span>', function (r) {
      return r.weekdayHol;
    }, { yearVal: yt.weekdayHol });
    addRow('<span class="wd688-indent2">年　末　年　始</span>', function (r) {
      return r.nye;
    }, { inputPrefix: 'nye', field: 'nye', yearVal: yt.nye });
    addRow('<span class="wd688-indent2">G　W</span>', function (r) {
      return r.gw;
    }, { inputPrefix: 'gw', field: 'gw', yearVal: yt.gw });
    addRow('<span class="wd688-indent2">夏　休　み</span>', function (r) {
      return r.summer;
    }, { inputPrefix: 'summer', field: 'summer', yearVal: yt.summer });
    addRow('<span class="wd688-indent2">計</span>', function (r) {
      return r.D;
    }, { yearVal: yt.D });
    addRow(overlapLabel, overlapVal, {
      fixed: isWind ? 2 : 1,
      yearVal: isWind ? yt.overlap : pdfYear.overlap,
    });
    addRow('暦　　　　　日', function (r) {
      return r.C;
    }, { yearVal: yt.C });
    addRow('稼　働　可　能　日　数　※3', availVal, {
      fixed: isWind ? 2 : 1,
      yearVal: isWind ? yt.avail : pdfYear.avail,
    });
    addRow('不　稼　働　率　※4', rateVal, { pct: true, yearVal: yt.rate });
    if (!isWind) {
      addRow(
        '雨休率（％）',
        function (r) {
          return paintPdfMonth(r).ratePct;
        },
        { rainPctInt: true, yearVal: pdfYear.ratePct },
      );
    }

    html += '</tbody></table></div>';
    return html;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paintReportPrintStylesheet() {
    return (
      '*{box-sizing:border-box;}' +
      'body{margin:0;padding:8mm 10mm;font-family:"Yu Gothic","Meiryo",sans-serif;font-size:10pt;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.wd688pr-title{margin:0 0 8px;padding:8px 12px;background:#1e3a8a;color:#fff;text-align:center;font-size:15pt;font-weight:700;letter-spacing:0.04em;}' +
      '.wd688pr-meta{margin:0 0 8px;font-size:9.5pt;line-height:1.55;}' +
      '.wd688pr-meta table{border-collapse:collapse;width:100%;}' +
      '.wd688pr-meta th,.wd688pr-meta td{border:1px solid #666;padding:3px 8px;text-align:left;}' +
      '.wd688pr-meta th{width:18%;background:#f3f4f6;font-weight:600;}' +
      '.wd688pr-sum{width:100%;border-collapse:collapse;margin:6px 0 8px;font-size:8.5pt;table-layout:fixed;}' +
      '.wd688pr-sum th,.wd688pr-sum td{border:1px solid #333;padding:2px 2px;text-align:center;vertical-align:middle;line-height:1.3;}' +
      '.wd688pr-sum th{background:#d9e2ec;font-weight:600;}' +
      '.wd688pr-sum .wd688pr-lab{text-align:left;padding-left:5px;min-width:10em;font-weight:600;background:#f8fafc;}' +
      '.wd688pr-sum .wd688pr-indent{padding-left:1.2em;font-weight:500;}' +
      '.wd688pr-sum .wd688pr-year{background:#fffbeb;font-weight:700;}' +
      '.wd688pr-notes{margin:4px 0 10px;font-size:8pt;line-height:1.5;color:#222;}' +
      '.wd688pr-notes p{margin:0 0 2px;}' +
      '.wd688pr-cal-section{margin-top:8px;}' +
      '.wd688pr-cal-year{margin:10px 0 4px;font-size:11pt;font-weight:700;}' +
      '.wd688pr-cal-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 8px;margin-bottom:6px;}' +
      '.wd688pr-cal{border:1px solid #444;padding:3px 4px 4px;min-width:0;}' +
      '.wd688pr-cal-mnum{margin:0 0 2px;text-align:center;font-size:10pt;font-weight:700;}' +
      '.wd688pr-cal-t{width:100%;border-collapse:collapse;font-size:7pt;table-layout:fixed;}' +
      '.wd688pr-cal-t th,.wd688pr-cal-t td{border:1px solid #999;text-align:center;padding:0;line-height:13px;height:13px;}' +
      '.wd688pr-cal-t th{background:#e8eef4;font-weight:600;font-size:6.5pt;}' +
      '.wd688pr-cal-t .wd688pr-d-sat{color:#1d4ed8;}' +
      '.wd688pr-cal-t .wd688pr-d-sun,.wd688pr-cal-t .wd688pr-d-hol{color:#dc2626;font-weight:600;}' +
      '.wd688pr-cal-t .wd688pr-d-rain{background:#dbeafe;}' +
      '.wd688pr-cal-t .wd688pr-d-empty{background:#fafafa;}' +
      '.wd688pr-cal-stats{width:100%;border-collapse:collapse;margin-top:2px;font-size:7.5pt;table-layout:fixed;}' +
      '.wd688pr-cal-stats td{border:1px solid #999;padding:1px 3px;line-height:1.25;vertical-align:middle;}' +
      '.wd688pr-cal-stats .wd688pr-sl{width:68%;text-align:left;white-space:normal;word-break:break-all;}' +
      '.wd688pr-cal-stats .wd688pr-sv{width:32%;text-align:right;font-weight:700;white-space:nowrap;}' +
      '.wd688pr-foot{margin-top:6px;font-size:7.5pt;color:#444;text-align:right;}' +
      '.wd688pr-section{margin-bottom:12px;}' +
      '.wd688pr-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 6px;font-size:7.5pt;}' +
      '.wd688pr-tabs span{border:1px solid #94a3b8;padding:2px 6px;background:#f1f5f9;border-radius:3px 3px 0 0;}' +
      '.wd688pr-tabs .wd688pr-tab-active{background:#1e3a8a;color:#fff;border-color:#1e3a8a;font-weight:700;}' +
      '.wd688pr-meta-line{margin:0 0 6px;font-size:9pt;}' +
      '.wd688pr-5yr-block{margin:8px 0;}' +
      '.wd688pr-5yr-block h3{margin:0 0 4px;font-size:9pt;font-weight:700;}' +
      '#wd688-print-portal{display:none;}' +
      '@media print{' +
      '@page{size:A4 landscape;margin:7mm;}' +
      'body{padding:0!important;}' +
      'body *{visibility:hidden!important;}' +
      '#wd688-print-portal,#wd688-print-portal *{visibility:visible!important;}' +
      '#wd688-print-portal{display:block!important;position:absolute;left:0;top:0;width:100%;}' +
      '.wd688pr-section{page-break-after:always;}' +
      '.wd688pr-section:last-child{page-break-after:auto;}' +
      '}'
    );
  }

  var WD688_PRINT_TABS = [
    '工事稼働日管理 (塗装)',
    '工事稼働日管理 (足場)',
    '工事稼働日管理 (休日)',
    '過去5年月別降雨日数',
    '過去5年月別風速日数',
  ];

  function sheetTabsHtml(activeTab) {
    var out = '<div class="wd688pr-tabs">';
    for (var i = 0; i < WD688_PRINT_TABS.length; i += 1) {
      var t = WD688_PRINT_TABS[i];
      out +=
        '<span' +
        (t === activeTab ? ' class="wd688pr-tab-active"' : '') +
        '>' +
        escHtml(t) +
        '</span>';
    }
    return out + '</div>';
  }

  function injectPrintPortalCss() {
    if (document.getElementById('wd688-print-portal-css')) return;
    var st = document.createElement('style');
    st.id = 'wd688-print-portal-css';
    st.textContent = paintReportPrintStylesheet();
    document.head.appendChild(st);
  }

  function ensurePrintPortal() {
    var el = document.getElementById('wd688-print-portal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'wd688-print-portal';
    document.body.appendChild(el);
    return el;
  }

  var WD688_PRINT_AFTERPRINT_BOUND = false;

  function bindPrintPortalCleanup() {
    if (WD688_PRINT_AFTERPRINT_BOUND) return;
    WD688_PRINT_AFTERPRINT_BOUND = true;
    window.addEventListener(
      'afterprint',
      function () {
        var p = document.getElementById('wd688-print-portal');
        if (p) p.innerHTML = '';
      },
      false,
    );
  }

  function buildWindDaySetForYear(year, windRows, threshold) {
    const set = new Set();
    const prefix = String(year) + '-';
    const th = Number(threshold) || 10;
    const rows = windRows || [];
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r.date || !r.date.startsWith(prefix)) continue;
      if (Number(r.value) >= th) set.add(r.date);
    }
    return set;
  }

  function buildRainDaySetForYear(year, rainRows, threshold) {
    const set = new Set();
    const prefix = String(year) + '-';
    const th = Number(threshold) || 10;
    const rows = rainRows || [];
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r.date || !r.date.startsWith(prefix)) continue;
      if (Number(r.value) >= th) set.add(r.date);
    }
    return set;
  }

  function calendarDayClass(year, month, day, rainSet) {
    const iso = toIso({ y: year, mo: month, d: day });
    const dt = new Date(Date.UTC(year, month - 1, day, 12));
    const dow = dt.getUTCDay();
    const hol = nationalHolidaySet(year);
    const cls = [];
    if (rainSet.has(iso)) cls.push('wd688pr-d-rain');
    if (dow === 0 || hol.has(iso)) cls.push('wd688pr-d-sun');
    else if (dow === 6) cls.push('wd688pr-d-sat');
    if (hol.has(iso) && dow !== 0 && dow !== 6) cls.push('wd688pr-d-hol');
    return cls.join(' ');
  }

  function calStatRow(label, value) {
    return (
      '<tr><td class="wd688pr-sl">' +
      label +
      '</td><td class="wd688pr-sv">' +
      value +
      '</td></tr>'
    );
  }

  function renderMonthCalendarBlock(year, month, row, mode, markSet) {
    const isWind = mode === 'scaffold';
    const wind = isWind ? windPdfMonth(row) : null;
    const pdf = isWind ? null : paintPdfMonth(row);
    const dim = daysInMonth(year, month);
    const firstDow = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
    const holidayTotal = Math.round(Number(row.D) || 0);
    const weatherVal = isWind ? wind.weatherR : pdf.weatherR;
    const overlapVal = isWind ? wind.overlap : pdf.overlap;
    const availVal = isWind ? wind.avail : pdf.avail;
    const rateVal = isWind ? row.H_rate : row.K_rate;
    const nonWork = Math.round((Number(row.D) || 0) + weatherVal - overlapVal);

    let grid = '<table class="wd688pr-cal-t"><thead><tr>';
    ['日', '月', '火', '水', '木', '金', '土'].forEach(function (w) {
      grid += '<th>' + w + '</th>';
    });
    grid += '</tr></thead><tbody><tr>';
    for (let i = 0; i < firstDow; i += 1) {
      grid += '<td class="wd688pr-d-empty"></td>';
    }
    for (let d = 1; d <= dim; d += 1) {
      const pos = (firstDow + d - 1) % 7;
      if (d > 1 && pos === 0) grid += '</tr><tr>';
      const cls = calendarDayClass(year, month, d, markSet);
      grid += '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + d + '</td>';
    }
    const tail = (firstDow + dim) % 7;
    if (tail !== 0) {
      for (let i = tail; i < 7; i += 1) {
        grid += '<td class="wd688pr-d-empty"></td>';
      }
    }
    grid += '</tr></tbody></table>';

    let stats =
      '<table class="wd688pr-cal-stats"><colgroup><col style="width:68%"><col style="width:32%"></colgroup>' +
      calStatRow('暦日', row.C + '日') +
      calStatRow('休日数', holidayTotal + '日');
    if (isWind) {
      stats +=
        calStatRow('風速日数', fmtNum(weatherVal, 1) + '日') +
        calStatRow('休日数と風速日数のダブり日数', fmtNum(overlapVal, 1) + '日') +
        calStatRow('稼働可能日数', fmtNum(availVal, 1) + '日') +
        calStatRow('不稼働率', fmtPct(rateVal)) +
        calStatRow('不稼働日', nonWork + '日');
    } else {
      stats +=
        calStatRow('降雨日数', fmtNum(weatherVal, 1) + '日') +
        calStatRow('休日数と降雨日数のダブり日数', fmtNum(overlapVal, 1) + '日') +
        calStatRow('稼働可能日数', fmtNum(availVal, 1) + '日') +
        calStatRow('不稼働率', fmtPct(rateVal)) +
        calStatRow('雨休率（％）', fmtRainHolidayPct(pdf.ratePct)) +
        calStatRow('不稼働日', nonWork + '日');
    }
    stats += '</table>';

    return (
      '<div class="wd688pr-cal">' +
      '<p class="wd688pr-cal-mnum">' +
      month +
      '</p>' +
      grid +
      stats +
      '</div>'
    );
  }

  function renderCalendarYearSection(year, rows, mode, markSet) {
    let html = '<p class="wd688pr-cal-year">' + year + '年</p>';
    for (let start = 1; start <= 12; start += 3) {
      html += '<div class="wd688pr-cal-row">';
      for (let m = start; m < start + 3; m += 1) {
        const row = rows.find(function (r) {
          return r.m === m;
        });
        if (row) html += renderMonthCalendarBlock(year, m, row, mode, markSet);
      }
      html += '</div>';
    }
    return html;
  }

  function buildPrintSummaryTable(rows, mode, opts) {
    opts = opts || {};
    const isWind = mode === 'scaffold';
    const isHoliday = mode === 'holiday';
    const yt = computeYearTotals(rows, isWind);
    const pdfYear = isWind ? null : paintPdfYear(yt);
    const windYear = isWind ? windPdfYear(yt) : null;
    const rainTh = opts.rainTh != null ? opts.rainTh : 10;
    const windTh = opts.windTh != null ? opts.windTh : 10;

    function monthCells(fn, cellOpts) {
      cellOpts = cellOpts || {};
      let out = '';
      for (let i = 0; i < rows.length; i += 1) {
        const v = fn(rows[i], i);
        if (cellOpts.pct) out += '<td>' + fmtPct(v) + '</td>';
        else if (cellOpts.rainPctInt) out += '<td>' + fmtRainHolidayPct(v) + '</td>';
        else if (cellOpts.fixed != null) out += '<td>' + fmtNum(v, cellOpts.fixed) + '</td>';
        else out += '<td>' + escHtml(v) + '</td>';
      }
      return out;
    }

    function yearCell(v, cellOpts) {
      cellOpts = cellOpts || {};
      if (cellOpts.pct) return '<td class="wd688pr-year">' + fmtPct(v) + '</td>';
      if (cellOpts.rainPctInt) return '<td class="wd688pr-year">' + fmtRainHolidayPct(v) + '</td>';
      if (cellOpts.fixed != null) return '<td class="wd688pr-year">' + fmtNum(v, cellOpts.fixed) + '</td>';
      return '<td class="wd688pr-year">' + escHtml(v) + '</td>';
    }

    function holidayAvail(r) {
      return (Number(r.C) || 0) - (Number(r.D) || 0);
    }

    function holidayRate(r) {
      const avail = holidayAvail(r);
      return avail ? (Number(r.D) || 0) / avail : 0;
    }

    let sum =
      '<table class="wd688pr-sum"><thead><tr>' +
      '<th class="wd688pr-lab">項目</th>';
    for (let i = 0; i < rows.length; i += 1) {
      sum += '<th>' + rows[i].m + '月</th>';
    }
    sum += '<th class="wd688pr-year">年</th></tr></thead><tbody>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">風速日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        windTh +
        'm/s以上・過去5年月平均)</span></td>' +
        monthCells(function (r) {
          return windPdfMonth(r).weatherR;
        }, { fixed: 1 }) +
        yearCell(windYear.weatherR, { fixed: 1 }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">降雨日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        rainTh +
        'mm以上)</span></td>' +
        monthCells(function () {
          return 0;
        }) +
        yearCell(0) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">降雨日数 ※1<br><span style="font-size:8pt;font-weight:normal">(' +
        rainTh +
        'mm以上・過去5年月平均)</span></td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).weatherR;
        }, { fixed: 1 }) +
        yearCell(pdfYear.weatherR, { fixed: 1 }) +
        '</tr>';
    }

    sum +=
      '<tr><td class="wd688pr-lab" colspan="' +
      (rows.length + 2) +
      '">休日数</td></tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">土　曜・日　曜</td>' +
      monthCells(function (r) {
        return r.weekends;
      }) +
      yearCell(yt.weekends) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">祝　日・祭　日</td>' +
      monthCells(function (r) {
        return r.weekdayHol;
      }) +
      yearCell(yt.weekdayHol) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">年　末　年　始</td>' +
      monthCells(function (r) {
        return r.nye;
      }) +
      yearCell(yt.nye) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">G　W</td>' +
      monthCells(function (r) {
        return r.gw;
      }) +
      yearCell(yt.gw) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">夏　休　み</td>' +
      monthCells(function (r) {
        return r.summer;
      }) +
      yearCell(yt.summer) +
      '</tr>';
    sum +=
      '<tr><td class="wd688pr-lab wd688pr-indent">計</td>' +
      monthCells(function (r) {
        return r.D;
      }) +
      yearCell(yt.D) +
      '</tr>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と風速日数のダブり ※2</td>' +
        monthCells(function (r) {
          return windPdfMonth(r).overlap;
        }, { fixed: 1 }) +
        yearCell(windYear.overlap, { fixed: 1 }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と降雨日数のダブり ※2</td>' +
        monthCells(function () {
          return 0;
        }, { fixed: 1 }) +
        yearCell(0, { fixed: 1 }) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">休日数と降雨日数のダブり ※2</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).overlap;
        }, { fixed: 1 }) +
        yearCell(pdfYear.overlap, { fixed: 1 }) +
        '</tr>';
    }

    sum +=
      '<tr><td class="wd688pr-lab">暦　　　　　日</td>' +
      monthCells(function (r) {
        return r.C;
      }) +
      yearCell(yt.C) +
      '</tr>';

    if (isWind) {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return windPdfMonth(r).avail;
        }, { fixed: 1 }) +
        yearCell(windYear.avail, { fixed: 1 }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return r.H_rate;
        }, { pct: true }) +
        yearCell(yt.rate, { pct: true }) +
        '</tr>';
    } else if (isHoliday) {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return holidayAvail(r);
        }) +
        yearCell(yt.C - yt.D) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return holidayRate(r);
        }, { pct: true }) +
        yearCell(yt.D && yt.C - yt.D ? yt.D / (yt.C - yt.D) : 0, { pct: true }) +
        '</tr>';
    } else {
      sum +=
        '<tr><td class="wd688pr-lab">稼　働　可　能　日　数　※3</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).avail;
        }, { fixed: 1 }) +
        yearCell(pdfYear.avail, { fixed: 1 }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">不　稼　働　率　※4</td>' +
        monthCells(function (r) {
          return r.K_rate;
        }, { pct: true }) +
        yearCell(yt.rate, { pct: true }) +
        '</tr>' +
        '<tr><td class="wd688pr-lab">雨休率（％）</td>' +
        monthCells(function (r) {
          return paintPdfMonth(r).ratePct;
        }, { rainPctInt: true }) +
        yearCell(pdfYear.ratePct, { rainPctInt: true }) +
        '</tr>';
    }

    sum += '</tbody></table>';
    return sum;
  }

  function buildPrintFootnotes(mode, pastLabel, rainTh, windTh) {
    if (mode === 'scaffold') {
      return (
        '<div class="wd688pr-notes">' +
        '<p>※1　風速日数は、見積作成年の過去5年間（' +
        escHtml(pastLabel) +
        '）の月平均日数（' +
        escHtml(windTh) +
        'm/s以上の日数）です。</p>' +
        '<p>※2　休日数と風速日数のダブり＝風速日数×（休日数÷暦日数）</p>' +
        '<p>※3　稼働可能日数＝暦日数－（休日数＋風速日数－ダブり）</p>' +
        '<p>※4　不稼働率＝（休日数＋風速日数－ダブり）÷稼働可能日数</p>' +
        '</div>'
      );
    }
    if (mode === 'holiday') {
      return (
        '<div class="wd688pr-notes">' +
        '<p>※1　上段表は休日数のみ（降雨日数は0）。カレンダー下は月別の降雨・休日内訳です。</p>' +
        '<p>※2　休日数と降雨日数のダブり＝降雨日数×（休日数÷暦日数）</p>' +
        '<p>※3　稼働可能日数＝暦日数－休日数（休日シート上段）</p>' +
        '<p>※4　不稼働率＝休日数÷稼働可能日数（休日シート上段）</p>' +
        '</div>'
      );
    }
    return (
      '<div class="wd688pr-notes">' +
      '<p>※1　降雨日数は、見積作成年の過去5年間（' +
      escHtml(pastLabel) +
      '）の月平均日数（' +
      escHtml(rainTh) +
      'mm以上の日数）です。</p>' +
      '<p>※2　休日数と降雨日数のダブり＝降雨日数×（休日数÷暦日数）</p>' +
      '<p>※3　稼働可能日数＝暦日数－休日数－降雨日数＋ダブり</p>' +
      '<p>※4　不稼働率＝（休日数＋降雨日数－ダブり）÷稼働可能日数</p>' +
      '<p>　　雨休率（％）＝（休日数＋降雨日数－ダブり）÷稼働可能日数（整数％・工期設定資料p.94）</p>' +
      '</div>'
    );
  }

  function buildWorkdaysMgmtPrintSection(config) {
    const rows = sortMonthlyRows(config.rows || []);
    const calYear = config.calYear;
    const mode = config.mode;
    const markSet = config.markSet || new Set();
    const calMode = mode === 'scaffold' ? 'scaffold' : 'paint';

    return (
      '<div class="wd688pr-section">' +
      sheetTabsHtml(config.sheetTab) +
      '<h1 class="wd688pr-title">' +
      escHtml(config.sheetTab) +
      '</h1>' +
      buildPrintSummaryTable(rows, mode, {
        rainTh: config.rainTh,
        windTh: config.windTh,
      }) +
      buildPrintFootnotes(mode, config.pastLabel, config.rainTh, config.windTh) +
      '<section class="wd688pr-cal-section">' +
      renderCalendarYearSection(calYear, rows, calMode, markSet) +
      '</section></div>'
    );
  }

  function renderPrintOne5yrTable(refBlock, title, estimateYear) {
    if (!refBlock || !refBlock.months) {
      return '<p style="color:#888">' + escHtml(title) + ' — データなし</p>';
    }
    const built = build5yrMonthlyAverages(refBlock, estimateYear);
    const years = built.years;
    const months = built.months.slice().sort(function (a, b) {
      return a.m - b.m;
    });

    let html =
      '<div class="wd688pr-5yr-block"><h3>' +
      escHtml(title) +
      '</h3><table class="wd688pr-sum"><thead><tr>' +
      '<th class="wd688pr-lab">月</th>';
    for (let i = 0; i < years.length; i += 1) {
      html += '<th>' + years[i] + '年</th>';
    }
    html += '<th class="wd688pr-year">平均</th></tr></thead><tbody>';

    for (let i = 0; i < months.length; i += 1) {
      const row = months[i];
      html += '<tr><td class="wd688pr-lab">' + monthLabel(row.m) + '</td>';
      for (let j = 0; j < years.length; j += 1) {
        const y = years[j];
        const v = row.byYear && row.byYear[y] != null ? row.byYear[y] : '—';
        html += '<td>' + escHtml(v) + '</td>';
      }
      html += '<td class="wd688pr-year">' + fmtNum(row.avg, 1) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function buildPrint5yrSection(kind, estYear, pastLabel) {
    const ref = getRef5yr();
    const isWind = kind === 'wind';
    const thresholds = isWind ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
    const sheetTab = isWind ? '過去5年月別風速日数' : '過去5年月別降雨日数';

    let html =
      '<div class="wd688pr-section">' +
      sheetTabsHtml(sheetTab) +
      '<h1 class="wd688pr-title">' +
      escHtml(sheetTab) +
      '</h1>' +
      '<p class="wd688pr-meta-line">' +
      escHtml(ref.location || '大宮地区') +
      '　気象庁過去5年データ（見積作成年 ' +
      escHtml(estYear) +
      '年 → ' +
      escHtml(pastLabel) +
      '）</p>';

    for (let i = 0; i < thresholds.length; i += 1) {
      const th = thresholds[i];
      const key = ref5yrBlockKey(isWind ? 'wind' : 'rain', th);
      html += renderPrintOne5yrTable(ref[key], ref5yrBlockTitle(key), estYear);
    }

    html += '</div>';
    return html;
  }

  function buildFullClientReportHtml() {
    const estYear = state.lastResult.estimateYear || currentEstimateYear();
    const pastYears = state.lastResult.pastYears || pastFiveYearsForEstimate(estYear);
    const pastLabel =
      pastYears.length >= 2
        ? pastYears[0] + '年〜' + pastYears[pastYears.length - 1] + '年'
        : pastYears.join('・');
    const rainTh = state.threshold_rain_mm != null ? state.threshold_rain_mm : 10;
    const windTh = state.threshold_wind_ms != null ? state.threshold_wind_ms : 10;
    const calYear = state.holiday_fiscal_year || estYear;
    const rainRows = sortMonthlyRows(state.lastResult.monthlyRain || []);
    const windRows = sortMonthlyRows(state.lastResult.monthlyWind || []);
    const rainSet = buildRainDaySetForYear(calYear, state.rain, rainTh);
    const windSet = buildWindDaySetForYear(calYear, state.wind, windTh);
    const obsNote = state.obs_location_note ? '（' + state.obs_location_note + '）' : '';

    const meta =
      '<div class="wd688pr-meta"><table>' +
      '<tr><th>工事名</th><td>' +
      escHtml(state.project_name || '—') +
      '</td><th>見積作成年</th><td>' +
      escHtml(estYear) +
      '年</td></tr>' +
      '<tr><th>観測地点</th><td colspan="3">' +
      escHtml(state.obs_location || '—') +
      escHtml(obsNote) +
      '　／　足場 稼働可能日数: <strong>' +
      fmtNum(state.result_scaffold_days, 2) +
      ' 日</strong>　／　塗装: <strong>' +
      fmtNum(state.result_paint_days, 2) +
      ' 日</strong></td></tr></table></div>';

    return (
      meta +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (塗装)',
        rows: rainRows,
        mode: 'paint',
        calYear: calYear,
        markSet: rainSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (足場)',
        rows: windRows,
        mode: 'scaffold',
        calYear: calYear,
        markSet: windSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildWorkdaysMgmtPrintSection({
        sheetTab: '工事稼働日管理 (休日)',
        rows: rainRows,
        mode: 'holiday',
        calYear: calYear,
        markSet: rainSet,
        pastLabel: pastLabel,
        rainTh: rainTh,
        windTh: windTh,
      }) +
      buildPrint5yrSection('rain', estYear, pastLabel) +
      buildPrint5yrSection('wind', estYear, pastLabel)
    );
  }

  function buildPaintClientReportHtml() {
    return buildFullClientReportHtml();
  }

  function openPaintClientReportPrint() {
    try {
      readFormIntoState();
      runCalc();
      if (
        !state.lastResult ||
        !state.lastResult.monthlyRain ||
        !state.lastResult.monthlyRain.length ||
        !state.lastResult.monthlyWind ||
        !state.lastResult.monthlyWind.length
      ) {
        alert('算出結果がありません。「再算出」後にお試しください。');
        return;
      }
      var html = buildFullClientReportHtml();
      if (!html || html.indexOf('wd688pr-sum') < 0) {
        throw new Error('報告HTMLの生成に失敗しました');
      }
      injectPrintPortalCss();
      bindPrintPortalCleanup();
      var portal = ensurePrintPortal();
      portal.innerHTML = html;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          try {
            window.print();
          } catch (err) {
            console.warn(BUILD, err);
            alert('印刷を開始できませんでした: ' + (err.message || err));
          }
        });
      });
    } catch (e) {
      alert('印刷の準備に失敗しました: ' + (e.message || e));
      console.error(BUILD, e);
    }
  }

  function sortMonthlyRows(rows) {
    return rows.slice().sort(function (a, b) {
      return a.m - b.m;
    });
  }

  function renderOne5yrTable(refBlock, title, estimateYear) {
    if (!refBlock || !refBlock.months) {
      return '<p style="color:#888">' + title + ' — データなし</p>';
    }
    const built = build5yrMonthlyAverages(refBlock, estimateYear);
    const years = built.years;
    const months = built.months.slice().sort(function (a, b) {
      return a.m - b.m;
    });

    let html =
      '<h4 style="margin:16px 0 8px;font-size:13px;">' +
      title +
      '</h4>' +
      '<div class="wd688-excel-wrap"><table class="wd688-table wd688-excel-table"><thead><tr>' +
      '<th class="wd688-row-label">月</th>';
    for (let i = 0; i < years.length; i += 1) {
      html += '<th>' + years[i] + '年</th>';
    }
    html += '<th class="wd688-year-col">平均</th></tr></thead><tbody>';

    for (let i = 0; i < months.length; i += 1) {
      const row = months[i];
      html += '<tr><td class="wd688-row-label">' + monthLabel(row.m) + '</td>';
      for (let j = 0; j < years.length; j += 1) {
        const y = years[j];
        const v = row.byYear && row.byYear[y] != null ? row.byYear[y] : '—';
        html += '<td>' + v + '</td>';
      }
      html += '<td class="wd688-year-col">' + fmtNum(row.avg, 1) + '</td></tr>';
    }
    html += '</tbody></table></div>';
    if (built.missingYears.length) {
      html +=
        '<p style="color:#b45309;font-size:11px;margin:4px 0 0;">不足年: ' +
        built.missingYears.join(', ') +
        '</p>';
    }
    return html;
  }

  function render5yrReferenceTable(kind) {
    const estimateYear = currentEstimateYear();
    const ref = getRef5yr();
    const isWind = kind === 'wind';
    const thresholds = isWind ? REF5YR_WIND_THRESHOLDS : REF5YR_RAIN_THRESHOLDS;
    const sectionTitle = isWind ? '過去5年月別風速日数' : '過去5年月別降雨日数';
    const period = isWind ? ref.windPeriod : ref.rainPeriod;

    let html =
      '<div style="font-size:13px;line-height:1.6;margin-bottom:10px;">' +
      '<strong>' +
      sectionTitle +
      '</strong>（' +
      ref.location +
      '・見積作成年 <strong>' +
      estimateYear +
      '年</strong> → 対象 <strong>' +
      pastFiveYearsForEstimate(estimateYear).join('・') +
      '年</strong>' +
      (period ? '／登録データ: ' + period : '') +
      '）</div>';
    if (ref.updatedFromCsv) {
      html +=
        '<p style="font-size:12px;color:#047857;margin:0 0 10px;">CSV取込反映日: ' +
        ref.updatedFromCsv +
        '</p>';
    }

    for (let i = 0; i < thresholds.length; i += 1) {
      const th = thresholds[i];
      const key = ref5yrBlockKey(isWind ? 'wind' : 'rain', th);
      html += renderOne5yrTable(ref[key], ref5yrBlockTitle(key), estimateYear);
    }

    html +=
      '<p style="font-size:12px;color:#64748b;margin:12px 0 0;">' +
      '※ 足場・塗装の ※1 には <strong>≧10m/s</strong>・<strong>≧10mm</strong> の平均列を使用。上記は Excel シートと同様の全閾値表です。' +
      ' CSV取込で全表が自動更新されます。' +
      '</p>';
    return html;
  }

  function renderMonthlyTable() {
    const host = document.getElementById('wd688-monthly');
    if (!host) return;

    if (activeTab === 'ref-wind') {
      host.innerHTML = render5yrReferenceTable('wind');
      return;
    }
    if (activeTab === 'ref-rain') {
      host.innerHTML = render5yrReferenceTable('rain');
      return;
    }

    if (!state.lastResult) {
      host.innerHTML =
        '<p style="color:#666">「再算出」で月別内訳を表示します（Excel 20260613 準拠・常に1〜12月）</p>';
      return;
    }

    const estYear = state.lastResult.estimateYear || currentEstimateYear();
    const pastYears = state.lastResult.pastYears ? state.lastResult.pastYears.join('・') : '—';
    let rows;
    if (activeTab === 'scaffold') {
      rows = sortMonthlyRows(state.lastResult.monthlyWind || []);
    } else {
      rows = sortMonthlyRows(state.lastResult.monthlyRain || []);
    }
    if (rows.length !== 12) {
      host.innerHTML = '<p style="color:#c00">月別データが12ヶ月分揃っていません。</p>';
      return;
    }

    let intro =
      '<p style="font-size:12px;color:#555;margin:0 0 8px;">' +
      '見積作成年 <strong>' +
      estYear +
      '年</strong>（休日・暦日基準）／過去5年 <strong>' +
      pastYears +
      '年</strong> の月平均を ※1 に使用。表は1月〜12月固定。GW・夏休み・年末年始はセル内編集可（編集後は再算出）。' +
      '</p>';

    if (activeTab === 'scaffold') {
      host.innerHTML = intro + renderExcelTransposedTable(rows, 'scaffold');
    } else if (activeTab === 'paint' || activeTab === 'holiday') {
      host.innerHTML = intro + renderExcelTransposedTable(rows, 'paint');
    }

    const inputs = host.querySelectorAll('.wd688-hm-in');
    for (let j = 0; j < inputs.length; j += 1) {
      inputs[j].addEventListener('change', markDirty);
    }
  }

  function updateTabButtons() {
    ['scaffold', 'paint', 'holiday', 'ref-wind', 'ref-rain'].forEach(function (tab) {
      const btn = document.getElementById('wd688-tab-' + tab);
      if (!btn) return;
      if (tab === activeTab) {
        btn.classList.add('wd688-tab-active');
      } else {
        btn.classList.remove('wd688-tab-active');
      }
    });
  }

  function switchTab(tab) {
    if (tab === 'holiday') readHolidayManualFromForm();
    activeTab = tab;
    updateTabButtons();
    renderMonthlyTable();
  }

  function refreshProjectSelect(projects, selectedId) {
    const sel = document.getElementById('wd688-project-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— 案件を選択 —</option>';
    for (let i = 0; i < projects.length; i += 1) {
      const p = projects[i];
      const id = p.$id && p.$id.value;
      const name = gv(p, FC.project) || '（名称なし）';
      let est = gv(p, FC.estimate);
      if (est === '') est = gv(p, FC.fiscal);
      if (est === '') {
        const start = String(gv(p, FC.start)).slice(0, 10);
        if (start) est = start.slice(0, 4);
      }
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = '#' + id + ' ' + name + (est ? ' (' + est + '年見積)' : '');
      if (String(id) === String(selectedId)) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function loadRecord(id) {
    if (state.dirty && !window.confirm('未保存の変更があります。案件を切り替えますか？')) {
      return Promise.resolve();
    }
    return apiGetRecord(id).then(function (resp) {
      state = stateFromKintone(resp.record);
      try {
        sessionStorage.setItem(SESSION_RECORD_KEY, String(id));
      } catch (_e) {
        /* noop */
      }
      fillFormFromState();
      try {
        runCalc();
        fillFormFromState();
      } catch (_e2) {
        /* 再算出不可時は保存値のみ表示 */
      }
    });
  }

  function saveTo687() {
    readFormIntoState();
    if (!state.project_name.trim()) throw new Error('工事名を入力してください');
    if (state.estimate_year == null) throw new Error('見積作成年を入力してください');
    if (!state.lastResult) runCalc();
    const record = stateToKintoneRecord(state, true);
    if (state.recordId) {
      return apiPutRecord(state.recordId, state.revision, record).then(function (resp) {
        state.revision = resp.revision;
        state.dirty = false;
        state.calculated_at = new Date().toISOString();
        updateDirtyBanner();
        alert('保存しました（案件ID: ' + state.recordId + '）');
        return loadProjectList();
      });
    }
    return apiPostRecord(record).then(function (resp) {
      state.recordId = String(resp.id);
      state.revision = resp.revision;
      state.dirty = false;
      try {
        sessionStorage.setItem(SESSION_RECORD_KEY, state.recordId);
      } catch (_e) {
        /* noop */
      }
      alert('新規案件を作成しました（ID: ' + state.recordId + '）');
      return loadProjectList().then(function () {
        return loadRecord(state.recordId);
      });
    });
  }

  function loadProjectList() {
    return apiListProjects().then(function (resp) {
      refreshProjectSelect(resp.records || [], state.recordId);
    });
  }

  function createNewProject() {
    if (state.dirty && !window.confirm('未保存の変更があります。新規案件を作成しますか？')) return;
    const year = Number(todayJstYmd().slice(0, 4));
    state = emptyState();
    state.project_name = '新規案件';
    state.estimate_year = year;
    state.threshold_wind_ms = 10;
    state.threshold_rain_mm = 10;
    state.holiday_fiscal_year = year;
    syncRef5yrFromDaily();
    state.dirty = true;
    activeTab = 'scaffold';
    fillFormFromState();
    const sel = document.getElementById('wd688-project-select');
    if (sel) sel.value = '';
  }

  function injectHideListCss() {
    if (document.getElementById('wd688-hide-list-css')) return;
    const st = document.createElement('style');
    st.id = 'wd688-hide-list-css';
    st.textContent =
      '.gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia{display:none !important;}' +
      '.wd688-table{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0;}' +
      '.wd688-table th,.wd688-table td{border:1px solid #ccc;padding:4px 8px;text-align:right;}' +
      '.wd688-table th{background:#f0f4f8;text-align:center;}' +
      '.wd688-excel-wrap{overflow-x:auto;margin:8px 0;}' +
      '.wd688-excel-table .wd688-row-label{text-align:left;min-width:200px;background:#f8fafc;font-weight:600;white-space:nowrap;}' +
      '.wd688-excel-table .wd688-year-col{background:#fffbeb;font-weight:600;}' +
      '.wd688-excel-table .wd688-indent{font-weight:bold;background:#eef2f7;text-align:left;}' +
      '.wd688-sub{font-size:11px;color:#64748b;font-weight:normal;}' +
      '.wd688-indent2{padding-left:1.2em;display:inline-block;}' +
      '.wd688-root{font-family:Segoe UI,Meiryo,sans-serif;max-width:1200px;margin:0 auto;padding:12px;}' +
      '.wd688-tabs{display:flex;gap:4px;margin:12px 0 8px;flex-wrap:wrap;}' +
      '.wd688-tab{padding:8px 18px;cursor:pointer;border:1px solid #94a3b8;border-radius:6px 6px 0 0;background:#f1f5f9;font-size:13px;font-weight:600;}' +
      '.wd688-tab.wd688-tab-active{background:#2563eb;color:#fff;border-color:#2563eb;}';
    document.head.appendChild(st);
  }

  function csvHelpHtml() {
    return (
      '<div style="font-weight:bold;margin-bottom:10px;font-size:14px;">気象データの入手（過去5年・気象庁）</div>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '※1 の気象日数は、<strong>見積作成年の直前5年間</strong>の日別データから求めた<strong>月別平均日数</strong>です。' +
      '見積作成年を入力すると対象年が決まります（例: <strong>2026年</strong>見積 → <strong>2021・2022・2023・2024・2025年</strong>）。' +
      '算出には組込の参照表（タブ「過去5年(風速)」「過去5年(降雨)」）を使います。下記は打合せ資料との照合・監査用に、気象庁から同じ期間の CSV を取得する手順です。' +
      '</p>' +
      '<p style="margin:0 0 12px;padding:10px 12px;background:#f1f5f9;border-radius:6px;line-height:1.75;font-size:12px;">' +
      '<strong>共通手順（気象庁・過去の気象データダウンロード）</strong><br>' +
      '1. サイトを開く：<a href="' +
      JMA_OBSDL +
      '" target="_blank" rel="noopener">' +
      JMA_OBSDL +
      '</a><br>' +
      '2. <strong>地点</strong> … 案件の観測地点を選択（大宮地区の場合は<strong>埼玉</strong>など近傍の観測所）<br>' +
      '3. <strong>期間</strong> … 見積作成年の <strong>5年前の1月1日</strong> 〜 <strong>昨年の12月31日</strong>（上記例なら 2021/1/1〜2025/12/31）。年ごとに分けて取得しても可<br>' +
      '4. <strong>項目</strong> … 「<strong>日別値</strong>」を選択<br>' +
      '5. 下記の気象要素を選び CSV ダウンロード →「CSV→風速」「CSV→降雨」で取込（<strong>全閾値表が自動更新</strong>・再算出可能）' +
      '</p>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '<strong>① 風速（足場・※1）</strong><br>' +
      '気象要素：<strong>日最大風速 (m/s)</strong><br>' +
      '数え方：各日の値が <strong>10m/s 以上</strong> の日を1日とカウント → 月ごとに集計 → 5年分の同月平均（小数可）<br>' +
      'CSV形式：<strong>日付・風速の2列</strong>（ヘッダ行は自動スキップ）' +
      '</p>' +
      '<p style="margin:0 0 12px;line-height:1.75;">' +
      '<strong>② 降雨（塗装・休日・※1）</strong><br>' +
      '気象要素：<strong>降水量の日合計 (mm)</strong>（日別値の1日合計＝日降水量。サイトによって「降水量の合計」と表記される場合も同じ項目）<br>' +
      '数え方：各日の値が <strong>10mm 以上</strong> の日を1日とカウント → 月ごとに集計 → 5年分の同月平均<br>' +
      'CSV形式：<strong>日付・降水量の2列</strong>' +
      '</p>' +
      '<p style="margin:0;line-height:1.75;font-size:12px;color:#475569;">' +
      '<strong>過去5年表の見方</strong> … タブ「過去5年(風速)」「過去5年(降雨)」に Excel シートと同じ<strong>全閾値表</strong>（風速: ≧10/15/20/30m/s、降雨: ≧1/10/30/50/70/100mm）を表示します。' +
      ' CSV を取込むと登録済みデータが更新され、見積作成年に応じた5年分の平均列が再計算されます。' +
      '</p>'
    );
  }

  function buildDashboard() {
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) return;
    header.innerHTML = '';
    injectHideListCss();
    injectPrintPortalCss();
    bindPrintPortalCleanup();

    const root = document.createElement('div');
    root.className = 'wd688-root';
    root.id = 'wd688-root';

    const obsOpts = OBS_OPTIONS.map(function (o) {
      return '<option value="' + o + '">' + o + '</option>';
    }).join('');

    root.innerHTML =
      '<div id="wd688-dirty" style="display:none;padding:10px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;margin-bottom:10px;font-size:13px;"></div>' +
      '<div style="margin-bottom:12px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;line-height:1.65;">' +
      '<strong style="font-size:15px">工事稼働日数計算ツール</strong><br>' +
      '見積作成年・観測地点を入力し「再算出」→「保存」してください。表は常に<strong>1月〜12月</strong>。※1 気象日数は見積作成年の<strong>直前5年間</strong>の月平均です（例: 2026年見積 → 2021〜2025年）。休日は自動＋GW/夏/年末年始は表内で編集できます。' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;">' +
      '<strong style="font-size:16px">工事稼働日数ダッシュ</strong>' +
      '<span style="font-size:11px;color:#666">' +
      BUILD +
      '</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center;">' +
      '<select id="wd688-project-select" style="min-width:280px;padding:6px"></select>' +
      '<button type="button" id="wd688-load" class="kintoneplugin-button-normal">読込</button>' +
      '<button type="button" id="wd688-new" class="kintoneplugin-button-normal">新規案件</button></div>' +
      '<div class="wd688-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:12px;font-size:13px;">' +
      '<label>工事名<br><input id="wd688-project" type="text" style="width:100%"></label>' +
      '<label>見積作成年<br><input id="wd688-estimate" type="number" min="2000" max="2100" step="1" style="width:100%"></label>' +
      '<label>観測地点<br><select id="wd688-obs" style="width:100%">' +
      obsOpts +
      '</select></label>' +
      '<label>地点備考<br><input id="wd688-obs-note" type="text" style="width:100%"></label>' +
      '<label>風速閾値(m/s)<br><input id="wd688-wind-th" type="number" step="0.1" style="width:100%"></label>' +
      '<label>降雨閾値(mm)<br><input id="wd688-rain-th" type="number" step="0.1" style="width:100%"></label></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0;padding:12px;background:#e8f4fc;border-radius:8px;">' +
      '<div><span style="font-size:12px;color:#555">足場 稼働可能日数</span><br><strong id="wd688-scaffold" style="font-size:22px">—</strong></div>' +
      '<div><span style="font-size:12px;color:#555">塗装 稼働可能日数</span><br><strong id="wd688-paint" style="font-size:22px">—</strong></div>' +
      '<button type="button" id="wd688-calc" class="kintoneplugin-button-dialog-ok">再算出</button>' +
      '<button type="button" id="wd688-save" class="kintoneplugin-button-dialog-ok">保存</button>' +
      '<button type="button" id="wd688-print-paint" class="kintoneplugin-button-normal">施工主報告用印刷</button></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 4px;">' +
      '<span style="font-size:13px;font-weight:bold;color:#334155">気象CSV取込（過去5年表を自動更新）：</span>' +
      '<button type="button" id="wd688-csv-wind" class="kintoneplugin-button-normal">CSV→風速</button>' +
      '<button type="button" id="wd688-csv-rain" class="kintoneplugin-button-normal">CSV→降雨</button></div>' +
      '<div id="wd688-csv-help" style="margin:0 0 14px;padding:12px 14px;background:#fff;border:1px solid #d0d7de;border-radius:8px;font-size:13px;line-height:1.7;color:#1e293b;">' +
      csvHelpHtml() +
      '</div>' +
      '<div class="wd688-tabs">' +
      '<button type="button" class="wd688-tab wd688-tab-active" id="wd688-tab-scaffold">足場</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-paint">塗装</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-holiday">休日</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-ref-wind">過去5年(風速)</button>' +
      '<button type="button" class="wd688-tab" id="wd688-tab-ref-rain">過去5年(降雨)</button></div>' +
      '<div id="wd688-meta" style="font-size:12px;color:#666;margin-bottom:8px"></div>' +
      '<div id="wd688-monthly"></div>' +
      '<input type="file" id="wd688-csv-file" accept=".csv,.txt" style="display:none">';

    header.appendChild(root);

    ['wd688-project', 'wd688-estimate', 'wd688-obs', 'wd688-obs-note', 'wd688-wind-th', 'wd688-rain-th'].forEach(
      function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', markDirty);
      },
    );

    document.getElementById('wd688-tab-scaffold').addEventListener('click', function () {
      switchTab('scaffold');
    });
    document.getElementById('wd688-tab-paint').addEventListener('click', function () {
      switchTab('paint');
    });
    document.getElementById('wd688-tab-holiday').addEventListener('click', function () {
      switchTab('holiday');
    });
    document.getElementById('wd688-tab-ref-wind').addEventListener('click', function () {
      switchTab('ref-wind');
    });
    document.getElementById('wd688-tab-ref-rain').addEventListener('click', function () {
      switchTab('ref-rain');
    });

    document.getElementById('wd688-load').addEventListener('click', function () {
      const id = document.getElementById('wd688-project-select').value;
      if (!id) {
        alert('案件を選択してください');
        return;
      }
      loadRecord(id).catch(function (e) {
        alert('読込失敗: ' + (e.message || e));
      });
    });

    document.getElementById('wd688-new').addEventListener('click', createNewProject);

    document.getElementById('wd688-calc').addEventListener('click', function () {
      try {
        readFormIntoState();
        runCalc();
        fillFormFromState();
        alert('再算出しました');
      } catch (e) {
        alert('算出エラー: ' + (e.message || e));
      }
    });

    document.getElementById('wd688-save').addEventListener('click', function () {
      saveTo687().catch(function (e) {
        alert('保存失敗: ' + (e.message || e));
      });
    });

    document.getElementById('wd688-print-paint').addEventListener('click', openPaintClientReportPrint);

    const fileInput = document.getElementById('wd688-csv-file');
    function pickCsv(kind) {
      pendingCsvKind = kind;
      fileInput.value = '';
      fileInput.click();
    }
    document.getElementById('wd688-csv-wind').addEventListener('click', function () {
      pickCsv('wind');
    });
    document.getElementById('wd688-csv-rain').addEventListener('click', function () {
      pickCsv('rain');
    });

    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file || !pendingCsvKind) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const text = decodeCsvArrayBuffer(reader.result);
          const rows = parseCsvTwoColumn(text);
          if (!rows.length) {
            alert('有効なデータ行がありません');
            return;
          }
          readFormIntoState();
          if (pendingCsvKind === 'wind') {
            state.wind = rows;
            state.ref5yr = mergeDailyCsvIntoRef5yr(getRef5yr(), rows, 'wind');
          } else {
            state.rain = rows;
            state.ref5yr = mergeDailyCsvIntoRef5yr(getRef5yr(), rows, 'rain');
          }
          markDirty();
          let msg =
            rows.length +
            ' 行取込みました。過去5年表（全閾値）を更新しました。';
          try {
            runCalc();
            fillFormFromState();
            msg += ' 再算出も完了しました。';
          } catch (calcErr) {
            msg += ' 再算出: ' + (calcErr.message || calcErr);
          }
          if (activeTab === 'ref-wind' || activeTab === 'ref-rain') renderMonthlyTable();
          alert(msg + ' 「保存」で記録に反映されます。');
        } catch (e) {
          alert('CSVエラー: ' + (e.message || e));
        }
        pendingCsvKind = null;
      };
      reader.readAsArrayBuffer(file);
    });

    window.addEventListener('beforeunload', function (e) {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  function recordIdFromQuery() {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get('workdays_record') || q.get('record');
    } catch (_e) {
      return null;
    }
  }

  function refresh688Dash() {
    buildDashboard();
    loadProjectList()
      .then(function () {
        let id = recordIdFromQuery();
        if (!id) {
          try {
            id = sessionStorage.getItem(SESSION_RECORD_KEY);
          } catch (_e2) {
            /* noop */
          }
        }
        if (id) return loadRecord(id);
        createNewProject();
        return null;
      })
      .catch(function (e) {
        console.error(BUILD, e);
        alert('初期化エラー: ' + (e.message || e));
      });
  }

  kintone.events.on('app.record.index.show', function (ev) {
    refresh688Dash();
    return ev;
  });

})();
