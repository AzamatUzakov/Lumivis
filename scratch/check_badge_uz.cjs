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
  const server = spawn('npx', ['astro', 'preview', '--port', '4349'], {
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
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewport(vp);
    await page.goto('http://localhost:4349/uz/', { waitUntil: 'networkidle2' });

    const result = await page.evaluate(() => {
      const card = document.querySelector('.bento-card--rn');
      const badge = document.querySelector('.bento-card--rn .bento-badge');
      const text = document.querySelector('.bento-rn-text');
      const title = document.querySelector('.bento-rn-title');

      const cardRect = card ? card.getBoundingClientRect() : null;
      const badgeRect = badge ? badge.getBoundingClientRect() : null;

      const bodyScrollWidth = document.body.scrollWidth;

      return {
        cardRight: cardRect ? cardRect.right : 0,
        cardWidth: cardRect ? cardRect.width : 0,
        badgeRight: badgeRect ? badgeRect.right : 0,
        badgeWidth: badgeRect ? badgeRect.width : 0,
        badgeText: badge ? badge.innerText : '',
        titleText: title ? title.innerText : '',
        descText: text ? text.innerText : '',
        bodyScrollWidth
      };
    });

    console.log(`=== VIEWPORT ${vp.width}px ===`);
    console.log(`Body Scroll Width: ${result.bodyScrollWidth}px`);
    console.log(`Card Width: ${result.cardWidth.toFixed(1)}px | Right: ${result.cardRight.toFixed(1)}px`);
    console.log(`Badge Text: "${result.badgeText}"`);
    console.log(`Badge Width: ${result.badgeWidth.toFixed(1)}px | Right: ${result.badgeRight.toFixed(1)}px`);
    console.log(`Badge Overflows Card? ${result.badgeRight > result.cardRight}`);
    console.log(`Title: "${result.titleText}"`);
    console.log(`Description: "${result.descText}"\n`);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
