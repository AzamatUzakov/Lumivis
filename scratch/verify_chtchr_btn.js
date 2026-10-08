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
    await page.goto('http://localhost:4321/uz/', { waitUntil: 'networkidle2' });

    // Scroll to services
    await page.evaluate(() => {
      const section = document.getElementById('services');
      if (section) section.scrollIntoView();
    });

    await new Promise(r => setTimeout(r, 500));

    // Click button
    await page.evaluate(() => {
      const btn = document.querySelector('.bento-card--rn .bento-rn-btn');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('rn-info-modal');
      return modal && modal.classList.contains('is-open');
    });

    console.log(`Modal is-open state: ${isModalOpen}`);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
