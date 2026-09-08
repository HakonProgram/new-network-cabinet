/* Уведомления: что робот и система сделали с кампаниями. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var CATS = [
    { k: 'all',   label: 'Все' },
    { k: 'camp',  label: 'Кампании' },
    { k: 'zones', label: 'Площадки' },
    { k: 'money', label: 'Финансы' },
    { k: 'sys',   label: 'Система' }
  ];
  var STYLE = {
    ok:    { bg: 'rgba(12,163,12,0.14)',   fg: '#3ad13a', ic: 'check' },
    warn:  { bg: 'rgba(250,178,25,0.14)',  fg: '#fab219', ic: 'alert' },
    bot:   { bg: 'rgba(131,104,247,0.16)', fg: '#A48FFF', ic: 'bot' },
    money: { bg: 'rgba(0,159,174,0.14)',   fg: '#31c8d6', ic: 'pay' }
  };

  w.Screens = w.Screens || {};
  w.Screens.notifications = {
    render: function () {
      var s = Store.get(), tab = s.ui.notifTab;
      var shown = s.notifications.filter(function (n) { return tab === 'all' || n.cat === tab; });
      var unread = s.notifications.filter(function (n) { return n.unread; }).length;

      var tabs = CATS.map(function (c) {
        var n = c.k === 'all' ? s.notifications.length
          : s.notifications.filter(function (x) { return x.cat === c.k; }).length;
        return '<div class="seg' + (tab === c.k ? ' on' : '') + '" data-act="tab" data-arg="' + c.k + '">' +
          '<span>' + c.label + '</span><span class="seg-n">' + n + '</span></div>';
      }).join('');

      var items = shown.map(function (n) {
        var st = STYLE[n.kind];
        return '<div class="item' + (n.unread ? ' new' : '') + '" data-act="read" data-arg="' + n.id + '">' +
          '<div class="it-ic" style="background:' + st.bg + ';color:' + st.fg + '">' + icon(st.ic, 16, 2) + '</div>' +
          '<div style="min-width:0;flex:1">' +
            '<div class="it-t">' + esc(n.title) + '</div>' +
            '<div class="it-d">' + esc(n.text) + '</div>' +
            '<div class="it-m">' + esc(n.time) + '</div></div>' +
          (n.unread ? '<div class="it-new"></div>' : '') +
        '</div>';
      }).join('');

      var channels = [
        { k: 'mail',    name: 'Email',    desc: 'ops@nexoramedia.io' },
        { k: 'tg',      name: 'Telegram', desc: '@nexora_ops' },
        { k: 'browser', name: 'Браузер',  desc: 'push, пока кабинет открыт' }
      ].map(function (c) {
        return '<div class="swr"><div style="min-width:0">' +
          '<div class="swr-t">' + c.name + '</div><div class="swr-d">' + c.desc + '</div></div>' +
          '<div class="sw' + (s.channels[c.k] ? ' on' : '') + '" style="margin-left:auto" data-act="channel" data-arg="' + c.k + '"><i></i></div></div>';
      }).join('');

      var thresholds = ['1 день', '2 дня', '5 дней'].map(function (t) {
        return '<div class="opt' + (s.threshold === t ? ' on' : '') + '" data-act="threshold" data-arg="' + esc(t) + '">' + t + '</div>';
      }).join('');

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Уведомления</h1>' +
          '<p class="sub">Что робот и система сделали с вашими кампаниями.</p></div>' +
          '<button class="btn" style="margin-left:auto" data-act="readAll">Отметить все прочитанными</button></div>' +

        '<div class="nt">' +
          '<div class="card">' +
            '<div class="card-h" style="gap:10px"><div class="segs">' + tabs + '</div></div>' +
            '<div>' + (items || '<div class="empty">В этом разделе уведомлений нет</div>') +
              '<div class="foot"><span>' +
                (unread ? 'Непрочитанных: ' + unread + ' из ' + s.notifications.length : 'Все уведомления прочитаны') +
              '</span></div></div>' +
          '</div>' +

          '<div class="card"><div class="card-h"><div class="card-t">Каналы и пороги</div></div>' +
            '<div class="card-b" style="gap:16px">' +
              '<div><div class="lab" style="margin-bottom:6px">Куда присылать</div>' +
                '<div style="display:flex;flex-direction:column">' + channels + '</div></div>' +
              '<div class="field"><label class="lab">Предупреждать, когда баланса хватает менее чем на</label>' +
                '<div class="opts">' + thresholds + '</div>' +
                '<div class="hint">Считается по среднему расходу за последние 7 дней.</div></div>' +
              '<div class="note">' + icon('info', 15, 2) +
                '<p>Отключения площадок робот делает сам и всегда логирует здесь — <b>подтверждать их не нужно</b>. ' +
                'Вмешаться можно в разделе «Площадки».</p></div>' +
            '</div></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      tab: function (v) { Store.ui('notifTab', v); },
      read: function (id) {
        Store.set(function (s) {
          var n = s.notifications.find(function (x) { return String(x.id) === String(id); });
          if (n) n.unread = false;
        });
      },
      readAll: function () {
        Store.set(function (s) { s.notifications.forEach(function (n) { n.unread = false; }); });
        App.toast('Все уведомления прочитаны');
      },
      channel: function (k) {
        Store.set(function (s) { s.channels[k] = !s.channels[k]; });
      },
      threshold: function (v) { Store.set(function (s) { s.threshold = v; }); }
    }
  };
})(window);
