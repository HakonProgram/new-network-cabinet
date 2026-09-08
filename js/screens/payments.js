/* Billing: top-ups and transaction history. */
(function (w) {
  'use strict';

  var MINW = {};
  function minw(cols) {
    if (!MINW[cols]) MINW[cols] = UI.gridMin(cols);
    return MINW[cols];
  }
  var icon = UI.icon, esc = UI.esc;

  function method() {
    var k = Store.get().ui.payMethod;
    return DATA.PAY_METHODS.find(function (m) { return m.key === k; }) || DATA.PAY_METHODS[0];
  }

  w.Screens = w.Screens || {};
  w.Screens.payments = {
    render: function () {
      var s = Store.get(), u = s.ui, m = method();
      var amt = UI.num(u.payAmount);
      var fee = amt * m.feePct / 100;
      var daily = 3023;

      var methods = DATA.PAY_METHODS.map(function (x) {
        return '<div class="meth-c' + (u.payMethod === x.key ? ' on' : '') + '" data-act="method" data-arg="' + x.key + '">' +
          '<div class="radio"><i></i></div>' +
          '<div><div class="meth-n">' + x.name + '</div><div class="meth-d">' + x.desc + '</div></div></div>';
      }).join('');

      var presets = ['1000', '5000', '20000'].map(function (p) {
        return '<div class="opt' + (u.payAmount === p ? ' on' : '') + '" data-act="preset" data-arg="' + p + '">' +
          UI.money(Number(p)) + '</div>';
      }).join('');

      var ranges = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']].map(function (r) {
        return '<div class="seg' + (u.payRange === r[0] ? ' on' : '') + '" data-act="range" data-arg="' + r[0] + '">' + r[1] + '</div>';
      }).join('');

      var tabs = [['pay', 'Top-ups'], ['inv', 'Invoices']].map(function (t) {
        return '<div class="seg' + (u.payTab === t[0] ? ' on' : '') + '" data-act="tab" data-arg="' + t[0] + '">' + t[1] + '</div>';
      }).join('');

      var pill = function (txt, kind) {
        var cl = kind === 'ok' ? 'pill-ok' : (kind === 'wait' ? 'pill-wait' : 'pill-bad');
        return '<span class="pill ' + cl + '">' + txt + '</span>';
      };

      var cols, heads, align, rows, footLeft;
      if (u.payTab === 'pay') {
        cols = '104px minmax(0,1fr) 110px 100px 120px 130px 120px';
        heads = ['Date', 'Method', 'Amount', 'Fee', 'Credited', 'Status', 'Document'];
        align = ['', '', 'r', 'r', 'r', '', ''];
        rows = s.payments.map(function (h) {
          return '<div class="cell w">' + h.date + '</div><div class="cell">' + esc(h.meth) + '</div>' +
            '<div class="cell r">' + UI.money(h.sum) + '</div>' +
            '<div class="cell r muted">' + (h.fee ? UI.money(h.fee) : '—') + '</div>' +
            '<div class="cell r w">' + (h.ok === 'ok' ? UI.money(h.sum - h.fee) : '—') + '</div>' +
            '<div>' + pill(h.st, h.ok) + '</div><div class="cell muted">' + h.doc + '</div>';
        });
        footLeft = 'Showing ' + s.payments.length + ' ' +
          UI.plural(s.payments.length, 'transaction', 'transactions') + ' for the selected period';
      } else {
        cols = '170px 104px minmax(0,1fr) 120px 150px 120px';
        heads = ['Number', 'Date', 'Period', 'Amount', 'Status', 'Document'];
        align = ['', '', '', 'r', '', ''];
        rows = DATA.INVOICES.map(function (i) {
          return '<div class="cell mono w">' + i.num + '</div><div class="cell">' + i.date + '</div>' +
            '<div class="cell muted">' + i.period + '</div><div class="cell r w">' + UI.money(i.sum) + '</div>' +
            '<div>' + pill(i.st, i.ok) + '</div>' +
            '<div class="cell muted" style="cursor:pointer" data-act="doc">Download PDF</div>';
        });
        footLeft = 'Showing 3 invoices for the selected period';
      }

      var kpi = function (lab, val, hint) {
        return '<div class="kpi"><div class="kpi-lab">' + lab + '</div><div class="kpi-val num">' + val + '</div>' +
          '<div class="hint">' + hint + '</div></div>';
      };
      var days = Math.max(0, Math.floor(s.balance / daily));

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Billing</h1>' +
        '<p class="sub">Prepaid: funds must sit on the balance before the first impression.</p></div></div>' +

        '<div class="kpis">' +
          kpi('Balance', UI.money2(s.balance), 'available to spend') +
          kpi('Avg daily spend', UI.money(daily), 'over the last 30 days') +
          kpi('Runway', days + ' ' + UI.plural(days, 'day', 'days'), 'at the current pace') +
          kpi('Topped up in 30 days', UI.money(95000), '6 transactions') +
        '</div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Add funds</div>' +
          '<div class="card-s">The provider fee is deducted when the payment is credited</div></div>' +
          '<div class="card-b"><div class="pay-grid">' +
            '<div style="display:flex;flex-direction:column;gap:18px">' +
              '<div class="field"><label class="lab">Payment method</label><div class="meth">' + methods + '</div></div>' +
              '<div class="g3">' +
                '<div class="field"><label class="lab">Amount, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(u.payAmount) + '" data-inp="amount">' +
                  '<div class="hint">Minimum ' + UI.money(m.min) + '</div></div>' +
                '<div class="field"><label class="lab">Currency</label>' +
                  '<div class="sel"><span>USD</span>' + icon('down', 14, 2) + '</div></div>' +
                '<div class="field"><label class="lab">Quick amounts</label><div class="opts">' + presets + '</div></div>' +
              '</div>' +
              '<div class="total">' +
                '<div><div class="kpi-lab">Credited to balance</div>' +
                  '<div class="num" style="font-size:26px;font-weight:600;letter-spacing:-0.025em;line-height:1.1">' +
                  UI.money2(Math.max(0, amt - fee)) + '</div></div>' +
                '<div class="hint" style="padding-bottom:4px">fee ' + UI.money2(fee) + ' · ' + m.speed + '</div>' +
                '<button class="btn btn-pri btn-lg" style="margin-left:auto" data-act="topup">Add ' + UI.money(amt) + '</button>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="lab" style="margin-bottom:10px">Method terms</div>' +
              '<div class="terms">' +
                '<div class="term"><span class="term-k">Minimum deposit</span><span class="term-v num">' + UI.money(m.min) + '</span></div>' +
                '<div class="term"><span class="term-k">Currency</span><span class="term-v">USD / EUR</span></div>' +
                '<div class="term"><span class="term-k">Fee</span><span class="term-v">' +
                  (m.feePct > 0 ? m.feePct + '% — USD, 0% — EUR' : 'no fee') + '</span></div>' +
                '<div class="term"><span class="term-k">Credited in</span><span class="term-v">' + m.speed + '</span></div>' +
                '<div class="term"><span class="term-k">Requires</span><span class="term-v">' + m.req + '</span></div>' +
              '</div>' +
              '<div class="note" style="margin-top:14px">' + icon('info', 15, 2) +
                '<p>Campaigns stop automatically once the balance no longer covers the daily cap. ' +
                'Set a low-balance alert under <b>Notifications</b>.</p></div>' +
            '</div>' +
          '</div></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Transaction history</div>' +
          '<div class="card-s">Time zone — UTC</div></div>' +
          '<div class="card-b" style="gap:14px">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
              '<div class="segs">' + tabs + '</div>' +
              '<div class="segs" style="margin-left:auto">' + ranges + '</div>' +
              '<button class="btn btn-sm" data-act="csv">' + icon('download', 13, 1.9) + 'CSV</button>' +
            '</div>' +
            '<div class="table" style="border-radius:10px"><div class="table-scroll">' +
              '<div class="tr thead" style="grid-template-columns:' + cols + ';' + minw(cols) + '">' +
                heads.map(function (h, i) { return '<div class="th ' + align[i] + '">' + h + '</div>'; }).join('') +
              '</div>' +
              rows.map(function (r) {
                return '<div class="tr row" style="grid-template-columns:' + cols + ';' + minw(cols) + '">' + r + '</div>';
              }).join('') + '</div>' +
              '<div class="foot"><span>' + footLeft + '</span>' +
              '<span style="margin-left:auto">Updated an hour ago</span></div>' +
            '</div>' +
          '</div></div>' +
      '</div>';
    },

    actions: {
      method: function (v) { Store.ui('payMethod', v); },
      preset: function (v) { Store.ui('payAmount', v); },
      tab: function (v) { Store.ui('payTab', v); },
      range: function (v) { Store.ui('payRange', v); },
      csv: function () { App.toast('Export is not generated in this prototype'); },
      doc: function () { App.toast('Documents are not generated in this prototype'); },

      topup: function () {
        var s = Store.get(), m = method(), amt = UI.num(s.ui.payAmount);
        if (amt < m.min) { App.toast('Minimum deposit for this method is ' + UI.money(m.min)); return; }
        var fee = amt * m.feePct / 100;
        var credited = amt - fee;
        Api.billing.topUp({ amount: amt, method: m.name, feePct: m.feePct }).then(function (r) {
          App.toast('Balance topped up by ' + UI.money2(r.credited));
        }).catch(function (e) { App.toast('Top-up failed: ' + e.message); });
      }
    },

    inputs: {
      amount: function (v) { Store.ui('payAmount', v); }
    }
  };
})(window);
