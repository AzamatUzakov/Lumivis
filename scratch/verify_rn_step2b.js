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

      // Check section and image
      const checkState = await page.evaluate(() => {
        const sec = document.getElementById('retinopathy');
        if (!sec) return { error: 'Section #retinopathy not found' };

        sec.scrollIntoView({ behavior: 'instant' });
        const img = sec.querySelector<HTMLImageElement>('.rn__img');
        const frame = sec.querySelector('.rn__img-frame');
        const cornerTl = sec.querySelector('.rn__img-corner--tl');
        const cornerBr = sec.querySelector('.rn__img-corner--br');

        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

        return {
          sectionExists: true,
          hasHorizontalScroll,
          img: img ? {
            src: img.currentSrc || img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            renderedWidth: Math.round(img.getBoundingClientRect().width),
            renderedHeight: Math.round(img.getBoundingClientRect().height)
          } : null,
          frameRect: frame ? {
            width: Math.round(frame.getBoundingClientRect().width),
            height: Math.round(frame.getBoundingClientRect().height)
          } : null,
          cornersPresent: !!cornerTl && !!cornerBr
        };
      });

      console.log(`[${vp.name}] State:`, checkState);
      await page.close();
    }
  }

  await browser.close();
})();
