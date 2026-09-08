/* Каркас, маршруты и связывание событий. */
(function (w, d) {
  'use strict';

  var icon = UI.icon;

  var NAV = [
    { cap: 'Кабинет' },
    { key: 'stats',         icon: 'stats',  label: 'Статистика' },
    { key: 'campaigns',     icon: 'camp',   label: 'Кампании',       badge: 'campaigns' },
    { key: 'zones',         icon: 'zones',  label: 'Площадки' },
    { key: 'volumes',       icon: 'volume', label: 'Объёмы трафика' },
    { cap: 'Интеграции' },
    { key: 'postback',      icon: 'post',   label: 'Постбек' },
    { cap: 'Аккаунт' },
    { key: 'payments',      icon: 'pay',    label: 'Платежи' },
    { key: 'profile',       icon: 'user',   label: 'Профиль' },
    { key: 'notifications', icon: 'bell',   label: 'Уведомления',    badge: 'unread', hot: true },
    { key: 'support',       icon: 'help',   label: 'Поддержка' }
  ];

  var ROUTES = {
    'campaigns':     { screen: 'campaigns',     nav: 'campaigns',     title: 'Кампании' },
    'campaigns/new': { screen: 'newCampaign',   nav: 'campaigns',     title: 'Новая кампания', parent: ['Кампании', 'campaigns'] },
    'stats':         { screen: 'stats',         nav: 'stats',         title: 'Статистика' },
    'zones':         { screen: 'zones',         nav: 'zones',         title: 'Площадки' },
    'volumes':       { screen: 'volumes',       nav: 'volumes',       title: 'Объёмы трафика' },
    'payments':      { screen: 'payments',      nav: 'payments',      title: 'Платежи' },
    'profile':       { screen: 'profile',       nav: 'profile',       title: 'Профиль' },
    'postback':      { screen: 'postback',      nav: 'postback',      title: 'Постбек' },
    'notifications': { screen: 'notifications', nav: 'notifications', title: 'Уведомления' },
    'support':       { screen: 'support',       nav: 'support',       title: 'Поддержка' }
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
            '<div><div class="bal-lab">Баланс</div><div class="bal-val num" id="balance">' + UI.money2(s.balance) + '</div></div>' +
            '<button class="btn btn-pri btn-sm" data-go="payments">' + icon('plus', 13, 2.4) + 'Пополнить</button>' +
          '</div>' +
          '<div class="icon-btn" data-go="notifications" title="Уведомления">' + icon('bell', 16) +
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
        '<div class="head"><div><h1 class="h1">Поддержка</h1>' +
        '<p class="sub">Вопросы по кампаниям, модерации и выплатам — к вашему менеджеру.</p></div></div>' +
        '<div class="card"><div class="card-b">' +
          '<div class="doc"><div class="doc-ic">' + icon('user', 17) + '</div>' +
            '<div><div class="doc-n">Антон — ваш менеджер</div>' +
            '<div class="doc-d">Отвечает в рабочие часы UTC 08:00 — 20:00</div></div>' +
            '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Написать в Telegram</button></div>' +
          '<div class="doc"><div class="doc-ic">' + icon('doc', 17) + '</div>' +
            '<div><div class="doc-n">База знаний</div>' +
            '<div class="doc-d">Требования к креативам, запрещённые тематики, работа автопроверки</div></div>' +
            '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Открыть</button></div>' +
          '<div class="note">' + icon('info', 15, 2) +
            '<p>Это <b>кликабельный прототип</b>. Данные демонстрационные и хранятся только в вашем браузере — ' +
            'сбросить их можно кнопкой ниже.</p></div>' +
          '<div><button class="btn btn-danger" data-act="reset">Сбросить демо-данные</button></div>' +
        '</div></div>' +
      '</div>';
    },
    actions: {
      soon: function () { toast('В прототипе этот переход не реализован'); },
      reset: function () { Store.reset(); toast('Демо-данные сброшены'); }
    }
  };

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
