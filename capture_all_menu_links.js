import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
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
  console.log('Starting preview server on port 4345...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4345'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 3500));

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  const navTargets = [
    { href: '#doctors', name: 'nav_doctors' },
    { href: '#equipment', name: 'nav_equipment' },
    { href: '#services', name: 'nav_services' },
    { href: '#retinopathy', name: 'nav_retinopathy' },
    { href: '#results', name: 'nav_results' },
    { href: '#contacts', name: 'nav_contacts' },
    { href: '#booking-form-section', name: 'nav_booking' }
  ];

  for (const item of navTargets) {
    await page.goto('http://localhost:4345', { waitUntil: 'networkidle2' });
    await page.evaluate((h) => {
      const link = document.querySelector(`a[href="${h}"]`);
      if (link) link.click();
    }, item.href);

    await new Promise(r => setTimeout(r, 1800));

    const outPath = path.join(ARTIFACT_DIR, `${item.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved ${item.name}.png`);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
