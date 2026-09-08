/* Профиль: аккаунт, юр. данные, пароль, документы, файлы. */
(function (w) {
  'use strict';
  var icon = UI.icon, esc = UI.esc;

  var TABS = [
    { k: 'acct',  label: 'Аккаунт',            ic: 'user',   badge: '' },
    { k: 'legal', label: 'Юридические данные', ic: 'legal',  badge: 'нужен VAT' },
    { k: 'pass',  label: 'Смена пароля',       ic: 'key',    badge: '' },
    { k: 'docs',  label: 'Документы',          ic: 'doc',    badge: String(DATA.DOCS.length) },
    { k: 'files', label: 'Файлы',              ic: 'folder', badge: String(DATA.FILES.length) }
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
        field('Email', 'ops@nexoramedia.io', '', 'Логин в кабинет. Смена — через поддержку.') +
        field('Название компании', 'Nexora Media') +
      '</div>' +
      '<div class="g3">' +
        field('Телефон', '+381 60 000 00 00', 'num') +
        field('Telegram', '@nexora_ops') +
        field('Мессенджер', '', '', 'не указан') +
      '</div>' +
      '<div class="g3">' +
        '<div class="field"><label class="lab">Часовой пояс отчётов</label>' + sel('UTC+00:00') +
          '<div class="hint">Влияет на все отчёты и расписание кампаний.</div></div>' +
        '<div class="field"><label class="lab">Язык интерфейса</label>' + sel('Русский') + '</div>' +
        field('ID рекламодателя', 'adv-4821', 'inp-mono', 'Пригодится при обращении в поддержку.') +
      '</div>' +
      '<div class="doc"><div class="doc-ic">' + icon('user', 17) + '</div>' +
        '<div><div class="doc-n">Ваш менеджер — Антон</div>' +
        '<div class="doc-d">Отвечает в рабочие часы UTC 08:00 — 20:00</div></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Написать</button></div>' +
    '</div>';
  }

  function legal() {
    return '<div style="display:flex;flex-direction:column;gap:20px">' +
      '<div class="g3">' +
        '<div class="field"><label class="lab">Страна</label>' + sel('Сербия') + '</div>' +
        '<div class="field"><label class="lab">Город</label>' + sel('Белград') + '</div>' +
        field('Почтовый индекс', '104104', 'num') +
      '</div>' +
      field('Юридический адрес', 'Bulevar Arsenija Carnojevica, 33') +
      '<div class="g2">' +
        field('Налоговый номер / VAT', '', 'inp-mono', 'Пример: RS100200300. Нужен для счетов и актов.') +
        field('Юридическое название', 'Nexora Media d.o.o.') +
      '</div>' +
      '<div class="note">' + icon('info', 15, 2) +
        '<p>Без юридических данных доступно только пополнение картой и криптовалютой. ' +
        '<b>Банковский перевод и закрывающие документы</b> открываются после их заполнения.</p></div>' +
    '</div>';
  }

  function pass() {
    var rule = function (t) {
      return '<div class="rule">' + icon('check', 14, 2.4) + t + '</div>';
    };
    return '<div style="display:flex;flex-direction:column;gap:20px;max-width:520px">' +
      '<div class="field"><label class="lab">Текущий пароль</label>' +
        '<input class="inp" type="password" placeholder="Введите текущий пароль"></div>' +
      '<div class="field"><label class="lab">Новый пароль</label>' +
        '<input class="inp" type="password" placeholder="Минимум 10 символов"></div>' +
      '<div class="field"><label class="lab">Повторите новый пароль</label>' +
        '<input class="inp" type="password" placeholder="Ещё раз"></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        rule('Не короче 10 символов') +
        rule('Буквы в разных регистрах и хотя бы одна цифра') +
        rule('Не совпадает с прошлыми тремя паролями') +
      '</div>' +
      '<div class="note">' + icon('info', 15, 2) +
        '<p>Это прототип: поля ничего не отправляют и никуда не сохраняются. ' +
        '<b>Не вводите сюда настоящий пароль.</b></p></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-pri" data-act="soon">Сменить пароль</button>' +
        '<button class="btn" data-act="soon">Включить двухфакторную защиту</button></div>' +
    '</div>';
  }

  function docs() {
    return '<div style="display:flex;flex-direction:column;gap:10px">' +
      DATA.DOCS.map(function (d) {
        return '<div class="doc"><div class="doc-ic">' + icon('doc', 16) + '</div>' +
          '<div><div class="doc-n">' + esc(d.name) + '</div><div class="doc-d">' + esc(d.meta) + '</div></div>' +
          '<span class="' + d.pill + '" style="margin-left:auto">' + d.status + '</span>' +
          '<button class="btn btn-xs" data-act="soon">Скачать</button></div>';
      }).join('') +
      '<div class="hint" style="margin-top:6px">Закрывающие документы формируются в первый рабочий день месяца за предыдущий период.</div>' +
    '</div>';
  }

  function files() {
    return '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<div style="display:flex;align-items:center;gap:12px;padding:18px;border:1px dashed #2E323B;border-radius:10px;background:#0B0D13;flex-wrap:wrap">' +
        icon('upload', 20) +
        '<div><div class="doc-n">Загрузить файл</div>' +
        '<div class="doc-d">Иконки и креативы: PNG, JPG, до 200 КБ. Прочие файлы — до 10 МБ.</div></div>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-act="soon">Выбрать файл</button></div>' +
      '<div class="table" style="border-radius:10px">' +
        '<div class="tr thead" style="grid-template-columns:minmax(0,1fr) 120px 110px 130px 110px">' +
          '<div class="th">Файл</div><div class="th">Тип</div><div class="th r">Размер</div>' +
          '<div class="th">Загружен</div><div class="th"></div></div>' +
        DATA.FILES.map(function (f) {
          return '<div class="tr row" style="grid-template-columns:minmax(0,1fr) 120px 110px 130px 110px">' +
            '<div class="cell w">' + esc(f.name) + '</div><div class="cell muted">' + f.kind + '</div>' +
            '<div class="cell muted r">' + f.size + '</div><div class="cell muted">' + f.date + '</div>' +
            '<div style="display:flex;justify-content:flex-end"><button class="btn btn-xs" data-act="soon">Скачать</button></div></div>';
        }).join('') +
        '<div class="foot"><span>4 файла · 1.2 МБ из 500 МБ</span></div>' +
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
        '<div class="head"><div><h1 class="h1">Профиль</h1>' +
          '<p class="sub">Данные аккаунта, юридические реквизиты и документы.</p></div>' +
          '<button class="btn btn-pri" style="margin-left:auto" data-act="save">Сохранить изменения</button></div>' +
        '<div class="card"><div class="prof">' +
          '<div class="prof-nav">' + nav + '</div>' +
          '<div class="prof-b">' + BODY[tab]() + '</div>' +
        '</div></div>' +
      '</div>';
    },
    actions: {
      tab: function (v) { Store.ui('profileTab', v); },
      save: function () { App.toast('Изменения сохранены'); },
      soon: function () { App.toast('В прототипе этот шаг не реализован'); }
    }
  };
})(window);
