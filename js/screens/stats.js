/* Statistics: daily charts plus a full metric report across four breakdowns. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var G = { L: 48, R: 524, T: 14, B: 150, W: 532, H: 184 };

  var M_HEADS = ['Impr.', 'Clicks', 'CTR', 'Conv.', 'CR', 'Cost', 'Revenue', 'Profit', 'ROI', 'CPA', 'CPM', 'CPC', 'Win rate'];
  /* min-width строки = сумма колонок + 12px на каждый зазор + 32px отступов.
     Если объявить меньше — колонки вылезут за элемент и подложка оборвётся. */
  var M_COLS = '78px 78px 58px 66px 58px 84px 88px 88px 76px 68px 66px 68px 74px';

  /* Первые колонки строки «Итого»: подпись плюс пустые ячейки под остальные разрезы. */
  function dimCells(count, label) {
    var out = '<div class="tot-lab">Total</div>';
    if (count > 1) out += '<div class="cell muted">' + label + '</div>';
    for (var i = 2; i < count; i++) out += '<div></div>';
    return out;
  }

  function tailCells(count) {
    var out = '';
    for (var i = 0; i < count; i++) out += '<div></div>';
    return out;
  }

  var ZSTATE = {
    live:     { label: 'Live',      pill: 'pill pill-ok' },
    robot:    { label: 'Robot off', pill: 'pill pill-wait' },
    blocked:  { label: 'Turned off', pill: 'pill pill-bad' },
    campaign: { label: 'Off here',  pill: 'pill pill-bad' }
  };

  function metricCells(row) {
    var m = UI.metrics(row);
    return '<div class="cell muted r">' + m.impr + '</div>' +
      '<div class="cell muted r">' + m.clicks + '</div>' +
      '<div class="cell muted r">' + m.ctr + '</div>' +
      '<div class="cell w r">' + m.conv + '</div>' +
      '<div class="cell muted r">' + m.cr + '</div>' +
      '<div class="cell w r">' + m.cost + '</div>' +
      '<div class="cell r">' + m.revenue + '</div>' +
      '<div class="cell r" style="color:' + m.profitColor + '">' + m.profit + '</div>' +
      '<div class="cell w r" style="color:' + m.roiColor + '">' + m.roi + '</div>' +
      '<div class="cell muted r">' + m.cpa + '</div>' +
      '<div class="cell muted r">' + m.cpm + '</div>' +
      '<div class="cell muted r">' + m.cpc + '</div>' +
      '<div class="cell muted r">' + m.win + '</div>';
  }

  function scale(row, k) {
    return {
      impr: row.impr * k, clicks: row.clicks * k, conv: row.conv * k,
      cost: row.cost * k, revenue: row.revenue * k, winRate: row.winRate
    };
  }

  /* Плавное блуждание вокруг среднего — для доли выигранных аукционов. */
  function wander(n, seed, mid, amp) {
    var s = seed >>> 0, out = [], i;
    for (i = 0; i < n; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      var r = s / 4294967296;
      out.push(mid + Math.sin(i / 5.1) * amp * 0.6 + (r - 0.5) * amp);
    }
    return out;
  }

  /* Кампания-фокус задаётся тем же фильтром, что и в панели. */
  function scopedCampaign() {
    var s = Store.get(), id = s.ui.statsApplied.campaign;
    if (!id) return null;
    return s.campaigns.find(function (c) { return String(c.id) === String(id); }) || null;
  }

  /* ── период ──
     Пресеты считаются от сегодняшней даты; произвольный период
     берётся из полей From/To. Всё в UTC, как и у сервера. */
  var PRESETS = [
    { k: 'today',     label: 'Today' },
    { k: 'yesterday', label: 'Yesterday' },
    { k: 'last7',     label: 'Last 7 days' },
    { k: 'thisWeek',  label: 'This week' },
    { k: 'last30',    label: 'Last 30 days' },
    { k: 'thisMonth', label: 'This month' },
    { k: 'lastMonth', label: 'Last month' }
  ];

  function iso(dt) { return dt.toISOString().slice(0, 10); }

  function presetRange(key) {
    var now = new Date();
    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    var from = new Date(today), to = new Date(today);
    if (key === 'yesterday') { from.setUTCDate(from.getUTCDate() - 1); to = new Date(from); }
    else if (key === 'last7') { from.setUTCDate(from.getUTCDate() - 6); }
    else if (key === 'last30') { from.setUTCDate(from.getUTCDate() - 29); }
    else if (key === 'thisWeek') { from.setUTCDate(from.getUTCDate() - ((from.getUTCDay() + 6) % 7)); }
    else if (key === 'thisMonth') { from.setUTCDate(1); }
    else if (key === 'lastMonth') {
      from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
      to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    }
    return { from: iso(from), to: iso(to) };
  }

  function rangeOf(f) {
    var r = f.from && f.to ? { from: f.from, to: f.to } : presetRange(f.preset || 'last30');
    var days = Math.round((Date.parse(r.to) - Date.parse(r.from)) / 86400000) + 1;
    return { from: r.from, to: r.to, days: Math.max(1, Math.min(90, days || 1)) };
  }

  function model() {
    var s = Store.get(), f = applied();
    var per = rangeOf(f);
    var n = per.days, k = n / DATA.BASE_DAYS;
    var scoped = scopedCampaign();
    var list = campaignList(f);
    var base = UI.sum(list);
    var accountCost = UI.sum(s.campaigns).cost;
    /* Разрезы по площадкам и гео сужаются пропорционально доле в расходе. */
    var share = accountCost ? base.cost / accountCost : 0;
    /* Фильтры без построчных данных сужают отчёт пропорционально доле трафика. */
    var m = shareFactor(f);
    if (f.country) {
      var g = DATA.GEO.find(function (x) { return x.code === f.country; });
      var geoTot = DATA.GEO.reduce(function (a, x) { return a + x.cost; }, 0) || 1;
      m *= g ? g.cost / geoTot : 0;
    }
    if (f.zone) {
      var z = DATA.ZONES.find(function (x) { return x.id === f.zone; });
      var zoneTot = DATA.ZONES.reduce(function (a, x) { return a + x.cost; }, 0) || 1;
      m *= z ? z.cost / zoneTot : 0;
    }
    var tot = {
      impr: base.impr * k * m, clicks: base.clicks * k * m, conv: base.conv * k * m,
      cost: base.cost * k * m, revenue: base.revenue * k * m,
      winRate: base.cost ? base.wSum / base.cost : 0
    };
    /* Delta — сравнение с таким же по длине периодом, сдвинутым назад.
       Оба окна нарезаем из одного ряда, чтобы сравнение было честным. */
    var deltaDays = Math.max(0, Math.min(90, Math.round(UI.num(f.delta) || 0)));
    var prev = null;
    if (deltaDays > 0) {
      var len = n + deltaDays, sc = len / n;
      var slice = function (arr, from, to) {
        return arr.slice(from, to).reduce(function (a, x) { return a + x; }, 0);
      };
      var cs = UI.daily(len, 20260907, Math.round(tot.cost * sc));
      var vs = UI.daily(len, 815, Math.round(tot.conv * sc));
      var rs = UI.daily(len, 4471, Math.round(tot.revenue * sc));
      prev = {
        days: deltaDays,
        cost: slice(cs, 0, n), conv: slice(vs, 0, n), revenue: slice(rs, 0, n),
        curCost: slice(cs, len - n, len), curConv: slice(vs, len - n, len), curRevenue: slice(rs, len - n, len)
      };
    }

    return {
      n: n, k: k, tot: tot, scoped: scoped, share: share, period: per, list: list, prev: prev,
      cost: UI.daily(n, 20260907, Math.round(tot.cost)),
      conv: UI.daily(n, 815, Math.round(tot.conv)),
      revenue: UI.daily(n, 4471, Math.round(tot.revenue)),
      win: wander(n, 99173, tot.winRate, 7)
    };
  }

  /* ── графики ── */
  function axis(t, fmt) {
    return t.values.map(function (v) {
      var y = G.B - (v / t.top) * (G.B - G.T);
      return '<line x1="' + G.L + '" y1="' + y.toFixed(1) + '" x2="' + G.R + '" y2="' + y.toFixed(1) + '" stroke="' + UI.color('--border') + '" stroke-width="1"/>' +
        '<text x="' + (G.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="' + UI.color('--text-3') + '" font-size="10" text-anchor="end">' + fmt(v) + '</text>';
    }).join('');
  }

  function xTicks(n, fx) {
    var step = Math.max(1, Math.round(n / 5)), idx = [], i;
    for (i = 0; i < n; i += step) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    return idx.map(function (j) {
      return '<text x="' + fx(j).toFixed(1) + '" y="170" fill="' + UI.color('--text-3') + '" font-size="10" text-anchor="middle">' +
        UI.dayLabel(n - 1 - j) + '</text>';
    }).join('');
  }

  function svgOpen(id, label) {
    return '<svg id="' + id + '" width="100%" height="184" viewBox="0 0 532 184" fill="none" ' +
      'font-family="IBM Plex Mono, monospace" aria-label="' + label + '">';
  }

  function lineChart(series, id, label, color, fmt) {
    var n = series.length, t = UI.ticks(Math.max.apply(null, series));
    var px = function (i) { return G.L + (n === 1 ? (G.R - G.L) / 2 : (i / (n - 1)) * (G.R - G.L)); };
    var py = function (v) { return G.B - (v / t.top) * (G.B - G.T); };
    var line = series.map(function (v, i) { return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' ');
    var area = 'M ' + px(0).toFixed(1) + ' ' + G.B + ' L ' +
      series.map(function (v, i) { return px(i).toFixed(1) + ' ' + py(v).toFixed(1); }).join(' L ') +
      ' L ' + px(n - 1).toFixed(1) + ' ' + G.B + ' Z';
    return svgOpen(id, label) + axis(t, fmt) +
      '<path d="' + area + '" fill="' + color + '" fill-opacity="0.10"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<line class="cross" x1="0" y1="14" x2="0" y2="150" stroke="' + UI.color('--border-strong') + '" stroke-width="1" opacity="0"/>' +
      '<circle class="mark" cx="0" cy="0" r="4.5" fill="' + color + '" stroke="' + UI.color('--surface') + '" stroke-width="2" opacity="0"/>' +
      xTicks(n, px) + '</svg>';
  }

  function barChart(series, id, label, color, fmt) {
    var n = series.length, t = UI.ticks(Math.max.apply(null, series));
    var band = (G.R - G.L) / n, bw = Math.min(24, Math.max(2, band - 2));
    var bars = series.map(function (v, i) {
      var h = Math.max(2, (v / t.top) * (G.B - G.T));
      return '<rect data-i="' + i + '" x="' + (G.L + i * band + (band - bw) / 2).toFixed(1) + '" y="' + (G.B - h).toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + color + '"/>';
    }).join('');
    return svgOpen(id, label) + axis(t, fmt) + bars +
      xTicks(n, function (i) { return G.L + i * band + band / 2; }) + '</svg>';
  }

  /* Прибыль по дням: столбцы вверх и вниз от нуля. */
  function divChart(series, id, label) {
    var n = series.length;
    var max = Math.max.apply(null, series.map(Math.abs));
    var t = UI.ticks(max);
    var zero = (G.T + G.B) / 2, half = (G.B - G.T) / 2;
    var band = (G.R - G.L) / n, bw = Math.min(24, Math.max(2, band - 2));

    var grid = [-1, -0.5, 0, 0.5, 1].map(function (q) {
      var y = zero - q * half;
      return '<line x1="' + G.L + '" y1="' + y.toFixed(1) + '" x2="' + G.R + '" y2="' + y.toFixed(1) +
        '" stroke="' + (q === 0 ? '' + UI.color('--border-strong') + '' : '' + UI.color('--border') + '') + '" stroke-width="1"/>' +
        '<text x="' + (G.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="' + UI.color('--text-3') + '" font-size="10" text-anchor="end">' +
        (q === 0 ? '0' : (q > 0 ? '' : '-') + '$' + UI.compact(t.top * Math.abs(q))) + '</text>';
    }).join('');

    var bars = series.map(function (v, i) {
      var h = Math.max(2, Math.abs(v) / t.top * half);
      var y = v >= 0 ? zero - h : zero;
      return '<rect data-i="' + i + '" x="' + (G.L + i * band + (band - bw) / 2).toFixed(1) + '" y="' + y.toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + (v >= 0 ? '' + UI.color('--pos') + '' : '' + UI.color('--neg') + '') + '"/>';
    }).join('');

    return svgOpen(id, label) + grid + bars +
      xTicks(n, function (i) { return G.L + i * band + band / 2; }) + '</svg>';
  }

  function chartCard(title, sub, total, plotId, svg) {
    return '<div class="chart"><div class="chart-h"><div>' +
      '<div class="chart-t">' + title + '</div><div class="chart-s">' + sub + '</div></div>' +
      '<div class="chart-tot">' + total + '</div></div>' +
      '<div class="plot" id="' + plotId + '">' + svg +
      '<div class="tip" id="tip' + plotId + '"><div class="tip-d"></div><div class="tip-v"></div></div></div></div>';
  }

  /* ══ фильтры и группировки ══════════════════════════════════
     Разрезы делятся на два вида. По кампаниям, странам, площадкам и
     дням есть построчные данные — там фильтр реально отбирает строки.
     По платформе, ОС, браузеру, соединению, городу, ISP и типу теста
     построчных данных нет: для них известна доля трафика, поэтому
     фильтр сужает отчёт пропорционально, а группировка делит итог на
     эти доли. Так цифры остаются согласованными между разрезами.
     ══════════════════════════════════════════════════════════ */

  var DIMS = [
    { k: 'days',      label: 'Day' },
    { k: 'campaigns', label: 'Campaign' },
    { k: 'geo',       label: 'Country' },
    { k: 'zones',     label: 'Placement' },
    { k: 'format',    label: 'Format' },
    { k: 'model',     label: 'Business model' },
    { k: 'platform',  label: 'Platform' },
    { k: 'os',        label: 'OS' },
    { k: 'browser',   label: 'Browser' },
    { k: 'connection',label: 'Connection' },
    { k: 'city',      label: 'City' },
    { k: 'isp',       label: 'ISP' }
  ];
  var DIM_LABEL = {};
  DIMS.forEach(function (x) { DIM_LABEL[x.k] = x.label; });

  /* Разрезы, у которых есть только доля трафика. */
  var SHARE_DIMS = { platform: 1, os: 1, browser: 1, connection: 1, city: 1, isp: 1, cpaTest: 1 };

  function applied() { return Store.get().ui.statsApplied; }

  /* Множитель от фильтров, у которых нет построчных данных. */
  function shareFactor(f) {
    var m = 1;
    Object.keys(SHARE_DIMS).forEach(function (key) {
      var picked = f[key];
      if (!picked) return;
      var item = (DATA.SHARES[key] || []).find(function (x) { return x.id === picked; });
      if (item) m *= item.w;
    });
    return m;
  }

  /* Кампании после фильтров: модель, формат, тип теста и выбор конкретной. */
  function campaignList(f) {
    var s = Store.get();
    var scoped = scopedCampaign();
    var list = scoped ? [scoped] : s.campaigns;
    return list.filter(function (c) {
      if (f.campaign && String(c.id) !== String(f.campaign)) return false;
      if (f.model && c.model !== f.model) return false;
      if (f.format && c.format !== f.format) return false;
      if (f.cpaTest === 'paid' && c.model !== 'CPA') return false;
      if (f.cpaTest === 'free' && c.model !== 'Pure CPA') return false;
      if (f.cpaTest === 'none' && (c.model === 'CPA' || c.model === 'Pure CPA')) return false;
      return true;
    });
  }

  function zoneList(f) {
    return DATA.ZONES.filter(function (z) { return !f.zone || z.id === f.zone; });
  }

  function geoList(f) {
    return DATA.GEO.filter(function (g) { return !f.country || g.code === f.country; });
  }

  /* Метрики строки из доли в общем итоге. */
  function fromWeight(tot, w) {
    return { impr: tot.impr * w, clicks: tot.clicks * w, conv: tot.conv * w,
             cost: tot.cost * w, revenue: tot.revenue * w, winRate: tot.winRate };
  }

  /* Элементы разреза: подпись, вес в расходе и — где есть — исходная строка. */
  function dimItems(key, d, f) {
    var i, out;
    if (SHARE_DIMS[key]) {
      var list = DATA.SHARES[key] || [];
      var picked = f[key];
      var use = picked ? list.filter(function (x) { return x.id === picked; }) : list;
      var sum = use.reduce(function (a, x) { return a + x.w; }, 0) || 1;
      return use.map(function (x) {
        return { id: x.id, label: x.label, w: x.w / sum, cells: ['<div class="cell w">' + esc(x.label) + '</div>'] };
      });
    }
    if (key === 'campaigns') {
      var cs = campaignList(f), tc = cs.reduce(function (a, c) { return a + c.cost; }, 0) || 1;
      return cs.map(function (c) {
        return { id: c.id, label: c.name, w: c.cost / tc, row: c,
          cells: ['<div class="cell w">' + esc(c.name) + '</div>',
                  '<div><span class="model">' + esc(c.model) + '</span></div>'] };
      });
    }
    if (key === 'geo') {
      var gs = geoList(f), tg = gs.reduce(function (a, g) { return a + g.cost; }, 0) || 1;
      return gs.map(function (g) {
        return { id: g.code, label: g.name, w: g.cost / tg, row: g,
          cells: ['<div class="cell w">' + esc(g.name) + '</div>',
                  '<div class="cell mono muted">' + g.code + '</div>'] };
      });
    }
    if (key === 'zones') {
      var cid = d.scoped ? d.scoped.id : null;
      var zs = zoneList(f), tz = zs.reduce(function (a, z) { return a + z.cost; }, 0) || 1;
      return zs.map(function (z) {
        var st = Store.zoneState(z, cid), on = st === 'live';
        return { id: z.id, label: z.id, w: z.cost / tz, row: z,
          cells: ['<div class="cell mono w">' + z.id + '</div>',
                  '<div class="cell"><span class="dot" style="background:' +
                    (z.cat === 'Adult' ? UI.color('--warn') : UI.color('--info')) + '"></span>' + z.cat + '</div>'],
          tail: ['<div><span class="' + ZSTATE[st].pill + '">' + ZSTATE[st].label + '</span></div>',
                 '<div class="acts"><button class="btn btn-xs ' + (on ? 'btn-danger' : 'btn-up') +
                   '" data-act="toggleZone" data-arg="' + z.id + '">' + (on ? 'Turn off' : 'Turn on') + '</button></div>'] };
      });
    }
    if (key === 'format') {
      var fl = {}, cl = campaignList(f);
      cl.forEach(function (c) { fl[c.format] = (fl[c.format] || 0) + c.cost; });
      var tf = Object.keys(fl).reduce(function (a, x) { return a + fl[x]; }, 0) || 1;
      return Object.keys(fl).map(function (x) {
        return { id: x, label: x, w: fl[x] / tf, cells: ['<div class="cell w">' + esc(x) + '</div>'] };
      });
    }
    if (key === 'model') {
      var ml = {}, cm = campaignList(f);
      cm.forEach(function (c) { ml[c.model] = (ml[c.model] || 0) + c.cost; });
      var tm2 = Object.keys(ml).reduce(function (a, x) { return a + ml[x]; }, 0) || 1;
      return Object.keys(ml).map(function (x) {
        return { id: x, label: x, w: ml[x] / tm2,
                 cells: ['<div><span class="model">' + esc(x) + '</span></div>'] };
      });
    }
    /* по дням */
    out = [];
    var shown = Math.min(14, d.n);
    var totalCost = d.cost.reduce(function (a, c) { return a + c; }, 0) || 1;
    for (i = 0; i < shown; i++) {
      var idx = d.n - 1 - i;
      out.push({ id: 'd' + idx, label: UI.dayLabel(i), w: d.cost[idx] / totalCost,
                 cells: ['<div class="cell w">' + UI.dayLabel(i) + '</div>'] });
    }
    return out;
  }

  var DIM_HEADS = {
    days: ['Date'], campaigns: ['Campaign', 'Model'], geo: ['Country', 'Code'],
    zones: ['Zone ID', 'Category'], format: ['Format'], model: ['Model'],
    platform: ['Platform'], os: ['OS'], browser: ['Browser'],
    connection: ['Connection'], city: ['City'], isp: ['ISP']
  };
  var DIM_COLS = {
    days: '120px', campaigns: 'minmax(190px,1fr) 92px', geo: 'minmax(150px,1fr) 70px',
    zones: '104px 96px', format: '120px', model: '110px', platform: '110px',
    os: '110px', browser: '150px', connection: '120px', city: '140px', isp: '170px'
  };

  function table(d) {
    var f = applied();
    var prim = dimItems(f.groupBy, d, f);
    var sec = f.groupBy2 && f.groupBy2 !== f.groupBy ? dimItems(f.groupBy2, d, f) : null;

    var cols = DIM_COLS[f.groupBy] + (sec ? ' ' + DIM_COLS[f.groupBy2] : '') + ' ' + M_COLS;
    var heads = DIM_HEADS[f.groupBy].concat(sec ? DIM_HEADS[f.groupBy2] : []).concat(M_HEADS);
    var lead = DIM_HEADS[f.groupBy].length + (sec ? DIM_HEADS[f.groupBy2].length : 0);
    var withTail = f.groupBy === 'zones' && !sec;

    var rows = [], totals = [];
    prim.forEach(function (a) {
      var pairs = sec ? sec.map(function (b) { return { w: a.w * b.w, cells: a.cells.concat(b.cells), tail: null }; })
                      : [{ w: a.w, cells: a.cells, tail: a.tail }];
      pairs.forEach(function (p) {
        var m = fromWeight(d.tot, p.w);
        totals.push(m);
        rows.push(p.cells.join('') + metricCells(m) + (withTail && p.tail ? p.tail.join('') : ''));
      });
    });

    if (withTail) { cols += ' 128px 96px'; heads = heads.concat(['Status', '']); }

    var note = sec
      ? DIM_LABEL[f.groupBy] + ' × ' + DIM_LABEL[f.groupBy2] + ' — every combination in the selected period.'
      : (f.groupBy === 'zones'
          ? (d.scoped ? 'Turn a placement off right here — inside a campaign report it affects this campaign only.'
                      : 'Placement IDs are ours. Turning one off here applies to every campaign.')
          : 'Grouped by ' + DIM_LABEL[f.groupBy].toLowerCase() + ' over the selected period.');

    return {
      cols: cols, minw: UI.gridMin(cols), heads: heads,
      align: heads.map(function (h, i) { return i >= lead && i < lead + M_HEADS.length ? 'r' : ''; }),
      tail: withTail ? 2 : 0,
      rows: rows, totals: totals,
      totalLabel: rows.length + ' ' + UI.plural(rows.length, 'row', 'rows'),
      note: note,
      foot: ['Showing ' + rows.length + ' ' + UI.plural(rows.length, 'row', 'rows') +
             ' grouped by ' + DIM_LABEL[f.groupBy].toLowerCase() + (sec ? ' and ' + DIM_LABEL[f.groupBy2].toLowerCase() : ''),
             'Updated an hour ago']
    };
  }

  w.Screens = w.Screens || {};
  w.Screens.stats = {
    render: function () {
      var s = Store.get(), d = model(), t = table(d);
      var tm = UI.metrics(d.tot);

      var form = s.ui.statsForm;
      var dirty = JSON.stringify(form) !== JSON.stringify(s.ui.statsApplied);

      var presets = PRESETS.map(function (x) {
        var on = !form.from && !form.to && form.preset === x.k;
        return '<div class="seg' + (on ? ' on' : '') + '" data-act="preset" data-arg="' + x.k + '">' +
          x.label + '</div>';
      }).join('');

      /* Один и тот же вид у всех фильтров: подпись плюс выпадающий список. */
      function field(label, name, options, wide) {
        return '<div class="filt' + (wide ? ' wide' : '') + '"><label class="lab">' + label + '</label>' +
          UI.selectKV(name, options, form[name] || '') + '</div>';
      }
      function anyOpts(list, allLabel) {
        return [{ id: '', label: allLabel }].concat(list);
      }

      var campaignOpts = anyOpts(s.campaigns.map(function (c) {
        return { id: c.id, label: 'NN-C-' + c.id + ' · ' + c.name };
      }), 'All campaigns');
      var countryOpts = anyOpts(DATA.GEO.map(function (g) { return { id: g.code, label: g.name }; }), 'All countries');
      var zoneOpts = anyOpts(DATA.ZONES.slice(0, 36).map(function (z) {
        return { id: z.id, label: z.id + ' · ' + z.cat };
      }), 'All placements');
      var shareOpts = function (key, allLabel) {
        return anyOpts((DATA.SHARES[key] || []).map(function (x) { return { id: x.id, label: x.label }; }), allLabel);
      };
      var dimOpts = DIMS.map(function (x) { return { id: x.k, label: x.label }; });

      /* Фильтры, вынесенные в чипы: только то, что реально выбрано. */
      var CHIP_LABEL = {
        campaign: 'Campaign', country: 'Country', city: 'City', platform: 'Platform', os: 'OS',
        format: 'Format', model: 'Model', browser: 'Browser', connection: 'Connection',
        zone: 'Placement', isp: 'ISP', cpaTest: 'CPA test'
      };
      var OPTS = {
        campaign: campaignOpts, country: countryOpts, zone: zoneOpts,
        city: shareOpts('city', ''), platform: shareOpts('platform', ''), os: shareOpts('os', ''),
        browser: shareOpts('browser', ''), connection: shareOpts('connection', ''),
        isp: shareOpts('isp', ''), cpaTest: shareOpts('cpaTest', ''),
        format: anyOpts(DATA.FORMATS.map(function (x) { return { id: x, label: x }; }), ''),
        model: anyOpts(DATA.PAY_MODELS.map(function (m) { return { id: m.name, label: m.name }; }), '')
      };
      var activeKeys = Object.keys(CHIP_LABEL).filter(function (k) { return form[k]; });
      var chips = activeKeys.map(function (k) {
        var opt = (OPTS[k] || []).find(function (o) { return String(o.id) === String(form[k]); });
        return '<span class="fchip">' + CHIP_LABEL[k] + ': <b>' + esc(opt ? opt.label : form[k]) + '</b>' +
          '<span class="x" data-act="dropFilter" data-arg="' + k + '">' + icon('close', 11, 2.4) + '</span></span>';
      }).join('');

      var more = s.ui.statsMore;
      var filters =
        '<div class="card repbar"><div class="repbar-main">' +
          '<div class="segs">' + presets + '</div>' +
          '<div class="rb-dates">' +
            '<input class="inp" type="date" value="' + esc(form.from || d.period.from) + '" data-inp="from" title="From">' +
            '<span class="rb-dash">—</span>' +
            '<input class="inp" type="date" value="' + esc(form.to || d.period.to) + '" data-inp="to" title="To">' +
          '</div>' +
          '<div class="rb-group">' +
            '<span class="rb-lab">Group by</span>' +
            UI.selectKV('groupBy', dimOpts, form.groupBy) +
            '<span class="rb-lab">then</span>' +
            UI.selectKV('groupBy2', anyOpts(dimOpts, 'nothing'), form.groupBy2) +
          '</div>' +
          '<div class="rb-acts">' +
            '<button class="btn' + (more ? ' on' : '') + '" data-act="toggleMore">' +
              icon('gear', 14, 1.9) + 'Filters' + (activeKeys.length ? ' · ' + activeKeys.length : '') + '</button>' +
            '<button class="btn" data-act="csv">' + icon('download', 14, 1.9) + 'CSV</button>' +
            '<button class="btn btn-pri" data-act="applyFilters">' +
              (dirty ? 'Get statistics' : 'Refresh') + '</button>' +
          '</div>' +
        '</div>' +
        (chips || form.delta
          ? '<div class="repbar-chips">' + chips +
            (form.delta ? '<span class="fchip">Delta: <b>' + esc(form.delta) + 'd</b>' +
              '<span class="x" data-act="dropFilter" data-arg="delta">' + icon('close', 11, 2.4) + '</span></span>' : '') +
            '<button class="btn btn-xs" data-act="resetFilters">Clear all</button></div>'
          : '') +
        (more
          ? '<div class="repbar-more">' +
              '<div class="filt-grid">' +
                field('Campaigns', 'campaign', campaignOpts) +
                field('Countries', 'country', countryOpts) +
                field('Cities', 'city', shareOpts('city', 'All cities')) +
                field('Placements', 'zone', zoneOpts) +
                field('Platform', 'platform', shareOpts('platform', 'All platforms')) +
                field('OS', 'os', shareOpts('os', 'All systems')) +
                field('Browser', 'browser', shareOpts('browser', 'All browsers')) +
                field('Connection', 'connection', shareOpts('connection', 'Any connection')) +
                field('Format', 'format', anyOpts(DATA.FORMATS.map(function (x) { return { id: x, label: x }; }), 'All formats')) +
                field('Business model', 'model', anyOpts(DATA.PAY_MODELS.map(function (m) { return { id: m.name, label: m.name }; }), 'All models')) +
                field('ISP', 'isp', shareOpts('isp', 'All networks')) +
                field('CPA test', 'cpaTest', shareOpts('cpaTest', 'All campaigns')) +
                '<div class="filt"><label class="lab">Delta</label>' +
                  '<input class="inp" type="text" placeholder="days back" value="' + esc(form.delta) + '" data-inp="delta"></div>' +
              '</div>' +
              '<div class="hint">Timezone UTC · ' + esc(d.period.from) + ' — ' + esc(d.period.to) +
                ' (' + d.n + ' ' + UI.plural(d.n, 'day', 'days') + ')' +
                ' · Delta compares the same span that many days earlier.</div>' +
            '</div>'
          : '') +
        '</div>';

      /* Приписка «+12.4% vs 7d earlier» — только когда задан Delta. */
      function chg(cur, was, invert) {
        if (!d.prev || !was) return '';
        var pct = (cur - was) / was * 100;
        var good = invert ? pct < 0 : pct > 0;
        return '<span style="color:' + (Math.abs(pct) < 0.05 ? UI.color('--text-3')
          : UI.color(good ? '--pos' : '--neg')) + '"> ' +
          (pct >= 0 ? '+' : '') + pct.toFixed(1) + '% vs ' + d.prev.days + 'd earlier</span>';
      }

      var stat = function (k, v, sub, color) {
        return '<div class="stat"><span class="k">' + k + '</span>' +
          '<span class="v"' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</span>' +
          '<span class="d">' + sub + '</span></div>';
      };

      var profitSeries = d.cost.map(function (c, i) { return d.revenue[i] - c; });
      var period = 'last ' + d.n + ' days';

      var sums = UI.sum(t.totals);
      var sm = UI.metrics({ impr: sums.impr, clicks: sums.clicks, conv: sums.conv, cost: sums.cost,
                            revenue: sums.revenue, winRate: sums.cost ? sums.wSum / sums.cost : 0 });

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Statistics</h1>' +
          '<p class="sub">' + (d.scoped
            ? 'Scoped to one campaign — placements and countries are shown for its share of the account.'
            : 'Every source rolled into one report. Placements appear under our own numbering.') + '</p></div>' +
        '</div>' +

        filters +

        '<div class="stats s6">' +
          stat('Spend', tm.cost, period + chg(d.prev ? d.prev.curCost : 0, d.prev ? d.prev.cost : 0, true)) +
          stat('Revenue', tm.revenue, 'reported via postback' + chg(d.prev ? d.prev.curRevenue : 0, d.prev ? d.prev.revenue : 0)) +
          stat('Profit', tm.profit, 'revenue minus spend', tm.profitColor) +
          stat('ROI', tm.roi, 'return on ad spend', tm.roiColor) +
          stat('Conversions', tm.conv, 'CR ' + tm.cr + chg(d.prev ? d.prev.curConv : 0, d.prev ? d.prev.conv : 0)) +
          stat('Avg CPA', tm.cpa, 'target $11.50') +
        '</div>' +

        '<div class="charts">' +
          chartCard('Cost by day', period + ', dollars', tm.cost, 'A',
            lineChart(d.cost, 'svgA', 'Cost by day', '' + UI.color('--accent') + '', function (v) { return v === 0 ? '0' : '$' + UI.compact(v); })) +
          chartCard('Conversions by day', period + ', confirmed actions', tm.conv, 'B',
            barChart(d.conv, 'svgB', 'Conversions by day', '' + UI.color('--info') + '', function (v) { return UI.int(v); })) +
          chartCard('Profit by day', period + ', revenue minus cost', tm.profit, 'C',
            divChart(profitSeries, 'svgC', 'Profit by day')) +
          chartCard('Win rate by day', period + ', share of auctions won', tm.win, 'D',
            lineChart(d.win, 'svgD', 'Win rate by day', '' + UI.color('--info') + '', function (v) { return v.toFixed(0) + '%'; })) +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<span class="sub" style="margin:0">' + t.note + '</span>' +
        '</div>' +

        '<div class="table' + (t.tail === 2 ? ' pin-end' : '') + '"><div class="table-scroll">' +
          '<div class="tr thead" style="grid-template-columns:' + t.cols + ';' + t.minw + '">' +
            t.heads.map(function (h, i) { return '<div class="th ' + t.align[i] + '">' + h + '</div>'; }).join('') +
          '</div>' +
          '<div class="tr totals" style="grid-template-columns:' + t.cols + ';' + t.minw + '">' +
            dimCells(t.heads.length - M_HEADS.length - (t.tail || 0), t.totalLabel) +
            '<div class="cell r">' + sm.impr + '</div><div class="cell r">' + sm.clicks + '</div>' +
            '<div class="cell r">' + sm.ctr + '</div><div class="cell r">' + sm.conv + '</div>' +
            '<div class="cell r">' + sm.cr + '</div><div class="cell r">' + sm.cost + '</div>' +
            '<div class="cell r">' + sm.revenue + '</div>' +
            '<div class="cell r" style="color:' + sm.profitColor + '">' + sm.profit + '</div>' +
            '<div class="cell r" style="color:' + sm.roiColor + '">' + sm.roi + '</div>' +
            '<div class="cell r">' + sm.cpa + '</div><div class="cell r">' + sm.cpm + '</div>' +
            '<div class="cell r">' + sm.cpc + '</div><div class="cell r">' + sm.win + '</div>' +
            tailCells(t.tail || 0) +
          '</div>' +
          t.rows.map(function (r) { return '<div class="tr row" style="grid-template-columns:' + t.cols + ';' + t.minw + '">' + r + '</div>'; }).join('') +
        '</div>' +
        '<div class="foot"><span>' + t.foot[0] + '</span><span style="margin-left:auto">' + t.foot[1] + '</span></div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view) {
      var d = model();
      var profitSeries = d.cost.map(function (c, i) { return d.revenue[i] - c; });

      wireLine(view, 'A', d.cost, d.n, UI.money);
      wireBars(view, 'B', d.conv, d.n, function (v) { return UI.int(v) + ' ' + UI.plural(v, 'conversion', 'conversions'); });
      wireBars(view, 'C', profitSeries, d.n, UI.money, true);
      wireLine(view, 'D', d.win, d.n, function (v) { return v.toFixed(1) + '%'; });
    },

    actions: {
      /* Пресет периода очищает произвольные даты, иначе они бы его перебивали. */
      preset: function (v) {
        Store.set(function (s) {
          s.ui.statsForm.preset = v;
          s.ui.statsForm.from = '';
          s.ui.statsForm.to = '';
        });
      },
      /* Фильтры применяются кнопкой, а не на каждый чих: так же ведёт себя сервер. */
      applyFilters: function () {
        Store.set(function (s) {
          s.ui.statsApplied = JSON.parse(JSON.stringify(s.ui.statsForm));
        });
        var f = Store.get().ui.statsApplied;
        Api.reports.query({ dimension: f.groupBy, groupBy2: f.groupBy2, campaignId: f.campaign,
                            from: f.from, to: f.to, preset: f.preset, delta: f.delta,
                            country: f.country, city: f.city, platform: f.platform, os: f.os,
                            format: f.format, model: f.model, browser: f.browser,
                            connection: f.connection, zone: f.zone, isp: f.isp, cpaTest: f.cpaTest });
      },
      toggleMore: function () { Store.ui('statsMore', !Store.get().ui.statsMore); },
      dropFilter: function (name) {
        Store.set(function (s) {
          s.ui.statsForm[name] = '';
          s.ui.statsApplied[name] = '';
        });
      },
      resetFilters: function () {
        Store.set(function (s) {
          s.ui.statsForm = Store.seedStatsFilters();
          s.ui.statsApplied = Store.seedStatsFilters();
        });
        App.toast('Filters reset');
      },
      csv: function () { App.toast('Export is not generated in this prototype'); },
      clearScope: function () {
        Store.set(function (s) { s.ui.statsForm.campaign = ''; s.ui.statsApplied.campaign = ''; });
      },
      toggleZone: function (id) {
        var cid = Store.get().ui.statsApplied.campaign || null;
        Api.placements.toggle(id, { campaignId: cid }).then(function (r) {
          var camp = cid ? scopedCampaign() : null;
          App.toast(id + (r.on ? ' turned on' : ' turned off') +
            (camp ? ' for \u201c' + camp.name + '\u201d' : ' across all campaigns'));
        });
      }
    },

    /* Все поля панели пишут в один и тот же черновик. */
    inputs: (function () {
      var out = {};
      ['from', 'to', 'delta', 'groupBy', 'groupBy2', 'campaign', 'country', 'city', 'platform',
       'os', 'format', 'model', 'browser', 'connection', 'zone', 'isp', 'cpaTest'
      ].forEach(function (name) {
        out[name] = function (v, arg, type) {
          var write = function (s) { s.ui.statsForm[name] = v; };
          /* Текстовые поля не перерисовываем на каждый символ. */
          if (type === 'input') Store.patch(write); else Store.set(write);
        };
      });
      return out;
    })()
  };

  /* ── ховер ── */
  function place(tip, cx, cy, rect, date, value) {
    tip.style.opacity = '1';
    tip.style.left = (cx / G.W * 100).toFixed(2) + '%';
    tip.style.top = (cy / G.H * rect.height - 12).toFixed(0) + 'px';
    tip.firstChild.textContent = date;
    tip.lastChild.textContent = value;
  }

  function wireLine(view, id, series, n, fmt) {
    var plot = view.querySelector('#' + id);
    if (!plot) return;
    var svg = plot.querySelector('svg');
    var tip = plot.querySelector('#tip' + id);
    var cross = svg.querySelector('.cross'), mark = svg.querySelector('.mark');
    var t = UI.ticks(Math.max.apply(null, series));
    var px = function (i) { return G.L + (n === 1 ? (G.R - G.L) / 2 : (i / (n - 1)) * (G.R - G.L)); };
    var py = function (v) { return G.B - (v / t.top) * (G.B - G.T); };

    plot.addEventListener('mousemove', function (ev) {
      var rect = svg.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width * G.W;
      var i = Math.round((x - G.L) / ((G.R - G.L) / Math.max(1, n - 1)));
      i = Math.max(0, Math.min(n - 1, i));
      var cx = px(i), cy = py(series[i]);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', '1');
      mark.setAttribute('cx', cx); mark.setAttribute('cy', cy); mark.setAttribute('opacity', '1');
      place(tip, cx, cy, rect, UI.dayLabel(n - 1 - i), fmt(series[i]));
    });
    plot.addEventListener('mouseleave', function () {
      cross.setAttribute('opacity', '0'); mark.setAttribute('opacity', '0'); tip.style.opacity = '0';
    });
  }

  function wireBars(view, id, series, n, fmt, diverging) {
    var plot = view.querySelector('#' + id);
    if (!plot) return;
    var svg = plot.querySelector('svg');
    var tip = plot.querySelector('#tip' + id);
    var bars = svg.querySelectorAll('rect[data-i]');
    var band = (G.R - G.L) / n;
    var base = [];
    bars.forEach(function (b) { base.push(b.getAttribute('fill')); });

    plot.addEventListener('mousemove', function (ev) {
      var rect = svg.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width * G.W;
      var i = Math.max(0, Math.min(n - 1, Math.floor((x - G.L) / band)));
      bars.forEach(function (b, j) {
        b.setAttribute('fill', j === i ? (diverging ? (series[j] >= 0 ? '' + UI.color('--pos') + '' : '' + UI.color('--neg') + '') : '' + UI.color('--info') + '') : base[j]);
      });
      var b = bars[i];
      var cy = diverging
        ? (series[i] >= 0 ? Number(b.getAttribute('y')) : Number(b.getAttribute('y')) + Number(b.getAttribute('height')))
        : Number(b.getAttribute('y'));
      place(tip, G.L + i * band + band / 2, cy, rect, UI.dayLabel(n - 1 - i), fmt(series[i]));
    });
    plot.addEventListener('mouseleave', function () {
      bars.forEach(function (b, j) { b.setAttribute('fill', base[j]); });
      tip.style.opacity = '0';
    });
  }
})(window);
