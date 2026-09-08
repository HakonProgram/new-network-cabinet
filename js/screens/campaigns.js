/* Campaign list: filters, full performance columns, campaign controls. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'test',     label: 'Test' },
    { key: 'review',   label: 'Pending' },
    { key: 'paused',   label: 'Stopped' },
    { key: 'archived', label: 'Archived' }
  ];
  var MODELS = ['all', 'CPA', 'Pure CPA', 'CPM', 'Smart CPM', 'CPC'];
  /* min-width = сумма колонок + 12px на зазор + 32px отступов. */
  var COLS = '30px 32px 64px minmax(180px,1fr) 88px 112px 76px 68px 86px 74px 136px';
  var MINW = '';
  function minw() { if (!MINW) MINW = UI.gridMin(COLS); return MINW; }

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
    var archived = c.status === 'archived';
    var m = UI.metrics(c);
    var noData = !c.impr;
    var dash = function (v) { return noData ? '—' : v; };
    var picked = selected().indexOf(c.id) >= 0;
    var runCls = !controllable ? 'act act-off' : (running ? 'act act-stop' : 'act act-run');
    var runTitle = !controllable
      ? (c.status === 'review' ? 'Pending the auto-check — starts by itself once it passes' : 'Controls unavailable')
      : (running ? 'Stop campaign' : 'Start campaign');

    return '<div class="tr row clickable' + (running ? '' : ' off') + (picked ? ' picked' : '') +
      '" data-act="pick" data-arg="' + c.id + '" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
      '<div class="box' + (picked ? ' on' : '') + '"></div>' +
      '<div class="' + runCls + '" data-act="toggle" data-arg="' + c.id + '" title="' + runTitle + '">' +
        icon(running ? 'pause' : 'play', 12) + '</div>' +
      '<div class="cid mono">' + esc(c.id) + '</div>' +
      '<div style="min-width:0">' +
        '<div class="cname">' + esc(c.name) + '</div>' +
        '<div class="cmeta"><span class="cid">' + esc(c.format) + '</span>' +
        '<span class="tag' + (c.adult ? ' tag-18' : '') + '">' + esc(c.vertical) + '</span></div></div>' +
      '<div><span class="model">' + esc(c.model) + '</span></div>' +
      '<div class="status"><span class="dot' + (c.status === 'review' ? ' pulse' : '') +
        '" style="background:' + UI.tone(meta.tone) + '"></span><span>' + meta.label + '</span></div>' +
      '<div class="cell muted r">' + dash(m.impr) + '</div>' +
      '<div class="cell w r">' + dash(m.conv) + '</div>' +
      '<div class="cell w r">' + dash(m.cost) + '</div>' +
      '<div class="cell w r" style="color:' + m.roiColor + '">' + dash(m.roi) + '</div>' +
      '<div class="acts">' +
        '<div class="act" data-act="dup" data-arg="' + c.id + '" title="Duplicate">' + icon('copy', 13, 1.9) + '</div>' +
        '<div class="act" data-act="edit" data-arg="' + c.id + '" title="Edit">' + icon('edit', 13, 1.9) + '</div>' +
        '<div class="act act-chart" data-act="stats" data-arg="' + c.id + '" title="Open report">' + icon('chart', 13, 1.9) + '</div>' +
        '<div class="act" data-act="' + (archived ? 'restore' : 'archive') + '" data-arg="' + c.id +
          '" title="' + (archived ? 'Restore from archive' : 'Archive') + '">' +
          icon(archived ? 'unarchive' : 'archive', 13, 1.9) + '</div>' +
      '</div>' +
    '</div>';
  }

  function selected() { return Store.get().ui.campSelection; }

  /* Провалиться в кампанию: отчёт, сужённый до неё. */
  function openReport(id) {
    var c = Store.get().campaigns.find(function (x) { return x.id === id; });
    Store.set(function (s) {
      s.ui.statsForm.campaign = id;
      s.ui.statsApplied.campaign = id;
    });
    App.go('stats');
    App.toast('Report for ' + (c ? c.name : 'NN-C-' + id));
  }

  w.Screens = w.Screens || {};
  w.Screens.campaigns = {
    render: function () {
      var s = Store.get(), rows = visible(), sel = selected();
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
      var bulk = '';
      if (sel.length) {
        var picked = s.campaigns.filter(function (c) { return sel.indexOf(c.id) >= 0; });
        var canStart = picked.filter(function (c) { return c.status === 'paused'; }).length;
        var canStop = picked.filter(function (c) { return c.status === 'active' || c.status === 'test'; }).length;
        bulk = '<div class="bulk">' +
          '<span class="bulk-n">' + sel.length + ' selected</span>' +
          '<button class="btn btn-xs btn-up" data-act="startSel"' + (canStart ? '' : ' disabled') + '>' +
            icon('play', 11) + 'Start' + (canStart ? ' ' + canStart : '') + '</button>' +
          '<button class="btn btn-xs btn-danger" data-act="stopSel"' + (canStop ? '' : ' disabled') + '>' +
            icon('pause', 11) + 'Stop' + (canStop ? ' ' + canStop : '') + '</button>' +
          '<button class="btn btn-xs" data-act="dupSel">' + icon('copy', 11, 1.9) + 'Duplicate</button>' +
          '<button class="btn btn-xs" data-act="archiveSel">' + icon('archive', 11, 1.9) + 'Archive</button>' +
          (sel.length === 1
            ? '<button class="btn btn-xs" data-act="reportSel">' + icon('chart', 11, 1.9) + 'Open report</button>'
            : '') +
          '<button class="btn btn-xs btn-ghost" style="margin-left:auto" data-act="clearSel">Clear</button>' +
        '</div>';
      }

      var statbar = '<div class="stats">' +
        stat('Spend', tm.cost, 'last 7 days') +
        stat('Revenue', tm.revenue, 'reported via postback') +
        stat('Profit', tm.profit, 'revenue minus spend', tm.profitColor) +
        stat('ROI', tm.roi, 'return on ad spend', tm.roiColor) +
        stat('Conversions', tm.conv, 'avg CPA ' + tm.cpa) +
      '</div>';

      var heads = ['', '', 'ID', 'Campaign', 'Model', 'Status', 'Impr.', 'Conv.', 'Cost', 'ROI', ''];
      var align = ['', '', '', '', '', '', 'r', 'r', 'r', 'r', ''];

      return '<div class="page">' +
        '<div class="head">' +
          '<div><h1 class="h1">Campaigns</h1></div>' +
          '<button class="btn btn-pri" style="margin-left:auto;height:36px" data-go="campaigns/new">' +
            icon('plus', 14, 2.4) + 'Create campaign</button>' +
        '</div>' +

        statbar +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          '<div class="chips" style="margin-left:auto">' + chips + '</div>' +
        '</div>' +

        bulk +
        '<div class="table pin-end">' +
          '<div class="table-scroll">' +
            '<div class="tr thead" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
              heads.map(function (h, i) {
                if (i === 0) {
                  var all = rows.length > 0 && sel.length === rows.length;
                  return '<div class="box' + (all ? ' on' : '') + '" data-act="pickAll"></div>';
                }
                return '<div class="th ' + align[i] + '">' + h + '</div>';
              }).join('') +
            '</div>' +
            (rows.length
              ? '<div class="tr totals" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
                  '<div></div><div></div><div class="tot-lab">Total</div>' +
                  '<div class="cell muted">' + rows.length + ' ' + UI.plural(rows.length, 'campaign', 'campaigns') + ' shown</div>' +
                  '<div></div><div></div>' +
                  '<div class="cell r">' + vm.impr + '</div>' +
                  '<div class="cell r">' + vm.conv + '</div>' +
                  '<div class="cell r">' + vm.cost + '</div>' +
                  '<div class="cell r" style="color:' + vm.roiColor + '">' + vm.roi + '</div>' +
                  '<div></div>' +
                '</div>' + rows.map(rowHtml).join('')
              : '<div class="empty">No campaigns match these filters</div>') +
          '</div>' +
          '<div class="foot"><span>Showing ' + rows.length + ' of ' + s.campaigns.length + ' campaigns · last 7 days</span>' +
          '<span style="margin-left:auto">Data refreshes hourly</span></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      tab: function (key) { Store.set(function (s) { s.ui.campStatus = key; s.ui.campSelection = []; }); },
      model: function (key) { Store.set(function (s) { s.ui.campModel = key; s.ui.campSelection = []; }); },

      pick: function (id) {
        Store.set(function (s) {
          var i = s.ui.campSelection.indexOf(id);
          if (i >= 0) s.ui.campSelection.splice(i, 1); else s.ui.campSelection.push(id);
        });
      },
      pickAll: function () {
        var ids = visible().map(function (c) { return c.id; });
        var all = selected().length === ids.length && ids.length > 0;
        Store.set(function (s) { s.ui.campSelection = all ? [] : ids; });
      },
      clearSel: function () { Store.set(function (s) { s.ui.campSelection = []; }); },

      /* Все изменения кампаний идут через Api: экран только просит и показывает итог. */
      startSel: function () {
        var ids = selected();
        Api.campaigns.bulk({ action: 'start', ids: ids }).then(function (r) {
          App.toast(r.affected
            ? r.affected + ' ' + UI.plural(r.affected, 'campaign', 'campaigns') + ' started'
            : 'Nothing to start');
        });
      },
      stopSel: function () {
        var ids = selected();
        Api.campaigns.bulk({ action: 'stop', ids: ids }).then(function (r) {
          App.toast(r.affected
            ? r.affected + ' ' + UI.plural(r.affected, 'campaign', 'campaigns') + ' stopped'
            : 'Nothing to stop');
        });
      },
      dupSel: function () {
        var ids = selected();
        Api.campaigns.bulk({ action: 'duplicate', ids: ids }).then(function (r) {
          Store.ui('campSelection', []);
          App.toast(r.affected + ' ' + UI.plural(r.affected, 'copy', 'copies') + ' created — stopped');
        });
      },
      archiveSel: function () {
        var ids = selected();
        Api.campaigns.bulk({ action: 'archive', ids: ids }).then(function (r) {
          Store.ui('campSelection', []);
          App.toast(r.affected + ' ' + UI.plural(r.affected, 'campaign', 'campaigns') + ' archived');
        });
      },
      reportSel: function () {
        var id = selected()[0];
        Store.ui('campSelection', []);
        openReport(id);
      },

      toggle: function (id) {
        Api.campaigns.bulk({ action: 'toggle', ids: [id] }).then(function (r) {
          if (!r.campaign) return;
          App.toast(r.campaign.status === 'paused' ? 'Campaign stopped' : 'Campaign started');
        });
      },

      dup: function (id) {
        Api.campaigns.bulk({ action: 'duplicate', ids: [id] }).then(function (r) {
          if (r.campaign) App.toast('Copy NN-C-' + r.campaign.id + ' created — it is stopped');
        });
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
        Api.campaigns.bulk({ action: 'archive', ids: [id] }).then(function (r) {
          if (r.campaign) App.toast('\u201c' + r.campaign.name + '\u201d archived — it no longer spends');
        });
      },
      restore: function (id) {
        Api.campaigns.bulk({ action: 'restore', ids: [id] }).then(function (r) {
          if (r.campaign) App.toast('\u201c' + r.campaign.name + '\u201d restored — stopped, start it when ready');
        });
      }
    }
  };
})(window);
