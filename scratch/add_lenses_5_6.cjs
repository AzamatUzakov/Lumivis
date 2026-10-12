const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const srcDir = path.join(root, 'scratch', 'lenses');
  const targetDir = path.join(root, 'src', 'assets', 'lenses');

  const mapping = [
    { src: 'Минималистичный чёрный оптический объектив.png', dst: 'lens5.png' },
    { src: 'Открытый кейс с тремя линзами.png', dst: 'lens6.png' },
  ];

  for (const item of mapping) {
    const srcPath = path.join(srcDir, item.src);
    const dstPath = path.join(targetDir, item.dst);

    await sharp(srcPath)
      .toColourspace('srgb')
      .png({ compressionLevel: 9 })
      .toFile(dstPath);

    const st = fs.statSync(dstPath);
    const meta = await sharp(dstPath).metadata();
    console.log(`Saved ${item.dst}: ${meta.width}x${meta.height}, ${(st.size / 1024).toFixed(1)} KB, hasExif: ${!!meta.exif}`);
  }
}

main().catch(console.error);
