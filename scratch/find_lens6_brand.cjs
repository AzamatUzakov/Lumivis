const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const file = path.join(root, 'src', 'assets', 'lenses', 'lens6.png');
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });

  // search for white pixels (R>240, G>240, B>240) in x: 200..300, y: 500..800
  let pts = [];
  for (let y = 500; y < 800; y++) {
    for (let x = 200; x < 300; x++) {
      const idx = (y * info.width + x) * info.channels;
      if (data[idx] > 230 && data[idx+1] > 230 && data[idx+2] > 230) {
        pts.push({ x, y });
      }
    }
  }
  
  if (pts.length > 0) {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    console.log(`Brand text bounds: x=${minX}..${maxX}, y=${minY}..${maxY}`);
    
    await sharp(file)
      .extract({ left: minX - 5, top: minY - 5, width: (maxX - minX) + 10, height: (maxY - minY) + 10 })
      .rotate(270)
      .toFile(path.join(root, 'scratch', 'lens_crops', 'lens6_brand_exact.png'));
  } else {
    console.log('No white text found in region');
  }
}

main().catch(console.error);
