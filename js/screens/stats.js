/* Статистика: расход и конверсии по дням + отчёты по разрезам. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var RANGES = [7, 14, 30, 90];
  var TABS = [
    { k: 'zones',     label: 'По площадкам' },
    { k: 'campaigns', label: 'По кампаниям' },
    { k: 'geo',       label: 'По гео' },
    { k: 'days',      label: 'По дням' }
  ];
  var GEOM = { L: 46, R: 524, T: 14, B: 152, W: 532, H: 184 };

  function scaled() {
    var s = Store.get(), n = s.ui.statsRange, k = n / 30, b = DATA.TOTALS_30D;
    return {
      n: n, k: k,
      spend: Math.round(b.spend * k),
      conv: Math.round(b.conv * k),
      impr: b.impr * k,
      clicks: b.clicks * k,
      spendSeries: UI.daily(n, 20260907, Math.round(b.spend * k)),
      convSeries: UI.daily(n, 815, Math.round(b.conv * k))
    };
  }

  function lineChart(series, id) {
    var g = GEOM, n = series.length;
    var t = UI.ticks(Math.max.apply(null, series));
    var px = function (i) { return g.L + (n === 1 ? (g.R - g.L) / 2 : (i / (n - 1)) * (g.R - g.L)); };
    var py = function (v) { return g.B - (v / t.top) * (g.B - g.T); };

    var grid = t.values.map(function (v) {
      var y = py(v);
      return '<line x1="' + g.L + '" y1="' + y.toFixed(1) + '" x2="' + g.R + '" y2="' + y.toFixed(1) + '" stroke="#22262E" stroke-width="1"/>' +
        '<text x="' + (g.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' +
        (v === 0 ? '0' : '$' + UI.compact(v)) + '</text>';
    }).join('');

    var line = series.map(function (v, i) { return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' ');
    var area = 'M ' + px(0).toFixed(1) + ' ' + g.B + ' L ' +
      series.map(function (v, i) { return px(i).toFixed(1) + ' ' + py(v).toFixed(1); }).join(' L ') +
      ' L ' + px(n - 1).toFixed(1) + ' ' + g.B + ' Z';

    var xt = xTicks(n, px);

    return '<svg id="' + id + '" width="100%" height="184" viewBox="0 0 532 184" fill="none" font-family="Archivo, sans-serif" aria-label="Расход по дням">' +
      grid +
      '<path d="' + area + '" fill="#8368F7" fill-opacity="0.10"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#8368F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<line class="cross" x1="0" y1="14" x2="0" y2="152" stroke="#2E323B" stroke-width="1" opacity="0"/>' +
      '<circle class="mark" cx="0" cy="0" r="4.5" fill="#8368F7" stroke="#13161C" stroke-width="2" opacity="0"/>' +
      xt + '</svg>';
  }

  function barChart(series, id) {
    var g = GEOM, n = series.length;
    var t = UI.ticks(Math.max.apply(null, series));
    var band = (g.R - g.L) / n;
    var bw = Math.min(24, Math.max(2, band - 2));
    var by = function (v) { return g.B - (v / t.top) * (g.B - g.T); };

    var grid = t.values.map(function (v) {
      var y = by(v);
      return '<line x1="' + g.L + '" y1="' + y.toFixed(1) + '" x2="' + g.R + '" y2="' + y.toFixed(1) + '" stroke="#22262E" stroke-width="1"/>' +
        '<text x="' + (g.L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' + UI.int(v) + '</text>';
    }).join('');

    var bars = series.map(function (v, i) {
      var h = Math.max(2, (v / t.top) * (g.B - g.T));
      return '<rect data-i="' + i + '" x="' + (g.L + i * band + (band - bw) / 2).toFixed(1) + '" y="' + (g.B - h).toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="#009FAE"/>';
    }).join('');

    var xt = xTicks(n, function (i) { return g.L + i * band + band / 2; });

    return '<svg id="' + id + '" width="100%" height="184" viewBox="0 0 532 184" fill="none" font-family="Archivo, sans-serif" aria-label="Конверсии по дням">' +
      grid + bars + xt + '</svg>';
  }

  function xTicks(n, fx) {
    var step = Math.max(1, Math.round(n / 5)), idx = [], i;
    for (i = 0; i < n; i += step) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    return idx.map(function (j) {
      return '<text x="' + fx(j).toFixed(1) + '" y="172" fill="#6A7180" font-size="10" text-anchor="middle">' +
        UI.dayLabel(n - 1 - j) + '</text>';
    }).join('');
  }

  function table(d) {
    var s = Store.get(), k = d.k;
    var cell = function (v, cl) { return '<div class="cell ' + (cl || '') + '">' + v + '</div>'; };

    if (s.ui.statsTab === 'zones') {
      return {
        cols: '110px 104px 80px 76px 60px 82px 60px 84px 72px',
        heads: ['ID площадки', 'Категория', 'Показы', 'Клики', 'CTR', 'Конверсии', 'CR', 'Расход', 'CPA'],
        align: ['', '', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
        rows: DATA.ZONES.map(function (z) {
          var impr = z.impr * k, clicks = z.clicks * k, conv = z.conv * k, spend = z.spend * k;
          return '<div class="cell mono w">' + z.id + '</div>' +
            '<div class="cell"><span class="dot" style="background:' + (z.cat === '18+' ? '#DA69B9' : '#009FAE') + '"></span>' + z.cat + '</div>' +
            cell(UI.compact(impr), 'r muted') + cell(UI.int(clicks), 'r muted') + cell(UI.pct(clicks, impr), 'r muted') +
            cell(UI.int(conv), 'r w') + cell(UI.pct(conv, clicks), 'r muted') +
            cell(UI.money(spend), 'r w') + cell(UI.cpa(spend, conv), 'r muted');
        }),
        note: 'Номера площадок — внутренние: по ним же идут блокировка и масштабирование.',
        foot: ['Показано 10 из 1 482 площадок', 'Робот отключил 214 площадок за период']
      };
    }
    if (s.ui.statsTab === 'campaigns') {
      return {
        cols: 'minmax(0,1fr) 110px 96px 92px 66px 96px 66px 100px 84px',
        heads: ['Кампания', 'Модель', 'Показы', 'Клики', 'CTR', 'Конверсии', 'CR', 'Расход', 'CPA'],
        align: ['', '', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
        rows: DATA.STAT_CAMPAIGNS.map(function (c) {
          var impr = c.impr * k, clicks = c.clicks * k, conv = c.conv * k, spend = c.spend * k;
          return '<div class="cell w">' + esc(c.name) + '</div>' + cell(c.model) +
            cell(UI.compact(impr), 'r muted') + cell(UI.int(clicks), 'r muted') + cell(UI.pct(clicks, impr), 'r muted') +
            cell(UI.int(conv), 'r w') + cell(UI.pct(conv, clicks), 'r muted') +
            cell(UI.money(spend), 'r w') + cell(UI.cpa(spend, conv), 'r muted');
        }),
        note: 'Сводно по всем источникам — рекламодателю виден один отчёт.',
        foot: ['Показано 8 из ' + s.campaigns.length + ' кампаний', 'Обновлено час назад']
      };
    }
    if (s.ui.statsTab === 'geo') {
      return {
        cols: 'minmax(0,1fr) 80px 96px 92px 66px 96px 66px 100px 84px',
        heads: ['Страна', 'Код', 'Показы', 'Клики', 'CTR', 'Конверсии', 'CR', 'Расход', 'CPA'],
        align: ['', '', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
        rows: DATA.GEO.map(function (g) {
          var impr = g.impr * k, clicks = g.clicks * k, conv = g.conv * k, spend = g.spend * k;
          return '<div class="cell w">' + g.name + '</div><div class="cell mono muted">' + g.code + '</div>' +
            cell(UI.compact(impr), 'r muted') + cell(UI.int(clicks), 'r muted') + cell(UI.pct(clicks, impr), 'r muted') +
            cell(UI.int(conv), 'r w') + cell(UI.pct(conv, clicks), 'r muted') +
            cell(UI.money(spend), 'r w') + cell(UI.cpa(spend, conv), 'r muted');
        }),
        note: 'Гео задаётся один раз в кампании и транслируется во все источники.',
        foot: ['Показано 7 из 34 стран', 'Обновлено час назад']
      };
    }

    var shown = Math.min(10, d.n);
    var ipS = DATA.TOTALS_30D.impr / DATA.TOTALS_30D.spend;
    var clS = DATA.TOTALS_30D.clicks / DATA.TOTALS_30D.spend;
    var rows = [];
    for (var j = 0; j < shown; j++) {
      var i = d.n - 1 - j, sp = d.spendSeries[i], cv = d.convSeries[i];
      var impr = sp * ipS, clicks = sp * clS;
      rows.push('<div class="cell w">' + UI.dayLabel(j) + '</div>' +
        cell(UI.compact(impr), 'r muted') + cell(UI.int(clicks), 'r muted') + cell(UI.pct(clicks, impr), 'r muted') +
        cell(UI.int(cv), 'r w') + cell(UI.pct(cv, clicks), 'r muted') +
        cell(UI.money(sp), 'r w') + cell(UI.cpa(sp, cv), 'r muted'));
    }
    return {
      cols: 'minmax(0,1fr) 110px 100px 72px 104px 72px 108px 90px',
      heads: ['Дата', 'Показы', 'Клики', 'CTR', 'Конверсии', 'CR', 'Расход', 'CPA'],
      align: ['', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
      rows: rows,
      note: 'Последние дни выбранного периода.',
      foot: ['Показано ' + shown + ' из ' + d.n + ' ' + UI.plural(d.n, 'дня', 'дней', 'дней'), 'Обновлено час назад']
    };
  }

  w.Screens = w.Screens || {};
  w.Screens.stats = {
    render: function () {
      var s = Store.get(), d = scaled(), t = table(d);

      var ranges = RANGES.map(function (r) {
        return '<div class="seg' + (s.ui.statsRange === r ? ' on' : '') + '" data-act="range" data-arg="' + r + '">' +
          r + ' ' + UI.plural(r, 'день', 'дня', 'дней') + '</div>';
      }).join('');

      var tabs = TABS.map(function (x) {
        return '<div class="seg' + (s.ui.statsTab === x.k ? ' on' : '') + '" data-act="tab" data-arg="' + x.k + '">' + x.label + '</div>';
      }).join('');

      var kpi = function (lab, val, delta, dir) {
        return '<div class="kpi"><div class="kpi-lab">' + lab + '</div><div class="kpi-val num">' + val + '</div>' +
          '<div class="delta" style="color:#0ca30c">' + icon(dir, 11, 3) + ' ' + delta + '</div></div>';
      };

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Статистика</h1>' +
          '<p class="sub">Все источники сведены в один отчёт. Площадки — под номерами сети.</p></div>' +
          '<div style="margin-left:auto;display:flex;align-items:center;gap:10px">' +
            '<div class="segs">' + ranges + '</div>' +
            '<button class="btn" data-act="csv">' + icon('download', 14, 1.9) + 'Выгрузить CSV</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpis k5">' +
          kpi('Расход', UI.money(d.spend), '9.4% <small>к прошлому периоду</small>', 'up') +
          kpi('Показы', UI.compact(d.impr), '4.8% <small>к прошлому периоду</small>', 'up') +
          kpi('Клики', UI.compact(d.clicks), '7.1% <small>к прошлому периоду</small>', 'up') +
          kpi('Конверсии', UI.int(d.conv), '15.2% <small>к прошлому периоду</small>', 'up') +
          kpi('Средний CPA', UI.cpa(d.spend, d.conv), '5.6% <small>дешевле</small>', 'dn') +
        '</div>' +

        '<div class="charts">' +
          '<div class="chart"><div class="chart-h"><div>' +
            '<div class="chart-t">Расход по дням</div>' +
            '<div class="chart-s">последние ' + d.n + ' ' + UI.plural(d.n, 'день', 'дня', 'дней') + ', доллары</div></div>' +
            '<div class="chart-tot">' + UI.money(d.spend) + '</div></div>' +
            '<div class="plot" id="plotA">' + lineChart(d.spendSeries, 'svgA') +
              '<div class="tip" id="tipA"><div class="tip-d"></div><div class="tip-v"></div></div></div>' +
          '</div>' +
          '<div class="chart"><div class="chart-h"><div>' +
            '<div class="chart-t">Конверсии по дням</div>' +
            '<div class="chart-s">последние ' + d.n + ' ' + UI.plural(d.n, 'день', 'дня', 'дней') + ', подтверждённые действия</div></div>' +
            '<div class="chart-tot">' + UI.int(d.conv) + '</div></div>' +
            '<div class="plot" id="plotB">' + barChart(d.convSeries, 'svgB') +
              '<div class="tip" id="tipB"><div class="tip-d"></div><div class="tip-v"></div></div></div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<span class="sub" style="margin:0 0 0 4px">' + t.note + '</span>' +
        '</div>' +

        '<div class="table">' +
          '<div class="tr thead" style="grid-template-columns:' + t.cols + '">' +
            t.heads.map(function (h, i) { return '<div class="th ' + t.align[i] + '">' + h + '</div>'; }).join('') +
          '</div>' +
          t.rows.map(function (r) { return '<div class="tr row" style="grid-template-columns:' + t.cols + '">' + r + '</div>'; }).join('') +
          '<div class="foot"><span>' + t.foot[0] + '</span><span style="margin-left:auto">' + t.foot[1] + '</span></div>' +
        '</div>' +
      '</div>';
    },

    mount: function (view) {
      var d = scaled(), g = GEOM;

      /* линия: перекрестие и подсказка */
      var plotA = view.querySelector('#plotA');
      if (plotA) {
        var svgA = plotA.querySelector('#svgA');
        var tipA = plotA.querySelector('#tipA');
        var cross = svgA.querySelector('.cross');
        var mark = svgA.querySelector('.mark');
        var n = d.n;
        var t = UI.ticks(Math.max.apply(null, d.spendSeries));
        var px = function (i) { return g.L + (n === 1 ? (g.R - g.L) / 2 : (i / (n - 1)) * (g.R - g.L)); };
        var py = function (v) { return g.B - (v / t.top) * (g.B - g.T); };

        plotA.addEventListener('mousemove', function (ev) {
          var rect = svgA.getBoundingClientRect();
          var x = (ev.clientX - rect.left) / rect.width * g.W;
          var i = Math.round((x - g.L) / ((g.R - g.L) / Math.max(1, n - 1)));
          if (i < 0) i = 0;
          if (i > n - 1) i = n - 1;
          var cx = px(i), cy = py(d.spendSeries[i]);
          cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', '1');
          mark.setAttribute('cx', cx); mark.setAttribute('cy', cy); mark.setAttribute('opacity', '1');
          tipA.style.opacity = '1';
          tipA.style.left = (cx / g.W * 100).toFixed(2) + '%';
          tipA.style.top = (cy / g.H * rect.height - 12).toFixed(0) + 'px';
          tipA.firstChild.textContent = UI.dayLabel(n - 1 - i);
          tipA.lastChild.textContent = UI.money(d.spendSeries[i]);
        });
        plotA.addEventListener('mouseleave', function () {
          cross.setAttribute('opacity', '0');
          mark.setAttribute('opacity', '0');
          tipA.style.opacity = '0';
        });
      }

      /* столбцы: подсветка и подсказка */
      var plotB = view.querySelector('#plotB');
      if (plotB) {
        var svgB = plotB.querySelector('#svgB');
        var tipB = plotB.querySelector('#tipB');
        var bars = svgB.querySelectorAll('rect[data-i]');
        var nb = d.n;
        var tb = UI.ticks(Math.max.apply(null, d.convSeries));
        var band = (g.R - g.L) / nb;

        plotB.addEventListener('mousemove', function (ev) {
          var rect = svgB.getBoundingClientRect();
          var x = (ev.clientX - rect.left) / rect.width * g.W;
          var i = Math.floor((x - g.L) / band);
          if (i < 0) i = 0;
          if (i > nb - 1) i = nb - 1;
          bars.forEach(function (b, j) { b.setAttribute('fill', j === i ? '#00C2D4' : '#009FAE'); });
          var cx = g.L + i * band + band / 2;
          var cy = g.B - (d.convSeries[i] / tb.top) * (g.B - g.T);
          tipB.style.opacity = '1';
          tipB.style.left = (cx / g.W * 100).toFixed(2) + '%';
          tipB.style.top = (cy / g.H * rect.height - 12).toFixed(0) + 'px';
          tipB.firstChild.textContent = UI.dayLabel(nb - 1 - i);
          tipB.lastChild.textContent = UI.int(d.convSeries[i]) + ' ' +
            UI.plural(d.convSeries[i], 'конверсия', 'конверсии', 'конверсий');
        });
        plotB.addEventListener('mouseleave', function () {
          bars.forEach(function (b) { b.setAttribute('fill', '#009FAE'); });
          tipB.style.opacity = '0';
        });
      }
    },

    actions: {
      range: function (v) { Store.ui('statsRange', Number(v)); },
      tab: function (v) { Store.ui('statsTab', v); },
      csv: function () { App.toast('В прототипе выгрузка не формируется'); }
    }
  };
})(window);
