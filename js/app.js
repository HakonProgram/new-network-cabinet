/* Каркас, маршруты и связывание событий. */
(function (w, d) {
  'use strict';

  var icon = UI.icon, esc = UI.esc;

  var NAV = [
    { cap: 'Workspace' },
    { key: 'stats',         icon: 'stats',  label: 'Statistics' },
    { key: 'campaigns',     icon: 'camp',   label: 'Campaigns',      badge: 'campaigns' },
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

  function theme() {
    return d.documentElement.getAttribute('data-theme') || 'dark';
  }
  function toggleTheme() {
    var next = theme() === 'light' ? 'dark' : 'light';
    d.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('nn-theme', next); } catch (e) {}
    /* Шапка пересобирается целиком: в ней иконка темы. */
    d.getElementById('app').innerHTML = shellHtml();
    render();
  }

  /* Боковое меню на узких экранах — выдвижная панель. Состояние держим
     на корневом элементе: оно эфемерное и переживать перезагрузку не должно. */
  function nav(open) {
    d.documentElement.setAttribute('data-nav', open ? 'open' : '');
  }

  function userMenu(open) {
    d.documentElement.setAttribute('data-user', open ? 'open' : '');
  }

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

  /* Профиль в правом углу: аватар открывает меню с настройками и выходом. */
  function userHtml() {
    var ses = Store.get().session || {};
    var name = ses.user || 'Advertiser';
    var person = [ses.firstName, ses.lastName].filter(Boolean).join(' ');
    var initials = (person || name).split(/\s+/).slice(0, 2)
      .map(function (x) { return x[0]; }).join('').toUpperCase();

    return '<div class="user-wrap">' +
      '<div class="user" data-act="userMenu">' +
        '<div class="avatar">' + esc(initials) + '</div>' +
        '<div class="user-n">' + esc(person || name) + '</div>' +
        icon('down', 13) +
      '</div>' +
      '<div class="umenu">' +
        '<div class="umenu-h"><div class="avatar avatar-lg">' + esc(initials) + '</div>' +
          '<div style="min-width:0"><div class="umenu-n">' + esc(person || name) + '</div>' +
          '<div class="umenu-s">' + esc(ses.email || name) + '</div></div></div>' +
        '<div class="umenu-i" data-go="profile">' + icon('user', 16) + 'Profile settings</div>' +
        '<div class="umenu-i" data-go="payments">' + icon('pay', 16) + 'Billing</div>' +
        '<div class="umenu-i" data-go="postback">' + icon('post', 16) + 'Postback</div>' +
        '<div class="umenu-sep"></div>' +
        '<div class="umenu-i danger" data-act="signOut">' + icon('right', 16) + 'Sign out</div>' +
      '</div>' +
    '</div>';
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
          '<div class="brand" data-go="campaigns">' + UI.brandMark(32) +
            '<div><div class="brand-name">AdAnvil</div><div class="brand-sub">Advertiser</div></div>' +
          '</div>' +
          '<nav class="nav" id="nav">' + navHtml() + '</nav>' +
        '</div>' +
      '</aside>' +
      '<div class="scrim" data-act="closeNav"></div>' +
      '<div class="main">' +
        '<div class="topbar">' +
          '<div class="icon-btn nav-toggle" data-act="openNav" title="Menu">' + icon('menu', 18) + '</div>' +
          '<div class="crumbs" id="crumbs">' + crumbsHtml() + '</div>' +
          '<div class="balance">' +
            '<div><div class="bal-lab">Balance</div><div class="bal-val num" id="balance">' + UI.money2(s.balance) + '</div></div>' +
            '<button class="btn btn-pri btn-sm" data-go="payments">' + icon('plus', 13) +
              '<span>Add funds</span></button>' +
          '</div>' +
          '<div class="icon-btn" data-act="theme" title="Switch theme">' + icon(theme() === 'light' ? 'moon' : 'sun', 16) + '</div>' +
          '<div class="icon-btn" data-go="notifications" title="Notifications">' + icon('bell', 16) +
            (badges().unread !== '0' ? '<span class="bell-dot"></span>' : '') + '</div>' +
          userHtml() +
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
      /* В настоящем кабинете это придёт push'ем или опросом — здесь имитируем таймером. */
      pendingChecks[c.id] = setTimeout(function () {
        delete pendingChecks[c.id];
        Api.campaigns.passAutoCheck(c.id).then(function (r) {
          if (r && r.campaign) toast('\u201c' + r.campaign.name + '\u201d passed the auto-check and started');
        });
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
  function authed() { return !!Store.get().session; }

  function screen() {
    if (!authed()) return w.Screens.auth;
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

  /* Каркас нужен только внутри кабинета: вход рисуется на весь экран. */
  function render() {
    var app = d.getElementById('app');
    var isAuth = !authed();
    var wasAuth = app.classList.contains('shell-auth');
    if (isAuth !== wasAuth || !d.getElementById('view')) {
      app.className = isAuth ? 'shell-auth' : 'app';
      app.innerHTML = isAuth ? '<div id="view"></div>' : shellHtml();
    }
    if (!isAuth) refreshShell();
    renderView();
    if (!isAuth) scheduleAutoChecks();
  }

  /* ── события ── */
  function bind() {
    var app = d.getElementById('app');

    app.addEventListener('click', function (ev) {
      var goEl = ev.target.closest('[data-go]');
      if (goEl) {
        ev.preventDefault();
        nav(false);
        userMenu(false);
        go(goEl.dataset.go);
        return;
      }
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      if (actEl.dataset.act === 'theme') { ev.preventDefault(); toggleTheme(); return; }
      if (actEl.dataset.act === 'openNav') { ev.preventDefault(); nav(true); return; }
      if (actEl.dataset.act === 'userMenu') {
        ev.preventDefault();
        userMenu(d.documentElement.getAttribute('data-user') !== 'open');
        return;
      }
      if (actEl.dataset.act === 'signOut') {
        ev.preventDefault();
        userMenu(false);
        Store.signOut();
        toast('Signed out');
        return;
      }
      if (actEl.dataset.act === 'closeNav') { ev.preventDefault(); nav(false); return; }
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

    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { nav(false); userMenu(false); }
    });

    /* Клик мимо меню закрывает его — как у любого выпадающего списка. */
    d.addEventListener('click', function (ev) {
      if (!ev.target.closest('.user-wrap')) userMenu(false);
    }, true);

    w.addEventListener('hashchange', function () {
      nav(false);
      userMenu(false);
      current = route();
      w.scrollTo(0, 0);
      render();
    });

    Store.subscribe(render);
  }

  /* ── временный переключатель палитр ──
     Нужен только чтобы выбрать направление вживую. После выбора
     убирается вместе с palettes.css. */
  var PALETTES = [
    { k: '',       n: 'Ember',  c: '#EE6A1C', d: 'песок и раскалённый оранжевый' },
    { k: 'lime',   n: 'Acid',   c: '#BDEE63', d: 'чистый серый и кислотный лайм' },
    { k: 'indigo', n: 'Indigo', c: '#3E63DD', d: 'холодный сланец и индиго' },
    { k: 'jade',   n: 'Jade',   c: '#29A383', d: 'зеленоватый нейтральный и нефрит' },
    { k: 'ruby',   n: 'Ruby',   c: '#E54666', d: 'тёплый серый и рубин' },
    { k: 'cyan',   n: 'Cyan',   c: '#00A2C7', d: 'сланец и электрический циан' }
  ];

  function paletteBar() {
    var box = d.getElementById('palette-bar');
    if (!box) return;
    var cur = d.documentElement.getAttribute('data-palette') || '';
    box.innerHTML =
      '<button class="pal-tab" data-pal-toggle>Palette</button>' +
      '<div class="pal-list">' +
        '<div class="pal-h">Выберите направление</div>' +
        PALETTES.map(function (p) {
          return '<button class="pal-i' + (p.k === cur ? ' on' : '') + '" data-pal="' + p.k + '">' +
            '<span class="pal-dot" style="background:' + p.c + '"></span>' +
            '<span><b>' + p.n + '</b><i>' + p.d + '</i></span></button>';
        }).join('') +
      '</div>';
  }

  function bindPaletteBar() {
    var box = d.getElementById('palette-bar');
    if (!box) return;
    box.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-pal-toggle]')) { box.classList.toggle('open'); return; }
      var item = ev.target.closest('[data-pal]');
      if (!item) return;
      var k = item.getAttribute('data-pal');
      if (k) d.documentElement.setAttribute('data-palette', k);
      else d.documentElement.removeAttribute('data-palette');
      try { localStorage.setItem('nn-palette', k); } catch (e) {}
      paletteBar();
      box.classList.add('open');
      render();
    });
  }

  function start() {
    current = route();
    bind();
    paletteBar();
    bindPaletteBar();
    render();
  }

  w.App = { go: go, toast: toast, render: render, route: function () { return current; } };
  d.addEventListener('DOMContentLoaded', start);
})(window, document);
