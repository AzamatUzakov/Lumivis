import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

(async () => {
  const sourcePath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\54606073-7157-4f58-a2a6-36fc5bdd7fb9\\media__1791494545093.jpg';
  const previewPath = 'scratch/rn_crop_preview.jpg';

  // Original image dimensions: 768 x 1024
  // Target 4:3 crop at width 768: 768 x 576
  // Left: 0, Width: 768, Height: 576
  
  // Let's test top = 160 (which captures Y from 160 to 736)
  // This covers doctor's headlamp/head, doctor's face, nurse's face, doctor/nurse hands, and infant!
  const cropConfig = {
    left: 0,
    top: 150,
    width: 768,
    height: 576
  };

  await sharp(sourcePath)
    .extract(cropConfig)
    .jpeg({ quality: 90 })
    .toFile(previewPath);

  const previewStats = fs.statSync(previewPath);
  const previewMeta = await sharp(previewPath).metadata();

  console.log('Successfully created scratch/rn_crop_preview.jpg:');
  console.log({
    previewPath,
    cropConfig,
    dimensions: `${previewMeta.width}x${previewMeta.height}`,
    aspectRatio: (previewMeta.width / previewMeta.height).toFixed(3),
    sizeBytes: previewStats.size,
    sizeKb: (previewStats.size / 1024).toFixed(2) + ' KB'
  });
})();
