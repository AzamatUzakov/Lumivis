import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const videoDir = 'C:\\Users\\User\\Desktop\\lumivis lending\\public\\videos';
const publicDir = 'C:\\Users\\User\\Desktop\\lumivis lending\\public';

// Mini static server
const server = http.createServer((req, res) => {
  const filePath = path.join(publicDir, req.url.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(9876, async () => {
  console.log('Static video server listening on http://localhost:9876');

  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
  const postersDir = path.join(videoDir, 'posters');
  if (!fs.existsSync(postersDir)) fs.mkdirSync(postersDir, { recursive: true });

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fullPath = path.join(videoDir, f);
    const stat = fs.statSync(fullPath);
    const videoUrl = 'http://localhost:9876/videos/' + f;

    const meta = await page.evaluate(async (url) => {
      return new Promise((resolve) => {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.preload = 'auto';
        v.src = url;
        v.onloadedmetadata = () => {
          v.currentTime = 2.0;
        };
        v.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 960;
          canvas.height = Math.round(960 * (v.videoHeight / v.videoWidth));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/webp', 0.80);
          resolve({
            width: v.videoWidth,
            height: v.videoHeight,
            duration: v.duration,
            posterDataUrl: dataUrl
          });
        };
        v.onerror = (e) => resolve({ error: e ? e.message : 'error' });
      });
    }, videoUrl);

    if (meta && meta.posterDataUrl) {
      const base64Data = meta.posterDataUrl.replace(/^data:image\/webp;base64,/, '');
      const posterName = `video-${i + 1}.webp`;
      const posterPath = path.join(postersDir, posterName);
      fs.writeFileSync(posterPath, base64Data, 'base64');
      const posterStat = fs.statSync(posterPath);

      results.push({
        index: i + 1,
        file: f,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
        sizeBytes: stat.size,
        resolution: `${meta.width}x${meta.height}`,
        durationSec: Math.round(meta.duration),
        posterName: `videos/posters/${posterName}`,
        posterKB: (posterStat.size / 1024).toFixed(1) + ' KB'
      });
    } else {
      results.push({ file: f, error: meta ? meta.error : 'unknown' });
    }
  }

  console.log('VIDEO METADATA & POSTER RESULTS:\n', JSON.stringify(results, null, 2));
  fs.writeFileSync('video_metadata_results.json', JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
  process.exit(0);
});
