const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const equipDir = 'src/assets/equipment';
  const existingFiles = [
    { id: 1, name: 'Huvitz.png' },
    { id: 10, name: 'huvitz-tono.jpg' },
    { id: 2, name: 'Labomed.png' },
    { id: 3, name: 'biomikroskop.png' },
    { id: 4, name: 'sinoptofon.png' },
    { id: 5, name: 'rucheek.png' },
    { id: 6, name: 'akkomodometr.png' },
    { id: 7, name: 'amo-atos.png' },
    { id: 8, name: 'Gezatone.png' },
    { id: 9, name: 'mocular.png' },
  ];

  console.log('=== EXISTING 10 EQUIPMENT ASSETS ===');
  const distAstroDir = 'dist/_astro';
  const distFiles = fs.existsSync(distAstroDir) ? fs.readdirSync(distAstroDir) : [];

  const results = [];

  for (const item of existingFiles) {
    const fullPath = path.join(equipDir, item.name);
    const stat = fs.statSync(fullPath);
    const meta = await sharp(fullPath).metadata();

    // Find in dist/_astro
    const baseWithoutExt = path.parse(item.name).name.toLowerCase();
    const matchingDist = distFiles.filter(df => df.toLowerCase().startsWith(baseWithoutExt) && df.endsWith('.webp'));
    let distSize = null;
    let distFileName = null;
    if (matchingDist.length > 0) {
      // Pick closest match
      distFileName = matchingDist[0];
      distSize = fs.statSync(path.join(distAstroDir, distFileName)).size;
    }

    results.push({
      id: item.id,
      file: item.name,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      channels: meta.channels,
      hasAlpha: meta.hasAlpha,
      srcSizeBytes: stat.size,
      srcSizeKB: (stat.size / 1024).toFixed(1),
      distFile: distFileName,
      distSizeBytes: distSize,
      distSizeKB: distSize ? (distSize / 1024).toFixed(1) : 'N/A'
    });
  }

  console.table(results);

  const srcSizes = results.map(r => r.srcSizeBytes);
  const distSizes = results.filter(r => r.distSizeBytes).map(r => r.distSizeBytes);

  console.log('Source size stats (bytes):', {
    min: Math.min(...srcSizes),
    max: Math.max(...srcSizes),
    avg: Math.round(srcSizes.reduce((a, b) => a + b, 0) / srcSizes.length)
  });

  if (distSizes.length) {
    console.log('Dist webp size stats (bytes):', {
      min: Math.min(...distSizes),
      max: Math.max(...distSizes),
      avg: Math.round(distSizes.reduce((a, b) => a + b, 0) / distSizes.length)
    });
  }
}

main().catch(console.error);
