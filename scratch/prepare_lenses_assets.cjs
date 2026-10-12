const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const srcDir = path.join(root, 'scratch', 'lenses');
  const targetDir = path.join(root, 'src', 'assets', 'lenses');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const mapping = [
    { src: 'Глянцевый футляр с линзой DOUBLE ASPHERIC.png', dst: 'lens1.png' },
    { src: 'Открытый деревянный футляр с линзой.png', dst: 'lens2.png' },
    { src: 'Открытый футляр с оптической линзой.png', dst: 'lens3.png' },
    { src: 'Треугольный футляр с линзой.png', dst: 'lens4.png' },
  ];

  for (const item of mapping) {
    const srcPath = path.join(srcDir, item.src);
    const dstPath = path.join(targetDir, item.dst);

    // Read and save as clean PNG (strip metadata, ensure sRGB)
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
