import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const sourceDir = 'C:/Users/User/Downloads/p';
const targetDir = 'C:/Users/User/Desktop/lumivis lending/src/assets/prosthetics';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  console.log('Starting optimization of prosthetics photos...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const pairs = [
    { num: 1, before: '1.d.png', after: '1.p.png' },
    { num: 2, before: '2.d.png', after: '2.p.png' },
    { num: 3, before: '3.d.png', after: '3.p.png' },
    { num: 4, before: '4.d.png', after: '4.p.png' },
    { num: 5, before: '5.d.png', after: '5.p.png' },
    { num: 6, before: '6.d.png', after: '6.p.png' },
  ];

  for (const item of pairs) {
    for (const type of ['before', 'after']) {
      const filename = item[type];
      const srcPath = path.join(sourceDir, filename);

      if (!fs.existsSync(srcPath)) {
        console.error('File not found:', srcPath);
        continue;
      }

      const imageBuffer = fs.readFileSync(srcPath);
      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

      // Resize to 600px width with quality 88
      const processedDataUrl = await page.evaluate(async (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetWidth = 600;
            const targetHeight = Math.round((img.height / img.width) * targetWidth);
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          };
          img.src = src;
        });
      }, base64Image);

      const outBuffer = Buffer.from(processedDataUrl.split(',')[1], 'base64');
      const outName = `case${item.num}_${type}.jpg`;
      const outPath = path.join(targetDir, outName);
      fs.writeFileSync(outPath, outBuffer);

      console.log(`Optimized: ${filename} (2.2MB) -> ${outName} (${(outBuffer.length / 1024).toFixed(1)} KB)`);
    }
  }

  await browser.close();
  console.log('All 12 prosthetics photos successfully optimized!');
  process.exit(0);
})();
