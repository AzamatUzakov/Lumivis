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

  for (let hDesktop of [112, 114, 116]) {
    for (let hMobile of [104, 106, 108]) {
      console.log(`\n=================== Testing Desktop H: ${hDesktop}px, Mobile H: ${hMobile}px ===================`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });

      // Apply dynamic CSS
      await page.evaluate((hd, hm) => {
        const style = document.createElement('style');
        style.innerHTML = `
          .doctor-card__info { height: ${hd}px !important; }
          .doctor-card__spec { -webkit-line-clamp: 3 !important; }
          @media (max-width: 639px) {
            .doctor-card__info { height: ${hm}px !important; }
          }
        `;
        document.head.appendChild(style);
      }, hDesktop, hMobile);

      for (let w of widths) {
        await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
        const res = await page.evaluate((winW) => {
          const cards = Array.from(document.querySelectorAll('.doctor-card'));
          return cards.map((c, i) => {
            const nameEl = c.querySelector('.doctor-card__name');
            const specEl = c.querySelector('.doctor-card__spec');
            const infoEl = c.querySelector('.doctor-card__info');
            return {
              i: i + 1,
              name: nameEl.innerText.replace('\n', ' '),
              spec: specEl.innerText.replace('\n', ' '),
              infoClientH: infoEl.clientHeight,
              infoScrollH: infoEl.scrollHeight,
              specClientH: specEl.clientHeight,
              specScrollH: specEl.scrollHeight,
              infoOverflow: infoEl.scrollHeight > infoEl.clientHeight + 1,
              specClamped: specEl.scrollHeight > specEl.clientHeight + 1
            };
          });
        }, w);

        const card1 = res[0];
        console.log(`W=${w}px | Card 1: infoOverflow=${card1.infoOverflow}, specClamped=${card1.specClamped}, infoH=${card1.infoClientH}/${card1.infoScrollH}, specH=${card1.specClientH}/${card1.specScrollH}`);
        const anyInfoOverflow = res.some(c => c.infoOverflow);
        console.log(`  Any card info overflow? ${anyInfoOverflow}`);
      }

      await page.close();
      break; // Just test one combo first
    }
    break;
  }

  await browser.close();
})();
