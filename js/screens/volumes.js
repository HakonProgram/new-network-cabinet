/* Traffic volumes: what is available before the first dollar is spent. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var F_SCALE = { 'Popunder': 1, 'Push': 0.72, 'In-Page Push': 0.55, 'Native': 0.31, 'Banner': 0.44 };
  var P_SCALE = { 'Mobile': 1, 'Desktop': 0.58, 'Tablet': 0.14 };
  var C_SCALE = { 'Mainstream': 1, 'Adult': 0.66, 'All': 1.5 };
  var R_SCALE = { 'Europe': 1, 'North America': 0.74, 'Asia': 1.9, 'Worldwide': 4.2 };
  var HALF = { 'Smart CPM': 1.9, 'CPC': 0.12, 'CPA': 9.0 };
  var MIN = { 'Smart CPM': 0.15, 'CPC': 0.03, 'CPA': 3.00 };
  var COLS = 'minmax(150px,1fr) 70px 118px 116px 92px 92px 82px 84px 170px';
  var MINW = 'min-width:1180px';

  function opts(items, sel, act) {
    return items.map(function (x) {
      return '<div class="opt' + (sel === x ? ' on' : '') + '" data-act="' + act + '" data-arg="' + esc(x) + '">' + esc(x) + '</div>';
    }).join('');
  }

  w.Screens = w.Screens || {};
  w.Screens.volumes = {
    render: function () {
      var u = Store.get().ui;
      var k = (F_SCALE[u.volFormat] || 1) * (P_SCALE[u.volPlatform] || 1) *
              (C_SCALE[u.volCat] || 1) * (R_SCALE[u.volRegion] || 1);
      var maxVol = 26000000 * k, half = HALF[u.volModel] || 1.9;
      var vol = function (b) { return maxVol * Math.pow(b, 1.7) / (Math.pow(b, 1.7) + Math.pow(half, 1.7)); };
      var bid = Math.max(0, UI.num(u.volBid));
      var total = vol(bid);
      var winRate = Math.min(62, 6 + (total / maxVol) * 56);

      var L = 56, R = 1096, T = 16, B = 164, W = R - L, H = B - T;
      var bMax = half * 3, pts = [], i;
      for (i = 0; i <= 48; i++) { var b = (i / 48) * bMax; pts.push([b, vol(b)]); }
      var vx = function (x) { return L + Math.min(1, x / bMax) * W; };
      var vy = function (v) { return B - (v / maxVol) * H; };

      var grid = [0, 0.25, 0.5, 0.75, 1].map(function (q) {
        var y = B - q * H;
        return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + R + '" y2="' + y.toFixed(1) + '" stroke="#22262E" stroke-width="1"/>' +
          '<text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" fill="#6A7180" font-size="10" text-anchor="end">' +
          (q === 0 ? '0' : UI.compact(maxVol * q)) + '</text>';
      }).join('');
      var line = pts.map(function (p) { return vx(p[0]).toFixed(1) + ',' + vy(p[1]).toFixed(1); }).join(' ');
      var area = 'M ' + L + ' ' + B + ' L ' + pts.map(function (p) { return vx(p[0]).toFixed(1) + ' ' + vy(p[1]).toFixed(1); }).join(' L ') + ' L ' + R + ' ' + B + ' Z';
      var xt = '';
      for (i = 0; i <= 6; i++) {
        var bb = (i / 6) * bMax;
        xt += '<text x="' + vx(bb).toFixed(1) + '" y="186" fill="#6A7180" font-size="10" text-anchor="middle">$' + bb.toFixed(2) + '</text>';
      }

      var rows = DATA.GEO.map(function (g) {
        var v = total * g.share, free = 1 - g.taken;
        return '<div class="tr row" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
          '<div class="cell w">' + g.name + '</div>' +
          '<div class="cell mono muted">' + g.code + '</div>' +
          '<div class="cell w r">' + UI.compact(v) + '</div>' +
          '<div class="cell r">$' + g.bid.toFixed(2) + '</div>' +
          '<div class="cell muted r">' + UI.cpm(g.cost, g.impr) + '</div>' +
          '<div class="cell muted r">' + g.winRate.toFixed(1) + '%</div>' +
          '<div class="cell muted r">' + g.zones + '</div>' +
          '<div class="cell muted r">' + g.cr.toFixed(2) + '%</div>' +
          '<div><div class="bar"><i style="width:' + Math.round(free * 100) + '%"></i></div>' +
          '<div class="hint" style="margin-top:4px">' + UI.compact(v * free) + ' still free</div></div>' +
        '</div>';
      }).join('');

      var kpiBig = function (lab, val) {
        return '<div><div class="kpi-lab">' + lab + '</div>' +
          '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + val + '</div></div>';
      };

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Traffic volumes</h1>' +
        '<p class="sub">How much traffic your targeting can reach — before you spend the first dollar.</p></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Query</div>' +
          '<div class="card-s">Estimated from verified placements over the last 7 days</div></div>' +
          '<div class="card-b">' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Format</label><div class="opts">' +
                opts(DATA.FORMATS, u.volFormat, 'format') + '</div></div>' +
              '<div class="field"><label class="lab">Platform</label><div class="opts">' +
                opts(['Desktop', 'Mobile', 'Tablet'], u.volPlatform, 'platform') + '</div></div>' +
              '<div class="field"><label class="lab">Category</label><div class="opts">' +
                opts(['Mainstream', 'Adult', 'All'], u.volCat, 'cat') + '</div></div></div>' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Region</label><div class="opts">' +
                opts(['Europe', 'North America', 'Asia', 'Worldwide'], u.volRegion, 'region') + '</div></div>' +
              '<div class="field"><label class="lab">Pricing model</label><div class="opts">' +
                opts(['Smart CPM', 'CPC', 'CPA'], u.volModel, 'model') + '</div></div>' +
              '<div class="field"><label class="lab">Bid, $</label>' +
                '<input class="inp num" type="text" value="' + esc(u.volBid) + '" data-inp="bid">' +
                '<div class="hint">Minimum bid — $' + MIN[u.volModel].toFixed(2) + '</div></div></div>' +
          '</div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Available volume</div>' +
          '<div class="card-s">' + esc(u.volFormat + ' · ' + u.volPlatform + ' · ' + u.volRegion + ' · ' + u.volCat) + '</div></div>' +
          '<div class="card-b">' +
            '<div class="hero"><div>' +
              '<div class="hero-v">' + UI.compact(total) + '</div>' +
              '<div class="hero-l">impressions per day at a $' + bid.toFixed(2) + ' bid</div></div>' +
              '<div style="display:flex;gap:26px;margin-left:auto;flex-wrap:wrap">' +
                kpiBig('Est. win rate', winRate.toFixed(1) + '%') +
                kpiBig('Placements available', String(Math.round(1482 * Math.min(1, k / 1.2)))) +
                kpiBig('Avg CPM in scope', '$' + (0.9 + bid * 0.34).toFixed(2)) +
                kpiBig('Avg CR in vertical', '2.31%') +
              '</div></div>' +
            '<div class="plot"><svg width="100%" height="200" viewBox="0 0 1104 200" fill="none" font-family="Archivo, sans-serif" aria-label="Available volume by bid">' +
              grid + '<path d="' + area + '" fill="#8368F7" fill-opacity="0.10"/>' +
              '<polyline points="' + line + '" fill="none" stroke="#8368F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '<line x1="' + vx(bid).toFixed(1) + '" y1="16" x2="' + vx(bid).toFixed(1) + '" y2="164" stroke="#A48FFF" stroke-width="1" stroke-dasharray="3 3"/>' +
              '<circle cx="' + vx(bid).toFixed(1) + '" cy="' + vy(vol(bid)).toFixed(1) + '" r="4.5" fill="#8368F7" stroke="#13161C" stroke-width="2"/>' +
              xt + '</svg></div>' +
            '<div class="hint">Bid along the horizontal axis, impressions per day along the vertical. The dashed line marks your current bid.</div>' +
          '</div></div>' +

        '<div class="table"><div class="table-scroll">' +
          '<div class="tr thead" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
            '<div class="th">Country</div><div class="th">Code</div><div class="th r">Impr. / day</div>' +
            '<div class="th r">Suggested bid</div><div class="th r">Avg CPM</div><div class="th r">Win rate</div>' +
            '<div class="th r">Placements</div><div class="th r">Avg CR</div><div class="th">Free volume</div></div>' +
          rows +
        '</div>' +
        '<div class="foot"><span>Showing 7 of 34 countries in the selected region</span>' +
        '<span style="margin-left:auto">Estimate refreshes hourly</span></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      format:   function (v) { Store.ui('volFormat', v); },
      platform: function (v) { Store.ui('volPlatform', v); },
      cat:      function (v) { Store.ui('volCat', v); },
      region:   function (v) { Store.ui('volRegion', v); },
      model:    function (v) {
        Store.set(function (s) {
          s.ui.volModel = v;
          s.ui.volBid = v === 'CPC' ? '0.09' : (v === 'CPA' ? '10.00' : '2.40');
        });
      }
    },
    inputs: { bid: function (v) { Store.ui('volBid', v); } }
  };
})(window);
