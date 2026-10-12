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
  const expectedDesc = {
    ru: "С аппликационным тонометром и фотокамерой",
    uz: "Ko'z ichki tuzilmalarini qatlam-qatlam ko'rikdan o'tkazish",
    en: "Layer-by-layer examination of internal ocular structures"
  };

  for (let lang of ['ru', 'uz', 'en']) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (let w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });

      const cardInfo = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        const cell4 = cells[3]; // card 04
        const nameEl = cell4.querySelector('.equip-cell__name');
        const descEl = cell4.querySelector('.equip-cell__desc');
        const badgeEl = cell4.querySelector('.equip-cell__index');

        const allHeights = cells.map(c => Math.round(c.getBoundingClientRect().height));

        return {
          badge: badgeEl?.innerText.trim(),
          name: nameEl?.innerText.trim(),
          desc: descEl?.innerText.trim(),
          cardHeight: Math.round(cell4.getBoundingClientRect().height),
          cardWidth: Math.round(cell4.getBoundingClientRect().width),
          allHeights
        };
      });

      console.log(`Width ${w}px: Badge: ${cardInfo.badge} | Name: "${cardInfo.name}" | Desc: "${cardInfo.desc}"`);
      console.log(`  Height of Card 04: ${cardInfo.cardHeight}px | Row heights: [${cardInfo.allHeights.slice(0, 5).join(', ')}]`);

      if (cardInfo.desc !== expectedDesc[lang]) {
        console.error(`  ERROR: Expected "${expectedDesc[lang]}" but got "${cardInfo.desc}"`);
      }

      // Screenshots for RU
      if (lang === 'ru') {
        if (w === 1440) {
          const cellEl = (await page.$$('.equip-cell'))[3];
          await cellEl.screenshot({ path: 'scratch/equip_card4_final_1440px.png' });
          const wallEl = await page.$('.equip-wall');
          await wallEl.screenshot({ path: 'scratch/equip_wall_final_1440px.png' });
        } else if (w === 375) {
          const cellEl = (await page.$$('.equip-cell'))[3];
          await cellEl.screenshot({ path: 'scratch/equip_card4_final_375px.png' });
        }
      }

      await page.close();
    }
  }

  await browser.close();
  console.log('\nVerification complete!');
})();
