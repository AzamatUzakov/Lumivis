const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const downloadsDir = 'c:\\Users\\User\\Downloads';
  const candidateFiles = [
    'Глянцевый футляр с линзой DOUBLE ASPHERIC.png',
    'Открытый деревянный футляр с линзой.png',
    'Открытый кейс с тремя линзами.png',
    'Открытый набор пробных линз оптика.png',
    'Открытый футляр с оптической линзой.png',
    'Минималистичный чёрный оптический объектив.png',
    'Треугольный футляр с линзой.png'
  ];

  const results = [];

  for (const f of candidateFiles) {
    const full = path.join(downloadsDir, f);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    const meta = await sharp(full).metadata();

    results.push({
      file: f,
      sizeBytes: st.size,
      sizeKB: (st.size / 1024).toFixed(1),
      width: meta.width,
      height: meta.height,
      ratio: (meta.width / meta.height).toFixed(3),
      aspect3_4: `${meta.width}x${meta.height} (3:4 would be ${meta.width}x${Math.round(meta.width * 4 / 3)})`,
      format: meta.format,
      channels: meta.channels,
      hasAlpha: meta.hasAlpha,
      space: meta.space,
      hasExif: !!meta.exif,
      exifLength: meta.exif ? meta.exif.length : 0,
      hasIcc: !!meta.icc,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
