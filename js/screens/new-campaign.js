/* Create campaign: a single page, everything within reach. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  function model() {
    var key = Store.get().draft.model;
    return DATA.PAY_MODELS.find(function (m) { return m.key === key; }) || DATA.PAY_MODELS[3];
  }

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

  /* Available volume against the bid. */
  function volumeChart(d) {
    var m = model();
    var bids = d.rates.map(function (g) { return UI.num(g.bid); }).filter(function (v) { return v > 0; });
    var topBid = bids.length ? Math.max.apply(null, bids) : UI.num(m.suggested);
    var maxVol = 9200000, half = m.half;
    var vol = function (b) { return maxVol * Math.pow(b, 1.7) / (Math.pow(b, 1.7) + Math.pow(half, 1.7)); };

    var L = 52, R = 1096, T = 14, B = 144, W = R - L, H = B - T;
    var bMax = half * 3, pts = [], i;
    for (i = 0; i <= 48; i++) { var b = (i / 48) * bMax; pts.push([b, vol(b)]); }
    var vx = function (b) { return L + Math.min(1, b / bMax) * W; };
    var vy = function (v) { return B - (v / maxVol) * H; };

    var line = pts.map(function (p) { return vx(p[0]).toFixed(1) + ',' + vy(p[1]).toFixed(1); }).join(' ');
    var area = 'M ' + L + ' ' + B + ' L ' +
      pts.map(function (p) { return vx(p[0]).toFixed(1) + ' ' + vy(p[1]).toFixed(1); }).join(' L ') + ' L ' + R + ' ' + B + ' Z';
    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (q) {
      var y = B - q * H;
      return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + R + '" y2="' + y.toFixed(1) + '" stroke="#22262E" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' +
        (q === 0 ? '0' : UI.compact(maxVol * q)) + '</text>';
    }).join('');
    var xt = '';
    for (i = 0; i <= 6; i++) {
      var bb = (i / 6) * bMax;
      xt += '<text x="' + vx(bb).toFixed(1) + '" y="164" fill="#6A7180" font-size="10" text-anchor="middle">$' + bb.toFixed(2) + '</text>';
    }

    return {
      volume: UI.compact(vol(topBid)),
      topBid: '$' + topBid.toFixed(2),
      winRate: Math.min(62, 6 + (vol(topBid) / maxVol) * 56).toFixed(1) + '%',
      svg: '<svg width="100%" height="176" viewBox="0 0 1104 176" fill="none" font-family="Archivo, sans-serif" aria-label="Available volume by bid">' +
        grid + '<path d="' + area + '" fill="#8368F7" fill-opacity="0.10"/>' +
        '<polyline points="' + line + '" fill="none" stroke="#8368F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="' + vx(topBid).toFixed(1) + '" y1="14" x2="' + vx(topBid).toFixed(1) + '" y2="144" stroke="#A48FFF" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<circle cx="' + vx(topBid).toFixed(1) + '" cy="' + vy(vol(topBid)).toFixed(1) + '" r="4.5" fill="#8368F7" stroke="#13161C" stroke-width="2"/>' +
        xt + '</svg>'
    };
  }

  function scheduleHtml(d) {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], h, out = '';
    out += '<div class="grid-h"><div></div>';
    for (h = 0; h < 24; h++) out += '<div class="hh">' + (h < 10 ? '0' + h : h) + '</div>';
    out += '</div>';
    d.schedule.forEach(function (row, di) {
      out += '<div class="grid-r"><div class="dd">' + days[di] + '</div>';
      row.forEach(function (on, hi) {
        var bg = on ? (hi >= 18 ? '#8368F7' : 'rgba(131,104,247,0.42)') : '#1C1F25';
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
      }).join('');

      var modelRows = DATA.PAY_MODELS.map(function (x) {
        return '<div class="mrow' + (x.key === d.model ? ' on' : '') + '" data-act="model" data-arg="' + x.key + '">' +
          '<div class="radio"><i></i></div>' +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:9px">' +
            '<span class="mname">' + x.name + '</span><span class="mtag">' + x.tag + '</span></div>' +
            '<div class="mdesc">' + x.desc + '</div></div>' +
          '<div class="mprice"><b>from $' + x.min.toFixed(2) + '</b><span>' + x.unit + '</span></div></div>';
      }).join('');

      var presetRows = [{ id: '', name: 'No preset — full inventory', kind: '', zones: [] }]
        .concat(s.presets).map(function (p) {
          var on = d.preset === p.id;
          var meta = p.id
            ? p.zones.length + ' ' + UI.plural(p.zones.length, 'placement', 'placements') +
              ' · ' + (p.kind === 'whitelist' ? 'whitelist' : 'blacklist')
            : 'The system picks placements on its own';
          return '<div class="mrow' + (on ? ' on' : '') + '" data-act="preset" data-arg="' + p.id + '">' +
            '<div class="radio"><i></i></div>' +
            '<div style="min-width:0"><div class="mname">' + esc(p.name) + '</div>' +
            '<div class="mdesc">' + meta + '</div></div></div>';
        }).join('');

      var tokens = DATA.TOKENS.map(function (t) {
        return '<div class="tok" data-act="copyToken" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
      }).join('');

      /* Проверки ещё не прошли — они запустятся при старте. Показываем готовность. */
      var hasUrl = !!d.url.trim(), hasName = !!d.name.trim(), hasGeo = d.rates.length > 0;
      var checks = [
        { t: 'Detect the vertical', ok: true,
          r: esc(d.vertical) + ' · ' + (d.age === 'Adult' ? 'adult' : 'mainstream') },
        { t: 'Screen for restricted content', ok: hasUrl,
          r: hasUrl ? 'ready to scan' : 'needs a link' },
        { t: 'Verify the link responds', ok: hasUrl,
          r: hasUrl ? 'ready to ping' : 'needs a link' },
        { t: 'Assemble the settings package', ok: hasUrl && hasName && hasGeo,
          r: hasUrl && hasName && hasGeo ? 'ready' : 'fill the blocks above' }
      ].map(function (c) {
        return '<div class="check"><div class="check-ic' + (c.ok ? '' : ' pending') + '">' +
          (c.ok ? icon('check', 13, 3) : icon('clock', 13, 2)) + '</div>' +
          '<div class="check-t">' + c.t + '</div><div class="check-r mono">' + c.r + '</div></div>';
      });

      return '<div class="page">' +
        '<div class="head"><div>' +
          '<h1 class="h1">' + (d.editingId ? 'Edit campaign' : 'New campaign') + '</h1>' +
          '<p class="sub">One page. Fill it once — the campaign runs itself from there.</p></div>' +
          '<div style="margin-left:auto;display:flex;gap:10px">' +
            '<button class="btn btn-ghost" data-act="cancel">Cancel</button>' +
            '<button class="btn" data-act="draft">Save draft</button></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-n">01</div>' +
          '<div class="card-t">Basics</div><div class="card-s">Name, format and pricing model</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Campaign name</label>' +
                '<input class="inp" type="text" value="' + esc(d.name) + '" data-inp="name" placeholder="e.g. Slots Royale — App Install"></div>' +
              '<div class="field"><label class="lab">Format</label>' +
                '<div class="opts">' + opts(DATA.FORMATS, d.format, 'format') + '</div></div></div>' +
            '<div class="field"><label class="lab">Pricing model</label>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + modelRows + '</div>' +
              '<div class="hint">You set the rate yourself — per country, in the next block. ' +
                'The network only defines the floor. The model can only be changed before the campaign starts.</div></div>' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Vertical</label>' +
                '<div class="opts">' + opts(DATA.VERTICALS.slice(0, 5), d.vertical, 'vertical') + '</div></div>' +
              '<div class="field"><label class="lab">Content category</label>' +
                '<div class="opts">' + opts(['Mainstream', 'Adult'], d.age, 'age') + '</div>' +
                '<div class="hint">Drives placement selection. The auto-check verifies the category anyway.</div></div></div>' +
            '<div class="g4">' +
              '<div class="field"><label class="lab">Frequency cap</label>' + sel(d.capping) + '</div>' +
              '<div class="field"><label class="lab">Starts</label>' +
                '<input class="inp num" type="text" value="' + UI.dateShort(new Date()) + ' 06:13" readonly>' +
                '<div class="hint">System time is UTC</div></div>' +
              '<div class="field"><label class="lab">Ends</label>' +
                '<input class="inp num" type="text" value="" placeholder="DD.MM.YY HH:mm">' +
                '<div class="hint">Empty means no end date</div></div>' +
              '<div class="field"><label class="lab">Folder</label>' + sel('No folder', true) + '</div></div>' +
          '</div></div>' +

        '<div class="card"><div class="card-h"><div class="card-n">02</div>' +
          '<div class="card-t">Countries and bids</div><div class="card-s">A separate bid per country</div></div>' +
          '<div class="card-b">' +
            '<div class="rate-h"><div class="lab">Country</div><div class="lab">' + m.bidLabel + '</div>' +
              '<div class="lab">CPA goal, $</div><div class="lab">Start date</div><div></div></div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:-8px">' + rateRows + '</div>' +
            '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
              '<button class="btn btn-sm" data-act="addGeo">' + icon('plus', 13, 2.4) + 'Add country</button>' +
              '<div class="minbid">' + icon('up', 12, 2.2) + 'Minimum bid — $' + m.min.toFixed(2) + ' ' + m.unit + '</div></div>' +
            '<div style="border-top:1px solid #23272F;padding-top:18px">' +
              '<div class="chart-h"><div>' +
                '<div style="font-size:13px;font-weight:600">Available volume at your bid</div>' +
                '<div class="hint">Estimated from verified placements over the last 7 days</div></div>' +
                '<div style="margin-left:auto;text-align:right;display:flex;gap:26px">' +
                  '<div><div class="kpi-lab">Impressions / day</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.volume + '</div></div>' +
                  '<div><div class="kpi-lab">Est. win rate</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.winRate + '</div></div>' +
                  '<div><div class="kpi-lab">At bid</div>' +
                    '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.topBid + '</div></div>' +
                '</div></div>' +
              '<div class="plot">' + chart.svg + '</div></div>' +
          '</div></div>' +

        '<div class="card"><div class="card-h"><div class="card-n">03</div>' +
          '<div class="card-t">Targeting</div><div class="card-s">Set once — mirrored into every source</div></div>' +
          '<div class="card-b">' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Platform</label>' +
                '<div class="opts">' + multi(['Desktop', 'Mobile', 'Tablet'], d.platforms, 'platform') + '</div></div>' +
              '<div class="field"><label class="lab">Operating systems</label>' +
                '<div class="opts">' + multi(['Android', 'iOS', 'Windows', 'macOS'], d.oses, 'os') + '</div></div>' +
              '<div class="field"><label class="lab">Browsers</label>' + sel('All browsers', true) + '</div></div>' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Placement language</label>' + sel('English, German') + '</div>' +
              '<div class="field"><label class="lab">Connection type</label>' +
                seg2(['All', '3G / LTE', 'Wi-Fi'], d.conn, 'conn') + '</div>' +
              '<div class="field"><label class="lab">VPN</label>' +
                seg2(['All traffic', 'VPN only', 'No VPN'], d.vpn, 'vpn') + '</div></div>' +
          '</div></div>' +

        '<div class="card"><div class="card-h"><div class="card-n">04</div>' +
          '<div class="card-t">Schedule</div><div class="card-s">Time zone — UTC</div></div>' +
          '<div class="card-b"><div>' + scheduleHtml(d) + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<button class="btn btn-sm" data-act="sch" data-arg="all">Whole week</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="work">Weekdays</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="week">Weekend</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="clear">Clear</button>' +
              '<span class="hint" style="margin-left:6px">' + picked + ' of 168 hours selected</span></div>' +
          '</div></div>' +

        '<div class="g2" style="align-items:start">' +
          '<div class="card"><div class="card-h"><div class="card-n">05</div><div class="card-t">Placements</div>' +
            '<div class="card-s">Reuse a saved preset</div></div>' +
            '<div class="card-b">' +
              '<div class="field"><label class="lab">Placement preset</label>' +
                '<div style="display:flex;flex-direction:column;gap:8px">' + presetRows + '</div>' +
                '<div class="hint">Presets are managed on the <span class="lnk" style="color:#A48FFF;cursor:pointer" data-go="zones">Placements</span> screen — ' +
                'a whitelist narrows the campaign to those placements, a blacklist excludes them.</div></div>' +
              '<div class="field"><label class="lab">Subzone exclusions</label>' +
                '<textarea class="inp" style="height:56px" placeholder="Subzone IDs, comma separated" data-inp="subzones">' + esc(d.subzones) + '</textarea>' +
                '<div class="hint">Subzones affect placement quality — exclude them individually.</div></div>' +
            '</div></div>' +

          '<div class="card"><div class="card-h"><div class="card-n">06</div><div class="card-t">Budget and link</div></div>' +
            '<div class="card-b">' +
              '<div class="g2">' +
                '<div class="field"><label class="lab">Daily cap, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.daily) + '" data-inp="daily">' +
                  '<div class="hint">Minimum $10</div></div>' +
                '<div class="field"><label class="lab">Total budget, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.total) + '" data-inp="total">' +
                  '<div class="hint">Minimum $50</div></div></div>' +
              '<div class="field"><label class="lab">Offer link</label>' +
                '<input class="inp inp-mono" type="text" value="' + esc(d.url) + '" data-inp="url" placeholder="https://"></div>' +
              '<div class="field"><label class="lab">Macros</label>' +
                '<div class="opts">' + tokens + '</div>' +
                '<div class="hint">Click to copy and paste into the link.</div></div>' +
            '</div></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-n">07</div>' +
          '<div class="card-t">Auto-check and launch</div>' +
          '<div class="card-s">Runs the moment you hit launch — no manager involved</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(0, 2).join('') + '</div>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(2).join('') + '</div></div>' +
            '<div class="note">' + icon('info', 15, 2) +
              '<p><b>One request, the whole network.</b> The checks below run on launch; the campaign starts by itself ' +
              'as soon as they pass. After that it goes out to verified placements, ' +
              'and the robot reconciles statistics every hour: it stops unprofitable placements and adjusts caps and bids. ' +
              'No per-source setup needed.</p></div></div>' +
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
          /* Ставку задаёт рекламодатель: поднимаем только то, что ниже нового минимума. */
          s.draft.rates.forEach(function (r) {
            if (UI.num(r.bid) < m.min) r.bid = m.suggested;
          });
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

      addGeo: function () {
        var added;
        Store.set(function (s) {
          var next = DATA.GEO_POOL.concat(DATA.GEO).find(function (p) {
            return !s.draft.rates.some(function (r) { return r.code === p.code; });
          });
          if (!next) return;
          added = next.name;
          var like = s.draft.rates.length ? s.draft.rates[s.draft.rates.length - 1].bid : model().suggested;
          s.draft.rates.push({ code: next.code, name: next.name, bid: like, goal: '' });
        });
        if (added) App.toast(added + ' added');
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

        var m = model(), newId;
        var low = d.rates.filter(function (r) { return UI.num(r.bid) < m.min; });
        if (low.length) {
          App.toast(low[0].name + ': bid is below the $' + m.min.toFixed(2) + ' minimum for ' + m.name);
          return;
        }
        Store.set(function (s) {
          newId = String(4850 + s.campaigns.length);
          s.campaigns.unshift({
            id: newId, name: d.name, format: d.format, vertical: d.vertical,
            adult: d.age === 'Adult', model: m.name, status: 'review',
            impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, winRate: 0, bid: d.rates[0].bid
          });
          s.notifications.unshift({
            id: Date.now(), kind: 'ok', cat: 'camp', unread: true,
            title: 'Campaign submitted to the auto-check',
            text: 'NN-C-' + newId + ' “' + d.name + '” · ' + m.name + ' · ' + d.rates.length +
                  ' ' + UI.plural(d.rates.length, 'country', 'countries') + '. Starts right after the check.',
            time: 'Just now'
          });
          s.draft = Store.seedDraft();
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
      bid:      function (v, i) { Store.set(function (s) { s.draft.rates[Number(i)].bid = v; }); }
    }
  };
})(window);
