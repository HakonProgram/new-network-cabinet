/* Состояние кабинета. Живёт в localStorage, чтобы клики переживали перезагрузку. */
(function (w) {
  'use strict';

  var KEY = 'nn-cabinet-v3';

  function seedSchedule() {
    var out = [], d, h;
    for (d = 0; d < 7; d++) {
      var row = [];
      for (h = 0; h < 24; h++) row.push(h >= 6);
      out.push(row);
    }
    return out;
  }

  /* Пустой набор фильтров отчёта. '' означает «все». */
  function seedStatsFilters() {
    return {
      preset: 'last30', from: '', to: '', delta: '',
      groupBy: 'zones', groupBy2: '',
      campaign: '', country: '', city: '', platform: '', os: '',
      format: '', model: '', browser: '', connection: '', zone: '', isp: '', cpaTest: ''
    };
  }

  function seedDraft() {
    return {
      name: '', url: '',
      vertical: 'Gambling', format: 'Popunder', model: 'smartcpm', age: 'Mainstream',
      capping: '1 impression / 24 hours', browsers: 'All browsers', language: 'Any language',
      sources: ['direct'], quality: ['fresh', 'regular'],
      platforms: ['Mobile'], oses: ['Android', 'iOS'],
      /* osVer[os] = { from, to }; пусто — все версии. */
      osVer: {},
      conn: 'All', vpn: 'No VPN',
      preset: '', subzones: '', subzoneMode: 'Exclude',
      daily: '400', total: '4000',
      /* Группа = один бид на несколько стран. Новая строка нужна только под другой бид. */
      rates: [],
      schedule: seedSchedule()
    };
  }

  /* Два состояния аккаунта: демонстрационный со статистикой и пустой,
     каким его видит человек, только что зарегистрировавшийся в сети. */
  function seed(mode) {
    var fresh = mode === 'fresh';
    return {
      session: null,
      balance: fresh ? 0 : 12480.50,
      campaigns: fresh ? [] : DATA.CAMPAIGNS.map(function (c) { return Object.assign({}, c); }),
      blockedZones: fresh ? {} : { 'NN-37540': true },
      forcedZones: {},
      campaignBlocks: {},
      campaignForced: {},
      selection: [],
      presets: fresh ? [] : DATA.PRESETS.map(function (p) {
        return Object.assign({}, p, { zones: p.zones.slice(), appliedTo: p.appliedTo.slice() });
      }),
      payments: fresh ? [] : DATA.PAYMENTS.map(function (p) { return Object.assign({}, p); }),
      notifications: fresh
        ? [{ id: 1, kind: 'bot', cat: 'camp', unread: true, title: 'Welcome to AdAnvil',
             text: 'Top up the balance, connect your postback and launch the first campaign — ' +
                   'the robot takes it from there.', time: 'Just now' }]
        : DATA.NOTIFICATIONS.map(function (n) { return Object.assign({}, n); }),
      channels: { mail: true, tg: true, browser: false },
      threshold: '2 days',
      draft: seedDraft(),
      ui: {
        campStatus: 'all', campModel: 'all', campSelection: [],
        geoPickerOpen: false, geoSearch: '', geoPick: [], geoTarget: 'new', geoBid: '', advancedOpen: false,
        /* Черновик фильтров отчёта и то, что реально применено кнопкой. */
        statsForm: seedStatsFilters(), statsApplied: seedStatsFilters(), statsMore: false,
        zonesTab: 'all', zonesCat: 'all', zonesVertical: 'all', zonesSort: 'cost',
        openPreset: '',
        payMethod: 'card', payAmount: '5000', payTab: 'pay', payRange: '30',
        profileTab: 'acct',
        notifTab: 'all',
        volFormat: 'Popunder', volPlatform: 'Mobile', volCat: 'Mainstream',
        volRegion: 'Europe', volModel: 'Smart CPM', volBid: '2.40',
        postbackTested: false,
        auth: { tab: 'signin', login: '', password: '', email: '',
                company: '', firstName: '', lastName: '', error: '' }
      }
    };
  }

  var state = null;
  var listeners = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var base = seed(parsed.session ? parsed.session.mode : 'demo');
        state = Object.assign({}, base, parsed);
        state.ui = Object.assign({}, base.ui, parsed.ui || {});
        state.draft = Object.assign({}, base.draft, parsed.draft || {});
        return;
      }
    } catch (e) { /* повреждённое хранилище — начинаем заново */ }
    state = seed('demo');
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ }
  }

  function get() {
    if (!state) load();
    return state;
  }

  /* Изменить состояние без перерисовки (для полей ввода). */
  function patch(fn) { fn(get()); save(); }

  /* Изменить состояние и перерисовать экран. */
  function set(fn) {
    fn(get());
    save();
    listeners.forEach(function (l) { l(); });
  }

  function ui(key, value) {
    set(function (s) { s.ui[key] = value; });
  }

  function reset() {
    var session = get().session;
    state = seed(session ? session.mode : 'demo');
    state.session = session;
    save();
    listeners.forEach(function (l) { l(); });
  }

  function subscribe(fn) { listeners.push(fn); }

  /* Состояние площадки: глобальное или в рамках одной кампании.
     live — крутится, robot — отключена роботом, blocked — выключена вами,
     campaign — выключена вами только в этой кампании. */
  function zoneState(zone, campaignId) {
    var s = get();
    if (campaignId) {
      var off = s.campaignBlocks[campaignId] || {};
      if (off[zone.id]) return 'campaign';
      var on = s.campaignForced[campaignId] || {};
      if (on[zone.id]) return 'live';
    }
    if (s.blockedZones[zone.id]) return 'blocked';
    if (s.forcedZones[zone.id]) return 'live';
    return zone.robot ? 'robot' : 'live';
  }

  function zoneIsOn(zone, campaignId) {
    return zoneState(zone, campaignId) === 'live';
  }

  /* Включить или выключить площадку. Без campaignId — на весь аккаунт. */
  function setZone(zoneId, campaignId, on) {
    var zone = DATA.ZONES.find(function (z) { return z.id === zoneId; });
    if (!zone) return;
    set(function (s) {
      if (campaignId) {
        if (!s.campaignBlocks[campaignId]) s.campaignBlocks[campaignId] = {};
        if (!s.campaignForced[campaignId]) s.campaignForced[campaignId] = {};
        delete s.campaignBlocks[campaignId][zoneId];
        delete s.campaignForced[campaignId][zoneId];
        if (on) {
          /* Включаем поверх глобальной блокировки или решения робота. */
          if (s.blockedZones[zoneId] || zone.robot) s.campaignForced[campaignId][zoneId] = true;
        } else {
          s.campaignBlocks[campaignId][zoneId] = true;
        }
        return;
      }
      delete s.blockedZones[zoneId];
      delete s.forcedZones[zoneId];
      if (on) {
        if (zone.robot) s.forcedZones[zoneId] = true;
      } else {
        s.blockedZones[zoneId] = true;
      }
    });
  }

  function toggleZone(zoneId, campaignId) {
    var zone = DATA.ZONES.find(function (z) { return z.id === zoneId; });
    if (!zone) return;
    setZone(zoneId, campaignId, !zoneIsOn(zone, campaignId));
  }

  /* Серверная часть состояния. Пишет в неё только Api — экраны читают. */
  function db() { return get(); }
  /* Изменение из Api: мутируем, сохраняем, перерисовываем и возвращаем результат. */
  function commit(fn) {
    var out;
    set(function (s) { out = fn(s); });
    return out;
  }

  /* Вход: аккаунт пересобирается под выбранный режим, поэтому демо и
     пустой кабинет никогда не смешиваются между собой. */
  function signIn(user, mode, person) {
    state = seed(mode);
    state.session = Object.assign({ user: user, mode: mode, since: Date.now() }, person || {});
    save();
    listeners.forEach(function (l) { l(); });
  }

  function signOut() {
    state = seed('demo');
    state.session = null;
    save();
    listeners.forEach(function (l) { l(); });
  }

  w.Store = {
    get: get, db: db, commit: commit, set: set, patch: patch, ui: ui, reset: reset,
    signIn: signIn, signOut: signOut,
    subscribe: subscribe, seedDraft: seedDraft, seedSchedule: seedSchedule,
    seedStatsFilters: seedStatsFilters,
    zoneState: zoneState, zoneIsOn: zoneIsOn, setZone: setZone, toggleZone: toggleZone
  };
})(window);
