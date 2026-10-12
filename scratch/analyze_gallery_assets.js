import fs from 'fs';
import path from 'path';

(async () => {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log('Sharp not installed directly, using basic file inspection and sharp if available');
  }

  // Read dist/ru/index.html to extract the exact HTML image src and attributes for the 11 gallery cards
  const htmlPath = 'dist/ru/index.html';
  if (!fs.existsSync(htmlPath)) {
    console.error('dist/ru/index.html not found! Run npm run build first.');
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  
  // Parse gallery section from HTML
  const galleryMatch = html.match(/<section[^>]*id="gallery"[\s\S]*?<\/section>/);
  if (!galleryMatch) {
    console.error('Gallery section not found in dist/ru/index.html');
    process.exit(1);
  }

  const galleryHtml = galleryMatch[0];
  const itemMatches = Array.from(galleryHtml.matchAll(/<div[^>]*class="[^"]*gallery__item[^"]*"[\s\S]*?<\/div>\s*<\/div>/g));

  console.log(`Found ${itemMatches.length} gallery items in HTML.\n`);

  const cardData = [];

  for (let idx = 0; idx < itemMatches.length; idx++) {
    const itemHtml = itemMatches[idx][0];
    const imgMatch = itemHtml.match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/);
    const ariaMatch = itemHtml.match(/aria-label="([^"]*)"/);

    if (!imgMatch) {
      console.log(`Card ${idx + 1}: No <img> tag found`);
      continue;
    }

    const src = imgMatch[1];
    const alt = imgMatch[2] || ariaMatch?.[1] || '';

    // Relative file path in dist/
    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
    const distFilePath = path.join('dist', cleanSrc);
    
    let stats = null;
    let metadata = null;

    if (fs.existsSync(distFilePath)) {
      stats = fs.statSync(distFilePath);
      if (sharp) {
        try {
          metadata = await sharp(distFilePath).metadata();
        } catch (err) {
          metadata = { error: err.message };
        }
      }
    }

    cardData.push({
      domIndex: idx + 1,
      src,
      distFilePath,
      alt,
      exists: fs.existsSync(distFilePath),
      sizeBytes: stats ? stats.size : 0,
      sizeKb: stats ? (stats.size / 1024).toFixed(2) + ' KB' : '0 KB',
      metadata
    });
  }

  console.log(JSON.stringify(cardData, null, 2));
})();
