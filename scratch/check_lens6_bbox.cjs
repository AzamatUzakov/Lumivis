const sharp = require('sharp');
const path = require('path');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const file6 = path.join(root, 'src', 'assets', 'lenses', 'lens6.png');
  
  const { data, info } = await sharp(file6)
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  // Find bounding box where pixel differs from background (#e3e4e6 or similar grey)
  // Let's inspect corner pixels:
  console.log(`Top-left pixel: R=${data[0]}, G=${data[1]}, B=${data[2]}`);
  
  const bgR = data[0], bgG = data[1], bgB = data[2];
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const diff = Math.abs(data[idx] - bgR) + Math.abs(data[idx+1] - bgG) + Math.abs(data[idx+2] - bgB);
      if (diff > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  console.log(`Content bounding box in lens6.png (${info.width}x${info.height}):`);
  console.log(`minX=${minX}, maxX=${maxX}, width=${maxX - minX}`);
  console.log(`minY=${minY}, maxY=${maxY}, height=${maxY - minY}`);
  console.log(`Content aspect ratio: ${((maxX - minX) / (maxY - minY)).toFixed(3)}`);
}

main().catch(console.error);
