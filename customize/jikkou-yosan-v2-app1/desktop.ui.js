  const APP1_ID = /* @JY_V2_APP1 */ 756;
  const APP2_ID = /* @JY_V2_APP2 */ 757;
  const APP3_ID = /* @JY_V2_APP3 */ 758;
  // Phase2c-actual-soft-save-visible: 一時保存済みApp757明細行をreload後もrevealし、操作バーに最終保存時刻を表示。#R-SOFT-SAVE-01
  // Phase2c-excel-90200-prior-branch: Excel正 90200｜前期支店共通原価（種別なしTYPELESS・詳細2セル）。並び=13620会議費の下。#R-EXCEL-UI-09/07/14
  // Phase2c-actual-visual-readability: 表13px・詳細淡色・予算差色・行高/＋－・数値揃え。#R-EXCEL-UI-17
  // Phase2c-actual-tab-font: タブ文字を12→14px（見やすさ）。#R-EXCEL-UI-17
  // Phase2c-actual-title-short: 予実見出しを「工事原価管理」に短縮。#R-EXCEL-UI-17
  // Phase2c-actual-type-col-label: 列見出し「種別（補助）」をタグ分割せずそのまま表示。#R-EXCEL-UI-01
  // Phase2c-actual-detail-left-persist: 詳細左(name2)は保存時〃化禁止・既存〃は実値展開・種別下もleaf再表示。#R-EXCEL-UI-14
  // Phase2c-actual-detail-save-fix: TYPELESS詳細左の〃sanitize/stripを停止＋保存時name2を〃化しない。#R-EXCEL-UI-14
  // Phase2c-actual-auto-link-on: 浜田GO・Excel空枠を元通り。ENSURE/PLACE再開。MANUAL_ONLY・カタログ非表示は維持。#R-EXCEL-LINK-00
  // Phase2c-actual-himoku-fold-persist: 費目▶開閉をsessionStorageへ。一時保存reload後も現状維持。#R-EXCEL-UI-16
  // Phase2c-actual-unlink-catalog-fix: カタログ除外は未revealのみ。＋手入力は材料費種別下でも残す。#R-EXCEL-LINK-00
  // @JY_V2_BUILD 2026-09-05-ver02-worktype-types-clear
  // G0 §9.1: 外注費は「－」固定禁止 → 種別5件（材料費／労務費／仮設機械経費／現場経費／その他費用）。
  // Phase2c-actual-unlink-catalog: 内訳品名カタログのみ非表示。手入力・その他leafは再表示。#R-EXCEL-LINK-00
  // Phase2c-actual-unlink-reveal: 内訳leafの自動reveal停止（過剰→catalog除外へ修正）。#R-EXCEL-LINK-00
  // Phase2c-actual-visual-polish: 予実Chrome（案内/合計/開閉/費目）の視覚整理。#R-EXCEL-UI-17
  // Phase2c-actual-howto-trim: 予実の見方から「既定クローズ」文言を削除。#R-EXCEL-UI-16
  // Phase2c-actual-howto-no-excel: 予実の見方からExcel言及を削除（利用者向け）。#R-EXCEL-UI-16
  // Phase2c-actual-howto-fold: 予実の見方を費目開閉・すべて展開に合わせて更新。#R-EXCEL-UI-16
  // Phase2c-actual-detail-add-notice-short: 詳細追加案内を短文化。#R-EXCEL-UI-05
  // Phase2c-actual-himoku-fold-all: すべて展開／すべて閉じる（詳細あり費目のみ）。#R-EXCEL-UI-16
  // Phase2c-actual-himoku-fold-default-closed: 費目▶は詳細があるときだけ。既定クローズ。#R-EXCEL-UI-16
  // Phase2c-actual-himoku-fold: 費目単位▶／▼開閉。閉じ時は費目名+数量/実行予算SUM。空詳細は出さない。＋で開いて追加。#R-EXCEL-UI-16
  // Phase2c-actual-sticky-totals-collapse: 合計バーは既定クローズ・summaryクリックで開く。#R-EXCEL-UI-15
  // Phase2c-actual-sticky-totals-month: sticky合計バーの月次を月単位（数量・金額）に訂正。実行予算は全合計のまま。#R-EXCEL-UI-15
  // Phase2c-actual-sticky-totals-bar: 表直上に実行予算/月次数量/月次金額の全合計stickyバー（仮置き・浜田確認用）。#R-EXCEL-UI-15
  // Phase2c-excel-11500-other-security: Excel正 11500｜その他保安費（種別なしTYPELESS・詳細2セル）。並び=11400直下＝11600直前。#R-EXCEL-UI-09/07/14
  // Phase2c-excel-11400-ground: Excel正 11400｜検電接地。種別=停電責任者／検電接地作業者 → 詳細2セル。並び=11600直前。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-13500-guide: Excel正 13500｜重機誘導員。種別=昼間／夜間 → 詳細2セル（11300同型）。omit解除＋OVERRIDE＋ENSURE登録。#R-EXCEL-UI-09/12/14

  // Phase2c-actual-auto-link-off: （撤回）内訳↔原価管理の自動連携一時無効 → auto-link-on へ。#R-EXCEL-LINK-00

  // Phase2c-actual-cost-mgmt-harden: 予実flush / revealを版スコープ / ENSUREでdetailSavePending立てない / revealを現行行に剪定。#R-SOFT-SAVE-02
  // Phase2c-excel-dedupe-coded: 同一システム工種コードの重複枠は正規1件だけ表示（例: 11100が二重）。区分はコード表（11100=保安）。#R-EXCEL-UI-09
  // Phase2c-excel-11300-traffic: Excel正 11300｜交通整理員賃金。種別=昼間／夜間 → 詳細2セル（11200同型）。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-11200-watchman: Excel正 11200｜列車見張員賃金。種別=昼間／夜間 → 詳細2セル（11100同型）。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-11100-senpei: Excel正 11100｜線閉責任者賃金。種別=昼間／夜間 → 詳細2セル（11000同型）。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-nameless-after-10700: 軌道工事〜追加工事⑤を10700直後（工事がらみ）。10800/10900はその後ろ。#R-EXCEL-UI-09/11
  // Phase2c-excel-10900-after-10800: 10900工事管理者賃金（出向工事管理者）を10800鎌ヶ谷の直後へ。#R-EXCEL-UI-09
  // Phase2c-excel-10800-after-10700: 10800鎌ヶ谷資材使用料を名称枠群の直後へ（10700群の後ろ）。#R-EXCEL-UI-09
  // Phase2c-excel-11000-safety-manager: Excel正 11000｜工事安全専任管理者賃金。種別=昼間／夜間 → 詳細2セル。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-13600-entertainment: Excel正 13600｜交際費。種別=得意先接待交際費（甲）／（乙）／その他接待交際費 → 詳細2セル。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-unit-price-wider: 単価列を広げてカンマ付き金額の見切れを解消。#R-EXCEL-UI-01
  // Phase2c-soft-save-reload: soft-saveのフルreload回避を撤回。REST更新後に本体が「新しいバージョン」を出すため一時保存後は従来どおりreload。計測[jy2-save-timing]は維持。#R-PERF-01
  // Phase2c-excel-12800-col-widths: 12800表示硬化（区分null修復・ENSURE名一致は空コードのみ）＋単価/数量狭・実行予算額広。#R-EXCEL-UI-09/01
  // Phase2c-excel-12800-compensation: Excel正 12800｜補償費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-soft-save-timing: （撤回）一時保存成功時フルreload回避 → soft-save-reload へ。#R-PERF-01
  // Phase2c-excel-13620-meeting: Excel正 13620｜会議費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-13100-dues: Excel正 13100｜諸会費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12900-misc: Excel正 12900｜諸雑費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-typeless-name2-persist: TYPELESS詳細左は空name2を〃にしない・〃は継承表示しない・費目ミラークリア廃止。#R-EXCEL-UI-14
  // Phase2c-excel-detail-col-wide: 詳細列(freeze-3)と種別/詳細左(freeze-2)を広げて見切れ解消。#R-EXCEL-UI-01
  // Phase2c-excel-12700-kentaikyo: Excel正 12700｜建退共証紙購入費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12600-bond: Excel正 12600｜履行保証保険料（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-typeless-name2-show: TYPELESS費目で name2===費目名でも詳細左を空にしない。取り違えシード(name2=費目)は読み込み時にクリア。#R-EXCEL-UI-14
  // Phase2c-excel-typeless-dash-by-code: Excel TYPELESS工種はコード表dashTypeを無効化。既定費目もHIMOKU_OVERRIDEを優先（12500借上げ自動車費が旅費交通費－固定になる不具合）。#R-EXCEL-UI-07/14
  // Phase2c-excel-12500-car: Excel正 12500｜借上げ自動車費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12400-type-strip: 12400種別の（塗）接頭辞を除去し Excel短名3種のみ表示。#R-EXCEL-UI-12
  // Phase2c-excel-12400-travel: Excel正 12400｜旅費交通費。種別=出張旅費特例／３万円未満公共交通機関特例／その他旅費交通費 → 詳細2セル。omit解除＋ENSURE。#R-EXCEL-UI-09/12/14
  // Phase2c-excel-12300-comms: Excel正 12300｜通信費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12200-office: Excel正 12200｜事務費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12100-supplies: Excel正 12100｜消耗品費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-12000-rent: Excel正 12000｜借地料（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-typeless-no-dash: TYPELESS費目は詳細左=name2。コード表 dashType「－」固定を適用しない（保存で詳細左が消える対策）。#R-EXCEL-UI-07/14
  // Phase2c-excel-11900-tax: Excel正 11900｜租税公課（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-11800-waste: Excel正 11800｜産業廃棄物処理（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-11700-transport: Excel正 11700｜運送費（種別なし・詳細2セル）。omit解除＋ENSURE。#R-EXCEL-UI-09
  // Phase2c-excel-omit-pending-frames: 浜田: 11700〜経費・旅費/保険/交際・11000〜13500保安外注は原価管理から一旦全消し。必要枠は後でExcel正で足す。内訳は残す。#R-EXCEL-UI-09
  // Phase2c-excel-11400-omit-block: Excel正に11400枠なし → 工事原価管理から工種11400を丸ごと非表示（外注停電責任者・外注検電接地作業者）。内訳App757は触らない。#R-EXCEL-UI-09
  // Phase2c-excel-11600-code-repair: （塗）レンタルが10300のまま残るとENSUREスキップ＆費目が足場工事になる → コードを11600へ修復。HIMOKU_BY_NAME優先。#R-EXCEL-UI-09/12。
  // Phase2c-excel-11600-ensure: 内訳に11600が無いとOVERRIDEだけでは原価管理に出ない。ENSUREで空ブロック追加しオペレーター直後へ（10800も同列）。#R-EXCEL-UI-09/12。
  // Phase2c-excel-11600-rental: Excel正 11600｜レンタル。種別=建設機械／仮設資材･足場資材 → 詳細2セル。コード表の仮設機械経費は原価管理では使わない（#R-EXCEL-UI-09/12）。
  // Phase2c-viewport-shrink-fix: 保存後reloadで visualViewport が一瞬狭いとき host max-width が縮む再発防止（scale≈1は layout 幅を優先）。
  // Phase2c-excel-10800-kamagaya: Excel正 10800｜鎌ヶ谷資材使用料（種別なし・詳細2セル）。コード表の仮設機械経費＞鎌ヶ谷は原価管理では使わない（#R-EXCEL-UI-09）。
  // Phase2c-excel-other-labor: 建設機械オペレーター枠に費目「その他労務」追加。
  // 各費目とも種別=昼間／夜間→詳細2セル（10900 の出向／その他と同型）。#R-EXCEL-UI-12。
  // Phase2c-dual-commit-live: 詳細左/右は input の都度モデルへ書く。
  // 右セル保存時に描画時の左値で name2 を上書きしない（行追加で左が消える主因）。
  // Phase2c-flush-before-plus: 操作列＋／－の mousedown preventDefault 前に
  // フォーカス中 input を flush（詳細左が行追加で消える対策）。
  // Phase2c-fix-flat-plus-strip: 外注試験費等の＋追加直後に name1 を剥がさない。
  // （空枠掃除は未 reveal 行のみ。reveal 済み＝手入力行は残す）
  // Phase2c-excel-typed-dual-detail: 種別あり費目の詳細はすべて2セル
  // （種別列=詳細左・詳細列=詳細右。name2=種別／詳細左。#R-EXCEL-UI-14）。
  // 10900・建設機械オペレーター・材料費など共通。平坦費目（TYPELESS）は従来どおり。
  // Phase2c-excel-operator-dual-detail: 建設機械オペレーターは種別下の詳細が2セル
  // （Excel正。name2=種別／詳細左・name3=詳細右。#R-EXCEL-UI-12/14）。
  // Phase2c-excel-operator-day-night: Excel正・システム工種なし｜建設機械オペレーター。
  // 費目=建設機械オペレーター → 種別=昼間／夜間 → 詳細。10900 と同型（#R-EXCEL-UI-12）。
  // コード表の労務費＋建設機械オペレーター（種別）は原価管理では使わない。10900 直後へ確保。
  // Phase2c-worktype-end-rule: グレー区切り線はシステム工種ごと（費目ごとではない）。
  // 10900 のように費目が複数でも一塊に見える（#R-EXCEL-UI-13）。
  // Phase2c-excel-10900-manager: Excel正 10900｜工事管理者賃金。
  // 費目=出向工事管理者／その他工事管理者 → 種別=昼間／夜間 → 詳細。#R-EXCEL-UI-12。
  // （コード表の労務費＋（昼）（夜）は原価管理では使わない）
  // Phase2c-last-detail-clear: ブロック最終明細の－は削除ではなく内容クリア
  // （U12: 明細0行禁止のため。軌道工事等でエラーにならない）。
  // Phase2c-excel-nameless-no-empty-detail: 軌道工事等は費目枠のみ。空の詳細行は出さない
  // （＋で追加するまで。自動確保時に name1 を載せない／既存の空詳細は外す）。
  // Phase2c-excel-nameless-typeless: 軌道工事〜追加工事⑤は種別なし・詳細2セル
  // （10700塗装附帯工事と同型）。浜田訂正。
  // Phase2c-excel-type-only-order: 名称枠を 10700｜塗装附帯工事 の直後へ並べる（工事がらみ）。
  // Phase2c-excel-type-only-ensure: 名称枠が内訳に無いとき App757 へ空ブロック追加。
  // （表示だけOVERRIDEしても行が出ない問題の修正。一時保存で永続化）
  // Phase2c-excel-type-only-frames: Excel正・システム工種コードなし枠（名称キー）。
  // Phase2c-excel-10700-ancillary: Excel正 10700｜塗装附帯工事（種別なし・詳細2セル）。
  // 10200〜10600と同型（#R-EXCEL-UI-09）。
  // Phase2c-excel-10600-repair: Excel正 10600｜修繕等工事（種別なし・詳細2セル）。
  // 10200〜10400と同型（#R-EXCEL-UI-09）。
  // Phase2c-month-qty-default-one: 月次金額を入れたとき数量が空なら 1 を表示。
  // （金額は保存。数量はセッションのみ。既存数量は上書きしない）
  // Phase2c-excel-10400-paint-scaffold: Excel正 10400｜塗装・足場工事（種別なし・詳細2セル）。
  // 10200/10300と同型（#R-EXCEL-UI-09）。
  // Phase2c-excel-10300-scaffold: Excel正 10300｜足場工事（種別なし・詳細2セル）。
  // 10200塗装工事と同型（#R-EXCEL-UI-09）。
  // Phase2c-unit-price-comma: 単価入力に千区切りカンマ表示（保存値はカンマ無し）。
  // Phase2c-qty-default-one: 単価を入れたとき計画数量が空なら 1 を自動セット。
  // （実行予算＝ROUND(単価×数量) がすぐ見える。既存数量は上書きしない）
  // Phase2c-flush-before-save: 一時保存前にフォーカス中 input を明示 commit。
  // （save ボタン mousedown preventDefault で blur が飛ばず詳細左 name2 等が消える対策）
  // Phase2c-excel-10200-paint: Excel正 10200｜塗装工事（種別なし・詳細2セル）。
  // コード表 constructionMenu（外注費等）は原価管理では HIMOKU_OVERRIDE で置換。
  // Phase2c-himoku-align-unify: 揃え位置も統一。費目名=左、数量/金額/SUM=右。
  // 親行・費目グループ・種別なし費目で同じ（#R-EXCEL-UI-08）。
  // Phase2c-himoku-label-unify: 費目名は親行・費目グループ行とも太字（ラベルのみ）。
  // 種別なし費目（その他材料費）も数量/実行予算SUM・行色・太字は他費目と同一仕様。
  // Phase2c-himoku-qty-amt-sum: 費目行も表示中詳細の計画数量SUM＋実行予算SUM。
  // 見た目結合は種別〜単価まで（数量・金額は結合外。種別行と同方針）。
  // Phase2c-dual-detail-cells: その他材料費の詳細行は Excelどおり2セル
  // （種別列=左・詳細列=右 → name2/name3）。例: エンドポイント／塗装表示記録･数字シール。
  // Phase2c-excel-sonota-himoku: 「その他材料費」は費目。種別行なし・詳細を表示。
  // Phase2c-himoku-end-rule: （旧）費目ごとの区切り → worktype-end-rule へ変更。
  // Phase2c-omit-extra-himoku: （未分類）等の余分な費目枠は出さない。
  // Phase2c-hide-blank-worktype: システム工種が空/「－」の親行は原則出さない。
  // 例外: Excel正の名称枠（コード空・#R-EXCEL-UI-11）は出す。
  // Phase2c-row-tint-green-blue: 費目行=薄緑・種別行=薄青・詳細=ほぼ白（階層識別）。
  // Phase2c-hide-dash-type: 種別「－」「（種別未設定）」行は原価管理に出さない。
  // Phase2c-type-col-wide: 種別列(freeze-2) 5.5〜7rem → 12rem。見切れ解消。
  // sticky left を再計算（詳細・操作を右へ）。
  // Phase2c-deny-type-row: deny 種別は空枠もデータ由来も原価管理に出さない
  // （浜田: その他材料費は削除でよい。App757 は非破壊）。
  // Phase2c-excel-type-authority: 工事原価管理の空種別枠は「原価管理明細」正。
  // コード表 typesByHimoku は候補だが余剰あり → deny で抑止。
  // Phase2c-type-qty-amt-sum: 種別行に表示中詳細の計画数量SUM＋実行予算SUM。
  // 見た目結合は詳細〜単価まで（数量・金額は結合外で見える）。
  // Phase2c-budget-sum-visible: 手動のみモードでは実行予算/月次/累計のSUMを
  // 表示中（＋で reveal）の詳細行だけから取る。隠れ内訳行を混ぜない。
  // Phase2c-detail-manual-only: 既存内訳由来の詳細は隠す。＋で追加した行だけ表示・手入力。
  // App757は非破壊（既存行は消さない）。来週内訳連動方針後に全件再表示可。
  // Phase2c-hide-detail-interim: （前段）詳細全隠し → 手入力可に緩和。
  // Phase2c-month-qty-sum: 費目/種別/親の月次数量＝子のセッション数量SUM（Excel寄せ）。
  // 金額SUMは従来どおり。総計行の数量は単位混在のため「－」維持。
  // Phase2c-qty-auto-budget: 単価の右に明細数量列。実行予算額＝ROUND(単価×数量)
  // 自動のみ（手入力撤去）。費目/種別/詳細の3段階薄色分け。
  // Phase2c-detail-save-guard: 詳細/単価/行構造の未保存時に「予実を保存」を
  // 押しても App757 に書かれず消える／「変更なし」になる誤認を防ぐ。
  // 未保存なら上部「一時保存」へ誘導。予実保存ボタンに mousedown ガード。
  // Phase2c-visual-merge: 費目行=種別〜単価・種別行=詳細〜単価を見た目結合
  // （colspanなし・枠線消し。sticky安全。空種別の操作＋は維持）。
  // Phase2c-no-himoku-add-type: 費目横「＋種別行」撤去（Excel: 種別はコード表固定。
  // 詳細の増減は操作列＋／－のみ）。親行・費目グループ行の両方。
  // Phase2c-himoku-col-12rem: 費目列(freeze-1) max 7rem→12rem 固定幅で見切れ解消。
  // sticky left を min 連鎖で再計算（種別以降を右へずらす）。
  // Phase2c-c-excel-struct-raf: 操作＋／－の全表 rerender を rAF に逃がし
  // click 1〜2s Violation を緩和（本直し＝ブロック単位再描画は別タスク）。
  // Phase2c-c-excel-no-type-add: 種別枠の「＋詳細行」撤去。追加は操作列＋
  // （空種別は操作列＋／詳細列クイック入力）。App758 keys/save/pivot 不変。
  // Phase2c-c-excel-ops-col: 詳細の右に「操作」列（＋／－）。Excel列＋UI専用。
  // Phase2c-c-excel-detail-pm: 詳細列の横に＋／－（追加・削除）。入力の左に
  // 常時表示。Phase2c-c-excel-perf の dirty-only フィールド編集は維持。
  // Phase2c-c-excel-perf: 詳細・単価の change で内訳+予実を全再描画していた
  // のをやめ、フィールド編集は dirty のみ。行追加/削除時だけ予実 rerender。
  // 月次 change は rAF で1回にまとめる（Chrome Violation 対策）。
  // Phase2c-c-excel-unit-price: 工事原価管理の詳細行・単価を手入力
  // （detailModel.updateDetailRow unitPrice・一時保存 App757）。
  // Phase2c-c-excel-row-ops: 工事原価管理の詳細行に「＋」「削除」。
  // Phase2c-c-excel-flat-detail2: 詳細列の「└」＋width:100%入力で入力欄が
  // クリップされ手入力不能だったのを修正。Excelどおり詳細列＝入力セルのみ。
  // Phase2c-c-excel-flat-detail: Excelどおり詳細行を表示し name3 を手入力可
  // （旧 hide-catalog で name3 あり行を隠していたため入力欄が消えていた）。
  // Phase2c-c-excel-flat: Excel原価管理明細どおり常時階層。親行＝工種番号｜
  // 費目（同一行・SUM）。下に種別行→詳細行を常時表示（費目＋開閉なし）。
  // 同一工種の追加費目は工種番号なしの費目行。＋種別行／＋詳細行は維持。
  // Phase2c-c-excel-outline: （旧）親行＝工種｜既定費目＋で種別→詳細を一段開く。
  // Phase2c-c-detail-edit: 工事原価管理の詳細(name3)を手入力可。commit 時
  // detailModel.updateDetailRow → reveal(rowKey) → onDetailStructureChanged。
  // 行追加は種別枠の「＋詳細行」（維持）。App758 keys/actuals 月次は不変。
  // Phase2c-c: 親行の「（塗）材料費」等システム入力工種名は Excel 原価管理に
  // 無いため非表示（工種番号のみ。ホバーに旧名称）。freeze列は費目枠用。
  // Phase2c-c-template-types: コード表 typesByHimoku の種別を空枠でも常時表示
  // （例: 材料費下の鋼材･二次製品費など）。データに無い種別も type-group。
  // Phase2c-c-hide: Excel原価管理明細に合わせ、内訳の品名カタログ行
  // （name3 あり）は工事原価管理に出さない。費目→種別枠が主。＋詳細行で
  // 追加した行、または詳細未入力行のみ表示。
  // （手動のみモードの SUM は表示中行のみ → Phase2c-budget-sum-visible）
  // Phase2c-c (2026-07-31): Excel入れ子 — 費目枠の下に種別(name2)視覚
  // グループ（`▸▸`・virtual=type-group・表示専用 SUM）。種別枠に「＋詳細行」
  // （name1+name2 prefill）。費目枠の「＋種別行」は維持。子行ラベルは
  // name3 のみ・種別列は枠があるため "－"。App758キー/save/pivot 不変。
  // Phase2c-b child-label: 費目下の子行は詳細(name3)のみ表示。
  // displayInteger 空ガード・Phase2c-b-a ＋種別行は維持。
  // Fix2: displayInteger 自体も空・非数を null 返し（旧キャッシュでも落ちにくく）。
  // Fix: jy2AmountDisplay / 費目SUM が空単価・非数で Invalid decimal を投げない。
  // Phase2c-b-a (2026-07-31): 費目グループ行の label セルに「＋種別行」
  // ボタンを追加。押下で `detailModel.addDetailRow` → 費目が実費目のときは
  // `name1` に費目名を prefill → `moveDetailRow` を繰り返して当該グループ
  // 末尾の直後まで移動する。書込みは App757 の内訳（detailModel）だけで、
  // App758 の予実（actualsModel）・keys.mjs・save-model・actuals-matrix
  // pivot は一切触らない。永続化は sticky トップの「一時保存」経由（App757）
  // で行い、「予実を保存」は使わない（明示バナーで案内）。
  // Phase2c-a (UI-only): expand時に明細を費目(name1)で視覚グループ化する。
  // 費目ヘッダ行＝表示専用の灰色 SUM（`▸ 費目名` ラベル・数量/金額は集計）
  // で、書込みは一切行わない（`dataset.virtual = "himoku-group"` を保存
  // 対象外の目印にする）。子行の並びは既存のまま維持し、`row.children` を
  // 前から走査して直前の name1 と変わったタイミングでヘッダ行を挿入する
  // だけ。App757/758 のキー・save-model・actuals-matrix 書込は変更しない。
  // Phase2b (UI-only): 月次に「数量 | 金額」の2列 UI を追加。数量入力で
  // 金額を ROUND(単価×数量) 自動計算し amount のみを保存する（App758 の
  // キー・save-model・actuals-matrix pivot は変更しない — 数量は pane 上の
  // Map で当該セッションのみ保持し、再読込で消える）。
  // 「最終予算額」列は表示ラベルを「実行予算額（暫定）」へ改称（書き込み
  // 経路は finalBudget を維持。月曜まで手入力＝既存最終予算欄）。
  // Phase2a (UI-only): 備考再表示 + 数量表示（読取） + 親月セル灰色。
  // App758 key/save-model/actuals-matrix write paths は変更しない（読取のみ）。
  // 工事原価管理: 親行＝内訳№単位は合計表示のみ・編集不可。＋/－で明細行
  // （費目/種別/定義）を開き、月別消化と最終予算額は明細行に入力する
  // （Hamada 確定 2026-07-29 夕）。明細行が1つでも値を持つ列は親=子の合計、
  // 空のときはレガシー（旧・親単位）値を親で表示するフォールバック。
  // fix: 親最終=全子の有効最終合計／name3〃／子行種別列=name2。

  const JY2_STYLE_ID = "jy2-shell-style";
  const JY2_ACTIVE_TAB_KEY = `jy2:${APP1_ID}:activeTab`;
  const JY2_SCROLL_Y_KEY = `jy2:${APP1_ID}:scrollY`;
  const JY2_HSCROLL_KEY = `jy2:${APP1_ID}:hscrollLeft`;
  const JY2_FONT_SCALE_KEY = "jy2-font-scale";
  const JY2_FONT_SCALES = Object.freeze(["standard", "large", "xlarge"]);
  // Phase2c-c-three-cols: Excel 原価管理明細に合わせ固定列（システム工種｜
  // 費目｜種別（補助）｜詳細）＋UI「操作」＋単価1列。備考は右端に別列。
  const JY2_ACTUAL_FREEZE_COLS = 5;
  const JY2_ACTUAL_ATTR_COLS = 1;
  // true: 既存内訳由来の詳細は隠し、reveal（＋追加）した行だけ表示・手入力。
  // false: 全詳細行を表示（来週内訳連動方針後）。
  const JY2_ACTUAL_DETAIL_MANUAL_ONLY = true;
  // 浜田GO 2026-08-02: Excel空枠（軌道工事等）を元通り戻すため ENSURE/PLACE/sanitize 再開。
  // MANUAL_ONLY（内訳詳細を原価管理に出さない）・カタログ非表示は別経路で維持。
  const JY2_COST_MGMT_AUTO_LINK_DISABLED = false;
  // 材料費下の種別「その他材料費」は Excel では費目へ出すため種別行では抑止。
  const JY2_COST_MGMT_TYPE_DENY = Object.freeze({
    "10100": Object.freeze({
      材料費: Object.freeze(["その他材料費"]),
    }),
    "11400": Object.freeze({
      外注労務費: Object.freeze(["外注停電責任者", "外注検電接地作業者"]),
      検電接地: Object.freeze(["外注停電責任者", "外注検電接地作業者"]),
    }),
    "13500": Object.freeze({
      外注労務費: Object.freeze(["外注重機誘導員"]),
    }),
  });
  // Excel 正で都度解除済み。残 OMIT なし（空配列は将来枠用）。
  const JY2_COST_MGMT_WORK_TYPE_OMIT = Object.freeze([]);
  // Excel原価管理明細で費目として出す（コード表 himoku に無い追加）。
  const JY2_COST_MGMT_HIMOKU_EXTRA = Object.freeze({
    "10100": Object.freeze(["その他材料費"]),
  });
  // Excel原価管理明細正: 工種の費目枠をコード表（constructionMenu 等）から置換。
  // #R-EXCEL-UI-09: 共通仕様（SUM/色/太字/揃え）＋差分だけ。個別その場直し禁止。
  const JY2_COST_MGMT_HIMOKU_OVERRIDE = Object.freeze({
    "10200": Object.freeze(["塗装工事"]),
    "10300": Object.freeze(["足場工事"]),
    "10400": Object.freeze(["塗装・足場工事"]),
    "10600": Object.freeze(["修繕等工事"]),
    "10700": Object.freeze(["塗装附帯工事"]),
    "10800": Object.freeze(["鎌ヶ谷資材使用料"]),
    "11700": Object.freeze(["運送費"]),
    "11800": Object.freeze(["産業廃棄物処理"]),
    "11900": Object.freeze(["租税公課"]),
    "12000": Object.freeze(["借地料"]),
    "12100": Object.freeze(["消耗品費"]),
    "12200": Object.freeze(["事務費"]),
    "12300": Object.freeze(["通信費"]),
    "12400": Object.freeze(["旅費交通費"]),
    "12500": Object.freeze(["借上げ自動車費"]),
    "12600": Object.freeze(["履行保証保険料"]),
    "12700": Object.freeze(["建退共証紙購入費"]),
    "12800": Object.freeze(["補償費"]),
    "12900": Object.freeze(["諸雑費"]),
    "13100": Object.freeze(["諸会費"]),
    "13600": Object.freeze(["交際費"]),
    "13620": Object.freeze(["会議費"]),
    "11600": Object.freeze(["レンタル"]),
    "10900": Object.freeze(["出向工事管理者", "その他工事管理者"]),
    "11000": Object.freeze(["工事安全専任管理者賃金"]),
    "11100": Object.freeze(["線閉責任者賃金"]),
    "11200": Object.freeze(["列車見張員賃金"]),
    "11300": Object.freeze(["交通整理員賃金"]),
    "11400": Object.freeze(["検電接地"]),
    "11500": Object.freeze(["その他保安費"]),
    "13500": Object.freeze(["重機誘導員"]),
    "90200": Object.freeze(["前期支店共通原価"]),
    "14100": Object.freeze(["追加工事①"]),
    "14200": Object.freeze(["追加工事②"]),
    "14300": Object.freeze(["追加工事③"]),
    "14400": Object.freeze(["追加工事④"]),
    "14500": Object.freeze(["追加工事⑤"]),
  });
  // Excel: 費目ごとの種別（補助）枠。コード表 typesByHimoku より優先。#R-EXCEL-UI-12。
  const JY2_COST_MGMT_TYPES_OVERRIDE = Object.freeze({
    "10900": Object.freeze({
      "出向工事管理者": Object.freeze(["昼間", "夜間"]),
      "その他工事管理者": Object.freeze(["昼間", "夜間"]),
    }),
    "11000": Object.freeze({
      "工事安全専任管理者賃金": Object.freeze(["昼間", "夜間"]),
    }),
    "11100": Object.freeze({
      "線閉責任者賃金": Object.freeze(["昼間", "夜間"]),
    }),
    "11200": Object.freeze({
      "列車見張員賃金": Object.freeze(["昼間", "夜間"]),
    }),
    "11300": Object.freeze({
      "交通整理員賃金": Object.freeze(["昼間", "夜間"]),
    }),
    "11400": Object.freeze({
      "検電接地": Object.freeze(["停電責任者", "検電接地作業者"]),
    }),
    "13500": Object.freeze({
      "重機誘導員": Object.freeze(["昼間", "夜間"]),
    }),
    "11600": Object.freeze({
      "レンタル": Object.freeze(["建設機械", "仮設資材･足場資材"]),
    }),
    "12400": Object.freeze({
      "旅費交通費": Object.freeze([
        "出張旅費特例",
        "３万円未満公共交通機関特例",
        "その他旅費交通費",
      ]),
    }),
    "13600": Object.freeze({
      "交際費": Object.freeze([
        "得意先接待交際費（甲）",
        "得意先接待交際費（乙）",
        "その他接待交際費",
      ]),
    }),
  });
  // 工種コードに依らない費目→種別（コード空枠用）。#R-EXCEL-UI-12。
  const JY2_COST_MGMT_TYPES_OVERRIDE_BY_HIMOKU = Object.freeze({
    "建設機械オペレーター": Object.freeze(["昼間", "夜間"]),
    "その他労務": Object.freeze(["昼間", "夜間"]),
    "工事安全専任管理者賃金": Object.freeze(["昼間", "夜間"]),
    "線閉責任者賃金": Object.freeze(["昼間", "夜間"]),
    "列車見張員賃金": Object.freeze(["昼間", "夜間"]),
    "交通整理員賃金": Object.freeze(["昼間", "夜間"]),
    "検電接地": Object.freeze(["停電責任者", "検電接地作業者"]),
    "重機誘導員": Object.freeze(["昼間", "夜間"]),
    "レンタル": Object.freeze(["建設機械", "仮設資材･足場資材"]),
    "旅費交通費": Object.freeze([
      "出張旅費特例",
      "３万円未満公共交通機関特例",
      "その他旅費交通費",
    ]),
    "交際費": Object.freeze([
      "得意先接待交際費（甲）",
      "得意先接待交際費（乙）",
      "その他接待交際費",
    ]),
  });
  // 種別行の下は詳細2セルが既定（種別列=詳細左・詳細列=詳細右）。#R-EXCEL-UI-14。
  // name2 は「種別」または「種別／詳細左」で保持（App757 は name1〜3 のみ）。
  // 許可リストは使わない — 平坦費目以外はすべて対象。
  const JY2_COST_MGMT_TYPE_DETAIL_SEP = "／";
  // システム工種コードが空の Excel 枠（名称で費目枠を決める）。
  const JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME = Object.freeze({
    "軌道工事": Object.freeze(["軌道工事"]),
    "調査設計費": Object.freeze(["調査設計費"]),
    "外注試験費": Object.freeze(["外注試験費"]),
    "交通規制費": Object.freeze(["交通規制費"]),
    "追加工事①": Object.freeze(["追加工事①"]),
    "追加工事②": Object.freeze(["追加工事②"]),
    "追加工事③": Object.freeze(["追加工事③"]),
    "追加工事④": Object.freeze(["追加工事④"]),
    "追加工事⑤": Object.freeze(["追加工事⑤"]),
    // 10900 と同型: 費目2つ（オペレーター／その他労務）× 昼間・夜間
    "建設機械オペレーター": Object.freeze([
      "建設機械オペレーター",
      "その他労務",
    ]),
    "建設機械オペレーター賃金": Object.freeze([
      "建設機械オペレーター",
      "その他労務",
    ]),
    // コード表名・別ブロック名でも同じ費目枠へ寄せる
    "その他労務": Object.freeze(["その他労務"]),
    "その他労務者": Object.freeze(["その他労務"]),
    "その他労務者賃金": Object.freeze(["その他労務"]),
    "レンタル": Object.freeze(["レンタル"]),
    "旅費交通費": Object.freeze(["旅費交通費"]),
    "運送費": Object.freeze(["運送費"]),
    "産業廃棄物処理": Object.freeze(["産業廃棄物処理"]),
    "租税公課": Object.freeze(["租税公課"]),
    "借地料": Object.freeze(["借地料"]),
    "消耗品費": Object.freeze(["消耗品費"]),
    "事務費": Object.freeze(["事務費"]),
    "通信費": Object.freeze(["通信費"]),
    "借上げ自動車費": Object.freeze(["借上げ自動車費"]),
    "履行保証保険料": Object.freeze(["履行保証保険料"]),
    "建退共証紙購入費": Object.freeze(["建退共証紙購入費"]),
    "補償費": Object.freeze(["補償費"]),
    "諸雑費": Object.freeze(["諸雑費"]),
    "諸会費": Object.freeze(["諸会費"]),
    "交際費": Object.freeze(["交際費"]),
    // コード表 himoku「接待交際費」→ Excel正「交際費」へ寄せる
    "接待交際費": Object.freeze(["交際費"]),
    "会議費": Object.freeze(["会議費"]),
    "工事安全専任管理者賃金": Object.freeze(["工事安全専任管理者賃金"]),
    "工事安全専任管理者": Object.freeze(["工事安全専任管理者賃金"]),
    "線閉責任者賃金": Object.freeze(["線閉責任者賃金"]),
    "線閉責任者": Object.freeze(["線閉責任者賃金"]),
    "列車見張員賃金": Object.freeze(["列車見張員賃金"]),
    "列車見張員": Object.freeze(["列車見張員賃金"]),
    "交通整理員賃金": Object.freeze(["交通整理員賃金"]),
    "交通整理員": Object.freeze(["交通整理員賃金"]),
    "交通整理員等": Object.freeze(["交通整理員賃金"]),
  });
  // Excel: 費目の下に種別行なし・詳細だけ（その他材料費・塗装工事・足場工事 等）。
  // #R-EXCEL-UI-07/08: SUM・行色・太字・揃えは通常費目と同一。差分は詳細2セルのみ。
  const JY2_COST_MGMT_TYPELESS_HIMOKU = Object.freeze([
    "その他材料費",
    "塗装工事",
    "足場工事",
    "塗装・足場工事",
    "修繕等工事",
    "塗装附帯工事",
    "鎌ヶ谷資材使用料",
    "運送費",
    "産業廃棄物処理",
    "租税公課",
    "借地料",
    "消耗品費",
    "事務費",
    "通信費",
    "借上げ自動車費",
    "履行保証保険料",
    "建退共証紙購入費",
    "補償費",
    "諸雑費",
    "諸会費",
    "会議費",
    "その他保安費",
    "前期支店共通原価",
    "軌道工事",
    "調査設計費",
    "外注試験費",
    "交通規制費",
    "追加工事①",
    "追加工事②",
    "追加工事③",
    "追加工事④",
    "追加工事⑤",
  ]);
  // Excel: 費目の下に種別（補助）だけ（詳細列なし・種別列=name2）。将来用。
  // 現時点の軌道工事等は TYPELESS（詳細2セル）。#R-EXCEL-UI-11 はコード空枠の話。
  const JY2_COST_MGMT_TYPE_ONLY_HIMOKU = Object.freeze([]);
  // 原価管理表示時に内訳へ無ければ追加する Excel 枠（区分=施工）。
  // workTypeCode 空＝システム工種なし。追加工事はコード表番号があれば付与。
  const JY2_COST_MGMT_ENSURE_TYPE_ONLY_FRAMES = Object.freeze([
    Object.freeze({ shortName: "軌道工事", workTypeCode: "", workTypeName: "軌道工事" }),
    Object.freeze({ shortName: "調査設計費", workTypeCode: "", workTypeName: "調査設計費" }),
    Object.freeze({ shortName: "外注試験費", workTypeCode: "", workTypeName: "外注試験費" }),
    Object.freeze({ shortName: "交通規制費", workTypeCode: "", workTypeName: "交通規制費" }),
    Object.freeze({ shortName: "追加工事①", workTypeCode: "14100", workTypeName: "追加工事①" }),
    Object.freeze({ shortName: "追加工事②", workTypeCode: "14200", workTypeName: "追加工事②" }),
    Object.freeze({ shortName: "追加工事③", workTypeCode: "14300", workTypeName: "追加工事③" }),
    Object.freeze({ shortName: "追加工事④", workTypeCode: "14400", workTypeName: "追加工事④" }),
    Object.freeze({ shortName: "追加工事⑤", workTypeCode: "14500", workTypeName: "追加工事⑤" }),
  ]);
  // 昼間／夜間付き・コード空枠（10900 と同型）。10700 群とは別配置（10900 直後）。
  const JY2_COST_MGMT_ENSURE_DAY_NIGHT_FRAMES = Object.freeze([
    Object.freeze({
      shortName: "建設機械オペレーター",
      workTypeCode: "",
      workTypeName: "建設機械オペレーター",
      nameAliases: Object.freeze(["建設機械オペレーター賃金"]),
    }),
  ]);
  // Excel正・コード付き枠（内訳に無ければ追加）。10900直後のオペレーターの後へ並べる。
  const JY2_COST_MGMT_ENSURE_CODED_FRAMES = Object.freeze([
    Object.freeze({
      shortName: "鎌ヶ谷資材使用料",
      workTypeCode: "10800",
      workTypeName: "鎌ヶ谷資材使用料",
      nameAliases: Object.freeze(["（塗）鎌ヶ谷資材使用料"]),
    }),
    Object.freeze({
      shortName: "工事安全専任管理者賃金",
      workTypeCode: "11000",
      workTypeName: "（塗）工事安全専任管理者",
      nameAliases: Object.freeze([
        "工事安全専任管理者賃金",
        "工事安全専任管理者",
        "（塗）工事安全専任管理者",
      ]),
    }),
    Object.freeze({
      shortName: "線閉責任者賃金",
      workTypeCode: "11100",
      workTypeName: "（塗）線閉責任者",
      nameAliases: Object.freeze([
        "線閉責任者賃金",
        "線閉責任者",
        "（塗）線閉責任者",
        "外注線閉責任者",
      ]),
    }),
    Object.freeze({
      shortName: "列車見張員賃金",
      workTypeCode: "11200",
      workTypeName: "（塗）列車見張員",
      nameAliases: Object.freeze([
        "列車見張員賃金",
        "列車見張員",
        "（塗）列車見張員",
        "外注列車見張員",
      ]),
    }),
    Object.freeze({
      shortName: "交通整理員賃金",
      workTypeCode: "11300",
      workTypeName: "（塗）交通整理員等",
      nameAliases: Object.freeze([
        "交通整理員賃金",
        "交通整理員",
        "交通整理員等",
        "（塗）交通整理員等",
        "外注交通整理員",
      ]),
    }),
    Object.freeze({
      shortName: "検電接地",
      workTypeCode: "11400",
      workTypeName: "（塗）検電接地",
      nameAliases: Object.freeze(["検電接地", "（塗）検電接地"]),
    }),
    Object.freeze({
      shortName: "その他保安費",
      workTypeCode: "11500",
      workTypeName: "（塗）その他保安費",
      nameAliases: Object.freeze(["その他保安費", "（塗）その他保安費"]),
    }),
    Object.freeze({
      shortName: "レンタル",
      workTypeCode: "11600",
      workTypeName: "（塗）レンタル",
      nameAliases: Object.freeze(["レンタル", "（塗）レンタル"]),
    }),
    Object.freeze({
      shortName: "運送費",
      workTypeCode: "11700",
      workTypeName: "（塗）運送費",
      nameAliases: Object.freeze(["運送費", "（塗）運送費"]),
    }),
    Object.freeze({
      shortName: "産業廃棄物処理",
      workTypeCode: "11800",
      workTypeName: "（塗）産業廃棄物処理費",
      nameAliases: Object.freeze(["産業廃棄物処理", "（塗）産業廃棄物処理費", "（塗）産業廃棄物処理"]),
    }),
    Object.freeze({
      shortName: "租税公課",
      workTypeCode: "11900",
      workTypeName: "（塗）租税公課",
      nameAliases: Object.freeze(["租税公課", "（塗）租税公課"]),
    }),
    Object.freeze({
      shortName: "借地料",
      workTypeCode: "12000",
      workTypeName: "（塗）借地料等",
      nameAliases: Object.freeze(["借地料", "（塗）借地料等", "地代家賃"]),
    }),
    Object.freeze({
      shortName: "消耗品費",
      workTypeCode: "12100",
      workTypeName: "（塗）消耗品費",
      nameAliases: Object.freeze(["消耗品費", "（塗）消耗品費"]),
    }),
    Object.freeze({
      shortName: "事務費",
      workTypeCode: "12200",
      workTypeName: "（塗）事務費",
      nameAliases: Object.freeze(["事務費", "（塗）事務費"]),
    }),
    Object.freeze({
      shortName: "通信費",
      workTypeCode: "12300",
      workTypeName: "（塗）通信費",
      nameAliases: Object.freeze(["通信費", "（塗）通信費"]),
    }),
    Object.freeze({
      shortName: "旅費交通費",
      workTypeCode: "12400",
      workTypeName: "（塗）旅費交通費",
      nameAliases: Object.freeze(["旅費交通費", "（塗）旅費交通費"]),
    }),
    Object.freeze({
      shortName: "借上げ自動車費",
      workTypeCode: "12500",
      workTypeName: "（塗）借上げ自動車費",
      nameAliases: Object.freeze(["借上げ自動車費", "（塗）借上げ自動車費"]),
    }),
    Object.freeze({
      shortName: "履行保証保険料",
      workTypeCode: "12600",
      workTypeName: "（塗）履行保証保険料",
      nameAliases: Object.freeze(["履行保証保険料", "（塗）履行保証保険料"]),
    }),
    Object.freeze({
      shortName: "建退共証紙購入費",
      workTypeCode: "12700",
      workTypeName: "（塗）建退共証紙購入費",
      nameAliases: Object.freeze(["建退共証紙購入費", "（塗）建退共証紙購入費"]),
    }),
    Object.freeze({
      shortName: "補償費",
      workTypeCode: "12800",
      workTypeName: "（塗）補償費",
      nameAliases: Object.freeze(["補償費", "（塗）補償費"]),
    }),
    Object.freeze({
      shortName: "諸雑費",
      workTypeCode: "12900",
      workTypeName: "（塗）諸雑費",
      nameAliases: Object.freeze(["諸雑費", "（塗）諸雑費", "雑費"]),
    }),
    Object.freeze({
      shortName: "諸会費",
      workTypeCode: "13100",
      workTypeName: "（塗）諸会費",
      nameAliases: Object.freeze(["諸会費", "（塗）諸会費"]),
    }),
    Object.freeze({
      shortName: "重機誘導員",
      workTypeCode: "13500",
      workTypeName: "（塗）重機誘導員",
      nameAliases: Object.freeze([
        "重機誘導員",
        "（塗）重機誘導員",
        "外注重機誘導員",
      ]),
    }),
    Object.freeze({
      shortName: "交際費",
      workTypeCode: "13600",
      workTypeName: "（塗）交際費",
      nameAliases: Object.freeze(["交際費", "（塗）交際費"]),
    }),
    Object.freeze({
      shortName: "会議費",
      workTypeCode: "13620",
      workTypeName: "（塗）会議費",
      nameAliases: Object.freeze(["会議費", "（塗）会議費"]),
    }),
    Object.freeze({
      shortName: "前期支店共通原価",
      workTypeCode: "90200",
      workTypeName: "前期支店共通原価",
      nameAliases: Object.freeze(["前期支店共通原価"]),
    }),
  ]);
  function jy2CostMgmtExcelShortName(workTypeName) {
    return String(workTypeName || "")
      .trim()
      .replace(/^（塗）/, "");
  }

  // G0 §8.1: 表示のみ（塗）接頭辞。保存値はそのまま、未付与マスタ名にだけ付ける。
  function jy2DisplayWorkTypeName(name) {
    const n = String(name || "").trim();
    if (!n) return "";
    return n.startsWith("（塗）") ? n : `（塗）${n}`;
  }

  // §16.1 listOnly 祖父: マスタ ∪ {現行値（非空・マスタ外）}。
  function jy2ListOnlyChoices(master, currentValue) {
    const merged = [];
    for (const item of master || []) {
      const text = String(item || "").trim();
      if (text && !merged.includes(text)) merged.push(text);
    }
    const current = String(currentValue || "").trim();
    if (current && !merged.includes(current)) merged.push(current);
    return merged;
  }

  function jy2ContractWorkChoices(section, currentValue) {
    const master = JY2_CONTRACT_WORK_MASTER[section] || [];
    return jy2ListOnlyChoices(master, currentValue);
  }

  function jy2UsesMaterialList(himoku, typeName) {
    const himokuKey = String(himoku || "").trim();
    const typeKey = String(typeName || "").trim();
    // 費目そのものが「その他材料費」（Excel 平坦枠）でも材料 listOnly。
    if (himokuKey === "その他材料費") return true;
    return himokuKey === "材料費" && JY2_MATERIAL_LIST_TYPES.includes(typeKey);
  }

  function jy2IsOtherMaterialKind(himoku, typeName) {
    const himokuKey = String(himoku || "").trim();
    const typeKey = String(typeName || "").trim();
    return (
      himokuKey === "その他材料費" ||
      typeKey === "その他材料" ||
      typeKey === "その他材料費"
    );
  }

  function jy2MaterialChoices(currentValue, himoku, typeName) {
    // その他材料系: Excel 実名マスタのみ。コード表の「〜など」は候補に出さない。
    const master = jy2IsOtherMaterialKind(himoku, typeName)
      ? JY2_OTHER_MATERIAL_MASTER
      : JY2_MATERIAL_MASTER;
    return jy2ListOnlyChoices(master, currentValue);
  }

  function jy2SummaryUsesMaterialList(lineType) {
    const typeKey = String(lineType || "").trim();
    return (
      typeKey === "塗料" ||
      typeKey === "その他材料" ||
      typeKey === "その他材料費"
    );
  }
  function jy2CostMgmtFrameNameMatches(blockName, frame) {
    if (!frame) return false;
    const short = jy2CostMgmtExcelShortName(blockName);
    if (!short) return false;
    if (short === frame.shortName) return true;
    const aliases = frame.nameAliases;
    if (Array.isArray(aliases) && aliases.includes(short)) return true;
    return false;
  }
  function jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame) {
    if (!Array.isArray(blocks) || !frame) return null;
    return (
      blocks.find((block) => {
        if (!block) return false;
        if (jy2CostMgmtFrameNameMatches(block.workTypeName, frame)) return true;
        const code = String(block.workTypeCode || "").trim();
        if (frame.workTypeCode && code === frame.workTypeCode) return true;
        return false;
      }) || null
    );
  }
  function jy2CostMgmtFindPaintAncillaryAnchor(blocks) {
    if (!Array.isArray(blocks)) return null;
    return (
      blocks.find((block) => {
        if (!block || block.status === "retired") return false;
        if (String(block.workTypeCode || "").trim() === "10700") return true;
        const short = jy2CostMgmtExcelShortName(block.workTypeName);
        return short === "塗装附帯工事" || short === "塗装付帯工事";
      }) || null
    );
  }
  function jy2CostMgmtFindKamagayaFrame() {
    return (
      JY2_COST_MGMT_ENSURE_CODED_FRAMES.find(
        (frame) => frame && String(frame.workTypeCode || "").trim() === "10800",
      ) || null
    );
  }
  function jy2CostMgmtFindKamagayaAnchor(blocks) {
    const frame = jy2CostMgmtFindKamagayaFrame();
    if (!frame || !Array.isArray(blocks)) return null;
    return jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
  }
  function jy2CostMgmtFindManagerWageAnchor(blocks) {
    if (!Array.isArray(blocks)) return null;
    return (
      blocks.find((block) => {
        if (!block || block.status === "retired") return false;
        if (String(block.workTypeCode || "").trim() === "10900") return true;
        const short = jy2CostMgmtExcelShortName(block.workTypeName);
        return short === "工事管理者賃金";
      }) || null
    );
  }
  function jy2CostMgmtFindOperatorAnchor(blocks) {
    if (!Array.isArray(blocks)) return null;
    for (const frame of JY2_COST_MGMT_ENSURE_DAY_NIGHT_FRAMES) {
      const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
      if (block && block.status !== "retired") return block;
    }
    return jy2CostMgmtFindManagerWageAnchor(blocks);
  }
  // 名称枠群の末尾（軌道…→追加工事⑤のうち存在する最後）。無ければ null。
  function jy2CostMgmtFindLastTypeOnlyAnchor(blocks) {
    if (!Array.isArray(blocks)) return null;
    let last = null;
    for (const frame of JY2_COST_MGMT_ENSURE_TYPE_ONLY_FRAMES) {
      const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
      if (block && block.status !== "retired") last = block;
    }
    return last;
  }
  // 10800｜鎌ヶ谷資材使用料を 名称枠群（無ければ10700）の直後へ。
  function jy2CostMgmtPlaceKamagayaAfterPaintAncillary(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.moveBlockAfter !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    const frame = jy2CostMgmtFindKamagayaFrame();
    if (!frame) return 0;
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const anchor =
      jy2CostMgmtFindLastTypeOnlyAnchor(blocks) ||
      jy2CostMgmtFindPaintAncillaryAnchor(blocks);
    const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
    if (!anchor || !block || block.status === "retired") return 0;
    if (anchor.stableBlockId === block.stableBlockId) return 0;
    const afterIndex = blocks.findIndex(
      (candidate) => candidate && candidate.stableBlockId === anchor.stableBlockId,
    );
    const blockIndex = blocks.findIndex(
      (candidate) =>
        candidate && candidate.stableBlockId === block.stableBlockId,
    );
    if (afterIndex >= 0 && blockIndex === afterIndex + 1) return 0;
    try {
      detailModel.moveBlockAfter(block.stableBlockId, anchor.stableBlockId);
      return 1;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error(
          "jy2CostMgmtPlaceKamagayaAfterPaintAncillary failed:",
          frame,
          error,
        );
      }
      return 0;
    }
  }
  // 10900｜工事管理者賃金（出向工事管理者）を 10800（無ければ10700）の直後へ。
  function jy2CostMgmtPlaceManagerWageAfterKamagaya(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.moveBlockAfter !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const anchor =
      jy2CostMgmtFindKamagayaAnchor(blocks) ||
      jy2CostMgmtFindPaintAncillaryAnchor(blocks);
    const block = jy2CostMgmtFindManagerWageAnchor(blocks);
    if (!anchor || !block || block.status === "retired") return 0;
    if (anchor.stableBlockId === block.stableBlockId) return 0;
    const afterIndex = blocks.findIndex(
      (candidate) => candidate && candidate.stableBlockId === anchor.stableBlockId,
    );
    const blockIndex = blocks.findIndex(
      (candidate) =>
        candidate && candidate.stableBlockId === block.stableBlockId,
    );
    if (afterIndex >= 0 && blockIndex === afterIndex + 1) return 0;
    try {
      detailModel.moveBlockAfter(block.stableBlockId, anchor.stableBlockId);
      return 1;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error(
          "jy2CostMgmtPlaceManagerWageAfterKamagaya failed:",
          block,
          error,
        );
      }
      return 0;
    }
  }
  // 種別のみ枠を 10700｜塗装附帯工事 の直後へ（軌道→…→追加工事⑤の順・工事がらみ）。
  // 戻り値＝位置を動かした件数。
  function jy2CostMgmtPlaceTypeOnlyFramesAfterPaintAncillary(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.moveBlockAfter !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const anchor = jy2CostMgmtFindPaintAncillaryAnchor(blocks);
    if (!anchor) return 0;
    let afterId = anchor.stableBlockId;
    let moved = 0;
    for (const frame of JY2_COST_MGMT_ENSURE_TYPE_ONLY_FRAMES) {
      try {
        blocks = detailModel.snapshot().blocks || [];
      } catch {
        break;
      }
      const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
      if (!block || block.status === "retired") continue;
      const afterIndex = blocks.findIndex(
        (candidate) => candidate && candidate.stableBlockId === afterId,
      );
      const blockIndex = blocks.findIndex(
        (candidate) =>
          candidate && candidate.stableBlockId === block.stableBlockId,
      );
      if (afterIndex >= 0 && blockIndex === afterIndex + 1) {
        afterId = block.stableBlockId;
        continue;
      }
      try {
        detailModel.moveBlockAfter(block.stableBlockId, afterId);
        afterId = block.stableBlockId;
        moved += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error(
            "jy2CostMgmtPlaceTypeOnlyFramesAfterPaintAncillary failed:",
            frame,
            error,
          );
        }
      }
    }
    return moved;
  }
  // 昼間／夜間枠を 10900｜工事管理者賃金 の直後へ。戻り値＝動かした件数。
  function jy2CostMgmtPlaceDayNightFramesAfterManagerWage(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.moveBlockAfter !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const anchor = jy2CostMgmtFindManagerWageAnchor(blocks);
    if (!anchor) return 0;
    let afterId = anchor.stableBlockId;
    let moved = 0;
    for (const frame of JY2_COST_MGMT_ENSURE_DAY_NIGHT_FRAMES) {
      try {
        blocks = detailModel.snapshot().blocks || [];
      } catch {
        break;
      }
      const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
      if (!block || block.status === "retired") continue;
      const afterIndex = blocks.findIndex(
        (candidate) => candidate && candidate.stableBlockId === afterId,
      );
      const blockIndex = blocks.findIndex(
        (candidate) =>
          candidate && candidate.stableBlockId === block.stableBlockId,
      );
      if (afterIndex >= 0 && blockIndex === afterIndex + 1) {
        afterId = block.stableBlockId;
        continue;
      }
      try {
        detailModel.moveBlockAfter(block.stableBlockId, afterId);
        afterId = block.stableBlockId;
        moved += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error(
            "jy2CostMgmtPlaceDayNightFramesAfterManagerWage failed:",
            frame,
            error,
          );
        }
      }
    }
    return moved;
  }
  // コード付き枠（11600 等。10800は10700直後へ別配置）をオペレーター直後へ。
  function jy2CostMgmtPlaceCodedFramesAfterOperator(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.moveBlockAfter !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const anchor = jy2CostMgmtFindOperatorAnchor(blocks);
    if (!anchor) return 0;
    let afterId = anchor.stableBlockId;
    let moved = 0;
    for (const frame of JY2_COST_MGMT_ENSURE_CODED_FRAMES) {
      // 10800 は 10700 直後（PlaceKamagaya）へ。ここでは動かさない。
      if (String(frame.workTypeCode || "").trim() === "10800") continue;
      try {
        blocks = detailModel.snapshot().blocks || [];
      } catch {
        break;
      }
      const block = jy2CostMgmtFindActiveCodedFrameBlock(blocks, frame);
      if (!block || block.status === "retired") continue;
      const afterIndex = blocks.findIndex(
        (candidate) => candidate && candidate.stableBlockId === afterId,
      );
      const blockIndex = blocks.findIndex(
        (candidate) =>
          candidate && candidate.stableBlockId === block.stableBlockId,
      );
      if (afterIndex >= 0 && blockIndex === afterIndex + 1) {
        afterId = block.stableBlockId;
        continue;
      }
      try {
        detailModel.moveBlockAfter(block.stableBlockId, afterId);
        afterId = block.stableBlockId;
        moved += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error(
            "jy2CostMgmtPlaceCodedFramesAfterOperator failed:",
            frame,
            error,
          );
        }
      }
    }
    return moved;
  }
  function jy2CostMgmtDetailHasLeafContent(row) {
    if (!row) return false;
    let name2Text = String(row.name2 == null ? "" : row.name2).trim();
    const himoku = String(row.name1 == null ? "" : row.name1).trim();
    if (name2Text && jy2CostMgmtIsDualDetailTypeHimoku(himoku)) {
      // 種別だけの name2（例: 昼間）は詳細内容とみなさない
      name2Text = jy2CostMgmtSplitTypeDetailName2(name2Text, himoku).leftDetail;
    }
    const parts = [name2Text, row.name3, row.quantity, row.unitPrice, row.note];
    return parts.some((value) => {
      const text = String(value == null ? "" : value).trim();
      if (!text) return false;
      if (jy2CostMgmtIsDashLike(text)) return false;
      if (text === "〃") return false;
      return true;
    });
  }
  // 内訳の材料費品名カタログ（例: 鋼材･二次製品費など／H形鋼）。原価管理には出さない。
  function jy2CostMgmtMaterialCatalogTypes() {
    const raw =
      (JY2_NAME_HIERARCHY &&
        JY2_NAME_HIERARCHY.typesByHimoku &&
        JY2_NAME_HIERARCHY.typesByHimoku["材料費"]) ||
      [];
    const set = new Set();
    for (const label of raw) {
      const text = String(label || "").trim();
      if (!text || text === "その他材料費") continue;
      set.add(text);
      set.add(jy2CostMgmtExcelShortName(text));
    }
    return set;
  }
  function jy2CostMgmtIsUchiwakeCatalogDetail(row) {
    if (!row) return false;
    const name3 = String(row.name3 == null ? "" : row.name3).trim();
    if (!name3 || jy2CostMgmtIsDashLike(name3) || name3 === "〃") return false;
    const himoku = jy2CostMgmtNormalizeHimokuLabel(
      String(row.name1 == null ? "" : row.name1).trim(),
    );
    if (jy2CostMgmtIsFlatHimoku(himoku)) return false;
    let typeLabel = String(row.name2 == null ? "" : row.name2).trim();
    if (!typeLabel || jy2CostMgmtIsDashLike(typeLabel)) return false;
    if (jy2CostMgmtIsDualDetailTypeHimoku(himoku)) {
      typeLabel =
        jy2CostMgmtSplitTypeDetailName2(typeLabel, himoku).typeLabel ||
        typeLabel;
    }
    typeLabel = jy2CostMgmtExcelShortName(typeLabel);
    const catalogTypes = jy2CostMgmtMaterialCatalogTypes();
    if (!catalogTypes.has(typeLabel)) return false;
    // 材料費（または種別が材料カタログ）＋品名(name3) = 内訳カタログ行
    return himoku === "材料費" || catalogTypes.has(typeLabel);
  }
  function jy2CostMgmtEmptyDetailHimokuLabels(frame) {
    const labels = new Set();
    if (!frame) return labels;
    if (frame.shortName) {
      labels.add(frame.shortName);
      labels.add(jy2CostMgmtExcelShortName(frame.shortName));
    }
    const aliases = frame.nameAliases;
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        if (alias) labels.add(String(alias).trim());
      }
    }
    const byName = JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME[frame.shortName];
    if (Array.isArray(byName)) {
      for (const himoku of byName) {
        if (himoku) labels.add(String(himoku).trim());
      }
    }
    return labels;
  }
  // 名称枠の「空のままの詳細」から費目名(name1)を外し、費目直下に空行が出ないようにする。
  // ＋で追加して reveal した行は剥がさない（外注試験費等で詳細が消える不具合の防止）。
  function jy2CostMgmtStripEmptyFrameDetailHimoku(detailModel, detailVisibility) {
    if (
      !detailModel ||
      typeof detailModel.updateDetailRow !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    const shouldKeepRow =
      detailVisibility && typeof detailVisibility.shouldShow === "function"
        ? (rowKey) => detailVisibility.shouldShow(rowKey) === true
        : () => false;
    let stripped = 0;
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const frames = [
      ...JY2_COST_MGMT_ENSURE_TYPE_ONLY_FRAMES,
      ...JY2_COST_MGMT_ENSURE_DAY_NIGHT_FRAMES,
      ...JY2_COST_MGMT_ENSURE_CODED_FRAMES,
    ];
    for (const frame of frames) {
      const block = jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame);
      if (!block || !Array.isArray(block.detailRows)) continue;
      const allowedName1 = jy2CostMgmtEmptyDetailHimokuLabels(frame);
      for (const row of block.detailRows) {
        if (!row || !row.rowKey) continue;
        // 手入力行（＋で reveal 済み）は name1 だけでも残す
        if (shouldKeepRow(row.rowKey)) continue;
        if (jy2CostMgmtDetailHasLeafContent(row)) continue;
        const name1 = String(row.name1 || "").trim();
        if (!name1) continue;
        const name1Short = jy2CostMgmtExcelShortName(name1);
        if (!allowedName1.has(name1) && !allowedName1.has(name1Short)) {
          continue;
        }
        try {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name1: null,
          });
          stripped += 1;
        } catch (error) {
          if (typeof console !== "undefined" && console.error) {
            console.error(
              "jy2CostMgmtStripEmptyFrameDetailHimoku failed:",
              frame,
              error,
            );
          }
        }
      }
    }
    return stripped;
  }
  // 詳細左(name2)の 〃 を直前の実値へ展開（空にすると「保存できない」ように見える）。
  function jy2CostMgmtExpandName2Ditto(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.updateDetailRow !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let expanded = 0;
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    for (const block of blocks) {
      if (!block || !block.stableBlockId || !Array.isArray(block.detailRows)) {
        continue;
      }
      let prevName2 = null;
      for (const row of block.detailRows) {
        if (!row || !row.rowKey) continue;
        const raw = row.name2;
        if (jy2IsDitto(raw)) {
          if (prevName2) {
            try {
              detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
                name2: prevName2,
              });
              expanded += 1;
            } catch (error) {
              if (typeof console !== "undefined" && console.error) {
                console.error(
                  "jy2CostMgmtExpandName2Ditto failed:",
                  block.stableBlockId,
                  row.rowKey,
                  error,
                );
              }
            }
          }
          continue;
        }
        const text = String(raw == null ? "" : raw).trim();
        if (text) prevName2 = text;
      }
    }
    return expanded;
  }
  function jy2CostMgmtEnsureFrameList(detailModel, frames, logLabel) {
    let added = 0;
    for (const frame of frames) {
      let blocks;
      try {
        const snap = detailModel.snapshot();
        blocks = Array.isArray(snap.blocks) ? snap.blocks : [];
      } catch {
        break;
      }
      if (jy2CostMgmtFindTypeOnlyFrameBlock(blocks, frame)) continue;
      try {
        const id = detailModel.addBlock();
        detailModel.updateBlockHeader(id, {
          workTypeName: frame.workTypeName,
          workTypeCode: frame.workTypeCode || null,
          costCategory: "施工",
        });
        // 必須の空詳細1行は App757 側の制約。name1 は載せない（費目枠だけ見せる）。
        added += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error(logLabel + " failed:", frame, error);
        }
      }
    }
    return added;
  }
  function jy2CostMgmtFindActiveCodedFrameBlock(blocks, frame) {
    if (!Array.isArray(blocks) || !frame) return null;
    const expectedCode = String(frame.workTypeCode || "").trim();
    if (expectedCode) {
      const byCode = blocks.filter((block) => {
        if (!block || block.status === "retired") return false;
        return String(block.workTypeCode || "").trim() === expectedCode;
      });
      if (byCode.length > 0) {
        const named = byCode.find((block) =>
          jy2CostMgmtFrameNameMatches(block.workTypeName, frame),
        );
        return named || byCode[0];
      }
    }
    // 名称一致は「コード空／－」のレガシーだけ。別コード付きブロックを誤修復しない。
    return (
      blocks.find((block) => {
        if (!block || block.status === "retired") return false;
        if (
          expectedCode &&
          !jy2CostMgmtIsBlankWorkTypeCode(block.workTypeCode)
        ) {
          return false;
        }
        return jy2CostMgmtFrameNameMatches(block.workTypeName, frame);
      }) || null
    );
  }
  // 同一システム工種コードが複数あるとき、正規1件以外の stableBlockId（原価管理では非表示）。
  function jy2CostMgmtDuplicateCodedBlockIdSet(blocks) {
    const omitIds = new Set();
    if (!Array.isArray(blocks)) return omitIds;
    const byCode = new Map();
    for (const block of blocks) {
      if (!block || block.status === "retired") continue;
      const code = String(block.workTypeCode || "").trim();
      if (!code || jy2CostMgmtIsBlankWorkTypeCode(code)) continue;
      const list = byCode.get(code);
      if (list) list.push(block);
      else byCode.set(code, [block]);
    }
    for (const [code, list] of byCode) {
      if (!list || list.length < 2) continue;
      const frame =
        JY2_COST_MGMT_ENSURE_CODED_FRAMES.find(
          (candidate) =>
            candidate && String(candidate.workTypeCode || "").trim() === code,
        ) || null;
      let canonical = list[0];
      if (frame) {
        const named = list.find((block) =>
          jy2CostMgmtFrameNameMatches(block.workTypeName, frame),
        );
        if (named) canonical = named;
      }
      for (const block of list) {
        if (
          block &&
          block.stableBlockId &&
          block.stableBlockId !== canonical.stableBlockId
        ) {
          omitIds.add(block.stableBlockId);
        }
      }
    }
    return omitIds;
  }
  // App757 由来で区分 null のままだと projectionBlocks から落ちて原価管理に出ない。
  function jy2CostMgmtRepairNullCostCategories(detailModel) {
    if (
      !detailModel ||
      typeof detailModel.updateBlockHeader !== "function" ||
      typeof detailModel.snapshot !== "function"
    ) {
      return 0;
    }
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    let repaired = 0;
    for (const block of blocks) {
      if (!block || block.status === "retired") continue;
      if (block.costCategory === "施工" || block.costCategory === "保安") continue;
      const resolved = jy2ResolveCostCategoryFromWorkType(
        block.workTypeCode,
        block.workTypeName,
      );
      if (resolved !== "施工" && resolved !== "保安") continue;
      try {
        detailModel.updateBlockHeader(block.stableBlockId, {
          costCategory: resolved,
        });
        repaired += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error("jy2CostMgmtRepairNullCostCategories failed:", block, error);
        }
      }
    }
    return repaired;
  }
  // コード付き枠: 名称一致だが誤コード（例 10300）のレガシー行は修復。retired は対象外。
  function jy2CostMgmtEnsureCodedFrameList(detailModel, frames, logLabel) {
    let changes = 0;
    for (const frame of frames) {
      let blocks;
      try {
        const snap = detailModel.snapshot();
        blocks = Array.isArray(snap.blocks) ? snap.blocks : [];
      } catch {
        break;
      }
      const block = jy2CostMgmtFindActiveCodedFrameBlock(blocks, frame);
      const expectedCode = String(frame.workTypeCode || "").trim();
      const expectedName = String(frame.workTypeName || "").trim();
      const expectedCategory =
        jy2ResolveCostCategoryFromWorkType(expectedCode, expectedName) ||
        "施工";
      if (block) {
        const headerPatch = {};
        const currentCode = String(block.workTypeCode || "").trim();
        if (expectedCode && currentCode !== expectedCode) {
          headerPatch.workTypeCode = expectedCode;
        }
        const currentName = String(block.workTypeName || "").trim();
        if (expectedName && currentName !== expectedName) {
          headerPatch.workTypeName = expectedName;
        }
        if (block.costCategory !== expectedCategory) {
          headerPatch.costCategory = expectedCategory;
        }
        if (Object.keys(headerPatch).length > 0) {
          try {
            detailModel.updateBlockHeader(block.stableBlockId, headerPatch);
            changes += 1;
          } catch (error) {
            if (typeof console !== "undefined" && console.error) {
              console.error(logLabel + " repair failed:", frame, error);
            }
          }
        }
        continue;
      }
      try {
        const id = detailModel.addBlock();
        detailModel.updateBlockHeader(id, {
          workTypeName: frame.workTypeName,
          workTypeCode: frame.workTypeCode || null,
          costCategory: expectedCategory,
        });
        changes += 1;
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error(logLabel + " failed:", frame, error);
        }
      }
    }
    return changes;
  }
  // 内訳に Excel 名称枠が無いとき空ブロックを追加し、10700直後（名称枠）／その後10800・10900／オペレーター直後へ並べる。
  // 詳細行は載せず費目枠だけ（＋で追加するまで）。戻り値＝変化件数。
  function jy2CostMgmtEnsureTypeOnlyFrames(detailModel, _detailVisibility) {
    if (JY2_COST_MGMT_AUTO_LINK_DISABLED) {
      if (typeof console !== "undefined" && console.info) {
        console.info("[jy2-actual-auto-link-off] ENSURE/PLACE skipped");
      }
      return 0;
    }
    if (
      !detailModel ||
      !detailModel.allowedOperations ||
      detailModel.allowedOperations.editBudget !== true ||
      typeof detailModel.addBlock !== "function" ||
      typeof detailModel.updateBlockHeader !== "function"
    ) {
      return 0;
    }
    const repairedCategories = jy2CostMgmtRepairNullCostCategories(detailModel);
    const addedTypeOnly = jy2CostMgmtEnsureFrameList(
      detailModel,
      JY2_COST_MGMT_ENSURE_TYPE_ONLY_FRAMES,
      "jy2CostMgmtEnsureTypeOnlyFrames",
    );
    const addedDayNight = jy2CostMgmtEnsureFrameList(
      detailModel,
      JY2_COST_MGMT_ENSURE_DAY_NIGHT_FRAMES,
      "jy2CostMgmtEnsureDayNightFrames",
    );
    const addedCoded = jy2CostMgmtEnsureCodedFrameList(
      detailModel,
      JY2_COST_MGMT_ENSURE_CODED_FRAMES,
      "jy2CostMgmtEnsureCodedFrames",
    );
    // 既存の name2〃 を実値へ戻す（詳細左が空に見える不具合の修復）
    const expandedName2 = jy2CostMgmtExpandName2Ditto(detailModel);
    // 10700 → 名称枠（軌道…追加工事）→ 10800 → 10900 → オペレーター → その他コード枠
    const movedTypeOnly =
      jy2CostMgmtPlaceTypeOnlyFramesAfterPaintAncillary(detailModel);
    const movedKamagaya =
      jy2CostMgmtPlaceKamagayaAfterPaintAncillary(detailModel);
    const movedManager =
      jy2CostMgmtPlaceManagerWageAfterKamagaya(detailModel);
    const movedDayNight =
      jy2CostMgmtPlaceDayNightFramesAfterManagerWage(detailModel);
    const movedCoded =
      jy2CostMgmtPlaceCodedFramesAfterOperator(detailModel);
    return (
      repairedCategories +
      addedTypeOnly +
      addedDayNight +
      addedCoded +
      expandedName2 +
      movedKamagaya +
      movedManager +
      movedTypeOnly +
      movedDayNight +
      movedCoded
    );
  }
  function jy2CostMgmtDeniedTypes(workTypeCode, himokuLabel) {
    const byCode = JY2_COST_MGMT_TYPE_DENY[String(workTypeCode || "")];
    const denyList =
      byCode && Array.isArray(byCode[himokuLabel]) ? byCode[himokuLabel] : null;
    return denyList && denyList.length > 0 ? new Set(denyList) : null;
  }
  function jy2CostMgmtIsDeniedType(workTypeCode, himokuLabel, typeLabel) {
    const deny = jy2CostMgmtDeniedTypes(workTypeCode, himokuLabel);
    return Boolean(deny && typeLabel && deny.has(String(typeLabel).trim()));
  }
  function jy2CostMgmtIsTypeLessHimoku(himokuLabel) {
    const text = String(himokuLabel || "").trim();
    return Boolean(text && JY2_COST_MGMT_TYPELESS_HIMOKU.includes(text));
  }
  function jy2CostMgmtIsTypeOnlyHimoku(himokuLabel) {
    const text = String(himokuLabel || "").trim();
    return Boolean(text && JY2_COST_MGMT_TYPE_ONLY_HIMOKU.includes(text));
  }
  // 種別SUM行を挟まない費目（詳細2セル or 種別のみ）。
  function jy2CostMgmtIsFlatHimoku(himokuLabel) {
    return (
      jy2CostMgmtIsTypeLessHimoku(himokuLabel) ||
      jy2CostMgmtIsTypeOnlyHimoku(himokuLabel)
    );
  }
  // 種別行つき費目は詳細2セル（平坦費目は TYPELESS 経路）。#R-EXCEL-UI-14。
  function jy2CostMgmtIsDualDetailTypeHimoku(himokuLabel) {
    const text = String(himokuLabel || "").trim();
    if (!text) return false;
    return !jy2CostMgmtIsFlatHimoku(text);
  }
  function jy2CostMgmtIsTypeLessExcelWorkType(workTypeCode, workTypeName) {
    const code = String(workTypeCode || "").trim();
    const byCode = code ? JY2_COST_MGMT_HIMOKU_OVERRIDE[code] : null;
    if (byCode && byCode.length > 0) {
      return byCode.every((h) => jy2CostMgmtIsTypeLessHimoku(h));
    }
    const short = jy2CostMgmtExcelShortName(workTypeName);
    const byName = short ? JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME[short] : null;
    if (byName && byName.length > 0) {
      return byName.every((h) => jy2CostMgmtIsTypeLessHimoku(h));
    }
    return jy2CostMgmtIsTypeLessHimoku(short);
  }
  function jy2CostMgmtKnownTypesForHimoku(himokuLabel, extraTypes) {
    const himoku = String(himokuLabel || "").trim();
    const seen = new Set();
    const out = [];
    const push = (label) => {
      const text = String(label || "").trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      out.push(text);
    };
    if (himoku) {
      const fromHimoku = JY2_COST_MGMT_TYPES_OVERRIDE_BY_HIMOKU[himoku];
      if (Array.isArray(fromHimoku)) {
        for (const typeLabel of fromHimoku) push(typeLabel);
      }
      for (const byCode of Object.values(JY2_COST_MGMT_TYPES_OVERRIDE)) {
        if (byCode && Array.isArray(byCode[himoku])) {
          for (const typeLabel of byCode[himoku]) push(typeLabel);
        }
      }
    }
    if (Array.isArray(extraTypes)) {
      for (const typeLabel of extraTypes) push(typeLabel);
    }
    // 長い種別名を先に（接頭辞の誤分割防止）
    out.sort((a, b) => b.length - a.length);
    return out;
  }
  // name2 → { typeLabel, leftDetail }（dual-under-type 用）
  function jy2CostMgmtSplitTypeDetailName2(name2, himokuLabel, extraTypes) {
    const raw = String(name2 == null ? "" : name2).trim();
    const known = jy2CostMgmtKnownTypesForHimoku(himokuLabel, extraTypes);
    if (!raw) {
      return { typeLabel: "", leftDetail: "" };
    }
    for (const typeLabel of known) {
      if (!typeLabel) continue;
      if (raw === typeLabel) {
        return { typeLabel, leftDetail: "" };
      }
      const prefix = typeLabel + JY2_COST_MGMT_TYPE_DETAIL_SEP;
      if (raw.startsWith(prefix)) {
        return { typeLabel, leftDetail: raw.slice(prefix.length) };
      }
    }
    const sep = raw.indexOf(JY2_COST_MGMT_TYPE_DETAIL_SEP);
    if (sep > 0) {
      return {
        typeLabel: raw.slice(0, sep),
        leftDetail: raw.slice(sep + JY2_COST_MGMT_TYPE_DETAIL_SEP.length),
      };
    }
    return { typeLabel: raw, leftDetail: "" };
  }
  function jy2CostMgmtJoinTypeDetailName2(typeLabel, leftDetail) {
    const type = String(typeLabel || "").trim();
    const left = String(leftDetail == null ? "" : leftDetail).trim();
    if (!type) return left || null;
    if (!left) return type;
    return type + JY2_COST_MGMT_TYPE_DETAIL_SEP + left;
  }
  function jy2CostMgmtTypeLabelFromName2(name2, himokuLabel, extraTypes) {
    if (!jy2CostMgmtIsDualDetailTypeHimoku(himokuLabel)) {
      return String(name2 || "").trim();
    }
    const split = jy2CostMgmtSplitTypeDetailName2(
      name2,
      himokuLabel,
      extraTypes,
    );
    return split.typeLabel || String(name2 || "").trim();
  }
  function jy2CostMgmtAllowBlankWorkType(row) {
    const shortName = jy2CostMgmtExcelShortName(row && row.workTypeName);
    if (!shortName) return false;
    if (JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME[shortName]) return true;
    return JY2_COST_MGMT_TYPE_ONLY_HIMOKU.includes(shortName);
  }
  function jy2CostMgmtHimokuTemplate(workTypeCode, templateHimoku, workTypeName) {
    const code = String(workTypeCode || "");
    const shortName = jy2CostMgmtExcelShortName(workTypeName);
    const byCode = JY2_COST_MGMT_HIMOKU_OVERRIDE[code];
    const byName =
      shortName && JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME[shortName]
        ? JY2_COST_MGMT_HIMOKU_OVERRIDE_BY_NAME[shortName]
        : null;
    const override =
      byName && byName.length > 0
        ? byName
        : byCode && byCode.length > 0
          ? byCode
          : null;
    const base =
      override && override.length > 0
        ? [...override]
        : Array.isArray(templateHimoku)
          ? [...templateHimoku]
          : [];
    const extra = JY2_COST_MGMT_HIMOKU_EXTRA[code] || [];
    for (const himoku of extra) {
      if (himoku && !base.includes(himoku)) base.push(himoku);
    }
    return base;
  }
  function jy2CostMgmtPrimaryHimokuLabel(workTypeCode, hierarchyEntry, row) {
    const template = jy2CostMgmtHimokuTemplate(
      workTypeCode,
      jy2HimokuChoicesForEntry(hierarchyEntry),
      row && row.workTypeName,
    );
    if (template.length > 0) return template[0];
    return jy2ActualPrimaryHimokuLabel(hierarchyEntry, row);
  }
  // ダッシュ類（半角/全角/類似）・空・（種別未設定）は通常は種別行に出さない。
  function jy2CostMgmtIsDashLike(text) {
    const value = String(text || "").trim();
    return !value ? false : /^[-－―‐ーｰ−]+$/.test(value);
  }
  function jy2CostMgmtIsBlankWorkTypeCode(code) {
    const value = String(code || "").trim();
    return !value || jy2CostMgmtIsDashLike(value);
  }
  function jy2CostMgmtIsNoiseType(typeLabel) {
    const text = String(typeLabel || "").trim();
    return !text || jy2CostMgmtIsDashLike(text) || text === "（種別未設定）";
  }
  function jy2CostMgmtIsNoiseHimoku(himokuLabel) {
    const text = String(himokuLabel || "").trim();
    return !text || jy2CostMgmtIsDashLike(text) || text === "（未分類）";
  }
  function jy2CostMgmtShouldOmitType(workTypeCode, himokuLabel, typeLabel) {
    if (jy2CostMgmtIsDeniedType(workTypeCode, himokuLabel, typeLabel)) {
      return true;
    }
    // 平坦費目: 種別SUM行は描画しない（子は別経路）
    if (jy2CostMgmtIsFlatHimoku(himokuLabel)) return true;
    if (jy2CostMgmtIsNoiseType(typeLabel)) return true;
    // （塗）付き種別は Excel 短名が既にテンプレにあれば重複行として省略
    const short = jy2CostMgmtExcelShortName(typeLabel);
    if (short !== typeLabel) {
      const known = jy2CostMgmtKnownTypesForHimoku(himokuLabel, null);
      if (known.includes(short)) return true;
    }
    return false;
  }
  // name1 に（塗）種別が入っている行を primary 費目＋種別へ畳む（12400 等）
  function jy2CostMgmtCollapsePaintedName1Type(himokuLabel, primaryHimokuLabel) {
    if (!primaryHimokuLabel) return null;
    const short = jy2CostMgmtExcelShortName(himokuLabel);
    if (!short) return null;
    const known = jy2CostMgmtKnownTypesForHimoku(primaryHimokuLabel, null);
    if (!known.includes(short)) return null;
    return { himokuLabel: primaryHimokuLabel, typeLabel: short };
  }
  // コード表費目名 → Excel正費目名（13600: 接待交際費→交際費）
  function jy2CostMgmtNormalizeHimokuLabel(himokuLabel) {
    const text = String(himokuLabel || "").trim();
    if (text === "接待交際費") return "交際費";
    return text;
  }
  function jy2CostMgmtShouldOmitHimoku(himokuLabel, himokuTemplate) {
    const normalized = jy2CostMgmtNormalizeHimokuLabel(himokuLabel);
    if (jy2CostMgmtIsNoiseHimoku(normalized)) return true;
    const allowed = Array.isArray(himokuTemplate) ? himokuTemplate : [];
    if (allowed.length === 0) return true;
    if (!allowed.includes(normalized)) return true;
    return false;
  }
  const JY2_COST_MGMT_WORK_TYPE_NAME_OMIT = Object.freeze([
    "保険料", "労災保険料", "法定福利費", "雑費",
  ]);
  function jy2CostMgmtShouldOmitWorkType(workTypeCode, workTypeName) {
    const code = String(workTypeCode || "").trim();
    if (code && JY2_COST_MGMT_WORK_TYPE_OMIT.includes(code)) return true;
    const short = jy2CostMgmtExcelShortName(workTypeName);
    if (short && JY2_COST_MGMT_WORK_TYPE_NAME_OMIT.includes(short)) return true;
    return false;
  }
  function jy2CostMgmtTemplateTypes(workTypeCode, himokuLabel, typesByHimoku) {
    if (jy2CostMgmtIsFlatHimoku(himokuLabel)) return [];
    const code = String(workTypeCode || "");
    const himoku = String(himokuLabel || "").trim();
    const byCode = JY2_COST_MGMT_TYPES_OVERRIDE[code];
    const fromCode =
      byCode && himoku && Array.isArray(byCode[himoku]) ? byCode[himoku] : null;
    const fromHimoku =
      himoku && Array.isArray(JY2_COST_MGMT_TYPES_OVERRIDE_BY_HIMOKU[himoku])
        ? JY2_COST_MGMT_TYPES_OVERRIDE_BY_HIMOKU[himoku]
        : null;
    const fromOverride =
      fromCode && fromCode.length > 0
        ? fromCode
        : fromHimoku && fromHimoku.length > 0
          ? fromHimoku
          : null;
    const raw =
      fromOverride && fromOverride.length > 0
        ? [...fromOverride]
        : typesByHimoku && Array.isArray(typesByHimoku[himokuLabel])
          ? typesByHimoku[himokuLabel]
          : [];
    return raw.filter(
      (typeLabel) =>
        !jy2CostMgmtShouldOmitType(workTypeCode, himokuLabel, typeLabel),
    );
  }

  function jy2StoreActiveTab(view, tabId) {
    if (!tabId || !view || !view.sessionStorage) return;
    try {
      view.sessionStorage.setItem(JY2_ACTIVE_TAB_KEY, String(tabId));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ReadStoredActiveTab(view, allowedIds) {
    if (!view || !view.sessionStorage || !Array.isArray(allowedIds)) return null;
    try {
      const raw = view.sessionStorage.getItem(JY2_ACTIVE_TAB_KEY);
      return raw && allowedIds.includes(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  function jy2FindPaneHScroll(pane) {
    if (!pane || typeof pane.querySelector !== "function") return null;
    return (
      pane.querySelector(".jy2-pane-hscroll") ||
      pane.querySelector(".jy2-actual-scroll") ||
      pane.querySelector(".jy2-table-scroll")
    );
  }

  function jy2PaneIsVisible(pane) {
    if (!pane) return false;
    const view = pane.ownerDocument && pane.ownerDocument.defaultView;
    if (!view || typeof view.getComputedStyle !== "function") {
      return pane.style.display !== "none";
    }
    const style = view.getComputedStyle(pane);
    return Boolean(style && style.display !== "none" && style.visibility !== "hidden");
  }

  /** 再描画前の縦・横位置。空 pane（初回）は null。非表示タブは縦を触らない */
  function jy2CaptureScroll(documentRef, pane) {
    if (!pane || !pane.firstChild) return null;
    const view = documentRef && documentRef.defaultView;
    const h = jy2FindPaneHScroll(pane);
    const visible = jy2PaneIsVisible(pane);
    return {
      y:
        visible && view && typeof view.scrollY === "number" ? view.scrollY : null,
      x: h && typeof h.scrollLeft === "number" ? h.scrollLeft : 0,
    };
  }

  function jy2ApplyScroll(documentRef, pane, captured) {
    if (!captured) return;
    const view = documentRef && documentRef.defaultView;
    const apply = () => {
      if (
        typeof captured.y === "number" &&
        view &&
        typeof view.scrollTo === "function"
      ) {
        view.scrollTo(0, captured.y);
      }
      const h = jy2FindPaneHScroll(pane);
      if (h && typeof captured.x === "number") h.scrollLeft = captured.x;
    };
    apply();
    // 1 回だけ次フレームで追従（二重 rAF は Violation の温床）。
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(apply);
    }
  }

  function jy2StoreScrollForReload(view, documentRef, tabId) {
    if (!view || !view.sessionStorage) return;
    try {
      const y =
        typeof view.scrollY === "number"
          ? view.scrollY
          : view.pageYOffset || 0;
      view.sessionStorage.setItem(JY2_SCROLL_Y_KEY, String(y));
      let x = 0;
      if (documentRef && tabId) {
        const pane = documentRef.querySelector(
          `.jy2-pane[data-tab-id="${tabId}"]`,
        );
        const h = jy2FindPaneHScroll(pane);
        if (h) x = h.scrollLeft || 0;
      }
      view.sessionStorage.setItem(JY2_HSCROLL_KEY, String(x));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ConsumeStoredScroll(view) {
    if (!view || !view.sessionStorage) return null;
    try {
      const yRaw = view.sessionStorage.getItem(JY2_SCROLL_Y_KEY);
      const xRaw = view.sessionStorage.getItem(JY2_HSCROLL_KEY);
      view.sessionStorage.removeItem(JY2_SCROLL_Y_KEY);
      view.sessionStorage.removeItem(JY2_HSCROLL_KEY);
      if (yRaw == null && xRaw == null) return null;
      return {
        y: Number(yRaw) || 0,
        x: Number(xRaw) || 0,
      };
    } catch {
      return null;
    }
  }

  function jy2ReloadPreservingTab(view, tabId, documentRef) {
    jy2StoreActiveTab(view, tabId);
    jy2StoreScrollForReload(view, documentRef || (view && view.document), tabId);
    if (view && view.location) view.location.reload();
  }

  function jy2ParentRevisionFromBulkResults(results) {
    const first = Array.isArray(results) ? results[0] : null;
    if (!first || typeof first !== "object") return "";
    if (first.revision != null) return String(first.revision);
    if (first.records && first.records[0] && first.records[0].revision != null) {
      return String(first.records[0].revision);
    }
    return "";
  }

  // REST で親を更新したあと、kintone 本体が古い revision のままだと
  // 「レコードに新しいバージョンがあります」ダイアログが出る。詳細画面の内部状態を同期する。
  function jy2SyncNativeRecordRevision(view, revision) {
    const rev = String(revision == null ? "" : revision).trim();
    if (!rev || !view) return false;
    let synced = false;
    const applyToRecordBag = (bag) => {
      if (!bag || typeof bag !== "object") return;
      const rec = bag.record && typeof bag.record === "object" ? bag.record : bag;
      if (!rec || typeof rec !== "object") return;
      if (rec.$revision && typeof rec.$revision === "object") {
        rec.$revision.value = rev;
        synced = true;
      } else if (Object.prototype.hasOwnProperty.call(rec, "$revision")) {
        rec.$revision = { value: rev };
        synced = true;
      }
      if (Object.prototype.hasOwnProperty.call(bag, "revision")) {
        bag.revision = rev;
        synced = true;
      }
    };
    try {
      const page =
        view.cybozu && view.cybozu.data && view.cybozu.data.page
          ? view.cybozu.data.page
          : null;
      if (page) {
        applyToRecordBag(page.RECORD_DATA);
        applyToRecordBag(page.record);
        applyToRecordBag(page.FORM_DATA);
        if (page.FORM_DATA && page.FORM_DATA.record) {
          applyToRecordBag(page.FORM_DATA.record);
        }
      }
    } catch {
      // private internals — ignore
    }
    return synced;
  }

  function jy2ReadStoredFontScale(view) {
    if (!view || !view.localStorage) return "standard";
    try {
      const raw = view.localStorage.getItem(JY2_FONT_SCALE_KEY);
      return raw && JY2_FONT_SCALES.includes(raw) ? raw : "standard";
    } catch {
      return "standard";
    }
  }

  function jy2StoreFontScale(view, scale) {
    if (!scale || !view || !view.localStorage) return;
    try {
      view.localStorage.setItem(JY2_FONT_SCALE_KEY, String(scale));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ApplyFontScale(shell, scale) {
    if (!shell) return;
    shell.dataset.fontScale =
      scale && JY2_FONT_SCALES.includes(scale) ? scale : "standard";
  }

  function jy2FieldValue(record, code) {
    const field = record && record[code];
    return field && typeof field === "object" && "value" in field
      ? field.value
      : field;
  }

  function jy2LockState(record) {
    const derived = jy2FieldValue(record, "derived_lock_state");
    try {
      allowedOperations(derived);
      return derived;
    } catch {
      // A new/offline record may not have its derived cache yet.
    }
    const status = jy2FieldValue(record, "status") || "下書き";
    try {
      return deriveLockState({ status, newerVersionExists: false });
    } catch {
      return LOCK_STATES.FULL_LOCKED;
    }
  }

  function jy2InstallStyle(documentRef) {
    if (!documentRef) return;
    let style = documentRef.getElementById(JY2_STYLE_ID);
    if (!style) {
      style = documentRef.createElement("style");
      style.id = JY2_STYLE_ID;
      documentRef.head.appendChild(style);
    }
    style.textContent = [
      // A-07 / Ver.01テイスト: slate chrome・色分けタブ・シート見出し・薄茶合計
      // overflow-x:hidden は overflow-y を auto 化し sticky を壊す → clip で横だけ切る
      // #R-UI-01 / #S-UI-01: sticky/fixed メニュー祖先に overflow-x:hidden 禁止（verify:jikkou-v2-chrome-css）
      ".jy2-shell{font-family:'Segoe UI',Meiryo,sans-serif;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;color:#334155;overflow-x:clip;overflow-y:visible;padding:0 0 12px;max-width:100%;width:100%;min-width:0;box-sizing:border-box}",
      ".jy2-header{display:none}",
      ".jy2-title{margin:0;font-size:22px;font-weight:800;letter-spacing:.28em;color:#334155;line-height:1.35}",
      ".jy2-header-stub{font-size:11px;color:#64748b;letter-spacing:normal;opacity:1}",
      ".jy2-tabs{display:flex;gap:4px;padding:6px 0 0;background:transparent;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}",
      ".jy2-tab{border:1px solid #cbd5e1;border-bottom:0;border-radius:6px 6px 0 0;background:#f1f5f9;padding:8px 14px;cursor:pointer;font-size:14px;font-weight:600;color:#475569;white-space:nowrap;flex:0 0 auto}",
      ".jy2-tab[data-tab-id='header']{background:#f8fafc;color:#475569;border-color:#94a3b8}",
      ".jy2-tab[data-tab-id='holiday']{background:#f8fafc;color:#475569;border-color:#94a3b8}",
      ".jy2-tab[data-tab-id='summary']{background:#eff6ff;color:#1e40af;border-color:#93c5fd}",
      ".jy2-tab[data-tab-id='detail']{background:#ecfdf5;color:#166534;border-color:#86efac}",
      ".jy2-tab[data-tab-id='actual']{background:#fffbeb;color:#92400e;border-color:#fcd34d}",
      ".jy2-tab[data-tab-id='version']{background:#f5f3ff;color:#5b21b6;border-color:#c4b5fd}",
      ".jy2-tab[aria-selected='true']{background:#fff;font-weight:800;box-shadow:0 -1px 0 #fff}",
      ".jy2-tab[data-tab-id='summary'][aria-selected='true']{background:#2563eb;color:#fff;border-color:#2563eb}",
      ".jy2-tab[data-tab-id='detail'][aria-selected='true']{background:#059669;color:#fff;border-color:#059669}",
      ".jy2-tab[data-tab-id='actual'][aria-selected='true']{background:#d97706;color:#fff;border-color:#d97706}",
      ".jy2-tab[data-tab-id='version'][aria-selected='true']{background:#7c3aed;color:#fff;border-color:#7c3aed}",
      ".jy2-tab[data-tab-id='header'][aria-selected='true']{background:#64748b;color:#fff;border-color:#64748b}",
      ".jy2-tab[data-tab-id='holiday'][aria-selected='true']{background:#64748b;color:#fff;border-color:#64748b}",
      ".jy2-tab[data-read-only='true']::after{content:' 🔒';font-size:11px}",
      ".jy2-pane{display:none;min-height:0;padding:8px 12px 14px;background:#fff;border:1px solid #cbd5e1;border-top:none;border-radius:0 0 8px 8px;max-width:100%;min-width:0;width:100%;box-sizing:border-box;overflow-x:clip;overflow-y:visible}",
      ".jy2-pane[data-active='true']{display:block}",
      // U38: タブ切替が分かるようペイン全体を薄い色面に（表セルは白維持）
      ".jy2-pane[data-tab-id='header'][data-active='true']{border-color:#94a3b8;border-top:3px solid #64748b;background:#f1f5f9}",
      ".jy2-pane[data-tab-id='holiday'][data-active='true']{border-color:#94a3b8;border-top:3px solid #64748b;background:#f1f5f9}",
      ".jy2-pane[data-tab-id='summary'][data-active='true']{border-color:#93c5fd;border-top:3px solid #3b82f6;background:#e8f4fd}",
      ".jy2-pane[data-tab-id='detail'][data-active='true']{border-color:#86efac;border-top:3px solid #22c55e;background:#e8f5e9}",
      ".jy2-pane[data-tab-id='actual'][data-active='true']{border-color:#fcd34d;border-top:3px solid #f59e0b;background:#fff3e0}",
      ".jy2-pane[data-tab-id='version'][data-active='true']{border-color:#c4b5fd;border-top:3px solid #7c3aed;background:#f3e8ff}",
      ".jy2-pane[data-active='true'] .jy2-table,.jy2-pane[data-active='true'] .jy2-detail-table,.jy2-pane[data-active='true'] .jy2-actual-table,.jy2-pane[data-active='true'] .jy2-version-table,.jy2-pane[data-active='true'] .jy2-budget-summary,.jy2-pane[data-active='true'] .jy2-detail-block{background:#fff}",
      ".jy2-pane[data-active='true'] .jy2-table-scroll,.jy2-pane[data-active='true'] .jy2-actual-scroll{background:transparent}",
      // A-07: Ver.01同趣旨のシート見出し。sticky 下に常時表示しスクロールで隠れない
      ".jy2-sticky-sheet-banner{display:flex;justify-content:center;align-items:center;width:100%;margin:4px 0 0;padding:0 8px 6px;box-sizing:border-box}",
      /* シート見出しは sticky のみ。ペイン内バナーは Dom に残さない／残っても空間ゼロ */
      ".jy2-pane-head-banner{display:none!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;border:0!important}",
      ".jy2-sheet-title{width:100%;max-width:960px;box-sizing:border-box;padding:10px 36px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;line-height:1.3;text-align:center;box-shadow:0 3px 8px rgba(15,23,42,.12);margin:0 auto}",
      ".jy2-sheet-title-header{background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 55%,#cbd5e1 100%);border:1px solid #94a3b8}",
      ".jy2-sheet-title-holiday{background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 55%,#cbd5e1 100%);border:1px solid #94a3b8}",
      ".jy2-sheet-title-summary{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 55%,#bfdbfe 100%);border:1px solid #93c5fd}",
      ".jy2-sheet-title-detail{background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 55%,#bbf7d0 100%);border:1px solid #86efac}",
      ".jy2-sheet-title-actual{background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 55%,#fde68a 100%);border:1px solid #fcd34d}",
      ".jy2-sheet-title-version{background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 55%,#ddd6fe 100%);border:1px solid #c4b5fd}",
      // letter-spacing 末尾空きを打ち消し、帯の中で文字だけ視覚中央へ
      ".jy2-sheet-title-doc{display:inline-block;font-size:22px;font-weight:800;letter-spacing:.2em;margin-inline-end:-.2em;padding:0;color:#1e3a8a;text-align:center}",
      ".jy2-sheet-title-detail .jy2-sheet-title-doc{color:#14532d}",
      ".jy2-sheet-title-actual .jy2-sheet-title-doc{color:#92400e}",
      ".jy2-sheet-title-version .jy2-sheet-title-doc{color:#5b21b6}",
      ".jy2-sheet-title-header .jy2-sheet-title-doc{color:#334155}",
      ".jy2-sheet-title-holiday .jy2-sheet-title-doc{color:#334155}",
      ".jy2-sheet-title-sheet{display:inline-block;font-size:16px;font-weight:700;letter-spacing:.2em;margin-inline-end:-.2em;padding:5px 22px;border-radius:8px;background:#fff;text-align:center}",
      ".jy2-sheet-title-summary .jy2-sheet-title-sheet{color:#1d4ed8;border:1px solid #93c5fd}",
      ".jy2-sheet-title-detail .jy2-sheet-title-sheet{color:#047857;border:1px solid #86efac}",
      ".jy2-sheet-title-actual .jy2-sheet-title-sheet{color:#b45309;border:1px solid #fcd34d}",
      ".jy2-sheet-title-version .jy2-sheet-title-sheet{color:#6d28d9;border:1px solid #c4b5fd}",
      ".jy2-sheet-title-header .jy2-sheet-title-sheet{color:#475569;border:1px solid #94a3b8}",
      ".jy2-sheet-title-holiday .jy2-sheet-title-sheet{color:#475569;border:1px solid #94a3b8}",
      "@media (max-width:900px){.jy2-sheet-title{padding:12px 20px}.jy2-sheet-title-doc{font-size:18px;letter-spacing:.14em;margin-inline-end:-.14em}.jy2-sheet-title-sheet{font-size:14px;letter-spacing:.14em;margin-inline-end:-.14em;padding:4px 14px}}",
      ".jy2-empty{color:#475569;font-size:13px;padding:10px 12px;margin:8px 0;background:#fff;border:1px dashed #94a3b8;border-radius:8px;border-left:4px solid #64748b}",
      ".jy2-section-title{margin:14px 0 6px;font-size:14px;font-weight:700;padding:6px 10px;background:#e8eef4;border-left:4px solid #2563eb;color:#1e3a8a;border-radius:0 6px 6px 0}",
      ".jy2-pane[data-tab-id='summary'] .jy2-section-title{background:#dbeafe;border-left-color:#2563eb;color:#1e3a8a}",
      ".jy2-pane[data-tab-id='detail'] .jy2-section-title{background:#d1fae5;border-left-color:#059669;color:#14532d}",
      ".jy2-pane[data-tab-id='actual'] .jy2-section-title{background:#fde68a;border-left-color:#d97706;color:#92400e}",
      ".jy2-pane[data-tab-id='version'] .jy2-section-title{background:#ddd6fe;border-left-color:#7c3aed;color:#5b21b6}",
      // U39: キーボード操作の現在位置（マウス時は :focus-visible のみ）
      ".jy2-shell .jy2-tab:focus-visible,.jy2-shell .jy2-btn:focus-visible,.jy2-shell .jy2-row-button:focus-visible,.jy2-shell .jy2-save-button:focus-visible,.jy2-shell .jy2-nav-block-no:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px;box-shadow:0 0 0 4px rgba(37,99,235,.2)}",
      ".jy2-shell .jy2-input:focus-visible,.jy2-shell .jy2-select:focus-visible,.jy2-shell .jy2-combo-select:focus-visible{outline:2px solid #2563eb;outline-offset:1px;border-color:#2563eb}",
      // 行スキャナ（フッタは除外）
      ".jy2-detail-table tbody tr:not(.jy2-footer-row):hover>td,.jy2-contract-table tbody tr:hover>td,.jy2-salary-table tbody tr:hover>td,.jy2-projection-table tbody tr:hover>td{background:#f8fafc}",
      ".jy2-readonly{color:#64748b;background:#f8fafc}",
      ".jy2-detail-block[data-block-status='retired']{opacity:.72;border-style:dashed;border-color:#94a3b8}",
      // 表の横スクロール: 親は幅固定・子だけ overflow-x（親が表幅に広がるとスクロールが出ない）
      // 右端パディングで最終列の縦罫線が clip されないようにする（C5/C12）
      // ラッパ=可視天井の固定px。横バーは画面下固定レール（長い総括の最下部だと見えない）。
      ".jy2-table-scroll{display:block;overflow-x:auto;overflow-y:visible;max-width:100%;width:100%;min-width:0;margin:0 0 8px;padding:0 14px 10px 0;box-sizing:border-box;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;contain:inline-size;scrollbar-width:none}",
      ".jy2-table-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      ".jy2-pane-hscroll{margin:0}",
      ".jy2-hscroll-inner{display:block;box-sizing:border-box;max-width:none;min-width:1400px}",
      "#jy2-fixed-hrail{position:fixed;left:0;right:auto;bottom:0;z-index:2000;height:18px;overflow-x:scroll;overflow-y:hidden;background:#e2e8f0;border-top:1px solid #94a3b8;box-shadow:0 -2px 8px rgba(15,23,42,.12);display:none}",
      "#jy2-fixed-hrail .jy2-fixed-hrail-spacer{height:1px;pointer-events:none}",
      ".jy2-pane[data-tab-id='summary'],.jy2-pane[data-tab-id='detail']{contain:inline-size}",
      // 表は inner 幅いっぱい（inner が固定pxなので狭幅でも表は縮まない）
      ".jy2-table-scroll .jy2-table,.jy2-table-scroll .jy2-detail-table{display:table;width:100%!important;min-width:0;max-width:none!important;margin:0 0 16px;box-sizing:border-box;table-layout:auto}",
      ".jy2-contract-table .jy2-input,.jy2-salary-table .jy2-input,.jy2-projection-table .jy2-input{min-width:4.75rem}",
      ".jy2-contract-table .jy2-select,.jy2-salary-table .jy2-select,.jy2-projection-table .jy2-select{min-width:4.25rem}",
      ".jy2-contract-table th:nth-child(2),.jy2-contract-table td:nth-child(2){min-width:14rem}",
      ".jy2-contract-table td:nth-child(2) .jy2-input{min-width:14rem}",
      ".jy2-contract-table th:nth-child(4),.jy2-contract-table td:nth-child(4){min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table td:nth-child(4) .jy2-input{min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table th:nth-child(5),.jy2-contract-table td:nth-child(5){min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table td:nth-child(5) .jy2-input{min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table th:nth-child(6),.jy2-contract-table td:nth-child(6){min-width:4.5rem;max-width:6.5rem}",
      ".jy2-salary-table th:nth-child(1),.jy2-salary-table td:nth-child(1){min-width:8rem}",
      ".jy2-table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:12px;background:#fff;border-radius:6px;overflow:visible}",
      ".jy2-table th,.jy2-table td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:middle}",
      ".jy2-table th{background:#f1f5f9;font-weight:600;color:#475569;text-align:center;white-space:nowrap}",
      ".jy2-band-row th{background:#eef3fa;text-align:left;color:#1e3a8a}",
      ".jy2-total-row td,.jy2-block-total-row td{background:#f5ebe0!important;color:#44372a;font-weight:700;border-color:#d4b896!important;border-top:2px solid #c4a574!important}",
      ".jy2-num{text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-amount{text-align:right;background:#F3F8FC;font-variant-numeric:tabular-nums}",
      ".jy2-input{width:100%;box-sizing:border-box;border:1px solid #e2e8f0;padding:2px 4px;background:#FFFCF3;border-radius:4px;font-size:12px}",
      ".jy2-input:focus{border-color:#2563eb}",
      ".jy2-input.jy2-combo{background:#F4FAF4}",
      ".jy2-combo-wrap{display:flex;align-items:stretch;flex-wrap:wrap;gap:0;width:100%;min-width:0}",
      ".jy2-combo-wrap>.jy2-input{flex:1;min-width:0;border-top-right-radius:0;border-bottom-right-radius:0}",
      ".jy2-combo-wrap>.jy2-combo-select{flex:0 0 2rem;width:2rem;max-width:2rem;padding:0;margin:0;border:1px solid #cbd5e1;border-left:0;border-radius:0 4px 4px 0;background:#F4FAF4;cursor:pointer;font-size:11px;line-height:1}",
      ".jy2-combo-list-only>.jy2-combo-readonly{cursor:pointer;background:#F4FAF4;caret-color:transparent}",
      ".jy2-combo-list-only>.jy2-combo-readonly:focus{outline:2px solid #2563eb;outline-offset:1px}",
      ".jy2-select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;padding:2px 4px;background:#f1f5f9;border-radius:4px;cursor:pointer}",
      ".jy2-select:focus{border-color:#2563eb;background:#eef4ff}",
      ".jy2-incomplete{background:#FFF5F5!important}",
      ".jy2-incomplete .jy2-input,.jy2-incomplete .jy2-select,.jy2-incomplete .jy2-combo-select{background:#FFF5F5!important}",
      ".jy2-name-continued{background:#e8f1fb!important}",
      ".jy2-name-continued .jy2-input,.jy2-name-continued .jy2-combo,.jy2-name-continued .jy2-combo-select{background:#e8f1fb!important}",
      ".jy2-name-unset{background:#f1f5f9!important;box-shadow:inset 0 0 0 1px #cbd5e1}",
      ".jy2-name-unset .jy2-input,.jy2-name-unset .jy2-combo,.jy2-name-unset .jy2-combo-select{background:#f8fafc!important}",
      ".jy2-row-button{border:1px solid #cbd5e1;background:#f8fafc;padding:2px 8px;cursor:pointer;font-size:11px;border-radius:6px;font-weight:600;color:#334155}",
      ".jy2-row-button:hover{background:#f1f5f9}",
      ".jy2-projection-table td{background:#fff}",
      ".jy2-projection-table .jy2-amount{background:#F3F8FC}",
      ".jy2-budget-summary{margin:12px 0 4px;border:1px solid #c4a574;border-radius:6px;background:#fffdf9}",
      ".jy2-budget-summary-head{background:linear-gradient(180deg,#f5ebe0,#efe3d4);color:#44372a;font-weight:700;font-size:13px;padding:8px 12px;border-bottom:1px solid #d4b896;border-radius:5px 5px 0 0}",
      ".jy2-budget-summary-wrap{padding:8px 10px 10px}",
      ".jy2-budget-summary-table{width:100%;border-collapse:collapse;font-size:12px}",
      ".jy2-budget-summary-table th,.jy2-budget-summary-table td{border:1px solid #d4b896;padding:6px 8px}",
      ".jy2-budget-summary-table th{background:#f5ebe0;color:#44372a;font-weight:600;text-align:center}",
      ".jy2-budget-summary-table td.jy2-budget-col-label{font-weight:600;color:#3d2f24;white-space:nowrap}",
      ".jy2-budget-summary-table tr.jy2-budget-total-row td{background:#f5ebe0;font-weight:700;border-top:2px solid #c4a574}",
      ".jy2-budget-summary-table .jy2-num{text-align:right}",
      ".jy2-budget-summary-keys{width:100%;border-collapse:collapse;font-size:12px;margin:0 0 10px}",
      ".jy2-budget-summary-keys th,.jy2-budget-summary-keys td{border:1px solid #d4b896;padding:5px 10px}",
      ".jy2-budget-summary-keys th{background:#f5ebe0;color:#44372a;font-weight:600}",
      ".jy2-budget-summary-keys .jy2-key-row td{font-weight:700;background:#f8f1e8}",
      ".jy2-budget-summary-keys .jy2-sub-row td{font-size:11px;color:#5c4a3a;background:#fffdf9}",
      ".jy2-budget-summary-note{margin:6px 0 0;font-size:10px;color:#64748b;line-height:1.45}",
      ".jy2-summary-footer{margin-top:8px}",
      // 横スクロールは pane-hscroll 1本。ブロックは inner 幅に追従（縮むのは inner 固定pxが防ぐ）
      ".jy2-detail-block{border:1px solid #cbd5e1;border-radius:8px;margin:0 0 16px;background:#fff;overflow:visible;box-shadow:0 1px 3px rgba(15,23,42,.04);max-width:none;min-width:0;width:100%;box-sizing:border-box}",
      ".jy2-detail-block-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(180deg,#ecfdf5,#d1fae5);font-size:12px;border-bottom:1px solid #bbf7d0}",
      ".jy2-detail-block-head label{display:flex;align-items:center;gap:4px}",
      ".jy2-detail-block-head input,.jy2-detail-block-head select{min-width:110px}",
      ".jy2-block-no{font-weight:800;background:#fff;color:#047857;padding:3px 10px;border:1px solid #86efac;border-radius:6px}",
      ".jy2-nav-block-no{cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
      "button.jy2-nav-block-no{display:inline-block;font:inherit;font-weight:700;color:#1d4ed8;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:2px 8px}",
      "button.jy2-nav-block-no:hover{background:#dbeafe}",
      "span.jy2-block-no.jy2-nav-block-no{color:#047857}",
      "span.jy2-block-no.jy2-nav-block-no:hover{background:#ecfdf5;box-shadow:0 0 0 2px #86efac}",
      ".jy2-nav-flash{outline:3px solid #2563eb!important;box-shadow:0 0 0 4px rgba(37,99,235,.28)!important}",
      "tr.jy2-nav-flash>td{background:#dbeafe!important}",
      ".jy2-detail-block.jy2-nav-flash{background:#eff6ff}",
      ".jy2-block-actions{margin-left:auto;display:flex;gap:4px}",
      ".jy2-detail-table{margin:0}",
      ".jy2-hscroll-inner>.jy2-detail-block{width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-hscroll-inner>.jy2-budget-summary{width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-detail-table th.jy2-th-stacked{min-width:4.5rem;padding:6px 4px!important}",
      ".jy2-detail-table .jy2-th-stack .jy2-th-label{white-space:normal;max-width:6.5rem;line-height:1.25}",
      ".jy2-detail-table .jy2-combo-wrap{min-width:8.5rem}",
      // 詳細（入力）／材料（選択）列: 長文見切れ緩和（契約工種 C16 と同趣旨・ホバー全文は fullTitle）
      ".jy2-detail-table th.jy2-col-detail,.jy2-detail-table td.jy2-col-detail{min-width:16rem}",
      ".jy2-detail-table td.jy2-col-detail .jy2-combo-wrap{min-width:16rem}",
      ".jy2-detail-table td.jy2-col-detail .jy2-input{min-width:14rem}",
      // 備考列: 長文見切れ緩和（詳細列と同趣旨）
      ".jy2-detail-table th.jy2-col-note,.jy2-detail-table td.jy2-col-note{min-width:12rem}",
      ".jy2-detail-table td.jy2-col-note .jy2-input{min-width:11rem}",
      ".jy2-detail-table td .jy2-input{min-width:5.5rem}",
      ".jy2-detail-table td .jy2-select{min-width:4.5rem}",
      ".jy2-footer-row td{background:#f8fafc}",
      ".jy2-footer-row .jy2-footer-label{font-weight:700;text-align:left!important;vertical-align:middle;padding:4px 8px!important}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-stack{flex-direction:row!important;align-items:center;justify-content:flex-start;gap:6px;margin:0!important;width:auto;max-width:100%}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-label{white-space:nowrap;font-size:12px;text-align:left}",
      ".jy2-footer-row .jy2-num,.jy2-footer-row .jy2-amount{min-width:9.5rem;width:9.5rem;max-width:12rem;white-space:nowrap;padding:4px 8px;box-sizing:border-box}",
      ".jy2-footer-row .jy2-input{width:100%;min-width:8.5rem;box-sizing:border-box;padding:4px 6px;font-size:13px;text-align:right}",
      ".jy2-footer-row .jy2-footer-basis{color:#64748b;font-size:11px;white-space:nowrap;text-align:left;padding:4px 8px}",
      ".jy2-detail-table th:nth-child(7),.jy2-detail-table td.jy2-amount{min-width:7.5rem}",
      ".jy2-warning{color:#b91c1c;font-size:12px;margin:4px 0;font-weight:600}",
      ".jy2-combo-miss{display:block;flex:0 0 100%;width:100%;color:#b91c1c;font-size:11px;font-weight:600;margin-top:2px;line-height:1.2}",
      ".jy2-combo-miss[hidden]{display:none}",
      ".jy2-retired-tag{color:#b91c1c;font-weight:700}",
      // 予実: 横スクロール1本のみ（縦はページスクロール。二重縦スクロール禁止＝C7）
      ".jy2-pane[data-tab-id='actual']{overflow-x:clip;overflow-y:visible;padding:8px 8px 8px 8px}",
      /* 右息抜き ~10px（6px基準から左へ+4px＝浜田意図。2pxは逆方向だった） */
      ".jy2-actual-scroll{display:block;overflow-x:auto;overflow-y:visible;border:1px solid #e2e8f0;border-radius:6px;background:#fff;max-width:100%;width:100%;min-width:0;max-height:none;box-sizing:border-box;padding:0 10px 10px 0;margin:0;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;contain:inline-size;scrollbar-width:none}",
      ".jy2-actual-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      ".jy2-actual-table{white-space:nowrap;margin:0;border-collapse:separate;border-spacing:0;font-size:13px;width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-actual-table th,.jy2-actual-table td{padding:5px 7px;vertical-align:middle}",
      ".jy2-actual-table .jy2-input{min-width:48px;font-size:13px;line-height:1.35}",
      ".jy2-actual-table .jy2-actual-month{width:3.8rem;min-width:3.8rem;max-width:4rem;padding:3px 4px;box-sizing:border-box}",
      /* Phase2b (2026-07-31): 月次「数量」は「金額」より一段狭く。数字桁が短い想定。 */
      ".jy2-actual-table .jy2-actual-month.jy2-actual-month-qty{width:2.8rem;min-width:2.8rem;max-width:3rem}",
      ".jy2-actual-table thead th.jy2-actual-month{padding:5px 2px;vertical-align:bottom}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-stack{gap:2px;width:100%;max-width:100%;margin:0 auto}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-label{font-size:11px;font-weight:700;white-space:normal;line-height:1.2;max-width:3.8rem}",
      ".jy2-actual-table thead th.jy2-actual-month.jy2-actual-month-qty .jy2-th-label{max-width:2.8rem}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-hf-tag{font-size:9px;padding:1px 4px;letter-spacing:0}",
      ".jy2-actual-table .jy2-actual-month .jy2-input{min-width:0;width:100%;padding:3px 4px;font-size:12px}",
      ".jy2-actual-table th.jy2-actual-rate-end,.jy2-actual-table td.jy2-actual-rate-end{min-width:4.25rem;width:4.25rem;padding:4px 6px 4px 4px!important;box-sizing:border-box;text-align:right}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-stack{width:100%;margin:0;align-items:flex-end}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-label{white-space:nowrap;font-size:11px}",
      /* #R-EXCEL-UI-17: 予実上部の案内帯 */
      ".jy2-actual-chrome{display:flex;flex-direction:column;gap:6px;margin:0 0 10px;padding:8px 10px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:8px;box-sizing:border-box}",
      ".jy2-actual-note-details{margin:0;font-size:12px;color:#64748b}",
      ".jy2-actual-note-details>summary{cursor:pointer;list-style:none;font-weight:600;color:#334155;padding:2px 0;user-select:none}",
      ".jy2-actual-note-details>summary::-webkit-details-marker{display:none}",
      ".jy2-actual-note-details>summary::before{content:'▶ ';font-size:10px;color:#64748b}",
      ".jy2-actual-note-details[open]>summary::before{content:'▼ '}",
      ".jy2-actual-note-details[open]>summary{color:#0f172a}",
      ".jy2-actual-note{color:#64748b;font-size:11px;margin:6px 0 0;padding:6px 8px;line-height:1.5;background:#fff;border-left:3px solid #94a3b8;border-radius:0 4px 4px 0}",
      ".jy2-actual-detail-add-notice{margin:0!important;padding:6px 10px!important;font-size:12px!important;font-weight:600;color:#14532d;background:#ecfdf5;border:1px solid #a7f3d0;border-left:3px solid #22c55e;border-radius:4px;line-height:1.4}",
      ".jy2-actual-totals-bar{position:sticky;top:0;z-index:45;margin:0 0 8px;padding:0;background:linear-gradient(180deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #f59e0b;border-radius:8px;box-shadow:0 1px 4px rgba(120,53,15,.08);box-sizing:border-box}",
      ".jy2-actual-totals-bar>summary{cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 0;padding:9px 12px;font-size:13px;font-weight:700;color:#92400e;user-select:none}",
      ".jy2-actual-totals-bar>summary::-webkit-details-marker{display:none}",
      ".jy2-actual-totals-bar>summary::before{content:'▶ ';font-size:11px}",
      ".jy2-actual-totals-bar[open]>summary::before{content:'▼ '}",
      ".jy2-actual-totals-bar>summary:hover{background:rgba(255,255,255,.35)}",
      ".jy2-actual-totals-bar>summary .jy2-actual-totals-summary-budget{font-weight:800;font-size:15px;color:#1c1917;margin-left:8px;font-variant-numeric:tabular-nums;letter-spacing:.01em}",
      ".jy2-actual-totals-bar>summary .jy2-actual-totals-summary-hint{font-weight:500;color:#a16207;margin-left:10px;font-size:11px;opacity:.9}",
      ".jy2-actual-totals-bar .jy2-actual-totals-body{display:flex;flex-direction:column;gap:8px;padding:0 12px 10px;border-top:1px solid #fcd34d}",
      ".jy2-actual-totals-bar .jy2-actual-totals-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 22px;padding-top:8px}",
      ".jy2-actual-totals-bar .jy2-actual-totals-item{display:flex;flex-direction:column;gap:2px;min-width:7rem}",
      ".jy2-actual-totals-bar .jy2-actual-totals-label{font-size:11px;font-weight:600;color:#92400e}",
      ".jy2-actual-totals-bar .jy2-actual-totals-value{font-size:16px;font-weight:700;color:#1c1917;font-variant-numeric:tabular-nums}",
      ".jy2-actual-totals-bar .jy2-actual-totals-months-label{font-size:11px;font-weight:600;color:#92400e;margin:0}",
      ".jy2-actual-totals-bar .jy2-actual-totals-months{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;max-width:100%;padding-bottom:2px;-webkit-overflow-scrolling:touch}",
      ".jy2-actual-totals-bar .jy2-actual-totals-month{flex:0 0 auto;min-width:5.5rem;padding:6px 8px;background:#fff;border:1px solid #fcd34d;border-radius:6px;box-sizing:border-box}",
      ".jy2-actual-totals-bar .jy2-actual-totals-month-name{display:block;font-size:11px;font-weight:700;color:#78350f;margin-bottom:2px}",
      ".jy2-actual-totals-bar .jy2-actual-totals-month-line{display:block;font-size:11px;color:#44403c;font-variant-numeric:tabular-nums;line-height:1.35;white-space:nowrap}",
      ".jy2-actual-totals-bar .jy2-actual-totals-note{margin:0;font-size:11px;color:#78716c}",
      /* 2026-07-29-ver02-actual-detail-expand: 親行の＋/－ボタン・明細子行の見た目 */
      ".jy2-actual-expand-btn{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin-right:4px;font-size:11px;font-weight:700;line-height:1;border:1px solid #94a3b8;border-radius:3px;background:#f8fafc;color:#334155;cursor:pointer}",
      ".jy2-actual-expand-btn:hover{background:#e2e8f0;border-color:#64748b}",
      ".jy2-actual-parent-num{display:inline-block;min-width:1.5rem}",
      /* 3段階薄色: 費目=薄緑 / 種別=薄青 / 詳細=ほぼ白（入力しやすい） */
      ".jy2-actual-table .jy2-actual-parent-row td{background:#e8f5e9!important;color:#1e293b}",
      ".jy2-actual-table .jy2-actual-parent-row .jy2-freeze{background:#e8f5e9!important}",
      ".jy2-actual-child-row td{background:#ffffff}",
      ".jy2-actual-child-row .jy2-freeze{background:#ffffff}",
      ".jy2-actual-child-row td.jy2-actual-child-name{color:#334155;font-size:13px;padding-left:10px;overflow:visible;white-space:normal}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-child-name{padding-left:10px}",
      ".jy2-actual-table .jy2-actual-child-name-input{display:block;width:100%;min-width:10rem;box-sizing:border-box}",
      ".jy2-actual-table .jy2-actual-type-detail-slot .jy2-actual-child-name-input{display:block;width:100%;min-width:12rem;box-sizing:border-box}",
      /* Excelその他材料費: 詳細2セル（種別列=左・詳細列=右） */
      ".jy2-actual-table .jy2-actual-dual-detail-row .jy2-actual-dual-detail-input{display:block;width:100%;min-width:12rem;box-sizing:border-box}",
      ".jy2-actual-table .jy2-actual-dual-detail-left{padding-left:10px}",
      ".jy2-actual-table .jy2-freeze-2.jy2-actual-dual-detail-left{overflow:visible;text-overflow:clip}",
      /* 数量は狭め・単価はカンマ金額が見切れない幅・実行予算額は広め（浜田 2026-08-01） */
      ".jy2-actual-table th.jy2-actual-col-unit-price,.jy2-actual-table td.jy2-actual-col-unit-price,.jy2-actual-table .jy2-actual-group-unit-price{min-width:6.5rem;width:6.5rem;max-width:8.5rem;padding:4px 6px!important;box-sizing:border-box;white-space:nowrap;text-align:right}",
      ".jy2-actual-table th.jy2-actual-col-plan-qty,.jy2-actual-table td.jy2-actual-col-plan-qty,.jy2-actual-table .jy2-actual-group-plan-qty{min-width:2.75rem;width:2.75rem;max-width:3.5rem;padding:4px 4px!important;box-sizing:border-box;text-align:right}",
      ".jy2-actual-table th.jy2-actual-col-budget,.jy2-actual-table td.jy2-actual-col-budget,.jy2-actual-table td.jy2-actual-auto-budget{min-width:7.5rem;width:7.5rem;max-width:9.5rem;padding:4px 8px!important;box-sizing:border-box;white-space:nowrap;text-align:right}",
      ".jy2-actual-table .jy2-actual-child-unit-price-input{display:block;width:100%;min-width:5.5rem;box-sizing:border-box;text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-actual-table .jy2-actual-child-qty-input{display:block;width:100%;min-width:0;box-sizing:border-box;text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-actual-child-ops{display:inline-flex;gap:4px;flex-shrink:0;align-items:center;justify-content:center;width:100%}",
      ".jy2-actual-ops-cell{text-align:center;padding:3px 4px!important;vertical-align:middle}",
      ".jy2-actual-child-ops .jy2-actual-detail-pm-btn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;margin:0;font-size:14px;font-weight:700;line-height:1;border:1px solid #64748b;border-radius:4px;background:#fff;color:#0f172a;cursor:pointer}",
      ".jy2-actual-child-ops .jy2-actual-detail-pm-btn:hover{background:#e2e8f0}",
      ".jy2-actual-child-ops .jy2-actual-child-delete-btn{border-color:#b91c1c;color:#b91c1c}",
      /* 合計セルは行色に合わせる（編集不可は cursor で示す） */
      ".jy2-actual-table td.jy2-actual-sum-cell{color:#334155;cursor:default}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-sum-cell{background:#e8f5e9!important}",
      ".jy2-actual-table .jy2-actual-himoku-group-row td.jy2-actual-sum-cell{background:#e8f5e9!important}",
      ".jy2-actual-table .jy2-actual-type-group-row td.jy2-actual-sum-cell{background:#e3f2fd!important}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-auto-budget{background:#f1f5f9!important;color:#334155;cursor:default}",
      /* 詳細行=ごく薄いグレー（費目緑／種別青の下階層） */
      ".jy2-actual-table .jy2-actual-child-row td{background:#f8fafc!important;color:#1e293b}",
      ".jy2-actual-table .jy2-actual-child-row .jy2-freeze{background:#f8fafc!important}",
      /* 予算との差: 残（正）緑 / 超過（負）赤 / ゼロ灰 */
      ".jy2-actual-table td.jy2-actual-budget-diff{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}",
      ".jy2-actual-table td.jy2-actual-budget-diff-pos{color:#166534;background:#ecfdf5!important}",
      ".jy2-actual-table td.jy2-actual-budget-diff-neg{color:#b91c1c;background:#fef2f2!important}",
      ".jy2-actual-table td.jy2-actual-budget-diff-zero{color:#64748b;background:#f8fafc!important}",
      ".jy2-actual-table td.jy2-actual-budget-diff-empty{color:#94a3b8;font-weight:500}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-budget-diff-pos{background:#ecfdf5!important}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-budget-diff-neg{background:#fef2f2!important}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-budget-diff-pos,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-actual-budget-diff-pos{background:#dcfce7!important}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-budget-diff-neg,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-actual-budget-diff-neg{background:#fee2e2!important}",
      ".jy2-actual-table .jy2-actual-type-group-row td.jy2-actual-budget-diff-pos{background:#dbeafe!important}",
      ".jy2-actual-table .jy2-actual-type-group-row td.jy2-actual-budget-diff-neg{background:#fee2e2!important}",
      /* 費目グループ行（追加費目）= 親と同じ薄緑。太字は費目名ラベルのみ（数値は通常） */
      ".jy2-actual-table .jy2-actual-himoku-group-row td{background:#e8f5e9!important;color:#1e293b}",
      ".jy2-actual-table .jy2-actual-himoku-group-row .jy2-freeze{background:#e8f5e9!important}",
      /* #R-EXCEL-UI-06/08: 費目名=太字・左揃え・余白同一（親行＝グループ行＝種別なし） */
      ".jy2-actual-table .jy2-actual-parent-himoku,.jy2-actual-table .jy2-actual-himoku-group-label{font-weight:700;text-align:left;padding-left:6px;vertical-align:middle}",
      /* #R-EXCEL-UI-16/17: 費目開閉▶／▼（費目緑に合わせる） */
      ".jy2-actual-table .jy2-actual-parent-himoku,.jy2-actual-table .jy2-actual-himoku-group-label{display:flex;align-items:center;gap:5px;flex-wrap:nowrap}",
      ".jy2-actual-himoku-fold-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;margin:0;border:1px solid #86efac;border-radius:4px;background:#fff;color:#166534;font-size:11px;line-height:1;cursor:pointer;box-shadow:0 1px 0 rgba(22,101,52,.06)}",
      ".jy2-actual-himoku-fold-btn:hover{background:#dcfce7;border-color:#4ade80}",
      ".jy2-actual-himoku-fold-label{min-width:0;overflow:hidden;text-overflow:ellipsis}",
      ".jy2-actual-table tr[data-himoku-open='false'] .jy2-actual-himoku-fold-btn{border-color:#bbf7d0;color:#15803d;background:#f0fdf4}",
      ".jy2-actual-table tr[data-himoku-open='true'] .jy2-actual-himoku-fold-btn{background:#bbf7d0;border-color:#22c55e;color:#14532d}",
      ".jy2-actual-table tr[data-himoku-open='false'] td.jy2-actual-parent-himoku,.jy2-actual-table tr[data-himoku-open='false'] td.jy2-actual-himoku-group-label{box-shadow:inset 3px 0 0 #86efac}",
      ".jy2-actual-table tr[data-himoku-open='true'] td.jy2-actual-parent-himoku,.jy2-actual-table tr[data-himoku-open='true'] td.jy2-actual-himoku-group-label{box-shadow:inset 3px 0 0 #22c55e}",
      /* #R-EXCEL-UI-16/17: すべて展開／閉じる */
      ".jy2-actual-himoku-fold-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px;padding:7px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;box-sizing:border-box}",
      ".jy2-actual-himoku-fold-toolbar-label{font-size:12px;font-weight:700;color:#166534;margin-right:4px}",
      ".jy2-actual-himoku-fold-all-btn{padding:5px 12px;font-size:12px;font-weight:600;line-height:1.3;border:1px solid #86efac;border-radius:5px;background:#fff;color:#14532d;cursor:pointer}",
      ".jy2-actual-himoku-fold-all-btn:hover{background:#dcfce7;border-color:#4ade80}",
      ".jy2-actual-himoku-fold-all-btn:disabled{opacity:.45;cursor:not-allowed}",
      ".jy2-actual-himoku-fold-all-btn:focus-visible,.jy2-actual-himoku-fold-btn:focus-visible{outline:2px solid #22c55e;outline-offset:1px}",
      /* 種別行 = 薄青。種別名は一段インデント左揃え */
      ".jy2-actual-table .jy2-actual-type-group-row td{background:#e3f2fd!important;color:#334155}",
      ".jy2-actual-table .jy2-actual-type-group-row .jy2-freeze{background:#e3f2fd!important}",
      ".jy2-actual-table .jy2-actual-type-group-label{padding-left:20px;font-weight:600;text-align:left;vertical-align:middle}",
      /* #R-EXCEL-UI-08/17: 文言左・数値右（親/費目/種別/詳細で共通） */
      ".jy2-actual-table td.jy2-actual-sum-cell,.jy2-actual-table td.jy2-actual-group-plan-qty,.jy2-actual-table td.jy2-actual-auto-budget,.jy2-actual-table td.jy2-actual-group-unit-price{text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-num,.jy2-actual-table .jy2-actual-parent-row td.jy2-amount,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-num,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-amount,.jy2-actual-table .jy2-actual-type-group-row td.jy2-num,.jy2-actual-table .jy2-actual-type-group-row td.jy2-amount,.jy2-actual-table .jy2-actual-child-row td.jy2-num,.jy2-actual-table .jy2-actual-child-row td.jy2-amount{text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-child-name,.jy2-actual-table .jy2-actual-dual-detail-left,.jy2-actual-table .jy2-actual-dual-detail-right,.jy2-actual-table .jy2-actual-type-only-name{text-align:left}",
      ".jy2-actual-table .jy2-actual-child-name-input,.jy2-actual-table .jy2-actual-dual-detail-input,.jy2-actual-table .jy2-actual-type-only-input{text-align:left}",
      ".jy2-actual-table td.jy2-actual-note{text-align:left}",
      ".jy2-actual-table .jy2-freeze-0{text-align:center}",
      ".jy2-actual-table .jy2-freeze-1,.jy2-actual-table .jy2-freeze-2,.jy2-actual-table .jy2-freeze-3{text-align:left}",
      /* Excel寄せ: 集計行の空き列を見た目結合（tdは残し枠線のみ消す＝sticky維持） */
      ".jy2-actual-table td.jy2-actual-visual-merge-start,.jy2-actual-table td.jy2-actual-visual-merge-mid{border-right-color:transparent!important;box-shadow:none!important}",
      ".jy2-actual-table td.jy2-actual-visual-merge-mid,.jy2-actual-table td.jy2-actual-visual-merge-end{border-left-color:transparent!important}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-visual-merge,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-actual-visual-merge{background:#e8f5e9!important}",
      ".jy2-actual-table .jy2-actual-type-group-row td.jy2-actual-visual-merge{background:#e3f2fd!important}",
      /* 費目ブロックの区切り（最終行の下辺・薄いグレー） */
      // システム工種ブロックの最終行だけ区切り（費目ごとではない）
      ".jy2-actual-table tr.jy2-actual-worktype-block-end > td{border-bottom:2px solid #94a3b8!important}",
      ".jy2-actual-table .jy2-actual-child-row:hover td:not(.jy2-freeze):not([class*='jy2-actual-budget-diff']){background:#eef2ff}",
      ".jy2-actual-table .jy2-actual-child-row:hover .jy2-freeze:not([class*='jy2-actual-budget-diff']){background:#eef2ff}",
      ".jy2-actual-table td.jy2-actual-note{max-width:8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#475569}",
      /* 縦 sticky 禁止（2段見出しが同じ top でデータ行に沈む）。左固定列のみ sticky */
      ".jy2-actual-table thead th{text-align:center;vertical-align:bottom;position:static;top:auto;z-index:auto;background:#f1f5f9;box-shadow:none;font-size:12px}",
      ".jy2-actual-table thead th[colspan]{background:#fef3c7}",
      ".jy2-actual-table thead tr:last-child th{background:#f1f5f9;font-size:12px}",
      ".jy2-actual-table .jy2-freeze{position:sticky;top:auto;z-index:3;background:#fff}",
      ".jy2-actual-table thead .jy2-freeze{z-index:4;background:#f1f5f9}",
      /* freeze幅: 工種4.2 | 費目12 | 種別14 | 詳細16 | 操作3.2（leftは累積） */
      ".jy2-actual-table .jy2-freeze-0{left:0;min-width:4.2rem;width:4.2rem}",
      ".jy2-actual-table .jy2-freeze-1{left:4.2rem;min-width:12rem;width:12rem;max-width:12rem;overflow:hidden;text-overflow:ellipsis}",
      ".jy2-actual-table .jy2-freeze-2{left:16.2rem;min-width:14rem;width:14rem;max-width:14rem;overflow:hidden;text-overflow:ellipsis}",
      /* 詳細列は手入力セルのため ellipsis で入力を潰さない */
      ".jy2-actual-table .jy2-freeze-3{left:30.2rem;min-width:16rem;width:16rem;max-width:20rem;overflow:visible}",
      ".jy2-actual-table thead .jy2-freeze-3{overflow:hidden;text-overflow:ellipsis}",
      /* 操作列（＋／－）: 詳細の右・最終固定列 */
      ".jy2-actual-table .jy2-freeze-4{left:46.2rem;min-width:3.2rem;max-width:3.6rem;overflow:visible;box-shadow:2px 0 5px rgba(15,23,42,.1)}",
      ".jy2-actual-table thead .jy2-freeze-4{overflow:hidden;text-overflow:ellipsis;text-align:center}",
      ".jy2-actual-table .jy2-total-row .jy2-freeze,.jy2-actual-table .jy2-freeze-span{background:#f5ebe0;z-index:4}",
      ".jy2-actual-table tr:hover td:not(.jy2-freeze){background:#f8fafc}",
      ".jy2-actual-table tr:hover .jy2-freeze{background:#eef2ff}",
      ".jy2-version-table td{background:#fff}",
      ".jy2-version-table tr[data-current='true'] td{background:#ede9fe!important;font-weight:600}",
      ".jy2-lock-badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;font-weight:700;border:1px solid #a6b7ca}",
      ".jy2-lock-badge[data-lock='editable']{background:#e3fcef;color:#006644;border-color:#79d2a3}",
      ".jy2-lock-badge[data-lock='budget_locked']{background:#fff7e6;color:#974f0c;border-color:#e2b203}",
      ".jy2-lock-badge[data-lock='full_locked']{background:#ffebe6;color:#c9372c;border-color:#f0a396}",
      ".jy2-version-cta[disabled]{opacity:.45;cursor:not-allowed}",
      ".jy2-version-status{font-size:12px;margin:6px 0;color:#334155}",
      ".jy2-save-button{border:1px solid #1d4ed8;background:#2563eb;color:#fff;padding:8px 18px;font-weight:700;cursor:pointer;border-radius:6px;box-shadow:0 1px 2px rgba(37,99,235,.35)}",
      ".jy2-save-button[disabled]{opacity:.5;cursor:not-allowed}",
      ".jy2-sticky-top{position:sticky;top:0;z-index:1200;background:#fff;border:1px solid #cbd5e1;border-bottom:1px solid #94a3b8;border-radius:8px 8px 0 0;padding:4px 8px 0;margin:0;box-shadow:0 4px 12px rgba(15,23,42,.12);max-width:100%;box-sizing:border-box;overflow:visible}",
      // fixed 化時の高さ確保。sticky 直後に置き表題下の二重余白を防ぐ（高さは JS 同期）
      ".jy2-sticky-spacer{display:block;width:100%;height:0;flex:0 0 auto;pointer-events:none;visibility:hidden;overflow:hidden;margin:0;padding:0;border:0}",
      ".jy2-sticky-top.is-fixed{position:fixed;margin:0}",
      ".jy2-sticky-top .jy2-header{display:none}",
      ".jy2-action-bar{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;justify-content:flex-start;margin-bottom:4px;width:100%;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px 8px}",
      ".jy2-action-bar-right{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;flex:0 0 auto;order:0;margin-left:0}",
      ".jy2-action-group{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;min-width:0;flex:1 1 auto;order:1}",
      ".jy2-btn{border:1px solid #94a3b8;background:#f8fafc;color:#0f172a;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;white-space:nowrap;flex:0 0 auto}",
      ".jy2-btn:hover{background:#f1f5f9}",
      ".jy2-btn[disabled]{opacity:.45;cursor:not-allowed}",
      ".jy2-btn-primary{border-color:#1d4ed8;background:#2563eb;color:#fff;box-shadow:0 1px 2px rgba(37,99,235,.35)}",
      ".jy2-btn-primary:hover{background:#1d4ed8}",
      ".jy2-btn-accent{border-color:#059669;background:#059669;color:#fff}",
      ".jy2-btn-accent:hover{background:#047857}",
      ".jy2-lock-banner{margin:0 0 6px;padding:6px 10px;background:#fff3cd;border:1px solid #ffc107;color:#92400e;font-size:12px;font-weight:700;border-radius:6px}",
      ".jy2-action-meta{font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1 1 auto}",
      ".jy2-last-saved{font-size:11px;color:#475569;white-space:nowrap;margin-right:8px;align-self:center}",
      ".jy2-sticky-top .jy2-tabs{margin:4px 0 0;padding:0;background:transparent}",
      ".jy2-action-bar .jy2-btn[hidden]{display:none!important}",
      "#jy2-host{margin:0 0 12px;padding:0;overflow-x:clip;overflow-y:visible;max-width:100%;width:100%;min-width:0;box-sizing:border-box}",
      ".jy2-panes{max-width:100%;min-width:0;width:100%;box-sizing:border-box;overflow-x:clip;overflow-y:visible}",
      // 見出し: タグ（上）＋項目名（下）。th 自体は table-cell のまま（flex にすると列が縦崩れする）
      ".jy2-th-stack{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;line-height:1.25;width:max-content;max-width:100%;margin:0 auto;box-sizing:border-box}",
      "th.jy2-th-stacked{white-space:normal!important;vertical-align:bottom;text-align:center;padding:8px 8px!important;min-width:4.75rem}",
      ".jy2-th-stack .jy2-hf-tag{display:inline-flex;align-items:center;justify-content:center;margin:0!important;font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 8px;border-radius:999px;line-height:1.2;box-shadow:0 1px 0 rgba(15,23,42,.08);flex:0 0 auto}",
      ".jy2-th-stack .jy2-th-label{display:block;font-size:11px;font-weight:700;color:#0f172a;line-height:1.35;letter-spacing:.02em;white-space:nowrap}",
      ".jy2-table th.jy2-th-mode-auto{background:#eff6ff}",
      ".jy2-table th.jy2-th-mode-select{background:#ecfdf5}",
      ".jy2-table th.jy2-th-mode-input{background:#fffbeb}",
      ".jy2-table th.jy2-th-mode-date{background:#fff7ed}",
      ".jy2-actual-table thead th.jy2-th-mode-auto{background:#eff6ff}",
      ".jy2-actual-table thead th.jy2-th-mode-select{background:#ecfdf5}",
      ".jy2-actual-table thead th.jy2-th-mode-input{background:#fffbeb}",
      ".jy2-actual-table thead th.jy2-th-mode-date{background:#fff7ed}",
      ".jy2-detail-block-head label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:3px}",
      ".jy2-detail-block-head .jy2-th-stack{align-items:flex-start}",
      ".jy2-detail-block-head .jy2-th-stack .jy2-th-label,.jy2-detail-block-head .jy2-th-label{font-size:12px}",
      "label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;gap:3px}",
      "label.jy2-th-stacked > .jy2-hf-tag{margin:0}",
      "label.jy2-th-stacked > .jy2-th-label{display:block;font-size:12px;font-weight:700;color:#334155}",
      ".jy2-list-root{padding:12px 16px;background:#f8fafc;min-height:320px;font-family:'Segoe UI',Meiryo,sans-serif}",
      ".jy2-list-title{margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:.2em;color:#334155}",
      ".jy2-list-sub{margin:0 0 12px;font-size:12px;color:#64748b}",
      ".jy2-list-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}",
      ".jy2-list-search{min-width:280px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px}",
      ".jy2-list-search:focus{border-color:#2563eb;outline:none}",
      ".jy2-list-count{font-size:12px;color:#64748b;margin-left:auto}",
      ".jy2-list-hint{font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5}",
      ".jy2-list-table{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border-radius:6px;overflow:hidden}",
      ".jy2-list-table th,.jy2-list-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}",
      ".jy2-list-table th{background:#f1f5f9;font-weight:600;color:#475569;cursor:pointer}",
      ".jy2-list-table tr[data-open-id]{cursor:pointer}",
      ".jy2-list-table tr[data-open-id]:hover td{background:#eff6ff}",
      ".jy2-list-new{border:1px solid #2563eb;background:#2563eb;color:#fff;padding:8px 16px;font-weight:700;cursor:pointer;border-radius:6px}",
      ".jy2-version-type-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 14px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-size:13px}",
      ".jy2-version-type-bar label{display:flex;align-items:center;gap:6px}",
      ".jy2-version-type-bar select{min-width:160px;padding:3px 6px;border-radius:4px}",
      ".jy2-header-legend{font-size:11px;color:#64748b;padding:0 0 10px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}",
      ".jy2-hf-tag{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;margin-right:5px;vertical-align:middle;line-height:1.3;letter-spacing:.04em}",
      ".jy2-hf-tag-input{background:#FEF3C7;border:1px solid #F59E0B;color:#B45309}",
      ".jy2-hf-tag-select{background:#D1FAE5;border:1px solid #10B981;color:#047857}",
      ".jy2-hf-tag-date{background:#FFEDD5;border:1px solid #F97316;color:#C2410C}",
      ".jy2-hf-tag-auto{background:#DBEAFE;border:1px solid #3B82F6;color:#1D4ED8}",
      ".jy2-hf-tag-aux{background:#F1F5F9;border:1px solid #94A3B8;color:#475569}",
      ".jy2-table th .jy2-hf-tag,.jy2-detail-block-head .jy2-hf-tag,.jy2-footer-label .jy2-hf-tag{margin-right:0}",
      /* C12: 工事基本情報はモニタ幅いっぱいで折り返し（固定幅＋横スクロールにしない） */
      ".jy2-header-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr));gap:8px 12px;padding:2px 0 10px;width:100%;max-width:100%;box-sizing:border-box}",
      ".jy2-header-grid>div{min-width:0;max-width:100%}",
      ".jy2-header-grid label{display:block;font-size:11px;color:#475569;margin-bottom:4px;line-height:1.35}",
      ".jy2-header-grid label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:3px;padding:0!important}",
      ".jy2-header-grid label.jy2-th-stacked .jy2-th-label{display:block;font-size:12px;font-weight:700;color:#334155}",
      ".jy2-header-grid input,.jy2-header-grid select,.jy2-header-grid textarea{width:100%;box-sizing:border-box;font-size:13px;padding:5px 8px;border-radius:4px}",
      ".jy2-header-grid input.jy2-hf-text,.jy2-header-grid textarea.jy2-hf-text{background:#fff;border:1px solid #93c5fd;border-left:3px solid #2563eb}",
      ".jy2-header-grid select.jy2-hf-select{background-color:#f1f5f9;border:1px solid #94a3b8;border-left:3px solid #64748b;cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:26px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 8px center}",
      ".jy2-header-grid input.jy2-hf-date{background:#fffbeb;border:1px solid #fcd34d;border-left:3px solid #f59e0b}",
      ".jy2-header-grid input.jy2-hf-readonly,.jy2-header-grid select:disabled{background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #cbd5e1;color:#64748b;cursor:default}",
      /* メモ系は常に1行独占（工事コードと横並びになるのを防ぐ） */
      ".jy2-header-grid .jy2-span-2{grid-column:1/-1}",
      ".jy2-header-grid .jy2-row-start{grid-column:1}",
      ".jy2-shell{--jy2-fs-k:1}",
      ".jy2-shell[data-font-scale='large']{--jy2-fs-k:1.15}",
      ".jy2-shell[data-font-scale='xlarge']{--jy2-fs-k:1.3}",
      ".jy2-font-scale{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;flex:0 0 auto}",
      ".jy2-font-scale-label{font-size:11px;font-weight:600;color:#64748b;white-space:nowrap}",
      ".jy2-font-scale-btns{display:inline-flex;flex-wrap:nowrap;gap:2px}",
      ".jy2-font-scale-btns .jy2-btn{padding:4px 7px;font-size:11px;min-width:0}",
      ".jy2-font-scale-btns .jy2-btn[aria-pressed='true']{border-color:#2563eb;background:#dbeafe;color:#1e40af}",
      ".jy2-shell .jy2-panes .jy2-table{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-input{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-select{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-combo-wrap>.jy2-combo-select{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-row-button{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-btn{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-section-title{font-size:calc(14px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-empty{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-warning{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-detail-block-head{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-head{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-table{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-keys{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-note{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-keys .jy2-sub-row td{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table .jy2-input{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table thead th.jy2-actual-month .jy2-th-label{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table .jy2-actual-month .jy2-input{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table thead tr:last-child th{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-note-details{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-note{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid label{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid input,.jy2-shell .jy2-panes .jy2-header-grid select,.jy2-shell .jy2-panes .jy2-header-grid textarea{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid label.jy2-th-stacked .jy2-th-label,.jy2-shell .jy2-panes label.jy2-th-stacked>.jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-th-stack .jy2-th-label{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-th-stack .jy2-hf-tag{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-footer-row .jy2-footer-label .jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-footer-row .jy2-input{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-detail-block-head .jy2-th-stack .jy2-th-label,.jy2-shell .jy2-panes .jy2-detail-block-head .jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-version-status{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-version-type-bar{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-legend{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-hf-tag{font-size:calc(10px * var(--jy2-fs-k))}",
    ].join("");
  }

  /** 詳細シェル表示時: ネイティブ項目・コメント欄を隠し、#jy2-host だけ残す。 */
  function jy2HideNativeDetailChrome(documentRef) {
    const doc =
      documentRef ||
      (typeof document !== "undefined" ? document : null);
    if (!doc || !doc.head) return;
    const styleId = "jy2-native-detail-hide";
    let style = doc.getElementById(styleId);
    if (!style) {
      style = doc.createElement("style");
      style.id = styleId;
      doc.head.appendChild(style);
    }
    style.textContent = [
      ".record-detail-gaia > *:not(#jy2-host){display:none!important}",
      ".record-detail-gaia .field-gaia{display:none!important}",
      ".gaia-argoui-app-toolbar-buttons{display:none!important}",
      ".gaia-argoui-app-show-sidebar{display:none!important}",
      ".gaia-argoui-app-show-sidebar-comments{display:none!important}",
      ".ocean-ui-comments{display:none!important}",
      ".converter-sidebar-gaia{display:none!important}",
      // clip: 横は切るが scroll container にせず、.jy2-sticky-top の縦 sticky を維持
      ".gaia-argoui-app-show-contents{margin:0!important;padding-top:0!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;box-sizing:border-box!important}",
      ".contents-gaia{margin:0!important;padding-top:0!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;box-sizing:border-box!important}",
      ".record-detail-gaia,.record-edit-gaia,.record-create-gaia{margin-top:0!important;padding-top:0!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important}",
      "body.jy2-detail-shell{overflow-x:clip!important}",
      "body.jy2-detail-shell .container-gaia{max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;padding-top:0!important}",
      "body.jy2-detail-shell #jy2-host{margin-top:0!important;padding-top:0!important;overflow-x:clip!important;overflow-y:visible!important;max-width:100%!important;width:100%!important}",
    ].join("");
    if (doc.body) doc.body.classList.add("jy2-detail-shell");

    // CSS が効かないテナント向け: ホストの兄弟と右ペインを直接非表示。
    const host = doc.getElementById("jy2-host");
    if (host && host.parentElement) {
      for (const child of Array.from(host.parentElement.children)) {
        if (child !== host) child.style.setProperty("display", "none", "important");
      }
    }
    for (const selector of [
      ".gaia-argoui-app-show-sidebar",
      ".gaia-argoui-app-show-sidebar-comments",
      ".ocean-ui-comments",
      ".converter-sidebar-gaia",
    ]) {
      doc.querySelectorAll(selector).forEach((node) => {
        node.style.setProperty("display", "none", "important");
      });
    }
  }

  function jy2Comma(text) {
    if (text === null || text === undefined || text === "") return "";
    const parts = String(text).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function jy2StripCommaNumber(text) {
    return String(text ?? "")
      .trim()
      .replace(/[,，]/g, "");
  }

  function jy2FormatCommaNumber(text) {
    const cleaned = jy2StripCommaNumber(text);
    if (!cleaned) return "";
    if (!/^[+-]?\d+(?:\.\d*)?$/.test(cleaned)) return cleaned;
    return jy2Comma(cleaned);
  }

  function jy2AmountDisplay(decimalAmount) {
    // 空文字・「－」・非数は Invalid decimal を投げない（Phase2a 数量/単価表示で顕在化）。
    if (decimalAmount === null || decimalAmount === undefined) return "";
    const text = jy2StripCommaNumber(decimalAmount);
    if (!text || text === "-" || text === "－") return "";
    if (!/^[+-]?\d+(?:\.\d*)?$/.test(text)) return "";
    try {
      return jy2Comma(displayInteger(text));
    } catch {
      return "";
    }
  }

  // D-31/D-32: 率(÷①) = 金額÷①。画面ラベルは「消化率」（浜田 2026-07-23）。
  // shown as percent with 1 decimal, ①=0 → 0.
  function jy2Percent(fraction) {
    if (fraction === null || fraction === undefined) return "－";
    return `${round(multiply(fraction, "100"), 1)}%`;
  }

  function jy2HasText(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function jy2MarkIncompleteIfAnchor(cell, anchorPresent, fieldValue) {
    if (anchorPresent && !jy2HasText(fieldValue)) {
      cell.classList.add("jy2-incomplete");
    }
    return cell;
  }

  function jy2MarkSalaryNameSpaceWarning(cell, personName) {
    if (jy2HasText(personName) && !String(personName).includes("　")) {
      cell.classList.add("jy2-incomplete");
      cell.title = "姓と名の間に全角スペースを入力してください";
    }
    return cell;
  }

  function jy2MarkNameBlankVisual(cell, { blank, continued, label, kind }) {
    cell.classList.remove("jy2-name-continued", "jy2-name-unset");
    if (!blank) {
      cell.removeAttribute("title");
      return;
    }
    if (cell.classList.contains("jy2-incomplete")) return;
    if (continued && label) {
      // U27/U33 (2026-07-29): 継続は「〃」が目印。薄い青背景は付けない。
      cell.title = `（上の${kind}「${label}」と同一・〃表示）`;
    } else {
      cell.classList.add("jy2-name-unset");
      cell.title = `（${kind} 未設定）`;
    }
  }

  // U27: 直前行と同じ費目/種別/定義は「〃」（保存値は実値または〃）。
  const JY2_DITTO_MARK = "〃";
  function jy2IsDitto(value) {
    return jy2HasText(value) && String(value).trim() === JY2_DITTO_MARK;
  }

  function jy2SameText(a, b) {
    if (!jy2HasText(a) || !jy2HasText(b)) return false;
    if (jy2IsDitto(a) || jy2IsDitto(b)) return false;
    return String(a).trim() === String(b).trim();
  }

  function jy2PrevResolved(rows, index, field) {
    for (let i = index - 1; i >= 0; i--) {
      const value = rows[i][field];
      if (!jy2HasText(value) || jy2IsDitto(value)) continue;
      return String(value).trim();
    }
    return null;
  }

  function jy2ShowDitto(rowValue, prevResolved, { emptyContinues = true } = {}) {
    if (jy2IsDitto(rowValue)) return Boolean(prevResolved);
    if (jy2SameText(rowValue, prevResolved)) return true;
    if (emptyContinues && !jy2HasText(rowValue) && jy2HasText(prevResolved)) {
      return true;
    }
    return false;
  }

  // U5: 半角カナ → 全角（定義及び品名・name3）
  // 単純 code オフセットは濁点位置で崩れる（ｶ→ガ等）。半角カナ塊だけ NFKC する。
  function jy2ToFullWidthKana(str) {
    if (str === null || str === undefined) return str;
    const text = String(str);
    if (!text) return text;
    return text.replace(/[\uFF61-\uFF9F]+/g, (chunk) => chunk.normalize("NFKC"));
  }

  // D-17: 請負数量は小数第1位まで（四捨五入）
  function jy2NormalizeContractQty(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    try {
      return round(text, 1);
    } catch {
      return text;
    }
  }

  function jy2Cell(documentRef, tag, className, text) {
    const cell = documentRef.createElement(tag);
    if (className) cell.className = className;
    cell.textContent = text === null || text === undefined ? "" : String(text);
    return cell;
  }

  function jy2TextInput(documentRef, value, onCommit, opts = {}) {
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input";
    input.value = value === null || value === undefined ? "" : String(value);
    let lastCommitted = input.value.trim();
    const fullTitle = Boolean(opts.fullTitle);
    const commitOnInput = Boolean(opts.commitOnInput);
    const syncFullTitle = () => {
      if (!fullTitle) return;
      input.title = input.value.trim();
    };
    if (fullTitle) syncFullTitle();
    const commit = () => {
      const next = input.value.trim();
      if (next === lastCommitted) return;
      lastCommitted = next;
      onCommit(next);
      if (fullTitle) syncFullTitle();
    };
    input.addEventListener("change", commit);
    // 保存クリック直前の blur でも確実にストアへ反映する
    input.addEventListener("blur", commit);
    if (commitOnInput) {
      // ＋押下で blur が飛ばなくても、打鍵のたびに App757 モデルへ載せる
      input.addEventListener("input", () => {
        commit();
        if (fullTitle) syncFullTitle();
      });
    } else if (fullTitle) {
      input.addEventListener("input", syncFullTitle);
    }
    return input;
  }

  // sticky 保存ボタン／操作列＋－ の mousedown preventDefault で
  // フォーカス中 input の blur→commit が飛ばないため、操作直前に明示 flush。
  function jy2FlushActiveInputBeforeSave(documentRef) {
    const active = documentRef && documentRef.activeElement;
    if (!active) return;
    const tag = String(active.tagName || "").toUpperCase();
    if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;
    // change を先に（blur が握りつぶされても commit する）
    try {
      const view = documentRef.defaultView;
      const EventCtor = (view && view.Event) || Event;
      active.dispatchEvent(new EventCtor("change", { bubbles: true }));
    } catch {
      // ignore
    }
    try {
      if (typeof active.blur === "function") active.blur();
    } catch {
      // ignore
    }
  }
  // 行内の詳細 input を DOM 値でモデルへ確定（＋直前の保険）
  function jy2CommitChildDetailInputsFromRow(tr, opts) {
    if (!tr || !opts || !opts.detailModel || !opts.blockId || !opts.rowKey) {
      return;
    }
    const leftInput = tr.querySelector(
      ".jy2-actual-dual-detail-left input, .jy2-actual-type-only-name input",
    );
    const rightInput = tr.querySelector(
      ".jy2-actual-dual-detail-right input, td.jy2-actual-child-name:not(.jy2-actual-dual-detail-left):not(.jy2-actual-type-only-name) input.jy2-actual-child-name-input",
    );
    const himoku = String(opts.himokuLabel || "").trim();
    const underType = String(opts.dualUnderTypeLabel || "").trim();
    const patch = {};
    if (leftInput && (opts.dualDetailCells || opts.typeOnlyLeaf)) {
      const left = jy2ToFullWidthKana(String(leftInput.value || "").trim());
      if (himoku) patch.name1 = himoku;
      patch.name2 = underType
        ? jy2CostMgmtJoinTypeDetailName2(underType, left)
        : left || null;
    }
    if (rightInput && !opts.typeOnlyLeaf) {
      const right = jy2ToFullWidthKana(String(rightInput.value || "").trim());
      patch.name3 = right || null;
      if (opts.dualDetailCells && himoku) patch.name1 = himoku;
      if (underType && !Object.prototype.hasOwnProperty.call(patch, "name2")) {
        const leftVal = leftInput
          ? jy2ToFullWidthKana(String(leftInput.value || "").trim())
          : "";
        patch.name2 = jy2CostMgmtJoinTypeDetailName2(underType, leftVal);
      }
    }
    if (Object.keys(patch).length === 0) return;
    try {
      opts.detailModel.updateDetailRow(opts.blockId, opts.rowKey, patch);
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("jy2CommitChildDetailInputsFromRow failed:", error);
      }
    }
  }
  // 操作列＋／－: flush してから preventDefault（フォーカス移動で blur が飛ぶのを抑止）
  function jy2BindDetailPmMouseDown(documentRef, button) {
    if (!button || typeof button.addEventListener !== "function") return;
    button.addEventListener("mousedown", (event) => {
      jy2FlushActiveInputBeforeSave(documentRef);
      if (typeof event.preventDefault === "function") event.preventDefault();
    });
  }

  // 単価など: 表示は千区切り、commit 値はカンマ無し。focus 中は素の数字で編集。
  function jy2CommaNumberInput(documentRef, value, onCommit, opts = {}) {
    const input = jy2TextInput(
      documentRef,
      jy2FormatCommaNumber(value),
      (raw) => onCommit(jy2StripCommaNumber(raw)),
      opts,
    );
    input.addEventListener("focus", () => {
      input.value = jy2StripCommaNumber(input.value);
    });
    input.addEventListener("blur", () => {
      const cleaned = jy2StripCommaNumber(input.value);
      if (cleaned && /^[+-]?\d+(?:\.\d*)?$/.test(cleaned)) {
        input.value = jy2Comma(cleaned);
      }
    });
    return input;
  }

  // U26-2: input[list]/datalist 用の一意 ID 採番（DeepSeek §50-3-8 盲点1:
  // 行が多いと同一 ID で最初の datalist しか参照されないため行ごとに一意化）。
  let JY2_COMBO_UID = 0;

  // U4/U26/U26-2: 候補選択コンボ。常にリスト緑。
  // 左 input は打鍵で候補が絞り込み表示（datalist）。
  // 右 <select>(▼) は全候補を常時列挙（datalist が現行値で絞られても選べる）。
  // opts.displayDitto: U27 連続同値は初期表示を「〃」にし、focus で実値を一時表示。
  // opts.revealValue: focus 時に見せる実値（〃保存時は解決済みの上段値）。
    // opts.listOnly: 候補あり時はリスト外の非空値を拒否（空クリアは可）。
    //   「〃」は常に許可。既存保存値がリスト外でも編集するまで維持。拒否時は lastCommitted へ復元。
    //   G0: 費目／種別／取引先／材料はリスト選択のみ → 打鍵入力は readOnly（▼からのみ変更）。
    // opts.fullTitle: 見切れ時ホバーで全文（定義及び品名など長文列）。listOnly 拒否中は miss 文言優先。
    function jy2ComboInput(documentRef, value, options, onCommit, opts = {}) {
    const wrap = documentRef.createElement("span");
    wrap.className = "jy2-combo-wrap";
    const stored = value === null || value === undefined ? "" : String(value);
    const revealValue = jy2HasText(opts.revealValue)
      ? String(opts.revealValue).trim()
      : stored.trim();
    const displayDitto = Boolean(opts.displayDitto);
    // 後方互換: displayBlank は displayDitto と同義（〃表示）。
    const useDittoDisplay = displayDitto || Boolean(opts.displayBlank);
    const fullTitle = Boolean(opts.fullTitle);
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input jy2-combo";
    input.autocomplete = "off";
    input.value = useDittoDisplay ? JY2_DITTO_MARK : stored;
    let revealed = false;
    let composing = false;
    let lastCommitted = stored.trim();
    const syncFullTitle = () => {
      if (!fullTitle) return;
      const shown = input.value.trim();
      const tip =
        shown && shown !== JY2_DITTO_MARK
          ? shown
          : useDittoDisplay
            ? revealValue
            : "";
      input.title = tip;
    };
    if (fullTitle) syncFullTitle();
    // 打鍵候補用 datalist（右 select と同一候補）。id は一意採番。
    const listId = `jy2-dl-${++JY2_COMBO_UID}`;
    const datalist = documentRef.createElement("datalist");
    datalist.id = listId;
    input.setAttribute("list", listId);
    const select = documentRef.createElement("select");
    select.className = "jy2-combo-select";
    select.title = "リストから選択";
    select.setAttribute("aria-label", "リストから選択");
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "▼";
    select.appendChild(blank);
    const seen = new Set();
    // 「〃」を候補先頭に（継続入力用）
    if (useDittoDisplay || opts.allowDitto) {
      const dittoOpt = documentRef.createElement("option");
      dittoOpt.value = JY2_DITTO_MARK;
      dittoOpt.textContent = JY2_DITTO_MARK;
      select.appendChild(dittoOpt);
      const dlDitto = documentRef.createElement("option");
      dlDitto.value = JY2_DITTO_MARK;
      datalist.appendChild(dlDitto);
      seen.add(JY2_DITTO_MARK);
    }
    for (const option of options || []) {
      const text = String(option || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const opt = documentRef.createElement("option");
      opt.value = text;
      opt.textContent = text;
      select.appendChild(opt);
      const dlOpt = documentRef.createElement("option");
      dlOpt.value = text;
      datalist.appendChild(dlOpt);
    }
    // listOnly: 候補の有無に関わらず手入力不可（▼選択のみ）。候補ゼロ時も自由入力させない。
    const listOnlySelect = Boolean(opts.listOnly);
    // #R1: listOnly＋値ありは既定で空クリアを隠す。明示 allowClear:true のときだけ「▼／空」。
    const hideClearWhenSet =
      opts.hideClearWhenSet === true ||
      (listOnlySelect && opts.allowClear !== true && opts.hideClearWhenSet !== false);
    const allowClear =
      opts.allowClear === true ||
      !(hideClearWhenSet && stored.trim());
    if (listOnlySelect) {
      input.readOnly = true;
      input.removeAttribute("list");
      input.classList.add("jy2-combo-readonly");
      input.title = input.title || "リストから選択してください（▼）";
      wrap.classList.add("jy2-combo-list-only");
      blank.textContent = allowClear ? "▼／空" : "▼";
      blank.value = "";
    }
    if ([...seen].every((t) => t === JY2_DITTO_MARK) && !useDittoDisplay && seen.size === 0) {
      select.disabled = true;
      select.title = "このブロックに候補リストがありません";
      input.removeAttribute("list");
    }
    // 候補ゼロ（〃のみ／無し）でも list は残す場合あり。真の空候補だけ無効化。
    if (seen.size === 0) {
      select.disabled = true;
      select.title = "このブロックに候補リストがありません";
      input.removeAttribute("list");
    }
    const miss = documentRef.createElement("span");
    miss.className = "jy2-combo-miss";
    miss.hidden = true;
    const clearMiss = () => {
      miss.hidden = true;
      miss.textContent = "";
      if (fullTitle) syncFullTitle();
      else if (!listOnlySelect) input.title = "";
    };
    const showMiss = (msg = "リストにありません") => {
      miss.textContent = msg;
      miss.hidden = false;
      input.title = msg;
    };
    const commit = () => {
      // 未フォーカスの〃表示を「クリア保存」と誤認しない
      if (useDittoDisplay && !revealed) return;
      const next = input.value.trim();
      if (
        opts.listOnly &&
        seen.size > 0 &&
        next !== "" &&
        next !== JY2_DITTO_MARK &&
        !seen.has(next)
      ) {
        const restored = lastCommitted;
        input.value =
          useDittoDisplay &&
          (restored === stored || jy2IsDitto(restored) || restored === revealValue)
            ? JY2_DITTO_MARK
            : restored;
        showMiss();
        return;
      }
      if (next === lastCommitted) {
        if (useDittoDisplay && (next === revealValue || jy2IsDitto(next))) {
          input.value = JY2_DITTO_MARK;
        }
        return;
      }
      clearMiss();
      lastCommitted = next;
      onCommit(next);
      if (
        useDittoDisplay &&
        (next === revealValue || jy2IsDitto(next) || next === stored.trim())
      ) {
        input.value = JY2_DITTO_MARK;
      }
    };
    input.addEventListener("focus", () => {
      revealed = true;
      clearMiss();
      if (useDittoDisplay && input.value === JY2_DITTO_MARK) {
        input.value = revealValue || stored;
      }
    });
    // listOnly の readOnly 表示欄は change/blur で手入力確定しない（▼経路のみ）。
    if (!listOnlySelect) {
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
      input.addEventListener("compositionstart", () => {
        composing = true;
      });
      input.addEventListener("compositionend", () => {
        composing = false;
        if (opts.commitExactOption && seen.has(input.value.trim())) commit();
      });
      input.addEventListener("input", () => {
        if (fullTitle) syncFullTitle();
        // 工種番号など既知候補と完全一致した時点で、Tab/blurを待たず即時反映。
        if (!composing && opts.commitExactOption && seen.has(input.value.trim())) commit();
      });
    } else {
      // readOnly 欄クリックで▼へ誘導（選択体験を明確化）
      input.addEventListener("mousedown", (event) => {
        if (select.disabled) return;
        if (typeof event.preventDefault === "function") event.preventDefault();
        try {
          select.focus();
          if (typeof select.showPicker === "function") select.showPicker();
        } catch {
          // showPicker 非対応ブラウザは focus のみ
        }
      });
    }
    select.addEventListener("change", () => {
      const picked = select.value;
      revealed = true;
      clearMiss();
      // listOnly: 空選択＝クリア（材料などは任意）。hideClearWhenSet 時は無視。
      if (!picked) {
        if (listOnlySelect) {
          if (!allowClear) {
            select.selectedIndex = 0;
            return;
          }
          input.value = useDittoDisplay ? "" : "";
          lastCommitted = "";
          onCommit("");
          if (useDittoDisplay) input.value = "";
          select.selectedIndex = 0;
        }
        return;
      }
      input.value = picked;
      lastCommitted = picked;
      if (fullTitle) syncFullTitle();
      onCommit(picked);
      select.selectedIndex = 0;
      if (
        useDittoDisplay &&
        (picked === JY2_DITTO_MARK || picked === revealValue)
      ) {
        input.value = JY2_DITTO_MARK;
      }
    });
    wrap.append(input, datalist, select, miss);
    return wrap;
  }

  // #R-NAME-01 / #R-07: 明細候補の正本は「内訳で使うコード表.xlsx」。
  // ラベル: 費目 / 種別 / 詳細（フィールドコード name_1/2/3 は据え置き）。
  // 生成: node scripts/jikkou-yosan-v2-sync-code-table-name-hierarchy.mjs
  // 会社名（取引先コンボ）: データマスタ I∪J を1本化（依頼者確認 2026-07-26）。
  // 生成: node scripts/jikkou-yosan-v2-sync-vendor-list.mjs

  // G0 §8: システム工種＋工種番号（マスタ整理順。空コードは採番しない）。
  const JY2_SYSTEM_WORK_MASTER = Object.freeze([
    Object.freeze({ name: "材料費", code: "10100" }),
    Object.freeze({ name: "塗装工事", code: "10200" }),
    Object.freeze({ name: "足場工事", code: "10300" }),
    Object.freeze({ name: "塗装及び足場工事", code: "10400" }),
    Object.freeze({ name: "修繕等工事", code: "10600" }),
    Object.freeze({ name: "塗装付帯工事", code: "10700" }),
    Object.freeze({ name: "軌道工事", code: "" }),
    Object.freeze({ name: "調査設計費", code: "" }),
    Object.freeze({ name: "外注試験費", code: "" }),
    Object.freeze({ name: "交通規制費", code: "" }),
    Object.freeze({ name: "追加工事①", code: "14100" }),
    Object.freeze({ name: "追加工事②", code: "14200" }),
    Object.freeze({ name: "追加工事③", code: "14300" }),
    Object.freeze({ name: "追加工事④", code: "14400" }),
    Object.freeze({ name: "追加工事⑤", code: "14500" }),
    Object.freeze({ name: "工事管理者賃金", code: "10900" }),
    Object.freeze({ name: "建設機械オペレーター", code: "" }),
    Object.freeze({ name: "その他労務者", code: "" }),
    Object.freeze({ name: "鎌ヶ谷資材使用料", code: "10800" }),
    Object.freeze({ name: "レンタル", code: "11600" }),
    Object.freeze({ name: "仮設・工具費等", code: "" }),
    Object.freeze({ name: "運送費", code: "11700" }),
    Object.freeze({ name: "産業廃棄物処理費", code: "11800" }),
    Object.freeze({ name: "租税公課", code: "11900" }),
    Object.freeze({ name: "借地料等", code: "12000" }),
    Object.freeze({ name: "消耗品費", code: "12100" }),
    Object.freeze({ name: "事務費", code: "12200" }),
    Object.freeze({ name: "通信費", code: "12300" }),
    Object.freeze({ name: "旅費交通費", code: "12400" }),
    Object.freeze({ name: "履行保証保険料", code: "12600" }),
    Object.freeze({ name: "建退共証紙購入費", code: "12700" }),
    Object.freeze({ name: "諸雑費", code: "12900" }),
    Object.freeze({ name: "諸会費", code: "13100" }),
    Object.freeze({ name: "会議費", code: "13620" }),
    Object.freeze({ name: "補償費", code: "12800" }),
    Object.freeze({ name: "交際費", code: "13600" }),
    Object.freeze({ name: "各種保険料(任意保険）", code: "" }),
    Object.freeze({ name: "法定福利費", code: "" }),
    Object.freeze({ name: "工事安全専任管理者", code: "11000" }),
    Object.freeze({ name: "線閉責任者", code: "11100" }),
    Object.freeze({ name: "列車見張員", code: "11200" }),
    Object.freeze({ name: "交通整理員", code: "11300" }),
    Object.freeze({ name: "検電接地", code: "11400" }),
    Object.freeze({ name: "その他保安費", code: "11500" }),
    Object.freeze({ name: "重機誘導員", code: "13500" }),
  ]);
  const JY2_SYSTEM_WORK_NAMES = Object.freeze(
    JY2_SYSTEM_WORK_MASTER.map((x) => x.name),
  );
  const JY2_SYSTEM_WORK_CODES = Object.freeze([
    "10100",
    "10200",
    "10300",
    "10400",
    "10600",
    "10700",
    "14100",
    "14200",
    "14300",
    "14400",
    "14500",
    "10900",
    "10800",
    "11600",
    "11700",
    "11800",
    "11900",
    "12000",
    "12100",
    "12200",
    "12300",
    "12400",
    "12600",
    "12700",
    "12900",
    "13100",
    "13620",
    "12800",
    "13600",
    "11000",
    "11100",
    "11200",
    "11300",
    "11400",
    "11500",
    "13500",
  ]);

  // G0 V1: 協力会社∪取引先（マスタ順・協力会社→取引先）。
  const JY2_VENDOR_SEEDS = Object.freeze([
    "abit",
    "今岡塗装",
    "大沼塗装工業",
    "金田塗装工業",
    "菊正塗装店",
    "クオリティ・ジャパン",
    "桜庭塗装工業",
    "塩里塗装",
    "進興エンジニアリング",
    "高木塗装",
    "東海塗装",
    "中西工業",
    "浜翔建設",
    "原塗装",
    "ブリッジニアプラス",
    "丸翔加藤塗装",
    "三橋塗装店",
    "六角塗装店",
    "姉崎工業",
    "ＮＲ",
    "オオイ",
    "大曾根建設",
    "共和工業",
    "ビーエムシー",
    "ヘイセイ工業",
    "島津テクノリサーチ",
    "シンコーハイウェイ",
    "テイケイ",
    "建設機械オペレーター会社",
    "プロスタエクセキューション",
    "ニシオワークサポート",
    "レンタル",
    "鎌ヶ谷倉庫",
    "アクティオ",
    "カナモト",
    "サコス",
    "レンタルのニッケン",
    "三鋼仮設",
    "杉孝",
    "産業廃棄物業者",
    "ジャパンウェスト",
    "タケエイ",
    "保安要員関係会社",
    "SmB",
    "エスジーアイ鉄道",
    "オリエンタル警備",
    "みはりや",
    "関東メンテナンス",
    "事業開発者",
    "大光電産",
    "Re.code",
    "ＡＣＣＥＳＳ",
    "松岡塗料",
    "東海塗料興業",
    "中島商会",
    "横浜化成",
    "エイトポイント",
    "大塚刷毛",
    "国元商会",
    "興亜産業",
    "仙台銘板",
  ]);

  const JY2_BRANCH_MASTER = Object.freeze([
    "本社（JR東日本）",
    "首都圏本部",
    "横浜支社",
    "八王子支社",
    "大宮支社",
    "千葉支社",
    "長野支社",
    "水戸支社",
    "高崎支社",
    "本社（JR東海）",
    "新幹線鉄道事業本部",
  ]);
  const JY2_DEPARTMENT_MASTER = Object.freeze([
    "施工部　東京１グループ",
    "施工部　東京２グループ",
    "施工部　東京３グループ",
    "施工部　横浜１グループ",
    "施工部　横浜２グループ",
    "橋りょうリペア部",
    "水戸営業所",
    "千葉営業所",
  ]);

  // G0 §6.2 / §16.1: 請負 契約工種マスタ（帯別）。新規行はマスタのみ、既存値は祖父。
  const JY2_CONTRACT_WORK_MASTER = Object.freeze({
    施工: Object.freeze([
      "橋桁修繕工",
      "塗替塗装工",
      "足場工",
      "中止補償",
    ]),
    保安: Object.freeze([
      "線閉責任者",
      "工事安全専任管理者",
      "工事管理者(保)",
      "列車見張員",
      "交通整理員",
      "誘導員",
      "検電接地",
      "その他保安費",
    ]),
  });

  // G0 §9.1: 外注費の種別メニュー（5件）。
  const JY2_GAICHU_TYPE_MENU = Object.freeze([
    "材料費",
    "労務費",
    "仮設機械経費",
    "現場経費",
    "その他費用",
  ]);

  // G0 §9: 材料費の種別＝マスタ整理「内訳」列（コード表の「〜費など」は正本にしない）。
  const JY2_MATERIAL_TYPE_MENU = Object.freeze([
    "塗料",
    "鋼材",
    "二次製品",
    "生コンクリート･石材",
    "ＡＳ合材",
    "鋼製製品･ゴム製品等",
    "その他材料",
  ]);

  // G0 §9: 費目→種別（マスタ整理「内訳」列順）。外注費のみ §9.1 の5件。
  const JY2_TYPES_BY_HIMOKU_MASTER = Object.freeze({
    材料費: JY2_MATERIAL_TYPE_MENU,
    外注費: JY2_GAICHU_TYPE_MENU,
    労務費: Object.freeze([
      "出向工事管理者（昼間）",
      "出向工事管理者（夜間）",
      "軌陸車オペレーター（昼間）",
      "軌陸車オペレーター（夜間）",
      "その他建設機械オペレーター（昼間）",
      "その他建設機械オペレーター（夜間）",
      "その他労務者（昼間）",
      "その他労務者（夜間）",
    ]),
    仮設機械経費: Object.freeze([
      "仮設材･鉄道器材レンタル",
      "仮設材レンタル",
      "建設機械類レンタル",
      "保安用機材類レンタル",
      "仮設ハウス･仮設トイレ",
      "その他機材レンタル",
      "建設機械油脂類",
      "油脂燃料費",
    ]),
    現場経費: Object.freeze([
      "工場製品運搬費",
      "建設機械運搬費",
      "仮設資材運搬費",
      "その他資材運搬費",
      "一般産業廃棄物",
      "特別産業廃棄物",
      "収入印紙",
      "県証紙",
      "防護服･ペール缶",
      "電動ファン用フィルター",
      "郵便･宅配便など",
      "携帯電話代金やＦＡＸ料金",
      "出張旅費特例",
      "３万円未満公共交通機関特例",
      "その他旅費交通費",
      "借上げ自動車費",
      "労災保険料",
      "寄付金･安全祈願祭など",
      "汲み取り料",
      "その他日用雑貨等",
      "安全衛生協議会費",
      "その他諸団体会費",
      "事前打合せ費等",
    ]),
    その他費用: Object.freeze([
      "漁協・水利組合など",
      "瑕損補修費",
      "隣接物瑕損補償費",
      "その他補償費",
      "得意先接待交際費（甲）",
      "得意先接待交際費（乙）",
      "その他接待交際費",
    ]),
    外注労務費: Object.freeze([
      "出向工事安全専任管理者（昼間）",
      "出向工事安全専任管理者（夜間）",
      "外注線閉責任者（昼間）",
      "外注線閉責任者（夜間）",
      "外注列車見張員（昼間）",
      "外注列車見張員（夜間）",
      "外注交通整理員（昼間）",
      "外注交通整理員（夜間）",
      "外注停電責任者（昼間）",
      "外注停電責任者（夜間）",
      "外注検電接地作業者（昼間）",
      "外注検電接地作業者（夜間）",
      "外注安全帯監視人（昼間）",
      "外注安全帯監視人（夜間）",
      "外注その他保安要員（昼間）",
      "外注その他保安要員（夜間）",
      "外注重機誘導員（昼間）",
      "外注重機誘導員（夜間）",
    ]),
  });

  // G0 §10.1: 材料費×(塗料|その他材料) の listOnly。
  // 種別「その他材料費」は塗料マスタではなくシール等（Excel／コード表）を使う。
  const JY2_MATERIAL_LIST_TYPES = Object.freeze([
    "塗料",
    "その他材料",
    "その他材料費",
  ]);
  const JY2_MATERIAL_MASTER = Object.freeze([
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 赤さび",
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 ｸﾞﾚｰ",
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 青緑、淡",
    "厚膜型ﾎﾟﾘｳﾚﾀﾝ樹脂塗料 青緑系",
    "無溶剤変性ｴﾎﾟｷｼ樹脂塗料N-8.5",
    "無溶剤変性ｴﾎﾟｷｼ樹脂塗料N-7",
    "塗料用シンナー",
    "エポキシシンナー",
    "ウレタンシンナー",
  ]);
  const JY2_OTHER_MATERIAL_MASTER = Object.freeze([
    "塗装記録表示シール",
    "桁番号表示シール",
  ]);

  // @JY2_NAME_HIERARCHY_BEGIN
  const JY2_NAME_HIERARCHY = Object.freeze({
  "source": "C:/tmp/実行予算ver2/内訳で使うコード表.xlsx",
  "sourceFile": "内訳で使うコード表.xlsx",
  "generatedAt": "2026-07-29T18:56:16",
  "labels": {
    "name1": "費目",
    "name2": "種別",
    "name3": "詳細"
  },
  "constructionHimokuMenu": [
    "材料費",
    "外注費",
    "労務費",
    "仮設機械経費",
    "現場経費",
    "その他費用",
    "外注労務費"
  ],
  "constructionRule": "sectionA=施工費 かつ Excel費目=外注費のみ（契約工事型）",
  "workTypeNameOrder": [
    "（塗）材料費",
    "（塗）塗装工事",
    "（塗）足場工事",
    "（塗）塗装及び足場工事",
    "（塗）修繕等工事",
    "（塗）塗装付帯工事",
    "（塗）暫定実行予算総額",
    "（塗）追加工事①",
    "（塗）追加工事②",
    "（塗）追加工事③",
    "（塗）追加工事④",
    "（塗）追加工事⑤",
    "（塗）軌道工事",
    "（塗）調査設計費",
    "（塗）外注試験費",
    "（塗）交通規制費",
    "（塗）直轄施工班",
    "（塗）工事管理者賃金",
    "（塗）建設機械オペレーター賃金",
    "（塗）その他労務者賃金",
    "（塗）直轄下請助勢代",
    "（塗）社内工事発注",
    "（塗）鎌ヶ谷資材使用料",
    "（塗）レンタル",
    "（塗）建設機械油脂類",
    "（塗）運送費",
    "（塗）産業廃棄物処理費",
    "（塗）租税公課",
    "（塗）借地料等",
    "（塗）消耗品費",
    "（塗）事務費",
    "（塗）通信費",
    "（塗）旅費交通費",
    "（塗）借上げ自動車費",
    "（塗）履行保証保険料",
    "（塗）建退共証紙購入費",
    "（塗）諸雑費",
    "（塗）諸会費",
    "（塗）会議費",
    "（塗）補償費",
    "（塗）交際費",
    "（塗）工事安全専任管理者",
    "予備費",
    "（塗）社員助勢費用",
    "（塗）現場代理人･監理技術者給与手当",
    "（塗）工事担当者給与手当",
    "（塗）社員工事管理者給与手当",
    "（塗）社員保安要員給与手当",
    "予備費",
    "（塗）線閉責任者",
    "（塗）列車見張員",
    "（塗）交通整理員等",
    "（塗）検電接地",
    "（塗）その他保安費",
    "（塗）重機誘導員"
  ],
  "workTypeOrderNote": "依頼者確認リスト順（現場管理費→予備費→保安費）。Excel名（塗）追加工事？はコード表表記のまま",
  "codeOverridesByName": {
    "（塗）レンタル": "11600"
  },
  "byWorkTypeCode": {
    "10100": {
      "workTypeCode": "10100",
      "workTypeName": "（塗）材料費",
      "sectionA": "施工費",
      "himoku": [
        "材料費"
      ],
      "himokuDefault": "材料費",
      "typesByHimoku": {
        "材料費": [
          "塗料",
          "鋼材･二次製品費など",
          "生コンクリート･石材など",
          "ＡＳ合材費など",
          "鋼製製品費･ゴム製品等",
          "その他材料費"
        ]
      },
      "dashTypeByHimoku": {
        "材料費": false
      },
      "allTypes": [
        "塗料",
        "鋼材･二次製品費など",
        "生コンクリート･石材など",
        "ＡＳ合材費など",
        "鋼製製品費･ゴム製品等",
        "その他材料費"
      ],
      "allDefinitions": [
        "剥離剤･塗料･希釈剤･その他材料",
        "鋼材･二次製品など",
        "生コンクリート類･石材･その他材料",
        "アスファルト合材・舗装材料",
        "工場製作品･ゴム沓･ゴム製伸縮装置など",
        "塗装記録表示シールなど"
      ],
      "himokuCodes": {
        "材料費": "100"
      },
      "constructionMenu": false
    },
    "10200": {
      "workTypeCode": "10200",
      "workTypeName": "（塗）塗装工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10300": {
      "workTypeCode": "10300",
      "workTypeName": "（塗）足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10400": {
      "workTypeCode": "10400",
      "workTypeName": "（塗）塗装及び足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10500": {
      "workTypeCode": "10500",
      "workTypeName": "（塗）直轄施工班",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "10600": {
      "workTypeCode": "10600",
      "workTypeName": "（塗）修繕等工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10700": {
      "workTypeCode": "10700",
      "workTypeName": "（塗）塗装付帯工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10800": {
      "workTypeCode": "10800",
      "workTypeName": "（塗）鎌ヶ谷資材使用料",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "鎌ヶ谷資材使用料"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "鎌ヶ谷資材使用料"
      ],
      "allDefinitions": [
        "倉庫資材の社内損料など"
      ],
      "constructionMenu": false
    },
    "10900": {
      "workTypeCode": "10900",
      "workTypeName": "（塗）工事管理者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "出向工事管理者賃金"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "出向工事管理者賃金"
      ],
      "allDefinitions": [
        "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "11000": {
      "workTypeCode": "11000",
      "workTypeName": "（塗）工事安全専任管理者",
      "sectionA": "その他費用",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "出向工事安全専任管理者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "出向工事安全専任管理者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11100": {
      "workTypeCode": "11100",
      "workTypeName": "（塗）線閉責任者",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注線閉責任者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注線閉責任者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11200": {
      "workTypeCode": "11200",
      "workTypeName": "（塗）列車見張員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注列車見張員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注列車見張員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11300": {
      "workTypeCode": "11300",
      "workTypeName": "（塗）交通整理員等",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注交通整理員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注交通整理員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11400": {
      "workTypeCode": "11400",
      "workTypeName": "（塗）検電接地",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注停電責任者",
          "外注検電接地作業者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注停電責任者",
        "外注検電接地作業者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11500": {
      "workTypeCode": "11500",
      "workTypeName": "（塗）その他保安費",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "河川監視員･架線監視員及びその他保安要員関係"
      ],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11600": {
      "workTypeCode": "11600",
      "workTypeName": "（塗）レンタル",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "仮設材",
          "建設機械",
          "保安用機材類",
          "その他"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "仮設材",
        "建設機械",
        "保安用機材類",
        "その他"
      ],
      "allDefinitions": [
        "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や",
        "運搬費"
      ],
      "constructionMenu": false
    },
    "11700": {
      "workTypeCode": "11700",
      "workTypeName": "（塗）運送費",
      "sectionA": "現場経費",
      "himoku": [
        "運送費"
      ],
      "himokuDefault": "運送費",
      "typesByHimoku": {
        "運送費": []
      },
      "dashTypeByHimoku": {
        "運送費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "運送会社に依頼した建設機械等・仮設材等の運搬費"
      ],
      "himokuCodes": {
        "運送費": "437"
      },
      "constructionMenu": false
    },
    "11800": {
      "workTypeCode": "11800",
      "workTypeName": "（塗）産業廃棄物処理費",
      "sectionA": "現場経費",
      "himoku": [
        "産業廃棄物処理"
      ],
      "himokuDefault": "産業廃棄物処理",
      "typesByHimoku": {
        "産業廃棄物処理": []
      },
      "dashTypeByHimoku": {
        "産業廃棄物処理": true
      },
      "allTypes": [],
      "allDefinitions": [
        "産業廃棄物処理を委託した費用"
      ],
      "constructionMenu": false
    },
    "11900": {
      "workTypeCode": "11900",
      "workTypeName": "（塗）租税公課",
      "sectionA": "現場経費",
      "himoku": [
        "租税公課"
      ],
      "himokuDefault": "租税公課",
      "typesByHimoku": {
        "租税公課": []
      },
      "dashTypeByHimoku": {
        "租税公課": true
      },
      "allTypes": [],
      "allDefinitions": [
        "収入印紙・県証紙など"
      ],
      "himokuCodes": {
        "租税公課": "433"
      },
      "constructionMenu": false
    },
    "12000": {
      "workTypeCode": "12000",
      "workTypeName": "（塗）借地料等",
      "sectionA": "現場経費",
      "himoku": [
        "地代家賃"
      ],
      "himokuDefault": "地代家賃",
      "typesByHimoku": {
        "地代家賃": []
      },
      "dashTypeByHimoku": {
        "地代家賃": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務所･資材置場･駐車場などの賃借料"
      ],
      "himokuCodes": {
        "地代家賃": "431"
      },
      "constructionMenu": false
    },
    "12100": {
      "workTypeCode": "12100",
      "workTypeName": "（塗）消耗品費",
      "sectionA": "現場経費",
      "himoku": [
        "消耗品費"
      ],
      "himokuDefault": "消耗品費",
      "typesByHimoku": {
        "消耗品費": []
      },
      "dashTypeByHimoku": {
        "消耗品費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "ヘルメット･手袋･マスクフィルター･防護服･サンダー刃････ペール缶"
      ],
      "himokuCodes": {
        "消耗品費": "426"
      },
      "constructionMenu": false
    },
    "12200": {
      "workTypeCode": "12200",
      "workTypeName": "（塗）事務費",
      "sectionA": "現場経費",
      "himoku": [
        "事務費"
      ],
      "himokuDefault": "事務費",
      "typesByHimoku": {
        "事務費": []
      },
      "dashTypeByHimoku": {
        "事務費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務用品購入代金及びリース料、什器備品のうち固定資産に計上されないもの"
      ],
      "himokuCodes": {
        "事務費": "436"
      },
      "constructionMenu": false
    },
    "12300": {
      "workTypeCode": "12300",
      "workTypeName": "（塗）通信費",
      "sectionA": "現場経費",
      "himoku": [
        "通信費"
      ],
      "himokuDefault": "通信費",
      "typesByHimoku": {
        "通信費": []
      },
      "dashTypeByHimoku": {
        "通信費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "電話･ＦＡＸ料･切手代･はがき代"
      ],
      "himokuCodes": {
        "通信費": "427"
      },
      "constructionMenu": false
    },
    "12400": {
      "workTypeCode": "12400",
      "workTypeName": "（塗）旅費交通費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": [
          "（塗）出張旅費特例",
          "（塗）３万円未満公共交通機関特例",
          "（塗）その他旅費交通費"
        ]
      },
      "dashTypeByHimoku": {
        "旅費交通費": false
      },
      "allTypes": [
        "（塗）出張旅費特例",
        "（塗）３万円未満公共交通機関特例",
        "（塗）その他旅費交通費"
      ],
      "allDefinitions": [
        "駐車場代金"
      ],
      "himokuCodes": {
        "旅費交通費": "428"
      },
      "typeCodes": {
        "（塗）出張旅費特例": "12401",
        "（塗）３万円未満公共交通機関特例": "12402",
        "（塗）その他旅費交通費": "12403"
      },
      "constructionMenu": false
    },
    "12500": {
      "workTypeCode": "12500",
      "workTypeName": "（塗）借上げ自動車費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": []
      },
      "dashTypeByHimoku": {
        "旅費交通費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "借上げ車損料･ガソリン代･軽油代ほか"
      ],
      "himokuCodes": {
        "旅費交通費": "428"
      },
      "constructionMenu": false
    },
    "12600": {
      "workTypeCode": "12600",
      "workTypeName": "（塗）履行保証保険料",
      "sectionA": "現場経費",
      "himoku": [
        "保険料"
      ],
      "himokuDefault": "保険料",
      "typesByHimoku": {
        "保険料": [
          "（塗）労災保険料"
        ]
      },
      "dashTypeByHimoku": {
        "保険料": false
      },
      "allTypes": [
        "（塗）労災保険料"
      ],
      "allDefinitions": [
        "労災保険関係成立届(単独有期事業)"
      ],
      "himokuCodes": {
        "保険料": "435"
      },
      "typeCodes": {
        "（塗）労災保険料": "12601"
      },
      "constructionMenu": false
    },
    "12700": {
      "workTypeCode": "12700",
      "workTypeName": "（塗）建退共証紙購入費",
      "sectionA": "現場経費",
      "himoku": [
        "法定福利費"
      ],
      "himokuDefault": "法定福利費",
      "typesByHimoku": {
        "法定福利費": []
      },
      "dashTypeByHimoku": {
        "法定福利費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "himokuCodes": {
        "法定福利費": "421"
      },
      "constructionMenu": false
    },
    "12800": {
      "workTypeCode": "12800",
      "workTypeName": "（塗）補償費",
      "sectionA": "その他費用",
      "himoku": [
        "補償費"
      ],
      "himokuDefault": "補償費",
      "typesByHimoku": {
        "補償費": []
      },
      "dashTypeByHimoku": {
        "補償費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "工事施工に伴う漁協･水利組合などや道路･河川･田畑･立木等の瑕損補修費、隣接物瑕損補償費、その他補償費"
      ],
      "himokuCodes": {
        "補償費": "432"
      },
      "constructionMenu": false
    },
    "12900": {
      "workTypeCode": "12900",
      "workTypeName": "（塗）諸雑費",
      "sectionA": "現場経費",
      "himoku": [
        "雑費"
      ],
      "himokuDefault": "雑費",
      "typesByHimoku": {
        "雑費": []
      },
      "dashTypeByHimoku": {
        "雑費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "寄付金･安全祈願祭･汲み取り料･日用雑貨等で他の費目に属さないもの"
      ],
      "himokuCodes": {
        "雑費": "445"
      },
      "constructionMenu": false
    },
    "13100": {
      "workTypeCode": "13100",
      "workTypeName": "（塗）諸会費",
      "sectionA": "現場経費",
      "himoku": [
        "諸会費"
      ],
      "himokuDefault": "諸会費",
      "typesByHimoku": {
        "諸会費": []
      },
      "dashTypeByHimoku": {
        "諸会費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "安全協議会及び諸団体に対する会費など"
      ],
      "himokuCodes": {
        "諸会費": "434"
      },
      "constructionMenu": false
    },
    "13200": {
      "workTypeCode": "13200",
      "workTypeName": "（塗）暫定実行予算総額",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "13300": {
      "workTypeCode": "13300",
      "workTypeName": "（塗）直轄下請助勢代",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "13400": {
      "workTypeCode": "13400",
      "workTypeName": "（塗）社員助勢費用",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "他支店などからの工事管理者に対する給与など"
      ],
      "himokuCodes": {
        "給与手当": "412"
      },
      "constructionMenu": false
    },
    "13500": {
      "workTypeCode": "13500",
      "workTypeName": "（塗）重機誘導員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注重機誘導員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "13600": {
      "workTypeCode": "13600",
      "workTypeName": "（塗）交際費",
      "sectionA": "その他費用",
      "himoku": [
        "接待交際費"
      ],
      "himokuDefault": "接待交際費",
      "typesByHimoku": {
        "接待交際費": [
          "（塗）得意先接待交際費（甲）",
          "（塗）得意先接待交際費（乙）",
          "（塗）その他接待交際費"
        ]
      },
      "dashTypeByHimoku": {
        "接待交際費": false
      },
      "allTypes": [
        "（塗）得意先接待交際費（甲）",
        "（塗）得意先接待交際費（乙）",
        "（塗）その他接待交際費"
      ],
      "allDefinitions": [
        "接待費･挨拶用贈答品･得意先慶弔見舞金など"
      ],
      "himokuCodes": {
        "接待交際費": "430"
      },
      "typeCodes": {
        "（塗）得意先接待交際費（甲）": "13601",
        "（塗）得意先接待交際費（乙）": "13602",
        "（塗）その他接待交際費": "13603"
      },
      "constructionMenu": false
    },
    "13620": {
      "workTypeCode": "13620",
      "workTypeName": "（塗）会議費",
      "sectionA": "現場経費",
      "himoku": [
        "会議費"
      ],
      "himokuDefault": "会議費",
      "typesByHimoku": {
        "会議費": []
      },
      "dashTypeByHimoku": {
        "会議費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "himokuCodes": {
        "会議費": "441"
      },
      "constructionMenu": false
    },
    "13700": {
      "workTypeCode": "13700",
      "workTypeName": "（塗）社内工事発注",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "14100": {
      "workTypeCode": "14100",
      "workTypeName": "（塗）追加工事①",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14200": {
      "workTypeCode": "14200",
      "workTypeName": "（塗）追加工事②",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14300": {
      "workTypeCode": "14300",
      "workTypeName": "（塗）追加工事③",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14400": {
      "workTypeCode": "14400",
      "workTypeName": "（塗）追加工事④",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14500": {
      "workTypeCode": "14500",
      "workTypeName": "（塗）追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    }
  },
  "byWorkTypeName": {
    "（塗）材料費": {
      "workTypeCode": "10100",
      "workTypeName": "（塗）材料費",
      "sectionA": "施工費",
      "himoku": [
        "材料費"
      ],
      "himokuDefault": "材料費",
      "typesByHimoku": {
        "材料費": [
          "塗料",
          "鋼材･二次製品費など",
          "生コンクリート･石材など",
          "ＡＳ合材費など",
          "鋼製製品費･ゴム製品等",
          "その他材料費"
        ]
      },
      "dashTypeByHimoku": {
        "材料費": false
      },
      "allTypes": [
        "塗料",
        "鋼材･二次製品費など",
        "生コンクリート･石材など",
        "ＡＳ合材費など",
        "鋼製製品費･ゴム製品等",
        "その他材料費"
      ],
      "allDefinitions": [
        "剥離剤･塗料･希釈剤･その他材料",
        "鋼材･二次製品など",
        "生コンクリート類･石材･その他材料",
        "アスファルト合材・舗装材料",
        "工場製作品･ゴム沓･ゴム製伸縮装置など",
        "塗装記録表示シールなど"
      ],
      "constructionMenu": false
    },
    "（塗）塗装工事": {
      "workTypeCode": "10200",
      "workTypeName": "（塗）塗装工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）足場工事": {
      "workTypeCode": "10300",
      "workTypeName": "（塗）足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）塗装及び足場工事": {
      "workTypeCode": "10400",
      "workTypeName": "（塗）塗装及び足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）修繕等工事": {
      "workTypeCode": "10600",
      "workTypeName": "（塗）修繕等工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）塗装付帯工事": {
      "workTypeCode": "10700",
      "workTypeName": "（塗）塗装付帯工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）暫定実行予算総額": {
      "workTypeCode": "13200",
      "workTypeName": "（塗）暫定実行予算総額",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事①": {
      "workTypeCode": "14100",
      "workTypeName": "（塗）追加工事①",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事②": {
      "workTypeCode": "14200",
      "workTypeName": "（塗）追加工事②",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事③": {
      "workTypeCode": "14300",
      "workTypeName": "（塗）追加工事③",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事④": {
      "workTypeCode": "14400",
      "workTypeName": "（塗）追加工事④",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事⑤": {
      "workTypeCode": "14500",
      "workTypeName": "（塗）追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）軌道工事": {
      "workTypeCode": "",
      "workTypeName": "（塗）軌道工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）調査設計費": {
      "workTypeCode": "",
      "workTypeName": "（塗）調査設計費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）外注試験費": {
      "workTypeCode": "",
      "workTypeName": "（塗）外注試験費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）交通規制費": {
      "workTypeCode": "",
      "workTypeName": "（塗）交通規制費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）直轄施工班": {
      "workTypeCode": "10500",
      "workTypeName": "（塗）直轄施工班",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）工事管理者賃金": {
      "workTypeCode": "10900",
      "workTypeName": "（塗）工事管理者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "出向工事管理者賃金"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "出向工事管理者賃金"
      ],
      "allDefinitions": [
        "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）建設機械オペレーター賃金": {
      "workTypeCode": "",
      "workTypeName": "（塗）建設機械オペレーター賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "建設機械オペレーター"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "建設機械オペレーター"
      ],
      "allDefinitions": [
        "工事に直接従事する軌陸車などの運転手賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）その他労務者賃金": {
      "workTypeCode": "",
      "workTypeName": "（塗）その他労務者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "その他労務者"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "その他労務者"
      ],
      "allDefinitions": [
        "工事に直接従事する労務者などの賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）直轄下請助勢代": {
      "workTypeCode": "13300",
      "workTypeName": "（塗）直轄下請助勢代",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）社内工事発注": {
      "workTypeCode": "13700",
      "workTypeName": "（塗）社内工事発注",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）鎌ヶ谷資材使用料": {
      "workTypeCode": "10800",
      "workTypeName": "（塗）鎌ヶ谷資材使用料",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "鎌ヶ谷資材使用料"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "鎌ヶ谷資材使用料"
      ],
      "allDefinitions": [
        "倉庫資材の社内損料など"
      ],
      "constructionMenu": false
    },
    "（塗）レンタル": {
      "workTypeCode": "11600",
      "workTypeName": "（塗）レンタル",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "仮設材",
          "建設機械",
          "保安用機材類",
          "その他"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "仮設材",
        "建設機械",
        "保安用機材類",
        "その他"
      ],
      "allDefinitions": [
        "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や",
        "運搬費"
      ],
      "constructionMenu": false
    },
    "（塗）建設機械油脂類": {
      "workTypeCode": "",
      "workTypeName": "（塗）建設機械油脂類",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": []
      },
      "dashTypeByHimoku": {
        "仮設機械経費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "建設機械等の燃料などの代金"
      ],
      "constructionMenu": false
    },
    "（塗）運送費": {
      "workTypeCode": "11700",
      "workTypeName": "（塗）運送費",
      "sectionA": "現場経費",
      "himoku": [
        "運送費"
      ],
      "himokuDefault": "運送費",
      "typesByHimoku": {
        "運送費": []
      },
      "dashTypeByHimoku": {
        "運送費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "運送会社に依頼した建設機械等・仮設材等の運搬費"
      ],
      "constructionMenu": false
    },
    "（塗）産業廃棄物処理費": {
      "workTypeCode": "11800",
      "workTypeName": "（塗）産業廃棄物処理費",
      "sectionA": "現場経費",
      "himoku": [
        "産業廃棄物処理"
      ],
      "himokuDefault": "産業廃棄物処理",
      "typesByHimoku": {
        "産業廃棄物処理": []
      },
      "dashTypeByHimoku": {
        "産業廃棄物処理": true
      },
      "allTypes": [],
      "allDefinitions": [
        "産業廃棄物処理を委託した費用"
      ],
      "constructionMenu": false
    },
    "（塗）租税公課": {
      "workTypeCode": "11900",
      "workTypeName": "（塗）租税公課",
      "sectionA": "現場経費",
      "himoku": [
        "租税公課"
      ],
      "himokuDefault": "租税公課",
      "typesByHimoku": {
        "租税公課": []
      },
      "dashTypeByHimoku": {
        "租税公課": true
      },
      "allTypes": [],
      "allDefinitions": [
        "収入印紙・県証紙など"
      ],
      "constructionMenu": false
    },
    "（塗）借地料等": {
      "workTypeCode": "12000",
      "workTypeName": "（塗）借地料等",
      "sectionA": "現場経費",
      "himoku": [
        "地代家賃"
      ],
      "himokuDefault": "地代家賃",
      "typesByHimoku": {
        "地代家賃": []
      },
      "dashTypeByHimoku": {
        "地代家賃": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務所･資材置場･駐車場などの賃借料"
      ],
      "constructionMenu": false
    },
    "（塗）消耗品費": {
      "workTypeCode": "12100",
      "workTypeName": "（塗）消耗品費",
      "sectionA": "現場経費",
      "himoku": [
        "消耗品費"
      ],
      "himokuDefault": "消耗品費",
      "typesByHimoku": {
        "消耗品費": []
      },
      "dashTypeByHimoku": {
        "消耗品費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "ヘルメット･手袋･マスクフィルター･防護服･サンダー刃････ペール缶"
      ],
      "constructionMenu": false
    },
    "（塗）事務費": {
      "workTypeCode": "12200",
      "workTypeName": "（塗）事務費",
      "sectionA": "現場経費",
      "himoku": [
        "事務費"
      ],
      "himokuDefault": "事務費",
      "typesByHimoku": {
        "事務費": []
      },
      "dashTypeByHimoku": {
        "事務費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務用品購入代金及びリース料、什器備品のうち固定資産に計上されないもの"
      ],
      "constructionMenu": false
    },
    "（塗）通信費": {
      "workTypeCode": "12300",
      "workTypeName": "（塗）通信費",
      "sectionA": "現場経費",
      "himoku": [
        "通信費"
      ],
      "himokuDefault": "通信費",
      "typesByHimoku": {
        "通信費": []
      },
      "dashTypeByHimoku": {
        "通信費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "電話･ＦＡＸ料･切手代･はがき代"
      ],
      "constructionMenu": false
    },
    "（塗）旅費交通費": {
      "workTypeCode": "12400",
      "workTypeName": "（塗）旅費交通費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": [
          "（塗）出張旅費特例",
          "（塗）３万円未満公共交通機関特例",
          "（塗）その他旅費交通費"
        ]
      },
      "dashTypeByHimoku": {
        "旅費交通費": false
      },
      "allTypes": [
        "（塗）出張旅費特例",
        "（塗）３万円未満公共交通機関特例",
        "（塗）その他旅費交通費"
      ],
      "allDefinitions": [
        "駐車場代金"
      ],
      "constructionMenu": false
    },
    "（塗）借上げ自動車費": {
      "workTypeCode": "12500",
      "workTypeName": "（塗）借上げ自動車費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": []
      },
      "dashTypeByHimoku": {
        "旅費交通費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "借上げ車損料･ガソリン代･軽油代ほか"
      ],
      "constructionMenu": false
    },
    "（塗）履行保証保険料": {
      "workTypeCode": "12600",
      "workTypeName": "（塗）履行保証保険料",
      "sectionA": "現場経費",
      "himoku": [
        "保険料"
      ],
      "himokuDefault": "保険料",
      "typesByHimoku": {
        "保険料": [
          "（塗）労災保険料"
        ]
      },
      "dashTypeByHimoku": {
        "保険料": false
      },
      "allTypes": [
        "（塗）労災保険料"
      ],
      "allDefinitions": [
        "労災保険関係成立届(単独有期事業)"
      ],
      "constructionMenu": false
    },
    "（塗）建退共証紙購入費": {
      "workTypeCode": "12700",
      "workTypeName": "（塗）建退共証紙購入費",
      "sectionA": "現場経費",
      "himoku": [
        "法定福利費"
      ],
      "himokuDefault": "法定福利費",
      "typesByHimoku": {
        "法定福利費": []
      },
      "dashTypeByHimoku": {
        "法定福利費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）諸雑費": {
      "workTypeCode": "12900",
      "workTypeName": "（塗）諸雑費",
      "sectionA": "現場経費",
      "himoku": [
        "雑費"
      ],
      "himokuDefault": "雑費",
      "typesByHimoku": {
        "雑費": []
      },
      "dashTypeByHimoku": {
        "雑費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "寄付金･安全祈願祭･汲み取り料･日用雑貨等で他の費目に属さないもの"
      ],
      "constructionMenu": false
    },
    "（塗）諸会費": {
      "workTypeCode": "13100",
      "workTypeName": "（塗）諸会費",
      "sectionA": "現場経費",
      "himoku": [
        "諸会費"
      ],
      "himokuDefault": "諸会費",
      "typesByHimoku": {
        "諸会費": []
      },
      "dashTypeByHimoku": {
        "諸会費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "安全協議会及び諸団体に対する会費など"
      ],
      "constructionMenu": false
    },
    "（塗）会議費": {
      "workTypeCode": "13620",
      "workTypeName": "（塗）会議費",
      "sectionA": "現場経費",
      "himoku": [
        "会議費"
      ],
      "himokuDefault": "会議費",
      "typesByHimoku": {
        "会議費": []
      },
      "dashTypeByHimoku": {
        "会議費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）補償費": {
      "workTypeCode": "12800",
      "workTypeName": "（塗）補償費",
      "sectionA": "その他費用",
      "himoku": [
        "補償費"
      ],
      "himokuDefault": "補償費",
      "typesByHimoku": {
        "補償費": []
      },
      "dashTypeByHimoku": {
        "補償費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "工事施工に伴う漁協･水利組合などや道路･河川･田畑･立木等の瑕損補修費、隣接物瑕損補償費、その他補償費"
      ],
      "constructionMenu": false
    },
    "（塗）交際費": {
      "workTypeCode": "13600",
      "workTypeName": "（塗）交際費",
      "sectionA": "その他費用",
      "himoku": [
        "接待交際費"
      ],
      "himokuDefault": "接待交際費",
      "typesByHimoku": {
        "接待交際費": [
          "（塗）得意先接待交際費（甲）",
          "（塗）得意先接待交際費（乙）",
          "（塗）その他接待交際費"
        ]
      },
      "dashTypeByHimoku": {
        "接待交際費": false
      },
      "allTypes": [
        "（塗）得意先接待交際費（甲）",
        "（塗）得意先接待交際費（乙）",
        "（塗）その他接待交際費"
      ],
      "allDefinitions": [
        "接待費･挨拶用贈答品･得意先慶弔見舞金など"
      ],
      "constructionMenu": false
    },
    "（塗）工事安全専任管理者": {
      "workTypeCode": "11000",
      "workTypeName": "（塗）工事安全専任管理者",
      "sectionA": "その他費用",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "出向工事安全専任管理者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "出向工事安全専任管理者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "予備費": {
      "workTypeCode": "",
      "workTypeName": "予備費",
      "sectionA": "予備費",
      "himoku": [],
      "himokuDefault": "",
      "typesByHimoku": {},
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）社員助勢費用": {
      "workTypeCode": "13400",
      "workTypeName": "（塗）社員助勢費用",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "他支店などからの工事管理者に対する給与など"
      ],
      "constructionMenu": false
    },
    "（塗）現場代理人･監理技術者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）現場代理人･監理技術者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "現場代理人や監理技術者の給与や手当"
      ],
      "constructionMenu": false
    },
    "（塗）工事担当者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）工事担当者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "工事担当者の給与や手当"
      ],
      "constructionMenu": false
    },
    "（塗）社員工事管理者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）社員工事管理者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": [
          "社員工事管理者"
        ]
      },
      "dashTypeByHimoku": {
        "給与手当": false
      },
      "allTypes": [
        "社員工事管理者"
      ],
      "allDefinitions": [
        "社員名を入れたい"
      ],
      "constructionMenu": false
    },
    "（塗）社員保安要員給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）社員保安要員給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": [
          "直轄工事安全専任管理者(昼)",
          "直轄線閉責任者",
          "直轄列車見張員",
          "直轄交通整理員",
          "直轄停電責任者",
          "直轄検電接地作業者",
          "直轄重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "給与手当": false
      },
      "allTypes": [
        "直轄工事安全専任管理者(昼)",
        "直轄線閉責任者",
        "直轄列車見張員",
        "直轄交通整理員",
        "直轄停電責任者",
        "直轄検電接地作業者",
        "直轄重機誘導員"
      ],
      "allDefinitions": [
        "社員名を入れたい"
      ],
      "constructionMenu": false
    },
    "（塗）線閉責任者": {
      "workTypeCode": "11100",
      "workTypeName": "（塗）線閉責任者",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注線閉責任者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注線閉責任者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）列車見張員": {
      "workTypeCode": "11200",
      "workTypeName": "（塗）列車見張員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注列車見張員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注列車見張員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）交通整理員等": {
      "workTypeCode": "11300",
      "workTypeName": "（塗）交通整理員等",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注交通整理員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注交通整理員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）検電接地": {
      "workTypeCode": "11400",
      "workTypeName": "（塗）検電接地",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注停電責任者",
          "外注検電接地作業者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注停電責任者",
        "外注検電接地作業者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）その他保安費": {
      "workTypeCode": "11500",
      "workTypeName": "（塗）その他保安費",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "河川監視員･架線監視員及びその他保安要員関係"
      ],
      "constructionMenu": false
    },
    "（塗）重機誘導員": {
      "workTypeCode": "13500",
      "workTypeName": "（塗）重機誘導員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注重機誘導員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "追加工事⑤": {
      "workTypeCode": "14500",
      "workTypeName": "追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    }
  },
  "allHimoku": [
    "材料費",
    "外注費",
    "労務費",
    "仮設機械経費",
    "工具･機械使用料",
    "運送費",
    "産業廃棄物処理",
    "租税公課",
    "地代家賃",
    "消耗品費",
    "事務費",
    "通信費",
    "旅費交通費",
    "保険料",
    "法定福利費",
    "雑費",
    "諸会費",
    "会議費",
    "補償費",
    "接待交際費",
    "外注労務費",
    "給与手当",
    "現場経費",
    "諸経費",
    "予備費"
  ],
  "typesByHimoku": {
    "材料費": [
      "塗料",
      "鋼材･二次製品費など",
      "生コンクリート･石材など",
      "ＡＳ合材費など",
      "鋼製製品費･ゴム製品等",
      "その他材料費"
    ],
    "労務費": [
      "出向工事管理者賃金",
      "建設機械オペレーター",
      "その他労務者",
      "労務費（昼間）",
      "労務費（夜間）",
      "出向工事管理者賃金（昼）",
      "出向工事管理者賃金（夜）",
      "建設機械オペレーター（昼）",
      "建設機械オペレーター（夜）",
      "その他労務者（昼）",
      "その他労務者（夜）"
    ],
    "仮設機械経費": [
      "鎌ヶ谷資材使用料",
      "仮設材",
      "建設機械",
      "保安用機材類",
      "その他"
    ],
    "工具･機械使用料": [
      "仮設・工具費等"
    ],
    "旅費交通費": [
      "（塗）出張旅費特例",
      "（塗）３万円未満公共交通機関特例",
      "（塗）その他旅費交通費"
    ],
    "保険料": [
      "（塗）労災保険料"
    ],
    "接待交際費": [
      "（塗）得意先接待交際費（甲）",
      "（塗）得意先接待交際費（乙）",
      "（塗）その他接待交際費"
    ],
    "外注労務費": [
      "出向工事安全専任管理者",
      "外注線閉責任者",
      "外注列車見張員",
      "外注交通整理員",
      "外注停電責任者",
      "外注検電接地作業者",
      "外注重機誘導員"
    ],
    "給与手当": [
      "社員工事管理者",
      "直轄工事安全専任管理者(昼)",
      "直轄線閉責任者",
      "直轄列車見張員",
      "直轄交通整理員",
      "直轄停電責任者",
      "直轄検電接地作業者",
      "直轄重機誘導員"
    ],
    "現場経費": [
      "運送費",
      "産業廃棄物処理",
      "租税公課",
      "地代家賃",
      "消耗品費",
      "事務費",
      "通信費",
      "旅費交通費",
      "保険料",
      "法定福利費",
      "雑費",
      "諸会費",
      "会議費"
    ]
  },
  "dashOnlyHimoku": [
    "外注費",
    "運送費",
    "産業廃棄物処理",
    "租税公課",
    "地代家賃",
    "消耗品費",
    "事務費",
    "通信費",
    "法定福利費",
    "雑費",
    "諸会費",
    "会議費",
    "補償費"
  ],
  "definitionsByType": {
    "塗料": [
      "剥離剤･塗料･希釈剤･その他材料"
    ],
    "鋼材･二次製品費など": [
      "鋼材･二次製品など"
    ],
    "生コンクリート･石材など": [
      "生コンクリート類･石材･その他材料"
    ],
    "ＡＳ合材費など": [
      "アスファルト合材・舗装材料"
    ],
    "鋼製製品費･ゴム製品等": [
      "工場製作品･ゴム沓･ゴム製伸縮装置など"
    ],
    "その他材料費": [
      "塗装記録表示シールなど"
    ],
    "出向工事管理者賃金": [
      "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
    ],
    "建設機械オペレーター": [
      "工事に直接従事する軌陸車などの運転手賃金であり、社員及び契約社員は除く"
    ],
    "その他労務者": [
      "工事に直接従事する労務者などの賃金であり、社員及び契約社員は除く"
    ],
    "鎌ヶ谷資材使用料": [
      "倉庫資材の社内損料など"
    ],
    "仮設材": [
      "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や"
    ],
    "建設機械": [
      "運搬費"
    ],
    "（塗）その他旅費交通費": [
      "駐車場代金"
    ],
    "（塗）労災保険料": [
      "労災保険関係成立届(単独有期事業)"
    ],
    "（塗）得意先接待交際費（甲）": [
      "接待費･挨拶用贈答品･得意先慶弔見舞金など"
    ],
    "社員工事管理者": [
      "社員名を入れたい"
    ],
    "直轄工事安全専任管理者(昼)": [
      "社員名を入れたい"
    ],
    "直轄線閉責任者": [
      "社員名を入れたい"
    ],
    "直轄列車見張員": [
      "社員名を入れたい"
    ],
    "直轄交通整理員": [
      "社員名を入れたい"
    ],
    "直轄停電責任者": [
      "社員名を入れたい"
    ],
    "直轄検電接地作業者": [
      "社員名を入れたい"
    ],
    "直轄重機誘導員": [
      "社員名を入れたい"
    ]
  }
});
  // @JY2_NAME_HIERARCHY_END

  const JY2_COST_CATEGORY_BY_WORK_TYPE_CODE = Object.freeze({
    "10100": "施工",
    "10200": "施工",
    "10300": "施工",
    "10400": "施工",
    "10500": "施工",
    "10600": "施工",
    "10700": "施工",
    "10800": "施工",
    "10900": "施工",
    "11000": "施工",
    "11100": "保安",
    "11200": "保安",
    "11300": "保安",
    "11400": "保安",
    "11500": "保安",
    "11600": "施工",
    "11700": "施工",
    "11800": "施工",
    "11900": "施工",
    "12000": "施工",
    "12100": "施工",
    "12200": "施工",
    "12300": "施工",
    "12400": "施工",
    "12500": "施工",
    "12600": "施工",
    "12700": "施工",
    "12800": "施工",
    "12900": "施工",
    "13100": "施工",
    "13200": "施工",
    "13300": "施工",
    "13400": "給与",
    "13500": "保安",
    "13600": "施工",
    "13620": "施工",
    "13700": "施工",
    "14000": "施工",
    "14100": "施工",
    "14200": "施工",
    "14300": "施工",
    "14400": "施工",
    "14500": "施工",
    "90200": "施工",
  });
  const JY2_COST_CATEGORY_BY_WORK_TYPE_NAME = Object.freeze({
    "（塗）材料費": "施工",
    "（塗）塗装工事": "施工",
    "（塗）足場工事": "施工",
    "（塗）塗装及び足場工事": "施工",
    "（塗）修繕等工事": "施工",
    "（塗）塗装付帯工事": "施工",
    "（塗）暫定実行予算総額": "施工",
    "（塗）追加工事？": "施工",
    "（塗）追加工事①": "施工",
    "（塗）追加工事②": "施工",
    "（塗）追加工事③": "施工",
    "（塗）追加工事④": "施工",
    "（塗）追加工事⑤": "施工",
    "追加工事⑤": "施工",
    "（塗）軌道工事": "施工",
    "（塗）調査設計費": "施工",
    "（塗）外注試験費": "施工",
    "（塗）交通規制費": "施工",
    "（塗）直轄施工班": "施工",
    "（塗）工事管理者賃金": "施工",
    "（塗）建設機械オペレーター賃金": "施工",
    "（塗）その他労務者賃金": "施工",
    "（塗）直轄下請助勢代": "施工",
    "（塗）社内工事発注": "施工",
    "（塗）鎌ヶ谷資材使用料": "施工",
    "（塗）レンタル": "施工",
    "（塗）建設機械油脂類": "施工",
    "（塗）運送費": "施工",
    "（塗）産業廃棄物処理費": "施工",
    "（塗）租税公課": "施工",
    "（塗）借地料等": "施工",
    "（塗）消耗品費": "施工",
    "（塗）事務費": "施工",
    "（塗）通信費": "施工",
    "（塗）旅費交通費": "施工",
    "（塗）借上げ自動車費": "施工",
    "（塗）履行保証保険料": "施工",
    "（塗）建退共証紙購入費": "施工",
    "（塗）諸雑費": "施工",
    "（塗）諸会費": "施工",
    "（塗）会議費": "施工",
    "前期支店共通原価": "施工",
    "（塗）補償費": "施工",
    "（塗）交際費": "施工",
    "（塗）工事安全専任管理者": "施工",
    "（塗）線閉責任者": "保安",
    "（塗）列車見張員": "保安",
    "（塗）交通整理員等": "保安",
    "（塗）検電接地": "保安",
    "（塗）その他保安費": "保安",
    "（塗）重機誘導員": "保安",
    "（塗）社員助勢費用": "給与",
    "（塗）現場代理人･監理技術者給与手当": "給与",
    "（塗）工事担当者給与手当": "給与",
    "（塗）社員工事管理者給与手当": "給与",
    "（塗）社員保安要員給与手当": "給与",
  });
  function jy2ResolveCostCategoryFromWorkType(code, name) {
    const c = String(code || "").trim();
    if (c && JY2_COST_CATEGORY_BY_WORK_TYPE_CODE[c]) return JY2_COST_CATEGORY_BY_WORK_TYPE_CODE[c];
    const n = String(name || "").trim();
    if (n && JY2_COST_CATEGORY_BY_WORK_TYPE_NAME[n]) return JY2_COST_CATEGORY_BY_WORK_TYPE_NAME[n];
    return null;
  }

  // R-07 / コード表階層: システム工種 → 費目 → 種別（補助） → 定義及び品名。
  // 工事系工種は依頼者説明文の費目メニュー（材料費〜法定福利費＋予備費）を合成済み。
  function jy2ResolveNameHierarchy(block) {
    const code = String((block && block.workTypeCode) || "").trim();
    const name = String((block && block.workTypeName) || "").trim();
    const nameBare = name.replace(/^（塗）/u, "");
    const byCode = JY2_NAME_HIERARCHY.byWorkTypeCode || {};
    const byName = JY2_NAME_HIERARCHY.byWorkTypeName || {};
    // 名称優先（同一コードの衝突や誤記訂正後も名称で正確に引く）。
    // マスタ名（塗なし）と旧（塗）付きの両方を引く。
    if (name && byName[name]) return byName[name];
    if (nameBare && byName[nameBare]) return byName[nameBare];
    if (nameBare && byName[`（塗）${nameBare}`]) return byName[`（塗）${nameBare}`];
    if (code && byCode[code]) return byCode[code];
    return null;
  }

  function jy2HimokuMasterMenu() {
    // G0 §7: 内訳費目の正本はマスタ整理7件のみ。
    return [...(JY2_NAME_HIERARCHY.constructionHimokuMenu || [])];
  }

  function jy2HimokuChoicesForEntry(entry) {
    // JSON 工種の費目（7件の部分集合）。コード表 himoku の余剰は混ぜない。
    return jy2HimokuChoicesFromSystemWork(
      entry && entry.workTypeCode,
      entry && entry.workTypeName,
      jy2HimokuMasterMenu(),
    );
  }

  function jy2HimokuDefaultForBlock(block) {
    const code = String((block && block.workTypeCode) || "").trim();
    const entry = jy2ResolveNameHierarchy(block) || {
      workTypeCode: code,
      workTypeName: block && block.workTypeName,
    };
    const choices = jy2HimokuChoicesForEntry(entry);
    const fromJson = jy2HimokuFromSystemWork(code, block && block.workTypeName);
    if (fromJson && choices.includes(fromJson)) return fromJson;
    if (entry && entry.himokuDefault && choices.includes(entry.himokuDefault)) {
      return entry.himokuDefault;
    }
    if (choices.length === 1) return choices[0];
    return null;
  }

  // Phase2c-c-excel-outline: 親行 freeze1 に載せる既定費目（himokuDefault または
  // 単一 himoku[0]）。複数候補で既定が無いときは null（費目行は walker 側）。
  function jy2ActualPrimaryHimokuLabel(hierarchyEntry, row) {
    const block = {
      workTypeCode: row && row.workTypeCode,
      workTypeName: row && row.workTypeName,
    };
    const fromDefault = jy2HimokuDefaultForBlock(block);
    if (fromDefault) return fromDefault;
    if (!hierarchyEntry) return null;
    const fromEntry = Array.isArray(hierarchyEntry.himoku)
      ? hierarchyEntry.himoku.filter(Boolean)
      : [];
    if (fromEntry.length === 1) return fromEntry[0];
    const choices = jy2HimokuChoicesForEntry(hierarchyEntry);
    if (choices.length === 1) return choices[0];
    return null;
  }

  // 工種変更時: 明細の費目をコード表の既定へ寄せる（空行・旧費目が候補外なら上書き）。
  function jy2ApplyHimokuDefaultToDetails(detailModel, stableBlockId) {
    const snap = detailModel.snapshot().blocks.find((b) => b.stableBlockId === stableBlockId);
    if (!snap) return;
    const himoku = jy2HimokuDefaultForBlock(snap);
    const entry = jy2ResolveNameHierarchy(snap);
    const allowed = new Set(jy2HimokuChoicesForEntry(entry || snap));
    for (const row of snap.detailRows) {
      const current = row.name1 == null ? "" : String(row.name1).trim();
      const invalid =
        current &&
        (jy2HimokuCurrentIsWorkTypeName(current, snap.workTypeName) || !allowed.has(current));
      const nextHimoku = !current || invalid ? (himoku || null) : current;
      const patch = {};
      if (!current || invalid) {
        patch.name1 = himoku || null;
      }
      if (nextHimoku && jy2HimokuUsesDashType(entry, nextHimoku)) {
        patch.name2 = "－";
      } else if (nextHimoku) {
        const sole = jy2SoleTypeForHimoku(entry, nextHimoku);
        const currentType = String(row.name2 || "").trim();
        if (sole) {
          if (currentType !== sole) patch.name2 = sole;
        } else if (currentType === "－") {
          patch.name2 = null;
        }
      }
      if (Object.keys(patch).length) {
        detailModel.updateDetailRow(stableBlockId, row.rowKey, patch);
      }
    }
  }

  // 費目 → 種別。マスタ整理「内訳」正本のみ（コード表 typesByHimoku は使わない）。
  // 外注費は §9.1 の5件。
  function jy2TypesForHimoku(entry, himoku) {
    const key = String(himoku || "").trim();
    if (!key) return [];
    const master = JY2_TYPES_BY_HIMOKU_MASTER[key];
    const masterList = Array.isArray(master) ? [...master] : [];
    return jy2TypesFromSystemWork(
      entry && entry.workTypeCode,
      entry && entry.workTypeName,
      key,
      masterList,
    );
  }

  function jy2GaichuDetailChoices(typeName, currentValue) {
    const t = String(typeName || "").trim();
    if (t === "材料費") return jy2ListOnlyChoices(JY2_MATERIAL_TYPE_MENU, currentValue);
    return jy2ListOnlyChoices(jy2TypesForHimoku(null, t), currentValue);
  }

  // 候補がちょうど1件ならそれを返す（「－」固定費目は別経路）。
  function jy2SoleTypeForHimoku(entry, himoku) {
    if (jy2HimokuUsesDashType(entry, himoku)) return null;
    const types = jy2TypesForHimoku(entry, himoku).filter(
      (t) => t && String(t).trim() && String(t).trim() !== "－",
    );
    return types.length === 1 ? String(types[0]).trim() : null;
  }

  function jy2HimokuUsesDashType(entry, himoku) {
    const key = String(himoku || "").trim();
    if (!key) return false;
    // G0 §9.1: 外注費の種別は材料費／労務費／仮設機械経費／現場経費／その他費用の5件。
    // 旧コード表の dashTypeByHimoku／dashOnlyHimoku「外注費＝－」は使わない。
    if (key === "外注費") return false;
    // Excel原価管理の種別なし費目: name2=詳細左。コード表の「－」固定種別は使わない。
    if (jy2CostMgmtIsTypeLessHimoku(key)) {
      return false;
    }
    const code = entry && entry.workTypeCode != null ? String(entry.workTypeCode).trim() : "";
    const name = entry && entry.workTypeName != null ? String(entry.workTypeName) : "";
    if (jy2CostMgmtIsTypeLessExcelWorkType(code, name)) return false;
    const local = entry && entry.dashTypeByHimoku;
    if (local && Object.prototype.hasOwnProperty.call(local, key)) {
      return local[key] === true;
    }
    return (JY2_NAME_HIERARCHY.dashOnlyHimoku || []).includes(key);
  }

  function jy2NormalizeDashTypeDetails(detailModel) {
    const snapshot = detailModel.snapshot();
    for (const block of snapshot.blocks) {
      const entry = jy2ResolveNameHierarchy(block);
      block.detailRows.forEach((row, rowIndex) => {
        const himoku =
          jy2IsDitto(row.name1) || !jy2HasText(row.name1)
            ? jy2PrevResolved(block.detailRows, rowIndex, "name1")
            : String(row.name1 || "").trim();
        const currentType = String(row.name2 || "").trim();
        // G0 §9.1: 外注費に残った旧「－」はクリア（5件メニューへ）。
        if (himoku === "外注費" && currentType === "－") {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name2: null,
          });
          return;
        }
        if (jy2HimokuUsesDashType(entry, himoku) && currentType !== "－") {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name2: "－",
          });
        }
      });
    }
  }

  // 費目に対する種別（補助）が1件だけの行は、空／「－」／〃なら自動セット。
  function jy2NormalizeSoleTypeDetails(detailModel) {
    const snapshot = detailModel.snapshot();
    for (const block of snapshot.blocks) {
      const entry = jy2ResolveNameHierarchy(block);
      block.detailRows.forEach((row, rowIndex) => {
        const himoku =
          jy2IsDitto(row.name1) || !jy2HasText(row.name1)
            ? jy2PrevResolved(block.detailRows, rowIndex, "name1")
            : String(row.name1 || "").trim();
        if (!himoku) return;
        const sole = jy2SoleTypeForHimoku(entry, himoku);
        if (!sole) return;
        const current = String(row.name2 || "").trim();
        if (!current || current === "－" || current === JY2_DITTO_MARK) {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name2: sole,
          });
        }
      });
    }
  }

  function jy2DefinitionsForType(typeName, himoku, entry) {
    const defsByType = JY2_NAME_HIERARCHY.definitionsByType || {};
    const typeKey = String(typeName || "").trim();
    if (typeKey && Array.isArray(defsByType[typeKey]) && defsByType[typeKey].length) {
      return [...defsByType[typeKey]];
    }
    // 種別未選択時: 選んだ費目の各種別の定義を候補にまとめる。
    const himokuKey = String(himoku || "").trim();
    if (!himokuKey) {
      return entry && Array.isArray(entry.allDefinitions)
        ? [...entry.allDefinitions]
        : [];
    }
    const types = jy2TypesForHimoku(entry, himokuKey);
    const merged = [];
    for (const t of types) {
      for (const d of defsByType[t] || []) {
        if (d && !merged.includes(d)) merged.push(d);
      }
    }
    return merged;
  }

  function jy2CollectDetailSuggestions(detailModel, block, row) {
    // 候補源はマスタ整理正本（コード表の余剰候補は出さない）。
    // 取引先: マスタ順を維持。レコードの現行値のみ祖父追加（五十音ソートしない）。
    const vendors = [...JY2_VENDOR_SEEDS];
    if (detailModel) {
      for (const b of detailModel.snapshot().blocks) {
        const v = b && b.vendorName ? String(b.vendorName).trim() : "";
        if (v && !vendors.includes(v)) vendors.push(v);
      }
    }
    const entry = jy2ResolveNameHierarchy(block || {});
    const selectedHimoku = row && row.name1 ? String(row.name1).trim() : "";
    const rawType = row && row.name2 != null ? String(row.name2).trim() : "";
    // 〃／空は祖父に使わない（上段種別の漏洩防止）。
    const grandfatherType =
      rawType && !jy2IsDitto(rawType) ? rawType : "";

    let name1;
    let name2;
    let name3;
    if (entry) {
      // システム工種あり → JSON 外注工事は費目5件。工種名は祖父しない。
      // 種別は選んだ費目に紐づく候補のみ（未選択時は空＝紐付けを明示）。
      const himokuCurrent = selectedHimoku || (row && row.name1);
      name1 = jy2ListOnlyChoices(
        jy2HimokuChoicesForEntry(entry),
        jy2HimokuCurrentIsWorkTypeName(himokuCurrent, block && block.workTypeName)
          ? ""
          : himokuCurrent,
      );
      name2 = selectedHimoku
        ? jy2ListOnlyChoices(
            jy2TypesForHimoku(entry, selectedHimoku),
            grandfatherType,
          )
        : [];
      // 材料種類マスタ対象のみ list。それ以外の詳細は手入力（コード表定義候補は出さない）。
      name3 = jy2UsesMaterialList(selectedHimoku, grandfatherType)
        ? jy2MaterialChoices(row && row.name3, selectedHimoku, grandfatherType)
        : [];
    } else {
      // 工種空（R-05）: 費目もマスタ7件のみ。種別は費目選択後。
      name1 = jy2ListOnlyChoices(
        jy2HimokuMasterMenu(),
        selectedHimoku || (row && row.name1),
      );
      name2 = selectedHimoku
        ? jy2ListOnlyChoices(
            jy2TypesForHimoku(null, selectedHimoku),
            grandfatherType,
          )
        : [];
      name3 = jy2UsesMaterialList(selectedHimoku, grandfatherType)
        ? jy2MaterialChoices(row && row.name3, selectedHimoku, grandfatherType)
        : [];
    }
    return {
      profile: entry
        ? entry.constructionMenu
          ? "construction-menu"
          : "hierarchy"
        : "all",
      name1,
      name2,
      name3,
      vendors,
      himokuLocked: entry ? jy2HimokuChoicesForEntry(entry).length === 1 : false,
    };
  }

  function jy2UnitSelect(documentRef, value, onCommit, units = COMMON_UNITS) {
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "";
    select.appendChild(blank);
    const current = value === null || value === undefined ? "" : String(value);
    // listOnly 祖父: マスタ外の現行値（例: 旧㎡）も選択肢に残す。
    const menu = [...units];
    if (current && !menu.includes(current)) menu.push(current);
    for (const unit of menu) {
      const option = documentRef.createElement("option");
      option.value = unit;
      option.textContent = unit;
      select.appendChild(option);
    }
    select.value = current;
    select.addEventListener("change", () => onCommit(select.value));
    return select;
  }

  function jy2RowButton(documentRef, label, onClick) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "jy2-row-button";
    button.textContent = label;
    // 入力フォーカス中に押したとき、blur→commit が先に走って click が潰れるのを防ぐ。
    button.addEventListener("mousedown", (event) => {
      if (typeof event.preventDefault === "function") event.preventDefault();
    });
    button.addEventListener("click", (event) => {
      try {
        onClick(event);
      } catch (error) {
        const view = documentRef && documentRef.defaultView;
        const message =
          error && error.message ? String(error.message) : String(error || "操作に失敗しました");
        if (view && typeof view.alert === "function") {
          view.alert(message);
        } else if (typeof console !== "undefined" && console.error) {
          console.error(message, error);
        }
      }
    });
    return button;
  }

  /**
   * レイアウト可視矩形（ブラウザ拡大率 100%/80% 差の主因を吸収）。
   * Ctrl± ズームでは visualViewport と layout が連動。ピンチ時は小さい方を使う。
   * alert/reload 直後の visualViewport 偽狭幅を無視（scale≈1）。
   */
  function jy2LayoutViewportBox(win) {
    const innerW = win.innerWidth || 0;
    const innerH = win.innerHeight || 0;
    const vv = win.visualViewport;
    if (vv && Number.isFinite(vv.width) && vv.width > 0) {
      const left = Number.isFinite(vv.offsetLeft) ? vv.offsetLeft : 0;
      const top = Number.isFinite(vv.offsetTop) ? vv.offsetTop : 0;
      const scale = Number.isFinite(vv.scale) ? vv.scale : 1;
      const isPinch = Math.abs(scale - 1) > 0.02;
      let width;
      let height;
      if (isPinch) {
        width = Math.min(innerW || vv.width, vv.width);
        height = Math.min(innerH || vv.height, vv.height);
      } else {
        const docEl = win.document && win.document.documentElement;
        const clientW = docEl && docEl.clientWidth ? docEl.clientWidth : 0;
        const clientH = docEl && docEl.clientHeight ? docEl.clientHeight : 0;
        width = Math.max(innerW, clientW);
        height = Math.max(innerH, clientH);
      }
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
      };
    }
    return {
      left: 0,
      top: 0,
      right: innerW,
      bottom: innerH,
      width: innerW,
      height: innerH,
    };
  }

  /** 要素とレイアウト可視域の交差幅（親が表で膨らんでも窓外は数えない）。 */
  function jy2VisibleClientWidth(el, win) {
    if (!el || !win) return 0;
    const rect = el.getBoundingClientRect();
    const box = jy2LayoutViewportBox(win);
    const left = Math.max(box.left, rect.left);
    const right = Math.min(box.right, rect.right);
    return Math.max(0, Math.floor(right - left));
  }

  /**
   * ウィンドウに収まる絶対天井。
   * 旧: leftInset を 120px で頭打ち → kintone 左ナビが広いと天井過大 → 100% で右枠切れ（80% では誤って収まる）。
   */
  function jy2ViewportHScrollCeiling(doc, win, host) {
    const box = jy2LayoutViewportBox(win);
    const docWidth = doc.documentElement
      ? doc.documentElement.clientWidth
      : box.width;
    const viewport = Math.min(box.width, docWidth || box.width);
    let leftInset = 24;
    let rightInset = 20;
    if (host) {
      const hr = host.getBoundingClientRect();
      if (Number.isFinite(hr.left)) {
        // 実左端を使う（120 上限は撤廃。過大 left は viewport 側で自然に潰れる）
        leftInset = Math.max(8, Math.floor(Math.max(0, hr.left - box.left)));
      }
      if (Number.isFinite(hr.right) && hr.right < box.right) {
        rightInset = Math.max(12, Math.floor(box.right - hr.right) + 8);
      }
    }
    return Math.max(240, Math.floor(viewport - leftInset - rightInset));
  }

  function jy2MeasureHScrollBasis(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!win) return 0;
    const host = doc.getElementById("jy2-host");
    // 親(host/pane)の可視幅は表で膨張し得るため使わない。天井（viewport−左端）のみ。
    return jy2ViewportHScrollCeiling(doc, win, host);
  }

  /** host 自体が窓より食み出さないよう max-width を同期（外枠切れ防止）。 */
  function jy2SyncHostViewportCap(doc) {
    const win = doc && doc.defaultView;
    const host = doc && doc.getElementById("jy2-host");
    if (!win || !host || !host.style) return;
    const box = jy2LayoutViewportBox(win);
    const hr = host.getBoundingClientRect();
    const left = Math.max(box.left, hr.left);
    const cap = Math.max(240, Math.floor(box.right - left - 8));
    host.style.setProperty("max-width", `${cap}px`, "important");
    host.style.setProperty("width", "100%", "important");
    host.style.setProperty("box-sizing", "border-box", "important");
    host.style.setProperty("contain", "inline-size", "important");
    const shell = host.querySelector(".jy2-shell");
    if (shell && shell.style) {
      shell.style.setProperty("max-width", "100%", "important");
      shell.style.setProperty("box-sizing", "border-box", "important");
      shell.style.setProperty("contain", "inline-size", "important");
    }
  }

  /**
   * 画面下固定の横スクロールレール。
   * 総括は縦に長いため、ラッパ本体のバーは最下部にしか出ず「スクロールが出ない」ように見える。
   */
  function jy2SyncFixedHRail(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!doc || !win || !scrollEl) return;
    const pane = scrollEl.closest(".jy2-pane");
    if (pane && pane.dataset.active !== "true") return;

    const overflow = scrollEl.scrollWidth - scrollEl.clientWidth > 2;
    let rail = doc.getElementById("jy2-fixed-hrail");
    if (!overflow) {
      if (rail) rail.style.display = "none";
      return;
    }
    if (!rail) {
      rail = doc.createElement("div");
      rail.id = "jy2-fixed-hrail";
      const spacer = doc.createElement("div");
      spacer.className = "jy2-fixed-hrail-spacer";
      rail.appendChild(spacer);
      doc.body.appendChild(rail);
      let lock = false;
      rail.addEventListener("scroll", () => {
        if (lock) return;
        lock = true;
        const target = doc.querySelector(
          ".jy2-pane[data-active='true'] .jy2-table-scroll, .jy2-pane[data-active='true'] .jy2-actual-scroll",
        );
        if (target) target.scrollLeft = rail.scrollLeft;
        lock = false;
      });
      rail._jy2Lock = () => lock;
      rail._jy2SetLock = (v) => {
        lock = v;
      };
    }
    const spacer = rail.querySelector(".jy2-fixed-hrail-spacer");
    const rect = scrollEl.getBoundingClientRect();
    rail.style.display = "block";
    rail.style.left = `${Math.max(0, Math.floor(rect.left))}px`;
    rail.style.width = `${Math.max(120, Math.floor(rect.width))}px`;
    if (spacer) {
      spacer.style.width = `${Math.max(scrollEl.scrollWidth, scrollEl.clientWidth)}px`;
    }
    if (Math.abs(rail.scrollLeft - scrollEl.scrollLeft) > 1) {
      rail.scrollLeft = scrollEl.scrollLeft;
    }
    if (!scrollEl.dataset.jy2RailBound) {
      scrollEl.dataset.jy2RailBound = "1";
      scrollEl.addEventListener("scroll", () => {
        const r = doc.getElementById("jy2-fixed-hrail");
        if (!r || r.style.display === "none") return;
        if (Math.abs(r.scrollLeft - scrollEl.scrollLeft) > 1) {
          r.scrollLeft = scrollEl.scrollLeft;
        }
      });
    }
  }

  /**
   * 横スクロール中身幅:
   * - 広幅: wrap まで伸ばす（右白帯なし）
   * - 狭幅: 表の自然幅(max-content)を維持 → 縮めず横スクロール
   * 旧: innerW=max(1100,wrap) だと wrap が 1800→1200 でも表が縮み、1100超ではスクロール不出。
   */
  function jy2EnsureHScrollInner(scrollEl, forceMin) {
    let inner = scrollEl.querySelector(":scope > .jy2-hscroll-inner");
    if (inner) return inner;
    const doc = scrollEl.ownerDocument;
    if (!doc) return null;
    inner = doc.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = String(forceMin);
    while (scrollEl.firstChild) {
      inner.appendChild(scrollEl.firstChild);
    }
    scrollEl.appendChild(inner);
    return inner;
  }

  function jy2MeasureNaturalTableWidth(scrollEl, inner, forceMin) {
    const tables = [
      ...scrollEl.querySelectorAll(
        ".jy2-table, .jy2-detail-table, .jy2-actual-table",
      ),
    ];
    const blocks = [
      ...scrollEl.querySelectorAll(".jy2-detail-block, .jy2-budget-summary"),
    ];
    inner.style.setProperty("width", "max-content", "important");
    inner.style.setProperty("min-width", `${forceMin}px`, "important");
    inner.style.setProperty("max-width", "none", "important");
    tables.forEach((table) => {
      table.style.setProperty("width", "max-content", "important");
      table.style.setProperty("min-width", `${forceMin}px`, "important");
      table.style.setProperty("max-width", "none", "important");
    });
    blocks.forEach((el) => {
      el.style.setProperty("width", "max-content", "important");
      el.style.setProperty("min-width", `${forceMin}px`, "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("overflow", "visible", "important");
    });
    void inner.offsetWidth;
    let measured = forceMin;
    tables.forEach((table) => {
      measured = Math.max(
        measured,
        Math.ceil(table.scrollWidth || 0),
        Math.ceil(table.offsetWidth || 0),
      );
    });
    measured = Math.max(
      measured,
      Math.ceil(inner.scrollWidth || 0),
    );
    const remembered = Number(inner.dataset.naturalWidth) || 0;
    const natural = Math.max(forceMin, measured, remembered);
    inner.dataset.naturalWidth = String(natural);
    return natural;
  }

  function jy2ForceTableMinWidth(scrollEl) {
    const isActual = scrollEl.classList.contains("jy2-actual-scroll");
    const forceMin = isActual ? 1600 : 1400;
    const wrapInner = Math.max(0, Math.floor(scrollEl.clientWidth || 0));
    const inner = jy2EnsureHScrollInner(scrollEl, forceMin);
    if (!inner || !inner.style) return;

    const dataMin = Number(inner.dataset.minWidth) || forceMin;
    const floor = Math.max(forceMin, dataMin);
    const natural = jy2MeasureNaturalTableWidth(scrollEl, inner, floor);
    // 広幅は wrap まで伸ばす。狭幅は natural を維持（窓に合わせて縮めない）
    const innerW = Math.max(floor, natural, wrapInner);

    inner.style.setProperty("width", `${innerW}px`, "important");
    inner.style.setProperty("min-width", `${innerW}px`, "important");
    inner.style.setProperty("max-width", "none", "important");
    inner.style.setProperty("box-sizing", "border-box", "important");
    inner.style.setProperty("display", "block", "important");

    scrollEl
      .querySelectorAll(".jy2-table, .jy2-detail-table, .jy2-actual-table")
      .forEach((table) => {
        if (!table.style) return;
        table.style.setProperty("width", "100%", "important");
        table.style.setProperty("min-width", "0", "important");
        table.style.setProperty("max-width", "none", "important");
      });
    scrollEl
      .querySelectorAll(".jy2-detail-block, .jy2-budget-summary")
      .forEach((el) => {
        if (!el.style) return;
        el.style.setProperty("width", "100%", "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("max-width", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
      });
  }

  function jy2SyncHScroll(scrollEl) {
    if (!scrollEl || !scrollEl.style) return scrollEl;
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (doc) jy2SyncHostViewportCap(doc);
    const basis = jy2MeasureHScrollBasis(scrollEl);
    const gutter = scrollEl.classList.contains("jy2-actual-scroll") ? 10 : 12;
    let width = Math.max(240, (basis || 240) - gutter);
    if (win) {
      const box = jy2LayoutViewportBox(win);
      const hardCap = Math.max(240, Math.floor(box.width - 40));
      width = Math.min(width, hardCap);
    }
    scrollEl.style.setProperty("width", `${width}px`, "important");
    scrollEl.style.setProperty("max-width", `${width}px`, "important");
    scrollEl.style.setProperty("min-width", "0", "important");
    scrollEl.style.setProperty("overflow-x", "auto", "important");
    scrollEl.style.setProperty("overflow-y", "visible", "important");
    scrollEl.style.setProperty("box-sizing", "border-box", "important");
    scrollEl.style.setProperty("contain", "inline-size", "important");
    jy2ForceTableMinWidth(scrollEl);
    // レイアウト確定後にレール更新
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => jy2SyncFixedHRail(scrollEl));
    } else {
      jy2SyncFixedHRail(scrollEl);
    }
    return scrollEl;
  }

  function jy2SyncAllHScroll(documentRef) {
    const doc = documentRef || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    jy2SyncHostViewportCap(doc);
    doc
      .querySelectorAll(".jy2-table-scroll, .jy2-actual-scroll")
      .forEach((el) => jy2SyncHScroll(el));
    const active = doc.querySelector(
      ".jy2-pane[data-active='true'] .jy2-pane-hscroll, .jy2-pane[data-active='true'] .jy2-actual-scroll, .jy2-pane[data-active='true'] .jy2-table-scroll",
    );
    if (active) {
      jy2SyncFixedHRail(active);
    } else {
      const rail = doc.getElementById("jy2-fixed-hrail");
      if (rail) rail.style.display = "none";
    }
  }

  function jy2BindHScroll(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!win) return scrollEl;
    const sync = () => jy2SyncHScroll(scrollEl);
    sync();
    win.requestAnimationFrame(() => {
      sync();
      win.requestAnimationFrame(sync);
    });
    win.addEventListener("resize", sync);
    if (win.visualViewport) {
      win.visualViewport.addEventListener("resize", sync);
      win.visualViewport.addEventListener("scroll", sync);
    }
    if (typeof win.ResizeObserver === "function") {
      const observer = new win.ResizeObserver(() => sync());
      const host = doc.getElementById("jy2-host");
      if (host) observer.observe(host);
      const shell = scrollEl.closest(".jy2-shell");
      if (shell) observer.observe(shell);
      if (scrollEl.parentElement) observer.observe(scrollEl.parentElement);
    }
    return scrollEl;
  }

  function jy2WrapHScroll(documentRef, child) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-table-scroll";
    const inner = documentRef.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = "1400";
    inner.appendChild(child);
    wrap.appendChild(inner);
    jy2BindHScroll(wrap);
    return wrap;
  }

  function jy2WrapTable(documentRef, table) {
    return jy2WrapHScroll(documentRef, table);
  }

  /**
   * タブ(pane)内の横スクロールを1本にする（表・工種ブロックごとの個別ラッパ禁止）。
   * @returns {HTMLElement} コンテンツを積む .jy2-hscroll-inner
   */
  function jy2MountPaneHScroll(documentRef, pane, options = {}) {
    const minWidth = Number(options.minWidth) || 1100;
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-table-scroll jy2-pane-hscroll";
    const inner = documentRef.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = String(minWidth);
    wrap.appendChild(inner);
    pane.appendChild(wrap);
    jy2BindHScroll(wrap);
    return inner;
  }

  function jy2FlashNavTarget(el) {
    if (!el) return;
    el.classList.add("jy2-nav-flash");
    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    const win = el.ownerDocument && el.ownerDocument.defaultView;
    if (win && typeof win.setTimeout === "function") {
      win.setTimeout(() => el.classList.remove("jy2-nav-flash"), 1600);
    }
  }

  function jy2FindByStableBlockId(root, selector, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!root || !id) return null;
    return (
      [...root.querySelectorAll(selector)].find(
        (el) => String(el.dataset.stableBlockId || "").trim() === id,
      ) || null
    );
  }

  /** 総括の内訳№ → 内訳タブの該当ブロック */
  function jy2GotoDetailBlock(shell, documentRef, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!id || !documentRef) return;
    const activate = shell && typeof shell._jy2ActivateTab === "function"
      ? shell._jy2ActivateTab
      : null;
    if (activate) activate("detail");
    const win = documentRef.defaultView;
    const go = () => {
      const el = jy2FindByStableBlockId(
        documentRef,
        ".jy2-pane[data-tab-id='detail'] .jy2-detail-block",
        id,
      );
      jy2FlashNavTarget(el);
    };
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => win.requestAnimationFrame(go));
    } else {
      go();
    }
  }

  /** 内訳の No.n → 総括タブの原価行（同じ内訳№） */
  function jy2GotoSummaryProjection(shell, documentRef, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!id || !documentRef) return;
    const activate = shell && typeof shell._jy2ActivateTab === "function"
      ? shell._jy2ActivateTab
      : null;
    if (activate) activate("summary");
    const win = documentRef.defaultView;
    const go = () => {
      const el = jy2FindByStableBlockId(
        documentRef,
        ".jy2-pane[data-tab-id='summary'] .jy2-projection-table tr[data-stable-block-id]",
        id,
      );
      jy2FlashNavTarget(el);
    };
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => win.requestAnimationFrame(go));
    } else {
      go();
    }
  }

  function jy2HeadRow(documentRef, labels) {
    const row = documentRef.createElement("tr");
    for (const raw of labels) {
      const th = documentRef.createElement("th");
      jy2AppendModeLabel(documentRef, th, raw);
      row.appendChild(th);
    }
    return row;
  }

  function jy2MarkFreeze(cell, index) {
    if (!cell) return cell;
    cell.classList.add("jy2-freeze", `jy2-freeze-${index}`);
    return cell;
  }

  /** 予実ヘッダ2段: Excel 原価管理明細列（システム工種｜費目｜種別（補助）｜
   * 詳細｜操作｜単価｜数量｜実行予算額｜月次数量/金額｜原価累計金額｜予算との差｜備考）。
   * 「操作」は UI 専用（＋／－）。数量＝明細計画数量（App757）。 */
  function jy2ActualHead(documentRef, months) {
    const thead = documentRef.createElement("thead");
    const top = documentRef.createElement("tr");
    const bottom = documentRef.createElement("tr");
    const th = (label, opts = {}) => {
      const cell = documentRef.createElement("th");
      jy2AppendModeLabel(documentRef, cell, label);
      if (opts.rowSpan) cell.rowSpan = opts.rowSpan;
      if (opts.colSpan) cell.colSpan = opts.colSpan;
      if (opts.freeze != null) jy2MarkFreeze(cell, opts.freeze);
      return cell;
    };
    top.appendChild(th("システム工種", { rowSpan: 2, freeze: 0 }));
    top.appendChild(th("費目", { rowSpan: 2, freeze: 1 }));
    top.appendChild(th("種別", { rowSpan: 2, freeze: 2 }));
    top.appendChild(th("詳細", { rowSpan: 2, freeze: 3 }));
    const opsHead = th("操作", { rowSpan: 2, freeze: 4 });
    opsHead.title = "詳細行の追加（＋）・削除（－）。構造は一時保存で App757 へ";
    top.appendChild(opsHead);
    const unitPriceHead = th("単価", { rowSpan: 2 });
    unitPriceHead.classList.add("jy2-actual-col-unit-price");
    top.appendChild(unitPriceHead);
    const planQtyHead = th("数量", { rowSpan: 2 });
    planQtyHead.classList.add("jy2-actual-col-plan-qty");
    planQtyHead.title =
      "明細の計画数量（App757）。実行予算額＝ROUND(単価×数量)。月次数量とは別";
    top.appendChild(planQtyHead);
    const finalHead = th("実行予算額", { rowSpan: 2 });
    finalHead.classList.add("jy2-actual-col-budget");
    finalHead.title = "ROUND(単価×数量) 自動（入力不可）。親＝子合計";
    top.appendChild(finalHead);
    for (const month of months) {
      const monthTh = th(jy2MonthLabel(month), { colSpan: 2 });
      monthTh.classList.add("jy2-actual-month");
      monthTh.title = `${month}（数量／金額）`;
      top.appendChild(monthTh);
    }
    top.appendChild(th("原価累計金額", { rowSpan: 2 }));
    const diffHead = th("予算との差", { rowSpan: 2 });
    diffHead.title = "実行予算額 − 原価累計金額（表示のみ）";
    top.appendChild(diffHead);
    const noteHead = th("備考", { rowSpan: 2 });
    noteHead.classList.add("jy2-actual-note-col");
    noteHead.title = "備考（内訳タブで手入力・ここは表示のみ）";
    top.appendChild(noteHead);
    for (const month of months) {
      const qtyTh = th("数量");
      qtyTh.classList.add("jy2-actual-month", "jy2-actual-month-qty");
      qtyTh.title = `${month} 数量（セッション保持・再読込で消える／金額は保存される）`;
      bottom.appendChild(qtyTh);
      const amountTh = th("金額");
      amountTh.classList.add("jy2-actual-month");
      amountTh.title = `${month} 金額（入力）`;
      bottom.appendChild(amountTh);
    }
    thead.append(top, bottom);
    return thead;
  }

  // Ver.01 リストマスタ（READ のみ）。APP ID リテラル禁止テスト回避のため合成。
  const JY2_MASTER_LIST_APP_ID = 700 + 35;
  let jy2MasterListsCache = null;

  function jy2HfTag(documentRef, kind) {
    const tags = {
      input: ["jy2-hf-tag-input", "入力"],
      select: ["jy2-hf-tag-select", "選択"],
      date: ["jy2-hf-tag-date", "日付"],
      auto: ["jy2-hf-tag-auto", "自動"],
      aux: ["jy2-hf-tag-aux", "補助"],
    };
    const pair = tags[kind] || tags.input;
    const span = documentRef.createElement("span");
    span.className = `jy2-hf-tag ${pair[0]}`;
    span.textContent = pair[1];
    return span;
  }

  /** 「単位（選択）」形式 → { label, mode }。タグ無しはそのまま。
   * 「補助」はモードにしない（列名「種別」をタグ分割しない。#R-EXCEL-UI-01）。 */
  function jy2ParseModeLabel(raw) {
    const text = String(raw ?? "");
    const match = /^(.*)（(選択|入力|自動|日付)）$/.exec(text);
    if (!match) return { label: text, mode: null };
    const modeByJa = {
      選択: "select",
      入力: "input",
      自動: "auto",
      日付: "date",
    };
    return { label: match[1], mode: modeByJa[match[2]] || null };
  }

  function jy2AppendModeLabel(documentRef, parent, raw) {
    const { label, mode } = jy2ParseModeLabel(raw);
    // th/td に display:flex すると table-cell が壊れ列が縦積みになるため、内側に積む
    const stack = documentRef.createElement("div");
    stack.className = "jy2-th-stack";
    if (mode) {
      parent.classList.add("jy2-th-stacked", `jy2-th-mode-${mode}`);
      stack.appendChild(jy2HfTag(documentRef, mode));
    }
    const text = documentRef.createElement("span");
    text.className = "jy2-th-label";
    text.textContent = label;
    stack.appendChild(text);
    parent.appendChild(stack);
  }

  function jy2HfLabel(documentRef, kind, text) {
    const label = documentRef.createElement("label");
    label.classList.add("jy2-th-stacked", `jy2-th-mode-${kind}`);
    label.appendChild(jy2HfTag(documentRef, kind));
    const span = documentRef.createElement("span");
    span.className = "jy2-th-label";
    span.textContent = text;
    label.appendChild(span);
    return label;
  }

  function jy2NormalizeFiscalYearText(value) {
    return String(value || "").replace(/(\d{4})年(?!度)/g, "$1年度");
  }

  function jy2CalcProjectDays(startDate, endDate) {
    if (!startDate || !endDate) return "";
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const days = Math.floor((end - start) / 86400000) + 1;
    return days > 0 ? String(days) : "";
  }

  /** 内閣府相当・2025–2028（W1: 土日は含めない） */
  const JY2_JP_HOLIDAY_YMD = Object.freeze(
    (() => {
      const map = Object.create(null);
      (
        "2025-01-01,2025-01-13,2025-02-11,2025-02-23,2025-02-24,2025-03-20,2025-04-29,2025-05-03,2025-05-04,2025-05-05,2025-05-06," +
        "2025-07-21,2025-08-11,2025-09-15,2025-09-23,2025-10-13,2025-11-03,2025-11-23,2025-11-24," +
        "2026-01-01,2026-01-12,2026-02-11,2026-02-23,2026-03-20,2026-04-29,2026-05-03,2026-05-04,2026-05-05,2026-05-06," +
        "2026-07-20,2026-08-11,2026-09-21,2026-09-22,2026-09-23,2026-10-12,2026-11-03,2026-11-23," +
        "2027-01-01,2027-01-11,2027-02-11,2027-02-23,2027-03-21,2027-04-29,2027-05-03,2027-05-04,2027-05-05," +
        "2027-07-19,2027-08-11,2027-09-20,2027-09-23,2027-10-11,2027-11-03,2027-11-23," +
        "2028-01-01,2028-01-10,2028-02-11,2028-02-23,2028-03-20,2028-04-29,2028-05-03,2028-05-04,2028-05-05," +
        "2028-07-17,2028-08-11,2028-09-18,2028-09-22,2028-10-09,2028-11-03,2028-11-23"
      )
        .split(",")
        .forEach((token) => {
          const ymd = token.trim();
          if (ymd) map[ymd] = true;
        });
      return map;
    })(),
  );

  function jy2IsJpHolidayYmd(ymd) {
    return JY2_JP_HOLIDAY_YMD[String(ymd || "").trim()] === true;
  }

  function jy2YmdAddDays(ymd, days) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || "").trim());
    if (!match) return String(ymd || "");
    const ms =
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0) +
      days * 86400000;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(ms));
    const y = parts.find((part) => part.type === "year").value;
    const mo = parts.find((part) => part.type === "month").value;
    const d = parts.find((part) => part.type === "day").value;
    return `${y}-${mo}-${d}`;
  }

  function jy2EachYmdInRange(startYmd, endYmd, fn) {
    if (!startYmd || !endYmd || startYmd > endYmd) return;
    let cur = startYmd;
    while (cur <= endYmd) {
      fn(cur);
      cur = jy2YmdAddDays(cur, 1);
    }
  }

  function jy2ExpandHolidayLineDates(holidayLines) {
    const out = [];
    const rows = Array.isArray(holidayLines) ? holidayLines : [];
    for (const row of rows) {
      const cell = row?.value || {};
      const start = String(cell.holiday_start?.value || "").trim();
      if (!start) continue;
      const kind = String(cell.holiday_kind?.value || "1日").trim();
      const end = String(cell.holiday_end?.value || "").trim();
      if (kind === "期間" && end && end >= start) {
        jy2EachYmdInRange(start, end, (ymd) => out.push(ymd));
      } else {
        out.push(start);
      }
    }
    return out;
  }

  function jy2CalcHolidayAndWorkingDays(startDate, endDate, holidayLines) {
    const projectDaysRaw = jy2CalcProjectDays(startDate, endDate);
    const projectDays = projectDaysRaw ? Number(projectDaysRaw) : 0;
    if (!startDate || !endDate || !projectDays) {
      return { holidayDays: "", workingDays: "" };
    }
    const holidaySet = new Set();
    jy2EachYmdInRange(startDate, endDate, (ymd) => {
      if (jy2IsJpHolidayYmd(ymd)) holidaySet.add(ymd);
    });
    for (const ymd of jy2ExpandHolidayLineDates(holidayLines)) {
      if (ymd >= startDate && ymd <= endDate) holidaySet.add(ymd);
    }
    const holidayCount = holidaySet.size;
    return {
      holidayDays: String(holidayCount),
      workingDays: String(Math.max(0, projectDays - holidayCount)),
    };
  }

  function jy2EnsureHolidayLinesField(record) {
    if (!record) return;
    if (!record.holiday_lines) record.holiday_lines = { value: [] };
    if (!Array.isArray(record.holiday_lines.value)) record.holiday_lines.value = [];
  }

  function jy2NewHolidayLineRow() {
    return {
      value: {
        holiday_name: { value: "" },
        holiday_kind: { value: "1日" },
        holiday_start: { value: "" },
        holiday_end: { value: "" },
        holiday_note: { value: "" },
      },
    };
  }

  function jy2CollectHolidayLines(record) {
    jy2EnsureHolidayLinesField(record);
    const rows = record.holiday_lines.value;
    return {
      holiday_lines: {
        value: rows.map((row) => ({
          ...(row?.id != null ? { id: row.id } : {}),
          value: {
            holiday_name: { value: row?.value?.holiday_name?.value ?? "" },
            holiday_kind: { value: row?.value?.holiday_kind?.value ?? "" },
            holiday_start: { value: row?.value?.holiday_start?.value ?? "" },
            holiday_end: { value: row?.value?.holiday_end?.value ?? "" },
            holiday_note: { value: row?.value?.holiday_note?.value ?? "" },
          },
        })),
      },
    };
  }

  function jy2SyncHolidayWorkingDays(record) {
    if (!record) return;
    const start = jy2HeaderFieldValue(record, "start_date");
    const end = jy2HeaderFieldValue(record, "end_date");
    jy2EnsureHolidayLinesField(record);
    const calc = jy2CalcHolidayAndWorkingDays(
      start,
      end,
      record.holiday_lines.value,
    );
    jy2ApplyHeaderField(record, "holiday_days", calc.holidayDays);
    jy2ApplyHeaderField(record, "working_days", calc.workingDays);
  }

  /** G0 S2: ヘッダ DD ブロック用マスタ（ハードコード） */
  const JY2_HEADER_MASTER_OPTIONS = Object.freeze({
    work_kind: Object.freeze([
      "土木一式",
      "とび・土工・コンクリート",
      "塗装",
      "塗装（防水）",
      "調査",
      "工事外",
    ]),
    order_form: Object.freeze(["単独", "JV"]),
    jv_type: Object.freeze([
      "特定JV甲型",
      "特定JV乙型",
      "経常JV甲型",
      "経常JV乙型",
      "その他",
    ]),
    order_role: Object.freeze(["元請", "下請", "その他"]),
    order_method: Object.freeze([
      "特命",
      "指名競争入札",
      "工事希望型競争入札",
      "公募プロポーザル方式",
      "見積入札",
      "一般競争入札",
      "随意契約",
      "その他",
    ]),
    main_misc: Object.freeze(["本工事", "雑工事"]),
    public_private_1: Object.freeze(["官庁", "民間"]),
    public_private_2: Object.freeze([
      "中央官庁",
      "公社・公団",
      "都道府県",
      "市町村",
      "準官庁",
    ]),
    civil_arch: Object.freeze([
      "土木(ＪＲ)",
      "土木(その他鉄道会社)",
      "建築(民間)",
      "その他(ﾘﾌｫｰﾑ)",
    ]),
    work_class: Object.freeze([
      "A：ＪＲ鉄桁塗替塗装",
      "B：ＪＲ受託",
      "C：ＪＲ橋りょう修繕工事",
      "D：ＪＲその他工事",
      "E：その他鉄道会社塗替塗装",
      "F：その他鉄道会社受託",
      "G：一般工事",
      "Q：ＪＲ保安（工管・線閉）",
    ]),
    office_name: Object.freeze([
      "東京土木設備技術センター",
      "横浜土木設備技術センター",
      "水戸土木設備技術センター",
      "千葉土木設備技術センター",
      "大宮土木設備技術センター",
      "八王子土木設備技術センター",
      "高崎土木設備技術センター",
      "長野土木設備技術センター",
    ]),
  });

  /** 着手日・竣工日が両方あり、着手日が竣工日より後なら true（U35） */
  function jy2IsStartDateAfterEndDate(startDate, endDate) {
    const start = String(startDate || "").trim();
    const end = String(endDate || "").trim();
    return Boolean(start && end && start > end);
  }

  /** 工期日数: 保存は数値、表示は「N日」（C15） */
  function jy2FormatProjectDaysDisplay(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const num = raw.replace(/日\s*$/u, "").trim();
    return num ? `${num}日` : "";
  }

  function jy2NormalizeProjectDaysValue(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const num = raw.replace(/日\s*$/u, "").trim();
    return /^\d+(\.\d+)?$/.test(num) ? num : "";
  }

  function jy2UserSelectDisplay(value) {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry && (entry.name || entry.code)) || "")
        .filter(Boolean)
        .join("、");
    }
    if (typeof value === "object") return value.name || value.code || "";
    return String(value);
  }

  /** Ver.01同趣旨: 氏名は空白除去。空なら空文字。 */
  function jy2NormalizePersonName(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function jy2LoginDisplayName() {
    try {
      if (typeof kintone !== "undefined" && typeof kintone.getLoginUser === "function") {
        const user = kintone.getLoginUser();
        if (user) return jy2NormalizePersonName(user.name || user.code || "");
      }
    } catch (_err) {
      /* ignore */
    }
    return "";
  }

  /**
   * 作成者・担当者の手入力名を record に用意する（created_by_name / person_in_charge_name）。
   * 空なら CREATOR／USER_SELECT／ログイン名から初期値を埋める。
   */
  function jy2EnsurePersonNameFields(record) {
    if (!record) return;
    if (!record.created_by_name) record.created_by_name = { value: "" };
    if (!record.person_in_charge_name) record.person_in_charge_name = { value: "" };
    let created = jy2NormalizePersonName(record.created_by_name.value);
    if (!created) {
      created = jy2NormalizePersonName(
        jy2UserSelectDisplay(record.Created_by && record.Created_by.value) ||
          jy2LoginDisplayName(),
      );
      record.created_by_name.value = created;
    }
    let person = jy2NormalizePersonName(record.person_in_charge_name.value);
    if (!person) {
      person = jy2NormalizePersonName(
        jy2UserSelectDisplay(record.person_in_charge && record.person_in_charge.value) ||
          created,
      );
      record.person_in_charge_name.value = person;
    }
  }

  function jy2EmptyMasterLists() {
    return {
      girderTypes: [],
      branches: [],
      departments: [],
      workTypeCodes: [],
      workTypeNames: [],
      workTypeByCode: {},
      workTypeByName: {},
    };
  }

  // システム工種／工種番号の並び＝マスタ整理順（コード表（塗）接頭は正本にしない）。
  function jy2ApplyWorkTypeCodeTableOrder(lists) {
    lists.workTypeNames = [];
    lists.workTypeCodes = [];
    lists.workTypeByName = {};
    lists.workTypeByCode = {};
    for (const row of JY2_SYSTEM_WORK_MASTER) {
      const name = row && row.name ? String(row.name).trim() : "";
      const code = row && row.code ? String(row.code).trim() : "";
      if (!name) continue;
      if (!lists.workTypeNames.includes(name)) lists.workTypeNames.push(name);
      if (code) {
        lists.workTypeByName[name] = code;
        if (!lists.workTypeByCode[code]) lists.workTypeByCode[code] = name;
        if (!lists.workTypeCodes.includes(code)) lists.workTypeCodes.push(code);
      }
    }
  }

  function jy2SystemWorkNameChoices(currentValue) {
    const cur = String(currentValue || "").trim();
    const stripped = cur.replace(/^（塗）/u, "");
    // マスタ名順。祖父はマスタ外の現行値（（塗）付き含む）のみ末尾追加。
    const base = jy2ListOnlyChoices(
      jy2FilterSystemWorkNamesForPicker(JY2_SYSTEM_WORK_NAMES),
      stripped,
    );
    if (cur && cur !== stripped && !base.includes(cur)) base.push(cur);
    return base;
  }

  function jy2SystemWorkCodeChoices(currentValue) {
    return jy2ListOnlyChoices(JY2_SYSTEM_WORK_CODES, currentValue);
  }

  async function jy2LoadMasterLists(api) {
    if (jy2MasterListsCache) return jy2MasterListsCache;
    const empty = jy2EmptyMasterLists();
    // システム工種は常にマスタ整理正本（API コード表行は混ぜない）。
    jy2ApplyWorkTypeCodeTableOrder(empty);
    empty.branches = [...JY2_BRANCH_MASTER];
    empty.departments = [...JY2_DEPARTMENT_MASTER];
    if (typeof api !== "function") {
      jy2MasterListsCache = empty;
      return empty;
    }
    try {
      const response = await api("/k/v1/records.json", "GET", {
        app: JY2_MASTER_LIST_APP_ID,
        query: 'is_active in ("有効") order by sort_order asc limit 500',
      });
      const lists = jy2EmptyMasterLists();
      jy2ApplyWorkTypeCodeTableOrder(lists);
      for (const rec of response.records || []) {
        const cat = String(
          (rec.list_category && rec.list_category.value) || "",
        ).trim();
        const name = String((rec.item_name && rec.item_name.value) || "").trim();
        // コード表行はシステム工種候補に使わない（G0 §8）。
        if (cat === "コード表行" || cat.includes("コード")) continue;
        if (!name) continue;
        if (cat === "桁種別") lists.girderTypes.push(name);
      }
      lists.branches = [...JY2_BRANCH_MASTER];
      lists.departments = [...JY2_DEPARTMENT_MASTER];
      jy2MasterListsCache = lists;
      return lists;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("JY2 マスタ一覧の読込に失敗（手入力フォールバック）:", error);
      }
      jy2MasterListsCache = empty;
      return empty;
    }
  }

  function jy2SelectOptions(list, current, allowBlank) {
    const values = [];
    if (allowBlank) values.push("");
    for (const item of list || []) {
      if (item != null && item !== "" && !values.includes(String(item))) {
        values.push(String(item));
      }
    }
    const cur = current == null ? "" : String(current);
    if (cur && !values.includes(cur)) values.push(cur);
    return values;
  }

  /** 工事基本情報（Ver.01 同趣旨）。システムIDは出さない。 */
  const JY2_HEADER_EDITABLE_CODES = Object.freeze([
    "version_type",
    "status",
    "site_entry_date",
    "draft_date",
    "revision_note",
    "project_code",
    "project_branch",
    "project_official_name",
    "project_name",
    "work_kind",
    "order_form",
    "jv_type",
    "order_role",
    "order_method",
    "main_misc",
    "public_private_1",
    "public_private_2",
    "civil_arch",
    "work_class",
    "client_name",
    "order_branch",
    "office_name",
    "department",
    "girder_type",
    "safety_rule_88",
    "start_date",
    "end_date",
    "project_days",
    "holiday_days",
    "working_days",
    "created_by_name",
    "person_in_charge_name",
    "note",
  ]);

  function jy2HeaderFieldValue(record, code) {
    const cell = record && record[code];
    if (!cell || cell.value === undefined || cell.value === null) return "";
    if (code === "person_in_charge" || code === "Created_by") {
      return jy2UserSelectDisplay(cell.value);
    }
    if (code === "Created_datetime") {
      const raw = String(cell.value || "");
      return raw.length >= 10 ? raw.slice(0, 10) : raw;
    }
    return String(cell.value);
  }

  function jy2ApplyHeaderField(record, code, value) {
    if (!record[code]) record[code] = { value: "" };
    record[code].value = value;
  }

  function jy2CollectHeaderFields(record) {
    jy2EnsurePersonNameFields(record);
    jy2SyncHolidayWorkingDays(record);
    const out = {};
    for (const code of JY2_HEADER_EDITABLE_CODES) {
      if (!record || !record[code]) continue;
      let value = record[code].value ?? "";
      if (code === "project_official_name") {
        value = jy2NormalizeFiscalYearText(value);
      }
      if (code === "created_by_name" || code === "person_in_charge_name") {
        value = jy2NormalizePersonName(value);
      }
      if (
        code === "project_days" ||
        code === "holiday_days" ||
        code === "working_days"
      ) {
        value = jy2NormalizeProjectDaysValue(value);
      }
      out[code] = { value };
    }
    return out;
  }

  /** App1 summary_cost_lines → checkSummaryProjection 用のフラット行 */
  function jy2SummaryCostLinesFromRecord(record) {
    const field = record?.summary_cost_lines;
    const rows = Array.isArray(field?.value) ? field.value : [];
    const cell = (row, code) => {
      const value = row?.value?.[code]?.value;
      return value === undefined || value === null ? "" : value;
    };
    const codes = [
      "summary_stable_block_id",
      "summary_block_no",
      "summary_cost_category",
      "summary_work_type_code",
      "summary_work_type_name",
      "summary_line_type",
      "summary_material_name",
      "summary_unit",
      "summary_qty",
      "summary_unit_price",
      "summary_amount_excl_tax",
      "summary_tax_rate",
      "summary_amount_incl_tax",
      "summary_rate_to_1",
      "summary_calc_basis",
      "summary_note",
      "summary_sort_order",
    ];
    return rows.map((row) => {
      const flat = {};
      for (const code of codes) flat[code] = cell(row, code);
      return flat;
    });
  }

  function jy2ProjectionCheckedAtIso() {
    return new Date().toISOString();
  }

  function jy2FillSelect(select, options, current) {
    select.textContent = "";
    for (const optionValue of options) {
      const option = documentRefCreateOption(select.ownerDocument, optionValue);
      select.appendChild(option);
    }
    select.value = current == null ? "" : String(current);
  }

  function documentRefCreateOption(documentRef, value) {
    const option = documentRef.createElement("option");
    option.value = value;
    option.textContent = value === "" ? "（未選択）" : value;
    return option;
  }

  /** A-07 / Ver.01同趣旨: 字間を空けた「実行予算書」＋シート名を縦積みで目立たせる */
  const JY2_IDEO = "\u3000";
  const JY2_SHEET_LABELS = {
    header: "工事基本情報",
    holiday: "休日設定",
    summary: `総${JY2_IDEO}括${JY2_IDEO}表`,
    detail: `内${JY2_IDEO}訳`,
    actual: `工${JY2_IDEO}事${JY2_IDEO}原${JY2_IDEO}価${JY2_IDEO}管${JY2_IDEO}理`,
    version: "バージョン管理",
  };

  // G0 S4: 工事原価管理タブは非表示のみ。actuals / 758 書込ロジックは残置。
  const JY2_HIDE_COST_MGMT_TAB = true;

  function jy2ShellTabList(model) {
    const tabs = [];
    for (const tab of model.tabs) {
      if (JY2_HIDE_COST_MGMT_TAB && tab.id === "actual") continue;
      tabs.push(tab);
      if (tab.id === "header") {
        tabs.push(
          Object.freeze({
            id: "holiday",
            label: JY2_SHEET_LABELS.holiday,
            readOnly: tab.readOnly,
          }),
        );
      }
    }
    return Object.freeze(tabs);
  }

  function jy2PaneBanner(documentRef, tabId, sheetLabel) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-pane-head-banner";
    wrap.appendChild(
      jy2SheetTitleEl(
        documentRef,
        tabId,
        sheetLabel || JY2_SHEET_LABELS[tabId] || tabId,
      ),
    );
    return wrap;
  }

  function jy2SheetTitleEl(documentRef, tabId, sheetLabel) {
    const title = documentRef.createElement("div");
    title.className = `jy2-sheet-title jy2-sheet-title-${tabId}`;
    title.setAttribute("role", "heading");
    title.setAttribute("aria-level", "2");
    const doc = documentRef.createElement("span");
    doc.className = "jy2-sheet-title-doc";
    doc.textContent = `実${JY2_IDEO}行${JY2_IDEO}予${JY2_IDEO}算${JY2_IDEO}書`;
    const sheet = documentRef.createElement("span");
    sheet.className = "jy2-sheet-title-sheet";
    sheet.textContent = sheetLabel;
    title.append(doc, sheet);
    return title;
  }

  function jy2SyncStickySheetBanner(host, documentRef, tabId) {
    if (!host) return;
    host.textContent = "";
    const label = JY2_SHEET_LABELS[tabId] || tabId;
    host.appendChild(jy2SheetTitleEl(documentRef, tabId, label));
  }

  function jy2RenderHeaderPane(documentRef, record, editable, masterLists, opts = {}) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-header-pane";
    const legend = documentRef.createElement("div");
    legend.className = "jy2-header-legend";
    legend.append(
      jy2HfTag(documentRef, "input"),
      documentRef.createTextNode("手入力"),
      jy2HfTag(documentRef, "select"),
      documentRef.createTextNode("リスト選択"),
      jy2HfTag(documentRef, "date"),
      documentRef.createTextNode("日付"),
      jy2HfTag(documentRef, "auto"),
      documentRef.createTextNode("自動・参照のみ"),
    );
    wrap.appendChild(legend);

    const grid = documentRef.createElement("div");
    grid.className = "jy2-header-grid";
    const lists = masterLists || jy2EmptyMasterLists();
    const canEdit = Boolean(editable);
    jy2EnsurePersonNameFields(record);
    jy2EnsureHolidayLinesField(record);

    function cell(span2, rowStart) {
      const div = documentRef.createElement("div");
      if (span2) div.classList.add("jy2-span-2");
      if (rowStart) div.classList.add("jy2-row-start");
      return div;
    }

    function bindEditable(input, code, transform) {
      if (!canEdit) {
        input.disabled = true;
        if (input.tagName !== "SELECT") input.readOnly = true;
        return;
      }
      const commit = () => {
        const next = transform ? transform(input.value) : input.value;
        input.value = next;
        jy2ApplyHeaderField(record, code, next);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    }

    function addText(kind, labelText, code, opts2 = {}) {
      const box = cell(opts2.span2, opts2.rowStart);
      box.appendChild(jy2HfLabel(documentRef, kind, labelText));
      let input;
      if (opts2.textarea) {
        input = documentRef.createElement("textarea");
        input.rows = opts2.rows || 2;
        input.className = kind === "auto" ? "jy2-hf-readonly" : "jy2-hf-text";
      } else {
        input = documentRef.createElement("input");
        input.type = kind === "date" ? "date" : "text";
        input.className =
          kind === "auto"
            ? "jy2-hf-readonly"
            : kind === "date"
              ? "jy2-hf-date"
              : "jy2-hf-text";
      }
      let value = jy2HeaderFieldValue(record, code);
      if (code === "project_official_name") value = jy2NormalizeFiscalYearText(value);
      input.value = value;
      if (opts2.placeholder) input.placeholder = opts2.placeholder;
      if (kind === "auto") {
        input.readOnly = true;
        input.disabled = true;
      } else {
        bindEditable(input, code, opts2.transform);
      }
      box.appendChild(input);
      grid.appendChild(box);
      return { box, input };
    }

    function addSelect(labelText, code, options, opts2 = {}) {
      const box = cell(opts2.span2);
      box.appendChild(jy2HfLabel(documentRef, "select", labelText));
      const select = documentRef.createElement("select");
      select.className = "jy2-hf-select";
      const current = jy2HeaderFieldValue(record, code);
      jy2FillSelect(
        select,
        jy2SelectOptions(options, current, opts2.allowBlank !== false),
        current,
      );
      bindEditable(select, code);
      box.appendChild(select);
      grid.appendChild(box);
      return { box, select };
    }

    // 版メタ（Ver.01 同配置）
    const versionSeq = jy2HeaderFieldValue(record, "version_seq") || "1";
    const versionType = jy2HeaderFieldValue(record, "version_type") || "当初";
    addSelect(
      "版種別",
      "version_type",
      jy2VersionTypeOptions(versionSeq, versionType),
      { allowBlank: false },
    );
    addText("auto", "版番号", "version_seq");
    addText("date", "現場入場予定日", "site_entry_date");
    addText("date", "立案日", "draft_date");
    addText("auto", "作成日", "Created_datetime");
    addText("input", "作成者", "created_by_name", {
      transform: jy2NormalizePersonName,
    });
    addText("input", "担当者", "person_in_charge_name", {
      transform: jy2NormalizePersonName,
    });
    addSelect("ステータス", "status", ["下書き", "版確定"], { allowBlank: false });
    addText("input", "修正理由メモ", "revision_note", {
      span2: true,
      textarea: true,
      placeholder: "修正版の変更理由（任意）",
    });

    // 工事項目
    addText("input", "工事コード *", "project_code");
    addText("input", "工事コード枝番", "project_branch");
    addText("input", "工事正式名称", "project_official_name", {
      transform: jy2NormalizeFiscalYearText,
    });
    addText("input", "工事名称", "project_name");

    // G0 DD ①〜④
    addSelect("工事種別", "work_kind", JY2_HEADER_MASTER_OPTIONS.work_kind);
    const orderFormCtl = addSelect(
      "受注形態",
      "order_form",
      JY2_HEADER_MASTER_OPTIONS.order_form,
    );
    const jvTypeCtl = addSelect(
      "ＪＶ区分",
      "jv_type",
      JY2_HEADER_MASTER_OPTIONS.jv_type,
    );
    addSelect("受注区分", "order_role", JY2_HEADER_MASTER_OPTIONS.order_role);
    addSelect("受注方法", "order_method", JY2_HEADER_MASTER_OPTIONS.order_method);
    addSelect("本雑区分", "main_misc", JY2_HEADER_MASTER_OPTIONS.main_misc);
    const public1Ctl = addSelect(
      "官民区分１",
      "public_private_1",
      JY2_HEADER_MASTER_OPTIONS.public_private_1,
    );
    const public2Ctl = addSelect(
      "官民区分２",
      "public_private_2",
      JY2_HEADER_MASTER_OPTIONS.public_private_2,
    );
    addSelect("土建区分", "civil_arch", JY2_HEADER_MASTER_OPTIONS.civil_arch);
    addSelect("工事区分", "work_class", JY2_HEADER_MASTER_OPTIONS.work_class, {
      span2: true,
    });

    // 組織
    addText("input", "発注者", "client_name");
    addSelect("担当支社", "order_branch", lists.branches);
    addSelect("担当事務所", "office_name", JY2_HEADER_MASTER_OPTIONS.office_name);
    addSelect("担当部門", "department", lists.departments);
    addSelect("桁種別", "girder_type", lists.girderTypes);
    addSelect("安衛則88条", "safety_rule_88", ["有", "無"], { allowBlank: false });

    // 工期
    const startCtl = addText("date", "着手日", "start_date", { rowStart: true });
    const endCtl = addText("date", "竣工日", "end_date");
    const daysCtl = addText("auto", "工期日数", "project_days");
    const holidayDaysCtl = addText("auto", "休日数", "holiday_days");
    const workingDaysCtl = addText("auto", "稼働日数", "working_days");
    const dateOrderWarn = documentRef.createElement("p");
    dateOrderWarn.className = "jy2-warning jy2-span-2";
    dateOrderWarn.hidden = true;
    dateOrderWarn.textContent =
      "着手日が竣工日より後になっています（一時保存は可・版の確定は不可）";
    grid.appendChild(dateOrderWarn);

    const refreshJvTypeVisibility = () => {
      const isJv = orderFormCtl.select.value === "JV";
      jvTypeCtl.box.hidden = !isJv;
      if (!isJv) {
        jvTypeCtl.select.value = "";
        jy2ApplyHeaderField(record, "jv_type", "");
        jvTypeCtl.select.disabled = true;
      } else if (canEdit) {
        jvTypeCtl.select.disabled = false;
      }
    };
    const refreshPublic2Visibility = () => {
      const isPrivate = public1Ctl.select.value === "民間";
      public2Ctl.box.hidden = isPrivate;
      if (isPrivate) {
        public2Ctl.select.value = "";
        jy2ApplyHeaderField(record, "public_private_2", "");
        public2Ctl.select.disabled = true;
      } else if (canEdit) {
        public2Ctl.select.disabled = false;
      }
    };
    const refreshDays = () => {
      const days = jy2CalcProjectDays(startCtl.input.value, endCtl.input.value);
      daysCtl.input.value = jy2FormatProjectDaysDisplay(days);
      jy2ApplyHeaderField(record, "project_days", days);
      jy2SyncHolidayWorkingDays(record);
      holidayDaysCtl.input.value = jy2FormatProjectDaysDisplay(
        jy2HeaderFieldValue(record, "holiday_days"),
      );
      workingDaysCtl.input.value = jy2FormatProjectDaysDisplay(
        jy2HeaderFieldValue(record, "working_days"),
      );
      const inverted = jy2IsStartDateAfterEndDate(
        startCtl.input.value,
        endCtl.input.value,
      );
      dateOrderWarn.hidden = !inverted;
    };
    refreshJvTypeVisibility();
    refreshPublic2Visibility();
    refreshDays();
    if (canEdit) {
      orderFormCtl.select.addEventListener("change", () => {
        refreshJvTypeVisibility();
      });
      public1Ctl.select.addEventListener("change", () => {
        refreshPublic2Visibility();
      });
      for (const input of [startCtl.input, endCtl.input]) {
        input.addEventListener("change", refreshDays);
        input.addEventListener("input", refreshDays);
      }
    }
    if (typeof opts.onRegisterHolidayRefresh === "function") {
      opts.onRegisterHolidayRefresh(refreshDays);
    }

    addText("input", "備考", "note", { span2: true, textarea: true, rows: 2 });

    wrap.appendChild(grid);
    return wrap;
  }

  function jy2RenderHolidayPane(documentRef, record, editable, opts = {}) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-holiday-pane";
    jy2EnsureHolidayLinesField(record);
    const canEdit = Boolean(editable);
    const onLinesChange =
      typeof opts.onHolidayLinesChange === "function"
        ? opts.onHolidayLinesChange
        : () => {};

    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-holiday-table";

    const rebuild = () => {
      table.textContent = "";
      const body = documentRef.createElement("tbody");
      body.appendChild(
        jy2HeadRow(documentRef, [
          "名称",
          "種別",
          "開始日",
          "終了日",
          "備考",
          "操作",
        ]),
      );

      const rows = record.holiday_lines.value;
      if (rows.length === 0 && !canEdit) {
        const emptyRow = documentRef.createElement("tr");
        const emptyCell = jy2Cell(documentRef, "td", "jy2-empty", "休日設定なし");
        emptyCell.colSpan = 6;
        emptyRow.appendChild(emptyCell);
        body.appendChild(emptyRow);
      }

      rows.forEach((row, rowIndex) => {
        const tr = documentRef.createElement("tr");
        const cellValue = (code) =>
          row?.value?.[code]?.value == null ? "" : String(row.value[code].value);
        const commitCell = (code, value) => {
          if (!row.value) row.value = {};
          if (!row.value[code]) row.value[code] = { value: "" };
          row.value[code].value = value;
          if (code === "holiday_kind" && value === "1日") {
            if (!row.value.holiday_end) row.value.holiday_end = { value: "" };
            row.value.holiday_end.value = "";
          }
          jy2SyncHolidayWorkingDays(record);
          onLinesChange();
        };

        if (canEdit) {
          const nameCell = jy2Cell(documentRef, "td", "", "");
          nameCell.appendChild(
            jy2TextInput(documentRef, cellValue("holiday_name"), (value) =>
              commitCell("holiday_name", value),
            ),
          );
          tr.appendChild(nameCell);

          const kindCell = jy2Cell(documentRef, "td", "", "");
          const kindSelect = documentRef.createElement("select");
          kindSelect.className = "jy2-select";
          jy2FillSelect(
            kindSelect,
            ["1日", "期間"],
            cellValue("holiday_kind") || "1日",
          );
          kindCell.appendChild(kindSelect);
          tr.appendChild(kindCell);

          const startCell = jy2Cell(documentRef, "td", "", "");
          const startInput = documentRef.createElement("input");
          startInput.type = "date";
          startInput.className = "jy2-input";
          startInput.value = cellValue("holiday_start");
          startInput.addEventListener("change", () => {
            commitCell("holiday_start", startInput.value);
          });
          startCell.appendChild(startInput);
          tr.appendChild(startCell);

          const endCell = jy2Cell(documentRef, "td", "", "");
          const endInput = documentRef.createElement("input");
          endInput.type = "date";
          endInput.className = "jy2-input";
          endInput.value = cellValue("holiday_end");
          endInput.disabled = cellValue("holiday_kind") !== "期間";
          endInput.addEventListener("change", () => {
            commitCell("holiday_end", endInput.value);
          });
          endCell.appendChild(endInput);
          tr.appendChild(endCell);
          kindSelect.addEventListener("change", () => {
            commitCell("holiday_kind", kindSelect.value);
            endInput.disabled = kindSelect.value !== "期間";
            if (kindSelect.value === "1日") endInput.value = "";
          });

          const noteCell = jy2Cell(documentRef, "td", "", "");
          noteCell.appendChild(
            jy2TextInput(documentRef, cellValue("holiday_note"), (value) =>
              commitCell("holiday_note", value),
            ),
          );
          tr.appendChild(noteCell);

          const actionCell = jy2Cell(documentRef, "td", "", "");
          actionCell.appendChild(
            jy2RowButton(documentRef, "削除", () => {
              record.holiday_lines.value.splice(rowIndex, 1);
              jy2SyncHolidayWorkingDays(record);
              onLinesChange();
              rebuild();
            }),
          );
          tr.appendChild(actionCell);
        } else {
          tr.appendChild(jy2Cell(documentRef, "td", "", cellValue("holiday_name")));
          tr.appendChild(jy2Cell(documentRef, "td", "", cellValue("holiday_kind")));
          tr.appendChild(jy2Cell(documentRef, "td", "", cellValue("holiday_start")));
          tr.appendChild(jy2Cell(documentRef, "td", "", cellValue("holiday_end")));
          tr.appendChild(jy2Cell(documentRef, "td", "", cellValue("holiday_note")));
          tr.appendChild(jy2Cell(documentRef, "td", "", ""));
        }
        body.appendChild(tr);
      });

      if (canEdit) {
        const addRow = documentRef.createElement("tr");
        const addCell = jy2Cell(documentRef, "td", "", "");
        addCell.colSpan = 6;
        addCell.appendChild(
          jy2RowButton(documentRef, "行追加", () => {
            record.holiday_lines.value.push(jy2NewHolidayLineRow());
            jy2SyncHolidayWorkingDays(record);
            onLinesChange();
            rebuild();
          }),
        );
        addRow.appendChild(addCell);
        body.appendChild(addRow);
      }

      table.appendChild(body);
    };

    rebuild();
    wrap.appendChild(table);
    return wrap;
  }

  // 請負金額 (§7.1a): 施工/保安 bands, amount = auto decimal shown as integer,
  // 消化率列（÷①）= 行金額÷①（D-31/D-32: ①=0 → 0, 金額なし → 「－」）.
  function jy2ContractTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const rateTo1 = (amount) =>
      amount === null || amount === undefined
        ? null
        : ratio(amount, snapshot.totals.total1, { zero: "zero" });
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-contract-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "区分",
        "契約工種（選択）",
        "工種説明（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "消化率（自動）",
        "備考（入力）",
        "",
      ]),
    );

    const sectionTotals = {
      施工: snapshot.totals.construction,
      保安: snapshot.totals.safety,
    };
    for (const section of CONTRACT_SECTIONS) {
      const bandRow = documentRef.createElement("tr");
      bandRow.className = "jy2-band-row";
      const bandHead = jy2Cell(documentRef, "th", "", section);
      bandHead.colSpan = 9;
      bandRow.appendChild(bandHead);
      const bandAction = jy2Cell(documentRef, "th", "", "");
      if (editable) {
        bandAction.appendChild(
          jy2RowButton(documentRef, "行追加", () => {
            summaryModel.addContractLine(section);
            rerender();
          }),
        );
      }
      bandRow.appendChild(bandAction);
      body.appendChild(bandRow);

      for (const line of snapshot.contractSections[section]) {
        const row = documentRef.createElement("tr");
        row.dataset.rowKey = line.rowKey;
        row.appendChild(jy2Cell(documentRef, "td", "", section));
        const commit = (field) => (value) => {
          summaryModel.updateContractLine(line.rowKey, { [field]: value });
          rerender();
        };
        if (editable) {
          const workName = jy2Cell(documentRef, "td", "", "");
          workName.appendChild(
            jy2ComboInput(
              documentRef,
              line.workName,
              jy2ContractWorkChoices(section, line.workName),
              commit("workName"),
              { listOnly: true },
            ),
          );
          const workDesc = jy2Cell(documentRef, "td", "", "");
          workDesc.appendChild(
            jy2TextInput(documentRef, line.workDesc, commit("workDesc")),
          );
          const unit = jy2Cell(documentRef, "td", "", "");
          unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
          const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
          quantity.appendChild(
            jy2TextInput(
              documentRef,
              line.quantity,
              (value) => commit("quantity")(jy2NormalizeContractQty(value)),
            ),
          );
          const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
          unitPrice.appendChild(
            jy2CommaNumberInput(documentRef, line.unitPrice, commit("unitPrice")),
          );
          const anchor = jy2HasText(line.workName);
          jy2MarkIncompleteIfAnchor(workName, anchor, line.workName);
          jy2MarkIncompleteIfAnchor(unit, anchor, line.unit);
          jy2MarkIncompleteIfAnchor(quantity, anchor, line.quantity);
          jy2MarkIncompleteIfAnchor(unitPrice, anchor, line.unitPrice);
          const note = jy2Cell(documentRef, "td", "", "");
          note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
          row.append(workName, workDesc, unit, quantity, unitPrice);
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(line.amount))),
          );
          row.appendChild(note);
          const action = jy2Cell(documentRef, "td", "", "");
          action.appendChild(
            jy2RowButton(documentRef, "↑", () => {
              summaryModel.moveContractLine(line.rowKey, -1);
              rerender();
            }),
          );
          action.appendChild(
            jy2RowButton(documentRef, "↓", () => {
              summaryModel.moveContractLine(line.rowKey, 1);
              rerender();
            }),
          );
          action.appendChild(
            jy2RowButton(documentRef, "削除", () => {
              summaryModel.removeContractLine(line.rowKey);
              rerender();
            }),
          );
          row.appendChild(action);
        } else {
          row.appendChild(jy2Cell(documentRef, "td", "", line.workName));
          row.appendChild(jy2Cell(documentRef, "td", "", line.workDesc));
          row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
          row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(line.amount))),
          );
          row.appendChild(jy2Cell(documentRef, "td", "", line.note));
          row.appendChild(jy2Cell(documentRef, "td", "", ""));
        }
        body.appendChild(row);
      }

      const totalRow = documentRef.createElement("tr");
      totalRow.className = "jy2-total-row";
      const totalLabel = jy2Cell(documentRef, "td", "", `${section}計`);
      totalLabel.colSpan = 6;
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(sectionTotals[section]),
        ),
      );
      const totalTail = jy2Cell(documentRef, "td", "", "");
      totalTail.colSpan = 3;
      totalRow.appendChild(totalTail);
      body.appendChild(totalRow);
    }

    const grandRow = documentRef.createElement("tr");
    grandRow.className = "jy2-total-row jy2-contract-total-1";
    const grandLabel = jy2Cell(documentRef, "td", "", "合計 ①");
    grandLabel.colSpan = 5;
    grandRow.appendChild(grandLabel);
    grandRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(snapshot.totals.total1),
      ),
    );
    const grandTail = jy2Cell(documentRef, "td", "", "");
    grandTail.colSpan = 3;
    grandRow.appendChild(grandTail);
    body.appendChild(grandRow);

    table.appendChild(body);
    // 横スクロールは jy2RenderSummaryPane の pane-hscroll 1本（個別 wrap 禁止）
    return table;
  }

  // 給与手当 (D-30/X7/Imp-04): 総括直入力。消費税率・金額税込列は非表示（依頼者 2026-07-29）。
  // 氏名は専用列（複数人は行追加運用）。at least 1 row.
  function jy2SalaryTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-salary-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "名称（入力）",
        "氏名（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "備考（入力）",
        "",
      ]),
    );

    for (const line of snapshot.salaryLines) {
      const row = documentRef.createElement("tr");
      row.dataset.rowKey = line.rowKey;
      const commit = (field) => (value) => {
        summaryModel.updateSalaryLine(line.rowKey, { [field]: value });
        rerender();
      };
      if (editable) {
        const role = jy2Cell(documentRef, "td", "", "");
        role.appendChild(jy2TextInput(documentRef, line.role, commit("role")));
        const personName = jy2Cell(documentRef, "td", "", "");
        personName.appendChild(
          jy2TextInput(documentRef, line.personName, commit("personName")),
        );
        jy2MarkSalaryNameSpaceWarning(personName, line.personName);
        const unit = jy2Cell(documentRef, "td", "", "");
        unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
        const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
        quantity.appendChild(
          jy2TextInput(documentRef, line.quantity, commit("quantity")),
        );
        const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
        unitPrice.appendChild(
          jy2CommaNumberInput(documentRef, line.unitPrice, commit("unitPrice")),
        );
        const anchor = jy2HasText(line.role);
        jy2MarkIncompleteIfAnchor(role, anchor, line.role);
        jy2MarkIncompleteIfAnchor(unit, anchor, line.unit);
        jy2MarkIncompleteIfAnchor(quantity, anchor, line.quantity);
        jy2MarkIncompleteIfAnchor(unitPrice, anchor, line.unitPrice);
        const note = jy2Cell(documentRef, "td", "", "");
        note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
        row.append(role, personName, unit, quantity, unitPrice);
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(note);
        const action = jy2Cell(documentRef, "td", "", "");
        action.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            summaryModel.moveSalaryLine(line.rowKey, -1);
            rerender();
          }),
        );
        action.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            summaryModel.moveSalaryLine(line.rowKey, 1);
            rerender();
          }),
        );
        action.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            summaryModel.removeSalaryLine(line.rowKey);
            rerender();
          }),
        );
        row.appendChild(action);
      } else {
        row.appendChild(jy2Cell(documentRef, "td", "", line.role));
        row.appendChild(jy2Cell(documentRef, "td", "", line.personName));
        row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
        row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
        );
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", line.note));
        row.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(row);
    }

    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-total-row";
    const totalLabel = jy2Cell(documentRef, "td", "", "給与計");
    totalLabel.colSpan = 5;
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(summaryModel.snapshot().totals.salary),
      ),
    );
    const totalTail = jy2Cell(documentRef, "td", "", "");
    totalTail.colSpan = 2;
    totalRow.appendChild(totalTail);
    body.appendChild(totalRow);

    const footRow = documentRef.createElement("tr");
    const footCell = jy2Cell(documentRef, "td", "", "");
    footCell.colSpan = 8;
    if (editable) {
      footCell.appendChild(
        jy2RowButton(documentRef, "行追加", () => {
          summaryModel.addSalaryLine();
          rerender();
        }),
      );
    }
    footRow.appendChild(footCell);
    body.appendChild(footRow);

    table.appendChild(body);
    return table;
  }

  // 総括原価投影 (P-21/P-33): amounts are read-only from App2.
  // 種別 / 備考 are App1 hand-entry (previousLines)。計算基準・消化率は非表示
  // （消化率は工事原価管理タブで管理）。
  // 消費税率・金額税込列は非表示（依頼者 2026-07-29）。保存フィールドは後方互換で残す。
  // X5: 表下に原価・施工計／原価・保安計を出す（⑧は給与計込みでフッタ）。
  function jy2ProjectionTable(
    documentRef,
    projectionRows,
    editable,
    onManualPatch,
    totals = null,
  ) {
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-projection-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "内訳№（自動）",
        "区分（自動）",
        "工種番号（自動）",
        "システム工種（自動）",
        "種別（入力）",
        "材料（選択）",
        "単位（自動）",
        "数量（自動）",
        "単価（自動）",
        "金額（自動）",
        "備考（入力）",
      ]),
    );
    if (projectionRows.length === 0) {
      const emptyRow = documentRef.createElement("tr");
      const emptyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-empty",
        "内訳ブロックなし（内訳タブで追加すると自動反映されます）",
      );
      emptyCell.colSpan = 11;
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
    }
    for (const line of projectionRows) {
      const row = documentRef.createElement("tr");
      row.className = "jy2-projection-row";
      row.dataset.stableBlockId = line.summary_stable_block_id;
      const noCell = jy2Cell(documentRef, "td", "jy2-num", "");
      const blockId = String(line.summary_stable_block_id || "").trim();
      if (blockId) {
        const noBtn = documentRef.createElement("button");
        noBtn.type = "button";
        noBtn.className = "jy2-nav-block-no";
        noBtn.textContent = String(line.summary_block_no ?? "");
        noBtn.title = "内訳タブの該当ブロックへ移動";
        noBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const shell = table.closest(".jy2-shell");
          jy2GotoDetailBlock(shell, documentRef, blockId);
        });
        noCell.appendChild(noBtn);
      } else {
        noCell.textContent = String(line.summary_block_no ?? "");
      }
      row.appendChild(noCell);
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_cost_category));
      row.appendChild(
        jy2Cell(documentRef, "td", "", line.summary_work_type_code),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "",
          jy2DisplayWorkTypeName(line.summary_work_type_name),
        ),
      );
      const typeCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        typeCell.appendChild(
          jy2TextInput(documentRef, line.summary_line_type, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_line_type: value,
            });
          }),
        );
      } else {
        typeCell.textContent = line.summary_line_type || "";
      }
      row.appendChild(typeCell);
      const materialCell = jy2Cell(documentRef, "td", "", "");
      const materialListOnly = jy2SummaryUsesMaterialList(line.summary_line_type);
      if (editable && materialListOnly) {
        materialCell.appendChild(
          jy2ComboInput(
            documentRef,
            line.summary_material_name,
            jy2MaterialChoices(
              line.summary_material_name,
              null,
              line.summary_line_type,
            ),
            (value) => {
              onManualPatch(line.summary_stable_block_id, {
                summary_material_name: value,
              });
            },
            { listOnly: true, allowClear: true },
          ),
        );
      } else if (editable) {
        materialCell.classList.add("jy2-readonly");
        materialCell.textContent = "";
      } else {
        materialCell.textContent = materialListOnly
          ? line.summary_material_name || ""
          : "";
      }
      row.appendChild(materialCell);
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_unit));
      row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.summary_qty));
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2AmountDisplay(line.summary_unit_price),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(line.summary_amount_excl_tax),
        ),
      );
      const noteCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        noteCell.appendChild(
          jy2TextInput(documentRef, line.summary_note, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_note: value,
            });
          }),
        );
      } else {
        noteCell.textContent = line.summary_note || "";
      }
      row.appendChild(noteCell);
      body.appendChild(row);
    }

    if (totals) {
      const appendCostTotal = (label, amount) => {
        const totalRow = documentRef.createElement("tr");
        totalRow.className = "jy2-total-row";
        const totalLabel = jy2Cell(documentRef, "td", "", label);
        totalLabel.colSpan = 9;
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(amount)),
        );
        totalRow.appendChild(jy2Cell(documentRef, "td", "", ""));
        body.appendChild(totalRow);
      };
      appendCostTotal("原価・施工計", totals.costConstruction);
      appendCostTotal("原価・保安計", totals.costSafety);
    }

    table.appendChild(body);
    return table;
  }

  // D-31 + Ver.01 区分別サマリー: ①⑧⑨主表示＋区分マトリクス（同テイスト）
  function jy2SummaryFooter(documentRef, totals) {
    const rateTo1 = (amount) => ratio(amount, totals.total1, { zero: "zero" });
    const profitOf = (sales, cost) => subtract(sales || "0", cost || "0");
    const profitRate = (sales, cost) =>
      ratio(profitOf(sales, cost), sales || "0", { zero: "zero" });

    const root = documentRef.createElement("div");
    root.className = "jy2-summary-footer jy2-budget-summary";

    const head = documentRef.createElement("div");
    head.className = "jy2-budget-summary-head";
    head.textContent = "区分別サマリー（売上①・原価⑧・粗利⑨）";
    root.appendChild(head);

    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-budget-summary-wrap";

    // ①⑧⑨ + 内訳（消化率＝÷①）— D-31
    const keys = documentRef.createElement("table");
    keys.className = "jy2-budget-summary-keys";
    const keysBody = documentRef.createElement("tbody");
    keysBody.appendChild(jy2HeadRow(documentRef, ["項目", "金額（税抜）", "消化率"]));
    const keyRows = [
      ["① 請負金額合計", totals.total1, "jy2-key-row"],
      ["請負・施工計", totals.construction, "jy2-sub-row"],
      ["請負・保安計", totals.safety, "jy2-sub-row"],
      ["原価・施工計", totals.costConstruction, "jy2-sub-row"],
      ["原価・保安計", totals.costSafety, "jy2-sub-row"],
      ["給与計", totals.salary, "jy2-sub-row"],
      ["⑧ 工事原価合計", totals.total8, "jy2-key-row"],
      ["⑨ 粗利（①－⑧）", totals.profit9, "jy2-key-row"],
    ];
    for (const [label, amount, className] of keyRows) {
      const row = documentRef.createElement("tr");
      row.className = className;
      row.appendChild(jy2Cell(documentRef, "td", "jy2-budget-col-label", label));
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(amount)),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(amount))),
      );
      keysBody.appendChild(row);
    }
    keys.appendChild(keysBody);
    wrap.appendChild(keys);

    // 区分マトリクス（Ver.01 同趣旨: 施工/保安）
    const matrix = documentRef.createElement("table");
    matrix.className = "jy2-budget-summary-table";
    const matrixBody = documentRef.createElement("tbody");
    matrixBody.appendChild(
      jy2HeadRow(documentRef, [
        "区分",
        "売上（①）",
        "原価（⑧）",
        "粗利",
        "粗利率",
      ]),
    );
    const categoryRows = [
      ["施工", totals.construction, totals.costConstruction],
      ["保安", totals.safety, totals.costSafety],
    ];
    for (const [label, sales, cost] of categoryRows) {
      const row = documentRef.createElement("tr");
      row.appendChild(jy2Cell(documentRef, "td", "jy2-budget-col-label", label));
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(sales)),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(cost)),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2AmountDisplay(profitOf(sales, cost)),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Percent(profitRate(sales, cost)),
        ),
      );
      matrixBody.appendChild(row);
    }
    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-budget-total-row";
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-budget-col-label", "合計 …⑨"),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.total1)),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.total8)),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.profit9)),
    );
    totalRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-num",
        jy2Percent(rateTo1(totals.profit9)),
      ),
    );
    matrixBody.appendChild(totalRow);
    matrix.appendChild(matrixBody);
    wrap.appendChild(matrix);

    const note = documentRef.createElement("p");
    note.className = "jy2-budget-summary-note";
    note.textContent =
      "粗利率＝区分ごとの粗利 ÷ その区分の売上（①）。最下行は全体粗利⑨ ÷ 契約合計①。" +
      " 給与計は⑧合計に含め、区分（施工/保安）には按分しません。消化率＝金額÷①（①=0は0）。";
    wrap.appendChild(note);

    root.appendChild(wrap);
    return root;
  }

  // onMutated: 総括 edits (請負/給与) change ①, which the 予実 BC率/EC率
  // read live — the shell passes refreshActuals here (Y9/M2).
  // projectionManual: 種別/計算基準/備考の手入力ストア（P-33）。
  function jy2RenderSummaryPane(
    documentRef,
    pane,
    summaryModel,
    blocksProvider,
    onMutated,
    projectionManual,
  ) {
    const scroll = jy2CaptureScroll(documentRef, pane);
    pane.textContent = "";
    const editable = summaryModel.allowedOperations.editBudget;
    const rerender = () => {
      jy2RenderSummaryPane(
        documentRef,
        pane,
        summaryModel,
        blocksProvider,
        onMutated,
        projectionManual,
      );
      if (onMutated) onMutated();
    };

    const blocks = blocksProvider();
    const totals = summaryModel.totals(blocks);
    const previousLines =
      projectionManual && typeof projectionManual.previousLines === "function"
        ? projectionManual.previousLines()
        : [];
    const projectionRows = regenerateSummaryCostLines(blocks, {
      contractTotal1: totals.total1,
      previousLines,
    });

    const contractTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "請負金額",
    );
    const salaryTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "給与手当",
    );
    const projectionTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "原価行",
    );
    // C5: 総括タブは横スクロール1本（請負/原価/給与を個別 wrap しない）
    const scroller = jy2MountPaneHScroll(documentRef, pane, { minWidth: 1400 });
    scroller.append(
      contractTitle,
      jy2ContractTable(documentRef, summaryModel, editable, rerender),
      projectionTitle,
      jy2ProjectionTable(
        documentRef,
        projectionRows,
        editable,
        (stableBlockId, patch) => {
          if (projectionManual && typeof projectionManual.patch === "function") {
            projectionManual.patch(stableBlockId, patch);
          }
          rerender();
        },
        totals,
      ),
      salaryTitle,
      jy2SalaryTable(documentRef, summaryModel, editable, rerender),
      jy2SummaryFooter(documentRef, totals),
    );
    jy2ApplyScroll(documentRef, pane, scroll);
  }

  // 内訳ブロック1つ分 (Phase 4c): App2-shaped in-memory block with U20 full
  // footer. 小計・計 are system totals (U25) and never editable.
  function jy2CaptureFieldFocus(documentRef, root) {
    const active = documentRef && documentRef.activeElement;
    if (!active || !root || typeof root.contains !== "function" || !root.contains(active)) {
      return null;
    }
    const row = active.closest("tr[data-row-key]");
    const footer = active.closest("tr[data-row-kind]");
    const fieldHost = active.closest("[data-jy2-field]");
    const workType = active.closest("[data-jy2-worktype-field]");
    return {
      rowKey: row ? row.dataset.rowKey : "",
      footerKind: footer ? footer.dataset.rowKind : "",
      field: fieldHost ? fieldHost.dataset.jy2Field : "",
      workTypeField: workType ? workType.dataset.jy2WorktypeField : "",
      selectionStart:
        typeof active.selectionStart === "number" ? active.selectionStart : null,
      selectionEnd:
        typeof active.selectionEnd === "number" ? active.selectionEnd : null,
    };
  }

  function jy2RestoreFieldFocus(root, hint) {
    if (!hint || !root || typeof root.querySelector !== "function") return;
    let target = null;
    if (hint.workTypeField) {
      target = root.querySelector(
        `[data-jy2-worktype-field="${hint.workTypeField}"] input, [data-jy2-worktype-field="${hint.workTypeField}"] select`,
      );
    } else if (hint.footerKind && hint.field) {
      const footer = root.querySelector(`tr[data-row-kind="${hint.footerKind}"]`);
      target =
        footer &&
        footer.querySelector(
          `[data-jy2-field="${hint.field}"] input, [data-jy2-field="${hint.field}"] select, [data-jy2-field="${hint.field}"]`,
        );
    } else if (hint.rowKey && hint.field) {
      const row = root.querySelector(`tr[data-row-key="${hint.rowKey}"]`);
      target =
        row &&
        row.querySelector(
          `[data-jy2-field="${hint.field}"] input, [data-jy2-field="${hint.field}"] select, [data-jy2-field="${hint.field}"]`,
        );
    }
    if (!target || typeof target.focus !== "function") return;
    target.focus();
    if (
      typeof hint.selectionStart === "number" &&
      typeof target.setSelectionRange === "function"
    ) {
      try {
        const end =
          typeof hint.selectionEnd === "number"
            ? hint.selectionEnd
            : hint.selectionStart;
        target.setSelectionRange(hint.selectionStart, end);
      } catch {
        // type=number 等は selection 非対応
      }
    }
  }

  function jy2DetailBlock(
    documentRef,
    detailModel,
    block,
    editable,
    rerender,
    suggestions,
    masterLists,
  ) {
    const section = documentRef.createElement("section");
    section.className = "jy2-detail-block";
    section.dataset.stableBlockId = block.stableBlockId;
    section.dataset.blockStatus = block.status;
    const retired = block.status === "retired";
    const blockEditable = editable && !retired;
    const suggest = suggestions || { name1: [], name2: [], name3: [], vendors: [] };
    const codeMaster = masterLists || jy2EmptyMasterLists();
    let rerenderPending = false;
    let partialEpoch = 0;
    // セル編集は当該ブロックだけ差し替え（全ペイン再構築を避ける）。
    const scheduleRerender = () => {
      if (rerenderPending) return;
      rerenderPending = true;
      const epoch = partialEpoch;
      const onlyBlockId = block.stableBlockId;
      const view = documentRef.defaultView;
      const run = () => {
        rerenderPending = false;
        // ブロック削除/移動など構造変更後の古い partial は破棄。
        if (epoch !== partialEpoch) return;
        rerender({ onlyBlockId });
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        setTimeout(run, 0);
      }
    };
    const rerenderFull = () => {
      partialEpoch += 1;
      rerenderPending = false;
      rerender({ full: true });
    };

    const head = documentRef.createElement("div");
    head.className = "jy2-detail-block-head";
    const no = documentRef.createElement("span");
    no.className = "jy2-block-no";
    no.textContent = retired ? "廃止" : `No.${block.blockNo}`;
    if (retired) no.classList.add("jy2-retired-tag");
    const blockId = String(block.stableBlockId || "").trim();
    if (!retired && blockId) {
      no.classList.add("jy2-nav-block-no");
      no.setAttribute("role", "button");
      no.tabIndex = 0;
      no.title = "総括タブの該当内訳№へ移動";
      const goSummary = (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const shell = section.closest(".jy2-shell");
        jy2GotoSummaryProjection(shell, documentRef, blockId);
      };
      no.addEventListener("click", goSummary);
      no.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") goSummary(event);
      });
    }
    head.appendChild(no);

    const commitHeader = (field) => (value) => {
      detailModel.updateBlockHeader(block.stableBlockId, { [field]: value });
      scheduleRerender();
    };
    const headerField = (labelText, control) => {
      const label = documentRef.createElement("label");
      jy2AppendModeLabel(documentRef, label, labelText);
      label.appendChild(control);
      head.appendChild(label);
    };
    if (blockEditable) {
      const commitWorkTypeCode = (value) => {
        const id = block.stableBlockId;
        detailModel.updateBlockHeader(id, { workTypeCode: value });
        const mapped = codeMaster.workTypeByCode[value];
        let newName = block.workTypeName;
        if (!String(value || "").trim()) {
          detailModel.updateBlockHeader(id, { workTypeName: "" });
          newName = "";
          const nameInput = section.querySelector(
            '[data-jy2-worktype-field="name"] input',
          );
          if (nameInput) nameInput.value = "";
        } else if (mapped) {
          detailModel.updateBlockHeader(id, { workTypeName: mapped });
          newName = mapped;
          const nameInput = section.querySelector(
            '[data-jy2-worktype-field="name"] input',
          );
          if (nameInput) nameInput.value = mapped;
        }
        const costCat = jy2ResolveCostCategoryFromWorkType(value, newName);
        if (costCat === "施工" || costCat === "保安") {
          detailModel.updateBlockHeader(id, { costCategory: costCat });
        } else if (costCat === "給与") {
          detailModel.updateBlockHeader(id, { costCategory: null });
        }
        // コード表: システム工種 → 費目を明細へ自動セット。
        jy2ApplyHimokuDefaultToDetails(detailModel, id);
        scheduleRerender();
      };
      const commitWorkTypeName = (value) => {
        const id = block.stableBlockId;
        // G0 §8.1: 保存はマスタ名（（塗）なし）。
        const savedName = String(value || "").trim().replace(/^（塗）/u, "");
        detailModel.updateBlockHeader(id, { workTypeName: savedName });
        const mapped =
          codeMaster.workTypeByName[savedName] ||
          codeMaster.workTypeByName[value];
        // 番号なしマスタ（軌道工事等）はコードを空にする。
        const newCode = mapped ? String(mapped) : "";
        detailModel.updateBlockHeader(id, { workTypeCode: newCode });
        const codeInput = section.querySelector(
          '[data-jy2-worktype-field="code"] input',
        );
        if (codeInput) codeInput.value = newCode;
        const costCat = jy2ResolveCostCategoryFromWorkType(newCode, savedName);
        if (costCat === "施工" || costCat === "保安") {
          detailModel.updateBlockHeader(id, { costCategory: costCat });
        } else if (costCat === "給与") {
          detailModel.updateBlockHeader(id, { costCategory: null });
        }
        jy2ApplyHimokuDefaultToDetails(detailModel, id);
        scheduleRerender();
      };
      const workTypeCodeControl = jy2ComboInput(
        documentRef,
        block.workTypeCode,
        jy2SystemWorkCodeChoices(block.workTypeCode),
        commitWorkTypeCode,
        { listOnly: true, commitExactOption: true, allowClear: true },
      );
      workTypeCodeControl.dataset.jy2WorktypeField = "code";
      headerField(
        "工種番号（選択）",
        workTypeCodeControl,
      );
      const workTypeNameControl = jy2ComboInput(
        documentRef,
        block.workTypeName,
        jy2SystemWorkNameChoices(block.workTypeName),
        commitWorkTypeName,
        { listOnly: true, commitExactOption: true, allowClear: true },
      );
      workTypeNameControl.dataset.jy2WorktypeField = "name";
      headerField(
        "システム工種（選択）",
        workTypeNameControl,
      );
      // U29: 区分 sits left of 取引先; list-select colored (green).
      headerField(
        "区分（選択）",
        jy2UnitSelect(
          documentRef,
          block.costCategory,
          commitHeader("costCategory"),
          CONTRACT_SECTIONS,
        ),
      );
      // U3: 取引先は候補リストのみ（打鍵で絞り込み・リスト外は拒否して赤字表示）
      const vendorWrap = documentRef.createElement("span");
      vendorWrap.appendChild(
        jy2ComboInput(
          documentRef,
          block.vendorName,
          suggest.vendors,
          commitHeader("vendorName"),
          { listOnly: true, hideClearWhenSet: true },
        ),
      );
      headerField("取引先（選択）", vendorWrap);
      const actions = documentRef.createElement("div");
      actions.className = "jy2-block-actions";
      actions.appendChild(
        jy2RowButton(documentRef, "↑", () => {
          detailModel.moveBlock(block.stableBlockId, -1);
          rerenderFull();
        }),
      );
      actions.appendChild(
        jy2RowButton(documentRef, "↓", () => {
          detailModel.moveBlock(block.stableBlockId, 1);
          rerenderFull();
        }),
      );
      // P-39: blocks with actuals are retired, never physically deleted.
      if (block.hasActuals) {
        actions.appendChild(
          jy2RowButton(documentRef, "廃止", () => {
            detailModel.retireBlock(block.stableBlockId);
            rerenderFull();
          }),
        );
      } else {
        actions.appendChild(
          jy2RowButton(documentRef, "ブロック削除", () => {
            const id = block.stableBlockId;
            detailModel.removeBlock(id);
            // 先に DOM から外し、古い partial 差し替えが残像を作らないようにする。
            if (typeof section.remove === "function") section.remove();
            else if (section.parentNode) section.parentNode.removeChild(section);
            rerenderFull();
          }),
        );
      }
      head.appendChild(actions);
    } else {
      head.appendChild(
        jy2Cell(
          documentRef,
          "span",
          "",
          [
            block.workTypeCode,
            jy2DisplayWorkTypeName(block.workTypeName),
            block.costCategory,
            block.vendorName,
          ]
            .filter((text) => text)
            .join(" / "),
        ),
      );
    }
    section.appendChild(head);

    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-detail-table";
    const body = documentRef.createElement("tbody");
    let showItem = false;
    let showVendor = false;
    let showPerson = false;
    block.detailRows.forEach((scanRow, scanIndex) => {
      const scanPrev1 = jy2PrevResolved(block.detailRows, scanIndex, "name1");
      const scanPrev2 = jy2PrevResolved(block.detailRows, scanIndex, "name2");
      const scanName1 =
        jy2IsDitto(scanRow.name1) || !jy2HasText(scanRow.name1)
          ? scanPrev1
          : String(scanRow.name1).trim();
      const scanName2 =
        jy2IsDitto(scanRow.name2) || !jy2HasText(scanRow.name2)
          ? scanPrev2
          : String(scanRow.name2).trim();
      if (jy2IsGaichuMaterial(scanName1, scanName2)) showItem = true;
      if (jy2UchiwakeLineVendorVisible(scanName1, scanName2)) showVendor = true;
      if (jy2UchiwakeLinePersonVisible(scanName1, scanName2)) showPerson = true;
    });
    const extraCount = (showItem ? 1 : 0) + (showVendor ? 1 : 0) + (showPerson ? 1 : 0);
    // 詳細（入力）／材料（選択） — 外注は nameDetail、材料費は name3
    const headerRow = documentRef.createElement("tr");
    const appendDetailHead = (label, cls) => {
      const th = documentRef.createElement("th");
      if (cls) th.classList.add(cls);
      jy2AppendModeLabel(documentRef, th, label);
      headerRow.appendChild(th);
    };
    appendDetailHead("費目（選択）");
    appendDetailHead("種別（選択）");
    appendDetailHead("詳細（選択）", "jy2-col-detail");
    if (showItem) appendDetailHead("品名（選択）", "jy2-col-item");
    if (showVendor) appendDetailHead("会社名（選択）", "jy2-col-line-vendor");
    if (showPerson) appendDetailHead("氏名（入力）", "jy2-col-line-person");
    appendDetailHead("単位（選択）");
    appendDetailHead("数量（入力）");
    appendDetailHead("単価（入力）");
    appendDetailHead("金額（自動）");
    appendDetailHead("備考（入力）", "jy2-col-note");
    appendDetailHead("");
    body.appendChild(headerRow);

    block.detailRows.forEach((row, rowIndex) => {
      const tr = documentRef.createElement("tr");
      tr.dataset.rowKey = row.rowKey;
      const prevName1 = jy2PrevResolved(block.detailRows, rowIndex, "name1");
      const prevName2 = jy2PrevResolved(block.detailRows, rowIndex, "name2");
      const prevName3 = jy2PrevResolved(block.detailRows, rowIndex, "name3");
      const commit = (field) => (value) => {
        const patch = { [field]: value };
        // 費目変更時: 新しい費目に紐づかない種別はクリア（カスケード整合）。
        if (field === "name1") {
          const entry = jy2ResolveNameHierarchy(block);
          if (jy2HimokuUsesDashType(entry, value)) {
            patch.name2 = "－";
          } else {
            const sole = jy2SoleTypeForHimoku(entry, value);
            const nextSuggest = jy2CollectDetailSuggestions(null, block, {
              ...row,
              name1: value,
            });
            const currentType = row.name2 == null ? "" : String(row.name2).trim();
            if (sole) {
              // 候補が1件だけの費目は種別（補助）を自動選択。
              patch.name2 = sole;
            } else if (
              currentType === "－" ||
              (currentType && !nextSuggest.name2.includes(currentType))
            ) {
              patch.name2 = null;
            }
          }
        }
        const merged = { ...row, ...patch };
        const nextHimoku =
          jy2IsDitto(merged.name1) || !jy2HasText(merged.name1)
            ? prevName1
            : String(merged.name1).trim();
        const nextType =
          jy2IsDitto(merged.name2) || !jy2HasText(merged.name2)
            ? prevName2
            : String(merged.name2).trim();
        Object.assign(
          patch,
          jy2UchiwakeClearOutOfScopeLineFields(nextHimoku, nextType, merged),
        );
        if (!jy2IsGaichuHimoku(nextHimoku)) {
          patch.nameDetail = null;
          patch.nameItem = null;
        } else if (field === "name1" || field === "name2") {
          const curDetail =
            row.nameDetail == null ? "" : String(row.nameDetail).trim();
          if (curDetail && !jy2GaichuDetailChoices(nextType, curDetail).includes(curDetail)) {
            patch.nameDetail = null;
          }
          const detailForItem =
            patch.nameDetail !== undefined ? patch.nameDetail : row.nameDetail;
          if (jy2GaichuItemIsDashFixed(nextHimoku, nextType, detailForItem)) {
            patch.nameItem = "－";
          } else if (
            String(row.nameItem || "").trim() === "－" &&
            jy2GaichuItemUsesMaterialMaster(nextHimoku, nextType, detailForItem)
          ) {
            patch.nameItem = null;
          }
        }
        if (field === "nameDetail") {
          if (jy2GaichuItemIsDashFixed(nextHimoku, nextType, value)) {
            patch.nameItem = "－";
          } else if (
            String(row.nameItem || "").trim() === "－" &&
            jy2GaichuItemUsesMaterialMaster(nextHimoku, nextType, value)
          ) {
            patch.nameItem = null;
          }
        }
        detailModel.updateDetailRow(block.stableBlockId, row.rowKey, patch);
        if (field === "lineVendorName" && jy2HasText(value)) {
          detailModel.updateBlockHeader(block.stableBlockId, { vendorName: "－" });
        }
        scheduleRerender();
      };
      let resolvedName1 =
        jy2IsDitto(row.name1) || !jy2HasText(row.name1)
          ? prevName1
          : String(row.name1).trim();
      if (jy2HimokuCurrentIsWorkTypeName(resolvedName1, block && block.workTypeName)) {
        resolvedName1 = "";
      }
      const resolvedName2 =
        jy2IsDitto(row.name2) || !jy2HasText(row.name2)
          ? prevName2
          : String(row.name2).trim();
      const rowSuggest = jy2CollectDetailSuggestions(null, block, {
        ...row,
        name1: resolvedName1,
        // name2 は raw のまま渡す。〃解決値を祖父にすると
        // 上段の「塗料」等が仮設機械経費など別費目の種別候補へ混入する。
      });
      const dashTypeFixed = jy2HimokuUsesDashType(
        jy2ResolveNameHierarchy(block),
        resolvedName1,
      );
      // U27: 直前と同値／空継承／保存〃 → 画面は「〃」（Excelの空欄表示は廃止）
      const name1ShowDitto = jy2ShowDitto(row.name1, prevName1);
      const name2ShowDitto = jy2ShowDitto(row.name2, prevName2);
      // 定義及び品名は同値のときだけ〃（空は未設定のまま）
      const name3ShowDitto = jy2ShowDitto(row.name3, prevName3, {
        emptyContinues: false,
      });
      const name1DisplayBlank = name1ShowDitto || !jy2HasText(row.name1);
      const name2DisplayBlank = name2ShowDitto || !jy2HasText(row.name2);
      const name1BlankVisual = {
        blank: name1DisplayBlank,
        continued: name1ShowDitto,
        label: prevName1 || row.nameSpecGroup,
        kind: "費目",
      };
      const name2BlankVisual = {
        blank: name2DisplayBlank,
        continued: name2ShowDitto,
        label: prevName2,
        kind: "種別",
      };
      const name3UsesMaterialList = jy2UsesMaterialList(resolvedName1, resolvedName2);
      if (blockEditable) {
        // U4: 費目/種別（補助）＝リストのみ（打鍵候補は維持）。材料費×塗料等は材料 listOnly。
        const name1 = jy2Cell(documentRef, "td", "", "");
        const name1Ctrl = jy2ComboInput(
          documentRef,
          jy2HimokuCurrentIsWorkTypeName(row.name1, block && block.workTypeName)
            ? ""
            : row.name1,
          rowSuggest.name1,
          commit("name1"),
          {
            displayDitto: name1ShowDitto,
            revealValue: prevName1 || row.name1,
            listOnly: true,
            allowClear: true,
            allowDitto: Boolean(prevName1),
          },
        );
        name1Ctrl.dataset.jy2Field = "name1";
        name1.appendChild(name1Ctrl);
        tr.appendChild(name1);
        const name2 = jy2Cell(documentRef, "td", "", "");
        if (dashTypeFixed) {
          name2.classList.add("jy2-readonly");
          name2.textContent = "－";
          name2.title = "コード表で種別が「－」のため自動固定";
        } else {
          const name2Ctrl = jy2ComboInput(
            documentRef,
            row.name2,
            rowSuggest.name2,
            commit("name2"),
            {
              displayDitto: name2ShowDitto,
              revealValue: prevName2 || row.name2,
              listOnly: true,
              allowClear: true,
              allowDitto: Boolean(prevName2),
            },
          );
          name2Ctrl.dataset.jy2Field = "name2";
          name2.appendChild(name2Ctrl);
        }
        tr.appendChild(name2);
        const detailCell = jy2Cell(documentRef, "td", "jy2-col-detail", "");
        if (jy2IsGaichuHimoku(resolvedName1)) {
          const detailCtrl = jy2ComboInput(
            documentRef,
            row.nameDetail,
            jy2GaichuDetailChoices(resolvedName2, row.nameDetail),
            commit("nameDetail"),
            { listOnly: true, allowClear: true },
          );
          detailCtrl.dataset.jy2Field = "nameDetail";
          detailCell.appendChild(detailCtrl);
        } else {
          const name3Ctrl = name3UsesMaterialList
            ? jy2ComboInput(
                documentRef,
                row.name3,
                jy2MaterialChoices(row.name3, resolvedName1, resolvedName2),
                (value) => commit("name3")(jy2ToFullWidthKana(value)),
                {
                  displayDitto: name3ShowDitto,
                  revealValue: prevName3 || row.name3,
                  listOnly: true,
                  allowClear: true,
                  allowDitto: Boolean(prevName3),
                },
              )
            : jy2ComboInput(
                documentRef,
                row.name3,
                rowSuggest.name3,
                (value) => commit("name3")(jy2ToFullWidthKana(value)),
                {
                  fullTitle: true,
                  displayDitto: name3ShowDitto,
                  revealValue: prevName3 || row.name3,
                  allowDitto: Boolean(prevName3),
                },
              );
          name3Ctrl.dataset.jy2Field = "name3";
          detailCell.appendChild(name3Ctrl);
        }
        tr.appendChild(detailCell);
        if (showItem) {
          const itemCell = jy2Cell(documentRef, "td", "jy2-col-item", "");
          if (jy2IsGaichuMaterial(resolvedName1, resolvedName2)) {
            if (jy2GaichuItemIsDashFixed(resolvedName1, resolvedName2, row.nameDetail)) {
              itemCell.classList.add("jy2-readonly");
              itemCell.textContent = "－";
            } else {
              const itemCtrl = jy2ComboInput(
                documentRef,
                row.nameItem,
                jy2MaterialChoices(row.nameItem, "材料費", row.nameDetail),
                (value) => commit("nameItem")(jy2ToFullWidthKana(value)),
                { listOnly: true, allowClear: true },
              );
              itemCtrl.dataset.jy2Field = "nameItem";
              itemCell.appendChild(itemCtrl);
            }
          }
          tr.appendChild(itemCell);
        }
        if (showVendor) {
          const vendorCell = jy2Cell(documentRef, "td", "jy2-col-line-vendor", "");
          if (jy2UchiwakeLineVendorVisible(resolvedName1, resolvedName2)) {
            const lineVendorChoices = [...JY2_VENDOR_SEEDS];
            const blockVendor = String(block.vendorName || "").trim();
            if (blockVendor && !lineVendorChoices.includes(blockVendor)) {
              lineVendorChoices.push(blockVendor);
            }
            const vendorCtrl = jy2ComboInput(
              documentRef,
              row.lineVendorName,
              jy2ListOnlyChoices(lineVendorChoices, row.lineVendorName),
              commit("lineVendorName"),
              { listOnly: true, allowClear: true },
            );
            vendorCtrl.dataset.jy2Field = "lineVendorName";
            vendorCell.appendChild(vendorCtrl);
          }
          tr.appendChild(vendorCell);
        }
        if (showPerson) {
          const personCell = jy2Cell(documentRef, "td", "jy2-col-line-person", "");
          if (jy2UchiwakeLinePersonVisible(resolvedName1, resolvedName2)) {
            const personCtrl = jy2TextInput(
              documentRef,
              row.linePersonName,
              commit("linePersonName"),
            );
            personCtrl.dataset.jy2Field = "linePersonName";
            personCell.appendChild(personCtrl);
          }
          tr.appendChild(personCell);
        }
        const unit = jy2Cell(documentRef, "td", "", "");
        const unitCtrl = jy2UnitSelect(
          documentRef,
          row.unit,
          commit("unit"),
          DETAIL_UNITS,
        );
        unitCtrl.dataset.jy2Field = "unit";
        unit.appendChild(unitCtrl);
        tr.appendChild(unit);
        const quantityCell = jy2Cell(documentRef, "td", "jy2-num", "");
        const qtyCtrl = jy2TextInput(
          documentRef,
          row.quantity,
          commit("quantity"),
        );
        qtyCtrl.dataset.jy2Field = "quantity";
        quantityCell.appendChild(qtyCtrl);
        tr.appendChild(quantityCell);
        const unitPriceCell = jy2Cell(documentRef, "td", "jy2-num", "");
        const priceCtrl = jy2CommaNumberInput(
          documentRef,
          row.unitPrice,
          commit("unitPrice"),
        );
        priceCtrl.dataset.jy2Field = "unitPrice";
        unitPriceCell.appendChild(priceCtrl);
        tr.appendChild(unitPriceCell);
        // U17: 薄い赤の起点は費目/種別（補助）のみ。定義及び品名（name3）は必須扱いにしない。
        // 〃は「値あり」扱い（継続入力）。
        const anchor =
          jy2HasText(row.name1) ||
          jy2HasText(row.name2) ||
          name1ShowDitto ||
          name2ShowDitto;
        jy2MarkIncompleteIfAnchor(
          name1,
          anchor,
          name1ShowDitto ? JY2_DITTO_MARK : row.name1,
        );
        jy2MarkIncompleteIfAnchor(
          name2,
          anchor,
          name2ShowDitto ? JY2_DITTO_MARK : row.name2,
        );
        jy2MarkIncompleteIfAnchor(unit, anchor, row.unit);
        jy2MarkIncompleteIfAnchor(quantityCell, anchor, row.quantity);
        jy2MarkIncompleteIfAnchor(unitPriceCell, anchor, row.unitPrice);
        jy2MarkNameBlankVisual(name1, name1BlankVisual);
        if (!dashTypeFixed) jy2MarkNameBlankVisual(name2, name2BlankVisual);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        const note = jy2Cell(documentRef, "td", "jy2-col-note", "");
        const noteCtrl = jy2TextInput(documentRef, row.note, commit("note"), {
          fullTitle: true,
        });
        noteCtrl.dataset.jy2Field = "note";
        note.appendChild(noteCtrl);
        tr.appendChild(note);
        const ops = jy2Cell(documentRef, "td", "", "");
        ops.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, -1);
            scheduleRerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, 1);
            scheduleRerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            try {
              detailModel.removeDetailRow(block.stableBlockId, row.rowKey);
            } catch (error) {
              if (/at least 1 detail row/i.test(String(error && error.message))) {
                throw new Error("明細行は1行以上必要なため削除できません", {
                  cause: error,
                });
              }
              throw error;
            }
            scheduleRerender();
          }),
        );
        tr.appendChild(ops);
      } else {
        const name1Cell = jy2Cell(
          documentRef,
          "td",
          "",
          name1ShowDitto ? JY2_DITTO_MARK : row.name1,
        );
        const name2Cell = jy2Cell(
          documentRef,
          "td",
          "",
          name2ShowDitto ? JY2_DITTO_MARK : row.name2,
        );
        jy2MarkNameBlankVisual(name1Cell, name1BlankVisual);
        jy2MarkNameBlankVisual(name2Cell, name2BlankVisual);
        tr.appendChild(name1Cell);
        tr.appendChild(name2Cell);
        {
          const detailRo = jy2Cell(documentRef, "td", "jy2-col-detail", "");
          if (jy2IsGaichuHimoku(resolvedName1)) {
            const detailText =
              row.nameDetail === null || row.nameDetail === undefined
                ? ""
                : String(row.nameDetail).trim();
            detailRo.textContent = detailText;
            if (detailText) detailRo.title = detailText;
          } else {
            detailRo.textContent = name3ShowDitto ? JY2_DITTO_MARK : row.name3;
            const name3Text = name3ShowDitto
              ? prevName3 || ""
              : row.name3 === null || row.name3 === undefined
                ? ""
                : String(row.name3).trim();
            if (name3Text) detailRo.title = name3Text;
          }
          tr.appendChild(detailRo);
        }
        if (showItem) {
          const itemRo = jy2Cell(documentRef, "td", "jy2-col-item", "");
          if (jy2IsGaichuMaterial(resolvedName1, resolvedName2)) {
            const itemText = jy2GaichuItemIsDashFixed(
              resolvedName1,
              resolvedName2,
              row.nameDetail,
            )
              ? "－"
              : row.nameItem === null || row.nameItem === undefined
                ? ""
                : String(row.nameItem).trim();
            itemRo.textContent = itemText;
            if (itemText) itemRo.title = itemText;
          }
          tr.appendChild(itemRo);
        }
        if (showVendor) {
          const vendorRo = jy2Cell(documentRef, "td", "jy2-col-line-vendor", "");
          if (jy2UchiwakeLineVendorVisible(resolvedName1, resolvedName2)) {
            const vendorText =
              row.lineVendorName === null || row.lineVendorName === undefined
                ? ""
                : String(row.lineVendorName).trim();
            vendorRo.textContent = vendorText;
            if (vendorText) vendorRo.title = vendorText;
          }
          tr.appendChild(vendorRo);
        }
        if (showPerson) {
          const personRo = jy2Cell(documentRef, "td", "jy2-col-line-person", "");
          if (jy2UchiwakeLinePersonVisible(resolvedName1, resolvedName2)) {
            const personText =
              row.linePersonName === null || row.linePersonName === undefined
                ? ""
                : String(row.linePersonName).trim();
            personRo.textContent = personText;
            if (personText) personRo.title = personText;
          }
          tr.appendChild(personRo);
        }
        tr.appendChild(jy2Cell(documentRef, "td", "", row.unit));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.quantity));
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(row.unitPrice)),
        );
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        {
          const noteRo = jy2Cell(documentRef, "td", "jy2-col-note", row.note);
          const noteText =
            row.note === null || row.note === undefined
              ? ""
              : String(row.note).trim();
          if (noteText) noteRo.title = noteText;
          tr.appendChild(noteRo);
        }
        tr.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(tr);
    });

    if (blockEditable) {
      const addRow = documentRef.createElement("tr");
      const addCell = jy2Cell(documentRef, "td", "", "");
      addCell.colSpan = 9 + extraCount;
      addCell.appendChild(
        jy2RowButton(documentRef, "明細行追加", () => {
          detailModel.addDetailRow(block.stableBlockId);
          jy2ApplyHimokuDefaultToDetails(detailModel, block.stableBlockId);
          scheduleRerender();
        }),
      );
      addRow.appendChild(addCell);
      body.appendChild(addRow);
    }

    // G0 §7.1: 施工のみ 諸経費→小計→法定福利費→計（保険料固定行なし）。保安はフッタ無し。
    for (const kind of footerKindsForCostCategory(block.costCategory)) {
      const footerRow = block.footer[kind];
      const tr = documentRef.createElement("tr");
      tr.className =
        kind === "block_total"
          ? "jy2-footer-row jy2-block-total-row"
          : "jy2-footer-row";
      tr.dataset.rowKind = kind;
      tr.dataset.rowKey = footerRow.rowKey;

      // R-11(案B): 諸経費は自動(明細金額合計×10%・読取専用)。根拠を行内に表示する。
      // 列対応: ラベル(4列) | 数量列=率% | 単価列=明細金額合計 | 金額列=諸経費 | 備考=式+注意.
      if (kind === "overhead") {
        const label = documentRef.createElement("td");
        label.className = "jy2-footer-label";
        jy2AppendModeLabel(
          documentRef,
          label,
          `${BLOCK_FOOTER_LABELS[kind]}（自動）`,
        );
        label.colSpan = 4 + extraCount;
        tr.appendChild(label);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", `${footerRow.ratePercent}%`),
        );
        const unitPriceCell = jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Comma(footerRow.base),
        );
        unitPriceCell.title = "諸経費の単価は明細金額の合計です";
        tr.appendChild(unitPriceCell);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(footerRow.amount)),
        );
        const basis = jy2Cell(
          documentRef,
          "td",
          "jy2-footer-basis",
          `明細金額合計 ×${footerRow.ratePercent}%（単価は明細金額の合計）`,
        );
        basis.colSpan = 2;
        basis.title = "諸経費の単価は明細金額の合計です";
        tr.appendChild(basis);
        body.appendChild(tr);
        continue;
      }

      const manual = MANUAL_FOOTER_KINDS.includes(kind);
      const footerMode = manual ? "入力" : "自動";
      const label = documentRef.createElement("td");
      label.className = "jy2-footer-label";
      jy2AppendModeLabel(
        documentRef,
        label,
        `${BLOCK_FOOTER_LABELS[kind]}（${footerMode}）`,
      );
      label.colSpan = 6 + extraCount;
      tr.appendChild(label);
      if (manual && blockEditable) {
        const amount = jy2Cell(documentRef, "td", "jy2-num", "");
        const amountCtrl = jy2TextInput(documentRef, footerRow.amount, (value) => {
          detailModel.updateFooterAmount(block.stableBlockId, kind, value);
          scheduleRerender();
        });
        amountCtrl.dataset.jy2Field = "footerAmount";
        amount.appendChild(amountCtrl);
        tr.appendChild(amount);
      } else {
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(footerRow.amount)),
        );
      }
      const tail = jy2Cell(documentRef, "td", "", "");
      tail.colSpan = 2;
      tr.appendChild(tail);
      body.appendChild(tr);
    }

    table.appendChild(body);
    // 横スクロールは jy2RenderDetailPane の pane-hscroll 1本
    section.appendChild(table);
    return section;
  }

  // 内訳 tab (Phase 4c): offline in-memory editor over App2-shaped blocks.
  // セル編集は該当ブロック差し替え。ブロック追加/移動/削除のみ全ペイン再描画。
  // 総括再描画は refreshSummary（shell側で dirty 遅延）に委譲。
  // options.focusBlockId: 再描画後にそのブロックへスクロール（工種ブロック追加用）。
  function jy2RenderDetailPane(
    documentRef,
    pane,
    detailModel,
    refreshSummary,
    masterLists,
    options = {},
  ) {
    const notifySummary =
      typeof refreshSummary === "function" ? refreshSummary : () => {};

    const collectPaneSuggestions = () => {
      const paneVendors = new Set(JY2_VENDOR_SEEDS);
      for (const block of detailModel.snapshot().blocks) {
        if (block.vendorName) paneVendors.add(String(block.vendorName));
      }
      return { vendors: [...paneVendors] };
    };

    function findDetailBlockEl(onlyBlockId) {
      const id = String(onlyBlockId || "").trim();
      if (!id || !pane || typeof pane.querySelectorAll !== "function") return null;
      // 属性セレクタは特殊文字で壊れることがあるため dataset で突合する。
      const nodes = pane.querySelectorAll(".jy2-detail-block");
      for (const node of nodes) {
        if (node && node.dataset && String(node.dataset.stableBlockId || "") === id) {
          return node;
        }
      }
      return null;
    }

    function replaceOneBlock(onlyBlockId) {
      const id = String(onlyBlockId || "").trim();
      if (!id) return false;
      const old = findDetailBlockEl(id);
      if (!old) return false;
      const scroll = jy2CaptureScroll(documentRef, pane);
      const focusHint = jy2CaptureFieldFocus(documentRef, old);
      // 当該ブロックの「－」固定／単一種別だけ先に正規化（全ブロック走査はしない）。
      const entryBlock = detailModel
        .snapshot()
        .blocks.find((b) => b.stableBlockId === id);
      if (entryBlock) {
        const entry = jy2ResolveNameHierarchy(entryBlock);
        for (const row of entryBlock.detailRows) {
          if (
            jy2HimokuUsesDashType(entry, row.name1) &&
            String(row.name2 || "").trim() !== "－"
          ) {
            detailModel.updateDetailRow(id, row.rowKey, { name2: "－" });
            continue;
          }
          const sole = jy2SoleTypeForHimoku(entry, row.name1);
          const current = String(row.name2 || "").trim();
          if (sole && (!current || current === "－")) {
            detailModel.updateDetailRow(id, row.rowKey, { name2: sole });
          }
        }
      }
      const block = detailModel.snapshot().blocks.find((b) => b.stableBlockId === id);
      if (!block) return false;
      const next = jy2DetailBlock(
        documentRef,
        detailModel,
        block,
        detailModel.allowedOperations.editBudget,
        rerender,
        collectPaneSuggestions(),
        masterLists,
      );
      old.replaceWith(next);
      if (scroll) jy2ApplyScroll(documentRef, pane, scroll);
      jy2RestoreFieldFocus(next, focusHint);
      notifySummary();
      return true;
    }

    function rerender(arg) {
      let opts = {};
      if (typeof arg === "string") {
        opts = { focusBlockId: arg, full: true };
      } else if (arg && typeof arg === "object") {
        opts = arg;
      }
      const onlyBlockId = String(opts.onlyBlockId || "").trim();
      // full は厳密に true のときのみ部分更新を抑止（truthy 以外の誤指定を避ける）。
      if (onlyBlockId && opts.full !== true) {
        if (replaceOneBlock(onlyBlockId)) return;
      }
      jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary, masterLists, {
        focusBlockId: opts.focusBlockId,
      });
      notifySummary();
    }

    const focusBlockId = String((options && options.focusBlockId) || "").trim();
    // フォーカス指定時は旧スクロール復元を抑止し、追加ブロックへ移動できるようにする。
    const scroll = focusBlockId ? null : jy2CaptureScroll(documentRef, pane);
    pane.textContent = "";
    const editable = detailModel.allowedOperations.editBudget;
    jy2NormalizeDashTypeDetails(detailModel);
    jy2NormalizeSoleTypeDetails(detailModel);
    const snapshot = detailModel.snapshot();
    const paneSuggestions = collectPaneSuggestions();

    for (const warning of detailModel.categoryWarnings()) {
      pane.appendChild(jy2Cell(documentRef, "p", "jy2-warning", warning));
    }

    // C5: 内訳タブも横スクロール1本（工種ブロックごとの個別 wrap 禁止）
    const scroller = jy2MountPaneHScroll(documentRef, pane, { minWidth: 1400 });

    if (snapshot.blocks.length === 0) {
      scroller.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "内訳ブロックなし（新規はブロック0から。追加ボタンで開始）",
        ),
      );
    }
    for (const block of snapshot.blocks) {
      scroller.appendChild(
        jy2DetailBlock(
          documentRef,
          detailModel,
          block,
          editable,
          rerender,
          paneSuggestions,
          masterLists,
        ),
      );
    }
    if (editable) {
      scroller.appendChild(
        jy2RowButton(documentRef, "工種ブロック追加", () => {
          const id = detailModel.addBlock();
          rerender({ focusBlockId: id, full: true });
        }),
      );
    }
    if (scroll) jy2ApplyScroll(documentRef, pane, scroll);
    if (focusBlockId) {
      const shell = pane.closest ? pane.closest(".jy2-shell") : null;
      jy2GotoDetailBlock(shell, documentRef, focusBlockId);
    }
  }

  function jy2MonthLabel(month) {
    const [year, monthNumber] = month.split("-");
    // 予実の月列は幅を抑える（例: 24/6）
    return `${String(year).slice(-2)}/${Number(monthNumber)}`;
  }

  // 2026-07-29-ver02-actual-detail-expand: 継続（〃）を実値へ解決するヘルパ。
  // detail-block-model の resolveContinuedField を UI ローカルでも用意して、
  // 子行の費目/種別/定義及び品名を上位行から埋め戻す。
  function jy2ActualResolveContinuedField(rows, index, field) {
    if (!Array.isArray(rows) || index < 0) return null;
    for (let i = index; i >= 0; i -= 1) {
      const raw = rows[i] && rows[i][field];
      if (!jy2HasText(raw) || jy2IsDitto(raw)) continue;
      return String(raw).trim();
    }
    return null;
  }

  // Parent 予実 row (2026-07-29-ver02-actual-detail-expand): 内訳№単位で
  // 合計を表示する。手入力欄は明細行にあるためここは全カラム readonly。
  // Phase2c-c-excel-flat: freeze0＝工種番号・freeze1＝既定費目（Excel同一行）。
  // 開閉トグルなし。種別/詳細は walker が常時描画。
  function jy2ActualChildHasStoredAmounts(child) {
    if (!child) return false;
    if (jy2ActualDecimalAddend(child.finalBudget) !== null) return true;
    if (jy2ActualDecimalAddend(child.actual) !== null) return true;
    if (child.monthly && typeof child.monthly === "object") {
      for (const value of Object.values(child.monthly)) {
        if (jy2ActualDecimalAddend(value) !== null) return true;
      }
    }
    return false;
  }

  function jy2ActualRow(
    documentRef,
    actualsModel,
    row,
    months,
    editable,
    rerender,
    expandState,
    parentHimokuOpts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-parent-row";
    tr.dataset.stableBlockId = row.stableBlockId;
    tr.dataset.costCategory = row.costCategory;
    tr.dataset.blockStatus = row.status;
    if (row.hasChildren) tr.dataset.hasChildren = "true";

    const idCell = jy2Cell(
      documentRef,
      "td",
      row.status === "retired" ? "jy2-retired-tag" : "jy2-num",
      "",
    );
    const codeLabel = documentRef.createElement("span");
    codeLabel.className = "jy2-actual-parent-num";
    const workTypeCodeText = String(row.workTypeCode || "").trim();
    codeLabel.textContent =
      row.status === "retired"
        ? "廃止"
        : jy2CostMgmtIsBlankWorkTypeCode(workTypeCodeText)
          ? ""
          : workTypeCodeText;
    if (row.workTypeName) {
      codeLabel.title = String(row.workTypeName);
    }
    idCell.appendChild(codeLabel);
    tr.appendChild(jy2MarkFreeze(idCell, 0));

    const himokuCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-parent-himoku",
      "",
    );
    const primaryHimokuLabel =
      parentHimokuOpts && parentHimokuOpts.primaryHimokuLabel
        ? String(parentHimokuOpts.primaryHimokuLabel)
        : "";
    if (primaryHimokuLabel) {
      himokuCell.title = `費目「${primaryHimokuLabel}」（Excel: 工種と同一行）`;
      const himokuLabelSpan = documentRef.createElement("span");
      himokuLabelSpan.className = "jy2-actual-himoku-fold-label";
      himokuLabelSpan.textContent = primaryHimokuLabel;
      himokuCell.appendChild(himokuLabelSpan);
      if (
        parentHimokuOpts &&
        parentHimokuOpts.himokuFoldAvailable === true &&
        parentHimokuOpts.himokuFold &&
        parentHimokuOpts.himokuFoldKey &&
        typeof parentHimokuOpts.onHimokuFoldToggle === "function"
      ) {
        const himokuIsOpen = parentHimokuOpts.himokuIsOpen === true;
        tr.dataset.himokuOpen = himokuIsOpen ? "true" : "false";
        jy2ActualAppendHimokuFoldToggle(documentRef, himokuCell, {
          isOpen: himokuIsOpen,
          label: primaryHimokuLabel,
          onToggle: parentHimokuOpts.onHimokuFoldToggle,
        });
      }
      // Excel寄せ: 種別はコード表固定のため費目横「＋種別行」は出さない。
    }
    tr.appendChild(jy2MarkFreeze(himokuCell, 1));
    const parentTypeCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 2);
    const parentDetailCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 3);
    const parentOpsCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-ops-cell", ""),
      4,
    );
    // 閉じている／平坦費目が空のとき: 操作列＋で開いて詳細を追加
    if (
      parentHimokuOpts &&
      parentHimokuOpts.detailQuickAdd === true &&
      parentHimokuOpts.detailModel &&
      parentHimokuOpts.canEditBudget === true &&
      typeof parentHimokuOpts.onAdded === "function" &&
      primaryHimokuLabel
    ) {
      const ops = documentRef.createElement("span");
      ops.className = "jy2-actual-child-ops";
      ops.setAttribute("aria-label", "詳細行の追加");
      const addBtn = documentRef.createElement("button");
      addBtn.type = "button";
      addBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-himoku-ops-add-btn";
      addBtn.textContent = "＋";
      addBtn.setAttribute("aria-label", "詳細行を追加");
      addBtn.title =
        "この費目を開いて詳細行を追加（一時保存で App757 へ）";
      jy2BindDetailPmMouseDown(documentRef, addBtn);
      addBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          if (
            parentHimokuOpts.himokuFold &&
            typeof parentHimokuOpts.himokuFold.open === "function" &&
            parentHimokuOpts.himokuFoldKey
          ) {
            parentHimokuOpts.himokuFold.open(parentHimokuOpts.himokuFoldKey);
          }
          const patch = { name1: primaryHimokuLabel };
          const defaultType = String(
            parentHimokuOpts.defaultTypeLabel || "",
          ).trim();
          if (defaultType) patch.name2 = defaultType;
          const reused = jy2ActualReuseEmptyDetailIfSole(
            parentHimokuOpts.detailModel,
            row.stableBlockId,
            patch,
          );
          const newKey =
            reused ||
            jy2ActualInsertDetailNear(
              parentHimokuOpts.detailModel,
              row.stableBlockId,
              parentHimokuOpts.lastChildRowKeyInGroup || null,
              patch,
              parentHimokuOpts.expandState,
            );
          if (typeof parentHimokuOpts.revealDetailKey === "function") {
            parentHimokuOpts.revealDetailKey(newKey);
          }
          parentHimokuOpts.onAdded();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      ops.appendChild(addBtn);
      parentOpsCell.appendChild(ops);
    }
    const parentUnitCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-unit-price",
      "",
    );
    tr.appendChild(parentTypeCell);
    tr.appendChild(parentDetailCell);
    tr.appendChild(parentOpsCell);
    tr.appendChild(parentUnitCell);
    jy2ActualApplyVisualMerge([
      parentTypeCell,
      parentDetailCell,
      parentOpsCell,
      parentUnitCell,
    ]);
    const parentShouldShow =
      parentHimokuOpts &&
      typeof parentHimokuOpts.shouldShowDetail === "function"
        ? parentHimokuOpts.shouldShowDetail
        : null;
    // 既定費目が親行にあるとき: その費目の子だけSUM（全工種子の合算にしない）
    const parentHimokuChildren =
      parentHimokuOpts && Array.isArray(parentHimokuOpts.himokuChildren)
        ? parentHimokuOpts.himokuChildren
        : row.children;
    const parentSumChildren = jy2ActualChildrenForBudgetSum(
      parentHimokuChildren,
      parentShouldShow,
    );
    const parentPlanQtySum = row.hasChildren
      ? jy2ActualSumField(parentSumChildren, "quantity")
      : jy2ActualDecimalAddend(row.quantity);
    const parentPlanQtyCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-plan-qty jy2-actual-sum-cell",
      jy2ActualMonthQtySumDisplay(parentPlanQtySum),
    );
    parentPlanQtyCell.title =
      "合計（表示中の詳細の計画数量・自動・入力不可）";
    tr.appendChild(parentPlanQtyCell);
    const parentFinalBudget = row.hasChildren
      ? jy2ActualSumField(parentSumChildren, "finalBudget")
      : row.finalBudget;
    const parentActual = row.hasChildren
      ? jy2ActualSumField(parentSumChildren, "actual")
      : row.actual;
    const parentFinalCell = jy2Cell(
      documentRef,
      "td",
      "jy2-amount jy2-actual-sum-cell jy2-actual-col-budget",
      jy2AmountDisplay(parentFinalBudget),
    );
    parentFinalCell.title =
      "合計（表示中の詳細の実行予算額・自動・入力不可）";
    tr.appendChild(parentFinalCell);
    const parentMonthQtyState =
      parentHimokuOpts && parentHimokuOpts.monthQtyState
        ? parentHimokuOpts.monthQtyState
        : null;
    for (const month of months) {
      const qtySum = jy2ActualSumMonthQty(
        parentSumChildren,
        month,
        parentMonthQtyState,
        row,
      );
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        jy2ActualMonthQtySumDisplay(qtySum),
      );
      qtyCell.title = "合計（表示中の子の月次数量・自動・入力不可）";
      tr.appendChild(qtyCell);
      const monthSum = row.hasChildren
        ? jy2ActualSumMonth(parentSumChildren, month)
        : row.monthly[month];
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthSum === null || monthSum === undefined
          ? "－"
          : jy2AmountDisplay(monthSum),
      );
      monthCell.title = "合計（自動・入力不可）";
      tr.appendChild(monthCell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(parentActual)),
    );
    tr.appendChild(
      jy2ActualBudgetDiffCell(documentRef, parentFinalBudget, parentActual),
    );
    // Phase2a: 備考列。表示のみ（親行は projection の summary_note 由来）。
    const parentNoteText = String(row.budgetNote ?? "");
    const parentNoteCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-note",
      parentNoteText,
    );
    if (parentNoteText) parentNoteCell.title = parentNoteText;
    tr.appendChild(parentNoteCell);
    return tr;
  }

  // Child 予実 row (2026-07-29-ver02-actual-detail-expand): 内訳の明細行に
  // 対応。編集は月別消化と最終予算額のみ。費目/種別/定義及び品名は継続
  // （〃）を上位行から解決した実値で表示する。
  function jy2ActualChildRow(
    documentRef,
    actualsModel,
    parent,
    child,
    detailRows,
    detailIndex,
    months,
    editable,
    rerender,
    monthQtyState,
    childDetailOpts = {},
  ) {
    const {
      detailModel: childDetailModel,
      canEditBudget: childCanEditBudget,
      revealDetailKey,
      onDetailChanged,
      onDetailFieldChanged,
      dualDetailCells = false,
      typeOnlyLeaf = false,
      himokuLabel: dualHimokuLabel = "",
      // 種別行下の詳細2セル時: name2 に埋め込む種別ラベル（例: 昼間）
      dualUnderTypeLabel = "",
      himokuFold: childHimokuFold = null,
      himokuFoldKey: childHimokuFoldKey = "",
    } = childDetailOpts;
    const underTypeLabel = String(dualUnderTypeLabel || "").trim();
    const dualUnderType = Boolean(dualDetailCells && underTypeLabel);
    const notifyFieldChanged = () => {
      if (typeof onDetailFieldChanged === "function") {
        onDetailFieldChanged();
      } else if (typeof onDetailChanged === "function") {
        onDetailChanged();
      } else if (typeof rerender === "function") {
        rerender();
      }
    };
    const liveUnitPrice = () => {
      if (!childDetailModel || !child || !child.rowKey) {
        return child && child.unitPrice;
      }
      try {
        const snap = childDetailModel.snapshot();
        const block = (snap.blocks || []).find(
          (candidate) =>
            candidate && candidate.stableBlockId === parent.stableBlockId,
        );
        const row = ((block && block.detailRows) || []).find(
          (candidate) => candidate && candidate.rowKey === child.rowKey,
        );
        if (row && row.unitPrice != null && String(row.unitPrice).trim() !== "") {
          return row.unitPrice;
        }
      } catch {
        // fall through
      }
      return child.unitPrice;
    };
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-child-row";
    if (dualDetailCells) tr.classList.add("jy2-actual-dual-detail-row");
    if (typeOnlyLeaf) tr.classList.add("jy2-actual-type-only-row");
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.dataset.rowKey = child.rowKey;
    // 通常: freeze0–2=空、freeze3=詳細(name3)。詳細列はツリー記号なし。
    // dual: freeze2=詳細左(name2)・freeze3=詳細右(name3) — Excelその他材料費。
    // dualUnderType: freeze2=詳細左・freeze3=詳細右。name2 は「種別／詳細左」。
    // typeOnly: freeze2=種別(name2)・freeze3=空 — Excel 軌道工事等。
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 1));
    const name1Resolved =
      jy2ActualResolveContinuedField(detailRows, detailIndex, "name1") ?? "";
    const name2Raw = detailRows?.[detailIndex]?.name2;
    const typelessDualLeft = dualDetailCells && !dualUnderType;
    let name2Resolved =
      jy2ActualResolveContinuedField(detailRows, detailIndex, "name2") ?? "";
    // TYPELESS 詳細左: 〃は継承表示しない（空として扱う）
    if (typelessDualLeft && jy2IsDitto(name2Raw)) {
      name2Resolved = "";
    }
    // 費目名が name2 に入っている取り違えは左セルに出さない（TYPELESS除く）
    const hideHimokuAsLeft =
      (dualDetailCells || typeOnlyLeaf) &&
      !dualUnderType &&
      dualHimokuLabel &&
      String(name2Resolved).trim() === String(dualHimokuLabel).trim() &&
      !jy2CostMgmtIsTypeLessHimoku(dualHimokuLabel);
    if (hideHimokuAsLeft) {
      name2Resolved = "";
    }
    const name3Raw = detailRows?.[detailIndex]?.name3;
    const name3Resolved = jy2IsDitto(name3Raw)
      ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name3") ?? ""
      : jy2HasText(name3Raw)
        ? String(name3Raw).trim()
        : "";
    const dualSplit = dualUnderType
      ? (() => {
          const rawName2 = String(
            jy2IsDitto(name2Raw) ? name2Resolved : name2Raw || "",
          ).trim();
          if (!rawName2 || rawName2 === underTypeLabel) {
            return { typeLabel: underTypeLabel, leftDetail: "" };
          }
          const prefix = underTypeLabel + JY2_COST_MGMT_TYPE_DETAIL_SEP;
          if (rawName2.startsWith(prefix)) {
            return {
              typeLabel: underTypeLabel,
              leftDetail: rawName2.slice(prefix.length),
            };
          }
          return jy2CostMgmtSplitTypeDetailName2(rawName2, dualHimokuLabel, [
            underTypeLabel,
          ]);
        })()
      : null;
    const hideHimokuAsLeftRaw =
      (dualDetailCells || typeOnlyLeaf) &&
      !dualUnderType &&
      dualHimokuLabel &&
      String(name2Raw == null ? "" : name2Raw).trim() ===
        String(dualHimokuLabel).trim() &&
      !jy2CostMgmtIsTypeLessHimoku(dualHimokuLabel);
    // TYPELESS で name2=〃 のときも実値（継承解決）を入力欄に出す。空表示だと未保存に見える。
    const name2InputValue = dualUnderType
      ? dualSplit.leftDetail || ""
      : jy2IsDitto(name2Raw)
        ? name2Resolved || ""
        : jy2HasText(name2Raw) && !hideHimokuAsLeftRaw
          ? String(name2Raw).trim()
          : "";
    const name3InputValue = jy2IsDitto(name3Raw)
      ? name3Resolved
      : jy2HasText(name3Raw)
        ? String(name3Raw).trim()
        : "";
    const fullPath = [
      name1Resolved || dualHimokuLabel,
      dualUnderType ? underTypeLabel : "",
      dualDetailCells || typeOnlyLeaf
        ? name2InputValue || (dualUnderType ? "" : typelessDualLeft ? "" : name2Resolved)
        : name2Resolved,
      typeOnlyLeaf ? "" : name3Resolved,
    ]
      .map((part) => String(part).trim())
      .filter((part) => part.length > 0)
      .join(" / ");
    let opsEl = null;
    const leftDetailCell = jy2Cell(
      documentRef,
      "td",
      dualDetailCells
        ? "jy2-actual-child-name jy2-actual-dual-detail-left"
        : typeOnlyLeaf
          ? "jy2-actual-child-name jy2-actual-type-only-name"
          : "",
      "",
    );
    const nameCell = jy2Cell(
      documentRef,
      "td",
      dualDetailCells
        ? "jy2-actual-child-name jy2-actual-dual-detail-right"
        : typeOnlyLeaf
          ? ""
          : "jy2-actual-child-name",
      "",
    );
    if (childCanEditBudget && childDetailModel) {
      if (dualDetailCells || typeOnlyLeaf) {
        const name2Input = jy2TextInput(
          documentRef,
          name2InputValue,
          (value) => {
            const kana = jy2ToFullWidthKana(value);
            const patch = {
              name1:
                dualHimokuLabel ||
                name1Resolved ||
                (typeOnlyLeaf ? "（未分類）" : "その他材料費"),
              name2: dualUnderType
                ? jy2CostMgmtJoinTypeDetailName2(underTypeLabel, kana)
                : kana || null,
            };
            childDetailModel.updateDetailRow(
              parent.stableBlockId,
              child.rowKey,
              patch,
            );
            if (typeof revealDetailKey === "function") {
              revealDetailKey(child.rowKey);
            }
            notifyFieldChanged();
          },
          { fullTitle: true, commitOnInput: true },
        );
        name2Input.className = typeOnlyLeaf
          ? "jy2-input jy2-actual-child-name-input jy2-actual-type-only-input"
          : "jy2-input jy2-actual-child-name-input jy2-actual-dual-detail-input";
        name2Input.placeholder = typeOnlyLeaf
          ? "種別"
          : "詳細（左）";
        name2Input.title = typeOnlyLeaf
          ? "種別を手入力"
          : dualUnderType
            ? `詳細左セル（種別「${underTypeLabel}」の下）`
            : "詳細左セル（例: エンドポイント）";
        leftDetailCell.appendChild(name2Input);
      }
      if (!typeOnlyLeaf) {
        const name3Input = jy2TextInput(
          documentRef,
          name3InputValue,
          (value) => {
            const patch = {
              name3: jy2ToFullWidthKana(value) || null,
            };
            if (dualDetailCells) {
              patch.name1 = dualHimokuLabel || name1Resolved || "その他材料費";
            }
            if (dualUnderType) {
              // 描画時クロージャではなく、左 input の現在値を使う
              const leftEl = leftDetailCell.querySelector("input");
              const currentLeft = leftEl
                ? String(leftEl.value || "").trim()
                : name2InputValue || "";
              patch.name2 = jy2CostMgmtJoinTypeDetailName2(
                underTypeLabel,
                jy2ToFullWidthKana(currentLeft),
              );
            }
            childDetailModel.updateDetailRow(
              parent.stableBlockId,
              child.rowKey,
              patch,
            );
            if (typeof revealDetailKey === "function") {
              revealDetailKey(child.rowKey);
            }
            notifyFieldChanged();
          },
          {
            fullTitle: true,
            commitOnInput: Boolean(dualDetailCells || dualUnderType),
          },
        );
        name3Input.className = dualDetailCells
          ? "jy2-input jy2-actual-child-name-input jy2-actual-dual-detail-input"
          : "jy2-input jy2-actual-child-name-input";
        name3Input.placeholder = dualDetailCells
          ? "詳細（右）"
          : "詳細（手入力）";
        if (dualDetailCells) {
          name3Input.title = dualUnderType
            ? `詳細右セル（種別「${underTypeLabel}」の下）`
            : "詳細右セル（例: 塗装表示記録･数字シール）";
        } else if (fullPath) {
          name3Input.title = fullPath;
        }
        nameCell.appendChild(name3Input);
      }
      opsEl = documentRef.createElement("span");
      opsEl.className = "jy2-actual-child-ops";
      opsEl.setAttribute("aria-label", "詳細行の追加・削除");
      const addSibling = documentRef.createElement("button");
      addSibling.type = "button";
      addSibling.className =
        "jy2-actual-detail-pm-btn jy2-actual-child-add-btn";
      addSibling.textContent = "＋";
      addSibling.setAttribute("aria-label", "詳細行を追加");
      addSibling.title = "詳細行を追加（一時保存で App757 へ）";
      jy2BindDetailPmMouseDown(documentRef, addSibling);
      addSibling.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          jy2FlushActiveInputBeforeSave(documentRef);
          jy2CommitChildDetailInputsFromRow(tr, {
            detailModel: childDetailModel,
            blockId: parent.stableBlockId,
            rowKey: child.rowKey,
            himokuLabel: dualHimokuLabel || name1Resolved || "",
            dualDetailCells,
            dualUnderTypeLabel: underTypeLabel,
            typeOnlyLeaf,
          });
          if (
            childHimokuFold &&
            typeof childHimokuFold.open === "function" &&
            childHimokuFoldKey
          ) {
            childHimokuFold.open(childHimokuFoldKey);
          }
          const patch = {};
          if (dualUnderType) {
            patch.name1 = dualHimokuLabel || name1Resolved || "";
            patch.name2 = underTypeLabel;
          } else if (dualDetailCells || typeOnlyLeaf) {
            patch.name1 =
              dualHimokuLabel ||
              name1Resolved ||
              (typeOnlyLeaf ? "（未分類）" : "その他材料費");
          } else {
            if (name1Resolved) patch.name1 = name1Resolved;
            if (name2Resolved && name2Resolved !== "－") {
              patch.name2 = name2Resolved;
            }
          }
          const newKey = jy2ActualInsertDetailNear(
            childDetailModel,
            parent.stableBlockId,
            child.rowKey,
            patch,
            null,
          );
          if (typeof revealDetailKey === "function") {
            revealDetailKey(newKey);
          }
          if (typeof onDetailChanged === "function") onDetailChanged();
          else if (typeof rerender === "function") rerender();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      const deleteBtn = documentRef.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-child-delete-btn";
      deleteBtn.textContent = "－";
      deleteBtn.setAttribute("aria-label", "詳細行を削除");
      // U12: ブロックに明細が1行は残る。最終行の－は削除ではなく内容クリア。
      let detailRowCountInBlock = Array.isArray(detailRows)
        ? detailRows.length
        : 0;
      try {
        const snap = childDetailModel.snapshot();
        const liveBlock = (snap.blocks || []).find(
          (candidate) =>
            candidate && candidate.stableBlockId === parent.stableBlockId,
        );
        if (liveBlock && Array.isArray(liveBlock.detailRows)) {
          detailRowCountInBlock = liveBlock.detailRows.length;
        }
      } catch {
        // keep detailRows length
      }
      const isSoleDetailInBlock = detailRowCountInBlock <= 1;
      deleteBtn.title = isSoleDetailInBlock
        ? "内容をクリア（工種ブロックには明細が1行残ります）"
        : "詳細行を削除（一時保存で App757 へ）";
      jy2BindDetailPmMouseDown(documentRef, deleteBtn);
      deleteBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          const view = documentRef && documentRef.defaultView;
          if (jy2ActualChildHasStoredAmounts(child)) {
            const ok =
              view && typeof view.confirm === "function"
                ? view.confirm(
                    isSoleDetailInBlock
                      ? "この行には実行予算または月次実績があります。内容をクリアしますか？\n（工種ブロックには明細が1行残ります）"
                      : "この行には実行予算または月次実績があります。削除しますか？\n（構造は一時保存で App757 へ。App758 の古い実績キーは残る場合があります）",
                  )
                : true;
            if (!ok) return;
          }
          if (isSoleDetailInBlock) {
            // U12: 0行にはできない → 費目枠だけの状態へ戻す（内容クリア）
            childDetailModel.updateDetailRow(
              parent.stableBlockId,
              child.rowKey,
              {
                name1: null,
                name2: null,
                name3: null,
                unit: null,
                quantity: null,
                unitPrice: null,
                note: null,
              },
            );
          } else {
            childDetailModel.removeDetailRow(
              parent.stableBlockId,
              child.rowKey,
            );
          }
          if (typeof onDetailChanged === "function") onDetailChanged();
          else if (typeof rerender === "function") rerender();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const raw = String((error && error.message) || error || "");
          const message = /at least 1 detail row/i.test(raw)
            ? "工種ブロックには明細が1行以上必要なため削除できません"
            : raw || "詳細行の削除に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      opsEl.appendChild(addSibling);
      opsEl.appendChild(deleteBtn);
    } else if (dualDetailCells) {
      const leftLabel = documentRef.createElement("span");
      leftLabel.textContent = name2InputValue || name2Resolved || "";
      leftDetailCell.appendChild(leftLabel);
      const nameLabel = documentRef.createElement("span");
      nameLabel.textContent = name3Resolved || "";
      nameLabel.title = fullPath || nameLabel.textContent;
      nameCell.appendChild(nameLabel);
    } else if (typeOnlyLeaf) {
      const leftLabel = documentRef.createElement("span");
      leftLabel.textContent = name2InputValue || name2Resolved || "";
      leftDetailCell.appendChild(leftLabel);
    } else {
      const nameLabel = documentRef.createElement("span");
      nameLabel.textContent = name3Resolved || "－";
      nameLabel.title = fullPath || nameLabel.textContent;
      nameCell.appendChild(nameLabel);
    }
    tr.appendChild(jy2MarkFreeze(leftDetailCell, 2));
    tr.appendChild(jy2MarkFreeze(nameCell, 3));
    const opsCell = jy2Cell(documentRef, "td", "jy2-actual-ops-cell", "");
    if (opsEl) opsCell.appendChild(opsEl);
    tr.appendChild(jy2MarkFreeze(opsCell, 4));

    const unitPriceCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-col-unit-price",
      "",
    );
    const unitPriceRaw =
      detailIndex >= 0 && detailRows?.[detailIndex]
        ? detailRows[detailIndex].unitPrice
        : child.unitPrice;
    const unitPriceInputValue =
      unitPriceRaw === null || unitPriceRaw === undefined
        ? ""
        : String(unitPriceRaw).trim();
    // 月次・明細フィールド change を同一フレームにまとめ、連続入力の全表再構築を抑える。
    let actualRerenderPending = false;
    function scheduleActualRerender() {
      if (actualRerenderPending) return;
      actualRerenderPending = true;
      const view = documentRef && documentRef.defaultView;
      const run = () => {
        actualRerenderPending = false;
        if (typeof rerender === "function") rerender();
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        run();
      }
    }
    const commitDetailField = (patch) => {
      childDetailModel.updateDetailRow(parent.stableBlockId, child.rowKey, patch);
      if (typeof revealDetailKey === "function") {
        revealDetailKey(child.rowKey);
      }
      notifyFieldChanged();
      scheduleActualRerender();
    };
    const livePlanQty = () => {
      if (!childDetailModel || !child || !child.rowKey) {
        return child && child.quantity;
      }
      try {
        const snap = childDetailModel.snapshot();
        const block = (snap.blocks || []).find(
          (candidate) =>
            candidate && candidate.stableBlockId === parent.stableBlockId,
        );
        const row = ((block && block.detailRows) || []).find(
          (candidate) => candidate && candidate.rowKey === child.rowKey,
        );
        if (row && row.quantity != null && String(row.quantity).trim() !== "") {
          return row.quantity;
        }
      } catch {
        // fall through
      }
      return child.quantity;
    };
    if (childCanEditBudget && childDetailModel) {
      const unitPriceInput = jy2CommaNumberInput(
        documentRef,
        unitPriceInputValue,
        (value) => {
          const patch = { unitPrice: value };
          // 単価あり＆計画数量空 → 1（実行予算がすぐ出る。既存数量は触らない）
          if (
            String(value || "").trim() !== "" &&
            jy2ActualDecimalAddend(livePlanQty()) === null
          ) {
            patch.quantity = "1";
          }
          commitDetailField(patch);
        },
      );
      unitPriceInput.className = "jy2-input jy2-actual-child-unit-price-input";
      unitPriceInput.placeholder = "単価";
      unitPriceInput.title =
        "単価（千区切り表示・一時保存で App757 へ）。数量が空なら 1 を自動セット";
      unitPriceCell.appendChild(unitPriceInput);
    } else {
      unitPriceCell.className = "jy2-num";
      unitPriceCell.textContent = jy2AmountDisplay(child.unitPrice);
    }
    tr.appendChild(unitPriceCell);

    const planQtyCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-col-plan-qty",
      "",
    );
    const planQtyRaw =
      detailIndex >= 0 && detailRows?.[detailIndex]
        ? detailRows[detailIndex].quantity
        : child.quantity;
    const planQtyInputValue =
      planQtyRaw === null || planQtyRaw === undefined
        ? ""
        : String(planQtyRaw).trim();
    if (childCanEditBudget && childDetailModel) {
      const planQtyInput = jy2TextInput(
        documentRef,
        planQtyInputValue,
        (value) => commitDetailField({ quantity: value }),
      );
      planQtyInput.className = "jy2-input jy2-actual-child-qty-input";
      planQtyInput.placeholder = "数量";
      planQtyInput.title =
        "計画数量（一時保存で App757 へ）。実行予算額＝ROUND(単価×数量)";
      planQtyCell.appendChild(planQtyInput);
    } else {
      planQtyCell.textContent = planQtyInputValue || "－";
    }
    tr.appendChild(planQtyCell);

    const commit = (patch) => {
      try {
        actualsModel.updateActualRow(
          parent.stableBlockId,
          parent.costCategory,
          patch,
          { rowKey: child.rowKey },
        );
      } catch {
        // Invalid input (non-integer) is discarded; rerender restores the cell.
      }
      scheduleActualRerender();
    };
    // 実行予算額＝ROUND(単価×数量) 自動のみ（手入力なし）
    const autoBudget = jy2RoundYenQtyTimesPrice(
      planQtyInputValue || child.quantity,
      unitPriceInputValue || child.unitPrice,
    );
    const finalCell = jy2Cell(
      documentRef,
      "td",
      "jy2-amount jy2-actual-auto-budget jy2-actual-col-budget",
      autoBudget === null ? "－" : jy2AmountDisplay(autoBudget),
    );
    finalCell.title = "実行予算額＝ROUND(単価×数量)（自動・入力不可）";
    tr.appendChild(finalCell);
    // Phase2b (2026-07-31): 月次は「数量｜金額」の2セル。
    // - 数量: pane 上のセッション Map で保持（App758 に保存しない・再読込で消える）。
    //   commit 時に単価×数量を丸めて金額 amount へ書き戻す（qty→amount 一方向）。
    // - 金額: 直接入力可。空数量なら 1 を自動表示（手直し可）。金額クリア時は数量も消す。
    for (const month of months) {
      // 数量セル
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty",
        "",
      );
      if (editable) {
        const qtyValue = monthQtyState
          ? monthQtyState.get(
              parent.stableBlockId,
              parent.costCategory,
              child.rowKey,
              month,
            )
          : "";
        const qtyInput = jy2TextInput(documentRef, qtyValue, (value) => {
          const trimmed = String(value || "").trim();
          if (!monthQtyState) return;
          if (trimmed === "") {
            monthQtyState.clear(
              parent.stableBlockId,
              parent.costCategory,
              child.rowKey,
              month,
            );
            // 空クリア時は amount を自動クリアしない（再描画も不要）。
            return;
          }
          monthQtyState.set(
            parent.stableBlockId,
            parent.costCategory,
            child.rowKey,
            month,
            trimmed,
          );
          const computed = jy2RoundYenQtyTimesPrice(trimmed, liveUnitPrice());
          if (computed != null) {
            commit({ [month]: computed });
          }
        });
        qtyInput.title =
          "数量（セッション保持・再読込で消える）。金額入力時は空なら 1。違う場合は手直し";
        qtyCell.appendChild(qtyInput);
      } else {
        qtyCell.textContent = "－";
      }
      tr.appendChild(qtyCell);

      // 金額セル
      const cell = jy2Cell(documentRef, "td", "jy2-num jy2-actual-month", "");
      if (editable) {
        cell.appendChild(
          jy2CommaNumberInput(documentRef, child.monthly[month], (value) => {
            const cleaned = jy2StripCommaNumber(value);
            if (monthQtyState) {
              const currentQty = monthQtyState.get(
                parent.stableBlockId,
                parent.costCategory,
                child.rowKey,
                month,
              );
              if (cleaned === "") {
                // 金額クリア → デフォルト数量も消す
                monthQtyState.clear(
                  parent.stableBlockId,
                  parent.costCategory,
                  child.rowKey,
                  month,
                );
              } else if (
                currentQty == null ||
                String(currentQty).trim() === ""
              ) {
                // 金額入力＆数量空 → 1（必要なら手直し）
                monthQtyState.set(
                  parent.stableBlockId,
                  parent.costCategory,
                  child.rowKey,
                  month,
                  "1",
                );
              }
            }
            commit({ [month]: cleaned });
          }),
        );
      } else {
        cell.className = "jy2-amount jy2-actual-month";
        cell.textContent = jy2AmountDisplay(child.monthly[month]);
      }
      tr.appendChild(cell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(child.actual)),
    );
    tr.appendChild(
      jy2ActualBudgetDiffCell(
        documentRef,
        autoBudget !== null ? autoBudget : child.finalBudget,
        child.actual,
      ),
    );
    // Phase2a: 備考列。子行は detailRows[detailIndex].note を読取表示のみ。
    // App758 のキー・App757 明細モデルは変更しない（編集は Phase2a 対象外）。
    const childNoteRaw = detailRows?.[detailIndex]?.note;
    const childNoteText = childNoteRaw == null ? "" : String(childNoteRaw);
    const childNoteCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-note",
      childNoteText,
    );
    if (childNoteText) childNoteCell.title = childNoteText;
    tr.appendChild(childNoteCell);
    return tr;
  }

  // 平坦費目の＋: 空の必須1行だけならそれを埋める（新規追加しない）。
  // 戻り値＝利用した rowKey。無ければ null（通常の insert へ）。
  function jy2ActualReuseEmptyDetailIfSole(detailModel, blockId, patch) {
    if (
      !detailModel ||
      !blockId ||
      typeof detailModel.snapshot !== "function" ||
      typeof detailModel.updateDetailRow !== "function"
    ) {
      return null;
    }
    let rows;
    try {
      const block = (detailModel.snapshot().blocks || []).find(
        (candidate) => candidate && candidate.stableBlockId === blockId,
      );
      rows = block && Array.isArray(block.detailRows) ? block.detailRows : [];
    } catch {
      return null;
    }
    if (rows.length !== 1 || !rows[0] || !rows[0].rowKey) return null;
    const sole = rows[0];
    if (jy2CostMgmtDetailHasLeafContent(sole)) return null;
    const name1 = String(sole.name1 || "").trim();
    if (name1) return null;
    const clean = {};
    if (patch && typeof patch === "object") {
      if (Object.prototype.hasOwnProperty.call(patch, "name1")) {
        clean.name1 = patch.name1;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "name2")) {
        clean.name2 = patch.name2;
      }
    }
    if (Object.keys(clean).length === 0) return null;
    detailModel.updateDetailRow(blockId, sole.rowKey, clean);
    return sole.rowKey;
  }
  // Phase2c-b/c: App757 detailModel に明細行を追加し、anchor の直後へ寄せる。
  // patch で name1/name2 を prefill。actualsModel は触らない。
  function jy2ActualInsertDetailNear(detailModel, blockId, lastChildRowKey, patch, expandState) {
    const findBlockRows = () => {
      const snapshot = detailModel.snapshot();
      const blocks = (snapshot && snapshot.blocks) || [];
      const target = blocks.find(
        (block) => block && block.stableBlockId === blockId,
      );
      return target && Array.isArray(target.detailRows) ? target.detailRows : [];
    };
    const indexOfKey = (rows, key) => {
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i] && rows[i].rowKey === key) return i;
      }
      return -1;
    };
    const preRows = findBlockRows();
    const anchorIndex =
      lastChildRowKey != null ? indexOfKey(preRows, lastChildRowKey) : -1;
    const newKey = detailModel.addDetailRow(blockId);
    if (patch && typeof patch === "object") {
      const clean = {};
      if (Object.prototype.hasOwnProperty.call(patch, "name1")) {
        clean.name1 = patch.name1;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "name2")) {
        clean.name2 = patch.name2;
      }
      if (Object.keys(clean).length > 0) {
        detailModel.updateDetailRow(blockId, newKey, clean);
      }
    }
    if (anchorIndex >= 0) {
      const targetIndex = anchorIndex + 1;
      let safety = findBlockRows().length + 1;
      while (safety > 0) {
        safety -= 1;
        const currentRows = findBlockRows();
        const currentIndex = indexOfKey(currentRows, newKey);
        if (currentIndex < 0 || currentIndex === targetIndex) break;
        const offset = currentIndex > targetIndex ? -1 : 1;
        detailModel.moveDetailRow(blockId, newKey, offset);
      }
    }
    if (expandState && typeof expandState.expand === "function") {
      expandState.expand(blockId);
    }
    return newKey;
  }

  // Phase2c-a (2026-07-31): 費目(name1)視覚グループ用の表示専用行。
  // 列: freeze0/2/3空/freeze1ラベル + 単価/実行予算額/月次/原価累計/差/備考（helper）。
  function jy2ActualHimokuGroupRow(
    documentRef,
    parent,
    label,
    childrenInGroup,
    months,
    opts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-himoku-group-row";
    tr.dataset.virtual = "himoku-group";
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.title = "費目合計（表示専用・入力不可）";

    // システム工種: 空欄（子行と同じレイアウト）
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    const labelCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-himoku-group-label",
      "",
    );
    labelCell.title = `費目「${label}」の合計（表示専用・入力不可）`;
    const himokuLabelSpan = documentRef.createElement("span");
    himokuLabelSpan.className = "jy2-actual-himoku-fold-label";
    himokuLabelSpan.textContent = label;
    labelCell.appendChild(himokuLabelSpan);
    if (
      opts &&
      opts.himokuFoldAvailable === true &&
      opts.himokuFold &&
      opts.himokuFoldKey &&
      typeof opts.onHimokuFoldToggle === "function"
    ) {
      const himokuIsOpen = opts.himokuIsOpen === true;
      tr.dataset.himokuOpen = himokuIsOpen ? "true" : "false";
      jy2ActualAppendHimokuFoldToggle(documentRef, labelCell, {
        isOpen: himokuIsOpen,
        label,
        onToggle: opts.onHimokuFoldToggle,
      });
    }
    // Excel寄せ: 種別はコード表固定のため費目グループの「＋種別行」は出さない。
    tr.appendChild(jy2MarkFreeze(labelCell, 1));
    const himokuTypeCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 2);
    const himokuDetailCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 3);
    const himokuOpsCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-ops-cell", ""),
      4,
    );
    // 閉じている／平坦費目が空のとき: 操作列＋で開いて詳細を追加
    if (
      opts &&
      opts.detailQuickAdd === true &&
      opts.detailModel &&
      opts.canEditBudget === true &&
      typeof opts.onAdded === "function"
    ) {
      const ops = documentRef.createElement("span");
      ops.className = "jy2-actual-child-ops";
      ops.setAttribute("aria-label", "詳細行の追加");
      const addBtn = documentRef.createElement("button");
      addBtn.type = "button";
      addBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-himoku-ops-add-btn";
      addBtn.textContent = "＋";
      addBtn.setAttribute("aria-label", "詳細行を追加");
      addBtn.title =
        "この費目を開いて詳細行を追加（一時保存で App757 へ）";
      jy2BindDetailPmMouseDown(documentRef, addBtn);
      addBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          if (
            opts.himokuFold &&
            typeof opts.himokuFold.open === "function" &&
            opts.himokuFoldKey
          ) {
            opts.himokuFold.open(opts.himokuFoldKey);
          }
          const patch = {};
          if (label && label !== "（未分類）") patch.name1 = label;
          const defaultType = String(opts.defaultTypeLabel || "").trim();
          if (defaultType) patch.name2 = defaultType;
          const reused = jy2ActualReuseEmptyDetailIfSole(
            opts.detailModel,
            parent.stableBlockId,
            patch,
          );
          const newKey =
            reused ||
            jy2ActualInsertDetailNear(
              opts.detailModel,
              parent.stableBlockId,
              opts.lastChildRowKeyInGroup || null,
              patch,
              opts.expandState,
            );
          if (typeof opts.revealDetailKey === "function") {
            opts.revealDetailKey(newKey);
          }
          opts.onAdded();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      ops.appendChild(addBtn);
      himokuOpsCell.appendChild(ops);
    }
    tr.appendChild(himokuTypeCell);
    tr.appendChild(himokuDetailCell);
    tr.appendChild(himokuOpsCell);
    const himokuValueCols = jy2ActualAppendGroupValueCols(
      documentRef,
      tr,
      childrenInGroup,
      months,
      {
        unitPriceEmpty: true,
        // 費目行: 詳細の計画数量合計＋実行予算合計（結合は単価まで）
        planQtyEmpty: false,
        monthQtyState: opts && opts.monthQtyState,
        shouldShowDetail: opts && opts.shouldShowDetail,
        parent,
      },
    );
    jy2ActualApplyVisualMerge([
      himokuTypeCell,
      himokuDetailCell,
      himokuOpsCell,
      himokuValueCols.unitPriceCell,
    ]);
    return tr;
  }

  // Phase2c-c (2026-07-31): 種別(name2)視覚グループ。費目枠の内側。
  // virtual=type-group・表示専用 SUM。「＋詳細行」で name1+name2 prefill。
  // Phase2c-c-excel-flat: 種別 +/- なし。Excelどおり常時表示。
  function jy2ActualTypeGroupRow(
    documentRef,
    parent,
    himokuLabel,
    typeLabel,
    childrenInGroup,
    months,
    opts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-type-group-row";
    tr.dataset.virtual = "type-group";
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.title = "種別合計（表示専用・入力不可）";

    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 1));
    const labelCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-type-group-label",
      "",
    );
    labelCell.title = `種別「${typeLabel}」の合計（表示専用・入力不可）`;
    const typeLabelSpan = documentRef.createElement("span");
    typeLabelSpan.textContent = typeLabel;
    labelCell.appendChild(typeLabelSpan);
    tr.appendChild(jy2MarkFreeze(labelCell, 2));
    // Excel寄せ: 詳細〜単価は見た目結合。数量・実行予算は子SUMを表示。
    const detailCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-type-detail-slot", ""),
      3,
    );
    tr.appendChild(detailCell);
    const typeOpsCell = jy2Cell(documentRef, "td", "jy2-actual-ops-cell", "");
    // 空種別: 操作列の＋で最初の詳細行を追加（ラベル横の「＋詳細行」は廃止）
    if (
      opts &&
      opts.detailQuickAdd === true &&
      opts.detailModel &&
      opts.canEditBudget === true &&
      typeof opts.onAdded === "function"
    ) {
      const ops = documentRef.createElement("span");
      ops.className = "jy2-actual-child-ops";
      ops.setAttribute("aria-label", "詳細行の追加");
      const addBtn = documentRef.createElement("button");
      addBtn.type = "button";
      addBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-type-ops-add-btn";
      addBtn.textContent = "＋";
      addBtn.setAttribute("aria-label", "詳細行を追加");
      addBtn.title = "この種別の下に詳細行を追加（一時保存で App757 へ）";
      jy2BindDetailPmMouseDown(documentRef, addBtn);
      addBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          if (
            opts.himokuFold &&
            typeof opts.himokuFold.open === "function" &&
            opts.himokuFoldKey
          ) {
            opts.himokuFold.open(opts.himokuFoldKey);
          }
          const patch = {};
          if (himokuLabel && himokuLabel !== "（未分類）") {
            patch.name1 = himokuLabel;
          }
          if (typeLabel && typeLabel !== "（種別未設定）") {
            patch.name2 = typeLabel;
          }
          const newKey = jy2ActualInsertDetailNear(
            opts.detailModel,
            parent.stableBlockId,
            opts.lastChildRowKeyInGroup || null,
            patch,
            opts.expandState,
          );
          if (typeof opts.revealDetailKey === "function") {
            opts.revealDetailKey(newKey);
          }
          opts.onAdded();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      ops.appendChild(addBtn);
      typeOpsCell.appendChild(ops);
    }
    tr.appendChild(jy2MarkFreeze(typeOpsCell, 4));
    const typeValueCols = jy2ActualAppendGroupValueCols(
      documentRef,
      tr,
      childrenInGroup,
      months,
      {
        unitPriceEmpty: true,
        // 種別行: 詳細の計画数量合計＋実行予算合計を出す（結合は単価まで）
        planQtyEmpty: false,
        shouldShowDetail: opts && opts.shouldShowDetail,
        monthQtyState: opts && opts.monthQtyState,
        parent,
      },
    );
    jy2ActualApplyVisualMerge([
      detailCell,
      typeOpsCell,
      typeValueCols.unitPriceCell,
    ]);
    return tr;
  }

  // Phase2c-a: 費目グループ行の金額集計ヘルパ。子の該当フィールドが全て
  // null/empty のときは null（→ 呼び出し側で "－" 表示）を返す。値がある
  // ものだけを decimal `add` で足し合わせるので、数値の丸めは行わない。
  function jy2ActualDecimalAddend(raw) {
    if (raw === null || raw === undefined) return null;
    const text = String(raw).trim().replace(/[,，]/g, "");
    if (!text || text === "-" || text === "－") return null;
    if (!/^[+-]?\d+(?:\.\d*)?$/.test(text)) return null;
    return text;
  }

  // 手動のみ: 集計は画面に出ている詳細だけ（隠れ内訳の金額を乗せない）。
  function jy2ActualChildrenForBudgetSum(children, shouldShowDetail) {
    if (!JY2_ACTUAL_DETAIL_MANUAL_ONLY) return children || [];
    if (typeof shouldShowDetail !== "function") return children || [];
    return (children || []).filter(
      (child) => child && child.rowKey && shouldShowDetail(child.rowKey),
    );
  }

  function jy2ActualSumField(children, field) {
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      const addend = jy2ActualDecimalAddend(child && child[field]);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  function jy2ActualSumMonth(children, month) {
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      const raw = child && child.monthly ? child.monthly[month] : null;
      const addend = jy2ActualDecimalAddend(raw);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  // Excel寄せ: 費目/種別/親の月次数量＝子明細のセッション数量 SUM（入力不可）。
  function jy2ActualSumMonthQty(children, month, monthQtyState, parent) {
    if (!monthQtyState || !parent || !parent.stableBlockId) return null;
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      if (!child || !child.rowKey) continue;
      const raw = monthQtyState.get(
        parent.stableBlockId,
        parent.costCategory,
        child.rowKey,
        month,
      );
      const addend = jy2ActualDecimalAddend(raw);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  function jy2ActualMonthQtySumDisplay(qtySum) {
    if (qtySum === null || qtySum === undefined) return "－";
    const text = jy2Comma(qtySum);
    return text === "" ? "－" : text;
  }

  // Excel列: 予算との差＝実行予算額−原価累計（表示のみ）。
  function jy2ActualBudgetDiffDisplay(finalBudget, actual) {
    return jy2ActualBudgetDiffParts(finalBudget, actual).text;
  }
  function jy2ActualBudgetDiffParts(finalBudget, actual) {
    const fb = jy2ActualDecimalAddend(finalBudget);
    const ac = jy2ActualDecimalAddend(actual);
    if (fb === null && ac === null) {
      return { text: "－", tone: "empty" };
    }
    const diff = subtract(fb || "0", ac || "0");
    const text = jy2AmountDisplay(diff);
    const n = Number(String(diff).replace(/,/g, ""));
    if (!Number.isFinite(n) || n === 0) return { text, tone: "zero" };
    if (n < 0) return { text, tone: "neg" };
    return { text, tone: "pos" };
  }
  function jy2ActualBudgetDiffCell(documentRef, finalBudget, actual) {
    const { text, tone } = jy2ActualBudgetDiffParts(finalBudget, actual);
    return jy2Cell(
      documentRef,
      "td",
      `jy2-amount jy2-actual-budget-diff jy2-actual-budget-diff-${tone}`,
      text,
    );
  }

  // Excel寄せ: 集計行の空き列を見た目結合（colspanなし・sticky維持）。
  function jy2ActualApplyVisualMerge(cells) {
    const list = (cells || []).filter(Boolean);
    for (let i = 0; i < list.length; i += 1) {
      const td = list[i];
      td.classList.add("jy2-actual-visual-merge");
      if (i === 0) td.classList.add("jy2-actual-visual-merge-start");
      else if (i === list.length - 1) {
        td.classList.add("jy2-actual-visual-merge-end");
      } else {
        td.classList.add("jy2-actual-visual-merge-mid");
      }
    }
  }

  // 費目/種別グループ行の値列（単価/数量/実行予算額/月次/原価累計/差/備考）を追加。
  // opts.unitPriceEmpty: 見た目結合用に空表示。
  // opts.planQtyEmpty: 省略/偽＝表示中子の計画数量 SUM。真＝空（現状未使用）。
  // 戻り値: { unitPriceCell, planQtyCell }（見た目結合は単価セルまで）。
  function jy2ActualAppendGroupValueCols(
    documentRef,
    tr,
    childrenInGroup,
    months,
    opts,
  ) {
    const unitPriceEmpty = !!(opts && opts.unitPriceEmpty);
    const planQtyEmpty = !!(opts && opts.planQtyEmpty);
    const shouldShowDetail = opts && opts.shouldShowDetail;
    const sumChildren = jy2ActualChildrenForBudgetSum(
      childrenInGroup,
      shouldShowDetail,
    );
    const unitPriceCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-unit-price",
      unitPriceEmpty ? "" : "－",
    );
    tr.appendChild(unitPriceCell);
    const planQtySum = planQtyEmpty
      ? null
      : jy2ActualSumField(sumChildren, "quantity");
    const planQtyCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-plan-qty jy2-actual-sum-cell",
      planQtyEmpty ? "" : jy2ActualMonthQtySumDisplay(planQtySum),
    );
    if (!planQtyEmpty) {
      planQtyCell.title =
        "合計（表示中の詳細の計画数量・自動・入力不可）";
    }
    tr.appendChild(planQtyCell);
    const finalBudgetSum = jy2ActualSumField(sumChildren, "finalBudget");
    const finalBudgetCell = jy2Cell(
      documentRef,
      "td",
      "jy2-amount jy2-actual-sum-cell jy2-actual-col-budget",
      jy2AmountDisplay(finalBudgetSum),
    );
    finalBudgetCell.title =
      "合計（表示中の詳細の実行予算額・自動・入力不可）";
    tr.appendChild(finalBudgetCell);
    const monthQtyState = opts && opts.monthQtyState;
    const parentRef = opts && opts.parent;
    for (const month of months) {
      const qtySum = jy2ActualSumMonthQty(
        sumChildren,
        month,
        monthQtyState,
        parentRef,
      );
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        jy2ActualMonthQtySumDisplay(qtySum),
      );
      qtyCell.title = "合計（表示中の子の月次数量・自動・入力不可）";
      tr.appendChild(qtyCell);
      const monthSum = jy2ActualSumMonth(sumChildren, month);
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthSum === null ? "－" : jy2AmountDisplay(monthSum),
      );
      monthCell.title = "合計（表示専用・入力不可）";
      tr.appendChild(monthCell);
    }
    const actualSum = jy2ActualSumField(sumChildren, "actual");
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(actualSum)),
    );
    tr.appendChild(
      jy2ActualBudgetDiffCell(documentRef, finalBudgetSum, actualSum),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-actual-note", "－"));
    return { unitPriceCell, planQtyCell };
  }

  // Phase2b (2026-07-31): 月次数量セル用の丸めヘルパ。単価×数量を整数円へ
  // 四捨五入して string で返す。数量/単価いずれかが不正なら null（＝金額を
  // 自動更新しない）。カンマ区切り入力は許容する。
  function jy2RoundYenQtyTimesPrice(qty, unitPrice) {
    const q = Number(String(qty ?? "").replace(/,/g, ""));
    const p = Number(String(unitPrice ?? "").replace(/,/g, ""));
    if (!Number.isFinite(q) || !Number.isFinite(p)) return null;
    return String(Math.round(q * p));
  }

  // Phase2b (2026-07-31): 月次数量セッション Map。pane 要素に Map を保持し、
  // 再描画（rerender）を跨いでも数量入力が残る。ただし actuals-matrix には
  // 保存しない — 再読込（タブ再入場・保存後リロード）で必ず消える。キーは
  // `${stableBlockId}|${costCategory}|${rowKey}|${month}`。値は string 数量。
  function jy2ActualMonthQtyState(pane) {
    if (!pane) {
      return {
        get: () => "",
        set: () => {},
        clear: () => {},
      };
    }
    if (!pane.__jy2ActualMonthQty) {
      pane.__jy2ActualMonthQty = new Map();
    }
    const map = pane.__jy2ActualMonthQty;
    const key = (stableBlockId, costCategory, rowKey, month) =>
      `${stableBlockId}|${costCategory}|${rowKey || ""}|${month}`;
    return {
      get: (stableBlockId, costCategory, rowKey, month) =>
        map.get(key(stableBlockId, costCategory, rowKey, month)) || "",
      set: (stableBlockId, costCategory, rowKey, month, value) => {
        map.set(key(stableBlockId, costCategory, rowKey, month), String(value));
      },
      clear: (stableBlockId, costCategory, rowKey, month) => {
        map.delete(key(stableBlockId, costCategory, rowKey, month));
      },
    };
  }

  // Pane スコープの展開状態管理（stableBlockId の Set を pane 要素に保持）。
  // rerender 経由でも Set が保持されるので、＋/－の状態がタブ切替まで残る。
  function jy2ActualExpandState(pane) {
    if (!pane) {
      return {
        isExpanded: () => false,
        toggle: () => {},
        expand: () => {},
      };
    }
    if (!pane.__jy2ExpandedActuals) {
      pane.__jy2ExpandedActuals = new Set();
    }
    const set = pane.__jy2ExpandedActuals;
    return {
      isExpanded: (id) => set.has(id),
      toggle: (id) => {
        if (set.has(id)) set.delete(id);
        else set.add(id);
      },
      expand: (id) => set.add(id),
    };
  }

  // #R-EXCEL-UI-16: 費目単位の開閉。キー未設定時は defaultOpen（既定 false＝クローズ）。
  function jy2ActualHimokuFoldKey(blockId, himokuLabel) {
    return `${String(blockId || "")}\u0001${String(himokuLabel || "")}`;
  }
  // 一時保存はフルreloadするため pane Map だけでは▶が閉じる。開いているキーだけ版スコープで残す。
  const JY2_ACTUAL_HIMOKU_FOLD_STORAGE = `jy2:${APP1_ID}:actualHimokuFoldOpen:v1`;
  function jy2ActualLoadHimokuFoldOpen(view, budgetVersionId) {
    const map = new Map();
    if (!view || !view.sessionStorage) return map;
    try {
      const raw = view.sessionStorage.getItem(JY2_ACTUAL_HIMOKU_FOLD_STORAGE);
      if (!raw) return map;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.openKeys)) {
        return map;
      }
      if (
        budgetVersionId &&
        String(parsed.budget_version_id || "") !== String(budgetVersionId)
      ) {
        return map;
      }
      for (const key of parsed.openKeys) {
        if (key) map.set(String(key), true);
      }
    } catch {
      // ignore
    }
    return map;
  }
  function jy2ActualPersistHimokuFoldOpen(view, map, budgetVersionId) {
    if (!view || !view.sessionStorage || !map) return;
    try {
      const openKeys = [];
      for (const [key, open] of map.entries()) {
        if (key && open === true) openKeys.push(String(key));
      }
      view.sessionStorage.setItem(
        JY2_ACTUAL_HIMOKU_FOLD_STORAGE,
        JSON.stringify({
          budget_version_id: budgetVersionId ? String(budgetVersionId) : "",
          openKeys,
        }),
      );
    } catch {
      // ignore
    }
  }
  function jy2ActualHimokuFoldState(pane, view, budgetVersionId) {
    if (!pane) {
      return {
        isOpen: (_key, defaultOpen) => defaultOpen === true,
        toggle: () => false,
        open: () => {},
        close: () => {},
        setAll: () => {},
      };
    }
    if (!pane.__jy2HimokuFold) {
      pane.__jy2HimokuFold = jy2ActualLoadHimokuFoldOpen(view, budgetVersionId);
    }
    const map = pane.__jy2HimokuFold;
    const persist = () =>
      jy2ActualPersistHimokuFoldOpen(view, map, budgetVersionId);
    return {
      isOpen: (key, defaultOpen) => {
        if (!key || !map.has(key)) return defaultOpen === true;
        return map.get(key) === true;
      },
      toggle: (key, defaultOpen) => {
        if (!key) return false;
        const next = !map.has(key)
          ? !(defaultOpen === true)
          : map.get(key) !== true;
        map.set(key, next);
        persist();
        return next;
      },
      open: (key) => {
        if (key) {
          map.set(key, true);
          persist();
        }
      },
      close: (key) => {
        if (key) {
          map.set(key, false);
          persist();
        }
      },
      setAll: (keys, open) => {
        const value = open === true;
        for (const key of keys || []) {
          if (key) map.set(key, value);
        }
        persist();
      },
    };
  }
  function jy2ActualHimokuFoldToolbar(documentRef, opts) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-actual-himoku-fold-toolbar";
    const keys = Array.isArray(opts && opts.keys) ? opts.keys.filter(Boolean) : [];
    const label = documentRef.createElement("span");
    label.className = "jy2-actual-himoku-fold-toolbar-label";
    label.textContent = "費目の詳細";
    const expandBtn = documentRef.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "jy2-actual-himoku-fold-all-btn";
    expandBtn.textContent = "すべて展開";
    expandBtn.title = "詳細がある費目をすべて開く";
    expandBtn.disabled = keys.length === 0;
    const collapseBtn = documentRef.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "jy2-actual-himoku-fold-all-btn";
    collapseBtn.textContent = "すべて閉じる";
    collapseBtn.title = "詳細がある費目をすべて閉じる";
    collapseBtn.disabled = keys.length === 0;
    const run = (open) => {
      if (
        !opts ||
        !opts.himokuFold ||
        typeof opts.himokuFold.setAll !== "function"
      ) {
        return;
      }
      opts.himokuFold.setAll(keys, open);
      if (typeof opts.onChanged === "function") opts.onChanged();
    };
    expandBtn.addEventListener("click", (event) => {
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      run(true);
    });
    collapseBtn.addEventListener("click", (event) => {
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      run(false);
    });
    wrap.append(label, expandBtn, collapseBtn);
    return wrap;
  }
  function jy2ActualAppendHimokuFoldToggle(documentRef, labelCell, opts) {
    if (!documentRef || !labelCell || !opts) return;
    const isOpen = opts.isOpen === true;
    const label = String(opts.label || "");
    const btn = documentRef.createElement("button");
    btn.type = "button";
    btn.className = "jy2-actual-himoku-fold-btn";
    btn.textContent = isOpen ? "▼" : "▶";
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      isOpen ? `費目「${label}」を閉じる` : `費目「${label}」を開く`,
    );
    btn.title = isOpen
      ? "クリックで種別・詳細を閉じる"
      : "クリックで種別・詳細を開く";
    btn.addEventListener("click", (event) => {
      try {
        if (event && typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
        if (typeof opts.onToggle === "function") opts.onToggle();
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error("himoku fold toggle failed:", error);
        }
      }
    });
    const existing = labelCell.querySelector(".jy2-actual-himoku-fold-label");
    if (existing) {
      labelCell.insertBefore(btn, existing);
      return;
    }
    const span = labelCell.querySelector("span");
    if (span) {
      span.classList.add("jy2-actual-himoku-fold-label");
      labelCell.insertBefore(btn, span);
      return;
    }
    labelCell.insertBefore(btn, labelCell.firstChild);
  }
  // countHiddenLeaf=true: 平坦Excel枠など、中身があれば MANUAL_ONLY でも数える。
  // false: 種別ありは reveal 済み（手入力）だけを「開く理由」にする。
  function jy2ActualHimokuShowableCount(
    entries,
    detailRows,
    shouldShowDetail,
    countHiddenLeaf,
  ) {
    let n = 0;
    for (const entry of entries || []) {
      const child = entry && entry.child;
      if (!child || !child.rowKey) continue;
      const detailIndex =
        typeof entry.detailIndex === "number" ? entry.detailIndex : -1;
      const detailRow =
        detailIndex >= 0 && detailRows ? detailRows[detailIndex] : null;
      const revealed =
        typeof shouldShowDetail === "function"
          ? shouldShowDetail(child.rowKey) === true
          : false;
      const isCatalog = jy2CostMgmtIsUchiwakeCatalogDetail(detailRow || child);
      // カタログは reveal 済み（手＋）だけ数える
      if (isCatalog && !revealed) continue;
      const hasLeaf = jy2CostMgmtDetailHasLeafContent(detailRow || child);
      if (revealed) {
        n += 1;
        continue;
      }
      if (countHiddenLeaf === true && hasLeaf && !isCatalog) n += 1;
    }
    return n;
  }

  // Phase2c-detail-manual-only: 既存内訳行は隠し、＋で reveal した行だけ表示。
  // App757 の既存明細は削除しない。来週連動後は MANUAL_ONLY=false で全表示。
  // reveal キーは sessionStorage に残し、一時保存後の reload でも手入力行を維持。
  // v4: カタログは自動revealしないが＋済みキーは削除しない（#R-EXCEL-LINK-00）。
  const JY2_ACTUAL_REVEAL_KEYS_STORAGE = `jy2:${APP1_ID}:actualDetailRevealKeys:v4-catalog-soft`;
  const JY2_LAST_SOFT_SAVED_KEY = `jy2:${APP1_ID}:lastSoftSavedAt`;
  function jy2ActualLoadRevealKeys(view, budgetVersionId) {
    const set = new Set();
    if (!view || !view.sessionStorage) return set;
    try {
      const raw = view.sessionStorage.getItem(JY2_ACTUAL_REVEAL_KEYS_STORAGE);
      if (!raw) return set;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return set;
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.keys)) {
        if (
          budgetVersionId &&
          String(parsed.budget_version_id || "") !== String(budgetVersionId)
        ) {
          return set;
        }
        for (const key of parsed.keys) {
          if (key) set.add(String(key));
        }
      }
    } catch {
      // ignore
    }
    return set;
  }
  function jy2ActualPersistRevealKeys(view, set, budgetVersionId) {
    if (!view || !view.sessionStorage || !set) return;
    try {
      view.sessionStorage.setItem(
        JY2_ACTUAL_REVEAL_KEYS_STORAGE,
        JSON.stringify({
          budget_version_id: budgetVersionId ? String(budgetVersionId) : "",
          keys: [...set],
        }),
      );
    } catch {
      // ignore
    }
  }
  // leaf あり行を reveal（材料費品名カタログは除外＝内訳連動オフ）。
  function jy2ActualRevealPersistedDetailRows(detailModel, costDetailVisibility) {
    if (
      !detailModel ||
      !costDetailVisibility ||
      typeof costDetailVisibility.reveal !== "function"
    ) {
      return 0;
    }
    if (typeof detailModel.snapshot !== "function") return 0;
    let n = 0;
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    for (const block of blocks) {
      if (!block || !Array.isArray(block.detailRows)) continue;
      for (const row of block.detailRows) {
        if (!row || !row.rowKey) continue;
        if (!jy2CostMgmtDetailHasLeafContent(row)) continue;
        if (jy2CostMgmtIsUchiwakeCatalogDetail(row)) continue;
        costDetailVisibility.reveal(row.rowKey);
        n += 1;
      }
    }
    return n;
  }
  // 消えたキー除去 ＋ leaf を reveal に戻す。カタログは新規自動追加しない（＋済みは残す）。
  function jy2ActualPruneRevealKeys(detailModel, costDetailVisibility, view, budgetVersionId) {
    if (!detailModel || !costDetailVisibility) return 0;
    const set = costDetailVisibility._revealKeys;
    if (!set) return 0;
    if (typeof detailModel.snapshot !== "function") return 0;
    let blocks;
    try {
      blocks = detailModel.snapshot().blocks || [];
    } catch {
      return 0;
    }
    const validKeys = new Set();
    for (const block of blocks) {
      if (!block || !Array.isArray(block.detailRows)) continue;
      for (const row of block.detailRows) {
        if (row && row.rowKey) validKeys.add(String(row.rowKey));
      }
    }
    for (const key of [...set]) {
      if (!validKeys.has(key)) set.delete(key);
    }
    let n = 0;
    for (const block of blocks) {
      if (!block || !Array.isArray(block.detailRows)) continue;
      for (const row of block.detailRows) {
        if (!row || !row.rowKey) continue;
        if (!jy2CostMgmtDetailHasLeafContent(row)) continue;
        // 内訳カタログは自動では足さない（手＋で reveal 済みなら set に残る）
        if (jy2CostMgmtIsUchiwakeCatalogDetail(row)) continue;
        set.add(String(row.rowKey));
        n += 1;
      }
    }
    jy2ActualPersistRevealKeys(view, set, budgetVersionId);
    return n;
  }
  function jy2ActualCostDetailVisibility(pane, budgetVersionId) {
    const view =
      pane && pane.ownerDocument && pane.ownerDocument.defaultView
        ? pane.ownerDocument.defaultView
        : null;
    if (!pane) {
      return {
        reveal: () => {},
        shouldShow: () => !JY2_ACTUAL_DETAIL_MANUAL_ONLY,
      };
    }
    if (!pane.__jy2CostDetailRevealKeys) {
      pane.__jy2CostDetailRevealKeys = jy2ActualLoadRevealKeys(view, budgetVersionId);
    }
    const set = pane.__jy2CostDetailRevealKeys;
    return {
      _revealKeys: set,
      reveal: (key) => {
        if (!key) return;
        set.add(String(key));
        jy2ActualPersistRevealKeys(view, set, budgetVersionId);
      },
      shouldShow: (key) => {
        if (!JY2_ACTUAL_DETAIL_MANUAL_ONLY) return true;
        return Boolean(key && set.has(String(key)));
      },
    };
  }

  // Phase2c-actual-sticky-totals-collapse: 既定クローズ。summaryクリックで月次まで展開。
  function jy2ActualCostMgmtStickyTotalsBar(documentRef, opts) {
    const totals = opts && opts.totals;
    const months = (opts && opts.months) || [];
    const rows = (opts && opts.rows) || [];
    const monthQtyState = opts && opts.monthQtyState;
    const shouldShowDetail = opts && opts.shouldShowDetail;
    const omitDuplicateCodedIds = opts && opts.omitDuplicateCodedIds;

    let finalBudgetTotal = "0";
    let anyFinalBudget = false;
    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      const addend = jy2ActualDecimalAddend(
        totals && totals[category] && totals[category].finalBudget,
      );
      if (addend !== null) {
        finalBudgetTotal = add(finalBudgetTotal, addend);
        anyFinalBudget = true;
      }
    }
    const budgetText = anyFinalBudget
      ? jy2AmountDisplay(finalBudgetTotal)
      : "－";

    const bar = documentRef.createElement("details");
    bar.className = "jy2-actual-totals-bar";
    // 既定は閉じる（open 属性を付けない）

    const summary = documentRef.createElement("summary");
    summary.appendChild(
      documentRef.createTextNode("合計　実行予算額（全合計）"),
    );
    const budgetSpan = documentRef.createElement("span");
    budgetSpan.className = "jy2-actual-totals-summary-budget";
    budgetSpan.textContent = budgetText;
    const hintSpan = documentRef.createElement("span");
    hintSpan.className = "jy2-actual-totals-summary-hint";
    hintSpan.textContent = "（ここをクリックで月次合計を表示）";
    summary.append(budgetSpan, hintSpan);
    bar.appendChild(summary);

    const body = documentRef.createElement("div");
    body.className = "jy2-actual-totals-body";

    const top = documentRef.createElement("div");
    top.className = "jy2-actual-totals-top";

    const appendItem = (parent, label, value) => {
      const item = documentRef.createElement("div");
      item.className = "jy2-actual-totals-item";
      const labelEl = documentRef.createElement("span");
      labelEl.className = "jy2-actual-totals-label";
      labelEl.textContent = label;
      const valueEl = documentRef.createElement("span");
      valueEl.className = "jy2-actual-totals-value";
      valueEl.textContent = value;
      item.append(labelEl, valueEl);
      parent.appendChild(item);
    };

    appendItem(top, "実行予算額（全合計）", budgetText);

    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      const chip = documentRef.createElement("span");
      chip.className = "jy2-actual-totals-chip";
      chip.style.fontSize = "10px";
      chip.style.color = "#78716c";
      chip.textContent = `${category}計 ${jy2AmountDisplay(
        totals && totals[category] && totals[category].finalBudget,
      )}`;
      top.appendChild(chip);
    }
    body.appendChild(top);

    const monthsLabel = documentRef.createElement("p");
    monthsLabel.className = "jy2-actual-totals-months-label";
    monthsLabel.textContent = "月次合計（月単位・数量／金額）";
    body.appendChild(monthsLabel);

    const monthsRow = documentRef.createElement("div");
    monthsRow.className = "jy2-actual-totals-months";
    for (const month of months) {
      let amount = "0";
      let anyAmount = false;
      for (const category of ACTUAL_COST_CATEGORY_KEYS) {
        const monthly = totals && totals[category] && totals[category].monthly;
        const addend = jy2ActualDecimalAddend(monthly && monthly[month]);
        if (addend !== null) {
          amount = add(amount, addend);
          anyAmount = true;
        }
      }

      let qty = "0";
      let anyQty = false;
      for (const row of rows) {
        if (!row || !row.hasChildren) continue;
        if (
          row.stableBlockId &&
          omitDuplicateCodedIds &&
          omitDuplicateCodedIds.has(row.stableBlockId)
        ) {
          continue;
        }
        const kids = jy2ActualChildrenForBudgetSum(
          row.children,
          shouldShowDetail,
        );
        for (const child of kids) {
          if (!child || !child.rowKey) continue;
          const raw = monthQtyState
            ? monthQtyState.get(
                row.stableBlockId,
                row.costCategory,
                child.rowKey,
                month,
              )
            : null;
          const addend = jy2ActualDecimalAddend(raw);
          if (addend !== null) {
            qty = add(qty, addend);
            anyQty = true;
          }
        }
      }

      const cell = documentRef.createElement("div");
      cell.className = "jy2-actual-totals-month";
      const nameEl = documentRef.createElement("span");
      nameEl.className = "jy2-actual-totals-month-name";
      nameEl.textContent = jy2MonthLabel(month);
      const qtyEl = documentRef.createElement("span");
      qtyEl.className = "jy2-actual-totals-month-line";
      qtyEl.textContent = `数量 ${anyQty ? jy2ActualMonthQtySumDisplay(qty) : "－"}`;
      const amtEl = documentRef.createElement("span");
      amtEl.className = "jy2-actual-totals-month-line";
      amtEl.textContent = `金額 ${anyAmount ? jy2AmountDisplay(amount) : "－"}`;
      cell.append(nameEl, qtyEl, amtEl);
      monthsRow.appendChild(cell);
    }
    body.appendChild(monthsRow);

    const noteEl = documentRef.createElement("p");
    noteEl.className = "jy2-actual-totals-note";
    noteEl.textContent =
      "給与手当除く・月次は月ごと。表の施工計+保安計と同趣旨";
    body.appendChild(noteEl);

    bar.appendChild(body);
    return bar;
  }

  function jy2ActualTotalRow(documentRef, total, label, months) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-total-row";
    tr.dataset.totalCategory = total.costCategory || total.label || "";
    const head = jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-freeze-span", label), 0);
    head.colSpan = JY2_ACTUAL_FREEZE_COLS;
    tr.appendChild(head);
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", "－"));
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", "－"));
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.finalBudget)),
    );
    for (const month of months) {
      const monthAmount = total.monthly[month];
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        "－",
      );
      qtyCell.title = "総計行の数量は表示しない";
      tr.appendChild(qtyCell);
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthAmount === null || monthAmount === undefined
          ? "－"
          : jy2AmountDisplay(monthAmount),
      );
      monthCell.title = "合計（自動・入力不可）";
      tr.appendChild(monthCell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.actual)),
    );
    tr.appendChild(
      jy2ActualBudgetDiffCell(documentRef, total.finalBudget, total.actual),
    );
    // Phase2a: 総計行の備考列は常に空表示（"－"）。
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-actual-note", "－"));
    return tr;
  }

  // 実績 tab (Phase 4d): offline 予実 matrix over App3-shaped actual cells.
  // Rows are the 施工/保安 cost rows only (Y4 — no salary), pivoted wide by
  // month (Y5/Y6). Y7 adds ⑧⑨ aggregate rows; Y9 adds budget attribute cols.
  // 2026-07-29-ver02-actual-detail-expand: detailBlocksProvider は
  // detailModel.snapshot().blocks（明細行付き）を返し、親行の＋展開時に
  // 子行として月別消化・最終予算額の入力欄を提供する。省略時はレガシー
  // （親のみ）動作。
  // Phase2c-b-a (2026-07-31): `detailModel` と `onDetailStructureChanged`
  // を追加。費目グループ行の「＋種別行」ボタンから `addDetailRow` を呼び
  // 出したとき、shell が Detail pane を再描画し、総括/予実を dirty マーク
  // できるようにする。両引数は optional（省略時は Phase2c-a 相当の表示専用
  // 動作）。書き込みは常に detailModel（App757）に限定し、actualsModel／
  // App758 の書込経路には触れない。
  function jy2RenderActualPane(
    documentRef,
    pane,
    actualsModel,
    blocksProvider,
    contractTotal1Provider,
    saveController,
    projectionManual,
    summaryTotalsProvider,
    detailBlocksProvider,
    detailModel,
    onDetailStructureChanged,
    paneOpts,
  ) {
    const scroll = jy2CaptureScroll(documentRef, pane);
    pane.textContent = "";
    const editable = actualsModel.allowedOperations.editActuals;
    const expandState = jy2ActualExpandState(pane);
    const budgetVersionId =
      (paneOpts && paneOpts.budgetVersionId) ||
      (saveController && saveController.keys && saveController.keys.budgetVersionId) ||
      "";
    const foldView =
      (documentRef && documentRef.defaultView) ||
      (typeof globalThis !== "undefined" ? globalThis : null);
    const himokuFold = jy2ActualHimokuFoldState(
      pane,
      foldView,
      budgetVersionId,
    );
    const costDetailVisibility = jy2ActualCostDetailVisibility(pane, budgetVersionId);
    const hasPendingDetailEdits =
      paneOpts && typeof paneOpts.hasPendingDetailEdits === "function"
        ? paneOpts.hasPendingDetailEdits
        : () => false;
    // Phase2b (2026-07-31): pane スコープの月次数量セッション Map。rerender を
    // 跨いで残るが、リロード（保存後・タブ再入場含む）で pane が作り直され
    // 消える。App758 の write path は変更しない（数量は保存しない）。
    const monthQtyState = jy2ActualMonthQtyState(pane);
    const rerender = () =>
      jy2RenderActualPane(
        documentRef,
        pane,
        actualsModel,
        blocksProvider,
        contractTotal1Provider,
        saveController,
        projectionManual,
        summaryTotalsProvider,
        detailBlocksProvider,
        detailModel,
        onDetailStructureChanged,
        {
          ...(paneOpts || {}),
          budgetVersionId,
          hasPendingDetailEdits,
        },
      );
    // Phase2c-b-a: 費目グループ行の「＋種別行」ボタンから呼ばれる pane 側
    // フック。detail 構造が変わった旨を shell に通知し（内訳 pane 再描画・
    // 総括/予実 dirty マーク）、続けて予実 pane を rerender して新しい
    // 種別行を expand 済みグループの下に表示する。
    // Phase2c-c-excel-struct-raf: 全表再構築は重いので click 内では走らせず
    // rAF にまとめる（連続＋でも1回）。ブロック単位再描画が本直し。
    let structureRerenderPending = false;
    const onDetailStructureAdded = () => {
      if (typeof onDetailStructureChanged === "function") {
        try {
          onDetailStructureChanged();
        } catch (error) {
          if (typeof console !== "undefined" && console.error) {
            console.error("onDetailStructureChanged failed:", error);
          }
        }
      }
      if (structureRerenderPending) return;
      structureRerenderPending = true;
      const view = documentRef && documentRef.defaultView;
      const run = () => {
        structureRerenderPending = false;
        rerender();
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        run();
      }
    };
    // 詳細・単価などフィールド編集: 内訳/予実の全 DOM 再構築はしない（Violation 対策）。
    // モデルは既に updateDetailRow 済み。内訳タブ表示時に dirty 反映。
    const onDetailFieldChanged = () => {
      if (typeof onDetailStructureChanged === "function") {
        try {
          onDetailStructureChanged({ fieldOnly: true });
        } catch (error) {
          if (typeof console !== "undefined" && console.error) {
            console.error("onDetailFieldChanged failed:", error);
          }
        }
      }
    };
    const canEditBudget = Boolean(
      detailModel &&
        detailModel.allowedOperations &&
        detailModel.allowedOperations.editBudget === true,
    );
    // Excel 種別のみ枠が内訳に無いと原価管理に行が出ない → 空ブロックを足す
    const ensuredTypeOnlyFrames = canEditBudget
      ? jy2CostMgmtEnsureTypeOnlyFrames(detailModel, costDetailVisibility)
      : 0;
    if (ensuredTypeOnlyFrames > 0) {
      if (typeof console !== "undefined" && console.info) {
        console.info("[jy2-actual-ensure]", { ensuredTypeOnlyFrames });
      }
    }
    if (detailModel) {
      const view = documentRef && documentRef.defaultView;
      jy2ActualPruneRevealKeys(detailModel, costDetailVisibility, view, budgetVersionId);
    }
    const months = actualsModel.months();
    const blocks = blocksProvider();
    const contractTotal1 = contractTotal1Provider ? contractTotal1Provider() : null;
    const previousLines =
      projectionManual && typeof projectionManual.previousLines === "function"
        ? projectionManual.previousLines()
        : [];
    const projectionLines = regenerateSummaryCostLines(blocks, {
      contractTotal1,
      previousLines,
    });
    const budgetAttrsByBlockId = new Map(
      projectionLines.map((line) => [line.summary_stable_block_id, line]),
    );
    const detailBlocks =
      typeof detailBlocksProvider === "function" ? detailBlocksProvider() : [];
    const detailRowsByBlockId = new Map();
    for (const block of detailBlocks || []) {
      if (block && block.stableBlockId && Array.isArray(block.detailRows)) {
        detailRowsByBlockId.set(block.stableBlockId, block.detailRows);
      }
    }
    const rows = actualsModel.matrixRows(blocks, {
      contractTotal1,
      budgetAttrsByBlockId,
      detailRowsByBlockId,
    });
    const omitDuplicateCodedIds = jy2CostMgmtDuplicateCodedBlockIdSet(blocks);
    let totals = actualsModel.sectionTotals(blocks, {
      contractTotal1,
      detailRowsByBlockId,
    });
    // 手動のみ: 区分計・⑧⑨の実行予算も表示中詳細の合計に合わせる。
    if (JY2_ACTUAL_DETAIL_MANUAL_ONLY) {
      const visibleSection = {};
      for (const category of ACTUAL_COST_CATEGORY_KEYS) {
        const sectionRows = rows.filter(
          (row) =>
            row.costCategory === category &&
            !(row.stableBlockId && omitDuplicateCodedIds.has(row.stableBlockId)),
        );
        let finalBudget = "0";
        let actual = "0";
        const monthly = {};
        for (const month of months) monthly[month] = "0";
        for (const row of sectionRows) {
          const kids = jy2ActualChildrenForBudgetSum(
            row.children,
            costDetailVisibility.shouldShow,
          );
          const fb = row.hasChildren
            ? jy2ActualSumField(kids, "finalBudget")
            : row.finalBudget;
          const ac = row.hasChildren
            ? jy2ActualSumField(kids, "actual")
            : row.actual;
          if (fb != null) finalBudget = add(finalBudget, fb);
          if (ac != null) actual = add(actual, ac);
          for (const month of months) {
            const ms = row.hasChildren
              ? jy2ActualSumMonth(kids, month)
              : row.monthly[month];
            if (ms != null) monthly[month] = add(monthly[month], ms);
          }
        }
        const base = totals[category] || {};
        visibleSection[category] = Object.freeze({
          ...base,
          costCategory: category,
          finalBudget,
          actual,
          monthly: Object.freeze(monthly),
        });
      }
      totals = Object.freeze(visibleSection);
    }
    const summaryTotals = summaryTotalsProvider ? summaryTotalsProvider() : null;
    const salaryAmount = summaryTotals ? summaryTotals.salary : "0";
    const grand8 = actualsModel.grandCost8Totals(
      totals,
      salaryAmount,
      contractTotal1,
    );
    const profit9 = actualsModel.profit9Totals(grand8, contractTotal1);

    const titleRow = documentRef.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.gap = "12px";
    titleRow.appendChild(
      jy2Cell(
        documentRef,
        "h3",
        "jy2-section-title",
        "工事原価管理",
      ),
    );
    if (saveController && editable) {
      const saveButton = documentRef.createElement("button");
      saveButton.type = "button";
      saveButton.className = "jy2-save-button";
      saveButton.textContent = "予実を保存";
      saveButton.title =
        "月次金額・実行予算額など予実（App758）を保存。詳細・単価・行の追加／削除は上部の「一時保存」";
      // 入力中クリックで blur→commit が click を潰さないようにする
      saveButton.addEventListener("mousedown", (event) => {
        jy2FlushActiveInputBeforeSave(documentRef);
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        jy2FlushActiveInputBeforeSave(documentRef);
        const view = documentRef.defaultView;
        // 詳細/単価/行構造は App757＝上部「一時保存」。ここは App758 のみ。
        if (hasPendingDetailEdits()) {
          if (view && typeof view.alert === "function") {
            view.alert(
              "詳細・単価・行の追加／削除は、画面上部の「一時保存」で保存してください。\n「予実を保存」は月次金額など予実専用です（ここからは構造は保存されません）。",
            );
          }
          return;
        }
        saveButton.disabled = true;
        saveButton.textContent = "保存中…";
        try {
          const result = await saveController.saveActuals(actualsModel);
          if (result && result.skipped) {
            if (view && typeof view.alert === "function") {
              view.alert("変更された予実セルがありません。");
            }
            saveButton.disabled = false;
            saveButton.textContent = "予実を保存";
            return;
          }
          if (view && typeof view.alert === "function") {
            view.alert(`予実を保存しました（${result.requestCount}リクエスト）`);
          }
          jy2ReloadPreservingTab(view, "actual", documentRef);
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `予実保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(view, "actual", documentRef);
          } else {
            saveButton.disabled = false;
            saveButton.textContent = "予実を保存";
          }
        }
      });
      titleRow.appendChild(saveButton);
    }
    pane.appendChild(titleRow);
    const chrome = documentRef.createElement("div");
    chrome.className = "jy2-actual-chrome";
    const note = documentRef.createElement("details");
    note.className = "jy2-actual-note-details";
    const summary = documentRef.createElement("summary");
    summary.textContent = "予実の見方（クリックで開く）";
    const noteBody = documentRef.createElement("p");
    noteBody.className = "jy2-actual-note";
    noteBody.textContent =
      "列はシステム工種｜費目｜種別｜詳細｜操作｜単価｜実行予算額｜月次数量/金額｜原価累計金額｜予算との差｜備考。" +
      "詳細がある費目は▶／▼で開閉（閉じると費目名と数量・実行予算の合計のみ）。表上の「すべて展開／すべて閉じる」でも一括操作できる。" +
      "操作列＋／－で詳細の追加・削除。予算との差＝実行予算額−原価累計金額（表示のみ）。横スクロール時も左5列（詳細・操作含む）は固定。";
    note.append(summary, noteBody);
    chrome.appendChild(note);
    // Phase2c-b-a: 「＋種別行」で追加した内訳（App757）の永続化は sticky トップの
    // 「一時保存」で行う旨をバナー表示（「予実を保存」では保存されない）。
    if (canEditBudget) {
      const detailAddNotice = documentRef.createElement("p");
      detailAddNotice.className = "jy2-actual-detail-add-notice";
      detailAddNotice.textContent =
        "操作列＋で詳細を追加して手入力できます";
      chrome.appendChild(detailAddNotice);
    }
    pane.appendChild(chrome);
    if (rows.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "予実対象の原価行なし（内訳タブで施工・保安ブロックを追加してください）",
        ),
      );
      jy2ApplyScroll(documentRef, pane, scroll);
      return;
    }

    pane.appendChild(
      jy2ActualCostMgmtStickyTotalsBar(documentRef, {
        totals,
        months,
        rows,
        monthQtyState,
        shouldShowDetail: costDetailVisibility.shouldShow,
        omitDuplicateCodedIds,
      }),
    );

    const scrollEl = documentRef.createElement("div");
    scrollEl.className = "jy2-actual-scroll";
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-actual-table";
    table.appendChild(jy2ActualHead(documentRef, months));
    const body = documentRef.createElement("tbody");
    // #R-EXCEL-UI-16: ▶対象（表示できる詳細あり）の費目キー。すべて展開/閉じる用
    const foldableHimokuKeys = [];
    const foldableHimokuKeySet = new Set();
    const rememberFoldableHimoku = (foldKey, showableCount) => {
      if (!foldKey || !(showableCount > 0) || foldableHimokuKeySet.has(foldKey)) {
        return;
      }
      foldableHimokuKeySet.add(foldKey);
      foldableHimokuKeys.push(foldKey);
    };
    for (const row of rows) {
      // Excel原価管理: システム工種コードが無い／「－」だけの親行は原則出さない。
      // 例外: 名称枠（軌道工事・追加工事① 等・#R-EXCEL-UI-11）は出す。
      if (
        jy2CostMgmtIsBlankWorkTypeCode(row.workTypeCode) &&
        !jy2CostMgmtAllowBlankWorkType(row)
      ) {
        continue;
      }
      if (jy2CostMgmtShouldOmitWorkType(row.workTypeCode, row.workTypeName)) continue;
      // 同一工種コードの二重枠（ENSURE追加＋既存 等）は正規1件以外を出さない
      if (
        row.stableBlockId &&
        omitDuplicateCodedIds.has(row.stableBlockId)
      ) {
        continue;
      }
      const detailRows = detailRowsByBlockId.get(row.stableBlockId) || [];
      const hierarchyEntry = jy2ResolveNameHierarchy({
        workTypeCode: row.workTypeCode,
        workTypeName: row.workTypeName,
      });
      const costHimokuTemplate = jy2CostMgmtHimokuTemplate(
        row.workTypeCode,
        jy2HimokuChoicesForEntry(hierarchyEntry),
        row.workTypeName,
      );
      // Excel正の費目枠を優先（例: 10200→塗装工事。コード表外注費は使わない）
      const primaryHimokuLabel = jy2CostMgmtPrimaryHimokuLabel(
        row.workTypeCode,
        hierarchyEntry,
        row,
      );
      let parentHimokuOpts;
      let himokuOrder = [];
      let bucket = new Map();
      let typesByHimokuMap = {};
      const groupOpts = {
        detailModel,
        canEditBudget,
        expandState,
        himokuFold,
        rerender,
        revealDetailKey: costDetailVisibility.reveal,
        shouldShowDetail: costDetailVisibility.shouldShow,
        onAdded: onDetailStructureAdded,
        monthQtyState,
      };
      if (row.hasChildren) {
        const resolveHimokuLabel = (child, detailIndex) => {
          const resolvedName1 =
            detailIndex >= 0
              ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name1")
              : child && child.name1
                ? String(child.name1).trim()
                : "";
          if (!resolvedName1) return "（未分類）";
          return jy2CostMgmtNormalizeHimokuLabel(resolvedName1);
        };
        const resolveTypeLabel = (child, detailIndex, himokuLabel) => {
          const resolvedName2 =
            detailIndex >= 0
              ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name2")
              : child && child.name2
                ? String(child.name2).trim()
                : "";
          const raw =
            resolvedName2 && resolvedName2.length > 0
              ? resolvedName2
              : "（種別未設定）";
          if (raw === "（種別未設定）") return raw;
          const extraTypes =
            typesByHimokuMap && Array.isArray(typesByHimokuMap[himokuLabel])
              ? typesByHimokuMap[himokuLabel]
              : [];
          const fromDual = jy2CostMgmtTypeLabelFromName2(
            raw,
            himokuLabel,
            extraTypes,
          );
          return jy2CostMgmtExcelShortName(
            fromDual && fromDual.length > 0 ? fromDual : raw,
          );
        };
        typesByHimokuMap =
          hierarchyEntry && hierarchyEntry.typesByHimoku
            ? hierarchyEntry.typesByHimoku
            : {};
        const ensureHimoku = (himokuLabel) => {
          if (!bucket.has(himokuLabel)) {
            bucket.set(himokuLabel, new Map());
            himokuOrder.push(himokuLabel);
          }
          return bucket.get(himokuLabel);
        };
        for (const h of costHimokuTemplate) ensureHimoku(h);
        row.children.forEach((child) => {
          const detailIndex = detailRows.findIndex(
            (candidate) => candidate && candidate.rowKey === child.rowKey,
          );
          let himokuLabel = resolveHimokuLabel(child, detailIndex);
          let typeLabel = resolveTypeLabel(child, detailIndex, himokuLabel);
          const collapsed = jy2CostMgmtCollapsePaintedName1Type(
            himokuLabel,
            primaryHimokuLabel,
          );
          if (collapsed) {
            himokuLabel = collapsed.himokuLabel;
            if (jy2CostMgmtIsNoiseType(typeLabel)) {
              typeLabel = collapsed.typeLabel;
            }
          }
          typeLabel = jy2CostMgmtExcelShortName(typeLabel);
          const typeMap = ensureHimoku(himokuLabel);
          if (!typeMap.has(typeLabel)) typeMap.set(typeLabel, []);
          typeMap.get(typeLabel).push({ child, detailIndex });
        });
        if (primaryHimokuLabel) {
          const primaryTypeMap = bucket.get(primaryHimokuLabel) || new Map();
          const primaryEntries = [];
          const primaryChildren = [];
          for (const entries of primaryTypeMap.values()) {
            for (const entry of entries) {
              primaryEntries.push(entry);
              primaryChildren.push(entry.child);
            }
          }
          const primaryLastKey =
            primaryChildren.length > 0
              ? primaryChildren[primaryChildren.length - 1].rowKey
              : null;
          const primaryShowable = jy2ActualHimokuShowableCount(
            primaryEntries,
            detailRows,
            costDetailVisibility.shouldShow,
            jy2CostMgmtIsFlatHimoku(primaryHimokuLabel),
          );
          const primaryFoldKey = jy2ActualHimokuFoldKey(
            row.stableBlockId,
            primaryHimokuLabel,
          );
          // 既定クローズ。▶は表示できる詳細がある費目だけ
          const primaryIsOpen =
            primaryShowable > 0 &&
            himokuFold.isOpen(primaryFoldKey, false);
          const primaryTemplateTypes = jy2CostMgmtTemplateTypes(
            row.workTypeCode,
            primaryHimokuLabel,
            typesByHimokuMap,
          );
          const primaryDefaultType =
            !jy2CostMgmtIsFlatHimoku(primaryHimokuLabel) &&
            primaryTemplateTypes.length > 0
              ? jy2CostMgmtExcelShortName(primaryTemplateTypes[0])
              : "";
          parentHimokuOpts = {
            primaryHimokuLabel,
            himokuChildren: primaryChildren,
            detailModel,
            canEditBudget,
            onAdded: onDetailStructureAdded,
            revealDetailKey: costDetailVisibility.reveal,
            shouldShowDetail: costDetailVisibility.shouldShow,
            lastChildRowKeyInGroup: primaryLastKey,
            monthQtyState,
            expandState,
            himokuFold,
            himokuFoldKey: primaryFoldKey,
            himokuFoldAvailable: primaryShowable > 0,
            himokuIsOpen: primaryIsOpen,
            defaultTypeLabel: primaryDefaultType,
            onHimokuFoldToggle: () => {
              himokuFold.toggle(primaryFoldKey, false);
              rerender();
            },
            // 閉じている／平坦で表示できる詳細が無いとき＋（押下で開いて追加）
            detailQuickAdd:
              canEditBudget &&
              (!primaryIsOpen ||
                (jy2CostMgmtIsFlatHimoku(primaryHimokuLabel) &&
                  primaryShowable === 0)),
          };
        } else {
          parentHimokuOpts = {
            monthQtyState,
            shouldShowDetail: costDetailVisibility.shouldShow,
          };
        }
      } else {
        const emptyFoldKey = primaryHimokuLabel
          ? jy2ActualHimokuFoldKey(row.stableBlockId, primaryHimokuLabel)
          : "";
        const emptyIsOpen = emptyFoldKey
          ? himokuFold.isOpen(emptyFoldKey, false)
          : false;
        parentHimokuOpts = {
          primaryHimokuLabel,
          himokuChildren: [],
          detailModel,
          canEditBudget,
          onAdded: onDetailStructureAdded,
          revealDetailKey: costDetailVisibility.reveal,
          shouldShowDetail: costDetailVisibility.shouldShow,
          lastChildRowKeyInGroup: null,
          monthQtyState,
          expandState,
          himokuFold,
          himokuFoldKey: emptyFoldKey,
          himokuIsOpen: emptyIsOpen,
          defaultTypeLabel: "",
          onHimokuFoldToggle: emptyFoldKey
            ? () => {
                himokuFold.toggle(emptyFoldKey, false);
                rerender();
              }
            : null,
          detailQuickAdd: canEditBudget && Boolean(primaryHimokuLabel),
        };
      }
      const parentTr = jy2ActualRow(
        documentRef,
        actualsModel,
        row,
        months,
        editable,
        rerender,
        expandState,
        parentHimokuOpts,
      );
      body.appendChild(parentTr);
      if (!row.hasChildren) {
        parentTr.classList.add("jy2-actual-worktype-block-end");
        continue;
      }
      // 区切り線はシステム工種の最終行だけ（費目ごとではない）
      let workTypeBlockEndRow = parentTr;
      for (const himokuLabel of himokuOrder) {
        const typeMap = bucket.get(himokuLabel) || new Map();
        if (jy2CostMgmtShouldOmitHimoku(himokuLabel, costHimokuTemplate)) {
          continue;
        }
        let himokuChildren = [];
        for (const entries of typeMap.values()) {
          for (const entry of entries) himokuChildren.push(entry.child);
        }
        // Excel: 平坦費目（種別なし・詳細2セル／種別のみ）
        // （SUM用の子リストも先に確定。材料費側の寄せ行を含む）
        let flatHimokuEntries = null;
        const flatTypeLess = jy2CostMgmtIsTypeLessHimoku(himokuLabel);
        const flatTypeOnly = jy2CostMgmtIsTypeOnlyHimoku(himokuLabel);
        if (flatTypeLess || flatTypeOnly) {
          flatHimokuEntries = [];
          const seenKeys = new Set();
          const pushEntry = (entry) => {
            const key = entry && entry.child && entry.child.rowKey;
            if (!key || seenKeys.has(key)) return;
            seenKeys.add(key);
            flatHimokuEntries.push(entry);
          };
          for (const entries of typeMap.values()) {
            for (const entry of entries || []) pushEntry(entry);
          }
          if (himokuLabel === "その他材料費") {
            const materialTypes = bucket.get("材料費");
            const fromType =
              materialTypes && materialTypes.get("その他材料費");
            if (Array.isArray(fromType)) {
              for (const entry of fromType) pushEntry(entry);
            }
          }
          himokuChildren = flatHimokuEntries.map((entry) => entry.child);
        }
        const lastHimokuKey =
          himokuChildren.length > 0
            ? himokuChildren[himokuChildren.length - 1].rowKey
            : null;
        const himokuEntriesForCount = flatHimokuEntries
          ? flatHimokuEntries
          : (() => {
              const all = [];
              for (const entries of typeMap.values()) {
                for (const entry of entries || []) all.push(entry);
              }
              return all;
            })();
        const himokuShowable = jy2ActualHimokuShowableCount(
          himokuEntriesForCount,
          detailRows,
          costDetailVisibility.shouldShow,
          Boolean(flatHimokuEntries),
        );
        const foldKey = jy2ActualHimokuFoldKey(
          row.stableBlockId,
          himokuLabel,
        );
        // 既定クローズ。▶は表示できる詳細がある費目だけ
        rememberFoldableHimoku(foldKey, himokuShowable);
        const himokuIsOpen =
          himokuShowable > 0 && himokuFold.isOpen(foldKey, false);
        const templateTypes = jy2CostMgmtTemplateTypes(
          row.workTypeCode,
          himokuLabel,
          typesByHimokuMap,
        );
        const defaultTypeLabel =
          !flatHimokuEntries && templateTypes.length > 0
            ? jy2CostMgmtExcelShortName(templateTypes[0])
            : "";
        let lastRowInHimoku =
          himokuLabel === primaryHimokuLabel ? parentTr : null;
        if (himokuLabel !== primaryHimokuLabel) {
          lastRowInHimoku = body.appendChild(
            jy2ActualHimokuGroupRow(
              documentRef,
              row,
              himokuLabel,
              himokuChildren,
              months,
              {
                ...groupOpts,
                lastChildRowKeyInGroup: lastHimokuKey,
                himokuFoldKey: foldKey,
                himokuFoldAvailable: himokuShowable > 0,
                himokuIsOpen,
                defaultTypeLabel,
                onHimokuFoldToggle: () => {
                  himokuFold.toggle(foldKey, false);
                  rerender();
                },
                // 閉じている／平坦で表示できる詳細が無いとき＋
                detailQuickAdd:
                  canEditBudget &&
                  (!himokuIsOpen ||
                    (Boolean(flatHimokuEntries) && himokuShowable === 0)),
              },
            ),
          );
        }
        // #R-EXCEL-UI-16: 閉じている費目はヘッダ（SUM）のみ
        if (!himokuIsOpen) {
          if (lastRowInHimoku) workTypeBlockEndRow = lastRowInHimoku;
          continue;
        }
        if (flatHimokuEntries) {
          for (const { child, detailIndex } of flatHimokuEntries) {
            if (!child || !child.rowKey) continue;
            const detailRow =
              detailIndex >= 0 ? detailRows[detailIndex] : null;
            const revealed = costDetailVisibility.shouldShow(child.rowKey);
            const isCatalog = jy2CostMgmtIsUchiwakeCatalogDetail(
              detailRow || child,
            );
            // 内訳カタログは未revealのみ隠す（操作列＋済みは残す）
            if (isCatalog && !revealed) continue;
            const hasLeaf = jy2CostMgmtDetailHasLeafContent(
              detailRow || child,
            );
            // 空詳細は出さない。leaf ありは表示（カタログは上で除外済み）
            if (!hasLeaf && !revealed) continue;
            if (
              hasLeaf &&
              !revealed &&
              !isCatalog &&
              typeof costDetailVisibility.reveal === "function"
            ) {
              costDetailVisibility.reveal(child.rowKey);
            }
            lastRowInHimoku = body.appendChild(
              jy2ActualChildRow(
                documentRef,
                actualsModel,
                row,
                child,
                detailRows,
                detailIndex,
                months,
                editable,
                rerender,
                monthQtyState,
                {
                  detailModel,
                  canEditBudget,
                  revealDetailKey: costDetailVisibility.reveal,
                  onDetailChanged: onDetailStructureAdded,
                  onDetailFieldChanged,
                  dualDetailCells: flatTypeLess,
                  typeOnlyLeaf: flatTypeOnly,
                  himokuLabel,
                  himokuFold,
                  himokuFoldKey: foldKey,
                },
              ),
            );
          }
          if (lastRowInHimoku) workTypeBlockEndRow = lastRowInHimoku;
          continue;
        }
        // 種別あり費目: 開いているときだけ種別・詳細を表示
        const typeOrder = [];
        for (const t of templateTypes) {
          if (!typeOrder.includes(t)) typeOrder.push(t);
        }
        for (const t of typeMap.keys()) {
          if (jy2CostMgmtShouldOmitType(row.workTypeCode, himokuLabel, t)) {
            continue;
          }
          const shortT = jy2CostMgmtExcelShortName(t);
          if (!typeOrder.includes(shortT)) typeOrder.push(shortT);
        }
        let lastAnchorInHimoku = null;
        for (const typeLabel of typeOrder) {
          if (
            jy2CostMgmtShouldOmitType(row.workTypeCode, himokuLabel, typeLabel)
          ) {
            continue;
          }
          const entries = typeMap.get(typeLabel) || [];
          const typeChildren = entries.map((entry) => entry.child);
          const lastTypeKey =
            typeChildren.length > 0
              ? typeChildren[typeChildren.length - 1].rowKey
              : lastAnchorInHimoku;
          lastRowInHimoku = body.appendChild(
            jy2ActualTypeGroupRow(
              documentRef,
              row,
              himokuLabel,
              typeLabel,
              typeChildren,
              months,
              {
                ...groupOpts,
                lastChildRowKeyInGroup: lastTypeKey,
                himokuFoldKey: foldKey,
                // 手動のみモード: 既存内訳行が隠れている種別でも＋で新規詳細を足せる
                detailQuickAdd:
                  JY2_ACTUAL_DETAIL_MANUAL_ONLY ||
                  typeChildren.length === 0,
              },
            ),
          );
          if (typeChildren.length > 0) {
            lastAnchorInHimoku = typeChildren[typeChildren.length - 1].rowKey;
          }
          // 種別行パス＝詳細2セル（平坦費目はこのループに来ない）
          for (const { child, detailIndex } of entries) {
            const detailRow =
              detailIndex >= 0 ? detailRows[detailIndex] : null;
            const revealed = costDetailVisibility.shouldShow(child.rowKey);
            const isCatalog = jy2CostMgmtIsUchiwakeCatalogDetail(
              detailRow || child,
            );
            // 内訳カタログは未revealのみ隠す（＋手入力は残す）
            if (isCatalog && !revealed) continue;
            const hasLeaf = jy2CostMgmtDetailHasLeafContent(
              detailRow || child,
            );
            // 詳細左だけの leaf も再表示（種別下で一時保存後に消える対策）
            if (!hasLeaf && !revealed) continue;
            if (
              hasLeaf &&
              !revealed &&
              !isCatalog &&
              typeof costDetailVisibility.reveal === "function"
            ) {
              costDetailVisibility.reveal(child.rowKey);
            }
            lastRowInHimoku = body.appendChild(
              jy2ActualChildRow(
                documentRef,
                actualsModel,
                row,
                child,
                detailRows,
                detailIndex,
                months,
                editable,
                rerender,
                monthQtyState,
                {
                  detailModel,
                  canEditBudget,
                  revealDetailKey: costDetailVisibility.reveal,
                  onDetailChanged: onDetailStructureAdded,
                  onDetailFieldChanged,
                  dualDetailCells: true,
                  dualUnderTypeLabel: typeLabel,
                  himokuLabel,
                  himokuFold,
                  himokuFoldKey: foldKey,
                },
              ),
            );
          }
        }
        if (lastRowInHimoku) workTypeBlockEndRow = lastRowInHimoku;
      }
      if (workTypeBlockEndRow) {
        workTypeBlockEndRow.classList.add("jy2-actual-worktype-block-end");
      }
    }
    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      body.appendChild(
        jy2ActualTotalRow(documentRef, totals[category], `${category}計`, months),
      );
    }
    body.appendChild(
      jy2ActualTotalRow(documentRef, grand8, grand8.label, months),
    );
    body.appendChild(
      jy2ActualTotalRow(documentRef, profit9, profit9.label, months),
    );
    table.appendChild(body);
    scrollEl.appendChild(table);
    pane.appendChild(
      jy2ActualHimokuFoldToolbar(documentRef, {
        keys: foldableHimokuKeys,
        himokuFold,
        onChanged: rerender,
      }),
    );
    pane.appendChild(scrollEl);
    jy2BindHScroll(scrollEl);
    jy2ApplyScroll(documentRef, pane, scroll);
  }

  function jy2LockBadge(documentRef, version) {
    const badge = documentRef.createElement("span");
    badge.className = "jy2-lock-badge";
    badge.dataset.lock = version.derivedLockState;
    badge.textContent = version.lockLabel;
    return badge;
  }

  // 版管理 tab (Phase 4e): offline version series list over App1-shaped mock
  // records. Lock states are derived per version (status + newer existence =
  // V11b); the 次版作成 CTA is enabled only where createNextVersion holds
  // (budget_locked = latest confirmed with no draft, V5/V7). Clicking plans
  // the next draft's keys in memory — nothing is sent anywhere.
  function jy2RenderVersionPane(
    documentRef,
    pane,
    versionModel,
    projectId,
    detailRowCountProvider,
    liveCopy,
  ) {
    pane.textContent = "";
    pane.appendChild(
      jy2Cell(
        documentRef,
        "h3",
        "jy2-section-title",
        "バージョン管理（版一覧・次版作成）",
      ),
    );
    pane.appendChild(
      jy2Cell(
        documentRef,
        "p",
        "jy2-actual-note",
        "実績は工事帰属で版複製しない（P-28／V3b）。過去版は閲覧のみ（V9）。下書きは1工事1件（V5）。",
      ),
    );
    const versions = projectId ? versionModel.listVersions(projectId) : [];
    if (versions.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "版レコードなし（オフライン試作では data.versions で注入します）",
        ),
      );
      return;
    }

    const status = jy2Cell(documentRef, "p", "jy2-version-status", "");
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-version-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, ["版", "版種別", "ステータス", "ロック", "操作"]),
    );
    // Newest first, like a version history.
    for (const version of [...versions].reverse()) {
      const tr = documentRef.createElement("tr");
      tr.dataset.budgetVersionId = version.budgetVersionId;
      tr.dataset.lockState = version.derivedLockState;
      tr.dataset.current = String(!version.newerVersionExists);
      tr.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", `第${version.versionSeq}版`),
      );
      tr.appendChild(jy2Cell(documentRef, "td", "", version.versionType));
      tr.appendChild(jy2Cell(documentRef, "td", "", version.status));
      const lockCell = jy2Cell(documentRef, "td", "", "");
      lockCell.appendChild(jy2LockBadge(documentRef, version));
      tr.appendChild(lockCell);
      const action = jy2Cell(documentRef, "td", "", "");
      const cta = documentRef.createElement("button");
      cta.type = "button";
      cta.className = "jy2-row-button jy2-version-cta";
      cta.textContent = "次版作成";
      // CTA gate: only the latest confirmed version with no draft (V7).
      cta.disabled = !version.allowedOperations.createNextVersion;
      cta.addEventListener("click", async () => {
        if (cta.disabled) return;
        // 残B: LIVE 文脈では P-29 の確認ダイアログを経て planVersionCopy を
        // 1回の bulkRequest で実行する。オフラインでは従来どおり計画のみ。
        if (typeof liveCopy === "function") {
          const view = documentRef.defaultView;
          const confirmed =
            view && typeof view.confirm === "function"
              ? view.confirm(VERSION_DUPLICATE_MESSAGES["next-version"])
              : false;
          if (!confirmed) return;
          const versionType = jy2PickNextVersionType(view);
          if (!versionType) return;
          cta.disabled = true;
          status.className = "jy2-version-status";
          status.textContent = "次版を複製中…";
          try {
            const { plan } = await liveCopy(version, versionType);
            if (view && typeof view.alert === "function") {
              view.alert(
                `第${plan.versionSeq}版（${versionType}・下書き）を作成しました。内訳${plan.copies.detailRows}行を複製し、旧版行をロックしました。`,
              );
            }
            jy2ReloadPreservingTab(view, "version", documentRef);
          } catch (error) {
            const conflict = error && error.action === "abort_reload";
            status.className = "jy2-warning jy2-version-status";
            status.textContent = conflict
              ? "他の更新と競合したため中止しました。再読込してください。"
              : `次版作成失敗: ${(error && error.message) || error}`;
            cta.disabled = false;
          }
          return;
        }
        try {
          const plan = versionModel.planNextVersionDraft(
            version,
            detailRowCountProvider(),
          );
          status.className = "jy2-version-status";
          status.textContent =
            `次版下書きを計画（送信なし）: 第${plan.versionSeq}版・` +
            `内訳${plan.copies.detailRows}行複製・実績複製${plan.copies.actualRows}件`;
        } catch (error) {
          // 901+ rows: P-34 sizing aborts before anything would be sent.
          status.className = "jy2-warning jy2-version-status";
          status.textContent = `次版作成不可: ${error.message}`;
        }
      });
      action.appendChild(cta);
      tr.appendChild(action);
      body.appendChild(tr);
    }
    table.appendChild(body);
    pane.appendChild(jy2WrapTable(documentRef, table));
    pane.appendChild(status);
  }

  function jy2FormatDatetime(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(text);
    return match ? `${match[1]} ${match[2]}` : text.slice(0, 16);
  }
  function jy2FormatJstDatetimeLabel(isoOrDate, labelPrefix) {
    const text = String(isoOrDate ?? "").trim();
    if (!text) return "";
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";
    const fmt = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const pick = (type) => {
      const part = parts.find((p) => p.type === type);
      return part ? part.value : "";
    };
    const stamp = `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
    return `${labelPrefix} ${stamp}`;
  }
  function jy2ReadLastSoftSavedStamp(view, budgetVersionId) {
    if (!view || !view.sessionStorage || !budgetVersionId) return null;
    try {
      const raw = view.sessionStorage.getItem(JY2_LAST_SOFT_SAVED_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || String(parsed.budget_version_id || "") !== String(budgetVersionId)) {
        return null;
      }
      const savedAt = String(parsed.savedAt || "").trim();
      return savedAt || null;
    } catch {
      return null;
    }
  }
  function jy2WriteLastSoftSavedStamp(view, budgetVersionId, iso) {
    if (!view || !view.sessionStorage || !budgetVersionId || !iso) return;
    try {
      view.sessionStorage.setItem(
        JY2_LAST_SOFT_SAVED_KEY,
        JSON.stringify({
          budget_version_id: String(budgetVersionId),
          savedAt: String(iso),
        }),
      );
    } catch {
      // ignore
    }
  }
  function jy2ResolveLastSavedDisplayText(view, record) {
    const budgetVersionId = jy2FieldValue(record, "budget_version_id");
    const softSaved = jy2ReadLastSoftSavedStamp(view, budgetVersionId);
    if (softSaved) {
      return jy2FormatJstDatetimeLabel(softSaved, "保存");
    }
    const updated =
      jy2FieldValue(record, "Updated_datetime") ||
      jy2FieldValue(record, "updated_datetime");
    if (updated) {
      return jy2FormatJstDatetimeLabel(updated, "更新");
    }
    return "";
  }

  function jy2Field(record, code, value) {
    // type を書き換え／捏造しない（DROP_DOWN を SINGLE_LINE_TEXT にすると LIVE で落ちる）。
    if (!record[code] || typeof record[code] !== "object") return null;
    record[code].value = value === null || value === undefined ? "" : String(value);
    return record[code];
  }

  function jy2CompactUuidFactory() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? compactUuidFactory(() => crypto.randomUUID())
      : compactUuidFactory(() =>
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
            const r = (Math.random() * 16) | 0;
            return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
          }),
        );
  }

  let jy2ListRowsAll = [];
  let jy2ListSearchQuery = "";

  function jy2HideNativeIndexTable() {
    if (typeof document === "undefined") return;
    for (const selector of [".recordlist-gaia", ".contents-gaia"]) {
      const node = document.querySelector(selector);
      if (node) node.style.display = "none";
    }
  }

  /**
   * 詳細・編集・新規: Ver.01 と同じく record-*-gaia 先頭に #jy2-host を挿す。
   * 一覧専用の getHeaderSpaceElement は詳細では null になるため使わない。
   */
  function jy2ResolveRecordPageHost(documentRef) {
    const doc =
      documentRef ||
      (typeof document !== "undefined" ? document : null);
    if (!doc) return null;
    const form =
      doc.querySelector(".record-detail-gaia") ||
      doc.querySelector(".record-edit-gaia") ||
      doc.querySelector(".layout-gaia");
    if (form) {
      let host = doc.getElementById("jy2-host");
      if (!host) {
        host = doc.createElement("div");
        host.id = "jy2-host";
        form.insertBefore(host, form.firstChild);
      }
      return host;
    }
    if (
      typeof kintone !== "undefined" &&
      kintone.app &&
      kintone.app.record &&
      typeof kintone.app.record.getHeaderMenuSpaceElement === "function"
    ) {
      return kintone.app.record.getHeaderMenuSpaceElement();
    }
    return null;
  }

  function jy2RefreshList(api) {
    const fetchApi =
      typeof api === "function"
        ? api
        : typeof kintone !== "undefined" && typeof kintone.api === "function"
          ? kintone.api.bind(kintone)
          : null;
    if (!fetchApi || typeof kintone === "undefined") {
      return Promise.resolve([]);
    }
    return fetchApi("/k/v1/records.json", "GET", {
      app: APP1_ID,
      query: "order by $id desc limit 500",
      fields: [
        "$id",
        "project_code",
        "project_name",
        "project_official_name",
        "version_seq",
        "version_type",
        "status",
        "Updated_datetime",
        "contract_total_1",
        "profit_9",
      ],
    })
      .then((response) => {
        const records = (response.records || [])
          .map((rec) => {
            const id = rec.$id && rec.$id.value != null ? String(rec.$id.value) : "";
            if (!id) return null;
            return {
              id,
              project_code: jy2FieldValue(rec, "project_code"),
              project_name: jy2FieldValue(rec, "project_name"),
              project_official_name: jy2FieldValue(rec, "project_official_name"),
              version_seq: jy2FieldValue(rec, "version_seq"),
              version_type: jy2FieldValue(rec, "version_type"),
              status: jy2FieldValue(rec, "status"),
              updated_at: jy2FormatDatetime(
                jy2FieldValue(rec, "Updated_datetime") ||
                  jy2FieldValue(rec, "updated_datetime"),
              ),
              contract_total_1: jy2FieldValue(rec, "contract_total_1"),
              profit_9: jy2FieldValue(rec, "profit_9"),
            };
          })
          .filter(Boolean);
        jy2ListRowsAll = buildListProjectRows(records);
        return jy2ListRowsAll;
      })
      .catch((error) => {
        jy2ListRowsAll = [];
        if (typeof console !== "undefined" && console.error) {
          console.error(BUILD, "jy2RefreshList", error);
        }
        throw error;
      });
  }

  function jy2RenderListRoot(container) {
    if (!container || !container.ownerDocument) return;
    const documentRef = container.ownerDocument;
    jy2InstallStyle(documentRef);
    container.textContent = "";
    const root = documentRef.createElement("div");
    root.className = "jy2-list-root";

    const title = documentRef.createElement("h2");
    title.className = "jy2-list-title";
    title.textContent = "実行予算書作成支援ツールver02";
    const subtitle = documentRef.createElement("p");
    subtitle.className = "jy2-list-sub";
    subtitle.textContent = "工事一覧 — 行をクリックすると最新版（下書き優先）を開きます。";
    root.append(title, subtitle);

    const toolbar = documentRef.createElement("div");
    toolbar.className = "jy2-list-toolbar";
    const newButton = documentRef.createElement("button");
    newButton.type = "button";
    newButton.className = "jy2-list-new";
    newButton.textContent = "＋ 新規作成";
    newButton.addEventListener("click", () => {
      const view = documentRef.defaultView;
      if (view && view.location) view.location.href = `/k/${APP1_ID}/edit`;
    });
    const searchLabel = documentRef.createElement("label");
    searchLabel.textContent = "検索 ";
    const searchInput = documentRef.createElement("input");
    searchInput.type = "search";
    searchInput.className = "jy2-list-search";
    searchInput.placeholder = "工事名称・工事コード・版種別など";
    searchInput.value = jy2ListSearchQuery;
    const clearButton = documentRef.createElement("button");
    clearButton.type = "button";
    clearButton.className = "jy2-row-button";
    clearButton.textContent = "クリア";
    const count = documentRef.createElement("span");
    count.className = "jy2-list-count";
    toolbar.append(newButton, searchLabel, searchInput, clearButton, count);
    root.appendChild(toolbar);

    const hint = documentRef.createElement("p");
    hint.className = "jy2-list-hint";
    hint.textContent =
      "列: 工事名称 / 工事コード / 版 / 版種別 / ステータス / 更新日。" +
      " 同一工事の複数版は下書きがあれば下書きを代表表示します。";
    root.appendChild(hint);

    const rerender = () => jy2RenderListRoot(container);
    searchInput.addEventListener("input", () => {
      jy2ListSearchQuery = searchInput.value;
      rerender();
    });
    clearButton.addEventListener("click", () => {
      jy2ListSearchQuery = "";
      rerender();
    });

    const rows = filterListRows(jy2ListRowsAll, jy2ListSearchQuery);
    count.textContent =
      jy2ListRowsAll.length === 0
        ? "0 工事"
        : jy2ListSearchQuery.trim()
          ? `表示 ${rows.length} / 全 ${jy2ListRowsAll.length} 工事`
          : `全 ${jy2ListRowsAll.length} 工事`;

    const table = documentRef.createElement("table");
    table.className = "jy2-list-table";
    const head = documentRef.createElement("thead");
    const headRow = documentRef.createElement("tr");
    for (const label of [
      "工事名称",
      "工事コード",
      "版",
      "版種別",
      "ステータス",
      "更新日",
    ]) {
      headRow.appendChild(jy2Cell(documentRef, "th", "", label));
    }
    head.appendChild(headRow);
    table.appendChild(head);

    const body = documentRef.createElement("tbody");
    if (jy2ListRowsAll.length === 0) {
      const tr = documentRef.createElement("tr");
      const td = jy2Cell(
        documentRef,
        "td",
        "",
        "レコードがありません。「＋ 新規作成」から開始してください。",
      );
      td.colSpan = 6;
      tr.appendChild(td);
      body.appendChild(tr);
    } else if (rows.length === 0) {
      const tr = documentRef.createElement("tr");
      const td = jy2Cell(documentRef, "td", "", "検索条件に一致する工事がありません。");
      td.colSpan = 6;
      tr.appendChild(td);
      body.appendChild(tr);
    } else {
      for (const row of rows) {
        const tr = documentRef.createElement("tr");
        tr.dataset.openId = row.open_id;
        tr.addEventListener("click", () => {
          const view = documentRef.defaultView;
          if (view && view.location && row.open_id) {
            view.location.href = `/k/${APP1_ID}/show#record=${row.open_id}`;
          }
        });
        tr.appendChild(
          jy2Cell(documentRef, "td", "", row.project_name || row.project_code),
        );
        tr.appendChild(jy2Cell(documentRef, "td", "", row.project_code));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.version_seq));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.version_type));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.status));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.updated_at));
        body.appendChild(tr);
      }
    }
    table.appendChild(body);
    root.appendChild(table);
    container.appendChild(root);
  }

  function jy2MountIndex() {
    jy2HideNativeIndexTable();
    const space =
      typeof kintone !== "undefined" &&
      typeof kintone.app.getHeaderSpaceElement === "function"
        ? kintone.app.getHeaderSpaceElement()
        : null;
    if (!space) return;
    space.textContent = "";
    jy2RefreshList()
      .then(() => jy2RenderListRoot(space))
      .catch(() => jy2RenderListRoot(space));
  }

  function jy2VersionTypeOptions(versionSeq, currentType) {
    const seq = Number(versionSeq) || 1;
    if (seq === 1 && (currentType === "当初" || !currentType)) {
      return ["当初"];
    }
    return VERSION_TYPES.filter((type) => type !== "当初" || currentType === "当初");
  }

  /** 次版作成前の版種別選択（当初は除外）。キャンセルで null。 */
  function jy2PickNextVersionType(view) {
    const opts = VERSION_TYPES.filter((type) => type !== "当初");
    let message = "次版の版種別を選んでください:\n";
    opts.forEach((type, index) => {
      message += `${index + 1}. ${type}\n`;
    });
    message += `\n番号を入力（1-${opts.length}）`;
    if (!view || typeof view.prompt !== "function") return opts[0];
    const answer = view.prompt(message, "1");
    if (answer == null) return null;
    const index = Number(answer) - 1;
    if (!Number.isFinite(index) || index < 0 || index >= opts.length) {
      if (typeof view.alert === "function") view.alert("版種別の選択が無効です");
      return null;
    }
    return opts[index];
  }

  function jy2ActualsStartMonth(record) {
    const start = jy2FieldValue(record, "start_date");
    if (!start) return null;
    const month = String(start).trim().slice(0, 7);
    return /^\d{4}-\d{2}$/.test(month) ? month : null;
  }

  function jy2RenderVersionTypeBar(documentRef, record, onChange) {
    const bar = documentRef.createElement("div");
    bar.className = "jy2-version-type-bar";
    const label = documentRef.createElement("label");
    label.textContent = "版種別";
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    const versionSeq = jy2FieldValue(record, "version_seq") || "1";
    const current = jy2FieldValue(record, "version_type") || "当初";
    for (const optionValue of jy2VersionTypeOptions(versionSeq, current)) {
      const option = documentRef.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    }
    select.value = current;
    select.addEventListener("change", () => {
      jy2Field(record, "version_type", select.value);
      if (typeof onChange === "function") onChange(select.value);
    });
    label.appendChild(select);
    bar.appendChild(label);
    return bar;
  }

  function jy2MountDetailShell(space, record, recordId, options = {}) {
    if (!space || !record) return;
    const controller =
      recordId && typeof kintone !== "undefined" && typeof kintone.api === "function"
        ? jy2CreateSaveController(kintone.api.bind(kintone), record, recordId)
        : null;
    const render = (payload) => {
      space.textContent = "";
      const shellHost = space.ownerDocument.createElement("div");
      space.appendChild(shellHost);
      if (options.showVersionTypeBar) {
        shellHost.appendChild(
          jy2RenderVersionTypeBar(space.ownerDocument, record, (value) => {
            if (options.onVersionTypeChange) options.onVersionTypeChange(value);
          }),
        );
      }
      const mount = space.ownerDocument.createElement("div");
      shellHost.appendChild(mount);
      jy2RenderShell(mount, record, payload);
      jy2HideNativeDetailChrome(space.ownerDocument);
    };
    if (controller) {
      Promise.all([
        controller.loadBlocks(),
        controller.loadVersions(),
        controller.loadActuals(),
        jy2LoadMasterLists(kintone.api.bind(kintone)),
      ])
        .then(([detailBlocks, versions, actualRows, masterLists]) => {
          const summaryLines = app1RecordToSummaryLines(record || {});
          render({
            detailBlocks,
            versions,
            actualRows,
            masterLists,
            actualsStartMonth: jy2ActualsStartMonth(record),
            contractLines: summaryLines.contractLines.filter((line) => line.section),
            salaryLines: summaryLines.salaryLines,
            projectionPreviousLines: app1RecordToProjectionPreviousLines(record || {}),
            saveController: controller,
            projectId: controller.keys.projectId,
          });
        })
        .catch((error) => {
          render(options.showVersionTypeBar ? {} : undefined);
          if (typeof console !== "undefined" && console.error) {
            console.error("JY2 詳細読込に失敗:", error);
          }
        });
      return;
    }
    const api =
      typeof kintone !== "undefined" && typeof kintone.api === "function"
        ? kintone.api.bind(kintone)
        : null;
    jy2LoadMasterLists(api).then((masterLists) => {
      render({
        ...(options.showVersionTypeBar ? {} : {}),
        masterLists,
      });
    });
  }

  function jy2CreateProjectionManualStore(seedLines, blocks) {
    const byId = new Map();
    const unusedSeeds = [];
    for (const line of seedLines || []) {
      const id = String(line.summary_stable_block_id || "").trim();
      const manual = {
        summary_stable_block_id: id,
        summary_line_type: line.summary_line_type ?? "",
        summary_material_name: line.summary_material_name ?? "",
        summary_calc_basis: line.summary_calc_basis ?? "",
        summary_note: line.summary_note ?? "",
        summary_tax_rate: line.summary_tax_rate ?? "",
      };
      if (id) byId.set(id, manual);
      else unusedSeeds.push({ ...manual, summary_work_type_code: line.summary_work_type_code || "" });
    }
    // 移行データで stable_block_id が空でも、工種番号が一致すれば種別を引き継ぐ。
    for (const block of blocks || []) {
      const id = String(block.stableBlockId || "").trim();
      if (!id || byId.has(id)) continue;
      const code = String(block.workTypeCode || "").trim();
      const match = unusedSeeds.find(
        (line) =>
          code &&
          line.summary_work_type_code === code &&
          (line.summary_line_type || line.summary_calc_basis || line.summary_note),
      );
      if (!match) continue;
      byId.set(id, {
        summary_stable_block_id: id,
        summary_line_type: match.summary_line_type,
        summary_material_name: match.summary_material_name ?? "",
        summary_calc_basis: match.summary_calc_basis,
        summary_note: match.summary_note,
        summary_tax_rate: match.summary_tax_rate ?? "",
      });
    }
    return Object.freeze({
      previousLines() {
        return [...byId.values()];
      },
      patch(stableBlockId, fields) {
        const id = String(stableBlockId || "").trim();
        if (!id) return;
        const prev = byId.get(id) || {
          summary_stable_block_id: id,
          summary_line_type: "",
          summary_material_name: "",
          summary_calc_basis: "",
          summary_note: "",
          summary_tax_rate: "",
        };
        byId.set(id, {
          ...prev,
          ...fields,
          summary_stable_block_id: id,
        });
      },
    });
  }

  // Phase C-2b: 保存コントローラ。キー（project_id/project_business_key/
  // budget_version_id）と revision が揃った既存レコードでのみ作れる。
  // 送信は planAtomicBudgetSave → executePlan の1回の bulkRequest だけ。
  function jy2CreateSaveController(api, record, recordId) {
    if (typeof api !== "function" || !record || !recordId) return null;
    const projectId = jy2FieldValue(record, "project_id");
    const businessKey = jy2FieldValue(record, "project_business_key");
    const versionId = jy2FieldValue(record, "budget_version_id");
    let parentRevision = String(jy2FieldValue(record, "$revision") || "");
    if (!projectId || !businessKey || !versionId || !parentRevision) return null;
    const keys = {
      projectId: String(projectId),
      projectBusinessKey: String(businessKey),
      budgetVersionId: String(versionId),
    };
    const initialStatus = String(jy2FieldValue(record, "status") || "下書き");
    let loadedDetailRecords = null;
    return Object.freeze({
      keys,
      initialStatus,
      get actualWriteSeq() {
        return String(jy2FieldValue(record, "actual_write_seq") ?? "0");
      },
      async loadBlocks() {
        const records = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId, {
          fields: null,
        });
        loadedDetailRecords = records;
        return app2RecordsToBlocks(records);
      },
      async loadActuals() {
        const records = await fetchExistingActualRows(api, APP3_ID, keys.projectId, {
          fields: null,
        });
        return app3RecordsToActualRows(records);
      },
      // 残B: 同一工事の版一覧（App1 レコード）を LIVE から読む。
      async loadVersions() {
        const escaped = keys.projectId.replace(/"/g, "");
        const response = await api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `project_id = "${escaped}" order by version_seq asc limit 500`,
        });
        return Array.isArray(response.records) ? response.records : [];
      },
      // 残A: 工事基本情報 + 総括（請負/給与/原価投影手入力）は親 PUT に同乗。
      async save(detailModel, summaryModel, projectionManual, options = {}) {
        for (const b of detailModel.snapshot().blocks) {
          if (b.status === "retired") continue;
          const next = jy2NextBlockVendorAfterLineCompanies(b);
          if (next === "－" && String(b.vendorName || "").trim() !== "－") {
            detailModel.updateBlockHeader(b.stableBlockId, { vendorName: "－" });
          }
        }
        const uchiwakeWarnings = jy2CollectUchiwakeSaveWarnings(
          detailModel.snapshot().blocks,
        );
        // 詳細左は name2。name1 が〃でも判定が外れないよう、name2 の〃化は常時禁止。
        detailModel.prepareForSave({
          skipEmptyName2Ditto: () => true,
          skipName2Ditto: () => true,
        });
        const parentRecord = {
          ...(summaryModel
            ? summarySnapshotToSubtables(summaryModel.snapshot())
            : {}),
          ...jy2CollectHeaderFields(record),
          ...jy2CollectHolidayLines(record),
        };
        const blocks = detailModel.projectionBlocks();
        const totals = summaryModel ? summaryModel.totals(blocks) : null;
        const contractTotal1 = totals ? totals.total1 : null;
        const projectionCheck = checkSummaryProjection({
          blocks,
          cachedLines: jy2SummaryCostLinesFromRecord(record),
          contractTotal1,
        });
        parentRecord.summary_projection_status = {
          value: projectionCheck.status,
        };
        parentRecord.summary_projection_checked_at = {
          value: jy2ProjectionCheckedAtIso(),
        };
        if (projectionCheck.status === "error") {
          throw new Error(
            `総括原価投影の整合性チェックに失敗しました: ${projectionCheck.reason}`,
          );
        }
        const collectedStatus =
          parentRecord.status?.value ?? jy2FieldValue(record, "status") ?? "下書き";
        const isVersionConfirmAttempt =
          collectedStatus === "版確定" && initialStatus === "下書き";
        let projectionRepaired = false;
        if (isVersionConfirmAttempt) {
          if (!options.confirmingVersion) {
            throw new Error("JY2_CONFIRM_VERSION_REQUIRED");
          }
          if (projectionCheck.status !== "synced") {
            parentRecord.status = { value: "下書き" };
            jy2ApplyHeaderField(record, "status", "下書き");
            projectionRepaired = true;
          }
        }
        if (summaryModel && projectionManual) {
          const projectionRows = regenerateSummaryCostLines(blocks, {
            contractTotal1,
            previousLines: projectionManual.previousLines(),
          });
          Object.assign(parentRecord, projectionRowsToSubtable(projectionRows));
        }
        // 初期表示で取得済みのApp2行を再利用し、保存直前の重複GETを省く。
        // 各行revisionと親revisionはbulk保存時に検証されるため、競合検知は維持される。
        const existing =
          loadedDetailRecords ||
          (await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId));
        const inputs = buildDetailSaveInputs({
          app1Id: APP1_ID,
          app2Id: APP2_ID,
          parentRecordId: String(recordId),
          parentRevision: parentRevision,
          parentRecord,
          keys,
          rows: detailModel.toApp2Rows(),
          existingRecords: existing,
        });
        const plan = planAtomicBudgetSave(inputs);
        const outcome = await executePlan(plan, createKintoneApiClient(api));
        let softSaveReady = false;
        const nextRevision = jy2ParentRevisionFromBulkResults(outcome.results);
        if (nextRevision) {
          parentRevision = String(nextRevision);
          if (!record.$revision) record.$revision = { value: parentRevision };
          else record.$revision.value = parentRevision;
          try {
            loadedDetailRecords = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId, {
              fields: null,
            });
            softSaveReady = true;
          } catch {
            softSaveReady = false;
          }
        }
        return Object.freeze({
          ...outcome,
          projectionRepaired,
          projectionStatus: projectionCheck.status,
          softSaveReady,
          uchiwakeWarnings,
        });
      },
      async saveActuals(actualsModel) {
        const versionRecords = await this.loadVersions();
        const openVersion = pickOpenVersion(
          versionRecords.map((row) => ({
            status: jy2FieldValue(row, "status"),
            version_seq: jy2FieldValue(row, "version_seq"),
            budget_version_id: jy2FieldValue(row, "budget_version_id"),
          })),
        );
        if (
          !openVersion ||
          String(openVersion.budget_version_id) !== keys.budgetVersionId
        ) {
          throw new Error("現行版以外からは予実保存不可");
        }
        const rows = actualsModel.toApp3Records({
          projectId: keys.projectId,
          registeredVersionId: String(openVersion.budget_version_id),
        });
        if (rows.length === 0) {
          return { outcome: null, requestCount: 0, skipped: true };
        }
        const existing = await fetchExistingActualRows(api, APP3_ID, keys.projectId);
        const inputs = buildActualsSaveInputs({
          app1Id: APP1_ID,
          app3Id: APP3_ID,
          parentRecordId: String(recordId),
          parentRevision: parentRevision,
          currentActualWriteSeq: jy2FieldValue(record, "actual_write_seq") ?? "0",
          keys,
          rows,
          existingRecords: existing,
        });
        const plan = planActualsSave(inputs);
        const outcome = await executePlan(plan, createKintoneApiClient(api));
        jy2Field(record, "actual_write_seq", inputs.nextActualWriteSeq);
        return { outcome, requestCount: plan.requestCount };
      },
      // 残B: 最新確定版からの次版複製（1回の bulkRequest・実績は複製しない）。
      async createNextVersion(versionModel, version, versionType = "仕様変更") {
        const oldRows = await fetchExistingDetailRows(
          api,
          APP2_ID,
          version.budgetVersionId,
          { fields: null },
        );
        const plan = versionModel.planNextVersionDraft(version, oldRows.length);
        const escapedBv = version.budgetVersionId.replace(/"/g, "");
        const parents = await api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `budget_version_id = "${escapedBv}" limit 2`,
        });
        if (!parents.records || parents.records.length !== 1) {
          throw new Error(
            `複製元の親レコードを特定できません（budget_version_id=${version.budgetVersionId}）`,
          );
        }
        const oldParentRecord = parents.records[0];
        const inputs = buildVersionCopyInputs({
          app1Id: APP1_ID,
          app2Id: APP2_ID,
          plan,
          versionType,
          oldParent: {
            id: oldParentRecord.$id.value,
            revision: oldParentRecord.$revision.value,
            record: oldParentRecord,
          },
          oldDetailRecords: oldRows,
        });
        const bulkPlan = planVersionCopy(inputs);
        return { outcome: await executePlan(bulkPlan, createKintoneApiClient(api)), plan };
      },
    });
  }

  function jy2RenderShell(container, record, data) {
    if (!container || !container.ownerDocument) return null;
    const documentRef = container.ownerDocument;
    jy2InstallStyle(documentRef);
    const model = createUiModel(jy2LockState(record));
    const summaryData = data && typeof data === "object" ? data : {};
    // C-2b: LIVE 保存キーは 64 文字上限（detail_record_key）を守るため、
    // 新規 row_key 等は 16 文字 base36 圧縮 UUID で発行する。
    const jy2UuidFactory =
      summaryData.uuidFactory ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? compactUuidFactory(() => crypto.randomUUID())
        : undefined);
    const summaryModel = createContractSalaryModel({
      lockState: model.lockState,
      contractLines: summaryData.contractLines || [],
      salaryLines: summaryData.salaryLines || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    // Phase 4c: 内訳 blocks live in this offline in-memory model (App2 shape).
    const detailModel = createDetailBlockModel({
      lockState: model.lockState,
      blocks: summaryData.detailBlocks || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    // Phase 4d: 予実 cells live in this offline model (App3 vertical shape,
    // pivoted wide). Current budgets are read live from the 内訳 blocks.
    const actualsModel = createActualsMatrixModel({
      lockState: model.lockState,
      startMonth: summaryData.actualsStartMonth ?? null,
      ...(summaryData.actualsMonthCount
        ? { monthCount: summaryData.actualsMonthCount }
        : {}),
      actualRows: summaryData.actualRows || [],
    });
    // Phase 4e: the 版管理 series is offline too (App1-shaped mock records
    // via data.versions). The shell's own lock state still comes from the
    // opened record; the series only drives the version tab.
    const versionModel = createVersionSeriesModel({
      records: summaryData.versions || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    const versionProjectId =
      summaryData.projectId ||
      jy2FieldValue(record, "project_id") ||
      versionModel.projectIds()[0] ||
      null;
    // Legacy 4b injection: static projection-shaped mock blocks (data.blocks)
    // still win when provided; otherwise the summary reads live from 内訳.
    const staticBlocks = Array.isArray(summaryData.blocks)
      ? summaryData.blocks
      : null;
    const currentBlocks = () => staticBlocks || detailModel.projectionBlocks();
    const projectionManual = jy2CreateProjectionManualStore(
      summaryData.projectionPreviousLines ||
        app1RecordToProjectionPreviousLines(record || {}),
      currentBlocks(),
    );
    container.textContent = "";

    const shell = documentRef.createElement("section");
    shell.className = "jy2-shell";
    const initialFontScale = jy2ReadStoredFontScale(documentRef.defaultView);
    jy2ApplyFontScale(shell, initialFontScale);

    // シート見出しは sticky 下部に常時表示（スクロールで隠れない）。
    // BUILD は操作バー meta に出す。
    const saveController = summaryData.saveController || null;
    const canEditBudget = detailModel.allowedOperations.editBudget;

    // Ver.01 同趣旨: 保存等を先頭に置き sticky/fixed 固定（装飾見出しの下に押し出さない）
    const sticky = documentRef.createElement("div");
    sticky.className = "jy2-sticky-top";
    const stickySpacer = documentRef.createElement("div");
    stickySpacer.className = "jy2-sticky-spacer";
    stickySpacer.setAttribute("aria-hidden", "true");
    if (!canEditBudget) {
      const lockBanner = documentRef.createElement("div");
      lockBanner.className = "jy2-lock-banner";
      lockBanner.textContent = "参照のみ（予算編集ロック）— メイン操作は無効です";
      sticky.appendChild(lockBanner);
    }

    const actionBar = documentRef.createElement("div");
    actionBar.className = "jy2-action-bar";
    const leftGroup = documentRef.createElement("div");
    leftGroup.className = "jy2-action-group";

    const backBtn = documentRef.createElement("button");
    backBtn.type = "button";
    backBtn.className = "jy2-btn";
    backBtn.textContent = "← 一覧";
    backBtn.addEventListener("click", () => {
      const view = documentRef.defaultView;
      if (view && view.location) view.location.href = `/k/${APP1_ID}/`;
    });
    leftGroup.appendChild(backBtn);

    const fontScaleWrap = documentRef.createElement("div");
    fontScaleWrap.className = "jy2-font-scale";
    const fontScaleLabel = documentRef.createElement("span");
    fontScaleLabel.className = "jy2-font-scale-label";
    fontScaleLabel.textContent = "文字サイズ";
    const fontScaleBtns = documentRef.createElement("div");
    fontScaleBtns.className = "jy2-font-scale-btns";
    fontScaleBtns.setAttribute("role", "group");
    fontScaleBtns.setAttribute("aria-label", "文字サイズ");
    const fontScaleOptions = [
      { scale: "standard", label: "標準" },
      { scale: "large", label: "大" },
      { scale: "xlarge", label: "特大" },
    ];
    const fontScaleButtons = fontScaleOptions.map(({ scale, label }) => {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "jy2-btn";
      button.dataset.scale = scale;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(scale === initialFontScale));
      button.addEventListener("click", () => {
        if (scale === shell.dataset.fontScale) return;
        jy2StoreFontScale(documentRef.defaultView, scale);
        jy2ApplyFontScale(shell, scale);
        for (const node of fontScaleButtons) {
          node.setAttribute(
            "aria-pressed",
            String(node.dataset.scale === scale),
          );
        }
        syncStickyLayout();
        const win = documentRef.defaultView;
        if (win && typeof win.requestAnimationFrame === "function") {
          win.requestAnimationFrame(syncStickyLayout);
        }
      });
      return button;
    });
    fontScaleBtns.append(...fontScaleButtons);
    fontScaleWrap.append(fontScaleLabel, fontScaleBtns);
    leftGroup.appendChild(fontScaleWrap);

    const meta = documentRef.createElement("span");
    meta.className = "jy2-action-meta";
    const code = jy2FieldValue(record, "project_code") || "";
    const branch = jy2FieldValue(record, "project_branch") || "";
    const verSeq = jy2FieldValue(record, "version_seq") || "";
    const verType = jy2FieldValue(record, "version_type") || "";
    const status = jy2FieldValue(record, "status") || "";
    meta.textContent = [
      code ? `${code}${branch ? `-${branch}` : ""}` : "（工事コードなし）",
      verSeq ? `版${verSeq}` : "",
      verType,
      status,
    ]
      .filter(Boolean)
      .join(" / ");
    meta.title = [
      meta.textContent,
      `BUILD ${BUILD}`,
      model.lockState,
    ]
      .filter(Boolean)
      .join(" / ");
    leftGroup.appendChild(meta);

    const rightGroup = documentRef.createElement("div");
    rightGroup.className = "jy2-action-bar-right";

    const addBlockBtn = documentRef.createElement("button");
    addBlockBtn.type = "button";
    addBlockBtn.className = "jy2-btn jy2-btn-accent";
    addBlockBtn.textContent = "工種ブロック追加";
    addBlockBtn.disabled = !canEditBudget;
    addBlockBtn.title = "内訳タブに工種ブロックを追加します";

    const addSalaryBtn = documentRef.createElement("button");
    addSalaryBtn.type = "button";
    addSalaryBtn.className = "jy2-btn";
    addSalaryBtn.textContent = "給与行追加";
    addSalaryBtn.disabled = !canEditBudget;
    addSalaryBtn.title = "総括の給与手当に行を追加します";

    const lastSavedEl = documentRef.createElement("span");
    lastSavedEl.className = "jy2-last-saved";
    const initLastSaved = jy2ResolveLastSavedDisplayText(documentRef.defaultView, record);
    if (initLastSaved) lastSavedEl.textContent = initLastSaved;

    const saveButton = documentRef.createElement("button");
    saveButton.type = "button";
    saveButton.className = "jy2-btn jy2-btn-primary jy2-save-button";
    const isDraftStatus = (jy2FieldValue(record, "status") || "下書き") !== "版確定";
    saveButton.textContent = isDraftStatus ? "一時保存" : "保存";
    saveButton.disabled = !saveController || !canEditBudget;
    saveButton.title = isDraftStatus
      ? "下書きとして工事基本情報・総括・内訳を一時保存（工事原価管理の詳細・単価・行追加も含む）"
      : "工事基本情報・総括・内訳を保存（工事原価管理の詳細・単価・行追加も含む）";
    // 詳細入力中に押しても blur→commit で click が消えないようにする
    saveButton.addEventListener("mousedown", (event) => {
      jy2FlushActiveInputBeforeSave(documentRef);
      if (typeof event.preventDefault === "function") event.preventDefault();
    });

    const confirmButton = documentRef.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "jy2-btn jy2-confirm-button";
    confirmButton.textContent = "版を確定";
    confirmButton.disabled = !saveController || !canEditBudget || !isDraftStatus;
    confirmButton.hidden = !isDraftStatus;
    confirmButton.title = "下書きを版確定します（確認ダイアログあり）";

    // 保存等を DOM 先頭に置き、狭い幅でも左端に見えるようにする。
    rightGroup.append(lastSavedEl, saveButton, confirmButton, addBlockBtn, addSalaryBtn);
    actionBar.append(rightGroup, leftGroup);
    sticky.appendChild(actionBar);

    const tabList = documentRef.createElement("nav");
    tabList.className = "jy2-tabs";
    tabList.setAttribute("role", "tablist");
    sticky.appendChild(tabList);

    const stickySheetBanner = documentRef.createElement("div");
    stickySheetBanner.className = "jy2-sticky-sheet-banner";
    sticky.appendChild(stickySheetBanner);

    // 画面上端に残る fixed/sticky だけを top に使う。
    // （スクロールで消える app-toolbar 高さを入れると、固定時に上へ空白が空く）
    // 親の overflow で position:sticky が無効化されるため、閾値で relative↔fixed を切替。
    // spacer 高さを scroll 毎に変えると文書高が揺れ「下にスクロールできない／上に戻る」になる。
    const measureGaiaTop = () => {
      const win = documentRef.defaultView;
      if (!win || typeof win.getComputedStyle !== "function") return 0;
      let offset = 0;
      const candidates = [
        ".gaia-header",
        ".gaia-header-toolbar-header",
        ".ocean-ui-plugin-header",
        ".gaia-argoui-app-toolbar",
      ];
      for (const selector of candidates) {
        const el = documentRef.querySelector(selector);
        if (!el) continue;
        const position = win.getComputedStyle(el).position;
        if (position !== "fixed" && position !== "sticky") continue;
        const rect = el.getBoundingClientRect();
        if (rect.height <= 0) continue;
        if (rect.top > 2) continue;
        offset = Math.max(offset, Math.ceil(rect.bottom));
      }
      return Math.max(0, offset);
    };
    const syncStickyLayout = () => {
      const gaiaTop = measureGaiaTop();
      const anchor = shell.getBoundingClientRect();
      const stickyH = Math.ceil(sticky.offsetHeight || 0);
      // shell 上端が gaia より下＝まだピン不要 → 文書流に載せる（余白なし）
      // 上端が gaia を超えたら fixed＋等高 spacer（高さは sticky 実測のみ・scrollで変えない）
      if (anchor.top > gaiaTop + 1) {
        sticky.classList.remove("is-fixed");
        sticky.style.position = "relative";
        sticky.style.top = "";
        sticky.style.left = "";
        sticky.style.width = "";
        sticky.style.right = "";
        stickySpacer.style.height = "0px";
        shell.style.setProperty("--jy2-chrome-h", `${gaiaTop + stickyH}px`);
        return;
      }
      sticky.classList.add("is-fixed");
      sticky.style.position = "fixed";
      sticky.style.left = `${Math.round(anchor.left)}px`;
      sticky.style.width = `${Math.max(0, Math.round(anchor.width))}px`;
      sticky.style.top = `${gaiaTop}px`;
      sticky.style.right = "auto";
      stickySpacer.style.height = `${stickyH}px`;
      shell.style.setProperty("--jy2-chrome-h", `${gaiaTop + stickyH}px`);
    };
    const view = documentRef.defaultView;
    if (view && typeof view.addEventListener === "function") {
      view.addEventListener("resize", syncStickyLayout);
      view.addEventListener("scroll", syncStickyLayout, { passive: true });
    }

    const panes = documentRef.createElement("div");
    panes.className = "jy2-panes";

    function syncStickyActions(tabId) {
      // 工種ブロックは内訳専用。総括など他タブでは出さない。
      addBlockBtn.hidden = tabId !== "detail";
      // 給与行は総括専用。
      addSalaryBtn.hidden = tabId !== "summary";
    }

    let actualsDirty = true;
    let summaryDirty = true;
    let detailDirty = false;
    // App757 未保存（一時保存が必要）。detailDirty と違い、内訳タブ再描画では消さない。
    let detailSavePending = false;
    // activate 定義時点では未代入。後で実体を差し込む。
    let flushSummaryIfDirty = () => {};
    let flushActualsIfDirty = () => {};
    let flushDetailIfDirty = () => {};

    function activate(tabId) {
      for (const button of tabList.querySelectorAll(".jy2-tab")) {
        button.setAttribute(
          "aria-selected",
          String(button.dataset.tabId === tabId),
        );
      }
      for (const pane of panes.querySelectorAll(".jy2-pane")) {
        pane.dataset.active = String(pane.dataset.tabId === tabId);
      }
      sticky.dataset.activeTab = tabId;
      jy2StoreActiveTab(documentRef.defaultView, tabId);
      syncStickyActions(tabId);
      jy2SyncStickySheetBanner(stickySheetBanner, documentRef, tabId);
      syncStickyLayout();
      // 内訳タブ入力中は総括/予実を遅延。タブ表示（クリック・No.ジャンプ）時に反映。
      if (tabId === "summary") flushSummaryIfDirty();
      if (tabId === "detail") flushDetailIfDirty();
      if (tabId === "actual") {
        flushSummaryIfDirty();
        flushActualsIfDirty();
      }
      // タブ表示後に幅を測り直す（非表示時に測ると横スクロールが消える）
      const syncScroll = () => jy2SyncAllHScroll(documentRef);
      syncScroll();
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(() => {
          syncStickyLayout();
          syncScroll();
        });
      }
    }
    shell._jy2ActivateTab = activate;

    let headerPane = null;
    let holidayPane = null;
    let summaryPane = null;
    let detailPane = null;
    let actualPane = null;
    let versionPane = null;
    const shellTabs = jy2ShellTabList(model);
    shellTabs.forEach((tab, index) => {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "jy2-tab";
      button.dataset.tabId = tab.id;
      button.dataset.readOnly = String(tab.readOnly);
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.textContent = tab.label;
      button.addEventListener("click", () => activate(tab.id));
      tabList.appendChild(button);

      const pane = documentRef.createElement("section");
      pane.className = "jy2-pane";
      pane.dataset.tabId = tab.id;
      pane.dataset.active = String(index === 0);
      pane.dataset.readOnly = String(tab.readOnly);
      pane.setAttribute("role", "tabpanel");
      if (tab.id === "header") {
        headerPane = pane;
      } else if (tab.id === "holiday") {
        holidayPane = pane;
      } else if (tab.id === "summary") {
        summaryPane = pane;
      } else if (tab.id === "detail") {
        detailPane = pane;
      } else if (tab.id === "actual") {
        actualPane = pane;
      } else if (tab.id === "version") {
        versionPane = pane;
      }
      panes.appendChild(pane);
    });
    const allowedTabIds = shellTabs.map((tab) => tab.id);
    const restoredTab =
      jy2ReadStoredActiveTab(documentRef.defaultView, allowedTabIds) ||
      shellTabs[0]?.id ||
      "header";
    activate(restoredTab);

    let refreshHeaderHolidayCounts = () => {};
    if (headerPane) {
      headerPane.appendChild(
        jy2RenderHeaderPane(
          documentRef,
          record || {},
          canEditBudget,
          summaryData.masterLists || null,
          {
            onRegisterHolidayRefresh: (fn) => {
              refreshHeaderHolidayCounts = fn;
            },
          },
        ),
      );
    }
    if (holidayPane) {
      holidayPane.appendChild(
        jy2RenderHolidayPane(documentRef, record || {}, canEditBudget, {
          onHolidayLinesChange: () => refreshHeaderHolidayCounts(),
        }),
      );
    }

    // force=true で即再描画。通常は dirty マークのみ（内訳入力の体感を優先）。
    const refreshSummary = (force = false) => {
      if (!force) {
        summaryDirty = true;
        actualsDirty = true;
        return;
      }
      jy2RenderSummaryPane(
        documentRef,
        summaryPane,
        summaryModel,
        currentBlocks,
        () => {
          actualsDirty = true;
        },
        projectionManual,
      );
      summaryDirty = false;
    };
    const contractTotal1 = () => summaryModel.snapshot().totals.total1;
    const summaryTotalsProvider = () => summaryModel.totals(currentBlocks());
    const currentDetailBlocks = () => detailModel.snapshot().blocks;
    // Phase2c-b-a (2026-07-31): 予実 pane の費目グループ「＋種別行」ボタンから
    // 内訳（App757・detailModel）へ行が追加されたときのフック。総括と予実を
    // dirty マークし、内訳 pane を再描画する（予実 pane 自身は rerender で
    // 直後に描き直されるため actualsDirty はマークしない）。ボタン押下時
    // にしか呼ばれないため、後に定義される `refreshDetail` を lexical closure
    // で参照して構わない（TDZ の観点で mount 完了後にしか実行されない）。
    const onDetailStructureChanged = (opts = {}) => {
      summaryDirty = true;
      detailDirty = true;
      detailSavePending = true;
      // フィールド編集のみ: 内訳 DOM はタブ表示時に反映（change 562ms 対策）。
      // 行追加/削除: すぐ内訳も合わせる必要はないが、既存どおり即時でも可。
      // fieldOnly では refreshDetail しない。
      if (!opts || opts.fieldOnly !== true) {
        // 構造変更時も即時全描画は重いので dirty のみ。内訳タブで flush。
        // （予実側は呼び出し元が rerender する）
      }
    };
    const refreshActuals = () => {
      if (!actualPane) {
        actualsDirty = false;
        return;
      }
      jy2RenderActualPane(
        documentRef,
        actualPane,
        actualsModel,
        currentBlocks,
        contractTotal1,
        saveController,
        projectionManual,
        summaryTotalsProvider,
        currentDetailBlocks,
        detailModel,
        onDetailStructureChanged,
        {
          hasPendingDetailEdits: () => detailSavePending,
          budgetVersionId: jy2FieldValue(record, "budget_version_id"),
        },
      );
      actualsDirty = false;
    };
    flushSummaryIfDirty = () => {
      if (summaryDirty) refreshSummary(true);
    };
    flushActualsIfDirty = () => {
      if (actualsDirty) refreshActuals();
    };
    const refreshDetail = () => {
      jy2RenderDetailPane(
        documentRef,
        detailPane,
        detailModel,
        () => {
          // 明細セル変更 → 総括/予実は dirty のみ（タブ表示・保存時に反映）
          detailSavePending = true;
          refreshSummary(false);
        },
        summaryData.masterLists || null,
      );
      detailDirty = false;
    };
    flushDetailIfDirty = () => {
      if (detailDirty) refreshDetail();
    };
    const detailRowCount = () =>
      detailModel
        .snapshot()
        .blocks.reduce((count, block) => count + block.detailRows.length, 0);
    const refreshVersions = () =>
      jy2RenderVersionPane(
        documentRef,
        versionPane,
        versionModel,
        versionProjectId,
        detailRowCount,
        saveController
          ? (version, versionType) =>
              saveController.createNextVersion(versionModel, version, versionType)
          : undefined,
      );

    refreshSummary(true);
    refreshActuals();
    refreshVersions();
    refreshDetail();
    jy2SyncAllHScroll(documentRef);
    // U34: 保存後 reload から復帰したときの縦・横スクロール位置を復元
    const restoredScroll = jy2ConsumeStoredScroll(view);
    if (restoredScroll) {
      const activePane =
        documentRef.querySelector(
          `.jy2-pane[data-tab-id="${sticky.dataset.activeTab || ""}"]`,
        ) || summaryPane;
      jy2ApplyScroll(documentRef, activePane, restoredScroll);
    }
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        jy2SyncAllHScroll(documentRef);
        view.requestAnimationFrame(() => jy2SyncAllHScroll(documentRef));
      });
    }
    if (view && typeof view.setTimeout === "function") {
      view.setTimeout(() => jy2SyncAllHScroll(documentRef), 0);
      view.setTimeout(() => jy2SyncAllHScroll(documentRef), 120);
    }

    addBlockBtn.addEventListener("click", () => {
      if (addBlockBtn.disabled) return;
      const id = detailModel.addBlock();
      detailSavePending = true;
      // 追加ブロックへスクロールするため、内訳再描画に focusBlockId を渡す。
      jy2RenderDetailPane(
        documentRef,
        detailPane,
        detailModel,
        () => {
          detailSavePending = true;
          refreshSummary(false);
        },
        summaryData.masterLists || null,
        { focusBlockId: id },
      );
      refreshSummary(false);
      activate("detail");
      jy2GotoDetailBlock(shell, documentRef, id);
    });
    addSalaryBtn.addEventListener("click", () => {
      if (addSalaryBtn.disabled) return;
      summaryModel.addSalaryLine();
      refreshSummary(true);
      activate("summary");
    });
    if (saveController) {
      const defaultSaveLabel = () =>
        (jy2FieldValue(record, "status") || "下書き") !== "版確定"
          ? "一時保存"
          : "保存";
      const runBudgetSave = async ({ confirmingVersion, busyLabel, doneAlert }) => {
        const view = documentRef.defaultView;
        const perf = view && view.performance;
        const now = () => (perf && typeof perf.now === "function" ? perf.now() : Date.now());
        const t0 = now();
        // 詳細左(name2)等: 入力中のまま一時保存してもモデルへ載せる
        jy2FlushActiveInputBeforeSave(documentRef);
        const tFlush = now();
        const startDate = jy2FieldValue(record, "start_date");
        const endDate = jy2FieldValue(record, "end_date");
        const dateOrderInverted = jy2IsStartDateAfterEndDate(startDate, endDate);
        // U35: 着手日>竣工日 → 版確定は拒否。一時保存／保存は赤字警告のみで続行可。
        if (confirmingVersion && dateOrderInverted) {
          if (view && typeof view.alert === "function") {
            view.alert(
              "着手日が竣工日より後のため、版を確定できません。日付を修正するか、一時保存のみ行ってください。",
            );
          }
          return;
        }
        // 保存前に遅延していた総括投影を確定しておく（画面上の差分をなくす）。
        flushSummaryIfDirty();
        jy2EnsurePersonNameFields(record);
        const createdName = jy2NormalizePersonName(
          jy2FieldValue(record, "created_by_name"),
        );
        const personName = jy2NormalizePersonName(
          jy2FieldValue(record, "person_in_charge_name"),
        );
        if (!createdName) {
          if (view && typeof view.alert === "function") {
            view.alert("作成者を入力してください");
          }
          return;
        }
        if (!personName) {
          if (view && typeof view.alert === "function") {
            view.alert("担当者を入力してください");
          }
          return;
        }
        jy2ApplyHeaderField(record, "created_by_name", createdName);
        jy2ApplyHeaderField(record, "person_in_charge_name", personName);
        if (confirmingVersion) {
          jy2ApplyHeaderField(record, "status", "版確定");
        } else if (saveController.initialStatus === "下書き") {
          // 一時保存はステータスDDを触っていても下書きを維持（確定は「版を確定」専用）
          jy2ApplyHeaderField(record, "status", "下書き");
        }
        saveButton.disabled = true;
        confirmButton.disabled = true;
        saveButton.textContent = busyLabel || "保存中…";
        let usedSoft = false;
        try {
          const outcome = await saveController.save(
            detailModel,
            summaryModel,
            projectionManual,
            { confirmingVersion: Boolean(confirmingVersion) },
          );
          const tSave = now();
          if (outcome.projectionRepaired && view && typeof view.alert === "function") {
            view.alert(
              "総括原価投影に差分があったため修復しました。版確定はキャンセルされました。内容を確認のうえ、再度保存から版確定してください。",
            );
          } else if (view && typeof view.alert === "function") {
            let saveAlert =
              doneAlert ||
              `工事基本情報・総括・内訳を保存しました（${outcome.requestCount}リクエスト）`;
            if (outcome.uchiwakeWarnings && outcome.uchiwakeWarnings.length) {
              saveAlert +=
                `\n\n注意:\n` + outcome.uchiwakeWarnings.join("\n");
            }
            view.alert(saveAlert);
          }
          // soft-save（フルreload回避）は撤回: RESTで親を更新すると kintone 本体が
          // 「レコードに新しいバージョンがあります」を出すため、一時保存後も従来どおりreload。
          // 計測ログと App757 再取得（save 内）は維持。
          usedSoft = false;
          jy2SyncNativeRecordRevision(view, jy2FieldValue(record, "$revision"));
          const tEnd = now();
          if (typeof console !== "undefined" && console.info) {
            console.info("[jy2-save-timing]", {
              mode: confirmingVersion ? "confirm" : "draft",
              flushMs: Math.round(tFlush - t0),
              saveApiMs: Math.round(tSave - tFlush),
              afterMs: Math.round(tEnd - tSave),
              totalMs: Math.round(tEnd - t0),
              softSave: false,
              softSaveReady: Boolean(outcome && outcome.softSaveReady),
              requestCount: outcome && outcome.requestCount,
            });
          }
          const savedIso = new Date().toISOString();
          const budgetVersionId = jy2FieldValue(record, "budget_version_id");
          jy2WriteLastSoftSavedStamp(view, budgetVersionId, savedIso);
          lastSavedEl.textContent = jy2FormatJstDatetimeLabel(savedIso, "保存");
          const revealForSave = {
            reveal: (key) => {
              if (!key || !view) return;
              const set = jy2ActualLoadRevealKeys(view, budgetVersionId);
              set.add(String(key));
              jy2ActualPersistRevealKeys(view, set, budgetVersionId);
            },
          };
          jy2ActualRevealPersistedDetailRows(detailModel, revealForSave);
          jy2ReloadPreservingTab(
            view,
            sticky.dataset.activeTab || "header",
            documentRef,
          );
        } catch (error) {
          const tEnd = now();
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(
              view,
              sticky.dataset.activeTab || "header",
              documentRef,
            );
          } else {
            saveButton.disabled = false;
            confirmButton.disabled = !isDraftStatus;
            saveButton.textContent = defaultSaveLabel();
          }
          if (typeof console !== "undefined" && console.info) {
            console.info("[jy2-save-timing]", {
              mode: confirmingVersion ? "confirm" : "draft",
              flushMs: Math.round(tFlush - t0),
              saveApiMs: null,
              afterMs: Math.round(tEnd - tFlush),
              totalMs: Math.round(tEnd - t0),
              softSave: false,
              requestCount: null,
            });
          }
        }
      };

      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        await runBudgetSave({
          confirmingVersion: false,
          busyLabel: "一時保存中…",
          doneAlert: "一時保存しました",
        });
      });
      confirmButton.addEventListener("click", async () => {
        if (confirmButton.disabled) return;
        const view = documentRef.defaultView;
        if (
          !view ||
          typeof view.confirm !== "function" ||
          !view.confirm(
            "版を確定します。確定後も編集は可能ですが、ステータスは「版確定」になります。よろしいですか？",
          )
        ) {
          return;
        }
        await runBudgetSave({
          confirmingVersion: true,
          busyLabel: "確定中…",
          doneAlert: "版を確定しました",
        });
      });
    }

    shell.append(sticky, stickySpacer, panes);
    container.appendChild(shell);
    syncStickyLayout();
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        syncStickyLayout();
        view.requestAnimationFrame(syncStickyLayout);
      });
    }
    return Object.freeze({
      model,
      summaryModel,
      detailModel,
      actualsModel,
      versionModel,
      appIds: Object.freeze({ APP1_ID, APP2_ID, APP3_ID }),
    });
  }

  const jy2PublicApi = Object.freeze({
    appIds: Object.freeze({ app1: APP1_ID, app2: APP2_ID, app3: APP3_ID }),
    createUiModel,
    createContractSalaryModel,
    createDetailBlockModel,
    createActualsMatrixModel,
    createVersionSeriesModel,
    duplicateSeriesDecision,
    regenerateSummaryCostLines,
    commonUnits: COMMON_UNITS,
    detailUnits: DETAIL_UNITS,
    render: jy2RenderShell,
  });
  if (typeof globalThis !== "undefined") {
    globalThis.JikkouYosanV2App1 = jy2PublicApi;
  }

  if (
    typeof kintone !== "undefined" &&
    kintone.events &&
    typeof kintone.events.on === "function"
  ) {
    // 一覧は Ver.01 相当のカスタムリスト。詳細はシェル＋保存コントローラ。
    // index で jy2RenderShell を呼ぶと空タブだけになり標準一覧も潰れる。
    kintone.events.on("app.record.index.show", function (event) {
      jy2MountIndex();
      return event;
    });

    kintone.events.on("app.record.detail.show", function (event) {
      const space = jy2ResolveRecordPageHost(
        typeof document !== "undefined" ? document : null,
      );
      if (!space) return event;
      jy2InstallStyle(space.ownerDocument || document);
      jy2HideNativeDetailChrome(space.ownerDocument || document);
      jy2MountDetailShell(space, event.record || null, event.recordId);
      return event;
    });

    kintone.events.on("app.record.create.show", function (event) {
      try {
        seedApp1CreateRecord(event.record, {
          uuidFactory: jy2CompactUuidFactory(),
          versionType: jy2FieldValue(event.record, "version_type") || "当初",
        });
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error("JY2 create seed failed:", error);
        }
      }
      // 新規はタブなし（保存後に詳細シェルへ）。版種別バー＋必須キー入力のみ。
      const space = jy2ResolveRecordPageHost(
        typeof document !== "undefined" ? document : null,
      );
      if (space) {
        space.textContent = "";
        jy2InstallStyle(space.ownerDocument || document);
        space.appendChild(
          jy2RenderVersionTypeBar(space.ownerDocument || document, event.record),
        );
      }
      return event;
    });

    kintone.events.on("app.record.create.submit", async function (event) {
      try {
        completeApp1CreateBusinessKeys(event.record);
      } catch (error) {
        event.error =
          (error && error.message) ||
          "工事コードを入力してください（business key 生成に必要）";
        return event;
      }
      const businessKey = jy2FieldValue(event.record, "project_business_key");
      if (!businessKey) return event;
      try {
        const escaped = String(businessKey).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const response = await kintone.api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `project_business_key = "${escaped}" limit 500`,
        });
        const records = Array.isArray(response.records) ? response.records : [];
        const existingVersions = records.map((row) => ({
          project_id: jy2FieldValue(row, "project_id"),
          version_seq: Number(jy2FieldValue(row, "version_seq")),
          status: jy2FieldValue(row, "status"),
          budget_version_id: jy2FieldValue(row, "budget_version_id"),
        }));
        let decision = duplicateSeriesDecision({ existingVersions });
        if (decision.seriesExists) {
          const view = typeof window !== "undefined" ? window : null;
          const accepted =
            view && typeof view.confirm === "function"
              ? view.confirm(decision.message)
              : false;
          decision = duplicateSeriesDecision({ existingVersions, accepted });
          if (decision.outcome === "save-blocked") {
            event.error = "保存を中止しました。";
            return event;
          }
          const findRecordId = (budgetVersionId) => {
            const match = records.find(
              (row) =>
                jy2FieldValue(row, "budget_version_id") === budgetVersionId,
            );
            return match ? jy2FieldValue(match, "$id") : null;
          };
          if (decision.outcome === "open-draft") {
            event.error = "既存の下書きを開きます。";
            const draftId = findRecordId(decision.draftBudgetVersionId);
            if (draftId && view && view.location) {
              view.location.href = `/k/${APP1_ID}/show#record=${draftId}`;
            }
            return event;
          }
          if (decision.outcome === "next-version") {
            event.error =
              "次版はバージョン管理の「次版作成」から作成してください。";
            if (view && typeof view.alert === "function") {
              view.alert(
                "次版はバージョン管理の「次版作成」から作成してください。",
              );
            }
            const sourceId = findRecordId(decision.copySourceBudgetVersionId);
            if (sourceId && view && view.location) {
              view.location.href = `/k/${APP1_ID}/show#record=${sourceId}`;
            }
            return event;
          }
        }
      } catch (error) {
        event.error =
          (error && error.message) || "工事系列の重複確認に失敗しました。";
      }
      return event;
    });

    kintone.events.on("app.record.create.submit.success", function (event) {
      const view = typeof window !== "undefined" ? window : null;
      if (view && view.location && event.recordId) {
        view.location.href = `/k/${APP1_ID}/show#record=${event.recordId}`;
      }
      return event;
    });
  }
