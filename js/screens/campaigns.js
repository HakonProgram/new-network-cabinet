/* Список кампаний: фильтры, базовая стата, управление кампанией. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { key: 'all',    label: 'Все' },
    { key: 'active', label: 'Активные' },
    { key: 'test',   label: 'Тест' },
    { key: 'review', label: 'На автопроверке' },
    { key: 'paused', label: 'Остановлены' }
  ];
  var MODELS = ['all', 'CPA', 'Pure CPA', 'CPM', 'Smart CPM', 'CPC'];
  var COLS = '24px 88px minmax(0,1fr) 92px 118px 80px 74px 84px 70px 126px';

  function visible() {
    var s = Store.get(), st = s.ui.campStatus, md = s.ui.campModel;
    return s.campaigns.filter(function (c) {
      return (st === 'all' || c.status === st) && (md === 'all' || c.model === md);
    });
  }

  function rowHtml(c) {
    var meta = DATA.STATUS[c.status];
    var running = c.status === 'active' || c.status === 'test';
    var controllable = c.status !== 'review' && c.status !== 'done';
    var noData = !c.impr;
    var runCls = !controllable ? 'act' : (running ? 'act act-stop' : 'act act-run');
    var runTitle = !controllable ? 'Управление недоступно' : (running ? 'Остановить' : 'Запустить');

    return '<div class="tr row' + (running ? '' : ' off') + '" style="grid-template-columns:' + COLS + '">' +
      '<div class="box" data-act="noop"></div>' +
      '<div class="cid mono">NN-C-' + esc(c.id) + '</div>' +
      '<div style="min-width:0">' +
        '<div class="cname">' + esc(c.name) + '</div>' +
        '<div class="cmeta"><span class="cid">' + esc(c.format) + '</span>' +
        '<span class="tag' + (c.adult ? ' tag-18' : '') + '">' + esc(c.vertical) + '</span></div>' +
      '</div>' +
      '<div><span class="model">' + esc(c.model) + '</span></div>' +
      '<div class="status"><span class="dot" style="background:' + meta.color + '"></span>' +
        '<span style="color:' + meta.ink + '">' + meta.label + '</span></div>' +
      '<div class="cell muted r">' + (noData ? '—' : UI.compact(c.impr)) + '</div>' +
      '<div class="cell w r">' + (noData ? '—' : UI.int(c.conv)) + '</div>' +
      '<div class="cell w r">' + (noData ? '—' : UI.money(c.spend)) + '</div>' +
      '<div class="cell muted r">' + UI.cpa(c.spend, c.conv) + '</div>' +
      '<div class="acts">' +
        '<div class="' + runCls + '" data-act="toggle" data-arg="' + c.id + '" title="' + runTitle + '">' +
          icon(running ? 'pause' : 'play', 12) + '</div>' +
        '<div class="act" data-act="dup" data-arg="' + c.id + '" title="Дублировать">' + icon('copy', 13, 1.9) + '</div>' +
        '<div class="act" data-act="edit" data-arg="' + c.id + '" title="Редактировать">' + icon('edit', 13, 1.9) + '</div>' +
        '<div class="act act-chart" data-act="stats" data-arg="' + c.id + '" title="Статистика">' + icon('chart', 13, 1.9) + '</div>' +
      '</div>' +
    '</div>';
  }

  w.Screens = w.Screens || {};
  w.Screens.campaigns = {
    render: function () {
      var s = Store.get(), rows = visible();
      var totals = s.campaigns.reduce(function (a, c) {
        a.spend += c.spend; a.impr += c.impr; a.conv += c.conv; return a;
      }, { spend: 0, impr: 0, conv: 0 });

      var tabs = TABS.map(function (t) {
        var n = t.key === 'all' ? s.campaigns.length
          : s.campaigns.filter(function (c) { return c.status === t.key; }).length;
        return '<div class="seg' + (s.ui.campStatus === t.key ? ' on' : '') + '" data-act="tab" data-arg="' + t.key + '">' +
          '<span>' + t.label + '</span><span class="seg-n">' + n + '</span></div>';
      }).join('');

      var chips = MODELS.map(function (m) {
        return '<div class="chip' + (s.ui.campModel === m ? ' on' : '') + '" data-act="model" data-arg="' + esc(m) + '">' +
          (m === 'all' ? 'Все модели' : m) + '</div>';
      }).join('');

      var kpi = function (lab, val, delta, dir) {
        return '<div class="kpi"><div class="kpi-lab">' + lab + '</div>' +
          '<div class="kpi-val num">' + val + '</div>' +
          '<div class="delta" style="color:#0ca30c">' + icon(dir, 11, 3) + ' ' + delta + '</div></div>';
      };

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Кампании</h1>' +
          '<p class="sub">Одна кампания — один запрос. Дальше система распределяет её сама. Показатели за последние 7 дней.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto;height:36px" data-go="campaigns/new">' +
            icon('plus', 14, 2.4) + 'Создать кампанию</button>' +
        '</div>' +

        '<div class="kpis">' +
          kpi('Расход за 7 дней', UI.money(totals.spend), '12.4% <small>к прошлой неделе</small>', 'up') +
          kpi('Показы', UI.compact(totals.impr), '6.1% <small>к прошлой неделе</small>', 'up') +
          kpi('Конверсии', UI.int(totals.conv), '18.9% <small>к прошлой неделе</small>', 'up') +
          kpi('Средний CPA', UI.cpa(totals.spend, totals.conv), '8.2% <small>дешевле</small>', 'dn') +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<div class="chips" style="margin-left:auto">' + chips + '</div>' +
        '</div>' +

        '<div class="table">' +
          '<div class="tr thead" style="grid-template-columns:' + COLS + '">' +
            '<div class="th"></div><div class="th">ID</div><div class="th">Кампания</div>' +
            '<div class="th">Модель</div><div class="th">Статус</div>' +
            '<div class="th r">Показы</div><div class="th r">Конв.</div>' +
            '<div class="th r">Расход</div><div class="th r">CPA</div><div class="th"></div>' +
          '</div>' +
          (rows.length ? rows.map(rowHtml).join('')
                       : '<div class="empty">По выбранным фильтрам кампаний нет</div>') +
          '<div class="foot"><span>Показано ' + rows.length + ' из ' + s.campaigns.length + ' кампаний · данные за последние 7 дней</span>' +
          '<span style="margin-left:auto">Данные обновляются каждый час</span></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      noop: function () {},
      tab: function (key) { Store.ui('campStatus', key); },
      model: function (key) { Store.ui('campModel', key); },

      toggle: function (id) {
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c || c.status === 'review' || c.status === 'done') return;
          if (c.status === 'paused') {
            c.status = c.wasTest ? 'test' : 'active';
          } else {
            c.wasTest = c.status === 'test';
            c.status = 'paused';
          }
        });
        var c = Store.get().campaigns.find(function (x) { return x.id === id; });
        App.toast(c.status === 'paused' ? 'Кампания остановлена' : 'Кампания запущена');
      },

      dup: function (id) {
        var newId;
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          newId = String(4900 + s.campaigns.length);
          var copy = Object.assign({}, c, {
            id: newId, name: c.name + ' — копия', status: 'paused',
            impr: 0, conv: 0, spend: 0, ctr: 0
          });
          s.campaigns.unshift(copy);
        });
        App.toast('Создана копия NN-C-' + newId + ' — она остановлена');
      },

      edit: function (id) {
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          var model = DATA.PAY_MODELS.find(function (m) { return m.name === c.model; });
          s.draft = Object.assign(Store.seedDraft(), {
            name: c.name, format: c.format, vertical: c.vertical,
            age: c.adult ? '18+' : 'Обычная',
            model: model ? model.key : 'smartcpm',
            editingId: c.id
          });
        });
        App.go('campaigns/new');
      },

      stats: function (id) {
        Store.set(function (s) { s.ui.statsTab = 'campaigns'; });
        App.go('stats');
        App.toast('Отчёт по кампании NN-C-' + id);
      }
    }
  };
})(window);
