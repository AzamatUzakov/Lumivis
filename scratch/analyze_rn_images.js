import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

(async () => {
  const currentAssetPath = 'src/assets/gallery/IMG_0345.JPG';
  const newAssetPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\54606073-7157-4f58-a2a6-36fc5bdd7fb9\\media__1791494545093.jpg';

  console.log('--- CURRENT IMAGE INFO ---');
  const currentStats = fs.statSync(currentAssetPath);
  const currentMeta = await sharp(currentAssetPath).metadata();
  console.log({
    path: currentAssetPath,
    sizeBytes: currentStats.size,
    sizeKb: (currentStats.size / 1024).toFixed(2) + ' KB',
    width: currentMeta.width,
    height: currentMeta.height,
    format: currentMeta.format,
    orientation: currentMeta.orientation || 1,
    aspectRatio: (currentMeta.width / currentMeta.height).toFixed(3)
  });

  // Check dist output for current image
  const distFiles = fs.readdirSync('dist/_astro');
  const distCurrentFile = distFiles.find(f => f.startsWith('IMG_0345'));
  if (distCurrentFile) {
    const distPath = path.join('dist/_astro', distCurrentFile);
    const distStats = fs.statSync(distPath);
    const distMeta = await sharp(distPath).metadata();
    console.log('\nCurrent image in dist/_astro:', {
      filename: distCurrentFile,
      sizeBytes: distStats.size,
      sizeKb: (distStats.size / 1024).toFixed(2) + ' KB',
      width: distMeta.width,
      height: distMeta.height,
      format: distMeta.format
    });
  }

  console.log('\n--- NEW IMAGE INFO ---');
  const newStats = fs.statSync(newAssetPath);
  const newMeta = await sharp(newAssetPath).metadata();
  console.log({
    path: newAssetPath,
    sizeBytes: newStats.size,
    sizeKb: (newStats.size / 1024).toFixed(2) + ' KB',
    width: newMeta.width,
    height: newMeta.height,
    format: newMeta.format,
    orientation: newMeta.orientation || 1,
    hasExif: !!newMeta.exif,
    aspectRatio: (newMeta.width / newMeta.height).toFixed(3)
  });
})();
