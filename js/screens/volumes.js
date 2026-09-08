/* Объёмы трафика: сколько доступно до того, как потрачен первый доллар. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var F_SCALE = { 'Popunder': 1, 'Push': 0.72, 'In-Page Push': 0.55, 'Native': 0.31, 'Banner': 0.44 };
  var P_SCALE = { 'Mobile': 1, 'Desktop': 0.58, 'Tablet': 0.14 };
  var C_SCALE = { 'Обычная': 1, '18+': 0.66, 'Все': 1.5 };
  var R_SCALE = { 'Европа': 1, 'Северная Америка': 0.74, 'Азия': 1.9, 'Весь мир': 4.2 };
  var HALF = { 'Smart CPM': 1.9, 'CPC': 0.12, 'CPA': 9.0 };
  var MIN = { 'Smart CPM': 0.15, 'CPC': 0.03, 'CPA': 3.00 };

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
      var maxVol = 26000000 * k;
      var half = HALF[u.volModel] || 1.9;
      var vol = function (b) { return maxVol * Math.pow(b, 1.7) / (Math.pow(b, 1.7) + Math.pow(half, 1.7)); };
      var bid = Math.max(0, UI.num(u.volBid));

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

      var total = vol(bid);
      var rows = DATA.GEO.map(function (g) {
        var v = total * g.share, free = 1 - g.taken;
        return '<div class="tr row" style="grid-template-columns:minmax(0,1fr) 78px 130px 130px 110px 92px 180px">' +
          '<div class="cell w">' + g.name + '</div>' +
          '<div class="cell mono muted">' + g.code + '</div>' +
          '<div class="cell w r">' + UI.compact(v) + '</div>' +
          '<div class="cell r">$' + g.bid.toFixed(2) + '</div>' +
          '<div class="cell muted r">' + g.zones + '</div>' +
          '<div class="cell muted r">' + g.cr.toFixed(2) + '%</div>' +
          '<div><div class="bar"><i style="width:' + Math.round(free * 100) + '%"></i></div>' +
          '<div class="hint" style="margin-top:4px">свободно ' + UI.compact(v * free) + '</div></div>' +
        '</div>';
      }).join('');

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Объёмы трафика</h1>' +
        '<p class="sub">Сколько трафика доступно под ваш таргетинг — до того, как вы потратите первый доллар.</p></div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Параметры запроса</div>' +
          '<div class="card-s">Оценка по проверенным площадкам сети за последние 7 дней</div></div>' +
          '<div class="card-b">' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Формат</label><div class="opts">' +
                opts(DATA.FORMATS, u.volFormat, 'format') + '</div></div>' +
              '<div class="field"><label class="lab">Платформа</label><div class="opts">' +
                opts(['Desktop', 'Mobile', 'Tablet'], u.volPlatform, 'platform') + '</div></div>' +
              '<div class="field"><label class="lab">Категория</label><div class="opts">' +
                opts(['Обычная', '18+', 'Все'], u.volCat, 'cat') + '</div></div>' +
            '</div>' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Регион</label><div class="opts">' +
                opts(['Европа', 'Северная Америка', 'Азия', 'Весь мир'], u.volRegion, 'region') + '</div></div>' +
              '<div class="field"><label class="lab">Модель оплаты</label><div class="opts">' +
                opts(['Smart CPM', 'CPC', 'CPA'], u.volModel, 'model') + '</div></div>' +
              '<div class="field"><label class="lab">Ставка, $</label>' +
                '<input class="inp num" type="text" value="' + esc(u.volBid) + '" data-inp="bid">' +
                '<div class="hint">Минимальная ставка — $' + MIN[u.volModel].toFixed(2) + '</div></div>' +
            '</div>' +
          '</div></div>' +

        '<div class="card"><div class="card-h"><div class="card-t">Доступный объём</div>' +
          '<div class="card-s">' + esc(u.volFormat + ' · ' + u.volPlatform + ' · ' + u.volRegion + ' · ' + u.volCat) + '</div></div>' +
          '<div class="card-b">' +
            '<div class="hero"><div>' +
              '<div class="hero-v">' + UI.compact(total) + '</div>' +
              '<div class="hero-l">показов в сутки при ставке $' + bid.toFixed(2) + '</div></div>' +
              '<div style="display:flex;gap:26px;margin-left:auto;flex-wrap:wrap">' +
                '<div><div class="kpi-lab">Площадок в выдаче</div><div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' +
                  Math.round(1482 * Math.min(1, k / 1.2)) + '</div></div>' +
                '<div><div class="kpi-lab">Вы выкупаете сейчас</div><div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' +
                  Math.round(Math.min(60, 8 + bid * 6)) + '%</div></div>' +
                '<div><div class="kpi-lab">Средний CR по вертикали</div><div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">2.31%</div></div>' +
              '</div></div>' +
            '<div class="plot"><svg width="100%" height="200" viewBox="0 0 1104 200" fill="none" font-family="Archivo, sans-serif" aria-label="Доступный объём в зависимости от ставки">' +
              grid +
              '<path d="' + area + '" fill="#8368F7" fill-opacity="0.10"/>' +
              '<polyline points="' + line + '" fill="none" stroke="#8368F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '<line x1="' + vx(bid).toFixed(1) + '" y1="16" x2="' + vx(bid).toFixed(1) + '" y2="164" stroke="#A48FFF" stroke-width="1" stroke-dasharray="3 3"/>' +
              '<circle cx="' + vx(bid).toFixed(1) + '" cy="' + vy(vol(bid)).toFixed(1) + '" r="4.5" fill="#8368F7" stroke="#13161C" stroke-width="2"/>' +
              xt + '</svg></div>' +
            '<div class="hint">По горизонтали — ставка, по вертикали — показы в сутки. Пунктир — ваша текущая ставка.</div>' +
          '</div></div>' +

        '<div class="table">' +
          '<div class="tr thead" style="grid-template-columns:minmax(0,1fr) 78px 130px 130px 110px 92px 180px">' +
            '<div class="th">Страна</div><div class="th">Код</div><div class="th r">Показов в сутки</div>' +
            '<div class="th r">Рекомендуемая ставка</div><div class="th r">Площадок</div>' +
            '<div class="th r">Средний CR</div><div class="th">Свободный объём</div></div>' +
          rows +
          '<div class="foot"><span>Показано 7 стран из 34 по выбранному региону</span>' +
          '<span style="margin-left:auto">Оценка обновляется раз в час</span></div>' +
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
    inputs: {
      bid: function (v) { Store.ui('volBid', v); }
    }
  };
})(window);
