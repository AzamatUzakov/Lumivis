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
  const server = spawn('npx', ['astro', 'preview', '--port', '4355'], {
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

  const viewports = [
    { width: 375, height: 812, name: '375px (mobile)' },
    { width: 768, height: 1024, name: '768px (tablet)' },
    { width: 1024, height: 768, name: '1024px (small desktop)' },
    { width: 1440, height: 900, name: '1440px (desktop)' }
  ];

  const langs = ['uz', 'ru', 'en'];

  for (const lang of langs) {
    console.log(`\n========================================`);
    console.log(`         LANGUAGE: /${lang}/            `);
    console.log(`========================================`);

    for (const vp of viewports) {
      await page.setViewport(vp);
      await page.goto(`http://localhost:4355/${lang}/`, { waitUntil: 'networkidle2' });

      // Hide mobile menu offscreen element if present
      await page.evaluate(() => {
        const menu = document.getElementById('mobile-menu');
        if (menu) {
          menu.style.visibility = 'hidden';
        }
      });

      const data = await page.evaluate(() => {
        const card = document.querySelector('.bento-card--rn');
        const badge = document.querySelector('.bento-card--rn .bento-badge');
        const num01 = document.querySelector('.bento-num--rn');
        const btn = document.querySelector('.bento-rn-btn');
        const heroBadge = document.querySelector('.hero .badge, .hero .reveal-hero .badge');

        const cardRect = card ? card.getBoundingClientRect() : null;
        const badgeRect = badge ? badge.getBoundingClientRect() : null;
        const numRect = num01 ? num01.getBoundingClientRect() : null;
        const btnRect = btn ? btn.getBoundingClientRect() : null;

        const bodyScrollWidth = document.body.scrollWidth;

        // Check if badge overlaps number 01
        let badgeOverlapsNum = false;
        if (badgeRect && numRect && num01 && getComputedStyle(num01).display !== 'none') {
          badgeOverlapsNum = !(
            badgeRect.right < numRect.left ||
            badgeRect.left > numRect.right ||
            badgeRect.bottom < numRect.top ||
            badgeRect.top > numRect.bottom
          );
        }

        // Check if button is fully inside card
        let btnOverflowsCard = false;
        if (btnRect && cardRect) {
          btnOverflowsCard = btnRect.bottom > cardRect.bottom + 2;
        }

        return {
          cardWidth: cardRect ? cardRect.width : 0,
          cardRight: cardRect ? cardRect.right : 0,
          badgeWidth: badgeRect ? badgeRect.width : 0,
          badgeRight: badgeRect ? badgeRect.right : 0,
          badgeHeight: badgeRect ? badgeRect.height : 0,
          badgeText: badge ? badge.innerText.replace(/\n/g, ' ') : '',
          heroBadgeText: heroBadge ? heroBadge.innerText.replace(/\n/g, ' ') : '',
          bodyScrollWidth,
          badgeOverlapsNum,
          btnOverflowsCard,
          badgeOverflowsCard: badgeRect && cardRect ? badgeRect.right > cardRect.right + 1.5 : false
        };
      });

      console.log(`[${vp.name}]`);
      console.log(`  Body Scroll Width: ${data.bodyScrollWidth}px (Horiz scroll? ${data.bodyScrollWidth > vp.width})`);
      console.log(`  Card Width: ${data.cardWidth.toFixed(1)}px`);
      console.log(`  Badge Width: ${data.badgeWidth.toFixed(1)}px | Height: ${data.badgeHeight.toFixed(1)}px`);
      console.log(`  Badge Overflows Card? ${data.badgeOverflowsCard}`);
      console.log(`  Badge Overlaps '01'? ${data.badgeOverlapsNum}`);
      console.log(`  CTA Button Overflows Card? ${data.btnOverflowsCard}`);
      console.log(`  Badge Text: "${data.badgeText}"`);
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
