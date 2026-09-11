const fs = require('fs');
const path = require('path');
const { Country, State, City } = require('./lib/cjs');

const referenceFile = path.join(__dirname, 'tools', 'fixtures', 'indonesia-admin-level-1-2.json');
const reference = JSON.parse(fs.readFileSync(referenceFile, 'utf8'));
const EXPECTED_STATE_CODES = reference.provinces.map((province) => province.stateCode).sort();

function normalizeName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(kabupaten|kab\.?|kota administrasi|kota adm\.?|kota)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function pass(label, detail = '') {
  console.log(`PASS  ${label}${detail ? ` - ${detail}` : ''}`);
}

function fail(label, detail = '') {
  console.error(`FAIL  ${label}${detail ? ` - ${detail}` : ''}`);
  process.exitCode = 1;
}

function check(label, condition, detail = '') {
  if (condition) pass(label, detail);
  else fail(label, detail);
  return condition;
}

console.log('\n=== Indonesia world-state-data integration test ===\n');

check('Reference contains 38 provinces', reference.provinces.length === 38, `found ${reference.provinces.length}`);
check('Reference contains 514 regencies/cities', reference.regenciesCities.length === 514, `found ${reference.regenciesCities.length}`);

const indonesia = Country.getCountryByCode('ID');
check('Country ID exists', Boolean(indonesia), indonesia ? indonesia.name : 'missing');

const states = State.getStatesOfCountry('ID');
check('Indonesia has 38 provinces', states.length === 38, `found ${states.length}`);

const actualCodes = states.map((state) => state.isoCode).sort();
check(
  'Province codes match the tracked Indonesia reference',
  JSON.stringify(actualCodes) === JSON.stringify(EXPECTED_STATE_CODES),
  actualCodes.join(', ')
);

check('Legacy Kalimantan Barat code KA is absent', !actualCodes.includes('KA'));

const kalbar = State.getStateByCodeAndCountry('KB', 'ID');
check('Kalimantan Barat resolves with stateCode KB', Boolean(kalbar), kalbar ? kalbar.name : 'missing');

const kalbarCities = City.getCitiesOfState('ID', 'KB');
const pontianak = kalbarCities.find((city) => normalizeName(city.name) === 'pontianak');
check(
  'Pontianak is returned by City.getCitiesOfState(ID, KB)',
  Boolean(pontianak),
  pontianak ? pontianak.name : 'missing'
);

if (pontianak) console.log('      Pontianak record:', pontianak);

const citiesByState = new Map();
for (const stateCode of EXPECTED_STATE_CODES) {
  citiesByState.set(stateCode, City.getCitiesOfState('ID', stateCode));
}

const missingOfficial = [];
for (const item of reference.regenciesCities) {
  const candidates = citiesByState.get(item.stateCode) || [];
  const target = normalizeName(item.name);
  const found = candidates.some((city) => normalizeName(city.name) === target);
  if (!found) missingOfficial.push(item);
}

check(
  'All 514 official kabupaten/kota are reachable through the built library API',
  missingOfficial.length === 0,
  `${reference.regenciesCities.length - missingOfficial.length}/${reference.regenciesCities.length} covered`
);

if (missingOfficial.length) {
  console.error('\nMissing official entries:');
  console.error(missingOfficial.slice(0, 30));
}

const badCoordinates = [];
for (const state of states) {
  for (const [field, value] of [['latitude', state.latitude], ['longitude', state.longitude]]) {
    if (value !== null && typeof value !== 'string' && value !== undefined) {
      badCoordinates.push({ type: 'state', name: state.name, field, value });
    }
  }

  for (const city of City.getCitiesOfState('ID', state.isoCode)) {
    for (const [field, value] of [['latitude', city.latitude], ['longitude', city.longitude]]) {
      if (value !== null && typeof value !== 'string' && value !== undefined) {
        badCoordinates.push({ type: 'city', name: city.name, stateCode: state.isoCode, field, value });
      }
    }
  }
}

check(
  'Coordinate values follow base convention (string | null)',
  badCoordinates.length === 0,
  `${badCoordinates.length} invalid values`
);

const unifiedFile = path.join(__dirname, 'data', 'world-state-data.json');
check('Single JSON dataset exists', fs.existsSync(unifiedFile), path.relative(__dirname, unifiedFile));

if (fs.existsSync(unifiedFile)) {
  const unified = JSON.parse(fs.readFileSync(unifiedFile, 'utf8'));
  check('Single dataset contains 38 Indonesia provinces', unified.states.filter((state) => state.countryCode === 'ID').length === 38);
  check('Single dataset contains Pontianak', unified.cities.some((city) => city.countryCode === 'ID' && city.stateCode === 'KB' && normalizeName(city.name) === 'pontianak'));
}

console.log('\n=== Result ===');
if (process.exitCode) console.error('Indonesia dataset test FAILED.');
else console.log('All Indonesia dataset tests PASSED.');
