(function () {
  "use strict";

  /** PC台帳（594）。記事欄へ退職利用分を追記する */
  var APP594 = "594";

  function escapeForQuery(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  /**
   * @param {string} dateStr kintone 日付 "YYYY-MM-DD"
   * @returns {string} 例: 2026年04
   */
  function toYearMonthJa(dateStr) {
    if (!dateStr) return "";
    var parts = String(dateStr).split("-");
    if (parts.length < 2) return "";
    return parts[0] + "年" + parts[1] + "月";
  }

  function chunk(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  function appendRetireNoteToPcLedger(record) {
    var mail = record.mail && record.mail.value;
    var retiredRaw = record.retired_date && record.retired_date.value;
    var userName = (record.user_name && record.user_name.value) || "";

    if (!mail || !retiredRaw) {
      return Promise.resolve();
    }

    var ym = toYearMonthJa(retiredRaw);
    if (!ym) {
      return Promise.resolve();
    }

    var displayName = userName || String(mail).split("@")[0];
    var newLine = ym + "　" + displayName + "（退職者）利用分";

    var urlGet = kintone.api.url("/k/v1/records.json", true);
    return kintone
      .api(urlGet, "GET", {
        app: APP594,
        query: 'mail = "' + escapeForQuery(mail) + '"',
        fields: ["$id", "note"]
      })
      .then(function (resp) {
        var list = resp.records || [];
        var updates = [];
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          var cur = (r.note && r.note.value) || "";
          if (cur.indexOf(newLine) !== -1) {
            continue;
          }
          var next = cur ? cur + "\n" + newLine : newLine;
          updates.push({
            id: r.$id.value,
            record: { note: { value: next } }
          });
        }
        if (updates.length === 0) {
          return;
        }
        var urlPut = kintone.api.url("/k/v1/records.json", true);
        var parts = chunk(updates, 100);
        return parts.reduce(function (chain, part) {
          return chain.then(function () {
            return kintone.api(urlPut, "PUT", {
              app: APP594,
              records: part
            });
          });
        }, Promise.resolve());
      });
  }

  var ev = ["app.record.create.submit.success", "app.record.edit.submit.success"];

  kintone.events.on(ev, function (event) {
    return appendRetireNoteToPcLedger(event.record).then(function () {
      return event;
    }).catch(function (e) {
      console.error("[jbis 595→594 note]", e);
      var msg =
        "PC台帳（594）の記事欄への追記に失敗しました。権限・ネットワークを確認し、必要なら手動で追記してください。";
      if (e && e.message) {
        msg += "\n" + e.message;
      }
      alert(msg);
      return event;
    });
  });
})();
