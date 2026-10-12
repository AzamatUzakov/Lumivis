const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');

  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(lensesDir, `lens${i}.png`);
    const meta = await sharp(filePath).metadata();
    console.log(`lens${i}.png: width=${meta.width}, height=${meta.height}, ratio=${(meta.width / meta.height).toFixed(3)}`);
  }
}

main().catch(console.error);
