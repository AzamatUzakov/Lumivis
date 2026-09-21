import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  const resList = [393, 768, 1024, 1100, 1280, 1440];
  const langs = ['ru', 'en', 'uz'];

  for (const lang of langs) {
    for (const w of resList) {
      await page.setViewport({ width: w, height: 1200 });
      await page.goto('http://localhost:4321#services', { waitUntil: 'networkidle2' });

      await page.evaluate((l) => {
        const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
        if (btn) btn.click();
      }, lang);

      await new Promise(r => setTimeout(r, 200));

      const info = await page.evaluate(() => {
        const b = document.querySelector('.bento-badge');
        const content = document.querySelector('.bento-rn-content');
        if (!b || !content) return null;
        const bRect = b.getBoundingClientRect();
        const cRect = content.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return {
          text: b.innerText.trim(),
          badgeWidth: Math.round(bRect.width),
          badgeHeight: Math.round(bRect.height),
          contentWidth: Math.round(cRect.width),
          badgeRightOffsetFromContentRight: Math.round(cRect.right - bRect.right),
          whiteSpace: cs.whiteSpace
        };
      });
      console.log(`${lang.toUpperCase()} ${w}px:`, info);
    }
  }

  await browser.close();
})();
