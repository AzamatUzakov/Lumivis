import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. Desktop Screenshot (1280px)
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });
  const doctorsDesktop = await page.$('#doctors');
  if (doctorsDesktop) {
    await doctorsDesktop.screenshot({ path: 'C:/Users/User/.gemini/antigravity-ide/brain/f5daf534-6de3-4c0b-bacc-65abe9524112/doctors_refined_desktop.png' });
    console.log('Desktop refined screenshot success');
  }

  // 2. Mobile Screenshot (375px) - Showing 2x2 grid (4 cards)
  await page.setViewport({ width: 375, height: 1200, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });
  const doctorsMobile = await page.$('#doctors');
  if (doctorsMobile) {
    await doctorsMobile.screenshot({ path: 'C:/Users/User/.gemini/antigravity-ide/brain/f5daf534-6de3-4c0b-bacc-65abe9524112/doctors_refined_mobile.png' });
    console.log('Mobile refined screenshot success');
  }

  await browser.close();
})();
