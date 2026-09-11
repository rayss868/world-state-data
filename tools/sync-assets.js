const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src', 'assets');
const targets = [
  path.join(root, 'lib', 'assets'),
  path.join(root, 'lib', 'cjs', 'assets')
];

const files = ['country.json', 'state.json', 'city.json'];

for (const target of targets) {
  fs.mkdirSync(target, { recursive: true });
  for (const file of files) {
    const from = path.join(source, file);
    const to = path.join(target, file);
    fs.copyFileSync(from, to);
    console.log(`Synced ${path.relative(root, from)} -> ${path.relative(root, to)}`);
  }
}
