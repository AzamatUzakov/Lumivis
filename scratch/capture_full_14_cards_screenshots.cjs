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

const ruCards = [
  { id: 11, badge: '11', name: 'Микроскоп Carl Zeiss OPMI VISU 200', desc: 'Хирургический микроскоп со стерео-тубусом ассистента', img: img1B64 },
  { id: 12, badge: '12', name: 'Офтальмоскоп Keeler Professional', desc: 'Ручной прямой офтальмоскоп для осмотра глазного дна', img: img3B64 },
  { id: 13, badge: '13', name: 'Офтальмоскоп Keeler Vantage Plus LED', desc: 'Беспроводной налобный офтальмоскоп для осмотра глазного дна', img: img2B64 },
  { id: 14, badge: '14', name: 'Портативная фундус-камера MES PFC01', desc: 'Ручная съёмка глазного дна без расширения зрачка', img: img4B64 }
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const vps = [
    { name: '1440px', w: 1440, h: 2200, isMobile: false },
    { name: '1024px', w: 1024, h: 2400, isMobile: false },
    { name: '768px', w: 768, h: 4400, isMobile: false },
    { name: '375px', w: 375, h: 1200, isMobile: true }
  ];

  for (const vp of vps) {
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.isMobile });
    await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate((cards) => {
      const wall = document.querySelector('.equip-wall');
      if (!wall) return;
      // Get the exact astro scope attribute from the wall
      const astroAttr = Array.from(wall.attributes).find(a => a.name.startsWith('data-astro-cid-'))?.name || 'data-astro-cid-txc7hvu6';

      cards.forEach(c => {
        const cell = document.createElement('div');
        cell.className = 'equip-cell reveal reveal--visible active';
        cell.setAttribute(astroAttr, '');
        cell.style.opacity = '1';
        cell.style.transform = 'none';
        cell.innerHTML = `
          <div class="equip-cell__thumb" ${astroAttr}>
            <span class="equip-cell__index" ${astroAttr}>${c.badge}</span>
            <img src="${c.img}" alt="${c.name}" ${astroAttr} style="width:100%;height:100%;object-fit:contain;" />
          </div>
          <h3 class="equip-cell__name" ${astroAttr}>${c.name}</h3>
          <p class="equip-cell__desc" ${astroAttr}>${c.desc}</p>
        `;
        wall.appendChild(cell);
      });

      wall.querySelectorAll('.equip-cell').forEach(c => {
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
    }, ruCards);

    // Scroll into view of equipment section
    await page.evaluate(() => {
      const el = document.getElementById('equipment');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));

    const equipSection = await page.$('#equipment');
    if (equipSection) {
      await equipSection.screenshot({
        path: `scratch/prototype_full_equipment_${vp.name}.png`
      });
      console.log(`Saved screenshot: scratch/prototype_full_equipment_${vp.name}.png`);
    }
  }

  await browser.close();
}

main().catch(console.error);
