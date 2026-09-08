/* Postback: the S2S endpoint, macros and setup steps. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var CLICK_PH = '{your_click_macro}';
  var URL = 'https://track.newnetwork.io/postback?adv=4821&click_id=' + CLICK_PH;

  w.Screens = w.Screens || {};
  w.Screens.postback = {
    render: function () {
      var tested = Store.get().ui.postbackTested;

      var chips = function (list, act) {
        return list.map(function (t) {
          return '<div class="tok" data-act="' + act + '" data-arg="' + esc(t) + '">' + icon('copy', 11, 1.9) + esc(t) + '</div>';
        }).join('');
      };

      var step = function (n, html) {
        return '<div class="step"><div class="step-n">' + n + '</div><div class="step-t">' + html + '</div></div>';
      };

      return '<div class="page">' +
        '<div class="head"><div><h1 class="h1">Postback</h1>' +
        '<p class="sub">Server-to-server conversion tracking. One endpoint for every campaign — performance models will not run without it.</p></div></div>' +

        '<div class="pb">' +
          '<div class="card"><div class="card-h"><div class="card-t">Your postback endpoint</div>' +
            '<div class="card-s">one for every campaign</div></div>' +
            '<div class="card-b">' +
              '<div class="field"><label class="lab">Postback URL</label>' +
                '<div class="with-btn">' +
                  '<input class="inp inp-mono" type="text" value="' + esc(URL) + '" readonly>' +
                  '<button class="btn" style="flex:0 0 auto" data-act="copyUrl">' + icon('copy', 13, 1.9) + 'Copy</button>' +
                '</div>' +
                '<div class="hint">Replace <span class="mono">' + esc(CLICK_PH) + '</span> with your tracker’s click ID macro.</div></div>' +

              '<div class="field"><label class="lab">Optional parameters</label>' +
                '<div class="opts">' + chips(['&payout={amount}', '&status={status}', '&goal={goal}', '&currency=USD'], 'copy') + '</div>' +
                '<div class="hint">Send the conversion amount if you measure ROI by revenue rather than by action count.</div></div>' +

              '<div class="field"><label class="lab">Macros for the campaign link</label>' +
                '<div class="opts">' + chips(DATA.TOKENS, 'copy') + '</div></div>' +

              '<div class="ping">' +
                '<div class="ping-ic">' + icon('check', 16, 2.6) + '</div>' +
                '<div><div style="font-size:13px;font-weight:600">Postback is live</div>' +
                '<div class="hint">Last conversion received today at 06:14 UTC · 1,043 accepted in the last 24 hours</div></div>' +
                '<button class="btn btn-sm" style="margin-left:auto" data-act="test">' +
                  (tested ? 'Test conversion sent' : 'Send a test conversion') + '</button>' +
              '</div>' +
            '</div></div>' +

          '<div class="card"><div class="card-h"><div class="card-t">How to connect</div>' +
            '<div class="card-s">4 steps</div></div>' +
            '<div class="card-b" style="gap:16px">' +
              step(1, 'Copy the postback endpoint on the left.') +
              step(2, 'Replace <b>' + esc(CLICK_PH) + '</b> with your tracker’s click ID macro. The result looks like this:' +
                '<span class="code">https://track.newnetwork.io/postback?adv=4821&amp;click_id={sub1}</span>') +
              step(3, 'Add that URL to your tracker as the ad network postback.') +
              step(4, 'Check that the campaign link carries the <b>{clickid}</b> macro:' +
                '<span class="code">https://slotsroyale.io/lp/install?sub1={clickid}&amp;zone={zone}</span>') +
              '<div class="note">' + icon('info', 15, 2) +
                '<p><b>CPA and Pure CPA will not launch without a postback.</b> The robot optimises placements ' +
                'by conversions — with none coming in there is nothing to optimise, and the campaign stays in the auto-check.</p></div>' +
            '</div></div>' +
        '</div>' +
      '</div>';
    },

    actions: {
      copyUrl: function () {
        if (navigator.clipboard) navigator.clipboard.writeText(URL).catch(function () {});
        App.toast('Postback endpoint copied');
      },
      copy: function (t) {
        if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
        App.toast('Copied: ' + t);
      },
      test: function () {
        Store.set(function (s) { s.ui.postbackTested = !s.ui.postbackTested; });
        App.toast(Store.get().ui.postbackTested
          ? 'Test conversion sent — check the report'
          : 'Ready to send another one');
      }
    }
  };
})(window);
