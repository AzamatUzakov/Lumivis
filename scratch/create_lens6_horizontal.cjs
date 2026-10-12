const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const src = path.join(root, 'src', 'assets', 'lenses', 'lens6.png');
  const dst = path.join(root, 'src', 'assets', 'lenses', 'lens6-horizontal.png');

  // Rotate 90 counter-clockwise (270)
  await sharp(src)
    .rotate(270)
    .toColourspace('srgb')
    .png({ compressionLevel: 9 })
    .toFile(dst);

  const st = fs.statSync(dst);
  const meta = await sharp(dst).metadata();
  console.log(`Created ${dst}: ${meta.width}x${meta.height}, ${(st.size / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
