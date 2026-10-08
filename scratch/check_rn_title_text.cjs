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
  const server = spawn('npx', ['astro', 'preview', '--port', '4377'], {
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
      await page.goto(`http://localhost:4377/${lang}/`, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        const title = document.querySelector('.rn__title');
        const text = document.querySelector('.rn__text');
        const section = document.querySelector('#retinopathy');

        const titleRect = title ? title.getBoundingClientRect() : null;
        const textRect = text ? text.getBoundingClientRect() : null;
        const sectionRect = section ? section.getBoundingClientRect() : null;

        const bodyScrollWidth = document.body.scrollWidth;

        let titleOverflows = false;
        if (titleRect && sectionRect) {
          titleOverflows = titleRect.right > sectionRect.right + 2;
        }

        return {
          titleText: title ? title.innerText.replace(/\n/g, ' ') : '',
          textText: text ? text.innerText.replace(/\n/g, ' ') : '',
          titleWidth: titleRect ? titleRect.width : 0,
          titleHeight: titleRect ? titleRect.height : 0,
          bodyScrollWidth,
          titleOverflows
        };
      });

      console.log(`[${vp.name}]`);
      console.log(`  Body Scroll Width: ${data.bodyScrollWidth}px (Horiz scroll? ${data.bodyScrollWidth > vp.width})`);
      console.log(`  Title Width: ${data.titleWidth.toFixed(1)}px | Height: ${data.titleHeight.toFixed(1)}px`);
      console.log(`  Title Overflows Section? ${data.titleOverflows}`);
      console.log(`  Title Text: "${data.titleText}"`);
      console.log(`  Text Text: "${data.textText.substring(0, 80)}..."`);
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
