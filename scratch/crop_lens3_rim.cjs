const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  // Lens 3 rim is located roughly around x: 400..700, y: 700..900 in the original 1086x1448
  await sharp(path.join(lensesDir, 'lens3.png'))
    .extract({ left: 450, top: 780, width: 250, height: 100 })
    .toFile(path.join(outDir, 'lens3_rim_exact.png'));
    
  // Also rotate 180
  await sharp(path.join(outDir, 'lens3_rim_exact.png'))
    .rotate(180)
    .toFile(path.join(outDir, 'lens3_rim_rotated.png'));
    
  console.log('done');
}

main().catch(console.error);
