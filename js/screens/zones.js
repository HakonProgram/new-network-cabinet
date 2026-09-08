/* Placements: the full inventory with results, and presets built out of it. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var COLS = '24px 104px 96px 76px 68px 54px 62px 54px 82px 86px 72px 66px 66px 72px 108px 92px';
  var MINW = '';
  function minw() { if (!MINW) MINW = UI.gridMin(COLS); return MINW; }
  var HEADS = ['', 'Zone ID', 'Category', 'Impr.', 'Clicks', 'CTR', 'Conv.', 'CR',
               'Cost', 'Revenue', 'ROI', 'CPA', 'CPM', 'Win rate', 'Status', ''];
  var ALIGN = ['', '', '', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', '', ''];
  var STATE_META = {
    live:     { label: 'Live',      pill: 'pill pill-ok' },
    robot:    { label: 'Robot off', pill: 'pill pill-wait' },
    blocked:  { label: 'Turned off', pill: 'pill pill-bad' },
    campaign: { label: 'Off in a campaign', pill: 'pill pill-bad' }
  };
  var SORTS = [
    { k: 'cost', label: 'Cost' },
    { k: 'roi',  label: 'ROI' },
    { k: 'conv', label: 'Conversions' }
  ];

  function stateOf(z) { return Store.zoneState(z, null); }
  function presetsOf(id) {
    return Store.get().presets.filter(function (p) { return p.zones.indexOf(id) >= 0; });
  }
  function selected() { return Store.get().selection; }

  function filtered() {
    var u = Store.get().ui;
    var rows = DATA.ZONES.filter(function (z) {
      if (u.zonesCat !== 'all' && z.cat !== u.zonesCat) return false;
      if (u.zonesTab === 'live' || u.zonesTab === 'robot' || u.zonesTab === 'blocked') {
        if (stateOf(z) !== u.zonesTab) return false;
      }
      return true;
    });
    var by = u.zonesSort;
    return rows.slice().sort(function (a, b) {
      if (by === 'roi') return UI.roi(b.revenue, b.cost).value - UI.roi(a.revenue, a.cost).value;
      if (by === 'conv') return b.conv - a.conv;
      return b.cost - a.cost;
    });
  }

  function rowHtml(z) {
    var st = stateOf(z), m = UI.metrics(z);
    var picked = selected().indexOf(z.id) >= 0;
    var inPresets = presetsOf(z.id);
    var blocked = st !== 'live';
    var on = st === 'live';

    return '<div class="tr row' + (st === 'live' ? '' : ' off') + (blocked ? ' blocked' : '') +
      '" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
      '<div class="stick stick-l1"><div class="box' + (picked ? ' on' : '') +
        '" data-act="pick" data-arg="' + z.id + '"></div></div>' +
      '<div class="stick stick-l2" style="min-width:0"><div class="cell mono w">' + z.id + '</div>' +
        (inPresets.length ? '<div class="cid" style="margin-top:2px">in ' + inPresets.length + ' ' +
          UI.plural(inPresets.length, 'preset', 'presets') + '</div>' : '') + '</div>' +
      '<div class="cell"><span class="dot" style="background:' + (z.cat === 'Adult' ? '' + UI.color('--warn') + '' : '' + UI.color('--info') + '') + '"></span>' + z.cat + '</div>' +
      '<div class="cell muted r">' + m.impr + '</div>' +
      '<div class="cell muted r">' + m.clicks + '</div>' +
      '<div class="cell muted r">' + m.ctr + '</div>' +
      '<div class="cell w r">' + m.conv + '</div>' +
      '<div class="cell muted r">' + m.cr + '</div>' +
      '<div class="cell w r">' + m.cost + '</div>' +
      '<div class="cell r">' + m.revenue + '</div>' +
      '<div class="cell w r" style="color:' + m.roiColor + '">' + m.roi + '</div>' +
      '<div class="cell muted r">' + m.cpa + '</div>' +
      '<div class="cell muted r">' + m.cpm + '</div>' +
      '<div class="cell muted r">' + m.win + '</div>' +
      '<div><span class="' + STATE_META[st].pill + '">' + STATE_META[st].label + '</span></div>' +
      '<div class="acts stick stick-r"><button class="btn btn-xs ' + (on ? 'btn-danger' : 'btn-up') +
        '" data-act="block" data-arg="' + z.id + '">' + (on ? 'Turn off' : 'Turn on') + '</button></div>' +
    '</div>';
  }

  function presetCard(p) {
    var s = Store.get();
    var open = s.ui.openPreset === p.id;
    var rows = DATA.ZONES.filter(function (z) { return p.zones.indexOf(z.id) >= 0; });
    var t = UI.sum(rows);
    var m = UI.metrics({ impr: t.impr, clicks: t.clicks, conv: t.conv, cost: t.cost,
                         revenue: t.revenue, winRate: t.cost ? t.wSum / t.cost : 0 });
    var white = p.kind === 'whitelist';

    var zoneChips = p.zones.map(function (id) {
      return '<span class="zchip">' + id +
        '<span class="x" data-act="dropZone" data-arg="' + p.id + '|' + id + '" title="Remove from preset">' +
        icon('close', 11, 2.4) + '</span></span>';
    }).join('') || '<span class="hint">No placements yet — select rows on the All placements tab and add them here.</span>';

    var campChips = s.campaigns.map(function (c) {
      var on = p.appliedTo.indexOf(c.id) >= 0;
      return '<div class="opt' + (on ? ' on' : '') + '" data-act="applyTo" data-arg="' + p.id + '|' + c.id + '">' +
        esc(c.name) + '</div>';
    }).join('');

    return '<div class="preset' + (open ? ' open' : '') + '">' +
      '<div class="preset-h" data-act="openPreset" data-arg="' + p.id + '">' +
        '<div class="grp-ic">' + icon('zones', 17) + '</div>' +
        '<div><div class="preset-n">' + esc(p.name) + '</div>' +
          '<div class="preset-d">' + p.zones.length + ' ' + UI.plural(p.zones.length, 'placement', 'placements') +
          ' · applied to ' + p.appliedTo.length + ' ' + UI.plural(p.appliedTo.length, 'campaign', 'campaigns') +
          (t.cost ? ' · ROI ' + m.roi : '') + '</div></div>' +
        '<span class="pill ' + (white ? 'pill-ok' : 'pill-bad') + '" style="margin-left:auto">' +
          (white ? 'Whitelist' : 'Blacklist') + '</span>' +
        '<span class="cell muted">' + (t.cost ? m.cost + ' spent' : 'no spend yet') + '</span>' +
        '<div class="act">' + icon(open ? 'down' : 'right', 13, 2) + '</div>' +
      '</div>' +
      (open ? '<div class="preset-b">' +
        '<div class="field"><label class="lab">Placements in preset</label>' +
          '<div class="opts" style="gap:6px">' + zoneChips + '</div></div>' +
        '<div class="field"><label class="lab">Applied to campaigns</label>' +
          '<div class="opts">' + campChips + '</div>' +
          '<div class="hint">A whitelist narrows the campaign to these placements; a blacklist excludes them.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-sm" data-act="flip" data-arg="' + p.id + '">' +
            'Switch to ' + (white ? 'blacklist' : 'whitelist') + '</button>' +
          '<button class="btn btn-sm" data-act="addSel" data-arg="' + p.id + '">Add selected placements</button>' +
          '<button class="btn btn-sm btn-danger" style="margin-left:auto" data-act="delPreset" data-arg="' + p.id + '">Delete preset</button>' +
        '</div>' +
      '</div>' : '') +
    '</div>';
  }

  w.Screens = w.Screens || {};
  w.Screens.zones = {
    render: function () {
      var s = Store.get(), u = s.ui;
      var isPresets = u.zonesTab === 'presets';
      var rows = isPresets ? [] : filtered();
      var sel = selected();
      var blockedCount = DATA.ZONES.filter(function (z) { return stateOf(z) === 'blocked'; }).length;

      var counts = {
        all: DATA.ZONES.length,
        live: DATA.ZONES.filter(function (z) { return stateOf(z) === 'live'; }).length,
        robot: DATA.ZONES.filter(function (z) { return stateOf(z) === 'robot'; }).length,
        blocked: blockedCount,
        presets: s.presets.length
      };
      var tabs = [
        { k: 'all', label: 'All placements' }, { k: 'live', label: 'Live' },
        { k: 'robot', label: 'Robot off' }, { k: 'blocked', label: 'Turned off' },
        { k: 'presets', label: 'Presets' }
      ].map(function (t) {
        return '<div class="seg' + (u.zonesTab === t.k ? ' on' : '') + '" data-act="tab" data-arg="' + t.k + '">' +
          '<span>' + t.label + '</span><span class="seg-n">' + counts[t.k] + '</span></div>';
      }).join('');

      var all = UI.sum(DATA.ZONES);
      var am = UI.metrics({ impr: all.impr, clicks: all.clicks, conv: all.conv, cost: all.cost,
                            revenue: all.revenue, winRate: all.cost ? all.wSum / all.cost : 0 });
      var kpi = function (lab, val, sub, color) {
        return '<div class="kpi tight"><div class="kpi-lab">' + lab + '</div>' +
          '<div class="kpi-val num"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</div>' +
          '<div class="hint">' + sub + '</div></div>';
      };

      var body;
      if (isPresets) {
        body = '<div class="card">' +
          '<div class="card-h"><div class="card-t">Presets</div>' +
            '<div class="card-s">A preset is a saved group of placements you can apply to any campaign</div></div>' +
          '<div class="card-b" style="gap:10px">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
              '<button class="btn btn-pri btn-sm" data-act="newPreset">' + icon('plus', 13, 2.4) +
                'New preset' + (sel.length ? ' from ' + sel.length + ' selected' : '') + '</button>' +
              '<span class="hint">' + (sel.length
                ? sel.length + ' ' + UI.plural(sel.length, 'placement is', 'placements are') + ' selected on the All placements tab'
                : 'Select rows on the All placements tab to build a preset out of them') + '</span>' +
            '</div>' +
            s.presets.map(presetCard).join('') +
            '<div class="note" style="margin-top:6px">' + icon('info', 15, 2) +
              '<p><b>Inventory is already cleaned before launch.</b> Presets are for narrowing it to your own offer — ' +
              'the robot keeps pruning inside the preset.</p></div>' +
          '</div></div>';
      } else {
        var t = UI.sum(rows);
        var tm = UI.metrics({ impr: t.impr, clicks: t.clicks, conv: t.conv, cost: t.cost,
                              revenue: t.revenue, winRate: t.cost ? t.wSum / t.cost : 0 });
        body = '<div class="table"><div class="table-scroll">' +
          '<div class="tr thead" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
            HEADS.map(function (h, i) {
              if (i === 0) {
                return '<div class="stick stick-l1"><div class="box' +
                  (sel.length && sel.length === rows.length ? ' on' : '') + '" data-act="pickAll"></div></div>';
              }
              var pin = i === 1 ? ' stick stick-l2' : (i === HEADS.length - 1 ? ' stick stick-r' : '');
              return '<div class="th ' + ALIGN[i] + pin + '">' + h + '</div>';
            }).join('') +
          '</div>' +
          (rows.length
            ? '<div class="tr totals" style="grid-template-columns:' + COLS + ';' + minw() + '">' +
                '<div class="stick stick-l1"></div>' +
                '<div class="tot-lab stick stick-l2">Total</div>' +
                '<div class="cell muted">' + rows.length + ' shown</div>' +
                '<div class="cell r">' + tm.impr + '</div><div class="cell r">' + tm.clicks + '</div>' +
                '<div class="cell r">' + tm.ctr + '</div><div class="cell r">' + tm.conv + '</div>' +
                '<div class="cell r">' + tm.cr + '</div><div class="cell r">' + tm.cost + '</div>' +
                '<div class="cell r">' + tm.revenue + '</div>' +
                '<div class="cell r" style="color:' + tm.roiColor + '">' + tm.roi + '</div>' +
                '<div class="cell r">' + tm.cpa + '</div><div class="cell r">' + tm.cpm + '</div>' +
                '<div class="cell r">' + tm.win + '</div><div></div>' +
                '<div class="stick stick-r"></div>' +
              '</div>' + rows.map(rowHtml).join('')
            : '<div class="empty">No placements match these filters</div>') +
          '</div>' +
          '<div class="foot"><span>Showing ' + rows.length + ' of 1,482 placements · last 7 days</span>' +
          '<span style="margin-left:auto">Turning a placement off here applies to every campaign · ' +
          'inside a campaign report it affects that campaign only</span></div>' +
        '</div>';
      }

      var bulk = '';
      if (sel.length && !isPresets) {
        var presetBtns = s.presets.map(function (p) {
          return '<button class="btn btn-xs" data-act="addSel" data-arg="' + p.id + '">' + esc(p.name) + '</button>';
        }).join('');
        bulk = '<div class="bulk">' +
          '<span class="bulk-n">' + sel.length + ' selected</span>' +
          '<button class="btn btn-xs btn-danger" data-act="blockSel">Turn off</button>' +
          '<button class="btn btn-xs btn-up" data-act="unblockSel">Turn on</button>' +
          '<span class="hint" style="margin-left:8px">Add to preset:</span>' + presetBtns +
          '<button class="btn btn-xs btn-up" data-act="newPreset">' + icon('plus', 11, 2.4) + 'New preset</button>' +
          '<button class="btn btn-xs btn-ghost" style="margin-left:auto" data-act="clearSel">Clear selection</button>' +
        '</div>';
      }

      var cats = ['all', 'Mainstream', 'Adult'].map(function (c) {
        return '<div class="opt' + (u.zonesCat === c ? ' on' : '') + '" data-act="cat" data-arg="' + esc(c) + '">' +
          (c === 'all' ? 'All categories' : c) + '</div>';
      }).join('');
      var sorts = SORTS.map(function (x) {
        return '<div class="seg' + (u.zonesSort === x.k ? ' on' : '') + '" data-act="sort" data-arg="' + x.k + '">' + x.label + '</div>';
      }).join('');

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Placements</h1>' +
          '<p class="sub">Every placement under our own numbering, with its result. Group the good ones into presets and reuse them across campaigns.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto" data-act="newPreset">' +
            icon('plus', 14, 2.4) + 'New preset</button></div>' +

        '<div class="kpis k6">' +
          kpi('Placements', '1,482', DATA.ZONES.length + ' with spend this period') +
          kpi('Cost', am.cost, 'last 7 days') +
          kpi('Revenue', am.revenue, 'across shown placements') +
          kpi('ROI', am.roi, 'blended', am.roiColor) +
          kpi('Turned off by you', String(blockedCount), 'applies to all campaigns') +
          kpi('Presets', String(s.presets.length), 'reusable placement groups') +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<div class="segs">' + tabs + '</div>' +
          (isPresets ? '' :
            '<div class="opts" style="margin-left:auto">' + cats + '</div>' +
            '<span class="hint">Sort by</span><div class="segs">' + sorts + '</div>') +
        '</div>' +
        bulk + body +
      '</div>';
    },

    actions: {
      tab: function (v) { Store.ui('zonesTab', v); },
      cat: function (v) { Store.ui('zonesCat', v); },
      sort: function (v) { Store.ui('zonesSort', v); },

      pick: function (id) {
        Store.set(function (s) {
          var i = s.selection.indexOf(id);
          if (i >= 0) s.selection.splice(i, 1); else s.selection.push(id);
        });
      },
      pickAll: function () {
        var ids = filtered().map(function (z) { return z.id; });
        var all = selected().length === ids.length && ids.length > 0;
        Store.set(function (s) { s.selection = all ? [] : ids; });
      },
      clearSel: function () { Store.set(function (s) { s.selection = []; }); },

      block: function (id) {
        Api.placements.toggle(id, {}).then(function (r) {
          App.toast(r.on ? id + ' turned on across all campaigns'
                         : id + ' turned off across all campaigns');
        });
      },
      blockSel: function () {
        var ids = selected().slice();
        Api.placements.setStateMany({ ids: ids, on: false }).then(function () {
          Store.set(function (s) { s.selection = []; });
          App.toast(ids.length + ' ' + UI.plural(ids.length, 'placement', 'placements') + ' turned off');
        });
      },
      unblockSel: function () {
        var ids = selected().slice();
        Api.placements.setStateMany({ ids: ids, on: true }).then(function () {
          Store.set(function (s) { s.selection = []; });
          App.toast(ids.length + ' ' + UI.plural(ids.length, 'placement', 'placements') + ' turned on');
        });
      },

      newPreset: function () {
        var sel = selected().slice();
        Api.presets.create({ name: 'Preset ' + (Store.get().presets.length + 1),
                             kind: 'whitelist', zones: sel }).then(function (p) {
          Store.set(function (s) {
            s.ui.openPreset = p.id;
            s.ui.zonesTab = 'presets';
            s.selection = [];
          });
          App.toast('\u201c' + p.name + '\u201d created');
        });
      },
      addSel: function (pid) {
        var sel = selected().slice();
        Api.presets.addZones(pid, { zones: sel }).then(function (r) {
          Store.set(function (s) { s.selection = []; });
          App.toast(r.added
            ? r.added + ' ' + UI.plural(r.added, 'placement', 'placements') + ' added to the preset'
            : 'Nothing to add — select placements first');
        });
      },
      dropZone: function (arg) {
        var parts = arg.split('|');
        Api.presets.removeZone(parts[0], parts[1]);
      },
      applyTo: function (arg) {
        var parts = arg.split('|');
        Api.presets.toggleCampaign(parts[0], { campaignId: parts[1] });
      },
      flip: function (pid) { Api.presets.flip(pid); },
      delPreset: function (pid) {
        Api.presets.remove(pid).then(function (r) {
          App.toast('\u201c' + r.name + '\u201d deleted');
        });
      },
      openPreset: function (pid) {
        Store.set(function (s) { s.ui.openPreset = s.ui.openPreset === pid ? '' : pid; });
      }
    }
  };
})(window);
