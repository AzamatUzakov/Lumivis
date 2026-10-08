const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  const server = spawn('npx', ['astro', 'preview', '--port', '4399'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 3500));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const lang of ['ru', 'uz', 'en']) {
    console.log(`\n========================================`);
    console.log(`         LANGUAGE: /${lang}/            `);
    console.log(`========================================`);

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:4399/${lang}/`, { waitUntil: 'networkidle2' });

    // Scroll to prosthetics section
    await page.evaluate(() => {
      const el = document.getElementById('prosthetics');
      if (el) el.scrollIntoView();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Check images of Case 3 vs Case 4 in all duplicated sets
    const caseData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.prosthetics-card'));
      return cards.map(c => {
        const title = c.querySelector('.prosthetics-card__title')?.innerText || '';
        const beforeImg = c.querySelector('.prosthetics-media--before img')?.getAttribute('src') || '';
        const afterImg = c.querySelector('.prosthetics-media--after img')?.getAttribute('src') || '';
        return { title, beforeImg, afterImg };
      });
    });

    console.log(`Total Cards in slider: ${caseData.length}`);
    caseData.slice(0, 6).forEach((c, idx) => {
      console.log(`  Card #${idx + 1}: "${c.title}"`);
      console.log(`    Before Src: ...${c.beforeImg.substring(c.beforeImg.lastIndexOf('/'))}`);
      console.log(`    After Src:  ...${c.afterImg.substring(c.afterImg.lastIndexOf('/'))}`);
    });

    // Verify auto-scroll movement
    const initialScroll = await page.evaluate(() => document.getElementById('prosthetics-slider')?.scrollLeft || 0);
    await new Promise(r => setTimeout(r, 1000));
    const laterScroll = await page.evaluate(() => document.getElementById('prosthetics-slider')?.scrollLeft || 0);
    console.log(`Auto-scroll working? Initial: ${initialScroll.toFixed(1)}px -> Later: ${laterScroll.toFixed(1)}px (Diff: ${(laterScroll - initialScroll).toFixed(1)}px)`);

    // Verify touch-action and overflow-x CSS
    const cssProps = await page.evaluate(() => {
      const slider = document.getElementById('prosthetics-slider');
      if (!slider) return {};
      const cs = window.getComputedStyle(slider);
      return {
        overflowX: cs.overflowX,
        touchAction: cs.touchAction,
        cursor: cs.cursor
      };
    });
    console.log(`Slider CSS -> overflowX: ${cssProps.overflowX}, touchAction: ${cssProps.touchAction}, cursor: ${cssProps.cursor}`);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
