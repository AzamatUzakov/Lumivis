const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
  const translations = {
    uz: {
      name: "Oftalmologik biomikroskop",
      desc: "Applanatsion tonometr va fotokamera bilan"
    },
    en: {
      name: "Ophthalmic Biomicroscope",
      desc: "With applanation tonometer and camera"
    }
  };

  for (let lang of ['uz', 'en']) {
    console.log(`\n=================== ${lang.toUpperCase()} Variant A ===================`);
    for (let w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });

      const res = await page.evaluate((tData) => {
        const cell = document.querySelectorAll('.equip-cell')[3];
        const nameEl = cell.querySelector('.equip-cell__name');
        const descEl = cell.querySelector('.equip-cell__desc');
        nameEl.innerText = tData.name;
        descEl.innerText = tData.desc;

        function countLines(el, text) {
          const words = text.split(' ');
          el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
          let curY = null;
          let lines = 0;
          el.querySelectorAll('.w').forEach(s => {
            const r = s.getBoundingClientRect();
            if (curY === null || Math.abs(r.top - curY) > 4) {
              lines++;
              curY = r.top;
            }
          });
          el.innerText = text;
          return lines;
        }

        return {
          h: Math.round(cell.getBoundingClientRect().height),
          nameLines: countLines(nameEl, tData.name),
          descLines: countLines(descEl, tData.desc)
        };
      }, translations[lang]);

      console.log(`Width ${w}px: cardH=${res.h}px | nameLines=${res.nameLines}, descLines=${res.descLines}`);
      await page.close();
    }
  }

  await browser.close();
})();
