const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const outScreenshots = path.join(root, 'scratch');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });

  // Scroll to #lenses and offset track to show card 5 and card 6
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    const sec = document.getElementById('lenses');
    if (sec) sec.scrollIntoView({ behavior: 'instant' });
    const track = document.querySelector('.lenses-track');
    if (track) {
      track.style.animation = 'none';
      // Shift so card 5 and card 6 are in view
      track.style.transform = 'translateX(-1100px)';
    }
  });

  await new Promise(r => setTimeout(r, 400));
  const lensesSec = await page.$('#lenses');
  if (lensesSec) {
    await lensesSec.screenshot({ path: path.join(outScreenshots, 'lenses_card6_view.png') });
  }

  // Also check individual card 6 bounding box
  const card6Rect = await page.evaluate(() => {
    const card6 = document.querySelector('.lens-card--wide');
    if (!card6) return null;
    const rect = card6.getBoundingClientRect();
    const thumb = card6.querySelector('.lens-card__thumb').getBoundingClientRect();
    const img = card6.querySelector('img').getBoundingClientRect();
    return {
      card: { w: rect.width, h: rect.height },
      thumb: { w: thumb.width, h: thumb.height, ratio: (thumb.width / thumb.height).toFixed(2) },
      img: { w: img.width, h: img.height, ratio: (img.width / img.height).toFixed(2) }
    };
  });
  console.log('Card 6 measurements:', card6Rect);

  await browser.close();
}

main().catch(console.error);
