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

  function countryCount(d) {
    return d.rates.reduce(function (a, g) { return a + g.codes.length; }, 0);
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
      return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + R + '" y2="' + y.toFixed(1) + '" stroke="' + UI.color('--border') + '" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="' + UI.color('--text-3') + '" font-size="10" text-anchor="end">' +
        (q === 0 ? '0' : UI.compact(maxVol * q)) + '</text>';
    }).join('');
    var xt = '';
    for (i = 0; i <= 6; i++) {
      var bb = (i / 6) * bMax;
      xt += '<text x="' + vx(bb).toFixed(1) + '" y="164" fill="' + UI.color('--text-3') + '" font-size="10" text-anchor="middle">$' + bb.toFixed(2) + '</text>';
    }

    return {
      volume: UI.compact(vol(bid)),
      topBid: '$' + bid.toFixed(2),
      winRate: Math.min(62, 6 + (vol(bid) / Math.max(1, maxVol)) * 56).toFixed(1) + '%',
      svg: '<svg width="100%" height="176" viewBox="0 0 1104 176" fill="none" font-family="IBM Plex Mono, monospace" aria-label="Available volume by bid">' +
        grid + '<path d="' + area + '" fill="' + UI.color('--accent') + '" fill-opacity="0.10"/>' +
        '<polyline points="' + line + '" fill="none" stroke="' + UI.color('--accent') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="' + vx(bid).toFixed(1) + '" y1="14" x2="' + vx(bid).toFixed(1) + '" y2="144" stroke="' + UI.color('--accent') + '" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<circle cx="' + vx(bid).toFixed(1) + '" cy="' + vy(vol(bid)).toFixed(1) + '" r="4.5" fill="' + UI.color('--accent') + '" stroke="' + UI.color('--surface') + '" stroke-width="2"/>' +
        xt + '</svg>'
    };
  }

  /* ── выбор стран: несколько за раз, с поиском ── */
  function geoPicker() {
    var u = Store.get().ui, d = draft();
    if (!u.geoPickerOpen) {
      return '<button class="btn btn-sm" data-act="openGeo" data-arg="new">' + icon('plus', 13, 2.4) +
        (Store.get().draft.rates.length ? 'Add countries with a different bid' : 'Add countries') + '</button>';
    }
    var q = (u.geoSearch || '').trim().toLowerCase();
    var already = d.rates.reduce(function (a, g) { return a.concat(g.codes); }, []);
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
        (u.geoTarget === 'new'
          ? '<span class="hint" style="margin-left:auto">Bid</span>' +
            '<input class="inp num" style="width:96px;height:32px" type="text" value="' +
              esc(u.geoBid || model().suggested) + '" data-inp="geoBid">'
          : '<span class="hint" style="margin-left:auto">Adding to the $' +
            esc(draft().rates[u.geoTarget] ? draft().rates[u.geoTarget].bid : '') + ' bid</span>') +
        '<button class="btn btn-sm btn-pri" data-act="addGeo">' +
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
        var cls = 'cellh' + (on ? (hi >= 18 ? ' on peak' : ' on') : '');
        out += '<div class="' + cls + '" data-act="cell" data-arg="' + di + '-' + hi + '"></div>';
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
        var chips = g.codes.map(function (code) {
          var c = DATA.COUNTRIES.find(function (x) { return x.code === code; });
          return '<span class="geo-tag">' + esc(c ? c.name : code) +
            '<span class="x" data-act="dropCountry" data-arg="' + i + '|' + code + '">' +
            icon('close', 11, 2.4) + '</span></span>';
        }).join('');
        return '<div class="rate-r">' +
          '<div class="geo-cell">' + chips +
            '<button class="btn btn-xs" data-act="openGeo" data-arg="' + i + '">' +
              icon('plus', 11, 2.4) + 'Add</button></div>' +
          '<input class="inp num" type="text" value="' + esc(g.bid) + '" data-inp="bid" data-arg="' + i + '">' +
          '<input class="inp num" type="text" value="' + esc(g.goal) + '" placeholder="optional" data-inp="goal" data-arg="' + i + '">' +
          '<div class="del" data-act="delGroup" data-arg="' + i + '" title="Remove this bid">' +
            icon('trash', 14, 1.9) + '</div>' +
        '</div>';
      }).join('') || '<div class="hint">No countries yet — add the first ones below.</div>';

      var modelRows = DATA.PAY_MODELS.map(function (x) {
        return '<div class="mrow' + (x.key === d.model ? ' on' : '') + '" data-act="model" data-arg="' + x.key + '">' +
          '<div class="radio"><i></i></div>' +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:9px">' +
            '<span class="mname">' + x.name + '</span><span class="mtag">' + x.tag + '</span></div>' +
            '<div class="mdesc">' + x.desc + '</div></div></div>';
      }).join('');

      var sourceCards = DATA.SOURCES.map(function (x) {
        var on = d.sources.indexOf(x.key) >= 0;
        return '<div class="tile' + (on ? ' on' : '') + '" data-act="source" data-arg="' + x.key + '">' +
          '<div class="tile-h"><div class="box' + (on ? ' on' : '') + '"></div>' +
            '<span class="tile-n">' + x.name + '</span>' +
            '<span class="tile-badge">' + x.note + '</span></div>' +
          '<div class="tile-d">' + x.desc + '</div></div>';
      }).join('');

      var qualityRows = DATA.QUALITY.map(function (x) {
        var on = d.quality.indexOf(x.key) >= 0;
        return '<div class="tile' + (on ? ' on' : '') + '" data-act="quality" data-arg="' + x.key + '">' +
          '<div class="tile-h"><div class="box' + (on ? ' on' : '') + '"></div>' +
            '<span class="tile-n">' + x.name + '</span></div>' +
          '<div class="tile-d">' + x.desc + '</div></div>';
      }).join('');

      var tokens = DATA.TOKENS.map(function (t) {
        return '<div class="tok" data-act="copyToken" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
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
            '<div class="field"><label class="lab">Campaign name</label>' +
              '<input class="inp" type="text" value="' + esc(d.name) + '" data-inp="name" placeholder="e.g. Slots Royale — App Install"></div>' +
            '<div class="field"><label class="lab">Target URL</label>' +
              '<div class="url-field">' +
                '<input class="inp inp-mono" type="text" value="' + esc(d.url) + '" data-inp="url" ' +
                  'placeholder="https://your-offer.com/landing?click_id={clickid}">' +
                '<div>' +
                  '<div class="hint" style="margin-bottom:8px">Click a macro to copy it and paste it into the URL:</div>' +
                  '<div class="opts">' + tokens + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="hint">Conversions come back to this campaign through the postback — ' +
                'the click ID macro is what ties them together.</div></div>' +
            '<div class="field"><label class="lab">Ad format</label>' +
              '<div class="opts">' + opts(DATA.FORMATS, d.format, 'format') + '</div></div>' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Vertical</label>' +
                UI.select('vertical', DATA.VERTICALS, d.vertical) + '</div>' +
              '<div class="field"><label class="lab">Content category</label>' +
                '<div class="opts">' + opts(['Mainstream', 'Adult'], d.age, 'age') + '</div></div></div>' +
            '<div class="field"><label class="lab">Pricing model</label>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + modelRows + '</div>' +
              '<div class="hint">You set the rate per country in block 03.</div></div>' +
          '</div></div>' +

        /* 02 */
        '<div class="card"><div class="card-h"><div class="card-n">02</div>' +
          '<div class="card-t">Traffic</div><div class="card-s">Where it comes from and how fresh the audience is</div></div>' +
          '<div class="card-b">' +
            '<div class="field"><label class="lab">Source</label>' +
              '<div class="tiles t2">' + sourceCards + '</div>' +
              '<div class="hint">Pick both to start on clean inventory and scale into partner supply later.</div></div>' +
            '<div class="field"><label class="lab">Traffic quality</label>' +
              '<div class="tiles">' + qualityRows + '</div>' +
              '<div class="hint">Fresher audiences cost more. Remnant is the cheapest leftover volume.</div></div>' +
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
            '<div class="rate-h"><div class="lab">Countries</div><div class="lab">' + m.bidLabel + '</div>' +
              '<div class="lab">CPA goal, $</div><div></div></div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:-8px">' + rateRows + '</div>' +
            '<div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">' +
              geoPicker() +
              '<div class="minbid">' + icon('up', 12, 2.2) + 'Minimum bid — $' + m.min.toFixed(2) + ' ' + m.unit + '</div>' +
            '</div>' +
            '<div style="border-top:1px solid ' + UI.color('--border') + ';padding-top:18px">' +
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
                '<div class="hint">Presets are managed on the <span style="color:' + UI.color('--accent') + ';cursor:pointer" data-go="zones">Placements</span> screen.</div></div>' +
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
              '<div class="field"><label class="lab">Frequency cap</label>' +
                UI.select('capping', DATA.CAPPING, d.capping) + '</div>' +
              '<div class="field"><label class="lab">Browsers</label>' +
                UI.select('browsers', DATA.BROWSERS, d.browsers) + '</div>' +
              '<div class="field"><label class="lab">Placement language</label>' +
                UI.select('language', DATA.LANGUAGES, d.language) + '</div></div>' +
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
            '<div class="field"><label class="lab">Subzones</label>' +
              seg2(['Exclude', 'Only these'], d.subzoneMode, 'subzoneMode') +
              '<textarea class="inp" style="height:56px" placeholder="Subzone IDs, comma separated" data-inp="subzones">' + esc(d.subzones) + '</textarea>' +
              '<div class="hint">' + (d.subzoneMode === 'Exclude'
                ? 'Listed subzones will be skipped.'
                : 'The campaign will run only on the listed subzones.') + '</div></div>' +
          '</div>' : '') +
        '</div>' +

        /* 07 */
        '<div class="card"><div class="card-h"><div class="card-n">07</div>' +
          '<div class="card-t">Auto-check and launch</div>' +
          '<div class="card-s">The campaign goes to Pending and runs these checks itself — no manager involved</div></div>' +
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
              '<b>' + m.name + '</b><span>·</span><b>' + countryCount(d) + ' ' +
              UI.plural(countryCount(d), 'country', 'countries') + '</b><span>·</span>' +
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
      age:      function (v) { Store.set(function (s) { s.draft.age = v; }); },
      conn:     function (v) { Store.set(function (s) { s.draft.conn = v; }); },
      vpn:      function (v) { Store.set(function (s) { s.draft.vpn = v; }); },
      preset:   function (v) { Store.set(function (s) { s.draft.preset = v || ''; }); },
      subzoneMode: function (v) { Store.set(function (s) { s.draft.subzoneMode = v; }); },

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
      openGeo: function (target) {
        Store.set(function (s) {
          s.ui.geoPickerOpen = true;
          s.ui.geoTarget = target === undefined || target === 'new' ? 'new' : Number(target);
          s.ui.geoPick = [];
          s.ui.geoSearch = '';
        });
      },
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
        var already = d.rates.reduce(function (a, g) { return a.concat(g.codes); }, []);
        var codes = DATA.COUNTRIES.filter(function (c) {
          return already.indexOf(c.code) < 0 &&
            (!q || c.name.toLowerCase().indexOf(q) >= 0 || c.code.toLowerCase().indexOf(q) === 0);
        }).map(function (c) { return c.code; });
        Store.set(function (s) { s.ui.geoPick = s.ui.geoPick.length === codes.length ? [] : codes; });
      },
      addGeo: function () {
        var u = Store.get().ui;
        var n = u.geoPick.length;
        if (!n) { App.toast('Pick at least one country'); return; }
        var m = model();
        var bid = u.geoTarget === 'new' ? String(u.geoBid || m.suggested).trim() : null;
        if (bid !== null && UI.num(bid) < m.min) {
          App.toast('Bid is below the $' + m.min.toFixed(2) + ' minimum for ' + m.name);
          return;
        }
        var merged = false;
        Store.set(function (s) {
          var target = s.ui.geoTarget;
          if (target === 'new' || !s.draft.rates[target]) {
            /* Такой бид уже есть — доливаем страны туда, новая строка не нужна. */
            var same = s.draft.rates.findIndex(function (g) { return UI.num(g.bid) === UI.num(bid); });
            if (same >= 0) { target = same; merged = true; }
            else {
              s.draft.rates.push({ codes: [], bid: bid, goal: '' });
              target = s.draft.rates.length - 1;
            }
          }
          s.ui.geoPick.forEach(function (code) {
            if (s.draft.rates[target].codes.indexOf(code) < 0) s.draft.rates[target].codes.push(code);
          });
          s.ui.geoPick = [];
          s.ui.geoPickerOpen = false;
          s.ui.geoSearch = '';
          s.ui.geoBid = '';
        });
        App.toast(n + ' ' + UI.plural(n, 'country', 'countries') +
          (merged ? ' added to the existing $' + bid + ' bid' : ' added'));
      },
      /* Страна уходит из группы; пустая группа исчезает сама. */
      dropCountry: function (arg) {
        var p = arg.split('|'), gi = Number(p[0]), code = p[1];
        Store.set(function (s) {
          var g = s.draft.rates[gi];
          if (!g) return;
          var i = g.codes.indexOf(code);
          if (i >= 0) g.codes.splice(i, 1);
          if (!g.codes.length) s.draft.rates.splice(gi, 1);
        });
      },
      delGroup: function (i) { Store.set(function (s) { s.draft.rates.splice(Number(i), 1); }); },

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
        if (!countryCount(d)) { App.toast('Add at least one country'); return; }

        var m = model();
        var low = d.rates.filter(function (g) { return UI.num(g.bid) < m.min; });
        if (low.length) {
          App.toast('One of the bids is below the $' + m.min.toFixed(2) + ' minimum for ' + m.name);
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
        App.toast('Campaign NN-C-' + newId + ' created — pending the auto-check');
      }
    },

    inputs: {
      vertical: function (v) { Store.set(function (s) { s.draft.vertical = v; }); },
      capping:  function (v) { Store.patch(function (s) { s.draft.capping = v; }); },
      browsers: function (v) { Store.patch(function (s) { s.draft.browsers = v; }); },
      language: function (v) { Store.patch(function (s) { s.draft.language = v; }); },
      name:     function (v) { Store.patch(function (s) { s.draft.name = v; }); },
      url:      function (v) { Store.patch(function (s) { s.draft.url = v; }); },
      subzones: function (v) { Store.patch(function (s) { s.draft.subzones = v; }); },
      daily:    function (v) { Store.patch(function (s) { s.draft.daily = v; }); },
      total:    function (v) { Store.patch(function (s) { s.draft.total = v; }); },
      goal:     function (v, i) { Store.patch(function (s) { s.draft.rates[Number(i)].goal = v; }); },
      geoSearch: function (v) { Store.set(function (s) { s.ui.geoSearch = v; s.ui.geoPick = []; }); },
      /* Пока печатаешь — ничего не перерисовываем, иначе поле дёргается.
         Ставка уходит в расчёт, когда уводишь фокус. */
      geoBid: function (v) { Store.patch(function (s) { s.ui.geoBid = v; }); },
      /* Пока печатаешь — не перерисовываем. По уходу фокуса строки с одинаковым бидом сливаем. */
      bid: function (v, i, type) {
        if (type === 'input') { Store.patch(function (s) { s.draft.rates[Number(i)].bid = v; }); return; }
        var mergedInto = -1;
        Store.set(function (s) {
          var idx = Number(i);
          s.draft.rates[idx].bid = v;
          var twin = -1;
          s.draft.rates.forEach(function (g, j) {
            if (j !== idx && twin < 0 && UI.num(g.bid) === UI.num(v)) twin = j;
          });
          if (twin >= 0) {
            s.draft.rates[idx].codes.forEach(function (code) {
              if (s.draft.rates[twin].codes.indexOf(code) < 0) s.draft.rates[twin].codes.push(code);
            });
            s.draft.rates.splice(idx, 1);
            mergedInto = twin;
          }
        });
        if (mergedInto >= 0) App.toast('Same bid — countries merged into one row');
      }
    }
  };
})(window);
