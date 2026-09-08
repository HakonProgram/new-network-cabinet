/* Вход и регистрация. Экран живёт вне каркаса кабинета: ни меню, ни шапки. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  /* Демонстрационная пара: только она открывает аккаунт со статистикой. */
  var DEMO_LOGIN = '111', DEMO_PASS = '111';

  function form() { return Store.get().ui.auth; }

  function field(label, name, type, placeholder, value) {
    return '<label class="af"><span class="af-l">' + label + '</span>' +
      '<input class="inp" type="' + type + '" placeholder="' + esc(placeholder) + '" ' +
      'value="' + esc(value) + '" data-inp="' + name + '" autocomplete="off"></label>';
  }

  w.Screens = w.Screens || {};
  w.Screens.auth = {
    render: function () {
      var f = form();
      var signup = f.tab === 'signup';

      var points = [
        ['bot', 'One request, the whole network', 'Set a target and a bid — the robot finds the working combination itself.'],
        ['stats', 'Numbers you can act on', 'Thirteen metrics across placements, countries, days and devices.'],
        ['zones', 'Placements under control', 'Turn any of them off for one campaign or for the whole account.']
      ].map(function (p) {
        return '<div class="apoint"><span class="apoint-i">' + icon(p[0], 18) + '</span>' +
          '<div><div class="apoint-t">' + p[1] + '</div>' +
          '<div class="apoint-d">' + p[2] + '</div></div></div>';
      }).join('');

      return '<div class="auth">' +
        '<div class="auth-side">' +
          '<div class="auth-brand">' + UI.brandMark(34) +
            '<div><div class="brand-name">New Network</div>' +
            '<div class="brand-sub">Advertiser cabinet</div></div></div>' +
          '<h1 class="auth-h">Buy traffic without the back and forth.</h1>' +
          '<div class="apoints">' + points + '</div>' +
        '</div>' +

        '<div class="auth-card">' +
          '<div class="segs auth-tabs">' +
            '<div class="seg' + (signup ? '' : ' on') + '" data-act="tab" data-arg="signin">Sign in</div>' +
            '<div class="seg' + (signup ? ' on' : '') + '" data-act="tab" data-arg="signup">Create account</div>' +
          '</div>' +

          (signup
            ? '<div class="auth-form">' +
                '<div class="af-row">' +
                  field('First name', 'firstName', 'text', 'Anton', f.firstName) +
                  field('Last name', 'lastName', 'text', 'Sokolov', f.lastName) +
                '</div>' +
                field('Work email', 'email', 'email', 'you@company.com', f.email) +
                field('Company', 'company', 'text', 'Nexora Media', f.company) +
                field('Password', 'password', 'password', 'At least 8 characters', f.password) +
                (f.error ? '<div class="auth-err">' + icon('alert', 15) + esc(f.error) + '</div>' : '') +
                '<button class="btn btn-pri btn-lg" data-act="signup">Create account</button>' +
                '<p class="hint">A new account starts empty — top up, connect a postback and launch.</p>' +
              '</div>'
            : '<div class="auth-form">' +
                field('Login', 'login', 'text', 'Your login', f.login) +
                field('Password', 'password', 'password', 'Your password', f.password) +
                (f.error ? '<div class="auth-err">' + icon('alert', 15) + esc(f.error) + '</div>' : '') +
                '<button class="btn btn-pri btn-lg" data-act="signin">Sign in</button>' +
                '<div class="auth-demo">' + icon('info', 15) +
                  '<p><b>' + DEMO_LOGIN + ' / ' + DEMO_PASS + '</b> opens an account with a month of ' +
                  'statistics. Any other credentials open a fresh, empty one.</p></div>' +
              '</div>') +
        '</div>' +
      '</div>';
    },

    actions: {
      tab: function (v) {
        Store.set(function (s) { s.ui.auth.tab = v; s.ui.auth.error = ''; });
      },
      signin: function () {
        var f = form();
        if (!f.login.trim() || !f.password.trim()) {
          Store.set(function (s) { s.ui.auth.error = 'Enter a login and a password.'; });
          return;
        }
        var demo = f.login.trim() === DEMO_LOGIN && f.password.trim() === DEMO_PASS;
        Store.signIn(demo ? 'Nexora Media' : f.login.trim(), demo ? 'demo' : 'fresh');
        App.go('campaigns');
        App.toast(demo ? 'Signed in — demo account with data' : 'Signed in — empty account');
      },
      signup: function () {
        var f = form();
        /* Проверяем всё разом и называем недостающее, а не первое попавшееся. */
        var missing = [];
        if (!f.firstName.trim()) missing.push('first name');
        if (!f.lastName.trim()) missing.push('last name');
        if (!f.email.trim()) missing.push('work email');
        if (!f.company.trim()) missing.push('company');
        if (!f.password.trim()) missing.push('password');
        if (missing.length) {
          Store.set(function (s) {
            s.ui.auth.error = 'Fill in the ' + missing.join(', ') + '.';
          });
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) {
          Store.set(function (s) { s.ui.auth.error = 'That email address does not look right.'; });
          return;
        }
        if (f.password.trim().length < 8) {
          Store.set(function (s) { s.ui.auth.error = 'The password needs at least 8 characters.'; });
          return;
        }
        Store.signIn(f.company.trim(), 'fresh', {
          firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim()
        });
        App.go('campaigns');
        App.toast('Account created — welcome, ' + f.firstName.trim());
      }
    },

    inputs: (function () {
      var out = {};
      ['login', 'password', 'email', 'company', 'firstName', 'lastName'].forEach(function (name) {
        out[name] = function (v) { Store.patch(function (s) { s.ui.auth[name] = v; }); };
      });
      return out;
    })()
  };
})(window);
