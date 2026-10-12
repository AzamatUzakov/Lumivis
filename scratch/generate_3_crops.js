import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

(async () => {
  const sourcePath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\54606073-7157-4f58-a2a6-36fc5bdd7fb9\\media__1791494545093.jpg';

  const variants = [
    { name: 'rn_crop_190.jpg', top: 190 },
    { name: 'rn_crop_220.jpg', top: 220 },
    { name: 'rn_crop_250.jpg', top: 250 }
  ];

  for (const v of variants) {
    const outputPath = path.join('scratch', v.name);
    const cropConfig = {
      left: 0,
      top: v.top,
      width: 768,
      height: 576
    };

    await sharp(sourcePath)
      .extract(cropConfig)
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`Generated ${v.name}: Y range ${v.top}..${v.top + 576}, size ${(stats.size / 1024).toFixed(2)} KB`);
  }
})();
