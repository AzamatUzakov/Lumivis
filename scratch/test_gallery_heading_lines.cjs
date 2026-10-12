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
  const newHeadings = {
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

      const headingInfo = await page.evaluate((text) => {
        const h2 = document.querySelector('.gallery .section-header h2');
        const oldText = h2.innerText;
        const oldH = h2.offsetHeight;

        // Count lines of old text
        const cs = window.getComputedStyle(h2);
        const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.15);
        const oldLines = Math.round(oldH / lh);

        // Apply new text
        h2.innerText = text;
        const newH = h2.offsetHeight;
        const newLines = Math.round(newH / lh);

        // Words per line via range
        const words = text.split(' ');
        const spans = words.map(w => `<span class="w">${w}</span>`).join(' ');
        h2.innerHTML = spans;
        let curY = null;
        let lineArr = [];
        const lines = [];
        h2.querySelectorAll('.w').forEach(s => {
          const r = s.getBoundingClientRect();
          if (curY === null || Math.abs(r.top - curY) > 4) {
            if (lineArr.length) lines.push(lineArr.join(' '));
            lineArr = [s.innerText];
            curY = r.top;
          } else {
            lineArr.push(s.innerText);
          }
        });
        if (lineArr.length) lines.push(lineArr.join(' '));

        return {
          oldText,
          oldH,
          oldLines,
          newText: text,
          newH,
          newLines: lines.length,
          lines,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          containerW: h2.clientWidth
        };
      }, newHeadings[lang]);

      console.log(`Width ${w}px (fontSize: ${headingInfo.fontSize}, containerW: ${headingInfo.containerW}px):`);
      console.log(`  Старый: "${headingInfo.oldText}" -> ${headingInfo.oldLines} строки (${headingInfo.oldH}px)`);
      console.log(`  Новый:  "${headingInfo.newText}" -> ${headingInfo.newLines} строки (${headingInfo.newH}px)`);
      headingInfo.lines.forEach((l, i) => console.log(`    Строка ${i + 1}: "${l}"`));

      await page.close();
    }
  }

  await browser.close();
})();
