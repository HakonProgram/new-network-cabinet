# API contract

The cabinet never touches its data directly — every read and write goes through
`js/api.js`. Today that module answers from a local mock; pointing it at a real
server is one call:

```js
Api.configure({ mode: 'http', baseUrl: 'https://api.example.com/v1', token: '<jwt>' });
```

Nothing else in the front end changes. Screens already treat every call as
asynchronous, so latency and failures behave the same in both modes
(`Api.configure({ latency: 400 })` fakes a slow network for testing).

Requests carry `Authorization: Bearer <token>` when a token is set and
`Content-Type: application/json` on writes. A non-2xx response rejects with an
`Error` carrying `status` and `body`.

## Endpoints

| Method | Path | Called by | Body / query |
|---|---|---|---|
| GET | `/dictionaries` | app start | — |
| GET | `/account` | shell, profile | — |
| PATCH | `/account` | notification settings | `{ channels?, threshold? }` |
| GET | `/campaigns` | campaign list | `?status=&model=` |
| GET | `/campaigns/:id` | campaign report | — |
| POST | `/campaigns` | create form | full campaign payload, below |
| PATCH | `/campaigns/:id` | inline edits | partial campaign |
| POST | `/campaigns/bulk` | row and bulk controls | `{ action, ids[] }` |
| POST | `/campaigns/:id/auto-check` | robot event | — |
| GET | `/reports/:dimension` | statistics | `?range=&campaignId=` |
| GET | `/placements` | placements, reports | `?category=&campaignId=` |
| POST | `/placements/:id/toggle` | on/off button | `{ campaignId? }` |
| PUT | `/placements/:id/state` | explicit set | `{ on, campaignId? }` |
| POST | `/placements/state` | bulk on/off | `{ ids[], on, campaignId? }` |
| GET | `/presets` | placements | — |
| POST | `/presets` | new preset | `{ name, kind, zones[] }` |
| PATCH | `/presets/:id` | rename | partial preset |
| DELETE | `/presets/:id` | delete | — |
| POST | `/presets/:id/zones` | add selection | `{ zones[] }` |
| DELETE | `/presets/:id/zones/:zoneId` | remove one | — |
| POST | `/presets/:id/campaigns` | apply to campaign | `{ campaignId }` |
| POST | `/presets/:id/flip` | whitelist ⇄ blacklist | — |
| GET | `/billing` | billing | — |
| POST | `/billing/top-up` | top-up | `{ amount, method, feePct }` |
| GET | `/notifications` | notifications | — |
| POST | `/notifications/read` | mark read | `{ id? }` — omit `id` for all |
| GET | `/volumes/forecast` | traffic volumes | `?format=&platform=&region=&model=&bid=` |
| POST | `/postback/test` | postback | `{ url }` |

`action` on `/campaigns/bulk` is one of `start`, `stop`, `toggle`, `archive`,
`restore`, `duplicate`. The response is `{ affected, campaign }`, where
`campaign` is the last one touched — the UI uses it for the confirmation text.

`:dimension` on `/reports` is `zones`, `campaigns`, `geo` or `days`.

## Campaign payload

`POST /campaigns` sends exactly what the create form holds:

```json
{
  "name": "Slots Royale — App Install",
  "url": "https://example.com/?click={clickid}&zone={zone}",
  "format": "Popunder",
  "vertical": "Gambling",
  "adult": false,
  "model": "Smart CPM",
  "bid": "2.40",
  "targeting": {
    "countries": [{ "codes": ["DE", "AT"], "bid": "2.40", "goal": "" }],
    "platforms": ["Mobile"],
    "oses": ["Android", "iOS"],
    "osVersions": { "Android": { "from": "9", "to": "13" } },
    "sources": ["direct"],
    "quality": ["fresh", "regular"],
    "capping": "1 impression / 24 hours",
    "browsers": "All browsers",
    "language": "Any language",
    "connection": "All",
    "vpn": "No VPN",
    "schedule": [[false, false, "…24 hours…"], "…7 days…"],
    "preset": "",
    "subzones": "",
    "subzoneMode": "Exclude"
  },
  "budget": { "daily": "400", "total": "4000" }
}
```

The server assigns `id` and returns the campaign with `status: "pending"` plus
zeroed metrics. One bid group per distinct bid: countries sharing a bid arrive
in one entry, and the UI merges them back on the way in.

## What stays on the client

The create form draft, table filters, selections, the open/closed state of
panels and the chosen theme. None of it is sent anywhere — it lives in
`localStorage` under `nn-cabinet-v3` and is rebuilt from scratch if missing.

## Status vocabulary

`pending` (auto-check running) → `active` | `test` → `paused` → `finished`,
with `archived` reachable from any of them and reversible via `restore`. The
transitions live in the API layer, not in the screens, so a real backend can
own them without touching the UI.
