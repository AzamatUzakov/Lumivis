import puppeteer from 'puppeteer-core';
import fs from 'fs';

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

  const devicesToTest = [
    {
      name: 'iPhone 13 (375x812, dpr=3, touch)',
      viewport: { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1'
    },
    {
      name: 'Android Pixel 5 (393x851, dpr=2.75, touch)',
      viewport: { width: 393, height: 851, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
    }
  ];

  let baseUrl = 'http://localhost:4321';

  for (const dev of devicesToTest) {
    console.log(`\n==================================================`);
    console.log(` TESTING DEVICE: ${dev.name}`);
    console.log(`==================================================`);

    const page = await browser.newPage();
    await page.setViewport(dev.viewport);
    await page.setUserAgent(dev.userAgent);

    const consoleLogs = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => pageErrors.push(err.toString()));
    page.on('requestfailed', req => failedRequests.push(`${req.url()} (${req.failure()?.errorText})`));

    try {
      await page.goto(`${baseUrl}/ru/`, { waitUntil: 'networkidle2' });
    } catch (e) {
      baseUrl = 'http://localhost:4320';
      await page.goto(`${baseUrl}/ru/`, { waitUntil: 'networkidle2' });
    }

    // ----------------------------------------------------
    // DIAGNOSIS 1: PROSTHETICS SECTION (#prosthetics / #prosthetics-slider)
    // ----------------------------------------------------
    console.log(`\n--- PROBLEM 1: Prosthetics Section ---`);

    await page.evaluate(() => {
      const el = document.getElementById('prosthetics');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 500));

    const prostheticsState = await page.evaluate(() => {
      const slider = document.getElementById('prosthetics-slider');
      const section = document.getElementById('prosthetics');
      if (!slider || !section) return { error: 'Slider or Section not found' };

      const computedStyle = window.getComputedStyle(slider);
      const sectionRect = section.getBoundingClientRect();

      // Test scrollLeft float behavior
      const testElem = document.createElement('div');
      testElem.style.cssText = 'overflow-x: auto; width: 100px; height: 50px; visibility: hidden; position: absolute;';
      const inner = document.createElement('div');
      inner.style.width = '1000px'; inner.style.height = '10px';
      testElem.appendChild(inner);
      document.body.appendChild(testElem);

      const beforeTest = testElem.scrollLeft;
      testElem.scrollLeft += 0.75;
      const afterTest075 = testElem.scrollLeft;
      testElem.scrollLeft += 0.75;
      const afterTest150 = testElem.scrollLeft;
      document.body.removeChild(testElem);

      return {
        initialScrollLeft: slider.scrollLeft,
        computedStyleOverflowX: computedStyle.overflowX,
        computedStyleTouchAction: computedStyle.touchAction,
        sectionInViewport: sectionRect.top < window.innerHeight && sectionRect.bottom > 0,
        sectionRect: { top: sectionRect.top, bottom: sectionRect.bottom, height: sectionRect.height },
        fractionalScrollLeftSupport: { beforeTest, afterTest075, afterTest150 }
      };
    });

    console.log('Prosthetics state:', prostheticsState);

    const scrollHistory = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      const currentScrollLeft = await page.evaluate(() => {
        const slider = document.getElementById('prosthetics-slider');
        return slider ? slider.scrollLeft : -1;
      });
      scrollHistory.push(currentScrollLeft);
    }

    console.log('ScrollLeft over 5s (sampled every 0.5s):', scrollHistory);
    const scrollGrew = scrollHistory[scrollHistory.length - 1] > scrollHistory[0];
    console.log(`Did scrollLeft grow? ${scrollGrew ? 'YES' : 'NO'} (delta: ${scrollHistory[scrollHistory.length - 1] - scrollHistory[0]}px)`);

    // ----------------------------------------------------
    // DIAGNOSIS 2: GALLERY SECTION (#gallery)
    // ----------------------------------------------------
    console.log(`\n--- PROBLEM 2: Gallery Section ---`);

    await page.evaluate(() => {
      const el = document.getElementById('gallery');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 1500));

    const galleryState = await page.evaluate(() => {
      const gallery = document.getElementById('gallery');
      if (!gallery) return { error: 'Gallery section not found' };

      const items = Array.from(gallery.querySelectorAll('.gallery__item'));
      const itemDetails = items.map((item, idx) => {
        const img = item.querySelector('.gallery__img');
        const rect = item.getBoundingClientRect();
        return {
          index: idx + 1,
          classes: Array.from(item.classList),
          isVisibleClass: item.classList.contains('is-visible'),
          opacity: window.getComputedStyle(item).opacity,
          transform: window.getComputedStyle(item).transform,
          rect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), width: Math.round(rect.width) },
          img: img ? {
            src: img.currentSrc || img.src,
            loading: img.getAttribute('loading'),
            decoding: img.getAttribute('decoding'),
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete
          } : null
        };
      });

      return {
        totalItems: items.length,
        itemsVisibleClassCount: items.filter(i => i.classList.contains('is-visible')).length,
        imagesLoadedCount: itemDetails.filter(i => i.img && i.img.naturalWidth > 0).length,
        itemDetails
      };
    });

    console.log('Gallery total items:', galleryState.totalItems);
    console.log('Gallery items with is-visible:', galleryState.itemsVisibleClassCount);
    console.log('Gallery images loaded (naturalWidth > 0):', galleryState.imagesLoadedCount);
    console.log('Gallery details:', JSON.stringify(galleryState.itemDetails, null, 2));

    console.log('\nConsole logs:', consoleLogs);
    console.log('Page errors:', pageErrors);
    console.log('Failed requests:', failedRequests);

    await page.close();
  }

  await browser.close();
})();
