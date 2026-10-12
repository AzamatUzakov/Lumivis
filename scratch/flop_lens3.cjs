const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const outDir = path.join(root, 'scratch', 'lens_crops');

  await sharp(path.join(outDir, 'lens3_rim_zoomed_rotated.png'))
    .flop()
    .toFile(path.join(outDir, 'lens3_rim_zoomed_readable.png'));

  console.log('done');
}

main().catch(console.error);
