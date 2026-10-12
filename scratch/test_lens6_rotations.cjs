const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const src = path.join(root, 'src', 'assets', 'lenses', 'lens6.png');
  const outDir = path.join(root, 'scratch');

  // Rotate 90 deg clockwise
  await sharp(src)
    .rotate(90)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'lens6_cw.png'));

  // Rotate 90 deg counter-clockwise (270)
  await sharp(src)
    .rotate(270)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'lens6_ccw.png'));

  console.log('Rotated files created in scratch/');
}

main().catch(console.error);
