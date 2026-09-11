# world-state-data

A practical world location dataset for JavaScript and TypeScript, covering countries, states/provinces, and cities/localities through a familiar API and a single distributable JSON file.

`world-state-data` is built for applications that need location data without maintaining their own country → state/province → city hierarchy. It keeps the `Country`, `State`, and `City` helper pattern from the `country-state-city` ecosystem while also exposing the underlying world dataset directly.

## Features

- Worldwide country, state/province, and city/locality data
- JavaScript and TypeScript support
- CommonJS and ES module builds
- Familiar `Country`, `State`, and `City` helper APIs
- One generated JSON dataset for direct use in applications and data pipelines
- ISO-style country and subdivision codes where available
- Coordinates preserved from source data
- Missing coordinates remain `null` instead of being guessed
- Source data kept separately from generated runtime assets for easier maintenance
- Country-specific corrections and enrichments can be layered on top of the global dataset without changing the public API

## Dataset snapshot

| Dataset | Records |
| --- | ---: |
| Countries | 250 |
| States / provinces | 4,967 |
| Cities / localities | 148,107 |

The generated all-in-one dataset is available at:

```text
data/world-state-data.json
```

Its top-level structure is intentionally simple:

```json
{
  "meta": {},
  "countries": [],
  "states": [],
  "cities": []
}
```

## Installation

Once published to npm:

```bash
npm install world-state-data
```

Or install directly from GitHub:

```bash
npm install github:rayss868/world-state-data
```

## Quick start

### ES modules

```js
import { Country, State, City } from 'world-state-data';

const unitedStates = Country.getCountryByCode('US');
const states = State.getStatesOfCountry('US');
const californiaCities = City.getCitiesOfState('US', 'CA');

console.log(unitedStates);
console.log(states);
console.log(californiaCities);
```

### CommonJS

```js
const { Country, State, City } = require('world-state-data');

const countries = Country.getAllCountries();
const states = State.getStatesOfCountry('US');
const cities = City.getCitiesOfState('US', 'CA');

console.log(countries);
console.log(states);
console.log(cities);
```

## Using the single JSON dataset

If you do not need the helper API, consume the generated dataset directly:

```js
const worldData = require('world-state-data/data/world-state-data.json');

console.log(worldData.meta.counts);
console.log(worldData.countries[0]);
console.log(worldData.states[0]);
console.log(worldData.cities[0]);
```

This is useful for search indexes, seeders, ETL jobs, offline applications, custom APIs, or any system that prefers raw structured data over helper functions.

## API

### Country

| Method | Description |
| --- | --- |
| `Country.getAllCountries()` | Return all countries |
| `Country.getCountryByCode(countryCode)` | Return one country by country code |

```js
const country = Country.getCountryByCode('JP');
```

### State

| Method | Description |
| --- | --- |
| `State.getAllStates()` | Return all states/provinces |
| `State.getStatesOfCountry(countryCode)` | Return states/provinces for a country |
| `State.getStateByCodeAndCountry(stateCode, countryCode)` | Return one state/province |

```js
const state = State.getStateByCodeAndCountry('CA', 'US');
```

### City

| Method | Description |
| --- | --- |
| `City.getAllCities()` | Return all city/locality records |
| `City.getCitiesOfCountry(countryCode)` | Return city/locality records for a country |
| `City.getCitiesOfState(countryCode, stateCode)` | Return city/locality records for a state/province |

```js
const cities = City.getCitiesOfState('US', 'CA');
```

## Data shapes

### Country

```ts
interface ICountry {
  name: string;
  phonecode: string;
  isoCode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
  timezones?: Timezones[];
}
```

### State / province

```ts
interface IState {
  name: string;
  isoCode: string;
  countryCode: string;
  latitude?: string | null;
  longitude?: string | null;
}
```

### City / locality

```ts
interface ICity {
  name: string;
  countryCode: string;
  stateCode: string;
  latitude?: string | null;
  longitude?: string | null;
}
```

Coordinates are kept as strings when supplied by the source dataset. If a coordinate is unavailable, the generated package uses `null`; missing geographic data is not fabricated.

## Repository layout

```text
world-state-data/
├── data/
│   └── world-state-data.json       # generated all-in-one dataset
├── source-data/                    # maintained granular source data
├── src/
│   ├── assets/                     # generated runtime assets
│   ├── country.ts
│   ├── state.ts
│   └── city.ts
├── tools/                          # dataset build and maintenance scripts
├── tests / test files              # API and data validation
├── NOTICE.md
└── README.md
```

The granular source structure makes individual location corrections reviewable, while `data/world-state-data.json` provides a convenient single-file output for consumers.

## Development

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test -- --runInBand
```

Build the library and generated data:

```bash
npm run build
```

Build only the unified JSON dataset:

```bash
npm run build:data
```

Run the package checks:

```bash
npm run check
```

Preview the package contents before publishing:

```bash
npm pack --dry-run
```

## Data maintenance

The project treats generated files as outputs rather than the primary editing surface. Location corrections should be made against the maintained source data or through a dedicated maintenance script, followed by regeneration and validation.

A typical maintenance flow is:

```text
source data
   ↓
normalization / country-specific reconciliation
   ↓
runtime assets
   ↓
unified world JSON
   ↓
build + tests
```

Country-specific enrichment is intentionally kept separate from the public API. A correction for one country should improve that country's coverage without turning the package into a country-specific library or changing how consumers query locations elsewhere.

## Data sources and attribution

The global dataset and API structure are derived from the `country-state-city` ecosystem, including:

- [`harpreetkhalsagtbit/country-state-city`](https://github.com/harpreetkhalsagtbit/country-state-city)
- [`dr5hn/countries-states-cities-database`](https://github.com/dr5hn/countries-states-cities-database)

Additional verified sources may be used for country-specific corrections or administrative updates. See [`NOTICE.md`](./NOTICE.md) and the relevant maintenance files for attribution and implementation details.

Administrative names, boundaries, and codes can change over time. Applications that depend on legally authoritative administrative status should verify critical records against the relevant current government source as part of their own release process.

## Codes and application database IDs

Country and subdivision codes in this package identify geographic records. They are not automatically equivalent to primary keys or foreign keys in your application's database.

For example, a location object may contain:

```js
{
  countryCode: 'US',
  stateCode: 'CA'
}
```

Those values are suitable for location lookup and mapping. If your application uses an internal `city_id`, `state_id`, or other foreign key, create an explicit mapping between the location dataset and your own database records rather than assuming both systems use the same identifiers.

## Contributing

Corrections and improvements are welcome. For location-data changes, include a reliable source whenever possible and keep changes scoped enough to review.

Useful contributions include:

- missing countries, states/provinces, cities, or localities
- renamed administrative divisions
- outdated subdivision codes
- duplicate or incorrectly mapped records
- verified coordinate corrections
- build or validation improvements

Please avoid adding guessed coordinates or silently replacing existing identifiers without a migration reason.

## License

GPL-3.0.

The upstream project is GPL-3.0, so this derivative package keeps the same license. See [`LICENSE`](./LICENSE).

## Maintainer

Maintained at [`rayss868/world-state-data`](https://github.com/rayss868/world-state-data).

Issues and pull requests are welcome.