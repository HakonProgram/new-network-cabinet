/* Первый экран пустого аккаунта: три шага до первой кампании. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  function steps() {
    var s = Store.get();
    return [
      { k: 'money', ic: 'pay', title: 'Top up the balance',
        text: 'Card, wire or crypto. The minimum first deposit is $100.',
        done: s.balance > 0, cta: 'Add funds', go: 'payments' },
      { k: 'post', ic: 'post', title: 'Connect your postback',
        text: 'CPA and Pure CPA will not launch without it — the robot optimises by conversions.',
        done: !!s.ui.postbackTested, cta: 'Set up postback', go: 'postback' },
      { k: 'camp', ic: 'camp', title: 'Launch the first campaign',
        text: 'One form: target link, countries and a bid. The auto-check does the rest.',
        done: s.campaigns.length > 0, cta: 'Create campaign', go: 'campaigns/new' }
    ];
  }

  function html() {
    var list = steps();
    var done = list.filter(function (x) { return x.done; }).length;
    var user = (Store.get().session || {}).user || 'there';

    var rows = list.map(function (x, i) {
      return '<div class="wstep' + (x.done ? ' done' : '') + '">' +
        '<div class="wstep-n">' + (x.done ? icon('check', 15) : String(i + 1)) + '</div>' +
        '<div class="wstep-i">' + icon(x.ic, 20) + '</div>' +
        '<div class="wstep-b"><div class="wstep-t">' + x.title + '</div>' +
          '<div class="wstep-d">' + x.text + '</div></div>' +
        '<button class="btn' + (x.done ? '' : ' btn-pri') + '" data-go="' + x.go + '">' +
          (x.done ? 'Open' : x.cta) + '</button>' +
      '</div>';
    }).join('');

    return '<div class="welcome">' +
      '<div class="wcard">' +
        '<div class="whead">' +
          '<div class="wmark">' + UI.brandMark(44) + '</div>' +
          '<div><h1 class="h1">Welcome, ' + esc(user) + '</h1>' +
          '<p class="sub">Three steps and traffic starts flowing. ' +
            '<b>' + done + ' of 3</b> done.</p></div>' +
        '</div>' +
        '<div class="wbar"><i style="width:' + Math.round(done / 3 * 100) + '%"></i></div>' +
        '<div class="wsteps">' + rows + '</div>' +
      '</div>' +

      '<div class="wnote">' + icon('info', 16) +
        '<p>Prefer to look around first? <span class="lnk" data-act="loadDemo">Load a demo account</span> ' +
        'with a month of statistics — campaigns, placements and payments already in place.</p></div>' +
    '</div>';
  }

  w.Welcome = { html: html };
})(window);
