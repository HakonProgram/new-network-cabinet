/* Profile: account, legal details, password, documents, files. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { k: 'acct',  label: 'Account',         ic: 'user',   badge: '' },
    { k: 'legal', label: 'Legal details',   ic: 'legal',  badge: 'VAT needed' },
    { k: 'pass',  label: 'Password',        ic: 'key',    badge: '' },
    { k: 'docs',  label: 'Documents',       ic: 'doc',    badge: String(DATA.DOCS.length) },
    { k: 'files', label: 'Files',           ic: 'folder', badge: String(DATA.FILES.length) }
  ];

  function sel(text) {
    return '<div class="sel"><span>' + esc(text) + '</span>' + icon('down', 14, 2) + '</div>';
  }
  function field(lab, value, extra, hint) {
    return '<div class="field"><label class="lab">' + lab + '</label>' +
      '<input class="inp ' + (extra || '') + '" type="text" value="' + esc(value) + '">' +
      (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  }

  function acct() {
    return '<div style="display:flex;flex-direction:column;gap:20px">' +
      '<div class="g2">' +
        field('Email', 'ops@nexoramedia.io', '', 'Your login. Changed through support.') +
        field('Company name', 'Nexora Media') +
      '</div>' +
      '<div class="g3">' +
        field('Phone', '+381 60 000 00 00', 'num') +
        field('Telegram', '@nexora_ops') +
        field('Messenger', '', '', 'not set') +
      '</div>' +
      '<div class="g3">' +
        '<div class="field"><label class="lab">Reporting time zone</label>' + sel('UTC+00:00') +
          '<div class="hint">Applies to every report and campaign schedule.</div></div>' +
        '<div class="field"><label class="lab">Interface language</label>' + sel('English') + '</div>' +
        field('Advertiser ID', 'adv-4821', 'inp-mono', 'Handy when contacting support.') +
      '</div>' +
      '<div class="doc"><div class="doc-ic">' + icon('user', 17) + '</div>' +
        '<div><div class="doc-n">Anton — your account manager</div>' +
        '<div class="doc-d">Available 08:00 — 20:00 UTC on business days</div></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Message</button></div>' +
    '</div>';
  }

  function legal() {
    return '<div style="display:flex;flex-direction:column;gap:20px">' +
      '<div class="g3">' +
        '<div class="field"><label class="lab">Country</label>' + sel('Serbia') + '</div>' +
        '<div class="field"><label class="lab">City</label>' + sel('Belgrade') + '</div>' +
        field('Postal code', '104104', 'num') +
      '</div>' +
      field('Registered address', 'Bulevar Arsenija Carnojevica, 33') +
      '<div class="g2">' +
        field('Tax / VAT number', '', 'inp-mono', 'Example: RS100200300. Required for invoices and acts.') +
        field('Legal entity name', 'Nexora Media d.o.o.') +
      '</div>' +
      '<div class="note">' + icon('info', 15, 2) +
        '<p>Without legal details only card and crypto top-ups are available. ' +
        '<b>Wire transfer and closing documents</b> unlock once they are filled in.</p></div>' +
    '</div>';
  }

  function pass() {
    var rule = function (t) {
      return '<div class="rule">' + icon('check', 14, 2.4) + t + '</div>';
    };
    return '<div style="display:flex;flex-direction:column;gap:20px;max-width:520px">' +
      '<div class="field"><label class="lab">Current password</label>' +
        '<input class="inp" type="password" placeholder="Enter your current password"></div>' +
      '<div class="field"><label class="lab">New password</label>' +
        '<input class="inp" type="password" placeholder="At least 10 characters"></div>' +
      '<div class="field"><label class="lab">Repeat new password</label>' +
        '<input class="inp" type="password" placeholder="Once more"></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        rule('At least 10 characters') +
        rule('Mixed case letters and at least one digit') +
        rule('Different from your last three passwords') +
      '</div>' +
      '<div class="note">' + icon('info', 15, 2) +
        '<p>This is a prototype: these fields submit nothing and store nothing. ' +
        '<b>Do not type a real password here.</b></p></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-pri" data-act="soon">Change password</button>' +
        '<button class="btn" data-act="soon">Enable two-factor authentication</button></div>' +
    '</div>';
  }

  function docs() {
    return '<div style="display:flex;flex-direction:column;gap:10px">' +
      DATA.DOCS.map(function (d) {
        return '<div class="doc"><div class="doc-ic">' + icon('doc', 16) + '</div>' +
          '<div><div class="doc-n">' + esc(d.name) + '</div><div class="doc-d">' + esc(d.meta) + '</div></div>' +
          '<span class="' + d.pill + '" style="margin-left:auto">' + d.status + '</span>' +
          '<button class="btn btn-xs" data-act="soon">Download</button></div>';
      }).join('') +
      '<div class="hint" style="margin-top:6px">Closing documents are issued on the first business day of the month for the previous period.</div>' +
    '</div>';
  }

  function files() {
    return '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<div style="display:flex;align-items:center;gap:12px;padding:18px;border:1px dashed #312F2C;border-radius:10px;background:#171310;flex-wrap:wrap">' +
        icon('upload', 20) +
        '<div><div class="doc-n">Upload a file</div>' +
        '<div class="doc-d">Icons and creatives: PNG, JPG, up to 200 KB. Other files up to 10 MB.</div></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Choose file</button></div>' +
      '<div class="table" style="border-radius:10px">' +
        '<div class="tr thead" style="grid-template-columns:minmax(0,1fr) 120px 110px 130px 110px">' +
          '<div class="th">File</div><div class="th">Type</div><div class="th r">Size</div>' +
          '<div class="th">Uploaded</div><div class="th"></div></div>' +
        DATA.FILES.map(function (f) {
          return '<div class="tr row" style="grid-template-columns:minmax(0,1fr) 120px 110px 130px 110px">' +
            '<div class="cell w">' + esc(f.name) + '</div><div class="cell muted">' + f.kind + '</div>' +
            '<div class="cell muted r">' + f.size + '</div><div class="cell muted">' + f.date + '</div>' +
            '<div style="display:flex;justify-content:flex-end"><button class="btn btn-xs" data-act="soon">Download</button></div></div>';
        }).join('') +
        '<div class="foot"><span>4 files · 1.2 MB of 500 MB</span></div>' +
      '</div>' +
    '</div>';
  }

  var BODY = { acct: acct, legal: legal, pass: pass, docs: docs, files: files };

  w.Screens = w.Screens || {};
  w.Screens.profile = {
    render: function () {
      var tab = Store.get().ui.profileTab;
      var nav = TABS.map(function (t) {
        return '<div class="pn' + (tab === t.k ? ' on' : '') + '" data-act="tab" data-arg="' + t.k + '">' +
          icon(t.ic, 16) + '<span>' + t.label + '</span>' +
          (t.badge ? '<span class="pn-b">' + t.badge + '</span>' : '') + '</div>';
      }).join('');

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Profile</h1>' +
          '<p class="sub">Account details, legal information and documents.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto" data-act="save">Save changes</button></div>' +
        '<div class="card"><div class="prof">' +
          '<div class="prof-nav">' + nav + '</div>' +
          '<div class="prof-b">' + BODY[tab]() + '</div>' +
        '</div></div>' +
      '</div>';
    },
    actions: {
      tab: function (v) { Store.ui('profileTab', v); },
      save: function () { App.toast('Changes saved'); },
      soon: function () { App.toast('Not wired up in this prototype'); }
    }
  };
})(window);
