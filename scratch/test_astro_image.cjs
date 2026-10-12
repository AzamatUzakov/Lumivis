const sharp = require('sharp');
const path = require('path');

async function main() {
  const root = 'c:\\Users\\User\\Desktop\\lumivis lending';
  const file = path.join(root, 'src', 'assets', 'lenses', 'lens6.png');

  // Test 1: cover (default in astro if fit not specified)
  const bufCover = await sharp(file)
    .resize(640, 400, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(root, 'scratch', 'test_cover.webp'));

  // Test 2: contain
  const bufContain = await sharp(file)
    .resize(640, 400, { fit: 'contain', background: '#d6d6d6' })
    .webp({ quality: 92 })
    .toFile(path.join(root, 'scratch', 'test_contain.webp'));

  // Test 3: natural resize to height 400 without crop
  const bufNatural = await sharp(file)
    .resize(null, 400)
    .webp({ quality: 92 })
    .toFile(path.join(root, 'scratch', 'test_natural.webp'));

  console.log('Test 1 cover:', bufCover);
  console.log('Test 2 contain:', bufContain);
  console.log('Test 3 natural:', bufNatural);
}

main().catch(console.error);
