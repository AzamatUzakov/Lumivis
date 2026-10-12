const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const distDir = path.join(root, 'dist');
  const distAstroDir = path.join(distDir, '_astro');
  const srcAssetsDir = path.join(root, 'src', 'assets', 'equipment');

  // Exact mapping by ID:
  // id, source file name
  const cards = [
    { id: 1, file: 'Huvitz.png' },
    { id: 2, file: 'Labomed.png' },
    { id: 3, file: 'biomikroskop.png' },
    { id: 4, file: 'sinoptofon.png' },
    { id: 5, file: 'rucheek.png' },
    { id: 6, file: 'akkomodometr.png' },
    { id: 7, file: 'amo-atos.png' },
    { id: 8, file: 'Gezatone.png' },
    { id: 9, file: 'mocular.png' },
    { id: 10, file: 'huvitz-tono.jpg' },
    { id: 11, file: 'eq11.jpg' },
    { id: 12, file: 'eq12.jpg' },
    { id: 13, file: 'eq13.jpg' },
    { id: 14, file: 'eq14.jpg' },
  ];

  // In dist/ru/index.html, find exact referenced webp for each card
  const html = fs.readFileSync(path.join(distDir, 'ru', 'index.html'), 'utf8');
  const startIdx = html.indexOf('id="equipment"');
  const endIdx = html.indexOf('</section>', startIdx);
  const equipHtml = html.substring(startIdx, endIdx);

  // We know the render order in EquipmentSection.astro:
  const renderOrder = [1, 10, 11, 2, 3, 13, 14, 4, 9, 5, 12, 6, 7, 8];

  const imgRegex = /<img\s+([^>]+)>/g;
  let match;
  const imgsInHtml = [];
  while ((match = imgRegex.exec(equipHtml)) !== null) {
    const attrs = match[1];
    const src = attrs.match(/src="\/_astro\/([^"]+)"/)?.[1];
    const width = attrs.match(/width="([^"]+)"/)?.[1];
    const height = attrs.match(/height="([^"]+)"/)?.[1];
    const loading = attrs.match(/loading="([^"]+)"/)?.[1];
    const decoding = attrs.match(/decoding="([^"]+)"/)?.[1];
    imgsInHtml.push({ src, width, height, loading, decoding, attrs });
  }

  const tableData = [];

  for (let i = 0; i < renderOrder.length; i++) {
    const cardId = renderOrder[i];
    const cardDef = cards.find(c => c.id === cardId);
    const htmlImg = imgsInHtml[i];

    const srcPath = path.join(srcAssetsDir, cardDef.file);
    const srcStat = fs.statSync(srcPath);
    const srcMeta = await sharp(srcPath).metadata();

    const distPath = path.join(distAstroDir, htmlImg.src);
    const distStat = fs.statSync(distPath);
    const distMeta = await sharp(distPath).metadata();

    tableData.push({
      id: cardId,
      srcFile: cardDef.file,
      srcPx: `${srcMeta.width}×${srcMeta.height}`,
      srcBytes: srcStat.size,
      srcKB: (srcStat.size / 1024).toFixed(1),
      distName: htmlImg.src,
      distPx: `${distMeta.width}×${distMeta.height}`,
      distBytes: distStat.size,
      distKB: (distStat.size / 1024).toFixed(1),
      // Image attributes in HTML
      width: htmlImg.width,
      height: htmlImg.height,
      loading: htmlImg.loading,
      decoding: htmlImg.decoding,
    });
  }

  // Sort strictly by ID 1..14
  tableData.sort((a, b) => a.id - b.id);

  console.log('=== TABLE DATA ===');
  console.log(JSON.stringify(tableData, null, 2));

  // Directory sizes
  function walkDir(dir) {
    let totalBytes = 0;
    let fileCount = 0;
    let imageBytes = 0;
    let imageCount = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const sub = walkDir(fullPath);
        totalBytes += sub.totalBytes;
        fileCount += sub.fileCount;
        imageBytes += sub.imageBytes;
        imageCount += sub.imageCount;
      } else {
        const st = fs.statSync(fullPath);
        totalBytes += st.size;
        fileCount++;
        if (/\.(webp|jpg|jpeg|png|svg|avif|gif)$/i.test(ent.name)) {
          imageBytes += st.size;
          imageCount++;
        }
      }
    }
    return { totalBytes, fileCount, imageBytes, imageCount };
  }

  const distStats = walkDir(distDir);
  const astroStats = walkDir(distAstroDir);

  // Equipment webp sum
  const equipDistBytesAll = tableData.reduce((acc, r) => acc + r.distBytes, 0);
  const equipDistBytesOld = tableData.filter(r => r.id <= 10).reduce((acc, r) => acc + r.distBytes, 0);
  const equipDistBytesNew = tableData.filter(r => r.id > 10).reduce((acc, r) => acc + r.distBytes, 0);

  console.log('\n=== DIRECTORY SIZES ===');
  console.log('dist total:', {
    bytes: distStats.totalBytes,
    KB: (distStats.totalBytes / 1024).toFixed(1),
    MB: (distStats.totalBytes / (1024 * 1024)).toFixed(2),
    files: distStats.fileCount
  });
  console.log('dist/_astro total:', {
    bytes: astroStats.totalBytes,
    KB: (astroStats.totalBytes / 1024).toFixed(1),
    MB: (astroStats.totalBytes / (1024 * 1024)).toFixed(2),
    files: astroStats.fileCount
  });
  console.log('dist/_astro images (webp/jpg/png/svg):', {
    bytes: astroStats.imageBytes,
    KB: (astroStats.imageBytes / 1024).toFixed(1),
    MB: (astroStats.imageBytes / (1024 * 1024)).toFixed(2),
    files: astroStats.imageCount
  });
  console.log('14 equipment webp total:', {
    bytes: equipDistBytesAll,
    KB: (equipDistBytesAll / 1024).toFixed(1)
  });
  console.log('10 old equipment webp total:', {
    bytes: equipDistBytesOld,
    KB: (equipDistBytesOld / 1024).toFixed(1)
  });
  console.log('4 new equipment webp total:', {
    bytes: equipDistBytesNew,
    KB: (equipDistBytesNew / 1024).toFixed(1)
  });
}

main().catch(console.error);
