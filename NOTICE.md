# Attribution and data sources

`world-state-data` is derived from the open-source `country-state-city` project by Harpreet Khalsa and retains the upstream GPL-3.0 license.

Global country/state/city data originates from the ecosystem around:

- https://github.com/harpreetkhalsagtbit/country-state-city
- https://github.com/dr5hn/countries-states-cities-database

Indonesia administrative coverage is supplemented and reconciled using:

- https://github.com/cahyadsn/wilayah

The Indonesia source provides Kemendagri administrative references. The runtime API keeps the `country-state-city`-style `countryCode` and `stateCode` fields for compatibility.

No claim is made that geographic coordinates exist for every administrative unit. When coordinates are unavailable, the value is `null` rather than fabricated.
