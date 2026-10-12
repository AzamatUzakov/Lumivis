const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  // Lens 5 lettering is around y: 480..580, x: 380..700
  await sharp(path.join(lensesDir, 'lens5.png'))
    .extract({ left: 380, top: 480, width: 320, height: 100 })
    .toFile(path.join(outDir, 'lens5_rim_exact.png'));

  // Lens 6 spine lettering
  await sharp(path.join(lensesDir, 'lens6.png'))
    .extract({ left: 240, top: 570, width: 35, height: 160 })
    .toFile(path.join(outDir, 'lens6_spine_exact.png'));
    
  await sharp(path.join(outDir, 'lens6_spine_exact.png'))
    .rotate(270)
    .toFile(path.join(outDir, 'lens6_spine_rotated.png'));

  console.log('done');
}

main().catch(console.error);
