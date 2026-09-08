/* Постбек: адрес S2S, макросы и инструкция. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var CLICK_PH = '{ваш_макрос_клика}';
  var URL = 'https://track.newnetwork.io/postback?adv=4821&click_id=' + CLICK_PH;

  w.Screens = w.Screens || {};
  w.Screens.postback = {
    render: function () {
      var tested = Store.get().ui.postbackTested;

      var chips = function (list, act) {
        return list.map(function (t) {
          return '<div class="tok" data-act="' + act + '" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
        }).join('');
      };

      var step = function (n, html) {
        return '<div class="step"><div class="step-n">' + n + '</div><div class="step-t">' + html + '</div></div>';
      };

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Постбек</h1>' +
        '<p class="sub">S2S-передача конверсий. Один адрес на все кампании — без него не работают модели за результат.</p></div></div>' +

        '<div class="pb">' +
          '<div class="card"><div class="card-h"><div class="card-t">Ваш адрес постбека</div>' +
            '<div class="card-s">один на все кампании</div></div>' +
            '<div class="card-b">' +
              '<div class="field"><label class="lab">Постбек-URL</label>' +
                '<div class="with-btn">' +
                  '<input class="inp inp-mono" type="text" value="' + esc(URL) + '" readonly>' +
                  '<button class="btn" style="flex:0 0 auto" data-act="copyUrl">' + icon('copy', 13, 1.9) + 'Копировать</button>' +
                '</div>' +
                '<div class="hint">Подставьте вместо <span class="mono">' + esc(CLICK_PH) + '</span> макрос клика вашего трекера.</div></div>' +

              '<div class="field"><label class="lab">Дополнительные параметры</label>' +
                '<div class="opts">' + chips(['&payout={сумма}', '&status={статус}', '&goal={цель}', '&currency=USD'], 'copy') + '</div>' +
                '<div class="hint">Сумма конверсии нужна, если вы считаете ROI по выручке, а не по числу действий.</div></div>' +

              '<div class="field"><label class="lab">Макросы для ссылки кампании</label>' +
                '<div class="opts">' + chips(DATA.TOKENS, 'copy') + '</div></div>' +

              '<div class="ping">' +
                '<div class="ping-ic">' + icon('check', 16, 2.6) + '</div>' +
                '<div><div style="font-size:13px;font-weight:600">Постбек работает</div>' +
                '<div class="hint">Последняя конверсия получена сегодня, 06:14 UTC · за сутки принято 1 043</div></div>' +
                '<button class="btn btn-sm" style="margin-left:auto" data-act="test">' +
                  (tested ? 'Тестовая конверсия отправлена' : 'Отправить тестовую конверсию') + '</button>' +
              '</div>' +
            '</div></div>' +

          '<div class="card"><div class="card-h"><div class="card-t">Как подключить</div>' +
            '<div class="card-s">4 шага</div></div>' +
            '<div class="card-b" style="gap:16px">' +
              step(1, 'Скопируйте адрес постбека слева.') +
              step(2, 'Замените <b>' + esc(CLICK_PH) + '</b> на макрос ID клика вашего трекера. Должно получиться так:' +
                '<span class="code">https://track.newnetwork.io/postback?adv=4821&amp;click_id={sub1}</span>') +
              step(3, 'Добавьте получившийся адрес в трекер как постбек рекламной сети.') +
              step(4, 'Проверьте, что в ссылке кампании стоит макрос <b>{clickid}</b>:' +
                '<span class="code">https://slotsroyale.io/lp/install?sub1={clickid}&amp;zone={zone}</span>') +
              '<div class="note">' + icon('info', 15, 2) +
                '<p><b>Без постбека модели CPA и Pure CPA не запускаются.</b> Робот оптимизирует площадки ' +
                'по конверсиям — если они не приходят, оптимизировать нечего, и кампания остаётся на автопроверке.</p></div>' +
            '</div></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      copyUrl: function () {
        if (navigator.clipboard) navigator.clipboard.writeText(URL).catch(function () {});
        App.toast('Адрес постбека скопирован');
      },
      copy: function (t) {
        if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
        App.toast('Скопировано: ' + t);
      },
      test: function () {
        Store.set(function (s) { s.ui.postbackTested = !s.ui.postbackTested; });
        App.toast(Store.get().ui.postbackTested
          ? 'Тестовая конверсия отправлена — проверьте отчёт'
          : 'Готово, можно отправить ещё раз');
      }
    }
  };
})(window);
