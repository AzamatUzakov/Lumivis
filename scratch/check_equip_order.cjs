const puppeteer = require('puppeteer-core');
const fs = require('fs');

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

  const langs = ['ru', 'uz', 'en'];
  const widths = [375, 768, 1440];

  for (const lang of langs) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    // Use the dev server running on 4321
    await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });

    const cards = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.equip-cell'));
      return cells.map((cell, idx) => {
        const badge = cell.querySelector('.equip-cell__index')?.innerText.trim();
        const name = cell.querySelector('.equip-cell__name')?.innerText.trim();
        const desc = cell.querySelector('.equip-cell__desc')?.innerText.trim();
        const imgSrc = cell.querySelector('img')?.getAttribute('src');
        const imgAlt = cell.querySelector('img')?.getAttribute('alt');
        const hasReveal = cell.classList.contains('reveal');
        return { pos: idx + 1, badge, name, desc, imgSrc, imgAlt, hasReveal };
      });
    });

    console.log(`Total cards found: ${cards.length}`);
    cards.forEach(c => {
      console.log(`Pos ${c.pos} | Badge: ${c.badge} | Name: "${c.name}" | Img: ${c.imgSrc ? 'yes' : 'no'} | Reveal: ${c.hasReveal}`);
    });

    await page.close();
  }

  // Check overflow at 375, 768, 1440 on /ru/
  console.log(`\n=================== RESPONSIVE CHECK ===================`);
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, isMobile: w < 768 });
    await page.goto(`http://localhost:4321/ru/`, { waitUntil: 'networkidle2' });

    const layout = await page.evaluate((winWidth) => {
      const equipSection = document.getElementById('equipment');
      const equipWall = document.querySelector('.equip-wall');
      const cells = Array.from(document.querySelectorAll('.equip-cell'));
      const computedWall = window.getComputedStyle(equipWall);
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const pageOverflow = docScrollWidth > winWidth + 1 || bodyScrollWidth > winWidth + 1;

      return {
        winWidth,
        display: computedWall.display,
        gridTemplateColumns: computedWall.gridTemplateColumns,
        scrollSnapType: computedWall.scrollSnapType,
        overflowX: computedWall.overflowX,
        cellsCount: cells.length,
        pageOverflow
      };
    }, w);

    console.log(`Width ${w}px: display=${layout.display}, cols=${layout.gridTemplateColumns || 'none'}, scrollSnap=${layout.scrollSnapType}, pageOverflow=${layout.pageOverflow}`);
    await page.close();
  }

  await browser.close();
  console.log('\nVerification complete!');
})();
