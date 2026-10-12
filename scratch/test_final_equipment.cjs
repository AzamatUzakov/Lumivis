const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. LAZY LOADING VERIFICATION
  console.log('=== TEST 1: LAZY LOADING VERIFICATION ===');
  const requestedImages = [];
  page.on('request', req => {
    const url = req.url();
    if (/eq1[1-4]|zeiss|keeler|mes/i.test(url)) {
      requestedImages.push(url);
    }
  });

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  console.log('Requests for new equipment before scroll:', requestedImages.length);
  if (requestedImages.length === 0) {
    console.log('✓ LAZY LOADING PASSED: eq11-eq14 were NOT requested before scrolling!');
  } else {
    console.log('✗ FAILED: Images were requested prematurely:', requestedImages);
  }

  // 2. SCROLL TO EQUIPMENT AND VERIFY REVEAL
  console.log('\n=== TEST 2: SCROLL TO EQUIPMENT & REVEAL ===');
  await page.evaluate(() => {
    const el = document.getElementById('equipment');
    if (el) el.scrollIntoView({ behavior: 'instant' });
    // Also trigger reveal class on all cells
    document.querySelectorAll('.reveal').forEach(r => r.classList.add('revealed'));
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Requests for new equipment after scroll:', requestedImages.length);
  console.log('Loaded new equipment URLs:', requestedImages);

  // Take clean screenshots of equipment section
  const wall = await page.$('.equip-wall');
  if (wall) {
    await wall.screenshot({ path: 'scratch/equip_wall_1440px_revealed.png' });
    console.log('Saved scratch/equip_wall_1440px_revealed.png');
  }

  // Individual cards screenshots
  const cells = await page.$$('.equip-cell');
  console.log(`Total equipment cells found: ${cells.length}`);
  for (let i = 10; i < cells.length; i++) {
    await cells[i].screenshot({ path: `scratch/card_${i + 1}_revealed.png` });
    console.log(`Saved scratch/card_${i + 1}_revealed.png`);
  }

  // 3. CAPTURE ON 1024, 768, 375 px
  const viewports = [
    { name: '1024px', width: 1024, height: 900, isMobile: false },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '375px', width: 375, height: 812, isMobile: true }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const el = document.getElementById('equipment');
      if (el) el.scrollIntoView({ behavior: 'instant' });
      document.querySelectorAll('.reveal').forEach(r => r.classList.add('revealed'));
    });
    await new Promise(r => setTimeout(r, 800));
    const w = await page.$('.equip-wall');
    if (w) {
      await w.screenshot({ path: `scratch/equip_wall_${vp.name}_revealed.png` });
      console.log(`Saved scratch/equip_wall_${vp.name}_revealed.png`);
    }
  }

  // 4. MEASURE REAL HEIGHTS AND ROWS ACROSS RU, UZ, EN
  console.log('\n=== TEST 3: MEASURE HEIGHTS AND ROW UNIFORMITY ===');
  const langs = ['ru', 'uz', 'en'];
  const testVps = [
    { name: '1440px', width: 1440, height: 900, isMobile: false },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '375px', width: 375, height: 812, isMobile: true }
  ];

  for (const lang of langs) {
    console.log(`\n--- Language: /${lang}/ ---`);
    for (const vp of testVps) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach(r => r.classList.add('revealed'));
      });
      await new Promise(r => setTimeout(r, 500));

      const cardData = await page.evaluate(() => {
        const wall = document.querySelector('.equip-wall');
        const cells = Array.from(wall.querySelectorAll('.equip-cell'));
        return cells.map((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          const badge = cell.querySelector('.equip-cell__index')?.textContent.trim() || String(idx + 1);
          const name = cell.querySelector('.equip-cell__name')?.textContent.trim() || '';
          const desc = cell.querySelector('.equip-cell__desc')?.textContent.trim() || '';
          return {
            index: idx + 1,
            badge,
            name,
            desc,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            top: Math.round(rect.top)
          };
        });
      });

      console.log(`Viewport ${vp.name}: total cards = ${cardData.length}`);
      // Group into rows
      const rows = {};
      cardData.forEach(c => {
        const rowKey = Math.round(c.top / 6) * 6;
        if (!rows[rowKey]) rows[rowKey] = [];
        rows[rowKey].push(c);
      });

      Object.entries(rows).forEach(([key, items], rIdx) => {
        const heights = items.map(i => i.height);
        const uniform = heights.every(h => Math.abs(h - heights[0]) <= 1.5);
        console.log(`  Row ${rIdx + 1} (${items.length} cards, badges [${items.map(i=>i.badge).join(', ')}]): heights=[${heights.join(', ')}] -> ${uniform ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
      });
    }
  }

  await browser.close();
}

run().catch(console.error);
