import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'Mobile 375px', width: 375, height: 812, isMobile: true, hasTouch: true },
    { name: 'Tablet 768px', width: 768, height: 1024, isMobile: false, hasTouch: false },
    { name: 'Desktop 1440px', width: 1440, height: 900, isMobile: false, hasTouch: false }
  ];

  const languages = ['ru', 'uz', 'en'];
  const baseUrl = 'http://localhost:4321';

  for (const lang of languages) {
    console.log(`\n==================================================`);
    console.log(` TESTING LANGUAGE: /${lang}/`);
    console.log(`==================================================`);

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} ---`);
      const page = await browser.newPage();
      await page.setViewport(vp);

      await page.goto(`${baseUrl}/${lang}/`, { waitUntil: 'networkidle2' });

      // Scroll section into view
      await page.evaluate(() => {
        const el = document.getElementById('prosthetics');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 500));

      // Test 1: Standard scrollLeft growth over 5s
      const samples = [];
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 500));
        const val = await page.evaluate(() => {
          const s = document.getElementById('prosthetics-slider');
          return s ? s.scrollLeft : -1;
        });
        samples.push(Math.round(val));
      }

      console.log(`[${vp.name}] Samples over 5s:`, samples);
      const delta = samples[samples.length - 1] - samples[0];
      console.log(`[${vp.name}] Did scrollLeft grow? ${delta > 50 ? 'YES' : 'NO'} (delta = ${delta}px)`);

      // Test 2: Seamless reset test
      const resetState = await page.evaluate(() => {
        const slider = document.getElementById('prosthetics-slider');
        if (!slider) return null;
        const firstCard = slider.querySelector('.prosthetics-card');
        if (!firstCard) return null;
        const gap = parseFloat(window.getComputedStyle(slider).gap) || 20;
        const singleSetWidth = 7 * (firstCard.offsetWidth + gap);
        const beforeReset = slider.scrollLeft;
        
        // Simulate near reset point
        slider.scrollLeft = singleSetWidth * 2 - 2;
        const setNearEnd = slider.scrollLeft;
        return { singleSetWidth, beforeReset, setNearEnd };
      });
      console.log(`[${vp.name}] Loop reset parameters:`, resetState);

      // Test 3: Overriding scrollLeft setter in browser to force Math.floor truncation (Simulating strict mobile WebKit)
      console.log(`[${vp.name}] Testing under forced Math.floor scrollLeft setter...`);
      await page.evaluate(() => {
        const slider = document.getElementById('prosthetics-slider');
        if (!slider) return;

        let internalScroll = slider.scrollLeft;
        Object.defineProperty(slider, 'scrollLeft', {
          get() {
            return internalScroll;
          },
          set(val) {
            internalScroll = Math.floor(val);
          },
          configurable: true
        });
      });

      const truncatedSamples = [];
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        const val = await page.evaluate(() => {
          const s = document.getElementById('prosthetics-slider');
          return s ? s.scrollLeft : -1;
        });
        truncatedSamples.push(val);
      }

      console.log(`[${vp.name}] Math.floor truncated scrollLeft samples:`, truncatedSamples);
      const truncDelta = truncatedSamples[truncatedSamples.length - 1] - truncatedSamples[0];
      console.log(`[${vp.name}] Did scrollLeft grow under Math.floor truncation? ${truncDelta > 20 ? 'YES' : 'NO'} (delta = ${truncDelta}px)`);

      // Test 4: Check vertical scroll ability
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await new Promise(r => setTimeout(r, 300));
      const verticalScrollOk = await page.evaluate(() => {
        return window.scrollY > 0;
      });
      console.log(`[${vp.name}] Vertical page scroll working: ${verticalScrollOk ? 'YES' : 'NO'}`);

      await page.close();
    }
  }

  await browser.close();
})();
