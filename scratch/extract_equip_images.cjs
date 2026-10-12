const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const htmlPath = path.join(root, 'dist', 'ru', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Look for section with id="equipment"
  const startIdx = html.indexOf('id="equipment"');
  if (startIdx === -1) {
    console.error('id="equipment" not found');
    return;
  }
  const endIdx = html.indexOf('</section>', startIdx);
  const equipHtml = html.substring(startIdx, endIdx);

  // Find all <img ...> tags inside this section
  const imgRegex = /<img\s+([^>]+)>/g;
  let match;
  const imgs = [];

  while ((match = imgRegex.exec(equipHtml)) !== null) {
    const attrsStr = match[1];
    const srcMatch = attrsStr.match(/src="([^"]+)"/);
    const altMatch = attrsStr.match(/alt="([^"]+)"/);
    const widthMatch = attrsStr.match(/width="([^"]+)"/);
    const heightMatch = attrsStr.match(/height="([^"]+)"/);
    const loadingMatch = attrsStr.match(/loading="([^"]+)"/);
    const decodingMatch = attrsStr.match(/decoding="([^"]+)"/);

    imgs.push({
      src: srcMatch ? srcMatch[1] : null,
      alt: altMatch ? altMatch[1] : null,
      width: widthMatch ? widthMatch[1] : null,
      height: heightMatch ? heightMatch[1] : null,
      loading: loadingMatch ? loadingMatch[1] : null,
      decoding: decodingMatch ? decodingMatch[1] : null,
    });
  }

  console.log(`Found ${imgs.length} images in equipment section:`);

  // Mapping of order in EquipmentSection.astro
  const equipOrder = [
    { id: 1, file: 'Huvitz.png' },
    { id: 10, file: 'huvitz-tono.jpg' },
    { id: 11, file: 'eq11.jpg' },
    { id: 2, file: 'Labomed.png' },
    { id: 3, file: 'biomikroskop.png' },
    { id: 13, file: 'eq13.jpg' },
    { id: 14, file: 'eq14.jpg' },
    { id: 4, file: 'sinoptofon.png' },
    { id: 9, file: 'mocular.png' },
    { id: 5, file: 'rucheek.png' },
    { id: 12, file: 'eq12.jpg' },
    { id: 6, file: 'akkomodometr.png' },
    { id: 7, file: 'amo-atos.png' },
    { id: 8, file: 'Gezatone.png' },
  ];

  const srcDir = path.join(root, 'src', 'assets', 'equipment');
  const distAstroDir = path.join(root, 'dist', '_astro');

  const detailed = [];
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const item = equipOrder[i];

    // Source info
    const srcPath = path.join(srcDir, item.file);
    const srcStat = fs.statSync(srcPath);
    const srcMeta = await sharp(srcPath).metadata();

    // Dist info
    const distFileName = path.basename(img.src);
    const distPath = path.join(distAstroDir, distFileName);
    const distStat = fs.statSync(distPath);
    const distMeta = await sharp(distPath).metadata();

    detailed.push({
      id: item.id,
      orderIdx: i + 1,
      srcFile: item.file,
      srcPx: `${srcMeta.width}x${srcMeta.height}`,
      srcBytes: srcStat.size,
      srcKB: (srcStat.size / 1024).toFixed(1),
      distName: distFileName,
      distPx: `${distMeta.width}x${distMeta.height}`,
      distBytes: distStat.size,
      distKB: (distStat.size / 1024).toFixed(1),
      imgWidth: img.width,
      imgHeight: img.height,
      imgLoading: img.loading,
      imgDecoding: img.decoding,
    });
  }

  // Sort by ID
  detailed.sort((a, b) => a.id - b.id);

  console.log('\n--- ALL 14 EQUIPMENT CARDS SORTED BY ID ---');
  console.table(detailed.map(d => ({
    id: d.id,
    srcFile: d.srcFile,
    srcPx: d.srcPx,
    srcKB: d.srcKB,
    distName: d.distName,
    distPx: d.distPx,
    distKB: d.distKB,
    imgAttrs: `w=${d.imgWidth} h=${d.imgHeight} l=${d.imgLoading} d=${d.imgDecoding}`
  })));

  // Calculate statistics for srcKB and distKB
  const oldDistKB = detailed.filter(d => d.id <= 10).map(d => parseFloat(d.distKB));
  const newDistKB = detailed.filter(d => d.id > 10).map(d => parseFloat(d.distKB));
  const allDistKB = detailed.map(d => parseFloat(d.distKB));
  const allDistBytes = detailed.map(d => d.distBytes);

  const allSrcKB = detailed.map(d => parseFloat(d.srcKB));
  const allSrcBytes = detailed.map(d => d.srcBytes);

  console.log('\n--- STATS FOR ALL 14 CARDS ---');
  console.log('Source (KB):', {
    min: Math.min(...allSrcKB),
    max: Math.max(...allSrcKB),
    avg: (allSrcKB.reduce((a, b) => a + b, 0) / allSrcKB.length).toFixed(1),
  });

  console.log('Dist WebP All 14 (KB):', {
    min: Math.min(...allDistKB),
    max: Math.max(...allDistKB),
    avg: (allDistKB.reduce((a, b) => a + b, 0) / allDistKB.length).toFixed(1),
  });

  console.log('Dist WebP Old 1..10 (KB):', {
    min: Math.min(...oldDistKB),
    max: Math.max(...oldDistKB),
    avg: (oldDistKB.reduce((a, b) => a + b, 0) / oldDistKB.length).toFixed(1),
  });

  console.log('Dist WebP New 11..14 (KB):', {
    min: Math.min(...newDistKB),
    max: Math.max(...newDistKB),
    avg: (newDistKB.reduce((a, b) => a + b, 0) / newDistKB.length).toFixed(1),
    values: newDistKB
  });

  // Check 10% threshold
  const oldMax = Math.max(...oldDistKB);
  const threshold = oldMax * 1.10;
  console.log(`\nOld max: ${oldMax} KB, +10% threshold: ${threshold.toFixed(2)} KB`);
  for (const d of detailed.filter(d => d.id > 10)) {
    const val = parseFloat(d.distKB);
    const diffPercent = (((val - oldMax) / oldMax) * 100).toFixed(1);
    console.log(`Card ${d.id} (${d.distName}): ${val} KB (vs old max ${oldMax}: ${diffPercent > 0 ? '+' : ''}${diffPercent}%) -> Exceeds +10%? ${val > threshold}`);
  }
}

main().catch(console.error);
