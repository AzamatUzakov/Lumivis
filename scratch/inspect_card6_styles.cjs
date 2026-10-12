const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });

  const res = await page.evaluate(() => {
    const wideCard = document.querySelector('.lens-card--wide');
    if (!wideCard) return { error: 'No .lens-card--wide found' };
    const comp = window.getComputedStyle(wideCard);
    return {
      classes: wideCard.className,
      width: comp.width,
      varCardW: comp.getPropertyValue('--lenses-card-w'),
      varCardWideW: comp.getPropertyValue('--lenses-card-wide-w'),
    };
  });

  console.log(res);
  await browser.close();
}

main().catch(console.error);
