const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const htmlPath = path.join(root, 'dist', 'ru', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract .equip-wall section
  const wallMatch = html.match(/<div class="equip-wall"[^>]*>([\s\S]*?)<\/div>\s*<div class="equip-more-wrap"/);
  if (!wallMatch) {
    console.error('Could not find equip-wall in HTML');
    return;
  }
  const wallContent = wallMatch[1];

  // Match each equip-cell
  const cellRegex = /<div class="equip-cell[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="equip-cell"|$)/g;
  
  // Actually let's just find each <img> inside equip-wall
  const imgRegex = /<img[^>]*src="\/_astro\/([^"]+)"[^>]*alt="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*loading="([^"]*)"[^>]*decoding="([^"]*)"[^>]*>/g;
  
  let match;
  const imgsInHtml = [];
  while ((match = imgRegex.exec(wallContent)) !== null) {
    imgsInHtml.push({
      src: match[1],
      alt: match[2],
      width: match[3],
      height: match[4],
      loading: match[5],
      decoding: match[6],
    });
  }

  console.log(`Found ${imgsInHtml.length} images in equip-wall:`);
  imgsInHtml.forEach((img, idx) => {
    console.log(`${idx + 1}: ${img.src} (alt: ${img.alt.substring(0, 30)}...)`);
  });

  // Also check all 14 files in EquipmentSection.astro
  // order of equipment in EquipmentSection.astro:
  // id: 1 (Huvitz.png), 10 (huvitz-tono.jpg), 11 (eq11.jpg), 2 (Labomed.png), 3 (biomikroskop.png),
  // 13 (eq13.jpg), 14 (eq14.jpg), 4 (sinoptofon.png), 9 (mocular.png), 5 (rucheek.png),
  // 12 (eq12.jpg), 6 (akkomodometr.png), 7 (amo-atos.png), 8 (Gezatone.png)

  const equipSectionOrder = [
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

  const distAstroDir = path.join(root, 'dist', '_astro');
  const srcAssetsDir = path.join(root, 'src', 'assets', 'equipment');

  const detailedCards = [];
  for (let i = 0; i < equipSectionOrder.length; i++) {
    const item = equipSectionOrder[i];
    const htmlImg = imgsInHtml[i];
    const srcPath = path.join(srcAssetsDir, item.file);
    const srcStat = fs.statSync(srcPath);
    const srcMeta = await sharp(srcPath).metadata();

    const distPath = path.join(distAstroDir, htmlImg.src);
    const distStat = fs.statSync(distPath);
    const distMeta = await sharp(distPath).metadata();

    detailedCards.push({
      orderIndex: i + 1,
      id: item.id,
      srcFile: item.file,
      srcDim: `${srcMeta.width}x${srcMeta.height}`,
      srcBytes: srcStat.size,
      srcKB: (srcStat.size / 1024).toFixed(1),
      distFile: htmlImg.src,
      distDim: `${distMeta.width}x${distMeta.height}`,
      distBytes: distStat.size,
      distKB: (distStat.size / 1024).toFixed(1),
      imgWidth: htmlImg.width,
      imgHeight: htmlImg.height,
      imgLoading: htmlImg.loading,
      imgDecoding: htmlImg.decoding,
    });
  }

  console.log('\n--- DETAILED CARDS IN ORDER ---');
  console.table(detailedCards);

  // Now sort by ID (1..14) as requested by user
  detailedCards.sort((a, b) => a.id - b.id);

  console.log('\n--- DETAILED CARDS SORTED BY ID ---');
  console.table(detailedCards);
}

main().catch(console.error);
