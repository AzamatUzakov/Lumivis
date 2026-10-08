import fs from 'fs';
import path from 'path';

// Use sharp or canvas or simple copy if sharp needs pkg config
async function convert() {
  const beforeInput = 'C:/Users/User/Downloads/Клинический крупный план уставших глаз пожилого мужчины.png';
  const afterInput = 'C:/Users/User/Downloads/Портрет уставшего взгляда пожилого мужчины.png';
  
  const beforeOutput = path.resolve('src/assets/prosthetics/case7_before.jpg');
  const afterOutput = path.resolve('src/assets/prosthetics/case7_after.jpg');

  // Dynamically import sharp
  const { default: sharp } = await import('sharp');
  await sharp(beforeInput).resize({ width: 600 }).jpeg({ quality: 85 }).toFile(beforeOutput);
  await sharp(afterInput).resize({ width: 600 }).jpeg({ quality: 85 }).toFile(afterOutput);

  console.log('Successfully created case7_before.jpg and case7_after.jpg!');
}

convert().catch(console.error);
