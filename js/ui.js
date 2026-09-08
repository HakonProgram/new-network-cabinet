/* Иконки, форматирование и мелкие помощники. */
(function (w) {
  'use strict';

  var PATHS = {
    stats:   '<path d="M3 20h18"/><path d="M6 16v-5"/><path d="M11 16V6"/><path d="M16 16v-8"/><path d="M21 16v-3"/>',
    camp:    '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="11" height="6" rx="2"/>',
    zones:   '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    volume:  '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14.5 2.6A9 9 0 0 1 21.4 9.5h-6.9z"/>',
    pay:     '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 14.5h4"/>',
    post:    '<path d="M10 13.5a4 4 0 0 0 5.7.3l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10.5a4 4 0 0 0-5.7-.3l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    user:    '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    bell:    '<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 19a1.8 1.8 0 0 0 3 0"/>',
    help:    '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.5"/><path d="M12 17h.01"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    menu:    '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    right:   '<path d="m9 6 6 6-6 6"/>',
    left:    '<path d="m15 6-6 6 6 6"/>',
    down:    '<path d="m6 9 6 6 6-6"/>',
    copy:    '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15"/>',
    edit:    '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/>',
    chart:   '<path d="M4 19h16"/><path d="M7 16v-4"/><path d="M12 16V6"/><path d="M17 16v-7"/>',
    check:   '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    download:'<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 19.5h15"/>',
    upload:  '<path d="M12 19V6"/><path d="m7.5 10.5 4.5-4.5 4.5 4.5"/><path d="M4.5 20h15"/>',
    trash:   '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6.5 7l1 12h9l1-12"/>',
    close:   '<path d="M6 6l12 12M18 6L6 18"/>',
    up:      '<path d="M12 19V5M6 11l6-6 6 6"/>',
    dn:      '<path d="M12 5v14M6 13l6 6 6-6"/>',
    info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>',
    alert:   '<path d="M12 8v5"/><path d="M12 16.5h.01"/><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    bot:     '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 4v3"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/>',
    image:   '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.8" cy="9" r="1.8"/><path d="m4 17 5-5 4.5 4.5L17 13l3 3"/>',
    doc:     '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    folder:  '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.5h7.8A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    key:     '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21l-2 2.5"/><path d="M17 12v3"/>',
    legal:   '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    gear:    '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 5v6h-6"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon:    '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    clock:   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    archive: '<rect x="3" y="4" width="18" height="4.5" rx="1.5"/><path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5"/><path d="M10 12.5h4"/>',
    unarchive: '<rect x="3" y="4" width="18" height="4.5" rx="1.5"/><path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5"/><path d="M12 17v-5"/><path d="m9.5 14.5 2.5-2.5 2.5 2.5"/>'
  };

  var FILLED = {
    play:  '<path d="M7 5.5 18.5 12 7 18.5z"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    dots:  '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>'
  };

  function icon(name, size, sw) {
    size = size || 16;
    if (FILLED[name]) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + FILLED[name] + '</svg>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (PATHS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  }
  function money2(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + (Math.round(Math.abs(n) * 100) / 100).toFixed(2);
  }
  function int(n) { return Math.round(n).toLocaleString('en-US'); }
  function compact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  }
  function pct(a, b) { return (b > 0 ? (a / b) * 100 : 0).toFixed(2) + '%'; }
  function cpa(spend, conv) { return conv > 0 ? '$' + (spend / conv).toFixed(2) : '—'; }
  function num(v) {
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function plural(n, one, many) {
    return Math.abs(Math.round(n)) === 1 ? one : many;
  }
  function dayLabel(offsetBack) {
    var d = new Date();
    d.setDate(d.getDate() - offsetBack);
    var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return mo[d.getMonth()] + ' ' + d.getDate();
  }

  /* ── цвета берём из токенов темы ── */
  function color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var TONES = { pos: '--pos', neg: '--neg', warn: '--warn', info: '--info',
                accent: '--accent', muted: '--text-3', text: '--text' };
  function tone(name) { return color(TONES[name] || '--text-3'); }

  /* ── производные метрики ── */
  function cpm(cost, impr) { return impr > 0 ? '$' + (cost / impr * 1000).toFixed(2) : '—'; }
  function cpc(cost, clicks) { return clicks > 0 ? '$' + (cost / clicks).toFixed(3) : '—'; }
  function winRate(v) { return v > 0 ? v.toFixed(1) + '%' : '—'; }

  function profit(revenue, cost) {
    var p = revenue - cost;
    return { value: p, text: money(p), color: tone(p === 0 ? 'muted' : (p > 0 ? 'pos' : 'neg')) };
  }
  function roi(revenue, cost) {
    if (!cost) return { value: 0, text: '—', color: tone('muted') };
    var r = (revenue - cost) / cost * 100;
    return {
      value: r,
      text: (r > 0 ? '+' : '') + r.toFixed(1) + '%',
      color: tone(Math.abs(r) < 0.05 ? 'muted' : (r > 0 ? 'pos' : 'neg'))
    };
  }

  /* Полный набор метрик строки — используется всеми таблицами. */
  function metrics(r) {
    var p = profit(r.revenue, r.cost), R = roi(r.revenue, r.cost);
    return {
      impr: compact(r.impr), clicks: int(r.clicks),
      ctr: pct(r.clicks, r.impr), conv: int(r.conv), cr: pct(r.conv, r.clicks),
      cost: money(r.cost), revenue: money(r.revenue),
      profit: p.text, profitColor: p.color,
      roi: R.text, roiColor: R.color,
      cpa: cpa(r.cost, r.conv), cpm: cpm(r.cost, r.impr), cpc: cpc(r.cost, r.clicks),
      win: winRate(r.winRate)
    };
  }

  function sum(rows) {
    return rows.reduce(function (a, r) {
      a.impr += r.impr || 0; a.clicks += r.clicks || 0; a.conv += r.conv || 0;
      a.cost += r.cost || 0; a.revenue += r.revenue || 0;
      a.wSum += (r.winRate || 0) * (r.cost || 0);
      return a;
    }, { impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, wSum: 0 });
  }
  function dateShort(d) {
    var p = function (x) { return x < 10 ? '0' + x : String(x); };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
  }

  /* Устойчивый ряд: одна и та же форма при одинаковом seed. */
  function daily(n, seed, total) {
    var s = seed >>> 0, w = [], sum = 0, i;
    for (i = 0; i < n; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      var r = s / 4294967296;
      var shape = 1 + Math.sin(i / 3.4) * 0.16 + Math.sin(i / 9.1) * 0.11 + (r - 0.5) * 0.34;
      var growth = 0.82 + (i / Math.max(1, n - 1)) * 0.36;
      var v = Math.max(0.15, shape * growth);
      w.push(v); sum += v;
    }
    var out = w.map(function (v) { return Math.round((v / sum) * total); });
    var drift = total - out.reduce(function (a, b) { return a + b; }, 0);
    out[out.length - 1] += drift;
    return out;
  }

  function ticks(max) {
    var m = Math.max(1, max);
    var mag = Math.pow(10, Math.floor(Math.log10(m / 4)));
    var mults = [1, 2, 2.5, 5, 10, 20], step = mag * 20, i;
    for (i = 0; i < mults.length; i++) {
      var cand = mag * mults[i];
      if (Math.ceil(m / cand) <= 5) { step = cand; break; }
    }
    var top = Math.ceil(m / step) * step, values = [];
    for (var v = 0; v <= top + step * 0.001; v += step) values.push(v);
    return { values: values, top: top };
  }

  /* Минимальная ширина строки таблицы: сумма колонок + зазоры + отступы.
     Считаем из самого grid-template-columns, чтобы не разъезжалось. */
  function gridMin(cols, gap, pad) {
    gap = gap === undefined ? 12 : gap;
    pad = pad === undefined ? 32 : pad;
    var parts = String(cols).trim().split(/\s+(?![^(]*\))/);
    var total = parts.reduce(function (a, p) {
      var m = /minmax\((\d+)px/.exec(p);
      if (m) return a + Number(m[1]);
      if (/^\d+px$/.test(p)) return a + parseInt(p, 10);
      return a + 120;
    }, 0);
    return 'min-width:' + (total + gap * (parts.length - 1) + pad) + 'px';
  }

  /* Настоящий <select>: значение уходит в те же обработчики, что и поля ввода. */
  function select(name, options, value, arg) {
    return '<select class="inp sel-inp" data-inp="' + name + '"' +
      (arg ? ' data-arg="' + arg + '"' : '') + '>' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
  }

  /* Список пар {id, label}: значением уходит id, подпись только на экране. */
  function selectKV(name, options, value, arg) {
    return '<select class="inp sel-inp" data-inp="' + name + '"' +
      (arg ? ' data-arg="' + arg + '"' : '') + '>' +
      options.map(function (o) {
        return '<option value="' + esc(String(o.id)) + '"' +
          (String(o.id) === String(value == null ? '' : value) ? ' selected' : '') + '>' +
          esc(o.label) + '</option>';
      }).join('') + '</select>';
  }

  function cls() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }

  w.UI = {
    icon: icon, esc: esc, money: money, money2: money2, int: int, compact: compact,
    pct: pct, cpa: cpa, cpm: cpm, cpc: cpc, winRate: winRate, profit: profit, roi: roi,
    color: color, tone: tone,
    metrics: metrics, sum: sum,
    num: num, plural: plural, dayLabel: dayLabel, dateShort: dateShort, selectKV: selectKV,
    daily: daily, ticks: ticks, cls: cls, gridMin: gridMin, select: select
  };
})(window);
