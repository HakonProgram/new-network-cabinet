/* Платежи: пополнение баланса и история операций. */
(function (w) {
  'use strict';
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

      var ranges = [['7', '7 дней'], ['30', '30 дней'], ['90', '90 дней'], ['all', 'Всё время']].map(function (r) {
        return '<div class="seg' + (u.payRange === r[0] ? ' on' : '') + '" data-act="range" data-arg="' + r[0] + '">' + r[1] + '</div>';
      }).join('');

      var tabs = [['pay', 'Пополнения'], ['inv', 'Счета']].map(function (t) {
        return '<div class="seg' + (u.payTab === t[0] ? ' on' : '') + '" data-act="tab" data-arg="' + t[0] + '">' + t[1] + '</div>';
      }).join('');

      var pill = function (txt, kind) {
        var cl = kind === 'ok' ? 'pill-ok' : (kind === 'wait' ? 'pill-wait' : 'pill-bad');
        return '<span class="pill ' + cl + '">' + txt + '</span>';
      };

      var cols, heads, align, rows, footLeft;
      if (u.payTab === 'pay') {
        cols = '104px minmax(0,1fr) 110px 100px 120px 130px 120px';
        heads = ['Дата', 'Способ', 'Сумма', 'Комиссия', 'Зачислено', 'Статус', 'Документ'];
        align = ['', '', 'r', 'r', 'r', '', ''];
        rows = s.payments.map(function (h) {
          return '<div class="cell w">' + h.date + '</div><div class="cell">' + esc(h.meth) + '</div>' +
            '<div class="cell r">' + UI.money(h.sum) + '</div>' +
            '<div class="cell r muted">' + (h.fee ? UI.money(h.fee) : '—') + '</div>' +
            '<div class="cell r w">' + (h.ok === 'ok' ? UI.money(h.sum - h.fee) : '—') + '</div>' +
            '<div>' + pill(h.st, h.ok) + '</div><div class="cell muted">' + h.doc + '</div>';
        });
        footLeft = 'Показано ' + s.payments.length + ' ' +
          UI.plural(s.payments.length, 'операция', 'операции', 'операций') + ' за выбранный период';
      } else {
        cols = '170px 104px minmax(0,1fr) 120px 150px 120px';
        heads = ['Номер', 'Дата', 'Период', 'Сумма', 'Статус', 'Документ'];
        align = ['', '', '', 'r', '', ''];
        rows = DATA.INVOICES.map(function (i) {
          return '<div class="cell mono w">' + i.num + '</div><div class="cell">' + i.date + '</div>' +
            '<div class="cell muted">' + i.period + '</div><div class="cell r w">' + UI.money(i.sum) + '</div>' +
            '<div>' + pill(i.st, i.ok) + '</div>' +
            '<div class="cell muted" style="cursor:pointer" data-act="doc">Скачать PDF</div>';
        });
        footLeft = 'Показано 3 счёта за выбранный период';
      }

      var kpi = function (lab, val, hint) {
        return '<div class="kpi"><div class="kpi-lab">' + lab + '</div><div class="kpi-val num">' + val + '</div>' +
          '<div class="hint">' + hint + '</div></div>';
      };
      var days = Math.max(0, Math.floor(s.balance / daily));

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Платежи</h1>' +
        '<p class="sub">Предоплата: деньги должны быть на балансе до первого показа.</p></div></div>' +

        '<div class="kpis">' +
          kpi('Баланс', UI.money2(s.balance), 'доступно к откруту') +
          kpi('Средний расход в сутки', UI.money(daily), 'по последним 30 дням') +
          kpi('Хватит примерно на', days + ' ' + UI.plural(days, 'день', 'дня', 'дней'), 'при текущем темпе') +
          kpi('Пополнено за 30 дней', UI.money(95000), '6 операций') +
        '</div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Пополнение баланса</div>' +
          '<div class="card-s">Комиссия платёжной системы удерживается при зачислении</div></div>' +
          '<div class="card-b"><div class="pay-grid">' +
            '<div style="display:flex;flex-direction:column;gap:18px">' +
              '<div class="field"><label class="lab">Способ пополнения</label><div class="meth">' + methods + '</div></div>' +
              '<div class="g3">' +
                '<div class="field"><label class="lab">Сумма, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(u.payAmount) + '" data-inp="amount">' +
                  '<div class="hint">Минимум ' + UI.money(m.min) + '</div></div>' +
                '<div class="field"><label class="lab">Валюта</label>' +
                  '<div class="sel"><span>USD</span>' + icon('down', 14, 2) + '</div></div>' +
                '<div class="field"><label class="lab">Быстрый выбор</label><div class="opts">' + presets + '</div></div>' +
              '</div>' +
              '<div class="total">' +
                '<div><div class="kpi-lab">Зачислим на баланс</div>' +
                  '<div class="num" style="font-size:26px;font-weight:600;letter-spacing:-0.025em;line-height:1.1">' +
                  UI.money2(Math.max(0, amt - fee)) + '</div></div>' +
                '<div class="hint" style="padding-bottom:4px">комиссия ' + UI.money2(fee) + ' · срок ' + m.speed + '</div>' +
                '<button class="btn btn-pri btn-lg" style="margin-left:auto" data-act="topup">Пополнить на ' + UI.money(amt) + '</button>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="lab" style="margin-bottom:10px">Условия способа</div>' +
              '<div class="terms">' +
                '<div class="term"><span class="term-k">Минимальный депозит</span><span class="term-v num">' + UI.money(m.min) + '</span></div>' +
                '<div class="term"><span class="term-k">Валюта</span><span class="term-v">USD / EUR</span></div>' +
                '<div class="term"><span class="term-k">Комиссия</span><span class="term-v">' +
                  (m.feePct > 0 ? m.feePct + '% — USD, 0% — EUR' : 'без комиссии') + '</span></div>' +
                '<div class="term"><span class="term-k">Срок зачисления</span><span class="term-v">' + m.speed + '</span></div>' +
                '<div class="term"><span class="term-k">Требуется</span><span class="term-v">' + m.req + '</span></div>' +
              '</div>' +
              '<div class="note" style="margin-top:14px">' + icon('info', 15, 2) +
                '<p>Кампании останавливаются автоматически, когда баланса не хватает на дневной лимит. ' +
                'Настроить оповещение о низком балансе можно в <b>Уведомлениях</b>.</p></div>' +
            '</div>' +
          '</div></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">История операций</div>' +
          '<div class="card-s">Часовой пояс — UTC</div></div>' +
          '<div class="card-b" style="gap:14px">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
              '<div class="segs">' + tabs + '</div>' +
              '<div class="segs" style="margin-left:auto">' + ranges + '</div>' +
              '<button class="btn btn-sm" data-act="csv">' + icon('download', 13, 1.9) + 'CSV</button>' +
            '</div>' +
            '<div class="table" style="border-radius:10px">' +
              '<div class="tr thead" style="grid-template-columns:' + cols + '">' +
                heads.map(function (h, i) { return '<div class="th ' + align[i] + '">' + h + '</div>'; }).join('') +
              '</div>' +
              rows.map(function (r) { return '<div class="tr row" style="grid-template-columns:' + cols + '">' + r + '</div>'; }).join('') +
              '<div class="foot"><span>' + footLeft + '</span>' +
              '<span style="margin-left:auto">Обновлено час назад</span></div>' +
            '</div>' +
          '</div></div>' +
      '</div>';
    },

    actions: {
      method: function (v) { Store.ui('payMethod', v); },
      preset: function (v) { Store.ui('payAmount', v); },
      tab: function (v) { Store.ui('payTab', v); },
      range: function (v) { Store.ui('payRange', v); },
      csv: function () { App.toast('В прототипе выгрузка не формируется'); },
      doc: function () { App.toast('В прототипе документы не формируются'); },

      topup: function () {
        var s = Store.get(), m = method(), amt = UI.num(s.ui.payAmount);
        if (amt < m.min) { App.toast('Минимальный депозит для этого способа — ' + UI.money(m.min)); return; }
        var fee = amt * m.feePct / 100;
        var credited = amt - fee;
        Store.set(function (st) {
          st.balance += credited;
          st.payments.unshift({
            date: UI.dateShort(new Date()), meth: m.name, sum: amt, fee: fee,
            ok: 'ok', st: 'Зачислено', doc: 'Квитанция'
          });
          st.notifications.unshift({
            id: Date.now(), kind: 'money', cat: 'money', unread: true,
            title: 'Платёж зачислен',
            text: UI.money(amt) + ' · ' + m.name.toLowerCase() + ' · комиссия ' + UI.money2(fee) +
                  ' · зачислено ' + UI.money2(credited) + '.',
            time: 'Только что'
          });
        });
        App.toast('Баланс пополнен на ' + UI.money2(credited));
      }
    },

    inputs: {
      amount: function (v) { Store.ui('payAmount', v); }
    }
  };
})(window);
