import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  const server = spawn('npx', ['astro', 'preview', '--port', '4343'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:4343', { waitUntil: 'networkidle2' });

  // Scroll to Y=500
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 200));

  const items = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > 376) {
        list.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          right: rect.right,
          width: rect.width,
          outerHTML: el.outerHTML.substring(0, 120).replace(/\s+/g, ' ')
        });
      }
    });
    return list;
  });

  console.log('=== OVERFLOWING ELEMENTS AT Y=500 ===');
  console.log('Total count:', items.length);
  items.forEach((it, idx) => {
    console.log(`[${idx+1}] <${it.tag.toLowerCase()} class="${it.cls}"> right=${it.right.toFixed(1)}px width=${it.width.toFixed(1)}px | ${it.outerHTML}`);
  });

  await browser.close();
  server.kill();
  process.exit(0);
})();
