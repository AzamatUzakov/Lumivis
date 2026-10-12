const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const srcAssetsDir = path.join(root, 'src', 'assets', 'equipment');
  const distAstroDir = path.join(root, 'dist', '_astro');
  const distDir = path.join(root, 'dist');

  // mapping of imports to id and file
  const equipItems = [
    { id: 1, name: 'eq1', file: 'Huvitz.png' },
    { id: 2, name: 'eq2', file: 'Labomed.png' },
    { id: 3, name: 'eq3', file: 'biomikroskop.png' },
    { id: 4, name: 'eq4', file: 'sinoptofon.png' },
    { id: 5, name: 'eq5', file: 'rucheek.png' },
    { id: 6, name: 'eq6', file: 'akkomodometr.png' },
    { id: 7, name: 'eq7', file: 'amo-atos.png' },
    { id: 8, name: 'eq8', file: 'Gezatone.png' },
    { id: 9, name: 'eq9', file: 'mocular.png' },
    { id: 10, name: 'eq10', file: 'huvitz-tono.jpg' },
    { id: 11, name: 'eq11', file: 'eq11.jpg' },
    { id: 12, name: 'eq12', file: 'eq12.jpg' },
    { id: 13, name: 'eq13', file: 'eq13.jpg' },
    { id: 14, name: 'eq14', file: 'eq14.jpg' },
  ];

  // Inspect HTML in dist to find the exact image src for each card
  const ruHtml = fs.readFileSync(path.join(distDir, 'ru', 'index.html'), 'utf8');
  
  // Find all equipment cards and their <img> src in dist/ru/index.html
  // or check dist/_astro files
  const distFiles = fs.readdirSync(distAstroDir);

  const results = [];

  for (const item of equipItems) {
    const srcPath = path.join(srcAssetsDir, item.file);
    const srcStat = fs.statSync(srcPath);
    const srcMeta = await sharp(srcPath).metadata();

    // Match dist webp file
    // In Astro, image names are usually [name].[hash].webp or [name]_[hash].webp
    // Let's find matches in dist/ru/index.html
    const baseNameWithoutExt = path.parse(item.file).name;
    // Look in HTML for something matching baseNameWithoutExt
    const regex = new RegExp(`/_astro/(${baseNameWithoutExt}[^"']+\\.webp)`, 'i');
    let match = ruHtml.match(regex);
    let distFileName = match ? match[1] : null;

    if (!distFileName) {
      // Find directly in distFiles
      const found = distFiles.find(f => f.toLowerCase().startsWith(baseNameWithoutExt.toLowerCase()) && f.endsWith('.webp'));
      distFileName = found;
    }

    let distMeta = null;
    let distSize = 0;
    if (distFileName) {
      const distPath = path.join(distAstroDir, distFileName);
      if (fs.existsSync(distPath)) {
        const dStat = fs.statSync(distPath);
        distSize = dStat.size;
        distMeta = await sharp(distPath).metadata();
      }
    }

    results.push({
      id: item.id,
      srcFile: item.file,
      srcWidth: srcMeta.width,
      srcHeight: srcMeta.height,
      srcBytes: srcStat.size,
      srcKB: (srcStat.size / 1024).toFixed(1),
      distFile: distFileName || 'NOT FOUND',
      distWidth: distMeta ? distMeta.width : null,
      distHeight: distMeta ? distMeta.height : null,
      distBytes: distSize,
      distKB: (distSize / 1024).toFixed(1),
    });
  }

  console.log(JSON.stringify(results, null, 2));

  // Also calculate total size of dist/ and dist/_astro
  function getDirSize(dir) {
    let total = 0;
    let count = 0;
    let imgTotal = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        const sub = getDirSize(full);
        total += sub.total;
        count += sub.count;
        imgTotal += sub.imgTotal;
      } else {
        const st = fs.statSync(full);
        total += st.size;
        count++;
        if (/\.(webp|jpg|jpeg|png|svg|avif)$/i.test(f.name)) {
          imgTotal += st.size;
        }
      }
    }
    return { total, count, imgTotal };
  }

  const distStats = getDirSize(distDir);
  const astroStats = getDirSize(distAstroDir);

  console.log('\n--- DIRECTORY STATS ---');
  console.log('dist total:', (distStats.total / (1024 * 1024)).toFixed(2), 'MB (', distStats.total, 'bytes,', distStats.count, 'files )');
  console.log('dist/_astro total:', (astroStats.total / (1024 * 1024)).toFixed(2), 'MB (', astroStats.total, 'bytes,', astroStats.count, 'files )');
  console.log('dist/_astro images total:', (astroStats.imgTotal / (1024 * 1024)).toFixed(2), 'MB (', astroStats.imgTotal, 'bytes )');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
