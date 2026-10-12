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

  for (const w of widths) {
    console.log(`\n=================== WIDTH: ${w}px ===================`);
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });

    const linesInfo = await page.evaluate(() => {
      const card = document.querySelector('.doctor-card');
      const specEl = card.querySelector('.doctor-card__spec');
      const text = "Офтальмохирург, врач высшей категории, к.м.н., доцент, главный консультант клиники Lumivis";
      
      // Let's create an offscreen tester with exact styles of specEl
      const tester = document.createElement('div');
      const cs = window.getComputedStyle(specEl);
      tester.style.fontFamily = cs.fontFamily;
      tester.style.fontSize = cs.fontSize;
      tester.style.lineHeight = cs.lineHeight;
      tester.style.letterSpacing = cs.letterSpacing;
      tester.style.width = specEl.getBoundingClientRect().width + 'px';
      tester.style.boxSizing = 'border-box';
      tester.style.position = 'fixed';
      tester.style.left = '-9999px';
      tester.style.top = '0';
      document.body.appendChild(tester);

      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testText = currentLine ? `${currentLine} ${word}` : word;
        tester.innerText = testText;
        const initialHeight = tester.offsetHeight;
        
        // Check if adding this word caused a wrap (we test word by word)
        // More accurately: measure word by word
      }

      // Let's split into lines by Range rects
      tester.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
      const spans = tester.querySelectorAll('.w');
      let curY = null;
      let lineArr = [];
      const resultLines = [];
      spans.forEach(s => {
        const r = s.getBoundingClientRect();
        if (curY === null || Math.abs(r.top - curY) > 4) {
          if (lineArr.length) resultLines.push(lineArr.join(' '));
          lineArr = [s.innerText];
          curY = r.top;
        } else {
          lineArr.push(s.innerText);
        }
      });
      if (lineArr.length) resultLines.push(lineArr.join(' '));

      document.body.removeChild(tester);
      return {
        width: specEl.getBoundingClientRect().width,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        resultLines
      };
    });

    console.log(`Spec width: ${linesInfo.width}px (fontSize: ${linesInfo.fontSize}, lineHeight: ${linesInfo.lineHeight})`);
    console.log(`Lines total: ${linesInfo.resultLines.length}`);
    linesInfo.resultLines.forEach((l, i) => {
      console.log(`  Line ${i + 1} (${i < 2 ? 'VISIBLE' : 'CLIPPED BY LINE-CLAMP: 2'}): "${l}"`);
    });

    await page.close();
  }

  await browser.close();
})();
