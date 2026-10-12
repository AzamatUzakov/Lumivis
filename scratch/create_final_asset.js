import fs from 'fs';
import sharp from 'sharp';

(async () => {
  const sourcePath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\54606073-7157-4f58-a2a6-36fc5bdd7fb9\\media__1791494545093.jpg';
  const targetPath = 'src/assets/gallery/rn-screening.jpg';

  const cropConfig = {
    left: 0,
    top: 190,
    width: 768,
    height: 576
  };

  // Crop 768x576, JPEG quality 85, sRGB, strip EXIF metadata
  await sharp(sourcePath)
    .extract(cropConfig)
    .jpeg({ quality: 85, chromaSubsampling: '4:2:0' })
    .toFile(targetPath);

  const stats = fs.statSync(targetPath);
  const meta = await sharp(targetPath).metadata();

  console.log('Successfully created src/assets/gallery/rn-screening.jpg:');
  console.log({
    targetPath,
    dimensions: `${meta.width}x${meta.height}`,
    format: meta.format,
    space: meta.space,
    hasExif: !!meta.exif,
    sizeBytes: stats.size,
    sizeKb: (stats.size / 1024).toFixed(2) + ' KB'
  });
})();
