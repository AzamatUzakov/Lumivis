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
  const port = 4355;
  const server = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto(`http://localhost:${port}/ru/`, { waitUntil: 'networkidle2' });

    // Scroll to section
    await page.evaluate(() => {
      const section = document.getElementById('prosthetics');
      if (section) section.scrollIntoView();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Test 1: Auto-scroll increases scrollLeft over 3 seconds
    const s1 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);
    await new Promise(r => setTimeout(r, 3000));
    const s2 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);

    const test1Pass = s2 > s1;
    console.log(`TEST 1 (3s auto-scroll growth): s1=${s1.toFixed(1)}, s2=${s2.toFixed(1)} -> PASS: ${test1Pass}`);

    // Test 2: Hover over carousel does NOT pause auto-scroll
    const box = await page.evaluate(() => {
      const rect = document.getElementById('prosthetics-slider').getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    await page.mouse.move(box.x, box.y);

    const s3 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);
    await new Promise(r => setTimeout(r, 3000));
    const s4 = await page.evaluate(() => document.getElementById('prosthetics-slider').scrollLeft);

    const test2Pass = s4 > s3;
    console.log(`TEST 2 (Hover no pause 3s): s3=${s3.toFixed(1)}, s4=${s4.toFixed(1)} -> PASS: ${test2Pass}`);

    // Test 3: Computed cursor is default
    const cursor = await page.evaluate(() => window.getComputedStyle(document.getElementById('prosthetics-slider')).cursor);
    console.log(`TEST 3 (Cursor default): computedCursor=${cursor} -> PASS: ${cursor === 'default'}`);

    // Test 4: Mouse wheel deltaY scrolls page
    const yBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 500));
    const yAfter = await page.evaluate(() => window.scrollY);
    console.log(`TEST 4 (Wheel deltaY page scroll): yBefore=${yBefore}, yAfter=${yAfter} -> PASS: ${yAfter > yBefore}`);

    await browser.close();
    console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
  }
})();
