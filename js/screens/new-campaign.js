/* Create campaign: one page, complex settings folded into Advanced. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var SOURCE_SHARE = { direct: 0.35, partner: 0.80 };
  var QUALITY_SHARE = { fresh: 0.28, regular: 0.42, aged: 0.22, remnant: 0.08 };

  function model() {
    var key = Store.get().draft.model;
    return DATA.PAY_MODELS.find(function (m) { return m.key === key; }) || DATA.PAY_MODELS[3];
  }
  function draft() { return Store.get().draft; }

  function opts(items, selected, act) {
    return items.map(function (x) {
      return '<div class="opt' + (selected === x ? ' on' : '') + '" data-act="' + act + '" data-arg="' + esc(x) + '">' + esc(x) + '</div>';
    }).join('');
  }
  function multi(items, selected, act) {
    return items.map(function (x) {
      return '<div class="opt' + (selected.indexOf(x) >= 0 ? ' on' : '') + '" data-act="' + act + '" data-arg="' + esc(x) + '">' + esc(x) + '</div>';
    }).join('');
  }
  function seg2(items, selected, act) {
    return '<div class="seg2">' + items.map(function (x) {
      return '<div class="' + (selected === x ? 'on' : '') + '" data-act="' + act + '" data-arg="' + esc(x) + '">' + esc(x) + '</div>';
    }).join('') + '</div>';
  }
  function sel(text, muted) {
    return '<div class="sel"><span' + (muted ? ' class="ph"' : '') + '>' + esc(text) + '</span>' + icon('down', 14, 2) + '</div>';
  }

  /* Доля инвентаря, доступная при выбранных источниках и качестве. */
  function reachFactor(d) {
    var src = d.sources.reduce(function (a, k) { return a + (SOURCE_SHARE[k] || 0); }, 0);
    var q = d.quality.reduce(function (a, k) { return a + (QUALITY_SHARE[k] || 0); }, 0);
    return Math.min(1, src) * q;
  }

  function topBid(d) {
    var bids = d.rates.map(function (g) { return UI.num(g.bid); }).filter(function (v) { return v > 0; });
    return bids.length ? Math.max.apply(null, bids) : UI.num(model().suggested);
  }

  /* Кривая доступного объёма от ставки. */
  function volumeChart(d) {
    var m = model(), bid = topBid(d);
    var maxVol = 9200000 * Math.max(0.04, reachFactor(d));
    var half = m.half;
    var vol = function (b) { return maxVol * Math.pow(b, 1.7) / (Math.pow(b, 1.7) + Math.pow(half, 1.7)); };

    var L = 52, R = 1096, T = 14, B = 144, W = R - L, H = B - T;
    var bMax = half * 3, pts = [], i;
    for (i = 0; i <= 48; i++) { var b = (i / 48) * bMax; pts.push([b, vol(b)]); }
    var vx = function (x) { return L + Math.min(1, x / bMax) * W; };
    var vy = function (v) { return B - (v / maxVol) * H; };

    var line = pts.map(function (p) { return vx(p[0]).toFixed(1) + ',' + vy(p[1]).toFixed(1); }).join(' ');
    var area = 'M ' + L + ' ' + B + ' L ' +
      pts.map(function (p) { return vx(p[0]).toFixed(1) + ' ' + vy(p[1]).toFixed(1); }).join(' L ') + ' L ' + R + ' ' + B + ' Z';
    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (q) {
      var y = B - q * H;
      return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + R + '" y2="' + y.toFixed(1) + '" stroke="#252220" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#625E59" font-size="10" text-anchor="end">' +
        (q === 0 ? '0' : UI.compact(maxVol * q)) + '</text>';
    }).join('');
    var xt = '';
    for (i = 0; i <= 6; i++) {
      var bb = (i / 6) * bMax;
      xt += '<text x="' + vx(bb).toFixed(1) + '" y="164" fill="#625E59" font-size="10" text-anchor="middle">$' + bb.toFixed(2) + '</text>';
    }

    return {
      volume: UI.compact(vol(bid)),
      topBid: '$' + bid.toFixed(2),
      winRate: Math.min(62, 6 + (vol(bid) / Math.max(1, maxVol)) * 56).toFixed(1) + '%',
      svg: '<svg width="100%" height="176" viewBox="0 0 1104 176" fill="none" font-family="IBM Plex Mono, monospace" aria-label="Available volume by bid">' +
        grid + '<path d="' + area + '" fill="#C4995B" fill-opacity="0.10"/>' +
        '<polyline points="' + line + '" fill="none" stroke="#C4995B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="' + vx(bid).toFixed(1) + '" y1="14" x2="' + vx(bid).toFixed(1) + '" y2="144" stroke="#D7B174" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<circle cx="' + vx(bid).toFixed(1) + '" cy="' + vy(vol(bid)).toFixed(1) + '" r="4.5" fill="#C4995B" stroke="#12100E" stroke-width="2"/>' +
        xt + '</svg>'
    };
  }

  /* ── выбор стран: несколько за раз, с поиском ── */
  function geoPicker() {
    var u = Store.get().ui, d = draft();
    if (!u.geoPickerOpen) {
      return '<button class="btn btn-sm" data-act="openGeo">' + icon('plus', 13, 2.4) + 'Add countries</button>';
    }
    var q = (u.geoSearch || '').trim().toLowerCase();
    var already = d.rates.map(function (r) { return r.code; });
    var list = DATA.COUNTRIES.filter(function (c) {
      return !q || c.name.toLowerCase().indexOf(q) >= 0 || c.code.toLowerCase().indexOf(q) === 0;
    });

    var chips = list.map(function (c) {
      var added = already.indexOf(c.code) >= 0;
      var picked = u.geoPick.indexOf(c.code) >= 0;
      if (added) {
        return '<div class="opt" style="opacity:.4;cursor:default">' + esc(c.name) +
          '<span class="cid mono">' + c.code + '</span></div>';
      }
      return '<div class="opt' + (picked ? ' on' : '') + '" data-act="pickGeo" data-arg="' + c.code + '">' +
        esc(c.name) + '<span class="cid mono">' + c.code + '</span></div>';
    }).join('') || '<span class="hint">Nothing matches “' + esc(u.geoSearch) + '”</span>';

    return '<div class="picker">' +
      '<div class="picker-h">' +
        '<div class="search-in">' + icon('search', 14, 2) +
          '<input class="inp" type="text" value="' + esc(u.geoSearch) + '" data-inp="geoSearch" ' +
          'placeholder="Search country or code" style="border:none;background:transparent;height:32px;padding:0"></div>' +
        '<button class="btn btn-xs" data-act="pickAllGeo">Select all shown</button>' +
        '<button class="btn btn-xs" data-act="closeGeo">Cancel</button>' +
      '</div>' +
      '<div class="picker-b">' + chips + '</div>' +
      '<div class="picker-f">' +
        '<span class="hint">' + (u.geoPick.length
          ? u.geoPick.length + ' ' + UI.plural(u.geoPick.length, 'country', 'countries') + ' selected'
          : 'Pick as many as you need') + '</span>' +
        '<button class="btn btn-sm btn-pri" style="margin-left:auto" data-act="addGeo">' +
          'Add' + (u.geoPick.length ? ' ' + u.geoPick.length : '') + '</button>' +
      '</div>' +
    '</div>';
  }

  function scheduleHtml(d) {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], h, out = '';
    out += '<div class="grid-h"><div></div>';
    for (h = 0; h < 24; h++) out += '<div class="hh">' + (h < 10 ? '0' + h : h) + '</div>';
    out += '</div>';
    d.schedule.forEach(function (row, di) {
      out += '<div class="grid-r"><div class="dd">' + days[di] + '</div>';
      row.forEach(function (on, hi) {
        var bg = on ? (hi >= 18 ? '#C4995B' : 'rgba(196,153,91,0.34)') : '#1C1A17';
        out += '<div class="cellh" style="background:' + bg + '" data-act="cell" data-arg="' + di + '-' + hi + '"></div>';
      });
      out += '</div>';
    });
    return out;
  }

  w.Screens = w.Screens || {};
  w.Screens.newCampaign = {
    render: function () {
      var s = Store.get(), d = s.draft, m = model();
      var chart = volumeChart(d);
      var base = topBid(d);
      var picked = 0;
      d.schedule.forEach(function (r) { r.forEach(function (v) { if (v) picked++; }); });

      var rateRows = d.rates.map(function (g, i) {
        return '<div class="rate-r">' +
          '<div class="geo-chip"><span>' + esc(g.name) + '</span><span class="cid mono">' + g.code + '</span>' +
            '<span class="geo-x" data-act="delGeo" data-arg="' + i + '">' + icon('close', 13, 2.4) + '</span></div>' +
          '<input class="inp num" type="text" value="' + esc(g.bid) + '" data-inp="bid" data-arg="' + i + '">' +
          '<input class="inp num" type="text" value="' + esc(g.goal) + '" placeholder="optional" data-inp="goal" data-arg="' + i + '">' +
          '<input class="inp num" type="text" value="' + UI.dateShort(new Date()) + '" readonly>' +
          '<div class="del" data-act="delGeo" data-arg="' + i + '">' + icon('trash', 14, 1.9) + '</div>' +
        '</div>';
      }).join('') || '<div class="hint">No countries yet — add at least one.</div>';

      var modelRows = DATA.PAY_MODELS.map(function (x) {
        return '<div class="mrow' + (x.key === d.model ? ' on' : '') + '" data-act="model" data-arg="' + x.key + '">' +
          '<div class="radio"><i></i></div>' +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:9px">' +
            '<span class="mname">' + x.name + '</span><span class="mtag">' + x.tag + '</span></div>' +
            '<div class="mdesc">' + x.desc + '</div></div>' +
          '<div class="mprice"><b>from $' + x.min.toFixed(2) + '</b><span>' + x.unit + '</span></div></div>';
      }).join('');

      var sourceCards = DATA.SOURCES.map(function (x) {
        var on = d.sources.indexOf(x.key) >= 0;
        return '<div class="meth-c' + (on ? ' on' : '') + '" data-act="source" data-arg="' + x.key + '">' +
          '<div class="box' + (on ? ' on' : '') + '" style="margin-top:2px"></div>' +
          '<div><div class="meth-n">' + x.name + '</div>' +
          '<div class="meth-d">' + x.desc + '</div>' +
          '<div class="mtag" style="display:inline-block;margin-top:7px">' + x.note + '</div></div></div>';
      }).join('');

      var qualityRows = DATA.QUALITY.map(function (x) {
        var on = d.quality.indexOf(x.key) >= 0;
        return '<div class="mrow' + (on ? ' on' : '') + '" data-act="quality" data-arg="' + x.key + '">' +
          '<div class="box' + (on ? ' on' : '') + '"></div>' +
          '<div style="min-width:0"><div class="mname">' + x.name + '</div>' +
          '<div class="mdesc">' + x.desc + '</div></div>' +
          '<div class="mprice"><b>$' + (base * x.mult).toFixed(2) + '</b>' +
          '<span>suggested bid · CR ' + x.cr + '</span></div></div>';
      }).join('');

      var presetRows = [{ id: '', name: 'No preset — full inventory', kind: '', zones: [] }]
        .concat(s.presets).map(function (p) {
          var meta = p.id
            ? p.zones.length + ' ' + UI.plural(p.zones.length, 'placement', 'placements') +
              ' · ' + (p.kind === 'whitelist' ? 'whitelist' : 'blacklist')
            : 'The system picks placements on its own';
          return '<div class="mrow' + (d.preset === p.id ? ' on' : '') + '" data-act="preset" data-arg="' + p.id + '">' +
            '<div class="radio"><i></i></div>' +
            '<div style="min-width:0"><div class="mname">' + esc(p.name) + '</div>' +
            '<div class="mdesc">' + meta + '</div></div></div>';
        }).join('');

      var tokens = DATA.TOKENS.map(function (t) {
        return '<div class="tok" data-act="copyToken" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
      }).join('');

      var hasUrl = !!d.url.trim(), hasName = !!d.name.trim(), hasGeo = d.rates.length > 0;
      var checks = [
        { t: 'Detect the vertical', ok: true, r: esc(d.vertical) + ' · ' + (d.age === 'Adult' ? 'adult' : 'mainstream') },
        { t: 'Screen for restricted content', ok: hasUrl, r: hasUrl ? 'ready to scan' : 'needs a link' },
        { t: 'Verify the link responds', ok: hasUrl, r: hasUrl ? 'ready to ping' : 'needs a link' },
        { t: 'Assemble the settings package', ok: hasUrl && hasName && hasGeo, r: hasUrl && hasName && hasGeo ? 'ready' : 'fill the blocks above' }
      ].map(function (c) {
        return '<div class="check"><div class="check-ic' + (c.ok ? '' : ' pending') + '">' +
          (c.ok ? icon('check', 13, 3) : icon('clock', 13, 2)) + '</div>' +
          '<div class="check-t">' + c.t + '</div><div class="check-r mono">' + c.r + '</div></div>';
      });

      var adv = s.ui.advancedOpen;

      return '<div class="page">' +
        '<div class="head"><div>' +
          '<h1 class="h1">' + (d.editingId ? 'Edit campaign' : 'New campaign') + '</h1>' +
          '<p class="sub">One page. Fill it once — the campaign runs itself from there.</p></div>' +
          '<div style="margin-left:auto;display:flex;gap:10px">' +
            '<button class="btn btn-ghost" data-act="cancel">Cancel</button>' +
            '<button class="btn" data-act="draft">Save draft</button></div></div>' +

        /* 01 */
        '<div class="card"><div class="card-h"><div class="card-n">01</div>' +
          '<div class="card-t">Basics</div><div class="card-s">Offer, format and pricing model</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Campaign name</label>' +
                '<input class="inp" type="text" value="' + esc(d.name) + '" data-inp="name" placeholder="e.g. Slots Royale — App Install"></div>' +
              '<div class="field"><label class="lab">Offer link</label>' +
                '<input class="inp inp-mono" type="text" value="' + esc(d.url) + '" data-inp="url" placeholder="https://"></div></div>' +
            '<div class="field"><label class="lab">Ad format</label>' +
              '<div class="opts">' + opts(DATA.FORMATS, d.format, 'format') + '</div></div>' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Vertical</label>' +
                '<div class="opts">' + opts(DATA.VERTICALS.slice(0, 5), d.vertical, 'vertical') + '</div></div>' +
              '<div class="field"><label class="lab">Content category</label>' +
                '<div class="opts">' + opts(['Mainstream', 'Adult'], d.age, 'age') + '</div></div></div>' +
            '<div class="field"><label class="lab">Pricing model</label>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + modelRows + '</div>' +
              '<div class="hint">You set the rate yourself — per country, in block 03. ' +
                'The network only defines the floor.</div></div>' +
          '</div></div>' +

        /* 02 */
        '<div class="card"><div class="card-h"><div class="card-n">02</div>' +
          '<div class="card-t">Traffic</div><div class="card-s">Where it comes from and how fresh the audience is</div></div>' +
          '<div class="card-b">' +
            '<div class="field"><label class="lab">Source</label>' +
              '<div class="meth">' + sourceCards + '</div>' +
              '<div class="hint">Pick both to start on clean inventory and scale into partner supply later.</div></div>' +
            '<div class="field"><label class="lab">Traffic quality</label>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + qualityRows + '</div>' +
              '<div class="hint">Fresher users convert better and cost more. Remnant is the cheapest leftover volume — ' +
                'usually worth it only on CPM.</div></div>' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Platform</label>' +
                '<div class="opts">' + multi(['Desktop', 'Mobile', 'Tablet'], d.platforms, 'platform') + '</div></div>' +
              '<div class="field"><label class="lab">Operating systems</label>' +
                '<div class="opts">' + multi(['Android', 'iOS', 'Windows', 'macOS'], d.oses, 'os') + '</div></div></div>' +
          '</div></div>' +

        /* 03 */
        '<div class="card"><div class="card-h"><div class="card-n">03</div>' +
          '<div class="card-t">Countries and bids</div><div class="card-s">A separate bid per country</div></div>' +
          '<div class="card-b">' +
            '<div class="rate-h"><div class="lab">Country</div><div class="lab">' + m.bidLabel + '</div>' +
              '<div class="lab">CPA goal, $</div><div class="lab">Start date</div><div></div></div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:-8px">' + rateRows + '</div>' +
            '<div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">' +
              geoPicker() +
              '<div class="minbid">' + icon('up', 12, 2.2) + 'Minimum bid — $' + m.min.toFixed(2) + ' ' + m.unit + '</div>' +
            '</div>' +
            '<div style="border-top:1px solid #252220;padding-top:18px">' +
              '<div class="chart-h"><div>' +
                '<div style="font-size:13px;font-weight:600">Available volume at your bid</div>' +
                '<div class="hint">For the selected source, quality and targeting</div></div>' +
                '<div style="margin-left:auto;display:flex;gap:26px">' +
                  '<div><div class="kpi-lab">Impressions / day</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.volume + '</div></div>' +
                  '<div><div class="kpi-lab">Est. win rate</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.winRate + '</div></div>' +
                  '<div><div class="kpi-lab">At bid</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.topBid + '</div></div>' +
                '</div></div>' +
              '<div class="plot">' + chart.svg + '</div></div>' +
          '</div></div>' +

        /* 04 + 05 */
        '<div class="g2" style="align-items:start">' +
          '<div class="card"><div class="card-h"><div class="card-n">04</div><div class="card-t">Placements</div>' +
            '<div class="card-s">Reuse a saved preset</div></div>' +
            '<div class="card-b">' +
              '<div class="field">' +
                '<div style="display:flex;flex-direction:column;gap:8px">' + presetRows + '</div>' +
                '<div class="hint">Presets are managed on the <span style="color:#D7B174;cursor:pointer" data-go="zones">Placements</span> screen.</div></div>' +
            '</div></div>' +

          '<div class="card"><div class="card-h"><div class="card-n">05</div><div class="card-t">Budget</div></div>' +
            '<div class="card-b">' +
              '<div class="g2">' +
                '<div class="field"><label class="lab">Daily cap, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.daily) + '" data-inp="daily">' +
                  '<div class="hint">Minimum $10</div></div>' +
                '<div class="field"><label class="lab">Total budget, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.total) + '" data-inp="total">' +
                  '<div class="hint">Minimum $50</div></div></div>' +
              '<div class="field"><label class="lab">Macros</label>' +
                '<div class="opts">' + tokens + '</div>' +
                '<div class="hint">Click to copy and paste into the link.</div></div>' +
            '</div></div></div>' +

        /* 06 — сложное спрятано */
        '<div class="card">' +
          '<div class="card-h" data-act="advanced" style="cursor:pointer">' +
            '<div class="card-n">06</div>' +
            '<div class="card-t">Advanced settings</div>' +
            '<div class="card-s">Frequency, browsers, connection, VPN, schedule, subzones · ' +
              (adv ? 'open' : 'sensible defaults applied') + '</div>' +
            '<div class="act" style="margin-left:12px">' + icon(adv ? 'down' : 'right', 13, 2) + '</div>' +
          '</div>' +
          (adv ? '<div class="card-b">' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Frequency cap</label>' + sel(d.capping) + '</div>' +
              '<div class="field"><label class="lab">Browsers</label>' + sel('All browsers', true) + '</div>' +
              '<div class="field"><label class="lab">Placement language</label>' + sel('Any language', true) + '</div></div>' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Connection type</label>' +
                seg2(['All', '3G / LTE', 'Wi-Fi'], d.conn, 'conn') + '</div>' +
              '<div class="field"><label class="lab">VPN</label>' +
                seg2(['All traffic', 'VPN only', 'No VPN'], d.vpn, 'vpn') + '</div>' +
              '<div class="field"><label class="lab">Ends</label>' +
                '<input class="inp num" type="text" value="" placeholder="DD.MM.YY HH:mm">' +
                '<div class="hint">Empty means no end date</div></div></div>' +
            '<div class="field"><label class="lab">Schedule · UTC</label>' +
              '<div>' + scheduleHtml(d) + '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px">' +
                '<button class="btn btn-sm" data-act="sch" data-arg="all">Whole week</button>' +
                '<button class="btn btn-sm" data-act="sch" data-arg="work">Weekdays</button>' +
                '<button class="btn btn-sm" data-act="sch" data-arg="week">Weekend</button>' +
                '<button class="btn btn-sm" data-act="sch" data-arg="clear">Clear</button>' +
                '<span class="hint" style="margin-left:6px">' + picked + ' of 168 hours selected</span></div></div>' +
            '<div class="field"><label class="lab">Subzone exclusions</label>' +
              '<textarea class="inp" style="height:56px" placeholder="Subzone IDs, comma separated" data-inp="subzones">' + esc(d.subzones) + '</textarea>' +
              '<div class="hint">Subzones affect placement quality — exclude them individually.</div></div>' +
          '</div>' : '') +
        '</div>' +

        /* 07 */
        '<div class="card"><div class="card-h"><div class="card-n">07</div>' +
          '<div class="card-t">Auto-check and launch</div>' +
          '<div class="card-s">Runs the moment you hit launch — no manager involved</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(0, 2).join('') + '</div>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(2).join('') + '</div></div>' +
            '<div class="note">' + icon('info', 15, 2) +
              '<p><b>One request, the whole network.</b> The checks above run on launch; the campaign starts by itself ' +
              'as soon as they pass. After that the robot reconciles statistics every hour: it stops unprofitable ' +
              'placements and adjusts caps and bids.</p></div></div>' +
          '<div class="bar-row">' +
            '<div class="sumline"><span>' + (d.name ? esc(d.name) : 'Untitled') + '</span><span>·</span>' +
              '<b>' + m.name + '</b><span>·</span><b>' + d.rates.length + ' ' +
              UI.plural(d.rates.length, 'country', 'countries') + '</b><span>·</span>' +
              '<span>daily cap</span><b>$' + esc(d.daily) + '</b></div>' +
            '<button class="btn" style="margin-left:auto" data-act="draft">Save draft</button>' +
            '<button class="btn btn-pri btn-lg" data-act="launch">' + icon('play', 14) + 'Launch campaign</button></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      cancel: function () { App.go('campaigns'); },
      draft: function () { App.toast('Draft saved'); },
      advanced: function () { Store.set(function (s) { s.ui.advancedOpen = !s.ui.advancedOpen; }); },

      format:   function (v) { Store.set(function (s) { s.draft.format = v; }); },
      vertical: function (v) { Store.set(function (s) { s.draft.vertical = v; }); },
      age:      function (v) { Store.set(function (s) { s.draft.age = v; }); },
      conn:     function (v) { Store.set(function (s) { s.draft.conn = v; }); },
      vpn:      function (v) { Store.set(function (s) { s.draft.vpn = v; }); },
      preset:   function (v) { Store.set(function (s) { s.draft.preset = v || ''; }); },

      model: function (v) {
        Store.set(function (s) {
          s.draft.model = v;
          var m = DATA.PAY_MODELS.find(function (x) { return x.key === v; });
          s.draft.rates.forEach(function (r) { if (UI.num(r.bid) < m.min) r.bid = m.suggested; });
        });
      },

      source: function (v) {
        Store.set(function (s) {
          var i = s.draft.sources.indexOf(v);
          if (i >= 0) { if (s.draft.sources.length > 1) s.draft.sources.splice(i, 1); }
          else s.draft.sources.push(v);
        });
      },
      quality: function (v) {
        Store.set(function (s) {
          var i = s.draft.quality.indexOf(v);
          if (i >= 0) { if (s.draft.quality.length > 1) s.draft.quality.splice(i, 1); }
          else s.draft.quality.push(v);
        });
      },
      platform: function (v) {
        Store.set(function (s) {
          var i = s.draft.platforms.indexOf(v);
          if (i >= 0) s.draft.platforms.splice(i, 1); else s.draft.platforms.push(v);
        });
      },
      os: function (v) {
        Store.set(function (s) {
          var i = s.draft.oses.indexOf(v);
          if (i >= 0) s.draft.oses.splice(i, 1); else s.draft.oses.push(v);
        });
      },

      /* ── страны ── */
      openGeo:  function () { Store.set(function (s) { s.ui.geoPickerOpen = true; s.ui.geoPick = []; s.ui.geoSearch = ''; }); },
      closeGeo: function () { Store.set(function (s) { s.ui.geoPickerOpen = false; s.ui.geoPick = []; }); },
      pickGeo: function (code) {
        Store.set(function (s) {
          var i = s.ui.geoPick.indexOf(code);
          if (i >= 0) s.ui.geoPick.splice(i, 1); else s.ui.geoPick.push(code);
        });
      },
      pickAllGeo: function () {
        var u = Store.get().ui, d = draft();
        var q = (u.geoSearch || '').trim().toLowerCase();
        var already = d.rates.map(function (r) { return r.code; });
        var codes = DATA.COUNTRIES.filter(function (c) {
          return already.indexOf(c.code) < 0 &&
            (!q || c.name.toLowerCase().indexOf(q) >= 0 || c.code.toLowerCase().indexOf(q) === 0);
        }).map(function (c) { return c.code; });
        Store.set(function (s) { s.ui.geoPick = s.ui.geoPick.length === codes.length ? [] : codes; });
      },
      addGeo: function () {
        var n = Store.get().ui.geoPick.length;
        if (!n) { App.toast('Pick at least one country'); return; }
        Store.set(function (s) {
          var bid = s.draft.rates.length ? s.draft.rates[s.draft.rates.length - 1].bid : model().suggested;
          s.ui.geoPick.forEach(function (code) {
            var c = DATA.COUNTRIES.find(function (x) { return x.code === code; });
            if (c && !s.draft.rates.some(function (r) { return r.code === code; })) {
              s.draft.rates.push({ code: c.code, name: c.name, bid: bid, goal: '' });
            }
          });
          s.ui.geoPick = [];
          s.ui.geoPickerOpen = false;
          s.ui.geoSearch = '';
        });
        App.toast(n + ' ' + UI.plural(n, 'country', 'countries') + ' added');
      },
      delGeo: function (i) { Store.set(function (s) { s.draft.rates.splice(Number(i), 1); }); },

      cell: function (arg) {
        var p = arg.split('-'), di = Number(p[0]), hi = Number(p[1]);
        Store.set(function (s) { s.draft.schedule[di][hi] = !s.draft.schedule[di][hi]; });
      },
      sch: function (kind) {
        Store.set(function (s) {
          s.draft.schedule = s.draft.schedule.map(function (row, di) {
            return row.map(function () {
              if (kind === 'all') return true;
              if (kind === 'clear') return false;
              if (kind === 'work') return di < 5;
              return di >= 5;
            });
          });
        });
      },

      copyToken: function (t) {
        if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
        App.toast('Copied: ' + t);
      },

      launch: function () {
        var d = Store.get().draft;
        if (!d.name.trim()) { App.toast('Give the campaign a name'); return; }
        if (!d.url.trim()) { App.toast('Add the offer link'); return; }
        if (!d.rates.length) { App.toast('Add at least one country'); return; }

        var m = model();
        var low = d.rates.filter(function (r) { return UI.num(r.bid) < m.min; });
        if (low.length) {
          App.toast(low[0].name + ': bid is below the $' + m.min.toFixed(2) + ' minimum for ' + m.name);
          return;
        }

        var newId;
        Store.set(function (s) {
          newId = String(4850 + s.campaigns.length);
          s.campaigns.unshift({
            id: newId, name: d.name, format: d.format, vertical: d.vertical,
            adult: d.age === 'Adult', model: m.name, status: 'review',
            impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, winRate: 0, bid: d.rates[0].bid
          });
          s.draft = Store.seedDraft();
          s.ui.geoPickerOpen = false;
          s.ui.advancedOpen = false;
        });
        App.go('campaigns');
        App.toast('Campaign NN-C-' + newId + ' sent to the auto-check');
      }
    },

    inputs: {
      name:     function (v) { Store.patch(function (s) { s.draft.name = v; }); },
      url:      function (v) { Store.patch(function (s) { s.draft.url = v; }); },
      subzones: function (v) { Store.patch(function (s) { s.draft.subzones = v; }); },
      daily:    function (v) { Store.patch(function (s) { s.draft.daily = v; }); },
      total:    function (v) { Store.patch(function (s) { s.draft.total = v; }); },
      goal:     function (v, i) { Store.patch(function (s) { s.draft.rates[Number(i)].goal = v; }); },
      geoSearch: function (v) { Store.set(function (s) { s.ui.geoSearch = v; s.ui.geoPick = []; }); },
      /* Пока печатаешь — ничего не перерисовываем, иначе поле дёргается.
         Ставка уходит в расчёт, когда уводишь фокус. */
      bid: function (v, i, type) {
        if (type === 'input') Store.patch(function (s) { s.draft.rates[Number(i)].bid = v; });
        else Store.set(function (s) { s.draft.rates[Number(i)].bid = v; });
      }
    }
  };
})(window);
