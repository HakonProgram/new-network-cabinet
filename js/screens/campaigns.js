/* Campaign list: filters, full performance columns, campaign controls. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'test',     label: 'Test' },
    { key: 'review',   label: 'Auto-check' },
    { key: 'paused',   label: 'Stopped' },
    { key: 'archived', label: 'Archived' }
  ];
  var MODELS = ['all', 'CPA', 'Pure CPA', 'CPM', 'Smart CPM', 'CPC'];
  var COLS = '34px 68px minmax(190px,1fr) 92px 118px 78px 70px 88px 76px 70px 126px';
  var MINW = 'min-width:1130px'; /* влезает целиком на 1440 — кнопки всегда видны */

  /* Архив живёт на своей вкладке и не мешается в общем списке. */
  function visible() {
    var s = Store.get(), st = s.ui.campStatus, md = s.ui.campModel;
    return s.campaigns.filter(function (c) {
      var byStatus = st === 'all' ? c.status !== 'archived' : c.status === st;
      return byStatus && (md === 'all' || c.model === md);
    });
  }

  function tabCount(key) {
    var all = Store.get().campaigns;
    if (key === 'all') return all.filter(function (c) { return c.status !== 'archived'; }).length;
    return all.filter(function (c) { return c.status === key; }).length;
  }

  function rowHtml(c) {
    var meta = DATA.STATUS[c.status];
    var running = c.status === 'active' || c.status === 'test';
    var controllable = c.status !== 'review' && c.status !== 'done';
    var m = UI.metrics(c);
    var noData = !c.impr;
    var dash = function (v) { return noData ? '—' : v; };
    var archived = c.status === 'archived';
    var runCls = !controllable ? 'act act-off' : (running ? 'act act-stop' : 'act act-run');
    var runTitle = !controllable
      ? (c.status === 'review' ? 'Starts by itself once the auto-check passes' : 'Controls unavailable')
      : (running ? 'Stop campaign' : 'Start campaign');

    return '<div class="tr row clickable' + (running ? '' : ' off') + '" data-act="open" data-arg="' + c.id +
      '" title="Open the report for this campaign" style="grid-template-columns:' + COLS + ';' + MINW + '">' +
      '<div class="' + runCls + '" data-act="toggle" data-arg="' + c.id + '" title="' + runTitle + '">' +
        icon(running ? 'pause' : 'play', 12) + '</div>' +
      '<div class="cid mono">' + esc(c.id) + '</div>' +
      '<div style="min-width:0">' +
        '<div class="cname">' + esc(c.name) + '</div>' +
        '<div class="cmeta"><span class="cid">' + esc(c.format) + '</span>' +
        '<span class="tag' + (c.adult ? ' tag-18' : '') + '">' + esc(c.vertical) + '</span></div></div>' +
      '<div><span class="model">' + esc(c.model) + '</span></div>' +
      '<div style="min-width:0"><div class="status"><span class="dot' + (c.status === 'review' ? ' pulse' : '') +
        '" style="background:' + meta.color + '"></span>' +
        '<span style="color:' + meta.ink + '">' + meta.label + '</span></div>' +
        (c.status === 'review' ? '<div class="cid" style="margin-top:2px">starting itself…</div>' : '') + '</div>' +
      '<div class="cell muted r">' + dash(m.impr) + '</div>' +
      '<div class="cell w r">' + dash(m.conv) + '</div>' +
      '<div class="cell w r">' + dash(m.cost) + '</div>' +
      '<div class="cell w r" style="color:' + m.roiColor + '">' + dash(m.roi) + '</div>' +
      '<div class="cell muted r">' + m.cpa + '</div>' +
      '<div class="acts">' +
        '<div class="act" data-act="dup" data-arg="' + c.id + '" title="Duplicate">' + icon('copy', 13, 1.9) + '</div>' +
        '<div class="act" data-act="edit" data-arg="' + c.id + '" title="Edit">' + icon('edit', 13, 1.9) + '</div>' +
        '<div class="act act-chart" data-act="stats" data-arg="' + c.id + '" title="Statistics">' + icon('chart', 13, 1.9) + '</div>' +
        '<div class="act" data-act="' + (archived ? 'restore' : 'archive') + '" data-arg="' + c.id +
          '" title="' + (archived ? 'Restore from archive' : 'Archive') + '">' +
          icon(archived ? 'unarchive' : 'archive', 13, 1.9) + '</div>' +
      '</div>' +
    '</div>';
  }

  /* Провалиться в кампанию: отчёт, сужённый до неё. */
  function openReport(id) {
    var c = Store.get().campaigns.find(function (x) { return x.id === id; });
    Store.set(function (s) { s.ui.statsCampaign = id; });
    App.go('stats');
    App.toast('Report for ' + (c ? c.name : 'NN-C-' + id));
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
        var n = tabCount(x.key);
        return '<div class="seg' + (s.ui.campStatus === x.key ? ' on' : '') + '" data-act="tab" data-arg="' + x.key + '">' +
          '<span>' + x.label + '</span><span class="seg-n">' + n + '</span></div>';
      }).join('');

      var chips = MODELS.map(function (m) {
        return '<div class="chip' + (s.ui.campModel === m ? ' on' : '') + '" data-act="model" data-arg="' + esc(m) + '">' +
          (m === 'all' ? 'All models' : m) + '</div>';
      }).join('');

      var stat = function (k, v, sub, color) {
        return '<div class="stat"><span class="k">' + k + '</span>' +
          '<span class="v"' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</span>' +
          '<span class="d">' + sub + '</span></div>';
      };
      var statbar = '<div class="stats">' +
        stat('Spend', tm.cost, 'last 7 days') +
        stat('Revenue', tm.revenue, 'reported via postback') +
        stat('Profit', tm.profit, 'revenue minus spend', tm.profitColor) +
        stat('ROI', tm.roi, 'return on ad spend', tm.roiColor) +
        stat('Conversions', tm.conv, 'avg CPA ' + tm.cpa) +
      '</div>';

      var heads = ['', 'ID', 'Campaign', 'Model', 'Status', 'Impr.', 'Conv.', 'Cost', 'ROI', 'CPA', ''];
      var align = ['', '', '', '', '', 'r', 'r', 'r', 'r', 'r', ''];

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Campaigns</h1>' +
          '<p class="sub">One campaign, one request — the system distributes it on its own. Last 7 days · ' +
          'click a row for the full report. New campaigns start by themselves once the auto-check passes.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto;height:36px" data-go="campaigns/new">' +
            icon('plus', 14, 2.4) + 'Create campaign</button>' +
        '</div>' +

        statbar +

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
                  '<div></div><div class="tot-lab">Total</div>' +
                  '<div class="cell muted">' + rows.length + ' ' + UI.plural(rows.length, 'campaign', 'campaigns') + ' shown</div>' +
                  '<div></div><div></div>' +
                  '<div class="cell r">' + vm.impr + '</div>' +
                  '<div class="cell r">' + vm.conv + '</div>' +
                  '<div class="cell r">' + vm.cost + '</div>' +
                  '<div class="cell r" style="color:' + vm.roiColor + '">' + vm.roi + '</div>' +
                  '<div class="cell r">' + vm.cpa + '</div><div></div>' +
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

      open: function (id) { openReport(id); },
      stats: function (id) { openReport(id); },

      archive: function (id) {
        var name;
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          name = c.name;
          c.beforeArchive = c.status;
          c.status = 'archived';
        });
        App.toast('\u201c' + name + '\u201d archived — it no longer spends');
      },
      restore: function (id) {
        var name;
        Store.set(function (s) {
          var c = s.campaigns.find(function (x) { return x.id === id; });
          if (!c) return;
          name = c.name;
          c.status = c.beforeArchive === 'archived' ? 'paused' : (c.beforeArchive || 'paused');
          if (c.status === 'review') c.status = 'paused';
          delete c.beforeArchive;
        });
        App.toast('\u201c' + name + '\u201d restored — stopped, start it when ready');
      }
    }
  };
})(window);
