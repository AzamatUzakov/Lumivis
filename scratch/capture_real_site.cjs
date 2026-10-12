const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test on 1440px
  console.log('--- Capturing 1440px desktop ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Take screenshot of row 3 (cards 11-14 + 5th slot)
  const wall = await page.$('.equip-wall');
  if (wall) {
    await wall.screenshot({ path: 'scratch/equip_wall_1440px_real.png' });
    console.log('Saved scratch/equip_wall_1440px_real.png');
  }

  // Screenshot each new card individually
  const cards = await page.$$('.equip-cell');
  console.log(`Found ${cards.length} cards`);
  for (let i = 10; i < cards.length; i++) {
    const cardId = i + 1;
    await cards[i].screenshot({ path: `scratch/card_${cardId}_1440px_real.png` });
    console.log(`Saved scratch/card_${cardId}_1440px_real.png`);
  }

  // Test on 1024px
  console.log('--- Capturing 1024px desktop ---');
  await page.setViewport({ width: 1024, height: 900 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  const wall1024 = await page.$('.equip-wall');
  if (wall1024) {
    await wall1024.screenshot({ path: 'scratch/equip_wall_1024px_real.png' });
    console.log('Saved scratch/equip_wall_1024px_real.png');
  }

  // Test on 768px
  console.log('--- Capturing 768px tablet ---');
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  const wall768 = await page.$('.equip-wall');
  if (wall768) {
    await wall768.screenshot({ path: 'scratch/equip_wall_768px_real.png' });
    console.log('Saved scratch/equip_wall_768px_real.png');
  }

  // Test on 375px
  console.log('--- Capturing 375px mobile ---');
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  const wall375 = await page.$('.equip-wall');
  if (wall375) {
    await wall375.screenshot({ path: 'scratch/equip_wall_375px_real.png' });
    console.log('Saved scratch/equip_wall_375px_real.png');
  }

  await browser.close();
}

main().catch(console.error);
