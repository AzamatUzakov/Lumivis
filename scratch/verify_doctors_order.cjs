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
    await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });

    const doctors = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.doctor-card'));
      return cards.map((card, idx) => {
        const name = card.querySelector('.doctor-card__name')?.innerText.trim();
        const spec = card.querySelector('.doctor-card__spec')?.innerText.trim();
        const img = card.querySelector('.doctor-card__img');
        const imgSrc = img?.getAttribute('src');
        const imgAlt = img?.getAttribute('alt');
        const objPos = img ? window.getComputedStyle(img).objectPosition : '';
        const hasReveal = card.classList.contains('reveal');
        return { pos: idx + 1, name, spec, imgSrc, imgAlt, objPos, hasReveal };
      });
    });

    console.log(`Total doctors found: ${doctors.length}`);
    doctors.forEach(d => {
      console.log(`Pos ${d.pos} | Name: "${d.name}" | Spec: "${d.spec.slice(0, 35)}..." | Img: ${d.imgSrc ? 'yes' : 'no'} | Reveal: ${d.hasReveal}`);
    });

    await page.close();
  }

  // Responsive & Autoscroll check
  console.log(`\n=================== RESPONSIVE CHECK ===================`);
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
    await page.goto(`http://localhost:4321/ru/`, { waitUntil: 'networkidle2' });

    const layout = await page.evaluate((winWidth) => {
      const grid = document.querySelector('.doctors__grid');
      const cards = Array.from(document.querySelectorAll('.doctor-card'));
      const computed = window.getComputedStyle(grid);
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const pageOverflow = docScrollWidth > winWidth + 1 || bodyScrollWidth > winWidth + 1;

      return {
        winWidth,
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        scrollSnapType: computed.scrollSnapType,
        cardsCount: cards.length,
        pageOverflow
      };
    }, w);

    console.log(`Width ${w}px: display=${layout.display}, cols=${layout.gridTemplateColumns || 'none'}, scrollSnap=${layout.scrollSnapType}, pageOverflow=${layout.pageOverflow}`);

    // If mobile, check if autoscroll script works without errors
    if (w === 375) {
      const initialScroll = await page.evaluate(() => document.querySelector('.doctors__grid').scrollLeft);
      // wait 2.5s to see autoscroll advance
      await new Promise(r => setTimeout(r, 2600));
      const afterScroll = await page.evaluate(() => document.querySelector('.doctors__grid').scrollLeft);
      console.log(`Mobile autoscroll test: initial=${initialScroll}, after 2.6s=${afterScroll}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\nVerification complete!');
})();
