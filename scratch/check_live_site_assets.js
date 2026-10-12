import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

function fetchUrlInfo(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' } }, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
        cacheControl: res.headers['cache-control'],
        location: res.headers['location']
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

(async () => {
  console.log('Fetching live HTML from https://www.lumivis.uz/ru/...');
  const mainPageInfo = await fetchUrlInfo('https://www.lumivis.uz/ru/');
  console.log('Main page HTTP status:', mainPageInfo.statusCode);

  // Fetch full HTML text
  const htmlText = await new Promise((resolve) => {
    https.get('https://www.lumivis.uz/ru/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });

  const galleryMatch = htmlText.match(/<section[^>]*id="gallery"[\s\S]*?<\/section>/);
  if (!galleryMatch) {
    console.error('Gallery section not found in live HTML!');
    process.exit(1);
  }

  const galleryHtml = galleryMatch[0];
  const imgMatches = Array.from(galleryHtml.matchAll(/<img[^>]*src="([^"]+)"/g));

  console.log(`\nFound ${imgMatches.length} <img> tags in live gallery HTML:\n`);

  const results = [];
  for (let i = 0; i < imgMatches.length; i++) {
    const relSrc = imgMatches[i][1];
    const fullUrl = relSrc.startsWith('http') ? relSrc : `https://www.lumivis.uz${relSrc}`;
    const info = await fetchUrlInfo(fullUrl);

    // Also test www redirect or non-www redirect
    const nonWwwUrl = fullUrl.replace('https://www.lumivis.uz', 'https://lumivis.uz');
    const nonWwwInfo = await fetchUrlInfo(nonWwwUrl);

    // Find matching dist file size
    const filename = path.basename(relSrc);
    let distSize = null;
    const distFiles = fs.readdirSync('dist/_astro');
    const matchedFile = distFiles.find(f => f === filename);
    if (matchedFile) {
      distSize = fs.statSync(path.join('dist/_astro', matchedFile)).size;
    }

    results.push({
      cardIndex: i + 1,
      relSrc,
      filename,
      liveUrl: fullUrl,
      statusCode: info.statusCode,
      contentType: info.contentType,
      contentLength: info.contentLength,
      distSize,
      sizeMatches: info.contentLength ? parseInt(info.contentLength, 10) === distSize : 'unknown',
      cacheControl: info.cacheControl,
      nonWwwRedirectStatus: nonWwwInfo.statusCode,
      nonWwwLocation: nonWwwInfo.location || 'none'
    });
  }

  console.log(JSON.stringify(results, null, 2));
})();
