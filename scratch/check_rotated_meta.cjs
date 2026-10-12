const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const meta = await sharp(path.join(root, 'scratch', 'lens6_ccw.png')).metadata();
  console.log('lens6_ccw.png metadata:', meta);
}

main().catch(console.error);
