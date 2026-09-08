/* Notifications: what the robot and the system did to your campaigns. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var CATS = [
    { k: 'all',   label: 'All' },
    { k: 'camp',  label: 'Campaigns' },
    { k: 'zones', label: 'Placements' },
    { k: 'money', label: 'Billing' },
    { k: 'sys',   label: 'System' }
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
        { k: 'browser', name: 'Browser',  desc: 'push while the dashboard is open' }
      ].map(function (c) {
        return '<div class="swr"><div style="min-width:0">' +
          '<div class="swr-t">' + c.name + '</div><div class="swr-d">' + c.desc + '</div></div>' +
          '<div class="sw' + (s.channels[c.k] ? ' on' : '') + '" style="margin-left:auto" data-act="channel" data-arg="' + c.k + '"><i></i></div></div>';
      }).join('');

      var thresholds = ['1 day', '2 days', '5 days'].map(function (t) {
        return '<div class="opt' + (s.threshold === t ? ' on' : '') + '" data-act="threshold" data-arg="' + esc(t) + '">' + t + '</div>';
      }).join('');

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Notifications</h1>' +
          '<p class="sub">What the robot and the system did to your campaigns.</p></div>' +
          '<button class="btn" style="margin-left:auto" data-act="readAll">Mark all as read</button></div>' +

        '<div class="nt">' +
          '<div class="card">' +
            '<div class="card-h" style="gap:10px"><div class="segs">' + tabs + '</div></div>' +
            '<div>' + (items || '<div class="empty">Nothing here yet</div>') +
              '<div class="foot"><span>' +
                (unread ? unread + ' unread of ' + s.notifications.length : 'All notifications read') +
              '</span></div></div>' +
          '</div>' +

          '<div class="card"><div class="card-h"><div class="card-t">Channels and thresholds</div></div>' +
            '<div class="card-b" style="gap:16px">' +
              '<div><div class="lab" style="margin-bottom:6px">Where to send</div>' +
                '<div style="display:flex;flex-direction:column">' + channels + '</div></div>' +
              '<div class="field"><label class="lab">Warn me when the balance covers less than</label>' +
                '<div class="opts">' + thresholds + '</div>' +
                '<div class="hint">Based on average spend over the last 7 days.</div></div>' +
              '<div class="note">' + icon('info', 15, 2) +
                '<p>The robot switches placements off on its own and always logs it here — <b>no approval needed</b>. ' +
                'Step in from the Placements screen if you disagree.</p></div>' +
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
        App.toast('All notifications marked as read');
      },
      channel: function (k) {
        Store.set(function (s) { s.channels[k] = !s.channels[k]; });
      },
      threshold: function (v) { Store.set(function (s) { s.threshold = v; }); }
    }
  };
})(window);
