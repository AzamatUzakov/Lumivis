const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function checkOverflow() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
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

        let culprits = [];
        if (hasOverflow) {
          const all = document.querySelectorAll('*');
          all.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              culprits.push({
                tag: el.tagName,
                class: el.className,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          });
        }

        return {
          winWidth,
          docWidth,
          bodyWidth,
          hasOverflow,
          culprits: culprits.slice(0, 5)
        };
      }, width);

      if (overflow.hasOverflow) {
        anyOverflow = true;
        console.error(`✗ OVERFLOW DETECTED on /${lang}/ at ${width}px:`, overflow);
      } else {
        console.log(`✓ /${lang}/ at ${width}px: NO OVERFLOW (window: ${width}px, scrollWidth: ${overflow.docWidth}px)`);
      }
    }
  }

  await browser.close();
  if (!anyOverflow) {
    console.log('\n>>> diagnose_overflow check: 100% CLEAN! No horizontal scroll on any page or viewport. <<<');
  }
}

checkOverflow().catch(console.error);
