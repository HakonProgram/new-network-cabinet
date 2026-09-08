/* Statistics: daily charts plus a full metric report across four breakdowns. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var RANGES = [7, 14, 30, 90];
  var TABS = [
    { k: 'zones',     label: 'By placement' },
    { k: 'campaigns', label: 'By campaign' },
    { k: 'geo',       label: 'By country' },
    { k: 'days',      label: 'By day' }
  ];
  var G = { L: 48, R: 524, T: 14, B: 150, W: 532, H: 184 };

  var M_HEADS = ['Impr.', 'Clicks', 'CTR', 'Conv.', 'CR', 'Cost', 'Revenue', 'Profit', 'ROI', 'CPA', 'CPM', 'CPC', 'Win rate'];
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

  function scopedCampaign() {
    var s = Store.get();
    if (!s.ui.statsCampaign) return null;
    return s.campaigns.find(function (c) { return c.id === s.ui.statsCampaign; }) || null;
  }

  function model() {
    var s = Store.get(), n = s.ui.statsRange, k = n / DATA.BASE_DAYS;
    var scoped = scopedCampaign();
    var base = UI.sum(scoped ? [scoped] : s.campaigns);
    var accountCost = UI.sum(s.campaigns).cost;
    /* Разрезы по площадкам и гео сужаются пропорционально доле кампании в расходе. */
    var share = scoped ? (accountCost ? base.cost / accountCost : 0) : 1;
    var tot = {
      impr: base.impr * k, clicks: base.clicks * k, conv: base.conv * k,
      cost: base.cost * k, revenue: base.revenue * k,
      winRate: base.cost ? base.wSum / base.cost : 0
    };
    return {
      n: n, k: k, tot: tot, scoped: scoped, share: share,
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
      return '<line x1="' + G.L + '" y1="' + y.toFixed(1) + '" x2="' + G.R + '" y2="' + y.toFixed(1) + '" stroke="#22262E" stroke-width="1"/>' +
        '<text x="' + (G.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' + fmt(v) + '</text>';
    }).join('');
  }

  function xTicks(n, fx) {
    var step = Math.max(1, Math.round(n / 5)), idx = [], i;
    for (i = 0; i < n; i += step) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    return idx.map(function (j) {
      return '<text x="' + fx(j).toFixed(1) + '" y="170" fill="#6A7180" font-size="10" text-anchor="middle">' +
        UI.dayLabel(n - 1 - j) + '</text>';
    }).join('');
  }

  function svgOpen(id, label) {
    return '<svg id="' + id + '" width="100%" height="184" viewBox="0 0 532 184" fill="none" ' +
      'font-family="Archivo, sans-serif" aria-label="' + label + '">';
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
      '<line class="cross" x1="0" y1="14" x2="0" y2="150" stroke="#2E323B" stroke-width="1" opacity="0"/>' +
      '<circle class="mark" cx="0" cy="0" r="4.5" fill="' + color + '" stroke="#13161C" stroke-width="2" opacity="0"/>' +
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
        '" stroke="' + (q === 0 ? '#2E323B' : '#22262E') + '" stroke-width="1"/>' +
        '<text x="' + (G.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' +
        (q === 0 ? '0' : (q > 0 ? '' : '-') + '$' + UI.compact(t.top * Math.abs(q))) + '</text>';
    }).join('');

    var bars = series.map(function (v, i) {
      var h = Math.max(2, Math.abs(v) / t.top * half);
      var y = v >= 0 ? zero - h : zero;
      return '<rect data-i="' + i + '" x="' + (G.L + i * band + (band - bw) / 2).toFixed(1) + '" y="' + y.toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + (v >= 0 ? '#0ca30c' : '#d03b3b') + '"/>';
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

  /* ── таблицы ── */
  function table(d) {
    var s = Store.get(), k = d.k, tab = s.ui.statsTab;

    if (tab === 'zones') {
      var zr = DATA.ZONES.map(function (z) { return scale(z, k * d.share); });
      var cid = d.scoped ? d.scoped.id : null;
      return {
        cols: '104px 96px 110px ' + M_COLS + ' 128px 96px', minw: 'min-width:1660px',
        heads: ['Zone ID', 'Category', 'Vertical'].concat(M_HEADS).concat(['Status', '']),
        align: ['', '', ''].concat(M_HEADS.map(function () { return 'r'; })).concat(['', '']),
        tail: 2,
        rows: DATA.ZONES.map(function (z, i) {
          var st = Store.zoneState(z, cid), on = st === 'live';
          return '<div class="cell mono w">' + z.id + '</div>' +
            '<div class="cell"><span class="dot" style="background:' + (z.cat === 'Adult' ? '#DA69B9' : '#009FAE') + '"></span>' + z.cat + '</div>' +
            '<div class="cell muted">' + z.vertical + '</div>' + metricCells(zr[i]) +
            '<div><span class="' + ZSTATE[st].pill + '">' + ZSTATE[st].label + '</span></div>' +
            '<div class="acts"><button class="btn btn-xs ' + (on ? 'btn-danger' : 'btn-up') +
              '" data-act="toggleZone" data-arg="' + z.id + '">' + (on ? 'Turn off' : 'Turn on') + '</button></div>';
        }),
        totals: zr, totalLabel: DATA.ZONES.length + ' placements shown',
        note: d.scoped
          ? 'Turn a placement off right here — inside a campaign report it affects this campaign only.'
          : 'Placement IDs are ours. Turning one off here applies to every campaign.',
        foot: ['Showing ' + DATA.ZONES.length + ' of 1,482 placements', 'Robot switched off 214 placements this period']
      };
    }

    if (tab === 'campaigns') {
      var list = d.scoped ? [d.scoped] : s.campaigns;
      var cr = list.map(function (c) { return scale(c, k); });
      return {
        cols: 'minmax(200px,1fr) 92px ' + M_COLS, minw: 'min-width:1450px',
        heads: ['Campaign', 'Model'].concat(M_HEADS),
        align: ['', ''].concat(M_HEADS.map(function () { return 'r'; })),
        rows: list.map(function (c, i) {
          return '<div class="cell w">' + esc(c.name) + '</div>' +
            '<div><span class="model">' + esc(c.model) + '</span></div>' + metricCells(cr[i]);
        }),
        totals: cr, totalLabel: list.length + ' ' + UI.plural(list.length, 'campaign', 'campaigns'),
        note: 'All sources rolled into a single report.',
        foot: ['Showing ' + list.length + ' of ' + s.campaigns.length + ' campaigns', 'Updated an hour ago']
      };
    }

    if (tab === 'geo') {
      var gr = DATA.GEO.map(function (g) { return scale(g, k * d.share); });
      return {
        cols: 'minmax(160px,1fr) 70px ' + M_COLS, minw: 'min-width:1380px',
        heads: ['Country', 'Code'].concat(M_HEADS),
        align: ['', ''].concat(M_HEADS.map(function () { return 'r'; })),
        rows: DATA.GEO.map(function (g, i) {
          return '<div class="cell w">' + g.name + '</div><div class="cell mono muted">' + g.code + '</div>' +
            metricCells(gr[i]);
        }),
        totals: gr, totalLabel: DATA.GEO.length + ' countries',
        note: 'Targeting is set once per campaign and mirrored into every source.',
        foot: ['Showing ' + DATA.GEO.length + ' of 34 countries', 'Updated an hour ago']
      };
    }

    var shown = Math.min(14, d.n);
    var imprPer = d.tot.cost ? d.tot.impr / d.tot.cost : 0;
    var clickPer = d.tot.cost ? d.tot.clicks / d.tot.cost : 0;
    var rows = [], totals = [], j;
    for (j = 0; j < shown; j++) {
      var i = d.n - 1 - j;
      var row = {
        impr: d.cost[i] * imprPer, clicks: d.cost[i] * clickPer, conv: d.conv[i],
        cost: d.cost[i], revenue: d.revenue[i], winRate: d.win[i]
      };
      totals.push(row);
      rows.push('<div class="cell w">' + UI.dayLabel(j) + '</div>' + metricCells(row));
    }
    return {
      cols: '120px ' + M_COLS, minw: 'min-width:1310px',
      heads: ['Date'].concat(M_HEADS),
      align: [''].concat(M_HEADS.map(function () { return 'r'; })),
      rows: rows, totals: totals, totalLabel: shown + ' ' + UI.plural(shown, 'day', 'days'),
      note: 'Most recent days of the selected period.',
      foot: ['Showing ' + shown + ' of ' + d.n + ' days', 'Updated an hour ago']
    };
  }

  w.Screens = w.Screens || {};
  w.Screens.stats = {
    render: function () {
      var s = Store.get(), d = model(), t = table(d);
      var tm = UI.metrics(d.tot);

      var ranges = RANGES.map(function (r) {
        return '<div class="seg' + (s.ui.statsRange === r ? ' on' : '') + '" data-act="range" data-arg="' + r + '">' +
          r + ' days</div>';
      }).join('');
      var tabs = TABS.map(function (x) {
        return '<div class="seg' + (s.ui.statsTab === x.k ? ' on' : '') + '" data-act="tab" data-arg="' + x.k + '">' + x.label + '</div>';
      }).join('');

      var kpi = function (lab, val, sub, color) {
        return '<div class="kpi tight"><div class="kpi-lab">' + lab + '</div>' +
          '<div class="kpi-val num"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</div>' +
          '<div class="hint">' + sub + '</div></div>';
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
          (d.scoped ? '<div class="scope" style="margin-left:4px">' + esc(d.scoped.name) +
            '<span class="x" data-act="clearScope" title="Show the whole account">' + icon('close', 12, 2.4) + '</span></div>' : '') +
          '<div style="margin-left:auto;display:flex;align-items:center;gap:10px">' +
            '<div class="segs">' + ranges + '</div>' +
            '<button class="btn" data-act="csv">' + icon('download', 14, 1.9) + 'Export CSV</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpis k6">' +
          kpi('Cost', tm.cost, period) +
          kpi('Revenue', tm.revenue, 'reported via postback') +
          kpi('Profit', tm.profit, 'revenue minus cost', tm.profitColor) +
          kpi('ROI', tm.roi, 'return on ad spend', tm.roiColor) +
          kpi('Conversions', tm.conv, 'CR ' + tm.cr) +
          kpi('Avg CPA', tm.cpa, 'target $11.50') +
        '</div>' +
        '<div class="kpis k6">' +
          kpi('Impressions', tm.impr, period) +
          kpi('Clicks', tm.clicks, 'CTR ' + tm.ctr) +
          kpi('Avg CPM', tm.cpm, 'blended across sources') +
          kpi('Avg CPC', tm.cpc, 'blended across sources') +
          kpi('Win rate', tm.win, 'auctions won') +
          kpi('Placements', '1,482', '214 switched off by the robot') +
        '</div>' +

        '<div class="charts">' +
          chartCard('Cost by day', period + ', dollars', tm.cost, 'A',
            lineChart(d.cost, 'svgA', 'Cost by day', '#8368F7', function (v) { return v === 0 ? '0' : '$' + UI.compact(v); })) +
          chartCard('Conversions by day', period + ', confirmed actions', tm.conv, 'B',
            barChart(d.conv, 'svgB', 'Conversions by day', '#009FAE', function (v) { return UI.int(v); })) +
          chartCard('Profit by day', period + ', revenue minus cost', tm.profit, 'C',
            divChart(profitSeries, 'svgC', 'Profit by day')) +
          chartCard('Win rate by day', period + ', share of auctions won', tm.win, 'D',
            lineChart(d.win, 'svgD', 'Win rate by day', '#A48FFF', function (v) { return v.toFixed(0) + '%'; })) +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<span class="sub" style="margin:0 0 0 4px">' + t.note + '</span>' +
        '</div>' +

        '<div class="table"><div class="table-scroll">' +
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
      range: function (v) { Store.ui('statsRange', Number(v)); },
      tab: function (v) { Store.ui('statsTab', v); },
      csv: function () { App.toast('Export is not generated in this prototype'); },
      clearScope: function () { Store.ui('statsCampaign', ''); },
      toggleZone: function (id) {
        var cid = Store.get().ui.statsCampaign || null;
        Store.toggleZone(id, cid);
        var z = DATA.ZONES.find(function (x) { return x.id === id; });
        var on = Store.zoneIsOn(z, cid);
        var camp = cid ? scopedCampaign() : null;
        App.toast(id + (on ? ' turned on' : ' turned off') +
          (camp ? ' for “' + camp.name + '”' : ' across all campaigns'));
      }
    }
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
        b.setAttribute('fill', j === i ? (diverging ? (series[j] >= 0 ? '#2fe02f' : '#ff6b6b') : '#00C2D4') : base[j]);
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
