import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    page.on('console', async msg => {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '')));
      console.log('PAGE LOG:', args.join(' '));
    });

    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
      const section = document.getElementById('prosthetics');
      if (section) {
        const top = section.offsetTop;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    const sLeft1 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);

    await new Promise(r => setTimeout(r, 2000));

    const sLeft2 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);

    console.log(`\nFINAL SCORES: sLeft1=${sLeft1.toFixed(1)}, sLeft2=${sLeft2.toFixed(1)}`);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
