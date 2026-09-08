/* Демо-данные кабинета. Все цифры — образцы, не реальные. */
(function (w) {
  'use strict';

  var PAY_MODELS = [
    { key: 'cpa', name: 'CPA', tag: 'платный тест', price: '10.00', priceLab: 'за конверсию',
      desc: 'Оплата за действие. Тестовый запуск оплачивает рекламодатель — система сама ищет рабочую связку.',
      bidLabel: 'Выплата за конверсию, $', min: 3.00, half: 9.0 },
    { key: 'purecpa', name: 'Pure CPA', tag: 'бесплатный тест', price: '10.00', priceLab: 'за конверсию',
      desc: 'То же, но тест за счёт сети: риск неудачного трафика берём на себя. Для топовых рекламодателей.',
      bidLabel: 'Выплата за конверсию, $', min: 3.00, half: 9.0 },
    { key: 'cpm', name: 'CPM', tag: 'классическая', price: '1.80', priceLab: 'за 1000 показов',
      desc: 'Фиксированная цена за тысячу показов. Понятная модель для тех, кто закупает объём.',
      bidLabel: 'Ставка CPM, $', min: 0.15, half: 1.9 },
    { key: 'smartcpm', name: 'Smart CPM', tag: 'аукцион второй цены', price: '2.40', priceLab: 'максимальная ставка',
      desc: 'Победитель платит не свою ставку, а цену ближайшего конкурента. Тот же охват выходит дешевле.',
      bidLabel: 'Максимальная ставка, $', min: 0.15, half: 1.9 },
    { key: 'cpc', name: 'CPC', tag: 'оплата за клики', price: '0.09', priceLab: 'за клик',
      desc: 'Базовая модель с минимальным порогом входа. Обычно первый шаг нового рекламодателя.',
      bidLabel: 'Ставка CPC, $', min: 0.03, half: 0.12 }
  ];

  var STATUS = {
    active: { label: 'Активна',        color: '#0ca30c', ink: '#EEF2FA' },
    test:   { label: 'Тест',            color: '#8368F7', ink: '#EEF2FA' },
    review: { label: 'На автопроверке', color: '#fab219', ink: '#EEF2FA' },
    paused: { label: 'Остановлена',     color: '#6A7180', ink: '#9AA1AE' },
    done:   { label: 'Завершена',       color: '#2E323B', ink: '#6A7180' }
  };

  /* Показатели кампаний — за последние 7 дней. */
  var CAMPAIGNS = [
    { id: '4821', name: 'Slots Royale — App Install', format: 'Popunder', vertical: 'Gambling', adult: false,
      model: 'Pure CPA', status: 'active', impr: 2100000, ctr: 0.94, conv: 412, spend: 4120, bid: '10.00' },
    { id: '4790', name: 'BitVault — Регистрация', format: 'Push', vertical: 'Crypto', adult: false,
      model: 'CPA', status: 'active', impr: 1440000, ctr: 0.71, conv: 318, spend: 2860, bid: '9.00' },
    { id: '4744', name: 'MeetLocal — Push', format: 'Push', vertical: 'Dating', adult: false,
      model: 'Smart CPM', status: 'active', impr: 6020000, ctr: 1.28, conv: 204, spend: 1980, bid: '2.10' },
    { id: '4702', name: 'NightDate — Popunder', format: 'Popunder', vertical: '18+', adult: true,
      model: 'Smart CPM', status: 'active', impr: 9850000, ctr: 1.62, conv: 389, spend: 3410, bid: '2.40' },
    { id: '4688', name: 'FX Prime — Broker Leads', format: 'In-Page Push', vertical: 'Finance', adult: false,
      model: 'Pure CPA', status: 'active', impr: 1880000, ctr: 0.63, conv: 241, spend: 5240, bid: '21.00' },
    { id: '4655', name: 'SlimFit — Weight Loss', format: 'Native', vertical: 'Nutra', adult: false,
      model: 'CPA', status: 'test', impr: 210000, ctr: 0.88, conv: 29, spend: 340, bid: '11.50' },
    { id: '4640', name: 'iPhone 17 Giveaway', format: 'Banner', vertical: 'Sweepstakes', adult: false,
      model: 'CPM', status: 'review', impr: 0, ctr: 0, conv: 0, spend: 0, bid: '1.80' },
    { id: '4602', name: 'CleanMaster — Utility', format: 'Push', vertical: 'Mobile Apps', adult: false,
      model: 'CPC', status: 'paused', impr: 3040000, ctr: 0.42, conv: 96, spend: 1120, bid: '0.09' },
    { id: '4571', name: 'VPN Shield — Trial', format: 'Popunder', vertical: 'Software', adult: false,
      model: 'CPC', status: 'done', impr: 5110000, ctr: 0.55, conv: 187, spend: 2015, bid: '0.07' }
  ];

  /* Показатели площадок — за 30 дней, масштабируются периодом отчёта. */
  var ZONES = [
    { id: 'NN-40218', cat: 'Обычная', vertical: 'Gambling', impr: 4820000, clicks: 44900, conv: 1284, spend: 8860,  robot: false },
    { id: 'NN-40194', cat: '18+',     vertical: 'Dating',   impr: 6110000, clicks: 71200, conv: 1602, spend: 11860, robot: false },
    { id: 'NN-39877', cat: 'Обычная', vertical: 'Crypto',   impr: 3240000, clicks: 26800, conv: 902,  spend: 7760,  robot: false },
    { id: 'NN-39640', cat: 'Обычная', vertical: 'Finance',  impr: 2910000, clicks: 21400, conv: 744,  spend: 6850,  robot: false },
    { id: 'NN-39412', cat: '18+',     vertical: 'Dating',   impr: 5280000, clicks: 58100, conv: 1188, spend: 9620,  robot: false },
    { id: 'NN-38905', cat: 'Обычная', vertical: 'Nutra',    impr: 1980000, clicks: 12900, conv: 402,  spend: 4990,  robot: false },
    { id: 'NN-38744', cat: 'Обычная', vertical: 'Gambling', impr: 1640000, clicks: 9800,  conv: 214,  spend: 3380,  robot: false },
    { id: 'NN-38201', cat: '18+',     vertical: 'Dating',   impr: 1210000, clicks: 8400,  conv: 96,   spend: 2140,  robot: true },
    { id: 'NN-37988', cat: 'Обычная', vertical: 'Software', impr: 980000,  clicks: 5100,  conv: 41,   spend: 1280,  robot: true },
    { id: 'NN-37540', cat: 'Обычная', vertical: 'Gambling', impr: 760000,  clicks: 3200,  conv: 18,   spend: 880,   robot: false }
  ];

  /* Кампании в отчёте статистики — за 30 дней. */
  var STAT_CAMPAIGNS = [
    { name: 'Slots Royale — App Install', model: 'Pure CPA',  impr: 9030000,  clicks: 84900,  conv: 1772, spend: 17720 },
    { name: 'FX Prime — Broker Leads',    model: 'Pure CPA',  impr: 8080000,  clicks: 50900,  conv: 1036, spend: 22520 },
    { name: 'NightDate — Popunder',       model: 'Smart CPM', impr: 42360000, clicks: 686400, conv: 1673, spend: 14670 },
    { name: 'BitVault — Регистрация',     model: 'CPA',       impr: 6190000,  clicks: 43950,  conv: 1367, spend: 12290 },
    { name: 'MeetLocal — Push',           model: 'Smart CPM', impr: 25890000, clicks: 331400, conv: 877,  spend: 8520 },
    { name: 'CleanMaster — Utility',      model: 'CPC',       impr: 13070000, clicks: 54900,  conv: 413,  spend: 4820 },
    { name: 'VPN Shield — Trial',         model: 'CPC',       impr: 21970000, clicks: 120800, conv: 804,  spend: 8670 },
    { name: 'SlimFit — Weight Loss',      model: 'CPA',       impr: 900000,   clicks: 7900,   conv: 125,  spend: 1470 }
  ];

  var GEO = [
    { code: 'DE', name: 'Германия',   impr: 44000000, clicks: 476000, conv: 2780, spend: 28910, share: 0.240, bid: 2.40, zones: 268, cr: 2.86, taken: 0.42 },
    { code: 'US', name: 'США',        impr: 31200000, clicks: 337000, conv: 1940, spend: 25610, share: 0.185, bid: 3.10, zones: 341, cr: 2.24, taken: 0.31 },
    { code: 'AT', name: 'Австрия',    impr: 17900000, clicks: 193000, conv: 1180, spend: 11920, share: 0.098, bid: 2.10, zones: 112, cr: 2.61, taken: 0.55 },
    { code: 'CH', name: 'Швейцария',  impr: 13300000, clicks: 144000, conv: 894,  spend: 10640, share: 0.074, bid: 3.05, zones: 86,  cr: 2.48, taken: 0.48 },
    { code: 'NL', name: 'Нидерланды', impr: 10500000, clicks: 113000, conv: 690,  spend: 6760,  share: 0.086, bid: 1.85, zones: 124, cr: 2.19, taken: 0.28 },
    { code: 'PL', name: 'Польша',     impr: 6400000,  clicks: 69000,  conv: 380,  spend: 3190,  share: 0.112, bid: 0.95, zones: 156, cr: 1.74, taken: 0.14 },
    { code: 'FR', name: 'Франция',    impr: 4230000,  clicks: 45000,  conv: 203,  spend: 3650,  share: 0.105, bid: 1.40, zones: 148, cr: 1.62, taken: 0.09 }
  ];

  var GEO_POOL = [
    { code: 'IT', name: 'Италия' }, { code: 'ES', name: 'Испания' },
    { code: 'SE', name: 'Швеция' }, { code: 'CZ', name: 'Чехия' }, { code: 'PT', name: 'Португалия' }
  ];

  var PAY_METHODS = [
    { key: 'card',   name: 'Банковская карта',  desc: 'Visa · Mastercard',      min: 50,   feePct: 1.5, speed: 'мгновенно',       req: 'подтверждённый профиль' },
    { key: 'crypto', name: 'Криптовалюта',      desc: 'BTC · USDT · ETH',       min: 100,  feePct: 0,   speed: 'до 1 часа',       req: 'подтверждённый профиль' },
    { key: 'psys',   name: 'Платёжная система', desc: 'по запросу менеджера',   min: 50,   feePct: 0.5, speed: 'мгновенно',       req: 'подтверждённый профиль' },
    { key: 'wire',   name: 'Банковский перевод', desc: 'по счёту, для юрлиц',   min: 1000, feePct: 0,   speed: '1–3 рабочих дня', req: 'юр. данные и счёт' }
  ];

  var PAYMENTS = [
    { date: '05.09.26', meth: 'Банковская карта',   sum: 20000, fee: 300, ok: 'ok',  st: 'Зачислено', doc: 'Квитанция' },
    { date: '29.08.26', meth: 'Криптовалюта',       sum: 25000, fee: 0,   ok: 'ok',  st: 'Зачислено', doc: 'Квитанция' },
    { date: '21.08.26', meth: 'Банковский перевод', sum: 30000, fee: 0,   ok: 'ok',  st: 'Зачислено', doc: 'Счёт · Акт' },
    { date: '14.08.26', meth: 'Банковская карта',   sum: 10000, fee: 150, ok: 'ok',  st: 'Зачислено', doc: 'Квитанция' },
    { date: '09.08.26', meth: 'Платёжная система',  sum: 8000,  fee: 40,  ok: 'ok',  st: 'Зачислено', doc: 'Квитанция' },
    { date: '07.08.26', meth: 'Банковская карта',   sum: 2000,  fee: 30,  ok: 'bad', st: 'Отклонено', doc: '—' }
  ];

  var INVOICES = [
    { num: 'INV-2026-0455', date: '07.09.26', period: '01.09 — 07.09.26', sum: 18000, ok: 'wait', st: 'Ожидает оплаты' },
    { num: 'INV-2026-0412', date: '21.08.26', period: '01.08 — 21.08.26', sum: 30000, ok: 'ok',   st: 'Оплачен' },
    { num: 'INV-2026-0388', date: '02.08.26', period: '01.07 — 31.07.26', sum: 42000, ok: 'ok',   st: 'Оплачен' }
  ];

  var NOTIFICATIONS = [
    { id: 1, kind: 'bot', cat: 'zones', title: 'Робот отключил 7 площадок',
      text: 'Кампания NN-C-4702 · CPA на этих площадках был выше цели в 2.4 раза. Расход остановлен, объём перераспределён.',
      time: 'Сегодня, 06:00 UTC', unread: true },
    { id: 2, kind: 'ok', cat: 'camp', title: 'Кампания прошла автопроверку',
      text: 'NN-C-4640 «iPhone 17 Giveaway» · тематика обычная, ссылка отвечает 200 OK. Старт по расписанию.',
      time: 'Сегодня, 05:12 UTC', unread: true },
    { id: 3, kind: 'warn', cat: 'money', title: 'Баланса хватит примерно на 4 дня',
      text: 'При среднем расходе $3 023 в сутки. Пополните заранее — иначе кампании остановятся автоматически.',
      time: 'Сегодня, 04:30 UTC', unread: true },
    { id: 4, kind: 'bot', cat: 'camp', title: 'Изменена ставка по кампании',
      text: 'NN-C-4744 · робот поднял максимальную ставку с $2.10 до $2.40 в Германии: объём падал ниже дневного лимита.',
      time: 'Вчера, 21:40 UTC', unread: false },
    { id: 5, kind: 'money', cat: 'money', title: 'Платёж зачислен',
      text: '$20 000 картой · комиссия $300 · зачислено $19 700.',
      time: '05.09.26, 11:05 UTC', unread: false },
    { id: 6, kind: 'ok', cat: 'zones', title: 'Открыты новые площадки',
      text: '34 площадки в вертикали Gambling прошли проверку и добавлены в вашу выдачу.',
      time: '04.09.26, 09:20 UTC', unread: false },
    { id: 7, kind: 'warn', cat: 'camp', title: 'Кампания остановлена вручную',
      text: 'NN-C-4602 «CleanMaster — Utility» остановлена пользователем ops@nexoramedia.io.',
      time: '03.09.26, 15:02 UTC', unread: false },
    { id: 8, kind: 'money', cat: 'sys', title: 'Счёт INV-2026-0455 сформирован',
      text: 'Период 01.09 — 07.09.26 на сумму $18 000. Документ доступен в профиле.',
      time: '07.09.26, 08:00 UTC', unread: false }
  ];

  var GROUPS = [
    { name: 'Gambling · топ по CR',  meta: '128 площадок · применена к 2 кампаниям', kind: 'Белый список',  pill: 'pill pill-ok' },
    { name: '18+ · проверенные',     meta: '96 площадок · применена к 1 кампании',   kind: 'Белый список',  pill: 'pill pill-ok' },
    { name: 'Мусор за август',       meta: '214 площадок · применена ко всем',       kind: 'Чёрный список', pill: 'pill pill-bad' },
    { name: 'Тест новых источников', meta: '41 площадка · не применена',             kind: 'Белый список',  pill: 'pill' }
  ];

  var DOCS = [
    { name: 'Insertion Order № IO-4821', meta: 'Рамочный документ · подписан 12.06.26', status: 'Подписан',       pill: 'pill pill-ok' },
    { name: 'Счёт INV-2026-0455',        meta: 'Период 01.09 — 07.09.26 · $18 000',     status: 'Ожидает оплаты', pill: 'pill pill-wait' },
    { name: 'Акт за август 2026',        meta: 'Период 01.08 — 31.08.26 · $42 000',     status: 'Готов',          pill: 'pill pill-ok' },
    { name: 'Акт за июль 2026',          meta: 'Период 01.07 — 31.07.26 · $38 400',     status: 'Готов',          pill: 'pill pill-ok' }
  ];

  var FILES = [
    { name: 'slots-royale-icon-192.png', kind: 'Иконка',   size: '48 КБ',  date: '05.09.26' },
    { name: 'nightdate-icon-192.png',    kind: 'Иконка',   size: '52 КБ',  date: '02.09.26' },
    { name: 'zones-blacklist-sep.csv',   kind: 'Список',   size: '860 КБ', date: '01.09.26' },
    { name: 'io-4821-signed.pdf',        kind: 'Документ', size: '240 КБ', date: '12.06.26' }
  ];

  /* Итоги кабинета за 30 дней — от них считаются графики и отчёты. */
  var TOTALS_30D = { spend: 90680, impr: 127530000, clicks: 1381150, conv: 8067 };

  w.DATA = {
    PAY_MODELS: PAY_MODELS, STATUS: STATUS, CAMPAIGNS: CAMPAIGNS, ZONES: ZONES,
    STAT_CAMPAIGNS: STAT_CAMPAIGNS, GEO: GEO, GEO_POOL: GEO_POOL,
    PAY_METHODS: PAY_METHODS, PAYMENTS: PAYMENTS, INVOICES: INVOICES,
    NOTIFICATIONS: NOTIFICATIONS, GROUPS: GROUPS, DOCS: DOCS, FILES: FILES,
    TOTALS_30D: TOTALS_30D,
    FORMATS: ['Popunder', 'Push', 'In-Page Push', 'Native', 'Banner'],
    VERTICALS: ['Gambling', 'Crypto', 'Dating', 'Nutra', 'Finance', 'Sweepstakes', 'Mobile Apps', 'Software'],
    TOKENS: ['{clickid}', '{zone}', '{subzone}', '{geo}', '{cost}', '{device}', '{os}', '{browser}']
  };
})(window);
