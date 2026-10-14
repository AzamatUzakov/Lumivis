const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));
const BASE = process.env.BASE || 'http://localhost:4321';

(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  let fail = 0;
  const ok = (c, m) => { if (!c) fail++; console.log((c ? '  OK  ' : ' FAIL ') + m); };

  for (const lang of ['ru', 'uz', 'en']) {
    for (const width of [375, 768, 1440]) {
      for (const expanded of [false, true]) {
        if (width < 640 && expanded) continue; // на мобильном кнопки нет, лента показывает все карточки
        const page = await browser.newPage();
        await page.setViewport({ width, height: 900, isMobile: width < 768 });
        await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle2' });
        // принудительно показать .reveal, чтобы замерить размеры
        await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important}' });
        if (expanded) {
          await page.click('#equip-more-btn');
          await new Promise(r => setTimeout(r, 300));
        }
        const r = await page.evaluate((w) => {
          const cells = [...document.querySelectorAll('.equip-cell')];
          const vis = cells.filter(c => getComputedStyle(c).display !== 'none');
          const last = cells[cells.length - 1];
          const heights = vis.map(c => Math.round(c.getBoundingClientRect().height));
          // высоты по рядам (десктоп/планшет): группируем по top
          const rows = {};
          vis.forEach(c => { const t = Math.round(c.getBoundingClientRect().top + window.scrollY); (rows[t] = rows[t] || []).push(Math.round(c.getBoundingClientRect().height)); });
          const rowsEqual = Object.values(rows).every(a => a.every(h => h === a[0]));
          const img = last.querySelector('img');
          return {
            total: cells.length,
            visible: vis.length,
            collapsed: cells.length - vis.length,
            lastName: last.querySelector('.equip-cell__name').textContent.trim(),
            lastDesc: last.querySelector('.equip-cell__desc').textContent.trim(),
            lastBadge: last.querySelector('.equip-cell__index').textContent.trim(),
            lastAlt: img.getAttribute('alt'),
            lastLoading: img.getAttribute('loading'),
            lastImgW: img.getAttribute('width'),
            lastImgH: img.getAttribute('height'),
            lastImgSrc: img.getAttribute('src'),
            rowsEqual,
            heights,
            btnDisplay: (() => { const b = document.getElementById('equip-more-wrap'); return b ? getComputedStyle(b).display : 'none'; })(),
            ariaExpanded: document.getElementById('equip-more-btn')?.getAttribute('aria-expanded'),
            docW: document.documentElement.scrollWidth,
            bodyW: document.body.scrollWidth,
            winW: window.innerWidth
          };
        }, width);
        const tag = `[${lang} ${width}px ${expanded ? 'раскрыто' : 'свёрнуто'}]`;
        console.log(`\n${tag} total=${r.total} visible=${r.visible} collapsed=${r.collapsed} badge=${r.lastBadge}`);
        ok(r.total === 15, 'карточек всего 15');
        ok(r.lastBadge === '15', 'новая карточка последняя (номер 15)');
        ok(r.lastLoading === 'lazy' && r.lastImgW === '640' && r.lastImgH === '640', `img lazy 640x640 (${r.lastImgSrc})`);
        ok(!!r.lastAlt, `alt: ${r.lastAlt}`);
        if (width >= 640) {
          ok(r.collapsed === (expanded ? 0 : 5), `скрыто под кнопкой: ${r.collapsed} (ожидалось ${expanded ? 0 : 5})`);
          ok(r.rowsEqual, 'карточки в одном ряду одной высоты');
        } else {
          ok(r.collapsed === 0, 'на мобильном все карточки в ленте');
          ok(new Set(r.heights).size === 1, `одинаковая высота в ленте: ${[...new Set(r.heights)]}`);
        }
        ok(r.docW <= r.winW && r.bodyW <= r.winW, `нет горизонтального скролла (doc=${r.docW}, win=${r.winW})`);
        if (expanded) ok(r.ariaExpanded === 'true' && r.btnDisplay === 'none', 'кнопка скрыта, aria-expanded=true');
        if (!expanded && width >= 640) ok(r.btnDisplay !== 'none', 'кнопка видна');
        console.log(`  name="${r.lastName}" | desc="${r.lastDesc}"`);

        if (width === 375) {
          // snap-лента: последняя карточка достижима
          const reach = await page.evaluate(async () => {
            const wall = document.getElementById('equipment-wall');
            wall.scrollTo({ left: wall.scrollWidth, behavior: 'instant' });
            await new Promise(r => setTimeout(r, 400));
            const cells = wall.querySelectorAll('.equip-cell');
            const last = cells[cells.length - 1].getBoundingClientRect();
            return { right: Math.round(last.right), left: Math.round(last.left), win: window.innerWidth, snap: getComputedStyle(wall).scrollSnapType };
          });
          ok(reach.left >= 0 && reach.right <= reach.win + 1, `последняя карточка листается до конца (left=${reach.left}, right=${reach.right}), snap=${reach.snap}`);
        }
        const shot = path.join(__dirname, `equip15_${lang}_${width}${expanded ? '_open' : ''}.png`);
        if (width === 1440 && expanded || width === 375) {
          const wall = await page.$('#equipment-wall');
          await wall.evaluate(el => el.scrollIntoView({ block: 'center' }));
          if (width === 375) {
            await page.evaluate(() => document.getElementById('equipment-wall').scrollTo({ left: 99999, behavior: 'instant' }));
          }
          await new Promise(r => setTimeout(r, 300));
          await wall.screenshot({ path: shot });
        }
        await page.close();
      }
    }
  }
  await browser.close();
  console.log(`\n=== ИТОГ: ${fail === 0 ? 'ВСЁ ОК' : fail + ' ОШИБОК'} ===`);
  process.exit(fail ? 1 : 0);
})();
