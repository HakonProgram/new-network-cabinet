/* Состояние кабинета. Живёт в localStorage, чтобы клики переживали перезагрузку. */
(function (w) {
  'use strict';

  var KEY = 'nn-cabinet-v2';

  function seedSchedule() {
    var out = [], d, h;
    for (d = 0; d < 7; d++) {
      var row = [];
      for (h = 0; h < 24; h++) row.push(h >= 6);
      out.push(row);
    }
    return out;
  }

  function seedDraft() {
    return {
      name: '', url: '',
      vertical: 'Gambling', format: 'Popunder', model: 'smartcpm', age: 'Mainstream',
      capping: '1 impression / 24 hours',
      platforms: ['Mobile'], oses: ['Android', 'iOS'],
      conn: 'All', vpn: 'No VPN',
      preset: '', subzones: '',
      daily: '400', total: '4000',
      rates: [
        { code: 'DE', name: 'Germany', bid: '2.40', goal: '' },
        { code: 'AT', name: 'Austria', bid: '2.10', goal: '' }
      ],
      schedule: seedSchedule()
    };
  }

  function seed() {
    return {
      balance: 12480.50,
      campaigns: DATA.CAMPAIGNS.map(function (c) { return Object.assign({}, c); }),
      blockedZones: { 'NN-37540': true },
      selection: [],
      presets: DATA.PRESETS.map(function (p) {
        return Object.assign({}, p, { zones: p.zones.slice(), appliedTo: p.appliedTo.slice() });
      }),
      payments: DATA.PAYMENTS.map(function (p) { return Object.assign({}, p); }),
      notifications: DATA.NOTIFICATIONS.map(function (n) { return Object.assign({}, n); }),
      channels: { mail: true, tg: true, browser: false },
      threshold: '2 days',
      draft: seedDraft(),
      ui: {
        campStatus: 'all', campModel: 'all',
        statsRange: 30, statsTab: 'zones',
        zonesTab: 'all', zonesCat: 'all', zonesVertical: 'all', zonesSort: 'cost',
        openPreset: '',
        payMethod: 'card', payAmount: '5000', payTab: 'pay', payRange: '30',
        profileTab: 'acct',
        notifTab: 'all',
        volFormat: 'Popunder', volPlatform: 'Mobile', volCat: 'Mainstream',
        volRegion: 'Europe', volModel: 'Smart CPM', volBid: '2.40',
        postbackTested: false
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
        var base = seed();
        state = Object.assign({}, base, parsed);
        state.ui = Object.assign({}, base.ui, parsed.ui || {});
        state.draft = Object.assign({}, base.draft, parsed.draft || {});
        return;
      }
    } catch (e) { /* повреждённое хранилище — начинаем заново */ }
    state = seed();
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
    state = seed();
    save();
    listeners.forEach(function (l) { l(); });
  }

  function subscribe(fn) { listeners.push(fn); }

  w.Store = {
    get: get, set: set, patch: patch, ui: ui, reset: reset,
    subscribe: subscribe, seedDraft: seedDraft, seedSchedule: seedSchedule
  };
})(window);
