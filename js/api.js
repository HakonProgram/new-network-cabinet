/* ═══════════════════════════════════════════════════════════
   Слой доступа к данным. Экраны не знают, откуда приходят данные:
   сегодня их отдаёт mock поверх localStorage, завтра — настоящий
   backend. Каждый метод описан парой «метод + путь», поэтому
   подключение сервера сводится к Api.configure({ mode: 'http' }).
   ═══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  var cfg = { mode: 'mock', baseUrl: '/api/v1', token: '', latency: 0 };

  function configure(next) { Object.assign(cfg, next || {}); return cfg; }

  /* ── транспорт ── */
  function http(method, path, body) {
    var opts = { method: method, headers: { 'Accept': 'application/json' } };
    if (cfg.token) opts.headers['Authorization'] = 'Bearer ' + cfg.token;
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(cfg.baseUrl + path, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var err = new Error('HTTP ' + res.status + ' ' + method + ' ' + path);
          err.status = res.status;
          err.body = t;
          throw err;
        });
      }
      return res.status === 204 ? null : res.json();
    });
  }

  /* Заглушка отвечает так же асинхронно, как сеть, — экраны не начнут
     полагаться на синхронность и не сломаются при переключении. */
  function mock(fn) {
    return new Promise(function (resolve, reject) {
      var run = function () {
        try { resolve(fn()); } catch (e) { reject(e); }
      };
      cfg.latency ? setTimeout(run, cfg.latency) : Promise.resolve().then(run);
    });
  }

  /* Каждый метод объявляется один раз: путь для сервера и реализация для заглушки. */
  function endpoint(method, pathFn, mockFn) {
    return function () {
      var args = [].slice.call(arguments);
      if (cfg.mode === 'http') {
        var path = pathFn.apply(null, args);
        var body = method === 'GET' || method === 'DELETE' ? undefined : (args[args.length - 1] || {});
        return http(method, typeof path === 'string' ? path : path.path,
                    typeof path === 'string' ? body : path.body);
      }
      return mock(function () { return mockFn.apply(null, args); });
    };
  }

  function qs(params) {
    var parts = [];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== '' && params[k] !== undefined && params[k] !== null && params[k] !== 'all') {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      }
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  function db() { return Store.db(); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function commit(fn) { return Store.commit(fn); }

  /* ── справочники: всё, что на сервере лежит таблицами-словарями ── */
  var dictionaries = {
    all: endpoint('GET', function () { return '/dictionaries'; }, function () {
      return {
        payModels: DATA.PAY_MODELS, verticals: DATA.VERTICALS, formats: DATA.FORMATS,
        countries: DATA.COUNTRIES, quality: DATA.QUALITY, sources: DATA.SOURCES,
        capping: DATA.CAPPING, browsers: DATA.BROWSERS, languages: DATA.LANGUAGES,
        platformOs: DATA.PLATFORM_OS, osOrder: DATA.OS_ORDER, osVersions: DATA.OS_VERSIONS,
        tokens: DATA.TOKENS, statuses: DATA.STATUS
      };
    })
  };

  /* ── аккаунт ── */
  var account = {
    get: endpoint('GET', function () { return '/account'; }, function () {
      var s = db();
      return { id: 'adv-4821', name: 'Nexora Media', balance: s.balance,
               channels: clone(s.channels), threshold: s.threshold };
    }),
    update: endpoint('PATCH', function () { return '/account'; }, function (patch) {
      return commit(function (s) {
        if (patch.channels) Object.assign(s.channels, patch.channels);
        if (patch.threshold) s.threshold = patch.threshold;
        return { ok: true };
      });
    })
  };

  /* ── кампании ── */
  function matches(c, q) {
    if (q.status && q.status !== 'all' && c.status !== q.status) return false;
    if (q.model && q.model !== 'all' && c.model !== q.model) return false;
    return true;
  }

  function nextId(s) {
    return String(s.campaigns.reduce(function (mx, c) { return Math.max(mx, Number(c.id) || 0); }, 4800) + 7);
  }

  /* Переходы статусов живут здесь, а не в экранах: это правила сервера.
     wasTest помнит, что кампания была тестовой, beforeArchive — чем была до архива. */
  function applyAction(s, action, ids) {
    var affected = 0, last = null;
    ids.map(String).forEach(function (id) {
      var c = s.campaigns.find(function (x) { return String(x.id) === id; });
      if (!c) return;
      if (action === 'start') {
        if (c.status === 'paused') { c.status = c.wasTest ? 'test' : 'active'; affected++; last = c; }
      } else if (action === 'stop') {
        if (c.status === 'active' || c.status === 'test') {
          c.wasTest = c.status === 'test'; c.status = 'paused'; affected++; last = c;
        }
      } else if (action === 'toggle') {
        if (c.status === 'review' || c.status === 'done' || c.status === 'archived') return;
        if (c.status === 'paused') c.status = c.wasTest ? 'test' : 'active';
        else { c.wasTest = c.status === 'test'; c.status = 'paused'; }
        affected++; last = c;
      } else if (action === 'archive') {
        if (c.status === 'archived') return;
        c.beforeArchive = c.status; c.status = 'archived'; affected++; last = c;
      } else if (action === 'restore') {
        c.status = c.beforeArchive === 'archived' ? 'paused' : (c.beforeArchive || 'paused');
        if (c.status === 'review') c.status = 'paused';
        delete c.beforeArchive; affected++; last = c;
      } else if (action === 'duplicate') {
        var copy = Object.assign({}, c, { id: nextId(s), name: c.name + ' \u2014 copy', status: 'paused',
          impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, winRate: 0 });
        delete copy.wasTest; delete copy.beforeArchive;
        s.campaigns.unshift(copy); affected++; last = copy;
      }
    });
    return { affected: affected, campaign: last ? clone(last) : null };
  }

  var campaigns = {
    list: endpoint('GET', function (q) { return '/campaigns' + qs(q); }, function (q) {
      return db().campaigns.filter(function (c) { return matches(c, q || {}); }).map(clone);
    }),
    get: endpoint('GET', function (id) { return '/campaigns/' + id; }, function (id) {
      var c = db().campaigns.find(function (x) { return String(x.id) === String(id); });
      if (!c) throw new Error('campaign not found: ' + id);
      return clone(c);
    }),
    /* Черновик формы превращается в кампанию только здесь — до отправки он живёт в браузере. */
    create: endpoint('POST', function () { return '/campaigns'; }, function (payload) {
      return commit(function (s) {
        var c = Object.assign({ status: 'review', impr: 0, clicks: 0, conv: 0,
                                cost: 0, revenue: 0, winRate: 0 }, payload, { id: nextId(s) });
        s.campaigns.unshift(c);
        return clone(c);
      });
    }),
    update: endpoint('PATCH', function (id) { return '/campaigns/' + id; }, function (id, patch) {
      return commit(function (s) {
        var c = s.campaigns.find(function (x) { return String(x.id) === String(id); });
        if (!c) throw new Error('campaign not found: ' + id);
        Object.assign(c, patch);
        return clone(c);
      });
    }),
    /* Массовое действие — один запрос, а не цикл из фронтенда. */
    bulk: endpoint('POST', function () { return '/campaigns/bulk'; }, function (payload) {
      return commit(function (s) { return applyAction(s, payload.action, payload.ids || []); });
    }),
    /* Событие робота: проверка пройдена, кампания запущена. На сервере придёт
       уведомлением, здесь — отдельной ручкой, чтобы логика лежала в одном месте. */
    passAutoCheck: endpoint('POST', function (id) { return '/campaigns/' + id + '/auto-check'; },
      function (id) {
        return commit(function (s) {
          var c = s.campaigns.find(function (x) { return String(x.id) === String(id); });
          if (!c || c.status !== 'review') return { campaign: null };
          c.status = 'active';
          s.notifications.unshift({
            id: Date.now(), kind: 'ok', cat: 'camp', unread: true,
            title: 'Auto-check passed — campaign started',
            text: 'NN-C-' + c.id + ' \u201c' + c.name + '\u201d \u00b7 vertical detected, link responds, ' +
                  'settings package assembled. No manager involved.',
            time: 'Just now'
          });
          return { campaign: clone(c) };
        });
      })
  };

  /* ── отчёты: одна ручка на все разрезы ── */
  var reports = {
    query: endpoint('GET', function (q) { return '/reports/' + q.dimension + qs({
      range: q.range, campaignId: q.campaignId
    }); }, function (q) {
      return { dimension: q.dimension, range: q.range, campaignId: q.campaignId || null };
    })
  };

  /* ── площадки ── */
  var placements = {
    list: endpoint('GET', function (q) { return '/placements' + qs(q); }, function (q) {
      q = q || {};
      return DATA.ZONES.filter(function (z) {
        if (q.category && q.category !== 'all' && z.cat !== q.category) return false;
        return true;
      }).map(function (z) {
        return Object.assign(clone(z), { state: Store.zoneState(z, q.campaignId || null) });
      });
    }),
    setState: endpoint('PUT', function (id) { return '/placements/' + id + '/state'; },
      function (id, payload) {
        Store.setZone(id, payload.campaignId || null, !!payload.on);
        return { id: id, on: !!payload.on };
      }),
    /* Переключение без знания текущего состояния — решает сервер. */
    toggle: endpoint('POST', function (id) { return '/placements/' + id + '/toggle'; },
      function (id, payload) {
        var cid = (payload || {}).campaignId || null;
        Store.toggleZone(id, cid);
        var z = DATA.ZONES.find(function (x) { return x.id === id; });
        return { id: id, on: z ? Store.zoneIsOn(z, cid) : false };
      }),
    setStateMany: endpoint('POST', function () { return '/placements/state'; }, function (payload) {
      (payload.ids || []).forEach(function (id) {
        Store.setZone(id, payload.campaignId || null, !!payload.on);
      });
      return { affected: (payload.ids || []).length, on: !!payload.on };
    })
  };

  /* ── пресеты площадок ── */
  var presets = {
    list: endpoint('GET', function () { return '/presets'; }, function () {
      return db().presets.map(clone);
    }),
    create: endpoint('POST', function () { return '/presets'; }, function (payload) {
      return commit(function (s) {
        var p = Object.assign({ id: 'p' + Date.now(), zones: [], appliedTo: [] }, payload);
        s.presets.push(p);
        return clone(p);
      });
    }),
    update: endpoint('PATCH', function (id) { return '/presets/' + id; }, function (id, patch) {
      return commit(function (s) {
        var p = s.presets.find(function (x) { return x.id === id; });
        if (p) Object.assign(p, patch);
        return p ? clone(p) : null;
      });
    }),
    remove: endpoint('DELETE', function (id) { return '/presets/' + id; }, function (id) {
      return commit(function (s) {
        var p = s.presets.find(function (x) { return x.id === id; });
        s.presets = s.presets.filter(function (x) { return x.id !== id; });
        return { ok: true, name: p ? p.name : '' };
      });
    }),
    addZones: endpoint('POST', function (id) { return '/presets/' + id + '/zones'; },
      function (id, payload) {
        return commit(function (s) {
          var p = s.presets.find(function (x) { return x.id === id; }), added = 0;
          if (!p) return { added: 0 };
          (payload.zones || []).forEach(function (z) {
            if (p.zones.indexOf(z) < 0) { p.zones.push(z); added++; }
          });
          return { added: added, preset: clone(p) };
        });
      }),
    removeZone: endpoint('DELETE', function (id, zoneId) { return '/presets/' + id + '/zones/' + zoneId; },
      function (id, zoneId) {
        return commit(function (s) {
          var p = s.presets.find(function (x) { return x.id === id; });
          if (!p) return { ok: false };
          var i = p.zones.indexOf(zoneId);
          if (i >= 0) p.zones.splice(i, 1);
          return { ok: true };
        });
      }),
    toggleCampaign: endpoint('POST', function (id) { return '/presets/' + id + '/campaigns'; },
      function (id, payload) {
        return commit(function (s) {
          var p = s.presets.find(function (x) { return x.id === id; });
          if (!p) return { ok: false };
          var i = p.appliedTo.indexOf(payload.campaignId);
          if (i >= 0) p.appliedTo.splice(i, 1); else p.appliedTo.push(payload.campaignId);
          return { ok: true, appliedTo: p.appliedTo.slice() };
        });
      }),
    flip: endpoint('POST', function (id) { return '/presets/' + id + '/flip'; }, function (id) {
      return commit(function (s) {
        var p = s.presets.find(function (x) { return x.id === id; });
        if (p) p.kind = p.kind === 'whitelist' ? 'blacklist' : 'whitelist';
        return p ? clone(p) : null;
      });
    })
  };

  /* ── деньги ── */
  var billing = {
    summary: endpoint('GET', function () { return '/billing'; }, function () {
      var s = db();
      return { balance: s.balance, payments: s.payments.map(clone) };
    }),
    /* Комиссию считает сервер: фронтенд не должен решать, сколько зачислить. */
    topUp: endpoint('POST', function () { return '/billing/top-up'; }, function (payload) {
      return commit(function (s) {
        var amount = Number(payload.amount) || 0;
        var fee = amount * (Number(payload.feePct) || 0) / 100;
        var credited = amount - fee;
        s.balance += credited;
        s.payments.unshift({ date: UI.dateShort(new Date()), meth: payload.method,
          sum: amount, fee: fee, ok: 'ok', st: 'Credited', doc: 'Receipt' });
        s.notifications.unshift({ id: Date.now(), kind: 'money', cat: 'money', unread: true,
          title: 'Payment credited',
          text: UI.money(amount) + ' \u00b7 ' + String(payload.method).toLowerCase() +
                ' \u00b7 fee ' + UI.money2(fee) + ' \u00b7 ' + UI.money2(credited) + ' credited.',
          time: 'Just now' });
        return { balance: s.balance, credited: credited, fee: fee };
      });
    })
  };

  /* ── уведомления ── */
  var notifications = {
    list: endpoint('GET', function (q) { return '/notifications' + qs(q); }, function () {
      return db().notifications.map(clone);
    }),
    markRead: endpoint('POST', function () { return '/notifications/read'; }, function (payload) {
      return commit(function (s) {
        s.notifications.forEach(function (n) {
          if (!payload.id || String(n.id) === String(payload.id)) n.unread = false;
        });
        return { ok: true };
      });
    })
  };

  /* ── прогноз объёмов ── */
  var volumes = {
    forecast: endpoint('GET', function (q) { return '/volumes/forecast' + qs(q); }, function (q) {
      return { query: q };
    })
  };

  /* ── постбек ── */
  var postback = {
    test: endpoint('POST', function () { return '/postback/test'; }, function (payload) {
      return { ok: true, url: payload.url, status: 200 };
    })
  };

  w.Api = {
    configure: configure, config: cfg,
    dictionaries: dictionaries, account: account, campaigns: campaigns, reports: reports,
    placements: placements, presets: presets, billing: billing,
    notifications: notifications, volumes: volumes, postback: postback
  };
})(window);
