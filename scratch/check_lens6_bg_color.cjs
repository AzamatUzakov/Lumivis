const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const file = path.join(root, 'src', 'assets', 'lenses', 'lens6-horizontal.png');
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });

  const samplePixel = (x, y) => {
    const idx = (y * info.width + x) * info.channels;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      hex: '#' + [data[idx], data[idx + 1], data[idx + 2]].map(v => v.toString(16).padStart(2, '0')).join('')
    };
  };

  console.log('Top-left (10, 10):', samplePixel(10, 10));
  console.log('Top-center (724, 10):', samplePixel(724, 10));
  console.log('Top-right (1430, 10):', samplePixel(1430, 10));
  console.log('Bottom-left (10, 1070):', samplePixel(10, 1070));
  console.log('Bottom-center (724, 1070):', samplePixel(724, 1070));
  console.log('Bottom-right (1430, 1070):', samplePixel(1430, 1070));
  console.log('Left-middle (10, 543):', samplePixel(10, 543));
  console.log('Right-middle (1430, 543):', samplePixel(1430, 543));
}

main().catch(console.error);
