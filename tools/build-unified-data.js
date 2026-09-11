const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'src', 'assets');
const outputDir = path.join(root, 'data');
const outputFile = path.join(outputDir, 'world-state-data.json');

const countries = JSON.parse(fs.readFileSync(path.join(assetsDir, 'country.json'), 'utf8'));
const states = JSON.parse(fs.readFileSync(path.join(assetsDir, 'state.json'), 'utf8'));
const compactCities = JSON.parse(fs.readFileSync(path.join(assetsDir, 'city.json'), 'utf8'));

const cityKeys = ['name', 'countryCode', 'stateCode', 'latitude', 'longitude'];
const cities = compactCities.map((row) => Object.fromEntries(cityKeys.map((key, index) => [key, row[index]])));

const indonesiaStates = states.filter((state) => state.countryCode === 'ID');
const indonesiaCities = cities.filter((city) => city.countryCode === 'ID');

const payload = {
  meta: {
    package: 'world-state-data',
    schemaVersion: 1,
    description: 'Countries, states/provinces, and cities in one JSON dataset.',
    sources: {
      global: 'harpreetkhalsagtbit/country-state-city and dr5hn/countries-states-cities-database',
      indonesia: 'cahyadsn/wilayah (Kemendagri administrative reference)'
    },
    counts: {
      countries: countries.length,
      states: states.length,
      cities: cities.length,
      indonesiaStates: indonesiaStates.length,
      indonesiaLocations: indonesiaCities.length
    },
    indonesia: {
      provinces: 38,
      officialRegenciesAndCities: 514,
      stateCodeConvention: 'ISO 3166-2 subdivision suffix used by the country-state-city API'
    }
  },
  countries,
  states,
  cities
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(payload), 'utf8');

const sizeMb = fs.statSync(outputFile).size / 1024 / 1024;
console.log(`Built ${path.relative(root, outputFile)}`);
console.log(`Countries: ${countries.length}`);
console.log(`States: ${states.length}`);
console.log(`Cities: ${cities.length}`);
console.log(`Indonesia states: ${indonesiaStates.length}`);
console.log(`Indonesia locations: ${indonesiaCities.length}`);
console.log(`Size: ${sizeMb.toFixed(2)} MB`);
