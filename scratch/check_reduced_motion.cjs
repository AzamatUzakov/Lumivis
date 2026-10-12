const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function checkReducedMotion() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  const langs = ['ru', 'uz', 'en'];
  const viewports = [375, 768, 1440];

  let anyOverflow = false;

  for (const lang of langs) {
    for (const width of viewports) {
      await page.setViewport({ width, height: 900, isMobile: width < 768 });
      await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });

      const overflow = await page.evaluate((w) => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth || bodyWidth > winWidth;
        return { winWidth, docWidth, hasOverflow };
      }, width);

      if (overflow.hasOverflow) {
        anyOverflow = true;
        console.error(`✗ REDUCED-MOTION OVERFLOW on /${lang}/ at ${width}px:`, overflow);
      } else {
        console.log(`✓ REDUCED-MOTION /${lang}/ at ${width}px: NO OVERFLOW`);
      }
    }
  }

  await browser.close();
  if (!anyOverflow) {
    console.log('\n>>> Reduced motion check: 100% CLEAN! <<<');
  }
}

checkReducedMotion().catch(console.error);
