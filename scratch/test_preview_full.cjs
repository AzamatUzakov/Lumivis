const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));
const PORT = 4395;

async function main() {
  console.log('Starting astro preview server on port', PORT, '...');
  const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 3500));

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 1. NETWORK REQUESTS (LAZY LOADING)
    console.log('\n=== TEST 1: LAZY LOADING ON PRODUCTION BUILD ===');
    {
      const page = await browser.newPage();
      const requestedImages = [];
      page.on('request', req => {
        const url = req.url();
        // Check for the last 4 cards assets
        if (/eq12|akkomodometr|amo-atos|gezatone/i.test(url)) {
          requestedImages.push(url);
        }
      });

      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:${PORT}/ru/`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 600));

      console.log('Cards 11-14 images requested BEFORE click:', requestedImages.length);
      if (requestedImages.length === 0) {
        console.log('✓ PASS: Cards 11-14 images were NOT loaded before click!');
      } else {
        console.log('✗ FAIL: Requested prematurely:', requestedImages);
      }

      // Click button
      await page.click('#equip-more-btn');
      await new Promise(r => setTimeout(r, 800));

      console.log('Cards 11-14 images requested AFTER click:', requestedImages.length);
      if (requestedImages.length > 0) {
        console.log('✓ PASS: Cards 11-14 images were requested after click!');
      }
      await page.close();
    }

    // 2. SCREENSHOTS BEFORE & AFTER (1440, 1024, 768, 375 px)
    console.log('\n=== TEST 2: SCREENSHOTS BEFORE & AFTER ===');
    const viewports = [
      { name: '1440px', width: 1440, height: 900, isMobile: false },
      { name: '1024px', width: 1024, height: 900, isMobile: false },
      { name: '768px', width: 768, height: 1024, isMobile: false },
      { name: '375px', width: 375, height: 812, isMobile: true }
    ];

    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });
      await page.goto(`http://localhost:${PORT}/ru/`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-hero').forEach(el => {
          el.classList.add('is-visible');
        });
        document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 600));

      const secBefore = await page.$('#equipment');
      if (secBefore) {
        await secBefore.screenshot({ path: `scratch/equip_before_${vp.name}.png` });
        console.log(`Saved scratch/equip_before_${vp.name}.png`);
      }

      const statusBefore = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
        const wrap = document.getElementById('equip-more-wrap');
        const btnVisible = wrap ? window.getComputedStyle(wrap).display !== 'none' && wrap.offsetHeight > 0 : false;
        return { total: cells.length, visible: visible.length, btnVisible };
      });
      console.log(`Viewport ${vp.name} BEFORE: total=${statusBefore.total}, visible=${statusBefore.visible}, btnVisible=${statusBefore.btnVisible}`);

      if (statusBefore.btnVisible) {
        await page.click('#equip-more-btn');
        await new Promise(r => setTimeout(r, 600));

        const secAfter = await page.$('#equipment');
        if (secAfter) {
          await secAfter.screenshot({ path: `scratch/equip_after_${vp.name}.png` });
          console.log(`Saved scratch/equip_after_${vp.name}.png`);
        }

        const statusAfter = await page.evaluate(() => {
          const cells = Array.from(document.querySelectorAll('.equip-cell'));
          const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
          const btn = document.getElementById('equip-more-btn');
          const btnVisible = btn ? window.getComputedStyle(btn).display !== 'none' : false;
          const opacities = cells.slice(10).map(c => window.getComputedStyle(c).opacity);
          return { visible: visible.length, btnVisible, opacities };
        });
        console.log(`Viewport ${vp.name} AFTER: visible=${statusAfter.visible}, btnVisible=${statusAfter.btnVisible}, opacities=[${statusAfter.opacities.join(', ')}]`);
      }

      await page.close();
    }

    // 3. MULTILINGUAL
    console.log('\n=== TEST 3: MULTILINGUAL BUTTON TEXTS ===');
    for (const lang of ['ru', 'uz', 'en']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:${PORT}/${lang}/#equipment`, { waitUntil: 'networkidle2' });
      const text = await page.evaluate(() => document.getElementById('equip-more-btn')?.innerText.trim());
      console.log(`Language /${lang}/ button text: "${text}"`);
      await page.close();
    }

    // 4. KEYBOARD NAVIGATION
    console.log('\n=== TEST 4: KEYBOARD NAVIGATION ===');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:${PORT}/ru/`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' }));
      await new Promise(r => setTimeout(r, 400));

      await page.focus('#equip-more-btn');
      const isFocused = await page.evaluate(() => document.activeElement?.id === 'equip-more-btn');
      const initialAria = await page.evaluate(() => document.getElementById('equip-more-btn')?.getAttribute('aria-expanded'));
      console.log(`Focused via keyboard: ${isFocused}, initial aria-expanded: "${initialAria}"`);

      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 400));

      const visibleAfterEnter = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length;
      });
      console.log(`Visible cards after Enter key: ${visibleAfterEnter}`);
      await page.close();
    }

    // 5. JAVASCRIPT DISABLED (NOSCRIPT)
    console.log('\n=== TEST 5: JAVASCRIPT DISABLED (NOSCRIPT) ===');
    {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:${PORT}/ru/#equipment`, { waitUntil: 'networkidle2' });

      const noscriptCheck = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('.equip-cell'));
        const visible = cells.filter(c => window.getComputedStyle(c).display !== 'none');
        const wrap = document.getElementById('equip-more-wrap');
        const wrapVisible = wrap ? window.getComputedStyle(wrap).display !== 'none' : false;
        return { total: cells.length, visible: visible.length, wrapVisible };
      });
      console.log(`With JS disabled on 1440px: total=${noscriptCheck.total}, visible=${noscriptCheck.visible}, wrapVisible=${noscriptCheck.wrapVisible}`);
      await page.close();
    }

    // 6. RESIZE ACROSS 640px
    console.log('\n=== TEST 6: RESIZE ACROSS 640px ===');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 768, height: 900 });
      await page.goto(`http://localhost:${PORT}/ru/#equipment`, { waitUntil: 'networkidle2' });

      let v768 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
      console.log(`768px before click: visible=${v768}`);

      await page.setViewport({ width: 375, height: 812, isMobile: true });
      await new Promise(r => setTimeout(r, 200));
      let v375 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
      console.log(`Resize to 375px: visible=${v375} (expected 14)`);

      await page.setViewport({ width: 768, height: 900, isMobile: false });
      await new Promise(r => setTimeout(r, 200));
      let v768back = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
      console.log(`Resize back to 768px: visible=${v768back} (expected 10)`);

      await page.click('#equip-more-btn');
      await new Promise(r => setTimeout(r, 200));
      let v768clicked = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
      console.log(`768px after click: visible=${v768clicked} (expected 14)`);

      await page.setViewport({ width: 1440, height: 900 });
      await new Promise(r => setTimeout(r, 200));
      let v1440 = await page.evaluate(() => Array.from(document.querySelectorAll('.equip-cell')).filter(c => window.getComputedStyle(c).display !== 'none').length);
      console.log(`Resize to 1440px after click: visible=${v1440} (expected 14)`);

      await page.close();
    }

    // 7. LENIS SCROLL TO BOTTOM VERIFICATION
    console.log('\n=== TEST 7: SCROLL TO BOTTOM VERIFICATION ===');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:${PORT}/ru/`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        document.getElementById('equipment')?.scrollIntoView({ behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 400));

      // Click more button
      await page.click('#equip-more-btn');
      await new Promise(r => setTimeout(r, 600));

      // Scroll to footer
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(r => setTimeout(r, 600));

      const footerVisible = await page.evaluate(() => {
        const footer = document.querySelector('footer');
        if (!footer) return false;
        const rect = footer.getBoundingClientRect();
        return rect.bottom <= window.innerHeight + 50;
      });
      console.log('Footer is completely reached and visible at bottom:', footerVisible);
      await page.close();
    }

    await browser.close();
  } finally {
    server.kill();
    console.log('\nServer killed. Tests completed!');
  }
}

main().catch(console.error);
