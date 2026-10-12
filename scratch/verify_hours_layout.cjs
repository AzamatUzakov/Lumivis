const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const languages = ['ru', 'uz', 'en'];
  const viewports = [
    { name: '375px', width: 375, height: 812, isMobile: true },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '1440px', width: 1440, height: 900, isMobile: false }
  ];

  for (const lang of languages) {
    console.log(`\n================ LANG: /${lang}/ ================`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      const layoutData = await page.evaluate(() => {
        const header = document.querySelector('.site-header');
        const headerHours = document.querySelector('.header-hours');
        const mobBadge = document.querySelector('.mobile-menu__hours-badge');
        const mapHours = document.querySelector('[data-i18n="map.hours"]');
        const footerHours = document.querySelector('.footer-contacts__hours');

        return {
          headerHeight: header ? header.offsetHeight : null,
          headerHoursVisible: headerHours ? window.getComputedStyle(headerHours).display !== 'none' : false,
          headerHoursText: headerHours ? headerHours.textContent.trim() : null,
          mobBadgeText: mobBadge ? mobBadge.textContent.trim() : null,
          mapHoursText: mapHours ? mapHours.textContent.trim() : null,
          footerHoursText: footerHours ? footerHours.textContent.trim() : null,
          docScrollWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth
        };
      });

      console.log(`Viewport ${vp.name}:`);
      console.log(`  Header height: ${layoutData.headerHeight}px (overflow: ${layoutData.docScrollWidth > layoutData.winWidth})`);
      console.log(`  Header hours visible: ${layoutData.headerHoursVisible} | text: "${layoutData.headerHoursText}"`);
      console.log(`  Mobile badge text: "${layoutData.mobBadgeText}"`);
      console.log(`  MapSection hours: "${layoutData.mapHoursText}"`);
      console.log(`  Footer hours: "${layoutData.footerHoursText}"`);
    }
  }

  await browser.close();
}

run().catch(console.error);
