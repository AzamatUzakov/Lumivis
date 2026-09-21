import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  const resolutions = [393, 768, 1024, 1280, 1366, 1440, 1920];

  console.log('--- CONTAINER ALIGNMENT CHECK ---');

  for (const w of resolutions) {
    await page.setViewport({ width: w, height: 1200 });
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });

    const metrics = await page.evaluate(() => {
      const getContainerBox = (selector) => {
        const sec = document.querySelector(selector);
        if (!sec) return null;
        const container = sec.querySelector('.container') || (sec.classList.contains('container') ? sec : null);
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      };

      return {
        header: getContainerBox('#site-header') || getContainerBox('.header'),
        whyUs: getContainerBox('#why-us') || getContainerBox('.why-us'),
        services: getContainerBox('#services'),
        equipment: getContainerBox('#equipment'),
        doctors: getContainerBox('#doctors')
      };
    });

    console.log(`\nWidth ${w}px:`);
    console.log(`  Header    container: left = ${metrics.header?.left}px, width = ${metrics.header?.width}px, right = ${metrics.header?.right}px`);
    console.log(`  Services  container: left = ${metrics.services?.left}px, width = ${metrics.services?.width}px, right = ${metrics.services?.right}px`);
    console.log(`  Equipment container: left = ${metrics.equipment?.left}px, width = ${metrics.equipment?.width}px, right = ${metrics.equipment?.right}px`);
    console.log(`  WhyUs     container: left = ${metrics.whyUs?.left}px, width = ${metrics.whyUs?.width}px, right = ${metrics.whyUs?.right}px`);
  }

  await browser.close();
})();
