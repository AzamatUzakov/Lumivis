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
  const server = spawn('npx', ['astro', 'preview', '--port', '4388'], {
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
    { width: 1280, height: 800, name: '1280px' },
    { width: 1440, height: 900, name: '1440px' }
  ];

  for (const lang of ['uz', 'ru', 'en']) {
    console.log(`\n========================================`);
    console.log(`         LANGUAGE: /${lang}/            `);
    console.log(`========================================`);

    for (const vp of viewports) {
      await page.setViewport(vp);
      await page.goto(`http://localhost:4388/${lang}/`, { waitUntil: 'networkidle2' });

      // Check header links and wrap status
      const data = await page.evaluate(() => {
        const headerNavLinks = Array.from(document.querySelectorAll('.header-nav__link')).map(a => ({
          text: a.innerText,
          href: a.getAttribute('href')
        }));

        const footerNavLinks = Array.from(document.querySelectorAll('.footer-nav__link')).map(a => ({
          text: a.innerText,
          href: a.getAttribute('href')
        }));

        const mobileNavLinks = Array.from(document.querySelectorAll('.mobile-menu__link')).map(a => ({
          text: a.innerText,
          href: a.getAttribute('href')
        }));

        const footerTagline = document.querySelector('.footer-tagline')?.innerText || '';

        const headerNav = document.querySelector('.header-nav');
        const headerNavRect = headerNav ? headerNav.getBoundingClientRect() : null;

        const bodyScrollWidth = document.body.scrollWidth;

        return {
          headerNavLinks,
          footerNavLinks,
          mobileNavLinks,
          footerTagline,
          bodyScrollWidth,
          headerNavWidth: headerNavRect ? headerNavRect.width : 0
        };
      });

      console.log(`[${vp.name}]`);
      console.log(`  Body Scroll Width: ${data.bodyScrollWidth}px (Horiz scroll? ${data.bodyScrollWidth > vp.width})`);
      const retLink = data.headerNavLinks.find(l => l.href === '#retinopathy') || data.footerNavLinks.find(l => l.href === '#retinopathy');
      console.log(`  Nav Retinopathy Text: "${retLink ? retLink.text : ''}"`);
      if (vp.width === 375) {
        console.log(`  Footer Tagline: "${data.footerTagline.substring(0, 100)}..."`);
      }

      // Test smooth scroll to #retinopathy click
      if (vp.width >= 1024) {
        const linkSelector = 'a.header-nav__link[href="#retinopathy"]';
        const link = await page.$(linkSelector);
        if (link) {
          await link.click();
          await new Promise(r => setTimeout(r, 1200)); // wait for Lenis smooth scroll
          const scrollY = await page.evaluate(() => window.scrollY);
          const retSectionTop = await page.evaluate(() => {
            const sec = document.querySelector('#retinopathy');
            return sec ? sec.offsetTop : 0;
          });
          console.log(`  Click #retinopathy scrollY: ${scrollY}px (Section Top: ${retSectionTop}px)`);
        }
      }
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
