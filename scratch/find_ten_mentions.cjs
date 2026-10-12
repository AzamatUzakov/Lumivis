const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.astro') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.cjs')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk('./src');

console.log('--- All lines in src containing 10 (excluding phone numbers, dates, pixel sizes, hours) ---');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // skip common non-relevant numbers like phone numbers (+998 99 598 10 10), dates, times (17:00, 10:00), dimensions (10px, 100, 10%), ids (id: 10)
    const trimmed = line.trim();
    if (trimmed.includes('598 10 10') || trimmed.includes('5981010')) return;
    if (trimmed.match(/10px|10rem|10%|10ms|10s|100|1024|1010|107/)) {
      // only check if there is an isolated 10
      if (!trimmed.match(/\b10\b/)) return;
    }
    if (trimmed.match(/\b10\b/)) {
      // Check if it's related to text content
      console.log(`${f}:${idx + 1}: ${trimmed}`);
    }
  });
}

