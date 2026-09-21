import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  const resolutions = [393, 768, 1440];
  const langs = ['ru', 'en', 'uz'];

  console.log('--- HERO BADGE STYLES CHECK ---');

  for (const lang of langs) {
    for (const w of resolutions) {
      await page.setViewport({ width: w, height: 1200 });
      await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });

      await page.evaluate((l) => {
        const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
        if (btn) btn.click();
      }, lang);

      await new Promise(r => setTimeout(r, 200));

      const info = await page.evaluate(() => {
        const heroBadge = document.querySelector('.hero__badge');
        const servicesBadge = document.querySelector('.bento-badge');

        const getBadgeInfo = (b) => {
          if (!b) return null;
          const cs = getComputedStyle(b);
          const rect = b.getBoundingClientRect();
          return {
            text: b.innerText.trim(),
            bg: cs.backgroundColor,
            color: cs.color,
            border: cs.border,
            shadow: cs.boxShadow,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: cs.fontSize,
            padding: cs.padding
          };
        };

        return {
          hero: getBadgeInfo(heroBadge),
          services: getBadgeInfo(servicesBadge)
        };
      });

      console.log(`\nLang: ${lang.toUpperCase()} | ${w}px:`);
      console.log('  Hero badge:', JSON.stringify(info.hero, null, 2));
      console.log('  Services badge:', JSON.stringify(info.services, null, 2));
    }
  }

  await browser.close();
})();
