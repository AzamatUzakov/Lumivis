const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const langs = ['ru', 'uz', 'en'];

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
    width: 375, // standard compact mobile width (iPhone SE / iPhone 13 mini)
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const artifactDir = `C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\68bfa7aa-6577-481c-9f04-2b0670d5c567`;

  console.log(`Navigating to http://localhost:4321/ ...`);
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));

  for (const lang of langs) {
    // Switch language by clicking lang button
    await page.evaluate((langCode) => {
      const btn = document.querySelector(`.lang-btn[data-lang="${langCode}"]`);
      if (btn) btn.click();
    }, lang);
    await new Promise(r => setTimeout(r, 300));

    // Open modal directly via JS
    await page.evaluate(() => {
      const modal = document.getElementById('rn-info-modal');
      if (modal) {
        modal.showModal();
      }
    });
    await new Promise(r => setTimeout(r, 400));

    const screenshotPath = path.join(artifactDir, `mobile_rn_modal_header_${lang}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved ${lang.toUpperCase()} modal header screenshot to:`, screenshotPath);

    // Close modal
    await page.evaluate(() => {
      const modal = document.getElementById('rn-info-modal');
      if (modal) {
        modal.close();
      }
    });
    await new Promise(r => setTimeout(r, 300));
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
