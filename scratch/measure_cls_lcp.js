import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    // Enable performance / layout shift tracking
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0;
      window.__lcp = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__lcp = entry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    // Try port 4321 (npm run dev port)
    await page.goto(`http://localhost:4321/ru/`, { waitUntil: 'networkidle2' });

    // Scroll through prosthetics section to trigger any potential shift
    await page.evaluate(() => {
      const section = document.getElementById('prosthetics');
      if (section) section.scrollIntoView();
    });

    await new Promise(r => setTimeout(r, 1000));

    const metrics = await page.evaluate(() => {
      return {
        cls: window.__cls || 0,
        lcp: window.__lcp || 0
      };
    });

    console.log(`METRICS | CLS: ${metrics.cls.toFixed(4)} | LCP: ${metrics.lcp.toFixed(2)}ms`);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
