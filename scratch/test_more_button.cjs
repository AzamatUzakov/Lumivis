const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // TEST 1: NETWORK REQUESTS BEFORE AND AFTER CLICK (1440px)
  console.log('=== TEST 1: LAZY LOADING & NETWORK TRAFFIC ===');
  {
    const page = await browser.newPage();
    const requestedEquipmentImages = [];
    page.on('request', req => {
      const url = req.url();
      if (/eq12|akkomodometr|amo-atos|gezatone|amo_atos/i.test(url)) {
        requestedEquipmentImages.push(url);
      }
    });

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
        el.classList.add('is-visible');
      });
      document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    console.log('Cards 11-14 images requested BEFORE button click:', requestedEquipmentImages.length);
    if (requestedEquipmentImages.length === 0) {
      console.log('✓ PASS: Hidden cards images are NOT requested on initial load!');
    } else {
      console.log('✗ FAIL: Images were requested prematurely:', requestedEquipmentImages);
    }

    // Click button
    const btn = await page.$('#equip-more-btn');
    if (btn) {
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      console.log('Cards 11-14 images requested AFTER button click:', requestedEquipmentImages.length);
      if (requestedEquipmentImages.length > 0) {
        console.log('✓ PASS: Images are requested immediately upon button click!');
      }
    }
    await page.close();
  }

  // TEST 2: SCREENSHOTS BEFORE AND AFTER CLICK (1440, 1024, 768, 375 px)
  console.log('\n=== TEST 2: CAPTURING SCREENSHOTS ===');
  const viewports = [
    { name: '1440px', width: 1440, height: 900, isMobile: false },
    { name: '1024px', width: 1024, height: 900, isMobile: false },
    { name: '768px', width: 768, height: 1024, isMobile: false },
    { name: '375px', width: 375, height: 812, isMobile: true }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
        el.classList.add('is-visible');
      });
      document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 500));

    // Capture BEFORE click
    const secBefore = await page.$('#equipment');
    if (secBefore) {
      await secBefore.screenshot({ path: `scratch/equip_before_${vp.name}.png` });
      console.log(`Saved scratch/equip_before_${vp.name}.png`);
    }

    // Check visible cards count and button visibility
    const countBefore = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.equip-cell'));
      const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
      const btn = document.getElementById('equip-more-btn');
      const btnVisible = btn ? window.getComputedStyle(btn).display !== 'none' : false;
      return { total: cells.length, visible: visible.length, btnVisible };
    });
    console.log(`Viewport ${vp.name} BEFORE: total=${countBefore.total}, visible=${countBefore.visible}, btnVisible=${countBefore.btnVisible}`);

    // If button visible, click it and capture AFTER
    if (countBefore.btnVisible) {
      await page.click('#equip-more-btn');
      await new Promise(r => setTimeout(r, 600));

      const secAfter = await page.$('#equipment');
      if (secAfter) {
        await secAfter.screenshot({ path: `scratch/equip_after_${vp.name}.png` });
        console.log(`Saved scratch/equip_after_${vp.name}.png`);
      }

      const countAfter = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
        const btn = document.getElementById('equip-more-btn');
        const btnVisible = btn ? window.getComputedStyle(btn).display !== 'none' : false;
        // Check opacity of cards 11-14
        const cards11_14Opacity = cells.slice(10).map(c => window.getComputedStyle(c).opacity);
        return { total: cells.length, visible: visible.length, btnVisible, opacities: cards11_14Opacity };
      });
      console.log(`Viewport ${vp.name} AFTER: visible=${countAfter.visible}, btnVisible=${countAfter.btnVisible}, cards 11-14 opacities=[${countAfter.opacities.join(', ')}]`);
    }

    await page.close();
  }

  // TEST 3: MULTILINGUAL BUTTON TEXTS
  console.log('\n=== TEST 3: I18N BUTTON TEXTS ===');
  for (const lang of ['ru', 'uz', 'en']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:4321/${lang}/#equipment`, { waitUntil: 'networkidle2' });
    const text = await page.evaluate(() => {
      return document.getElementById('equip-more-btn')?.innerText.trim();
    });
    console.log(`Language /${lang}/ button text: "${text}"`);
    await page.close();
  }

  // TEST 4: KEYBOARD & ACCESSIBILITY
  console.log('\n=== TEST 4: KEYBOARD & ACCESSIBILITY ===');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' }));
    await new Promise(r => setTimeout(r, 400));

    // Focus the button
    await page.focus('#equip-more-btn');
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'equip-more-btn');
    const initialAria = await page.evaluate(() => document.getElementById('equip-more-btn')?.getAttribute('aria-expanded'));
    console.log(`Button focused via keyboard: ${isFocused}, initial aria-expanded: "${initialAria}"`);

    // Press Space or Enter
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 400));

    const visibleCards = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length;
    });
    console.log(`Cards visible after Enter key press: ${visibleCards} (expected 14)`);
    await page.close();
  }

  // TEST 5: NOSCRIPT (JS DISABLED)
  console.log('\n=== TEST 5: JAVASCRIPT DISABLED (NOSCRIPT) ===');
  {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });

    const noscriptResult = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.equip-cell'));
      const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
      const wrap = document.getElementById('equip-more-wrap');
      const wrapVisible = wrap ? window.getComputedStyle(wrap).display !== 'none' : false;
      return { total: cells.length, visible: visible.length, wrapVisible };
    });
    console.log(`With JS disabled on 1440px: total=${noscriptResult.total}, visible=${noscriptResult.visible}, wrapVisible=${noscriptResult.wrapVisible}`);
    if (noscriptResult.visible === 14 && !noscriptResult.wrapVisible) {
      console.log('✓ PASS: Noscript displays all 14 cards and hides the button!');
    } else {
      console.log('✗ FAIL: Noscript mismatch:', noscriptResult);
    }
    await page.close();
  }

  // TEST 6: RESIZE ACROSS 640px
  console.log('\n=== TEST 6: RESIZE ACROSS 640px ===');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 768, height: 900 });
    await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });

    // Initial on 768px: 10 visible
    let v768 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
    console.log(`768px before click: visible=${v768}`);

    // Resize to 375px: 14 visible
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await new Promise(r => setTimeout(r, 200));
    let v375 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
    console.log(`Resize to 375px: visible=${v375} (expected 14)`);

    // Resize back to 768px: 10 visible
    await page.setViewport({ width: 768, height: 900, isMobile: false });
    await new Promise(r => setTimeout(r, 200));
    let v768back = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
    console.log(`Resize back to 768px: visible=${v768back} (expected 10)`);

    // Click button on 768px: 14 visible
    await page.click('#equip-more-btn');
    await new Promise(r => setTimeout(r, 300));
    let v768clicked = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
    console.log(`768px after click: visible=${v768clicked} (expected 14)`);

    // Resize to 1440px: stays 14 visible
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 200));
    let v1440 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
    console.log(`Resize to 1440px after click: visible=${v1440} (expected 14)`);

    await page.close();
  }

  await browser.close();
  console.log('\nAll tests in test_more_button.cjs completed!');
}

run().catch(console.error);
