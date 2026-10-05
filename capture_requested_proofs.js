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

async function preparePage(page) {
  await page.evaluate(async () => {
    // Reveal all elements
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up, .reveal-fade').forEach(el => {
      el.classList.add('active', 'animated');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });
    
    // Hide header
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';

    // Force eager loading for all images & wait for load
    const imgs = Array.from(document.querySelectorAll('img'));
    const promises = imgs.map(img => {
      img.loading = 'eager';
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(promises);
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Gallery Desktop (1280px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1800, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const g = document.getElementById('gallery');
      if (g) g.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const g = await page.$('#gallery');
    if (g) {
      await g.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_desktop_proof.png') });
      console.log('Saved gallery_desktop_proof.png');
    }
    await page.close();
  }

  // 2. Gallery Mobile (375px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const g = document.getElementById('gallery');
      if (g) g.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const g = await page.$('#gallery');
    if (g) {
      await g.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_mobile_proof.png') });
      console.log('Saved gallery_mobile_proof.png');
    }
    await page.close();
  }

  // 3. Doctors Mobile (375px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const d = document.getElementById('doctors');
      if (d) d.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const d = await page.$('#doctors');
    if (d) {
      await d.screenshot({ path: path.join(ARTIFACT_DIR, 'doctors_mobile_proof.png') });
      console.log('Saved doctors_mobile_proof.png');
    }
    await page.close();
  }

  // 4. Equipment Desktop (1280px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const eq = document.getElementById('equipment');
      if (eq) eq.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const eq = await page.$('#equipment');
    if (eq) {
      await eq.screenshot({ path: path.join(ARTIFACT_DIR, 'equipment_desktop_proof.png') });
      console.log('Saved equipment_desktop_proof.png');
    }
    await page.close();
  }

  // 5. Equipment Mobile (375px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const eq = document.getElementById('equipment');
      if (eq) eq.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 800));

    const eq = await page.$('#equipment');
    if (eq) {
      await eq.screenshot({ path: path.join(ARTIFACT_DIR, 'equipment_mobile_proof.png') });
      console.log('Saved equipment_mobile_proof.png');
    }
    await page.close();
  }

  // 6. Rn Modal Opened (1280px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const btn = document.querySelector('[data-open-rn-modal]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'rn_modal_opened_proof.png') });
    console.log('Saved rn_modal_opened_proof.png');
    await page.close();
  }

  // 7. Gallery Modal Opened (Card 3 AKA-01)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:4321/ru/', { waitUntil: 'networkidle0' });
    await preparePage(page);
    await page.evaluate(() => {
      const item3 = document.querySelector('[data-open-gallery-modal="3"]');
      if (item3) item3.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_modal_aka01_proof.png') });
    console.log('Saved gallery_modal_aka01_proof.png');
    await page.close();
  }

  await browser.close();
  console.log('All proofs updated successfully!');
})();
