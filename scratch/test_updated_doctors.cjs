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

  const widths = [375, 768, 1440];
  const langs = ['ru', 'uz', 'en'];

  for (const lang of langs) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (const w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });

      const cardsData = await page.evaluate((winW) => {
        const cards = Array.from(document.querySelectorAll('.doctor-card'));
        return cards.map((c, idx) => {
          const nameEl = c.querySelector('.doctor-card__name');
          const specEl = c.querySelector('.doctor-card__spec');
          const infoEl = c.querySelector('.doctor-card__info');
          const imgEl = c.querySelector('.doctor-card__img');
          const cardRect = c.getBoundingClientRect();
          const infoRect = infoEl.getBoundingClientRect();

          return {
            pos: idx + 1,
            name: nameEl?.innerText.replace('\n', ' ').trim(),
            spec: specEl?.innerText.replace('\n', ' ').trim(),
            cardHeight: Math.round(cardRect.height),
            cardWidth: Math.round(cardRect.width),
            infoHeight: Math.round(infoRect.height),
            infoScrollHeight: infoEl.scrollHeight,
            specClientHeight: specEl.clientHeight,
            specScrollHeight: specEl.scrollHeight,
            specClamped: specEl.scrollHeight > specEl.clientHeight + 1,
            infoOverflow: infoEl.scrollHeight > infoEl.clientHeight + 1
          };
        });
      }, w);

      console.log(`Width ${w}px:`);
      const card1 = cardsData[0];
      console.log(`  Card 1 (Boboev): cardH=${card1.cardHeight}px, infoH=${card1.infoHeight}px (scrollH=${card1.infoScrollHeight}px), specClamped=${card1.specClamped}`);
      console.log(`  Card 1 text: "${card1.spec}"`);

      // Check if all cards in row have equal height
      const uniqueHeights = [...new Set(cardsData.map(c => c.cardHeight))];
      const uniqueInfoHeights = [...new Set(cardsData.map(c => c.infoHeight))];
      console.log(`  Card heights: [${uniqueHeights.join(', ')}], Info heights: [${uniqueInfoHeights.join(', ')}]`);

      const anyInfoOverflow = cardsData.some(c => c.infoOverflow);
      console.log(`  Any card info overflow? ${anyInfoOverflow}`);

      // Capture screenshots for RU at 375 and 1440
      if (lang === 'ru') {
        if (w === 375) {
          const cardEl = await page.$('.doctor-card');
          await cardEl.screenshot({ path: 'scratch/doctor_card_1_375px.png' });
          const gridEl = await page.$('.doctors__grid');
          await gridEl.screenshot({ path: 'scratch/doctors_grid_375px.png' });
        } else if (w === 1440) {
          const cardEl = await page.$('.doctor-card');
          await cardEl.screenshot({ path: 'scratch/doctor_card_1_1440px.png' });
          const gridEl = await page.$('.doctors__grid');
          await gridEl.screenshot({ path: 'scratch/doctors_grid_1440px.png' });
        }
      }

      await page.close();
    }
  }

  // Mobile autoscroll test
  console.log(`\n=================== MOBILE AUTOSCROLL TEST ===================`);
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 375, height: 900, isMobile: true });
  await mobilePage.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });

  const initialScroll = await mobilePage.evaluate(() => document.querySelector('.doctors__grid').scrollLeft);
  await new Promise(r => setTimeout(r, 2600));
  const afterScroll = await mobilePage.evaluate(() => document.querySelector('.doctors__grid').scrollLeft);
  console.log(`Mobile autoscroll: initial=${initialScroll}, after 2.6s=${afterScroll}`);
  await mobilePage.close();

  await browser.close();
  console.log('\nVerification complete!');
})();
