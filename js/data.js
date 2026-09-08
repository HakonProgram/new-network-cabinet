/* Demo data. Every figure is a sample, not a real metric. */
(function (w) {
  'use strict';

  var PAY_MODELS = [
    { key: 'cpa', name: 'CPA', tag: 'paid test', unit: 'per conversion',
      desc: 'Pay per action. The advertiser funds the test run — the system finds a working combination on its own.',
      bidLabel: 'Your payout per conversion, $', min: 3.00, suggested: '10.00', half: 9.0 },
    { key: 'purecpa', name: 'Pure CPA', tag: 'free test', unit: 'per conversion',
      desc: 'Same model, but the network funds the test: we take the risk of unprofitable traffic. For top advertisers.',
      bidLabel: 'Your payout per conversion, $', min: 3.00, suggested: '10.00', half: 9.0 },
    { key: 'cpm', name: 'CPM', tag: 'classic', unit: 'per 1,000 impressions',
      desc: 'Fixed price per thousand impressions. A clear model for buying volume.',
      bidLabel: 'Your CPM bid, $', min: 0.15, suggested: '1.80', half: 1.9 },
    { key: 'smartcpm', name: 'Smart CPM', tag: 'second-price auction', unit: 'max bid per 1,000 impressions',
      desc: 'The winner pays the runner-up price, not their own bid. The same reach costs less.',
      bidLabel: 'Your max bid, $', min: 0.15, suggested: '2.40', half: 1.9 },
    { key: 'cpc', name: 'CPC', tag: 'pay per click', unit: 'per click',
      desc: 'Entry-level model with the lowest threshold. Usually a new advertiser\u2019s first step.',
      bidLabel: 'Your CPC bid, $', min: 0.03, suggested: '0.09', half: 0.12 }
  ];

  var STATUS = {
    active:   { label: 'Active',     tone: 'pos' },
    test:     { label: 'Test',       tone: 'accent' },
    review:   { label: 'Pending', tone: 'warn' },
    paused:   { label: 'Stopped',    tone: 'muted' },
    done:     { label: 'Finished',   tone: 'muted' },
    archived: { label: 'Archived',   tone: 'muted' }
  };

  /* Campaign figures — last 7 days. Everything else scales from this base. */
  var CAMPAIGNS = [
    { id: '4821', name: 'Slots Royale — App Install', format: 'Popunder', vertical: 'Gambling', adult: false,
      model: 'Pure CPA', status: 'active', impr: 2227000, clicks: 20940, conv: 412, cost: 4120, revenue: 5150, winRate: 22.4, bid: '10.00' },
    { id: '4790', name: 'BitVault — Sign-up', format: 'Native', vertical: 'Crypto', adult: false,
      model: 'CPA', status: 'active', impr: 2014000, clicks: 14300, conv: 318, cost: 2860, revenue: 3340, winRate: 18.9, bid: '9.00' },
    { id: '4744', name: 'MeetLocal — Push', format: 'Native', vertical: 'Dating', adult: false,
      model: 'Smart CPM', status: 'active', impr: 2152000, clicks: 27550, conv: 204, cost: 1980, revenue: 2450, winRate: 31.2, bid: '2.10' },
    { id: '4702', name: 'NightDate — Popunder', format: 'Popunder', vertical: 'Dating', adult: true,
      model: 'Smart CPM', status: 'active', impr: 2079000, clicks: 33680, conv: 389, cost: 3410, revenue: 4280, winRate: 27.6, bid: '2.40' },
    { id: '4688', name: 'FX Prime — Broker Leads', format: 'Interstitial', vertical: 'Finance', adult: false,
      model: 'Pure CPA', status: 'active', impr: 2230000, clicks: 14050, conv: 241, cost: 5240, revenue: 6020, winRate: 14.8, bid: '21.00' },
    { id: '4655', name: 'SlimFit — Weight Loss', format: 'Native', vertical: 'Nutra', adult: false,
      model: 'CPA', status: 'test', impr: 283000, clicks: 2490, conv: 29, cost: 340, revenue: 290, winRate: 9.4, bid: '11.50' },
    { id: '4640', name: 'iPhone 17 Giveaway', format: 'Banner', vertical: 'Sweepstakes', adult: false,
      model: 'CPM', status: 'review', impr: 0, clicks: 0, conv: 0, cost: 0, revenue: 0, winRate: 0, bid: '1.80' },
    { id: '4602', name: 'CleanMaster — Utility', format: 'Display Ads', vertical: 'Mobile Apps', adult: false,
      model: 'CPC', status: 'paused', impr: 1806000, clicks: 12460, conv: 96, cost: 1120, revenue: 960, winRate: 12.1, bid: '0.09' },
    { id: '4571', name: 'VPN Shield — Trial', format: 'Popunder', vertical: 'Software', adult: false,
      model: 'CPC', status: 'done', impr: 2583000, clicks: 28790, conv: 187, cost: 2015, revenue: 2245, winRate: 16.3, bid: '0.07' }
  ];

  /* Placements: compact seeds → deterministic 7-day figures.
     w — share of volume, q — quality (drives CTR, CR, CPA and win rate). */
  var PAYOUT = {
    Gambling: 12.50, Dating: 11.00, Crypto: 10.50, Finance: 25.00,
    Nutra: 13.00, Sweepstakes: 9.00, 'Mobile Apps': 11.50, Software: 12.00
  };

  var ZONE_SEEDS = [
    ['NN-40218', 'Mainstream', 'Gambling',    4.8, 0.94], ['NN-40194', 'Adult', 'Dating',      5.4, 0.90],
    ['NN-39877', 'Mainstream', 'Crypto',      3.2, 0.86], ['NN-39640', 'Mainstream', 'Finance', 2.9, 0.83],
    ['NN-39412', 'Adult', 'Dating',           4.6, 0.81], ['NN-39208', 'Mainstream', 'Gambling', 3.6, 0.78],
    ['NN-39044', 'Mainstream', 'Nutra',       2.4, 0.76], ['NN-38905', 'Mainstream', 'Nutra',   2.0, 0.72],
    ['NN-38871', 'Adult', 'Dating',           3.1, 0.70], ['NN-38744', 'Mainstream', 'Gambling', 1.7, 0.68],
    ['NN-38602', 'Mainstream', 'Finance',     2.2, 0.65], ['NN-38455', 'Mainstream', 'Software', 1.9, 0.62],
    ['NN-38312', 'Adult', 'Dating',           2.7, 0.60], ['NN-38201', 'Adult', 'Dating',       1.3, 0.57],
    ['NN-38077', 'Mainstream', 'Crypto',      1.6, 0.55], ['NN-37988', 'Mainstream', 'Software', 1.0, 0.52],
    ['NN-37844', 'Mainstream', 'Mobile Apps', 2.1, 0.50], ['NN-37701', 'Mainstream', 'Gambling', 1.4, 0.47],
    ['NN-37655', 'Adult', 'Dating',           1.8, 0.45], ['NN-37540', 'Mainstream', 'Gambling', 0.8, 0.42],
    ['NN-37402', 'Mainstream', 'Sweepstakes', 1.5, 0.40], ['NN-37288', 'Mainstream', 'Crypto',   1.1, 0.37],
    ['NN-37166', 'Mainstream', 'Nutra',       0.9, 0.35], ['NN-37041', 'Adult', 'Dating',        1.2, 0.32],
    ['NN-36922', 'Mainstream', 'Mobile Apps', 1.0, 0.30], ['NN-36804', 'Mainstream', 'Software', 0.7, 0.27],
    ['NN-36713', 'Mainstream', 'Sweepstakes', 1.3, 0.25], ['NN-36588', 'Mainstream', 'Gambling', 0.6, 0.22],
    ['NN-36471', 'Adult', 'Dating',           0.9, 0.20], ['NN-36350', 'Mainstream', 'Finance',  0.5, 0.18],
    ['NN-36244', 'Mainstream', 'Crypto',      0.8, 0.15], ['NN-36122', 'Mainstream', 'Nutra',    0.6, 0.13],
    ['NN-36008', 'Mainstream', 'Mobile Apps', 0.7, 0.11], ['NN-35901', 'Adult', 'Dating',        0.5, 0.09],
    ['NN-35788', 'Mainstream', 'Sweepstakes', 0.4, 0.07], ['NN-35640', 'Mainstream', 'Gambling', 0.3, 0.04]
  ];

  /* Zones the robot has already switched off — the worst tail. */
  var ROBOT_OFF = ['NN-36122', 'NN-36008', 'NN-35901', 'NN-35788', 'NN-35640', 'NN-36244'];

  function buildZones() {
    return ZONE_SEEDS.map(function (z) {
      var id = z[0], cat = z[1], vert = z[2], wgt = z[3], q = z[4];
      var impr = Math.round(wgt * 50000);
      var clicks = Math.round(impr * (0.006 + q * 0.011));
      var conv = Math.round(clicks * (0.005 + q * 0.022));
      var payout = PAYOUT[vert];
      var cpa = payout * (1.45 - q * 0.75);
      var cost = Math.round(conv * cpa);
      return {
        id: id, cat: cat, vertical: vert,
        impr: impr, clicks: clicks, conv: conv,
        cost: cost, revenue: Math.round(conv * payout),
        winRate: Math.round((8 + q * 34) * 10) / 10,
        robot: ROBOT_OFF.indexOf(id) >= 0
      };
    });
  }

  /* Geo — last 7 days, roughly summing to the account totals. */
  var GEO = [
    { code: 'DE', name: 'Germany',     impr: 5240000, clicks: 52800, conv: 646, cost: 6720, revenue: 8740, winRate: 26.4, share: 0.240, bid: 2.40, zones: 268, cr: 2.86, taken: 0.42 },
    { code: 'US', name: 'United States', impr: 3620000, clicks: 37400, conv: 451, cost: 5960, revenue: 6640, winRate: 18.2, share: 0.185, bid: 3.10, zones: 341, cr: 2.24, taken: 0.31 },
    { code: 'AT', name: 'Austria',     impr: 2080000, clicks: 21400, conv: 274, cost: 2770, revenue: 3220, winRate: 29.1, share: 0.098, bid: 2.10, zones: 112, cr: 2.61, taken: 0.55 },
    { code: 'CH', name: 'Switzerland', impr: 1546000, clicks: 15900, conv: 208, cost: 2475, revenue: 2740, winRate: 24.7, share: 0.074, bid: 3.05, zones: 86,  cr: 2.48, taken: 0.48 },
    { code: 'NL', name: 'Netherlands', impr: 1221000, clicks: 12500, conv: 160, cost: 1572, revenue: 1840, winRate: 21.3, share: 0.086, bid: 1.85, zones: 124, cr: 2.19, taken: 0.28 },
    { code: 'PL', name: 'Poland',      impr: 744000,  clicks: 7600,  conv: 88,  cost: 742,  revenue: 1010, winRate: 15.6, share: 0.112, bid: 0.95, zones: 156, cr: 1.74, taken: 0.14 },
    { code: 'FR', name: 'France',      impr: 926000,  clicks: 9600,  conv: 49,  cost: 846,  revenue: 545,  winRate: 12.8, share: 0.105, bid: 1.40, zones: 148, cr: 1.62, taken: 0.09 }
  ];

  var GEO_POOL = [
    { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' }, { code: 'CZ', name: 'Czechia' }, { code: 'PT', name: 'Portugal' }
  ];

  var PAY_METHODS = [
    { key: 'card',   name: 'Bank card',      desc: 'Visa · Mastercard',       min: 50,   feePct: 1.5, speed: 'instant',        req: 'verified profile' },
    { key: 'crypto', name: 'Crypto',         desc: 'BTC · USDT · ETH',        min: 100,  feePct: 0,   speed: 'up to 1 hour',   req: 'verified profile' },
    { key: 'psys',   name: 'Payment system', desc: 'on manager request',      min: 50,   feePct: 0.5, speed: 'instant',        req: 'verified profile' },
    { key: 'wire',   name: 'Wire transfer',  desc: 'by invoice, for companies', min: 1000, feePct: 0, speed: '1–3 business days', req: 'legal details and invoice' }
  ];

  var PAYMENTS = [
    { date: '05.09.26', meth: 'Bank card',     sum: 20000, fee: 300, ok: 'ok',  st: 'Credited', doc: 'Receipt' },
    { date: '29.08.26', meth: 'Crypto',        sum: 25000, fee: 0,   ok: 'ok',  st: 'Credited', doc: 'Receipt' },
    { date: '21.08.26', meth: 'Wire transfer', sum: 30000, fee: 0,   ok: 'ok',  st: 'Credited', doc: 'Invoice · Act' },
    { date: '14.08.26', meth: 'Bank card',     sum: 10000, fee: 150, ok: 'ok',  st: 'Credited', doc: 'Receipt' },
    { date: '09.08.26', meth: 'Payment system', sum: 8000, fee: 40,  ok: 'ok',  st: 'Credited', doc: 'Receipt' },
    { date: '07.08.26', meth: 'Bank card',     sum: 2000,  fee: 30,  ok: 'bad', st: 'Declined', doc: '—' }
  ];

  var INVOICES = [
    { num: 'INV-2026-0455', date: '07.09.26', period: 'Sep 1 — Sep 7, 2026', sum: 18000, ok: 'wait', st: 'Awaiting payment' },
    { num: 'INV-2026-0412', date: '21.08.26', period: 'Aug 1 — Aug 21, 2026', sum: 30000, ok: 'ok',  st: 'Paid' },
    { num: 'INV-2026-0388', date: '02.08.26', period: 'Jul 1 — Jul 31, 2026', sum: 42000, ok: 'ok',  st: 'Paid' }
  ];

  var NOTIFICATIONS = [
    { id: 1, kind: 'bot', cat: 'zones', unread: true, title: 'Robot switched off 7 placements',
      text: 'Campaign NN-C-4702 · CPA on these placements ran 2.4× above target. Spend stopped, volume redistributed.',
      time: 'Today, 06:00 UTC' },
    { id: 2, kind: 'ok', cat: 'camp', unread: true, title: 'Campaign passed the auto-check',
      text: 'NN-C-4640 “iPhone 17 Giveaway” · mainstream category, link returns 200 OK. Starts on schedule.',
      time: 'Today, 05:12 UTC' },
    { id: 3, kind: 'warn', cat: 'money', unread: true, title: 'Balance covers about 4 more days',
      text: 'At the current $3,023 daily spend. Top up in advance — otherwise campaigns stop automatically.',
      time: 'Today, 04:30 UTC' },
    { id: 4, kind: 'bot', cat: 'camp', unread: false, title: 'Bid changed on a campaign',
      text: 'NN-C-4744 · robot raised the max bid from $2.10 to $2.40 in Germany: volume was falling short of the daily cap.',
      time: 'Yesterday, 21:40 UTC' },
    { id: 5, kind: 'money', cat: 'money', unread: false, title: 'Payment credited',
      text: '$20,000 by card · $300 fee · $19,700 credited.',
      time: 'Sep 5, 11:05 UTC' },
    { id: 6, kind: 'ok', cat: 'zones', unread: false, title: 'New placements opened up',
      text: '34 Gambling placements passed review and were added to your inventory.',
      time: 'Sep 4, 09:20 UTC' },
    { id: 7, kind: 'warn', cat: 'camp', unread: false, title: 'Campaign stopped manually',
      text: 'NN-C-4602 “CleanMaster — Utility” stopped by ops@nexoramedia.io.',
      time: 'Sep 3, 15:02 UTC' },
    { id: 8, kind: 'money', cat: 'sys', unread: false, title: 'Invoice INV-2026-0455 issued',
      text: 'Sep 1 — Sep 7, 2026 for $18,000. Available in your profile.',
      time: 'Sep 7, 08:00 UTC' }
  ];

  /* Presets (placement groups) — the main tool on the Placements screen. */
  var PRESETS = [
    { id: 'p1', name: 'Gambling · top CR', kind: 'whitelist',
      zones: ['NN-40218', 'NN-39208', 'NN-38744', 'NN-37701'], appliedTo: ['4821', '4655'] },
    { id: 'p2', name: 'Adult · verified', kind: 'whitelist',
      zones: ['NN-40194', 'NN-39412', 'NN-38871', 'NN-38312'], appliedTo: ['4702'] },
    { id: 'p3', name: 'August waste', kind: 'blacklist',
      zones: ['NN-36122', 'NN-36008', 'NN-35901', 'NN-35788', 'NN-35640', 'NN-36244'], appliedTo: ['4821', '4790', '4744', '4702', '4688'] },
    { id: 'p4', name: 'New source test', kind: 'whitelist',
      zones: ['NN-36713', 'NN-36588', 'NN-36471'], appliedTo: [] }
  ];

  var DOCS = [
    { name: 'Insertion Order IO-4821', meta: 'Master agreement · signed Jun 12, 2026', status: 'Signed',          pill: 'pill pill-ok' },
    { name: 'Invoice INV-2026-0455',   meta: 'Sep 1 — Sep 7, 2026 · $18,000',          status: 'Awaiting payment', pill: 'pill pill-wait' },
    { name: 'Act for August 2026',     meta: 'Aug 1 — Aug 31, 2026 · $42,000',         status: 'Ready',            pill: 'pill pill-ok' },
    { name: 'Act for July 2026',       meta: 'Jul 1 — Jul 31, 2026 · $38,400',         status: 'Ready',            pill: 'pill pill-ok' }
  ];

  var FILES = [
    { name: 'slots-royale-icon-192.png', kind: 'Icon',     size: '48 KB',  date: '05.09.26' },
    { name: 'nightdate-icon-192.png',    kind: 'Icon',     size: '52 KB',  date: '02.09.26' },
    { name: 'zones-blacklist-sep.csv',   kind: 'List',     size: '860 KB', date: '01.09.26' },
    { name: 'io-4821-signed.pdf',        kind: 'Document', size: '240 KB', date: '12.06.26' }
  ];

  /* Откуда берём трафик. */
  var SOURCES = [
    { key: 'direct',  name: 'Direct sites',
      desc: 'Our own verified inventory. Cleanest traffic, best for testing a new offer.',
      note: 'Best for testing' },
    { key: 'partner', name: 'Partner traffic',
      desc: 'Wider supply through vetted partners, filtered by our anti-fraud. Volume grows, quality varies.',
      note: 'Best for scaling' }
  ];

  /* Качество аудитории: чем свежее пользователь, тем он дороже. */
  /* bidx — во сколько раз ступень дороже базовой рекомендации модели. */
  var QUALITY = [
    { key: 'fresh',   name: 'Fresh users',     desc: 'Have seen the fewest ads',                bidx: 1.25 },
    { key: 'regular', name: 'Regular users',   desc: 'Average activity',                        bidx: 1.00 },
    { key: 'aged',    name: 'Aged users',      desc: 'Have seen a lot already',                 bidx: 0.80 },
    { key: 'remnant', name: 'Remnant traffic', desc: 'Leftover inventory at the lowest price',  bidx: 0.60 }
  ];

  /* На десктопе не бывает iOS — список ОС собирается из выбранных платформ. */
  var PLATFORM_OS = {
    Desktop: ['Windows', 'macOS', 'Linux', 'Chrome OS'],
    Mobile:  ['Android', 'iOS'],
    Tablet:  ['Android', 'iPadOS']
  };
  var OS_ORDER = ['Windows', 'macOS', 'Linux', 'Chrome OS', 'Android', 'iOS', 'iPadOS'];
  /* Версии от старой к новой. Пустой список — версия не таргетируется. */
  var OS_VERSIONS = {
    Windows:     ['7', '8.1', '10', '11'],
    macOS:       ['11', '12', '13', '14', '15', '26'],
    Linux:       [],
    'Chrome OS': [],
    Android:     ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
    iOS:         ['12', '13', '14', '15', '16', '17', '18', '26'],
    iPadOS:      ['13', '14', '15', '16', '17', '18', '26']
  };

  /* ── разрезы, по которым нет построчных данных ──
     Для них храним долю трафика: фильтр по такому разрезу сужает
     отчёт пропорционально, а группировка делит итог на эти доли.
     Доли внутри каждого набора дают единицу. */
  var SHARES = {
    platform: [
      { id: 'Mobile', label: 'Mobile', w: 0.71 },
      { id: 'Desktop', label: 'Desktop', w: 0.22 },
      { id: 'Tablet', label: 'Tablet', w: 0.07 }
    ],
    os: [
      { id: 'Android', label: 'Android', w: 0.52 },
      { id: 'iOS', label: 'iOS', w: 0.19 },
      { id: 'Windows', label: 'Windows', w: 0.18 },
      { id: 'macOS', label: 'macOS', w: 0.06 },
      { id: 'iPadOS', label: 'iPadOS', w: 0.03 },
      { id: 'Linux', label: 'Linux', w: 0.02 }
    ],
    browser: [
      { id: 'Chrome', label: 'Chrome', w: 0.58 },
      { id: 'Safari', label: 'Safari', w: 0.21 },
      { id: 'Samsung Internet', label: 'Samsung Internet', w: 0.09 },
      { id: 'Firefox', label: 'Firefox', w: 0.06 },
      { id: 'Opera', label: 'Opera', w: 0.04 },
      { id: 'Edge', label: 'Edge', w: 0.02 }
    ],
    connection: [
      { id: 'Wi-Fi', label: 'Wi-Fi', w: 0.46 },
      { id: 'Cellular', label: 'Cellular', w: 0.51 },
      { id: 'Unknown', label: 'Unknown', w: 0.03 }
    ],
    isp: [
      { id: 'Deutsche Telekom', label: 'Deutsche Telekom', w: 0.14 },
      { id: 'Vodafone', label: 'Vodafone', w: 0.12 },
      { id: 'Orange', label: 'Orange', w: 0.10 },
      { id: 'Comcast', label: 'Comcast', w: 0.09 },
      { id: 'AT&T', label: 'AT&T', w: 0.08 },
      { id: 'Jio', label: 'Jio', w: 0.07 },
      { id: 'Telefonica', label: 'Telefonica', w: 0.06 },
      { id: 'Other', label: 'Other networks', w: 0.34 }
    ],
    city: [
      { id: 'Berlin', label: 'Berlin', w: 0.06 },
      { id: 'Hamburg', label: 'Hamburg', w: 0.04 },
      { id: 'Munich', label: 'Munich', w: 0.04 },
      { id: 'New York', label: 'New York', w: 0.05 },
      { id: 'Los Angeles', label: 'Los Angeles', w: 0.04 },
      { id: 'London', label: 'London', w: 0.05 },
      { id: 'Paris', label: 'Paris', w: 0.04 },
      { id: 'Madrid', label: 'Madrid', w: 0.03 },
      { id: 'Rome', label: 'Rome', w: 0.03 },
      { id: 'Warsaw', label: 'Warsaw', w: 0.03 },
      { id: 'Other', label: 'Other cities', w: 0.59 }
    ],
    cpaTest: [
      { id: 'paid', label: 'Paid test (CPA)', w: 0.34 },
      { id: 'free', label: 'Free test (Pure CPA)', w: 0.18 },
      { id: 'none', label: 'Not a CPA test', w: 0.48 }
    ]
  };

  var COUNTRIES = [
    { code: 'DE', name: 'Germany' },        { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' }, { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },          { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: 'Poland' },         { code: 'CZ', name: 'Czechia' },
    { code: 'SE', name: 'Sweden' },         { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },        { code: 'FI', name: 'Finland' },
    { code: 'PT', name: 'Portugal' },       { code: 'IE', name: 'Ireland' },
    { code: 'GR', name: 'Greece' },         { code: 'RO', name: 'Romania' },
    { code: 'HU', name: 'Hungary' },        { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },      { code: 'NZ', name: 'New Zealand' },
    { code: 'JP', name: 'Japan' },          { code: 'KR', name: 'South Korea' },
    { code: 'IN', name: 'India' },          { code: 'ID', name: 'Indonesia' },
    { code: 'TH', name: 'Thailand' },       { code: 'VN', name: 'Vietnam' },
    { code: 'BR', name: 'Brazil' },         { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },      { code: 'ZA', name: 'South Africa' },
    { code: 'TR', name: 'Turkey' },         { code: 'AE', name: 'United Arab Emirates' }
  ];

  w.DATA = {
    PAY_MODELS: PAY_MODELS, STATUS: STATUS, CAMPAIGNS: CAMPAIGNS,
    PLATFORM_OS: PLATFORM_OS, OS_ORDER: OS_ORDER, OS_VERSIONS: OS_VERSIONS, SHARES: SHARES,
    ZONES: buildZones(), GEO: GEO, GEO_POOL: GEO_POOL, PRESETS: PRESETS,
    PAY_METHODS: PAY_METHODS, PAYMENTS: PAYMENTS, INVOICES: INVOICES,
    NOTIFICATIONS: NOTIFICATIONS, DOCS: DOCS, FILES: FILES, PAYOUT: PAYOUT,
    FORMATS: ['Popunder', 'Native', 'Banner', 'Video', 'Interstitial', 'Display Ads', 'Social'],
    SOURCES: SOURCES, QUALITY: QUALITY, COUNTRIES: COUNTRIES,
    VERTICALS: [
      'Gambling', 'Betting', 'iGaming', 'Crypto', 'Finance', 'Forex', 'Loans', 'Insurance',
      'Dating', 'Adult', 'Nutra', 'Health & Beauty', 'Sweepstakes', 'E-commerce',
      'Mobile Apps', 'Games', 'Software', 'Antivirus', 'VPN', 'Streaming', 'Education', 'Travel'
    ],
    CAPPING: ['1 impression / 24 hours', '1 impression / 12 hours', '1 impression / 6 hours',
              '2 impressions / 24 hours', '3 impressions / 24 hours', 'No cap'],
    BROWSERS: ['All browsers', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung Internet'],
    LANGUAGES: ['Any language', 'English', 'German', 'Spanish', 'French', 'Italian', 'Portuguese', 'Polish'],
    TOKENS: ['{clickid}', '{zone}', '{subzone}', '{geo}', '{cost}', '{device}', '{os}', '{browser}'],
    BASE_DAYS: 7
  };
})(window);
