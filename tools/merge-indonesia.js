const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indonesiaDir = path.join(root, 'source-data', 'Indonesia-ID');
const referenceFile = path.join(root, 'tools', 'fixtures', 'indonesia-admin-level-1-2.json');
const reportDir = path.join(root, 'reports');

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

function slugState(name, stateCode) {
  return `${name.replace(/ /g, '_')}-${stateCode}`;
}

function readJson(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 3)}\n`, 'utf8');
}

if (!fs.existsSync(referenceFile)) {
  throw new Error(`Missing Indonesia reference fixture: ${referenceFile}`);
}

const reference = readJson(referenceFile, null);
const provinces = reference.provinces || [];
const regencies = reference.regenciesCities || [];

if (provinces.length !== 38 || regencies.length !== 514) {
  throw new Error(`Unexpected Indonesia reference counts: ${provinces.length} provinces / ${regencies.length} regencies-cities`);
}

fs.mkdirSync(reportDir, { recursive: true });

const stateGeoFile = path.join(indonesiaDir, 'allStates.geo.json');
const stateLiteFile = path.join(indonesiaDir, 'allStates.lite.json');
let stateGeo = readJson(stateGeoFile);
let stateLite = readJson(stateLiteFile);

// Normalize the legacy upstream subdivision code before matching.
for (const state of stateGeo) {
  if (normalizeName(state.name) === 'kalimantan barat' && state.isoCode === 'KA') state.isoCode = 'KB';
}
for (const state of stateLite) {
  if (normalizeName(state.name) === 'kalimantan barat' && state.isoCode === 'KA') state.isoCode = 'KB';
}

const stateByIso = new Map(stateGeo.map((state) => [state.isoCode, state]));
const addedStates = [];

for (const province of provinces) {
  const { stateCode } = province;
  if (!stateCode) throw new Error(`No stateCode mapping for ${province.code} ${province.name}`);

  if (!stateByIso.has(stateCode)) {
    const state = {
      name: province.name,
      isoCode: stateCode,
      countryCode: 'ID',
      latitude: null,
      longitude: null
    };
    stateGeo.push(state);
    stateLite.push({ name: province.name, isoCode: stateCode, countryCode: 'ID' });
    stateByIso.set(stateCode, state);
    addedStates.push({ code: province.code, stateCode, name: province.name });
  }
}

stateGeo.sort((a, b) => a.name.localeCompare(b.name));
stateLite.sort((a, b) => a.name.localeCompare(b.name));
writeJson(stateGeoFile, stateGeo);
writeJson(stateLiteFile, stateLite);

const stateFolderByIso = new Map();
for (const entry of fs.readdirSync(indonesiaDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const match = entry.name.match(/-([A-Z]{2})$/);
  if (match) stateFolderByIso.set(match[1], entry.name);
}

// If an old Kalimantan Barat folder still exists under KA, use its contents as the
// base and rename it to the correct KB folder rather than losing legacy localities.
const legacyKalbarFolder = path.join(indonesiaDir, 'Kalimantan_Barat-KA');
const correctKalbarFolder = path.join(indonesiaDir, 'Kalimantan_Barat-KB');
if (fs.existsSync(legacyKalbarFolder) && !fs.existsSync(correctKalbarFolder)) {
  fs.renameSync(legacyKalbarFolder, correctKalbarFolder);
  stateFolderByIso.delete('KA');
  stateFolderByIso.set('KB', 'Kalimantan_Barat-KB');
}

const report = {
  source: reference.source,
  generatedAt: new Date().toISOString(),
  totals: {
    officialProvinces: provinces.length,
    officialRegenciesCities: regencies.length,
    baseStatesBefore: stateGeo.length - addedStates.length
  },
  addedStates,
  matchedOfficial: [],
  addedOfficial: [],
  preservedBaseOnly: [],
  warnings: []
};

for (const province of provinces) {
  const stateCode = province.stateCode;
  let folder = stateFolderByIso.get(stateCode);
  if (!folder) {
    folder = slugState(province.name, stateCode);
    stateFolderByIso.set(stateCode, folder);
  }

  const stateDir = path.join(indonesiaDir, folder);
  fs.mkdirSync(stateDir, { recursive: true });

  const geoFile = path.join(stateDir, 'allCities.geo.json');
  const liteFile = path.join(stateDir, 'allCities.lite.json');
  const geo = readJson(geoFile);
  const lite = readJson(liteFile);

  // Normalize stateCode on legacy records after a province code correction.
  for (const city of geo) {
    city.countryCode = 'ID';
    city.stateCode = stateCode;
  }
  for (const city of lite) {
    city.countryCode = 'ID';
    city.stateCode = stateCode;
  }

  const officialForProvince = regencies.filter((item) => item.provinceCode === province.code);
  const existingByNorm = new Map();

  for (const city of geo) {
    const key = normalizeName(city.name);
    if (!existingByNorm.has(key)) existingByNorm.set(key, []);
    existingByNorm.get(key).push(city);
  }

  const matchedBaseObjects = new Set();
  const addedNames = new Set();

  for (const official of officialForProvince) {
    const key = normalizeName(official.name);
    const candidates = existingByNorm.get(key) || [];
    let match = null;

    if (candidates.length === 1) {
      match = candidates[0];
    } else if (candidates.length > 1) {
      const officialLower = official.name.toLowerCase();
      match = candidates.find((candidate) => {
        const name = candidate.name.toLowerCase();
        return name.startsWith('kabupaten ') === officialLower.startsWith('kabupaten ')
          && name.startsWith('kota ') === officialLower.startsWith('kota ');
      }) || candidates[0];

      report.warnings.push({
        type: 'ambiguous-normalized-name',
        province: province.name,
        official: official.name,
        candidates: candidates.map((candidate) => candidate.name)
      });
    }

    if (match) {
      matchedBaseObjects.add(match);
      report.matchedOfficial.push({
        province: province.name,
        officialCode: official.code,
        officialName: official.name,
        baseName: match.name,
        stateCode
      });
    } else {
      const newGeo = {
        name: official.name,
        countryCode: 'ID',
        stateCode,
        latitude: null,
        longitude: null
      };
      geo.push(newGeo);
      lite.push({ name: official.name, countryCode: 'ID', stateCode });
      addedNames.add(official.name);
      report.addedOfficial.push({
        province: province.name,
        officialCode: official.code,
        officialName: official.name,
        stateCode
      });
    }
  }

  for (const city of geo) {
    if (!matchedBaseObjects.has(city) && !addedNames.has(city.name)) {
      report.preservedBaseOnly.push({
        province: province.name,
        baseName: city.name,
        stateCode
      });
    }
  }

  const dedupe = (items) => {
    const seen = new Set();
    return items
      .filter((item) => {
        const key = `${item.countryCode}|${item.stateCode}|${item.name}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  writeJson(geoFile, dedupe(geo));
  writeJson(liteFile, dedupe(lite));
}

report.totals.finalStates = stateGeo.length;
report.totals.matchedOfficial = report.matchedOfficial.length;
report.totals.addedOfficial = report.addedOfficial.length;
report.totals.preservedBaseOnly = report.preservedBaseOnly.length;
report.totals.warnings = report.warnings.length;
report.validation = {
  has38Provinces: stateGeo.length === 38,
  officialRegenciesCitiesIs514: regencies.length === 514,
  pontianakOfficialPresent: report.matchedOfficial
    .concat(report.addedOfficial)
    .some((item) => item.officialName === 'Kota Pontianak')
};

writeJson(path.join(reportDir, 'indonesia-merge-report.json'), report);
writeJson(path.join(reportDir, 'indonesia-added-official.json'), report.addedOfficial);
writeJson(path.join(reportDir, 'indonesia-matched-official.json'), report.matchedOfficial);

console.log(JSON.stringify({
  totals: report.totals,
  validation: report.validation,
  addedStates: report.addedStates
}, null, 2));

if (!report.validation.has38Provinces
  || !report.validation.officialRegenciesCitiesIs514
  || !report.validation.pontianakOfficialPresent) {
  process.exitCode = 2;
}
