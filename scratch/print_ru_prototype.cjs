const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

const ruCards = [
  { id: 11, badge: '11', name: 'Микроскоп Carl Zeiss OPMI VISU 200', desc: 'Хирургический микроскоп со стерео-тубусом ассистента' },
  { id: 12, badge: '12', name: 'Офтальмоскоп Keeler Professional', desc: 'Ручной прямой офтальмоскоп для осмотра глазного дна' },
  { id: 13, badge: '13', name: 'Офтальмоскоп Keeler Vantage Plus LED', desc: 'Беспроводной налобный офтальмоскоп для осмотра глазного дна' },
  { id: 14, badge: '14', name: 'Портативная фундус-камера MES PFC01', desc: 'Ручная съёмка глазного дна без расширения зрачка' }
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  for (const w of [375, 768, 1024, 1440]) {
    await page.setViewport({ width: w, height: 900, isMobile: w === 375 });
    await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
    const res = await page.evaluate((newCards) => {
      const wall = document.querySelector('.equip-wall');
      newCards.forEach(c => {
        const cell = document.createElement('div');
        cell.className = 'equip-cell reveal';
        cell.innerHTML = `
          <div class="equip-cell__thumb">
            <span class="equip-cell__index">${c.badge}</span>
            <div style="width:100%;height:100%;background:#e2e8f0;"></div>
          </div>
          <h3 class="equip-cell__name">${c.name}</h3>
          <p class="equip-cell__desc">${c.desc}</p>
        `;
        wall.appendChild(cell);
      });
      return Array.from(wall.querySelectorAll('.equip-cell')).map((c, i) => {
        const r = c.getBoundingClientRect();
        const n = c.querySelector('.equip-cell__name').textContent.trim();
        const d = c.querySelector('.equip-cell__desc').textContent.trim();
        const idx = c.querySelector('.equip-cell__index').textContent.trim();
        return { idx, n, d, h: Math.round(r.height * 10) / 10, top: Math.round(r.top) };
      });
    }, ruCards);

    console.log(`\nRU at ${w}px:`);
    const newItems = res.filter(x => ['11', '12', '13', '14'].includes(x.idx));
    newItems.forEach(x => console.log(`  Card ${x.idx}: "${x.n}" | height: ${x.h}px`));
    const heights11to14 = newItems.map(x => x.h);
    console.log(`  New row (cards 11-14) heights: [${heights11to14.join(', ')}] -> ${heights11to14.every(h => Math.abs(h - heights11to14[0]) <= 1) ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
    
    // Rows
    const rows = {};
    res.forEach(c => {
      const rowKey = Math.round(c.top / 8) * 8;
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(c);
    });
    console.log('  Rows breakdown:');
    Object.entries(rows).forEach(([k, items], rIdx) => {
      const hList = items.map(i => i.h);
      const isUnif = hList.every(h => Math.abs(h - hList[0]) <= 1);
      console.log(`    Row ${rIdx + 1} (${items.length} cards, [${items.map(i => i.idx).join(', ')}]): heights=[${hList.join(', ')}] -> ${isUnif ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
    });
  }
  await browser.close();
}

main().catch(console.error);
