/* Иконки, форматирование и мелкие помощники. */
(function (w) {
  'use strict';

/* ── фирменный набор иконок ──
     Каждая иконка собрана из трёх слоёв: b — приглушённая подложка,
     f — залитая основа, s — тонкая деталь обводкой. Общий словарь форм
     (скруглённый прямоугольник, круг, восходящий столбик) держит набор
     единым и отличает его от стандартных штриховых библиотек.
     Все слои красятся currentColor, поэтому иконка живёт в теме сама. */
  var ICONS = {
    stats:   { b: '<rect x="2.6" y="10" width="5" height="11" rx="2"/><rect x="16.4" y="6" width="5" height="15" rx="2"/>',
               f: '<rect x="9.5" y="2.6" width="5" height="18.4" rx="2"/>' },
    camp:    { b: '<rect x="2.6" y="3.4" width="18.8" height="7.4" rx="2.6"/>',
               f: '<rect x="2.6" y="13.2" width="11.4" height="7.4" rx="2.6"/>' },
    zones:   { b: '<rect x="2.6" y="2.6" width="8" height="8" rx="2.4"/><rect x="13.4" y="13.4" width="8" height="8" rx="2.4"/>',
               f: '<rect x="13.4" y="2.6" width="8" height="8" rx="2.4"/><rect x="2.6" y="13.4" width="8" height="8" rx="2.4"/>' },
    volume:  { b: '<path d="M11 2.6a9.4 9.4 0 1 0 10.4 10.4H11z"/>',
               f: '<path d="M13.4 2.9A9.4 9.4 0 0 1 21.1 10.6h-7.7z"/>' },
    pay:     { b: '<rect x="2" y="4.6" width="20" height="14.8" rx="3.4"/>',
               f: '<rect x="2" y="8.6" width="20" height="3.2"/><rect x="5.4" y="14.4" width="6" height="2.6" rx="1.3"/>' },
    post:    { b: '<rect x="1.8" y="8.8" width="12.6" height="6.4" rx="3.2"/>',
               f: '<rect x="9.6" y="8.8" width="12.6" height="6.4" rx="3.2"/>' },
    user:    { b: '<path d="M12 13.4c4.3 0 7.8 2.9 8.4 6.7a1.2 1.2 0 0 1-1.2 1.3H4.8a1.2 1.2 0 0 1-1.2-1.3c.6-3.8 4.1-6.7 8.4-6.7z"/>',
               f: '<circle cx="12" cy="7.4" r="4.3"/>' },
    bell:    { b: '<path d="M12 2.4a6.6 6.6 0 0 1 6.6 6.6c0 4.4 1.6 5.6 2.1 6.2a.9.9 0 0 1-.7 1.5H4a.9.9 0 0 1-.7-1.5c.5-.6 2.1-1.8 2.1-6.2A6.6 6.6 0 0 1 12 2.4z"/>',
               f: '<path d="M9.4 18.4h5.2a2.6 2.6 0 0 1-5.2 0z"/>' },
    help:    { b: '<circle cx="12" cy="12" r="9.4"/>',
               f: '<circle cx="12" cy="16.6" r="1.4"/>',
               s: '<path d="M9.5 9.4a2.6 2.6 0 1 1 3.4 2.5c-.6.2-.9.7-.9 1.3"/>' },
    bot:     { b: '<rect x="3" y="6.6" width="18" height="13.4" rx="4"/>',
               f: '<circle cx="9" cy="13" r="1.7"/><circle cx="15" cy="13" r="1.7"/><rect x="11" y="2.4" width="2" height="4" rx="1"/>' },
    doc:     { b: '<path d="M5 4.4A2.4 2.4 0 0 1 7.4 2h6.2l6 6v13.6A2.4 2.4 0 0 1 17.2 24H7.4A2.4 2.4 0 0 1 5 21.6z" transform="translate(0,-1)"/>',
               f: '<path d="M13.6 1v5a2 2 0 0 0 2 2h4z"/>' },
    folder:  { b: '<path d="M2.6 7.4A2.6 2.6 0 0 1 5.2 4.8h3.4l2.2 2.6h8A2.6 2.6 0 0 1 21.4 10v7.6a2.6 2.6 0 0 1-2.6 2.6H5.2a2.6 2.6 0 0 1-2.6-2.6z"/>',
               f: '<rect x="2.6" y="11.4" width="18.8" height="2.4"/>' },
    key:     { b: '<circle cx="8" cy="12" r="5.2"/>',
               f: '<path d="M12.4 9.6h9v4.8h-2.2v-2.2h-1.8v2.2h-5z"/>' },
    legal:   { b: '<rect x="3.6" y="2.6" width="16.8" height="18.8" rx="3.2"/>',
               f: '<rect x="7" y="7" width="10" height="2.2" rx="1.1"/><rect x="7" y="11" width="10" height="2.2" rx="1.1"/><rect x="7" y="15" width="6" height="2.2" rx="1.1"/>' },
    gear:    { b: '<path d="M10.2 2.6h3.6l.5 2.6 2.2 1.3 2.5-.9 1.8 3.1-2 1.7v2.6l2 1.7-1.8 3.1-2.5-.9-2.2 1.3-.5 2.6h-3.6l-.5-2.6-2.2-1.3-2.5.9-1.8-3.1 2-1.7v-2.6l-2-1.7 1.8-3.1 2.5.9 2.2-1.3z"/>',
               f: '<circle cx="12" cy="12" r="3.2"/>' },
    image:   { b: '<rect x="2.6" y="3.6" width="18.8" height="16.8" rx="3.4"/>',
               f: '<circle cx="8.4" cy="9" r="2"/><path d="M2.6 17.6l4.6-4.6 4.2 4.2 3.4-3.4 6.6 6.6H5a2.4 2.4 0 0 1-2.4-2.4z"/>' },
    clock:   { b: '<circle cx="12" cy="12" r="9.4"/>',
               f: '<path d="M11 6.4h2v6l3.6 2.1-1 1.8-4.6-2.7z"/>' },
    info:    { b: '<circle cx="12" cy="12" r="9.4"/>',
               f: '<circle cx="12" cy="7.6" r="1.4"/><rect x="10.9" y="10.4" width="2.2" height="7" rx="1.1"/>' },
    alert:   { b: '<path d="M10.3 3.5a2 2 0 0 1 3.4 0l7.7 13.6a2 2 0 0 1-1.7 3H4.3a2 2 0 0 1-1.7-3z"/>',
               f: '<rect x="10.9" y="8" width="2.2" height="6.2" rx="1.1"/><circle cx="12" cy="17" r="1.4"/>' },
    archive: { b: '<rect x="3.4" y="7.4" width="17.2" height="13" rx="2.8"/>',
               f: '<rect x="2.2" y="3.4" width="19.6" height="4.6" rx="1.8"/><rect x="9.4" y="11.4" width="5.2" height="2.2" rx="1.1"/>' },
    unarchive:{ b: '<rect x="3.4" y="7.4" width="17.2" height="13" rx="2.8"/>',
               f: '<rect x="2.2" y="3.4" width="19.6" height="4.6" rx="1.8"/><path d="M12 10.6l3.4 3.6h-2.2v3.4h-2.4v-3.4H8.6z"/>' },
    trash:   { b: '<path d="M5.4 7.6h13.2l-1 12a2.4 2.4 0 0 1-2.4 2.2H8.8a2.4 2.4 0 0 1-2.4-2.2z"/>',
               f: '<path d="M3.4 5.2h17.2v2.4H3.4z"/><path d="M9 2.6h6v2.6H9z"/>' },
    copy:    { b: '<rect x="8.4" y="8.4" width="12.4" height="12.4" rx="3.2"/>',
               f: '<path d="M3.2 6a2.8 2.8 0 0 1 2.8-2.8h6.4A2.8 2.8 0 0 1 15.2 6v.9h-4a4.3 4.3 0 0 0-4.3 4.3v4h-.9A2.8 2.8 0 0 1 3.2 12.4z"/>' },
    edit:    { b: '<path d="M3 17.2 15.6 4.6l4.4 4.4L7.4 21.6H3z"/>',
               f: '<path d="M16.8 3.4a2.4 2.4 0 0 1 3.4 0l1.2 1.2a2.4 2.4 0 0 1 0 3.4l-.8.8-4.6-4.6z"/>' },
    /* Отчёт: столбики с точкой роста. Сплошной квадрат здесь читался пятном. */
    chart:   { b: '<rect x="3" y="12.6" width="4" height="8.4" rx="2"/><rect x="16.8" y="9.6" width="4" height="11.4" rx="2"/>',
               f: '<rect x="9.9" y="7.6" width="4" height="13.4" rx="2"/><circle cx="18.8" cy="4.4" r="2.6"/>' },
    search:  { b: '<circle cx="10.6" cy="10.6" r="7.4"/>',
               f: '<rect x="15.4" y="16.6" width="7" height="2.8" rx="1.4" transform="rotate(45 15.4 16.6)"/>' },
    download:{ b: '<rect x="2.8" y="17.6" width="18.4" height="3.2" rx="1.6"/>',
               f: '<path d="M10.6 2.6h2.8v8.2h3.6L12 16.6 7 10.8h3.6z"/>' },
    upload:  { b: '<rect x="2.8" y="17.6" width="18.4" height="3.2" rx="1.6"/>',
               f: '<path d="M13.4 15.6h-2.8V7.4H7L12 1.6l5 5.8h-3.6z"/>' },
    refresh: { b: '<path d="M12 3.4a8.6 8.6 0 1 1-8.3 10.8l2.7-.7A5.8 5.8 0 1 0 12 6.2z"/>',
               f: '<path d="M13.6 2.2v7.2l-5.4-3.6z"/>' },
    sun:     { b: '<path d="M11 1.6h2v3.4h-2zm0 17.4h2v3.4h-2zM1.6 11h3.4v2H1.6zm17.4 0h3.4v2H19zM4.2 5.6l1.4-1.4 2.4 2.4-1.4 1.4zm12 12l1.4-1.4 2.4 2.4-1.4 1.4zm3.8-12l-2.4 2.4-1.4-1.4 2.4-2.4zM6.6 17.6l-2.4 2.4 1.4 1.4 2.4-2.4z"/>',
               f: '<circle cx="12" cy="12" r="4.6"/>' },
    moon:    { b: '<path d="M21.4 14.4A9.6 9.6 0 0 1 9.6 2.6a9.6 9.6 0 1 0 11.8 11.8z"/>',
               f: '<circle cx="17.6" cy="5.4" r="1.6"/>' },
    play:    { f: '<path d="M7.4 4.6a1.2 1.2 0 0 1 1.8-1l10 6.4a1.2 1.2 0 0 1 0 2l-10 6.4a1.2 1.2 0 0 1-1.8-1z"/>' },
    pause:   { f: '<rect x="6" y="4.6" width="4.2" height="14.8" rx="1.6"/><rect x="13.8" y="4.6" width="4.2" height="14.8" rx="1.6"/>' },
    plus:    { f: '<path d="M10.7 4.4h2.6v5.9h5.9v2.6h-5.9v5.9h-2.6v-5.9H4.8v-2.6h5.9z"/>' },
    close:   { f: '<path d="M5.6 7.4 7.4 5.6 12 10.2l4.6-4.6 1.8 1.8L13.8 12l4.6 4.6-1.8 1.8L12 13.8l-4.6 4.6-1.8-1.8L10.2 12z"/>' },
    check:   { f: '<path d="M9.6 16.2 5.4 12l-1.8 1.8 6 6L20.4 8.4l-1.8-1.8z"/>' },
    right:   { f: '<path d="M8.6 4.8 15.8 12l-7.2 7.2-1.8-1.8L12.2 12 6.8 6.6z"/>' },
    left:    { f: '<path d="M15.4 19.2 8.2 12l7.2-7.2 1.8 1.8L11.8 12l5.4 5.4z"/>' },
    down:    { f: '<path d="M4.8 8.6 12 15.8l7.2-7.2-1.8-1.8L12 12.2 6.6 6.8z"/>' },
    up:      { f: '<path d="M12 4.8 19.2 12l-1.8 1.8L12 8.4 6.6 13.8 4.8 12z"/>' },
    dn:      { f: '<path d="M12 19.2 4.8 12l1.8-1.8L12 15.6l5.4-5.4L19.2 12z"/>' },
    dots:    { f: '<circle cx="12" cy="4.8" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19.2" r="1.9"/>' },
    menu:    { f: '<rect x="3" y="5.2" width="18" height="2.6" rx="1.3"/><rect x="3" y="10.7" width="18" height="2.6" rx="1.3"/><rect x="3" y="16.2" width="18" height="2.6" rx="1.3"/>' }
  };

  /* Знак бренда: три растущих столбика — показы, клики, конверсии.
     Наковальню пробовали: в 32px её силуэт схлопывается в блок. */
  function brandMark(size) {
    size = size || 30;
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect width="32" height="32" rx="9" fill="var(--accent-solid)"/>' +
      '<g fill="var(--on-accent)">' + '<rect x="7" y="17.5" width="4.4" height="7.5" rx="2.2" opacity="0.55"/><rect x="13.8" y="13" width="4.4" height="12" rx="2.2" opacity="0.8"/><rect x="20.6" y="7" width="4.4" height="18" rx="2.2"/>' + '</g></svg>';
  }

  /* Спарклайн: заливка под кривой плюс сама кривая. Ширина в процентах,
     поэтому карточка любого размера получает график по своей ширине. */
  function spark(values, tone, h) {
    h = h || 34;
    var w = 100, n = values.length;
    if (n < 2) return '';
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var x = function (i) { return (i / (n - 1)) * w; };
    var y = function (v) { return h - 3 - ((v - min) / span) * (h - 8); };
    var line = values.map(function (v, i) {
      return (i ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(v).toFixed(2);
    }).join(' ');
    var area = line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    var c = color(tone || '--accent');
    var id = 'sp' + Math.random().toString(36).slice(2, 8);
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + c + '" stop-opacity="0.30"/>' +
        '<stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#' + id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="' + c + '" stroke-width="1.6" ' +
        'stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* Пустое состояние: не «нет данных», а что сделать, чтобы они появились. */
  function blank(name, title, text, cta, go) {
    return '<div class="blank">' +
      '<div class="blank-i">' + icon(name, 26) + '</div>' +
      '<div class="blank-t">' + esc(title) + '</div>' +
      '<div class="blank-d">' + esc(text) + '</div>' +
      (cta ? '<button class="btn btn-pri" data-go="' + go + '">' + esc(cta) + '</button>' : '') +
    '</div>';
  }

  function icon(name, size) {
    size = size || 16;
    var g = ICONS[name];
    if (!g) return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"></svg>';
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" ' +
      'fill="currentColor" aria-hidden="true">' +
      (g.b ? '<g class="ic-b" opacity="0.28">' + g.b + '</g>' : '') +
      (g.f || '') +
      (g.s ? '<g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round">' + g.s + '</g>' : '') +
      '</svg>';
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
  /* Копейки с разделителем тысяч: $12,480.50, а не $12480.50. */
  function money2(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + (Math.round(Math.abs(n) * 100) / 100)
      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    icon: icon, brandMark: brandMark, spark: spark, blank: blank, esc: esc, money: money, money2: money2, int: int, compact: compact,
    pct: pct, cpa: cpa, cpm: cpm, cpc: cpc, winRate: winRate, profit: profit, roi: roi,
    color: color, tone: tone,
    metrics: metrics, sum: sum,
    num: num, plural: plural, dayLabel: dayLabel, dateShort: dateShort, selectKV: selectKV,
    daily: daily, ticks: ticks, cls: cls, gridMin: gridMin, select: select
  };
})(window);
