const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const lensesDir = 'scratch/lenses';
  const outDir = 'scratch/lens_crops';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(lensesDir).filter(f => f.endsWith('.png'));

  const cropStats = [];

  for (const f of files) {
    const srcPath = path.join(lensesDir, f);
    const meta = await sharp(srcPath).metadata();

    const topCropSrc = Math.round((meta.height - meta.width) / 2); // 181 px
    const bottomCropSrc = meta.height - meta.width - topCropSrc; // 181 px

    const safeBaseName = f.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
    const croppedWebpPath = path.join(outDir, safeBaseName + '_square_640.webp');
    const visualCheckPath = path.join(outDir, safeBaseName + '_crop_indicator.png');

    // 1. Generate exact 640x640 webp (quality 92) like Astro does
    await sharp(srcPath)
      .resize(640, 640, { fit: 'cover', position: 'center' })
      .webp({ quality: 92 })
      .toFile(croppedWebpPath);

    const croppedStat = fs.statSync(croppedWebpPath);

    // 2. Create raw buffer and draw red indicator lines and shading on the buffer
    const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
    const bgR = data[0], bgG = data[1], bgB = data[2];

    let topObjectPixels = 0;
    let bottomObjectPixels = 0;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const diff = Math.abs(data[idx] - bgR) + Math.abs(data[idx+1] - bgG) + Math.abs(data[idx+2] - bgB);
        const isObject = diff > 40;

        if (y < topCropSrc) {
          if (isObject) topObjectPixels++;
          // tint red
          data[idx] = Math.min(255, data[idx] + 80);
          data[idx+1] = Math.floor(data[idx+1] * 0.7);
          data[idx+2] = Math.floor(data[idx+2] * 0.7);
        } else if (y >= info.height - bottomCropSrc) {
          if (isObject) bottomObjectPixels++;
          // tint red
          data[idx] = Math.min(255, data[idx] + 80);
          data[idx+1] = Math.floor(data[idx+1] * 0.7);
          data[idx+2] = Math.floor(data[idx+2] * 0.7);
        } else if (y === topCropSrc || y === topCropSrc + 1 || y === info.height - bottomCropSrc || y === info.height - bottomCropSrc - 1) {
          // bright red line
          data[idx] = 255;
          data[idx+1] = 0;
          data[idx+2] = 0;
        }
      }
    }

    await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .resize({ width: 500 })
      .png()
      .toFile(visualCheckPath);

    cropStats.push({
      file: f,
      srcDim: `${meta.width}x${meta.height}`,
      topCutPx: topCropSrc,
      bottomCutPx: bottomCropSrc,
      topObjectPixels,
      bottomObjectPixels,
      isTopClipped: topObjectPixels > 50,
      isBottomClipped: bottomObjectPixels > 50,
      croppedWebpSizeKB: (croppedStat.size / 1024).toFixed(1),
      croppedWebpFile: path.basename(croppedWebpPath),
      indicatorFile: path.basename(visualCheckPath)
    });
  }

  console.log(JSON.stringify(cropStats, null, 2));
}

main().catch(console.error);
