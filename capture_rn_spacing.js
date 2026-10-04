import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/68bfa7aa-6577-481c-9f04-2b0670d5c567';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  console.log('Launching browser with path:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Desktop
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageDesktop.goto('http://localhost:4321', { waitUntil: 'networkidle2' });

  await pageDesktop.evaluate(() => {
    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => {
      el.classList.add('active', 'animated');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    const sec = document.getElementById('retinopathy');
    if (sec) sec.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));

  const rnDesktop = await pageDesktop.$('#retinopathy');
  if (rnDesktop) {
    const outDesktop = path.join(ARTIFACT_DIR, 'rn_spacing_desktop.png');
    await rnDesktop.screenshot({ path: outDesktop });
    console.log(`Saved desktop screenshot: ${outDesktop}`);
  }

  // Mobile
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await pageMobile.goto('http://localhost:4321', { waitUntil: 'networkidle2' });

  await pageMobile.evaluate(() => {
    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => {
      el.classList.add('active', 'animated');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    const sec = document.getElementById('retinopathy');
    if (sec) sec.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));

  const rnMobile = await pageMobile.$('#retinopathy');
  if (rnMobile) {
    const outMobile = path.join(ARTIFACT_DIR, 'rn_spacing_mobile.png');
    await rnMobile.screenshot({ path: outMobile });
    console.log(`Saved mobile screenshot: ${outMobile}`);
  }

  await browser.close();
  console.log('All screenshots captured!');
  process.exit(0);
})();
