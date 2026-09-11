# Changelog

## 1.0.0

Initial `world-state-data` release preparation.

- Renamed the package from the upstream `country-state-city` identity to `world-state-data`.
- Preserved the existing `Country`, `State`, and `City` API style.
- Reconciled Indonesia to 38 provinces and guaranteed coverage of 514 official kabupaten/kota.
- Corrected Kalimantan Barat to `stateCode: KB` and added the newer Papua provinces.
- Added an Indonesia end-to-end integration test, including `Kota Pontianak`.
- Normalized unavailable state/city coordinates to `null`.
- Added `data/world-state-data.json` as a single distributable dataset.
- Moved granular maintenance data to `source-data/`.
- Added explicit runtime asset synchronization during builds.

Historical upstream changes are retained in [`UPSTREAM_CHANGELOG.md`](./UPSTREAM_CHANGELOG.md).
