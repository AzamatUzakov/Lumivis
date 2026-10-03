const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

async function main() {
  let executablePath = chromePaths.find(p => fs.existsSync(p));
  if (!executablePath) {
    throw new Error('Chrome/Edge executable not found on system.');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });

  const triggerSelector = '[data-open-rn-modal]';
  await page.waitForSelector(triggerSelector);
  await page.click(triggerSelector);
  await new Promise(r => setTimeout(r, 600));

  const artifactDir = `C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\68bfa7aa-6577-481c-9f04-2b0670d5c567`;

  // Scroll modal body directly to center the diagram card
  await page.evaluate(() => {
    const modalBody = document.querySelector('.rn-modal__body');
    const diagram = document.querySelector('.rn-modal__diagram');
    if (modalBody && diagram) {
      modalBody.scrollTop = diagram.offsetTop - 140;
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const screenshotPath = path.join(artifactDir, 'mobile_rn_modal_diagram_centered.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved diagram screenshot to:', screenshotPath);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
