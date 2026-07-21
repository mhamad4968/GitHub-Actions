  const APP1_ID = /* @JY_V2_APP1 */ 756;
  const APP2_ID = /* @JY_V2_APP2 */ 757;
  const APP3_ID = /* @JY_V2_APP3 */ 758;

  const JY2_STYLE_ID = "jy2-shell-style";
  const JY2_TAX_RATE_LABELS = { "0": "0％", "0.08": "8％", "0.1": "10％" };

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
    if (!documentRef || documentRef.getElementById(JY2_STYLE_ID)) return;
    const style = documentRef.createElement("style");
    style.id = JY2_STYLE_ID;
    style.textContent = [
      ".jy2-shell{font-family:Arial,'Yu Gothic',sans-serif;background:#f4f7fb;border:1px solid #b8c5d6;color:#172b4d}",
      ".jy2-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#1f4e78;color:#fff}",
      ".jy2-title{margin:0;font-size:20px}",
      ".jy2-header-stub{font-size:12px;opacity:.85}",
      ".jy2-tabs{display:flex;gap:2px;padding:8px 8px 0;background:#d9e2f3}",
      ".jy2-tab{border:1px solid #a6b7ca;border-bottom:0;background:#eaf0f8;padding:9px 18px;cursor:pointer}",
      ".jy2-tab[aria-selected='true']{background:#fff;font-weight:700}",
      ".jy2-tab[data-read-only='true']::after{content:' 🔒';font-size:11px}",
      ".jy2-pane{display:none;min-height:240px;padding:18px;background:#fff;border-top:1px solid #a6b7ca}",
      ".jy2-pane[data-active='true']{display:block}",
      ".jy2-empty{color:#6b778c;font-size:13px}",
      ".jy2-section-title{margin:14px 0 6px;font-size:14px;border-left:4px solid #1f4e78;padding-left:8px}",
      ".jy2-table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:12px}",
      ".jy2-table th,.jy2-table td{border:1px solid #b8c5d6;padding:4px 6px;text-align:left}",
      ".jy2-table th{background:#dbe5f1;font-weight:700}",
      ".jy2-band-row th{background:#eef3fa;text-align:left}",
      ".jy2-total-row td{background:#f5f8fc;font-weight:700}",
      ".jy2-num{text-align:right}",
      // U21 cell-type tints: auto=blue / manual=yellow / list=green.
      ".jy2-amount{text-align:right;background:#F3F8FC}",
      ".jy2-input{width:100%;box-sizing:border-box;border:1px solid #c4cfdd;padding:2px 4px;background:#FFFCF3}",
      ".jy2-select{width:100%;box-sizing:border-box;border:1px solid #c4cfdd;padding:2px 4px;background:#F4FAF4}",
      ".jy2-row-button{border:1px solid #a6b7ca;background:#eaf0f8;padding:1px 8px;cursor:pointer;font-size:11px}",
      ".jy2-projection-table td{background:#fff}",
      ".jy2-projection-table .jy2-amount{background:#F3F8FC}",
      ".jy2-summary-footer{border-collapse:collapse;font-size:13px;margin-top:8px}",
      ".jy2-summary-footer th,.jy2-summary-footer td{border:1px solid #b8c5d6;padding:5px 12px}",
      ".jy2-summary-footer .jy2-key-row td{font-weight:700;background:#f5f8fc}",
      ".jy2-summary-footer .jy2-sub-row td{font-size:11px;color:#42526e}",
      ".jy2-detail-block{border:1px solid #a6b7ca;margin:0 0 18px;background:#fff}",
      ".jy2-detail-block[data-block-status='retired']{opacity:.6}",
      ".jy2-detail-block-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 8px;background:#dbe5f1;font-size:12px}",
      ".jy2-detail-block-head label{display:flex;align-items:center;gap:4px}",
      ".jy2-detail-block-head input,.jy2-detail-block-head select{min-width:110px}",
      // U22: 内訳№ is auto (pale blue), shown left of システム入力工種.
      ".jy2-block-no{font-weight:700;background:#F3F8FC;padding:2px 8px;border:1px solid #c4cfdd}",
      ".jy2-block-actions{margin-left:auto;display:flex;gap:4px}",
      ".jy2-detail-table{margin:0}",
      ".jy2-footer-row td{background:#f5f8fc}",
      ".jy2-footer-row .jy2-footer-label{font-weight:700}",
      ".jy2-block-total-row td{background:#eef3fa;font-weight:700}",
      // U29: missing 区分 warning is red text only; saving is never blocked.
      ".jy2-warning{color:#c9372c;font-size:12px;margin:4px 0}",
      ".jy2-retired-tag{color:#c9372c;font-weight:700}",
      // 予実 matrix (4d): wide month grid scrolls; totals reuse jy2-total-row.
      ".jy2-actual-scroll{overflow-x:auto}",
      ".jy2-actual-table{white-space:nowrap}",
      ".jy2-actual-table .jy2-input{min-width:72px}",
      ".jy2-actual-note{color:#6b778c;font-size:11px;margin:2px 0 8px}",
      // 版管理 (4e): lock badges follow §10.0k minimum lock UI.
      ".jy2-version-table td{background:#fff}",
      ".jy2-version-table tr[data-current='true'] td{background:#f5f8fc}",
      ".jy2-lock-badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;font-weight:700;border:1px solid #a6b7ca}",
      ".jy2-lock-badge[data-lock='editable']{background:#e3fcef;color:#006644;border-color:#79d2a3}",
      ".jy2-lock-badge[data-lock='budget_locked']{background:#fff7e6;color:#974f0c;border-color:#e2b203}",
      ".jy2-lock-badge[data-lock='full_locked']{background:#ffebe6;color:#c9372c;border-color:#f0a396}",
      ".jy2-version-cta[disabled]{opacity:.45;cursor:not-allowed}",
      ".jy2-version-status{font-size:12px;margin:6px 0;color:#172b4d}",
      // Phase C-2b: header save button for the App2 atomic save path.
      ".jy2-save-button{border:1px solid #0b3d66;background:#2e7d32;color:#fff;padding:6px 16px;font-weight:700;cursor:pointer;border-radius:3px}",
      ".jy2-save-button[disabled]{opacity:.5;cursor:not-allowed}",
    ].join("");
    documentRef.head.appendChild(style);
  }

  function jy2Comma(text) {
    if (text === null || text === undefined || text === "") return "";
    const parts = String(text).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function jy2AmountDisplay(decimalAmount) {
    return decimalAmount === null || decimalAmount === undefined
      ? ""
      : jy2Comma(displayInteger(decimalAmount));
  }

  // D-31/D-32: 対①率 = 金額÷①, shown as percent with 1 decimal, ①=0 → 0.
  function jy2Percent(fraction) {
    if (fraction === null || fraction === undefined) return "－";
    return `${round(multiply(fraction, "100"), 1)}%`;
  }

  function jy2Cell(documentRef, tag, className, text) {
    const cell = documentRef.createElement(tag);
    if (className) cell.className = className;
    cell.textContent = text === null || text === undefined ? "" : String(text);
    return cell;
  }

  function jy2TextInput(documentRef, value, onCommit) {
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input";
    input.value = value === null || value === undefined ? "" : String(value);
    input.addEventListener("change", () => onCommit(input.value.trim()));
    return input;
  }

  function jy2UnitSelect(documentRef, value, onCommit, units = COMMON_UNITS) {
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "";
    select.appendChild(blank);
    for (const unit of units) {
      const option = documentRef.createElement("option");
      option.value = unit;
      option.textContent = unit;
      select.appendChild(option);
    }
    select.value = value === null || value === undefined ? "" : String(value);
    select.addEventListener("change", () => onCommit(select.value));
    return select;
  }

  function jy2RowButton(documentRef, label, onClick) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "jy2-row-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function jy2HeadRow(documentRef, labels) {
    const row = documentRef.createElement("tr");
    for (const label of labels) row.appendChild(jy2Cell(documentRef, "th", "", label));
    return row;
  }

  // 請負金額 (§7.1a): 施工/保安 bands, amount = auto decimal shown as integer,
  // 対①率 = 行金額÷①（D-31/D-32: ①=0 → 0, 金額なし → 「－」）.
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
        "契約工種",
        "単位",
        "数量",
        "単価",
        "金額（税抜）",
        "対①率",
        "備考",
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
      bandHead.colSpan = 8;
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
            jy2TextInput(documentRef, line.workName, commit("workName")),
          );
          const unit = jy2Cell(documentRef, "td", "", "");
          unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
          const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
          quantity.appendChild(
            jy2TextInput(documentRef, line.quantity, commit("quantity")),
          );
          const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
          unitPrice.appendChild(
            jy2TextInput(documentRef, line.unitPrice, commit("unitPrice")),
          );
          const note = jy2Cell(documentRef, "td", "", "");
          note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
          row.append(workName, unit, quantity, unitPrice);
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(line.amount))),
          );
          row.appendChild(note);
          const action = jy2Cell(documentRef, "td", "", "");
          action.appendChild(
            jy2RowButton(documentRef, "削除", () => {
              summaryModel.removeContractLine(line.rowKey);
              rerender();
            }),
          );
          row.appendChild(action);
        } else {
          row.appendChild(jy2Cell(documentRef, "td", "", line.workName));
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
      totalLabel.colSpan = 5;
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
    return table;
  }

  // 給与手当 (D-30/X7): 総括直入力, 消費税・税込は「－」, at least 1 row.
  function jy2SalaryTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-salary-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "役職・名称",
        "単位",
        "数量",
        "単価",
        "金額（税抜）",
        "消費税",
        "備考",
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
        const unit = jy2Cell(documentRef, "td", "", "");
        unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
        const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
        quantity.appendChild(
          jy2TextInput(documentRef, line.quantity, commit("quantity")),
        );
        const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
        unitPrice.appendChild(
          jy2TextInput(documentRef, line.unitPrice, commit("unitPrice")),
        );
        const note = jy2Cell(documentRef, "td", "", "");
        note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
        row.append(role, unit, quantity, unitPrice);
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(note);
        const action = jy2Cell(documentRef, "td", "", "");
        action.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            summaryModel.removeSalaryLine(line.rowKey);
            rerender();
          }),
        );
        row.appendChild(action);
      } else {
        row.appendChild(jy2Cell(documentRef, "td", "", line.role));
        row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
        row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
        );
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(jy2Cell(documentRef, "td", "", line.note));
        row.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(row);
    }

    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-total-row";
    const totalLabel = jy2Cell(documentRef, "td", "", "給与計");
    totalLabel.colSpan = 4;
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
    totalTail.colSpan = 3;
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

  // 総括原価投影 (P-21/P-33): read-only cache regenerated from App2 active
  // block totals. Amounts are never edited here nor written back to App2.
  function jy2ProjectionTable(documentRef, projectionRows) {
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-projection-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "内訳№",
        "費用区分",
        "工種番号",
        "システム入力工種",
        "種別",
        "単位",
        "数量",
        "単価",
        "金額（税抜）",
        "消費税率",
        "金額（税込）",
        "対①率",
        "計算基準",
        "備考",
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
      emptyCell.colSpan = 14;
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
    }
    for (const line of projectionRows) {
      const row = documentRef.createElement("tr");
      row.dataset.stableBlockId = line.summary_stable_block_id;
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", line.summary_block_no),
      );
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_cost_category));
      row.appendChild(
        jy2Cell(documentRef, "td", "", line.summary_work_type_code),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "", line.summary_work_type_name),
      );
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_line_type));
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
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "",
          JY2_TAX_RATE_LABELS[line.summary_tax_rate] || line.summary_tax_rate,
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(line.summary_amount_incl_tax),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Percent(line.summary_rate_to_1),
        ),
      );
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_calc_basis));
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_note));
      body.appendChild(row);
    }
    table.appendChild(body);
    return table;
  }

  // D-31: ①⑧⑨ as main rows, cost-section subtotals smaller, each with 対①率.
  function jy2SummaryFooter(documentRef, totals) {
    const rateTo1 = (amount) => ratio(amount, totals.total1, { zero: "zero" });
    const table = documentRef.createElement("table");
    table.className = "jy2-summary-footer";
    const body = documentRef.createElement("tbody");
    body.appendChild(jy2HeadRow(documentRef, ["項目", "金額（税抜）", "対①率"]));
    const rows = [
      ["① 請負金額合計", totals.total1, "jy2-key-row"],
      ["原価・施工計", totals.costConstruction, "jy2-sub-row"],
      ["原価・保安計", totals.costSafety, "jy2-sub-row"],
      ["給与計", totals.salary, "jy2-sub-row"],
      ["⑧ 工事原価合計", totals.total8, "jy2-key-row"],
      ["⑨ 差引（①－⑧）", totals.profit9, "jy2-key-row"],
    ];
    for (const [label, amount, className] of rows) {
      const row = documentRef.createElement("tr");
      row.className = className;
      row.appendChild(jy2Cell(documentRef, "td", "", label));
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(amount)),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(amount))),
      );
      body.appendChild(row);
    }
    table.appendChild(body);
    return table;
  }

  // onMutated: 総括 edits (請負/給与) change ①, which the 予実 BC率/EC率
  // read live — the shell passes refreshActuals here (Y9/M2).
  function jy2RenderSummaryPane(
    documentRef,
    pane,
    summaryModel,
    blocksProvider,
    onMutated,
  ) {
    pane.textContent = "";
    const editable = summaryModel.allowedOperations.editBudget;
    const rerender = () => {
      jy2RenderSummaryPane(
        documentRef,
        pane,
        summaryModel,
        blocksProvider,
        onMutated,
      );
      if (onMutated) onMutated();
    };

    const blocks = blocksProvider();
    const totals = summaryModel.totals(blocks);
    const projectionRows = regenerateSummaryCostLines(blocks, {
      contractTotal1: totals.total1,
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
      "工事原価（内訳ブロックからの投影・編集不可）",
    );
    pane.append(
      contractTitle,
      jy2ContractTable(documentRef, summaryModel, editable, rerender),
      salaryTitle,
      jy2SalaryTable(documentRef, summaryModel, editable, rerender),
      projectionTitle,
      jy2ProjectionTable(documentRef, projectionRows),
      jy2SummaryFooter(documentRef, totals),
    );
  }

  // 内訳ブロック1つ分 (Phase 4c): App2-shaped in-memory block with U20 full
  // footer. 小計・計 are system totals (U25) and never editable.
  function jy2DetailBlock(documentRef, detailModel, block, editable, rerender) {
    const section = documentRef.createElement("section");
    section.className = "jy2-detail-block";
    section.dataset.stableBlockId = block.stableBlockId;
    section.dataset.blockStatus = block.status;
    const retired = block.status === "retired";
    const blockEditable = editable && !retired;

    const head = documentRef.createElement("div");
    head.className = "jy2-detail-block-head";
    const no = documentRef.createElement("span");
    no.className = "jy2-block-no";
    no.textContent = retired ? "廃止" : `No.${block.blockNo}`;
    if (retired) no.classList.add("jy2-retired-tag");
    head.appendChild(no);

    const commitHeader = (field) => (value) => {
      detailModel.updateBlockHeader(block.stableBlockId, { [field]: value });
      rerender();
    };
    const headerField = (labelText, control) => {
      const label = documentRef.createElement("label");
      label.appendChild(jy2Cell(documentRef, "span", "", labelText));
      label.appendChild(control);
      head.appendChild(label);
    };
    if (blockEditable) {
      headerField(
        "工種番号",
        jy2TextInput(documentRef, block.workTypeCode, commitHeader("workTypeCode")),
      );
      headerField(
        "システム入力工種",
        jy2TextInput(documentRef, block.workTypeName, commitHeader("workTypeName")),
      );
      // U29: 区分 sits left of 取引先; list-select colored (green).
      headerField(
        "区分",
        jy2UnitSelect(
          documentRef,
          block.costCategory,
          commitHeader("costCategory"),
          CONTRACT_SECTIONS,
        ),
      );
      headerField(
        "取引先",
        jy2TextInput(documentRef, block.vendorName, commitHeader("vendorName")),
      );
      const actions = documentRef.createElement("div");
      actions.className = "jy2-block-actions";
      actions.appendChild(
        jy2RowButton(documentRef, "↑", () => {
          detailModel.moveBlock(block.stableBlockId, -1);
          rerender();
        }),
      );
      actions.appendChild(
        jy2RowButton(documentRef, "↓", () => {
          detailModel.moveBlock(block.stableBlockId, 1);
          rerender();
        }),
      );
      // P-39: blocks with actuals are retired, never physically deleted.
      if (block.hasActuals) {
        actions.appendChild(
          jy2RowButton(documentRef, "廃止", () => {
            detailModel.retireBlock(block.stableBlockId);
            rerender();
          }),
        );
      } else {
        actions.appendChild(
          jy2RowButton(documentRef, "ブロック削除", () => {
            detailModel.removeBlock(block.stableBlockId);
            rerender();
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
            block.workTypeName,
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
    body.appendChild(
      jy2HeadRow(documentRef, [
        "名称・規格1",
        "名称・規格2",
        "名称・規格3",
        "単位",
        "数量",
        "単価",
        "金額（税抜）",
        "備考",
        "",
      ]),
    );

    for (const row of block.detailRows) {
      const tr = documentRef.createElement("tr");
      tr.dataset.rowKey = row.rowKey;
      const commit = (field) => (value) => {
        detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
          [field]: value,
        });
        rerender();
      };
      if (blockEditable) {
        for (const field of ["name1", "name2", "name3"]) {
          const cell = jy2Cell(documentRef, "td", "", "");
          cell.appendChild(jy2TextInput(documentRef, row[field], commit(field)));
          tr.appendChild(cell);
        }
        const unit = jy2Cell(documentRef, "td", "", "");
        unit.appendChild(
          jy2UnitSelect(documentRef, row.unit, commit("unit"), DETAIL_UNITS),
        );
        tr.appendChild(unit);
        for (const field of ["quantity", "unitPrice"]) {
          const cell = jy2Cell(documentRef, "td", "jy2-num", "");
          cell.appendChild(jy2TextInput(documentRef, row[field], commit(field)));
          tr.appendChild(cell);
        }
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        const note = jy2Cell(documentRef, "td", "", "");
        note.appendChild(jy2TextInput(documentRef, row.note, commit("note")));
        tr.appendChild(note);
        const ops = jy2Cell(documentRef, "td", "", "");
        ops.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, -1);
            rerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, 1);
            rerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            detailModel.removeDetailRow(block.stableBlockId, row.rowKey);
            rerender();
          }),
        );
        tr.appendChild(ops);
      } else {
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name1));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name2));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name3));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.unit));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.quantity));
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(row.unitPrice)),
        );
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        tr.appendChild(jy2Cell(documentRef, "td", "", row.note));
        tr.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(tr);
    }

    if (blockEditable) {
      const addRow = documentRef.createElement("tr");
      const addCell = jy2Cell(documentRef, "td", "", "");
      addCell.colSpan = 9;
      addCell.appendChild(
        jy2RowButton(documentRef, "明細行追加", () => {
          detailModel.addDetailRow(block.stableBlockId);
          rerender();
        }),
      );
      addRow.appendChild(addCell);
      body.appendChild(addRow);
    }

    // U20 fixed footer: 諸経費 → 各種保険料 → 小計 → 法定福利費 → 計.
    // Manual amounts may stay blank (counted as 0 in totals = U25).
    for (const kind of BLOCK_FOOTER_KINDS) {
      const footerRow = block.footer[kind];
      const tr = documentRef.createElement("tr");
      tr.className =
        kind === "block_total"
          ? "jy2-footer-row jy2-block-total-row"
          : "jy2-footer-row";
      tr.dataset.rowKind = kind;
      tr.dataset.rowKey = footerRow.rowKey;
      const label = jy2Cell(
        documentRef,
        "td",
        "jy2-footer-label",
        BLOCK_FOOTER_LABELS[kind],
      );
      label.colSpan = 6;
      tr.appendChild(label);
      const manual = MANUAL_FOOTER_KINDS.includes(kind);
      if (manual && blockEditable) {
        const amount = jy2Cell(documentRef, "td", "jy2-num", "");
        amount.appendChild(
          jy2TextInput(documentRef, footerRow.amount, (value) => {
            detailModel.updateFooterAmount(block.stableBlockId, kind, value);
            rerender();
          }),
        );
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
    section.appendChild(table);
    return section;
  }

  // 内訳 tab (Phase 4c): offline in-memory editor over App2-shaped blocks.
  // Every mutation re-renders this pane and refreshes the summary projection
  // (投影キャッシュ) and ①⑧⑨ via refreshSummary.
  function jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary) {
    pane.textContent = "";
    const editable = detailModel.allowedOperations.editBudget;
    const rerender = () => {
      jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary);
      refreshSummary();
    };
    const snapshot = detailModel.snapshot();

    for (const warning of detailModel.categoryWarnings()) {
      pane.appendChild(jy2Cell(documentRef, "p", "jy2-warning", warning));
    }

    if (snapshot.blocks.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "内訳ブロックなし（新規はブロック0から。追加ボタンで開始）",
        ),
      );
    }
    for (const block of snapshot.blocks) {
      pane.appendChild(
        jy2DetailBlock(documentRef, detailModel, block, editable, rerender),
      );
    }
    if (editable) {
      pane.appendChild(
        jy2RowButton(documentRef, "工種ブロック追加", () => {
          detailModel.addBlock();
          rerender();
        }),
      );
    }
  }

  function jy2MonthLabel(month) {
    const [year, monthNumber] = month.split("-");
    return `${year}年${Number(monthNumber)}月`;
  }

  // One 予実 cost row (Y3/Y9): budget attributes read-only (Y10), month cells
  // and 最終予算額 editable when editActuals, metrics always auto. Y9 rates:
  // BC率＝現行予算÷①（現行予算の隣）・EC率＝最終予算額÷①（最終の隣）.
  function jy2ActualRow(documentRef, actualsModel, row, months, editable, rerender) {
    const tr = documentRef.createElement("tr");
    tr.dataset.stableBlockId = row.stableBlockId;
    tr.dataset.costCategory = row.costCategory;
    tr.dataset.blockStatus = row.status;
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        row.status === "retired" ? "jy2-retired-tag" : "jy2-num",
        row.status === "retired" ? "廃止" : row.blockNo,
      ),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "", row.costCategory));
    tr.appendChild(jy2Cell(documentRef, "td", "", row.workTypeCode));
    tr.appendChild(jy2Cell(documentRef, "td", "", row.workTypeName));
    // 現行予算: auto from 内訳 block totals; retired blocks show 0 (P-39/R-11).
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.currentBudget)),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", jy2Percent(row.bcRate)));
    const commit = (patch) => {
      try {
        actualsModel.updateActualRow(row.stableBlockId, row.costCategory, patch);
      } catch {
        // Invalid input (non-integer) is discarded; rerender restores the cell.
      }
      rerender();
    };
    for (const month of months) {
      const cell = jy2Cell(documentRef, "td", "jy2-num", "");
      if (editable) {
        cell.appendChild(
          jy2TextInput(documentRef, row.monthly[month], (value) =>
            commit({ [month]: value }),
          ),
        );
      } else {
        cell.className = "jy2-amount";
        cell.textContent = jy2Comma(row.monthly[month]);
      }
      tr.appendChild(cell);
    }
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.actual)));
    const finalCell = jy2Cell(documentRef, "td", "jy2-num", "");
    if (editable) {
      finalCell.appendChild(
        jy2TextInput(
          documentRef,
          row.finalBudgetManual ? row.finalBudget : "",
          (value) => commit({ finalBudget: value }),
        ),
      );
      if (!row.finalBudgetManual) {
        finalCell.firstChild.placeholder = jy2Comma(row.finalBudget);
      }
    } else {
      finalCell.className = "jy2-amount";
      finalCell.textContent = jy2Comma(row.finalBudget);
    }
    tr.appendChild(finalCell);
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", jy2Percent(row.ecRate)));
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.futureRequired)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.remainingBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(row.consumptionRatio)),
    );
    return tr;
  }

  function jy2ActualTotalRow(documentRef, total, label, months) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-total-row";
    tr.dataset.totalCategory = total.costCategory;
    const head = jy2Cell(documentRef, "td", "", label);
    head.colSpan = 4;
    tr.appendChild(head);
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.currentBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(total.bcRate)),
    );
    for (const month of months) {
      tr.appendChild(
        jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.monthly[month])),
      );
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.actual)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.finalBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(total.ecRate)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.futureRequired)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(total.remainingBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(total.consumptionRatio)),
    );
    return tr;
  }

  // 実績 tab (Phase 4d): offline 予実 matrix over App3-shaped actual cells.
  // Rows are the 施工/保安 cost rows only (Y4 — no salary), pivoted wide by
  // month (Y5/Y6). 工事原価/粗利 aggregate rows are deferred to a later phase.
  // contractTotal1Provider feeds ① for the Y9 BC率/EC率 columns (M2).
  function jy2RenderActualPane(
    documentRef,
    pane,
    actualsModel,
    blocksProvider,
    contractTotal1Provider,
  ) {
    pane.textContent = "";
    const editable = actualsModel.allowedOperations.editActuals;
    const rerender = () =>
      jy2RenderActualPane(
        documentRef,
        pane,
        actualsModel,
        blocksProvider,
        contractTotal1Provider,
      );
    const months = actualsModel.months();
    const blocks = blocksProvider();
    const contractTotal1 = contractTotal1Provider ? contractTotal1Provider() : null;
    const rows = actualsModel.matrixRows(blocks, { contractTotal1 });
    const totals = actualsModel.sectionTotals(blocks, { contractTotal1 });

    pane.appendChild(
      jy2Cell(
        documentRef,
        "h3",
        "jy2-section-title",
        "予実管理（原価行対比・給与手当は対象外）",
      ),
    );
    pane.appendChild(
      jy2Cell(
        documentRef,
        "p",
        "jy2-actual-note",
        "予算属性は表示のみ（編集は内訳・総括）。手入力は月別消化と最終予算額のみ。" +
          "率はBC（現行予算÷①）・EC（最終予算額÷①）・消化率（実績÷現行予算）を併記（Y9）。",
      ),
    );
    if (rows.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "予実対象の原価行なし（内訳タブで施工・保安ブロックを追加してください）",
        ),
      );
      return;
    }

    const scroll = documentRef.createElement("div");
    scroll.className = "jy2-actual-scroll";
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-actual-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "内訳№",
        "区分",
        "工種番号",
        "システム入力工種",
        "現行予算",
        "BC率",
        ...months.map(jy2MonthLabel),
        "実績",
        "最終予算額",
        "EC率",
        "今後必要額",
        "残予算",
        "消化率",
      ]),
    );
    for (const row of rows) {
      body.appendChild(
        jy2ActualRow(documentRef, actualsModel, row, months, editable, rerender),
      );
    }
    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      body.appendChild(
        jy2ActualTotalRow(documentRef, totals[category], `${category}計`, months),
      );
    }
    table.appendChild(body);
    scroll.appendChild(table);
    pane.appendChild(scroll);
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
        "版管理（版一覧・次版作成）",
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
          cta.disabled = true;
          status.className = "jy2-version-status";
          status.textContent = "次版を複製中…";
          try {
            const { plan } = await liveCopy(version);
            if (view && typeof view.alert === "function") {
              view.alert(
                `第${plan.versionSeq}版（下書き）を作成しました。内訳${plan.copies.detailRows}行を複製し、旧版行をロックしました。`,
              );
            }
            if (view && view.location) view.location.reload();
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
    pane.appendChild(table);
    pane.appendChild(status);
  }

  // Phase C-2b: 保存コントローラ。キー（project_id/project_business_key/
  // budget_version_id）と revision が揃った既存レコードでのみ作れる。
  // 送信は planAtomicBudgetSave → executePlan の1回の bulkRequest だけ。
  function jy2CreateSaveController(api, record, recordId) {
    if (typeof api !== "function" || !record || !recordId) return null;
    const projectId = jy2FieldValue(record, "project_id");
    const businessKey = jy2FieldValue(record, "project_business_key");
    const versionId = jy2FieldValue(record, "budget_version_id");
    const revision = jy2FieldValue(record, "$revision");
    if (!projectId || !businessKey || !versionId || !revision) return null;
    const keys = {
      projectId: String(projectId),
      projectBusinessKey: String(businessKey),
      budgetVersionId: String(versionId),
    };
    return Object.freeze({
      keys,
      async loadBlocks() {
        const records = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId, {
          fields: null,
        });
        return app2RecordsToBlocks(records);
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
      // 残A: 総括（請負/給与）サブテーブルは親 PUT に同乗して原子保存される。
      async save(detailModel, summaryModel) {
        const parentRecord = summaryModel
          ? summarySnapshotToSubtables(summaryModel.snapshot())
          : {};
        const existing = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId);
        const inputs = buildDetailSaveInputs({
          app1Id: APP1_ID,
          app2Id: APP2_ID,
          parentRecordId: String(recordId),
          parentRevision: String(revision),
          parentRecord,
          keys,
          rows: detailModel.toApp2Rows(),
          existingRecords: existing,
        });
        const plan = planAtomicBudgetSave(inputs);
        return executePlan(plan, createKintoneApiClient(api));
      },
      // 残B: 最新確定版からの次版複製（1回の bulkRequest・実績は複製しない）。
      async createNextVersion(versionModel, version) {
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
    container.textContent = "";

    const shell = documentRef.createElement("section");
    shell.className = "jy2-shell";

    const header = documentRef.createElement("header");
    header.className = "jy2-header";
    const title = documentRef.createElement("h2");
    title.className = "jy2-title";
    title.textContent = "実行予算書作成支援ツールver02";
    const stub = documentRef.createElement("span");
    stub.className = "jy2-header-stub";
    stub.textContent = `BUILD ${BUILD} / ${model.lockState}`;
    header.append(title, stub);

    // Phase C-2b: 保存は editable のときだけ。失敗は自動リトライせず、
    // 競合（abort_reload）は再読込を強制する。
    const saveController = summaryData.saveController || null;
    if (saveController) {
      const saveButton = documentRef.createElement("button");
      saveButton.type = "button";
      saveButton.className = "jy2-save-button";
      saveButton.textContent = "内訳を保存";
      saveButton.disabled = !detailModel.allowedOperations.editBudget;
      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        saveButton.disabled = true;
        saveButton.textContent = "保存中…";
        const view = documentRef.defaultView;
        try {
          const outcome = await saveController.save(detailModel, summaryModel);
          if (view && typeof view.alert === "function") {
            view.alert(`総括・内訳を保存しました（${outcome.requestCount}リクエスト）`);
          }
          if (view && view.location) view.location.reload();
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict && view && view.location) {
            view.location.reload();
          } else {
            saveButton.disabled = false;
            saveButton.textContent = "内訳を保存";
          }
        }
      });
      header.appendChild(saveButton);
    }

    const tabList = documentRef.createElement("nav");
    tabList.className = "jy2-tabs";
    tabList.setAttribute("role", "tablist");
    const panes = documentRef.createElement("div");
    panes.className = "jy2-panes";

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
    }

    let summaryPane = null;
    let detailPane = null;
    let actualPane = null;
    let versionPane = null;
    model.tabs.forEach((tab, index) => {
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
      if (tab.id === "summary") {
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

    const refreshSummary = () =>
      jy2RenderSummaryPane(
        documentRef,
        summaryPane,
        summaryModel,
        currentBlocks,
        () => refreshActuals(),
      );
    // ① for the 予実 BC率/EC率 columns is read live from the 総括 contract
    // lines (Y9/M2) — contract edits flow into the rates on refreshActuals.
    const contractTotal1 = () => summaryModel.snapshot().totals.total1;
    const refreshActuals = () =>
      jy2RenderActualPane(
        documentRef,
        actualPane,
        actualsModel,
        currentBlocks,
        contractTotal1,
      );
    // Offline sizing input for the next-version plan: the 内訳 detail rows
    // currently in memory stand in for the App2 rows a real copy would move.
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
          ? (version) => saveController.createNextVersion(versionModel, version)
          : undefined,
      );
    refreshSummary();
    refreshActuals();
    refreshVersions();
    // 内訳 mutations refresh both the summary projection and the 予実 current
    // budgets (retire → 現行予算 0 must show up immediately).
    jy2RenderDetailPane(documentRef, detailPane, detailModel, () => {
      refreshSummary();
      refreshActuals();
    });

    shell.append(header, tabList, panes);
    container.appendChild(shell);
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
    kintone.events.on(
      ["app.record.index.show", "app.record.detail.show"],
      function (event) {
        const space =
          typeof kintone.app.getHeaderSpaceElement === "function"
            ? kintone.app.getHeaderSpaceElement()
            : null;
        if (!space) return event;
        const record = event.record || null;
        // Phase C-2b: 詳細画面ではキーの揃った版に限り LIVE の内訳を読み込み、
        // 保存コントローラ付きで描画する。読込失敗時は read-only 表示に落とす。
        const controller =
          event.type === "app.record.detail.show" && typeof kintone.api === "function"
            ? jy2CreateSaveController(kintone.api.bind(kintone), record, event.recordId)
            : null;
        if (controller) {
          Promise.all([controller.loadBlocks(), controller.loadVersions()])
            .then(([detailBlocks, versions]) => {
              // 残A: 総括は開いている親レコードのサブテーブルから復元。
              const summaryLines = app1RecordToSummaryLines(record || {});
              jy2RenderShell(space, record, {
                detailBlocks,
                versions,
                contractLines: summaryLines.contractLines.filter(
                  (line) => line.section,
                ),
                salaryLines: summaryLines.salaryLines,
                saveController: controller,
                projectId: controller.keys.projectId,
              });
            })
            .catch((error) => {
              jy2RenderShell(space, record);
              if (typeof console !== "undefined" && console.error) {
                console.error("JY2 内訳読込に失敗:", error);
              }
            });
          return event;
        }
        jy2RenderShell(space, record);
        return event;
      },
    );
  }
