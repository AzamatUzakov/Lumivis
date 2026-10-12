const fs = require('fs');
const sharp = require('sharp');

const files = [
  { orig: 'media__1791718979326.jpg', path: 'C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979326.jpg' },
  { orig: 'media__1791718979417.jpg', path: 'C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979417.jpg' },
  { orig: 'media__1791718979452.jpg', path: 'C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979452.jpg' },
  { orig: 'media__1791718979470.jpg', path: 'C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5/media__1791718979470.jpg' }
];

async function main() {
  console.log('=== ANALYZING 4 NEW IMAGES ===');
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const stat = fs.statSync(f.path);
    const img = sharp(f.path);
    const meta = await img.metadata();

    // Sample corner pixels to check background color
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    // Top-left pixel
    const tl = [data[0], data[1], data[2]];
    // Top-right pixel
    const trIdx = (meta.width - 1) * info.channels;
    const tr = [data[trIdx], data[trIdx + 1], data[trIdx + 2]];

    console.log(`\n--- File ${i + 1}: ${f.orig} ---`);
    console.log({
      dimensions: `${meta.width} x ${meta.height}`,
      aspectRatio: (meta.width / meta.height).toFixed(3),
      format: meta.format,
      space: meta.space,
      channels: meta.channels,
      hasAlpha: meta.hasAlpha,
      orientation: meta.orientation || 'none (normal)',
      fileSize: `${(stat.size / 1024).toFixed(1)} KB (${stat.size} bytes)`,
      hasExif: !!meta.exif,
      exifLength: meta.exif ? meta.exif.length : 0,
      hasIcc: !!meta.icc,
      cornerColorTL: `rgb(${tl.join(',')})`,
      cornerColorTR: `rgb(${tr.join(',')})`
    });

    if (meta.exif) {
      console.log('  EXIF buffer present (length:', meta.exif.length, ')');
    }
  }
}

main().catch(console.error);
