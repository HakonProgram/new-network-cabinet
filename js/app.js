/* Каркас, маршруты и связывание событий. */
(function (w, d) {
  'use strict';

  var icon = UI.icon;

  var NAV = [
    { cap: 'Workspace' },
    { key: 'stats',         icon: 'stats',  label: 'Statistics' },
    { key: 'campaigns',     icon: 'camp',   label: 'Campaigns',      badge: 'campaigns' },
    { key: 'zones',         icon: 'zones',  label: 'Placements' },
    { key: 'volumes',       icon: 'volume', label: 'Traffic volumes' },
    { cap: 'Integrations' },
    { key: 'postback',      icon: 'post',   label: 'Postback' },
    { cap: 'Account' },
    { key: 'payments',      icon: 'pay',    label: 'Billing' },
    { key: 'profile',       icon: 'user',   label: 'Profile' },
    { key: 'notifications', icon: 'bell',   label: 'Notifications',  badge: 'unread', hot: true },
    { key: 'support',       icon: 'help',   label: 'Support' }
  ];

  var ROUTES = {
    'campaigns':     { screen: 'campaigns',     nav: 'campaigns',     title: 'Campaigns' },
    'campaigns/new': { screen: 'newCampaign',   nav: 'campaigns',     title: 'New campaign', parent: ['Campaigns', 'campaigns'] },
    'stats':         { screen: 'stats',         nav: 'stats',         title: 'Statistics' },
    'zones':         { screen: 'zones',         nav: 'zones',         title: 'Placements' },
    'volumes':       { screen: 'volumes',       nav: 'volumes',       title: 'Traffic volumes' },
    'payments':      { screen: 'payments',      nav: 'payments',      title: 'Billing' },
    'profile':       { screen: 'profile',       nav: 'profile',       title: 'Profile' },
    'postback':      { screen: 'postback',      nav: 'postback',      title: 'Postback' },
    'notifications': { screen: 'notifications', nav: 'notifications', title: 'Notifications' },
    'support':       { screen: 'support',       nav: 'support',       title: 'Support' }
  };

  var current = 'campaigns';

  function route() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return ROUTES[h] ? h : 'campaigns';
  }

  function go(key) {
    location.hash = '#/' + key;
  }

  function badges() {
    var s = Store.get();
    return {
      campaigns: String(s.campaigns.length),
      unread: String(s.notifications.filter(function (n) { return n.unread; }).length)
    };
  }

  function navHtml() {
    var active = ROUTES[current].nav;
    var b = badges();
    var firstCap = true;
    return NAV.map(function (item) {
      if (item.cap) {
        var cls = firstCap ? 'nav-cap' : 'nav-cap gap';
        firstCap = false;
        return '<div class="' + cls + '">' + item.cap + '</div>';
      }
      var val = item.badge ? b[item.badge] : '';
      var badge = val && val !== '0'
        ? '<span class="nav-badge' + (item.hot ? ' hot' : '') + '">' + val + '</span>' : '';
      return '<div class="nav-i' + (item.key === active ? ' on' : '') + '" data-go="' + item.key + '">' +
        icon(item.icon, 17) + '<span>' + item.label + '</span>' + badge + '</div>';
    }).join('');
  }

  function crumbsHtml() {
    var r = ROUTES[current];
    if (!r.parent) return '<b>' + r.title + '</b>';
    return '<span class="lnk" data-go="' + r.parent[1] + '">' + r.parent[0] + '</span>' +
      icon('right', 13, 2) + '<b>' + r.title + '</b>';
  }

  function shellHtml() {
    var s = Store.get();
    return '' +
      '<aside class="side">' +
        '<div class="side-inner">' +
          '<div class="brand" data-go="campaigns">' +
            '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">' +
              '<rect x="0.5" y="0.5" width="25" height="25" rx="7" fill="#13161C" stroke="#2E323B"/>' +
              '<circle cx="8" cy="8" r="1.6" fill="#6A7180"/><circle cx="13" cy="7" r="1.6" fill="#6A7180"/>' +
              '<circle cx="18" cy="8" r="1.6" fill="#6A7180"/><circle cx="19" cy="13" r="1.6" fill="#6A7180"/>' +
              '<circle cx="18" cy="18" r="1.6" fill="#6A7180"/><circle cx="13" cy="19" r="1.6" fill="#6A7180"/>' +
              '<circle cx="8" cy="18" r="1.6" fill="#6A7180"/><circle cx="7" cy="13" r="1.6" fill="#6A7180"/>' +
              '<circle cx="13" cy="13" r="3.2" fill="#8368F7"/>' +
            '</svg>' +
            '<div><div class="brand-name">New Network</div><div class="brand-sub">Advertiser</div></div>' +
          '</div>' +
          '<nav class="nav" id="nav">' + navHtml() + '</nav>' +
          '<div class="acct" data-go="profile">' +
            '<div class="avatar">NM</div>' +
            '<div style="min-width:0"><div style="font-size:12.5px;font-weight:600">Nexora Media</div>' +
            '<div class="cid mono">adv-4821</div></div>' +
          '</div>' +
        '</div>' +
      '</aside>' +
      '<div class="main">' +
        '<div class="topbar">' +
          '<div class="crumbs" id="crumbs">' + crumbsHtml() + '</div>' +
          '<div class="balance">' +
            '<div><div class="bal-lab">Balance</div><div class="bal-val num" id="balance">' + UI.money2(s.balance) + '</div></div>' +
            '<button class="btn btn-pri btn-sm" data-go="payments">' + icon('plus', 13, 2.4) + 'Add funds</button>' +
          '</div>' +
          '<div class="icon-btn" data-go="notifications" title="Notifications">' + icon('bell', 16) +
            (badges().unread !== '0' ? '<span class="bell-dot"></span>' : '') + '</div>' +
        '</div>' +
        '<div id="view"></div>' +
      '</div>';
  }

  /* ── экран «Поддержка» живёт прямо здесь: он статичный ── */
  w.Screens = w.Screens || {};
  w.Screens.support = {
    render: function () {
      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Support</h1>' +
        '<p class="sub">Questions about campaigns, moderation and payouts go to your account manager.</p></div></div>' +
        '<div class="card"><div class="card-b">' +
          '<div class="doc"><div class="doc-ic">' + icon('user', 17) + '</div>' +
            '<div><div class="doc-n">Anton — your account manager</div>' +
            '<div class="doc-d">Available 08:00 — 20:00 UTC on business days</div></div>' +
            '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Message on Telegram</button></div>' +
          '<div class="doc"><div class="doc-ic">' + icon('doc', 17) + '</div>' +
            '<div><div class="doc-n">Knowledge base</div>' +
            '<div class="doc-d">Creative requirements, restricted verticals, how the auto-check works</div></div>' +
            '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Open</button></div>' +
          '<div class="note">' + icon('info', 15, 2) +
            '<p>This is a <b>clickable prototype</b>. All figures are sample data kept in your browser only — ' +
            'reset them with the button below.</p></div>' +
          '<div><button class="btn btn-danger" data-act="reset">Reset demo data</button></div>' +
        '</div></div>' +
      '</div>';
    },
    actions: {
      soon: function () { toast('Not wired up in this prototype'); },
      reset: function () { Store.reset(); toast('Demo data reset'); }
    }
  };

  /* ── автопроверка ──
     Кампания не должна висеть в проверке вечно: робот проходит её сам
     и запускает кампанию. Здесь это несколько секунд. */
  var AUTO_CHECK_MS = 6000;
  var pendingChecks = {};

  function scheduleAutoChecks() {
    Store.get().campaigns.forEach(function (c) {
      if (c.status !== 'review' || pendingChecks[c.id]) return;
      pendingChecks[c.id] = setTimeout(function () {
        delete pendingChecks[c.id];
        var name = '';
        Store.set(function (s) {
          var x = s.campaigns.find(function (y) { return y.id === c.id; });
          if (!x || x.status !== 'review') return;
          x.status = 'active';
          name = x.name;
          s.notifications.unshift({
            id: Date.now(), kind: 'ok', cat: 'camp', unread: true,
            title: 'Auto-check passed — campaign started',
            text: 'NN-C-' + x.id + ' \u201c' + x.name + '\u201d · vertical detected, link responds, ' +
                  'settings package assembled. No manager involved.',
            time: 'Just now'
          });
        });
        if (name) toast('\u201c' + name + '\u201d passed the auto-check and started');
      }, AUTO_CHECK_MS);
    });
  }

  /* ── тосты ── */
  function toast(text) {
    var box = d.getElementById('toasts');
    var el = d.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="ic">' + icon('check', 13, 3) + '</span><span>' + UI.esc(text) + '</span>';
    box.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .2s';
      setTimeout(function () { el.remove(); }, 220);
    }, 2600);
  }

  /* ── отрисовка ── */
  function screen() {
    return w.Screens[ROUTES[current].screen];
  }

  function renderView() {
    var view = d.getElementById('view');
    if (!view) return;

    var focus = null;
    var ae = d.activeElement;
    if (ae && ae.dataset && ae.dataset.inp) {
      focus = { name: ae.dataset.inp, arg: ae.dataset.arg || '', pos: ae.selectionStart };
    }

    var sc = screen();
    view.innerHTML = sc.render();
    if (sc.mount) sc.mount(view);

    if (focus) {
      var sel = '[data-inp="' + focus.name + '"]' + (focus.arg ? '[data-arg="' + focus.arg + '"]' : '');
      var el = view.querySelector(sel);
      if (el) {
        el.focus();
        try { el.setSelectionRange(focus.pos, focus.pos); } catch (e) { /* не текстовое поле */ }
      }
    }
  }

  function refreshShell() {
    var s = Store.get();
    var nav = d.getElementById('nav');
    if (nav) nav.innerHTML = navHtml();
    var cr = d.getElementById('crumbs');
    if (cr) cr.innerHTML = crumbsHtml();
    var bal = d.getElementById('balance');
    if (bal) bal.textContent = UI.money2(s.balance);
    var bell = d.querySelector('.icon-btn[data-go="notifications"] .bell-dot');
    var unread = badges().unread !== '0';
    if (unread && !bell) {
      var btn = d.querySelector('.icon-btn[data-go="notifications"]');
      if (btn) btn.insertAdjacentHTML('beforeend', '<span class="bell-dot"></span>');
    } else if (!unread && bell) {
      bell.remove();
    }
  }

  function render() {
    refreshShell();
    renderView();
    scheduleAutoChecks();
  }

  /* ── события ── */
  function bind() {
    var app = d.getElementById('app');

    app.addEventListener('click', function (ev) {
      var goEl = ev.target.closest('[data-go]');
      if (goEl) {
        ev.preventDefault();
        go(goEl.dataset.go);
        return;
      }
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      var sc = screen();
      var fn = sc.actions && sc.actions[actEl.dataset.act];
      if (fn) {
        ev.preventDefault();
        fn(actEl.dataset.arg, ev, actEl);
      }
    });

    var onField = function (ev) {
      var el = ev.target.closest('[data-inp]');
      if (!el) return;
      var sc = screen();
      var fn = sc.inputs && sc.inputs[el.dataset.inp];
      if (fn) fn(el.value, el.dataset.arg, ev.type, el);
    };
    app.addEventListener('input', onField);
    app.addEventListener('change', onField);

    w.addEventListener('hashchange', function () {
      current = route();
      w.scrollTo(0, 0);
      render();
    });

    Store.subscribe(render);
  }

  function start() {
    current = route();
    d.getElementById('app').innerHTML = shellHtml();
    bind();
    render();
  }

  w.App = { go: go, toast: toast, render: render, route: function () { return current; } };
  d.addEventListener('DOMContentLoaded', start);
})(window, document);
