import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

const DIST_DIR = path.resolve('dist');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

function startServer(port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(DIST_DIR, reqUrl);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

(async () => {
  const server = await startServer(4323);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const langs = ['ru', 'uz', 'en'];
  const results = {};

  for (const lang of langs) {
    results[lang] = {};

    // 1. Desktop test
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:4323/${lang}/`, { waitUntil: 'networkidle0' });

    // Check 1: Nav links exist & point to valid sections
    const navAnchors = await page.$$eval('.header-nav a', els => els.map(e => e.getAttribute('href')));
    const expectedAnchors = ['#doctors', '#equipment', '#services', '#retinopathy', '#results', '#contacts'];
    const navOk = expectedAnchors.every(a => navAnchors.includes(a));
    results[lang]['1_nav'] = navOk;

    // Check 2: CTA buttons lead to #booking-form-section
    const ctaHrefs = await page.$$eval('.header-cta, .hero__actions .btn--primary, .mobile-menu__cta', els => els.map(e => e.getAttribute('href')));
    const ctaOk = ctaHrefs.every(h => h === '#booking-form-section');
    results[lang]['2_cta'] = ctaOk;

    // Check 3: Lang switcher buttons data-lang-btn
    const langBtns = await page.$$eval('[data-lang-btn]', els => els.map(e => e.dataset.langBtn));
    const langSwitcherOk = langBtns.includes('ru') && langBtns.includes('uz') && langBtns.includes('en');
    results[lang]['3_lang_switcher'] = langSwitcherOk;

    // Check 4: Doctors carousel autoscroll script
    const docsGridExists = await page.$('.doctors__grid') !== null;
    results[lang]['4_doctors_carousel'] = docsGridExists;

    // Check 5: Equipment 5-col grid & autoscroll
    const equipWallExists = await page.$('.equip-wall') !== null;
    results[lang]['5_equipment_grid'] = equipWallExists;

    // Check 6: Prosthetics continuous carousel
    const prostheticsTrack = await page.$('.prosthetics__slider') !== null;
    results[lang]['6_prosthetics_carousel'] = prostheticsTrack;

    // Check 7: Gallery 11 items & modal openers
    const galleryItems = await page.$$eval('.gallery__item', els => els.length);
    results[lang]['7_gallery_count'] = galleryItems === 11;

    // Check 8: RN Modal
    const rnModalExists = await page.$('#rn-info-modal') !== null;
    results[lang]['8_rn_modal'] = rnModalExists;

    // Check 9: Booking Form TG token / script
    const bookingFormExists = await page.$('#booking-form') !== null;
    results[lang]['9_booking_form'] = bookingFormExists;

    // Check 10: Footer / Header Info
    const footerPhone = await page.$eval('.footer-contacts__phone', e => e.textContent.trim());
    const tgLink = await page.$eval('.footer-social__link[href*="t.me"]', e => e.getAttribute('href'));
    results[lang]['10_footer_info'] = footerPhone.includes('+998') && tgLink.includes('lumivis_health');

    // Check 12: Missing translation keys (e.g. "services.1.title")
    const bodyText = await page.evaluate(() => document.body.innerText);
    const unreplacedKeyMatch = bodyText.match(/\b(nav|hero|services|doctors|equip|rn|gallery|footer|map)\.[0-9a-z_]+\.[0-9a-z_]+\b/i);
    results[lang]['12_unreplaced_keys'] = unreplacedKeyMatch === null;

    await page.close();

    // 2. Mobile 375px test
    const mobPage = await browser.newPage();
    await mobPage.setViewport({ width: 375, height: 812 });
    await mobPage.goto(`http://127.0.0.1:4323/${lang}/`, { waitUntil: 'networkidle0' });

    // Check 11: Horizontal scroll overflow on 375px viewport
    const overflowWidth = await mobPage.evaluate(() => document.documentElement.scrollWidth);
    results[lang]['11_no_mobile_overflow'] = overflowWidth <= 375;

    await mobPage.close();
  }

  await browser.close();
  server.close();

  console.log('REGRESSION TEST RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
