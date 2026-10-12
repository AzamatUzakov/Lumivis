const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  // Let's crop from y: 880 to 1020, x: 440 to 740
  await sharp(path.join(lensesDir, 'lens3.png'))
    .extract({ left: 450, top: 900, width: 280, height: 120 })
    .toFile(path.join(outDir, 'lens3_rim_zoomed.png'));
    
  await sharp(path.join(outDir, 'lens3_rim_zoomed.png'))
    .rotate(180)
    .toFile(path.join(outDir, 'lens3_rim_zoomed_rotated.png'));

  console.log('done');
}

main().catch(console.error);
