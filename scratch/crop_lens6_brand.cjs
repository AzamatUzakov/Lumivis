const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  // Find exact letters on lens6: x is roughly 215..260, y is 560..720
  await sharp(path.join(lensesDir, 'lens6.png'))
    .extract({ left: 220, top: 560, width: 35, height: 160 })
    .rotate(270)
    .toFile(path.join(outDir, 'lens6_brand_found.png'));
    
  console.log('done');
}

main().catch(console.error);
