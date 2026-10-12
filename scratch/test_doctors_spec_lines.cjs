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
  const testCases = {
    ru: {
      doc6: "Врач-окулист, врач второй категории",
      doc7: "Окулярист, специалист по глазному протезированию",
      doc4: "Врач-окулист, врач второй категории"
    },
    uz: {
      doc6: "Shifokor-okulist, ikkinchi toifali shifokor",
      doc7: "Okularist (Ko'z protezlash mutaxassisi)",
      doc4: "Shifokor-okulist, ikkinchi toifali shifokor"
    },
    en: {
      doc6: "Ophthalmologist, second-category physician",
      doc7: "Ocularist, ocular prosthetics specialist",
      doc4: "Ophthalmologist, second-category physician"
    }
  };

  for (let lang of ['ru', 'uz', 'en']) {
    console.log(`\n=================== LANG: /${lang}/ ===================`);
    for (let w of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, isMobile: w < 640 });
      await page.goto(`http://localhost:4321/${lang}/`, { waitUntil: 'networkidle2' });

      const results = await page.evaluate((tc) => {
        // IDs: doc4 is card pos 4, doc6 is card pos 7, doc7 is card pos 8 (remember order is 1,2,3,4,8,5,6,7)
        const cards = Array.from(document.querySelectorAll('.doctor-card'));
        // Find card by matching name
        function testCard(cardIdx, newText) {
          const card = cards[cardIdx];
          const nameEl = card.querySelector('.doctor-card__name');
          const specEl = card.querySelector('.doctor-card__spec');
          const infoEl = card.querySelector('.doctor-card__info');
          specEl.innerText = newText;

          // Count wrapped lines via range
          const words = newText.split(' ');
          const tester = document.createElement('div');
          const cs = window.getComputedStyle(specEl);
          tester.style.fontFamily = cs.fontFamily;
          tester.style.fontSize = cs.fontSize;
          tester.style.lineHeight = cs.lineHeight;
          tester.style.width = specEl.clientWidth + 'px';
          tester.style.position = 'fixed';
          tester.style.left = '-9999px';
          tester.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
          document.body.appendChild(tester);

          let curY = null;
          let lineArr = [];
          const lines = [];
          tester.querySelectorAll('.w').forEach(s => {
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
          document.body.removeChild(tester);

          const isClamped = specEl.scrollHeight > specEl.clientHeight + 1;
          const infoOverflow = infoEl.scrollHeight > infoEl.clientHeight + 1;

          return {
            name: nameEl.innerText.replace('\n', ' ').trim(),
            newText,
            lineCount: lines.length,
            lines,
            isClamped,
            infoOverflow
          };
        }

        return {
          doc4: testCard(3, tc.doc4), // pos 4 (index 3)
          doc6: testCard(6, tc.doc6), // pos 7 (index 6)
          doc7: testCard(7, tc.doc7)  // pos 8 (index 7)
        };
      }, testCases[lang]);

      console.log(`\nWidth: ${w}px:`);
      for (const [key, d] of Object.entries(results)) {
        console.log(`  [${key}] "${d.name}": ${d.lineCount} lines (clamped: ${d.isClamped}, infoOverflow: ${d.infoOverflow})`);
        d.lines.forEach((l, idx) => console.log(`      L${idx + 1}: "${l}"`));
      }

      await page.close();
    }
  }

  await browser.close();
})();
