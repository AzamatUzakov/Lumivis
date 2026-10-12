const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function capture() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const width of [1440, 1024]) {
    await page.setViewport({ width, height: 1000 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
        el.classList.add('is-visible');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      const el = document.getElementById('equipment');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    const wall = await page.$('.equip-wall');
    if (wall) {
      await wall.screenshot({ path: `scratch/equip_wall_${width}px_visible.png` });
      console.log(`Saved scratch/equip_wall_${width}px_visible.png`);
    }

    // Also screenshot only the 3rd row area
    // Get bounding boxes of cards 11-14
    const row3Info = await page.evaluate(() => {
      const wall = document.querySelector('.equip-wall');
      const cells = Array.from(wall.querySelectorAll('.equip-cell'));
      const row3Cells = cells.slice(10); // 11, 12, 13, 14
      const rects = row3Cells.map(c => c.getBoundingClientRect());
      const wallRect = wall.getBoundingClientRect();
      return {
        top: Math.min(...rects.map(r => r.top)) - 5,
        bottom: Math.max(...rects.map(r => r.bottom)) + 5,
        left: wallRect.left - 5,
        right: wallRect.right + 5
      };
    });

    await page.screenshot({
      path: `scratch/equip_row3_${width}px.png`,
      clip: {
        x: Math.max(0, row3Info.left),
        y: Math.max(0, row3Info.top),
        width: row3Info.right - row3Info.left,
        height: row3Info.bottom - row3Info.top
      }
    });
    console.log(`Saved scratch/equip_row3_${width}px.png`);
  }

  // Also capture cards 11-14 individually on 1440px
  const cells = await page.$$('.equip-cell');
  for (let i = 10; i < cells.length; i++) {
    await cells[i].screenshot({ path: `scratch/card_${i + 1}_real.png` });
    console.log(`Saved scratch/card_${i + 1}_real.png`);
  }

  await browser.close();
}

capture().catch(console.error);
