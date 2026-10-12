const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

const img1B64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979326.jpg').toString('base64');
const img2B64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979417.jpg').toString('base64');
const img3B64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979452.jpg').toString('base64');
const img4B64 = 'data:image/jpeg;base64,' + fs.readFileSync('C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979470.jpg').toString('base64');

const NEW_CARDS_DATA = {
  ru: [
    { id: 11, badge: '11', name: 'Микроскоп Carl Zeiss OPMI VISU 200', desc: 'Хирургический микроскоп со стерео-тубусом ассистента', img: img1B64 },
    { id: 12, badge: '12', name: 'Офтальмоскоп Keeler Professional', desc: 'Ручной прямой офтальмоскоп для осмотра глазного дна', img: img3B64 },
    { id: 13, badge: '13', name: 'Офтальмоскоп Keeler Vantage Plus LED', desc: 'Беспроводной налобный офтальмоскоп для осмотра глазного дна', img: img2B64 },
    { id: 14, badge: '14', name: 'Портативная фундус-камера MES PFC01', desc: 'Ручная съёмка глазного дна без расширения зрачка', img: img4B64 }
  ],
  uz: [
    { id: 11, badge: '11', name: 'Carl Zeiss OPMI VISU 200 mikroskopi', desc: 'Yordamchi uchun stereotubusli jarrohlik mikroskopi', img: img1B64 },
    { id: 12, badge: '12', name: 'Keeler Professional oftalmoskopi', desc: "Ko'z tubini tekshirish uchun qo'lda ishlatiladigan to'g'ri oftalmoskop", img: img3B64 },
    { id: 13, badge: '13', name: 'Keeler Vantage Plus LED oftalmoskopi', desc: "Ko'z tubini tekshirish uchun simsiz peshona oftalmoskopi", img: img2B64 },
    { id: 14, badge: '14', name: 'MES PFC01 portativ fundus-kamerasi', desc: "Qorachiqni kengaytirmasdan ko'z tubini qo'lda suratga olish", img: img4B64 }
  ],
  en: [
    { id: 11, badge: '11', name: 'Carl Zeiss OPMI VISU 200 Microscope', desc: 'Surgical microscope with assistant stereo tube', img: img1B64 },
    { id: 12, badge: '12', name: 'Keeler Professional Ophthalmoscope', desc: 'Handheld direct ophthalmoscope for fundus examination', img: img3B64 },
    { id: 13, badge: '13', name: 'Keeler Vantage Plus LED Ophthalmoscope', desc: 'Wireless head-mounted ophthalmoscope for fundus examination', img: img2B64 },
    { id: 14, badge: '14', name: 'Portable Fundus Camera MES PFC01', desc: 'Handheld fundus imaging without pupil dilation', img: img4B64 }
  ]
};

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const languages = ['ru', 'uz', 'en'];
  const viewports = [
    { name: '375px', width: 375, height: 812, isMobile: true },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '1024px', width: 1024, height: 900, isMobile: false },
    { name: '1440px', width: 1440, height: 900, isMobile: false }
  ];

  for (const lang of languages) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      const metrics = await page.evaluate((newCards) => {
        const wall = document.querySelector('.equip-wall');
        if (!wall) return [];

        // Remove any dynamically added cards from previous evaluate calls
        Array.from(wall.querySelectorAll('.equip-cell--injected')).forEach(el => el.remove());

        newCards.forEach(c => {
          const cell = document.createElement('div');
          cell.className = 'equip-cell equip-cell--injected reveal';
          cell.innerHTML = `
            <div class="equip-cell__thumb">
              <span class="equip-cell__index">${c.badge}</span>
              <img src="${c.img}" alt="${c.name}" loading="lazy" style="width:100%; height:100%; object-fit:contain;" />
            </div>
            <h3 class="equip-cell__name">${c.name}</h3>
            <p class="equip-cell__desc">${c.desc}</p>
          `;
          wall.appendChild(cell);
        });

        const cells = Array.from(wall.querySelectorAll('.equip-cell'));
        return cells.map((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          const nameEl = cell.querySelector('.equip-cell__name');
          const descEl = cell.querySelector('.equip-cell__desc');
          const indexEl = cell.querySelector('.equip-cell__index');

          const nameLineH = parseFloat(window.getComputedStyle(nameEl).lineHeight) || 19;
          const descLineH = parseFloat(window.getComputedStyle(descEl).lineHeight) || 18;
          const nameLines = Math.round(nameEl.clientHeight / nameLineH);
          const descLines = Math.round(descEl.clientHeight / descLineH);

          return {
            index: indexEl ? indexEl.textContent.trim() : String(idx + 1),
            name: nameEl ? nameEl.textContent.trim() : '',
            desc: descEl ? descEl.textContent.trim() : '',
            nameLines,
            descLines,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            top: Math.round(rect.top)
          };
        });
      }, NEW_CARDS_DATA[lang]);

      console.log(`\nViewport ${vp.name} (${vp.width}x${vp.height}): Total cards = ${metrics.length}`);
      const newItems = metrics.filter(m => ['11', '12', '13', '14'].includes(m.index));
      newItems.forEach(item => {
        console.log(`  Card ${item.index}: Name lines: ${item.nameLines} ("${item.name}") | Desc lines: ${item.descLines} ("${item.desc}") | Height: ${item.height}px`);
      });

      // Group rows
      const rows = {};
      metrics.forEach(c => {
        const rowKey = Math.round(c.top / 8) * 8;
        if (!rows[rowKey]) rows[rowKey] = [];
        rows[rowKey].push(c);
      });

      console.log('  Rows breakdown:');
      Object.entries(rows).forEach(([key, items], rIdx) => {
        const heights = items.map(i => i.height);
        const allSame = heights.every(h => Math.abs(h - heights[0]) <= 1.5);
        console.log(`    Row ${rIdx + 1} (${items.length} cards, [${items.map(i => i.index).join(', ')}]): heights=[${heights.join(', ')}] -> ${allSame ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
      });

      // Save screenshot
      const wallHandle = await page.$('.equip-wall');
      if (wallHandle) {
        await wallHandle.screenshot({
          path: `scratch/prototype_14_cards_${lang}_${vp.name}.png`
        });
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
