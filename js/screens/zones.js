/* Площадки: управление выдачей по нашим номерам. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var COLS = '106px 100px 112px 84px 80px 84px 72px 124px minmax(0,1fr)';
  var TABS = [
    { k: 'work',    label: 'В работе' },
    { k: 'robot',   label: 'Отключены роботом' },
    { k: 'blocked', label: 'Заблокированы вами' },
    { k: 'groups',  label: 'Группы' }
  ];
  var META = {
    work:    { label: 'В работе',           pill: 'pill pill-ok' },
    robot:   { label: 'Отключена роботом',  pill: 'pill pill-wait' },
    blocked: { label: 'Заблокирована вами', pill: 'pill pill-bad' }
  };
  var TARGET_CPA = 11.24;

  function stateOf(z) {
    if (Store.get().blockedZones[z.id]) return 'blocked';
    return z.robot ? 'robot' : 'work';
  }

  function rowHtml(z) {
    var s = Store.get(), st = stateOf(z);
    var cpa = z.conv > 0 ? z.spend / z.conv : 0;
    var color = z.conv === 0 ? '#6A7180'
      : (cpa > TARGET_CPA * 1.4 ? '#f07575' : (cpa < TARGET_CPA * 0.8 ? '#3ad13a' : '#9AA1AE'));
    var blocked = st === 'blocked';
    var scaled = !!s.scaledZones[z.id];

    return '<div class="tr row' + (st === 'work' ? '' : ' off') + (blocked ? ' blocked' : '') +
      '" style="grid-template-columns:' + COLS + '">' +
      '<div class="cell mono w">' + z.id + '</div>' +
      '<div class="cell"><span class="dot" style="background:' + (z.cat === '18+' ? '#DA69B9' : '#009FAE') + '"></span>' + z.cat + '</div>' +
      '<div class="cell muted">' + z.vertical + '</div>' +
      '<div class="cell muted r">' + UI.compact(z.impr) + '</div>' +
      '<div class="cell w r">' + UI.int(z.conv) + '</div>' +
      '<div class="cell w r">' + UI.money(z.spend) + '</div>' +
      '<div class="cell r" style="color:' + color + '">' + UI.cpa(z.spend, z.conv) + '</div>' +
      '<div><span class="' + META[st].pill + '">' + META[st].label + '</span></div>' +
      '<div class="acts">' +
        '<button class="btn btn-xs btn-up' + (scaled ? ' on' : '') + '" data-act="scale" data-arg="' + z.id + '">' +
          (scaled ? 'Объём ×2' : 'Масштабировать') + '</button>' +
        '<button class="btn btn-xs btn-danger" data-act="block" data-arg="' + z.id + '">' +
          (blocked ? 'Разблокировать' : 'Заблокировать') + '</button>' +
      '</div>' +
    '</div>';
  }

  w.Screens = w.Screens || {};
  w.Screens.zones = {
    render: function () {
      var s = Store.get(), tab = s.ui.zonesTab, cat = s.ui.zonesCat;
      var blockedCount = Object.keys(s.blockedZones).length;

      var rows = DATA.ZONES
        .filter(function (z) { return cat === 'all' || z.cat === cat; })
        .filter(function (z) { return tab === 'groups' || stateOf(z) === tab; });

      var tabs = TABS.map(function (t) {
        var n = t.k === 'groups' ? DATA.GROUPS.length
          : DATA.ZONES.filter(function (z) { return stateOf(z) === t.k; }).length;
        return '<div class="seg' + (tab === t.k ? ' on' : '') + '" data-act="tab" data-arg="' + t.k + '">' +
          '<span>' + t.label + '</span><span class="seg-n">' + n + '</span></div>';
      }).join('');

      var cats = ['all', 'Обычная', '18+'].map(function (c) {
        return '<div class="opt' + (cat === c ? ' on' : '') + '" data-act="cat" data-arg="' + esc(c) + '">' +
          (c === 'all' ? 'Все категории' : c) + '</div>';
      }).join('');

      var kpi = function (lab, val, hint) {
        return '<div class="kpi"><div class="kpi-lab">' + lab + '</div><div class="kpi-val num">' + val + '</div>' +
          '<div class="hint">' + hint + '</div></div>';
      };

      var body;
      if (tab === 'groups') {
        body = '<div class="card"><div class="card-h"><div class="card-t">Группы площадок</div>' +
          '<div class="card-s">Одну группу можно применить сразу к нескольким кампаниям</div></div>' +
          '<div class="card-b" style="gap:10px">' +
            DATA.GROUPS.map(function (g) {
              return '<div class="grp"><div class="grp-ic">' + icon('zones', 17) + '</div>' +
                '<div><div class="grp-n">' + esc(g.name) + '</div><div class="grp-d">' + esc(g.meta) + '</div></div>' +
                '<span class="' + g.pill + '" style="margin-left:auto">' + g.kind + '</span>' +
                '<button class="btn btn-xs" data-act="soon">Изменить</button>' +
                '<button class="btn btn-xs" data-act="soon">Применить к кампаниям</button></div>';
            }).join('') +
            '<div class="note" style="margin-top:6px">' + icon('info', 15, 2) +
              '<p><b>Списки площадок уже вычищены до старта.</b> Группы нужны, когда вы хотите сузить выдачу ' +
              'под свой оффер — робот продолжит чистить внутри группы.</p></div>' +
          '</div></div>';
      } else {
        body = '<div class="table">' +
          '<div class="tr thead" style="grid-template-columns:' + COLS + '">' +
            '<div class="th">ID площадки</div><div class="th">Категория</div><div class="th">Вертикаль</div>' +
            '<div class="th r">Показы</div><div class="th r">Конв.</div><div class="th r">Расход</div>' +
            '<div class="th r">CPA</div><div class="th">Статус</div><div class="th"></div>' +
          '</div>' +
          (rows.length ? rows.map(rowHtml).join('') : '<div class="empty">В этом разрезе площадок нет</div>') +
          '<div class="foot"><span>Показано ' + rows.length + ' ' +
            UI.plural(rows.length, 'площадка', 'площадки', 'площадок') + ' из 1 482</span>' +
            '<span style="margin-left:auto">Блокировка применяется ко всем вашим кампаниям</span></div>' +
        '</div>';
      }

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Площадки</h1>' +
          '<p class="sub">Все площадки под нумерацией сети. Блокировка и масштабирование идут по этим номерам.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto" data-act="soon">' +
            icon('plus', 14, 2.4) + 'Создать группу</button></div>' +

        '<div class="kpis">' +
          kpi('Площадок в выдаче', '1 482', 'проверены до старта кампаний') +
          kpi('Отключено роботом', '214', 'за последние 30 дней') +
          kpi('Заблокировано вами', String(blockedCount), 'блокировка действует на все кампании') +
          kpi('Групп площадок', String(DATA.GROUPS.length), 'применяются к кампаниям целиком') +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<div class="opts" style="margin-left:auto">' + cats + '</div>' +
          '<button class="btn btn-sm" data-act="csv">' + icon('download', 13, 1.9) + 'CSV</button>' +
        '</div>' + body +
      '</div>';
    },

    actions: {
      tab: function (v) { Store.ui('zonesTab', v); },
      cat: function (v) { Store.ui('zonesCat', v); },
      soon: function () { App.toast('В прототипе этот шаг не реализован'); },
      csv: function () { App.toast('В прототипе выгрузка не формируется'); },

      block: function (id) {
        var nowBlocked;
        Store.set(function (s) {
          if (s.blockedZones[id]) { delete s.blockedZones[id]; nowBlocked = false; }
          else { s.blockedZones[id] = true; nowBlocked = true; }
        });
        App.toast(nowBlocked ? 'Площадка ' + id + ' заблокирована во всех кампаниях'
                             : 'Площадка ' + id + ' разблокирована');
      },
      scale: function (id) {
        var on;
        Store.set(function (s) {
          if (s.scaledZones[id]) { delete s.scaledZones[id]; on = false; }
          else { s.scaledZones[id] = true; on = true; }
        });
        App.toast(on ? 'Объём на ' + id + ' удвоен' : 'Масштабирование ' + id + ' снято');
      }
    }
  };
})(window);
