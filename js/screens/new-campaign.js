/* Создание кампании: одна страница, всё под рукой. */
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

  /* Кривая доступного объёма от ставки. */
  function volumeChart(d) {
    var m = model();
    var bids = d.rates.map(function (g) { return UI.num(g.bid); }).filter(function (v) { return v > 0; });
    var topBid = bids.length ? Math.max.apply(null, bids) : UI.num(m.price);
    var maxVol = 9200000;
    var half = m.half;
    var vol = function (b) { return maxVol * Math.pow(b, 1.7) / (Math.pow(b, 1.7) + Math.pow(half, 1.7)); };

    var L = 52, R = 1096, T = 14, B = 144, W = R - L, H = B - T;
    var bMax = half * 3, pts = [], i;
    for (i = 0; i <= 48; i++) { var b = (i / 48) * bMax; pts.push([b, vol(b)]); }
    var vx = function (b) { return L + Math.min(1, b / bMax) * W; };
    var vy = function (v) { return B - (v / maxVol) * H; };

    var line = pts.map(function (p) { return vx(p[0]).toFixed(1) + ',' + vy(p[1]).toFixed(1); }).join(' ');
    var area = 'M ' + L + ' ' + B + ' L ' +
      pts.map(function (p) { return vx(p[0]).toFixed(1) + ' ' + vy(p[1]).toFixed(1); }).join(' L ') +
      ' L ' + R + ' ' + B + ' Z';

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
      svg: '<svg width="100%" height="176" viewBox="0 0 1104 176" fill="none" aria-label="Доступный объём при ставке" font-family="Archivo, sans-serif">' +
        grid +
        '<path d="' + area + '" fill="#8368F7" fill-opacity="0.10"/>' +
        '<polyline points="' + line + '" fill="none" stroke="#8368F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="' + vx(topBid).toFixed(1) + '" y1="14" x2="' + vx(topBid).toFixed(1) + '" y2="144" stroke="#A48FFF" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<circle cx="' + vx(topBid).toFixed(1) + '" cy="' + vy(vol(topBid)).toFixed(1) + '" r="4.5" fill="#8368F7" stroke="#13161C" stroke-width="2"/>' +
        xt + '</svg>'
    };
  }

  function scheduleHtml(d) {
    var days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'], h, out = '';
    var head = '<div class="grid-h"><div></div>';
    for (h = 0; h < 24; h++) head += '<div class="hh">' + (h < 10 ? '0' + h : h) + '</div>';
    head += '</div>';
    out += head;
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
          '<input class="inp num" type="text" value="' + esc(g.goal) + '" placeholder="необязательно" data-inp="goal" data-arg="' + i + '">' +
          '<input class="inp num" type="text" value="' + UI.dateShort(new Date()) + '" readonly>' +
          '<div class="del" data-act="delGeo" data-arg="' + i + '">' + icon('trash', 14, 1.9) + '</div>' +
        '</div>';
      }).join('');

      var modelRows = DATA.PAY_MODELS.map(function (x) {
        var on = x.key === d.model;
        return '<div class="mrow' + (on ? ' on' : '') + '" data-act="model" data-arg="' + x.key + '">' +
          '<div class="radio"><i></i></div>' +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:9px">' +
            '<span class="mname">' + x.name + '</span><span class="mtag">' + x.tag + '</span></div>' +
            '<div class="mdesc">' + x.desc + '</div></div>' +
          '<div class="mprice"><b>$' + x.price + '</b><span>' + x.priceLab + '</span></div>' +
        '</div>';
      }).join('');

      var tokens = DATA.TOKENS.map(function (t) {
        return '<div class="tok" data-act="copyToken" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
      }).join('');

      var checks = [
        ['Определяем тематику', esc(d.vertical) + ' · ' + (d.age === '18+' ? 'тематика 18+' : 'обычная тематика')],
        ['Проверяем на запрещённое', 'Нарушений нет'],
        ['Проверяем работоспособность ссылки', d.url ? '200 OK · 340 мс' : 'нужна ссылка'],
        ['Собираем итоговый пакет настроек', 'Готов']
      ].map(function (c) {
        return '<div class="check"><div class="check-ic">' + icon('check', 13, 3) + '</div>' +
          '<div class="check-t">' + c[0] + '</div><div class="check-r mono">' + c[1] + '</div></div>';
      });

      return '<div class="page">' +
        '<div class="head"><div>' +
          '<h1 class="h1">' + (d.editingId ? 'Редактирование кампании' : 'Новая кампания') + '</h1>' +
          '<p class="sub">Одна страница. Заполняется один раз — дальше кампания работает сама.</p></div>' +
          '<div style="margin-left:auto;display:flex;gap:10px">' +
            '<button class="btn btn-ghost" data-act="cancel">Отменить</button>' +
            '<button class="btn" data-act="draft">Сохранить черновик</button></div>' +
        '</div>' +

        /* 01 */
        '<div class="card"><div class="card-h"><div class="card-n">01</div>' +
          '<div class="card-t">Основное</div><div class="card-s">Название, формат и модель оплаты</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Название кампании</label>' +
                '<input class="inp" type="text" value="' + esc(d.name) + '" data-inp="name" placeholder="Например: Slots Royale — App Install"></div>' +
              '<div class="field"><label class="lab">Формат</label>' +
                '<div class="opts">' + opts(DATA.FORMATS, d.format, 'format') + '</div></div>' +
            '</div>' +
            '<div class="field"><label class="lab">Модель оплаты</label>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + modelRows + '</div>' +
              '<div class="hint">Сменить модель можно только до запуска кампании.</div></div>' +
            '<div class="g2">' +
              '<div class="field"><label class="lab">Вертикаль</label>' +
                '<div class="opts">' + opts(DATA.VERTICALS.slice(0, 5), d.vertical, 'vertical') + '</div></div>' +
              '<div class="field"><label class="lab">Возрастная категория</label>' +
                '<div class="opts">' + opts(['Обычная', '18+'], d.age, 'age') + '</div>' +
                '<div class="hint">Влияет на подбор площадок. Категорию система перепроверит сама на автопроверке.</div></div>' +
            '</div>' +
            '<div class="g4">' +
              '<div class="field"><label class="lab">Частота показов</label>' + sel(d.capping) + '</div>' +
              '<div class="field"><label class="lab">Старт</label>' +
                '<input class="inp num" type="text" value="' + UI.dateShort(new Date()) + ' 06:13" readonly>' +
                '<div class="hint">Время системы — UTC</div></div>' +
              '<div class="field"><label class="lab">Завершение</label>' +
                '<input class="inp num" type="text" value="" placeholder="ДД.ММ.ГГ ЧЧ:мм">' +
                '<div class="hint">Пусто — без ограничения</div></div>' +
              '<div class="field"><label class="lab">Папка</label>' + sel('Без папки', true) + '</div>' +
            '</div>' +
          '</div></div>' +

        /* 02 */
        '<div class="card"><div class="card-h"><div class="card-n">02</div>' +
          '<div class="card-t">Гео и ставки</div><div class="card-s">Отдельная ставка на каждую страну</div></div>' +
          '<div class="card-b">' +
            '<div class="rate-h"><div class="lab">Гео</div><div class="lab">' + m.bidLabel + '</div>' +
              '<div class="lab">CPA Goal, $</div><div class="lab">Старт открутки</div><div></div></div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:-8px">' + rateRows + '</div>' +
            '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
              '<button class="btn btn-sm" data-act="addGeo">' + icon('plus', 13, 2.4) + 'Добавить страну</button>' +
              '<div class="minbid">' + icon('up', 12, 2.2) + 'Минимальная ставка — $' + m.min.toFixed(2) + '</div>' +
            '</div>' +
            '<div style="border-top:1px solid #23272F;padding-top:18px">' +
              '<div class="chart-h"><div>' +
                '<div style="font-size:13px;font-weight:600">Доступный объём при вашей ставке</div>' +
                '<div class="hint">Оценка по проверенным площадкам сети за последние 7 дней</div></div>' +
                '<div style="margin-left:auto;text-align:right">' +
                  '<div class="num" style="font-size:20px;font-weight:600;letter-spacing:-0.02em">' + chart.volume + '</div>' +
                  '<div class="hint">показов в сутки при ' + chart.topBid + '</div></div></div>' +
              '<div class="plot">' + chart.svg + '</div>' +
            '</div>' +
          '</div></div>' +

        /* 03 */
        '<div class="card"><div class="card-h"><div class="card-n">03</div>' +
          '<div class="card-t">Таргетинг</div><div class="card-s">Задаётся один раз — транслируется во все источники</div></div>' +
          '<div class="card-b">' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Платформа</label>' +
                '<div class="opts">' + multi(['Desktop', 'Mobile', 'Tablet'], d.platforms, 'platform') + '</div></div>' +
              '<div class="field"><label class="lab">Операционные системы</label>' +
                '<div class="opts">' + multi(['Android', 'iOS', 'Windows', 'macOS'], d.oses, 'os') + '</div></div>' +
              '<div class="field"><label class="lab">Браузеры</label>' + sel('Все браузеры', true) + '</div>' +
            '</div>' +
            '<div class="g3">' +
              '<div class="field"><label class="lab">Язык площадки</label>' + sel('Английский, немецкий') + '</div>' +
              '<div class="field"><label class="lab">Тип подключения</label>' +
                seg2(['Все', '3G / LTE', 'Wi-Fi'], d.conn, 'conn') + '</div>' +
              '<div class="field"><label class="lab">VPN</label>' +
                seg2(['Весь трафик', 'Только VPN', 'Без VPN'], d.vpn, 'vpn') + '</div>' +
            '</div>' +
          '</div></div>' +

        /* 04 */
        '<div class="card"><div class="card-h"><div class="card-n">04</div>' +
          '<div class="card-t">Расписание показов</div><div class="card-s">Часовой пояс — UTC</div></div>' +
          '<div class="card-b">' +
            '<div>' + scheduleHtml(d) + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<button class="btn btn-sm" data-act="sch" data-arg="all">Вся неделя</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="work">Будни</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="week">Выходные</button>' +
              '<button class="btn btn-sm" data-act="sch" data-arg="clear">Очистить</button>' +
              '<span class="hint" style="margin-left:6px">Выбрано ' + picked + ' из 168 часов</span>' +
            '</div>' +
          '</div></div>' +

        /* 05 + 06 */
        '<div class="g2" style="align-items:start">' +
          '<div class="card"><div class="card-h"><div class="card-n">05</div><div class="card-t">Площадки</div></div>' +
            '<div class="card-b">' +
              '<div class="field"><label class="lab">Список площадок</label>' +
                seg2(['Белый список', 'Чёрный список'], d.listKind, 'listKind') +
                '<textarea class="inp" style="height:74px" placeholder="NN-40218, NN-39877, NN-39412" data-inp="zones">' + esc(d.zones) + '</textarea>' +
                '<div class="hint">' + (d.listKind === 'Белый список'
                  ? 'Показы пойдут только на перечисленные площадки.'
                  : 'Перечисленные площадки будут исключены.') + ' Максимум 5000 площадок.</div></div>' +
              '<div class="field"><label class="lab">Подзоны</label>' +
                '<textarea class="inp" style="height:56px" placeholder="Номера подзон через запятую" data-inp="subzones">' + esc(d.subzones) + '</textarea>' +
                '<div class="hint">Подзоны влияют на качество площадки — можно исключить точечно.</div></div>' +
            '</div></div>' +

          '<div class="card"><div class="card-h"><div class="card-n">06</div><div class="card-t">Бюджет и ссылка</div></div>' +
            '<div class="card-b">' +
              '<div class="g2">' +
                '<div class="field"><label class="lab">Дневной лимит, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.daily) + '" data-inp="daily">' +
                  '<div class="hint">Минимум $10</div></div>' +
                '<div class="field"><label class="lab">Общий бюджет, $</label>' +
                  '<input class="inp num" type="text" value="' + esc(d.total) + '" data-inp="total">' +
                  '<div class="hint">Минимум $50</div></div>' +
              '</div>' +
              '<div class="field"><label class="lab">Ссылка на предложение</label>' +
                '<input class="inp inp-mono" type="text" value="' + esc(d.url) + '" data-inp="url" placeholder="https://"></div>' +
              '<div class="field"><label class="lab">Макросы</label>' +
                '<div class="opts">' + tokens + '</div>' +
                '<div class="hint">Нажмите, чтобы скопировать и подставить в ссылку.</div></div>' +
            '</div></div>' +
        '</div>' +

        /* 07 */
        '<div class="card"><div class="card-h"><div class="card-n">07</div>' +
          '<div class="card-t">Автопроверка и запуск</div>' +
          '<div class="card-s">Проверку проходит робот — менеджер не участвует</div></div>' +
          '<div class="card-b">' +
            '<div class="g2">' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(0, 2).join('') + '</div>' +
              '<div style="display:flex;flex-direction:column;gap:8px">' + checks.slice(2).join('') + '</div>' +
            '</div>' +
            '<div class="note">' + icon('info', 15, 2) +
              '<p><b>Один запрос — вся сеть.</b> После запуска кампания уходит на проверенные площадки, ' +
              'а робот каждый час сверяет статистику: останавливает убыточные площадки, правит лимиты и ставки. ' +
              'Настраивать источники по отдельности не нужно.</p></div>' +
          '</div>' +
          '<div class="bar-row">' +
            '<div class="sumline"><span>' + (d.name ? esc(d.name) : 'Без названия') + '</span><span>·</span>' +
              '<b>' + m.name + '</b><span>·</span><b>' + d.rates.length + ' ' +
              UI.plural(d.rates.length, 'страна', 'страны', 'стран') + '</b><span>·</span>' +
              '<span>дневной лимит</span><b>$' + esc(d.daily) + '</b></div>' +
            '<button class="btn" style="margin-left:auto" data-act="draft">Сохранить черновик</button>' +
            '<button class="btn btn-pri btn-lg" data-act="launch">' + icon('play', 14) + 'Запустить кампанию</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      cancel: function () { App.go('campaigns'); },
      draft: function () { App.toast('Черновик сохранён'); },

      format:   function (v) { Store.set(function (s) { s.draft.format = v; }); },
      vertical: function (v) { Store.set(function (s) { s.draft.vertical = v; }); },
      age:      function (v) { Store.set(function (s) { s.draft.age = v; }); },
      conn:     function (v) { Store.set(function (s) { s.draft.conn = v; }); },
      vpn:      function (v) { Store.set(function (s) { s.draft.vpn = v; }); },
      listKind: function (v) { Store.set(function (s) { s.draft.listKind = v; }); },

      model: function (v) {
        Store.set(function (s) {
          s.draft.model = v;
          var m = DATA.PAY_MODELS.find(function (x) { return x.key === v; });
          s.draft.rates.forEach(function (r) { r.bid = m.price; });
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
          s.draft.rates.push({ code: next.code, name: next.name, bid: model().price, goal: '' });
        });
        if (added) App.toast(added + ' добавлена');
      },
      delGeo: function (i) {
        Store.set(function (s) { s.draft.rates.splice(Number(i), 1); });
      },

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
        App.toast('Скопировано: ' + t);
      },

      launch: function () {
        var d = Store.get().draft;
        if (!d.name.trim()) { App.toast('Укажите название кампании'); return; }
        if (!d.url.trim()) { App.toast('Укажите ссылку на предложение'); return; }
        if (!d.rates.length) { App.toast('Добавьте хотя бы одну страну'); return; }

        var m = model();
        var newId;
        Store.set(function (s) {
          newId = String(4850 + s.campaigns.length);
          s.campaigns.unshift({
            id: newId, name: d.name, format: d.format, vertical: d.vertical,
            adult: d.age === '18+', model: m.name, status: 'review',
            impr: 0, ctr: 0, conv: 0, spend: 0, bid: d.rates[0].bid
          });
          s.notifications.unshift({
            id: Date.now(), kind: 'ok', cat: 'camp', unread: true,
            title: 'Кампания принята на автопроверку',
            text: 'NN-C-' + newId + ' «' + d.name + '» · ' + m.name + ' · ' + d.rates.length + ' гео. ' +
                  'Старт сразу после проверки.',
            time: 'Только что'
          });
          s.draft = Store.seedDraft();
        });
        App.go('campaigns');
        App.toast('Кампания NN-C-' + newId + ' отправлена на автопроверку');
      }
    },

    inputs: {
      name:     function (v) { Store.patch(function (s) { s.draft.name = v; }); },
      url:      function (v) { Store.patch(function (s) { s.draft.url = v; }); },
      zones:    function (v) { Store.patch(function (s) { s.draft.zones = v; }); },
      subzones: function (v) { Store.patch(function (s) { s.draft.subzones = v; }); },
      daily:    function (v) { Store.patch(function (s) { s.draft.daily = v; }); },
      total:    function (v) { Store.patch(function (s) { s.draft.total = v; }); },
      goal:     function (v, i) { Store.patch(function (s) { s.draft.rates[Number(i)].goal = v; }); },
      bid:      function (v, i) { Store.set(function (s) { s.draft.rates[Number(i)].bid = v; }); }
    }
  };
})(window);
