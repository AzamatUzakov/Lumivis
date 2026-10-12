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

  const variants = [
    {
      id: 'A',
      name: 'Офтальмологический биомикроскоп',
      desc: 'С аппликационным тонометром и фотокамерой'
    },
    {
      id: 'B',
      name: 'Офтальмологический биомикроскоп с аппликационным тонометром и фотокамерой',
      desc: 'Послойный осмотр внутренних структур глаза'
    }
  ];

  for (let v of variants) {
    console.log(`\n=================== VARIANT ${v.id} ===================`);
    for (let w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });

      // Measure current state before edit
      const initialCard = await page.evaluate(() => {
        const cell = document.querySelectorAll('.equip-cell')[3]; // index 3 = card 04
        const nameEl = cell.querySelector('.equip-cell__name');
        const descEl = cell.querySelector('.equip-cell__desc');
        const rect = cell.getBoundingClientRect();
        return {
          h: Math.round(rect.height),
          w: Math.round(rect.width),
          name: nameEl.innerText.trim(),
          desc: descEl.innerText.trim(),
          nameH: nameEl.offsetHeight,
          descH: descEl.offsetHeight
        };
      });

      // Apply variant
      const result = await page.evaluate((vData) => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        const cell4 = cells[3];
        const nameEl = cell4.querySelector('.equip-cell__name');
        const descEl = cell4.querySelector('.equip-cell__desc');
        nameEl.innerText = vData.name;
        descEl.innerText = vData.desc;

        // Measure line counts via range
        function countLines(el, text) {
          const words = text.split(' ');
          const origHTML = el.innerHTML;
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

        const nameLines = countLines(nameEl, vData.name);
        const descLines = countLines(descEl, vData.desc);

        const rect4 = cell4.getBoundingClientRect();
        const allCardHeights = cells.map(c => Math.round(c.getBoundingClientRect().height));

        return {
          card4Height: Math.round(rect4.height),
          card4Width: Math.round(rect4.width),
          nameLines,
          descLines,
          nameHeight: nameEl.offsetHeight,
          descHeight: descEl.offsetHeight,
          allCardHeights
        };
      }, v);

      console.log(`\nWidth ${w}px:`);
      console.log(`  До изменения:  высота=${initialCard.h}px (nameH=${initialCard.nameH}px, descH=${initialCard.descH}px)`);
      console.log(`  После (${v.id}): высота=${result.card4Height}px (nameH=${result.nameHeight}px [${result.nameLines} строк], descH=${result.descHeight}px [${result.descLines} строк])`);
      console.log(`  Высоты всех 10 карточек: [${result.allCardHeights.join(', ')}]`);

      // Screenshots
      if (w === 1440 || w === 375) {
        const cell4El = (await page.$$('.equip-cell'))[3];
        await cell4El.screenshot({ path: `scratch/equip_card4_variant_${v.id}_${w}px.png` });
        const wallEl = await page.$('.equip-wall');
        await wallEl.screenshot({ path: `scratch/equip_wall_variant_${v.id}_${w}px.png` });
      }

      await page.close();
    }
  }

  await browser.close();
  console.log('\nPuppeteer evaluation complete!');
})();
