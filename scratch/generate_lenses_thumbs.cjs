const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const downloadsDir = 'c:\\Users\\User\\Downloads';
  const outDir = 'scratch/lenses_candidates';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = [
    'Глянцевый футляр с линзой DOUBLE ASPHERIC.png',
    'Открытый деревянный футляр с линзой.png',
    'Открытый кейс с тремя линзами.png',
    'Открытый набор пробных линз оптика.png',
    'Открытый футляр с оптической линзой.png',
    'Минималистичный чёрный оптический объектив.png',
    'Треугольный футляр с линзой.png'
  ];

  for (const f of files) {
    const src = path.join(downloadsDir, f);
    if (!fs.existsSync(src)) continue;
    // Generate 400px thumb for fast viewing
    const thumbName = path.basename(f, '.png') + '.jpg';
    await sharp(src)
      .resize({ width: 400 })
      .jpeg({ quality: 80 })
      .toFile(path.join(outDir, thumbName));
    console.log('Generated thumbnail for', f);
  }
}

main().catch(console.error);
