const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

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
    { name: '1440px', width: 1440, height: 900, isMobile: false }
  ];

  for (const lang of languages) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:4321/${lang}/#doctors`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));

      const docData = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.doctor-card'));
        const grid = document.querySelector('.doctors__grid');
        const scrollLeftBefore = grid ? grid.scrollLeft : 0;
        return {
          scrollLeftBefore,
          cards: cards.map((c, i) => {
            const nameEl = c.querySelector('.doctor-card__name');
            const specEl = c.querySelector('.doctor-card__spec');
            const infoEl = c.querySelector('.doctor-card__info');
            const rect = c.getBoundingClientRect();
            const infoRect = infoEl ? infoEl.getBoundingClientRect() : null;
            return {
              idx: i + 1,
              name: nameEl ? nameEl.textContent.trim() : '',
              spec: specEl ? specEl.textContent.trim() : '',
              cardHeight: Math.round(rect.height * 10) / 10,
              infoHeight: infoRect ? Math.round(infoRect.height * 10) / 10 : null
            };
          })
        };
      });

      console.log(`\nViewport ${vp.name}:`);
      // Find Abdukayyum Musinov (photo doctor-4, doctor.6)
      const abdukayyum = docData.cards.find(c => c.name.includes('Мусинов') || c.name.includes('Musinov') || c.name.includes('Abdukayyum') || c.name.includes('Abduqayyum'));
      // Find Parvina Raupova (doctor.4)
      const parvina = docData.cards.find(c => c.name.includes('Раупова') || c.name.includes('Raupova'));

      if (abdukayyum) {
        console.log(`  Abdukayyum (card ${abdukayyum.idx}): Name: "${abdukayyum.name}" | Spec: "${abdukayyum.spec}"`);
      }
      if (parvina) {
        console.log(`  Parvina (card ${parvina.idx}): Name: "${parvina.name}" | Spec: "${parvina.spec}"`);
      }

      const cardHeights = docData.cards.map(c => c.cardHeight);
      const infoHeights = docData.cards.map(c => c.infoHeight);
      const allCardsSame = cardHeights.every(h => h === cardHeights[0]);
      const allInfosSame = infoHeights.every(h => h === infoHeights[0]);

      console.log(`  Card heights (${docData.cards.length} cards): [${cardHeights.join(', ')}] -> ${allCardsSame ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);
      console.log(`  Info heights: [${infoHeights.join(', ')}] -> ${allInfosSame ? 'UNIFORM ✓' : 'MISMATCH ✗'}`);

      // If mobile, test autoscroll after 2.5 seconds
      if (vp.isMobile) {
        await new Promise(r => setTimeout(r, 2600));
        const scrollAfter = await page.evaluate(() => {
          const g = document.querySelector('.doctors__grid');
          return g ? g.scrollLeft : 0;
        });
        console.log(`  Mobile auto-scroll check: before=${docData.scrollLeftBefore}, after=${scrollAfter} -> ${scrollAfter > docData.scrollLeftBefore ? 'AUTOSCROLL WORKING ✓' : 'NO SCROLL'}`);
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
