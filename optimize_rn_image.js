import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const inputImagePath = 'C:/Users/User/.gemini/antigravity-ide/brain/c681e96b-61c3-4c12-a615-88a5c110e595/media__1789989228870.jpg';
const publicDir = 'C:/Users/User/Desktop/lumivis lending/public';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  console.log('Reading image:', inputImagePath);
  const imageBuffer = fs.readFileSync(inputImagePath);
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Process Desktop WebP (1200px width, quality 0.82)
  const desktopWebPBase64 = await page.evaluate(async (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 1200;
        const targetHeight = Math.round((img.height / img.width) * targetWidth);
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.src = src;
    });
  }, base64Image);

  const desktopBuffer = Buffer.from(desktopWebPBase64.split(',')[1], 'base64');
  const desktopPath = path.join(publicDir, 'rn-card.webp');
  fs.writeFileSync(desktopPath, desktopBuffer);
  console.log(`Saved ${desktopPath} (${(desktopBuffer.length / 1024).toFixed(1)} KB)`);

  // Process Mobile WebP (800px width, quality 0.78)
  const mobileWebPBase64 = await page.evaluate(async (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 800;
        const targetHeight = Math.round((img.height / img.width) * targetWidth);
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/webp', 0.78));
      };
      img.src = src;
    });
  }, base64Image);

  const mobileBuffer = Buffer.from(mobileWebPBase64.split(',')[1], 'base64');
  const mobilePath = path.join(publicDir, 'rn-card-mobile.webp');
  fs.writeFileSync(mobilePath, mobileBuffer);
  console.log(`Saved ${mobilePath} (${(mobileBuffer.length / 1024).toFixed(1)} KB)`);

  // Also save PNG/JPG copy if needed as fallback rn-card.png
  const pngPath = path.join(publicDir, 'rn-card.png');
  fs.writeFileSync(pngPath, imageBuffer);
  console.log(`Saved fallback ${pngPath}`);

  await browser.close();
  process.exit(0);
})();
