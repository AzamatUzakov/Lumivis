import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\c681e96b-61c3-4c12-a615-88a5c110e595';

const viewports = [
  { width: 393, height: 850 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const lang of ['ru', 'uz']) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });

      // Switch language
      await page.evaluate((l) => {
        const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
        if (btn) btn.click();
      }, lang);
      await new Promise(r => setTimeout(r, 300));

      // Scroll to services section
      const servicesEl = await page.$('#services');
      if (servicesEl) {
        await servicesEl.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
      }
      await new Promise(r => setTimeout(r, 400));

      const screenshotPath = path.join(outputDir, `rn_card_${lang}_${vp.width}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved: ${screenshotPath}`);
    }
  }

  await browser.close();
  console.log('All screenshots done.');
})();
