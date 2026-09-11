# Data maintenance guide

`world-state-data` has two data layers:

- `source-data/` contains granular country/state/city source files used for maintenance and review.
- `data/world-state-data.json` is the generated single-file dataset intended for direct consumption.

Do not manually maintain both layers. Edit or merge the granular source, regenerate the runtime assets, then rebuild the single dataset.

## City data

To add, remove, or correct a city/locality, edit the appropriate `allCities.geo.json` and `allCities.lite.json` files under the matching state folder in `source-data/`.

Geo records use:

```json
{
  "name": "Kota Pontianak",
  "countryCode": "ID",
  "stateCode": "KB",
  "latitude": null,
  "longitude": null
}
```

If a coordinate is unknown, use `null`. Do not invent coordinates.

## State data

State/province records are maintained in `allStates.geo.json` and `allStates.lite.json` inside the matching country folder. A state also needs its own directory named `<State_Name>-<stateCode>`.

If a state code changes, update the child city `stateCode` values as well.

## Country data

Country records are maintained by the `allCountries*` files at the root of `source-data/` and by the matching country directory.

## Regenerate generated assets

After source changes:

```bash
npm run update-data
npm run build:data
```

For the Indonesia overlay workflow:

```bash
npm run build:indonesia
```

Before committing a release candidate:

```bash
npm run check
npm pack --dry-run
```
