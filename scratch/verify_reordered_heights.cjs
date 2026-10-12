const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const langs = ['ru', 'uz', 'en'];
  const viewports = [
    { name: '1440px', width: 1440, height: 900, isMobile: false },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '375px', width: 375, height: 812, isMobile: true }
  ];

  for (const lang of langs) {
    console.log(`\n=================== HEIGHT CHECK: /${lang}/ ===================`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
          el.classList.add('is-visible');
        });
      });
      await new Promise(r => setTimeout(r, 400));

      const cardData = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        return cells.map((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          const badge = cell.querySelector('.equip-cell__index')?.textContent.trim() || String(idx + 1);
          const name = cell.querySelector('.equip-cell__name')?.textContent.trim() || '';
          return {
            badge,
            name,
            height: Math.round(rect.height * 10) / 10,
            top: Math.round(rect.top)
          };
        });
      });

      console.log(`\nViewport ${vp.name} (${vp.width}x${vp.height}):`);
      // Group by top
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

  // Also take a screenshot of the new wall on 1440px
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
      el.classList.add('is-visible');
    });
  });
  await new Promise(r => setTimeout(r, 500));
  const wall = await page.$('.equip-wall');
  if (wall) {
    await wall.screenshot({ path: 'scratch/new_order_equip_wall_1440px.png' });
    console.log('\nSaved screenshot: scratch/new_order_equip_wall_1440px.png');
  }

  await browser.close();
}

main().catch(console.error);
