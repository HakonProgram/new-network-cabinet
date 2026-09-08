/* Campaign list: filters, full performance columns, campaign controls. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { key: 'all',    label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'test',   label: 'Test' },
    { key: 'review', label: 'Auto-check' },
    { key: 'paused', label: 'Stopped' }
  ];
  var MODELS = ['all', 'CPA', 'Pure CPA', 'CPM', 'Smart CPM', 'CPC'];
  var COLS = '84px minmax(220px,1fr) 92px 108px 78px 62px 66px 84px 88px 78px 70px 68px 76px 118px';
  var MINW = 'min-width:1460px';

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
    var m = UI.metrics(c);
    var noData = !c.impr;
    var dash = function (v) { return noData ? '—' : v; };
    var runCls = !controllable ? 'act' : (running ? 'act act-stop' : 'act act-run');
    var runTitle = !controllable ? 'Controls unavailable' : (running ? 'Stop' : 'Start');

    return '<div class="tr row' + (running ? '' : ' off') + '" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
      '<div class="cid mono">NN-C-' + esc(c.id) + '</div>' +
      '<div style="min-width:0">' +
        '<div class="cname">' + esc(c.name) + '</div>' +
        '<div class="cmeta"><span class="cid">' + esc(c.format) + '</span>' +
        '<span class="tag' + (c.adult ? ' tag-18' : '') + '">' + esc(c.vertical) + '</span></div></div>' +
      '<div><span class="model">' + esc(c.model) + '</span></div>' +
      '<div class="status"><span class="dot" style="background:' + meta.color + '"></span>' +
        '<span style="color:' + meta.ink + '">' + meta.label + '</span></div>' +
      '<div class="cell muted r">' + dash(m.impr) + '</div>' +
      '<div class="cell muted r">' + dash(m.ctr) + '</div>' +
      '<div class="cell w r">' + dash(m.conv) + '</div>' +
      '<div class="cell w r">' + dash(m.cost) + '</div>' +
      '<div class="cell r">' + dash(m.revenue) + '</div>' +
      '<div class="cell w r" style="color:' + m.roiColor + '">' + dash(m.roi) + '</div>' +
      '<div class="cell muted r">' + m.cpa + '</div>' +
      '<div class="cell muted r">' + dash(m.cpm) + '</div>' +
      '<div class="cell muted r">' + dash(m.win) + '</div>' +
      '<div class="acts">' +
        '<div class="' + runCls + '" data-act="toggle" data-arg="' + c.id + '" title="' + runTitle + '">' +
          icon(running ? 'pause' : 'play', 12) + '</div>' +
        '<div class="act" data-act="dup" data-arg="' + c.id + '" title="Duplicate">' + icon('copy', 13, 1.9) + '</div>' +
        '<div class="act" data-act="edit" data-arg="' + c.id + '" title="Edit">' + icon('edit', 13, 1.9) + '</div>' +
        '<div class="act act-chart" data-act="stats" data-arg="' + c.id + '" title="Statistics">' + icon('chart', 13, 1.9) + '</div>' +
      '</div>' +
    '</div>';
  }

  w.Screens = w.Screens || {};
  w.Screens.campaigns = {
    render: function () {
      var s = Store.get(), rows = visible();
      var t = UI.sum(s.campaigns);
      var tm = UI.metrics({ impr: t.impr, clicks: t.clicks, conv: t.conv, cost: t.cost,
                            revenue: t.revenue, winRate: t.cost ? t.wSum / t.cost : 0 });
      var vt = UI.sum(rows);
      var vm = UI.metrics({ impr: vt.impr, clicks: vt.clicks, conv: vt.conv, cost: vt.cost,
                            revenue: vt.revenue, winRate: vt.cost ? vt.wSum / vt.cost : 0 });

      var tabs = TABS.map(function (x) {
        var n = x.key === 'all' ? s.campaigns.length
          : s.campaigns.filter(function (c) { return c.status === x.key; }).length;
        return '<div class="seg' + (s.ui.campStatus === x.key ? ' on' : '') + '" data-act="tab" data-arg="' + x.key + '">' +
          '<span>' + x.label + '</span><span class="seg-n">' + n + '</span></div>';
      }).join('');

      var chips = MODELS.map(function (m) {
        return '<div class="chip' + (s.ui.campModel === m ? ' on' : '') + '" data-act="model" data-arg="' + esc(m) + '">' +
          (m === 'all' ? 'All models' : m) + '</div>';
      }).join('');

      var kpi = function (lab, val, sub, color) {
        return '<div class="kpi tight"><div class="kpi-lab">' + lab + '</div>' +
          '<div class="kpi-val num"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</div>' +
          '<div class="hint">' + sub + '</div></div>';
      };

      var heads = ['Campaign ID', 'Campaign', 'Model', 'Status', 'Impr.', 'CTR', 'Conv.',
                   'Cost', 'Revenue', 'ROI', 'CPA', 'CPM', 'Win rate', ''];
      var align = ['', '', '', '', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', ''];

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Campaigns</h1>' +
          '<p class="sub">One campaign, one request — the system distributes it on its own. Figures for the last 7 days.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto;height:36px" data-go="campaigns/new">' +
            icon('plus', 14, 2.4) + 'Create campaign</button>' +
        '</div>' +

        '<div class="kpis k6">' +
          kpi('Cost', tm.cost, 'last 7 days') +
          kpi('Revenue', tm.revenue, 'reported via postback') +
          kpi('Profit', tm.profit, 'revenue minus cost', tm.profitColor) +
          kpi('ROI', tm.roi, 'across all campaigns', tm.roiColor) +
          kpi('Conversions', tm.conv, 'avg CPA ' + tm.cpa) +
          kpi('Win rate', tm.win, 'avg CPM ' + tm.cpm) +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<div class="chips" style="margin-left:auto">' + chips + '</div>' +
        '</div>' +

        '<div class="table">' +
          '<div class="table-scroll">' +
            '<div class="tr thead" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
              heads.map(function (h, i) { return '<div class="th ' + align[i] + '">' + h + '</div>'; }).join('') +
            '</div>' +
            (rows.length
              ? '<div class="tr totals" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
                  '<div class="tot-lab">Total</div>' +
                  '<div class="cell muted">' + rows.length + ' ' + UI.plural(rows.length, 'campaign', 'campaigns') + ' shown</div>' +
                  '<div></div><div></div>' +
                  '<div class="cell r">' + vm.impr + '</div><div class="cell r">' + vm.ctr + '</div>' +
                  '<div class="cell r">' + vm.conv + '</div><div class="cell r">' + vm.cost + '</div>' +
                  '<div class="cell r">' + vm.revenue + '</div>' +
                  '<div class="cell r" style="color:' + vm.roiColor + '">' + vm.roi + '</div>' +
                  '<div class="cell r">' + vm.cpa + '</div><div class="cell r">' + vm.cpm + '</div>' +
                  '<div class="cell r">' + vm.win + '</div><div></div>' +
                '</div>' + rows.map(rowHtml).join('')
              : '<div class="empty">No campaigns match these filters</div>') +
          '</div>' +
          '<div class="foot"><span>Showing ' + rows.length + ' of ' + s.campaigns.length + ' campaigns · last 7 days</span>' +
          '<span style="margin-left:auto">Data refreshes hourly</span></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      tab: function (key) { Store.ui('campStatus', key); },
      model: function (key) { Store.ui('campModel', key); },

      toggle: function (id) {
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c || c.status === 'review' || c.status === 'done') return;
          if (c.status === 'paused') { c.status = c.wasTest ? 'test' : 'active'; }
          else { c.wasTest = c.status === 'test'; c.status = 'paused'; }
        });
        var c = Store.get().campaigns.find(function (x) { return x.id === id; });
        App.toast(c.status === 'paused' ? 'Campaign stopped' : 'Campaign started');
      },

      dup: function (id) {
        var newId;
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          newId = String(4900 + s.campaigns.length);
          s.campaigns.unshift(Object.assign({}, c, {
            id: newId, name: c.name + ' — copy', status: 'paused',
            impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, winRate: 0
          }));
        });
        App.toast('Copy NN-C-' + newId + ' created — it is stopped');
      },

      edit: function (id) {
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          var model = DATA.PAY_MODELS.find(function (m) { return m.name === c.model; });
          s.draft = Object.assign(Store.seedDraft(), {
            name: c.name, format: c.format, vertical: c.vertical,
            age: c.adult ? 'Adult' : 'Mainstream',
            model: model ? model.key : 'smartcpm',
            editingId: c.id
          });
        });
        App.go('campaigns/new');
      },

      stats: function (id) {
        Store.set(function (s) { s.ui.statsTab = 'campaigns'; });
        App.go('stats');
        App.toast('Report for campaign NN-C-' + id);
      }
    }
  };
})(window);
