const fs = require('fs');
const path = require('path');

const TEXT_EXTS = ['.ts', '.js', '.astro', '.json', '.txt', '.md', '.html', '.css', '.xml', '.yml', '.yaml', '.cjs', '.mjs'];

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', '.astro', 'scratch'].includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else {
      const ext = path.extname(full).toLowerCase();
      if (TEXT_EXTS.includes(ext) || item.endsWith('.env') || item.startsWith('.env')) {
        files.push(full);
      }
    }
  }
  return files;
}

const allFiles = walk('.');
console.log(`Found ${allFiles.length} text files to check.`);

const regexes = [
  { name: '09:00 / 9:00 / 09.00 / 9.00', regex: /(0?9[:\.]00|9\s*(am|утра)|opens.*09|openingHours)/i },
  { name: '17:00 (closing hour check)', regex: /17:00/ },
  { name: '08:30 (existing check)', regex: /08:30|8:30/ }
];

regexes.forEach(({ name, regex }) => {
  console.log(`\n=== CHECK: ${name} ===`);
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        console.log(`${file}:${idx + 1} -> ${line.trim()}`);
      }
    });
  });
});
