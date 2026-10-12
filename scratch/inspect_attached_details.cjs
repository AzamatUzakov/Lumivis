const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const dir = 'C:/Users/User/.gemini/antigravity-ide/brain/532ab678-7d37-41d1-99a8-9c252b82fed5';
  
  // Photo 1: media__1791743875287.png (black lens)
  // Let's crop around the lens text
  // The lens is in the center
  await sharp(path.join(dir, 'media__1791743875287.png'))
    .extract({ left: 250, top: 350, width: 280, height: 300 })
    .toFile('scratch/photo1_crop.png');

  // Photo 2: media__1791743875342.jpg (case with 3 lenses)
  // Let's crop around the text / logo and lenses
  await sharp(path.join(dir, 'media__1791743875342.jpg'))
    .extract({ left: 150, top: 250, width: 450, height: 550 })
    .toFile('scratch/photo2_crop.png');

  // Photo 3: media__1791743875360.jpg (large lens case)
  await sharp(path.join(dir, 'media__1791743875360.jpg'))
    .extract({ left: 200, top: 550, width: 400, height: 350 })
    .toFile('scratch/photo3_crop.png');

  console.log('Crops generated!');
}

main().catch(console.error);
