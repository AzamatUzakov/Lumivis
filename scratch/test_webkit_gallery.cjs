const { webkit, devices } = require('playwright-core');

(async () => {
  const iPhone = devices['iPhone 13'];
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:4321/ru/ in WebKit...');
  await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle' });

  // Scroll down step by step to trigger intersection observers cleanly
  for (let y = 0; y <= 3500; y += 300) {
    await page.evaluate((scrollPos) => window.scrollTo(0, scrollPos), y);
    await page.waitForTimeout(200);
  }

  // Scroll specifically to #gallery and pause
  await page.evaluate(() => {
    const el = document.getElementById('gallery');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  await page.waitForTimeout(1500);

  // Evaluate state of all 11 cards and <img> tags in WebKit
  const cardStates = await page.evaluate(() => {
    const gallery = document.getElementById('gallery');
    if (!gallery) return [];
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));

    return items.map((item, idx) => {
      const img = item.querySelector('.gallery__img');
      const rect = item.getBoundingClientRect();
      const style = window.getComputedStyle(item);

      return {
        cardIndex: idx + 1,
        className: item.className,
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        img: img ? {
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          loading: img.getAttribute('loading'),
          decoding: img.getAttribute('decoding'),
          renderedWidth: img.clientWidth,
          renderedHeight: img.clientHeight
        } : null
      };
    });
  });

  console.log('\n--- WEBKIT GALLERY CARD STATES ---');
  console.log(JSON.stringify(cardStates, null, 2));

  await browser.close();
})();
