const puppeteer = require('puppeteer-core');
const fs = require('fs');

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
  const languages = ['uz', 'en', 'ru'];
  const viewports = [
    { name: '375px', width: 375, height: 812, isMobile: true },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '1440px', width: 1440, height: 900, isMobile: false }
  ];

  for (const lang of languages) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });

      // Wait a bit for fonts/layout
      await new Promise(r => setTimeout(r, 600));

      const data = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        return cells.map((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          const nameEl = cell.querySelector('.equip-cell__name');
          const descEl = cell.querySelector('.equip-cell__desc');
          const indexEl = cell.querySelector('.equip-cell__index');
          return {
            index: indexEl ? indexEl.textContent.trim() : String(idx + 1),
            name: nameEl ? nameEl.textContent.trim() : '',
            desc: descEl ? descEl.textContent.trim() : '',
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            top: Math.round(rect.top)
          };
        });
      });

      console.log(`\nViewport ${vp.name} (${vp.width}x${vp.height}):`);
      const card4 = data.find(c => c.index === '04');
      if (card4) {
        console.log(`  Card 04: Name: "${card4.name}" | Desc: "${card4.desc}"`);
        console.log(`  Card 04 Dimensions: ${card4.width} x ${card4.height} px`);
      }

      // Group cards by row (by top offset)
      const rows = {};
      data.forEach(c => {
        const rowKey = Math.round(c.top / 10) * 10;
        if (!rows[rowKey]) rows[rowKey] = [];
        rows[rowKey].push(c);
      });

      console.log('  Row heights:');
      Object.entries(rows).forEach(([key, items], rIdx) => {
        const heights = items.map(i => i.height);
        const allSame = heights.every(h => h === heights[0]);
        console.log(`    Row ${rIdx + 1} (${items.length} cards, indices: ${items.map(i => i.index).join(', ')}): heights = [${heights.join(', ')}] -> ${allSame ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
      });

      // Capture screenshot of card 04 and wall
      const card4Handle = await page.$('.equip-cell:nth-child(4)');
      if (card4Handle) {
        await card4Handle.screenshot({
          path: `scratch/equip_card4_${lang}_${vp.name}.png`
        });
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
