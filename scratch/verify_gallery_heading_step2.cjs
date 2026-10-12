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
  const expectedHeadings = {
    ru: "Как проходит лечение в Lumivis",
    uz: "Lumivisda davolash qanday o'tadi",
    en: "How Treatment Works at Lumivis"
  };

  for (let lang of ['ru', 'uz', 'en']) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (let w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto(`http://localhost:4321/${lang}/#gallery`, { waitUntil: 'networkidle2' });

      const headingInfo = await page.evaluate(() => {
        const h2 = document.querySelector('.gallery .section-header h2');
        const p = document.querySelector('.gallery .section-header p');
        const cs = window.getComputedStyle(h2);
        const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.15);
        const lines = Math.round(h2.offsetHeight / lh);

        return {
          text: h2.innerText.trim(),
          subtitle: p.innerText.trim(),
          height: h2.offsetHeight,
          lines,
          fontSize: cs.fontSize
        };
      });

      console.log(`Width ${w}px: text="${headingInfo.text}" (lines: ${headingInfo.lines}, height: ${headingInfo.height}px, font: ${headingInfo.fontSize})`);
      console.log(`  Subtitle: "${headingInfo.subtitle.slice(0, 40)}..."`);

      if (headingInfo.text !== expectedHeadings[lang]) {
        console.error(`  ERROR: Expected "${expectedHeadings[lang]}" but got "${headingInfo.text}"`);
      }

      await page.close();
    }
  }

  await browser.close();
  console.log('\nVerification complete!');
})();
