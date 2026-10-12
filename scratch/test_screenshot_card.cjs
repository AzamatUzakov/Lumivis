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

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    const card = document.querySelector('.doctor-card');
    const specEl = card.querySelector('.doctor-card__spec');
    specEl.innerText = "Офтальмохирург, врач высшей категории, к.м.н., доцент, главный консультант клиники Lumivis";
  });

  const card = await page.$('.doctor-card');
  await card.screenshot({ path: 'scratch/doctor_card_1_preview.png' });

  await page.close();
  await browser.close();
  console.log('Saved scratch/doctor_card_1_preview.png');
})();
