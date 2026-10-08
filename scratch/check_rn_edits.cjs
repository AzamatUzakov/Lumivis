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
  const server = spawn('npx', ['astro', 'preview', '--port', '4366'], {
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
    { width: 375, height: 812, name: '375px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 1024, height: 768, name: '1024px' },
    { width: 1440, height: 900, name: '1440px' }
  ];

  for (const lang of ['uz', 'ru', 'en']) {
    console.log(`\n========================================`);
    console.log(`         LANGUAGE: /${lang}/            `);
    console.log(`========================================`);

    for (const vp of viewports) {
      await page.setViewport(vp);
      await page.goto(`http://localhost:4366/${lang}/`, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        const ctaBtn = document.querySelector('.rn__cta');
        const fact1 = document.querySelectorAll('.rn__fact')[0];
        const fact2 = document.querySelectorAll('.rn__fact')[1];
        const container = document.querySelector('#retinopathy .container');

        const btnRect = ctaBtn ? ctaBtn.getBoundingClientRect() : null;
        const fact1Rect = fact1 ? fact1.getBoundingClientRect() : null;
        const fact2Rect = fact2 ? fact2.getBoundingClientRect() : null;
        const containerRect = container ? container.getBoundingClientRect() : null;

        const bodyScrollWidth = document.body.scrollWidth;

        // Check if facts overlap
        let factsOverlap = false;
        if (fact1Rect && fact2Rect) {
          factsOverlap = !(
            fact1Rect.right < fact2Rect.left ||
            fact1Rect.left > fact2Rect.right ||
            fact1Rect.bottom < fact2Rect.top ||
            fact1Rect.top > fact2Rect.bottom
          );
        }

        // Check if CTA button overflows viewport or container
        let btnOverflows = false;
        if (btnRect && containerRect) {
          btnOverflows = btnRect.right > containerRect.right + 2 || btnRect.left < containerRect.left - 2;
        }

        return {
          btnText: ctaBtn ? ctaBtn.innerText.replace(/\n/g, ' ') : '',
          fact2Text: fact2 ? fact2.innerText.replace(/\n/g, ' ') : '',
          btnWidth: btnRect ? btnRect.width : 0,
          bodyScrollWidth,
          factsOverlap,
          btnOverflows
        };
      });

      console.log(`[${vp.name}]`);
      console.log(`  Body Scroll Width: ${data.bodyScrollWidth}px (Horiz scroll? ${data.bodyScrollWidth > vp.width})`);
      console.log(`  CTA Button Width: ${data.btnWidth.toFixed(1)}px | Text: "${data.btnText}"`);
      console.log(`  CTA Button Overflows Container? ${data.btnOverflows}`);
      console.log(`  Facts 1 and 2 Overlap? ${data.factsOverlap}`);
      console.log(`  Fact 2 Text: "${data.fact2Text}"`);
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
