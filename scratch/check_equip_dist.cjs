const fs = require('fs');
const http = require('http');

console.log('=== 1. CHECKING DIST HTML FILES ===');
['dist/ru/index.html', 'dist/en/index.html', 'dist/uz/index.html'].forEach(f => {
  if (!fs.existsSync(f)) {
    console.log(f, 'does not exist');
    return;
  }
  const content = fs.readFileSync(f, 'utf8');
  const matchDesc = content.match(/data-i18n="equip\.3\.desc"[^>]*>([\s\S]*?)<\//);
  const matchName = content.match(/data-i18n="equip\.3\.name"[^>]*>([\s\S]*?)<\//);
  console.log(`[${f}]`);
  console.log('  name:', matchName ? matchName[1].trim() : 'NOT FOUND');
  console.log('  desc:', matchDesc ? matchDesc[1].trim() : 'NOT FOUND');
});

console.log('\n=== 2. GREP IN DIST FOR KEYWORDS ===');
const distFiles = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const p = dir + '/' + item;
    if (fs.statSync(p).isDirectory()) walk(p);
    else distFiles.push(p);
  }
}
walk('dist');

const terms = [/aplanatsion/i, /applanation/i, /аппликацион/i];
terms.forEach(regex => {
  const matches = [];
  distFiles.forEach(f => {
    const text = fs.readFileSync(f, 'utf8');
    if (regex.test(text)) {
      matches.push(f);
    }
  });
  console.log(`Regex ${regex}: found in ${matches.length} files:`, matches);
});

console.log('\n=== 3. CHECKING DEV SERVER (PORT 4321) ===');
function fetchDev(urlPath) {
  return new Promise((resolve) => {
    http.get('http://localhost:4321' + urlPath, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matchDesc = data.match(/data-i18n="equip\.3\.desc"[^>]*>([\s\S]*?)<\//);
        const matchName = data.match(/data-i18n="equip\.3\.name"[^>]*>([\s\S]*?)<\//);
        resolve({
          path: urlPath,
          name: matchName ? matchName[1].trim() : 'NOT FOUND',
          desc: matchDesc ? matchDesc[1].trim() : 'NOT FOUND'
        });
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, error: err.message });
    });
  });
}

(async () => {
  for (const p of ['/ru/', '/en/', '/uz/']) {
    const res = await fetchDev(p);
    console.log(res);
  }
})();
