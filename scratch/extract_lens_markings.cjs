const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const lensesDir = path.join(root, 'src', 'assets', 'lenses');
  const outDir = path.join(root, 'scratch', 'lens_crops');

  // Lens 1: lid logo + rim text
  await sharp(path.join(lensesDir, 'lens1.png'))
    .extract({ left: 350, top: 350, width: 200, height: 200 })
    .toFile(path.join(outDir, 'lens1_lid_logo.png'));
  await sharp(path.join(lensesDir, 'lens1.png'))
    .extract({ left: 450, top: 600, width: 260, height: 80 })
    .toFile(path.join(outDir, 'lens1_rim_text.png'));

  // Lens 2: any text on wood or rim
  await sharp(path.join(lensesDir, 'lens2.png'))
    .extract({ left: 400, top: 450, width: 300, height: 200 })
    .toFile(path.join(outDir, 'lens2_lens_detail.png'));

  // Lens 3: lid logo + rim text
  await sharp(path.join(lensesDir, 'lens3.png'))
    .extract({ left: 350, top: 350, width: 200, height: 200 })
    .toFile(path.join(outDir, 'lens3_lid_logo.png'));
  await sharp(path.join(lensesDir, 'lens3.png'))
    .extract({ left: 430, top: 620, width: 300, height: 80 })
    .toFile(path.join(outDir, 'lens3_rim_text.png'));

  // Lens 4: case & lens detail
  await sharp(path.join(lensesDir, 'lens4.png'))
    .extract({ left: 450, top: 500, width: 250, height: 200 })
    .toFile(path.join(outDir, 'lens4_lens_detail.png'));

  // Lens 5: markings on rim
  await sharp(path.join(lensesDir, 'lens5.png'))
    .extract({ left: 380, top: 450, width: 320, height: 160 })
    .toFile(path.join(outDir, 'lens5_rim_text.png'));

  // Lens 6: logo on spine + lenses
  await sharp(path.join(lensesDir, 'lens6.png'))
    .extract({ left: 220, top: 550, width: 60, height: 250 })
    .toFile(path.join(outDir, 'lens6_spine_logo.png'));

  console.log('Done crops');
}

main().catch(console.error);
