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

  function seedDraft() {
    return {
      name: '', url: '',
      vertical: 'Gambling', format: 'Popunder', model: 'smartcpm', age: 'Mainstream',
      capping: '1 impression / 24 hours', browsers: 'All browsers', language: 'Any language',
      sources: ['direct'], quality: ['fresh', 'regular'],
      platforms: ['Mobile'], oses: ['Android', 'iOS'],
      conn: 'All', vpn: 'No VPN',
      preset: '', subzones: '', subzoneMode: 'Exclude',
      daily: '400', total: '4000',
      /* Группа = один бид на несколько стран. Новая строка нужна только под другой бид. */
      rates: [],
      schedule: seedSchedule()
    };
  }

  function seed() {
    return {
      balance: 12480.50,
      campaigns: DATA.CAMPAIGNS.map(function (c) { return Object.assign({}, c); }),
      blockedZones: { 'NN-37540': true },
      forcedZones: {},
      campaignBlocks: {},
      campaignForced: {},
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
        campStatus: 'all', campModel: 'all', campSelection: [],
        geoPickerOpen: false, geoSearch: '', geoPick: [], geoTarget: 'new', geoBid: '', advancedOpen: false,
        statsRange: 30, statsTab: 'zones', statsCampaign: '',
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

  w.Store = {
    get: get, set: set, patch: patch, ui: ui, reset: reset,
    subscribe: subscribe, seedDraft: seedDraft, seedSchedule: seedSchedule,
    zoneState: zoneState, zoneIsOn: zoneIsOn, setZone: setZone, toggleZone: toggleZone
  };
})(window);
