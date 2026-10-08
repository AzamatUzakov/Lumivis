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
  const server = spawn('npx', ['astro', 'preview', '--port', '4360'], {
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

  for (const lang of ['uz', 'ru', 'en']) {
    console.log(`\n=== LANGUAGE: /${lang}/ ===`);
    for (const vp of viewports) {
      await page.setViewport(vp);
      await page.goto(`http://localhost:4360/${lang}/`, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        const card3 = document.querySelector('.bento-item--squint .bento-card');
        const card4 = document.querySelector('.bento-item--amb .bento-card');

        const title3 = card3 ? card3.querySelector('.bento-title').innerText : '';
        const desc4 = card4 ? card4.querySelector('.bento-text').innerText : '';

        const rect3 = card3 ? card3.getBoundingClientRect() : null;
        const rect4 = card4 ? card4.getBoundingClientRect() : null;

        return {
          title3,
          desc4,
          h3: rect3 ? rect3.height : 0,
          h4: rect4 ? rect4.height : 0,
          top3: rect3 ? rect3.top : 0,
          top4: rect4 ? rect4.top : 0,
          bodyScrollWidth: document.body.scrollWidth
        };
      });

      console.log(`[Viewport ${vp.width}px]`);
      console.log(`  Card 03 Title: "${data.title3}" | Height: ${data.h3.toFixed(1)}px`);
      console.log(`  Card 04 Desc: "${data.desc4}" | Height: ${data.h4.toFixed(1)}px`);
      console.log(`  Cards same row/height? Card3 Top: ${data.top3.toFixed(1)}px, Card4 Top: ${data.top4.toFixed(1)}px`);
      console.log(`  Body Scroll Width: ${data.bodyScrollWidth}px`);
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
